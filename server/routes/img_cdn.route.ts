import express, { Request, Response } from "express";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const router = express.Router();

const bucket = process.env.AWS_S3_BUCKET!;
const rawRegion = process.env.AWS_REGION || "us-east-1";
const region = rawRegion.split(' ').pop() || "us-east-1";

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function getContentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp': return 'image/webp';
    case 'avif': return 'image/avif';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

router.head("/img/*", async (req: Request, res: Response) => {
  const key = String(req.params[0] || "");
  
  if (!key) {
    return res.status(404).end();
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.setHeader("Cache-Control", response.CacheControl || "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", response.ContentType || getContentTypeFromKey(key));
    res.setHeader("Content-Length", String(response.ContentLength || 0));
    if (response.ETag) {
      res.setHeader("ETag", response.ETag);
    }
    if (response.LastModified) {
      res.setHeader("Last-Modified", response.LastModified.toUTCString());
    }

    res.status(200).end();
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).end();
    }
    console.error('[img_cdn] HEAD error:', error);
    res.status(500).end();
  }
});

router.get("/img/*", async (req: Request, res: Response) => {
  const key = String(req.params[0] || "");
  
  if (!key) {
    return res.status(404).send('Image key required');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.setHeader("Cache-Control", response.CacheControl || "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", response.ContentType || getContentTypeFromKey(key));
    if (response.ContentLength) {
      res.setHeader("Content-Length", String(response.ContentLength));
    }
    if (response.ETag) {
      res.setHeader("ETag", response.ETag);
    }
    if (response.LastModified) {
      res.setHeader("Last-Modified", response.LastModified.toUTCString());
    }

    const stream = response.Body as Readable;
    stream.pipe(res);
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).send('Image not found in S3');
    }
    console.error('[img_cdn] GET error:', error);
    res.status(500).send('Failed to fetch image from S3');
  }
});

export default router;
