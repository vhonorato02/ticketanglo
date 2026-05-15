import { KanbanBoard } from '@/components/kanban/kanban-board';
import { getKanbanTickets } from '@/actions/tickets';
import { getUsers } from '@/actions/users';
import { KanbanFilters } from './filters';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Quadro' };

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
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quadro</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Arraste demandas entre as colunas para mover seu status.
          </p>
        </div>
        <KanbanFilters users={activeUsers} />
      </div>

      <KanbanBoard initialTickets={tickets} />
    </div>
  );
}
