// Tiny MIME sniff (magic numbers) and SVG/XML guard
export function sniffMimeOrThrow(bytes: Buffer): string {
  if (bytes.length < 12) throw new Error("File too small");
  // PNG
  if (bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4E && bytes[3]===0x47) return "image/png";
  // JPEG
  if (bytes[0]===0xFF && bytes[1]===0xD8) return "image/jpeg";
  // WEBP (RIFF....WEBP)
  if (bytes[0]===0x52 && bytes[1]===0x49 && bytes[2]===0x46 && bytes[3]===0x46 && bytes[8]===0x57 && bytes[9]===0x45 && bytes[10]===0x42 && bytes[11]===0x50) return "image/webp";
  // AVIF (ftypavif/avis/iso5/.. at 4..11)
  const brand = bytes.slice(4, 12).toString("ascii");
  if (brand.includes("avif") || brand.includes("avis") || brand.includes("iso5")) return "image/avif";
  // XML / SVG detection — reject
  const head = bytes.slice(0, 256).toString("utf8").toLowerCase();
  if (head.includes("<svg") || head.includes("<?xml")) throw new Error("SVG/XML not allowed");
  throw new Error("Unsupported image type");
}
