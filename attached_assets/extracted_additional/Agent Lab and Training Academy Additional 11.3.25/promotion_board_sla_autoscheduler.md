# Promotion Board — SLA & Auto-Scheduler
_Date: 2025-11-03_

**SLA:** Decision within **3 business days** of submission.  
**Window:** Tue–Thu 10:00–14:00 local, or next available slot.

## Auto-Scheduler Logic
1. On PR/Action event: if `promotion_request_template.md` is updated and checks are green, emit a webhook `{
   "agent":"<name>","level_from":"Lx","level_to":"Ly","evidence":["<A>","<B>"],"owner":"<Helm>"
}`.
2. Scheduler picks the earliest slot where **Helm, Sentinel, Pulse, Verifier, Ascend** are available (fallback quorum = 3/5 with Sentinel required). 
3. Create calendar invite, attach the request & KPIs snapshot, and post a PR comment: “Scheduled for <DATE/TIME> (Quorum X/5).”
4. If no slot within 3 days → auto-escalate to OS; create emergency hold.

## Escalations
- If Sentinel declines Gate-1, the request auto-moves back to **Review (Gates)** with reasons required.

## Artifacts
- Calendar invite (ics), PR comment, Decision Log update, updated `agent.spec.json` on approval.
