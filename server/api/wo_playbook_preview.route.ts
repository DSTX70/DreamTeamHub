import type { Request, Response } from "express";
import express from "express";
import { storage } from "../storage";
import { insertPlaybookPreviewSchema } from "@shared/schema";
import { z } from "zod";

export const router = express.Router();

// Create or update playbook preview (draft)
router.post("/api/wo/playbook/preview", async (req: Request, res: Response) => {
  try {
    // Validate request body using Zod schema
    const validatedData = insertPlaybookPreviewSchema.parse(req.body);
    
    // Save to database
    const preview = await storage.createPlaybookPreview(validatedData);
    
    res.status(201).json({
      success: true,
      id: preview.id,
      preview
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }
    
    console.error("Error creating playbook preview:", error);
    res.status(500).json({
      error: "Failed to create playbook preview",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all playbook previews
router.get("/api/wo/playbook/preview", async (_req: Request, res: Response) => {
  try {
    const previews = await storage.getPlaybookPreviews();
    res.json(previews);
  } catch (error) {
    console.error("Error fetching playbook previews:", error);
    res.status(500).json({
      error: "Failed to fetch playbook previews"
    });
  }
});

// Get specific playbook preview by ID
router.get("/api/wo/playbook/preview/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preview ID" });
    }
    
    const preview = await storage.getPlaybookPreview(id);
    
    if (!preview) {
      return res.status(404).json({ error: "Playbook preview not found" });
    }
    
    res.json(preview);
  } catch (error) {
    console.error("Error fetching playbook preview:", error);
    res.status(500).json({
      error: "Failed to fetch playbook preview"
    });
  }
});

// Update playbook preview
router.put("/api/wo/playbook/preview/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preview ID" });
    }
    
    // Validate partial update data
    const validatedData = insertPlaybookPreviewSchema.partial().parse(req.body);
    
    const updated = await storage.updatePlaybookPreview(id, validatedData);
    
    if (!updated) {
      return res.status(404).json({ error: "Playbook preview not found" });
    }
    
    res.json({
      success: true,
      preview: updated
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }
    
    console.error("Error updating playbook preview:", error);
    res.status(500).json({
      error: "Failed to update playbook preview"
    });
  }
});

// Delete playbook preview
router.delete("/api/wo/playbook/preview/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preview ID" });
    }
    
    const deleted = await storage.deletePlaybookPreview(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Playbook preview not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting playbook preview:", error);
    res.status(500).json({
      error: "Failed to delete playbook preview"
    });
  }
});
