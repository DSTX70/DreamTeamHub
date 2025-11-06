import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Hit = {
  type: string;
  id: string;
  title: string;
  path?: string[];
  extras?: Record<string, any>;
};

type Action = {
  id: string;
  label: string;
  run: () => void;
};

type CmdKProps = {
  open: boolean;
  onClose: () => void;
  scope?: {
    owner: "GLOBAL" | "BU" | "BRAND" | "PRODUCT";
    ownerId?: string;
  };
};

export default function CmdK({ open, onClose, scope }: CmdKProps) {
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  const actions: Action[] = useMemo(
    () =>
      [
        {
          id: "new-wo",
          label: "+ New Work Order",
          run: () => {
            setLocation("/work-orders");
          },
        },
        {
          id: "open-copilot",
          label: "Open Copilot",
          run: () => {
            setLocation("/copilot");
          },
        },
        {
          id: "new-idea",
          label: "+ Capture Idea Spark",
          run: () => {
            setLocation("/brainstorm");
          },
        },
      ].filter(Boolean) as Action[],
    [setLocation]
  );

  useEffect(() => {
    let aborted = false;

    const fetchHits = async () => {
      if (q.trim().length < 2) {
        setHits([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=10`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        if (!aborted) {
          setHits(
            (data || []).map((x: any) => ({
              type: x.type,
              id: x.id,
              title: x.title,
              path: x.path,
              extras: x.extras,
            }))
          );
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    fetchHits();
    return () => {
      aborted = true;
    };
  }, [q]);

  const handleNavigate = (hit: Hit) => {
    const routes: Record<string, string> = {
      brand: `/bu/imagination`,
      product: `/projects`,
      project: `/projects/${hit.id}`,
      agent: `/roster-admin`,
    };
    const route = routes[hit.type] || "/";
    setLocation(route);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="cmdk-overlay"
    >
      <div
        className="mx-auto mt-24 w-full max-w-2xl rounded-lg border bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="cmdk-dialog"
      >
        <Input
          autoFocus
          className="w-full"
          placeholder="Search anything… (Cmd/Ctrl+K)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="input-search"
        />

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Searching…</span>
          </div>
        )}

        {actions.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">
              Quick actions
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    a.run();
                    onClose();
                  }}
                  data-testid={`button-action-${a.id}`}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ul className="mt-4 divide-y max-h-80 overflow-auto">
          {hits.map((h) => (
            <li
              key={`${h.type}:${h.id}`}
              className="py-3 flex items-start justify-between gap-4"
              data-testid={`result-${h.type}-${h.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{h.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {h.type}
                  </Badge>
                  {h.path && (
                    <span className="text-xs text-muted-foreground truncate">
                      {h.path.join(" › ")}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(h)}
                data-testid={`button-open-${h.type}-${h.id}`}
              >
                Open
              </Button>
            </li>
          ))}
          {!hits.length && q.trim().length >= 2 && !loading && (
            <li className="py-4 text-sm text-center text-muted-foreground">
              No results found
            </li>
          )}
        </ul>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose} data-testid="button-close">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
