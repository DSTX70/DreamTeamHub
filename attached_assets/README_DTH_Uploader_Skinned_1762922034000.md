
# DTH Uploader — Skinned React Panels (shadcn/ui + Tailwind)

This drop skins the **Uploader Settings** and **Files Panel** using your Dream Team Hub design language (shadcn/ui + Tailwind). 
It assumes your app already has Tailwind and shadcn/ui installed and aliased as `@/components/ui/*`.

## What's included
- `app/client/ops/uploader/UploaderSettings.tsx` — Hybrid config panel with Cards, Inputs, Selects, and Badges.
- `app/client/components/files/FilesPanel.tsx` — Work Item file list + uploader with Card/Table styling.
- `app/client/styles/policy-badges.css` — Tiny badge helpers (“Civility”, “Balanced”, “Autonomy”).
- `app/client/lib/uploader/api.ts` — Thin client for GET/POST config, list, and upload.
- `app/client/lib/hooks/useToast.ts` — Minimal toast wrapper (uses shadcn/ui `useToast` if present, soft-fallback otherwise).

## Install (if needed)
```bash
# shadcn/ui baseline (skip if already done)
# https://ui.shadcn.com/ for full setup
npm i clsx tailwind-merge
# Ensure you have the following components installed or equivalents:
# button, input, label, select, card, switch, badge, table, toast
```

## Wiring
- Mount routes (as you already did):
  - `/api/ops/uploader` (upload + config)
  - `/api/workitems/:id/files` (list)
- Add the pages/components:
  - Work Item page → `<FilesPanel workItemId="WO-001" />`
  - Ops → Uploader Settings → `<UploaderSettings />`
- Dev-only RBAC: POST `/api/ops/uploader/config` requires header `x-role: ops_admin`.

## Dev Test
```bash
# Config GET
curl -s http://localhost:5000/api/ops/uploader/config | jq

# Config POST (dev)
curl -s -X POST http://localhost:5000/api/ops/uploader/config   -H 'x-role: ops_admin' -H 'Content-Type: application/json'   -d '{"max_file_mb":120,"allowed_types":["image/png","image/jpeg","application/pdf","text/csv"],"list_page_size":75}' | jq

# Upload test
curl -s -X POST http://localhost:5000/api/ops/uploader/upload   -F "work_item_id=WO-TEST" -F "visible_to=org" -F "file=@./README.md" | jq
```

## Notes
- Hybrid mode keeps **secrets in env** and **safe toggles in DB**.
- The UI shows an **env lock chip** when the backend = `env` or an env override is active.
- Adjust classNames / tokens to your brand as needed.
