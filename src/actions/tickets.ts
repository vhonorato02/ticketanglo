'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { ticketHistory, tickets, users, type NewTicket } from '@/db/schema';
import { and, count, desc, eq, gte, ilike, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { copy } from '@/lib/copy';
import { isValidSubcategory, type Area, type Priority, type Status } from '@/lib/constants';

const areaSchema = z.enum(['TI', 'MKT']);
const prioritySchema = z.enum(['baixa', 'media', 'alta', 'urgente']);
const statusSchema = z.enum(['aberto', 'em_andamento', 'aguardando', 'resolvido', 'arquivado']);

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

async function generateCode(area: Area): Promise<string> {
  const result = await db
    .select({ code: tickets.code })
    .from(tickets)
    .where(like(tickets.code, `${area}-%`))
    .orderBy(desc(tickets.code))
    .limit(1);

  if (result.length === 0) return `${area}-0001`;

  const last = result[0].code;
  const nextNumber = Number.parseInt(last.split('-')[1] ?? '0', 10) + 1;
  return `${area}-${nextNumber.toString().padStart(4, '0')}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    String(error.message).toLowerCase().includes('unique')
  );
}

async function recordHistory(
  ticketId: string,
  authorId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
) {
  await db.insert(ticketHistory).values({ ticketId, authorId, field, oldValue, newValue });
}

async function resolveUserName(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [user] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.displayName ?? copy.common.removedUser;
}

const createSchema = z.object({
  area: areaSchema,
  title: z.string().trim().min(1).max(80),
  subcategory: z.string().trim().min(1).max(80),
  priority: prioritySchema.default('media'),
  description: z.string().trim().max(4000).optional(),
  origin: z.string().trim().max(120).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
});

function normalizeOptionalText(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

export async function createTicket(formData: FormData) {
  const user = await requireAuth();

  const parsed = createSchema.safeParse({
    area: formData.get('area'),
    title: formData.get('title'),
    subcategory: formData.get('subcategory'),
    priority: formData.get('priority'),
    description: formData.get('description') || undefined,
    origin: formData.get('origin') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  });

  if (!parsed.success) return { error: copy.validation.invalidData };

  const { area, title, subcategory, priority, description, origin, assigneeId } = parsed.data;
  if (!isValidSubcategory(area, subcategory)) {
    return { error: copy.validation.invalidSubcategory };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateCode(area);
    try {
      await db.insert(tickets).values({
        code,
        area,
        title,
        subcategory,
        priority,
        description: normalizeOptionalText(description),
        origin: normalizeOptionalText(origin),
        assigneeId: assigneeId || null,
        authorId: user.id,
      });

      revalidatePath('/');
      revalidatePath('/tickets');
      revalidatePath('/kanban');
      return { code };
    } catch (error) {
      if (attempt < 4 && isUniqueConstraintError(error)) continue;
      throw error;
    }
  }

  return { error: copy.validation.invalidData };
}

export async function updateTicketStatus(code: string, newStatus: Status) {
  const user = await requireAuth();
  const parsedStatus = statusSchema.safeParse(newStatus);
  if (!parsedStatus.success) return { error: copy.validation.invalidData };

  const [ticket] = await db
    .select({ id: tickets.id, status: tickets.status })
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);

  if (!ticket) return { error: copy.validation.invalidTicket };
  if (ticket.status === parsedStatus.data) return { ok: true };

  const now = new Date();
  await db
    .update(tickets)
    .set({
      status: parsedStatus.data,
      updatedAt: now,
      resolvedAt: parsedStatus.data === 'resolvido' ? now : null,
    })
    .where(eq(tickets.code, code));

  await recordHistory(ticket.id, user.id, 'status', ticket.status, parsedStatus.data);

  revalidatePath('/');
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  revalidatePath(`/tickets/${code}`);
  return { ok: true };
}

const updateFieldSchema = z.object({
  field: z.enum(['title', 'description', 'origin', 'priority', 'assigneeId', 'subcategory']),
  value: z.string().nullable(),
});

async function normalizeFieldValue(
  ticket: { area: Area },
  field: z.infer<typeof updateFieldSchema>['field'],
  value: string | null,
) {
  if (field === 'title') {
    const parsed = z.string().trim().min(1).max(80).safeParse(value);
    return parsed.success ? { value: parsed.data } : { error: copy.validation.invalidData };
  }

  if (field === 'description') {
    const parsed = z.string().trim().max(4000).nullable().safeParse(value);
    return parsed.success
      ? { value: normalizeOptionalText(parsed.data ?? undefined) }
      : { error: copy.validation.invalidData };
  }

  if (field === 'origin') {
    const parsed = z.string().trim().max(120).nullable().safeParse(value);
    return parsed.success
      ? { value: normalizeOptionalText(parsed.data ?? undefined) }
      : { error: copy.validation.invalidData };
  }

  if (field === 'priority') {
    const parsed = prioritySchema.safeParse(value);
    return parsed.success ? { value: parsed.data } : { error: copy.validation.invalidData };
  }

  if (field === 'subcategory') {
    const parsed = z.string().trim().min(1).max(80).safeParse(value);
    if (!parsed.success || !isValidSubcategory(ticket.area, parsed.data)) {
      return { error: copy.validation.invalidSubcategory };
    }
    return { value: parsed.data };
  }

  if (field === 'assigneeId') {
    if (!value) return { value: null };
    const parsed = z.string().uuid().safeParse(value);
    if (!parsed.success) return { error: copy.validation.invalidData };

    const [assignee] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, parsed.data), eq(users.isActive, true)))
      .limit(1);
    return assignee ? { value: assignee.id } : { error: copy.validation.invalidUser };
  }

  return { error: copy.validation.invalidField };
}

export async function updateTicketField(code: string, field: string, value: string | null) {
  const user = await requireAuth();
  const parsed = updateFieldSchema.safeParse({ field, value });
  if (!parsed.success) return { error: copy.validation.invalidField };

  const [ticket] = await db.select().from(tickets).where(eq(tickets.code, code)).limit(1);
  if (!ticket) return { error: copy.validation.invalidTicket };

  const normalized = await normalizeFieldValue(ticket, parsed.data.field, parsed.data.value);
  if ('error' in normalized) return { error: normalized.error };

  const rawOld = ticket[parsed.data.field];
  const oldValue = rawOld != null ? String(rawOld) : null;
  const newValue = normalized.value != null ? String(normalized.value) : null;
  if (oldValue === newValue) return { ok: true };

  const updates: Partial<NewTicket> = { updatedAt: new Date() };
  Object.assign(updates, { [parsed.data.field]: normalized.value });

  await db.update(tickets).set(updates).where(eq(tickets.code, code));

  if (parsed.data.field === 'assigneeId') {
    const [oldName, newName] = await Promise.all([
      resolveUserName(oldValue),
      resolveUserName(newValue),
    ]);
    await recordHistory(ticket.id, user.id, 'responsavel', oldName, newName);
  } else {
    await recordHistory(ticket.id, user.id, parsed.data.field, oldValue, newValue);
  }

  revalidatePath('/');
  revalidatePath(`/tickets/${code}`);
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  return { ok: true };
}

export type TicketRow = Awaited<ReturnType<typeof getTickets>>[number];

export async function getTickets(filters?: {
  area?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
}) {
  const { area, status, priority, assigneeId, search, page = 1 } = filters ?? {};
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (area && area !== 'all') conditions.push(eq(tickets.area, area as Area));
  if (status && status !== 'all') conditions.push(eq(tickets.status, status as Status));
  if (priority && priority !== 'all') conditions.push(eq(tickets.priority, priority as Priority));
  if (assigneeId && assigneeId !== 'all') {
    if (assigneeId === 'unassigned') {
      conditions.push(sql`${tickets.assigneeId} IS NULL`);
    } else {
      conditions.push(eq(tickets.assigneeId, assigneeId));
    }
  }
  if (search) {
    conditions.push(
      or(
        ilike(tickets.title, `%${search}%`),
        ilike(tickets.code, `%${search}%`),
        ilike(sql`COALESCE(${tickets.description}, '')`, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: tickets.id,
      code: tickets.code,
      area: tickets.area,
      title: tickets.title,
      subcategory: tickets.subcategory,
      priority: tickets.priority,
      status: tickets.status,
      origin: tickets.origin,
      description: tickets.description,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      resolvedAt: tickets.resolvedAt,
      authorId: tickets.authorId,
      assigneeId: tickets.assigneeId,
      authorName: users.displayName,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.authorId, users.id))
    .where(where)
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTicket(code: string) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.code, code)).limit(1);
  if (!ticket) return null;

  const [author] = ticket.authorId
    ? await db
        .select({ id: users.id, displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, ticket.authorId))
        .limit(1)
    : [null];

  const [assignee] = ticket.assigneeId
    ? await db
        .select({ id: users.id, displayName: users.displayName, username: users.username })
        .from(users)
        .where(eq(users.id, ticket.assigneeId))
        .limit(1)
    : [null];

  return { ...ticket, author: author ?? null, assignee: assignee ?? null };
}

export async function getDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [abertosTI, abertosMKT, urgentes, aguardando, resolvidosSemana] = await Promise.all([
    db
      .select({ count: count() })
      .from(tickets)
      .where(and(eq(tickets.area, 'TI'), eq(tickets.status, 'aberto'))),
    db
      .select({ count: count() })
      .from(tickets)
      .where(and(eq(tickets.area, 'MKT'), eq(tickets.status, 'aberto'))),
    db
      .select({ count: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.priority, 'urgente'),
          or(eq(tickets.status, 'aberto'), eq(tickets.status, 'em_andamento')),
        ),
      ),
    db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'aguardando')),
    db
      .select({ count: count() })
      .from(tickets)
      .where(and(eq(tickets.status, 'resolvido'), gte(tickets.resolvedAt, weekAgo))),
  ]);

  return {
    abertosTI: abertosTI[0]?.count ?? 0,
    abertosMKT: abertosMKT[0]?.count ?? 0,
    urgentes: urgentes[0]?.count ?? 0,
    aguardando: aguardando[0]?.count ?? 0,
    resolvidosSemana: resolvidosSemana[0]?.count ?? 0,
  };
}

export async function getKanbanTickets(filters?: { area?: string; assigneeId?: string }) {
  const { area, assigneeId } = filters ?? {};
  const conditions = [];
  if (area && area !== 'all') conditions.push(eq(tickets.area, area as Area));
  if (assigneeId && assigneeId !== 'all') {
    if (assigneeId === 'unassigned') {
      conditions.push(sql`${tickets.assigneeId} IS NULL`);
    } else {
      conditions.push(eq(tickets.assigneeId, assigneeId));
    }
  }
  conditions.push(
    or(
      eq(tickets.status, 'aberto'),
      eq(tickets.status, 'em_andamento'),
      eq(tickets.status, 'aguardando'),
      eq(tickets.status, 'resolvido'),
    ),
  );

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: tickets.id,
      code: tickets.code,
      area: tickets.area,
      title: tickets.title,
      subcategory: tickets.subcategory,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      assigneeId: tickets.assigneeId,
      assigneeName: users.displayName,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.assigneeId, users.id))
    .where(where)
    .orderBy(desc(tickets.createdAt));
}
