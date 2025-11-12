import { Router } from 'express';
import { db } from '../db';
import { seoMeta, workItemFiles } from '@shared/schema';
import { parse } from 'csv-parse/sync';
import * as z from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSeoSection } from '../lib/seo';

const SeoMetaRow = z.object({
  route: z.string().min(1),
  section_key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  og_image: z.string().optional().nullable().transform(v => v || null),
  keywords: z.string().optional().nullable().transform(v => v || null),
  locale: z.string().min(2).default('en'),
});
type SeoMetaRow = z.infer<typeof SeoMetaRow>;

export const seoMetaRouter = Router();

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
 * POST /api/seo/meta/import
 * Body: { work_item_id:number, filename?:string }  // finds the file in work_item_files
 */
seoMetaRouter.post('/seo/meta/import', async (req, res) => {
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
          ? `File '${filename}' not found for work item ${work_item_id}` 
          : `No files found for work item ${work_item_id}` 
      });
    }

    const file = files[0];
    
    // Download CSV content from S3
    const csvContent = await downloadS3File(file.s3Key);
    
    // Parse CSV
    const rawRows = parse(csvContent, { 
      columns: true, 
      trim: true, 
      skip_empty_lines: true 
    }) as any[];

    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // +2 because row 1 is header, and we start from 0
      const raw = rawRows[i];
      
      try {
        // Validate row
        const validated = SeoMetaRow.parse(raw);
        
        // Check if entry exists
        const existing = await db.select().from(seoMeta)
          .where(and(
            eq(seoMeta.route, validated.route),
            eq(seoMeta.sectionKey, validated.section_key),
            eq(seoMeta.locale, validated.locale)
          ))
          .limit(1);

        if (existing.length) {
          // Update existing entry
          await db.update(seoMeta)
            .set({
              title: validated.title,
              description: validated.description,
              ogImage: validated.og_image,
              keywords: validated.keywords,
              updatedAt: new Date()
            })
            .where(and(
              eq(seoMeta.route, validated.route),
              eq(seoMeta.sectionKey, validated.section_key),
              eq(seoMeta.locale, validated.locale)
            ));
        } else {
          // Insert new entry
          await db.insert(seoMeta).values({
            route: validated.route,
            sectionKey: validated.section_key,
            title: validated.title,
            description: validated.description,
            ogImage: validated.og_image,
            keywords: validated.keywords,
            locale: validated.locale,
          });
        }
        
        imported++;
      } catch (e: any) {
        errors.push({
          row: rowNum,
          error: e.message || String(e)
        });
      }
    }

    return res.json({ 
      ok: true, 
      imported, 
      total: rawRows.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e: any) {
    console.error('SEO meta import error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/seo/meta?route=/&locale=en
 * Query all SEO meta entries for a route
 */
seoMetaRouter.get('/seo/meta', async (req, res) => {
  try {
    const { route, locale = 'en' } = req.query;
    
    if (!route || typeof route !== 'string') {
      return res.status(400).json({ ok: false, error: 'route parameter is required' });
    }

    const entries = await db.select().from(seoMeta)
      .where(and(
        eq(seoMeta.route, route),
        eq(seoMeta.locale, locale as string)
      ));

    return res.json({ ok: true, entries });
  } catch (e: any) {
    console.error('SEO meta query error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/seo/meta/section?route=/&section_key=home.lifestyle_ol1&locale=en
 * Get a specific SEO section
 */
seoMetaRouter.get('/seo/meta/section', async (req, res) => {
  try {
    const { route, section_key, locale = 'en' } = req.query;
    
    if (!route || typeof route !== 'string') {
      return res.status(400).json({ ok: false, error: 'route parameter is required' });
    }
    
    if (!section_key || typeof section_key !== 'string') {
      return res.status(400).json({ ok: false, error: 'section_key parameter is required' });
    }

    const seo = await getSeoSection(route, section_key, locale as string);

    return res.json({ ok: true, seo });
  } catch (e: any) {
    console.error('SEO meta section query error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
