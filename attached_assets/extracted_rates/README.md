# Affiliates — Per-Affiliate Rates & Payouts Report

**Date:** 2025-11-07

Adds:
- **DB migration**: commission rate & status on `affiliates`
- **DAO functions**: set rate/status; payouts aggregation respecting per-affiliate rates with fallback
- **Routes**:
  - `GET/POST /api/ops/aff/affiliates` — list & update `commission_rate`, `status`, `name`
  - `GET /api/ops/aff/payouts?from=ISO&to=ISO` — CSV/JSON payouts (sum of commissions per affiliate)
  - `GET /api/ops/aff/payouts.csv?...` — CSV export
- **Client (Ops)**:
  - `AffiliatesAdmin.tsx` — table to edit rate (%) & status; save
  - `AffiliatePayouts.tsx` — date filters, payouts table, CSV download

Mount:
```ts
app.use(require("./server/routes/affiliate.rates.route").router);
app.use(require("./server/routes/affiliate.payouts.route").router);
```

Notes:
- Per-affiliate rate overrides default when set; `status` can be `active` or `suspended` (suspended still reports historical attributions but UI badge indicates state).
