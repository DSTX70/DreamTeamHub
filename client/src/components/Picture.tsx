import React from "react";
import { buildSrcSet } from "../utils/picture";

type Props = {
  baseKey: string; // e.g., "uploads/products/CARD-CC-HELLO-001/cover-abc123"
  alt: string;
  sizes?: string; // e.g., "(min-width: 768px) 50vw, 100vw"
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
  // Optional explicit widths if your transformer diverges from defaults
  widths?: number[];
};

export const Picture: React.FC<Props> = ({ baseKey, alt, sizes = "100vw", className, imgClassName, width, height, widths }) => {
  const avif = buildSrcSet(baseKey, "avif", widths);
  const webp = buildSrcSet(baseKey, "webp", widths);
  const jpg  = buildSrcSet(baseKey, "jpg", widths);
  const fallback = jpg?.split(", ")[0]?.split(" ")[0] || "";
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      <img src={fallback} srcSet={jpg} sizes={sizes} alt={alt} className={imgClassName} width={width} height={height} loading="lazy" />
    </picture>
  );
};

export default Picture;
