const KEY = "dth_target_context";

export const DEFAULT_CONTEXT = "DreamTeamHub";

export const CONTEXT_OPTIONS: string[] = [
  "DreamTeamHub",
  "VSuiteHQ",
  "GigsterGarage",
  "DriveSteward",
  "Artistic Notations",
  "WaySage",
  "If When Always",
  "Parallax Translate",
  "i3 Broadcast Hub",
  "Shared Retail Shell",
  "The Fabulous Brand Company",
  "Symbioso IP Studio",
  "Verbixel Image and Copy Generator",
  "iCadence",
  "dreamshitter.com",
  "Fab Card Co",
  "fabulousAF",
];

export function getTargetContext(): string {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && v.trim() ? v : DEFAULT_CONTEXT;
  } catch {
    return DEFAULT_CONTEXT;
  }
}

export function setTargetContext(next: string): void {
  try {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}
