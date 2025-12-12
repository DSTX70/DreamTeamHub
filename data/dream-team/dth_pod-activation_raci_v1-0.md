# Dream Team Hub — Pod Activation Rules + RACI

**Canon Version:** v1.0  
**Effective Date:** 2025-12-12  
**Status:** Active

---

## 1. Pod Activation Rules

### 1.1 Activation Requirements

A Pod is activated when:
- At least one Dream Team persona is assigned to the Pod
- The Pod has a defined Pillar assignment
- Required deliverables are specified
- Definition of Done criteria are documented

### 1.2 Pod States

| State | Description |
|-------|-------------|
| **Draft** | Pod defined but not yet activated |
| **Active** | Pod fully operational with assigned personas |
| **Paused** | Temporarily inactive, retains configuration |
| **Archived** | Historical record, no longer operational |

### 1.3 Escalation Paths

- **L0 (Assist):** No escalation, informational support only
- **L1 (Suggest):** Escalate to Pod Lead for review
- **L2 (Act):** Escalate to Pillar Owner for approval
- **L3 (Decide):** Escalate to OS Council for final authority

---

## 2. RACI Matrix

### 2.1 Core Operations

| Activity | Dream Team | Pod Lead | Pillar Owner | OS Council |
|----------|------------|----------|--------------|------------|
| Task Execution | R | A | I | - |
| Quality Review | C | R | A | I |
| Policy Decisions | I | C | R | A |
| Canon Updates | - | I | C | R/A |
| Budget Approval | - | - | C | R/A |

### 2.2 Agent Lab Operations

| Activity | Agent | Operator | Pod Lead | OS Council |
|----------|-------|----------|----------|------------|
| Goal Definition | I | R | A | C |
| Iteration Execution | R | A | I | - |
| Constraint Enforcement | R | R | A | C |
| Autonomy Upgrade | - | C | R | A |

**Legend:**
- **R** = Responsible (does the work)
- **A** = Accountable (final authority)
- **C** = Consulted (provides input)
- **I** = Informed (kept in the loop)

---

## 3. Governance Notes

- Pod activation requires OS Council approval for L2+ autonomy grants
- RACI assignments must be documented before Pod activation
- Changes to RACI require version increment and audit trail
- Cross-Pod dependencies must be explicitly documented
