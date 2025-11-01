# Frontend Admin ++ — Templates, CSV Error Modal, Role↔Agent Link, Vocab Pickers

This patch adds to Roster Admin:
- Export/Import **templates** pre-filled with current Pod names & sample Agent Spec
- **CSV error reporting** with line-by-line review modal for Roles and Agent Specs
- **Role↔Agent link** display (“Agent linked” chip when a spec with the same handle exists)
- **Controlled vocab pickers** for Pod names and common Instruction Blocks

## Files
- `src/lib/templates.ts` — builds JSON templates from live Pods
- `src/lib/vocab.ts` — common Instruction Blocks
- `src/components/Modals.tsx` — CSV error modal
- `src/components/RosterAdmin.patch.tsx` — drop-in replacement UI

## How to apply
1) Unzip into your Vite app root (merge into `src/`).
2) Replace `src/components/RosterAdmin.tsx` with `src/components/RosterAdmin.patch.tsx`.
3) Make sure backend has:
   - Pods CRUD, `/agent-specs` CRUD endpoints
4) Run:
```bash
npm install
npm run dev -- --host
```

