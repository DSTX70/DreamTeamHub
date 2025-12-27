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

---

**Decision ID:** DTH-20251226-002  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** IP work runs on a defined operating system with explicit roles/gates (Aegis/Atlas/Archivist/Sentinel/Praetor/Coda).  
**Rationale:** Prevents quality drift; enforces evidence-grade, disclosure-safe outputs.  
**Scope:** Portfolio-wide IP/Compliance execution.  
**Impacts:** Standard handoffs + gates + artifacts across filings.  
**References:** EVID-0004

---

**Decision ID:** DTH-20251226-003  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Maintain a Claim↔Spec↔Figure↔Evidence matrix for filing readiness and defensibility.  
**Rationale:** Ensures coverage; makes gaps visible early.  
**Scope:** Patents and continuation planning.  
**Impacts:** Traceability discipline required for "green" status.  
**References:** EVID-0005

---

**Decision ID:** DTH-20251226-004  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Prefer additive-only, adapter-first, feature-flag staged Patch-Kits for shipping changes.  
**Rationale:** Minimizes regressions and supports staged rollout/rollback.  
**Scope:** Engineering delivery across repos.  
**Impacts:** Patch drops follow controlled rollout discipline.  
**References:** EVID-0006

---

**Decision ID:** DTH-20251226-005  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Patch drops must use FILE/END_FILE discipline; malformed drops are blocked early.  
**Rationale:** Deterministic application + higher automation trust.  
**Scope:** Shipping/apply pipelines.  
**Impacts:** Preflight validation and formatting enforcement.  
**References:** EVID-0007

---

**Decision ID:** DTH-20251226-006  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** JP↔EN translation uses three-pass governance (Translator → Cultural Review → Dramaturg) with sign-off rules.  
**Rationale:** Protects nuance and stage readability; prevents late rework.  
**Scope:** Parallax Translate + dramaturgy outputs.  
**Impacts:** Publish readiness requires cultural review where required.  
**References:** EVID-0008
