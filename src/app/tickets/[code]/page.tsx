import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, MapPin, User, Tag } from 'lucide-react';
import { getTicket } from '@/actions/tickets';
import { getComments } from '@/actions/comments';
import { getTicketHistory, getUsers } from '@/actions/users';
import { auth } from '@/auth';
import { StatusBadge, PriorityBadge, AreaBadge } from '@/components/tickets/ticket-badge';
import { Separator } from '@/components/ui/separator';
import { TicketActions } from './actions';
import { CommentThread } from './comment-thread';
import { HistoryLog } from './history-log';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { code } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? '';

  const [ticket, comments, history, users] = await Promise.all([
    getTicket(code),
    getComments(code),
    getTicketHistory(code),
    getUsers(),
  ]);

  if (!ticket) notFound();

  const activeUsers = users.filter((u) => u.isActive);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Todos os tickets
      </Link>

      {/* Cabeçalho */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground font-medium">{ticket.code}</span>
          <AreaBadge area={ticket.area} />
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <h1 className="text-2xl font-semibold leading-snug">{ticket.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Tag className="size-3.5" />
            {ticket.subcategory}
          </span>
          {ticket.origin && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {ticket.origin}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" />
            {ticket.author?.displayName ?? 'Desconhecido'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>

      <Separator />

      {/* Conteúdo principal */}
      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Descrição */}
          {ticket.description ? (
            <div>
              <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Descrição
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg bg-muted/30 border p-4">
                {ticket.description}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem descrição detalhada.</p>
          )}

          {/* Comentários */}
          <CommentThread
            ticketCode={code}
            comments={comments}
            currentUserId={currentUserId}
          />

          {/* Histórico */}
          {history.length > 0 && <HistoryLog history={history} />}
        </div>

        {/* Ações */}
        <TicketActions
          ticket={ticket}
          users={activeUsers}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
