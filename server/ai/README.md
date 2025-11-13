# AI Work Item Actions System

## Overview

This directory contains the AI-powered Work Item Actions system that generates structured creative specification packs across four organizational pods:

- **Creative Pod** - Lifestyle Pack (photography specifications)
- **IP Pod** - Patent Claims Pack (intellectual property)
- **Marketing Pod** - Launch Plan Pack (campaign strategy)
- **Product & Platform Pod** - Website Audit Pack (site quality review)

## Architecture

### Components

1. **Schemas** (`schemas/`) - Zod validation schemas for each pack type
2. **Skills** (`skills/`) - JSON prompt configurations for LLM generation
3. **Actions** (`actions/`) - Factory-based request handlers
4. **Persistence** (`persistence.ts`) - Functions to append generated content to work items
5. **Runtime** (`runSkill.ts`) - LLM invocation and response parsing

### Factory Pattern

All action handlers use the `createWorkItemActionHandler` factory:

```typescript
export const postGenerateLifestylePack = createWorkItemActionHandler<LifestylePack>({
  skillName: "generateLifestylePack",
  outputSchema: LifestylePackSchema,
  persist: saveLifestylePackArtifacts,
});
```

This pattern ensures:
- Consistent error handling across all actions
- Type-safe Zod validation
- Standardized logging and observability
- Easy extensibility for new pack types

### Data Flow

1. User clicks "Run" button in WorkItemActionsPanel
2. Frontend POSTs to `/api/work-items/:id/actions/{pack-type}`
3. Handler fetches work item from storage
4. `runSkill()` invokes OpenAI with skill JSON + work item context
5. LLM returns structured JSON response
6. Zod schema validates response
7. Persistence function appends markdown to work item description
8. Work item status updated to "done"
9. Frontend displays success toast

## Environment Variables

### DEBUG_LLM_ACTIONS

**Default:** `false` (not set)

**Purpose:** Controls verbosity of LLM action logging. When enabled, logs full request payloads and LLM responses for debugging purposes.

**Security Note:** This flag should **ONLY** be enabled in development or controlled debugging sessions, as it logs sensitive work item content and LLM responses to stdout.

**Usage:**
```bash
# Development debugging
DEBUG_LLM_ACTIONS=true npm run dev

# Production (default) - safe logging only
npm run dev
```

**Log Behavior:**

| Mode | Logs |
|------|------|
| Production (default) | `[skillName] Invoking LLM for work item 123`<br>`[skillName] Action completed successfully for work item 123` |
| Debug enabled | Full JSON payloads:<br>- Work item input<br>- LLM raw output<br>- Zod validation errors (full details) |

## Adding New Pack Types

To add a new pack type (e.g., "Design System Pack"):

1. **Create Zod Schema** (`schemas/designSystemPack.ts`):
```typescript
import { z } from "zod";

export const DesignSystemPackSchema = z.object({
  // Define structure
});

export type DesignSystemPack = z.infer<typeof DesignSystemPackSchema>;
```

2. **Create Skill JSON** (`skills/generateDesignSystemPack.json`):
```json
{
  "name": "generateDesignSystemPack",
  "description": "Generate design system specification",
  "system_prompt": "You are a design systems expert...",
  "input_schema": {
    "work_item_id": "string",
    "work_item_title": "string",
    "work_item_body": "string"
  },
  "output_schema": {
    "description": "JSON matching DesignSystemPackSchema"
  }
}
```

3. **Create Persistence Function** (`persistence.ts`):
```typescript
export async function saveDesignSystemPack(
  workItemId: number,
  pack: DesignSystemPack
): Promise<void> {
  const wi = await storage.getWorkItem(workItemId);
  if (!wi) throw new Error("Work item not found");

  const packSummary = `
---
## 🎨 Design System Pack Generated (${new Date().toLocaleString()})
// Format markdown output
`;

  await storage.updateWorkItem(workItemId, {
    description: (wi.description || "") + packSummary,
    status: "done",
  });
}
```

4. **Create Route Handler** (`routes/workItemActions/generateDesignSystemPack.ts`):
```typescript
import { createWorkItemActionHandler } from "../../ai/actions/createWorkItemActionHandler";
import {
  DesignSystemPackSchema,
  type DesignSystemPack,
} from "../../ai/schemas/designSystemPack";
import { saveDesignSystemPack } from "../../ai/persistence";

export const postGenerateDesignSystemPack = createWorkItemActionHandler<DesignSystemPack>({
  skillName: "generateDesignSystemPack",
  outputSchema: DesignSystemPackSchema,
  persist: saveDesignSystemPack,
});
```

5. **Register Route** (`server/routes.ts`):
```typescript
import { postGenerateDesignSystemPack } from "./routes/workItemActions/generateDesignSystemPack";

// In registerRoutes():
app.post("/api/work-items/:id/actions/generate-design-system-pack", isAuthenticated, postGenerateDesignSystemPack);
```

6. **Update UI** (`client/src/components/workItems/WorkItemActionsPanel.tsx`):
```typescript
type ActionKey = "lifestyle" | "patent" | "launch" | "audit" | "designSystem";

const ACTION_CONFIG = {
  // ... existing actions
  designSystem: {
    label: "Generate Design System Pack",
    Icon: PaletteIcon,
    endpointSuffix: "generate-design-system-pack",
  },
};
```

## Testing

All pack actions have end-to-end test coverage verifying:
- UI interaction (button clicks, status updates)
- API request/response flow
- LLM generation and validation
- Persistence (content appended to description)
- Error handling (Zod validation, network failures)

See playwright test spec for examples.

## Security Considerations

1. **Authentication:** All action endpoints require `isAuthenticated` middleware
2. **Input Validation:** Work item IDs validated, unauthorized access returns 404
3. **Output Validation:** Zod schemas prevent malformed LLM responses
4. **Logging:** Sensitive payloads only logged when DEBUG_LLM_ACTIONS=true
5. **Error Messages:** Production errors return generic messages, detailed logs only in debug mode

## Performance

- **Average LLM latency:** 15-45 seconds per action
- **Timeout:** 60 seconds (frontend + backend)
- **Concurrency:** Actions can run in parallel on different work items
- **Storage:** Markdown appended to description (preserves history, no overwrites)

## Troubleshooting

### "LLM did not return valid JSON"
- Check skill JSON prompt includes clear JSON formatting instructions
- Verify system_prompt includes JSON-only output requirement
- Enable DEBUG_LLM_ACTIONS=true to inspect raw LLM response

### "Zod validation failed"
- Enable DEBUG_LLM_ACTIONS=true to see detailed validation errors
- Check skill JSON includes complete exemplars with ALL required fields
- Verify LLM response structure matches Zod schema exactly

### "Work item not found"
- Verify work item ID exists in database
- Check user has permission to access work item
- Ensure work item wasn't deleted during action execution

## References

- Factory pattern: `createWorkItemActionHandler.ts`
- LLM runtime: `runSkill.ts`
- Example schemas: `schemas/lifestylePack.ts`, `schemas/patentClaimsPack.ts`
- Example skills: `skills/generateLifestylePack.json`
- Frontend UI: `client/src/components/workItems/WorkItemActionsPanel.tsx`
