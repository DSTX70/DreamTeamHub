# Inventory — Notifier Status Badges

**Date:** 2025-11-06

Adds tiny header badges in the **Inventory Low Stock** page to show notifier status (Slack / Email) and link to **/ops/settings**.

## What’s included
- `client/src/pages/ops/components/NotifierBadge.tsx` — simple pill badge.
- `client/src/pages/ops/InventoryLowStock.tsx` — updated to fetch `/api/ops/settings/notifiers` and render badges + settings link.

## Mount / Requirements
No server changes needed — relies on your existing `GET /api/ops/settings/notifiers` route shipped earlier.

## Usage
Drop-in replace your `InventoryLowStock.tsx` and add the new `NotifierBadge.tsx`. Then navigate to **/ops/inventory**.
