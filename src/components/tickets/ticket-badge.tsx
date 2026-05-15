import { Badge } from '@/components/ui/badge';
import { PRIORITY_LABELS, STATUS_LABELS, AREA_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/db/schema';

type Priority = Ticket['priority'];
type Status = Ticket['status'];
type Area = Ticket['area'];

const priorityVariant: Record<Priority, 'destructive' | 'orange' | 'warning' | 'success'> = {
  urgente: 'destructive',
  alta: 'orange',
  media: 'warning',
  baixa: 'success',
};

const priorityDot: Record<Priority, string> = {
  urgente: 'bg-destructive',
  alta: 'bg-orange-500',
  media: 'bg-amber-500',
  baixa: 'bg-green-500',
};

const statusVariant: Record<Status, 'secondary' | 'default' | 'warning' | 'success' | 'outline'> = {
  aberto: 'secondary',
  em_andamento: 'default',
  aguardando: 'warning',
  resolvido: 'success',
  arquivado: 'outline',
};

const statusDot: Record<Status, string> = {
  aberto: 'bg-zinc-400',
  em_andamento: 'bg-primary',
  aguardando: 'bg-amber-500',
  resolvido: 'bg-green-500',
  arquivado: 'bg-zinc-300 dark:bg-zinc-600',
};

export function PriorityBadge({ priority, withDot = true }: { priority: Priority; withDot?: boolean }) {
  return (
    <Badge variant={priorityVariant[priority]}>
      {withDot && <span className={cn('size-1.5 rounded-full', priorityDot[priority])} />}
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status, withDot = true }: { status: Status; withDot?: boolean }) {
  return (
    <Badge variant={statusVariant[status]}>
      {withDot && <span className={cn('size-1.5 rounded-full', statusDot[status])} />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function AreaBadge({ area }: { area: Area }) {
  return (
    <Badge variant={area === 'TI' ? 'default' : 'secondary'}>
      {AREA_LABELS[area]}
    </Badge>
  );
}
