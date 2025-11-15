// Referenced from javascript_database integration blueprint
import { 
  users, pods, podAgents, agents, evidencePacks, persons, roleCards, roleRaci, coverageHistory, agentSpecs, workItems, decisions, ideaSparks,
  brainstormSessions, brainstormParticipants, brainstormIdeas, brainstormClusters, brainstormArtifacts,
  audits, auditChecks, auditFindings, auditArtifacts, events,
  conversations, messages, agentMemories, agentRuns,
  projects, projectFiles, projectAgents, projectTasks, projectMessages,
  agentGoldens, workOrders, playbookPreviews, brands, knowledgeLinks, products, workItemPacks, lifestyleHeroReferences, lifestyleHeroShotSettings,
  type User, type UpsertUser,
  type Pod, type PodAgent, type Agent, type EvidencePack, type Person, type RoleCard, type RoleRaci, type CoverageHistory, type AgentSpec, type WorkItem, type Decision, type IdeaSpark,
  type BrainstormSession, type BrainstormParticipant, type BrainstormIdea, type BrainstormCluster, type BrainstormArtifact,
  type Audit, type AuditCheck, type AuditFinding, type AuditArtifact, type Event,
  type Conversation, type Message, type AgentMemory, type AgentRun,
  type Project, type ProjectFile, type ProjectAgent, type ProjectTask, type ProjectMessage,
  type AgentGolden, type WorkOrder, type PlaybookPreview, type Brand, type KnowledgeLink, type Product, type WorkItemPack, type LifestyleHeroReference, type LifestyleHeroShotSettings, type LifestyleHeroVersion,
  type InsertPod, type InsertPodAgent, type InsertAgent, type InsertEvidencePack, type InsertPerson, type InsertRoleCard, type InsertRoleRaci, type InsertCoverageHistory, type InsertAgentSpec, type InsertWorkItem, type InsertDecision, type InsertIdeaSpark,
  type InsertBrainstormSession, type InsertBrainstormParticipant, type InsertBrainstormIdea, type InsertBrainstormCluster, type InsertBrainstormArtifact,
  type InsertAudit, type InsertAuditCheck, type InsertAuditFinding, type InsertAuditArtifact, type InsertEvent,
  type InsertConversation, type InsertMessage, type InsertAgentMemory, type InsertAgentRun,
  type InsertProject, type InsertProjectFile, type InsertProjectAgent, type InsertProjectTask, type InsertProjectMessage,
  type InsertAgentGolden, type InsertWorkOrder, type InsertPlaybookPreview, type InsertBrand, type InsertKnowledgeLink, type InsertProduct, type InsertLifestyleHeroReference, type InsertLifestyleHeroVersion,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Users (Replit Auth - mandatory)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Pods
  getPods(): Promise<Pod[]>;
  getPod(id: number): Promise<Pod | undefined>;
  createPod(pod: InsertPod): Promise<Pod>;
  updatePod(id: number, pod: Partial<InsertPod>): Promise<Pod | undefined>;
  deletePod(id: number): Promise<boolean>;
  
  // Pod Agents (DEPRECATED - use unified agents instead)
  getPodAgents(podId?: number): Promise<PodAgent[]>;
  createPodAgent(agent: InsertPodAgent): Promise<PodAgent>;
  
  // Unified Agents (Dream Team + Pod Roles with Skill Packs)
  getAgents(filters?: { type?: string; podId?: number; pillar?: string; status?: string }): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  
  // Evidence Packs
  getEvidencePacks(filters?: { agentId?: string; status?: string }): Promise<EvidencePack[]>;
  getEvidencePack(id: number): Promise<EvidencePack | undefined>;
  createEvidencePack(pack: InsertEvidencePack): Promise<EvidencePack>;
  updateEvidencePack(id: number, pack: Partial<InsertEvidencePack>): Promise<EvidencePack | undefined>;
  deleteEvidencePack(id: number): Promise<boolean>;
  
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
  
  // Coverage History
  getCoverageHistory(filters?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<CoverageHistory[]>;
  getCoverageSnapshot(id: number): Promise<CoverageHistory | undefined>;
  createCoverageSnapshot(snapshot: InsertCoverageHistory): Promise<CoverageHistory>;
  getLatestCoverageSnapshot(): Promise<CoverageHistory | undefined>;
  
  // Agent Specs
  getAgentSpecs(): Promise<AgentSpec[]>;
  getAgentSpec(handle: string): Promise<AgentSpec | undefined>;
  upsertAgentSpec(spec: InsertAgentSpec): Promise<AgentSpec>;
  deleteAgentSpec(handle: string): Promise<boolean>;
  
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
  
  // Idea Sparks
  getIdeaSparks(filters?: { userId?: string; projectId?: number; pod?: string; hasProject?: boolean }): Promise<IdeaSpark[]>;
  getIdeaSpark(id: number): Promise<IdeaSpark | undefined>;
  createIdeaSpark(spark: InsertIdeaSpark): Promise<IdeaSpark>;
  updateIdeaSpark(id: number, spark: Partial<InsertIdeaSpark>): Promise<IdeaSpark | undefined>;
  deleteIdeaSpark(id: number): Promise<boolean>;
  
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
  
  // Projects
  getProjects(filters?: { category?: string; status?: string; podId?: number; brandId?: number }): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project Files
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  getProjectFile(id: number): Promise<ProjectFile | undefined>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile | undefined>;
  deleteProjectFile(id: number): Promise<boolean>;
  
  // Project Agents
  getProjectAgents(projectId: number): Promise<ProjectAgent[]>;
  createProjectAgent(assignment: InsertProjectAgent): Promise<ProjectAgent>;
  deleteProjectAgent(id: number): Promise<boolean>;
  
  // Project Tasks
  getProjectTasks(projectId: number): Promise<ProjectTask[]>;
  getProjectTask(id: number): Promise<ProjectTask | undefined>;
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: number, task: Partial<InsertProjectTask>): Promise<ProjectTask | undefined>;
  deleteProjectTask(id: number): Promise<boolean>;
  
  // Project Messages
  getProjectMessages(projectId: number): Promise<ProjectMessage[]>;
  createProjectMessage(message: InsertProjectMessage): Promise<ProjectMessage>;
  
  // Agent Goldens (Nightly Snapshots)
  getAgentGoldens(limit?: number): Promise<AgentGolden[]>;
  getAgentGolden(id: number): Promise<AgentGolden | undefined>;
  createAgentGolden(golden: InsertAgentGolden): Promise<AgentGolden>;
  
  // Work Orders
  getWorkOrders(): Promise<WorkOrder[]>;
  createWorkOrder(order: InsertWorkOrder): Promise<WorkOrder>;
  
  // Playbook Previews (Drafts)
  getPlaybookPreviews(): Promise<PlaybookPreview[]>;
  getPlaybookPreview(id: number): Promise<PlaybookPreview | undefined>;
  createPlaybookPreview(preview: InsertPlaybookPreview): Promise<PlaybookPreview>;
  updatePlaybookPreview(id: number, preview: Partial<InsertPlaybookPreview>): Promise<PlaybookPreview | undefined>;
  deletePlaybookPreview(id: number): Promise<boolean>;
  
  // Brands
  getBrands(filters?: { businessUnit?: string }): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  
  // Knowledge Links
  getKnowledgeLinks(filters?: { businessUnit?: string }): Promise<KnowledgeLink[]>;
  createKnowledgeLink(link: InsertKnowledgeLink): Promise<KnowledgeLink>;
  
  // Products
  getProducts(filters?: { brandId?: number }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Work Item Packs
  getWorkItemPacksByType(workItemId: number, packType: string): Promise<WorkItemPack[]>;
  
  // Lifestyle Hero References
  createLifestyleHeroReference(ref: InsertLifestyleHeroReference): Promise<LifestyleHeroReference>;
  getLifestyleHeroReferences(workItemId: number, shotId?: string): Promise<LifestyleHeroReference[]>;
  deleteLifestyleHeroReference(id: number): Promise<boolean>;

  // Lifestyle Hero Versions
  createLifestyleHeroVersion(version: InsertLifestyleHeroVersion): Promise<LifestyleHeroVersion>;
  getLifestyleHeroVersions(workItemId: number, shotId: string): Promise<LifestyleHeroVersion[]>;
  getActiveLifestyleHeroVersion(workItemId: number, shotId: string): Promise<LifestyleHeroVersion | null>;
  getNextVersionNumber(workItemId: number, shotId: string): Promise<number>;
  setActiveLifestyleHeroVersion(workItemId: number, shotId: string, versionNumber: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ===== USERS (Replit Auth) =====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to find existing user by ID first
    if (userData.id) {
      const existing = await this.getUser(userData.id);
      if (existing) {
        // Update existing user
        const [updated] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updated;
      }
    }
    
    // If no ID or user doesn't exist, try to find by email
    if (userData.email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existing) {
        // Update existing user found by email
        const [updated] = await db
          .update(users)
          .set({
            ...userData,
            id: existing.id, // Preserve existing ID
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id))
          .returning();
        return updated;
      }
    }
    
    // No existing user found, insert new one
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

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

  async updatePod(id: number, pod: Partial<InsertPod>): Promise<Pod | undefined> {
    const [updated] = await db.update(pods).set(pod).where(eq(pods.id, id)).returning();
    return updated || undefined;
  }

  async deletePod(id: number): Promise<boolean> {
    const result = await db.delete(pods).where(eq(pods.id, id));
    return true;
  }

  // ===== POD AGENTS (DEPRECATED - use unified agents) =====
  async getPodAgents(podId?: number): Promise<PodAgent[]> {
    if (podId) {
      return await db.select().from(podAgents).where(eq(podAgents.podId, podId));
    }
    return await db.select().from(podAgents);
  }

  async createPodAgent(agent: InsertPodAgent): Promise<PodAgent> {
    const [newAgent] = await db.insert(podAgents).values(agent).returning();
    return newAgent;
  }

  // ===== UNIFIED AGENTS (Dream Team + Pod Roles with Skill Packs) =====
  async getAgents(filters?: { type?: string; podId?: number; pillar?: string; status?: string }): Promise<Agent[]> {
    let query = db.select().from(agents);
    
    const conditions = [];
    if (filters?.type) conditions.push(eq(agents.type, filters.type));
    if (filters?.podId) conditions.push(eq(agents.podId, filters.podId));
    if (filters?.pillar) conditions.push(eq(agents.pillar, filters.pillar));
    if (filters?.status) conditions.push(eq(agents.status, filters.status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(agents.title);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [created] = await db.insert(agents).values(agent).returning();
    return created;
  }

  async updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db.update(agents)
      .set({ ...agent, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAgent(id: string): Promise<boolean> {
    await db.delete(agents).where(eq(agents.id, id));
    return true;
  }

  // ===== EVIDENCE PACKS =====
  async getEvidencePacks(filters?: { agentId?: string; status?: string }): Promise<EvidencePack[]> {
    let query = db.select().from(evidencePacks);
    
    const conditions = [];
    if (filters?.agentId) conditions.push(eq(evidencePacks.agentId, filters.agentId));
    if (filters?.status) conditions.push(eq(evidencePacks.status, filters.status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(evidencePacks.submittedAt));
  }

  async getEvidencePack(id: number): Promise<EvidencePack | undefined> {
    const [pack] = await db.select().from(evidencePacks).where(eq(evidencePacks.id, id));
    return pack || undefined;
  }

  async createEvidencePack(pack: InsertEvidencePack): Promise<EvidencePack> {
    const [created] = await db.insert(evidencePacks).values(pack).returning();
    return created;
  }

  async updateEvidencePack(id: number, pack: Partial<InsertEvidencePack>): Promise<EvidencePack | undefined> {
    const [updated] = await db.update(evidencePacks)
      .set({ ...pack, updatedAt: new Date() })
      .where(eq(evidencePacks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEvidencePack(id: number): Promise<boolean> {
    await db.delete(evidencePacks).where(eq(evidencePacks.id, id));
    return true;
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

  // ===== COVERAGE HISTORY =====
  async getCoverageHistory(filters?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<CoverageHistory[]> {
    let query = db.select().from(coverageHistory);
    
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(sql`${coverageHistory.snapshotDate} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${coverageHistory.snapshotDate} <= ${filters.endDate}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(coverageHistory.snapshotDate)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async getCoverageSnapshot(id: number): Promise<CoverageHistory | undefined> {
    const [snapshot] = await db.select().from(coverageHistory).where(eq(coverageHistory.id, id));
    return snapshot || undefined;
  }

  async createCoverageSnapshot(snapshot: InsertCoverageHistory): Promise<CoverageHistory> {
    const [created] = await db.insert(coverageHistory).values(snapshot).returning();
    return created;
  }

  async getLatestCoverageSnapshot(): Promise<CoverageHistory | undefined> {
    const [latest] = await db.select().from(coverageHistory)
      .orderBy(desc(coverageHistory.snapshotDate))
      .limit(1);
    return latest || undefined;
  }

  // ===== AGENT SPECS =====
  async getAgentSpecs(): Promise<AgentSpec[]> {
    return await db.select().from(agentSpecs).orderBy(agentSpecs.handle);
  }

  async getAgentSpec(handle: string): Promise<AgentSpec | undefined> {
    const [spec] = await db.select().from(agentSpecs).where(eq(agentSpecs.handle, handle));
    return spec || undefined;
  }

  async upsertAgentSpec(spec: InsertAgentSpec): Promise<AgentSpec> {
    const [upserted] = await db.insert(agentSpecs)
      .values(spec)
      .onConflictDoUpdate({
        target: agentSpecs.handle,
        set: {
          title: spec.title,
          pod: spec.pod,
          threadId: spec.threadId,
          systemPrompt: spec.systemPrompt,
          instructionBlocks: spec.instructionBlocks,
          tools: spec.tools,
          policies: spec.policies,
          updatedAt: new Date(),
        }
      })
      .returning();
    return upserted;
  }

  async deleteAgentSpec(handle: string): Promise<boolean> {
    const result = await db.delete(agentSpecs).where(eq(agentSpecs.handle, handle));
    return (result.rowCount ?? 0) > 0;
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

  // ===== IDEA SPARKS =====
  async getIdeaSparks(filters?: { userId?: string; projectId?: number; pod?: string; hasProject?: boolean }): Promise<IdeaSpark[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(ideaSparks.userId, filters.userId));
    }
    if (filters?.projectId) {
      conditions.push(eq(ideaSparks.projectId, filters.projectId));
    }
    if (filters?.pod) {
      conditions.push(eq(ideaSparks.pod, filters.pod));
    }
    if (filters?.hasProject) {
      conditions.push(isNotNull(ideaSparks.projectId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(ideaSparks).where(and(...conditions)).orderBy(desc(ideaSparks.createdAt));
    }
    
    return await db.select().from(ideaSparks).orderBy(desc(ideaSparks.createdAt));
  }

  async getIdeaSpark(id: number): Promise<IdeaSpark | undefined> {
    const [spark] = await db.select().from(ideaSparks).where(eq(ideaSparks.id, id));
    return spark;
  }

  async createIdeaSpark(spark: InsertIdeaSpark): Promise<IdeaSpark> {
    const [created] = await db.insert(ideaSparks).values(spark).returning();
    return created;
  }

  async updateIdeaSpark(id: number, spark: Partial<InsertIdeaSpark>): Promise<IdeaSpark | undefined> {
    const [updated] = await db.update(ideaSparks)
      .set(spark)
      .where(eq(ideaSparks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteIdeaSpark(id: number): Promise<boolean> {
    const result = await db.delete(ideaSparks).where(eq(ideaSparks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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

  // ===== PROJECTS =====
  async getProjects(filters?: { category?: string; status?: string; podId?: number; brandId?: number }): Promise<Project[]> {
    let query = db.select().from(projects);
    
    const conditions = [];
    if (filters?.category) conditions.push(eq(projects.category, filters.category));
    if (filters?.status) conditions.push(eq(projects.status, filters.status));
    if (filters?.podId) conditions.push(eq(projects.podId, filters.podId));
    if (filters?.brandId) conditions.push(eq(projects.brandId, filters.brandId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // ===== PROJECT FILES =====
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.createdAt));
  }

  async getProjectFile(id: number): Promise<ProjectFile | undefined> {
    const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, id));
    return file || undefined;
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [created] = await db.insert(projectFiles).values(file).returning();
    return created;
  }

  async updateProjectFile(id: number, file: Partial<InsertProjectFile>): Promise<ProjectFile | undefined> {
    const [updated] = await db.update(projectFiles)
      .set({ ...file, updatedAt: new Date() })
      .where(eq(projectFiles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProjectFile(id: number): Promise<boolean> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
    return true;
  }

  // ===== PROJECT AGENTS =====
  async getProjectAgents(projectId: number): Promise<ProjectAgent[]> {
    return await db.select().from(projectAgents)
      .where(eq(projectAgents.projectId, projectId))
      .orderBy(projectAgents.assignedAt);
  }

  async createProjectAgent(assignment: InsertProjectAgent): Promise<ProjectAgent> {
    const [created] = await db.insert(projectAgents).values(assignment).returning();
    return created;
  }

  async deleteProjectAgent(id: number): Promise<boolean> {
    await db.delete(projectAgents).where(eq(projectAgents.id, id));
    return true;
  }

  // ===== PROJECT TASKS =====
  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    return await db.select().from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(projectTasks.createdAt);
  }

  async getProjectTask(id: number): Promise<ProjectTask | undefined> {
    const [task] = await db.select().from(projectTasks).where(eq(projectTasks.id, id));
    return task || undefined;
  }

  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [created] = await db.insert(projectTasks).values(task).returning();
    return created;
  }

  async updateProjectTask(id: number, task: Partial<InsertProjectTask>): Promise<ProjectTask | undefined> {
    const [updated] = await db.update(projectTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(projectTasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProjectTask(id: number): Promise<boolean> {
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
    return true;
  }

  // ===== PROJECT MESSAGES =====
  async getProjectMessages(projectId: number): Promise<ProjectMessage[]> {
    return await db.select().from(projectMessages)
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(projectMessages.createdAt);
  }

  async createProjectMessage(message: InsertProjectMessage): Promise<ProjectMessage> {
    const [created] = await db.insert(projectMessages).values(message).returning();
    return created;
  }

  // ===== AGENT GOLDENS (NIGHTLY SNAPSHOTS) =====
  async getAgentGoldens(limit: number = 30): Promise<AgentGolden[]> {
    return await db.select().from(agentGoldens)
      .orderBy(desc(agentGoldens.snapshotDate))
      .limit(limit);
  }

  async getAgentGolden(id: number): Promise<AgentGolden | undefined> {
    const [golden] = await db.select().from(agentGoldens).where(eq(agentGoldens.id, id));
    return golden || undefined;
  }

  async createAgentGolden(golden: InsertAgentGolden): Promise<AgentGolden> {
    const [created] = await db.insert(agentGoldens).values(golden).returning();
    return created;
  }

  // ===== WORK ORDERS =====
  async getWorkOrders(): Promise<WorkOrder[]> {
    return await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
  }

  async createWorkOrder(order: InsertWorkOrder): Promise<WorkOrder> {
    const [created] = await db.insert(workOrders).values(order).returning();
    return created;
  }

  // ===== PLAYBOOK PREVIEWS (DRAFTS) =====
  async getPlaybookPreviews(): Promise<PlaybookPreview[]> {
    return db.select().from(playbookPreviews).orderBy(desc(playbookPreviews.updatedAt));
  }

  async getPlaybookPreview(id: number): Promise<PlaybookPreview | undefined> {
    const [preview] = await db.select().from(playbookPreviews).where(eq(playbookPreviews.id, id));
    return preview;
  }

  async createPlaybookPreview(preview: InsertPlaybookPreview): Promise<PlaybookPreview> {
    const [created] = await db.insert(playbookPreviews).values(preview).returning();
    return created;
  }

  async updatePlaybookPreview(id: number, preview: Partial<InsertPlaybookPreview>): Promise<PlaybookPreview | undefined> {
    const [updated] = await db
      .update(playbookPreviews)
      .set({ ...preview, updatedAt: new Date() })
      .where(eq(playbookPreviews.id, id))
      .returning();
    return updated;
  }

  async deletePlaybookPreview(id: number): Promise<boolean> {
    const result = await db.delete(playbookPreviews).where(eq(playbookPreviews.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ===== BRANDS =====
  async getBrands(filters?: { businessUnit?: string }): Promise<Brand[]> {
    let query = db.select().from(brands).orderBy(brands.name);
    
    if (filters?.businessUnit) {
      const filtered = await query;
      return filtered.filter(b => b.businessUnit === filters.businessUnit);
    }
    
    return await query;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(brand).returning();
    return created;
  }

  // ===== KNOWLEDGE LINKS =====
  async getKnowledgeLinks(filters?: { businessUnit?: string }): Promise<KnowledgeLink[]> {
    let query = db.select().from(knowledgeLinks).orderBy(knowledgeLinks.label);
    
    if (filters?.businessUnit) {
      const filtered = await query;
      return filtered.filter(k => k.businessUnit === filters.businessUnit);
    }
    
    return await query;
  }

  async createKnowledgeLink(link: InsertKnowledgeLink): Promise<KnowledgeLink> {
    const [created] = await db.insert(knowledgeLinks).values(link).returning();
    return created;
  }

  // ===== PRODUCTS =====
  async getProducts(filters?: { brandId?: number }): Promise<Product[]> {
    let query = db.select().from(products).orderBy(products.name);
    
    if (filters?.brandId) {
      const filtered = await query;
      return filtered.filter(p => p.brandId === filters.brandId);
    }
    
    return await query;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  // ===== WORK ITEM PACKS =====
  async getWorkItemPacksByType(workItemId: number, packType: string): Promise<WorkItemPack[]> {
    return await db
      .select()
      .from(workItemPacks)
      .where(and(
        eq(workItemPacks.workItemId, workItemId),
        eq(workItemPacks.packType, packType)
      ))
      .orderBy(desc(workItemPacks.version));
  }

  // ===== LIFESTYLE HERO REFERENCES =====
  async createLifestyleHeroReference(ref: InsertLifestyleHeroReference): Promise<LifestyleHeroReference> {
    const [created] = await db.insert(lifestyleHeroReferences).values(ref).returning();
    return created;
  }

  async getLifestyleHeroReferences(workItemId: number, shotId?: string): Promise<LifestyleHeroReference[]> {
    const conditions = [eq(lifestyleHeroReferences.workItemId, workItemId)];
    if (shotId) {
      conditions.push(eq(lifestyleHeroReferences.shotId, shotId));
    }
    return await db
      .select()
      .from(lifestyleHeroReferences)
      .where(and(...conditions))
      .orderBy(desc(lifestyleHeroReferences.uploadedAt));
  }

  async deleteLifestyleHeroReference(id: number): Promise<boolean> {
    const result = await db.delete(lifestyleHeroReferences).where(eq(lifestyleHeroReferences.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ===== LIFESTYLE HERO SHOT SETTINGS =====
  async upsertLifestyleHeroShotSettings(
    workItemId: number,
    shotId: string,
    instructions: string | null
  ): Promise<LifestyleHeroShotSettings> {
    const [result] = await db
      .insert(lifestyleHeroShotSettings)
      .values({
        workItemId,
        shotId,
        promptInstructions: instructions,
      })
      .onConflictDoUpdate({
        target: [lifestyleHeroShotSettings.workItemId, lifestyleHeroShotSettings.shotId],
        set: {
          promptInstructions: instructions,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    return result;
  }

  async getLifestyleHeroShotSettings(workItemId: number, shotId: string): Promise<LifestyleHeroShotSettings | null> {
    const results = await db
      .select()
      .from(lifestyleHeroShotSettings)
      .where(and(
        eq(lifestyleHeroShotSettings.workItemId, workItemId),
        eq(lifestyleHeroShotSettings.shotId, shotId)
      ))
      .limit(1);
    return results[0] || null;
  }

  async getLifestyleHeroShotSettingsForWorkItem(workItemId: number): Promise<LifestyleHeroShotSettings[]> {
    return await db
      .select()
      .from(lifestyleHeroShotSettings)
      .where(eq(lifestyleHeroShotSettings.workItemId, workItemId));
  }

  // ===== LIFESTYLE HERO VERSIONS =====
  async createLifestyleHeroVersion(version: InsertLifestyleHeroVersion): Promise<LifestyleHeroVersion> {
    const [created] = await db.insert(lifestyleHeroVersions).values(version).returning();
    return created;
  }

  async getLifestyleHeroVersions(workItemId: number, shotId: string): Promise<LifestyleHeroVersion[]> {
    return await db
      .select()
      .from(lifestyleHeroVersions)
      .where(and(
        eq(lifestyleHeroVersions.workItemId, workItemId),
        eq(lifestyleHeroVersions.shotId, shotId)
      ))
      .orderBy(desc(lifestyleHeroVersions.versionNumber));
  }

  async getActiveLifestyleHeroVersion(workItemId: number, shotId: string): Promise<LifestyleHeroVersion | null> {
    const results = await db
      .select()
      .from(lifestyleHeroVersions)
      .where(and(
        eq(lifestyleHeroVersions.workItemId, workItemId),
        eq(lifestyleHeroVersions.shotId, shotId),
        eq(lifestyleHeroVersions.isActive, true)
      ))
      .limit(1);
    return results[0] || null;
  }

  async getNextVersionNumber(workItemId: number, shotId: string): Promise<number> {
    const result = await db
      .select({ maxVersion: sql<number>`COALESCE(MAX(${lifestyleHeroVersions.versionNumber}), 0)` })
      .from(lifestyleHeroVersions)
      .where(and(
        eq(lifestyleHeroVersions.workItemId, workItemId),
        eq(lifestyleHeroVersions.shotId, shotId)
      ));
    return (result[0]?.maxVersion || 0) + 1;
  }

  async setActiveLifestyleHeroVersion(workItemId: number, shotId: string, versionNumber: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(lifestyleHeroVersions)
        .set({ isActive: false })
        .where(and(
          eq(lifestyleHeroVersions.workItemId, workItemId),
          eq(lifestyleHeroVersions.shotId, shotId)
        ));

      const result = await tx
        .update(lifestyleHeroVersions)
        .set({ isActive: true })
        .where(and(
          eq(lifestyleHeroVersions.workItemId, workItemId),
          eq(lifestyleHeroVersions.shotId, shotId),
          eq(lifestyleHeroVersions.versionNumber, versionNumber)
        ));

      if (result.rowCount === 0) {
        throw new Error(`Version ${versionNumber} not found for shot ${shotId} in work item ${workItemId}`);
      }
    });
  }
}

export const storage = new DatabaseStorage();
