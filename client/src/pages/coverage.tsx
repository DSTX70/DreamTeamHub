import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

interface RoleCoverage {
  role_handle: string;
  role_name: string;
  agent_count: number;
}

interface CoverageData {
  unstaffed: RoleCoverage[];
  over: RoleCoverage[];
  all: RoleCoverage[];
}

export default function CoveragePage() {
  const [threshold, setThreshold] = useState(3);

  const { data, isLoading, refetch } = useQuery<CoverageData>({
    queryKey: ["/api/coverage/roles", threshold],
    queryFn: async () => {
      const response = await fetch(`/api/coverage/roles?threshold=${threshold}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch coverage data');
      return response.json();
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Coverage</h1>
          <p className="text-muted-foreground mt-1">
            Analyze role staffing levels across Dream Team
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure over-replication threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="threshold">Over-replication Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min={1}
                max={50}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="max-w-xs"
                data-testid="input-threshold"
              />
              <p className="text-sm text-muted-foreground">
                Roles with {threshold} or more agents are considered over-replicated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Unstaffed Roles</CardTitle>
                </div>
                <CardDescription>
                  Roles with no assigned agents ({data?.unstaffed.length || 0})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!data?.unstaffed.length ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2" data-testid="text-no-unstaffed">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    All roles are staffed!
                  </div>
                ) : (
                  <ul className="space-y-2" data-testid="list-unstaffed">
                    {data.unstaffed.map(role => (
                      <li
                        key={role.role_handle}
                        className="flex items-center justify-between p-2 rounded-lg border"
                        data-testid={`role-unstaffed-${role.role_handle}`}
                      >
                        <div>
                          <div className="font-medium">{role.role_name}</div>
                          <div className="text-xs text-muted-foreground">{role.role_handle}</div>
                        </div>
                        <Badge variant="destructive">0 agents</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle>Over-Replicated Roles</CardTitle>
                </div>
                <CardDescription>
                  Roles with {threshold}+ agents ({data?.over.length || 0})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!data?.over.length ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2" data-testid="text-no-over">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    No over-replicated roles
                  </div>
                ) : (
                  <ul className="space-y-2" data-testid="list-over">
                    {data.over.map(role => (
                      <li
                        key={role.role_handle}
                        className="flex items-center justify-between p-2 rounded-lg border"
                        data-testid={`role-over-${role.role_handle}`}
                      >
                        <div>
                          <div className="font-medium">{role.role_name}</div>
                          <div className="text-xs text-muted-foreground">{role.role_handle}</div>
                        </div>
                        <Badge variant="secondary">{role.agent_count} agents</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Roles</CardTitle>
              <CardDescription>
                Complete role coverage overview ({data?.all.length || 0} roles)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full" data-testid="table-all-roles">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Handle</th>
                      <th className="text-right p-3 font-medium">Agents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.all.map(role => (
                      <tr
                        key={role.role_handle}
                        className="border-b last:border-b-0"
                        data-testid={`row-role-${role.role_handle}`}
                      >
                        <td className="p-3">{role.role_name}</td>
                        <td className="p-3 text-muted-foreground text-sm font-mono">
                          {role.role_handle}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={role.agent_count === 0 ? "destructive" : role.agent_count >= threshold ? "secondary" : "outline"}
                          >
                            {role.agent_count}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!data?.all.length && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-muted-foreground">
                          No roles found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
