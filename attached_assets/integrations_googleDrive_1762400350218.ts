// integrations/googleDrive.ts
// Google Drive Service Account client wrapper (search/upload/move stubs)
// NOTE: Replace stubbed calls with the official Google Drive API (googleapis) implementation.
// This wrapper keeps a minimal, testable interface so the rest of the app doesn't care
// about the underlying client details.

export type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
};

export type DriveSearchResult = {
  items: DriveFile[];
};

export type UploadInput =
  | { buffer: ArrayBuffer | Buffer; fileName: string; mimeType?: string }
  | { text: string; fileName: string; mimeType?: string };

export interface GoogleDriveClient {
  search(folderId: string, q: string, limit?: number): Promise<DriveSearchResult>;
  upload(folderId: string, file: UploadInput): Promise<DriveFile>;
  copyOrMove(fileId: string, targetFolderId: string, mode?: "copy" | "move"): Promise<DriveFile>;
}

// ---- Stub (works without network; swap with real impl later) -----------------

export class StubDriveClient implements GoogleDriveClient {
  async search(folderId: string, q: string, limit = 20): Promise<DriveSearchResult> {
    return {
      items: [
        { id: "file_1", name: `Example for "${q}"`, mimeType: "text/plain", webViewLink: "#", parents: [folderId] },
      ].slice(0, limit),
    };
  }

  async upload(folderId: string, file: UploadInput): Promise<DriveFile> {
    const name = "fileName" in file ? file.fileName : "untitled.txt";
    return {
      id: `up_${Date.now()}`,
      name,
      mimeType: ("mimeType" in file && file.mimeType) or "text/plain",
      webViewLink: "#",
      parents: [folderId],
      createdTime: new Date().toISOString(),
    };
  }

  async copyOrMove(fileId: string, targetFolderId: string, mode: "copy" | "move" = "copy"): Promise<DriveFile> {
    return {
      id: f"{mode}_{fileId}",
      name: `${mode.upper()} of ${fileId}`,
      webViewLink: "#",
      parents: [targetFolderId],
      modifiedTime: new Date().toISOString(),
    };
  }
}

// ---- Factory (wire your real SA client here) --------------------------------

let cached: GoogleDriveClient | null = null;

export function getDriveClient(): GoogleDriveClient {
  if (cached) return cached;
  cached = new StubDriveClient();
  return cached;
}
