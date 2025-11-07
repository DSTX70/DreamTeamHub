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
import { Badge } from "@/components/ui/badge";
import Tooltip from "@/components/Tooltip";
import { useState, useEffect, useRef } from "react";

// Role badge color mapping
const ROLE_COLORS: Record<string, string> = {
  ops_viewer: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  ops_editor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  ops_admin: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

export default function HeaderOpsMenu() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    // Fetch hotkeys setting from server
    const fetchSettings = async () => {
      try {
        const r = await fetch("/api/ops/settings/notifiers");
        const j = await r.json();
        setHotkeysEnabled(j.settings.hotkeysEnabled ?? true);
      } catch {
        // Default to enabled on error
        setHotkeysEnabled(true);
      }
    };
    fetchSettings();

    // Fetch user roles
    const fetchRoles = async () => {
      try {
        const r = await fetch("/api/ops/_auth/ping");
        const j = await r.json();
        setRoles(j.roles || []);
      } catch {
        // Default to no roles on error
        setRoles([]);
      }
    };
    fetchRoles();
  }, []);

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

        // Don't open if hotkeys are disabled
        if (!hotkeysEnabled) {
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
  }, [hotkeysEnabled]);

  // Check if user has required role for a feature
  const hasRole = (...requiredRoles: string[]) => {
    return requiredRoles.some(role => roles.includes(role));
  };

  // Display up to 3 role chips, with "+N" for extras
  const displayRoles = roles.slice(0, 3);
  const extraCount = Math.max(0, roles.length - 3);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-ops-menu" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Ops</span>
          {roles.length > 0 && displayRoles.map((role) => (
            <Badge 
              key={role}
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-4 ${ROLE_COLORS[role] || ''}`}
              data-testid={`badge-role-${role}`}
            >
              {role.replace('ops_', '')}
            </Badge>
          ))}
          {extraCount > 0 && (
            <Badge 
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4"
              data-testid="badge-role-extra"
            >
              +{extraCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Operations</DropdownMenuLabel>
          <Tooltip
            content={
              hotkeysEnabled ? (
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
              ) : (
                <div className="text-xs">Hotkeys disabled by Ops.</div>
              )
            }
            side="left"
            muted={!hotkeysEnabled}
          >
            <button
              className={`p-1 rounded ${hotkeysEnabled ? 'hover-elevate' : 'cursor-default opacity-50'}`}
              data-testid="button-shortcuts-help"
              type="button"
              onMouseEnter={() => hotkeysEnabled && setShowHint(true)}
              onMouseLeave={() => {
                // Only hide if not in auto-show mode
                if (!hintTimerRef.current) {
                  setShowHint(false);
                }
              }}
              style={{ position: "relative" }}
            >
              <HelpCircle className={`h-3.5 w-3.5 ${hotkeysEnabled ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
              {showHint && hotkeysEnabled && (
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
        
        {/* Viewer/Editor/Admin can access these pages */}
        {hasRole("ops_viewer", "ops_editor", "ops_admin") && (
          <>
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
          </>
        )}
        
        {/* Only Admin can access Settings */}
        {hasRole("ops_admin") && (
          <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
