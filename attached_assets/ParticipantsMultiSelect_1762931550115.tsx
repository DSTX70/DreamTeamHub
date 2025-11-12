
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { createConversation, type ChatParticipant } from '@/client/lib/chat/api';

type Option = { id:string; label:string };

export function ParticipantsMultiSelect({ people, pods, onCreated }:{
  people: Option[];
  pods: Option[];
  onCreated?: (conv:{ ok:boolean; id:number }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [selectedPods, setSelectedPods] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState('Fab Card Co — Website + Uploader (WO-001) Kickoff');
  const [posting, setPosting] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const filteredPeople = people.filter(p => p.label.toLowerCase().includes(query.toLowerCase()));
  const filteredPods = pods.filter(p => p.label.toLowerCase().includes(query.toLowerCase()));

  const toggle = (arr:string[], id:string, set:(v:string[])=>void) => {
    set(arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  };

  const onCreate = async () => {
    setPosting(true);
    try {
      const participants: ChatParticipant[] = [
        ...selectedUsers.map(id => ({ type:'user' as const, id })),
        ...selectedPods.map(id => ({ type:'pod' as const, id })),
      ];
      const resp = await createConversation({ title, participants, message: message ? { text: message } : undefined });
      onCreated?.(resp);
      setOpen(false);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Conversation title</Label>
      <Input value={title} onChange={(e)=>setTitle(e.target.value)} />

      <Label className="mt-3">Kickoff message</Label>
      <textarea className="w-full border rounded-md p-2 text-sm min-h-[120px]" value={message} onChange={(e)=>setMessage(e.target.value)} />

      <div className="flex items-center justify-between">
        <Label>Participants</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Add participants</Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-3" align="end">
            <Input placeholder="Search people/pods" value={query} onChange={(e)=>setQuery(e.target.value)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium mb-2">People</div>
                <ScrollArea className="h-48 pr-2">
                  {filteredPeople.map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-1">
                      <Checkbox checked={selectedUsers.includes(p.id)} onCheckedChange={()=>toggle(selectedUsers, p.id, setSelectedUsers)} />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">Pods</div>
                <ScrollArea className="h-48 pr-2">
                  {filteredPods.map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-1">
                      <Checkbox checked={selectedPods.includes(p.id)} onCheckedChange={()=>toggle(selectedPods, p.id, setSelectedPods)} />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedPods.map(id => <Badge key={`pod-${id}`} variant="secondary">Pod: {id}</Badge>)}
              {selectedUsers.map(id => <Badge key={`user-${id}`} variant="outline">{id}</Badge>)}
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={onCreate} disabled={posting || (selectedPods.length+selectedUsers.length)===0}>
                {posting ? 'Creating…' : 'Create conversation'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default ParticipantsMultiSelect;
