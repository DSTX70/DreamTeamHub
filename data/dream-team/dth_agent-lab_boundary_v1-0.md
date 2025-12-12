# Dream Team Hub — Agent Lab vs Dream Team Boundary Spec

**Canon Version:** v1.0  
**Effective Date:** 2025-12-12  
**Status:** Active

---

## 1. Overview

This document defines the clear boundary between **Agent Lab** (goal-based autonomous iteration) and **Agent Mode** (execution-only operations). This distinction governs all Dream Team Hub agent behaviors.

---

## 2. Agent Mode (System Capability)

### 2.1 Definition
Agent Mode is **execution-only**. It processes explicit instructions without planning, judgment, or iteration.

### 2.2 Characteristics
- **Autonomy Level:** L0 (Assist only)
- **Type:** `system_capability`
- **Behavior:** Follows instructions verbatim
- **Scope:** Single-task execution
- **No:** Planning, goal decomposition, or autonomous decision-making

### 2.3 Use Cases
- Direct command execution
- Predefined workflow steps
- Templated output generation
- Data transformation tasks

---

## 3. Agent Lab (Bounded Autonomy)

### 3.1 Definition
Agent Lab enables **goal-based iteration** within defined rails. Agents can plan, iterate, and adapt within constraints.

### 3.2 Eligibility Requirements
- **Type:** `dream_team`, `pod_role`, or `council` (NOT `system_capability`)
- **Autonomy:** L1 or higher (`L1`, `L2`, `L3`)
- **Constraints:** Must have defined scope and out-of-scope boundaries
- **Certification:** L2+ requires operator certification

### 3.3 Autonomy Levels

| Level | Name | Capability | Requirements |
|-------|------|------------|--------------|
| L0 | Assist | Information only | None |
| L1 | Suggest | Propose actions, await approval | OS grant |
| L2 | Act | Execute within rails | Certified operator |
| L3 | Decide | Autonomous within domain | OS approval + audit |

### 3.4 Agent Lab Rails
- Defined deliverables must exist
- Definition of Done must be specified
- Out-of-scope boundaries must be documented
- Escalation paths must be configured

---

## 4. Boundary Rules

### 4.1 Inclusion Criteria
An agent is **Agent Lab Eligible** when:
```
type !== "system_capability" AND autonomyMax >= "L1"
```

### 4.2 Exclusion Criteria
An agent is **Agent Mode Only** when:
```
type === "system_capability" OR autonomyMax === "L0"
```

### 4.3 Runtime Behavior
- Agent Lab runs require explicit goal and constraint definition
- Agent Mode runs require explicit instruction set
- Mixing modes is not permitted within a single run

---

## 5. Governance

- Boundary spec changes require OS Council approval
- All autonomy upgrades require audit trail
- Agent Lab runs generate execution logs
- Constraint violations trigger escalation to Pod Lead
