// FILE: server/services/vsuitehq-ingest-client.ts
// Confidential and proprietary and copyright Dustin Sparks 2025

export type VSuiteHQIngestPayload = {
  kind: "work_order_result";
  workOrderId: string;
  agentName: string;
  status: "success" | "failed" | "partial";
  output: string;
  ms: number;
  cost: string;
  error?: string;
  metadata?: Record<string, any>;
  parsedPatchDrop?: PatchDrop | null;
};

export type PatchDrop = {
  repoTarget: string;
  title?: string;
  summary?: string;
  patches: Array<{
    file: string;
    content: string;
    kind?: "replace" | "patch";
  }>;
};

export type VSuiteHQIngestResult =
  | { ok: true; dropId?: string; storedAs?: "drop" | "recommendation"; receivedAt?: string }
  | { ok: false; status: number; message: string };

const DEFAULT_PATH = "/api/agent-ingest/work-order-result";

export async function pushWorkOrderResultToVSuiteHQ(args: {
  payload: VSuiteHQIngestPayload;
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
}): Promise<VSuiteHQIngestResult> {
  const baseUrl = (args.baseUrl ?? process.env.VSUITEHQ_BASE_URL ?? "").trim();
  const token = (args.token ?? process.env.VSUITEHQ_INGEST_TOKEN ?? "").trim();
  const path = (process.env.VSUITEHQ_INGEST_PATH ?? DEFAULT_PATH).trim();

  if (!baseUrl) {
    return { ok: false, status: 0, message: "Missing VSUITEHQ_BASE_URL" };
  }
  if (!token) {
    return { ok: false, status: 0, message: "Missing VSUITEHQ_INGEST_TOKEN" };
  }

  const url = baseUrl.replace(/\/+$/, "") + (path.startsWith("/") ? path : `/${path}`);

  const timeoutMs = args.timeoutMs ?? Number(process.env.VSUITEHQ_INGEST_TIMEOUT_MS ?? "12000");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const idempotencyKey = `${args.payload.workOrderId}:${args.payload.agentName}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(args.payload),
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: text || `VSuiteHQ ingest failed (${res.status})`,
      };
    }

    try {
      const json = JSON.parse(text);
      return { ok: true, ...json };
    } catch {
      return { ok: true };
    }
  } catch (e: any) {
    return { ok: false, status: 0, message: e?.message ?? "VSuiteHQ ingest error" };
  } finally {
    clearTimeout(t);
  }
}

export function tryParsePatchDropFromOutput(output: string): PatchDrop | null {
  const jsonText =
    extractJsonFromFence(output) ??
    extractFirstJsonObject(output);

  if (!jsonText) return null;

  let obj: any;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    return null;
  }

  const candidate = obj?.patchDrop ?? obj;

  if (!candidate || typeof candidate !== "object") return null;
  if (typeof candidate.repoTarget !== "string" || !candidate.repoTarget.trim()) return null;
  if (!Array.isArray(candidate.patches) || candidate.patches.length === 0) return null;

  for (const p of candidate.patches) {
    if (!p || typeof p !== "object") return null;
    if (typeof p.file !== "string" || !p.file.trim()) return null;
    if (typeof p.content !== "string") return null;
  }

  return candidate as PatchDrop;
}

function extractJsonFromFence(text: string): string | null {
  const fence = /```json\s*([\s\S]*?)\s*```/i.exec(text);
  if (!fence) return null;
  const inner = fence[1]?.trim();
  return inner && inner.startsWith("{") ? inner : null;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inStr = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inStr = false;
      continue;
    } else {
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1).trim();
        if (candidate.startsWith("{") && candidate.endsWith("}")) return candidate;
        return null;
      }
    }
  }
  return null;
}
