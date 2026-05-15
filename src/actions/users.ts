'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { comments, ticketHistory, tickets, users } from '@/db/schema';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { copy } from '@/lib/copy';
import {
  displayNameSchema,
  passwordSchema,
  userIdSchema,
  usernameSchema,
} from '@/lib/validation';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.isAdmin) redirect('/');
  return session.user;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

async function getActiveAdminCount() {
  const [result] = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.isAdmin, true), eq(users.isActive, true)));
  return Number(result?.total ?? 0);
}

async function ensureUsernameAvailable(username: string, ignoreUserId?: string) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return !existing || existing.id === ignoreUserId;
}

function revalidateUserSurfaces() {
  revalidatePath('/');
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  revalidatePath('/configuracoes');
}

export async function getUsers() {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.displayName));
}

const createUserSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
  isAdmin: z.boolean().default(false),
});

export async function createUser(formData: FormData) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    password: formData.get('password'),
    isAdmin: formData.get('isAdmin') === 'true',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? copy.validation.invalidData };
  }

  const available = await ensureUsernameAvailable(parsed.data.username);
  if (!available) return { error: copy.validation.usernameExists };

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

const updateUserSchema = z.object({
  userId: userIdSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
  isAdmin: z.boolean().default(false),
});

export async function updateUser(formData: FormData) {
  const currentUser = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get('userId'),
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    isAdmin: formData.get('isAdmin') === 'true',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? copy.validation.invalidData };
  }

  const [target] = await db.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
  if (!target) return { error: copy.validation.invalidUser };

  const available = await ensureUsernameAvailable(parsed.data.username, parsed.data.userId);
  if (!available) return { error: copy.validation.usernameExists };

  if (target.isAdmin && !parsed.data.isAdmin) {
    const activeAdmins = await getActiveAdminCount();
    if (currentUser.id === target.id || (target.isActive && activeAdmins <= 1)) {
      return { error: copy.users.errors.cannotRemoveLastAdmin };
    }
  }

  await db
    .update(users)
    .set({
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      isAdmin: parsed.data.isAdmin,
    })
    .where(eq(users.id, parsed.data.userId));

  revalidateUserSurfaces();
  return { ok: true };
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const currentUser = await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { error: copy.validation.invalidData };

  const [target] = await db.select().from(users).where(eq(users.id, parsed.data)).limit(1);
  if (!target) return { error: copy.validation.invalidUser };

  if (!isAdmin && target.isAdmin) {
    const activeAdmins = await getActiveAdminCount();
    if (currentUser.id === target.id || (target.isActive && activeAdmins <= 1)) {
      return { error: copy.users.errors.cannotRemoveLastAdmin };
    }
  }

  await db.update(users).set({ isAdmin }).where(eq(users.id, parsed.data));
  revalidateUserSurfaces();
  return { ok: true };
}

export async function toggleUserActive(userId: string) {
  const currentUser = await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { error: copy.validation.invalidData };
  if (currentUser.id === parsed.data) return { error: copy.users.errors.cannotDeactivateSelf };

  const [user] = await db
    .select({ isActive: users.isActive, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, parsed.data))
    .limit(1);
  if (!user) return { error: copy.validation.invalidUser };

  if (user.isActive && user.isAdmin) {
    const activeAdmins = await getActiveAdminCount();
    if (activeAdmins <= 1) return { error: copy.users.errors.cannotRemoveLastAdmin };
  }

  await db.update(users).set({ isActive: !user.isActive }).where(eq(users.id, parsed.data));
  revalidateUserSurfaces();
  return { ok: true };
}

export async function deleteUser(userId: string) {
  const currentUser = await requireAdmin();
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { error: copy.validation.invalidData };
  if (currentUser.id === parsed.data) return { error: copy.users.errors.cannotDeleteSelf };

  const [target] = await db.select().from(users).where(eq(users.id, parsed.data)).limit(1);
  if (!target) return { error: copy.validation.invalidUser };

  if (target.isAdmin && target.isActive) {
    const activeAdmins = await getActiveAdminCount();
    if (activeAdmins <= 1) return { error: copy.users.errors.cannotRemoveLastAdmin };
  }

  await db.transaction(async (tx) => {
    await tx.update(tickets).set({ assigneeId: null }).where(eq(tickets.assigneeId, parsed.data));
    await tx.update(tickets).set({ authorId: null }).where(eq(tickets.authorId, parsed.data));
    await tx.update(comments).set({ authorId: null }).where(eq(comments.authorId, parsed.data));
    await tx
      .update(ticketHistory)
      .set({ authorId: null })
      .where(eq(ticketHistory.authorId, parsed.data));
    await tx.delete(users).where(eq(users.id, parsed.data));
  });

  revalidateUserSurfaces();
  return { ok: true };
}

const changePasswordSchema = z.object({
  userId: userIdSchema,
  newPassword: passwordSchema,
});

export async function changePassword(formData: FormData) {
  const currentUser = await requireAuth();
  const parsed = changePasswordSchema.safeParse({
    userId: formData.get('userId'),
    newPassword: formData.get('newPassword'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? copy.validation.invalidData };
  }

  if (parsed.data.userId !== currentUser.id && !currentUser.isAdmin) {
    return { error: copy.auth.errors.permissionDenied };
  }

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, parsed.data.userId)).limit(1);
  if (!target) return { error: copy.validation.invalidUser };

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, parsed.data.userId));

  revalidatePath('/configuracoes');
  return { ok: true };
}

export async function getTicketHistory(ticketCode: string) {
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
