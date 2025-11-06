/**
 * Evidence Packs API Routes
 * Manages evidence pack submissions for agent training and promotion
 */

import type { Request, Response } from "express";
import express from "express";
import { storage } from "../storage";
import { insertEvidencePackSchema } from "@shared/schema";
import { z } from "zod";

export const router = express.Router();

// GET /api/evidence-packs - List all evidence packs with optional filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const { agentId, status } = req.query;
    
    const filters: { agentId?: string; status?: string } = {};
    if (agentId && typeof agentId === 'string') filters.agentId = agentId;
    if (status && typeof status === 'string') filters.status = status;
    
    const packs = await storage.getEvidencePacks(filters);
    
    res.json(packs);
  } catch (error: any) {
    console.error("Error fetching evidence packs:", error);
    res.status(500).json({
      error: "Failed to fetch evidence packs",
      message: error.message || "Unknown error"
    });
  }
});

// GET /api/evidence-packs/:id - Get a single evidence pack
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid evidence pack ID" });
    }
    
    const pack = await storage.getEvidencePack(id);
    if (!pack) {
      return res.status(404).json({ error: "Evidence pack not found" });
    }
    
    res.json(pack);
  } catch (error: any) {
    console.error("Error fetching evidence pack:", error);
    res.status(500).json({
      error: "Failed to fetch evidence pack",
      message: error.message || "Unknown error"
    });
  }
});

// POST /api/evidence-packs - Create a new evidence pack
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = insertEvidencePackSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }
    
    // Add submitter information from authenticated user
    const userId = (req as any).user?.id;
    const data = validationResult.data as any;
    const packData = {
      ...data,
      submittedBy: userId || data.submittedBy,
    };
    
    const pack = await storage.createEvidencePack(packData);
    
    res.status(201).json(pack);
  } catch (error: any) {
    console.error("Error creating evidence pack:", error);
    res.status(500).json({
      error: "Failed to create evidence pack",
      message: error.message || "Unknown error"
    });
  }
});

// PATCH /api/evidence-packs/:id - Update an evidence pack
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid evidence pack ID" });
    }
    
    // Validate partial update
    const validationResult = insertEvidencePackSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }
    
    // If status is being updated to approved/rejected, set review metadata
    const data = validationResult.data as any;
    const updateData = { ...data };
    if (updateData.status && (updateData.status === 'approved' || updateData.status === 'rejected')) {
      const userId = (req as any).user?.id;
      updateData.reviewedBy = userId || updateData.reviewedBy;
      updateData.reviewedAt = new Date() as any;
    }
    
    const pack = await storage.updateEvidencePack(id, updateData);
    if (!pack) {
      return res.status(404).json({ error: "Evidence pack not found" });
    }
    
    res.json(pack);
  } catch (error: any) {
    console.error("Error updating evidence pack:", error);
    res.status(500).json({
      error: "Failed to update evidence pack",
      message: error.message || "Unknown error"
    });
  }
});

// DELETE /api/evidence-packs/:id - Delete an evidence pack
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid evidence pack ID" });
    }
    
    const deleted = await storage.deleteEvidencePack(id);
    if (!deleted) {
      return res.status(404).json({ error: "Evidence pack not found" });
    }
    
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting evidence pack:", error);
    res.status(500).json({
      error: "Failed to delete evidence pack",
      message: error.message || "Unknown error"
    });
  }
});

