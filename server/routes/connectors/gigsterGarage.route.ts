import { Router, Request, Response } from "express";

const router = Router();

type FileResult = { path: string; ok: boolean; content?: string; error?: string };

router.post("/api/connectors/gigsterGarage/files", async (req: Request, res: Response) => {
  try {
    const { paths } = req.body as { paths?: string[] };

    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: "paths must be a non-empty array of strings" });
    }

    const baseUrl = process.env.GIGSTER_GARAGE_BASE_URL;
    const token = process.env.GIGSTER_GARAGE_READONLY_TOKEN;

    if (!baseUrl) {
      return res.status(500).json({ error: "GIGSTER_GARAGE_BASE_URL not configured in environment" });
    }

    if (!token) {
      return res.status(500).json({ error: "GIGSTER_GARAGE_READONLY_TOKEN not configured in environment" });
    }

    const results: FileResult[] = [];

    for (const p of paths.slice(0, 20)) {
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/dth/files`;
        const fetchRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ path: p }),
        });

        if (!fetchRes.ok) {
          const errText = await fetchRes.text().catch(() => "");
          results.push({ path: p, ok: false, error: `HTTP ${fetchRes.status}: ${errText}` });
        } else {
          const json = await fetchRes.json();
          results.push({ path: p, ok: true, content: json.content || "" });
        }
      } catch (err: any) {
        results.push({ path: p, ok: false, error: err.message || String(err) });
      }
    }

    res.json({ files: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
