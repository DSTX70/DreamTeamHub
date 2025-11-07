# Ops Affiliate Report — Override Rate & Suspended Badges

**Date:** 2025-11-07

This patch augments the **Affiliate Report** page to:
- Fetch `/api/ops/aff/affiliates` for per-code `commissionRate` (override) and `status`.
- Show a tiny **“12.5% (override)”** badge when an affiliate has a non-null rate different from the default report `commissionRate`.
- Show a **“suspended”** chip next to the affiliate code if status is `suspended`.

Drop-in replacement for `client/src/pages/ops/AffiliateReport.tsx`.
