export type IntentStrategyDraft = {
  workItemId: string;
  repo: string;
  intentBlock: string;
  strategyBlock: string;
  evidenceRequest: string;
  fileFetchPaths: string[];
  meta?: any;
  createdAt: number; // epoch ms
};

const KEY_PREFIX = "dth:intentStrategyDraft:";
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function key(workItemId: string) {
  return `${KEY_PREFIX}${workItemId}`;
}

export function saveDraftToBuffer(draft: IntentStrategyDraft) {
  try {
    localStorage.setItem(key(draft.workItemId), JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function loadDraftFromBuffer(workItemId: string): IntentStrategyDraft | null {
  try {
    const raw = localStorage.getItem(key(workItemId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IntentStrategyDraft;
    if (!parsed?.createdAt || Date.now() - parsed.createdAt > TTL_MS) {
      localStorage.removeItem(key(workItemId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraftBuffer(workItemId: string) {
  try {
    localStorage.removeItem(key(workItemId));
  } catch {
    // ignore
  }
}
