import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Lightbulb, Users, Target, TrendingUp } from "lucide-react";
import type { BrainstormSession } from "@shared/schema";
import { format } from "date-fns";

export default function Brainstorm() {
  const { data: sessions, isLoading } = useQuery<BrainstormSession[]>({
    queryKey: ['/api/brainstorm/sessions'],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Brainstorm Studio</h1>
          <p className="text-sm text-muted-foreground">Multi-pod ideation with roles, clustering, and scoring</p>
        </div>
        <Button data-testid="button-create-session">
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Info Cards - Click to navigate to workflow pages */}
      <div className="grid gap-4 md:grid-cols-3">
        <article 
          className="role-card cursor-pointer hover-elevate active-elevate-2"
          onClick={() => window.location.href = '/brainstorm/diverge'}
          data-testid="card-diverge"
        >
          {/* Pink rail at top (Brand pod color - Diverge) */}
          <div className="rail pod-rail brand h-1.5" />
          <div className="inner">
            <h3 className="text-sm font-grotesk text-text-primary mb-2">Diverge</h3>
            <p className="text-xs text-text-secondary">Timed idea dump with assigned roles (Pro, Devil's Advocate, Neutral, Customer Voice)</p>
          </div>
        </article>

        <article 
          className="role-card cursor-pointer hover-elevate active-elevate-2"
          onClick={() => window.location.href = '/brainstorm/cluster'}
          data-testid="card-cluster"
        >
          {/* Cyan rail at top (Product pod color - Cluster) */}
          <div className="rail pod-rail product h-1.5" />
          <div className="inner">
            <h3 className="text-sm font-grotesk text-text-primary mb-2">Cluster</h3>
            <p className="text-xs text-text-secondary">Group similar ideas into themes with LLM assistance and manual refinement</p>
          </div>
        </article>

        <article 
          className="role-card cursor-pointer hover-elevate active-elevate-2"
          onClick={() => window.location.href = '/brainstorm/score'}
          data-testid="card-score-commit"
        >
          {/* Yellow rail at top (Decision pod color - Score & Commit) */}
          <div className="rail pod-rail decision h-1.5" />
          <div className="inner">
            <h3 className="text-sm font-grotesk text-text-primary mb-2">Score & Commit</h3>
            <p className="text-xs text-text-secondary">Rate with ICE/RICE rubric and convert top picks to work items</p>
          </div>
        </article>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover-elevate" data-testid={`session-${session.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <StatusBadge status={session.status} />
                    </div>
                    <CardDescription className="text-sm">{session.goal}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {session.template && (
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{session.template}</span>
                    </div>
                  )}
                  {session.startedAt && (
                    <div>
                      Started {format(new Date(session.startedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                  {session.endedAt && (
                    <div>
                      Ended {format(new Date(session.endedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Lightbulb}
              title="No brainstorm sessions yet"
              description="Create your first brainstorming session to start generating ideas with your team"
              action={{
                label: "Start New Session",
                onClick: () => {},
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
