// Referenced from javascript_database integration blueprint
import { 
  pods, persons, roleCards, roleRaci, workItems, decisions,
  brainstormSessions, brainstormParticipants, brainstormIdeas, brainstormClusters, brainstormArtifacts,
  audits, auditChecks, auditFindings, auditArtifacts, events,
  conversations, messages, agentMemories, agentRuns,
  type Pod, type Person, type RoleCard, type RoleRaci, type WorkItem, type Decision,
  type BrainstormSession, type BrainstormParticipant, type BrainstormIdea, type BrainstormCluster, type BrainstormArtifact,
  type Audit, type AuditCheck, type AuditFinding, type AuditArtifact, type Event,
  type Conversation, type Message, type AgentMemory, type AgentRun,
  type InsertPod, type InsertPerson, type InsertRoleCard, type InsertRoleRaci, type InsertWorkItem, type InsertDecision,
  type InsertBrainstormSession, type InsertBrainstormParticipant, type InsertBrainstormIdea, type InsertBrainstormCluster, type InsertBrainstormArtifact,
  type InsertAudit, type InsertAuditCheck, type InsertAuditFinding, type InsertAuditArtifact, type InsertEvent,
  type InsertConversation, type InsertMessage, type InsertAgentMemory, type InsertAgentRun,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Pods
  getPods(): Promise<Pod[]>;
  getPod(id: number): Promise<Pod | undefined>;
  createPod(pod: InsertPod): Promise<Pod>;
  
  // Persons
  getPersons(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  
  // Role Cards
  getRoleCards(filters?: { pod?: string; handle?: string }): Promise<RoleCard[]>;
  getRoleCard(id: number): Promise<RoleCard | undefined>;
  createRoleCard(roleCard: InsertRoleCard): Promise<RoleCard>;
  bulkCreateRoleCards(roleCards: InsertRoleCard[]): Promise<RoleCard[]>;
  updateRoleCard(id: number, roleCard: Partial<InsertRoleCard>): Promise<RoleCard | undefined>;
  deleteRoleCard(id: number): Promise<boolean>;
  
  // Role RACI
  getRoleRacis(filters?: { workstream?: string; roleHandle?: string }): Promise<RoleRaci[]>;
  createRoleRaci(raci: InsertRoleRaci): Promise<RoleRaci>;
  
  // Work Items
  getWorkItems(): Promise<WorkItem[]>;
  getWorkItem(id: number): Promise<WorkItem | undefined>;
  createWorkItem(item: InsertWorkItem): Promise<WorkItem>;
  updateWorkItem(id: number, item: Partial<InsertWorkItem>): Promise<WorkItem | undefined>;
  deleteWorkItem(id: number): Promise<boolean>;
  
  // Decisions
  getDecisions(): Promise<Decision[]>;
  getDecision(id: number): Promise<Decision | undefined>;
  createDecision(decision: InsertDecision): Promise<Decision>;
  
  // Brainstorm Sessions
  getBrainstormSessions(): Promise<BrainstormSession[]>;
  getBrainstormSession(id: number): Promise<BrainstormSession | undefined>;
  createBrainstormSession(session: InsertBrainstormSession): Promise<BrainstormSession>;
  updateBrainstormSession(id: number, session: Partial<InsertBrainstormSession>): Promise<BrainstormSession | undefined>;
  
  // Brainstorm Participants
  getBrainstormParticipants(sessionId: number): Promise<BrainstormParticipant[]>;
  createBrainstormParticipant(participant: InsertBrainstormParticipant): Promise<BrainstormParticipant>;
  
  // Brainstorm Ideas
  getBrainstormIdeas(sessionId: number): Promise<BrainstormIdea[]>;
  createBrainstormIdea(idea: InsertBrainstormIdea): Promise<BrainstormIdea>;
  updateBrainstormIdea(id: number, idea: Partial<InsertBrainstormIdea>): Promise<BrainstormIdea | undefined>;
  
  // Brainstorm Clusters
  getBrainstormClusters(sessionId: number): Promise<BrainstormCluster[]>;
  createBrainstormCluster(cluster: InsertBrainstormCluster): Promise<BrainstormCluster>;
  
  // Audits
  getAudits(): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined>;
  
  // Audit Checks
  getAuditChecks(auditId: number): Promise<AuditCheck[]>;
  createAuditCheck(check: InsertAuditCheck): Promise<AuditCheck>;
  updateAuditCheck(id: number, check: Partial<InsertAuditCheck>): Promise<AuditCheck | undefined>;
  
  // Audit Findings
  getAuditFindings(auditId: number): Promise<AuditFinding[]>;
  createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding>;
  
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Conversations
  getConversations(userId?: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  
  // Messages
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Agent Memories
  getAgentMemories(roleHandle: string, options?: { limit?: number; minScore?: number }): Promise<AgentMemory[]>;
  createAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory>;
  
  // Agent Runs
  getAgentRuns(roleHandle: string, options?: { limit?: number }): Promise<AgentRun[]>;
  createAgentRun(run: InsertAgentRun): Promise<AgentRun>;
}

export class DatabaseStorage implements IStorage {
  // ===== PODS =====
  async getPods(): Promise<Pod[]> {
    return await db.select().from(pods).orderBy(pods.name);
  }

  async getPod(id: number): Promise<Pod | undefined> {
    const [pod] = await db.select().from(pods).where(eq(pods.id, id));
    return pod || undefined;
  }

  async createPod(pod: InsertPod): Promise<Pod> {
    const [created] = await db.insert(pods).values(pod).returning();
    return created;
  }

  // ===== PERSONS =====
  async getPersons(): Promise<Person[]> {
    return await db.select().from(persons).orderBy(persons.name);
  }

  async getPerson(id: number): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person || undefined;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [created] = await db.insert(persons).values(person).returning();
    return created;
  }

  // ===== ROLE CARDS =====
  async getRoleCards(filters?: { pod?: string; handle?: string }): Promise<RoleCard[]> {
    let query = db.select().from(roleCards);
    
    if (filters?.pod && filters?.handle) {
      query = query.where(and(
        eq(roleCards.pod, filters.pod),
        eq(roleCards.handle, filters.handle)
      )) as any;
    } else if (filters?.pod) {
      query = query.where(eq(roleCards.pod, filters.pod)) as any;
    } else if (filters?.handle) {
      query = query.where(eq(roleCards.handle, filters.handle)) as any;
    }
    
    return await query.orderBy(roleCards.handle);
  }

  async getRoleCard(id: number): Promise<RoleCard | undefined> {
    const [roleCard] = await db.select().from(roleCards).where(eq(roleCards.id, id));
    return roleCard || undefined;
  }

  async createRoleCard(roleCard: InsertRoleCard): Promise<RoleCard> {
    const [created] = await db.insert(roleCards).values(roleCard).returning();
    return created;
  }

  async bulkCreateRoleCards(roleCardsList: InsertRoleCard[]): Promise<RoleCard[]> {
    if (roleCardsList.length === 0) return [];
    return await db.insert(roleCards).values(roleCardsList).returning();
  }

  async updateRoleCard(id: number, roleCard: Partial<InsertRoleCard>): Promise<RoleCard | undefined> {
    const [updated] = await db.update(roleCards)
      .set({ ...roleCard, updatedAt: new Date() })
      .where(eq(roleCards.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRoleCard(id: number): Promise<boolean> {
    const result = await db.delete(roleCards).where(eq(roleCards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ===== ROLE RACI =====
  async getRoleRacis(filters?: { workstream?: string; roleHandle?: string }): Promise<RoleRaci[]> {
    let query = db.select().from(roleRaci);
    
    if (filters?.workstream && filters?.roleHandle) {
      query = query.where(and(
        eq(roleRaci.workstream, filters.workstream),
        eq(roleRaci.roleHandle, filters.roleHandle)
      )) as any;
    } else if (filters?.workstream) {
      query = query.where(eq(roleRaci.workstream, filters.workstream)) as any;
    } else if (filters?.roleHandle) {
      query = query.where(eq(roleRaci.roleHandle, filters.roleHandle)) as any;
    }
    
    return await query.orderBy(roleRaci.workstream);
  }

  async createRoleRaci(raci: InsertRoleRaci): Promise<RoleRaci> {
    const [created] = await db.insert(roleRaci).values(raci).returning();
    return created;
  }

  // ===== WORK ITEMS =====
  async getWorkItems(): Promise<WorkItem[]> {
    return await db.select().from(workItems).orderBy(desc(workItems.createdAt));
  }

  async getWorkItem(id: number): Promise<WorkItem | undefined> {
    const [item] = await db.select().from(workItems).where(eq(workItems.id, id));
    return item || undefined;
  }

  async createWorkItem(item: InsertWorkItem): Promise<WorkItem> {
    const [created] = await db.insert(workItems).values(item).returning();
    return created;
  }

  async updateWorkItem(id: number, item: Partial<InsertWorkItem>): Promise<WorkItem | undefined> {
    const [updated] = await db.update(workItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(workItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkItem(id: number): Promise<boolean> {
    const result = await db.delete(workItems).where(eq(workItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ===== DECISIONS =====
  async getDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions).orderBy(desc(decisions.effectiveAt));
  }

  async getDecision(id: number): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision || undefined;
  }

  async createDecision(decision: InsertDecision): Promise<Decision> {
    const [created] = await db.insert(decisions).values(decision).returning();
    return created;
  }

  // ===== BRAINSTORM SESSIONS =====
  async getBrainstormSessions(): Promise<BrainstormSession[]> {
    return await db.select().from(brainstormSessions).orderBy(desc(brainstormSessions.createdAt));
  }

  async getBrainstormSession(id: number): Promise<BrainstormSession | undefined> {
    const [session] = await db.select().from(brainstormSessions).where(eq(brainstormSessions.id, id));
    return session || undefined;
  }

  async createBrainstormSession(session: InsertBrainstormSession): Promise<BrainstormSession> {
    const [created] = await db.insert(brainstormSessions).values(session).returning();
    return created;
  }

  async updateBrainstormSession(id: number, session: Partial<InsertBrainstormSession>): Promise<BrainstormSession | undefined> {
    const [updated] = await db.update(brainstormSessions)
      .set(session)
      .where(eq(brainstormSessions.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== BRAINSTORM PARTICIPANTS =====
  async getBrainstormParticipants(sessionId: number): Promise<BrainstormParticipant[]> {
    return await db.select().from(brainstormParticipants)
      .where(eq(brainstormParticipants.sessionId, sessionId));
  }

  async createBrainstormParticipant(participant: InsertBrainstormParticipant): Promise<BrainstormParticipant> {
    const [created] = await db.insert(brainstormParticipants).values(participant).returning();
    return created;
  }

  // ===== BRAINSTORM IDEAS =====
  async getBrainstormIdeas(sessionId: number): Promise<BrainstormIdea[]> {
    return await db.select().from(brainstormIdeas)
      .where(eq(brainstormIdeas.sessionId, sessionId))
      .orderBy(brainstormIdeas.createdAt);
  }

  async createBrainstormIdea(idea: InsertBrainstormIdea): Promise<BrainstormIdea> {
    const [created] = await db.insert(brainstormIdeas).values(idea).returning();
    return created;
  }

  async updateBrainstormIdea(id: number, idea: Partial<InsertBrainstormIdea>): Promise<BrainstormIdea | undefined> {
    const [updated] = await db.update(brainstormIdeas)
      .set(idea)
      .where(eq(brainstormIdeas.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== BRAINSTORM CLUSTERS =====
  async getBrainstormClusters(sessionId: number): Promise<BrainstormCluster[]> {
    return await db.select().from(brainstormClusters)
      .where(eq(brainstormClusters.sessionId, sessionId))
      .orderBy(brainstormClusters.label);
  }

  async createBrainstormCluster(cluster: InsertBrainstormCluster): Promise<BrainstormCluster> {
    const [created] = await db.insert(brainstormClusters).values(cluster).returning();
    return created;
  }

  // ===== AUDITS =====
  async getAudits(): Promise<Audit[]> {
    return await db.select().from(audits).orderBy(desc(audits.createdAt));
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit || undefined;
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [created] = await db.insert(audits).values(audit).returning();
    return created;
  }

  async updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined> {
    const [updated] = await db.update(audits)
      .set(audit)
      .where(eq(audits.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== AUDIT CHECKS =====
  async getAuditChecks(auditId: number): Promise<AuditCheck[]> {
    return await db.select().from(auditChecks)
      .where(eq(auditChecks.auditId, auditId))
      .orderBy(auditChecks.key);
  }

  async createAuditCheck(check: InsertAuditCheck): Promise<AuditCheck> {
    const [created] = await db.insert(auditChecks).values(check).returning();
    return created;
  }

  async updateAuditCheck(id: number, check: Partial<InsertAuditCheck>): Promise<AuditCheck | undefined> {
    const [updated] = await db.update(auditChecks)
      .set({ ...check, updatedAt: new Date() })
      .where(eq(auditChecks.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== AUDIT FINDINGS =====
  async getAuditFindings(auditId: number): Promise<AuditFinding[]> {
    return await db.select().from(auditFindings)
      .where(eq(auditFindings.auditId, auditId))
      .orderBy(auditFindings.createdAt);
  }

  async createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding> {
    const [created] = await db.insert(auditFindings).values(finding).returning();
    return created;
  }

  // ===== EVENTS =====
  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  // ===== CONVERSATIONS =====
  async getConversations(userId?: number): Promise<Conversation[]> {
    if (userId) {
      return await db.select().from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
    }
    return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updated] = await db.update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated || undefined;
  }

  // ===== MESSAGES =====
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  // ===== AGENT MEMORIES =====
  async getAgentMemories(roleHandle: string, options?: { limit?: number; minScore?: number }): Promise<AgentMemory[]> {
    let query = db.select().from(agentMemories)
      .where(eq(agentMemories.roleHandle, roleHandle))
      .orderBy(desc(agentMemories.score), desc(agentMemories.createdAt));
    
    if (options?.minScore !== undefined) {
      query = query.where(and(
        eq(agentMemories.roleHandle, roleHandle),
        sql`${agentMemories.score} >= ${options.minScore}`
      ));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async createAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory> {
    const [created] = await db.insert(agentMemories).values(memory).returning();
    return created;
  }

  // ===== AGENT RUNS =====
  async getAgentRuns(roleHandle: string, options?: { limit?: number }): Promise<AgentRun[]> {
    let query = db.select().from(agentRuns)
      .where(eq(agentRuns.roleHandle, roleHandle))
      .orderBy(desc(agentRuns.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }

  async createAgentRun(run: InsertAgentRun): Promise<AgentRun> {
    const [created] = await db.insert(agentRuns).values(run).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
