import OpenAI from 'openai';

const USE_OPENAI = process.env.USE_OPENAI === '1';
const openai = USE_OPENAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface SummonPayload {
  podId: number;
  ask: string;
  deliverables: string;
  due: string;
  owner: string;
  backup?: string;
}

export interface MirrorBackPayload {
  podId: number;
  outcome: string;
  links: string[];
  decision?: string;
  ownerNext?: string;
  decisionLogId?: number;
}

/**
 * Post a Summon message to a Pod's canonical thread
 */
export async function postSummon(payload: SummonPayload, threadId: string | null): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const summonText = formatSummonMessage(payload);

  if (!USE_OPENAI || !threadId) {
    console.log('[SUMMON - FALLBACK]', { podId: payload.podId, threadId, message: summonText });
    return { success: true, messageId: 'fallback-summon' };
  }

  try {
    if (!openai) throw new Error('OpenAI client not initialized');
    
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: summonText,
    });

    console.log('[SUMMON - POSTED]', { threadId, messageId: message.id });
    return { success: true, messageId: message.id };
  } catch (error: any) {
    console.error('[SUMMON - ERROR]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Post a Mirror-Back message to a Pod's canonical thread
 */
export async function postMirrorBack(payload: MirrorBackPayload, threadId: string | null): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mirrorText = formatMirrorBackMessage(payload);

  if (!USE_OPENAI || !threadId) {
    console.log('[MIRROR-BACK - FALLBACK]', { podId: payload.podId, threadId, message: mirrorText });
    return { success: true, messageId: 'fallback-mirror' };
  }

  try {
    if (!openai) throw new Error('OpenAI client not initialized');
    
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: mirrorText,
    });

    console.log('[MIRROR-BACK - POSTED]', { threadId, messageId: message.id });
    return { success: true, messageId: message.id };
  } catch (error: any) {
    console.error('[MIRROR-BACK - ERROR]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format Summon message with structured blocks
 */
function formatSummonMessage(payload: SummonPayload): string {
  return `🔔 **SUMMON**

**Ask:** ${payload.ask}

**Deliverables:** ${payload.deliverables}

**Due:** ${payload.due}

**Owner:** ${payload.owner}${payload.backup ? `\n**Backup:** ${payload.backup}` : ''}

---
_Posted via Dream Team Hub Summon_`;
}

/**
 * Format Mirror-Back message with structured blocks
 */
function formatMirrorBackMessage(payload: MirrorBackPayload): string {
  const linksText = payload.links.length > 0 
    ? '\n' + payload.links.map(link => `  - ${link}`).join('\n')
    : ' (none)';

  return `🪞 **MIRROR-BACK**

**Outcome:** ${payload.outcome}

**Links:**${linksText}${payload.decision ? `\n\n**Decision:** ${payload.decision}` : ''}${payload.ownerNext ? `\n**Owner/Next:** ${payload.ownerNext}` : ''}${payload.decisionLogId ? `\n**Decision Log ID:** #${payload.decisionLogId}` : ''}

---
_Posted via Dream Team Hub Mirror-Back_`;
}
