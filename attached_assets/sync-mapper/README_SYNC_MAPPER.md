# Frontend Sync/Mapper Micro-Patch

Adds:
- **Bulk mapping**: Generate Agent Specs from all Roles that don’t yet have specs.
- **Two-way sync** view: show diffs for Roles ↔ Agent Specs (title, pod, instruction blocks, tools) with one-click **Apply suggestion**.
- A new **tab** “Roles⇄Specs Sync” (drop-in `App.patch.tsx`).

## Files
- `src/lib/diff.ts`                 — diff helpers + role→spec suggestion
- `src/components/RoleAgentSync.tsx` — sync UI + bulk generate button
- `src/App.patch.tsx`               — adds new tab to your app nav

## How to apply
1) Unzip into your Vite app root.
2) Replace your `src/App.tsx` with `src/App.patch.tsx` (or merge the new tab into your App).
3) Ensure backend exposes: `GET /roles`, `GET /agent-specs`, `POST /agent-specs`.

## Notes
- Suggestions include:
  - **Title/Pod** → Role values if different.
  - **Instruction Blocks** → Role’s Definition of Done when Agent Spec lacks them.
  - **Tools** → a baseline set if empty.
