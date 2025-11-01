# Sync Diffs + Batch Apply — Micro-Patch

Adds to the Roles⇄Specs Sync view:
- Diffs now include **system_prompt** and **policies** (with a merged baseline suggestion when different).
- **Apply all suggestions for this handle** button.
- **Fix all diffs** (global) applies suggestions across all rows with diffs.

## Files
- `src/lib/diff.ts`                  — updated diffs for system_prompt + policies
- `src/components/RoleAgentSync.patch.tsx` — drop-in replacement (adds batch actions)

## How to apply
1) Unzip into your Vite app root, merging into `src/`.
2) Replace `src/lib/diff.ts` with the patched version.
3) Replace `src/components/RoleAgentSync.tsx` with `src/components/RoleAgentSync.patch.tsx`.
4) Run:
```bash
npm install
npm run dev -- --host
```

## Behavior
- **system_prompt**: suggests a baseline if missing or lacking key guidance.
- **policies**: suggests a merged object `{...BASE_POLICIES, ...agentPolicies}` so you keep any custom keys.
- **Fix all diffs** updates every item that has at least one suggested value.
