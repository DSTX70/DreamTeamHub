import { Router, Request, Response, json } from "express";

const router = Router();
const jsonParser = json({ limit: "1mb" });

type FileResult = { path: string; ok: boolean; content?: string; error?: string };

function parsePaths(body: any): string[] {
  if (!body) return [];

  let obj: any = body;
  if (typeof body === "string") {
    try {
      obj = JSON.parse(body);
    } catch {
      obj = { paths: body };
    }
  }

  const raw = obj.paths ?? obj.pathsText ?? obj.pathList ?? null;
  if (!raw) return [];

  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split("\n").map((s) => s.trim()).filter(Boolean);

  return [];
}

router.get("/api/connectors/gigsterGarage/debug", (_req: Request, res: Response) => {
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

router.post("/api/connectors/gigsterGarage/files", jsonParser, async (req: Request, res: Response) => {
  try {
    const paths = parsePaths(req.body);

    if (!paths.length) {
      return res.status(400).json({
        ok: false,
        error: "paths[] required",
        hint: "Send JSON: { paths: [\"client/src/...\", ...] }",
      });
    }

    const baseUrl = process.env.GIGSTER_GARAGE_BASE_URL;
    const token = process.env.GIGSTER_GARAGE_READONLY_TOKEN;

    if (!baseUrl) {
      return res.status(502).json({ ok: false, error: "GIGSTER_GARAGE_BASE_URL not configured in environment" });
    }

    if (!token) {
      return res.status(502).json({ ok: false, error: "GIGSTER_GARAGE_READONLY_TOKEN not configured in environment" });
    }

    let upstreamUrl: string;
    try {
      upstreamUrl = new URL("/api/dth/files", baseUrl).toString();
    } catch {
      return res.status(502).json({ ok: false, error: `Invalid GIGSTER_GARAGE_BASE_URL: ${baseUrl}` });
    }

    const results: FileResult[] = [];

    for (const p of paths.slice(0, 20)) {
      try {
        const fetchRes = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-dth-token": token,
          },
          body: JSON.stringify({ path: p }),
        });

        const contentType = fetchRes.headers.get("content-type") || "";

        if (!fetchRes.ok) {
          const errText = await fetchRes.text().catch(() => "");
          const head = errText.slice(0, 160).replace(/\s+/g, " ").trim();
          results.push({ path: p, ok: false, error: `HTTP ${fetchRes.status} url=${upstreamUrl} head="${head}"` });
        } else if (!contentType.toLowerCase().includes("application/json")) {
          const text = await fetchRes.text().catch(() => "");
          const head = text.slice(0, 160).replace(/\s+/g, " ").trim();
          results.push({ path: p, ok: false, error: `Non-JSON response content-type=${contentType} url=${upstreamUrl} head="${head}"` });
        } else {
          const json = await fetchRes.json();
          results.push({ path: p, ok: true, content: json.content || "" });
        }
      } catch (err: any) {
        results.push({ path: p, ok: false, error: `${err.message || String(err)} url=${upstreamUrl}` });
      }
    }

    res.json({ ok: true, files: results });
  } catch (err: any) {
    res.status(502).json({ ok: false, error: err.message || "connector failed" });
  }
});

export default router;
