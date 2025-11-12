import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createConversation, type ChatParticipant } from '@/lib/chat/api';

type Option = { id:number; label:string };

export function ParticipantsMultiSelect({ people, pods, onCreated, defaultTitle }:{
  people: Option[];
  pods: Option[];
  onCreated?: (conv:{ ok:boolean; id:number }) => void;
  defaultTitle?: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedPods, setSelectedPods] = useState<number[]>([]);
  const [title, setTitle] = useState(defaultTitle || 'New Conversation');
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');

  const filteredPeople = people.filter(p => p.label.toLowerCase().includes(query.toLowerCase()));
  const filteredPods = pods.filter(p => p.label.toLowerCase().includes(query.toLowerCase()));

  const toggle = (arr:number[], id:number, set:(v:number[])=>void) => {
    set(arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  };

  const onCreate = async () => {
    if ((selectedPods.length + selectedUsers.length) === 0) {
      toast({
        title: 'No participants',
        description: 'Please select at least one participant',
        variant: 'destructive',
      });
      return;
    }

    setPosting(true);
    try {
      const participants: ChatParticipant[] = [
        ...selectedUsers.map(id => ({ type:'user' as const, id })),
        ...selectedPods.map(id => ({ type:'pod' as const, id })),
      ];
      const resp = await createConversation({ title, participants, message: message ? { text: message } : undefined });
      
      // Close popover and reset state first
      setOpen(false);
      setSelectedUsers([]);
      setSelectedPods([]);
      setMessage('');
      
      // Then show success feedback and call callback
      toast({
        title: 'Conversation created',
        description: `Successfully created "${title}"`,
      });
      onCreated?.(resp);
    } catch (error: any) {
      toast({
        title: 'Failed to create conversation',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  };

  const selectedPeopleLabels = people.filter(p => selectedUsers.includes(p.id));
  const selectedPodLabels = pods.filter(p => selectedPods.includes(p.id));

  return (
    <div className="space-y-3" data-testid="participants-multiselect">
      <div>
        <Label htmlFor="conv-title">Conversation title</Label>
        <Input 
          id="conv-title"
          value={title} 
          onChange={(e)=>setTitle(e.target.value)} 
          data-testid="input-conversation-title"
        />
      </div>

      <div>
        <Label htmlFor="kickoff-message">Kickoff message (optional)</Label>
        <textarea 
          id="kickoff-message"
          className="w-full border rounded-md p-2 text-sm min-h-[120px]" 
          value={message} 
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Enter an initial message for the conversation..."
          data-testid="input-kickoff-message"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Participants ({selectedUsers.length + selectedPods.length} selected)</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" data-testid="button-add-participants">Add participants</Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-3" align="end">
            <Input 
              placeholder="Search people/pods" 
              value={query} 
              onChange={(e)=>setQuery(e.target.value)}
              data-testid="input-search-participants"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium mb-2">People</div>
                <ScrollArea className="h-48 pr-2">
                  {filteredPeople.map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer hover-elevate">
                      <Checkbox 
                        checked={selectedUsers.includes(p.id)} 
                        onCheckedChange={()=>toggle(selectedUsers, p.id, setSelectedUsers)}
                        data-testid={`checkbox-person-${p.id}`}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">Pods</div>
                <ScrollArea className="h-48 pr-2">
                  {filteredPods.map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer hover-elevate">
                      <Checkbox 
                        checked={selectedPods.includes(p.id)} 
                        onCheckedChange={()=>toggle(selectedPods, p.id, setSelectedPods)}
                        data-testid={`checkbox-pod-${p.id}`}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 min-h-[32px]">
              {selectedPodLabels.map(p => (
                <Badge key={`pod-${p.id}`} variant="secondary" data-testid={`badge-pod-${p.id}`}>
                  Pod: {p.label}
                </Badge>
              ))}
              {selectedPeopleLabels.map(p => (
                <Badge key={`user-${p.id}`} variant="outline" data-testid={`badge-person-${p.id}`}>
                  {p.label}
                </Badge>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-popover"
              >
                Close
              </Button>
              <Button 
                onClick={onCreate} 
                disabled={posting || (selectedPods.length+selectedUsers.length)===0}
                data-testid="button-create-conversation-popover"
              >
                {posting ? 'Creating…' : 'Done'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {(selectedUsers.length > 0 || selectedPods.length > 0) && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
          {selectedPodLabels.map(p => (
            <Badge key={`selected-pod-${p.id}`} variant="secondary">
              Pod: {p.label}
            </Badge>
          ))}
          {selectedPeopleLabels.map(p => (
            <Badge key={`selected-user-${p.id}`} variant="outline">
              {p.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParticipantsMultiSelect;
