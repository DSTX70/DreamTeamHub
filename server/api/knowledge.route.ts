import type { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db";
import { knowledgeLinks, opsEvent, knowledgeChunks, knowledgeIndexMeta } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getDriveClient } from "../integrations/googleDrive_real";
import { SearchQuery, DraftUploadBody } from "../../lib/validators/knowledge";
import { PublishHeaders, PublishBody } from "../../lib/validators/publish";
import { sanitizeFilename } from "../lib/utils/sanitizeFilename";
import { indexSingleDriveFile } from "../services/knowledgeIndexer";
import { embedQuery, cosineSimilarity } from "../services/knowledgeEmbedding";
import { CollectionType } from "../config/knowledgeCollections";

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

/**
 * POST /api/knowledge/index-file
 * Quick-index a single Drive file for RAG search.
 */
export async function indexFile(req: Request, res: Response) {
  try {
    const { driveFileId, collection, filePath } = req.body;
    
    if (!driveFileId || typeof driveFileId !== "string") {
      return res.status(400).json({ error: "driveFileId is required" });
    }
    
    if (!collection || typeof collection !== "string") {
      return res.status(400).json({ error: "collection is required" });
    }
    
    const validCollections: CollectionType[] = ["lifestyle_packs", "patent_packs", "launch_packs", "website_audit_packs"];
    if (!validCollections.includes(collection as CollectionType)) {
      return res.status(400).json({ error: `Invalid collection. Must be one of: ${validCollections.join(", ")}` });
    }
    
    const result = await indexSingleDriveFile(
      driveFileId,
      collection as CollectionType,
      filePath
    );
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error: any) {
    console.error("[IndexFile] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to index file" });
  }
}

/**
 * GET /api/knowledge/search
 * RAG-powered semantic search across indexed knowledge.
 */
export async function ragSearch(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    const collection = req.query.collection as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    
    // Generate embedding for query
    const queryEmbedding = await embedQuery(query);
    
    // Fetch all chunks (optionally filtered by collection)
    const filters = [];
    if (collection) {
      filters.push(eq(knowledgeChunks.collection, collection));
    }
    
    const chunks = await db
      .select()
      .from(knowledgeChunks)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(1000); // Fetch top 1000 for scoring
    
    // Score chunks by cosine similarity
    const scored = chunks.map(chunk => ({
      ...chunk,
      score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding as number[]) : 0,
    }));
    
    // Sort by score and take top results
    const topResults = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(chunk => ({
        collection: chunk.collection,
        driveFileId: chunk.driveFileId,
        text: chunk.text,
        metadata: chunk.metadata,
        score: chunk.score,
      }));
    
    return res.json({
      query,
      results: topResults,
      count: topResults.length,
    });
  } catch (error: any) {
    console.error("[RAGSearch] Error:", error);
    return res.status(500).json({ error: error.message || "Search failed" });
  }
}

/**
 * GET /api/knowledge/index-status
 * Get indexing status for all collections.
 */
export async function getIndexStatus(req: Request, res: Response) {
  try {
    const collection = req.query.collection as string | undefined;
    
    const filters = [];
    if (collection) {
      filters.push(eq(knowledgeIndexMeta.collection, collection));
    }
    
    const meta = await db
      .select()
      .from(knowledgeIndexMeta)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(knowledgeIndexMeta.lastIndexedAt))
      .limit(100);
    
    return res.json({
      files: meta,
      count: meta.length,
    });
  } catch (error: any) {
    console.error("[GetIndexStatus] Error:", error);
    return res.status(500).json({ error: error.message || "Failed to get index status" });
  }
}
