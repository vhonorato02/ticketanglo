import Link from 'next/link';
import { format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Monitor,
  Megaphone,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, PriorityBadge, AreaBadge } from '@/components/tickets/ticket-badge';
import { getDashboardStats, getTickets } from '@/actions/tickets';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  accent?: string;
  empty?: string;
}

function StatCard({ title, value, icon, href, accent, empty }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${accent ?? ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {title}
              </p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {value === 0 && empty && (
                <p className="text-xs text-muted-foreground mt-1">{empty}</p>
              )}
            </div>
            <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const [stats, recentTickets] = await Promise.all([
    getDashboardStats(),
    getTickets({ page: 1 }),
  ]);

  const recent = recentTickets.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Abertos TI"
          value={Number(stats.abertosTI)}
          icon={<Monitor className="size-4 text-muted-foreground" />}
          href="/tickets?area=TI&status=aberto"
          empty="Tudo em ordem."
        />
        <StatCard
          title="Abertos MKT"
          value={Number(stats.abertosMKT)}
          icon={<Megaphone className="size-4 text-muted-foreground" />}
          href="/tickets?area=MKT&status=aberto"
          empty="Tudo em ordem."
        />
        <StatCard
          title="Urgentes"
          value={Number(stats.urgentes)}
          icon={<Zap className="size-4 text-destructive" />}
          href="/tickets?priority=urgente"
          empty="Nenhum urgente. Respire."
        />
        <StatCard
          title="Aguardando"
          value={Number(stats.aguardando)}
          icon={<Clock className="size-4 text-yellow-500" />}
          href="/tickets?status=aguardando"
          empty="Sem bloqueios."
        />
        <StatCard
          title="Resolvidos esta semana"
          value={Number(stats.resolvidosSemana)}
          icon={<CheckCircle2 className="size-4 text-green-600" />}
          href="/tickets?status=resolvido"
          empty="Nada ainda."
        />
      </div>

      {/* Recent tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tickets recentes</h2>
          <Link
            href="/tickets"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="size-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto size-8 mb-3 opacity-40" />
              <p className="font-medium">Nenhum ticket ainda</p>
              <p className="text-sm mt-1">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">N</kbd>{' '}
                para registrar o primeiro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Área</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Prioridade</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/${ticket.code}`}
                          className="font-mono text-xs text-primary hover:underline font-medium"
                        >
                          {ticket.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <Link href={`/tickets/${ticket.code}`} className="hover:underline line-clamp-1">
                          {ticket.title}
                        </Link>
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
                        {format(new Date(ticket.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
