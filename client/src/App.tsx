import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
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

function Router() {
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
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
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
