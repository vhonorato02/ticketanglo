'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Shield,
  ShieldOff,
  KeyRound,
  MoreVertical,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { toggleUserActive } from '@/actions/users';
import type { User } from '@/db/schema';

type UserItem = Pick<User, 'id' | 'username' | 'displayName' | 'isAdmin' | 'isActive' | 'createdAt'>;

interface UserListProps {
  users: UserItem[];
  currentUserId: string;
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<UserItem | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserItem | null>(null);

  const handleToggle = (user: UserItem) => {
    startTransition(async () => {
      const res = await toggleUserActive(user.id);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success(
          user.isActive
            ? `${user.displayName} foi desativado.`
            : `${user.displayName} foi reativado.`,
        );
        router.refresh();
      }
      setConfirmTarget(null);
    });
  };

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden divide-y">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                !user.isActive ? 'bg-muted/30' : ''
              }`}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {initials(user.displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{user.displayName}</span>
                  {user.isAdmin && (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="size-3" />
                      Admin
                    </Badge>
                  )}
                  {!user.isActive && (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                  {isSelf && (
                    <Badge variant="secondary">Você</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  @{user.username} · ingressou em{' '}
                  {format(new Date(user.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ações para ${user.displayName}`}
                    disabled={isPending}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onSelect={() => setPasswordTarget(user)}>
                    <KeyRound className="size-4" />
                    Redefinir senha
                  </DropdownMenuItem>
                  {!isSelf && (
                    <>
                      <DropdownMenuSeparator />
                      {user.isActive ? (
                        <DropdownMenuItem
                          onSelect={() => setConfirmTarget(user)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <ShieldOff className="size-4" />
                          Desativar acesso
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => handleToggle(user)}>
                          <Shield className="size-4" />
                          Reativar acesso
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={`Desativar ${confirmTarget?.displayName ?? 'usuário'}?`}
        description="O usuário não poderá mais entrar no sistema, mas todo o histórico será preservado. Você pode reativá-lo a qualquer momento."
        confirmLabel="Desativar"
        variant="destructive"
        onConfirm={() => {
          if (confirmTarget) handleToggle(confirmTarget);
        }}
      />

      {passwordTarget && (
        <ChangePasswordDialog
          open={!!passwordTarget}
          onOpenChange={(o) => !o && setPasswordTarget(null)}
          targetUserId={passwordTarget.id}
          targetUserName={passwordTarget.displayName}
          isSelf={passwordTarget.id === currentUserId}
        />
      )}
    </>
  );
}
