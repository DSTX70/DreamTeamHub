// ui/academy_sidebar_integration.md
# Academy Sidebar Integration (Train/Promote)

**Goal:** Show Academy sidebar on BU/Brand/Product/Project pages; enable Train/Promote actions.

## 1) Render the sidebar
```tsx
import AcademySidebar from "@/components/AcademySidebar";

<aside className="w-full lg:w-80">
  <AcademySidebar
    agent={{
      id: agent.id,
      name: agent.name,
      autonomy: agent.autonomy,
      status: agent.status,
      nextGate: agent.next_gate
    }}
    onTrainClick={(id)=>router.push(`/academy/train?agent=${id}`)}
    onPromote={async (id)=>{
      await fetch(`/api/agents/${id}/promote`, { method:"POST" });
      // Optimistically refresh
      router.refresh?.();
    }}
  />
</aside>
```

## 2) Add a tiny promote endpoint
```ts
// api/agents_promote.route.ts
import { db } from "../drizzle/db";
import { agent } from "../drizzle/schema";
import { eq } from "drizzle-orm";
export async function promoteAgent(req,res){
  const id = String(req.params.id);
  const [row] = await db.select().from(agent).where(eq(agent.id,id));
  if(!row) return res.status(404).json({error:"agent not found"});
  const next = Math.min(4, (row.nextGate ?? 1) + 1);
  const [updated] = await db.update(agent).set({ nextGate: next }).where(eq(agent.id,id)).returning();
  return res.json({ ok:true, agent: updated });
}
```

Mount: `app.post("/api/agents/:id/promote", promoteAgent)`.
