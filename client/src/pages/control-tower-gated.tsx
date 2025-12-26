import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSystemInternals } from "@/hooks/useSystemInternals";
import ControlTower from "@/pages/control-tower";

export default function ControlTowerGated() {
  const { showSystemInternals } = useSystemInternals();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!showSystemInternals) {
      setLocation("/intent");
    }
  }, [showSystemInternals, setLocation]);

  if (!showSystemInternals) return null;
  return <ControlTower />;
}
