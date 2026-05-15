import { Suspense } from 'react';
import { getTickets } from '@/actions/tickets';
import { TicketTable } from '@/components/tickets/ticket-table';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

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
  const tickets = await getTickets({
    area: searchParams.area,
    status: searchParams.status,
    priority: searchParams.priority,
    assigneeId: searchParams.assigneeId,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  return <TicketTable tickets={tickets} />;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tickets</h1>

      <Suspense
        fallback={
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-36" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        }
      >
        <TicketList searchParams={params} />
      </Suspense>
    </div>
  );
}
