import { db } from "../db";
import { workItemFiles } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const MAX_EXTRACT_CHARS = 80_000;
const TEXT_EXTS = new Set([".txt", ".log", ".json", ".har", ".md", ".csv", ".xml", ".html"]);
const TEXT_MIMES = ["text/", "application/json", "application/har+json", "application/xml"];
const PDF_EXTS = new Set([".pdf"]);
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"]);
const IMAGE_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp"];

function getExtension(filename: string): string {
  return "." + (filename.split(".").pop()?.toLowerCase() || "");
}

function isTextExtractable(filename: string, mimeType: string | null): boolean {
  const ext = getExtension(filename);
  if (TEXT_EXTS.has(ext)) return true;
  if (!mimeType) return false;
  return TEXT_MIMES.some((m) => mimeType.startsWith(m));
}

function isPDF(filename: string, mimeType: string | null): boolean {
  const ext = getExtension(filename);
  if (PDF_EXTS.has(ext)) return true;
  return mimeType === "application/pdf";
}

function isImage(filename: string, mimeType: string | null): boolean {
  const ext = getExtension(filename);
  if (IMAGE_EXTS.has(ext)) return true;
  if (!mimeType) return false;
  return IMAGE_MIMES.some((m) => mimeType.startsWith(m));
}

function truncate(s: string, maxChars = MAX_EXTRACT_CHARS): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n\n/* TRUNCATED_AT_${maxChars}_CHARS */\n`;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err: any) {
    return `[PDF extraction error: ${err?.message || "unknown"}]`;
  }
}

async function extractTextFromImage(imageUrl: string, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return "[Image OCR skipped: OPENAI_API_KEY not configured]";
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text visible in this image. Include error messages, console output, network request details, code snippets, UI labels, and any other readable text. Format it clearly with appropriate line breaks. If this is a screenshot of developer tools, network tab, or console, capture the exact details shown.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const extractedText = response.choices[0]?.message?.content || "";
    return extractedText || "[No text found in image]";
  } catch (err: any) {
    return `[Image OCR error: ${err?.message || "unknown"}]`;
  }
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

    try {
      const response = await fetch(file.s3Url);
      if (!response.ok) {
        lines.push(`NOTE: Could not fetch file (HTTP ${response.status})`);
        continue;
      }

      if (isTextExtractable(file.filename, file.mimeType)) {
        const text = await response.text();
        const truncatedText = truncate(text);
        lines.push("BEGIN_EXTRACTED_TEXT");
        lines.push(truncatedText);
        lines.push("END_EXTRACTED_TEXT");
      } else if (isPDF(file.filename, file.mimeType)) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const pdfText = await extractTextFromPDF(buffer);
        const truncatedText = truncate(pdfText);
        lines.push("BEGIN_EXTRACTED_TEXT (PDF)");
        lines.push(truncatedText);
        lines.push("END_EXTRACTED_TEXT");
      } else if (isImage(file.filename, file.mimeType)) {
        const imageText = await extractTextFromImage(file.s3Url, file.mimeType || "image/png");
        const truncatedText = truncate(imageText);
        lines.push("BEGIN_EXTRACTED_TEXT (Image OCR via Vision)");
        lines.push(truncatedText);
        lines.push("END_EXTRACTED_TEXT");
      } else {
        lines.push("NOTE: Unsupported file type for text extraction.");
      }
    } catch (err: any) {
      lines.push(`NOTE: Error extracting text: ${err?.message || "unknown error"}`);
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
