import express, { Request, Response } from "express";

const router = express.Router();

const jsonParser = express.json({
  limit: "2mb",
  type: ["application/json", "application/*+json"],
});

const textParser = express.text({
  limit: "2mb",
  type: "*/*",
});

function routeBodyParser(req: Request, res: Response, next: (err?: any) => void) {
  jsonParser(req, res, (err) => {
    if (err) return next(err);

    if (req.body && typeof req.body === "object") return next();

    textParser(req, res, (err2) => {
      if (err2) return next(err2);

      if (typeof req.body === "string") {
        const raw = req.body.trim();

        if (raw.startsWith("{") || raw.startsWith("[")) {
          try {
            req.body = JSON.parse(raw);
          } catch {
            req.body = { pathsText: req.body };
          }
        } else {
          req.body = { pathsText: req.body };
        }
      }

      return next();
    });
  });
}

type ParsedPathsResult = { paths: string[]; source: string };

function parsePaths(body: any): ParsedPathsResult {
  if (!body) return { paths: [], source: "none" };

  if (typeof body === "string") {
    const split = body
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return { paths: split, source: "raw-string" };
  }

  if (Array.isArray(body.paths)) {
    return {
      paths: body.paths.map(String).map((s: string) => s.trim()).filter(Boolean),
      source: "paths[]",
    };
  }

  const raw =
    typeof body.paths === "string"
      ? body.paths
      : typeof body.pathsText === "string"
        ? body.pathsText
        : typeof body.paths_string === "string"
          ? body.paths_string
          : undefined;

  if (typeof raw === "string") {
    const split = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      paths: split,
      source: typeof body.paths === "string" ? "paths:string" : "pathsText",
    };
  }

  return { paths: [], source: "unknown" };
}

function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v;
}

function baseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function safeKeys(x: any): string[] {
  if (!x || typeof x !== "object") return [];
  return Object.keys(x);
}

function tryDecodeBase64(s: string): string | null {
  try {
    const buf = Buffer.from(s, "base64");
    const out = buf.toString("utf8");
    const bad = (out.match(/\uFFFD/g) || []).length;
    if (bad > 3) return null;
    return out;
  } catch {
    return null;
  }
}

function pickContentField(obj: any): { text: string; from: string } {
  const candidates: Array<[string, any]> = [
    ["contents", obj?.contents],
    ["content", obj?.content],
    ["text", obj?.text],
    ["body", obj?.body],
    ["data", obj?.data],
    ["source", obj?.source],
    ["raw", obj?.raw],
  ];

  for (const [k, v] of candidates) {
    if (typeof v === "string") return { text: v, from: k };
  }

  const b64Candidates: Array<[string, any]> = [
    ["contentBase64", obj?.contentBase64],
    ["contentsBase64", obj?.contentsBase64],
    ["base64", obj?.base64],
    ["b64", obj?.b64],
  ];
  for (const [k, v] of b64Candidates) {
    if (typeof v === "string") {
      const decoded = tryDecodeBase64(v);
      if (decoded != null) return { text: decoded, from: `${k}:decoded` };
    }
  }

  return { text: "", from: "none" };
}

function pickPathField(obj: any, fallbackPath?: string): string {
  const candidates: any[] = [obj?.path, obj?.filePath, obj?.filepath, obj?.name, fallbackPath];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

type NormalizedFile = {
  path: string;
  ok: boolean;
  error?: string;
  contents: string;
  content: string;
  _contentFrom?: string;
  _contentLen?: number;
  _keys?: string[];
  [k: string]: any;
};

function normalizeUpstreamPayload(payload: any) {
  let items: any[] = [];
  let normalizedFrom = "unknown";

  if (Array.isArray(payload?.files)) {
    items = payload.files;
    normalizedFrom = "payload.files[]";
  } else if (Array.isArray(payload?.results)) {
    items = payload.results;
    normalizedFrom = "payload.results[]";
  } else if (payload?.files && typeof payload.files === "object") {
    items = Object.entries(payload.files).map(([path, v]) => ({ path, content: v }));
    normalizedFrom = "payload.files:map";
  } else if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    items = Object.entries(payload.data).map(([path, v]) => ({ path, content: v }));
    normalizedFrom = "payload.data:map";
  } else if (Array.isArray(payload)) {
    items = payload;
    normalizedFrom = "payload:array";
  }

  const files: NormalizedFile[] = items.map((it) => {
    const path = pickPathField(it);
    const ok = typeof it?.ok === "boolean" ? it.ok : true;
    const error = typeof it?.error === "string" ? it.error : undefined;

    const picked = pickContentField(it);
    const contents = picked.text ?? "";
    const file: NormalizedFile = {
      ...it,
      path,
      ok,
      error,
      contents,
      content: contents,
      _contentFrom: picked.from,
      _contentLen: contents.length,
      _keys: safeKeys(it),
    };

    return file;
  });

  const topOk = typeof payload?.ok === "boolean" ? payload.ok : true;

  return {
    ok: topOk,
    files,
    results: files,
    _meta: {
      normalized: true,
      normalizedFrom,
      upstreamTopKeys: safeKeys(payload),
      fileCount: files.length,
      nonEmptyCount: files.filter((f) => (f.contents || "").length > 0).length,
      sample: files.slice(0, 3).map((f) => ({
        path: f.path,
        ok: f.ok,
        contentLen: f._contentLen,
        contentFrom: f._contentFrom,
      })),
    },
  };
}

router.post("/echo", routeBodyParser, (req: Request, res: Response) => {
  const parsed = parsePaths(req.body);

  res.json({
    ok: true,
    where: "DreamTeamHub",
    contentType: req.headers["content-type"] ?? null,
    bodyType: typeof req.body,
    bodyKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : null,
    parsedSource: parsed.source,
    parsedPathsCount: parsed.paths.length,
    parsedPaths: parsed.paths,
  });
});

router.get("/debug", (_req: Request, res: Response) => {
  const base = process.env.GIGSTER_GARAGE_BASE_URL || "";
  const token = process.env.GIGSTER_GARAGE_READONLY_TOKEN || "";
  let upstreamUrl = "";
  try {
    upstreamUrl = base ? new URL("/api/dth/files", base).toString() : "";
  } catch {
    upstreamUrl = "(invalid base url)";
  }
  res.json({
    ok: true,
    base,
    upstreamUrl,
    tokenSet: Boolean(token),
    tokenLast4: token ? token.slice(-4) : "",
  });
});

/**
 * GET /api/connectors/gigsterGarage/meta
 * Returns non-sensitive connector metadata for UI.
 * This is safe because the base URL is already a published *.replit.app endpoint.
 */
router.get("/meta", async (_req: Request, res: Response) => {
  try {
    const ggBase = baseUrl(envOrThrow("GIGSTER_GARAGE_BASE_URL"));

    res.json({
      ok: true,
      baseUrl: ggBase,
      adminUrl: `${ggBase}/admin`,
      githubRepoUrl: "https://github.com/DSTX70/Gigster-Garage-MVP",
      auditWorkflowUrl:
        "https://github.com/DSTX70/Gigster-Garage-MVP/actions/workflows/website-audit.yml",
      rule: "Use published *.replit.app URL only (no IDE/preview).",
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Failed to load GigsterGarage connector metadata.",
    });
  }
});

/**
 * GET /api/connectors/gigsterGarage/health
 * Server-side health probe so browser never hits GG directly (avoids CORS).
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const ggBase = baseUrl(envOrThrow("GIGSTER_GARAGE_BASE_URL"));

    const candidates = [`${ggBase}/api/health`, `${ggBase}/health`, `${ggBase}/`];

    const started = Date.now();
    for (const url of candidates) {
      try {
        const t0 = Date.now();
        const r = await fetch(url, { method: "GET" });
        const ms = Date.now() - t0;

        return res.json({
          ok: r.ok,
          urlTried: url,
          status: r.status,
          ms,
          note: r.ok ? "Reachable" : "Responded but not OK",
          totalMs: Date.now() - started,
        });
      } catch {
        // try next
      }
    }

    res.json({
      ok: false,
      urlTried: candidates.join(" | "),
      totalMs: Date.now() - started,
      note: "Could not reach any health endpoints.",
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || "Health check failed.",
    });
  }
});

/**
 * GET /api/connectors/gigsterGarage/diagnostics
 * Proxies to GigsterGarage /api/dth/diagnostics for Track 2 automatic evidence pull.
 * Returns console errors + failed network requests collected by GG's diagnostics system.
 */
router.get("/diagnostics", async (_req: Request, res: Response) => {
  try {
    const ggBase = baseUrl(envOrThrow("GIGSTER_GARAGE_BASE_URL"));
    // Prefer GIGSTER_GARAGE_DTH_READONLY_TOKEN (recommended) with fallbacks
    const token =
      process.env.GIGSTER_GARAGE_DTH_READONLY_TOKEN ||
      process.env.DTH_READONLY_TOKEN ||
      process.env.GIGSTER_GARAGE_READONLY_TOKEN;

    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "Missing env var: GIGSTER_GARAGE_DTH_READONLY_TOKEN (or DTH_READONLY_TOKEN fallback)",
      });
    }

    const url = `${ggBase}/api/dth/diagnostics`;
    const r = await fetch(url, {
      method: "GET",
      headers: { "x-dth-token": token },
    });

    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ ok: false, error: text });

    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.json({ ok: true, raw: text });
    }
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "diagnostics proxy failed" });
  }
});

router.post("/files", routeBodyParser, async (req: Request, res: Response) => {
  try {
    const parsed = parsePaths(req.body);

    if (!parsed.paths.length) {
      return res.status(400).json({
        ok: false,
        where: "DreamTeamHub",
        error: "paths[] required",
        hint:
          'Send JSON: { "paths": ["client/src/hooks/useAuth.ts", "..."] } OR { "pathsText": "path1\\npath2" }',
        received: {
          contentType: req.headers["content-type"] ?? null,
          bodyType: typeof req.body,
          bodyKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : null,
          parsedSource: parsed.source,
        },
      });
    }

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
      body: JSON.stringify({ paths: parsed.paths }),
    });

    const ct = upstreamRes.headers.get("content-type") || "";
    const text = await upstreamRes.text();

    if (!upstreamRes.ok) {
      let upstreamJson: any = null;
      if (ct.includes("application/json")) {
        try {
          upstreamJson = JSON.parse(text);
        } catch {
          // ignore
        }
      }

      return res.status(upstreamRes.status).json({
        ok: false,
        where: "DreamTeamHub",
        error: "Upstream error",
        upstream: {
          status: upstreamRes.status,
          contentType: ct || null,
          json: upstreamJson,
          textSnippet: upstreamJson ? undefined : text.slice(0, 900),
        },
      });
    }

    if (ct.includes("application/json")) {
      try {
        const upstreamJson = JSON.parse(text);
        const normalized = normalizeUpstreamPayload(upstreamJson);
        return res.json(normalized);
      } catch {
        // fallthrough
      }
    }

    return res.status(502).json({
      ok: false,
      where: "DreamTeamHub",
      error: "Upstream returned non-JSON",
      upstream: {
        status: upstreamRes.status,
        contentType: ct || null,
        textSnippet: text.slice(0, 900),
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      where: "DreamTeamHub",
      error: err?.message || "Unknown error",
    });
  }
});

export default router;
