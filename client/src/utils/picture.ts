const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1600, 1920];

export function buildSrcSet(baseKey: string, ext: "avif"|"webp"|"jpg", widths?: number[]) {
  const ws = widths && widths.length ? widths : DEFAULT_WIDTHS;
  // expects keys like "<baseKey>-<w>.<ext>"
  return ws.map(w => `${baseKey}-${w}.${ext} ${w}w`).join(", ");
}
