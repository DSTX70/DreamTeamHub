import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Search, Users, Plus, CheckCircle2 } from "lucide-react";
import type { RoleCard } from "@shared/schema";
import { getPodRailClass, getPodColor } from "@/lib/pod-utils";

export default function Roles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPod, setSelectedPod] = useState<string | null>(null);

  const { data: roleCards, isLoading } = useQuery<RoleCard[]>({
    queryKey: ['/api/roles'],
  });

  const filteredRoles = roleCards?.filter(role => {
    const matchesSearch = !searchQuery || 
      role.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPod = !selectedPod || role.pod === selectedPod;
    
    return matchesSearch && matchesPod;
  });

  const pods = Array.from(new Set(roleCards?.map(r => r.pod) || [])).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Role Cards</h1>
          <p className="text-sm text-muted-foreground">Team personas with purpose, functions, and responsibilities</p>
        </div>
        <Button data-testid="button-create-role">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by handle, title, or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedPod === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPod(null)}
                data-testid="filter-all-pods"
              >
                All Pods
              </Button>
              {pods.map(pod => {
                const podColor = getPodColor(pod);
                const isSelected = selectedPod === pod;
                return (
                  <Button
                    key={pod}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPod(pod)}
                    data-testid={`filter-pod-${pod.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      borderColor: podColor,
                      backgroundColor: isSelected ? `${podColor}33` : `${podColor}11`,
                      color: podColor,
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    className="hover-elevate active-elevate-2"
                  >
                    {pod}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Cards Grid - Using Brand Guide Styling */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRoles && filteredRoles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <div key={role.id} className="role-card" data-testid={`role-card-${role.handle}`}>
              {/* Pod-specific colored rail using actual pod color */}
              <div 
                className="rail" 
                style={{ 
                  background: role.podColor || '#C95CAF',
                  height: '8px',
                  width: '100%',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                }}
              ></div>
              <div className="inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  {role.icon && (
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{role.icon}</span>
                  )}
                  <p className="title" style={{ font: '800 22px/1 Inter' }}>{role.handle}</p>
                </div>
                <p className="subtitle">{role.title}</p>
                <div className="chips">
                  <span className="chip">{role.pod}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  {role.purpose}
                </p>
                
                {role.coreFunctions && role.coreFunctions.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Functions</div>
                    <div className="chips">
                      {role.coreFunctions.slice(0, 3).map((func, idx) => (
                        <span key={idx} className="chip">{func}</span>
                      ))}
                      {role.coreFunctions.length > 3 && (
                        <span className="chip">+{role.coreFunctions.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}

                {role.strengths && role.strengths.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strengths</div>
                    <div className="chips">
                      {role.strengths.map((strength, idx) => (
                        <span key={idx} className="chip">{strength}</span>
                      ))}
                    </div>
                  </div>
                )}

                {role.collaborators && role.collaborators.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collaborates With</div>
                    <div className="chips">
                      {role.collaborators.slice(0, 5).map((collab, idx) => (
                        <span key={idx} className="chip">{collab}</span>
                      ))}
                      {role.collaborators.length > 5 && (
                        <span className="chip">+{role.collaborators.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                {role.definitionOfDone && role.definitionOfDone.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Definition of Done</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {role.definitionOfDone.slice(0, 2).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {role.tags && role.tags.length > 0 && (
                  <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--brand-line)' }}>
                    <div className="chips">
                      {role.tags.map((tag, idx) => (
                        <span key={idx} className="chip">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No role cards found"
              description={searchQuery || selectedPod ? "Try adjusting your filters" : "Start by creating your first role card"}
              action={{
                label: "Create Role Card",
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
