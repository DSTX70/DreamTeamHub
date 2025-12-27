Confidential and proprietary and copyright Dustin Sparks 2025

# Decision Log (Heritage)
This log captures durable decisions that must carry forward across threads, releases, and UI iterations.

## Format
**Decision ID:** DTH-YYYYMMDD-###  
**Date:** YYYY-MM-DD  
**Status:** Proposed | Locked | Deprecated  
**Decision:** (one sentence)  
**Rationale:** (why)  
**Scope:** (where it applies)  
**Impacts:** (what it changes)  
**References:** (Work Items, PRs, links)

---

## Seed Entries
**Decision ID:** DTH-20251226-001  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Work Orders are templates/runbooks; Work Items are active execution with Cast + Target Context.  
**Rationale:** Prevents template pages from being mistaken as "active work."  
**Scope:** IA, routing, UI labels, deep links.  
**Impacts:** "Work" surfaces Work Items; Work Orders live under Templates.  
**References:** HeritagePack.v1.0.md
