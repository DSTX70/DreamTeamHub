import { Link } from "wouter";
import { Settings, Package, Image, UserCheck, LayoutDashboard, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Tooltip from "@/components/Tooltip";
import { useState, useEffect, useRef } from "react";

export default function HeaderOpsMenu() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if "?" is pressed (Shift + /)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Ignore if user is typing in an input, textarea, or contenteditable
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        e.preventDefault();
        
        // Open the dropdown
        setOpen(true);
        
        // Show hint for ~1.5s
        setShowHint(true);
        if (hintTimerRef.current) {
          clearTimeout(hintTimerRef.current);
        }
        hintTimerRef.current = setTimeout(() => {
          setShowHint(false);
          hintTimerRef.current = null;
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-ops-menu">
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ops</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Operations</DropdownMenuLabel>
          <Tooltip
            content={
              <div className="space-y-1 text-xs">
                <div className="font-semibold mb-1.5">Keyboard Shortcuts</div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">o</kbd>
                  <span className="text-muted-foreground">— Overview</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">i</kbd>
                  <span className="text-muted-foreground">— Inventory</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">m</kbd>
                  <span className="text-muted-foreground">— Images</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">a</kbd>
                  <span className="text-muted-foreground">— Affiliates</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">s</kbd>
                  <span className="text-muted-foreground">— Settings</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2 pt-1.5 border-t">
                  Press keys in sequence within ~1.2s
                </div>
              </div>
            }
            side="left"
          >
            <button
              className="p-1 rounded hover-elevate"
              data-testid="button-shortcuts-help"
              type="button"
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => {
                // Only hide if not in auto-show mode
                if (!hintTimerRef.current) {
                  setShowHint(false);
                }
              }}
              style={{ position: "relative" }}
            >
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              {showHint && (
                <div className="absolute left-0 top-full mt-1 bg-popover text-popover-foreground shadow-md rounded-md border p-2 w-64 z-50" style={{ left: "-240px" }}>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold mb-1.5">Keyboard Shortcuts</div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">o</kbd>
                      <span className="text-muted-foreground">— Overview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">i</kbd>
                      <span className="text-muted-foreground">— Inventory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">m</kbd>
                      <span className="text-muted-foreground">— Images</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">a</kbd>
                      <span className="text-muted-foreground">— Affiliates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">g</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">s</kbd>
                      <span className="text-muted-foreground">— Settings</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-1.5 border-t">
                      Press keys in sequence within ~1.2s
                    </div>
                  </div>
                </div>
              )}
            </button>
          </Tooltip>
        </div>
        <DropdownMenuSeparator />
        <Link href="/ops/overview">
          <DropdownMenuItem data-testid="menu-ops-overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
              g o
            </kbd>
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/inventory">
          <DropdownMenuItem data-testid="menu-ops-inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
              g i
            </kbd>
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/images">
          <DropdownMenuItem data-testid="menu-ops-images">
            <Image className="h-4 w-4 mr-2" />
            Images
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
              g m
            </kbd>
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/affiliates">
          <DropdownMenuItem data-testid="menu-ops-affiliates">
            <UserCheck className="h-4 w-4 mr-2" />
            Affiliates
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
              g a
            </kbd>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href="/ops/settings">
          <DropdownMenuItem data-testid="menu-ops-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-muted-foreground">
              g s
            </kbd>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
