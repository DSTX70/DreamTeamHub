/**
 * Image Transformation Route with Sharp
 * Handles responsive image resizing and format conversion
 * 
 * Features:
 * - No upscaling: streams original if source width ≤ requested width
 * - Format conversion: webp, avif, jpeg, png
 * - Long cache headers for CDN/browser caching
 * - Secured to /public root by default
 */

import express, { type Request, type Response } from "express";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const router = express.Router();

/**
 * Supported output formats
 */
type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * Parse and validate image transformation query parameters
 */
interface ImageTransformParams {
  src: string;
  width?: number;
  format?: ImageFormat;
}

function parseImageParams(query: any): ImageTransformParams | null {
  const { src, w, fmt } = query;
  
  if (!src || typeof src !== 'string') {
    return null;
  }
  
  // Parse width
  const width = w ? parseInt(w as string, 10) : undefined;
  if (width !== undefined && (isNaN(width) || width <= 0 || width > 4000)) {
    return null;
  }
  
  // Parse format
  const format = fmt as ImageFormat | undefined;
  if (format && !['webp', 'avif', 'jpeg', 'png'].includes(format)) {
    return null;
  }
  
  return { src, width, format };
}

/**
 * Resolve source file path (secured to /public root)
 */
function resolveSourcePath(src: string): string | null {
  try {
    // Remove leading slash and resolve relative to public directory
    const relativePath = src.startsWith('/') ? src.slice(1) : src;
    const publicDir = path.join(process.cwd(), 'public');
    const fullPath = path.resolve(publicDir, relativePath);
    
    // Security check: ensure path is within public directory
    if (!fullPath.startsWith(publicDir)) {
      console.warn('[Image] Path traversal attempt:', src);
      return null;
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    return fullPath;
  } catch (error) {
    console.error('[Image] Error resolving path:', error);
    return null;
  }
}

/**
 * Get image metadata (dimensions, format)
 */
async function getImageMetadata(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format,
  };
}

/**
 * Stream original file without transformation
 */
function streamOriginal(res: Response, filePath: string, format?: string) {
  // Set long cache headers (1 year)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  
  // Set content type based on format
  const contentType = format === 'png' ? 'image/png' 
                    : format === 'webp' ? 'image/webp'
                    : format === 'avif' ? 'image/avif'
                    : 'image/jpeg';
  
  res.setHeader('Content-Type', contentType);
  
  // Stream file
  fs.createReadStream(filePath).pipe(res);
}

/**
 * Transform and stream image
 */
async function transformAndStream(
  res: Response,
  filePath: string,
  width?: number,
  format?: ImageFormat
) {
  try {
    let transformer = sharp(filePath);
    
    // Resize if width specified
    if (width) {
      transformer = transformer.resize(width, undefined, {
        fit: 'inside',
        withoutEnlargement: true, // Never upscale
      });
    }
    
    // Convert format if specified
    if (format === 'webp') {
      transformer = transformer.webp({ quality: 85 });
    } else if (format === 'avif') {
      transformer = transformer.avif({ quality: 80 });
    } else if (format === 'jpeg') {
      transformer = transformer.jpeg({ quality: 85, progressive: true });
    } else if (format === 'png') {
      transformer = transformer.png({ compressionLevel: 8 });
    }
    
    // Set cache headers (1 year)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Set content type
    const contentType = format === 'webp' ? 'image/webp'
                      : format === 'avif' ? 'image/avif'
                      : format === 'png' ? 'image/png'
                      : 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    
    // Stream transformed image
    transformer.pipe(res);
  } catch (error) {
    console.error('[Image] Transformation error:', error);
    res.status(500).send('Image transformation failed');
  }
}

/**
 * GET /img - Image transformation endpoint
 * 
 * Query params:
 * - src: Source image path (e.g., /static/products/p1.jpg)
 * - w: Target width in pixels (optional)
 * - fmt: Output format (webp|avif|jpeg|png) (optional)
 * 
 * Behavior:
 * - If w is provided AND source width ≤ w AND no fmt requested → streams original
 * - Otherwise → resizes and/or converts with long cache headers
 * 
 * @example
 * /img?src=/static/products/p1.jpg&w=640&fmt=webp
 * /img?src=/static/products/p1.jpg&w=320
 * /img?src=/static/products/p1.jpg&fmt=avif
 */
router.get('/img', async (req: Request, res: Response) => {
  try {
    // Parse parameters
    const params = parseImageParams(req.query);
    if (!params) {
      return res.status(400).send('Invalid image parameters');
    }
    
    // Resolve source file
    const filePath = resolveSourcePath(params.src);
    if (!filePath) {
      return res.status(404).send('Image not found');
    }
    
    // Get image metadata
    const metadata = await getImageMetadata(filePath);
    
    // Decision: stream original or transform?
    // Stream original if:
    // 1. Width is specified AND source width <= requested width
    // 2. AND no format conversion requested
    const shouldStreamOriginal = 
      params.width !== undefined &&
      metadata.width <= params.width &&
      !params.format;
    
    if (shouldStreamOriginal) {
      // No transformation needed - stream original file
      streamOriginal(res, filePath, metadata.format);
    } else {
      // Transform (resize and/or convert format)
      await transformAndStream(res, filePath, params.width, params.format);
    }
  } catch (error: any) {
    console.error('[Image] Request error:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
