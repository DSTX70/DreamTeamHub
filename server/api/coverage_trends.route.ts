/**
 * Coverage Trends API Routes
 * Historical coverage snapshots and trend analysis
 */

import type { Request, Response } from "express";
import express from "express";
import { storage } from "../storage";
import { insertCoverageHistorySchema } from "@shared/schema";

export const router = express.Router();

// GET /api/coverage/trends - Get historical coverage data
router.get("/api/coverage/trends", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const filters: { startDate?: Date; endDate?: Date; limit?: number } = {};
    
    if (startDate && typeof startDate === 'string') {
      filters.startDate = new Date(startDate);
    }
    if (endDate && typeof endDate === 'string') {
      filters.endDate = new Date(endDate);
    }
    if (limit && typeof limit === 'string') {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit)) filters.limit = parsedLimit;
    }
    
    const history = await storage.getCoverageHistory(filters);
    
    res.json(history);
  } catch (error: any) {
    console.error("Error fetching coverage trends:", error);
    res.status(500).json({
      error: "Failed to fetch coverage trends",
      message: error.message || "Unknown error"
    });
  }
});

// GET /api/coverage/trends/latest - Get latest coverage snapshot
router.get("/api/coverage/trends/latest", async (_req: Request, res: Response) => {
  try {
    const latest = await storage.getLatestCoverageSnapshot();
    
    if (!latest) {
      return res.status(404).json({ error: "No coverage snapshots found" });
    }
    
    res.json(latest);
  } catch (error: any) {
    console.error("Error fetching latest coverage snapshot:", error);
    res.status(500).json({
      error: "Failed to fetch latest coverage snapshot",
      message: error.message || "Unknown error"
    });
  }
});

// GET /api/coverage/trends/:id - Get a specific coverage snapshot
router.get("/api/coverage/trends/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid snapshot ID" });
    }
    
    const snapshot = await storage.getCoverageSnapshot(id);
    
    if (!snapshot) {
      return res.status(404).json({ error: "Coverage snapshot not found" });
    }
    
    res.json(snapshot);
  } catch (error: any) {
    console.error("Error fetching coverage snapshot:", error);
    res.status(500).json({
      error: "Failed to fetch coverage snapshot",
      message: error.message || "Unknown error"
    });
  }
});

// POST /api/coverage/trends/capture - Capture current coverage as snapshot
router.post("/api/coverage/trends/capture", async (req: Request, res: Response) => {
  try {
    // Get current coverage data
    // Note: agents.id matches roleCards.handle for Dream Team agents
    const roles = await storage.getRoleCards();
    const agents = await storage.getAgents({ status: 'active' });
    
    // Build agent count by role (agent.id == role.handle)
    // Map key: role.handle, value: count of agents with ID matching that handle
    const agentsByRole = new Map<string, number>();
    for (const agent of agents) {
      // agent.id IS the role handle, so we increment the count for that handle
      const roleHandle = agent.id;
      agentsByRole.set(roleHandle, (agentsByRole.get(roleHandle) || 0) + 1);
    }
    
    // Calculate coverage metrics
    let unstaffedCount = 0;
    let overReplicatedCount = 0;
    const threshold = parseInt(req.body.threshold || '3', 10); // Configurable over-replication threshold
    
    const roleBreakdown = roles.map(role => {
      // Count agents where agent.id == role.handle
      const agentCount = agentsByRole.get(role.handle) || 0;
      const isUnstaffed = agentCount === 0;
      const isOverReplicated = agentCount >= threshold;
      
      if (isUnstaffed) unstaffedCount++;
      if (isOverReplicated) overReplicatedCount++;
      
      return {
        roleHandle: role.handle,
        roleName: role.title,
        agentCount,
        isUnstaffed,
        isOverReplicated
      };
    });
    
    const totalRoles = roles.length;
    const staffedRoles = totalRoles - unstaffedCount;
    const coveragePercent = totalRoles > 0 ? Math.round((staffedRoles / totalRoles) * 100) : 0;
    
    // Add user info
    const userId = (req as any).user?.id;
    
    const snapshotData = {
      totalRoles,
      totalAgents: agents.length,
      unstaffedRoles: unstaffedCount,
      overReplicatedRoles: overReplicatedCount,
      coveragePercent,
      roleBreakdown,
      capturedBy: userId || 'system',
      notes: req.body.notes || null,
    };
    
    // Validate with schema
    const validationResult = insertCoverageHistorySchema.safeParse(snapshotData);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }
    
    const snapshot = await storage.createCoverageSnapshot(validationResult.data as any);
    
    res.status(201).json(snapshot);
  } catch (error: any) {
    console.error("Error capturing coverage snapshot:", error);
    res.status(500).json({
      error: "Failed to capture coverage snapshot",
      message: error.message || "Unknown error"
    });
  }
});
