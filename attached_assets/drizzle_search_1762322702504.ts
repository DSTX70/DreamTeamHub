// drizzle/search.ts
// Tiny Drizzle helper for universal search (UNION view backed by SQL).
// Assumes you have a 'db' instance from drizzle-orm and pg driver.

import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

type SearchOpts = {
  q: string;
  limit?: number;
  offset?: number;
  scope?: "GLOBAL" | "BU" | "BRAND" | "PRODUCT" | "PROJECT";
  ownerId?: string;     // required when scope != GLOBAL
  types?: Array<"brand"|"product"|"project"|"task"|"agent">;
};

export async function universalSearch(db: PgDatabase<any>, opts: SearchOpts) {
  const q = opts.q.trim();
  if (q.length < 2) throw new Error("q must be at least 2 chars");
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);

  // Build optional filters
  const allowTypes = (opts.types && opts.types.length)
    ? sql`and h.type = any(${sql.array(opts.types, "text")})`
    : sql``;

  // Scope predicates (lightweight; join paths as needed for deep scoping)
  let scopeSql = sql``;
  if (opts.scope && opts.scope !== "GLOBAL" && opts.ownerId) {
    // You can refine this by joining through product→brand→business_unit
    // For now, we embed owner info in extras and filter by it if present.
    scopeSql = sql``; // Placeholder for custom scoping if you denormalize owner into each table
  }

  // The SQL mirrors the UNION approach shown earlier; kept inline for portability.
  const { rows } = await db.execute(sql`
with needle as (select unaccent(${q}) as v)

, projects as (
  select 'project'::text as type, p.id::text as id, p.title as title,
    0.6*coalesce(ts_rank(p.tsv, plainto_tsquery('simple', ${q})),0) +
    0.4*similarity(unaccent(p.title), (select v from needle)) as score,
    jsonb_build_array('i³','…','…','…','Project') as path,
    jsonb_build_object('status', p.status, 'due_date', p.due_date) as extras
  from project p
  where p.title % (select v from needle) or (p.tsv is not null and p.tsv @@ plainto_tsquery('simple', ${q}))
), products as (
  select 'product', pr.id::text, pr.name,
    0.6*coalesce(ts_rank(pr.tsv, plainto_tsquery('simple', ${q})),0) +
    0.4*similarity(unaccent(pr.name), (select v from needle)),
    jsonb_build_array('i³','…','…','Product'),
    jsonb_build_object('type', pr.type)
  from product pr
  where pr.name % (select v from needle) or (pr.tsv is not null and pr.tsv @@ plainto_tsquery('simple', ${q}))
), brands as (
  select 'brand', b.id::text, b.name,
    0.6*coalesce(ts_rank(b.tsv, plainto_tsquery('simple', ${q})),0) +
    0.4*similarity(unaccent(b.name), (select v from needle)),
    jsonb_build_array('i³','…','Brand'),
    '{}'::jsonb
  from brand b
  where b.name % (select v from needle) or (b.tsv is not null and b.tsv @@ plainto_tsquery('simple', ${q}))
), agents as (
  select 'agent', a.id::text, a.name,
    0.6*coalesce(ts_rank(a.tsv, plainto_tsquery('simple', ${q})),0) +
    0.4*similarity(unaccent(a.name), (select v from needle)),
    jsonb_build_array('Agents'),
    jsonb_build_object('level', a.autonomy, 'status', a.status)
  from agent a
  where a.name % (select v from needle) or (a.tsv is not null and a.tsv @@ plainto_tsquery('simple', ${q}))
), tasks as (
  select 'task', t.id::text, t.title,
    0.6*coalesce(ts_rank(t.tsv, plainto_tsquery('simple', ${q})),0) +
    0.4*similarity(unaccent(t.title), (select v from needle)),
    jsonb_build_array('…','…','Task'),
    jsonb_build_object('status', t.status)
  from task t
  where t.title % (select v from needle) or (t.tsv is not null and t.tsv @@ plainto_tsquery('simple', ${q}))
)
, hits as (
  select * from projects
  union all select * from products
  union all select * from brands
  union all select * from agents
  union all select * from tasks
)
select
  (select count(*) from hits) as count,
  jsonb_agg(h order by h.score desc) filter (where true) as items
from (
  select * from hits h
  where 1=1
  ${allowTypes}
  order by h.score desc
  limit ${limit} offset ${offset}
) h
  ${scopeSql}
  `);

  const row = rows[0] as any;
  const count = Number(row?.count ?? 0);
  const items = row?.items ?? [];
  return { count, limit, offset, items };
}
