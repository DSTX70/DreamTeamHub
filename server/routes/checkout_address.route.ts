import express, { Request, Response } from "express";
import type { Address } from "./address.route";
import { validateAddress, normalizePhone } from "../../shared/validation/address";

export const router = express.Router();

// We assume address.route.ts set this in-memory store; fall back to empty list if missing.
const ADDR_PATH = "/api/account/addresses";

async function fetchJson(url: string, init?: any) {
  const fetch = (await import("node-fetch")).default as any;
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Returns the default address for the current user (or first if default absent)
router.get("/api/checkout/address/default", async (req: Request, res: Response) => {
  try {
    // In monolith, we can directly require the store; for portability, call the existing GET endpoint
    const base = `${req.protocol}://${req.get("host")}`;
    const items: Address[] = await fetchJson(base + ADDR_PATH, { headers: { "x-user-id": req.headers["x-user-id"] || "demo-user" } });
    const def = items.find(a => a.isDefault) || items[0] || null;
    res.json({ address: def });
  } catch (e:any) {
    res.status(200).json({ address: null });
  }
});

// Validates an address and returns field-level errors (empty object if OK)
router.post("/api/checkout/address/validate", (req: Request, res: Response) => {
  const body = req.body || {};
  const errs = validateAddress(body);
  if (Object.keys(errs).length > 0) return res.status(422).json({ errors: errs });
  // Optionally ship normalized phone back
  const phone = normalizePhone(body.phone);
  res.json({ ok: true, normalized: { phone } });
});
