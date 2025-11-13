import { google } from "googleapis";

export type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
};

export type DriveSearchResult = { items: DriveFile[]; nextPageToken?: string | null };
export type UploadInput =
  | { buffer: ArrayBuffer | Buffer; fileName: string; mimeType?: string }
  | { text: string; fileName: string; mimeType?: string };

export interface GoogleDriveClient {
  search(folderId: string, q: string, limit?: number, pageToken?: string | null): Promise<DriveSearchResult>;
  upload(folderId: string, file: UploadInput): Promise<DriveFile>;
  copyOrMove(fileId: string, targetFolderId: string, mode?: "copy" | "move"): Promise<DriveFile>;
  listFilesInFolder(folderId: string, limit?: number, pageToken?: string | null): Promise<DriveSearchResult>;
  fetchFileText(fileId: string): Promise<string>;
}

function getAuth() {
  const email = process.env.GDRIVE_SA_EMAIL as string;
  let key = process.env.GDRIVE_SA_PRIVATE_KEY as string;
  if (!email || !key) throw new Error("Missing GDRIVE_SA_EMAIL or GDRIVE_SA_PRIVATE_KEY");
  key = key.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

export class RealDriveClient implements GoogleDriveClient {
  private drive;
  constructor() {
    const auth = getAuth();
    this.drive = google.drive({ version: "v3", auth });
  }

  async search(folderId: string, q: string, limit = 20, pageToken?: string | null): Promise<DriveSearchResult> {
    const query = `name contains '${q.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
    const r = await this.drive.files.list({
      q: query,
      pageSize: limit,
      pageToken: pageToken || undefined,
      fields: "files(id,name,mimeType,webViewLink,createdTime,modifiedTime,parents),nextPageToken"
    });
    return { items: (r.data.files || []) as DriveFile[], nextPageToken: r.data.nextPageToken ?? null };
  }

  async upload(folderId: string, file: UploadInput): Promise<DriveFile> {
    const name = "fileName" in file ? file.fileName : "untitled.txt";
    const mimeType = ("mimeType" in file && file.mimeType) || "text/plain";
    const media = "buffer" in file ? { mimeType, body: file.buffer as any } : { mimeType, body: Buffer.from(file.text, "utf8") };
    const r = await this.drive.files.create({
      requestBody: { name, parents: [folderId] },
      media,
      fields: "id,name,mimeType,webViewLink,createdTime,modifiedTime,parents",
    });
    return r.data as DriveFile;
  }

  async copyOrMove(fileId: string, targetFolderId: string, mode: "copy" | "move" = "copy"): Promise<DriveFile> {
    if (mode === "copy") {
      const r = await this.drive.files.copy({
        fileId,
        requestBody: { parents: [targetFolderId] },
        fields: "id,name,mimeType,webViewLink,createdTime,modifiedTime,parents",
      });
      return r.data as DriveFile;
    }
    // MOVE: remove from previous parents, add to target
    const meta = await this.drive.files.get({ fileId, fields: "parents,name" });
    const prevParents = (meta.data.parents || []).join(",");
    const r = await this.drive.files.update({
      fileId,
      addParents: targetFolderId,
      removeParents: prevParents || undefined,
      fields: "id,name,mimeType,webViewLink,createdTime,modifiedTime,parents",
    });
    return r.data as DriveFile;
  }

  async listFilesInFolder(folderId: string, limit = 100, pageToken?: string | null): Promise<DriveSearchResult> {
    const query = `'${folderId}' in parents and trashed = false`;
    const r = await this.drive.files.list({
      q: query,
      pageSize: limit,
      pageToken: pageToken || undefined,
      fields: "files(id,name,mimeType,webViewLink,createdTime,modifiedTime,parents),nextPageToken",
      orderBy: "modifiedTime desc",
    });
    return { items: (r.data.files || []) as DriveFile[], nextPageToken: r.data.nextPageToken ?? null };
  }

  async fetchFileText(fileId: string): Promise<string> {
    const r = await this.drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "text" }
    );
    return r.data as string;
  }
}

let cached: GoogleDriveClient | null = null;
export function getDriveClient(): GoogleDriveClient {
  if (!cached) cached = new RealDriveClient();
  return cached;
}
