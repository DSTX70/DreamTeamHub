type GGFileResult = {
  path: string;
  ok: boolean;
  error?: string;
  contents: string;
};

type FetchGGFilesResponse = {
  ok: boolean;
  files: GGFileResult[];
  meta: {
    requestedCount: number;
    returnedCount: number;
    nonEmptyCount: number;
    tooLargeCount: number;
    errorCount: number;
    truncatedTotalChars: number;
  };
};

function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

function baseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function pickContentField(obj: any): string {
  const candidates = [obj?.contents, obj?.content, obj?.text, obj?.body, obj?.data, obj?.raw];
  for (const v of candidates) {
    if (typeof v === "string") return v;
  }
  return "";
}

function normalizeFiles(payload: any): GGFileResult[] {
  const arr = Array.isArray(payload?.files)
    ? payload.files
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  return arr.map((it: any) => {
    const path = String(it?.path ?? it?.filePath ?? it?.name ?? "").trim();
    const ok = typeof it?.ok === "boolean" ? it.ok : true;
    const error = typeof it?.error === "string" ? it.error : undefined;
    const contents = pickContentField(it) ?? "";
    return { path, ok, error, contents };
  });
}

function truncate(s: string, maxChars: number): { text: string; truncated: boolean } {
  if (s.length <= maxChars) return { text: s, truncated: false };
  // IMPORTANT: Avoid "..." or "…" because Pilot F drop validation rejects placeholder markers.
  const marker = `\n\n/* TRUNCATED_AT_${maxChars}_CHARS */\n`;
  return { text: s.slice(0, maxChars) + marker, truncated: true };
}

export async function fetchGigsterGarageFiles(paths: string[], opts?: { perFileMaxChars?: number; totalMaxChars?: number }): Promise<FetchGGFilesResponse> {
  const perFileMaxChars = opts?.perFileMaxChars ?? 18_000;
  const totalMaxChars = opts?.totalMaxChars ?? 70_000;

  const ggBase = baseUrl(envOrThrow("GIGSTER_GARAGE_BASE_URL"));
  const token = envOrThrow("GIGSTER_GARAGE_READONLY_TOKEN");

  const upstreamUrl = `${ggBase}/api/dth/files`;

  const upstreamRes = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-dth-token": token,
    },
    body: JSON.stringify({ paths }),
  });

  const text = await upstreamRes.text();
  if (!upstreamRes.ok) {
    return {
      ok: false,
      files: paths.map((p) => ({
        path: p,
        ok: false,
        error: `Upstream error ${upstreamRes.status}: ${text.slice(0, 200)}`,
        contents: "",
      })),
      meta: {
        requestedCount: paths.length,
        returnedCount: 0,
        nonEmptyCount: 0,
        tooLargeCount: 0,
        errorCount: paths.length,
        truncatedTotalChars: 0,
      },
    };
  }

  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    return {
      ok: false,
      files: paths.map((p) => ({
        path: p,
        ok: false,
        error: "Upstream returned non-JSON",
        contents: "",
      })),
      meta: {
        requestedCount: paths.length,
        returnedCount: 0,
        nonEmptyCount: 0,
        tooLargeCount: 0,
        errorCount: paths.length,
        truncatedTotalChars: 0,
      },
    };
  }

  const normalized = normalizeFiles(payload);

  let runningTotal = 0;
  let truncatedTotalChars = 0;

  const capped = normalized.map((f) => {
    if (!f.contents) return f;

    const t1 = truncate(f.contents, perFileMaxChars);
    let contents = t1.text;

    const remaining = Math.max(0, totalMaxChars - runningTotal);
    if (contents.length > remaining) {
      const t2 = truncate(contents, remaining);
      if (t2.truncated) truncatedTotalChars += contents.length - t2.text.length;
      contents = t2.text;
    }

    if (t1.truncated) truncatedTotalChars += f.contents.length - t1.text.length;

    runningTotal += contents.length;
    return { ...f, contents };
  });

  const tooLargeCount = capped.filter((f) => /too large/i.test(f.error ?? "")).length;
  const errorCount = capped.filter((f) => !f.ok).length;
  const nonEmptyCount = capped.filter((f) => (f.contents ?? "").length > 0).length;

  return {
    ok: true,
    files: capped,
    meta: {
      requestedCount: paths.length,
      returnedCount: capped.length,
      nonEmptyCount,
      tooLargeCount,
      errorCount,
      truncatedTotalChars,
    },
  };
}

export function formatGigsterFilesForPrompt(files: GGFileResult[]): string {
  const blocks: string[] = [];

  for (const f of files) {
    if (!f.path) continue;

    if (!f.ok) {
      blocks.push(
        `FILE: ${f.path}\n` +
          `ERROR: ${f.error || "unknown error"}\n` +
          `END_FILE\n`
      );
      continue;
    }

    blocks.push(
      `FILE: ${f.path}\n` +
        `${f.contents || ""}\n` +
        `END_FILE\n`
    );
  }

  return blocks.join("\n");
}
