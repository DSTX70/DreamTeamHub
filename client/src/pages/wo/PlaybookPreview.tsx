import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import LeftRail from "@/components/LeftRail";
import JsonSchemaForm from "@/forms/JsonSchemaForm";
import schema from "@shared/schemas/sample_playbook.schema.json";

export default function PlaybookPreview() {
  return (
    <div className="flex">
      <LeftRail />
      <main className="p-6 space-y-6 flex-1">
        <PageBreadcrumb segments={[
          { label: "Work Orders", href: "/work-orders" },
          { label: "Create", href: "/wo/create" },
          { label: "Playbook Preview" }
        ]} />
        <h1 className="text-xl font-semibold">Playbook Preview</h1>
        <p className="text-sm text-gray-600">Render steps from JSON Schema and preview before saving.</p>
        <JsonSchemaForm
          schema={schema as any}
          onSubmit={(val) => alert("Playbook JSON:\n" + JSON.stringify(val, null, 2))}
        />
      </main>
    </div>
  );
}
