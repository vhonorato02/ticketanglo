import { Suspense } from 'react';
import { getTickets } from '@/actions/tickets';
import { getUsers } from '@/actions/users';
import { TicketTable } from '@/components/tickets/ticket-table';
import { Skeleton } from '@/components/ui/skeleton';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

export const metadata = { title: copy.metadata.tickets };

interface PageProps {
  searchParams: Promise<{
    area?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    page?: string;
  }>;
}

async function TicketList({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const [tickets, users] = await Promise.all([
    getTickets({
      area: searchParams.area,
      status: searchParams.status,
      priority: searchParams.priority,
      assigneeId: searchParams.assigneeId,
      search: searchParams.search,
      page: searchParams.page ? Number.parseInt(searchParams.page, 10) : 1,
    }),
    getUsers(),
  ]);

  return <TicketTable tickets={tickets} users={users.filter((user) => user.isActive)} />;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.tickets.page.title}</h1>
        <p className="text-muted-foreground text-sm mt-1.5">{copy.tickets.page.description}</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 flex-1 min-w-[220px] max-w-md" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        }
      >
        <TicketList searchParams={params} />
      </Suspense>
    </div>
  );
}
