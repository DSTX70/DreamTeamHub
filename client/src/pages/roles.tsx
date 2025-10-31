import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Search, Users, Plus, CheckCircle2 } from "lucide-react";
import type { RoleCard } from "@shared/schema";

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
              {pods.slice(0, 5).map(pod => (
                <Button
                  key={pod}
                  variant={selectedPod === pod ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPod(pod)}
                  data-testid={`filter-pod-${pod.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {pod}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Cards Grid */}
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
      ) : filteredRoles && filteredRoles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="hover-elevate" data-testid={`role-card-${role.handle}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-mono font-semibold">
                    {role.handle.slice(0, 2).toUpperCase()}
                  </div>
                  <Badge variant="secondary" className="text-xs">{role.pod}</Badge>
                </div>
                <CardTitle className="text-lg">{role.handle}</CardTitle>
                <CardDescription className="text-sm">{role.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Purpose</div>
                  <p className="text-sm line-clamp-2">{role.purpose}</p>
                </div>
                
                {role.coreFunctions && role.coreFunctions.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Core Functions</div>
                    <div className="flex flex-wrap gap-1">
                      {role.coreFunctions.slice(0, 3).map((func, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {func}
                        </Badge>
                      ))}
                      {role.coreFunctions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.coreFunctions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {role.definitionOfDone && role.definitionOfDone.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Definition of Done</div>
                    <div className="space-y-1">
                      {role.definitionOfDone.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {role.tags && role.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {role.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
