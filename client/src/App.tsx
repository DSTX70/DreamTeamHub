import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ControlTower from "@/pages/control-tower";
import Roles from "@/pages/roles";
import Brainstorm from "@/pages/brainstorm";
import Audits from "@/pages/audits";
import Decisions from "@/pages/decisions";
import Intake from "@/pages/intake";
import Pods from "@/pages/pods";
import ChatPage from "@/pages/chat";
import AgentConsole from "@/pages/agent-console";
import SummonMirrorPage from "@/pages/summon-mirror";
import RosterAdminPage from "@/pages/roster-admin";
import RoleAgentSyncPage from "@/pages/role-agent-sync";
import BrandGuidePage from "@/pages/brand-guide";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated routes
  return (
    <Switch>
      <Route path="/" component={ControlTower} />
      <Route path="/roles" component={Roles} />
      <Route path="/brainstorm" component={Brainstorm} />
      <Route path="/audits" component={Audits} />
      <Route path="/decisions" component={Decisions} />
      <Route path="/intake" component={Intake} />
      <Route path="/pods" component={Pods} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/agent-console" component={AgentConsole} />
      <Route path="/summon-mirror" component={SummonMirrorPage} />
      <Route path="/roster-admin" component={RosterAdminPage} />
      <Route path="/role-agent-sync" component={RoleAgentSyncPage} />
      <Route path="/brand-guide" component={BrandGuidePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Show landing page without sidebar for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show full app with sidebar for authenticated users
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.email?.[0] || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {user?.firstName} {user?.lastName || user?.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = "/api/logout"}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-screen-2xl">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
