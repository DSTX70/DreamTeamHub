import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import LeftRail from "@/components/LeftRail";
import schema from "@shared/schemas/onboarding_success.schema.json";
import JsonSchemaForm from "@/forms/JsonSchemaForm";

export default function Success() {
  return (
    <div className="flex">
      <LeftRail />
      <main className="p-6 space-y-6 flex-1">
        <PageBreadcrumb segments={[{ label: "Onboarding", href: "/onboarding" }, { label: "Success Links" }]} />
        <h1 className="text-xl font-semibold">Onboarding: Success Links</h1>
        <p className="text-sm text-gray-600">Define post-onboarding links (e.g., “Go to Brand”, “Invite teammates”).</p>
        <JsonSchemaForm
          schema={schema as any}
          onSubmit={(val) => alert("Saved links for brand " + val.brandId)}
        />
      </main>
    </div>
  );
}
