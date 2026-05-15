'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { updateTicketStatus } from '@/actions/tickets';
import type { Ticket } from '@/db/schema';

type Status = Ticket['status'];
type KanbanTicket = {
  id: string;
  code: string;
  area: Ticket['area'];
  title: string;
  subcategory: string;
  priority: Ticket['priority'];
  status: Status;
  assigneeName?: string | null;
};

interface KanbanBoardProps {
  initialTickets: KanbanTicket[];
}

const BOARD_STATUSES: Status[] = ['aberto', 'em_andamento', 'aguardando', 'resolvido'];

export function KanbanBoard({ initialTickets }: KanbanBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTicket, setActiveTicket] = useState<KanbanTicket | null>(null);

  const [optimisticTickets, updateOptimistic] = useOptimistic(
    initialTickets,
    (state, { code, status }: { code: string; status: Status }) =>
      state.map((t) => (t.code === code ? { ...t, status } : t)),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = optimisticTickets.find((t) => t.code === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const code = active.id as string;
    const newStatus = over.id as Status;
    const ticket = optimisticTickets.find((t) => t.code === code);
    if (!ticket || ticket.status === newStatus) return;

    startTransition(async () => {
      updateOptimistic({ code, status: newStatus });
      const result = await updateTicketStatus(code, newStatus);
      if (result && 'error' in result) {
        toast.error(result.error);
      }
      router.refresh();
    });
  };

  if (initialTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="font-medium">Nenhuma demanda no quadro</p>
        <p className="text-sm mt-1">
          Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">N</kbd> para
          registrar a primeira.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
        {BOARD_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={optimisticTickets.filter((t) => t.status === status)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <div className="rotate-1 opacity-95">
            <KanbanCard ticket={activeTicket} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
