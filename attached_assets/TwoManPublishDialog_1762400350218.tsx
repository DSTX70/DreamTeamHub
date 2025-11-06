// components/TwoManPublishDialog.tsx
import React, { useMemo, useState } from "react";

/**
 * Two-man publish dialog
 * - Collects reviewer token (>= 12 chars) and second approver (name/email)
 * - Calls onConfirm({ reviewerToken, approver, note }) on success
 */
export type PublishConfirm = {
  reviewerToken: string;
  approver: { name: string; email?: string };
  note?: string;
};

export default function TwoManPublishDialog({
  open,
  onClose,
  onConfirm,
  fileId,
  contextLabel, // e.g., "IMAGINATION / OUAS"
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (p: PublishConfirm) => Promise<void> | void;
  fileId: string;
  contextLabel?: string;
}) {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = useMemo(() => token.trim().length >= 12 && name.trim().length >= 2, [token, name]);

  if (!open) return null;

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onConfirm({ reviewerToken: token.trim(), approver: { name: name.trim(), email: email.trim() || undefined }, note: note.trim() || undefined });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Promote to Publish</h3>
            <p className="text-sm text-gray-600 mt-1">
              Confirm publishing for <b>{fileId}</b>{contextLabel ? <> in <b>{contextLabel}</b></> : null}. Two reviewers required.
            </p>
          </div>
          <button className="px-2 py-1 border rounded" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-4">
          <div>
            <label className="text-sm block mb-1">Reviewer token (min 12 chars)</label>
            <input className="border rounded px-2 py-1 w-full" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="••••••••••••" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm block mb-1">Second approver name</label>
              <input className="border rounded px-2 py-1 w-full" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jane Reviewer" />
            </div>
            <div>
              <label className="text-sm block mb-1">Second approver email (optional)</label>
              <input className="border rounded px-2 py-1 w-full" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">Note (optional)</label>
            <textarea className="border rounded px-2 py-1 w-full" rows={2} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Context or ticket link" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="px-3 py-1 border rounded bg-black text-white disabled:opacity-50" onClick={submit} disabled={!ok || busy}>
            {busy ? "Publishing…" : "Confirm publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
