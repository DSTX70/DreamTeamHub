import { useQuery } from '@tanstack/react-query';
import { ParticipantsMultiSelect } from '@/components/chat/ParticipantsMultiSelect';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type Person = { id: number; name: string };
type Pod = { id: number; name: string };

export default function ChatTest() {
  const { toast } = useToast();
  const [lastConversation, setLastConversation] = useState<{ id: number } | null>(null);

  const { data: persons = [], isLoading: loadingPersons } = useQuery<Person[]>({
    queryKey: ['/api/persons'],
  });

  const { data: pods = [], isLoading: loadingPods } = useQuery<Pod[]>({
    queryKey: ['/api/pods'],
  });

  const handleConversationCreated = (conv: { ok: boolean; id: number }) => {
    if (conv.ok) {
      setLastConversation({ id: conv.id });
      toast({
        title: 'Success!',
        description: `Conversation created with ID: ${conv.id}`,
      });
    }
  };

  if (loadingPersons || loadingPods) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const peopleOptions = persons.map(p => ({ id: p.id, label: p.name }));
  const podOptions = pods.map(p => ({ id: p.id, label: p.name }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Participants Enhancement Test</h1>
        <p className="text-muted-foreground mt-2">
          Multi-select participants (people + pods) and create conversations with kickoff messages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantsMultiSelect
            people={peopleOptions}
            pods={podOptions}
            onCreated={handleConversationCreated}
            defaultTitle="Team Kickoff"
          />
        </CardContent>
      </Card>

      {lastConversation && (
        <Card>
          <CardHeader>
            <CardTitle>Last Created Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Conversation ID:</strong> {lastConversation.id}
              </p>
              <p className="text-sm text-muted-foreground">
                View participants at: <code className="bg-muted px-2 py-1 rounded">/api/chat/conversations/{lastConversation.id}/participants</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
