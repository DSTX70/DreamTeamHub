import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Plus, Layers } from "lucide-react";
import type { Pod, Person } from "@shared/schema";
import { getPodRailClass } from "@/lib/pod-utils";

export default function Pods() {
  const { data: pods, isLoading: isLoadingPods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const { data: persons, isLoading: isLoadingPersons } = useQuery<Person[]>({
    queryKey: ['/api/persons'],
  });

  const isLoading = isLoadingPods || isLoadingPersons;

  const getPersonsForPod = (podId: number) => {
    return persons?.filter(p => p.podId === podId) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Pods & Persons</h1>
          <p className="text-sm text-muted-foreground">Manage organizational pods and team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-create-person">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
          <Button data-testid="button-create-pod">
            <Plus className="h-4 w-4 mr-2" />
            Create Pod
          </Button>
        </div>
      </div>

      {/* Pods Grid - Using Brand Guide Styling */}
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
      ) : pods && pods.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pods.map((pod) => {
            const podPersons = getPersonsForPod(pod.id);
            
            return (
              <div key={pod.id} className="role-card" data-testid={`pod-${pod.id}`}>
                <div className={`rail pod-rail ${getPodRailClass(pod.name)}`}></div>
                <div className="inner">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }}>
                      <Layers style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
                    </div>
                    <span className="chip">
                      {podPersons.length} {podPersons.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <p className="title" style={{ font: '800 22px/1 Inter' }}>{pod.name}</p>
                  {pod.charter && (
                    <p className="subtitle" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {pod.charter}
                    </p>
                  )}

                  {pod.owners && pod.owners.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owners</div>
                      <div className="chips">
                        {pod.owners.map((owner, idx) => (
                          <span key={idx} className="chip">{owner}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {podPersons.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {podPersons.slice(0, 3).map((person) => (
                          <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                              {person.handle.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</span>
                          </div>
                        ))}
                        {podPersons.length > 3 && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '32px' }}>
                            +{podPersons.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Layers}
              title="No pods yet"
              description="Create your first organizational pod to get started"
              action={{
                label: "Create Pod",
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
