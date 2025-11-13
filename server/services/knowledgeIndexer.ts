import { getDriveClient } from "../integrations/googleDrive_real";
import { splitTextIntoChunks, embedChunks } from "./knowledgeEmbedding";
import { db } from "../db";
import { knowledgeChunks, knowledgeIndexMeta } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { knowledgeCollections, CollectionType } from "../config/knowledgeCollections";

export interface IndexFileResult {
  success: boolean;
  driveFileId: string;
  collection: string;
  chunksIndexed: number;
  error?: string;
}

/**
 * Index a single Drive file: fetch content, chunk it, embed it, and store in database.
 * 
 * @param driveFileId - Google Drive file ID
 * @param collection - Collection name (e.g., "lifestyle_packs")
 * @param filePath - Optional file path/name for metadata
 * @returns IndexFileResult with success status and chunk count
 */
export async function indexSingleDriveFile(
  driveFileId: string,
  collection: CollectionType,
  filePath?: string
): Promise<IndexFileResult> {
  try {
    console.log(`[KnowledgeIndexer] Indexing file ${driveFileId} in collection ${collection}`);
    
    // 1. Fetch file content from Drive
    const drive = getDriveClient();
    const fileText = await drive.fetchFileText(driveFileId);
    
    if (!fileText || fileText.trim().length === 0) {
      console.warn(`[KnowledgeIndexer] File ${driveFileId} is empty, skipping`);
      await updateIndexMeta(driveFileId, collection, {
        status: "failed",
        error: "File is empty",
        chunkCount: 0,
        filePath,
      });
      return {
        success: false,
        driveFileId,
        collection,
        chunksIndexed: 0,
        error: "File is empty",
      };
    }
    
    // 2. Split into chunks
    const textChunks = splitTextIntoChunks(fileText, 500, 50);
    console.log(`[KnowledgeIndexer] Split file into ${textChunks.length} chunks`);
    
    // 3. Generate embeddings
    const embeddedChunks = await embedChunks(textChunks);
    console.log(`[KnowledgeIndexer] Generated embeddings for ${embeddedChunks.length} chunks`);
    
    // 4. Delete old chunks for this file (if re-indexing)
    await db.delete(knowledgeChunks)
      .where(and(
        eq(knowledgeChunks.collection, collection),
        eq(knowledgeChunks.driveFileId, driveFileId)
      ));
    
    // 5. Insert new chunks
    for (const chunk of embeddedChunks) {
      await db.insert(knowledgeChunks).values({
        collection,
        driveFileId,
        chunkIndex: chunk.index,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: {
          filePath: filePath || "",
          tokens: chunk.tokens,
          dateIndexed: new Date().toISOString(),
        },
      });
    }
    
    // 6. Update metadata
    await updateIndexMeta(driveFileId, collection, {
      status: "indexed",
      chunkCount: embeddedChunks.length,
      filePath,
      error: undefined,
    });
    
    console.log(`[KnowledgeIndexer] Successfully indexed file ${driveFileId} with ${embeddedChunks.length} chunks`);
    
    return {
      success: true,
      driveFileId,
      collection,
      chunksIndexed: embeddedChunks.length,
    };
  } catch (error: any) {
    console.error(`[KnowledgeIndexer] Failed to index file ${driveFileId}:`, error);
    
    await updateIndexMeta(driveFileId, collection, {
      status: "failed",
      error: error.message || "Unknown error",
      chunkCount: 0,
      filePath,
    });
    
    return {
      success: false,
      driveFileId,
      collection,
      chunksIndexed: 0,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Update or insert knowledge_index_meta record for a file.
 */
async function updateIndexMeta(
  driveFileId: string,
  collection: CollectionType,
  data: {
    status: "pending" | "indexed" | "failed";
    chunkCount: number;
    filePath?: string;
    error?: string;
  }
) {
  const existing = await db.query.knowledgeIndexMeta.findFirst({
    where: (meta, { and, eq }) => and(
      eq(meta.collection, collection),
      eq(meta.driveFileId, driveFileId)
    ),
  });
  
  if (existing) {
    await db.update(knowledgeIndexMeta)
      .set({
        ...data,
        lastIndexedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(knowledgeIndexMeta.collection, collection),
        eq(knowledgeIndexMeta.driveFileId, driveFileId)
      ));
  } else {
    await db.insert(knowledgeIndexMeta).values({
      collection,
      driveFileId,
      ...data,
    });
  }
}

/**
 * Run a full indexing job for all collections.
 * Scans all Drive folders and indexes new/modified files.
 * 
 * @param collections - Optional array of collections to index (defaults to all)
 * @returns Summary of indexing results
 */
export async function runNightlyDriveIndexJob(
  collections?: CollectionType[]
): Promise<{
  totalFiles: number;
  indexed: number;
  failed: number;
  skipped: number;
}> {
  const collectionsToIndex = collections || knowledgeCollections.map(c => c.collection);
  
  console.log(`[KnowledgeIndexer] Starting nightly indexing job for collections: ${collectionsToIndex.join(", ")}`);
  
  let totalFiles = 0;
  let indexed = 0;
  let failed = 0;
  let skipped = 0;
  
  const drive = getDriveClient();
  
  for (const collection of collectionsToIndex) {
    const config = knowledgeCollections.find(c => c.collection === collection);
    if (!config || !config.driveFolderId) {
      console.warn(`[KnowledgeIndexer] Skipping collection ${collection}: no folder configured`);
      continue;
    }
    
    console.log(`[KnowledgeIndexer] Indexing collection ${collection} from folder ${config.driveFolderId}`);
    
    try {
      // List all files in the folder
      const { items } = await drive.listFilesInFolder(config.driveFolderId, 1000);
      totalFiles += items.length;
      
      console.log(`[KnowledgeIndexer] Found ${items.length} files in ${collection}`);
      
      // Index each file
      for (const file of items) {
        // Skip non-text files (only index text, docs, csv, etc.)
        const textMimeTypes = [
          "text/plain",
          "text/csv",
          "application/vnd.google-apps.document",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        
        if (file.mimeType && !textMimeTypes.includes(file.mimeType)) {
          console.log(`[KnowledgeIndexer] Skipping ${file.name} (unsupported mime type: ${file.mimeType})`);
          skipped++;
          continue;
        }
        
        const result = await indexSingleDriveFile(file.id, collection, file.name);
        
        if (result.success) {
          indexed++;
        } else {
          failed++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      console.error(`[KnowledgeIndexer] Failed to index collection ${collection}:`, error);
      failed++;
    }
  }
  
  console.log(`[KnowledgeIndexer] Nightly job complete: ${indexed}/${totalFiles} indexed, ${failed} failed, ${skipped} skipped`);
  
  return {
    totalFiles,
    indexed,
    failed,
    skipped,
  };
}
