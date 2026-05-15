'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { tickets, ticketHistory, users } from '@/db/schema';
import { eq, desc, like, or, and, gte, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { TI_SUBCATEGORIES, MKT_SUBCATEGORIES } from '@/lib/constants';

const tiSubs = TI_SUBCATEGORIES as readonly string[];
const mktSubs = MKT_SUBCATEGORIES as readonly string[];

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

async function generateCode(area: 'TI' | 'MKT'): Promise<string> {
  const prefix = area;
  const result = await db
    .select({ code: tickets.code })
    .from(tickets)
    .where(like(tickets.code, `${prefix}-%`))
    .orderBy(desc(tickets.code))
    .limit(1);

  if (result.length === 0) return `${prefix}-0001`;

  const last = result[0].code;
  const num = parseInt(last.split('-')[1] ?? '0') + 1;
  return `${prefix}-${num.toString().padStart(4, '0')}`;
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

// ─── Create ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  area: z.enum(['TI', 'MKT']),
  title: z.string().min(1).max(80),
  subcategory: z.string().min(1),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  description: z.string().optional(),
  origin: z.string().optional(),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
});

export async function createTicket(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    area: formData.get('area'),
    title: formData.get('title'),
    subcategory: formData.get('subcategory'),
    priority: formData.get('priority'),
    description: formData.get('description') || undefined,
    origin: formData.get('origin') || undefined,
    assigneeId: formData.get('assigneeId') || undefined,
  };

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: 'Dados inválidos.' };

  const { area, title, subcategory, priority, description, origin, assigneeId } = parsed.data;

  const validSubs = area === 'TI' ? tiSubs : mktSubs;
  if (!validSubs.includes(subcategory)) return { error: 'Subcategoria inválida.' };

  const code = await generateCode(area);

  await db.insert(tickets).values({
    code,
    area,
    title,
    subcategory,
    priority,
    description: description || null,
    origin: origin || null,
    assigneeId: assigneeId || null,
    authorId: user.id,
  });

  revalidatePath('/');
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  return { code };
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateTicketStatus(
  code: string,
  newStatus: 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido' | 'arquivado',
) {
  const user = await requireAuth();

  const [ticket] = await db
    .select({ id: tickets.id, status: tickets.status })
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);

  if (!ticket) return { error: 'Ticket não encontrado.' };
  if (ticket.status === newStatus) return { ok: true };

  const now = new Date();
  await db
    .update(tickets)
    .set({
      status: newStatus,
      updatedAt: now,
      resolvedAt: newStatus === 'resolvido' ? now : null,
    })
    .where(eq(tickets.code, code));

  await recordHistory(ticket.id, user.id, 'status', ticket.status, newStatus);

  revalidatePath('/');
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  revalidatePath(`/tickets/${code}`);
  return { ok: true };
}

// ─── Update field ─────────────────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  subcategory: z.string().optional(),
});

export async function updateTicketField(
  code: string,
  field: string,
  value: string | null,
) {
  const user = await requireAuth();

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);

  if (!ticket) return { error: 'Ticket não encontrado.' };

  const allowedFields = ['title', 'description', 'origin', 'priority', 'assigneeId', 'subcategory'];
  if (!allowedFields.includes(field)) return { error: 'Campo inválido.' };

  const oldValue = String((ticket as Record<string, unknown>)[field] ?? '');

  await db
    .update(tickets)
    .set({ [field]: value, updatedAt: new Date() })
    .where(eq(tickets.code, code));

  await recordHistory(ticket.id, user.id, field, oldValue || null, value);

  revalidatePath(`/tickets/${code}`);
  revalidatePath('/tickets');
  revalidatePath('/kanban');
  return { ok: true };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

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
  if (area && area !== 'all') conditions.push(eq(tickets.area, area as 'TI' | 'MKT'));
  if (status && status !== 'all') conditions.push(eq(tickets.status, status as 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido' | 'arquivado'));
  if (priority && priority !== 'all') conditions.push(eq(tickets.priority, priority as 'baixa' | 'media' | 'alta' | 'urgente'));
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
        like(tickets.title, `%${search}%`),
        like(tickets.code, `%${search}%`),
        like(tickets.description ?? sql`''`, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
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

  return rows;
}

export async function getTicket(code: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.code, code))
    .limit(1);

  if (!ticket) return null;

  const [author] = await db
    .select({ id: users.id, displayName: users.displayName, username: users.username })
    .from(users)
    .where(eq(users.id, ticket.authorId))
    .limit(1);

  let assignee = null;
  if (ticket.assigneeId) {
    const [a] = await db
      .select({ id: users.id, displayName: users.displayName, username: users.username })
      .from(users)
      .where(eq(users.id, ticket.assigneeId))
      .limit(1);
    assignee = a ?? null;
  }

  return { ...ticket, author, assignee };
}

export async function getDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
    db
      .select({ count: count() })
      .from(tickets)
      .where(eq(tickets.status, 'aguardando')),
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
  if (area && area !== 'all') conditions.push(eq(tickets.area, area as 'TI' | 'MKT'));
  if (assigneeId && assigneeId !== 'all') {
    conditions.push(eq(tickets.assigneeId, assigneeId));
  }
  // Arquivados ficam fora do kanban por padrão
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
