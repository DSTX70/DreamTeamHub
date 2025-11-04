// routes/agentsSummaryStub.js
import express from 'express';
export const agents = express.Router();

// Sample data (shape matches OpenAPI v0.1.1 AgentSummary)
const SAMPLE = [
  {
    name: "agent-router", display_name: "Router", autonomy_level: "L1",
    status: "pilot", next_gate: 2, promotion_progress_pct: 60, business_unit: "Support",
    kpis: { task_success: 0.84, latency_p95_s: 4.2, cost_per_task_usd: 0.035 },
    links: { pr: "https://github.com/org/repo/pull/123", promotion_request: "/Agent-Lab/40_Playbooks/promotion_request_template.md", evidence_pack: "/Agent-Lab/30_EvidencePacks/exp_2025-11-03_tool-routing-accuracy/" }
  },
  {
    name: "agent-reader", display_name: "Reader", autonomy_level: "L0",
    status: "pilot", next_gate: 1, promotion_progress_pct: 30, business_unit: "Marketing",
    kpis: { task_success: 0.78, latency_p95_s: 4.8, cost_per_task_usd: 0.028 }
  },
  {
    name: "agent-support-exec", display_name: "Support Exec", autonomy_level: "L2",
    status: "watch", next_gate: 3, promotion_progress_pct: 85, business_unit: "Support",
    kpis: { task_success: 0.88, latency_p95_s: 3.9, cost_per_task_usd: 0.041 }
  }
];

agents.get('/summary', (req, res) => {
  // Very simple filter/pagination for stub
  let { limit = 50, offset = 0, bu, level, status, q } = req.query;
  limit = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  offset = Math.max(0, parseInt(offset, 10) || 0);

  let data = SAMPLE;
  if (bu) data = data.filter(a => (a.business_unit || '').toLowerCase() === String(bu).toLowerCase());
  if (level) data = data.filter(a => a.autonomy_level === level);
  if (status) data = data.filter(a => a.status === status);
  if (q) data = data.filter(a => ((a.display_name || a.name).toLowerCase().includes(String(q).toLowerCase())));

  const total = data.length;
  const sliced = data.slice(offset, offset + limit);
  res.set('X-Total-Count', String(total));
  res.json(sliced);
});
