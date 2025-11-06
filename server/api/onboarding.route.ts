import { Request, Response } from "express";
import { db } from "../db";
import { brands, products, knowledgeLinks, insertBrandSchema, insertProductSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const DriveTriplet = z.object({
  readFolderId: z.string().min(3),
  draftFolderId: z.string().min(3),
  publishFolderId: z.string().min(3),
});

const CreateBrandBody = z.object({
  businessUnit: z.string().min(2), // IMAGINATION, INNOVATION, IMPACT
  name: z.string().min(2),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  drive: DriveTriplet,
});

const CreateProductBody = z.object({
  brandId: z.number().int().positive(),
  name: z.string().min(2),
  status: z.string().optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "slug must be kebab-case").optional(),
  drive: DriveTriplet.optional(),
});

export async function createBrand(req: Request, res: Response) {
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ 
      error: parsed.error.errors.map(e => e.message).join("; ")
    });
  }

  const { businessUnit, name, slug, drive } = parsed.data;

  const [brand] = await db.insert(brands).values({
    name,
    slug,
    businessUnit,
  }).returning();

  await db.insert(knowledgeLinks).values([
    { 
      label: `${name} - Read`,
      role: "read",
      businessUnit,
      driveFolderId: drive.readFolderId,
    },
    {
      label: `${name} - Draft`,
      role: "draft",
      businessUnit,
      driveFolderId: drive.draftFolderId,
    },
    {
      label: `${name} - Publish`,
      role: "publish",
      businessUnit,
      driveFolderId: drive.publishFolderId,
    },
  ]);

  res.status(201).json({ ok: true, brand });
}

export async function createProduct(req: Request, res: Response) {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: parsed.error.errors.map(e => e.message).join("; ")
    });
  }

  const { brandId, name, status, drive } = parsed.data;

  const [product] = await db.insert(products).values({
    brandId,
    name,
    status: status ?? 'active',
  }).returning();

  if (drive) {
    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
    if (brand) {
      await db.insert(knowledgeLinks).values([
        {
          label: `${name} - Read`,
          role: "read",
          businessUnit: brand.businessUnit,
          driveFolderId: drive.readFolderId,
        },
        {
          label: `${name} - Draft`,
          role: "draft",
          businessUnit: brand.businessUnit,
          driveFolderId: drive.draftFolderId,
        },
        {
          label: `${name} - Publish`,
          role: "publish",
          businessUnit: brand.businessUnit,
          driveFolderId: drive.publishFolderId,
        },
      ]);
    }
  }

  res.status(201).json({ ok: true, product });
}
