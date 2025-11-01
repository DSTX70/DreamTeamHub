import RosterAdmin from "@/components/RosterAdmin";

export default function RosterAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Roster Admin</h1>
        <p className="text-muted-foreground mb-8">
          Manage Pods, Role Cards, and Agent Specifications with CSV import/export capabilities
        </p>
        <RosterAdmin />
      </div>
    </div>
  );
}
