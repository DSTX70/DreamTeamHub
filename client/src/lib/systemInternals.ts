const STORAGE_KEY = "dth_show_system_internals";

export function getShowSystemInternals(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setShowSystemInternals(next: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    // Ensure all listening components update without wiring a global store.
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}
