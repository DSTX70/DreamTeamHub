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
import HelpPage from "@/pages/help";
import Projects from "@/pages/projects";
import ProjectCreate from "@/pages/project-create";
import ProjectDetail from "@/pages/project-detail";
import AgentCreate from "@/pages/agent-create";
import Demo from "@/pages/demo";
import Academy from "@/pages/academy";
import CopilotPage from "@/pages/copilot";
import IntegrationsPage from "@/pages/integrations";
import WorkOrdersPage from "@/pages/work-orders";
import BUHomePage from "@/pages/bu-home";
import OpsLogsPage from "@/pages/ops-logs";
import OpsDashboardPage from "@/pages/ops-dashboard";
import CoveragePage from "@/pages/coverage";
import PlaybooksPage from "@/pages/playbooks";
import PlaybooksEditPage from "@/pages/playbooks-edit";
import PlaybookPreview from "@/pages/wo/PlaybookPreview";
import OnboardingSuccess from "@/pages/onboarding/Success";
import CoverageDeepDive from "@/pages/coverage/DeepDive";
import OpsAlertHooksDemo from "@/pages/ops/AlertHooksDemo";
import AffiliatesReport from "@/pages/ops/AffiliateReport";
import AffiliatesAdmin from "@/pages/ops/AffiliatesAdmin";
import AffiliatePayouts from "@/pages/ops/AffiliatePayouts";
import InventoryLowStock from "@/pages/ops/InventoryLowStock";
import ImagesAdmin from "@/pages/ops/ImagesAdmin";
import SettingsLayout from "@/pages/ops/settings/SettingsLayout";
import OpsOverview from "@/pages/ops/OpsOverview";
import OpsLogs from "@/pages/ops/OpsLogs";
import AuditTrail from "@/pages/ops/AuditTrail";
import LogsStreamPlus from "@/pages/ops/LogsStreamPlus";
import LLMProviderSelect from "@/pages/llm/ProviderSelect";
import ProviderPromptLinter from "@/pages/llm/ProviderPromptLinter";
import LinterAugment from "@/pages/llm/Linter_Augment";
import Checkout from "@/pages/checkout/Checkout";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IdeaSparkButton } from "@/components/idea-spark";
import { SearchModal, useSearchShortcut } from "@/components/search-modal";
import HeaderOpsMenu from "@/components/HeaderOpsMenu";
import OpsHotkeys from "@/components/OpsHotkeys";
import FooterStatus from "@/components/FooterStatus";
import { useState } from "react";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={ControlTower} />
      <Route path="/roles" component={Roles} />
      <Route path="/agents" component={Roles} />
      <Route path="/agents/new" component={AgentCreate} />
      <Route path="/brainstorm" component={Brainstorm} />
      <Route path="/audits" component={Audits} />
      <Route path="/decisions" component={Decisions} />
      <Route path="/intake" component={Intake} />
      <Route path="/pods" component={Pods} />
      <Route path="/projects/new" component={ProjectCreate} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:category" component={Projects} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/agent-console" component={AgentConsole} />
      <Route path="/summon-mirror" component={SummonMirrorPage} />
      <Route path="/roster-admin" component={RosterAdminPage} />
      <Route path="/role-agent-sync" component={RoleAgentSyncPage} />
      <Route path="/brand-guide" component={BrandGuidePage} />
      <Route path="/academy" component={Academy} />
      <Route path="/copilot" component={CopilotPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/work-orders" component={WorkOrdersPage} />
      <Route path="/ops-dashboard" component={OpsDashboardPage} />
      <Route path="/ops-logs" component={OpsLogsPage} />
      <Route path="/coverage" component={CoveragePage} />
      <Route path="/coverage/deep-dive" component={CoverageDeepDive} />
      <Route path="/playbooks" component={PlaybooksPage} />
      <Route path="/playbooks/:handle" component={PlaybooksEditPage} />
      <Route path="/wo/playbook-preview" component={PlaybookPreview} />
      <Route path="/onboarding/success" component={OnboardingSuccess} />
      <Route path="/ops/overview" component={OpsOverview} />
      <Route path="/ops/alerts" component={OpsAlertHooksDemo} />
      <Route path="/ops/affiliates" component={AffiliatesReport} />
      <Route path="/ops/affiliates/admin" component={AffiliatesAdmin} />
      <Route path="/ops/affiliates/payouts" component={AffiliatePayouts} />
      <Route path="/ops/inventory" component={InventoryLowStock} />
      <Route path="/ops/images" component={ImagesAdmin} />
      <Route path="/ops/logs" component={OpsLogs} />
      <Route path="/ops/logs-stream-plus" component={LogsStreamPlus} />
      <Route path="/ops/audit" component={AuditTrail} />
      <Route path="/ops/settings/:rest*" component={SettingsLayout} />
      <Route path="/llm/provider" component={LLMProviderSelect} />
      <Route path="/llm/provider/linter" component={ProviderPromptLinter} />
      <Route path="/llm/linter/augment" component={LinterAugment} />
      <Route path="/bu/:slug" component={BUHomePage} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/help" component={HelpPage} />
      <Route path="/demo" component={Demo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Setup Cmd+K shortcut
  useSearchShortcut(() => setIsSearchOpen(true));

  // Show landing page without sidebar for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return <UnauthenticatedRoutes />;
  }

  // Show full app with sidebar for authenticated users
  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                data-testid="button-open-search"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <HeaderOpsMenu />
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
              <AuthenticatedRoutes />
            </div>
          </main>
          <footer className="flex items-center justify-end px-4 py-2 border-t bg-background">
            <FooterStatus />
          </footer>
        </div>
        <IdeaSparkButton />
        <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        <OpsHotkeys />
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
