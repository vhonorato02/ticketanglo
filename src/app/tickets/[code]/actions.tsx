'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  UserCheck,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Archive,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { updateTicketStatus, updateTicketField } from '@/actions/tickets';
import { cn } from '@/lib/utils';
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

interface ActionMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'outline' | 'ghost';
  destructive?: boolean;
  confirm?: { title: string; description: string };
}

const STATUS_ACTIONS: Record<Ticket['status'], ActionMeta> = {
  aberto: {
    label: 'Reabrir',
    icon: RotateCcw,
    variant: 'outline',
  },
  em_andamento: {
    label: 'Iniciar atendimento',
    icon: PlayCircle,
    variant: 'outline',
  },
  aguardando: {
    label: 'Marcar como aguardando',
    icon: PauseCircle,
    variant: 'outline',
  },
  resolvido: {
    label: 'Marcar como resolvido',
    icon: CheckCircle2,
    variant: 'default',
  },
  arquivado: {
    label: 'Arquivar',
    icon: Archive,
    variant: 'ghost',
    confirm: {
      title: 'Arquivar esta demanda?',
      description:
        'Demandas arquivadas saem do quadro Kanban e da lista padrão. Você pode desarquivá-la depois.',
    },
  },
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
  const [pendingStatus, setPendingStatus] = useState<Ticket['status'] | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<Ticket['status'] | null>(null);

  const performStatusChange = (newStatus: Ticket['status']) => {
    setPendingStatus(newStatus);
    startTransition(async () => {
      const res = await updateTicketStatus(ticket.code, newStatus);
      setPendingStatus(null);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success(`Status alterado para "${STATUS_LABELS_PT[newStatus]}".`);
        router.refresh();
      }
    });
  };

  const handleStatusChange = (newStatus: Ticket['status']) => {
    const meta = STATUS_ACTIONS[newStatus];
    if (meta.confirm) {
      setConfirmStatus(newStatus);
      return;
    }
    performStatusChange(newStatus);
  };

  const handleAssigneeChange = (userId: string) => {
    startTransition(async () => {
      const res = await updateTicketField(
        ticket.code,
        'assigneeId',
        userId === 'none' ? null : userId,
      );
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        const newAssignee = users.find((u) => u.id === userId);
        toast.success(
          userId === 'none'
            ? 'Responsável removido.'
            : `Atribuído a ${newAssignee?.displayName ?? 'usuário'}.`,
        );
        router.refresh();
      }
    });
  };

  const handlePriorityChange = (priority: string) => {
    startTransition(async () => {
      const res = await updateTicketField(ticket.code, 'priority', priority);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success('Prioridade atualizada.');
        router.refresh();
      }
    });
  };

  const nextStatuses = STATUS_TRANSITIONS[ticket.status];
  const confirmMeta = confirmStatus ? STATUS_ACTIONS[confirmStatus] : null;

  return (
    <>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border bg-card p-4 space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Settings2 className="size-3.5" />
            Ações
          </h3>

          {/* Status transitions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mudar status</p>
            <div className="flex flex-col gap-1.5">
              {nextStatuses.map((s) => {
                const meta = STATUS_ACTIONS[s];
                const Icon = meta.icon;
                const isLoading = pendingStatus === s;
                return (
                  <Button
                    key={s}
                    variant={meta.variant}
                    size="sm"
                    className={cn(
                      'justify-start text-xs h-8',
                      meta.variant === 'ghost' && 'text-muted-foreground',
                    )}
                    disabled={isPending}
                    onClick={() => handleStatusChange(s)}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Icon />}
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Assignee */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Responsável</p>
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
                className="w-full text-xs gap-1.5 h-7 text-muted-foreground"
                disabled={isPending}
                onClick={() => handleAssigneeChange(currentUserId)}
              >
                <UserCheck className="size-3.5" />
                Atribuir a mim
              </Button>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Priority */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Prioridade</p>
            <Select
              value={ticket.priority}
              onValueChange={handlePriorityChange}
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

        {/* Meta info */}
        <div className="rounded-xl border bg-card p-4 space-y-2.5 text-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Detalhes
          </h3>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Aberta por</span>
            <span className="font-medium text-right truncate">
              {ticket.author?.displayName ?? '—'}
            </span>
          </div>
          {ticket.assignee && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Responsável</span>
              <span className="font-medium text-right truncate">
                {ticket.assignee.displayName}
              </span>
            </div>
          )}
          {ticket.resolvedAt && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Resolvida em</span>
              <span className="font-medium text-right">
                {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </aside>

      <ConfirmDialog
        open={!!confirmStatus}
        onOpenChange={(o) => !o && setConfirmStatus(null)}
        title={confirmMeta?.confirm?.title ?? ''}
        description={confirmMeta?.confirm?.description ?? ''}
        confirmLabel={confirmMeta?.label ?? 'Confirmar'}
        variant={confirmStatus === 'arquivado' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (confirmStatus) performStatusChange(confirmStatus);
        }}
      />
    </>
  );
}
