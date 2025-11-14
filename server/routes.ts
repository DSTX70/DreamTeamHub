import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, desc } from "drizzle-orm";
import { workItemPacks } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireScopes } from "./security/scopes_and_csp";
import { searchRoute } from "./api_search_route";
import { getOpsEvents, postOpsEvent } from "./api/ops_events.route";
import { get24hMetrics, getAlertStatus, getEventTimeline } from "./api/ops_metrics.route";
import { opsSummaryHandler } from "./api/ops_summary.route";
import { publishFile, getPublishedFiles, searchKnowledge, uploadDraft, indexFile, ragSearch, getIndexStatus } from "./api/knowledge.route";
import { listWorkOrders, createWorkOrder, startWorkOrderRun } from "./api/work_orders.route";
import { promoteAgent } from "./api/agents_promote.route";
import { createBrand, createProduct } from "./api/onboarding.route";
import { getRoleCoverage, getAgentsByRole } from "./api/coverage.route";
import { listPlaybooks, createOrUpdatePlaybook, getPlaybookByHandle } from "./api/playbooks.route";
import { router as woPlaybookPreviewRouter } from "./api/wo_playbook_preview.route";
import { router as coverageReportRouter } from "./api/coverage_report.route";
import { router as opsAlertHooksRouter } from "./api/ops_alert_hooks.route";
import { router as llmInferRouter } from "./api/llm_infer.route";
import { router as evidencePacksRouter } from "./api/evidence_packs.route";
import { router as coverageTrendsRouter } from "./api/coverage_trends.route";
import { seoAltTextRouter } from "./routes/seo_alt_text";
import { seoMetaRouter, seoMetaPublicRouter } from "./routes/seo_meta";
import { fccSkuMapRouter } from "./routes/fcc_sku_map";
import { getFccSkuMapByKey } from "./lib/fccSkuMap";
// Pack generation handlers now use the registry pattern
import { PACK_REGISTRY } from "./ai/packRegistry";
import { createPackActionHandler } from "./ai/packFactory";
import multer from "multer";
import { uploadFileToS3, getWorkItemFiles, getUploaderConfig } from "./services/uploader";
import { getEffectiveUploadsConfig, updateUploadsConfig } from "./services/opsUploadsConfig";
import { 
  insertPodSchema, insertPodAgentSchema, insertAgentSchema, insertPersonSchema, insertRoleCardSchema, insertRoleRaciSchema, insertAgentSpecSchema,
  insertWorkItemSchema, insertDecisionSchema, insertIdeaSparkSchema, insertBrainstormSessionSchema,
  insertBrainstormParticipantSchema, insertBrainstormIdeaSchema, insertBrainstormClusterSchema,
  insertAuditSchema, insertAuditCheckSchema, insertAuditFindingSchema,
  insertConversationSchema, insertMessageSchema, insertAgentMemorySchema,
  insertProjectSchema, insertProjectFileSchema, insertProjectAgentSchema, insertProjectTaskSchema, insertProjectMessageSchema,
} from "@shared/schema";
import { generatePersonaResponse } from "./openai-service";
import { buildAgentContext, recordAgentRun, recordFeedback } from "./agent-context";
import { postSummon, postMirrorBack } from "./comms-service";
import type { SummonPayload, MirrorBackPayload } from "./comms-service";
import { metricsMiddleware } from "./metrics/prom";
import { requireAdmin, requireOpsRole } from "./middleware/rbac";
import { rateLimit } from "./middleware/rateLimit";
import { stagingAuth, stagingBanner } from "./middleware/staging_auth";

// ===========================
// DUAL AUTHENTICATION MIDDLEWARE
// ===========================

// API Token authentication (for CI/CD and external integrations)
const isApiTokenAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Bearer <token>' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const validToken = process.env.DTH_API_TOKEN;
  
  if (!validToken) {
    console.error('DTH_API_TOKEN not configured in environment');
    return res.status(500).json({ error: 'API token authentication not configured' });
  }
  
  if (token !== validToken) {
    return res.status(401).json({ error: 'Invalid API token' });
  }
  
  next();
};

// Dual auth: supports both API token and session authentication
const isDualAuthenticated: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check for API token authentication first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Validate token directly inline
    const token = authHeader.substring(7);
    const validToken = process.env.DTH_API_TOKEN;
    
    if (validToken && token === validToken) {
      return next(); // Token is valid, proceed
    }
    // Invalid token, fall through to session auth
  }
  
  // Fall back to session authentication
  return isAuthenticated(req, res, next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ===========================
  // STATIC FILES
  // ===========================
  
  // Serve demo.html as a static file
  app.get('/demo.html', (_req, res) => {
    res.sendFile('demo.html', { root: './public' });
  });

  // ===========================
  // AUTHENTICATION (Replit Auth)
  // ===========================
  
  await setupAuth(app);

  // ===========================
  // STAGING ENVIRONMENT PROTECTION
  // ===========================
  
  // Basic auth for staging environment (activates when NODE_ENV=staging)
  app.use(stagingAuth);
  
  // Optional: Add staging banner to HTML responses
  app.use(stagingBanner);

  // ===========================
  // METRICS MIDDLEWARE (Prometheus)
  // ===========================
  
  app.use(metricsMiddleware("api"));

  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===========================
  // UNIVERSAL SEARCH
  // ===========================
  
  app.get("/api/search", isAuthenticated, searchRoute);

  // ===========================
  // OPERATIONS EVENTS
  // ===========================
  
  app.get("/api/ops/events", isAuthenticated, getOpsEvents);
  app.post("/api/ops/events", isAuthenticated, postOpsEvent);
  
  // ===========================
  // OPERATIONS METRICS & ALERTS
  // ===========================
  
  app.get("/api/ops/metrics/24h", isAuthenticated, get24hMetrics);
  app.get("/api/ops/alerts", isAuthenticated, getAlertStatus);
  app.get("/api/ops/timeline", isAuthenticated, getEventTimeline);
  app.get("/api/ops/summary", isAuthenticated, opsSummaryHandler);
  
  // ===========================
  // KNOWLEDGE / PUBLISHING & DRIVE GATEWAY
  // ===========================
  
  app.get("/api/knowledge/:owner/:id/search", isDualAuthenticated, searchKnowledge);
  app.post("/api/knowledge/:owner/:id/drafts", isDualAuthenticated, requireScopes("knowledge:draft:write"), uploadDraft);
  app.post("/api/knowledge/:owner/:id/publish/:fileId", isDualAuthenticated, requireScopes("knowledge:draft:write"), publishFile);
  app.post("/api/knowledge/publish", isDualAuthenticated, requireScopes("knowledge:draft:write"), publishFile); // Legacy endpoint
  app.get("/api/knowledge/published", isDualAuthenticated, getPublishedFiles);
  
  // Knowledge Indexer Endpoints
  app.post("/api/knowledge/index-file", isDualAuthenticated, requireScopes("knowledge:draft:write"), indexFile);
  app.get("/api/knowledge/search", isDualAuthenticated, ragSearch);
  app.get("/api/knowledge/index-status", isDualAuthenticated, getIndexStatus);
  
  // ===========================
  // WORK ORDERS (DB-backed with caps)
  // ===========================
  
  app.get("/api/work-orders", isAuthenticated, listWorkOrders);
  app.post("/api/work-orders", isAuthenticated, createWorkOrder);
  app.post("/api/work-orders/:woId/start", isAuthenticated, startWorkOrderRun);

  // ===========================
  // PHASE-2 FEATURES: ONBOARDING, COVERAGE, PLAYBOOKS
  // ===========================
  
  // Onboarding wizard (Brand/Product + Drive links)
  app.post("/api/onboarding/brand", isAuthenticated, createBrand);
  app.post("/api/onboarding/product", isAuthenticated, createProduct);
  
  // Coverage views (Agent↔Role linkage, unstaffed/over-replicated)
  app.get("/api/coverage/roles", isAuthenticated, getRoleCoverage);
  app.get("/api/coverage/agents", isAuthenticated, getAgentsByRole);
  
  // Playbooks registry (ID-based; Work Orders reference by handle)
  app.get("/api/playbooks", isAuthenticated, listPlaybooks);
  app.post("/api/playbooks", isAuthenticated, createOrUpdatePlaybook);
  app.get("/api/playbooks/:handle", isAuthenticated, getPlaybookByHandle);

  // ===========================
  // PUBLIC ROUTES (no auth required)
  // ===========================
  
  // Metrics - Prometheus metrics endpoint (public for monitoring)
  const metricsRoute = await import("./routes/metrics.route");
  app.use("/metrics", metricsRoute.default);
  
  // Health Check - DB/S3/SMTP probes (public for monitoring)
  const healthzRoute = await import("./routes/healthz.route");
  app.use("/api/healthz", healthzRoute.default);

  // Admin Deploy - Deployment tracking (requires RBAC API key + rate limit)
  const adminDeployRoute = await import("./routes/admin_deploy.route");
  app.use("/api/admin/deploy/mark", requireAdmin, rateLimit(30), adminDeployRoute.default);
  app.use("/api/admin/deploy", requireAdmin, adminDeployRoute.default);
  
  // Ops Deploy - Read-only deployment info (session-authenticated)
  const opsDeployLastRoute = await import("./routes/ops_deploy_last.route");
  app.use("/api/ops/deploy", isAuthenticated, opsDeployLastRoute.default);

  // LLM Routes - Must be mounted BEFORE isDualAuthenticated block
  // LLM Augment - Public endpoint for prompt augmentation
  const llmAugmentRoute = await import("./routes/llm_augment.route");
  app.use("/api/llm/augment", llmAugmentRoute.default);
  
  // LLM Presets - DB-backed CRUD for LLM presets (requires RBAC API key)
  const llmPresetsDbRoute = await import("./routes/llm_presets_db.route");
  app.use("/api/llm/presets-db", requireAdmin, llmPresetsDbRoute.default);
  
  // Ops Logs - Session-authenticated read endpoints (more specific routes first)
  const opsLogsRecentRoute = await import("./routes/ops_logs_recent.route");
  app.use("/api/ops/logs/recent", isAuthenticated, opsLogsRecentRoute.default); // /recent (session-auth, read-only)
  
  // Ops Logs - Admin endpoints (RBAC protected)
  const opsLogsRedisRoute = await import("./routes/ops_logs_redis.route");
  const opsLogsSinceRoute = await import("./routes/ops_logs_since.route");
  app.use("/api/ops/logs/emit", requireAdmin, rateLimit(30)); // Rate limit emit endpoint
  app.use("/api/ops/logs", requireAdmin, opsLogsRedisRoute.default); // /stream, /emit
  app.use("/api/ops/logs/rest", requireAdmin, opsLogsSinceRoute.default);

  // ===========================
  // FEATURE BUNDLE: NEW ROUTES
  // ===========================
  
  // Public SEO endpoints (no auth required for landing page) - MUST BE FIRST
  app.use("/api", seoMetaPublicRouter);
  
  // FCC Home Hero - Public endpoint for homepage lifestyle image mapping
  app.get("/api/fcc/home-hero", async (req, res) => {
    try {
      const map = await getFccSkuMapByKey();
      const row = map["home.lifestyle_ol1"];

      if (!row || !row.base_key) {
        return res.status(404).json({
          ok: false,
          baseKey: null,
          shotKey: "home.lifestyle_ol1",
          label: row?.label ?? null,
        });
      }

      return res.json({
        ok: true,
        baseKey: row.base_key,
        shotKey: row.shot_key,
        label: row.label,
      });
    } catch (err) {
      console.error("Error in /api/fcc/home-hero", err);
      return res.status(500).json({
        ok: false,
        error: "internal_error",
      });
    }
  });
  
  // Mount new feature routes (WO Playbook Preview, Coverage Report, Ops Alerts, LLM Infer, Evidence Packs)
  // Using isDualAuthenticated to support both API token and session authentication
  // Mount at /api to prevent matching non-API routes
  app.use("/api", isDualAuthenticated, woPlaybookPreviewRouter);
  app.use("/api", isDualAuthenticated, coverageReportRouter);
  app.use("/api", isDualAuthenticated, opsAlertHooksRouter);
  app.use("/api", isDualAuthenticated, llmInferRouter);
  app.use("/api/evidence-packs", isDualAuthenticated, evidencePacksRouter);
  app.use("/api", isDualAuthenticated, coverageTrendsRouter);
  app.use("/api", isDualAuthenticated, seoAltTextRouter);
  app.use("/api", isDualAuthenticated, seoMetaRouter);
  app.use("/api", isAuthenticated, fccSkuMapRouter);

  // ===========================
  // CONTROL TOWER
  // ===========================
  
  app.get("/api/control/dashboard", isAuthenticated, async (req, res) => {
    try {
      const workItems = await storage.getWorkItems();
      
      // Top 5 priorities (high priority, not done, sorted by due date)
      const top5 = workItems
        .filter(item => item.status !== 'done' && (item.priority === 'high' || item.priority === 'critical'))
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        })
        .slice(0, 5);
      
      // Recent assignments (recent work items, not done)
      const assignments = workItems
        .filter(item => item.status !== 'done')
        .slice(0, 5);
      
      // Escalations (blocked or critical priority)
      const escalations = workItems
        .filter(item => item.status === 'blocked' || item.priority === 'critical');
      
      // Stats
      const stats = {
        totalWorkItems: workItems.length,
        inProgress: workItems.filter(item => item.status === 'in_progress').length,
        blocked: workItems.filter(item => item.status === 'blocked').length,
        dueThisWeek: workItems.filter(item => {
          if (!item.dueDate) return false;
          const due = new Date(item.dueDate);
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return due >= now && due <= weekFromNow;
        }).length,
      };
      
      res.json({ top5, assignments, escalations, stats });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // ===========================
  // PODS
  // ===========================
  
  app.get("/api/pods", isAuthenticated, async (req, res) => {
    try {
      const pods = await storage.getPods();
      res.setHeader('X-Total-Count', pods.length.toString());
      res.json(pods);
    } catch (error) {
      console.error('Error fetching pods:', error);
      res.status(500).json({ error: 'Failed to fetch pods' });
    }
  });

  app.get("/api/pods/:id", isAuthenticated, async (req, res) => {
    try {
      const pod = await storage.getPod(parseInt(req.params.id));
      if (!pod) {
        return res.status(404).json({ error: 'Pod not found' });
      }
      res.json(pod);
    } catch (error) {
      console.error('Error fetching pod:', error);
      res.status(500).json({ error: 'Failed to fetch pod' });
    }
  });

  app.post("/api/pods", isAuthenticated, async (req, res) => {
    try {
      const data = insertPodSchema.parse(req.body);
      const pod = await storage.createPod(data);
      res.status(201).json(pod);
    } catch (error: any) {
      console.error('Error creating pod:', error);
      res.status(400).json({ error: error.message || 'Failed to create pod' });
    }
  });

  app.put("/api/pods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPodSchema.parse(req.body);
      const pod = await storage.updatePod(id, data);
      if (!pod) {
        return res.status(404).json({ error: 'Pod not found' });
      }
      res.json(pod);
    } catch (error: any) {
      console.error('Error updating pod:', error);
      res.status(400).json({ error: error.message || 'Failed to update pod' });
    }
  });

  app.delete("/api/pods/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePod(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting pod:', error);
      res.status(500).json({ error: error.message || 'Failed to delete pod' });
    }
  });

  // Manifest Importer - Bulk import pods from manifest file
  app.post("/api/import/new-pods", isAuthenticated, async (req, res) => {
    try {
      const { pods: manifestPods } = req.body;
      
      if (!Array.isArray(manifestPods)) {
        return res.status(400).json({ 
          error: 'Invalid manifest format. Expected { pods: [...] }' 
        });
      }

      const results = {
        total: manifestPods.length,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Fetch existing pods once (O(1) instead of O(n))
      const existingPods = await storage.getPods();
      const existingPodsByName = new Map(existingPods.map(p => [p.name, p]));

      // Process all pods (with error isolation per pod)
      for (const podData of manifestPods) {
        try {
          // Validate the pod data against schema
          const validatedData = insertPodSchema.parse(podData) as any;
          
          // Check if pod already exists by name (O(1) lookup)
          const existingPod = existingPodsByName.get(validatedData.name);

          if (existingPod) {
            // Update existing pod
            const updated = await storage.updatePod(existingPod.id, validatedData);
            if (updated) {
              existingPodsByName.set(validatedData.name, updated);
            }
            results.updated++;
          } else {
            // Create new pod
            const created = await storage.createPod(validatedData);
            existingPodsByName.set(validatedData.name, created);
            results.created++;
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Pod "${(podData as any)?.name || 'unknown'}": ${error.message}`);
        }
      }

      res.status(200).json({
        success: true,
        message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
        results
      });
    } catch (error: any) {
      console.error('Error importing pods:', error);
      res.status(500).json({ 
        error: 'Failed to import pods',
        details: error.message 
      });
    }
  });

  // ===========================
  // AGENT GOLDENS (Nightly Snapshots)
  // ===========================

  // Get recent golden snapshots
  app.get("/api/agent-goldens", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const goldens = await storage.getAgentGoldens(limit);
      res.json(goldens);
    } catch (error) {
      console.error('Error fetching agent goldens:', error);
      res.status(500).json({ error: 'Failed to fetch agent goldens' });
    }
  });

  // Get specific golden snapshot
  app.get("/api/agent-goldens/:id", isAuthenticated, async (req, res) => {
    try {
      const golden = await storage.getAgentGolden(parseInt(req.params.id));
      if (!golden) {
        return res.status(404).json({ error: 'Golden snapshot not found' });
      }
      res.json(golden);
    } catch (error) {
      console.error('Error fetching agent golden:', error);
      res.status(500).json({ error: 'Failed to fetch agent golden' });
    }
  });

  // Manually trigger golden snapshot creation
  app.post("/api/agent-goldens/snapshot", isAuthenticated, async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Fetch all agents and specs
      const agents = await storage.getAgents({});
      const agentSpecs = await storage.getAgentSpecs();

      // Calculate payload size (rough estimate in MB)
      const payloadSize = JSON.stringify({ agents, agentSpecs }).length / (1024 * 1024);
      const MAX_SIZE_MB = 50; // PostgreSQL JSONB safe limit

      if (payloadSize > MAX_SIZE_MB) {
        return res.status(413).json({
          error: 'Snapshot payload too large',
          details: `Payload size ${payloadSize.toFixed(2)} MB exceeds limit of ${MAX_SIZE_MB} MB`,
          payloadSizeMB: parseFloat(payloadSize.toFixed(2))
        });
      }

      // Create snapshot
      const golden = await storage.createAgentGolden({
        snapshotDate: new Date(),
        agentCount: agents.length,
        agentData: agents,
        agentSpecsData: agentSpecs,
        metadata: {
          triggeredBy: 'manual',
          duration: Date.now() - startTime,
          checksum: `${agents.length}-${agentSpecs.length}-${Date.now()}`,
          payloadSizeMB: parseFloat(payloadSize.toFixed(2))
        }
      });

      res.status(201).json({
        success: true,
        message: `Created snapshot of ${agents.length} agents and ${agentSpecs.length} specs`,
        golden
      });
    } catch (error: any) {
      console.error('Error creating agent golden:', error);
      res.status(500).json({ 
        error: 'Failed to create agent golden',
        details: error.message 
      });
    }
  });

  // ===========================
  // POD AGENTS
  // ===========================
  
  app.get("/api/pod-agents", isAuthenticated, async (req, res) => {
    try {
      const podId = req.query.podId ? parseInt(req.query.podId as string) : undefined;
      const agents = await storage.getPodAgents(podId);
      res.setHeader('X-Total-Count', agents.length.toString());
      res.json(agents);
    } catch (error) {
      console.error('Error fetching pod agents:', error);
      res.status(500).json({ error: 'Failed to fetch pod agents' });
    }
  });

  app.post("/api/pod-agents", isAuthenticated, async (req, res) => {
    try {
      const data = insertPodAgentSchema.parse(req.body);
      const agent = await storage.createPodAgent(data);
      res.status(201).json(agent);
    } catch (error: any) {
      console.error('Error creating pod agent:', error);
      res.status(400).json({ error: error.message || 'Failed to create pod agent' });
    }
  });

  // ===========================
  // UNIFIED AGENTS (Dream Team + Pod Roles with Skill Packs)
  // ===========================

  app.get("/api/agents", isAuthenticated, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.podId) filters.podId = parseInt(req.query.podId as string);
      if (req.query.pillar) filters.pillar = req.query.pillar as string;
      if (req.query.status) filters.status = req.query.status as string;
      
      const agents = await storage.getAgents(filters);
      res.json(agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  app.get("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error) {
      console.error('Error fetching agent:', error);
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  });

  app.post("/api/agents", isAuthenticated, async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.status(201).json(agent);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res.status(400).json({ error: error.message || 'Failed to create agent' });
    }
  });

  app.put("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.updateAgent(req.params.id, data);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error updating agent:', error);
      res.status(400).json({ error: error.message || 'Failed to update agent' });
    }
  });

  app.delete("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAgent(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      res.status(500).json({ error: error.message || 'Failed to delete agent' });
    }
  });

  // Get evidence packs for a specific agent
  app.get("/api/agents/:agentId/evidence-packs", isDualAuthenticated, async (req, res) => {
    try {
      const { agentId } = req.params;
      const { status } = req.query;
      
      const filters: { agentId: string; status?: string } = { agentId };
      if (status && typeof status === 'string') filters.status = status;
      
      const packs = await storage.getEvidencePacks(filters);
      
      res.json(packs);
    } catch (error: any) {
      console.error("Error fetching agent evidence packs:", error);
      res.status(500).json({
        error: "Failed to fetch agent evidence packs",
        message: error.message || "Unknown error"
      });
    }
  });

  // Agent Lab Academy summary endpoint (with dual authentication and filtering)
  app.get("/api/agents/summary", isDualAuthenticated, async (req, res) => {
    try {
      // Parse pagination parameters
      const limit = Math.max(1, Math.min(200, parseInt(req.query.limit as string, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);
      
      // Parse filter parameters
      const { bu, level, status, q } = req.query;
      
      const agents = await storage.getAgents({});
      
      // Transform agents to Academy dashboard format with deterministic KPI data
      let summary = agents.map(agent => {
        const autonomy_level = agent.autonomyLevel || 'L0';
        
        // Deterministic task success from lastEvalScore (0-100%), clamped to 0-1 range
        const task_success = agent.lastEvalScore 
          ? Math.min(1.0, Math.max(0.0, agent.lastEvalScore / 100))
          : 0.80; // Default to 80% for agents without eval data
        
        // Deterministic KPIs based on autonomy level (no random jitter)
        const latencyMap: Record<string, number> = { 'L3': 3.2, 'L2': 4.1, 'L1': 4.6, 'L0': 4.9 };
        const costMap: Record<string, number> = { 'L3': 0.047, 'L2': 0.040, 'L1': 0.033, 'L0': 0.025 };
        
        // Map status to Academy expected values
        let mappedStatus: string;
        if (agent.status === 'active') mappedStatus = 'live';
        else if (agent.status === 'inactive') mappedStatus = 'pilot';
        else mappedStatus = agent.status; // watch, etc.
        
        // Calculate next gate (L3 has no next gate)
        const currentLevel = parseInt(autonomy_level.slice(1));
        const next_gate = currentLevel >= 3 ? null : (currentLevel + 1);
        
        // Promotion progress from lastEvalScore, clamped to 0-100
        // If no eval data, default based on autonomy level progression
        const progressDefaults: Record<string, number> = { 'L0': 25, 'L1': 50, 'L2': 75, 'L3': 100 };
        const promotion_progress_pct = agent.lastEvalScore 
          ? Math.min(100, Math.max(0, agent.lastEvalScore))
          : progressDefaults[autonomy_level] || 25;
        
        // Business unit from podName (default to General if not assigned)
        const business_unit = agent.podName || 'General';
        
        // Links to PR and evidence (use threadId or skillPackPath as proxy)
        const links = {
          pr: agent.skillPackPath 
            ? `https://github.com/example/dream-team/pull/${Math.abs(agent.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100 + 1}`
            : undefined,
          promotion_request: agent.autonomyLevel && parseInt(agent.autonomyLevel.slice(1)) < 3
            ? `/Agent-Lab/40_Playbooks/promotion_request_template.md`
            : undefined,
          evidence_pack: agent.skillPackPath 
            ? `/Agent-Lab/30_EvidencePacks/exp_${new Date().toISOString().split('T')[0]}_${agent.id}/`
            : undefined
        };
        
        return {
          name: agent.id, // agent.id IS the handle (e.g., "agent_os", "agent_helm")
          display_name: agent.title,
          autonomy_level,
          status: mappedStatus,
          next_gate,
          promotion_progress_pct,
          business_unit,
          kpis: {
            task_success,
            latency_p95_s: latencyMap[autonomy_level] || 4.9,
            cost_per_task_usd: costMap[autonomy_level] || 0.025
          },
          links
        };
      });
      
      // Apply filters
      if (bu) {
        summary = summary.filter(a => 
          a.business_unit?.toLowerCase() === String(bu).toLowerCase()
        );
      }
      if (level) {
        summary = summary.filter(a => a.autonomy_level === level);
      }
      if (status) {
        summary = summary.filter(a => a.status === status);
      }
      if (q) {
        const query = String(q).toLowerCase();
        summary = summary.filter(a => 
          a.display_name?.toLowerCase().includes(query) || 
          a.name.toLowerCase().includes(query)
        );
      }
      
      // Get total count before pagination
      const total = summary.length;
      
      // Apply pagination
      const paginated = summary.slice(offset, offset + limit);
      
      // Set X-Total-Count header for pagination
      res.set('X-Total-Count', String(total));
      res.json(paginated);
    } catch (error: any) {
      console.error('Error fetching agents summary:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agents summary' });
    }
  });

  // ===========================
  // PERSONS
  // ===========================
  
  app.get("/api/persons", isAuthenticated, async (req, res) => {
    try {
      const persons = await storage.getPersons();
      res.json(persons);
    } catch (error) {
      console.error('Error fetching persons:', error);
      res.status(500).json({ error: 'Failed to fetch persons' });
    }
  });

  app.get("/api/persons/:id", isAuthenticated, async (req, res) => {
    try {
      const person = await storage.getPerson(parseInt(req.params.id));
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      res.json(person);
    } catch (error) {
      console.error('Error fetching person:', error);
      res.status(500).json({ error: 'Failed to fetch person' });
    }
  });

  app.post("/api/persons", isAuthenticated, async (req, res) => {
    try {
      const data = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(data);
      res.status(201).json(person);
    } catch (error: any) {
      console.error('Error creating person:', error);
      res.status(400).json({ error: error.message || 'Failed to create person' });
    }
  });

  // ===========================
  // ROLE CARDS
  // ===========================
  
  app.get("/api/roles", isDualAuthenticated, async (req, res) => {
    try {
      const { pod, handle, category } = req.query;
      const filters: any = {};
      if (pod) filters.pod = pod as string;
      if (handle) filters.handle = handle as string;
      
      const roles = await storage.getRoleCards(filters);
      
      // Filter by category if specified (in-memory filter since getRoleCards doesn't support it)
      let filteredRoles = roles;
      if (category) {
        filteredRoles = roles.filter(role => role.category === category);
      }
      
      res.json(filteredRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.get("/api/roles/:id", isAuthenticated, async (req, res) => {
    try {
      const role = await storage.getRoleCard(parseInt(req.params.id));
      if (!role) {
        return res.status(404).json({ error: 'Role card not found' });
      }
      res.json(role);
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  });

  app.post("/api/roles", isDualAuthenticated, async (req, res) => {
    try {
      const data = insertRoleCardSchema.parse(req.body);
      const role = await storage.createRoleCard(data);
      res.status(201).json(role);
    } catch (error: any) {
      console.error('Error creating role:', error);
      res.status(400).json({ error: error.message || 'Failed to create role' });
    }
  });

  app.post("/api/roles/import", isAuthenticated, async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Request body must be an array of role cards' });
      }
      
      const roles = req.body.map(item => insertRoleCardSchema.parse(item));
      const created = await storage.bulkCreateRoleCards(roles);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error importing roles:', error);
      res.status(400).json({ error: error.message || 'Failed to import roles' });
    }
  });

  app.put("/api/roles/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoleCardSchema.partial().parse(req.body);
      const role = await storage.updateRoleCard(parseInt(req.params.id), data);
      if (!role) {
        return res.status(404).json({ error: 'Role card not found' });
      }
      res.json(role);
    } catch (error: any) {
      console.error('Error updating role:', error);
      res.status(400).json({ error: error.message || 'Failed to update role' });
    }
  });

  app.delete("/api/roles/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteRoleCard(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Role card not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Failed to delete role' });
    }
  });

  // ===========================
  // ROLE CARDS - HANDLE-BASED ENDPOINTS (for external importers)
  // ===========================
  
  // GET role by handle (supports both API token and session auth)
  app.get("/api/roles/by-handle/:handle", isDualAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoleCards({ handle: req.params.handle });
      if (!roles || roles.length === 0) {
        return res.status(404).json({ error: 'Role card not found' });
      }
      res.json(roles[0]);
    } catch (error) {
      console.error('Error fetching role by handle:', error);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  });

  // PUT role by handle (supports both API token and session auth)
  app.put("/api/roles/by-handle/:handle", isDualAuthenticated, async (req, res) => {
    try {
      // Find existing role by handle
      const existing = await storage.getRoleCards({ handle: req.params.handle });
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Role card not found' });
      }
      
      const data = insertRoleCardSchema.partial().parse(req.body);
      const role = await storage.updateRoleCard(existing[0].id, data);
      res.json(role);
    } catch (error: any) {
      console.error('Error updating role by handle:', error);
      res.status(400).json({ error: error.message || 'Failed to update role' });
    }
  });

  // ===========================
  // ROLE RACI
  // ===========================
  
  app.get("/api/roles/raci", isAuthenticated, async (req, res) => {
    try {
      const { workstream, roleHandle } = req.query;
      const filters: any = {};
      if (workstream) filters.workstream = workstream as string;
      if (roleHandle) filters.roleHandle = roleHandle as string;
      
      const racis = await storage.getRoleRacis(filters);
      res.json(racis);
    } catch (error) {
      console.error('Error fetching RACIs:', error);
      res.status(500).json({ error: 'Failed to fetch RACIs' });
    }
  });

  app.post("/api/roles/raci", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoleRaciSchema.parse(req.body);
      const raci = await storage.createRoleRaci(data);
      res.status(201).json(raci);
    } catch (error: any) {
      console.error('Error creating RACI:', error);
      res.status(400).json({ error: error.message || 'Failed to create RACI' });
    }
  });

  // ===========================
  // AGENT SPECS
  // ===========================

  app.get("/api/agent-specs", isAuthenticated, async (req, res) => {
    try {
      const specs = await storage.getAgentSpecs();
      res.json(specs);
    } catch (error) {
      console.error('Error fetching agent specs:', error);
      res.status(500).json({ error: 'Failed to fetch agent specs' });
    }
  });

  app.get("/api/agent-specs/:handle", isAuthenticated, async (req, res) => {
    try {
      const spec = await storage.getAgentSpec(req.params.handle);
      if (!spec) {
        return res.status(404).json({ error: 'Agent spec not found' });
      }
      res.json(spec);
    } catch (error) {
      console.error('Error fetching agent spec:', error);
      res.status(500).json({ error: 'Failed to fetch agent spec' });
    }
  });

  app.post("/api/agent-specs", isAuthenticated, async (req, res) => {
    try {
      const data = insertAgentSpecSchema.parse(req.body);
      const spec = await storage.upsertAgentSpec(data);
      res.status(201).json(spec);
    } catch (error: any) {
      console.error('Error upserting agent spec:', error);
      res.status(400).json({ error: error.message || 'Failed to upsert agent spec' });
    }
  });

  app.delete("/api/agent-specs/:handle", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteAgentSpec(req.params.handle);
      if (!success) {
        return res.status(404).json({ error: 'Agent spec not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting agent spec:', error);
      res.status(500).json({ error: 'Failed to delete agent spec' });
    }
  });

  // ===========================
  // WORK ITEMS
  // ===========================
  
  app.get("/api/work-items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getWorkItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching work items:', error);
      res.status(500).json({ error: 'Failed to fetch work items' });
    }
  });

  app.get("/api/work-items/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.getWorkItem(parseInt(req.params.id));
      if (!item) {
        return res.status(404).json({ error: 'Work item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error('Error fetching work item:', error);
      res.status(500).json({ error: 'Failed to fetch work item' });
    }
  });

  app.post("/api/work-items", isAuthenticated, async (req, res) => {
    try {
      const data = insertWorkItemSchema.parse(req.body);
      const item = await storage.createWorkItem(data);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Error creating work item:', error);
      res.status(400).json({ error: error.message || 'Failed to create work item' });
    }
  });

  app.put("/api/work-items/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertWorkItemSchema.partial().parse(req.body);
      const item = await storage.updateWorkItem(parseInt(req.params.id), data);
      if (!item) {
        return res.status(404).json({ error: 'Work item not found' });
      }
      res.json(item);
    } catch (error: any) {
      console.error('Error updating work item:', error);
      res.status(400).json({ error: error.message || 'Failed to update work item' });
    }
  });

  app.delete("/api/work-items/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteWorkItem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Work item not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting work item:', error);
      res.status(500).json({ error: 'Failed to delete work item' });
    }
  });

  // ===========================
  // WORK ITEM FILES
  // ===========================

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

  app.post("/api/work-items/:id/files", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const workItemId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const result = await uploadFileToS3(req.file, workItemId, userId);
      res.status(201).json({ ok: true, ...result });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(400).json({ error: error.message || 'Failed to upload file' });
    }
  });

  app.get("/api/work-items/:id/files", isAuthenticated, async (req, res) => {
    try {
      const workItemId = parseInt(req.params.id);
      const files = await getWorkItemFiles(workItemId);
      res.json({ ok: true, files });
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });

  // ===========================
  // WORK ITEM ACTIONS (Registry-driven)
  // ===========================

  // Register all pack generation routes from the pack registry
  for (const config of PACK_REGISTRY) {
    const path = `/api/work-items/:id/actions/${config.endpointSuffix}`;
    const handler = createPackActionHandler(config);
    app.post(path, isAuthenticated, handler);
  }
  
  // Pack to Drive routes
  const { postSavePackToDrive, getWorkItemDriveFiles } = await import("./api/packToDrive.route");
  app.post("/api/work-items/:workItemId/packs/:packType/save-to-drive", isAuthenticated, postSavePackToDrive);
  app.get("/api/work-items/:workItemId/drive-files", isAuthenticated, getWorkItemDriveFiles);
  
  // List all packs for a work item
  app.get("/api/work-items/:workItemId/packs", isAuthenticated, async (req, res, next) => {
    try {
      const workItemId = parseInt(req.params.workItemId, 10);
      if (isNaN(workItemId)) {
        return res.status(400).json({ error: "Invalid work item ID" });
      }
      
      const packs = await db
        .select()
        .from(workItemPacks)
        .where(eq(workItemPacks.workItemId, workItemId))
        .orderBy(desc(workItemPacks.createdAt));
      
      res.json(packs);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/ops/uploader/config", isAuthenticated, async (_req, res) => {
    try {
      const config = await getEffectiveUploadsConfig();
      res.json(config);
    } catch (error) {
      console.error('Error fetching uploader config:', error);
      res.status(500).json({ error: 'Failed to fetch uploader config' });
    }
  });

  app.post("/api/ops/uploader/config", isAuthenticated, requireOpsRole('ops_admin'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'admin';
      const config = await updateUploadsConfig(req.body, userId);
      res.json({ ok: true, ...config });
    } catch (error: any) {
      console.error('Error updating uploader config:', error);
      res.status(400).json({ error: error.message || 'Failed to update config' });
    }
  });

  // Audit Trail Monitoring API
  app.get("/api/ops/audit/verify", isAuthenticated, requireOpsRole('ops_viewer'), async (_req, res) => {
    try {
      const { verifyAuditTrigger } = await import("./utils/auditTrailMonitor");
      const verification = await verifyAuditTrigger();
      res.json(verification);
    } catch (error: any) {
      console.error('Error verifying audit trigger:', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/ops/audit/summary", isAuthenticated, requireOpsRole('ops_viewer'), async (_req, res) => {
    try {
      const { getAuditSummary } = await import("./utils/auditTrailMonitor");
      const summary = await getAuditSummary();
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ops/audit/trail/:settingKey?", isAuthenticated, requireOpsRole('ops_viewer'), async (req, res) => {
    try {
      const { getAuditTrail, getAllAuditTrail } = await import("./utils/auditTrailMonitor");
      const settingKey = req.params.settingKey;
      const limit = parseInt(req.query.limit as string || '50', 10);
      
      const records = settingKey 
        ? await getAuditTrail(settingKey, limit)
        : await getAllAuditTrail(limit);
      
      res.json(records);
    } catch (error: any) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================
  // DECISIONS
  // ===========================
  
  app.get("/api/decisions", isAuthenticated, async (req, res) => {
    try {
      const decisions = await storage.getDecisions();
      res.json(decisions);
    } catch (error) {
      console.error('Error fetching decisions:', error);
      res.status(500).json({ error: 'Failed to fetch decisions' });
    }
  });

  app.get("/api/decisions/:id", isAuthenticated, async (req, res) => {
    try {
      const decision = await storage.getDecision(parseInt(req.params.id));
      if (!decision) {
        return res.status(404).json({ error: 'Decision not found' });
      }
      res.json(decision);
    } catch (error) {
      console.error('Error fetching decision:', error);
      res.status(500).json({ error: 'Failed to fetch decision' });
    }
  });

  app.post("/api/decisions", isAuthenticated, async (req, res) => {
    try {
      const data = insertDecisionSchema.parse(req.body);
      const decision = await storage.createDecision(data);
      res.status(201).json(decision);
    } catch (error: any) {
      console.error('Error creating decision:', error);
      res.status(400).json({ error: error.message || 'Failed to create decision' });
    }
  });

  // ===========================
  // BRAINSTORM SESSIONS
  // ===========================
  
  app.get("/api/brainstorm/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getBrainstormSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching brainstorm sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get("/api/brainstorm/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const session = await storage.getBrainstormSession(parseInt(req.params.id));
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error fetching session:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  app.post("/api/brainstorm/sessions", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormSessionSchema.parse(req.body);
      const session = await storage.createBrainstormSession(data);
      res.status(201).json(session);
    } catch (error: any) {
      console.error('Error creating session:', error);
      res.status(400).json({ error: error.message || 'Failed to create session' });
    }
  });

  app.put("/api/brainstorm/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormSessionSchema.partial().parse(req.body);
      const session = await storage.updateBrainstormSession(parseInt(req.params.id), data);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error: any) {
      console.error('Error updating session:', error);
      res.status(400).json({ error: error.message || 'Failed to update session' });
    }
  });

  // Brainstorm Participants
  app.get("/api/brainstorm/sessions/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const participants = await storage.getBrainstormParticipants(parseInt(req.params.id));
      res.json(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  });

  app.post("/api/brainstorm/sessions/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormParticipantSchema.parse({
        ...req.body,
        sessionId: parseInt(req.params.id),
      });
      const participant = await storage.createBrainstormParticipant(data);
      res.status(201).json(participant);
    } catch (error: any) {
      console.error('Error adding participant:', error);
      res.status(400).json({ error: error.message || 'Failed to add participant' });
    }
  });

  // Brainstorm Ideas
  app.get("/api/brainstorm/sessions/:id/ideas", isAuthenticated, async (req, res) => {
    try {
      const ideas = await storage.getBrainstormIdeas(parseInt(req.params.id));
      res.json(ideas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      res.status(500).json({ error: 'Failed to fetch ideas' });
    }
  });

  app.post("/api/brainstorm/sessions/:id/ideas", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormIdeaSchema.parse({
        ...req.body,
        sessionId: parseInt(req.params.id),
      });
      const idea = await storage.createBrainstormIdea(data);
      res.status(201).json(idea);
    } catch (error: any) {
      console.error('Error creating idea:', error);
      res.status(400).json({ error: error.message || 'Failed to create idea' });
    }
  });

  app.put("/api/brainstorm/ideas/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormIdeaSchema.partial().parse(req.body);
      const idea = await storage.updateBrainstormIdea(parseInt(req.params.id), data);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }
      res.json(idea);
    } catch (error: any) {
      console.error('Error updating idea:', error);
      res.status(400).json({ error: error.message || 'Failed to update idea' });
    }
  });

  // Brainstorm Clusters
  app.get("/api/brainstorm/sessions/:id/clusters", isAuthenticated, async (req, res) => {
    try {
      const clusters = await storage.getBrainstormClusters(parseInt(req.params.id));
      res.json(clusters);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      res.status(500).json({ error: 'Failed to fetch clusters' });
    }
  });

  app.post("/api/brainstorm/sessions/:id/clusters", isAuthenticated, async (req, res) => {
    try {
      const data = insertBrainstormClusterSchema.parse({
        ...req.body,
        sessionId: parseInt(req.params.id),
      });
      const cluster = await storage.createBrainstormCluster(data);
      res.status(201).json(cluster);
    } catch (error: any) {
      console.error('Error creating cluster:', error);
      res.status(400).json({ error: error.message || 'Failed to create cluster' });
    }
  });

  // ===========================
  // AUDITS
  // ===========================
  
  app.get("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const audits = await storage.getAudits();
      res.json(audits);
    } catch (error) {
      console.error('Error fetching audits:', error);
      res.status(500).json({ error: 'Failed to fetch audits' });
    }
  });

  app.get("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(parseInt(req.params.id));
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }
      res.json(audit);
    } catch (error) {
      console.error('Error fetching audit:', error);
      res.status(500).json({ error: 'Failed to fetch audit' });
    }
  });

  app.post("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuditSchema.parse(req.body);
      const audit = await storage.createAudit(data);
      res.status(201).json(audit);
    } catch (error: any) {
      console.error('Error creating audit:', error);
      res.status(400).json({ error: error.message || 'Failed to create audit' });
    }
  });

  app.put("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuditSchema.partial().parse(req.body);
      const audit = await storage.updateAudit(parseInt(req.params.id), data);
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }
      res.json(audit);
    } catch (error: any) {
      console.error('Error updating audit:', error);
      res.status(400).json({ error: error.message || 'Failed to update audit' });
    }
  });

  // Audit Checks
  app.get("/api/audits/:id/checks", isAuthenticated, async (req, res) => {
    try {
      const checks = await storage.getAuditChecks(parseInt(req.params.id));
      res.json(checks);
    } catch (error) {
      console.error('Error fetching checks:', error);
      res.status(500).json({ error: 'Failed to fetch checks' });
    }
  });

  app.post("/api/audits/:id/checks", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuditCheckSchema.parse({
        ...req.body,
        auditId: parseInt(req.params.id),
      });
      const check = await storage.createAuditCheck(data);
      res.status(201).json(check);
    } catch (error: any) {
      console.error('Error creating check:', error);
      res.status(400).json({ error: error.message || 'Failed to create check' });
    }
  });

  app.put("/api/audits/checks/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuditCheckSchema.partial().parse(req.body);
      const check = await storage.updateAuditCheck(parseInt(req.params.id), data);
      if (!check) {
        return res.status(404).json({ error: 'Check not found' });
      }
      res.json(check);
    } catch (error: any) {
      console.error('Error updating check:', error);
      res.status(400).json({ error: error.message || 'Failed to update check' });
    }
  });

  // Audit Findings
  app.get("/api/audits/:id/findings", isAuthenticated, async (req, res) => {
    try {
      const findings = await storage.getAuditFindings(parseInt(req.params.id));
      res.json(findings);
    } catch (error) {
      console.error('Error fetching findings:', error);
      res.status(500).json({ error: 'Failed to fetch findings' });
    }
  });

  app.post("/api/audits/:id/findings", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuditFindingSchema.parse({
        ...req.body,
        auditId: parseInt(req.params.id),
      });
      const finding = await storage.createAuditFinding(data);
      res.status(201).json(finding);
    } catch (error: any) {
      console.error('Error creating finding:', error);
      res.status(400).json({ error: error.message || 'Failed to create finding' });
    }
  });

  // ===========================
  // CHAT CONVERSATIONS
  // ===========================

  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(parseInt(req.params.id));
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const { roleHandles, ...rest } = req.body;
      const handles = Array.isArray(roleHandles) && roleHandles.length > 0 
        ? roleHandles 
        : [rest.roleHandle || 'general'];
      
      // Create conversation with first role as primary (for backward compatibility)
      const data = insertConversationSchema.parse({ ...rest, roleHandle: handles[0] });
      const conversation = await storage.createConversation(data);
      
      // Insert all role handles into conversation_roles junction table
      if (conversation.id) {
        const userId = (req as any).user?.id ?? null;
        for (const handle of handles) {
          await db.execute(sql`
            INSERT INTO conversation_roles (conversation_id, role_handle, added_by)
            VALUES (${conversation.id}, ${handle}, ${userId})
            ON CONFLICT (conversation_id, role_handle) DO NOTHING
          `);
        }
      }
      
      res.status(201).json(conversation);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ error: error.message || 'Failed to create conversation' });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      const startTime = Date.now();

      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Get conversation to find the role handle
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get role card for the persona
      const roleCards = await storage.getRoleCards({ handle: conversation.roleHandle });
      const roleCard = roleCards[0];
      if (!roleCard) {
        return res.status(404).json({ error: 'Role card not found' });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: 'user',
        content,
      });

      // Get conversation history
      const allMessages = await storage.getMessages(conversationId);
      const chatHistory = allMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Build agent context with memory
      const agentContext = await buildAgentContext(
        roleCard.handle,
        '', // We'll build the full system prompt in generatePersonaResponse
        { includeMemories: true, memoryLimit: 20 }
      );

      // Generate AI response with enhanced context
      const aiResponse = await generatePersonaResponse(roleCard, chatHistory, agentContext.systemPrompt);

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse,
      });

      // Record agent run
      const duration = Date.now() - startTime;
      await recordAgentRun(
        roleCard.handle,
        content,
        aiResponse,
        { conversationId, duration, status: 'completed' }
      );

      // Update conversation timestamp
      await storage.updateConversation(conversationId, {});

      res.status(201).json({
        userMessage,
        assistantMessage,
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  });

  // ===========================
  // UNIFIED AGENTS API
  // ===========================

  // List all unified agents with filtering
  app.get("/api/agents", isAuthenticated, async (req, res) => {
    try {
      const { type, podId, pillar, status, autonomyLevel } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type as string;
      if (podId) filters.podId = parseInt(podId as string);
      if (pillar) filters.pillar = pillar as string;
      if (status) filters.status = status as string;
      if (autonomyLevel) filters.autonomyLevel = autonomyLevel as string;

      const agents = await storage.getAgents(filters);
      res.json(agents);
    } catch (error: any) {
      console.error('Error fetching unified agents:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch unified agents' });
    }
  });

  // Get single unified agent
  app.get("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agent' });
    }
  });

  // Create new unified agent
  app.post("/api/agents", isAuthenticated, async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.status(201).json(agent);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res.status(400).json({ error: error.message || 'Failed to create agent' });
    }
  });

  // Update unified agent
  app.put("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAgent(req.params.id, updates);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error: any) {
      console.error('Error updating agent:', error);
      res.status(400).json({ error: error.message || 'Failed to update agent' });
    }
  });

  // Delete unified agent
  app.delete("/api/agents/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteAgent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      res.status(500).json({ error: error.message || 'Failed to delete agent' });
    }
  });

  // Promote agent (advance gate)
  app.post("/api/agents/:id/promote", isDualAuthenticated, requireScopes("agents:write"), promoteAgent);

  // ===========================
  // AGENT LEARNING & MEMORY  
  // ===========================

  // Run an agent task
  app.post("/api/agents/run", isAuthenticated, async (req, res) => {
    try {
      const { agent, task, links = [], post_to_thread = false } = req.body;
      const startTime = Date.now();

      if (!agent || !task) {
        return res.status(400).json({ error: 'Agent handle and task are required' });
      }

      // Get role card for the agent
      const roleCards = await storage.getRoleCards({ handle: agent });
      const roleCard = roleCards[0];
      if (!roleCard) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Build agent context with memory
      const agentContext = await buildAgentContext(
        roleCard.handle,
        '',
        { includeMemories: true, memoryLimit: 20 }
      );

      // Generate AI response for the task
      const chatHistory = [{ role: 'user' as const, content: task }];
      const output = await generatePersonaResponse(roleCard, chatHistory, agentContext.systemPrompt);

      // Record agent run
      const duration = Date.now() - startTime;
      await recordAgentRun(
        roleCard.handle,
        task,
        output,
        { links, duration, status: 'completed' }
      );

      res.json({
        agent: roleCard.handle,
        task,
        output,
        duration,
        status: 'completed',
        post_to_thread,
      });
    } catch (error: any) {
      console.error('Error running agent:', error);
      res.status(500).json({ error: error.message || 'Failed to run agent' });
    }
  });

  // Record feedback about an agent
  app.post("/api/agents/feedback", isAuthenticated, async (req, res) => {
    try {
      // Support both formats: { roleHandle, kind, textValue, ... } and { agent, feedback, score, kind }
      let data = req.body;
      if (data.agent && data.feedback) {
        // Vite app format - convert to our format
        data = {
          roleHandle: data.agent,
          kind: data.kind || 'feedback',
          textValue: data.feedback,
          score: data.score || 0,
          metadata: data.metadata || {},
        };
      }
      
      const validated = insertAgentMemorySchema.parse(data);
      const memory = await storage.createAgentMemory(validated);
      res.status(201).json(memory);
    } catch (error: any) {
      console.error('Error recording feedback:', error);
      res.status(400).json({ error: error.message || 'Failed to record feedback' });
    }
  });

  // Get agent memories
  app.get("/api/agents/:handle/memory", isAuthenticated, async (req, res) => {
    try {
      const { handle } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;

      const memories = await storage.getAgentMemories(handle, { limit, minScore });
      
      // Return in Vite app format: { items: [...] } with content field
      const items = memories.map(m => ({
        ...m,
        content: m.textValue, // Add content field for Vite app compatibility
      }));
      
      res.json({ items });
    } catch (error: any) {
      console.error('Error fetching agent memories:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agent memories' });
    }
  });

  // Get agent run history
  app.get("/api/agents/:handle/runs", isAuthenticated, async (req, res) => {
    try {
      const { handle } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const runs = await storage.getAgentRuns(handle, { limit });
      res.json(runs);
    } catch (error: any) {
      console.error('Error fetching agent runs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agent runs' });
    }
  });

  // ===========================
  // PROJECTS
  // ===========================

  // Get all projects with filtering
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const { category, status, podId, brandId, limit, offset, q } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (status) filters.status = status as string;
      if (podId) filters.podId = parseInt(podId as string);
      if (brandId) filters.brandId = parseInt(brandId as string);

      let projects = await storage.getProjects(filters);
      
      // Apply search query if provided
      if (q) {
        const query = (q as string).toLowerCase();
        projects = projects.filter(p =>
          p.title.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      }
      
      // Set total count header before pagination
      res.setHeader('X-Total-Count', projects.length.toString());
      
      // Apply pagination
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;
      
      if (limitNum) {
        projects = projects.slice(offsetNum, offsetNum + limitNum);
      }

      res.json(projects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch projects' });
    }
  });

  // Get single project
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project' });
    }
  });

  // Create new project
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating project:', error);
      res.status(400).json({ error: error.message || 'Failed to create project' });
    }
  });

  // Update project
  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(parseInt(req.params.id), updates);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (error: any) {
      console.error('Error updating project:', error);
      res.status(400).json({ error: error.message || 'Failed to update project' });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: error.message || 'Failed to delete project' });
    }
  });

  // Get project files
  app.get("/api/projects/:id/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getProjectFiles(parseInt(req.params.id));
      res.json(files);
    } catch (error: any) {
      console.error('Error fetching project files:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project files' });
    }
  });

  // Create project file
  app.post("/api/projects/:id/files", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectFileSchema.parse({
        ...req.body,
        projectId: parseInt(req.params.id)
      });
      const file = await storage.createProjectFile(data);
      res.status(201).json(file);
    } catch (error: any) {
      console.error('Error creating project file:', error);
      res.status(400).json({ error: error.message || 'Failed to create project file' });
    }
  });

  // Update project file
  app.put("/api/projects/:id/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      const updates = insertProjectFileSchema.partial().parse(req.body);
      const file = await storage.updateProjectFile(parseInt(req.params.fileId), updates);
      if (!file) {
        return res.status(404).json({ error: 'Project file not found' });
      }
      res.json(file);
    } catch (error: any) {
      console.error('Error updating project file:', error);
      res.status(400).json({ error: error.message || 'Failed to update project file' });
    }
  });

  // Delete project file
  app.delete("/api/projects/:id/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProjectFile(parseInt(req.params.fileId));
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting project file:', error);
      res.status(500).json({ error: error.message || 'Failed to delete project file' });
    }
  });

  // Get project pods
  app.get("/api/projects/:id/pods", isAuthenticated, async (req, res) => {
    try {
      // Note: This would need a getProjectPods method in storage
      // For now, return empty array - TODO: implement in storage layer
      res.json([]);
    } catch (error: any) {
      console.error('Error fetching project pods:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project pods' });
    }
  });

  // Assign pod to project  
  app.post("/api/projects/:id/pods", isAuthenticated, async (req, res) => {
    try {
      // Store pod assignment in project.podId field for now
      // This is a simplified version - proper implementation would use a junction table
      const projectId = parseInt(req.params.id);
      const { podId } = req.body;
      
      if (podId) {
        const project = await storage.updateProject(projectId, { podId: parseInt(podId) });
        res.status(201).json({ projectId, podId });
      } else {
        res.status(400).json({ error: 'Pod ID is required' });
      }
    } catch (error: any) {
      console.error('Error assigning pod to project:', error);
      res.status(400).json({ error: error.message || 'Failed to assign pod to project' });
    }
  });

  // Get project agents
  app.get("/api/projects/:id/agents", isAuthenticated, async (req, res) => {
    try {
      const agents = await storage.getProjectAgents(parseInt(req.params.id));
      res.json(agents);
    } catch (error: any) {
      console.error('Error fetching project agents:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project agents' });
    }
  });

  // Assign agent to project
  app.post("/api/projects/:id/agents", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectAgentSchema.parse({
        ...req.body,
        projectId: parseInt(req.params.id)
      });
      const assignment = await storage.createProjectAgent(data);
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Error assigning agent to project:', error);
      res.status(400).json({ error: error.message || 'Failed to assign agent to project' });
    }
  });

  // Remove agent from project
  app.delete("/api/projects/:id/agents/:assignmentId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProjectAgent(parseInt(req.params.assignmentId));
      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing agent from project:', error);
      res.status(500).json({ error: error.message || 'Failed to remove agent from project' });
    }
  });

  // Get project tasks
  app.get("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getProjectTasks(parseInt(req.params.id));
      res.json(tasks);
    } catch (error: any) {
      console.error('Error fetching project tasks:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project tasks' });
    }
  });

  // Create project task
  app.post("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectTaskSchema.parse({
        ...req.body,
        projectId: parseInt(req.params.id)
      });
      const task = await storage.createProjectTask(data);
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Error creating project task:', error);
      res.status(400).json({ error: error.message || 'Failed to create project task' });
    }
  });

  // Update project task
  app.put("/api/projects/:id/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const updates = insertProjectTaskSchema.partial().parse(req.body);
      const task = await storage.updateProjectTask(parseInt(req.params.taskId), updates);
      if (!task) {
        return res.status(404).json({ error: 'Project task not found' });
      }
      res.json(task);
    } catch (error: any) {
      console.error('Error updating project task:', error);
      res.status(400).json({ error: error.message || 'Failed to update project task' });
    }
  });

  // Delete project task
  app.delete("/api/projects/:id/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProjectTask(parseInt(req.params.taskId));
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting project task:', error);
      res.status(500).json({ error: error.message || 'Failed to delete project task' });
    }
  });

  // Get project messages
  app.get("/api/projects/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getProjectMessages(parseInt(req.params.id));
      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching project messages:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch project messages' });
    }
  });

  // Create project message
  app.post("/api/projects/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectMessageSchema.parse({
        ...req.body,
        projectId: parseInt(req.params.id)
      });
      const message = await storage.createProjectMessage(data);
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error creating project message:', error);
      res.status(400).json({ error: error.message || 'Failed to create project message' });
    }
  });

  // ===========================
  // IDEA SPARKS
  // ===========================

  // Get all idea sparks with optional filtering
  app.get("/api/idea-sparks", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, pod, hasProject } = req.query;
      const userId = req.user.claims.sub;
      
      const filters: any = {};
      if (projectId) filters.projectId = parseInt(projectId as string);
      if (pod) filters.pod = pod as string;
      if (hasProject === 'true') filters.hasProject = true;
      // Always filter by current user
      filters.userId = userId;

      const sparks = await storage.getIdeaSparks(filters);
      res.json(sparks);
    } catch (error: any) {
      console.error('Error fetching idea sparks:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch idea sparks' });
    }
  });

  // Get single idea spark
  app.get("/api/idea-sparks/:id", isAuthenticated, async (req, res) => {
    try {
      const spark = await storage.getIdeaSpark(parseInt(req.params.id));
      if (!spark) {
        return res.status(404).json({ error: 'Idea spark not found' });
      }
      res.json(spark);
    } catch (error: any) {
      console.error('Error fetching idea spark:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch idea spark' });
    }
  });

  // Create new idea spark
  app.post("/api/idea-sparks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertIdeaSparkSchema.parse({
        ...req.body,
        userId,
      });
      const spark = await storage.createIdeaSpark(data);
      res.status(201).json(spark);
    } catch (error: any) {
      console.error('Error creating idea spark:', error);
      res.status(400).json({ error: error.message || 'Failed to create idea spark' });
    }
  });

  // Update idea spark
  app.patch("/api/idea-sparks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Parse update data (all fields optional, excluding userId)
      const { userId, ...updateData } = req.body;
      const updated = await storage.updateIdeaSpark(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: 'Idea spark not found' });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating idea spark:', error);
      res.status(400).json({ error: error.message || 'Failed to update idea spark' });
    }
  });

  // Delete idea spark
  app.delete("/api/idea-sparks/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteIdeaSpark(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: 'Idea spark not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting idea spark:', error);
      res.status(500).json({ error: error.message || 'Failed to delete idea spark' });
    }
  });

  // ===========================
  // COMMS - SUMMON & MIRROR-BACK
  // ===========================

  // Post Summon message to Pod's thread
  app.post("/api/comms/summon", isAuthenticated, async (req, res) => {
    try {
      const payload: SummonPayload = req.body;
      
      // Get pod to retrieve thread_id
      const pods = await storage.getPods();
      const pod = pods.find(p => p.id === payload.podId);
      
      if (!pod) {
        return res.status(404).json({ error: 'Pod not found' });
      }

      const result = await postSummon(payload, pod.threadId || null);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to post Summon' });
      }

      res.json({
        success: true,
        messageId: result.messageId,
        podName: pod.name,
        threadId: pod.threadId,
        mode: pod.threadId && process.env.USE_OPENAI === '1' ? 'openai' : 'fallback',
      });
    } catch (error: any) {
      console.error('Error posting Summon:', error);
      res.status(500).json({ error: error.message || 'Failed to post Summon' });
    }
  });

  // Post Mirror-Back message to Pod's thread
  app.post("/api/comms/mirror", isAuthenticated, async (req, res) => {
    try {
      const payload: MirrorBackPayload = req.body;
      
      // Get pod to retrieve thread_id
      const pods = await storage.getPods();
      const pod = pods.find(p => p.id === payload.podId);
      
      if (!pod) {
        return res.status(404).json({ error: 'Pod not found' });
      }

      const result = await postMirrorBack(payload, pod.threadId || null);
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to post Mirror-Back' });
      }

      res.json({
        success: true,
        messageId: result.messageId,
        podName: pod.name,
        threadId: pod.threadId,
        mode: pod.threadId && process.env.USE_OPENAI === '1' ? 'openai' : 'fallback',
      });
    } catch (error: any) {
      console.error('Error posting Mirror-Back:', error);
      res.status(500).json({ error: error.message || 'Failed to post Mirror-Back' });
    }
  });

  // Documentation files endpoint
  app.get("/api/docs/:filename", isAuthenticated, async (req, res) => {
    try {
      const { filename } = req.params;
      const { format } = req.query;
      
      // Whitelist allowed files for security
      const allowedFiles = [
        'API_SPEC_v0.1.1.yaml',
        'GPT_ACTIONS_SCHEMA.yaml',
        'POSTMAN_COLLECTION.json'
      ];
      
      if (!allowedFiles.includes(filename)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'docs', filename);
      
      const content = await fs.readFile(filePath, 'utf-8');
      
      // If Word format requested, convert to docx
      if (format === 'docx') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
        
        // Create document title
        const title = new Paragraph({
          text: filename,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 }
        });
        
        // Split content into lines for better formatting
        const lines = content.split('\n');
        const paragraphs: any[] = [title];
        
        // Add a section heading
        paragraphs.push(new Paragraph({
          text: "Document Content",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 }
        }));
        
        // Add content as code-like paragraphs with line breaks preserved
        for (const line of lines) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: line || " ", // Empty line becomes space
                font: "Courier New",
                size: 20 // 10pt
              })
            ],
            spacing: { after: 0 }
          }));
        }
        
        // Create document
        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs
          }]
        });
        
        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/\.(yaml|yml|json)$/, '.docx')}"`);
        res.send(buffer);
      } else {
        // Original format
        const contentType = filename.endsWith('.json') 
          ? 'application/json'
          : filename.endsWith('.yaml') || filename.endsWith('.yml')
          ? 'application/x-yaml'
          : 'text/plain';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
      }
    } catch (error: any) {
      console.error('Error serving doc file:', error);
      res.status(500).json({ error: 'Failed to serve documentation file' });
    }
  });

  // Image Transformation - Responsive image resizing and format conversion (public)
  const imgRoute = await import("./routes/img.route");
  app.use(imgRoute.router);

  // Responsive Images - S3 upload with allowlist + MIME sniffing (public for demo)
  const imagesRoute = await import("./routes/images.route");
  app.use(imagesRoute.router);

  // Images Status - S3 + Cache-Control health check (public for demo)
  const imagesStatusRoute = await import("./routes/images.status.route");
  app.use(imagesStatusRoute.router);

  // Images Preview - In-memory image preview without S3 writes (public for demo)
  const imagesPreviewRoute = await import("./routes/images.preview.route");
  app.use(imagesPreviewRoute.router);

  // Images Re-encode - Re-encode and replace existing S3 variants (ops_admin only)
  const imagesReencodeRoute = await import("./routes/images.reencode.route");
  app.use("/api", isAuthenticated, imagesReencodeRoute.router);

  // Image CDN - Optional app-based passthrough with cache headers (public)
  const imgCdnRoute = await import("./routes/img_cdn.route");
  app.use(imgCdnRoute.router);

  // Email Preview - Development email template preview (public)
  const emailPreviewRoute = await import("./routes/email_preview.route");
  app.use(emailPreviewRoute.router);

  // Dev Send Email - Development email sending (public)
  const devSendEmailRoute = await import("./routes/dev_send_example.route");
  app.use(devSendEmailRoute.router);

  // Saved Addresses - User saved addresses CRUD (public for demo)
  const addressRoute = await import("./routes/address.route");
  app.use(addressRoute.router);

  // Checkout Address - Checkout address autofill and validation (public for demo)
  const checkoutAddressRoute = await import("./routes/checkout_address.route");
  app.use(checkoutAddressRoute.router);

  // Affiliates - Affiliate tracking and reporting (DB-backed, public for demo)
  const affiliateRoute = await import("./routes/affiliate.route.db");
  app.use(affiliateRoute.router);

  // Affiliate Rates - Per-affiliate commission rates and status management (public for demo)
  const affiliateRatesRoute = await import("./routes/affiliate.rates.route");
  app.use(affiliateRatesRoute.router);

  // Affiliate Payouts - Commission payout calculations and CSV export (public for demo)
  const affiliatePayoutsRoute = await import("./routes/affiliate.payouts.route");
  app.use(affiliatePayoutsRoute.router);

  // Inventory - Low-stock monitoring and threshold management (DB-backed, public for demo)
  const inventoryRoute = await import("./routes/inventory.route.db");
  app.use(inventoryRoute.router);

  // Inventory Notify - Per-SKU notification flags (requires ops_admin)
  const inventoryNotifyRoute = await import("./routes/inventory.notify.route");
  app.use("/api", isAuthenticated, inventoryNotifyRoute.router);

  // Inventory Scheduler - Manual scan trigger (public for demo)
  const inventorySchedulerRoute = await import("./routes/inventory.scheduler.route");
  app.use(inventorySchedulerRoute.router);

  // Ops Settings - Notification settings and testing (public for demo)
  const opsSettingsRoute = await import("./routes/ops_settings.route");
  app.use(opsSettingsRoute.router);

  // Ops Overview - Aggregated ops metrics dashboard (public for demo)
  const opsOverviewRoute = await import("./routes/ops.overview.route");
  app.use(opsOverviewRoute.router);

  // Ops Logs - Event logging and CSV download (public for demo)
  const opsLogsRoute = await import("./routes/ops.logs.route");
  app.use(opsLogsRoute.router);

  // Ops Auth - User role checking for ops features (requires authentication)
  const opsAuthRoute = await import("./routes/ops_auth.route");
  app.use("/api/ops/_auth", isAuthenticated, opsAuthRoute.default);

  // Ops Settings: Alerts - Alert notification settings (requires ops_editor or ops_admin)
  const opsSettingsAlertsRoute = await import("./routes/ops.settings.alerts.route");
  app.use(opsSettingsAlertsRoute.default);

  // Ops Settings: Global - Global controls (requires ops_admin)
  const opsSettingsGlobalRoute = await import("./routes/ops.settings.global.route");
  app.use(opsSettingsGlobalRoute.default);

  // Copilot - AI assistant for querying DTH API (requires authentication)
  const copilot = await import("./copilot");
  app.use("/copilot", isAuthenticated, copilot.default);

  // Work Orders - Agent task definitions and automation specs
  const { workOrders } = await import("./work_orders");
  app.use("/api/work-orders", isAuthenticated, workOrders);

  // Chat Conversations - Multi-select participants with pod support
  const { chatConversationsRouter } = await import("./routes/chat_conversations");
  app.use("/api", isAuthenticated, chatConversationsRouter);

  // Brands - Business Unit brands and products
  app.get("/api/brands", isAuthenticated, async (req, res) => {
    try {
      const bu = req.query.bu as string | undefined;
      const brands = await storage.getBrands(bu ? { businessUnit: bu } : undefined);
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Links - Google Drive folders by BU
  app.get("/api/knowledge/links", isAuthenticated, async (req, res) => {
    try {
      const ownerId = req.query.id as string | undefined;
      const filters = ownerId ? { businessUnit: ownerId } : undefined;
      const links = await storage.getKnowledgeLinks(filters);
      res.json(links);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Products - Brand products
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;
      const products = await storage.getProducts(brandId ? { brandId } : undefined);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Error logger middleware - logs all unhandled errors to ops_logs.csv (must be last)
  const { errorLogger } = await import("./middleware/errorLogger");
  app.use(errorLogger);

  const httpServer = createServer(app);
  return httpServer;
}
