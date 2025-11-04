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

The importer implements **upsert logic**:

1. **GET** `/api/roles/by-handle/{key}` to check if role exists
2. If **404** (not found): **POST** `/api/roles` to create
3. If **200** (found): **PUT** `/api/roles/by-handle/{key}` to update
4. Each payload includes the `category` field specified via `--category`

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

```json
{
  "key": "agentic_ai_master",
  "title": "Agentic AI Master — Senior Adviser (Global)",
  "short_title": "Agentic AI Master",
  "autonomy_level": "Advisory",
  "category": "Agent Lab / Added Specialists",
  "handle": "agentic_ai_master",
  "pod": "Innovation",
  "purpose": "...",
  "coreFunctions": [...],
  "responsibilities": [...],
  "effective_date": "2025-11-03"
}
```

## License

Part of the Dream Team Hub by i³ collective.
