export type UploadedVariant = { key: string; width?: number; ext?: string; size: number };
export type UploadResult = {
  baseKey: string;
  original: { filename: string; sha256: string };
  uploaded: UploadedVariant[];
  totalBytes: number;
};
