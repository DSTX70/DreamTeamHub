import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Target } from "lucide-react";

type Autonomy = "guided" | "standard" | "autonomous";

function buildTitle(intent: string): string {
  const clean = intent.trim().replace(/\s+/g, " ");
  if (!clean) return "New work item";
  return clean.length <= 80 ? clean : `${clean.slice(0, 77)}...`;
}

export default function IntentConsolePage() {
  const [intent, setIntent] = useState("");
  const [autonomy, setAutonomy] = useState<Autonomy>("standard");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const title = useMemo(() => buildTitle(intent), [intent]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: intent
          ? `Intent: ${intent.trim()}\n\nAutonomy: ${autonomy.toUpperCase()}`
          : `Autonomy: ${autonomy.toUpperCase()}`,
        status: "todo",
        priority: "medium",
      };
      return apiRequest("POST", "/api/work-items", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/work-items"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/control/dashboard"] });
      toast({
        title: "Queued",
        description: "Your intent was converted into a governed work item.",
      });
      setIntent("");
      setLocation("/work-orders");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not create a work item from that intent.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">
          Intent
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell the system what you want to accomplish. The hub routes it, applies governance, and produces verified artifacts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What are you trying to accomplish?
          </CardTitle>
          <CardDescription>
            You don't need to pick a pod or a persona. If you want internals, toggle Advanced mode in the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Intent</label>
            <Textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Simplify the DreamTeamHub sidebar and hide pods/personas by default."
              className="min-h-32"
              data-testid="intent-textarea"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Autonomy</label>
              <Select value={autonomy} onValueChange={(v) => setAutonomy(v as Autonomy)}>
                <SelectTrigger data-testid="intent-autonomy">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guided">Guided</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="autonomous">Autonomous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Work item title (auto)</label>
              <div
                className="h-10 px-3 flex items-center rounded-md border bg-muted/40 text-sm text-muted-foreground"
                data-testid="intent-title-preview"
              >
                {title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!intent.trim() || createMutation.isPending}
              data-testid="intent-submit"
            >
              Create Work Item
            </Button>
            <Button variant="outline" onClick={() => setLocation("/work-orders")} data-testid="intent-go-work">
              Go to Work
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
