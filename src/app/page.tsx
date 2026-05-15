import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Monitor,
  Megaphone,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { auth } from '@/auth';
import { StatusBadge, PriorityBadge, AreaBadge } from '@/components/tickets/ticket-badge';
import { getDashboardStats, getTickets } from '@/actions/tickets';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  accent?: 'default' | 'destructive' | 'warning' | 'success';
  empty?: string;
}

function StatCard({ label, value, icon, href, accent = 'default', empty }: StatCardProps) {
  const accentClass = {
    default: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  }[accent];

  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-foreground/20 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-semibold mt-1.5 tabular-nums tracking-tight">{value}</p>
          {value === 0 && empty && (
            <p className="text-xs text-muted-foreground mt-1">{empty}</p>
          )}
        </div>
        <div
          className={cn(
            'size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
            accentClass,
          )}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0];
  if (hour < 12) return `Bom dia, ${firstName}`;
  if (hour < 18) return `Boa tarde, ${firstName}`;
  return `Boa noite, ${firstName}`;
}

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? 'Usuário';

  const [stats, recentTickets] = await Promise.all([
    getDashboardStats(),
    getTickets({ page: 1 }),
  ]);

  const recent = recentTickets.slice(0, 8);

  const rawDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const today = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {getGreeting(userName)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">{today}</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Abertos TI"
          value={Number(stats.abertosTI)}
          icon={<Monitor className="size-4" />}
          href="/tickets?area=TI&status=aberto"
          empty="Tudo em ordem."
        />
        <StatCard
          label="Abertos MKT"
          value={Number(stats.abertosMKT)}
          icon={<Megaphone className="size-4" />}
          href="/tickets?area=MKT&status=aberto"
          empty="Tudo em ordem."
        />
        <StatCard
          label="Urgentes"
          value={Number(stats.urgentes)}
          icon={<Zap className="size-4" />}
          href="/tickets?priority=urgente"
          accent="destructive"
          empty="Sem urgências."
        />
        <StatCard
          label="Aguardando"
          value={Number(stats.aguardando)}
          icon={<Clock className="size-4" />}
          href="/tickets?status=aguardando"
          accent="warning"
          empty="Sem bloqueios."
        />
        <StatCard
          label="Resolvidos na semana"
          value={Number(stats.resolvidosSemana)}
          icon={<CheckCircle2 className="size-4" />}
          href="/tickets?status=resolvido"
          accent="success"
          empty="Nada ainda esta semana."
        />
      </div>

      {/* Últimas demandas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Últimas demandas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atividade mais recente do colégio
            </p>
          </div>
          <Link
            href="/tickets"
            className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Ver todas <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center">
            <div className="size-12 rounded-2xl bg-muted/60 mx-auto flex items-center justify-center mb-4">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <p className="font-medium">Nenhuma demanda registrada ainda</p>
            <p className="text-sm text-muted-foreground mt-1.5">
              Pressione <kbd className="kbd mx-0.5">N</kbd> para registrar a primeira.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                      Código
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                      Demanda
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                      Área
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                      Prioridade
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                      Criada
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/${ticket.code}`}
                          className="font-mono text-xs text-primary hover:underline font-medium"
                        >
                          {ticket.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <Link
                          href={`/tickets/${ticket.code}`}
                          className="hover:underline line-clamp-1 font-medium"
                        >
                          {ticket.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.subcategory}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <AreaBadge area={ticket.area} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {format(new Date(ticket.createdAt), "dd 'de' MMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
