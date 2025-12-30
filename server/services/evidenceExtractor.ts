import { db } from "../db";
import { workItemFiles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const MAX_EXTRACT_CHARS = 80_000;
const TEXT_EXTS = new Set([".txt", ".log", ".json", ".har", ".md", ".csv", ".xml", ".html"]);
const TEXT_MIMES = ["text/", "application/json", "application/har+json", "application/xml"];

function isTextExtractable(filename: string, mimeType: string | null): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (TEXT_EXTS.has(`.${ext}`)) return true;
  if (!mimeType) return false;
  return TEXT_MIMES.some((m) => mimeType.startsWith(m));
}

function truncate(s: string, maxChars = MAX_EXTRACT_CHARS): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n\n/* TRUNCATED_AT_${maxChars}_CHARS */\n`;
}

export async function extractEvidenceFromWorkItemFiles(workItemId: number): Promise<string> {
  const files = await db
    .select()
    .from(workItemFiles)
    .where(eq(workItemFiles.workItemId, workItemId))
    .orderBy(desc(workItemFiles.uploadedAt))
    .limit(10);

  if (!files.length) return "";

  const lines: string[] = [];
  lines.push("==== EVIDENCE (Uploaded Files) ====");

  for (const file of files) {
    lines.push(`\nEVIDENCE_FILE: ${file.filename}`);
    lines.push(`mime: ${file.mimeType || "unknown"} | size: ${file.sizeBytes} bytes`);

    if (isTextExtractable(file.filename, file.mimeType)) {
      try {
        const response = await fetch(file.s3Url);
        if (response.ok) {
          const text = await response.text();
          const truncatedText = truncate(text);
          lines.push("BEGIN_EXTRACTED_TEXT");
          lines.push(truncatedText);
          lines.push("END_EXTRACTED_TEXT");
        } else {
          lines.push(`NOTE: Could not fetch file (HTTP ${response.status})`);
        }
      } catch (err: any) {
        lines.push(`NOTE: Error extracting text: ${err?.message || "unknown error"}`);
      }
    } else {
      lines.push("NOTE: Binary/image file. If relevant, paste key details into Evidence Notes.");
    }
  }

  lines.push("\n==== END EVIDENCE ====");
  return lines.join("\n");
}

export function buildEvidencePromptBlock(params: {
  evidenceNotes?: string;
  extractedFileText?: string;
}): string {
  const { evidenceNotes, extractedFileText } = params;
  const blocks: string[] = [];

  if (evidenceNotes?.trim()) {
    blocks.push("==== EVIDENCE NOTES (User Pasted) ====");
    blocks.push(evidenceNotes.trim());
    blocks.push("==== END EVIDENCE NOTES ====");
  }

  if (extractedFileText?.trim()) {
    blocks.push(extractedFileText.trim());
  }

  return blocks.join("\n\n");
}
