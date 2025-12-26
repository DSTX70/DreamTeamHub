const MODE_KEY = "dth_cast_mode"; // "auto" | "curated"
const PODS_KEY = "dth_cast_pods"; // JSON string[]
const PERSONAS_KEY = "dth_cast_personas"; // JSON string[]

export type CastMode = "auto" | "curated";

function safeParseArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getCastMode(): CastMode {
  try {
    const v = window.localStorage.getItem(MODE_KEY);
    return v === "curated" ? "curated" : "auto";
  } catch {
    return "auto";
  }
}

export function setCastMode(mode: CastMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

export function getSelectedPods(): string[] {
  try {
    return safeParseArray(window.localStorage.getItem(PODS_KEY));
  } catch {
    return [];
  }
}

export function setSelectedPods(pods: string[]): void {
  try {
    window.localStorage.setItem(PODS_KEY, JSON.stringify(pods));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

export function getSelectedPersonas(): string[] {
  try {
    return safeParseArray(window.localStorage.getItem(PERSONAS_KEY));
  } catch {
    return [];
  }
}

export function setSelectedPersonas(personas: string[]): void {
  try {
    window.localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}
