import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

type SearchOpts = {
  q: string;
  limit?: number;
  offset?: number;
  scope?: "GLOBAL" | "BU" | "BRAND" | "PRODUCT" | "PROJECT";
  ownerId?: string;
  types?: Array<"brand" | "product" | "project" | "agent">;
};

type SearchResult = {
  count: number;
  items: Array<{
    type: string;
    id: string;
    title: string;
    score: number;
    path?: string[];
    extras?: Record<string, any>;
  }>;
};

export async function universalSearch(
  db: PostgresJsDatabase<any>,
  opts: SearchOpts
): Promise<SearchResult> {
  const q = opts.q.trim();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);
  const types = opts.types?.length
    ? sql`and type = any(${sql.array(opts.types, "text")})`
    : sql``;

  // Note: This uses PostgreSQL full-text search + trigram similarity
  // Make sure you have pg_trgm extension enabled
  const result = await db.execute(sql`
    with needle as (select ${q} as v)
    , projects as (
      select 
        'project'::text as type, 
        p.id::text as id, 
        p.title as title,
        0.6 * coalesce(similarity(p.title, (select v from needle)), 0) +
        0.4 * coalesce(similarity(coalesce(p.description,''), (select v from needle)), 0) as score,
        jsonb_build_array('i³', 'Projects', p.title) as path,
        jsonb_build_object('status', p.status, 'due_date', p.due_date) as extras
      from project p
      where 
        p.title ilike '%' || ${q} || '%' or
        coalesce(p.description,'') ilike '%' || ${q} || '%'
    )
    , products as (
      select 
        'product'::text as type,
        pr.id::text as id, 
        pr.name as title,
        0.7 * coalesce(similarity(pr.name, (select v from needle)), 0) +
        0.3 * coalesce(similarity(coalesce(pr.description,''), (select v from needle)), 0) as score,
        jsonb_build_array('i³', 'Products', pr.name) as path,
        jsonb_build_object('type', pr.type) as extras
      from product pr
      where 
        pr.name ilike '%' || ${q} || '%' or
        coalesce(pr.description,'') ilike '%' || ${q} || '%'
    )
    , brands as (
      select 
        'brand'::text as type,
        b.id::text as id, 
        b.name as title,
        similarity(b.name, (select v from needle)) as score,
        jsonb_build_array('i³', 'Brands', b.name) as path,
        '{}'::jsonb as extras
      from brand b
      where b.name ilike '%' || ${q} || '%'
    )
    , agents as (
      select 
        'agent'::text as type,
        a.id::text as id, 
        a.name as title,
        0.8 * coalesce(similarity(a.name, (select v from needle)), 0) +
        0.2 * coalesce(similarity(coalesce(a.role,''), (select v from needle)), 0) as score,
        jsonb_build_array('i³', 'Agents', a.name) as path,
        jsonb_build_object('level', a.autonomy, 'status', a.status) as extras
      from agent a
      where 
        a.name ilike '%' || ${q} || '%' or
        coalesce(a.role,'') ilike '%' || ${q} || '%'
    )
    , hits as (
      select * from projects 
      union all select * from products 
      union all select * from brands 
      union all select * from agents
    )
    select
      (select count(*) from hits) as count,
      coalesce(jsonb_agg(
        jsonb_build_object(
          'type', h.type,
          'id', h.id,
          'title', h.title,
          'score', h.score,
          'path', h.path,
          'extras', h.extras
        ) order by h.score desc
      ) filter (where true), '[]'::jsonb) as items
    from (
      select * from hits h
      where 1=1 ${types}
      order by score desc
      limit ${limit} offset ${offset}
    ) h;
  `);

  const row = result[0] as any;
  return {
    count: Number(row?.count ?? 0),
    items: (row?.items ?? []) as any[],
  };
}
