# Agent Lab — Runtime, CI, Deploy & Scheduling

This directory contains the **Agentic AI Lab & Training Academy** infrastructure for Dream Team Hub, including role imports, promotion workflow, dashboards, calendar scheduling, and CI/CD automation.

## Directory Structure

```
Agent-Lab/
├── 00_Canonical/
│   ├── roles/                  # Role card JSON files
│   │   ├── *.json             # Individual role cards (with display_name)
│   │   └── roles_manifest.jsonl  # Auto-regenerated manifest
│   └── POLICY_LOCKS.md        # Governance policy locks
├── 40_Playbooks/              # Templates and policies
│   ├── promotion_request_template.md
│   ├── app_automation_checklist.md
│   ├── wip_kanban_policy.md
│   ├── promotion_board_sla_autoscheduler.md
│   ├── governance_metrics_weekly_template.csv
│   ├── portfolio_scoring_rubric.csv
│   ├── portfolio_scoring_sheet_template.csv
│   ├── intake_form_template.json
│   └── labels_guide.md
├── academy/                   # Academy Dashboard (static)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── agents.sample.json
├── calendar-viewer/          # Calendar Viewer v2 (static)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── ci/                       # GitHub Actions workflows
│   ├── academy_deploy.yml
│   ├── deploy_calendar_viewer.yml
│   ├── promotion_autoscheduler.yml
│   └── kpi_weekly.yml
├── importers/
│   └── dth_import_roles.js   # Node.js importer for upsert operations
└── tools/
    ├── regenerate_roles_manifest.js  # Node.js manifest regenerator
    ├── regenerate_roles_manifest.py  # Python manifest regenerator
    └── seed_labels.js                # GitHub labels seeder
```

## 1) One-time Setup

### 1.1 GitHub Secrets

Add the following repository **secrets** (Settings → Secrets and variables → Actions):

* `DTH_API_BASE` - Base URL for DTH API (e.g., `https://your-dth.replit.app/api`)
* `DTH_API_TOKEN` - API authentication token
* `CALENDAR_WEBHOOK_URL` - Cloudflare Worker or Vercel calendar endpoint (optional)
* `CALENDAR_VIEW_URL` - Deployed Calendar Viewer base URL (optional)
* `REPLIT_WEBHOOK_URL`, `REPLIT_WEBHOOK_TOKEN` - For Replit deploys (optional)

**Security Note**: The `DTH_API_TOKEN` should be kept secret and never committed to version control.

### 1.2 GitHub Pages (Optional)

* Enable **Settings → Pages → Build & deployment → GitHub Actions**
* This allows the Academy and Calendar Viewer to be deployed to GitHub Pages

### 1.3 Labels (Optional for Promotion Flow)

Seed labels (priority/gate/level/status/stage) so KPIs & boards work:

```bash
export GITHUB_TOKEN=your_github_token
export REPO=owner/repo
node Agent-Lab/tools/seed_labels.js
```

### 1.4 Pre-commit Hook (Optional)

Keep manifest fresh by auto-regenerating on commit:

```bash
chmod +x Agent-Lab/ci/pre-commit
ln -sf ../../Agent-Lab/ci/pre-commit .git/hooks/pre-commit
```

## 2) Role Card Importers

### Importing Roles

**Dry-run mode** (preview changes without applying):
```bash
cd Agent-Lab
node importers/dth_import_roles.js --manifest 00_Canonical/roles/roles_manifest.jsonl --category "Agent Lab / Senior Advisers + Added Specialists" --dry-run
```

**Live import**:
```bash
cd Agent-Lab
export DTH_API_BASE="http://0.0.0.0:5000/api"
export DTH_API_TOKEN="your_token"
node importers/dth_import_roles.js --manifest 00_Canonical/roles/roles_manifest.jsonl --category "Agent Lab / Senior Advisers + Added Specialists"
```

### Regenerating Manifest

After adding or updating role JSON files:

```bash
cd Agent-Lab
node tools/regenerate_roles_manifest.js
```

### Importer Behavior

The importer implements **upsert logic** with automatic field transformation:

1. **GET** `/api/roles/by-handle/{key}` to check if role exists
2. If **404** (not found): **POST** `/api/roles` to create
3. If **200** (found): **PUT** `/api/roles/by-handle/{key}` to update
4. Each payload includes the `category` field specified via `--category`

### Field Transformation Mapping

The importer automatically transforms Agent Lab role card fields to match the DTH schema:

| Agent Lab Field | DTH Field | Notes |
|----------------|-----------|-------|
| `key` | `handle` | Unique identifier |
| `title` or `display_name` | `title` | Role title |
| `interfaces.reports_to` | `pod` | Organizational pod |
| `purpose` | `purpose` | Role purpose |
| `deliverables` | `coreFunctions` | Core functions array |
| `responsibilities` | `responsibilities` | Responsibilities array |
| `autonomy_level` | `toneVoice` | Tone/voice description |
| `kpis` | `definitionOfDone` | Success criteria |
| `required_competencies` | `strengths` | Required skills |
| `interfaces.partners` | `collaborators` | Collaboration partners |
| `playbooks_refs` | `links` | Reference links |
| N/A | `podColor`, `icon`, `contact`, `tags` | Set to null/empty during import |

## 3) CI/CD Workflows

### Academy Dashboard Deploy

**File**: `ci/academy_deploy.yml`

* **GitHub Pages**: Auto-deploys on changes to `academy/**`
* **Replit**: Via `workflow_dispatch` with `target=replit` (uses `REPLIT_WEBHOOK_*` secrets)
* **Manual**: Download `academy_landing_bundle.zip` artifact and upload to Replit as static site

### Calendar Viewer Deploy

**File**: `ci/deploy_calendar_viewer.yml`

* **GitHub Pages**: Auto-deploys on changes to `calendar-viewer/**`
* Set the Pages URL as `CALENDAR_VIEW_URL` secret to wire PR links

### Promotion Auto-Scheduler

**File**: `ci/promotion_autoscheduler.yml`

1. Detects **Promotion PRs** (title `Promotion: <agent> Lx → Ly` or "promotion" label)
2. Auto-computes next Tue–Thu **10:00 Phoenix (~17:00Z)** within **3 business days**
3. **POSTs** to `CALENDAR_WEBHOOK_URL` (your Worker or Vercel function)
4. Comments with scheduled time, agent name, and **Calendar Viewer link**
5. Warns if `CALENDAR_VIEW_URL` missing

### Weekly KPI Bot

**File**: `ci/kpi_weekly.yml`

* Runs every **Monday**
* Posts a KPI issue with metrics from `governance_metrics_weekly_template.csv`
* Counts **WIP** via labels: `stage:ready`, `stage:in-progress`, `stage:review`, `stage:promotion-board`, `stage:deploy-watch`

## 4) Replit Deployment

### Academy Dashboard v3 (Static)

The Academy Dashboard provides a clean, scannable interface for monitoring agent status, KPIs, and promotion progress.

**Access in Dream Team Hub**: Navigate to `/Agent-Lab/academy/index.html`

**Key Features:**
* **Clean Grid Layout**: KPI-focused cards (no calendar widgets on main view)
* **Summary Metrics**: L0/L1/L2/L3 agent counts at-a-glance
* **Filter Controls**: By autonomy level, status, or name search
* **Agent Cards**: Level, status, next gate, progress bar, color-coded KPIs
  - Success: Green ≥80%, Yellow 70-79%, Red <70%
  - Latency p95: Green ≤5.0s, Yellow 5.0-6.0s, Red >6.0s
  - Cost: Green ≤$0.05, Yellow $0.05-0.06, Red >$0.06
* **"Next review" Chip**: Shows scheduled promotion review when available
* **Detail Modal**: Two-tab interface (Overview + Promotion)
  - Overview: KPI visualization, PR/evidence links
  - Promotion: Review time (UTC + local), Calendar Viewer link, .ics download

**Data Source**: `GET /agents/summary` API (public), fallback to `agents.sample.json`

**Deployment Options:**

**Option A** — GitHub Pages:
* Push to `academy/**` and the action auto-deploys
* View at `https://<org>.github.io/<repo>/Agent-Lab/academy/`

**Option B** — Replit webhook:
* Trigger `ci/academy_deploy.yml` via **Run workflow** with `target=replit`
* Secrets needed: `REPLIT_WEBHOOK_URL`, `REPLIT_WEBHOOK_TOKEN`

**Option C** — Manual:
* Download `academy/` directory
* Upload to Replit as static site

### Calendar Viewer (Static)

* Push to `calendar-viewer/**` → auto-deploy to Pages
* Copy the Pages URL and set `CALENDAR_VIEW_URL` secret
* Promotion PR comments will include working viewer links with `agent`, `when`, `pr` parameters

## 5) Promotion Flow (End-to-End)

1. Author `promotion_request_template.md` (or PR template auto-fills)
2. Open a PR titled `Promotion: <agent-name> Lx → Ly`
3. CI validates **Gate-1..4** (Safety/Perf/Cost/Audit) from evidence packs + KPI CSV
4. Auto-Scheduler schedules a slot and posts PR comment with:
   * When (UTC), Agent
   * **Calendar Viewer** link + badge
5. Calendar webhook sends `.ics` invite to mailing list (if configured)
6. Board meets (SLA **3 business days**). Decision posted + spec updated
7. Post-promotion **2-week watch** phase (rollback on critical issues)

## 6) Policy Locks

From `00_Canonical/POLICY_LOCKS.md`:

* **Weekly Portfolio Review** (30–45m): Sage, Stratēga, Helm, Ledger
* **WIP limits**: See `40_Playbooks/wip_kanban_policy.md` (adjust quarterly)
* **Promotion SLA**: 3 business days (auto-schedule + OS escalation)
* **APP CI gates**: **No manual bypass** (Gate-1..4 must be green)
* **Governance roll-ups**: Every **Monday** (auto-posted)

## 7) API Endpoints

The importer uses these DTH API endpoints:

* `GET /api/roles/by-handle/:handle` - Fetch role by handle/key
* `POST /api/roles` - Create new role
* `PUT /api/roles/by-handle/:handle` - Update existing role
* `GET /api/roles?category=<category>` - List roles by category (with dual auth support)

**Authentication**: 
* Bearer token via `Authorization: Bearer <token>` header (for CI/CD)
* Session auth via Replit Auth (for manual testing)

## 8) Quick Verification Checklist

* [ ] `DTH_API_BASE` and `DTH_API_TOKEN` configured in Replit Secrets
* [ ] Pages enabled + `CALENDAR_VIEW_URL` set (optional)
* [ ] `CALENDAR_WEBHOOK_URL` configured (optional)
* [ ] Labels seeded via `seed_labels.js` (optional for promotion flow)
* [ ] Role importer dry-run passes
* [ ] Academy & Calendar Viewer deploy successfully (if using GitHub Pages)
* [ ] Pre-commit hook installed (optional)

## 9) Import Status

As of November 2025, **13 Agent Lab roles** have been successfully imported:

**Senior Advisers (2)**:
* `agentic_ai_master` - Agentic AI Master
* `master_agentic_ai_strategist` - Master Agentic AI Strategist

**Added Specialists (11)**:
* `cost_controller` - Cost Controller
* `data_curator` - Data Curator
* `evaluation_architect` - Evaluation Architect
* `experiment_designer` - Experiment Designer
* `master_agentic_ai_advancement_officer` - Master Agentic AI Advancement Officer
* `memory_architect` - Memory Architect
* `prompt_policy_systems_engineer` - Prompt Policy & Systems Engineer
* `reliability_sre_agentops` - Reliability SRE/AgentOps
* `safety_red_team_lead` - Safety Red Team Lead
* `telemetry_tracing_lead` - Telemetry & Tracing Lead
* `tooling_steward` - Tooling Steward

All roles categorized as **"Agent Lab / Senior Advisers + Added Specialists"** in the DTH database.

## 10) Troubleshooting

### "Role JSON not found" error

Ensure the `path` in the manifest file correctly points to the JSON file. The importer tries multiple path resolutions:
* Relative to manifest directory
* Absolute from project root
* With leading `/` removed

### "Missing environment variables" error

Set `DTH_API_BASE` and `DTH_API_TOKEN` before running the importer.

### Import failures

Check the importer log for specific error messages. Common issues:
* Invalid JSON in role files
* Missing required fields (key, title, etc.)
* Network connectivity to DTH API
* Invalid API token

### CI/CD failures

If anything fails, check:
* **PR comment** (summary table & badge for role imports)
* **Actions logs** in GitHub Actions tab
* **Artifacts** (bundle ZIP, importer.log) attached to each run

## Example Role Card Structure

**Agent Lab JSON Format** (source):
```json
{
  "key": "agentic_ai_master",
  "title": "Agentic AI Master — Senior Adviser (Global)",
  "autonomy_level": "Advisory",
  "purpose": "...",
  "deliverables": [...],
  "responsibilities": [...],
  "kpis": [...],
  "required_competencies": [...],
  "interfaces": {
    "reports_to": "OS (Sponsor)",
    "partners": [...]
  },
  "playbooks_refs": [...],
  "effective_date": "2025-11-03"
}
```

**DTH Format** (after transformation):
```json
{
  "handle": "agentic_ai_master",
  "title": "Agentic AI Master — Senior Adviser (Global)",
  "pod": "OS (Sponsor)",
  "purpose": "...",
  "coreFunctions": [...],
  "responsibilities": [...],
  "toneVoice": "Advisory",
  "definitionOfDone": [...],
  "strengths": [...],
  "collaborators": [...],
  "links": [...],
  "category": "Agent Lab / Senior Advisers + Added Specialists"
}
```

## License

Part of the Dream Team Hub by i³ collective.
