/**
 * Map pod names to pod-rail CSS class names for the brand guide styling
 */
export const getPodRailClass = (podName: string): string => {
  const podMap: Record<string, string> = {
    "Control Tower": "control",
    "Intake & Routing": "intake",
    "Decision Log": "decision",
    "Roster & Roles": "roster",
    "IP & Patent Program": "ip",
    "Security & Compliance": "security",
    "Product & Engineering": "product",
    "Brand & Assets": "brand",
    "Marketing & Comms": "marketing",
    "Finance & BizOps": "finance",
    "Operating Rhythm": "rhythm",
  };
  return podMap[podName] || "control";
};
