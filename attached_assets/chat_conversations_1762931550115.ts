
import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db';

export const chatConversationsRouter = Router();

type Participant = { type: 'user'|'pod', id: string, role?: string, notify?: boolean };

async function expandParticipants(participants: Participant[]) {
  const users: { id:string, role?:string, notify?:boolean }[] = [];
  const pods: { id:string, role?:string, notify?:boolean }[] = [];
  for (const p of participants || []) {
    if (p.type === 'user') {
      users.push({ id:p.id, role: p.role, notify: p.notify });
    } else if (p.type === 'pod') {
      pods.push({ id:p.id, role: p.role, notify: p.notify });
      const res = await pool.query(`SELECT user_id FROM pod_members WHERE pod_id = $1`, [p.id]);
      for (const row of res.rows) {
        users.push({ id: row.user_id, role: p.role, notify: p.notify });
      }
    }
  }
  return { users, pods };
}

chatConversationsRouter.post('/chat/conversations', async (req: Request, res: Response) => {
  const { title, participants, message } = req.body || {};
  if (!title) return res.status(400).json({ ok:false, error:'title required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const conv = await client.query(
      `INSERT INTO conversations (title, created_by) VALUES ($1, $2) RETURNING id`,
      [title, (req as any).user?.id || null]
    );
    const conversationId = conv.rows[0].id;

    const { users, pods } = await expandParticipants(Array.isArray(participants) ? participants : []);

    for (const p of pods) {
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, principal_type, principal_id, role, notify, added_by)
         VALUES ($1,'pod',$2,$3,COALESCE($4,true),$5)
         ON CONFLICT (conversation_id, principal_type, principal_id) DO NOTHING`,
        [conversationId, p.id, p.role || 'member', p.notify, (req as any).user?.id || null]
      );
    }
    for (const u of users) {
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, principal_type, principal_id, role, notify, added_by)
         VALUES ($1,'user',$2,$3,COALESCE($4,true),$5)
         ON CONFLICT (conversation_id, principal_type, principal_id) DO NOTHING`,
        [conversationId, u.id, u.role || 'member', u.notify, (req as any).user?.id || null]
      );
    }

    if (message?.text) {
      await client.query(
        `INSERT INTO conversation_messages (conversation_id, author_id, body, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [conversationId, message.author_id || (req as any).user?.id || null, message.text]
      );
    }

    await client.query('COMMIT');
    res.json({ ok:true, id: conversationId });
  } catch (e:any) {
    await client.query('ROLLBACK');
    res.status(500).json({ ok:false, error: e.message });
  } finally {
    client.release();
  }
});

chatConversationsRouter.get('/chat/conversations/:id/participants', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT conversation_id, principal_type, principal_id, role, notify, added_at
       FROM conversation_participants WHERE conversation_id = $1 ORDER BY principal_type, principal_id`, [id]);
    res.json({ ok:true, participants: rows });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e.message });
  }
});
