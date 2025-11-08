import { useLocation } from "wouter";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useState, useEffect, useMemo, useCallback } from "react";
import Toast from "@/components/Toast";

type OpsHotkeysProps = {
  navigate?: (path: string) => void;
};

export default function OpsHotkeys({ navigate: customNavigate }: OpsHotkeysProps = {}) {
  const [, setLocation] = useLocation();
  const navigate = customNavigate || setLocation;
  const [showToast, setShowToast] = useState(false);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  useEffect(() => {
    // Fetch hotkeys setting from server
    const fetchSettings = async () => {
      try {
        const r = await fetch("/api/ops/settings/notifiers");
        const j = await r.json();
        setHotkeysEnabled(j.settings.hotkeysEnabled ?? true);
      } catch {
        // Default to enabled on error
        setHotkeysEnabled(true);
      }
    };
    fetchSettings();
  }, []);

  const handleHotkeyNavigation = useCallback((path: string) => {
    // Show toast on first use
    const seen = localStorage.getItem("opsHotkeysSeen");
    if (!seen) {
      setShowToast(true);
      localStorage.setItem("opsHotkeysSeen", "1");
    }
    
    // Navigate
    navigate(path);
  }, [navigate]);

  // Only register hotkeys if enabled - memoize to prevent infinite loops
  const chords = useMemo(
    () =>
      hotkeysEnabled
        ? {
            g: {
              o: () => handleHotkeyNavigation("/ops/overview"),
              i: () => handleHotkeyNavigation("/ops/inventory"),
              m: () => handleHotkeyNavigation("/ops/images"),
              a: () => handleHotkeyNavigation("/ops/affiliates"),
              s: () => handleHotkeyNavigation("/ops/settings"),
            },
          }
        : ({} as Record<string, Record<string, () => void>>),
    [hotkeysEnabled, handleHotkeyNavigation]
  );

  useHotkeys(chords);

  return (
    <>
      {showToast && (
        <Toast
          message="Hotkeys active — press ? for help"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
