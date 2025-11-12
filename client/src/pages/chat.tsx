import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare, Plus, Upload, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RoleCard, Conversation, Message } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getPodColor } from '@/lib/pod-utils';

export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newConvTitle, setNewConvTitle] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const { toast } = useToast();

  // Load conversation from URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('c');
    if (conversationId) {
      setSelectedConversationId(parseInt(conversationId));
    }
  }, []);

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
    mutationFn: async (data: { title: string; roleHandles: string[]; userId?: number | null }) => {
      const response = await apiRequest('POST', '/api/conversations', data);
      return response as unknown as Conversation;
    },
    onSuccess: (newConversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      selectConversation(newConversation.id);
      setIsDialogOpen(false);
      setNewConvTitle('');
      setSelectedRoles([]);
      setRoleSearchQuery('');
      toast({
        title: 'Conversation started',
        description: `Now chatting with ${selectedRoles.length} Dream Team member${selectedRoles.length > 1 ? 's' : ''}`,
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
    if (!newConvTitle.trim() || selectedRoles.length === 0) return;
    createConversationMutation.mutate({
      title: newConvTitle,
      roleHandles: selectedRoles,
      userId: null,
    });
  };

  const toggleRole = (handle: string) => {
    setSelectedRoles(prev =>
      prev.includes(handle)
        ? prev.filter(h => h !== handle)
        : [...prev, handle]
    );
  };

  // Update URL and state when selecting a conversation
  const selectConversation = (id: number) => {
    setSelectedConversationId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('c', String(id));
    window.history.replaceState({}, '', url.toString());
  };

  // Copy permalink to clipboard
  const copyPermalink = () => {
    if (!selectedConversationId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('c', String(selectedConversationId));
    navigator.clipboard.writeText(url.toString());
    toast({
      title: 'Link copied',
      description: 'Conversation permalink copied to clipboard',
    });
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const selectedRoleCard = roleCards.find(r => r.handle === selectedConversation?.roleHandle);

  // Get unique pods from conversations for the pod chip legend
  const uniquePods = Array.from(new Set(
    conversations
      .map(c => roleCards.find(r => r.handle === c.roleHandle)?.pod)
      .filter(Boolean)
  )) as string[];

  return (
    <div className="flex flex-col h-screen">
      {/* Header with Orchestra Gradient */}
      <header className="bg-grad-orchestra px-6 py-4">
        <h1 className="text-2xl font-grotesk text-white font-semibold">
          Dream Team Chat
        </h1>
        <p className="text-sm text-white/80 font-inter">
          Header uses Orchestra gradient (Teal→Indigo)
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <aside className="w-96 bg-brand-surface border-r border-brand-line flex flex-col">
          {/* Pink rail at top */}
          <div className="h-1.5 bg-pod-brand" />
          
          <div className="p-4 flex items-center justify-between border-b border-brand-line">
            <h2 className="text-lg font-grotesk text-text-primary">Conversations</h2>
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
                      placeholder="e.g., Marketing Strategy Chat"
                    />
                  </div>
                  <div>
                    <Label>Dream Team Members ({selectedRoles.length} selected)</Label>
                    <Input
                      placeholder="Search personas..."
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      className="mb-2"
                      data-testid="input-search-roles"
                    />
                    <ScrollArea className="h-64 border rounded-md p-2">
                      <div className="space-y-1">
                        {roleCards
                          .filter(role => 
                            role.handle.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                            role.title?.toLowerCase().includes(roleSearchQuery.toLowerCase())
                          )
                          .map(role => (
                            <div
                              key={role.id}
                              className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                              onClick={() => toggleRole(role.handle)}
                              data-testid={`role-option-${role.handle}`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.handle)}
                                onChange={() => toggleRole(role.handle)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                                data-testid={`checkbox-role-${role.handle}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{role.handle}</div>
                                <div className="text-xs text-text-muted">{role.title}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <Button
                    onClick={handleCreateConversation}
                    disabled={!newConvTitle.trim() || selectedRoles.length === 0 || createConversationMutation.isPending}
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
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-sm text-text-muted">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => {
                  const roleCard = roleCards.find(r => r.handle === conv.roleHandle);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      data-testid={`conversation-${conv.id}`}
                      className={`w-full text-left p-3 rounded-md transition-colors hover-elevate ${
                        selectedConversationId === conv.id
                          ? 'bg-glass border border-glass'
                          : 'border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-text-primary truncate mb-1">
                        {conv.title}
                      </div>
                      <div className="text-xs text-text-secondary truncate">
                        {roleCard?.pod || conv.roleHandle}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Pod Chips at Bottom */}
          {uniquePods.length > 0 && (
            <div className="p-4 border-t border-brand-line">
              <div className="flex flex-wrap gap-2">
                {uniquePods.map(pod => {
                  const podClass = pod.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
                  return (
                    <span
                      key={pod}
                      className={`chip chip-pod-${podClass}`}
                    >
                      {pod} pod chip
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-brand-dark">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-brand-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-core-teal text-brand-dark font-semibold">
                        {selectedConversation.roleHandle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-grotesk text-text-primary">
                        {selectedConversation.roleHandle}
                      </h3>
                      {selectedRoleCard && (
                        <p className="text-sm text-text-secondary">
                          {selectedRoleCard.title} • {selectedRoleCard.pod}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPermalink}
                    data-testid="button-copy-link"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Copy link
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-sm text-text-secondary">
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
                              ? 'bg-core-teal text-brand-dark'
                              : 'bg-brand-surface border border-brand-line'
                          }`}
                        >
                          <p className={`text-sm whitespace-pre-wrap ${
                            msg.role === 'user' ? 'text-brand-dark' : 'text-text-primary'
                          }`}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-brand-surface border border-brand-line rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-brand-line p-4">
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
                    className="bg-brand-surface border-brand-line"
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
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="mb-6 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-brand-line flex items-center justify-center bg-brand-surface">
                    <MessageSquare className="h-10 w-10 text-text-muted" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-grotesk text-text-primary mb-2">
                  Select a conversation
                </h2>
                <p className="text-text-secondary mb-6">
                  or create a new one to start chatting
                </p>

                <div className="flex items-center justify-center gap-3 mb-8">
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    data-testid="button-empty-new-conversation"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New conversation
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import transcript
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-text-muted uppercase tracking-wide">
                    Token legend uses your CSS vars (no hard-coded colors):
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded bg-brand-orange border border-brand-line" title="Orange" />
                    <div className="w-8 h-8 rounded bg-brand-magenta border border-brand-line" title="Magenta" />
                    <div className="w-8 h-8 rounded bg-core-teal border border-brand-line" title="Teal" />
                    <div className="w-8 h-8 rounded bg-core-indigo border border-brand-line" title="Indigo" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
