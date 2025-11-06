import sharp from "sharp";

export type VariantSpec = { width: number; formats: ("avif"|"webp"|"jpg")[] };
export type TransformPlan = {
  sizes: number[]; // widths
  formats: ("avif"|"webp"|"jpg")[];
  quality: { avif: number; webp: number; jpg: number };
};

export const DEFAULT_PLAN: TransformPlan = {
  sizes: [320, 640, 960, 1280, 1600, 1920],
  formats: ["avif", "webp", "jpg"],
  quality: { avif: 50, webp: 70, jpg: 80 }
};

export async function makeVariants(bytes: Buffer, plan: TransformPlan = DEFAULT_PLAN) {
  const image = sharp(bytes, { failOn: "none" });
  const meta = await image.metadata();
  const out: { width: number; ext: string; buffer: Buffer; contentType: string }[] = [];
  for (const w of plan.sizes) {
    const fitWidth = Math.min(w, (meta.width || w));
    for (const ext of plan.formats) {
      let pipeline = image.clone().resize({ width: fitWidth, withoutEnlargement: true });
      if (ext === "avif") pipeline = pipeline.avif({ quality: plan.quality.avif });
      if (ext === "webp") pipeline = pipeline.webp({ quality: plan.quality.webp });
      if (ext === "jpg")  pipeline = pipeline.jpeg({ quality: plan.quality.jpg });
      const buffer = await pipeline.toBuffer();
      const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      out.push({ width: fitWidth, ext, buffer, contentType });
    }
  }
  return out;
}
