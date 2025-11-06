import type { Request, Response } from "express";
import express from "express";
import { makeProvider } from "../../shared/llm/providers";

export const router = express.Router();

router.post("/api/llm/infer", async (req: Request, res: Response) => {
  try {
    const { provider = "mock", model = "gpt-4.1-mini", prompt = "" } = req.body || {};
    const llm = makeProvider({ provider, model });
    const out = await llm.infer({ prompt });
    res.type("text/plain").send(out.text);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
