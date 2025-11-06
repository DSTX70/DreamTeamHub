import { useState, useEffect } from "react";
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
import { Search, Sparkles, Package, FolderKanban, Users, Layers } from "lucide-react";

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

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Fetch search results
  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
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

        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              Searching...
            </div>
          )}

          {!isLoading && query.trim().length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Start typing to search across</p>
              <p className="text-xs mt-1">Brands • Products • Projects • Agents • Pods</p>
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
                const isSelected = index === selectedIndex;

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
