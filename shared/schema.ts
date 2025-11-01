import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===========================
// AUTHENTICATION (Replit Auth)
// ===========================

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===========================
// PODS & PERSONS
// ===========================

export const pods = pgTable("pods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  charter: text("charter"),
  owners: jsonb("owners").$type<string[]>().notNull().default(sql`'[]'`),
  threadId: text("thread_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const persons = pgTable("persons", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  handle: text("handle").notNull().unique(),
  name: text("name").notNull(),
  roles: jsonb("roles").$type<string[]>().notNull().default(sql`'[]'`),
  podId: integer("pod_id").references(() => pods.id),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// ROLE CARDS & RACI
// ===========================

export const roleCards = pgTable("role_cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  handle: text("handle").notNull().unique(),
  title: text("title").notNull(),
  pod: text("pod").notNull(),
  podColor: text("pod_color"),
  icon: text("icon"),
  purpose: text("purpose").notNull(),
  coreFunctions: jsonb("core_functions").$type<string[]>().notNull().default(sql`'[]'`),
  responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default(sql`'[]'`),
  toneVoice: text("tone_voice"),
  definitionOfDone: jsonb("definition_of_done").$type<string[]>().notNull().default(sql`'[]'`),
  strengths: jsonb("strengths").$type<string[]>().notNull().default(sql`'[]'`),
  collaborators: jsonb("collaborators").$type<string[]>().notNull().default(sql`'[]'`),
  contact: text("contact"),
  links: jsonb("links").$type<string[]>().notNull().default(sql`'[]'`),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'`),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleRaci = pgTable("role_raci", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  workstream: text("workstream").notNull(),
  roleHandle: text("role_handle").notNull(),
  responsible: jsonb("responsible").$type<string[]>().notNull().default(sql`'[]'`),
  accountable: jsonb("accountable").$type<string[]>().notNull().default(sql`'[]'`),
  consulted: jsonb("consulted").$type<string[]>().notNull().default(sql`'[]'`),
  informed: jsonb("informed").$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// AGENT SPECS
// ===========================

export const agentSpecs = pgTable("agent_specs", {
  handle: text("handle").primaryKey(),
  title: text("title").notNull(),
  pod: text("pod").notNull(),
  threadId: text("thread_id"),
  systemPrompt: text("system_prompt").notNull(),
  instructionBlocks: jsonb("instruction_blocks").$type<string[]>().notNull().default(sql`'[]'`),
  tools: jsonb("tools").$type<string[]>().notNull().default(sql`'[]'`),
  policies: jsonb("policies").$type<Record<string, any>>().notNull().default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===========================
// WORK ITEMS
// ===========================

export const workItems = pgTable("work_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  podId: integer("pod_id").references(() => pods.id),
  ownerId: integer("owner_id").references(() => persons.id),
  status: text("status").notNull().default('todo'), // todo, in_progress, blocked, done
  priority: text("priority").default('medium'), // low, medium, high, critical
  dueDate: timestamp("due_date"),
  milestone: text("milestone"),
  sourceLinks: jsonb("source_links").$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===========================
// DECISIONS
// ===========================

export const decisions = pgTable("decisions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  summary: text("summary").notNull(),
  rationale: text("rationale").notNull(),
  approver: text("approver").notNull(),
  effectiveAt: timestamp("effective_at").notNull(),
  status: text("status").notNull().default('active'), // active, superseded, archived
  links: jsonb("links").$type<string[]>().notNull().default(sql`'[]'`),
  podIds: jsonb("pod_ids").$type<number[]>().notNull().default(sql`'[]'`),
  workItemIds: jsonb("work_item_ids").$type<number[]>().notNull().default(sql`'[]'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// BRAINSTORM STUDIO
// ===========================

export const brainstormSessions = pgTable("brainstorm_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  template: text("template"),
  facilitatorId: integer("facilitator_id").references(() => persons.id),
  status: text("status").notNull().default('planning'), // planning, diverging, clustering, scoring, committed
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brainstormParticipants = pgTable("brainstorm_participants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().references(() => brainstormSessions.id, { onDelete: 'cascade' }),
  personId: integer("person_id").notNull().references(() => persons.id),
  role: text("role").notNull(), // pro, adv, neutral, customer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brainstormIdeas = pgTable("brainstorm_ideas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().references(() => brainstormSessions.id, { onDelete: 'cascade' }),
  authorId: integer("author_id").notNull().references(() => persons.id),
  text: text("text").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'`),
  clusterId: integer("cluster_id").references(() => brainstormClusters.id),
  scoreJson: jsonb("score_json").$type<{ impact?: number; effort?: number; confidence?: number }>(),
  status: text("status").notNull().default('active'), // active, merged, discarded
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brainstormClusters = pgTable("brainstorm_clusters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().references(() => brainstormSessions.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brainstormArtifacts = pgTable("brainstorm_artifacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().references(() => brainstormSessions.id, { onDelete: 'cascade' }),
  link: text("link").notNull(),
  kind: text("kind").notNull(), // doc, fig, zip
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// AUDIT ENGINE
// ===========================

export const audits = pgTable("audits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  type: text("type").notNull(), // security_soc2, ip_readiness, brand_lock, finance_ops
  facilitatorId: integer("facilitator_id").references(() => persons.id),
  status: text("status").notNull().default('planning'), // planning, in_progress, review, completed
  dueAt: timestamp("due_at"),
  pods: jsonb("pods").$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const auditChecks = pgTable("audit_checks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  auditId: integer("audit_id").notNull().references(() => audits.id, { onDelete: 'cascade' }),
  key: text("key").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  ownerId: integer("owner_id").references(() => persons.id),
  status: text("status").notNull().default('pending'), // pending, in_progress, passed, failed, na
  notes: text("notes"),
  evidenceLink: text("evidence_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditFindings = pgTable("audit_findings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  auditId: integer("audit_id").notNull().references(() => audits.id, { onDelete: 'cascade' }),
  checkId: integer("check_id").references(() => auditChecks.id),
  summary: text("summary").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditArtifacts = pgTable("audit_artifacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  auditId: integer("audit_id").notNull().references(() => audits.id, { onDelete: 'cascade' }),
  link: text("link").notNull(),
  sha256: text("sha256"),
  kind: text("kind").notNull(), // report, index, evidence
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// EVENTS (Audit Trail)
// ===========================

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  actor: text("actor"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// CHAT CONVERSATIONS
// ===========================

export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  roleHandle: text("role_handle").notNull(), // Which Dream Team persona
  userId: integer("user_id").references(() => persons.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// AGENT MEMORY & LEARNING
// ===========================

export const agentMemories = pgTable("agent_memories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roleHandle: text("role_handle").notNull(),
  kind: text("kind").notNull(), // note, rule, feedback, learning
  textValue: text("text_value").notNull(),
  score: integer("score").default(0), // User rating or importance score
  metadata: jsonb("metadata").$type<Record<string, any>>().default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentRuns = pgTable("agent_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  roleHandle: text("role_handle").notNull(),
  task: text("task").notNull(),
  output: text("output"),
  links: jsonb("links").$type<string[]>().notNull().default(sql`'[]'`),
  conversationId: integer("conversation_id").references(() => conversations.id),
  duration: integer("duration"), // milliseconds
  status: text("status").notNull().default('completed'), // completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===========================
// RELATIONS
// ===========================

export const podsRelations = relations(pods, ({ many }) => ({
  persons: many(persons),
  workItems: many(workItems),
}));

export const personsRelations = relations(persons, ({ one, many }) => ({
  pod: one(pods, {
    fields: [persons.podId],
    references: [pods.id],
  }),
  workItems: many(workItems),
  facilitatedBrainstorms: many(brainstormSessions),
  facilitatedAudits: many(audits),
}));

export const workItemsRelations = relations(workItems, ({ one }) => ({
  pod: one(pods, {
    fields: [workItems.podId],
    references: [pods.id],
  }),
  owner: one(persons, {
    fields: [workItems.ownerId],
    references: [persons.id],
  }),
}));

export const brainstormSessionsRelations = relations(brainstormSessions, ({ one, many }) => ({
  facilitator: one(persons, {
    fields: [brainstormSessions.facilitatorId],
    references: [persons.id],
  }),
  participants: many(brainstormParticipants),
  ideas: many(brainstormIdeas),
  clusters: many(brainstormClusters),
  artifacts: many(brainstormArtifacts),
}));

export const brainstormParticipantsRelations = relations(brainstormParticipants, ({ one }) => ({
  session: one(brainstormSessions, {
    fields: [brainstormParticipants.sessionId],
    references: [brainstormSessions.id],
  }),
  person: one(persons, {
    fields: [brainstormParticipants.personId],
    references: [persons.id],
  }),
}));

export const brainstormIdeasRelations = relations(brainstormIdeas, ({ one }) => ({
  session: one(brainstormSessions, {
    fields: [brainstormIdeas.sessionId],
    references: [brainstormSessions.id],
  }),
  author: one(persons, {
    fields: [brainstormIdeas.authorId],
    references: [persons.id],
  }),
  cluster: one(brainstormClusters, {
    fields: [brainstormIdeas.clusterId],
    references: [brainstormClusters.id],
  }),
}));

export const brainstormClustersRelations = relations(brainstormClusters, ({ one, many }) => ({
  session: one(brainstormSessions, {
    fields: [brainstormClusters.sessionId],
    references: [brainstormSessions.id],
  }),
  ideas: many(brainstormIdeas),
}));

export const brainstormArtifactsRelations = relations(brainstormArtifacts, ({ one }) => ({
  session: one(brainstormSessions, {
    fields: [brainstormArtifacts.sessionId],
    references: [brainstormSessions.id],
  }),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  facilitator: one(persons, {
    fields: [audits.facilitatorId],
    references: [persons.id],
  }),
  checks: many(auditChecks),
  findings: many(auditFindings),
  artifacts: many(auditArtifacts),
}));

export const auditChecksRelations = relations(auditChecks, ({ one, many }) => ({
  audit: one(audits, {
    fields: [auditChecks.auditId],
    references: [audits.id],
  }),
  owner: one(persons, {
    fields: [auditChecks.ownerId],
    references: [persons.id],
  }),
  findings: many(auditFindings),
}));

export const auditFindingsRelations = relations(auditFindings, ({ one }) => ({
  audit: one(audits, {
    fields: [auditFindings.auditId],
    references: [audits.id],
  }),
  check: one(auditChecks, {
    fields: [auditFindings.checkId],
    references: [auditChecks.id],
  }),
}));

export const auditArtifactsRelations = relations(auditArtifacts, ({ one }) => ({
  audit: one(audits, {
    fields: [auditArtifacts.auditId],
    references: [audits.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(persons, {
    fields: [conversations.userId],
    references: [persons.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  conversation: one(conversations, {
    fields: [agentRuns.conversationId],
    references: [conversations.id],
  }),
}));

// ===========================
// INSERT SCHEMAS & TYPES
// ===========================

// Pods
export const insertPodSchema = createInsertSchema(pods).omit({ id: true, createdAt: true });
export type InsertPod = z.infer<typeof insertPodSchema>;
export type Pod = typeof pods.$inferSelect;

// Persons
export const insertPersonSchema = createInsertSchema(persons).omit({ id: true, createdAt: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

// Role Cards
export const insertRoleCardSchema = createInsertSchema(roleCards).omit({ id: true, updatedAt: true });
export type InsertRoleCard = z.infer<typeof insertRoleCardSchema>;
export type RoleCard = typeof roleCards.$inferSelect;

// Role RACI
export const insertRoleRaciSchema = createInsertSchema(roleRaci).omit({ id: true, createdAt: true });
export type InsertRoleRaci = z.infer<typeof insertRoleRaciSchema>;
export type RoleRaci = typeof roleRaci.$inferSelect;

// Work Items
export const insertWorkItemSchema = createInsertSchema(workItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type WorkItem = typeof workItems.$inferSelect;

// Decisions
export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true });
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

// Brainstorm Sessions
export const insertBrainstormSessionSchema = createInsertSchema(brainstormSessions).omit({ id: true, createdAt: true });
export type InsertBrainstormSession = z.infer<typeof insertBrainstormSessionSchema>;
export type BrainstormSession = typeof brainstormSessions.$inferSelect;

// Brainstorm Participants
export const insertBrainstormParticipantSchema = createInsertSchema(brainstormParticipants).omit({ id: true, createdAt: true });
export type InsertBrainstormParticipant = z.infer<typeof insertBrainstormParticipantSchema>;
export type BrainstormParticipant = typeof brainstormParticipants.$inferSelect;

// Brainstorm Ideas
export const insertBrainstormIdeaSchema = createInsertSchema(brainstormIdeas).omit({ id: true, createdAt: true });
export type InsertBrainstormIdea = z.infer<typeof insertBrainstormIdeaSchema>;
export type BrainstormIdea = typeof brainstormIdeas.$inferSelect;

// Brainstorm Clusters
export const insertBrainstormClusterSchema = createInsertSchema(brainstormClusters).omit({ id: true, createdAt: true });
export type InsertBrainstormCluster = z.infer<typeof insertBrainstormClusterSchema>;
export type BrainstormCluster = typeof brainstormClusters.$inferSelect;

// Brainstorm Artifacts
export const insertBrainstormArtifactSchema = createInsertSchema(brainstormArtifacts).omit({ id: true, createdAt: true });
export type InsertBrainstormArtifact = z.infer<typeof insertBrainstormArtifactSchema>;
export type BrainstormArtifact = typeof brainstormArtifacts.$inferSelect;

// Audits
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true, completedAt: true });
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;

// Audit Checks
export const insertAuditCheckSchema = createInsertSchema(auditChecks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAuditCheck = z.infer<typeof insertAuditCheckSchema>;
export type AuditCheck = typeof auditChecks.$inferSelect;

// Audit Findings
export const insertAuditFindingSchema = createInsertSchema(auditFindings).omit({ id: true, createdAt: true });
export type InsertAuditFinding = z.infer<typeof insertAuditFindingSchema>;
export type AuditFinding = typeof auditFindings.$inferSelect;

// Audit Artifacts
export const insertAuditArtifactSchema = createInsertSchema(auditArtifacts).omit({ id: true, createdAt: true });
export type InsertAuditArtifact = z.infer<typeof insertAuditArtifactSchema>;
export type AuditArtifact = typeof auditArtifacts.$inferSelect;

// Events
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Conversations
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Agent Memories
export const insertAgentMemorySchema = createInsertSchema(agentMemories).omit({ id: true, createdAt: true });
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemories.$inferSelect;

// Agent Runs
export const insertAgentRunSchema = createInsertSchema(agentRuns).omit({ id: true, createdAt: true });
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
export type AgentRun = typeof agentRuns.$inferSelect;

// Agent Specs
export const insertAgentSpecSchema = createInsertSchema(agentSpecs).omit({ createdAt: true, updatedAt: true });
export type InsertAgentSpec = z.infer<typeof insertAgentSpecSchema>;
export type AgentSpec = typeof agentSpecs.$inferSelect;