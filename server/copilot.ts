/**
 * Copilot Route - OpenAI-powered assistant for querying DTH API
 * Uses tool-calling to select appropriate API endpoint
 */

import { Router, Request, Response } from "express";
import { dthGET } from "./lib/dthClient";
import { storage } from "./storage";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Simple per-user throttle (in-memory for dev, use Redis in prod)
const BUCKET = new Map<string, { count: number; reset: number }>();

function throttle(userId: string, limit = Number(process.env.COPILOT_REQS_PER_MIN || 30)) {
  const now = Date.now();
  const win = 60_000; // 1 minute window
  
  const slot = BUCKET.get(userId) || { count: 0, reset: now + win };
  if (now > slot.reset) {
    Object.assign(slot, { count: 0, reset: now + win });
  }
  
  slot.count++;
  BUCKET.set(userId, slot);
  
  if (slot.count > limit) {
    return { over: true, reset: Math.ceil((slot.reset - now) / 1000) };
  }
  
  return { over: false, reset: Math.ceil((slot.reset - now) / 1000) };
}

// On-rails system prompt with validation rules
const SYSTEM_PROMPT = `
You are Agent Lab — DTH Ops. Use the tools to call DTH (read-only).
Default views: lists → concise tables; singles → compact key-value blocks.

Agent summaries table columns:
display_name | level | status | next_gate | success% | p95(s) | cost($)
- kpis.task_success ∈ [0,1] → percent (0-dec), else "—"
- kpis.latency_p95_s finite → 1-dec, else "—"
- kpis.cost_per_task_usd finite → 3-dec, else "—"
- next_gate 1–4 else "—"
- promotion_progress_pct 0–100 else "—"
Footer: count (X-Total-Count), limit, offset

Validation & errors (tolerant per-field, strict envelope):
- Stop if HTTP ≠ 200, not JSON, or wrong top-level type (array for lists, object for singles).
- Required identity fields:
  Roles: name, handle
  Agents: name, autonomy_level, status
  If missing, skip item; note "skipped 1 item (missing required fields)".
- Optional/malformed numeric fields → "—" + a diagnostic footer list.
- 401/403 → "Auth failed... check DTH_API_TOKEN"
- 404 single → "Not found: ..."
- ≥500/network/shape mismatch → "DTH API error / unexpected response shape; stopping"
Never fabricate. Read-only only.
`;

// OpenAI tools schema (3 safe read-only operations)
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "listRoles",
      description: "List roles (paginated)",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 200, description: "Number of results (default 10)" },
          offset: { type: "integer", minimum: 0, description: "Offset for pagination (default 0)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getRoleByHandle",
      description: "Get a role by handle",
      parameters: {
        type: "object",
        properties: {
          handle: { type: "string", description: "Role handle (e.g., 'product_owner')" }
        },
        required: ["handle"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getAgentSummaries",
      description: "List agent summaries (paginated, optional filters)",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 200, description: "Number of results" },
          offset: { type: "integer", minimum: 0, description: "Offset for pagination" },
          bu: { type: "string", description: "Filter by business unit" },
          level: { type: "string", enum: ["L0", "L1", "L2", "L3"], description: "Filter by autonomy level" },
          status: { type: "string", enum: ["pilot", "live", "watch", "rollback"], description: "Filter by status" },
          q: { type: "string", description: "Text search query" }
        }
      }
    }
  }
];

// Transform agents to summary format (matching /api/agents/summary logic)
function transformToSummary(agents: any[]) {
  return agents.map(agent => {
    const autonomy_level = agent.autonomyLevel || 'L0';
    
    const task_success = agent.lastEvalScore 
      ? Math.min(1.0, Math.max(0.0, agent.lastEvalScore / 100))
      : 0.80;
    
    const latencyMap: Record<string, number> = { 'L3': 3.2, 'L2': 4.1, 'L1': 4.6, 'L0': 4.9 };
    const costMap: Record<string, number> = { 'L3': 0.047, 'L2': 0.040, 'L1': 0.033, 'L0': 0.025 };
    
    let mappedStatus: string;
    if (agent.status === 'active') mappedStatus = 'live';
    else if (agent.status === 'inactive') mappedStatus = 'pilot';
    else mappedStatus = agent.status;
    
    const currentLevel = parseInt(autonomy_level.slice(1));
    const next_gate = currentLevel >= 3 ? null : (currentLevel + 1);
    
    const progressDefaults: Record<string, number> = { 'L0': 25, 'L1': 50, 'L2': 75, 'L3': 100 };
    const promotion_progress_pct = agent.lastEvalScore 
      ? Math.min(100, Math.max(0, agent.lastEvalScore))
      : progressDefaults[autonomy_level] || 25;
    
    const business_unit = agent.podName || 'General';
    
    return {
      name: agent.id,
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
      }
    };
  });
}

// Format agent summaries as markdown table
function fmtAgents(items: any[], total: string | null, { limit, offset }: { limit: number; offset: number }) {
  const rows: string[][] = [];
  
  items.forEach((a) => {
    const s = (v: any) => (Number.isFinite(v) ? v : null);
    const pct = s(a?.kpis?.task_success);
    const p95 = s(a?.kpis?.latency_p95_s);
    const cost = s(a?.kpis?.cost_per_task_usd);
    
    const pctStr = (pct !== null && pct >= 0 && pct <= 1) ? `${Math.round(pct * 100)}%` : "—";
    const p95Str = Number.isFinite(p95) ? `${p95!.toFixed(1)}` : "—";
    const costStr = Number.isFinite(cost) ? `${cost!.toFixed(3)}` : "—";
    const gate = Number.isInteger(a?.next_gate) && a.next_gate >= 1 && a.next_gate <= 4 ? a.next_gate : "—";
    
    rows.push([
      a.display_name || a.name || "—",
      a.autonomy_level || "—",
      a.status || "—",
      String(gate),
      pctStr,
      p95Str,
      costStr
    ]);
  });

  // Render markdown table
  const head = `| display_name | level | status | next_gate | success% | p95(s) | cost($) |
|---|---|---|---:|---:|---:|---:|`;
  const body = rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} | ${r[5]} | ${r[6]} |`).join("\n");
  const footer = `\n\n_count:_ **${total ?? "?"}**, _limit:_ **${limit ?? "?"}**, _offset:_ **${offset ?? "?"}**`;
  
  return `${head}\n${body}${footer}`;
}

// POST /copilot/ask - main endpoint (supports both direct tool calling and chat)
router.post("/ask", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const userId = (req as any).user?.id || "anon";
    
    // Rate limiting
    const throttled = throttle(userId);
    if (throttled.over) {
      const ms = Date.now() - startTime;
      console.log(JSON.stringify({ user_id: userId, path: "/ask", status: 429, ms }));
      return res.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many requests",
          details: { reset_in_s: throttled.reset }
        }
      });
    }

    // Direct tool calling mode (tool + params provided)
    const { tool, params } = req.body;
    if (tool && typeof tool === "string") {
      const result = await handleDirectToolCall(tool, params || {}, res);
      const ms = Date.now() - startTime;
      console.log(JSON.stringify({ user_id: userId, path: "/ask", tool, status: res.statusCode || 200, ms }));
      return result;
    }

    // Chat-based mode (message provided)
    const userMsg = String(req.body?.message || "").trim();
    if (!userMsg) {
      return res.status(400).json({
        error: { code: "bad_request", message: "Missing 'message' or 'tool' field" }
      });
    }

    // Handle smoke test directly (bypass OpenAI for speed)
    if (userMsg.toLowerCase().includes("smoke test")) {
      const diagnostics: string[] = [];
      let status: "Green" | "Amber" | "Red" = "Green";

      // Test 1: Get Roles (using storage directly for internal calls)
      try {
        const roles = await storage.getRoleCards();
        if (!Array.isArray(roles)) {
          status = "Red";
          diagnostics.push("❌ Roles API: Invalid response shape");
        } else if (roles.length === 0) {
          status = "Amber";
          diagnostics.push("⚠️ Roles API: No data returned");
        } else {
          diagnostics.push(`✅ Roles API: OK (${roles.length} total)`);
        }
      } catch (error: any) {
        status = "Red";
        diagnostics.push(`❌ Roles API: ${error.message || "Unknown error"}`);
      }

      // Test 2: Get Agent Summaries (using storage directly for internal calls)
      try {
        const agents = await storage.getAgents({});
        if (!Array.isArray(agents)) {
          status = "Red";
          diagnostics.push("❌ Agents API: Invalid response shape");
        } else if (agents.length === 0) {
          status = "Amber";
          diagnostics.push("⚠️ Agents API: No data returned");
        } else {
          diagnostics.push(`✅ Agents API: OK (${agents.length} total)`);
        }
      } catch (error: any) {
        status = "Red";
        diagnostics.push(`❌ Agents API: ${error.message || "Unknown error"}`);
      }

      const statusIcon = status === "Green" ? "🟢" : status === "Amber" ? "🟡" : "🔴";
      const reply = `**DTH API Smoke Test: ${statusIcon} ${status}**\n\n${diagnostics.join("\n")}\n\n_Test completed at ${new Date().toISOString()}_`;
      
      return res.json({ reply });
    }

    // Ask OpenAI to choose tool
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg }
      ],
      tools: TOOLS,
      tool_choice: "auto"
    });

    const message = completion.choices[0]?.message;
    const toolCalls = message?.tool_calls || [];

    // If no tool call, return default response
    if (!toolCalls.length) {
      // Fallback: show first page of agent summaries (using storage directly)
      try {
        const agents = await storage.getAgents({});
        if (!Array.isArray(agents)) {
          return res.status(502).json({
            error: { code: "upstream_error", message: "DTH API error / unexpected response shape; stopping" }
          });
        }
        // Transform to summary format
        const summary = transformToSummary(agents);
        const limited = summary.slice(0, 10);
        const reply = fmtAgents(limited, String(summary.length), { limit: 10, offset: 0 });
        return res.json({ reply });
      } catch (error: any) {
        return res.status(500).json({
          error: { code: "storage_error", message: error.message || "Failed to fetch agents" }
        });
      }
    }

    const toolCall = toolCalls[0];
    const name = toolCall.type === "function" ? toolCall.function.name : "";
    const args = toolCall.type === "function" ? JSON.parse(toolCall.function.arguments || "{}") : {};

    // Handle listRoles tool (using storage directly for internal calls)
    if (name === "listRoles") {
      try {
        const { limit = 10, offset = 0 } = args;
        const allRoles = await storage.getRoleCards();
        
        if (!Array.isArray(allRoles)) {
          return res.status(502).json({
            error: { code: "upstream_error", message: "DTH API error / unexpected response shape; stopping" }
          });
        }
        
        const paginated = allRoles.slice(offset, offset + limit);
        const head = `| name | handle | pod | category |
|---|---|---|---|`;
        const body = paginated.map(r => `| ${r.title || "—"} | ${r.handle || "—"} | ${r.pod || "—"} | ${r.category || "—"} |`).join("\n");
        const reply = `${head}\n${body}\n\n_count:_ **${allRoles.length}**, _limit:_ **${limit}**, _offset:_ **${offset}**`;
        
        return res.json({ reply });
      } catch (error: any) {
        return res.status(500).json({
          error: { code: "storage_error", message: error.message || "Failed to fetch roles" }
        });
      }
    }

    // Handle getRoleByHandle tool (using storage directly for internal calls)
    if (name === "getRoleByHandle") {
      try {
        const { handle } = args;
        const allRoles = await storage.getRoleCards({ handle });
        const role = allRoles[0];
        
        if (!role) {
          return res.json({ reply: `Not found: **${handle}**` });
        }
        
        if (!role || typeof role !== "object") {
          return res.status(502).json({
            error: { code: "upstream_error", message: "DTH API error / unexpected response shape; stopping" }
          });
        }
        
        const fields: [string, any][] = [
          ["name", role.title],
          ["handle", role.handle],
          ["pod", role.pod],
          ["category", role.category]
        ];
        
        const reply = fields.map(([k, v]) => `**${k}:** ${v ?? "—"}`).join("\n");
        return res.json({ reply });
      } catch (error: any) {
        return res.status(500).json({
          error: { code: "storage_error", message: error.message || "Failed to fetch role" }
        });
      }
    }

    // Handle getAgentSummaries tool (using storage directly for internal calls)
    if (name === "getAgentSummaries") {
      try {
        const { limit = 10, offset = 0, bu, level, status: statusFilter, q } = args;
        const agents = await storage.getAgents({});
        
        if (!Array.isArray(agents)) {
          return res.status(502).json({
            error: { code: "upstream_error", message: "DTH API error / unexpected response shape; stopping" }
          });
        }
        
        // Transform to summary format and apply filters
        let summary = transformToSummary(agents);
        
        if (bu) {
          summary = summary.filter(a => a.business_unit?.toLowerCase() === String(bu).toLowerCase());
        }
        if (level) {
          summary = summary.filter(a => a.autonomy_level === level);
        }
        if (statusFilter) {
          summary = summary.filter(a => a.status === statusFilter);
        }
        if (q) {
          const query = String(q).toLowerCase();
          summary = summary.filter(a => 
            a.display_name?.toLowerCase().includes(query) || 
            a.name.toLowerCase().includes(query)
          );
        }
        
        const paginated = summary.slice(offset, offset + limit);
        const reply = fmtAgents(paginated, String(summary.length), { limit, offset });
        return res.json({ reply });
      } catch (error: any) {
        return res.status(500).json({
          error: { code: "storage_error", message: error.message || "Failed to fetch agents" }
        });
      }
    }

    // Fallback for unknown tools
    return res.json({ reply: "I can only list roles, show a role by handle, or list agent summaries." });

  } catch (e: any) {
    const ms = Date.now() - startTime;
    const userId = (req as any).user?.id || "anon";
    console.error("Copilot error:", e);
    console.log(JSON.stringify({ user_id: userId, path: "/ask", status: 500, ms, error: e.message }));
    return res.status(500).json({
      error: {
        code: "copilot_error",
        message: "Internal failure",
        details: { msg: e.message }
      }
    });
  }
});

// Direct tool calling handler (bypasses OpenAI, returns structured data)
async function handleDirectToolCall(tool: string, params: any, res: Response) {
  try {
    // Smoke Test
    if (tool === "smokeTest") {
      const diagnostics: string[] = [];
      let status: "Green" | "Amber" | "Red" = "Green";

      // Test roles
      try {
        const roles = await storage.getRoleCards();
        if (!Array.isArray(roles)) {
          status = "Red";
          diagnostics.push("❌ Roles API: Invalid response shape");
        } else if (roles.length === 0) {
          status = "Amber";
          diagnostics.push("⚠️ Roles API: No data returned");
        } else {
          diagnostics.push(`✅ Roles API: OK (${roles.length} total)`);
        }
      } catch (error: any) {
        status = "Red";
        diagnostics.push(`❌ Roles API: ${error.message || "Unknown error"}`);
      }

      // Test agents
      try {
        const agents = await storage.getAgents({});
        if (!Array.isArray(agents)) {
          status = "Red";
          diagnostics.push("❌ Agents API: Invalid response shape");
        } else if (agents.length === 0) {
          status = "Amber";
          diagnostics.push("⚠️ Agents API: No data returned");
        } else {
          diagnostics.push(`✅ Agents API: OK (${agents.length} total)`);
        }
      } catch (error: any) {
        status = "Red";
        diagnostics.push(`❌ Agents API: ${error.message || "Unknown error"}`);
      }

      return res.json({
        result: status,
        diagnostics: {
          roles: diagnostics.find(d => d.includes("Roles")) || "",
          agents: diagnostics.find(d => d.includes("Agents")) || ""
        },
        summary: diagnostics.every(d => d.includes("✅")) 
          ? "PASS - All APIs responding normally" 
          : "FAIL - One or more APIs reported errors"
      });
    }

    // List Roles
    if (tool === "listRoles") {
      const { limit = 10, offset = 0 } = params;
      const allRoles = await storage.getRoleCards();
      
      if (!Array.isArray(allRoles)) {
        return res.status(502).json({
          error: { code: "upstream_error", message: "Invalid response from storage" }
        });
      }
      
      const paginated = allRoles.slice(offset, offset + limit);
      const columns = ["name", "handle", "pod", "category"];
      const rows = paginated.map(r => [r.title || "—", r.handle || "—", r.pod || "—", r.category || "—"]);
      
      return res.json({
        type: "table",
        columns,
        rows,
        meta: {
          total: allRoles.length,
          count: paginated.length,
          limit,
          offset,
          isAgentSummary: false
        }
      });
    }

    // Get Agent Summaries
    if (tool === "getAgentSummaries") {
      const { limit = 10, offset = 0, bu, level, status: statusFilter, q } = params;
      const agents = await storage.getAgents({});
      
      if (!Array.isArray(agents)) {
        return res.status(502).json({
          error: { code: "upstream_error", message: "Invalid response from storage" }
        });
      }
      
      // Transform and filter
      let summary = transformToSummary(agents);
      
      if (bu) {
        summary = summary.filter(a => a.business_unit?.toLowerCase() === String(bu).toLowerCase());
      }
      if (level) {
        summary = summary.filter(a => a.autonomy_level === level);
      }
      if (statusFilter) {
        summary = summary.filter(a => a.status === statusFilter);
      }
      if (q) {
        const query = String(q).toLowerCase();
        summary = summary.filter(a => 
          a.display_name?.toLowerCase().includes(query) || 
          a.name.toLowerCase().includes(query)
        );
      }
      
      const paginated = summary.slice(offset, offset + limit);
      
      // Generate summary statistics
      const successPcts = summary.map(a => a.kpis.task_success * 100);
      const latencies = summary.map(a => a.kpis.latency_p95_s);
      const costs = summary.map(a => a.kpis.cost_per_task_usd);
      
      const avgSuccess = successPcts.reduce((a, b) => a + b, 0) / successPcts.length;
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const medianCost = [...costs].sort((a, b) => a - b)[Math.floor(costs.length / 2)];
      
      // Risk categorization based on success rate
      const lowRisk = summary.filter(a => a.kpis.task_success >= 0.95).length;
      const mediumRisk = summary.filter(a => a.kpis.task_success >= 0.85 && a.kpis.task_success < 0.95).length;
      const highRisk = summary.filter(a => a.kpis.task_success < 0.85).length;
      
      // Top risks (agents with lowest success rates)
      const topRisks = [...summary]
        .sort((a, b) => a.kpis.task_success - b.kpis.task_success)
        .slice(0, 5)
        .map(a => ({
          name: a.display_name || a.name,
          why: `${Math.round(a.kpis.task_success * 100)}% success rate - below target`
        }));
      
      // Format for table display
      const columns = ["name", "level", "status", "next_gate", "success_pct", "p95_s", "cost_usd"];
      const rows = paginated.map(a => [
        a.display_name || a.name,
        a.autonomy_level,
        a.status,
        a.next_gate,
        a.kpis.task_success * 100,
        a.kpis.latency_p95_s,
        a.kpis.cost_per_task_usd
      ]);
      
      return res.json({
        type: "table",
        columns,
        rows,
        meta: {
          total: summary.length,
          count: paginated.length,
          limit,
          offset,
          isAgentSummary: true,
          summary: {
            overall: `${summary.length} agents across ${new Set(summary.map(a => a.autonomy_level)).size} autonomy levels`,
            stats: {
              avg_success_pct: Math.round(avgSuccess),
              avg_p95_s: avgLatency.toFixed(2),
              median_cost_usd: medianCost.toFixed(3)
            },
            buckets: {
              low: lowRisk,
              medium: mediumRisk,
              high: highRisk
            },
            top_risks: topRisks,
            next_actions: [
              highRisk > 0 ? `Investigate ${highRisk} high-risk agents with <85% success` : null,
              avgLatency > 2.0 ? "Optimize latency - average P95 exceeds 2.0s" : null,
              "Review evidence packs for agents awaiting promotion"
            ].filter(Boolean) as string[]
          }
        }
      });
    }

    // Unknown tool
    return res.status(400).json({
      error: { code: "invalid_tool", message: `Unknown tool: ${tool}` }
    });
  } catch (error: any) {
    console.error("Direct tool call error:", error);
    return res.status(500).json({
      error: { code: "internal_error", message: error.message || "Unknown error" }
    });
  }
}

export default router;
