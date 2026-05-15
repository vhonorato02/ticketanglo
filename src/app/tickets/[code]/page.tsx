import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, MapPin, User, Tag, FileText } from 'lucide-react';
import { getTicket } from '@/actions/tickets';
import { getComments } from '@/actions/comments';
import { getTicketHistory, getUsers } from '@/actions/users';
import { auth } from '@/auth';
import { StatusBadge, PriorityBadge, AreaBadge } from '@/components/tickets/ticket-badge';
import { TicketActions } from './actions';
import { CommentThread } from './comment-thread';
import { HistoryLog } from './history-log';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params;
  return { title: code };
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Voltar */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Todas as demandas
      </Link>

      {/* Cabeçalho */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground font-medium">{ticket.code}</span>
          <span className="text-muted-foreground/40">·</span>
          <AreaBadge area={ticket.area} />
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight">
          {ticket.title}
        </h1>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
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
            <time dateTime={new Date(ticket.createdAt).toISOString()}>
              {format(new Date(ticket.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </time>
          </span>
        </div>
      </header>

      <div className="h-px bg-border" />

      {/* Conteúdo principal */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-8 min-w-0">
          {/* Descrição */}
          {ticket.description ? (
            <section>
              <h2 className="text-xs font-semibold mb-2.5 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Descrição
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/30 border border-border/60 p-4">
                {ticket.description}
              </div>
            </section>
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

        {/* Ações (sidebar) */}
        <TicketActions
          ticket={ticket}
          users={activeUsers}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
