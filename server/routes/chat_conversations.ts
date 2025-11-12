import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export const chatConversationsRouter = Router();

type Participant = { type: 'user'|'pod', id: number, role?: string, notify?: boolean };

async function expandParticipants(participants: Participant[]) {
  const users: { id:number, role?:string, notify?:boolean }[] = [];
  const pods: { id:number, role?:string, notify?:boolean }[] = [];
  
  for (const p of participants || []) {
    if (p.type === 'user') {
      users.push({ id:p.id, role: p.role, notify: p.notify });
    } else if (p.type === 'pod') {
      pods.push({ id:p.id, role: p.role, notify: p.notify });
      const podMembers = await db.execute(sql`SELECT user_id FROM pod_members WHERE pod_id = ${p.id}`);
      for (const row of podMembers.rows as any[]) {
        users.push({ id: row.user_id, role: p.role, notify: p.notify });
      }
    }
  }
  return { users, pods };
}

chatConversationsRouter.post('/chat/conversations', async (req: Request, res: Response) => {
  const { title, participants, message } = req.body || {};
  if (!title) return res.status(400).json({ ok:false, error:'title required' });

  try {
    await db.execute(sql`BEGIN`);
    
    const convResult = await db.execute(
      sql`INSERT INTO conversations (title, created_at) VALUES (${title}, NOW()) RETURNING id`
    );
    const conversationId = (convResult.rows[0] as any).id;

    const { users, pods } = await expandParticipants(Array.isArray(participants) ? participants : []);

    for (const p of pods) {
      await db.execute(
        sql`INSERT INTO conversation_participants (conversation_id, principal_type, principal_id, role, notify, added_by)
         VALUES (${conversationId},'pod',${p.id},${p.role || 'member'},COALESCE(${p.notify}, true),${(req as any).user?.id || null})
         ON CONFLICT (conversation_id, principal_type, principal_id) DO NOTHING`
      );
    }
    
    for (const u of users) {
      await db.execute(
        sql`INSERT INTO conversation_participants (conversation_id, principal_type, principal_id, role, notify, added_by)
         VALUES (${conversationId},'user',${u.id},${u.role || 'member'},COALESCE(${u.notify}, true),${(req as any).user?.id || null})
         ON CONFLICT (conversation_id, principal_type, principal_id) DO NOTHING`
      );
    }

    if (message?.text) {
      await db.execute(
        sql`INSERT INTO conversation_messages (conversation_id, author_id, body, created_at)
         VALUES (${conversationId}, ${message.author_id || (req as any).user?.id || null}, ${message.text}, NOW())`
      );
    }

    await db.execute(sql`COMMIT`);
    res.json({ ok:true, id: conversationId });
  } catch (e:any) {
    await db.execute(sql`ROLLBACK`);
    console.error('Error creating conversation:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

chatConversationsRouter.get('/chat/conversations/:id/participants', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await db.execute(
      sql`SELECT conversation_id, principal_type, principal_id, role, notify, added_at
       FROM conversation_participants WHERE conversation_id = ${id} ORDER BY principal_type, principal_id`
    );
    res.json({ ok:true, participants: result.rows });
  } catch (e:any) {
    console.error('Error fetching participants:', e);
    res.status(500).json({ ok:false, error: e.message });
  }
});
