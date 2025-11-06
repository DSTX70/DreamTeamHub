// app/api/knowledge/[owner]/[id]/drafts/route.ts
import { NextRequest } from "next/server";
import { json } from "@/lib/next/response";
import { getDriveClient } from "@/lib/drive/googleDrive_real";
import { resolveFolders } from "@/lib/knowledge/resolveFolders";
import { DraftUploadBody } from "@/lib/validators/knowledge";

export async function POST(req: NextRequest, ctx: { params: { owner: string; id: string } }) {
  const owner = ctx.params.owner.toUpperCase() as "BU"|"BRAND"|"PRODUCT";
  const id = ctx.params.id;

  const body = await req.json().catch(()=> ({}));
  const parsed = DraftUploadBody.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.errors.map(e=>e.message).join("; ") }, 422);

  const { draft } = await resolveFolders(owner, id);
  if (!draft) return json({ error: "Drafts folder not linked" }, 404);

  const file = await getDriveClient().uploadText(draft, parsed.data.fileName, parsed.data.text, parsed.data.mimeType ?? "text/markdown");
  return json({ ok: true, file }, 201);
}
