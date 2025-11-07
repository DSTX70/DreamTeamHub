import { useEffect, useState } from "react";

export default function FooterStatus() {
  const [hotkeysEnabled, setHotkeysEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const r = await fetch("/api/ops/settings/notifiers");
        const j = await r.json();
        setHotkeysEnabled(j.settings.hotkeysEnabled ?? true);
      } catch {
        setHotkeysEnabled(true);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 30 seconds to pick up changes
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (hotkeysEnabled === null) return "bg-orange-500"; // Loading
    return hotkeysEnabled ? "bg-green-500" : "bg-gray-400"; // On / Off
  };

  const getStatusText = () => {
    if (hotkeysEnabled === null) return "Loading...";
    return hotkeysEnabled ? "Hotkeys: On" : "Hotkeys: Off";
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="footer-hotkeys-status">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} data-testid="status-indicator" />
      <span>{getStatusText()}</span>
    </div>
  );
}
