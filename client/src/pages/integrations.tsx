import CopilotPanel from "@/components/CopilotPanel";
import { useAuth } from "@/hooks/useAuth";

export default function IntegrationsPage() {
  const { user } = useAuth();
  
  // For now, use environment variable for Custom GPT URL
  // In production, this could be fetched from admin config API
  const customGptUrl = import.meta.env.VITE_CUSTOM_GPT_URL || "";
  
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect with external tools and services to extend Dream Team Hub capabilities
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">DTH Copilot</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered assistant for querying roles and agents using natural language
          </p>
        </div>
        <CopilotPanel 
          admin={!!user?.id} 
          customGptUrl={customGptUrl}
        />
      </section>

      {/* Future integrations can be added here */}
    </div>
  );
}
