# Images Admin — Status Badges (S3 + Cache-Control)

**Date:** 2025-11-06

Adds a small **status row** to the Images Admin page showing:
- **S3 Bucket** health (env present + simple list probe)
- **Default Cache-Control** string presence

## What’s included
- `server/routes/images.status.route.ts` — `GET /api/ops/images/status` returns:
  - `bucket`, `region`, `defaultCacheControl`
  - `hasBucketEnv` (bool), `probeOk` (bool) — best-effort S3 list probe
- `client/src/pages/ops/components/StatusBadge.tsx` — tiny pill badge.
- `client/src/pages/ops/ImagesAdmin.tsx` — updated to fetch status and render badges + link to settings if needed.

## Mount
```ts
// server/app.ts
app.use(require("./server/routes/images.status.route").router);
```

## Notes
- The S3 probe uses `s3List` with an empty prefix; if the IAM policy denies List, it will still show env presence but `probeOk` may be false.
- The UI degrades gracefully if the endpoint is unavailable.
