// hooks/usePublishDialog.tsx
import { useCallback, useState } from "react";

export type PublishConfirm = {
  reviewerToken: string;
  approver?: { name: string; email?: string };
  note?: string;
};

export function usePublishDialog({ owner, ownerId }: { owner: "BU"|"BRAND"|"PRODUCT"; ownerId: string }) {
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = useCallback((id: string) => { setFileId(id); setOpen(true); }, []);
  const close = useCallback(() => setOpen(false), []);

  const confirm = useCallback(async ({ reviewerToken, approver, note }: PublishConfirm) => {
    if (!fileId) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/knowledge/${owner}/${ownerId}/publish/${fileId}`, {
        method: "POST",
        headers: {
          "x-reviewer-token": reviewerToken,
          "idempotency-key": crypto.randomUUID(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ approver, note }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      // optional: handle response headers like X-Request-Id, X-Idempotency-Key
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, [fileId, owner, ownerId]);

  return { open, fileId, busy, start, close, confirm };
}
