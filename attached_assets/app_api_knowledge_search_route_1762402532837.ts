// app/api/knowledge/[owner]/[id]/search/route.ts
import { NextRequest } from "next/server";
import { json } from "@/lib/next/response";
import { getDriveClient } from "@/lib/drive/googleDrive_real";
import { resolveFolders } from "@/lib/knowledge/resolveFolders";
import { SearchQuery } from "@/lib/validators/knowledge";

export async function GET(req: NextRequest, ctx: { params: { owner: string; id: string } }) {
  const owner = ctx.params.owner.toUpperCase() as "BU"|"BRAND"|"PRODUCT";
  const id = ctx.params.id;
  const q = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = SearchQuery.safeParse({ q: q.q, limit: q.limit });
  if (!parsed.success) return json({ error: parsed.error.errors.map(e=>e.message).join("; ") }, 422);

  const { read } = await resolveFolders(owner, id);
  if (!read) return json({ error: "KB read folder not linked" }, 404);

  const out = await getDriveClient().search(read, parsed.data.q, parsed.data.limit ?? 20);
  return json(out);
}
