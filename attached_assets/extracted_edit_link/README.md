# Affiliates — "Edit" link + Code Filter

**Date:** 2025-11-07

Adds a quick **Edit** link in the Affiliate Report table that jumps to **Affiliates Admin** with a `?code=AFFCODE` filter applied.
Also patches **AffiliatesAdmin.tsx** to support a code filter (URL param + input).

## Files
- `client/src/pages/ops/AffiliateReport.tsx` — adds "Edit" link per row
- `client/src/pages/ops/AffiliatesAdmin.tsx` — supports `?code=` filter (auto-focus row + input filter)
