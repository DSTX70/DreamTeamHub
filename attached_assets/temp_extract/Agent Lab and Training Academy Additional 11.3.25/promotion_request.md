---
name: "Promotion Request (Lx → Ly)"
about: Submit an Agent promotion with two green runs and Gate-1..4 checks
title: "Promotion: <agent-name> Lx → Ly"
labels: ["level:Ly", "gate:1", "gate:2", "gate:3", "gate:4", "status:pilot"]
---

> Paste a link to the filled `promotion_request_template.md` in `/40_Playbooks/` (or include the markdown below). 
> The CI will parse and validate fields automatically.

## Agent
- Name: <agent-name>
- From → To: Lx → Ly
- Owner: <Helm>

## Evidence (two green runs)
- Pack A: <path-to-evidence-pack-A>
- Pack B: <path-to-evidence-pack-B>

## KPIs & Thresholds
| Metric | Threshold | Run A | Run B |
|---|---:|---:|---:|
| Task Success | >= <min> | <A_success> | <B_success> |
| p95 Latency (s) | <= <max> | <A_p95> | <B_p95> |
| Cost / Task (USD) | <= <max> | <A_cost> | <B_cost> |
| Tool Error Rate | <= <max> | <A_err> | <B_err> |
| Safety Incidents | = 0 | <A_safe> | <B_safe> |

## Gate Checks
- Gate-1 (Safety): ✅/❌ — Notes:
- Gate-2 (Performance): ✅/❌ — Notes:
- Gate-3 (Cost): ✅/❌ — Notes:
- Gate-4 (Auditability): ✅/❌ — Notes:

## Approvals (to be completed in board)
- Helm (Thread Lead): 
- Sentinel (Safety/Risk): 
- Pulse (Performance): 
- Verifier (QA/Replay): 
- OS (L2→L3): 

