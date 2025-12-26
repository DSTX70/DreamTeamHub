import { useEffect, useState } from "react";
import { getShowSystemInternals, setShowSystemInternals as persistShowSystemInternals } from "@/lib/systemInternals";

/**
 * Default UX: keep system internals hidden.
 * Power users can toggle this on to reveal pods/personas/admin routes.
 */
export function useSystemInternals() {
  const [showSystemInternals, setShow] = useState<boolean>(() => getShowSystemInternals());

  useEffect(() => {
    const onStorage = () => setShow(getShowSystemInternals());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setShowSystemInternals = (next: boolean) => {
    setShow(next);
    persistShowSystemInternals(next);
  };

  return { showSystemInternals, setShowSystemInternals };
}
