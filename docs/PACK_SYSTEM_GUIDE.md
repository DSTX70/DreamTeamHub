# Pack System Guide

## Overview

Dream Team Hub's Pack System provides AI-powered generation of 20+ specification pack types across Brand/Creative, Governance, Operations, Partnerships, Data, and Expansion categories. The system uses a config-driven registry architecture that eliminates boilerplate and automatically wires routes, handlers, schemas, skills, and exports.

## Architecture

### Registry-Driven Design

The system is built around `PACK_REGISTRY` in `server/ai/packRegistry.ts`, which serves as the single source of truth for all pack configurations:

```typescript
export interface PackConfig {
  id: string;                    // Unique identifier
  packType: string;              // Database/API identifier (snake_case)
  label: string;                 // Human-readable label
  skillName: string;             // OpenAI skill identifier
  endpointSuffix: string;        // API endpoint suffix
  schema: ZodType<any>;          // Zod validation schema
  icon: string;                  // Lucide icon name
  driveFolder: string;           // Environment variable for Drive folder
  exportEnabled: boolean;        // Whether export is enabled
  category: string;              // Pack category
}
```

### Single Source of Truth

**PackType** is derived from the registry to prevent type drift:

```typescript
export type PackType = typeof PACK_REGISTRY[number]['packType'];
export const PACK_TYPES = PACK_REGISTRY.map((p) => p.packType);
```

All modules import `PackType` from `packRegistry.ts`:
- ✅ `server/ai/persistence.ts` - Pack storage
- ✅ `server/services/packExport.ts` - Pack exports
- ✅ `server/config/drivePackFolders.ts` - Drive folder config

## Available Pack Types

### Core/Existing Packs (6)
1. **Lifestyle Banner Pack** - Photography shot boards and export plans
2. **Patent Claims Pack** - Patent specification documentation
3. **Launch Plan Pack** - Marketing launch strategies
4. **Website Audit Pack** - Website audit findings
5. **Risk & Compliance Pack** - Risk assessments
6. **Agent Lab Academy Pack** - Training programs

### New Governance/Ops Packs (4)
7. **Agent Governance Pack** - Agent oversight frameworks
8. **Pricing & Monetization Pack** - Pricing strategies
9. **Data Stewardship & Metrics Pack** - Data management plans
10. **GlobalCollabs Partnerships Pack** - Partnership frameworks

### Brand/Creative Lane Packs (4)
11. **Packaging & Pre-Press Pack** - Package specifications
12. **Product Line & SKU Tree Pack** - Product architecture
13. **E-Com PDP & A+ Content Pack** - E-commerce content
14. **Social Campaign & Content Calendar Pack** - Social media plans

### Operations/Expansion Packs (6)
15. **Implementation Runbook & SOP Pack** - Process documentation
16. **Support Playbook & Knowledge Base Pack** - Support documentation
17. **Retail & Wholesale Readiness Pack** - Distribution strategies
18. **Experiment & Optimization Pack** - A/B testing plans
19. **Localization & Market Expansion Pack** - Market entry strategies
20. **Customer Journey & Lifecycle Pack** - Customer experience maps

## How It Works

### 1. Route Registration (Automatic)

Routes are auto-registered in `server/routes.ts`:

```typescript
PACK_REGISTRY.forEach((pack) => {
  router.post(
    `/api/work-items/:id/${pack.endpointSuffix}`,
    isAuthenticated,
    createPackActionHandler(pack)
  );
});
```

### 2. Pack Generation Handler

The `createPackActionHandler` factory creates type-safe handlers:

```typescript
function createPackActionHandler(pack: PackConfig): RequestHandler {
  return async (req, res, next) => {
    try {
      // 1. Validate request body against pack schema
      const validatedData = pack.schema.parse(req.body);
      
      // 2. Execute OpenAI skill
      const skillResult = await executeSkill(pack.skillName, validatedData);
      
      // 3. Save to database with version tracking
      await saveWorkItemPackGeneric(workItemId, pack.packType, skillResult);
      
      res.json({ success: true });
    } catch (error) {
      // 400 for validation errors, 500 for server errors
      next(error);
    }
  };
}
```

### 3. Pack Storage

Packs are stored in `work_item_packs` table with version tracking:

```sql
CREATE TABLE work_item_packs (
  id SERIAL PRIMARY KEY,
  work_item_id INTEGER REFERENCES work_items(id),
  pack_type VARCHAR NOT NULL,
  version INTEGER NOT NULL,
  pack_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(work_item_id, pack_type, version)
);
```

### 4. Pack Export

**Custom Exporters** (6 legacy packs):
- Lifestyle → DOCX + CSV with custom formatting
- Patent → DOCX with patent-specific layout
- Launch → DOCX with timeline formatting
- Website Audit → DOCX with findings structure
- Risk & Compliance → DOCX with risk matrix
- Agent Lab Academy → DOCX with curriculum structure

**Generic Exporter** (13 new packs):
- Converts any pack JSON structure to formatted DOCX
- Hierarchical headings (H1 → H2 → H3)
- Automatic array → table conversion
- Recursive object traversal

```typescript
export async function exportGenericPackToDOCX(
  workItemId: number,
  packType: PackType,
  title: string,
  version: number,
  packData: any
): Promise<ExportResult>
```

### 5. Drive Integration

Drive folders are auto-configured from registry:

```typescript
export const packFolders: PackFolderConfig[] = PACK_REGISTRY
  .filter(pack => pack.driveFolder)
  .map(pack => ({
    packType: pack.packType,
    driveFolderId: process.env[pack.driveFolder] || "",
    label: pack.label,
    description: `AI-generated ${pack.label.toLowerCase()} specification`,
  }));
```

## Adding a New Pack Type

### Step 1: Create Zod Schema

Create `server/ai/schemas/myNewPack.ts`:

```typescript
import { z } from "zod";

export const MyNewPackSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
  })),
});

export type MyNewPack = z.infer<typeof MyNewPackSchema>;
```

### Step 2: Create Skill JSON

Create `server/ai/skills/generateMyNewPack.json`:

```json
{
  "name": "generateMyNewPack",
  "description": "Generate comprehensive my new pack specification",
  "strict": true,
  "parameters": {
    "type": "object",
    "required": ["title", "description", "sections"],
    "properties": {
      "title": {
        "type": "string",
        "description": "Pack title"
      },
      "description": {
        "type": "string",
        "description": "Pack description"
      },
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["heading", "content"],
          "properties": {
            "heading": {"type": "string"},
            "content": {"type": "string"}
          }
        }
      }
    }
  }
}
```

### Step 3: Register in PACK_REGISTRY

Add to `server/ai/packRegistry.ts`:

```typescript
import { MyNewPackSchema } from "./schemas/myNewPack";

export const PACK_REGISTRY: PackConfig[] = [
  // ... existing packs ...
  {
    id: "myNew",
    packType: "my_new_pack",
    label: "Generate My New Pack",
    skillName: "generateMyNewPack",
    endpointSuffix: "generate-my-new-pack",
    schema: MyNewPackSchema,
    icon: "Sparkles",
    driveFolder: "DRIVE_MY_NEW_PACK_FOLDER",
    exportEnabled: true,
    category: "ops",
  },
];
```

### Step 4: Add Environment Variable

Add to `.env`:

```bash
DRIVE_MY_NEW_PACK_FOLDER=<google-drive-folder-id>
```

### Step 5: Update Frontend (Optional)

If you want UI integration, update `client/src/pages/WorkItemDetail.tsx`:

```typescript
const packActions = [
  // ... existing actions ...
  {
    id: "my-new-pack",
    label: "My New Pack",
    icon: Sparkles,
    endpoint: "generate-my-new-pack",
  },
];
```

**That's it!** The pack is now:
- ✅ Auto-registered in routes
- ✅ Validated against schema
- ✅ Executed via OpenAI skill
- ✅ Persisted to database
- ✅ Exportable to DOCX (generic exporter)
- ✅ Publishable to Google Drive

## Using Packs in Work Items

### API Endpoints

All packs follow the same pattern:

```http
POST /api/work-items/:id/{pack-endpoint-suffix}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

Example:

```http
POST /api/work-items/123/generate-agent-governance-pack
Content-Type: application/json

{
  "frameworkName": "Agent Ethics Framework",
  "governanceModel": "Hierarchical oversight",
  "decisionAuthority": "Human-in-the-loop",
  "escalationProtocol": "3-tier escalation"
}
```

### Response Format

```json
{
  "success": true,
  "packId": 456,
  "version": 1
}
```

### Error Handling

**Validation Error (400)**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["frameworkName"],
      "message": "Required"
    }
  ]
}
```

**Server Error (500)**:
```json
{
  "error": "Failed to generate pack",
  "message": "OpenAI skill execution failed"
}
```

## Exporting Packs

### Export API

```http
GET /api/work-items/:id/packs/:packType/export?version=:version
```

Example:

```http
GET /api/work-items/123/packs/agent_governance/export?version=1
```

### Export Formats

**Legacy packs** (6): Custom DOCX + CSV (some)
**New packs** (14): Generic DOCX

### Export File Naming

```
WI-{workItemId}_{packType}_v{version}.docx
```

Example:
```
WI-123_agent_governance_v1.docx
```

## Publishing to Google Drive

### Automatic Publishing

When a pack is generated, it can be automatically published to Google Drive if:
1. `exportEnabled: true` in registry
2. Drive folder environment variable is set
3. User has Google Drive integration configured

### Manual Publishing

```http
POST /api/work-items/:id/packs/:packType/publish
{
  "version": 1
}
```

## Database Schema

### work_item_packs Table

```typescript
export const workItemPacks = pgTable("work_item_packs", {
  id: serial("id").primaryKey(),
  workItemId: integer("work_item_id").references(() => workItems.id),
  packType: varchar("pack_type").notNull(),
  version: integer("version").notNull(),
  packData: jsonb("pack_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueVersion: unique().on(table.workItemId, table.packType, table.version),
}));
```

### Version Tracking

Each pack type maintains its own version sequence:
- Version 1: Initial generation
- Version 2: First regeneration
- Version 3: Second regeneration
- etc.

## Best Practices

### 1. Schema Design

- Keep schemas simple and focused
- Use descriptive field names
- Add validation constraints (min/max, patterns)
- Document complex fields

### 2. Skill Design

- Provide detailed system prompts
- Include examples in skill JSON
- Use strict mode for validation
- Test skills with sample data

### 3. Pack Categories

Organize packs into logical categories:
- `brand_creative`: Visual and content assets
- `legal_ip`: Legal and IP documentation
- `ops`: Operational processes
- `governance`: Oversight and compliance
- `partnerships`: Collaboration frameworks
- `data`: Data management and analytics
- `expansion`: Growth and scaling

### 4. Error Handling

- Validate early (Zod schemas)
- Use transactions for database writes
- Log errors for debugging
- Return user-friendly error messages

### 5. Testing

- Test pack generation with sample data
- Verify export formatting
- Check Drive folder permissions
- Validate version incrementing

## Troubleshooting

### Pack Generation Fails

1. Check OpenAI skill configuration
2. Verify schema validation
3. Check database connection
4. Review error logs

### Export Fails

1. Verify pack exists in database
2. Check packType matches registry
3. Validate export handler exists
4. Review DOCX generation errors

### Drive Publishing Fails

1. Check environment variable is set
2. Verify Drive folder permissions
3. Check Google Drive integration
4. Review API quotas

## Security Considerations

- All endpoints require authentication (`isAuthenticated`)
- Schema validation prevents injection attacks
- Database transactions ensure data integrity
- Role-based access control for sensitive packs

## Performance

- Pack generation is async (OpenAI can take 5-30 seconds)
- Database writes use transactions
- Exports are generated on-demand
- Drive uploads are queued in background

## Future Enhancements

1. **Regression Testing**: Add test that validates every pack in registry has matching export handler
2. **Title Derivation**: Source export titles directly from PACK_REGISTRY to avoid duplication
3. **Custom Exporters**: Add bespoke DOCX layouts for high-value pack types
4. **Pack Templates**: Pre-fill schemas with common patterns
5. **Batch Generation**: Generate multiple packs in parallel
6. **Pack Comparison**: Diff tool for comparing pack versions

## Support

For questions or issues:
1. Check this guide first
2. Review `server/ai/packRegistry.ts` for pack configs
3. Check error logs in application
4. Contact Dream Team Hub support
