import CopilotPanel from "@/components/CopilotPanel";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";

export default function CopilotPage() {
  const breadcrumbs = buildBreadcrumbs({ page: "Copilot & Integrations" });
  
  return (
    <div className="container py-8 space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      <div>
        <h1 className="text-3xl font-bold">Copilot & Integrations</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered assistant with tool-calling capabilities
        </p>
      </div>
      <CopilotPanel />
    </div>
  );
}
