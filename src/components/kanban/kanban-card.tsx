'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/tickets/ticket-badge';
import type { Ticket } from '@/db/schema';

interface KanbanCardProps {
  ticket: {
    id: string;
    code: string;
    area: Ticket['area'];
    title: string;
    subcategory: string;
    priority: Ticket['priority'];
    status: Ticket['status'];
    assigneeName?: string | null;
  };
}

export function KanbanCard({ ticket }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.code,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-shadow',
        isDragging && 'opacity-40 shadow-xl ring-2 ring-primary',
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/tickets/${ticket.code}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {ticket.code}
        </Link>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{ticket.title}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">{ticket.subcategory}</span>
        {ticket.assigneeName && (
          <span className="text-xs text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
            {ticket.assigneeName.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}
