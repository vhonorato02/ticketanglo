'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, ticketHistory } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!(session.user as { isAdmin?: boolean }).isAdmin) redirect('/');
  return session.user;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

export async function getUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    isAdmin: users.isAdmin,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.createdAt));
}

const createUserSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _'),
  displayName: z.string().min(2).max(60),
  password: z.string().min(6),
  isAdmin: z.boolean().default(false),
});

export async function createUser(formData: FormData) {
  await requireAdmin();

  const raw = {
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    password: formData.get('password'),
    isAdmin: formData.get('isAdmin') === 'true',
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, parsed.data.username)).limit(1);
  if (existing.length > 0) return { error: 'Nome de usuário já existe.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.insert(users).values({
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    passwordHash,
    isAdmin: parsed.data.isAdmin,
  });

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function toggleUserActive(userId: string) {
  const currentUser = await requireAdmin();
  if (currentUser.id === userId) return { error: 'Você não pode desativar sua própria conta.' };

  const [user] = await db.select({ isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { error: 'Usuário não encontrado.' };

  await db.update(users).set({ isActive: !user.isActive }).where(eq(users.id, userId));
  revalidatePath('/configuracoes');
  return { ok: true };
}

const changePasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(6),
});

export async function changePassword(formData: FormData) {
  const currentUser = await requireAuth();
  const isAdmin = (currentUser as { isAdmin?: boolean }).isAdmin;

  const parsed = changePasswordSchema.safeParse({
    userId: formData.get('userId'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) return { error: 'Dados inválidos.' };

  // Only admins can change other users' passwords
  if (parsed.data.userId !== currentUser.id && !isAdmin) {
    return { error: 'Sem permissão.' };
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, parsed.data.userId));

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function getTicketHistory(ticketCode: string) {
  const { tickets } = await import('@/db/schema');
  const [ticket] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.code, ticketCode)).limit(1);
  if (!ticket) return [];

  return db
    .select({
      id: ticketHistory.id,
      field: ticketHistory.field,
      oldValue: ticketHistory.oldValue,
      newValue: ticketHistory.newValue,
      createdAt: ticketHistory.createdAt,
      authorName: users.displayName,
    })
    .from(ticketHistory)
    .leftJoin(users, eq(ticketHistory.authorId, users.id))
    .where(eq(ticketHistory.ticketId, ticket.id))
    .orderBy(desc(ticketHistory.createdAt));
}
