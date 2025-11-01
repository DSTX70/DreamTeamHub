import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, ArrowUpCircle, Plus, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

type Pod = {
  id: number;
  name: string;
  charter: string | null;
  threadId: string | null;
};

export default function SummonMirrorPage() {
  const { toast } = useToast();
  
  // Summon state
  const [summonPodId, setSummonPodId] = useState<number | null>(null);
  const [summonAsk, setSummonAsk] = useState("");
  const [summonDeliverables, setSummonDeliverables] = useState("");
  const [summonDue, setSummonDue] = useState("");
  const [summonOwner, setSummonOwner] = useState("");
  const [summonBackup, setSummonBackup] = useState("");

  // Mirror-Back state
  const [mirrorPodId, setMirrorPodId] = useState<number | null>(null);
  const [mirrorOutcome, setMirrorOutcome] = useState("");
  const [mirrorLinks, setMirrorLinks] = useState<string[]>([]);
  const [mirrorLinkInput, setMirrorLinkInput] = useState("");
  const [mirrorDecision, setMirrorDecision] = useState("");
  const [mirrorOwnerNext, setMirrorOwnerNext] = useState("");
  const [mirrorDecisionLogId, setMirrorDecisionLogId] = useState("");

  // Fetch pods
  const { data: pods, isLoading } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  // Post Summon mutation
  const summonMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('/api/comms/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post Summon');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Summon Posted",
        description: `Posted to ${data.podName} (${data.mode} mode)`,
      });
      // Reset form
      setSummonAsk("");
      setSummonDeliverables("");
      setSummonDue("");
      setSummonOwner("");
      setSummonBackup("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Post Mirror-Back mutation
  const mirrorMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('/api/comms/mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post Mirror-Back');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Mirror-Back Posted",
        description: `Posted to ${data.podName} (${data.mode} mode)`,
      });
      // Reset form
      setMirrorOutcome("");
      setMirrorLinks([]);
      setMirrorDecision("");
      setMirrorOwnerNext("");
      setMirrorDecisionLogId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePostSummon = () => {
    if (!summonPodId || !summonAsk || !summonDeliverables || !summonDue || !summonOwner) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    summonMutation.mutate({
      podId: summonPodId,
      ask: summonAsk,
      deliverables: summonDeliverables,
      due: summonDue,
      owner: summonOwner,
      backup: summonBackup || undefined,
    });
  };

  const handlePostMirror = () => {
    if (!mirrorPodId || !mirrorOutcome) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mirrorMutation.mutate({
      podId: mirrorPodId,
      outcome: mirrorOutcome,
      links: mirrorLinks,
      decision: mirrorDecision || undefined,
      ownerNext: mirrorOwnerNext || undefined,
      decisionLogId: mirrorDecisionLogId ? parseInt(mirrorDecisionLogId) : undefined,
    });
  };

  const addLink = () => {
    if (mirrorLinkInput.trim()) {
      setMirrorLinks([...mirrorLinks, mirrorLinkInput.trim()]);
      setMirrorLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    setMirrorLinks(mirrorLinks.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Summon & Mirror-Back</h1>
        <p className="text-muted-foreground mt-1">
          Post structured updates to Pod canonical threads
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Summon Card */}
        <article className="role-card">
          {/* Teal rail at top (Intake pod color - Summon) */}
          <div className="rail pod-rail intake h-1.5" />
          <div className="inner">
            <h2 className="text-lg font-grotesk text-text-primary mb-2">Post Summon</h2>
            <p className="text-sm text-text-secondary mb-4">
              Summon a Pod with a specific ask and deliverables
            </p>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summon-pod">Pod *</Label>
              <Select value={summonPodId?.toString()} onValueChange={(val) => setSummonPodId(parseInt(val))}>
                <SelectTrigger id="summon-pod" data-testid="select-summon-pod">
                  <SelectValue placeholder="Select a pod..." />
                </SelectTrigger>
                <SelectContent>
                  {pods?.map((pod) => (
                    <SelectItem key={pod.id} value={pod.id.toString()} data-testid={`option-summon-pod-${pod.id}`}>
                      {pod.name} {!pod.threadId && "(⚠️ No thread)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summon-ask">Ask *</Label>
              <Textarea
                id="summon-ask"
                data-testid="input-summon-ask"
                value={summonAsk}
                onChange={(e) => setSummonAsk(e.target.value)}
                placeholder="What are you asking the Pod to do?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summon-deliverables">Deliverables *</Label>
              <Textarea
                id="summon-deliverables"
                data-testid="input-summon-deliverables"
                value={summonDeliverables}
                onChange={(e) => setSummonDeliverables(e.target.value)}
                placeholder="What outputs do you expect?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summon-due">Due *</Label>
              <Input
                id="summon-due"
                data-testid="input-summon-due"
                value={summonDue}
                onChange={(e) => setSummonDue(e.target.value)}
                placeholder="e.g., Friday EOD, Next sprint"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summon-owner">Owner *</Label>
              <Input
                id="summon-owner"
                data-testid="input-summon-owner"
                value={summonOwner}
                onChange={(e) => setSummonOwner(e.target.value)}
                placeholder="Who is responsible?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summon-backup">Backup (Optional)</Label>
              <Input
                id="summon-backup"
                data-testid="input-summon-backup"
                value={summonBackup}
                onChange={(e) => setSummonBackup(e.target.value)}
                placeholder="Backup person (if any)"
              />
            </div>

            <Button
              onClick={handlePostSummon}
              disabled={summonMutation.isPending}
              className="w-full"
              data-testid="button-post-summon"
            >
              {summonMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Post Summon
                </>
              )}
            </Button>
            </div>
          </div>
        </article>

        {/* Mirror-Back Card */}
        <article className="role-card">
          {/* Blue rail at top (Control pod color - Mirror-Back) */}
          <div className="rail pod-rail control h-1.5" />
          <div className="inner">
            <h2 className="text-lg font-grotesk text-text-primary mb-2">Post Mirror-Back</h2>
            <p className="text-sm text-text-secondary mb-4">
              Report back on outcomes and next steps
            </p>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mirror-pod">Pod *</Label>
              <Select value={mirrorPodId?.toString()} onValueChange={(val) => setMirrorPodId(parseInt(val))}>
                <SelectTrigger id="mirror-pod" data-testid="select-mirror-pod">
                  <SelectValue placeholder="Select a pod..." />
                </SelectTrigger>
                <SelectContent>
                  {pods?.map((pod) => (
                    <SelectItem key={pod.id} value={pod.id.toString()} data-testid={`option-mirror-pod-${pod.id}`}>
                      {pod.name} {!pod.threadId && "(⚠️ No thread)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mirror-outcome">Outcome *</Label>
              <Textarea
                id="mirror-outcome"
                data-testid="input-mirror-outcome"
                value={mirrorOutcome}
                onChange={(e) => setMirrorOutcome(e.target.value)}
                placeholder="What was accomplished?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Links</Label>
              <div className="flex gap-2">
                <Input
                  value={mirrorLinkInput}
                  onChange={(e) => setMirrorLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="Add a link..."
                  data-testid="input-mirror-link"
                />
                <Button onClick={addLink} size="icon" variant="outline" data-testid="button-add-link">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {mirrorLinks.length > 0 && (
                <div className="space-y-1">
                  {mirrorLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="flex-1 justify-between">
                        <span className="truncate">{link}</span>
                        <button onClick={() => removeLink(index)} className="ml-2" data-testid={`button-remove-link-${index}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mirror-decision">Decision (Optional)</Label>
              <Textarea
                id="mirror-decision"
                data-testid="input-mirror-decision"
                value={mirrorDecision}
                onChange={(e) => setMirrorDecision(e.target.value)}
                placeholder="Any key decisions made?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mirror-owner-next">Owner/Next (Optional)</Label>
              <Input
                id="mirror-owner-next"
                data-testid="input-mirror-owner-next"
                value={mirrorOwnerNext}
                onChange={(e) => setMirrorOwnerNext(e.target.value)}
                placeholder="Who owns the next steps?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mirror-decision-log-id">Decision Log ID (Optional)</Label>
              <Input
                id="mirror-decision-log-id"
                data-testid="input-mirror-decision-log-id"
                type="number"
                value={mirrorDecisionLogId}
                onChange={(e) => setMirrorDecisionLogId(e.target.value)}
                placeholder="Link to decision log entry"
              />
            </div>

            <Button
              onClick={handlePostMirror}
              disabled={mirrorMutation.isPending}
              className="w-full"
              data-testid="button-post-mirror"
            >
              {mirrorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Post Mirror-Back
                </>
              )}
            </Button>
            </div>
          </div>
        </article>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">About Summon & Mirror-Back</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Summon:</strong> Request action from a Pod with clear deliverables, deadlines, and ownership.
          </p>
          <p>
            <strong>Mirror-Back:</strong> Report completion with outcomes, artifacts, decisions, and next steps.
          </p>
          <p className="text-muted-foreground">
            When <code>USE_OPENAI=1</code> and Pods have a thread_id, messages post to OpenAI Threads. Otherwise, they log to the console (safe fallback).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
