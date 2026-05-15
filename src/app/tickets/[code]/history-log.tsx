import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  priority: 'prioridade',
  responsável: 'responsável',
  assigneeId: 'responsável',
  title: 'título',
  description: 'descrição',
  origin: 'origem',
  subcategory: 'subcategoria',
};

const VALUE_PT: Record<string, string> = {
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

function humanize(val: string | null | undefined): string {
  if (!val) return 'ninguém';
  return VALUE_PT[val] ?? val;
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
        Histórico de alterações
      </h2>

      <ol className="space-y-2 border-l border-border pl-4">
        {history.map((entry) => {
          const fieldLabel = FIELD_LABELS[entry.field] ?? entry.field;
          const old = humanize(entry.oldValue);
          const next = humanize(entry.newValue);

          return (
            <li key={entry.id} className="relative text-xs text-muted-foreground">
              <span className="absolute -left-[1.375rem] top-1 size-2 rounded-full bg-border" />
              <span className="text-muted-foreground/60 tabular-nums mr-2">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
              <span className="font-medium text-foreground">{entry.authorName}</span>
              {' alterou '}
              <span className="font-medium">{fieldLabel}</span>
              {' de '}
              <span className="font-medium">{old}</span>
              {' para '}
              <span className="font-medium">{next}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
