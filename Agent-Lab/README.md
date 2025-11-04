# Agent Lab - Role Card Importers

This directory contains tools and importers for managing Dream Team Hub role cards from the Agent Lab collection.

## Directory Structure

```
Agent-Lab/
├── 00_Canonical/
│   └── roles/              # Role card JSON files and manifest
│       ├── *.json          # Individual role card files
│       └── roles_manifest.jsonl  # Bulk manifest of all roles
├── importers/
│   └── dth_import_roles.js # Node.js importer for upsert operations
└── tools/
    ├── regenerate_roles_manifest.js  # Node.js manifest regenerator
    └── regenerate_roles_manifest.py  # Python manifest regenerator
```

## Environment Setup

Set the following environment variables (in Replit Secrets or your shell):

```bash
export DTH_API_BASE="https://your-dth.replit.app/api"
export DTH_API_TOKEN="your_api_token_here"
```

**Security Note**: The `DTH_API_TOKEN` should be kept secret and never committed to version control. In GitHub Actions, add it as a repository secret.

## Manifest File Format

The manifest file `00_Canonical/roles/roles_manifest.jsonl` contains one JSON entry per line:

```jsonl
{"key":"agentic_ai_master","title":"Agentic AI Master — Senior Adviser (Global)","short_title":"Agentic AI Master","autonomy_level":"Advisory","path":"/Agent-Lab/00_Canonical/roles/agentic_ai_master.json","effective_date":"2025-11-03"}
```

## Usage

### Importing Roles

**Dry-run mode** (preview changes without applying):
```bash
cd Agent-Lab
node importers/dth_import_roles.js --manifest 00_Canonical/roles/roles_manifest.jsonl --category "Agent Lab / Added Specialists" --dry-run
```

**Live import**:
```bash
cd Agent-Lab
node importers/dth_import_roles.js --manifest 00_Canonical/roles/roles_manifest.jsonl --category "Agent Lab / Added Specialists"
```

### Regenerating Manifest

After adding or updating role JSON files, regenerate the manifest:

**Node.js**:
```bash
cd Agent-Lab
node tools/regenerate_roles_manifest.js
```

**Python**:
```bash
cd Agent-Lab
python3 tools/regenerate_roles_manifest.py
```

## Importer Behavior

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

## GitHub Actions Integration

The workflow `.github/workflows/dth_import_roles.yml` automatically:

- Triggers on changes to role files or manifest
- Regenerates manifest before import
- Runs in **dry-run mode** for pull requests
- Runs **live import** for pushes to main branch
- Generates summary reports and artifacts

### Required GitHub Secrets

Add these to your repository secrets:

- `DTH_API_BASE` - Base URL of your DTH API (e.g., `https://your-dth.replit.app/api`)
- `DTH_API_TOKEN` - API authentication token

## Pre-commit Hook

The Husky pre-commit hook (`.husky/pre-commit`) automatically:

1. Regenerates the manifest when role files are changed
2. Stages the updated manifest for commit
3. Ensures manifest is always in sync with role files

To enable Husky hooks, install Husky in your repository:

```bash
npm install husky --save-dev
npx husky install
```

## API Endpoints

The importer uses these DTH API endpoints:

- `GET /api/roles/by-handle/:handle` - Fetch role by handle/key
- `POST /api/roles` - Create new role
- `PUT /api/roles/by-handle/:handle` - Update existing role

**Authentication**: Bearer token via `Authorization: Bearer <token>` header

## Troubleshooting

### "Role JSON not found" error

Ensure the `path` in the manifest file correctly points to the JSON file. The importer tries multiple path resolutions:

- Relative to manifest directory
- Absolute from project root
- With leading `/` removed

### "Missing environment variables" error

Set `DTH_API_BASE` and `DTH_API_TOKEN` before running the importer.

### Import failures

Check the importer log for specific error messages. Common issues:

- Invalid JSON in role files
- Missing required fields (key, title, etc.)
- Network connectivity to DTH API
- Invalid API token

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

## Import Status

As of November 2025, **13 Agent Lab roles** have been successfully imported:

**Senior Advisers (2)**:
- `agentic_ai_master` - Agentic AI Master
- `master_agentic_ai_strategist` - Master Agentic AI Strategist

**Added Specialists (11)**:
- `cost_controller` - Cost Controller
- `data_curator` - Data Curator
- `evaluation_architect` - Evaluation Architect
- `experiment_designer` - Experiment Designer
- `master_agentic_ai_advancement_officer` - Master Agentic AI Advancement Officer
- `memory_architect` - Memory Architect
- `prompt_policy_systems_engineer` - Prompt Policy & Systems Engineer
- `reliability_sre_agentops` - Reliability SRE/AgentOps
- `safety_red_team_lead` - Safety Red Team Lead
- `telemetry_tracing_lead` - Telemetry & Tracing Lead
- `tooling_steward` - Tooling Steward

All roles are categorized as **"Agent Lab / Senior Advisers + Added Specialists"** in the DTH database.

## License

Part of the Dream Team Hub by i³ collective.
