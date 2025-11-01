# Sync: Policy Key Diffs + Pod Baselines — Micro-Patch

Adds to your Roles⇄Specs Sync:
- **Policy key-level diffs** with per-key "Apply" buttons (merges baseline + existing keys safely).
- **Custom baseline prompts per Pod** (Marketing, IP, Security, Brand, Product, Finance, Control Tower).

Also retains:
- Row-level "Apply all suggestions" and global "Fix all diffs".

## Files
- `src/lib/diff.ts`                 — extended with per-pod baseline prompts + policy key diffs.
- `src/components/RoleAgentSync.patch.tsx` — renders policy key diffs and supports per-key Apply.

## How to apply
1) Unzip into your Vite app root (merge into `src/`).
2) Replace `src/lib/diff.ts` and `src/components/RoleAgentSync.tsx` with the patched versions.
3) Run:
```bash
npm install
npm run dev -- --host
```
