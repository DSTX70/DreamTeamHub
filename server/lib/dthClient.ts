/**
 * DTH API Client - Server-side wrapper for internal API calls
 * Uses Bearer token authentication with DTH_API_TOKEN
 */

const BASE = process.env.DTH_API_BASE || "http://localhost:5000";
const TOKEN = process.env.DTH_API_TOKEN;

if (!TOKEN) {
  console.warn("⚠️  DTH_API_TOKEN not set - Copilot API calls will fail");
}

export interface DTHResponse {
  status: number;
  json: any;
  text: string;
  headers: {
    total: string | null;
  };
}

export async function dthGET(path: string, query: Record<string, any> = {}): Promise<DTHResponse> {
  const url = new URL(path, BASE);
  
  // Add query parameters
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let json: any;
  
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep as text if not valid JSON
    json = null;
  }

  const total = res.headers.get("X-Total-Count");
  
  return {
    status: res.status,
    json,
    text,
    headers: { total },
  };
}
