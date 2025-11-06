import type { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { knowledgeLinks, opsEvent } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getDriveClient } from "../integrations/googleDrive_real";
import { SearchQuery, DraftUploadBody } from "../../lib/validators/knowledge";
import { PublishHeaders, PublishBody } from "../../lib/validators/publish";
import { sanitizeFilename } from "../lib/utils/sanitizeFilename";

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
    
    const { q, limit } = parsed.data;
    const { read } = await resolveFolders(owner, id);
    required(read, "KB read folder not linked");
    const pageToken = String(req.query.pageToken || "") || null;
    const out = await getDriveClient().search(read!, q, limit ?? 20, pageToken);
    res.setHeader("X-Total-Count", String(out.items.length)); // page count (Drive doesn't expose grand total)
    if (out.nextPageToken) res.setHeader("X-Next-Page-Token", out.nextPageToken);
    return res.json(out);
  } catch (e: any) {
    return res.status(e.status || 500).json({ error: e.message || "search failed" });
  }
}

export async function uploadDraft(req: Request, res: Response) {
  try {
    const owner = String(req.params.owner).toUpperCase();
    const id = String(req.params.id);
    
    const parsed = DraftUploadBody.safeParse(req.body || {});
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const { text, mimeType } = parsed.data;
    const fileName = sanitizeFilename(parsed.data.fileName);
    const { draft } = await resolveFolders(owner, id);
    required(draft, "Drafts folder not linked");
    const drive = getDriveClient();

    const file = await drive.upload(draft!, { text, fileName, mimeType: mimeType ?? "text/markdown" });
    
    // Log KNOWLEDGE_DRAFT event
    const actor = (req as any).user?.email || (req as any).user?.id || "anonymous";
    await db.insert(opsEvent).values({
      actor,
      kind: "KNOWLEDGE_DRAFT",
      ownerType: owner,
      ownerId: id,
      message: `Draft uploaded: ${fileName}`,
      meta: {
        fileId: file.id,
        fileName,
        mimeType: mimeType ?? "text/markdown",
        driveUrl: file.webViewLink,
        path: req.path,
      },
    });
    
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
    
    // Validate headers
    const headersParsed = PublishHeaders.safeParse({
      "x-reviewer-token": req.headers["x-reviewer-token"],
      "idempotency-key": req.headers["idempotency-key"],
    });
    if (!headersParsed.success) {
      const msg = headersParsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    // Validate body
    const bodyParsed = PublishBody.safeParse(req.body);
    if (!bodyParsed.success) {
      const msg = bodyParsed.error.errors.map(e => e.message).join("; ");
      return res.status(422).json({ error: msg });
    }
    
    const reviewer = headersParsed.data["x-reviewer-token"];
    const idem = headersParsed.data["idempotency-key"] || crypto.randomUUID();
    const { approver, note } = bodyParsed.data;

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
      message: `Published file ${fileId}${note ? `: ${note}` : ''}`,
      meta: { 
        fileId, 
        reviewerHash, 
        idempotencyKey: idem, 
        driveTitle: out.name, 
        driveUrl: out.webViewLink,
        approverName: approver.name,
        approverEmail: approver.email,
        note,
        path: req.path,
      }
    }).returning();

    res.setHeader("X-Request-Id", out.id || "");
    res.setHeader("X-Idempotency-Key", idem);
    return res.json({ ok: true, fileId, eventId: event.id, drive: out });
  } catch (e: any) {
    // Log PUBLISH_ERROR event
    const actor = "reviewer";
    await db.insert(opsEvent).values({
      actor,
      kind: "PUBLISH_ERROR",
      ownerType: String(req.params.owner).toUpperCase(),
      ownerId: String(req.params.id),
      message: `Publish failed: ${e.message || "unknown error"}`,
      meta: {
        fileId: String(req.params.fileId),
        error: e.message || "publish failed",
        status: e.status || 500,
        path: req.path,
      },
    });
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
