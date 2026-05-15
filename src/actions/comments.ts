'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { comments, tickets, users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { copy } from '@/lib/copy';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

const commentSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function addComment(ticketCode: string, formData: FormData) {
  const user = await requireAuth();

  const parsed = commentSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) return { error: copy.validation.invalidComment };

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.code, ticketCode))
    .limit(1);

  if (!ticket) return { error: copy.validation.invalidTicket };

  await db.insert(comments).values({
    ticketId: ticket.id,
    authorId: user.id,
    body: parsed.data.body,
  });

  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.code, ticketCode));

  revalidatePath(`/tickets/${ticketCode}`);
  return { ok: true };
}

export async function getComments(ticketCode: string) {
  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.code, ticketCode))
    .limit(1);

  if (!ticket) return [];

  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.displayName,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.ticketId, ticket.id))
    .orderBy(asc(comments.createdAt));
}
