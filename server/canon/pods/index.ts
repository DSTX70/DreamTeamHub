// DreamTeamHub — Canonical Pod Registry Index
// Exports all registered canonical pod definitions.

import { visualTranslationEnginePod } from "./visualTranslationEngine.pod";
import type { PodRosterEntry } from "./visualTranslationEngine.pod";

export type { PodRosterEntry, PodApprovalGate, PodDeliverable, PodMember } from "./visualTranslationEngine.pod";

export const CANON_PODS: PodRosterEntry[] = [
  visualTranslationEnginePod,
];

export default CANON_PODS;
