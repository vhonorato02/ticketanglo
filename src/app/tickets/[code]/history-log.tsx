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
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <History className="size-3.5" />
        Histórico de alterações
      </h2>

      <ol className="relative space-y-3 border-l border-border/70 pl-5 ml-1.5">
        {history.map((entry) => {
          const fieldLabel = FIELD_LABELS[entry.field] ?? entry.field;
          const oldVal = humanize(entry.oldValue);
          const next = humanize(entry.newValue);

          return (
            <li key={entry.id} className="relative text-xs">
              <span className="absolute -left-[1.6875rem] top-1 size-2.5 rounded-full bg-background border-2 border-border" />
              <div className="text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">
                  {entry.authorName ?? 'Sistema'}
                </span>
                {' alterou '}
                <span className="font-medium text-foreground">{fieldLabel}</span>
                {' de '}
                <span className="font-medium text-foreground">{oldVal}</span>
                {' para '}
                <span className="font-medium text-foreground">{next}</span>
                <span className="text-muted-foreground/70">
                  {' · '}
                  <time
                    dateTime={new Date(entry.createdAt).toISOString()}
                    className="tabular-nums"
                  >
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </time>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
