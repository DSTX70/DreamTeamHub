import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Package, FolderKanban, Users, Layers, X } from "lucide-react";

interface SearchResult {
  type: 'brand' | 'product' | 'project' | 'agent' | 'pod';
  id: number;
  title: string;
  subtitle?: string;
  url: string;
  context?: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  brand: Sparkles,
  product: Package,
  project: FolderKanban,
  agent: Users,
  pod: Layers,
};

const typeColors = {
  brand: "bg-purple-500/10 text-purple-500",
  product: "bg-blue-500/10 text-blue-500",
  project: "bg-green-500/10 text-green-500",
  agent: "bg-orange-500/10 text-orange-500",
  pod: "bg-pink-500/10 text-pink-500",
};

const MAX_RECENT = 8;
const RECENT_SEARCHES_KEY = "cmdk_recent";

type Action = {
  id: string;
  label: string;
  run: () => void;
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zone, setZone] = useState<"actions" | "results">("results");
  const [, setLocation] = useLocation();
  const [recent, setRecent] = useState<string[]>([]);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const limit = 10;

  // Quick actions
  const actions: Action[] = useMemo(() => [
    {
      id: "new-wo",
      label: "+ New Work Order",
      run: () => setLocation("/work-orders/new"),
    },
    {
      id: "open-copilot",
      label: "Open Copilot",
      run: () => setLocation("/copilot"),
    },
    {
      id: "view-coverage",
      label: "View Coverage",
      run: () => setLocation("/coverage"),
    },
    {
      id: "view-playbooks",
      label: "View Playbooks",
      run: () => setLocation("/playbooks"),
    },
  ], [setLocation]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const pushRecent = useCallback((s: string) => {
    const v = s.trim();
    if (v.length < 2) return;
    const next = [v, ...recent.filter(x => x !== v)].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {}
  }, [recent]);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
      setZone("results");
      setAllResults([]);
      setOffset(0);
      setTotal(0);
    }
  }, [open]);

  // Reset when query changes
  useEffect(() => {
    setAllResults([]);
    setOffset(0);
    setTotal(0);
    setSelectedIndex(0);
    setZone("results");
  }, [query]);

  // Fetch search results (initial + pagination)
  const { data: searchData, isLoading } = useQuery<{ items: SearchResult[]; count: number }>({
    queryKey: ["/api/search", query, offset],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const count = parseInt(res.headers.get("X-Total-Count") || data.count || "0", 10);
      return { items: data.items || data, count };
    },
  });

  // Update results when data changes
  useEffect(() => {
    if (searchData?.items) {
      setAllResults(prev => offset === 0 ? searchData.items : [...prev, ...searchData.items]);
      setTotal(searchData.count);
      if (offset === 0 && searchData.items.length > 0 && zone === "results") {
        setSelectedIndex(0);
      }
    }
  }, [searchData, offset, zone]);

  const results = allResults;
  const hasMore = results.length < total;

  // Infinite scroll observer
  useEffect(() => {
    if (!open || !hasMore || isLoading || fetchingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent.isIntersecting && !fetchingMore) {
          setFetchingMore(true);
          setOffset(prev => prev + limit);
        }
      },
      { root: listRef.current, rootMargin: "200px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [open, hasMore, isLoading, fetchingMore, limit]);

  // Clear fetchingMore when new data arrives
  useEffect(() => {
    if (searchData && fetchingMore) {
      setFetchingMore(false);
    }
  }, [searchData, fetchingMore]);

  // Two-zone keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      const aCount = actions.length;
      const rCount = results.length;
      const inActions = zone === "actions";
      const inResults = zone === "results";

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (inActions) {
          if (aCount === 0) {
            setZone("results");
            setSelectedIndex(rCount ? 0 : -1);
            return;
          }
          const next = selectedIndex + 1;
          if (next < aCount) {
            setSelectedIndex(next);
          } else {
            setZone("results");
            setSelectedIndex(rCount ? 0 : -1);
          }
        } else {
          if (rCount === 0) {
            setZone("actions");
            setSelectedIndex(aCount ? 0 : -1);
            return;
          }
          const next = selectedIndex + 1;
          if (next < rCount) {
            setSelectedIndex(next);
          } else {
            setZone("actions");
            setSelectedIndex(aCount ? 0 : -1);
          }
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (inActions) {
          if (aCount === 0) {
            setZone("results");
            setSelectedIndex(rCount ? Math.max(rCount - 1, 0) : -1);
            return;
          }
          const prev = selectedIndex - 1;
          if (prev >= 0) {
            setSelectedIndex(prev);
          } else {
            setZone("results");
            setSelectedIndex(rCount ? Math.max(rCount - 1, 0) : -1);
          }
        } else {
          if (rCount === 0) {
            setZone("actions");
            setSelectedIndex(aCount ? Math.max(aCount - 1, 0) : -1);
            return;
          }
          const prev = selectedIndex - 1;
          if (prev >= 0) {
            setSelectedIndex(prev);
          } else {
            setZone("actions");
            setSelectedIndex(aCount ? Math.max(aCount - 1, 0) : -1);
          }
        }
      } else if (e.key === "Enter") {
        if (inActions && selectedIndex >= 0 && actions[selectedIndex]) {
          e.preventDefault();
          actions[selectedIndex].run();
          onOpenChange(false);
        } else if (inResults && selectedIndex >= 0 && results[selectedIndex]) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, zone, actions, onOpenChange]);

  const handleSelect = (result: SearchResult) => {
    pushRecent(query);
    setLocation(result.url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search brands, products, projects, agents..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0"
              data-testid="input-search"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
          {isLoading && offset === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && query.trim().length === 0 && recent.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">Recent searches</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecent}
                  className="h-6 text-xs"
                  data-testid="button-clear-recent"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(s)}
                    className="h-7 text-xs"
                    data-testid={`button-recent-${s}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query.trim().length === 0 && recent.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Start typing to search across</p>
              <p className="text-xs mt-1">Brands • Products • Projects • Agents • Pods</p>
            </div>
          )}

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div className="p-4 border-b">
              <p className="text-xs text-muted-foreground font-medium mb-2">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {actions.map((action, i) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      action.run();
                      onOpenChange(false);
                    }}
                    className={`h-7 text-xs ${zone === "actions" && selectedIndex === i ? "bg-accent" : ""}`}
                    aria-selected={zone === "actions" && selectedIndex === i}
                    data-testid={`action-${action.id}`}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && query.trim().length > 0 && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                const isSelected = zone === "results" && index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      isSelected
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleSelect(result)}
                    data-testid={`search-result-${result.type}-${result.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-md ${typeColors[result.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {result.subtitle}
                          </p>
                        )}
                        {result.context && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {result.context}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="p-4 text-center text-sm text-muted-foreground"
                  data-testid="scroll-sentinel"
                >
                  {fetchingMore ? "Loading more..." : "Scroll to load more"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-2 px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Close</span>
          </div>
          {results.length > 0 && (
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to setup Cmd+K shortcut
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
