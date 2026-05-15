import { Badge } from '@/components/ui/badge';
import { PRIORITY_LABELS, STATUS_LABELS, AREA_LABELS } from '@/lib/constants';
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

const statusVariant: Record<Status, 'secondary' | 'default' | 'warning' | 'success' | 'outline'> = {
  aberto: 'secondary',
  em_andamento: 'default',
  aguardando: 'warning',
  resolvido: 'success',
  arquivado: 'outline',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={priorityVariant[priority]}>{PRIORITY_LABELS[priority]}</Badge>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

export function AreaBadge({ area }: { area: Area }) {
  return (
    <Badge variant={area === 'TI' ? 'default' : 'secondary'}>{AREA_LABELS[area]}</Badge>
  );
}
