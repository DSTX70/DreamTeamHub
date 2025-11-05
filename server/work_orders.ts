import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { insertWorkOrderSchema } from "@shared/schema";

export const workOrders = Router();

// GET /api/work-orders - List all work orders
workOrders.get("/", async (req: Request, res: Response) => {
  try {
    const orders = await storage.getWorkOrders();
    return res.json(orders);
  } catch (error: any) {
    console.error("Failed to fetch work orders:", error);
    return res.status(500).json({ 
      error: "Failed to fetch work orders",
      message: error.message 
    });
  }
});

// POST /api/work-orders - Create new work order
workOrders.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = insertWorkOrderSchema.parse(req.body);
    const newOrder = await storage.createWorkOrder(parsed);
    return res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Failed to create work order:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        error: "Validation failed",
        details: error.errors 
      });
    }
    return res.status(500).json({ 
      error: "Failed to create work order",
      message: error.message 
    });
  }
});
