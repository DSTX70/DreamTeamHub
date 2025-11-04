# WIP Limits & Kanban Policy (Agent Lab)
_Date: 2025-11-03_

## Columns
Backlog → Ready → In Progress → Review (Gates) → Promotion Board → Deploy/Watch → Done

## WIP Limits (max items)
- **Ready:** 10
- **In Progress:** 6 (hard cap) — per role caps: Forge/LexiCode(3), Verifier/Pulse(2), Sentinel(2)
- **Review (Gates):** 8
- **Promotion Board:** auto-scheduled; queue limit 6

## Pull Rules
- No pulling from Backlog to Ready unless **Decision-By** date is set.
- Promotion requests enter **Promotion Board** only with **two green runs** + evidence links.
- Any item blocked >3 business days → escalate to OS/Helm in Weekly Review.

## Exit Criteria
- **Review (Gates)** exits when Gate-1..4 all pass.
- **Deploy/Watch** exits after 2-week watch window with zero critical incidents.

## Metrics
- Lead time (intake → first run), Cycle time (first run → decision), Throughput/week.
- SLA breaches auto-notified in PR comments & Slack: #agent-lab-ops.
