import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";

type ExportPlanRow = {
  sku: string;
  width: number;
  height: number;
  format: string;
  shot_id: string;
  base_key: string;
  filename: string;
  size_label: string;
  is_primary?: boolean;
  card_title?: string;
};

type LifestylePackData = {
  export_plan?: ExportPlanRow[];
  shot_boards?: any[];
};

type WorkItemPack = {
  id: number;
  workItemId: number;
  packType: string;
  version: number;
  packData: LifestylePackData;
  createdAt: string;
};

interface LifestyleHeroPreviewProps {
  workItemId: number;
}

const ASSET_BASE_URL = "/img/";

export function LifestyleHeroPreview({ workItemId }: LifestyleHeroPreviewProps) {
  const { data: packs = [], isLoading } = useQuery<WorkItemPack[]>({
    queryKey: [`/api/work-items/${workItemId}/packs`],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return null;
  }

  const lifestylePack = packs.find((p) => p.packType === "lifestyle");

  if (!lifestylePack || !lifestylePack.packData?.export_plan) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Lifestyle Hero Preview</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Run <span className="font-mono">Lifestyle Pack v2</span> and click{" "}
          <span className="font-mono">Generate Lifestyle Hero Images</span> to
          see hero previews here.
        </p>
      </div>
    );
  }

  const exportPlan = lifestylePack.packData.export_plan;

  const byShot = new Map<string, ExportPlanRow[]>();
  for (const row of exportPlan) {
    if (!byShot.has(row.shot_id)) byShot.set(row.shot_id, []);
    byShot.get(row.shot_id)!.push(row);
  }

  const previews = Array.from(byShot.entries()).map(([shotId, rows]) => {
    const desktop = rows.find((r) => r.size_label === "Desktop") ?? rows[0];
    return {
      shotId,
      sku: desktop.sku,
      row: desktop,
    };
  });

  if (previews.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Lifestyle Hero Preview</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No export_plan rows found for this Lifestyle Pack.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Lifestyle Hero Preview</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Desktop crops (1920×800) from Lifestyle Pack v{lifestylePack.version}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {previews.map(({ shotId, sku, row }) => {
          const src = `${ASSET_BASE_URL}${row.filename}`;
          return (
            <div
              key={shotId}
              className="rounded-lg border border-border bg-background p-3 hover-elevate"
              data-testid={`lifestyle-preview-${shotId}`}
            >
              <div className="mb-2 overflow-hidden rounded-md bg-muted">
                <img
                  src={src}
                  alt={`${shotId} hero preview`}
                  className="block h-32 w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const placeholder = document.createElement("div");
                      placeholder.className = "flex h-32 items-center justify-center text-xs text-muted-foreground";
                      placeholder.textContent = "Image not found";
                      parent.appendChild(placeholder);
                    }
                  }}
                  data-testid={`lifestyle-preview-img-${shotId}`}
                />
              </div>
              <div className="mb-1 font-mono text-xs text-muted-foreground">
                {shotId} · {sku}
              </div>
              {row.card_title && (
                <div className="mb-1 text-xs font-medium line-clamp-1">
                  {row.card_title}
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{row.size_label}</span>
                <span>
                  {row.width}×{row.height}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
