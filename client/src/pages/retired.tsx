import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Archive } from "lucide-react";

export default function RetiredPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Legacy route retired
          </CardTitle>
          <CardDescription>
            This page is part of legacy commerce/retail ops and is no longer in the DreamTeamHub default workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe you still need this, enable Pro mode and use the orchestration Ops tools. If this route must remain,
            it should be migrated into the appropriate commerce shell.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/intent")} data-testid="button-go-to-intent">Go to Intent</Button>
            <Button variant="outline" onClick={() => setLocation("/help")} data-testid="button-open-help">Open Help</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
