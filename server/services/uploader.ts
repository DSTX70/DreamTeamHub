import { v4 as uuid } from 'uuid';
import { s3Put } from '../images/s3';
import { db } from '../db';
import { workItemFiles, insertWorkItemFileSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveUploadsConfig } from './opsUploadsConfig';

const DEFAULT_ALLOWLIST = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'txt', 'md', 'zip', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
const DEFAULT_MAX_MB = 25;

export interface UploaderConfig {
  allowlist: string[];
  maxSizeMB: number;
}

export function getUploaderConfig(): UploaderConfig {
  const allowlistEnv = process.env.UPLOADS_ALLOWLIST || '';
  const maxMbEnv = parseInt(process.env.UPLOADS_MAX_MB || '', 10);

  return {
    allowlist: allowlistEnv ? allowlistEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : DEFAULT_ALLOWLIST,
    maxSizeMB: maxMbEnv || DEFAULT_MAX_MB,
  };
}

export async function uploadFileToS3(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  workItemId: number,
  userId: string
): Promise<{ id: string; url: string }> {
  // Fetch config from database (includes both legacy allowlist and new allowed_types)
  const { effective: dbConfig } = await getEffectiveUploadsConfig();

  // Check if uploads are enabled
  if (!dbConfig.enabled) {
    throw new Error('File uploads are currently disabled');
  }

  // Validate using MIME type first, then fall back to extension
  const allowlist = dbConfig.allowlist.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
  let isValidType = false;

  // Try MIME type validation first (when configured)
  if (dbConfig.allowed_types && dbConfig.allowed_types.length > 0 && file.mimetype) {
    const mimeType = file.mimetype.toLowerCase();
    if (dbConfig.allowed_types.includes(mimeType)) {
      isValidType = true;
    }
  }

  // Fall back to extension validation if MIME check didn't pass
  if (!isValidType && ext && allowlist.includes(ext)) {
    isValidType = true;
  }

  // Reject if neither validation passed
  if (!isValidType) {
    const allowedFormats = dbConfig.allowed_types && dbConfig.allowed_types.length > 0
      ? `MIME types: ${dbConfig.allowed_types.join(', ')} OR extensions: ${allowlist.join(', ')}`
      : `extensions: ${allowlist.join(', ')}`;
    throw new Error(`File type not allowed. Allowed ${allowedFormats}`);
  }

  const maxBytes = dbConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max size: ${dbConfig.maxSizeMB}MB`);
  }

  const fileId = uuid();
  const s3Key = `work-items/${workItemId}/${fileId}-${file.originalname}`;
  const bucket = process.env.AWS_S3_BUCKET!;
  
  const rawRegion = process.env.AWS_REGION || 'us-east-1';
  const region = rawRegion.split(' ').pop() || 'us-east-1';

  await s3Put(s3Key, file.buffer, file.mimetype, 'public, max-age=31536000');

  const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

  const fileData = {
    workItemId,
    filename: file.originalname,
    sizeBytes: file.size,
    mimeType: file.mimetype,
    s3Key,
    s3Url,
    uploadedByUserId: userId,
  };

  const [inserted] = await db.insert(workItemFiles).values(fileData).returning();

  return { id: String(inserted.id), url: s3Url };
}

export async function getWorkItemFiles(workItemId: number) {
  return await db.select().from(workItemFiles).where(eq(workItemFiles.workItemId, workItemId)).orderBy(workItemFiles.uploadedAt);
}
