import { useState, useRef, useEffect, useMemo, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Upload, RefreshCw, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

type LifestyleHeroReference = {
  id: number;
  workItemId: number;
  shotId: string;
  filename: string;
  s3Key: string;
  s3Url: string;
  uploadedAt: string;
};

type InstructionState = {
  value: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
};

type LifestyleHeroVersion = {
  id: number;
  workItemId: number;
  shotId: string;
  versionNumber: number;
  masterS3Key: string;
  desktopS3Key: string;
  tabletS3Key: string;
  mobileS3Key: string;
  promptUsed: string;
  isActive: boolean;
  generatedAt: string;
};

interface LifestyleHeroPreviewProps {
  workItemId: number;
}

const ASSET_BASE_URL = "/img/";

// Custom debounced callback hook with stable ref
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useMemo(() => {
    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    };
    
    return debouncedFn as T;
  }, [delay]);
}

// Version Selector Sub-component
function VersionSelector({ 
  workItemId, 
  shotId,
  selectedVersionId,
  onSelectVersion,
}: { 
  workItemId: number; 
  shotId: string;
  selectedVersionId?: number;
  onSelectVersion: (versionId: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Always fetch versions to show count
  const { data: versionsData, isLoading, error, isError, refetch } = useQuery<{ ok: boolean; versions: LifestyleHeroVersion[] }>({
    queryKey: ['/api/work-items', workItemId, 'lifestyle-hero-versions', shotId],
    refetchInterval: 30000,
  });

  const versions = versionsData?.versions || [];
  const activeVersion = versions.find(v => v.isActive);

  // Mutation to set active version
  const setActiveMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      return await apiRequest("POST", `/api/work-items/${workItemId}/lifestyle-hero-versions/${shotId}/set-active`, {
        versionNumber,
      });
    },
    onSuccess: (_data, versionNumber) => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-items', workItemId, 'lifestyle-hero-versions', shotId] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-items/${workItemId}/packs`] });
      toast({
        title: "Version activated",
        description: `Version ${versionNumber} is now active for this shot`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to set active version",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Handle error state
  if (isError && isOpen) {
    return (
      <div className="mb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 px-2 text-xs"
          data-testid={`button-toggle-versions-${shotId}`}
        >
          {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          Versions
        </Button>
        {isOpen && (
          <div className="mt-1 space-y-1 px-2">
            <div className="text-xs text-destructive">
              Failed to load versions: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="h-6 px-2 text-xs"
              data-testid={`button-retry-versions-${shotId}`}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Handle empty state
  if (versions.length === 0 && !isLoading && !isError && isOpen) {
    return (
      <div className="mb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 px-2 text-xs"
          data-testid={`button-toggle-versions-${shotId}`}
        >
          {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          Versions (0)
        </Button>
        {isOpen && (
          <div className="mt-1 text-xs text-muted-foreground px-2">
            No versions available yet. Generate images to create versions.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 px-2 text-xs"
        data-testid={`button-toggle-versions-${shotId}`}
      >
        {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
        Versions ({versions.length})
      </Button>

      {isOpen && (
        <div className="mt-1 space-y-2 border-l-2 border-border pl-2 ml-2">
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading versions...</div>
          ) : (
            versions.map((version) => {
              const isSelected = selectedVersionId === version.id;
              
              return (
                <div
                  key={version.id}
                  className="flex gap-2"
                  data-testid={`version-item-${shotId}-${version.versionNumber}`}
                >
                  {/* Thumbnail preview - clickable to preview version */}
                  <div 
                    className={`flex-shrink-0 cursor-pointer rounded transition-all ${
                      isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/50"
                    }`}
                    onClick={() => onSelectVersion(version.id)}
                    title={`Preview version ${version.versionNumber}`}
                  >
                    <img
                      src={`${ASSET_BASE_URL}${version.desktopS3Key}`}
                      alt={`Version ${version.versionNumber}`}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                
                {/* Version info and actions */}
                <div className="flex flex-col flex-1 min-w-0 justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={version.isActive ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                      v{version.versionNumber}
                    </Badge>
                    {version.isActive && (
                      <span className="flex items-center gap-1 text-[10px] text-primary">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(version.generatedAt).toLocaleDateString()} {new Date(version.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!version.isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveMutation.mutate(version.versionNumber)}
                      disabled={setActiveMutation.isPending}
                      className="h-6 px-2 text-[10px] mt-1"
                      data-testid={`button-set-active-${shotId}-${version.versionNumber}`}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function LifestyleHeroPreview({ workItemId }: LifestyleHeroPreviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  const [isUploadingRef, setIsUploadingRef] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [instructionsState, setInstructionsState] = useState<Record<string, InstructionState>>({});
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  // Fetch packs
  const { data: packs = [], isLoading } = useQuery<WorkItemPack[]>({
    queryKey: [`/api/work-items/${workItemId}/packs`],
    refetchInterval: 30000,
  });

  // Fetch references
  const { data: referencesData } = useQuery<{ ok: boolean; references: LifestyleHeroReference[] }>({
    queryKey: [`/api/work-items/${workItemId}/lifestyle-hero-references`],
    refetchInterval: 30000,
  });

  const references = referencesData?.references || [];

  // Fetch instructions
  const { data: instructionsData } = useQuery<{ ok: boolean; instructions: Record<string, string | null> }>({
    queryKey: ['/api/work-items', workItemId, 'lifestyle-hero-instructions'],
    refetchInterval: 30000,
  });

  const backendInstructions = instructionsData?.instructions || {};

  // Initialize state from backend data
  useEffect(() => {
    if (!instructionsData) return;
    
    setInstructionsState(prev => {
      const updated: Record<string, InstructionState> = {};
      for (const [shotId, value] of Object.entries(backendInstructions)) {
        // Only initialize if we don't already have state for this shot
        if (!prev[shotId]) {
          updated[shotId] = {
            value: value || "",
            isSaving: false,
            lastSavedAt: null,
            error: null,
          };
        } else {
          updated[shotId] = prev[shotId];
        }
      }
      return { ...prev, ...updated };
    });
  }, [instructionsData]);

  // Group references by shotId
  const refsByShot: Record<string, LifestyleHeroReference[]> = {};
  for (const ref of references) {
    if (!refsByShot[ref.shotId]) {
      refsByShot[ref.shotId] = [];
    }
    refsByShot[ref.shotId].push(ref);
  }

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ shotId, files }: { shotId: string; files: FileList }) => {
      const formData = new FormData();
      formData.append("shotId", shotId);
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(`/api/work-items/${workItemId}/lifestyle-hero-references`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reference images saved",
        description: `Saved ${data.references.length} reference image(s) for ${data.shotId}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/work-items/${workItemId}/lifestyle-hero-references`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't save reference images",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Regenerate mutation
  const regenerateMutation = useMutation({
    mutationFn: async (shotId: string) => {
      const res = await fetch(`/api/work-items/${workItemId}/generate-lifestyle-heroes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotIds: [shotId],
          dryRun: false,
          overwrite: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Regeneration failed");
      }

      return await res.json();
    },
    onSuccess: (data, shotId) => {
      toast({
        title: "Lifestyle heroes regenerated",
        description: `Regenerated lifestyle heroes for ${shotId}. Images will update shortly.`,
      });
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [`/api/work-items/${workItemId}/packs`] });
      queryClient.invalidateQueries({ queryKey: [`/api/work-items/${workItemId}/lifestyle-hero-references`] });
      // Invalidate versions query so new version appears immediately
      queryClient.invalidateQueries({ queryKey: ['/api/work-items', workItemId, 'lifestyle-hero-versions', shotId] });
    },
    onError: (error: Error, shotId) => {
      toast({
        title: "Couldn't regenerate shot",
        description: `Something went wrong while regenerating ${shotId}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Save instructions mutation
  const saveInstructionsMutation = useMutation({
    mutationFn: async ({ shotId, instructions }: { shotId: string; instructions: string }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/work-items/${workItemId}/lifestyle-hero-instructions/${shotId}`,
        { instructions }
      );
      return await response.json();
    },
    onMutate: async ({ shotId, instructions }) => {
      // Optimistically update local state with defensive initialization
      setInstructionsState(prev => ({
        ...prev,
        [shotId]: {
          value: prev[shotId]?.value || instructions,
          isSaving: true,
          lastSavedAt: prev[shotId]?.lastSavedAt || null,
          error: null,
        },
      }));
    },
    onSuccess: (data, { shotId }) => {
      // Update state to reflect saved
      setInstructionsState(prev => ({
        ...prev,
        [shotId]: {
          value: prev[shotId]?.value || "",
          isSaving: false,
          lastSavedAt: new Date(),
          error: null,
        },
      }));
      // Update cache with defensive guard
      queryClient.setQueryData(
        ['/api/work-items', workItemId, 'lifestyle-hero-instructions'],
        (old: any) => {
          if (!old) {
            return {
              ok: true,
              instructions: { [shotId]: data.instructions },
            };
          }
          return {
            ...old,
            instructions: {
              ...old.instructions,
              [shotId]: data.instructions,
            },
          };
        }
      );
    },
    onError: (error: Error, { shotId }) => {
      setInstructionsState(prev => ({
        ...prev,
        [shotId]: {
          value: prev[shotId]?.value || "",
          isSaving: false,
          lastSavedAt: prev[shotId]?.lastSavedAt || null,
          error: error.message,
        },
      }));
    },
  });

  // Debounced save handler
  const debouncedSave = useDebouncedCallback(
    (shotId: string, value: string) => {
      saveInstructionsMutation.mutate({ shotId, instructions: value });
    },
    750
  );

  const handleInstructionsChange = (shotId: string, value: string) => {
    // Update local state immediately with defensive initialization
    setInstructionsState(prev => ({
      ...prev,
      [shotId]: {
        value,
        isSaving: false,
        lastSavedAt: prev[shotId]?.lastSavedAt || null,
        error: null,
      },
    }));
    
    // Trigger debounced save
    debouncedSave(shotId, value);
  };

  const handleClickUploadRef = (shotId: string) => {
    const input = fileInputRefs.current[shotId];
    if (input) input.click();
  };

  const handleUploadRefChange = async (
    e: ChangeEvent<HTMLInputElement>,
    shotId: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingRef(shotId);
    try {
      await uploadMutation.mutateAsync({ shotId, files });
    } finally {
      setIsUploadingRef(null);
      // Reset value so selecting the same file again still fires change
      if (e.target) e.target.value = "";
    }
  };

  const handleRegenerateShot = async (shotId: string) => {
    setIsRegenerating(shotId);
    try {
      await regenerateMutation.mutateAsync(shotId);
    } finally {
      setIsRegenerating(null);
    }
  };

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
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
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
          const refs = refsByShot[shotId] || [];
          const isShotRegenerating = isRegenerating === shotId;
          const isShotUploading = isUploadingRef === shotId;

          return (
            <ShotPreviewCard
              key={shotId}
              workItemId={workItemId}
              shotId={shotId}
              sku={sku}
              row={row}
              refs={refs}
              isShotRegenerating={isShotRegenerating}
              isShotUploading={isShotUploading}
              selectedVersionId={selectedVersionIds[shotId]}
              onSelectVersion={(versionId) => setSelectedVersionIds(prev => ({ ...prev, [shotId]: versionId }))}
              instructionsState={instructionsState[shotId]}
              onInstructionsChange={(value) => handleInstructionsChange(shotId, value)}
              onClickUploadRef={() => handleClickUploadRef(shotId)}
              onUploadRefChange={(e) => handleUploadRefChange(e, shotId)}
              onRegenerateShot={() => handleRegenerateShot(shotId)}
              fileInputRef={(el) => { fileInputRefs.current[shotId] = el; }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Shot Preview Card Component with Version Preview
function ShotPreviewCard({
  workItemId,
  shotId,
  sku,
  row,
  refs,
  isShotRegenerating,
  isShotUploading,
  selectedVersionId,
  onSelectVersion,
  instructionsState,
  onInstructionsChange,
  onClickUploadRef,
  onUploadRefChange,
  onRegenerateShot,
  fileInputRef,
}: {
  workItemId: number;
  shotId: string;
  sku: string;
  row: ExportPlanRow;
  refs: LifestyleHeroReference[];
  isShotRegenerating: boolean;
  isShotUploading: boolean;
  selectedVersionId?: number;
  onSelectVersion: (versionId: number) => void;
  instructionsState?: InstructionState;
  onInstructionsChange: (value: string) => void;
  onClickUploadRef: () => void;
  onUploadRefChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRegenerateShot: () => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
}) {
  // Fetch versions for this shot
  const { data: versionsData } = useQuery<{ ok: boolean; versions: LifestyleHeroVersion[] }>({
    queryKey: ['/api/work-items', workItemId, 'lifestyle-hero-versions', shotId],
    refetchInterval: 30000,
  });

  const versions = versionsData?.versions || [];
  const activeVersion = versions.find((v) => v.isActive) ?? versions[0];
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? activeVersion;

  // Use selected version's desktop key for main preview, or fallback to row filename
  const mainPreviewSrc = selectedVersion 
    ? `${ASSET_BASE_URL}${selectedVersion.desktopS3Key}`
    : `${ASSET_BASE_URL}${row.filename}`;

  return (
    <div
      className="rounded-lg border border-border bg-background p-3"
      data-testid={`lifestyle-preview-${shotId}`}
    >
      <div className="mb-2 overflow-hidden rounded-md bg-muted">
        <img
          src={mainPreviewSrc}
          alt={`${shotId} hero preview`}
          className="block h-32 w-full object-cover transition-transform hover:scale-105"
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
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>{row.size_label}</span>
        <span>
          {row.width}×{row.height}
        </span>
      </div>

      {/* Reference thumbnails, if any */}
      {refs.length > 0 && (
        <div className="mb-2 flex gap-1 flex-wrap">
          {refs.slice(0, 3).map((r) => (
            <img
              key={r.id}
              src={r.s3Url}
              alt={`${shotId} ref`}
              className="h-8 w-8 rounded object-cover border border-border"
            />
          ))}
          {refs.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{refs.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Version Selector */}
      <VersionSelector 
        workItemId={workItemId} 
        shotId={shotId}
        selectedVersionId={selectedVersionId}
        onSelectVersion={onSelectVersion}
      />

      {/* Regeneration instructions */}
      <div className="mb-2">
        <Textarea
          placeholder="Add regeneration instructions (e.g., Make background darker, Add more plants...)"
          value={instructionsState?.value || ""}
          onChange={(e) => onInstructionsChange(e.target.value)}
          className="min-h-[60px] text-xs resize-none"
          data-testid={`textarea-instructions-${shotId}`}
        />
        {instructionsState && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {instructionsState.isSaving && "Saving…"}
              {!instructionsState.isSaving && instructionsState.lastSavedAt && (
                `Saved ${Math.round((Date.now() - instructionsState.lastSavedAt.getTime()) / 1000)}s ago`
              )}
              {instructionsState.error && (
                <span className="text-destructive">
                  Error: {instructionsState.error}
                </span>
              )}
            </span>
            {instructionsState.error && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onInstructionsChange(instructionsState.value)}
                className="h-5 text-[10px] px-2"
                data-testid={`button-retry-save-${shotId}`}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Hidden file input for this shot */}
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={onUploadRefChange}
          data-testid={`input-upload-ref-${shotId}`}
        />

        <Button
          size="sm"
          variant="outline"
          onClick={onClickUploadRef}
          disabled={isShotUploading || isShotRegenerating}
          title="Upload one or more reference images for this shot."
          data-testid={`button-upload-ref-${shotId}`}
        >
          <Upload className="h-3 w-3 mr-1" />
          {isShotUploading ? "Uploading…" : "Upload ref"}
        </Button>

        <Button
          size="sm"
          onClick={onRegenerateShot}
          disabled={isShotRegenerating || isShotUploading}
          title="Regenerate Desktop, Tablet, and Mobile heroes for this shot."
          data-testid={`button-regenerate-${shotId}`}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isShotRegenerating ? 'animate-spin' : ''}`} />
          {isShotRegenerating ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}
