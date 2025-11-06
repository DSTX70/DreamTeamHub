import { useLocation } from "wouter";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useState, useEffect } from "react";
import Toast from "@/components/Toast";

type OpsHotkeysProps = {
  navigate?: (path: string) => void;
};

export default function OpsHotkeys({ navigate: customNavigate }: OpsHotkeysProps = {}) {
  const [, setLocation] = useLocation();
  const navigate = customNavigate || setLocation;
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Check if user has seen the hotkeys toast before
    const seen = localStorage.getItem("opsHotkeysSeen");
    if (!seen) {
      // Not seen yet, ready to show on first use
      // We don't show it immediately, only after first hotkey press
    }
  }, []);

  const handleHotkeyNavigation = (path: string) => {
    // Show toast on first use
    const seen = localStorage.getItem("opsHotkeysSeen");
    if (!seen) {
      setShowToast(true);
      localStorage.setItem("opsHotkeysSeen", "1");
    }
    
    // Navigate
    navigate(path);
  };

  useHotkeys({
    g: {
      o: () => handleHotkeyNavigation("/ops/overview"),
      i: () => handleHotkeyNavigation("/ops/inventory"),
      m: () => handleHotkeyNavigation("/ops/images"),
      a: () => handleHotkeyNavigation("/ops/affiliates"),
      s: () => handleHotkeyNavigation("/ops/settings"),
    },
  });

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
