import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, TrendingUp, Award, Target } from "lucide-react";

interface AgentLabRole {
  id: number;
  handle: string;
  title: string;
  pod: string;
  toneVoice: string;
  category: string;
  definitionOfDone: string[];
  strengths: string[];
}

export default function AcademyPage() {
  const { data: roles = [], isLoading } = useQuery<AgentLabRole[]>({
    queryKey: ["/api/roles"],
  });

  // Filter Agent Lab roles
  const agentLabRoles = roles.filter(role => 
    role.category === "Agent Lab / Senior Advisers + Added Specialists"
  );

  // Group by tone/voice (used as autonomy level proxy)
  const groupedByLevel = agentLabRoles.reduce((acc, role) => {
    const level = role.toneVoice || "Advisory";
    if (!acc[level]) acc[level] = [];
    acc[level].push(role);
    return acc;
  }, {} as Record<string, AgentLabRole[]>);

  const levelCounts = {
    "Advisory": groupedByLevel["Advisory"]?.length || 0,
    "Collaborative": groupedByLevel["Collaborative"]?.length || 0,
    "Autonomous": groupedByLevel["Autonomous"]?.length || 0,
    "Strategic": groupedByLevel["Strategic"]?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-academy">
              Agentic AI Lab & Training Academy
            </h1>
            <p className="text-sm text-muted-foreground">
              At-a-glance status of agents • training • promotions
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-advisory">
                {levelCounts["Advisory"]}
              </div>
              <div className="text-sm text-muted-foreground">Advisory</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-collaborative">
                {levelCounts["Collaborative"]}
              </div>
              <div className="text-sm text-muted-foreground">Collaborative</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Target className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-autonomous">
                {levelCounts["Autonomous"]}
              </div>
              <div className="text-sm text-muted-foreground">Autonomous</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <div className="text-3xl font-bold" data-testid="count-strategic">
                {levelCounts["Strategic"]}
              </div>
              <div className="text-sm text-muted-foreground">Strategic</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent Lab Roles</h2>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading agents...
          </div>
        ) : agentLabRoles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No Agent Lab roles found. Import roles to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentLabRoles.map((role) => (
              <Card key={role.id} className="p-4 hover-elevate" data-testid={`agent-card-${role.handle}`}>
                <div className="space-y-3">
                  {/* Header */}
                  <div>
                    <h3 className="font-semibold text-base mb-2" data-testid={`agent-title-${role.handle}`}>
                      {role.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs" data-testid={`badge-level-${role.handle}`}>
                        {role.toneVoice}
                      </Badge>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-pod-${role.handle}`}>
                        {role.pod}
                      </Badge>
                    </div>
                  </div>

                  {/* Strengths */}
                  {role.strengths && role.strengths.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Key Competencies
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.strengths.slice(0, 3).map((strength, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-muted/50">
                            {strength.length > 20 ? strength.substring(0, 20) + "..." : strength}
                          </Badge>
                        ))}
                        {role.strengths.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.strengths.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Success Criteria Count */}
                  {role.definitionOfDone && role.definitionOfDone.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span>{role.definitionOfDone.length} success criteria defined</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">About the Agent Lab</h3>
            <p className="text-sm text-muted-foreground">
              The Agentic AI Lab & Training Academy provides a comprehensive framework for 
              developing, training, and promoting AI agents through autonomy levels (L0→L1→L2→L3). 
              Each agent undergoes rigorous evaluation across four gates: Safety, Performance, 
              Cost, and Auditability.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Current Status:</strong> {agentLabRoles.length} Agent Lab roles imported 
              from the canonical collection, including Senior Advisers and Added Specialists.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
