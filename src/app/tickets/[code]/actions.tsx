'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTicketStatus, updateTicketField } from '@/actions/tickets';
import type { Ticket, User } from '@/db/schema';

interface TicketActionsProps {
  ticket: Ticket & {
    author: { id: string; displayName: string; username: string } | undefined;
    assignee: { id: string; displayName: string; username: string } | null;
  };
  users: Pick<User, 'id' | 'displayName' | 'isActive'>[];
  currentUserId: string;
}

const STATUS_TRANSITIONS: Record<Ticket['status'], Ticket['status'][]> = {
  aberto: ['em_andamento', 'aguardando', 'resolvido', 'arquivado'],
  em_andamento: ['aguardando', 'resolvido', 'arquivado', 'aberto'],
  aguardando: ['em_andamento', 'resolvido', 'arquivado', 'aberto'],
  resolvido: ['aberto', 'arquivado'],
  arquivado: ['aberto'],
};

const STATUS_LABELS_PT: Record<Ticket['status'], string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  resolvido: 'Resolvido',
  arquivado: 'Arquivado',
};

export function TicketActions({ ticket, users, currentUserId }: TicketActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: Ticket['status']) => {
    startTransition(async () => {
      const res = await updateTicketStatus(ticket.code, newStatus);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success(`Status alterado para "${STATUS_LABELS_PT[newStatus]}".`);
        router.refresh();
      }
    });
  };

  const handleAssigneeChange = (userId: string) => {
    startTransition(async () => {
      const res = await updateTicketField(ticket.code, 'assigneeId', userId === 'none' ? null : userId);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success('Responsável atualizado.');
        router.refresh();
      }
    });
  };

  const handleAssignToMe = () => {
    handleAssigneeChange(currentUserId);
  };

  const nextStatuses = STATUS_TRANSITIONS[ticket.status];

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ações
        </h3>

        {/* Status */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Mover para</p>
          <div className="flex flex-col gap-1.5">
            {nextStatuses.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                disabled={isPending}
                onClick={() => handleStatusChange(s)}
              >
                {isPending && <Loader2 className="animate-spin" />}
                {STATUS_LABELS_PT[s]}
              </Button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Responsável</p>
          <Select
            value={ticket.assigneeId ?? 'none'}
            onValueChange={handleAssigneeChange}
            disabled={isPending}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Sem responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {ticket.assigneeId !== currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1.5"
              disabled={isPending}
              onClick={handleAssignToMe}
            >
              <UserCheck className="size-3.5" />
              Atribuir a mim
            </Button>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Prioridade</p>
          <Select
            value={ticket.priority}
            onValueChange={(v) => {
              startTransition(async () => {
                await updateTicketField(ticket.code, 'priority', v);
                toast.success('Prioridade atualizada.');
                router.refresh();
              });
            }}
            disabled={isPending}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border bg-card p-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Criado por</span>
          <span className="font-medium text-foreground">{ticket.author?.displayName}</span>
        </div>
        {ticket.assignee && (
          <div className="flex justify-between">
            <span>Atribuído a</span>
            <span className="font-medium text-foreground">{ticket.assignee.displayName}</span>
          </div>
        )}
        {ticket.resolvedAt && (
          <div className="flex justify-between">
            <span>Resolvido em</span>
            <span className="font-medium text-foreground">
              {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
