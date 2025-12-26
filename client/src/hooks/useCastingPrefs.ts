import { useEffect, useState } from "react";
import {
  CastMode,
  getCastMode,
  getSelectedPods,
  getSelectedPersonas,
  setCastMode as persistMode,
  setSelectedPods as persistPods,
  setSelectedPersonas as persistPersonas,
} from "@/lib/castingPrefs";

/**
 * Casting preferences are user-level ergonomics:
 * - Auto: system selects pods/personas
 * - Curated: user selects pods/personas for non-generic outcomes
 *
 * Stored in localStorage; can be upgraded to profile persistence later.
 */
export function useCastingPrefs() {
  const [mode, setModeState] = useState<CastMode>(() => getCastMode());
  const [pods, setPodsState] = useState<string[]>(() => getSelectedPods());
  const [personas, setPersonasState] = useState<string[]>(() => getSelectedPersonas());

  useEffect(() => {
    const onStorage = () => {
      setModeState(getCastMode());
      setPodsState(getSelectedPods());
      setPersonasState(getSelectedPersonas());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setMode = (next: CastMode) => {
    setModeState(next);
    persistMode(next);
  };

  const setPods = (next: string[]) => {
    setPodsState(next);
    persistPods(next);
  };

  const setPersonas = (next: string[]) => {
    setPersonasState(next);
    persistPersonas(next);
  };

  return { mode, setMode, pods, setPods, personas, setPersonas };
}
