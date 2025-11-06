import React from "react";
import StatusBadge from "./components/StatusBadge";

type Status = {
  bucket: string;
  region: string;
  defaultCacheControl: string;
  hasBucketEnv: boolean;
  probeOk: boolean;
};

// NOTE: This file should replace the previously shipped ImagesAdmin.tsx to add a header status row.
// The rest of the page (allowlist + uploader + variants) from your existing file remains unchanged.
// For brevity, we're showing only the header + status fetch and a placeholder where your existing content should render.

const ImagesAdmin: React.FC = () => {
  const [status, setStatus] = React.useState<Status | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ops/images/status");
        const j = await r.json();
        setStatus(j);
      } catch {
        setStatus(null);
      }
    })();
  }, []);

  const s3State: "ok"|"warn"|"err" =
    status ? (status.hasBucketEnv ? (status.probeOk ? "ok" : "warn") : "err") : "warn";
  const ccState: "ok"|"warn"|"err" =
    status ? (status.defaultCacheControl ? "ok" : "warn") : "warn";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Responsive Images — Allowlist & Upload</h1>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={status ? \`S3: \${status.bucket || "(unset)"}\` : "S3: (loading)"}
            state={s3State}
          />
          <StatusBadge
            label={status ? \`Cache-Control: \${status.defaultCacheControl || "(unset)"}\` : "Cache-Control: (loading)"}
            state={ccState}
          />
          <a className="text-xs underline text-gray-600" href="/ops/settings">Settings</a>
        </div>
      </div>

      {/* --- Keep your existing ImagesAdmin content below --- */}
      <div className="border rounded p-3">
        <div className="text-sm text-gray-600">
          Your existing allowlist editor, uploader, and variants table remain here (unchanged).
        </div>
      </div>
    </div>
  );
};

export default ImagesAdmin;
