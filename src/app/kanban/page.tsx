import { KanbanBoard } from '@/components/kanban/kanban-board';
import { getKanbanTickets } from '@/actions/tickets';
import { getUsers } from '@/actions/users';
import { KanbanFilters } from './filters';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ area?: string; assigneeId?: string }>;
}

export default async function KanbanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [tickets, users] = await Promise.all([
    getKanbanTickets({ area: params.area, assigneeId: params.assigneeId }),
    getUsers(),
  ]);

  const activeUsers = users.filter((u) => u.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Kanban</h1>
        <KanbanFilters users={activeUsers} />
      </div>

      <KanbanBoard initialTickets={tickets} />
    </div>
  );
}
