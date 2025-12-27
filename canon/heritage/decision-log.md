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

---

**Decision ID:** DTH-20251226-007  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Enforce Brand Lock Governance ("no unapproved variants") via canonical assets/specs + explicit change control.  
**Rationale:** Prevents drift and preserves quality across brands and lines.  
**Scope:** All brands/collections and public-facing outputs.  
**Impacts:** If not in canon, it's not approved; blockers must be listed (not invented).  
**References:** EVID-0009

---

**Decision ID:** DTH-20251226-008  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** dreamshitter.com must keep full-name visibility and on-model mascot governance; accent colors are controlled and sparse.  
**Rationale:** Protects recognizability and prevents off-model drift.  
**Scope:** dreamshitter.com branding, packaging, merch, copy.  
**Impacts:** Mandatory dreamshitter.com visibility; approved Crumbles references only; accents sparing.  
**References:** EVID-0010

---

**Decision ID:** DTH-20251226-009  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** Fab Card Co is a parent brand system with locked collections; each collection follows its style board and template rules.  
**Rationale:** Prevents cross-line blending and maintains premium consistency.  
**Scope:** Fab Card Co + all collections.  
**Impacts:** Collection identity cannot be improvised; templates are canonical.  
**References:** EVID-0011

---

**Decision ID:** DTH-20251226-010  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** fabulousAF™ uses the approved logo + tagline lockup system across all uses; no invented lockups.  
**Rationale:** Maintains recognition and brand authority.  
**Scope:** fabulousAF™ merch/web/campaign assets.  
**Impacts:** Lockup is canonical; only approved derivatives allowed.  
**References:** EVID-0012

---

**Decision ID:** DTH-20251226-011  
**Date:** 2025-12-26  
**Status:** Locked  
**Decision:** The Fabulous Brand Company governance rules apply portfolio-wide; FabulousGram is a channel wrapper that cannot override originating brand locks.  
**Rationale:** Prevents channel templates from causing brand drift.  
**Scope:** TFBC governance + FabulousGram distribution assets.  
**Impacts:** Channel templates must derive from canon; preserve originating voice/palette/typography.  
**References:** EVID-0013
