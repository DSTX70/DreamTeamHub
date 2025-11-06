/**
 * Saved Addresses CRUD
 * In-memory storage for demo purposes
 * TODO: Replace with database storage
 */

import express, { Request, Response } from "express";

export const router = express.Router();

console.log('[AddressRoute] Router initialized');

export type Address = {
  id: string;
  userId: string;
  label?: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
};

// In-memory store (replace with DB)
const addresses: Address[] = [
  {
    id: "addr-1",
    userId: "demo-user",
    label: "Home",
    name: "Jane Doe",
    line1: "123 Main St",
    line2: "Apt 4B",
    city: "Phoenix",
    region: "AZ",
    postal: "85001",
    country: "US",
    phone: "(555) 123-4567",
    isDefault: true,
  },
  {
    id: "addr-2",
    userId: "demo-user",
    label: "Office",
    name: "Jane Doe",
    line1: "456 Business Park",
    city: "Scottsdale",
    region: "AZ",
    postal: "85251",
    country: "US",
    phone: "(555) 987-6543",
    isDefault: false,
  },
];

// Get all addresses for current user
router.get("/api/account/addresses", (req: Request, res: Response) => {
  console.log('[AddressRoute] GET /api/account/addresses called');
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  const userAddresses = addresses.filter((a) => a.userId === userId);
  res.json(userAddresses);
});

// Get single address
router.get("/api/account/addresses/:id", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  const addr = addresses.find((a) => a.id === req.params.id && a.userId === userId);
  if (!addr) return res.status(404).json({ error: "Address not found" });
  res.json(addr);
});

// Create address
router.post("/api/account/addresses", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  const newAddr: Address = {
    id: `addr-${Date.now()}`,
    userId,
    ...req.body,
  };
  addresses.push(newAddr);
  res.status(201).json(newAddr);
});

// Update address
router.patch("/api/account/addresses/:id", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  const idx = addresses.findIndex((a) => a.id === req.params.id && a.userId === userId);
  if (idx === -1) return res.status(404).json({ error: "Address not found" });
  addresses[idx] = { ...addresses[idx], ...req.body };
  res.json(addresses[idx]);
});

// Delete address
router.delete("/api/account/addresses/:id", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  const idx = addresses.findIndex((a) => a.id === req.params.id && a.userId === userId);
  if (idx === -1) return res.status(404).json({ error: "Address not found" });
  addresses.splice(idx, 1);
  res.status(204).send();
});

// Seed endpoint for testing
router.post("/api/account/addresses/seed", (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || "demo-user";
  // Remove existing addresses for this user
  const filtered = addresses.filter((a) => a.userId !== userId);
  addresses.length = 0;
  addresses.push(...filtered);
  
  // Add sample addresses
  addresses.push({
    id: `addr-${Date.now()}-1`,
    userId,
    label: "Home",
    name: "Sample User",
    line1: "123 Main St",
    line2: "Apt 4B",
    city: "Phoenix",
    region: "AZ",
    postal: "85001",
    country: "US",
    phone: "(555) 123-4567",
    isDefault: true,
  });
  
  res.json({ message: "Sample addresses created" });
});
