# RUNBOOK INDEX

Central index for Ops runbooks and references. Keep this file updated as new runbooks are added.

## Core Runbooks
- [Health Probes](./ops_runbooks.md#1-health-probes)
- [Deploy Markers](./ops_runbooks.md#2-deploy-markers)
- [Ops Logs (SSE/REST/CSV)](./ops_runbooks.md#3-ops-logs)
- [LLM Presets & Augment](./ops_runbooks.md#4-llm-presets--augment)
- [RBAC & Rate Limits](./ops_runbooks.md#5-rbac--rate-limits)

## References
- [Environment Matrix](./env_matrix.md)
- Alerting Templates: see `alert_tuning.yml`

## Quick Links
- Readiness: `GET /api/healthz`
- Liveness:  `GET /api/healthz/livez`
- Metrics:   `GET /metrics`
- Logs SSE:  `GET /api/ops/logs/stream`
- Logs REST: `GET /api/ops/logs/rest?since=15m`
- Presets DB: `GET/POST /api/llm/presets-db`
- Augment:   `POST /api/llm/augment`

> Tip: bookmark this page in GitHub so the team can jump straight to the right runbook during incidents.
