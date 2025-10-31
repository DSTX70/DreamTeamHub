import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RoleCard, Conversation, Message } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newConvTitle, setNewConvTitle] = useState('');
  const [newConvRole, setNewConvRole] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all role cards for persona selection
  const { data: roleCards = [] } = useQuery<RoleCard[]>({
    queryKey: ['/api/roles'],
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversationId, 'messages'],
    enabled: selectedConversationId !== null,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; roleHandle: string; userId?: number | null }) =>
      apiRequest('POST', '/api/conversations', data) as Promise<Conversation>,
    onSuccess: (newConversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setSelectedConversationId(newConversation.id);
      setIsDialogOpen(false);
      setNewConvTitle('');
      setNewConvRole('');
      toast({
        title: 'Conversation started',
        description: `Now chatting with ${newConversation.roleHandle}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create conversation',
        variant: 'destructive',
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) =>
      apiRequest('POST', `/api/conversations/${selectedConversationId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessageInput('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleCreateConversation = () => {
    if (!newConvTitle.trim() || !newConvRole) return;
    createConversationMutation.mutate({
      title: newConvTitle,
      roleHandle: newConvRole,
      userId: null,
    });
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const selectedRoleCard = roleCards.find(r => r.handle === selectedConversation?.roleHandle);

  return (
    <div className="flex h-full gap-4 p-6">
      {/* Conversations Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Conversations</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-new-conversation">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-new-conversation">
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Conversation Title</Label>
                  <Input
                    id="title"
                    data-testid="input-conversation-title"
                    value={newConvTitle}
                    onChange={(e) => setNewConvTitle(e.target.value)}
                    placeholder="e.g., Q1 Strategy Discussion"
                  />
                </div>
                <div>
                  <Label htmlFor="persona">Dream Team Member</Label>
                  <Select value={newConvRole} onValueChange={setNewConvRole}>
                    <SelectTrigger id="persona" data-testid="select-persona">
                      <SelectValue placeholder="Select a persona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roleCards.map(role => (
                        <SelectItem key={role.id} value={role.handle} data-testid={`option-persona-${role.handle}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{role.handle}</span>
                            <span className="text-sm text-muted-foreground">- {role.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateConversation}
                  disabled={!newConvTitle.trim() || !newConvRole || createConversationMutation.isPending}
                  className="w-full"
                  data-testid="button-start-conversation"
                >
                  {createConversationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Start Conversation'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="space-y-2 p-4 pt-0">
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No conversations yet
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  data-testid={`conversation-${conv.id}`}
                  className={`w-full text-left p-3 rounded-md transition-colors hover-elevate ${
                    selectedConversationId === conv.id
                      ? 'bg-accent'
                      : 'bg-card'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {conv.roleHandle}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedConversation.roleHandle.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{selectedConversation.roleHandle}</CardTitle>
                  {selectedRoleCard && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRoleCard.title} • {selectedRoleCard.pod}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Start the conversation by sending a message below
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.id}`}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <CardContent className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  data-testid="input-message"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">or create a new one to start chatting</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
