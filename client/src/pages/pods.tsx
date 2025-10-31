import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Plus, Layers, Users } from "lucide-react";
import type { Pod, Person } from "@shared/schema";

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

      {/* Pods Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
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
              <Card key={pod.id} className="hover-elevate" data-testid={`pod-${pod.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {podPersons.length} {podPersons.length === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{pod.name}</CardTitle>
                  {pod.charter && (
                    <CardDescription className="text-sm line-clamp-2">{pod.charter}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {pod.owners && pod.owners.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Owners</div>
                      <div className="flex flex-wrap gap-1">
                        {pod.owners.map((owner, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {owner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {podPersons.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Members</div>
                      <div className="space-y-1">
                        {podPersons.slice(0, 3).map((person) => (
                          <div key={person.id} className="flex items-center gap-2 text-sm">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {person.handle.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="flex-1 truncate">{person.name}</span>
                          </div>
                        ))}
                        {podPersons.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-8">
                            +{podPersons.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
