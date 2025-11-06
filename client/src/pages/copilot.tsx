import CopilotPanel from "@/components/CopilotPanel";
import { PageBreadcrumb, buildBreadcrumbs } from "@/components/PageBreadcrumb";

export default function CopilotPage() {
  const breadcrumbs = buildBreadcrumbs({ page: "Copilot" });
  
  return (
    <div className="container py-8 space-y-6">
      <PageBreadcrumb segments={breadcrumbs} />
      <CopilotPanel />
    </div>
  );
}
