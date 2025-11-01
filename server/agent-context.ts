import { storage } from "./storage";
import type { AgentMemory } from "@shared/schema";

export interface AgentContextOptions {
  includeMemories?: boolean;
  memoryLimit?: number;
  minScore?: number;
}

export interface AgentContext {
  systemPrompt: string;
  memories: AgentMemory[];
}

/**
 * Builds enhanced context for agent conversations including memory and learning
 */
export async function buildAgentContext(
  roleHandle: string,
  baseSystemPrompt: string,
  options: AgentContextOptions = {}
): Promise<AgentContext> {
  const {
    includeMemories = true,
    memoryLimit = 20,
    minScore = -10, // Include all but very negatively scored memories
  } = options;

  let memories: AgentMemory[] = [];
  let enhancedPrompt = baseSystemPrompt;

  if (includeMemories) {
    // Retrieve agent memories
    memories = await storage.getAgentMemories(roleHandle, {
      limit: memoryLimit,
      minScore,
    });

    // Build memory context if we have any
    if (memories.length > 0) {
      const memoryContext = buildMemoryContext(memories);
      enhancedPrompt = `${baseSystemPrompt}\n\n${memoryContext}`;
    }
  }

  return {
    systemPrompt: enhancedPrompt,
    memories,
  };
}

/**
 * Formats agent memories into a context string for AI prompts
 */
function buildMemoryContext(memories: AgentMemory[]): string {
  const sections: string[] = [];

  // Group memories by kind
  const grouped = memories.reduce((acc, memory) => {
    if (!acc[memory.kind]) {
      acc[memory.kind] = [];
    }
    acc[memory.kind].push(memory);
    return acc;
  }, {} as Record<string, AgentMemory[]>);

  // Add rules section (highest priority)
  if (grouped.rule && grouped.rule.length > 0) {
    const rules = grouped.rule
      .filter(m => (m.score ?? 0) >= 0) // Only positive/neutral rules
      .map(m => `- ${m.textValue}`)
      .join('\n');
    if (rules) {
      sections.push(`**Important Rules & Preferences:**\n${rules}`);
    }
  }

  // Add learnings section
  if (grouped.learning && grouped.learning.length > 0) {
    const learnings = grouped.learning
      .slice(0, 10) // Top 10 learnings
      .map(m => `- ${m.textValue}`)
      .join('\n');
    sections.push(`**Past Learnings:**\n${learnings}`);
  }

  // Add feedback section (selective)
  if (grouped.feedback && grouped.feedback.length > 0) {
    const positiveFeedback = grouped.feedback
      .filter(m => (m.score ?? 0) > 0)
      .slice(0, 5)
      .map(m => `- ${m.textValue}`)
      .join('\n');
    if (positiveFeedback) {
      sections.push(`**Positive Feedback to Remember:**\n${positiveFeedback}`);
    }
  }

  // Add notes section
  if (grouped.note && grouped.note.length > 0) {
    const notes = grouped.note
      .slice(0, 5)
      .map(m => `- ${m.textValue}`)
      .join('\n');
    sections.push(`**Reference Notes:**\n${notes}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `---\nAGENT MEMORY & LEARNING CONTEXT:\n\n${sections.join('\n\n')}\n---`;
}

/**
 * Records an agent run for tracking purposes
 */
export async function recordAgentRun(
  roleHandle: string,
  task: string,
  output: string,
  options: {
    conversationId?: number;
    links?: string[];
    duration?: number;
    status?: 'completed' | 'failed';
  } = {}
) {
  const {
    conversationId,
    links = [],
    duration,
    status = 'completed',
  } = options;

  return await storage.createAgentRun({
    roleHandle,
    task,
    output,
    conversationId,
    links,
    duration,
    status,
  });
}

/**
 * Records user feedback about an agent interaction
 */
export async function recordFeedback(
  roleHandle: string,
  feedback: string,
  score: number,
  kind: 'feedback' | 'rule' | 'learning' = 'feedback',
  metadata?: Record<string, any>
) {
  return await storage.createAgentMemory({
    roleHandle,
    kind,
    textValue: feedback,
    score,
    metadata: metadata || {},
  });
}
