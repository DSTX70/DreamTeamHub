/**
 * Map pod names to pod-rail CSS class names for the brand guide styling
 * Handles both full and shortened pod names
 */
export const getPodRailClass = (podName: string): string => {
  const podMap: Record<string, string> = {
    // Full names
    "Dream Team Hub by i³ collective": "control",
    "Control Tower": "control", // Legacy support
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
    // Shortened names (database variants)
    "Finance": "finance",
    "Marketing": "marketing",
    "Security": "security",
  };
  return podMap[podName] || "control";
};

/**
 * Get the pod color CSS variable value
 */
export const getPodColor = (podName: string): string => {
  const colorMap: Record<string, string> = {
    "Dream Team Hub by i³ collective": "#3D6BFF",
    "Control Tower": "#3D6BFF", // Legacy support
    "Intake & Routing": "#5CE1CF",
    "Decision Log": "#FFC24D",
    "Roster & Roles": "#C95CAF",
    "IP & Patent Program": "#6B1E9C",
    "Security & Compliance": "#3B4A5A",
    "Product & Engineering": "#1F9CFF",
    "Brand & Assets": "#FF5BCD",
    "Marketing & Comms": "#FF7A45",
    "Finance & BizOps": "#2DBE7A",
    "Operating Rhythm": "#5A67FF",
    // Shortened names
    "Finance": "#2DBE7A",
    "Marketing": "#FF7A45",
    "Security": "#3B4A5A",
  };
  return colorMap[podName] || "#3D6BFF";
};
