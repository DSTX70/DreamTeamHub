import { Home, Settings, Target, Briefcase, Package, BadgeCheck, Wrench, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSystemInternals } from "@/hooks/useSystemInternals";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type NavItem = { title: string; url: string; icon: any };
type NavGroup = { title: string; items: NavItem[] };

const coreNavigation: NavGroup[] = [
  {
    title: "Core",
    items: [
      { title: "Intent", url: "/intent", icon: Target },
      { title: "Work", url: "/work-orders", icon: Briefcase },
      { title: "Artifacts", url: "/artifacts", icon: Package },
      { title: "Verification", url: "/verification", icon: BadgeCheck },
      { title: "System", url: "/help", icon: Settings },
    ],
  },
];

const advancedNavigation: NavGroup[] = [
  {
    title: "System Internals (Advanced)",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Intake & Routing", url: "/intake", icon: Wrench },
      { title: "Dream Team Chat", url: "/chat", icon: Wrench },
      { title: "Agent Console", url: "/agent-console", icon: Wrench },
      { title: "Pods", url: "/pods", icon: Wrench },
      { title: "Roles", url: "/roles", icon: Wrench },
      { title: "Roster Admin", url: "/roster-admin", icon: Wrench },
      { title: "Ops Dashboard", url: "/ops-dashboard", icon: Wrench },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { showSystemInternals, setShowSystemInternals } = useSystemInternals();

  const navigation = showSystemInternals
    ? [...coreNavigation, ...advancedNavigation]
    : coreNavigation;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Dream Team Hub</div>
            <div className="text-xs text-muted-foreground">Outcome-first orchestration</div>
          </div>
        </div>

        <div className="mt-3">
          <Button
            variant={showSystemInternals ? "default" : "outline"}
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setShowSystemInternals(!showSystemInternals)}
            data-testid="toggle-system-internals"
          >
            <Wrench className="h-4 w-4" />
            {showSystemInternals ? "Advanced: ON" : "Advanced: OFF"}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
