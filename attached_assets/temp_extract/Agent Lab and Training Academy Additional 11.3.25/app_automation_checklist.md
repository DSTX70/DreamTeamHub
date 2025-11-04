# Accelerated Promotion Program (APP) — Automation Checklist
_Date: 2025-11-03_

## Pre‑flight Validation (CI)
- Validate `promotion_request_template.md` fields & evidence links exist.
- Check KPIs ≥ thresholds for two latest runs (parse KPIs CSV).
- Verify **Gate‑1..4** statuses are green (Safety/Performance/Cost/Audit).
- Block merge if any fail; add PR summary comment with missing items.

## Importers & Bots
- **Role importers:** keep role registry up to date.
- **KPI bot:** posts weekly KPIs and R/A/G status to the thread.
- **Promotion board bot:** schedules review, posts outcomes, updates Decision Log.

## Templates
- PR template: “Promotion Request” checklist (auto‑generated from `promotion_request_template.md`).
- Issue template: “Intake Request” using `intake_form_template.json` fields.
- Labels: `priority:P0..P2`, `level:L0..L3`, `gate:1..4`, `status:pilot/live/watch`.

## Dashboards
- Backlog → Ready → In Progress → Review → Promotion → Watch (lead time & WIP heatmap).
- Promotion board SLA timer; incidents post‑promotion.

