import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const areaEnum = pgEnum('area', ['TI', 'MKT']);
export const priorityEnum = pgEnum('priority', ['baixa', 'media', 'alta', 'urgente']);
export const statusEnum = pgEnum('status', [
  'aberto',
  'em_andamento',
  'aguardando',
  'resolvido',
  'arquivado',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').unique().notNull(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').unique().notNull(),
    area: areaEnum('area').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    subcategory: text('subcategory').notNull(),
    origin: text('origin'),
    priority: priorityEnum('priority').default('media').notNull(),
    status: statusEnum('status').default('aberto').notNull(),
    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (t) => [
    index('tickets_area_idx').on(t.area),
    index('tickets_status_idx').on(t.status),
    index('tickets_priority_idx').on(t.priority),
    index('tickets_assignee_idx').on(t.assigneeId),
    index('tickets_created_idx').on(t.createdAt),
  ],
);

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .references(() => tickets.id, { onDelete: 'cascade' })
    .notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketHistory = pgTable('ticket_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .references(() => tickets.id, { onDelete: 'cascade' })
    .notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  authoredTickets: many(tickets, { relationName: 'author' }),
  assignedTickets: many(tickets, { relationName: 'assignee' }),
  comments: many(comments),
  history: many(ticketHistory),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  author: one(users, {
    fields: [tickets.authorId],
    references: [users.id],
    relationName: 'author',
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  comments: many(comments),
  history: many(ticketHistory),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  ticket: one(tickets, { fields: [comments.ticketId], references: [tickets.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketHistory.ticketId], references: [tickets.id] }),
  author: one(users, { fields: [ticketHistory.authorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type TicketHistory = typeof ticketHistory.$inferSelect;
