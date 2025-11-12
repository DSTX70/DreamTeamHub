
# Next Steps — UI + Tests for WO-Level Files

This drop adds:
1) `WorkOrderAggregatedFiles.tsx` — a shadcn-styled table that lists all files for a Work Order (via `/api/work-orders/:woId/files`).
2) Jest test `tests/work_order_files.spec.ts` — route sanity check.
3) A small FilesPanel note to initialize visibility from config.

## Files
- `app/client/components/workorders/WorkOrderAggregatedFiles.tsx`
- `tests/work_order_files.spec.ts`
- `notes/FilesPanel_default_visibility.diff.hint.txt`

## Usage
1) **Mount the component** on your Work Order detail page:
```tsx
import { WorkOrderAggregatedFiles } from '@/components/workorders/WorkOrderAggregatedFiles';
// ...
<WorkOrderAggregatedFiles woId="WO-001" />
```

2) **Ensure default visibility** in FilesPanel:
- See `notes/FilesPanel_default_visibility.diff.hint.txt` and apply the snippet.

3) **Run tests** (adjust imports to your app paths):
```bash
npm run test -- tests/work_order_files.spec.ts
# or: npx jest tests/work_order_files.spec.ts
```

## Tip
The component is headless about auth; your app shell should handle RBAC and error toasts.
