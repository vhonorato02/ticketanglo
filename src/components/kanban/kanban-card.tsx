'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PriorityBadge, AreaBadge } from '@/components/tickets/ticket-badge';
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
  dragging?: boolean;
}

export function KanbanCard({ ticket, dragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.code,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-card border border-border/80 rounded-lg p-3 cursor-grab active:cursor-grabbing select-none transition-all',
        'hover:border-foreground/20 hover:shadow-sm',
        isDragging && 'opacity-30',
        dragging && 'shadow-xl ring-2 ring-primary border-primary',
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/tickets/${ticket.code}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {ticket.code}
        </Link>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2.5">{ticket.title}</p>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <AreaBadge area={ticket.area} />
          <span className="truncate">{ticket.subcategory}</span>
        </div>
        {ticket.assigneeName && (
          <span className="shrink-0 truncate max-w-[80px]" title={ticket.assigneeName}>
            {ticket.assigneeName.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}
