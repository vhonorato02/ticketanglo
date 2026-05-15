import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  priority: 'Prioridade',
  assigneeId: 'Responsável',
  title: 'Título',
  description: 'Descrição',
  origin: 'Origem',
  subcategory: 'Subcategoria',
};

const STATUS_PT: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  resolvido: 'Resolvido',
  arquivado: 'Arquivado',
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

function humanize(val: string | null | undefined) {
  if (!val) return '—';
  return STATUS_PT[val] ?? val;
}

interface HistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  authorName: string | null;
}

export function HistoryLog({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <History className="size-3.5" />
        Histórico
      </h2>

      <ol className="space-y-2">
        {history.map((entry) => (
          <li key={entry.id} className="flex gap-2 text-xs text-muted-foreground">
            <span className="shrink-0 mt-0.5">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
            <span>
              <span className="font-medium text-foreground">{entry.authorName}</span>
              {' alterou '}
              <span className="font-medium">{FIELD_LABELS[entry.field] ?? entry.field}</span>
              {' de '}
              <span className="font-medium">{humanize(entry.oldValue)}</span>
              {' para '}
              <span className="font-medium">{humanize(entry.newValue)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
