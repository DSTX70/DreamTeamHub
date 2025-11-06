import type { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { knowledgeLinks, opsEvent } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getDriveClient } from "../integrations/googleDrive_real";
import { SearchQuery, DraftUploadBody, PublishBody } from "../../lib/validators/knowledge";

function required(v: any, msg: string) {
  if (!v) throw Object.assign(new Error(msg), { status: 400 });
}

async function resolveFolders(ownerType: string, ownerId: string) {
  const rows = await db.select().from(knowledgeLinks).where(
    and(eq(knowledgeLinks.businessUnit, ownerType))
  );
  const map: Record<string, string | undefined> = {};
  for (const r of rows) map[r.role] = r.driveFolderId || undefined;
  return { read: map["read"], draft: map["draft"], publish: map["publish"] };
}

export async function searchKnowledge(req: Request, res: Response) {
  try {
    const owner = String(req.params.owner).toUpperCase();
    const id = String(req.params.id);
    
    const parsed = SearchQuery.safeParse({ q: req.query.q, limit: req.query.limit });
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const { read } = await resolveFolders(owner, id);
    required(read, "KB read folder not linked");
    const drive = getDriveClient();
    const out = await drive.search(read!, parsed.data.q || "", parsed.data.limit ?? 20);
    return res.json(out);
  } catch (e: any) {
    return res.status(e.status || 500).json({ error: e.message || "search failed" });
  }
}

export async function uploadDraft(req: Request, res: Response) {
  try {
    const owner = String(req.params.owner).toUpperCase();
    const id = String(req.params.id);
    
    const parsed = DraftUploadBody.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const { draft } = await resolveFolders(owner, id);
    required(draft, "Drafts folder not linked");
    const drive = getDriveClient();

    const file = await drive.upload(draft!, { text: parsed.data.content, fileName: parsed.data.fileName, mimeType: "text/markdown" });
    return res.status(201).json({ ok: true, file });
  } catch (e: any) {
    return res.status(e.status || 500).json({ error: e.message || "upload failed" });
  }
}

export async function publishFile(req: Request, res: Response) {
  try {
    const owner = String(req.params.owner).toUpperCase();
    const id = String(req.params.id);
    const fileId = String(req.params.fileId);
    const reviewer = String(req.headers["x-reviewer-token"] || "");
    required(reviewer && reviewer.length >= 12, "reviewer token required");
    const idem = String(req.headers["idempotency-key"] || crypto.randomUUID());

    const { publish } = await resolveFolders(owner, id);
    required(publish, "Publish folder not linked");
    const drive = getDriveClient();
    const out = await drive.copyOrMove(fileId, publish!, "move");

    // Authoritative PUBLISH audit
    const reviewerHash = crypto.createHash("sha256").update(reviewer).digest("hex");
    const [event] = await db.insert(opsEvent).values({
      actor: "reviewer",
      kind: "PUBLISH",
      ownerType: owner,
      ownerId: id,
      message: `Published file ${fileId}`,
      meta: { fileId, reviewerHash, idempotencyKey: idem, driveTitle: out.name, driveUrl: out.webViewLink }
    }).returning();

    res.setHeader("X-Request-Id", out.id || "");
    res.setHeader("X-Idempotency-Key", idem);
    return res.json({ ok: true, fileId, drive: out });
  } catch (e: any) {
    return res.status(e.status || 500).json({ error: e.message || "publish failed" });
  }
}

export async function getPublishedFiles(req: Request, res: Response) {
  try {
    const { owner_type, owner_id } = req.query;
    
    const filters = [eq(opsEvent.kind, "PUBLISH")];
    
    if (owner_type && typeof owner_type === "string") {
      filters.push(eq(opsEvent.ownerType, owner_type));
    }
    
    if (owner_id && typeof owner_id === "string") {
      filters.push(eq(opsEvent.ownerId, owner_id));
    }
    
    const events = await db
      .select()
      .from(opsEvent)
      .where(and(...filters));
    
    const files = events.map((event) => ({
      id: event.id,
      fileId: event.meta?.fileId || null,
      fileName: event.meta?.fileName || null,
      fileUrl: event.meta?.fileUrl || null,
      ownerType: event.ownerType,
      ownerId: event.ownerId,
      publishedBy: event.actor,
      publishedAt: event.createdAt,
      meta: event.meta,
    }));
    
    return res.json(files);
    
  } catch (e) {
    console.error("getPublishedFiles error:", e);
    return res.status(500).json({ error: "Failed to fetch published files" });
  }
}
