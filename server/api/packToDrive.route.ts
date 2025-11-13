import type { Request, Response } from "express";
import { getLatestPack, type PackType } from "../ai/persistence";
import { exportPackToFiles } from "../services/packExport";
import { getDriveClient } from "../integrations/googleDrive_real";
import { getPackFolder } from "../config/drivePackFolders";
import { db } from "../db";
import { workItemDriveFiles, opsEvent, workItems } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { storage } from "../storage";

async function checkWorkItemAccess(workItemId: number, req: Request): Promise<{ hasAccess: boolean; workItem: any | null }> {
  const workItem = await storage.getWorkItem(workItemId);
  if (!workItem) {
    return { hasAccess: false, workItem: null };
  }
  
  const user = (req as any).user;
  const userId = user?.claims?.sub || user?.id;
  const userEmail = user?.claims?.email || user?.email;
  
  // Must have at least one user identifier
  if (!userId && !userEmail) {
    return { hasAccess: false, workItem };
  }
  
  // Check if user has ops_admin role (can access all work items)
  const { getUserRoles } = await import("../security/roles");
  const roles = getUserRoles(userId || "", userEmail || "");
  if (roles.includes("ops_admin")) {
    return { hasAccess: true, workItem };
  }
  
  // Check if user is the owner of the work item
  if (workItem.ownerId && typeof workItem.ownerId === 'number') {
    const owner = await db.query.persons.findFirst({
      where: (persons, { eq }) => eq(persons.id, workItem.ownerId!),
    });
    
    // Match by Replit user ID or email
    if (owner) {
      const matchByUserId = userId && owner.replitUserId && owner.replitUserId === userId;
      const matchByEmail = userEmail && owner.email && owner.email.toLowerCase() === userEmail.toLowerCase();
      
      if (matchByUserId || matchByEmail) {
        return { hasAccess: true, workItem };
      }
    }
  }
  
  // TODO: Implement pod membership checks
  // Future: Check if user is a member of the work item's pod
  
  // Deny access by default (only owners and admins can access)
  return { hasAccess: false, workItem };
}

export async function postSavePackToDrive(req: Request, res: Response) {
  try {
    const workItemId = parseInt(req.params.workItemId, 10);
    const packType = req.params.packType as PackType;

    if (isNaN(workItemId)) {
      return res.status(400).json({ error: "Invalid work item ID" });
    }

    const validPackTypes: PackType[] = ["lifestyle", "patent", "launch", "website_audit"];
    if (!validPackTypes.includes(packType)) {
      return res.status(400).json({ error: `Invalid pack type: ${packType}` });
    }

    // Authorization check
    const { hasAccess, workItem } = await checkWorkItemAccess(workItemId, req);
    if (!workItem) {
      return res.status(404).json({ error: "Work item not found" });
    }
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get latest pack from database
    const latestPack = await getLatestPack(workItemId, packType);
    if (!latestPack) {
      return res.status(404).json({ 
        error: `No ${packType} pack found for work item ${workItemId}` 
      });
    }

    // Export pack to files (DOCX/CSV)
    const exportedFiles = await exportPackToFiles(
      workItemId,
      packType,
      latestPack.version,
      latestPack.packData
    );

    // Get Drive folder for this pack type
    const driveFolderId = getPackFolder(packType);

    // Upload files to Google Drive with transactional safety
    const drive = getDriveClient();
    const uploadedFiles = [];
    const uploadedDriveFileIds: string[] = [];

    try {
      for (const file of exportedFiles) {
        const driveFile = await drive.upload(driveFolderId, {
          buffer: file.buffer,
          fileName: file.fileName,
          mimeType: file.mimeType,
        });
        
        uploadedDriveFileIds.push(driveFile.id);
        uploadedFiles.push(driveFile);
      }

      // Save all Drive file references to database in a transaction
      await db.transaction(async (tx) => {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const driveFile = uploadedFiles[i];
          const file = exportedFiles[i];
          
          await tx.insert(workItemDriveFiles).values({
            workItemId,
            packId: latestPack.id,
            driveFileId: driveFile.id,
            fileName: file.fileName,
            mimeType: file.mimeType,
            webViewLink: driveFile.webViewLink || "",
            packType,
            driveFolderId,
            uploadedBy: (req as any).user?.email || (req as any).user?.id || "system",
          });
        }

        // Log operation event
        const actor = (req as any).user?.email || (req as any).user?.id || "system";
        await tx.insert(opsEvent).values({
          actor,
          kind: "PACK_SAVE_TO_DRIVE",
          ownerType: "WORK_ITEM",
          ownerId: String(workItemId),
          message: `Saved ${packType} pack v${latestPack.version} to Drive (${uploadedFiles.length} files)`,
          meta: {
            packType,
            version: latestPack.version,
            packId: latestPack.id,
            driveFiles: uploadedFiles.map(f => ({
              driveFileId: f.id,
              fileName: f.name,
              webViewLink: f.webViewLink,
            })),
          },
        });
      });
    } catch (dbError) {
      // Transaction failed - cleanup uploaded Drive files
      console.error("Database transaction failed, cleaning up Drive files:", dbError);
      for (const driveFileId of uploadedDriveFileIds) {
        try {
          // TODO: Implement Drive file deletion
          console.warn(`Should delete orphaned Drive file: ${driveFileId}`);
        } catch (cleanupError) {
          console.error(`Failed to cleanup Drive file ${driveFileId}:`, cleanupError);
        }
      }
      throw dbError;
    }

    return res.status(201).json({
      ok: true,
      packVersion: latestPack.version,
      filesUploaded: uploadedFiles.length,
      files: uploadedFiles.map(f => ({
        driveFileId: f.id,
        fileName: f.name,
        webViewLink: f.webViewLink,
        mimeType: f.mimeType,
      })),
    });
  } catch (error: any) {
    console.error("Error saving pack to Drive:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to save pack to Drive" 
    });
  }
}

export async function getWorkItemDriveFiles(req: Request, res: Response) {
  try {
    const workItemId = parseInt(req.params.workItemId, 10);

    if (isNaN(workItemId)) {
      return res.status(400).json({ error: "Invalid work item ID" });
    }

    // Authorization check
    const { hasAccess, workItem } = await checkWorkItemAccess(workItemId, req);
    if (!workItem) {
      return res.status(404).json({ error: "Work item not found" });
    }
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const files = await db
      .select()
      .from(workItemDriveFiles)
      .where(eq(workItemDriveFiles.workItemId, workItemId))
      .orderBy(workItemDriveFiles.createdAt);

    return res.json({
      ok: true,
      files,
    });
  } catch (error: any) {
    console.error("Error fetching Drive files:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to fetch Drive files" 
    });
  }
}
