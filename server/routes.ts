import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPodSchema, insertPodAgentSchema, insertAgentSchema, insertPersonSchema, insertRoleCardSchema, insertRoleRaciSchema, insertAgentSpecSchema,
  insertWorkItemSchema, insertDecisionSchema, insertBrainstormSessionSchema,
  insertBrainstormParticipantSchema, insertBrainstormIdeaSchema, insertBrainstormClusterSchema,
  insertAuditSchema, insertAuditCheckSchema, insertAuditFindingSchema,
  insertConversationSchema, insertMessageSchema, insertAgentMemorySchema,
} from "@shared/schema";
import { generatePersonaResponse } from "./openai-service";
import { buildAgentContext, recordAgentRun, recordFeedback } from "./agent-context";
import { postSummon, postMirrorBack } from "./comms-service";
import type { SummonPayload, MirrorBackPayload } from "./comms-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===========================
  // AUTHENTICATION (Replit Auth)
  // ===========================
  
  await setupAuth(app);

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

  // ===========================
  // POD AGENTS
  // ===========================
  
  app.get("/api/pod-agents", isAuthenticated, async (req, res) => {
    try {
      const podId = req.query.podId ? parseInt(req.query.podId as string) : undefined;
      const agents = await storage.getPodAgents(podId);
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
  
  app.get("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const { pod, handle } = req.query;
      const filters: any = {};
      if (pod) filters.pod = pod as string;
      if (handle) filters.handle = handle as string;
      
      const roles = await storage.getRoleCards(filters);
      res.json(roles);
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

  app.post("/api/roles", isAuthenticated, async (req, res) => {
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
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(data);
      res.status(201).json(conversation);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ error: error.message || 'Failed to create conversation' });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessages(parseInt(req.params.id));
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

  const httpServer = createServer(app);
  return httpServer;
}
