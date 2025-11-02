import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Pod, Person } from "@shared/schema";
import { getPodRailClass } from "@/lib/pod-utils";

export default function Pods() {
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [showPodDialog, setShowPodDialog] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personHandle, setPersonHandle] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personPodId, setPersonPodId] = useState<number | null>(null);
  const [podName, setPodName] = useState('');
  const [podCharter, setPodCharter] = useState('');
  const { toast } = useToast();

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

  const createPersonMutation = useMutation({
    mutationFn: (data: { name: string; handle: string; email: string; podId: number }) =>
      apiRequest('POST', '/api/persons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      setShowPersonDialog(false);
      setPersonName('');
      setPersonHandle('');
      setPersonEmail('');
      setPersonPodId(null);
      toast({
        title: 'Person added',
        description: 'Team member has been added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add person',
        variant: 'destructive',
      });
    },
  });

  const createPodMutation = useMutation({
    mutationFn: (data: { name: string; charter?: string }) =>
      apiRequest('POST', '/api/pods', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pods'] });
      setShowPodDialog(false);
      setPodName('');
      setPodCharter('');
      toast({
        title: 'Pod created',
        description: 'New pod has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pod',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePerson = () => {
    if (!personName || !personHandle || !personEmail || !personPodId) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createPersonMutation.mutate({
      name: personName,
      handle: personHandle,
      email: personEmail,
      podId: personPodId,
    });
  };

  const handleCreatePod = () => {
    if (!podName) {
      toast({
        title: 'Missing field',
        description: 'Please provide a pod name',
        variant: 'destructive',
      });
      return;
    }

    createPodMutation.mutate({
      name: podName,
      charter: podCharter || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="page-title">Pods & Persons</h1>
          <p className="text-sm text-muted-foreground">Manage organizational pods and team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPersonDialog(true)} data-testid="button-create-person">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
          <Button onClick={() => setShowPodDialog(true)} data-testid="button-create-pod">
            <Plus className="h-4 w-4 mr-2" />
            Create Pod
          </Button>
        </div>
      </div>

      {/* Add Person Dialog */}
      <Dialog open={showPersonDialog} onOpenChange={setShowPersonDialog}>
        <DialogContent data-testid="dialog-create-person">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="person-name">Full Name</Label>
              <Input
                id="person-name"
                data-testid="input-person-name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g., Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="person-handle">Handle</Label>
              <Input
                id="person-handle"
                data-testid="input-person-handle"
                value={personHandle}
                onChange={(e) => setPersonHandle(e.target.value)}
                placeholder="e.g., jane_smith"
              />
            </div>
            <div>
              <Label htmlFor="person-email">Email</Label>
              <Input
                id="person-email"
                type="email"
                data-testid="input-person-email"
                value={personEmail}
                onChange={(e) => setPersonEmail(e.target.value)}
                placeholder="e.g., jane@example.com"
              />
            </div>
            <div>
              <Label htmlFor="person-pod">Pod</Label>
              <Select value={personPodId?.toString()} onValueChange={(val) => setPersonPodId(parseInt(val))}>
                <SelectTrigger id="person-pod" data-testid="select-person-pod">
                  <SelectValue placeholder="Select a pod..." />
                </SelectTrigger>
                <SelectContent>
                  {pods?.map(pod => (
                    <SelectItem key={pod.id} value={pod.id.toString()} data-testid={`option-pod-${pod.id}`}>
                      {pod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreatePerson}
              disabled={!personName || !personHandle || !personEmail || !personPodId || createPersonMutation.isPending}
              className="w-full"
              data-testid="button-submit-person"
            >
              {createPersonMutation.isPending ? 'Adding...' : 'Add Person'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Pod Dialog */}
      <Dialog open={showPodDialog} onOpenChange={setShowPodDialog}>
        <DialogContent data-testid="dialog-create-pod">
          <DialogHeader>
            <DialogTitle>Create New Pod</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pod-name">Pod Name</Label>
              <Input
                id="pod-name"
                data-testid="input-pod-name"
                value={podName}
                onChange={(e) => setPodName(e.target.value)}
                placeholder="e.g., Marketing & Communications"
              />
            </div>
            <div>
              <Label htmlFor="pod-charter">Charter (Optional)</Label>
              <Textarea
                id="pod-charter"
                data-testid="input-pod-charter"
                value={podCharter}
                onChange={(e) => setPodCharter(e.target.value)}
                placeholder="Describe the pod's mission and responsibilities..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreatePod}
              disabled={!podName || createPodMutation.isPending}
              className="w-full"
              data-testid="button-submit-pod"
            >
              {createPodMutation.isPending ? 'Creating...' : 'Create Pod'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                onClick: () => setShowPodDialog(true),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
