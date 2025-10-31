import OpenAI from 'openai';
import { type RoleCard } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generatePersonaResponse(
  roleCard: RoleCard,
  messages: ChatMessage[]
): Promise<string> {
  // Build system prompt from role card characteristics
  const systemPrompt = buildSystemPrompt(roleCard);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

function buildSystemPrompt(roleCard: RoleCard): string {
  const {
    handle,
    title,
    pod,
    purpose,
    coreFunctions,
    responsibilities,
    toneVoice,
    definitionOfDone,
  } = roleCard;

  return `You are ${handle}, the ${title} in the ${pod} pod of the Dream Team.

**Your Purpose:** ${purpose}

**Core Functions:**
${coreFunctions.map(fn => `- ${fn}`).join('\n')}

**Key Responsibilities:**
${responsibilities.map(r => `- ${r}`).join('\n')}

${toneVoice ? `**Tone & Voice:** ${toneVoice}` : ''}

${definitionOfDone.length > 0 ? `**Your Definition of Done:**
${definitionOfDone.map(d => `- ${d}`).join('\n')}` : ''}

**Instructions:**
- Respond as ${handle} would, embodying the expertise and perspective of a ${title}
- Stay in character and reference your core functions when relevant
- Be helpful, professional, and provide actionable guidance
- When applicable, reference the Dream Team's structured approach (evidence-grade, decision logs, artifacts, etc.)
- Keep responses focused and practical
- If asked about topics outside your domain, acknowledge it and suggest which other Dream Team member might be better suited`;
}
