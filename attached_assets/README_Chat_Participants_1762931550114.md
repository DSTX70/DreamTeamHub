
# Chat Participants Enhancement (Multi-select + Pods)

This package adds multi-select participants and pod adds for conversations.

## Files
- `migrations/003_chat_conversation_participants.sql`
- `app/server/routes/chat_conversations.ts`
- `app/client/lib/chat/api.ts`
- `app/client/components/chat/ParticipantsMultiSelect.tsx`

## Steps
1) Run migration:
```bash
psql "$DATABASE_URL" -f migrations/003_chat_conversation_participants.sql
```
2) Mount routes:
```ts
import { chatConversationsRouter } from './routes/chat_conversations';
app.use('/api', chatConversationsRouter);
```
3) Use the UI component:
```tsx
<ParticipantsMultiSelect
  people={[{id:'storybloom',label:'Storybloom'},{id:'prism',label:'Prism'},{id:'nova',label:'Nova'},{id:'dustin',label:'Dustin'}]}
  pods={[{id:'fab-card-co',label:'Fab Card Co'}]}
  onCreated={(c)=>console.log('created', c)}
/>
```
4) API direct:
```bash
curl -s -X POST http://localhost:5000/api/chat/conversations   -H 'Content-Type: application/json'   -d '{"title":"Fab Card Co — Website + Uploader (WO-001) Kickoff","participants":[{"type":"user","id":"storybloom"},{"type":"user","id":"prism"},{"type":"user","id":"nova"},{"type":"user","id":"dustin"},{"type":"pod","id":"fab-card-co"}]}' | jq
```
