# Pilot G — Milestone 1 (Draft) Wiring Note
Confidential and proprietary and copyright Dustin Sparks 2025

You now have:
- server/routes/workItemActions/draftIntentStrategy.ts (exports postDraftIntentStrategy)

Wire it where other Work Item actions are mounted:
POST /api/work-items/:id/actions/draftIntentStrategy -> postDraftIntentStrategy

Body:
{
  "taskText": "Natural language description of the bug/task",
  "repoHint": "GigsterGarage",
  "title": "Optional title"
}

Returns:
{
  ok: true,
  repo,
  intentBlock,
  strategyBlock,
  evidenceRequest,
  fileFetchPaths,
  meta
}
