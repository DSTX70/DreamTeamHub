Here’s a paste-ready **README snippet** you can drop at `DreamTeamHub/Agent-Lab/README.md` (or in your repo root if you prefer). It captures everything we’ve added since the `dreamteamhub_agent_lab_bundle` handoff, plus clear Replit + GitHub setup steps.

---

# Agent Lab — Runtime, CI, Deploy & Scheduling (Quick Start)

This document explains how to run the Agent Lab inside **Dream Team Hub (Canonical)**, including role imports, promotions flow, dashboards, calendar scheduling, and Replit deploys.

## 0) Repo Layout (canonical)

```
DreamTeamHub/Agent-Lab/
  00_Canonical/
    TEAM_CHARTER.md
    POLICY_LOCKS.md
    agentic_ai_playbook_v1.md
    agent_lab_training_center_proposal.md
    agent_lab_linked_sources_pack.md
    DECISIONS.md
    roles/
      *.json                     # role cards (with display_name)
      roles_manifest.jsonl       # auto-regenerated
      senior_adviser_roles_pack.md
      optional_roles_import_pack.md
  10_Specs/                      # agent.spec.json per agent
  20_Experiments/                # experiments & evidence pointers
  30_EvidencePacks/              # logs/traces/screens
  40_Playbooks/
    promotion_request_template.md
    kpi_tracker_template.csv
    intake_form_template.json
    portfolio_scoring_rubric.csv
    portfolio_scoring_sheet_template.csv
    wip_kanban_policy.md
    promotion_board_sla_autoscheduler.md
    app_automation_checklist.md
    governance_metrics_weekly_template.csv
    labels_guide.md
  50_Reports/
    bu_capability_matrix.csv
  academy/                       # Academy dashboard (static)
    index.html  styles.css  app.js  agents.sample.json
  calendar-viewer/               # Calendar Viewer v2 (static)
    index.html  styles.css  app.js
  ci/                            # GitHub Actions (workflows)
    dth_import_roles.yml
    academy_deploy.yml
    deploy_calendar_viewer.yml
    promotion_autoscheduler.yml
    kpi_weekly.yml
  importers/
    dth_import_roles.js
    dth_import_roles.py
    README.md  .env.sample
  tools/
    regenerate_roles_manifest.py
    regenerate_roles_manifest.js
    seed_labels.js
```

## 1) One-time Setup

### 1.1 GitHub Secrets

Add the following repo **secrets**:

* `DTH_API_BASE` and `DTH_API_TOKEN` (role importers)
* `CALENDAR_WEBHOOK_URL` (Cloudflare Worker or Vercel calendar endpoint)
* `CALENDAR_VIEW_URL` (deployed Calendar Viewer base URL, e.g. `https://<org>.github.io/<repo>/DreamTeamHub/Agent-Lab/calendar-viewer/`)
* *(optional for Replit deploys)* `REPLIT_WEBHOOK_URL`, `REPLIT_WEBHOOK_TOKEN`

### 1.2 GitHub Pages

* Enable **Settings → Pages → Build & deployment → GitHub Actions**.

### 1.3 Labels

Seed labels (priority/gate/level/status/stage) so KPIs & boards work:

```bash
export GITHUB_TOKEN=… 
export REPO=owner/repo
node DreamTeamHub/Agent-Lab/tools/seed_labels.js
```

### 1.4 Pre-commit Hook (keep manifest fresh)

```bash
chmod +x DreamTeamHub/Agent-Lab/ci/pre-commit
ln -sf ../../DreamTeamHub/Agent-Lab/ci/pre-commit .git/hooks/pre-commit
```

## 2) CI/CD Workflows (What they do)

### Roles Import & Bundle

`ci/dth_import_roles.yml`

* **PRs:** runs **dry-run** and comments a summary (Created/Updated/Failed/Validated) + artifacts.
* **Push:** imports roles via DTH API (create/update) and uploads a ZIP of `DreamTeamHub/Agent-Lab/`.
* **Built-ins:** manifest **auto-regeneration**, PR **summary comment**, artifacts (`agent_lab_bundle_*`, `importer.log`).

### Academy Dashboard Deploy

* `ci/academy_deploy.yml` → **GitHub Pages** deploy on changes to `academy/**`
* Also supports **Replit** via `workflow_dispatch` with `target=replit` (uses `REPLIT_WEBHOOK_*` secrets).

### Calendar Viewer Deploy

* `ci/deploy_calendar_viewer.yml` → **GitHub Pages** deploy on changes to `calendar-viewer/**`
* Set the Pages URL as `CALENDAR_VIEW_URL` secret to wire PR links.

### Promotion Auto-Scheduler

* `ci/promotion_autoscheduler.yml`:

  1. Detects **Promotion PRs** (title `Promotion: <agent> Lx → Ly` or a “promotion” label)
  2. Auto-computes next Tue–Thu **10:00 Phoenix (~17:00Z)** within **3 business days**
  3. **POSTs** to `CALENDAR_WEBHOOK_URL` (your Worker or Vercel function)
  4. Comments with:

     * scheduled time
     * **Calendar Viewer link** (uses `CALENDAR_VIEW_URL` + `agent`, `when`, **`pr`**)
     * a **badge** → *Open in Calendar Viewer*
  5. Warns if `CALENDAR_VIEW_URL` missing

### Weekly KPI Bot

* `ci/kpi_weekly.yml`: Every **Monday** posts a KPI issue

  * Reads `40_Playbooks/governance_metrics_weekly_template.csv` (latest row)
  * Counts **WIP** via labels: `stage:ready`, `stage:in-progress`, `stage:review`, `stage:promotion-board`, `stage:deploy-watch`

## 3) Replit: How to Deploy & Update

### 3.1 Academy Dashboard (static)

Option A — GitHub Pages: push to `academy/**` and the action deploys.
Option B — Replit webhook:

* Trigger `ci/academy_deploy.yml` via **Run workflow** with `target=replit`
* Secrets needed: `REPLIT_WEBHOOK_URL`, `REPLIT_WEBHOOK_TOKEN`
* Or just download `[academy_landing_bundle.zip]` and upload into Replit as a static site.

### 3.2 Calendar Viewer (static)

* Push to `calendar-viewer/**` → auto-deploy to Pages via `ci/deploy_calendar_viewer.yml`.
* Copy the Pages URL and set `CALENDAR_VIEW_URL` secret so Promotion PR comments include a working **viewer link** (with `agent`, `when`, `pr`).

## 4) Promotion Flow (End-to-End)

1. Author `promotion_request_template.md` (or PR template auto-fills).
2. Open a PR titled `Promotion: <agent-name> Lx → Ly`.
3. CI validates **Gate-1..4** (Safety/Perf/Cost/Audit) from evidence packs + KPI CSV.
4. Auto-Scheduler schedules a slot and posts PR comment with:

   * When (UTC), Agent
   * **[Open event]** link + **Calendar Viewer badge**
5. Calendar webhook sends `.ics` invite to mailing list.
6. Board meets (SLA **3 business days**). Decision posted + spec updated.
7. Post-promotion **2-week watch** phase (rollback on critical).

## 5) Policy Locks (we’re serious)

* **Weekly Portfolio Review** (30–45m): Sage, Stratēga, Helm, Ledger
* **WIP limits**: see `wip_kanban_policy.md` (adjust quarterly)
* **Promotion SLA**: 3 business days (auto-schedule + OS escalation)
* **APP CI gates**: **no manual bypass**
* **Governance roll-ups**: every **Monday** (auto-posted)

## 6) Quick Verification Checklist

* [ ] Pages enabled + `CALENDAR_VIEW_URL` set to your viewer URL
* [ ] `CALENDAR_WEBHOOK_URL` (Cloudflare Worker or Vercel function) configured
* [ ] Labels seeded (`priority:*`, `gate:*`, `level:*`, `status:*`, `stage:*`)
* [ ] Role importer dry-run passes on PRs; live import on merge
* [ ] Academy & Viewer deploy on change
* [ ] KPI bot posts on Monday
* [ ] Pre-commit hook installed (manifest stays fresh)

---

### References (drop-in files)

* Workflows: `ci/dth_import_roles.yml`, `ci/academy_deploy.yml`, `ci/deploy_calendar_viewer.yml`, `ci/promotion_autoscheduler.yml`, `ci/kpi_weekly.yml`
* Importers: `importers/dth_import_roles.[js|py]`
* Calendar stubs (Cloudflare/Vercel): see **promotion_calendar_webhook_stubs.zip** (deploy separately)
* Viewer v2 (brand-aligned): `calendar-viewer/` (Pages deploy)
* Academy static site: `academy/` (Pages or Replit webhook)

---

**Operator tip:** If anything fails, check the **PR comment** (summary table & badge) and the **Actions logs**—all run artifacts (bundle ZIP, importer.log) are attached per run.
