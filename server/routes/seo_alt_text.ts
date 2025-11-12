import { Router } from 'express';
import { db } from '../db';
import { altTexts, workItemFiles } from '@shared/schema';
import { parse } from 'csv-parse/sync';
import * as z from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const AltRow = z.object({
  image_key: z.string().min(1),
  alt_text: z.string().min(2),
  context: z.string().optional().nullable().transform(v => v || null),
  locale: z.string().min(2).default('en'),
  reviewed_by: z.string().optional().nullable().transform(v => v || null),
  reviewed_at: z.string().optional().nullable().transform(v => v || null),
});
type AltRow = z.infer<typeof AltRow>;

export const seoAltTextRouter = Router();

// S3 client for downloading CSV files from S3
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
      throw new Error('S3 credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables.');
    }
    
    // Extract region code from full region string (e.g., "US East (Ohio) us-east-2" -> "us-east-2")
    const rawRegion = process.env.AWS_REGION || 'us-east-1';
    const region = rawRegion.match(/[a-z]{2}-[a-z]+-\d+/)?.[0] || rawRegion;
    
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

async function downloadS3File(s3Key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: s3Key,
  });
  const response = await client.send(command);
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * POST /api/seo/alt-text/import
 * Body: { work_item_id:number, filename?:string }  // finds the file in work_item_files
 */
seoAltTextRouter.post('/seo/alt-text/import', async (req, res) => {
  const { work_item_id, filename } = req.body || {};
  
  if (!work_item_id) {
    return res.status(400).json({ ok: false, error: 'work_item_id is required' });
  }

  try {
    // Find the CSV file in work_item_files
    const query = filename
      ? db.select().from(workItemFiles).where(
          and(
            eq(workItemFiles.workItemId, work_item_id),
            eq(workItemFiles.filename, filename)
          )
        ).orderBy(desc(workItemFiles.uploadedAt)).limit(1)
      : db.select().from(workItemFiles).where(
          eq(workItemFiles.workItemId, work_item_id)
        ).orderBy(desc(workItemFiles.uploadedAt)).limit(1);
    
    const files = await query;
    
    if (!files.length) {
      return res.status(404).json({ 
        ok: false, 
        error: filename 
          ? `CSV file '${filename}' not found for Work Item #${work_item_id}` 
          : `No files found for Work Item #${work_item_id}` 
      });
    }

    const file = files[0];
    
    // Download the CSV content from S3
    const csvContent = await downloadS3File(file.s3Key);
    
    // Parse CSV
    const rows = parse(csvContent, { 
      columns: true, 
      skip_empty_lines: true, 
      trim: true 
    }) as Record<string, string>[];
    
    const valid: AltRow[] = [];
    const errors: Array<{ line: number; error: string }> = [];

    rows.forEach((r, i) => {
      const v = AltRow.safeParse({
        image_key: r.image_key,
        alt_text: r.alt_text,
        context: r.context || null,
        locale: r.locale || 'en',
        reviewed_by: r.reviewed_by || null,
        reviewed_at: r.reviewed_at || null,
      });
      if (v.success) {
        valid.push(v.data);
      } else {
        errors.push({ 
          line: i + 2, // +2 because row 1 is headers
          error: v.error.issues.map(x => x.message).join('; ') 
        });
      }
    });

    // Upsert into database using Drizzle
    let imported = 0;
    for (const row of valid) {
      await db.insert(altTexts).values({
        imageKey: row.image_key,
        altText: row.alt_text,
        context: row.context,
        locale: row.locale,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
      }).onConflictDoUpdate({
        target: [altTexts.imageKey, altTexts.locale],
        set: {
          altText: row.alt_text,
          context: row.context,
          reviewedBy: row.reviewed_by,
          reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          updatedAt: new Date(),
        },
      });
      imported++;
    }

    return res.json({ 
      ok: true, 
      imported, 
      errors,
      filename: file.filename,
      workItemId: work_item_id,
    });
  } catch (e: any) {
    console.error('[AltTextImport] Error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/seo/alt-text
 * Query params: ?image_key=...&locale=en
 */
seoAltTextRouter.get('/seo/alt-text', async (req, res) => {
  const { image_key, locale = 'en' } = req.query;
  
  if (!image_key) {
    return res.status(400).json({ ok: false, error: 'image_key is required' });
  }

  try {
    const results = await db.select().from(altTexts).where(
      and(
        eq(altTexts.imageKey, image_key as string),
        eq(altTexts.locale, locale as string)
      )
    );

    if (!results.length) {
      return res.status(404).json({ ok: false, error: 'Alt text not found' });
    }

    return res.json({ ok: true, altText: results[0] });
  } catch (e: any) {
    console.error('[AltTextGet] Error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/seo/alt-text/list
 * Returns all alt texts (optionally filtered by locale)
 */
seoAltTextRouter.get('/seo/alt-text/list', async (req, res) => {
  const { locale } = req.query;
  
  try {
    const query = locale 
      ? db.select().from(altTexts).where(eq(altTexts.locale, locale as string))
      : db.select().from(altTexts);
    
    const results = await query;
    return res.json({ ok: true, altTexts: results, count: results.length });
  } catch (e: any) {
    console.error('[AltTextList] Error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
