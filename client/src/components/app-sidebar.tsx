import { Home, Users, Lightbulb, Shield, FileText, Inbox, Sparkles, Layers, MessageSquare, Bot, Radio, Settings, RefreshCw, Palette, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
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

const navigation = [
  {
    title: "Dream Team Hub by i³ collective",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
    ],
  },
  {
    title: "Orchestration",
    items: [
      { title: "Intake & Routing", url: "/intake", icon: Inbox },
      { title: "Decision Log", url: "/decisions", icon: FileText },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { title: "Dream Team Chat", url: "/chat", icon: MessageSquare },
      { title: "Agent Console", url: "/agent-console", icon: Bot },
      { title: "Summon & Mirror", url: "/summon-mirror", icon: Radio },
      { title: "Brainstorm Studio", url: "/brainstorm", icon: Lightbulb },
      { title: "Audit Engine", url: "/audits", icon: Shield },
    ],
  },
  {
    title: "Foundation",
    items: [
      { title: "Pods & Persons", url: "/pods", icon: Layers },
      { title: "Role Cards", url: "/roles", icon: Users },
      { title: "Roster Admin", url: "/roster-admin", icon: Settings },
      { title: "Roles ⇄ Specs Sync", url: "/role-agent-sync", icon: RefreshCw },
      { title: "Brand Guide", url: "/brand-guide", icon: Palette },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Platform Guide", url: "/help", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">Dream Team Hub</div>
            <div className="text-xs text-muted-foreground">Multi-Pod Orchestration</div>
          </div>
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
                      <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
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
