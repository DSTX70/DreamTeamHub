import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

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
  contextLabel,
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

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onConfirm({
        reviewerToken: token.trim(),
        approver: { name: name.trim(), email: email.trim() || undefined },
        note: note.trim() || undefined
      });
      // Reset form
      setToken("");
      setName("");
      setEmail("");
      setNote("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>Promote to Publish</DialogTitle>
              <DialogDescription className="mt-2">
                Confirm publishing for <strong>{fileId}</strong>
                {contextLabel && <> in <strong>{contextLabel}</strong></>}. Two reviewers required.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer-token">Reviewer token (min 12 chars)</Label>
            <Input
              id="reviewer-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="••••••••••••"
              data-testid="input-reviewer-token"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="approver-name">Second approver name</Label>
              <Input
                id="approver-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Reviewer"
                data-testid="input-approver-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approver-email">Second approver email (optional)</Label>
              <Input
                id="approver-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                data-testid="input-approver-email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publish-note">Note (optional)</Label>
            <Textarea
              id="publish-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Context or ticket link"
              data-testid="input-publish-note"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy} data-testid="button-cancel-publish">
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ok || busy} data-testid="button-confirm-publish">
            {busy ? "Publishing…" : "Confirm publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
