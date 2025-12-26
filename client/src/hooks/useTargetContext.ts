import { useEffect, useState } from "react";
import { CONTEXT_OPTIONS, DEFAULT_CONTEXT, getTargetContext, setTargetContext as persist } from "@/lib/contextPrefs";

export function useTargetContext() {
  const [targetContext, setTargetContextState] = useState<string>(() => getTargetContext());

  useEffect(() => {
    const onStorage = () => setTargetContextState(getTargetContext());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTargetContext = (next: string) => {
    const safe = CONTEXT_OPTIONS.includes(next) ? next : DEFAULT_CONTEXT;
    setTargetContextState(safe);
    persist(safe);
  };

  return { targetContext, setTargetContext, contextOptions: CONTEXT_OPTIONS };
}
