'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import { STATUS_LABELS } from '@/lib/constants';
import type { Ticket } from '@/db/schema';

type Status = Ticket['status'];

interface KanbanColumnProps {
  status: Status;
  tickets: {
    id: string;
    code: string;
    area: Ticket['area'];
    title: string;
    subcategory: string;
    priority: Ticket['priority'];
    status: Status;
    assigneeName?: string | null;
  }[];
}

const columnAccent: Record<Status, string> = {
  aberto: 'border-t-zinc-400',
  em_andamento: 'border-t-primary',
  aguardando: 'border-t-yellow-500',
  resolvido: 'border-t-green-600',
  arquivado: 'border-t-zinc-300',
};

export function KanbanColumn({ status, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tickets.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-xl border-t-2 border border-border bg-muted/30 p-2 min-h-[120px] transition-colors',
          columnAccent[status],
          isOver && 'bg-muted/60 border-primary/30',
        )}
      >
        {tickets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-8">
            {isOver ? 'Soltar aqui' : 'Vazio'}
          </div>
        ) : (
          tickets.map((t) => <KanbanCard key={t.code} ticket={t} />)
        )}
      </div>
    </div>
  );
}
