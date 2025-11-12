import { v4 as uuid } from 'uuid';
import { s3Put } from '../images/s3';
import { db } from '../db';
import { workItemFiles, insertWorkItemFileSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_ALLOWLIST = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'txt', 'md', 'zip', 'png', 'jpg', 'jpeg', 'webp', 'svg'];
const DEFAULT_MAX_MB = 25;

export interface UploaderConfig {
  allowlist: string[];
  maxMb: number;
}

export function getUploaderConfig(): UploaderConfig {
  const allowlistEnv = process.env.UPLOADS_ALLOWLIST || '';
  const maxMbEnv = parseInt(process.env.UPLOADS_MAX_MB || '', 10);

  return {
    allowlist: allowlistEnv ? allowlistEnv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : DEFAULT_ALLOWLIST,
    maxMb: maxMbEnv || DEFAULT_MAX_MB,
  };
}

export async function uploadFileToS3(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  workItemId: number,
  userId: string
): Promise<{ id: string; url: string }> {
  const config = getUploaderConfig();

  const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
  if (config.allowlist.length > 0 && !config.allowlist.includes(ext)) {
    throw new Error(`File extension .${ext} not allowed. Allowed: ${config.allowlist.join(', ')}`);
  }

  const maxBytes = config.maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max size: ${config.maxMb}MB`);
  }

  const fileId = uuid();
  const s3Key = `work-items/${workItemId}/${fileId}-${file.originalname}`;
  const bucket = process.env.AWS_S3_BUCKET!;

  await s3Put(s3Key, file.buffer, file.mimetype, 'public, max-age=31536000');

  const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

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

  return { id: inserted.id, url: s3Url };
}

export async function getWorkItemFiles(workItemId: number) {
  return await db.select().from(workItemFiles).where(eq(workItemFiles.workItemId, workItemId)).orderBy(workItemFiles.uploadedAt);
}
