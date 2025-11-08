# ship_llm_presets_db_and_augment_api

Wires DB-backed presets + a server-side augment endpoint.

## Migration
- `server/db/migrations/20251107_create_llm_presets.sql` (Postgres-flavored)
- Run with your migration tool (Drizzle/Knex/SQL files).

## Mount
```ts
import llmPresetsDbRouter from "./routes/llm_presets_db.route";
import llmAugmentRouter from "./routes/llm_augment.route";

app.use("/api/llm/presets-db", express.json(), llmPresetsDbRouter);
app.use("/api/llm/augment", express.json(), llmAugmentRouter);
```

## Usage
```bash
# Create a preset
curl -X POST /api/llm/presets-db -H "Content-Type: application/json" -d '{ "family":"gpt","label":"Strict JSON","augmentLines":["Return JSON only. No extra text."],"tips":["Keep it short"] }'

# Augment a prompt
curl -X POST /api/llm/augment -H "Content-Type: application/json" -d '{ "family":"gpt", "prompt":"You are a helpful assistant." }'
```

Notes
- Adjust `db` import to your layer (Drizzle/pg Pool).
- The augment endpoint picks the latest enabled preset per family.
