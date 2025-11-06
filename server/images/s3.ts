import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const bucket = process.env.AWS_S3_BUCKET!;
const region = process.env.AWS_REGION || "us-east-1";

export const s3 = new S3Client({ region });

export async function s3Put(key: string, body: Buffer, contentType: string, cacheControl?: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl || process.env.IMG_DEFAULT_CACHE_CONTROL || "public, max-age=31536000, immutable"
  }));
  return { bucket, key };
}

export async function s3List(prefix: string) {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  return (out.Contents || []).map(o => ({ key: o.Key!, size: o.Size || 0, etag: o.ETag }));
}
