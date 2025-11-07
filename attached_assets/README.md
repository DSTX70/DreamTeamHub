# Breadcrumbs added to Images Admin & Inventory

**Date:** 2025-11-07

This patch adds the same inline **Breadcrumbs** (with role chips) to:
- **Images Admin** (Responsive Images — Allowlist & Upload)
- **Inventory Low Stock & Thresholds**

It expects the shared component at `client/src/components/Breadcrumbs.tsx` (from your previous drop).

## Files
- `client/src/pages/ops/ImagesAdmin.tsx` — updated to render `Ops → Images`
- `client/src/pages/ops/InventoryLowStock.tsx` — updated to render `Ops → Inventory`
