/**
 * Copilot Route - OpenAI-powered assistant for querying DTH API
 * Uses tool-calling to select appropriate API endpoint
 */

import { Router, Request, Response } from "express";
import { dthGET } from "./lib/dthClient";
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

// POST /copilot/ask - main endpoint
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || "anon";
    
    // Rate limiting
    const throttled = throttle(userId);
    if (throttled.over) {
      return res.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many requests",
          details: { reset_in_s: throttled.reset }
        }
      });
    }

    const userMsg = String(req.body?.message || "").trim();
    if (!userMsg) {
      return res.status(400).json({
        error: { code: "bad_request", message: "Missing message" }
      });
    }

    // Handle smoke test directly (bypass OpenAI for speed)
    if (userMsg.toLowerCase().includes("smoke test")) {
      const diagnostics: string[] = [];
      let status: "Green" | "Amber" | "Red" = "Green";

      // Test 1: Get Roles
      const rolesTest = await dthGET("/api/roles", { limit: 1 });
      if (rolesTest.status !== 200) {
        status = "Red";
        diagnostics.push(`❌ Roles API: HTTP ${rolesTest.status}`);
      } else if (!Array.isArray(rolesTest.json)) {
        status = "Red";
        diagnostics.push("❌ Roles API: Invalid response shape");
      } else if (rolesTest.json.length === 0) {
        status = "Amber";
        diagnostics.push("⚠️ Roles API: No data returned");
      } else {
        diagnostics.push(`✅ Roles API: OK (${rolesTest.headers.total || "?"} total)`);
      }

      // Test 2: Get Agent Summaries
      const agentsTest = await dthGET("/api/agents/summary", { limit: 1 });
      if (agentsTest.status !== 200) {
        status = "Red";
        diagnostics.push(`❌ Agents API: HTTP ${agentsTest.status}`);
      } else if (!Array.isArray(agentsTest.json)) {
        status = "Red";
        diagnostics.push("❌ Agents API: Invalid response shape");
      } else if (agentsTest.json.length === 0) {
        status = "Amber";
        diagnostics.push("⚠️ Agents API: No data returned");
      } else {
        diagnostics.push(`✅ Agents API: OK (${agentsTest.headers.total || "?"} total)`);
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
      // Fallback: show first page of agent summaries
      const { status, json, headers } = await dthGET("/api/agents/summary", { limit: 10, offset: 0 });
      if (status !== 200 || !Array.isArray(json)) {
        return res.status(502).json({
          error: { code: "upstream_error", message: "DTH API error / unexpected response shape; stopping" }
        });
      }
      const reply = fmtAgents(json, headers.total, { limit: 10, offset: 0 });
      return res.json({ reply });
    }

    const toolCall = toolCalls[0];
    const name = toolCall.type === "function" ? toolCall.function.name : "";
    const args = toolCall.type === "function" ? JSON.parse(toolCall.function.arguments || "{}") : {};

    // Handle listRoles tool
    if (name === "listRoles") {
      const { limit = 10, offset = 0 } = args;
      const { status, json, headers } = await dthGET("/api/roles", { limit, offset });
      
      if (status !== 200 || !Array.isArray(json)) {
        const code = status === 401 || status === 403 ? "unauthorized" : "upstream_error";
        const message = status === 401 || status === 403 
          ? "Auth failed… check DTH_API_TOKEN" 
          : "DTH API error / unexpected response shape; stopping";
        return res.status(status === 200 ? 502 : status).json({ error: { code, message } });
      }
      
      const head = `| name | handle | pod | category |
|---|---|---|---|`;
      const body = json.map(r => `| ${r.name || "—"} | ${r.handle || "—"} | ${r.pod || "—"} | ${r.category || "—"} |`).join("\n");
      const reply = `${head}\n${body}\n\n_count:_ **${headers.total ?? "?"}**, _limit:_ **${limit}**, _offset:_ **${offset}**`;
      
      return res.json({ reply });
    }

    // Handle getRoleByHandle tool
    if (name === "getRoleByHandle") {
      const { handle } = args;
      const { status, json } = await dthGET(`/api/roles/by-handle/${encodeURIComponent(handle)}`);
      
      if (status === 404) {
        return res.json({ reply: `Not found: **${handle}**` });
      }
      
      if (status !== 200 || !json || typeof json !== "object") {
        const code = status === 401 || status === 403 ? "unauthorized" : "upstream_error";
        const message = status === 401 || status === 403 
          ? "Auth failed… check DTH_API_TOKEN" 
          : "DTH API error / unexpected response shape; stopping";
        return res.status(status === 200 ? 502 : status).json({ error: { code, message } });
      }
      
      const fields: [string, any][] = [
        ["name", json.name],
        ["handle", json.handle],
        ["pod", json.pod],
        ["category", json.category],
        ["display_name", json.display_name],
        ["autonomy_level", json.autonomy_level]
      ];
      
      const reply = fields.map(([k, v]) => `**${k}:** ${v ?? "—"}`).join("\n");
      return res.json({ reply });
    }

    // Handle getAgentSummaries tool
    if (name === "getAgentSummaries") {
      const { limit = 10, offset = 0, bu, level, status, q } = args;
      const { status: s, json, headers } = await dthGET("/api/agents/summary", { 
        limit, offset, bu, level, status, q 
      });
      
      if (s !== 200 || !Array.isArray(json)) {
        const code = s === 401 || s === 403 ? "unauthorized" : "upstream_error";
        const message = s === 401 || s === 403 
          ? "Auth failed… check DTH_API_TOKEN" 
          : "DTH API error / unexpected response shape; stopping";
        return res.status(s === 200 ? 502 : s).json({ error: { code, message } });
      }
      
      const reply = fmtAgents(json, headers.total, { limit, offset });
      return res.json({ reply });
    }

    // Fallback for unknown tools
    return res.json({ reply: "I can only list roles, show a role by handle, or list agent summaries." });

  } catch (e: any) {
    console.error("Copilot error:", e);
    return res.status(500).json({
      error: {
        code: "copilot_error",
        message: "Internal failure",
        details: { msg: e.message }
      }
    });
  }
});

export default router;
