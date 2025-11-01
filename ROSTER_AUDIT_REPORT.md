# Dream Team Roster Audit Report
**Date:** November 1, 2025  
**Cross-reference:** Master CSV vs. Database

## Summary

- **Master CSV Total:** 35 roles
- **Database Total:** 32 roles
- **Missing from DB:** 8 roles
- **Extra in DB (not in CSV):** 5 roles
- **Incomplete in DB:** 1 role

---

## ❌ MISSING FROM DATABASE (In CSV but not in DB)

These 8 roles from the master CSV are NOT in the database:

| Handle | Role/Title | Primary Pod(s) | Contact |
|--------|------------|----------------|---------|
| **Sparkster** | Creative Director & Brand Voice | Brand & Marketing | @Sparkster |
| **ChieSan** | Cultural & Experiential Guidance (EN/JA) | Brand & Marketing | @ChieSan |
| **River** | Product Narrator / Comms | Brand & Marketing, IP/Patent | @River |
| **Navi** | Operations | Operating Rhythm, Intake & Routing | @Navi |
| **Patent Search Specialist** | Prior-art & Landscape | IP/Patent Program | @PatentSearch |
| **Technical Claims Co-Author** | Claims Drafting (Tech) | IP/Patent Program | @ClaimsTech |
| **Evidence Curator** | Evidence Logging | IP/Patent Program | @Evidence |
| **International Counsel (EU/JP)** | National-phase Advisory | IP/Patent Program | @IntlCounsel |

**Note:** "Evidence Curator" may be a duplicate/variant of "Archivist" (which IS in DB as "Evidence Curator")

---

## ⚠️ EXTRA IN DATABASE (Not in CSV)

These 5 roles are in the database but NOT in the master CSV:

| Handle | Title | Pod | Notes |
|--------|-------|-----|-------|
| **Amani** | SMB Partnerships & Ecosystem | Finance & BizOps | Has full data (icon, strengths, collaborators) |
| **Avery Marlowe** | Medical Investigator & Evidence Synthesist | Security & Compliance | Has full data |
| **Dr. Rowan Vagus** | Autonomic Nervous System Specialist (MD) | Security & Compliance | Has full data |
| **English Lyricist** | Poetic English (Stage) | Marketing & Comms | Has full data |
| **English Poet** | Poetic English (Stage) | Marketing & Comms | Has full data |

---

## 🔧 INCOMPLETE DATA IN DATABASE

| Handle | Issue | Missing Fields |
|--------|-------|----------------|
| **Conductor** | Missing metadata | ❌ icon<br>❌ strengths (empty array)<br>❌ collaborators (empty array) |

---

## ✅ ROLES WITH COMPLETE DATA (27 roles)

All other roles in the database have complete metadata including:
- Icon
- Pod
- Pod Color
- Strengths (array)
- Collaborators (array)
- Contact
- Purpose, Core Functions, Responsibilities, Definition of Done

**Verified Complete:**
- OS, Prism, Lume, Nova, Storybloom, Echo, Ledger, Forge, LexiCode, CodeBlock, App Development Guru, Sentinel, Aegis, Atlas, Praetor, Coda, Pulse, Verifier, Bridge, Archivist, Beacon, Patent Illustrator, IP Paralegal/Docketing, Izumi Takahashi, Kaoru Arai, Foundry, Amani

---

## 📊 POD DISTRIBUTION ANALYSIS

### From CSV (35 roles):
- **Brand & Marketing**: 8 roles (OS appears in multiple pods)
- **Product & Platform**: 8 roles
- **IP/Patent Program**: 9 roles
- **Risk, Security & Compliance**: 4 roles
- **Finance & BizOps**: 2 roles
- **Operating Rhythm**: 2 roles (Navi, OS)
- **Intake & Routing**: 1 role (Navi)

### From Database (32 roles):
- **Product & Engineering**: 10 roles
- **Marketing & Comms**: 9 roles
- **IP & Patent Program**: 6 roles
- **Security & Compliance**: 5 roles
- **Finance & BizOps**: 2 roles

---

## 🔄 POD NAME DISCREPANCIES

The CSV uses different pod naming conventions than the database:

| CSV Pod Name | Database Pod Name |
|--------------|-------------------|
| Brand & Marketing | Brand & Assets / Marketing & Comms |
| Product & Platform | Product & Engineering |
| Risk, Security & Compliance | Security & Compliance |
| Operating Rhythm | *(not a pod in DB)* |
| Intake & Routing | *(not a pod in DB)* |

---

## 🎯 RECOMMENDED ACTIONS

### Priority 1: Add Missing Roles
Create database entries for the 8 missing roles:
1. Sparkster (with icon, strengths, collaborators)
2. ChieSan (with icon, strengths, collaborators)
3. River (with icon, strengths, collaborators)
4. Navi (with icon, strengths, collaborators)
5. Patent Search Specialist (with icon, strengths, collaborators)
6. Technical Claims Co-Author (with icon, strengths, collaborators)
7. International Counsel (EU/JP) (with icon, strengths, collaborators)

**Note:** Verify if "Evidence Curator" is different from "Archivist" before adding.

### Priority 2: Complete Conductor Data
Add missing fields for Conductor:
- Icon (suggest: 🎼 or 🎵 or 🎯)
- Strengths array
- Collaborators array

### Priority 3: Reconcile Extra Roles
Decide whether to:
- **Keep** Amani, Avery Marlowe, Dr. Rowan Vagus, English Lyricist, English Poet (they have complete data)
- **Add** them to the master CSV
- **Remove** them from database if not part of official roster

### Priority 4: Standardize Pod Names
Choose one naming convention:
- Either update CSV to match DB pod names
- Or update DB to match CSV pod names
- Or create pod aliases/mappings

---

## 📋 FIELDS PRESENT IN DB BUT NOT IN CSV

The database schema includes these fields that the CSV doesn't have:
- **icon** (emoji) - Needs to be added for 8 new roles
- **pod_color** (hex code) - Can be auto-assigned based on pod
- **strengths** (array) - Needs to be defined for 8 new roles
- **collaborators** (array) - Needs to be defined for 8 new roles
- **core_functions** (array) - Available in old JSON
- **responsibilities** (array) - Available in old JSON
- **definition_of_done** (array) - Available in old JSON
- **tone_voice** (text) - Optional

The CSV has **Scope** field which could map to **purpose** in database.

---

## 🔍 DATA QUALITY NOTES

### Contact Handles
- CSV provides Twitter-style handles (e.g., @Sparkster, @ChieSan)
- Database `contact` field is mostly empty for existing roles
- **Action:** Populate contact field for all roles using CSV data

### Multi-Pod Assignments
Several roles in CSV span multiple pods:
- OS: "Control Tower, Operating Rhythm"
- River: "Brand & Marketing, IP/Patent"
- Navi: "Operating Rhythm, Intake & Routing"
- Conductor: "Operating Rhythm, Product & Platform"

**Current DB limitation:** `pod` field is single-value text, not array
**Options:**
1. Choose primary pod for each role
2. Extend schema to support multiple pods (jsonb array)
3. Store as comma-separated values in existing text field

---

## ✨ NEXT STEPS

1. **Clarify Source of Truth**: Is the CSV or the JSON the authoritative source?
2. **Add Missing 8 Roles**: Create full records with all metadata
3. **Complete Conductor**: Add icon, strengths, collaborators
4. **Populate Contact Fields**: Use CSV handles for all roles
5. **Resolve Pod Naming**: Standardize across CSV and DB
6. **Handle Multi-Pod Roles**: Decide on implementation strategy
