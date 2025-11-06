// components/KnowledgeCardUsageExample.tsx
import React, { useState } from "react";
import TwoManPublishDialog from "@/components/TwoManPublishDialog";
import { usePublishDialog } from "@/hooks/usePublishDialog";

export default function KnowledgeCardUsageExample({ owner, ownerId, files, contextLabel }:{
  owner: "BU"|"BRAND"|"PRODUCT"; ownerId: string;
  files: Array<{ id:string; name:string }>; contextLabel?: string;
}) {
  const { open, fileId, busy, start, close, confirm } = usePublishDialog({ owner, ownerId });

  return (
    <div className="rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Knowledge</h3>
      <ul className="mt-2 divide-y">
        {files.map(f => (
          <li key={f.id} className="py-2 flex items-center justify-between">
            <span>{f.name}</span>
            <button className="px-2 py-1 border rounded" onClick={()=>start(f.id)}>
              Promote to Publish
            </button>
          </li>
        ))}
      </ul>

      <TwoManPublishDialog
        open={open}
        onClose={close}
        fileId={fileId || ""}
        contextLabel={contextLabel}
        onConfirm={confirm}
      />
    </div>
  );
}
