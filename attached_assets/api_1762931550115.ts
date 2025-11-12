
export type ChatParticipant = { type: 'user'|'pod', id: string, role?: string, notify?: boolean };

export async function createConversation(input: {
  title: string;
  participants: ChatParticipant[];
  message?: { text: string; author_id?: string };
}) {
  const res = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(input),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function getConversationParticipants(id: number | string) {
  const res = await fetch(`/api/chat/conversations/${id}/participants`, { credentials:'include' });
  if (!res.ok) throw new Error('Failed to load participants');
  return res.json();
}
