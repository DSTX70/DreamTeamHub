// drizzle/schema.ts
// Tiny Drizzle model scaffold for the ERD. Adjust naming as needed.
import { pgEnum, pgTable, uuid, text, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";

export const autonomyLevel = pgEnum("autonomy_level", ["L0","L1","L2","L3"]);
export const lifecycleStatus = pgEnum("lifecycle_status", ["pilot","live","watch","rollback"]);

// Core hierarchy
export const company = pgTable("company", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const businessUnit = pgTable("business_unit", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const brand = pgTable("brand", {
  id: uuid("id").defaultRandom().primaryKey(),
  buId: uuid("bu_id").notNull().references(() => businessUnit.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  // unique(bu_id, slug) — add via SQL migration or drizzle uniqueIndex if desired
});

export const product = pgTable("product", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id").notNull().references(() => brand.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type"),
  slug: text("slug").notNull(),
});

export const project = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => product.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("active"),
  dueDate: text("due_date"), // or date type via drizzle if preferred
  tsv: text("tsv"),          // stored tsvector column — keep as text in drizzle
});

export const task = pgTable("task", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"),
  assigneeAgentId: uuid("assignee_agent_id"),
  dueDate: text("due_date"),
  tsv: text("tsv"),
});

// Roles & Agents
export const roleDef = pgTable("role_def", {
  handle: text("handle").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const agent = pgTable("agent", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  roleHandle: text("role_handle").references(() => roleDef.handle, { onDelete: "set null" }),
  autonomy: autonomyLevel("autonomy").notNull().default("L1"),
  status: lifecycleStatus("status").notNull().default("pilot"),
  nextGate: integer("next_gate"),
  successPct: numeric("success_pct", { precision: 5, scale: 2 }),
  p95s: numeric("p95_s", { precision: 6, scale: 2 }),
  costUsd: numeric("cost_usd", { precision: 8, scale: 3 }),
  // tags: text[] — declare via drizzle array helper if needed
  tsv: text("tsv"),
});

export const agentAssignment = pgTable("agent_assignment", {
  agentId: uuid("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
  ownerType: text("owner_type").notNull(), // BU|BRAND|PRODUCT|PROJECT
  ownerId: uuid("owner_id").notNull(),
}, (t) => ({
  pk: { columns: [t.agentId, t.ownerType, t.ownerId] }
}));

// Knowledge links
export const knowledgeLink = pgTable("knowledge_link", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerType: text("owner_type").notNull(), // BU|BRAND|PRODUCT
  ownerId: uuid("owner_id").notNull(),
  role: text("role").notNull(),           // read|draft|publish
  driveFolderId: text("drive_folder_id").notNull(),
});

// Work Orders & Runs
export const workOrder = pgTable("work_order", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  owner: text("owner").notNull(),
  autonomy: autonomyLevel("autonomy").notNull().default("L1"),
  inputs: text("inputs").notNull(),
  output: text("output").notNull(),
  capsRunsPerDay: integer("caps_runs_per_day").notNull().default(100),
  capsUsdPerDay: numeric("caps_usd_per_day", { precision: 8, scale: 3 }).notNull().default("2.000"),
  kpiSuccessMin: integer("kpi_success_min").notNull().default(90),
  kpiP95Max: numeric("kpi_p95_max", { precision: 6, scale: 2 }).notNull().default("3.00"),
  playbook: text("playbook"),
  stop: text("stop"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workOrderRun = pgTable("work_order_run", {
  id: uuid("id").defaultRandom().primaryKey(),
  woId: uuid("wo_id").notNull().references(() => workOrder.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull(),  // queued|running|done|failed
  ms: integer("ms").notNull(),
  cost: numeric("cost", { precision: 8, scale: 3 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  mirror: text("mirror"),
});

// Ops events
export const opsEvent = pgTable("ops_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actor: text("actor"),
  kind: text("kind").notNull(),
  ownerType: text("owner_type"),
  ownerId: uuid("owner_id"),
  message: text("message"),
  meta: jsonb("meta"),
});
