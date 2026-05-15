'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Shield, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toggleUserActive } from '@/actions/users';
import type { User } from '@/db/schema';

interface UserListProps {
  users: Pick<User, 'id' | 'username' | 'displayName' | 'isAdmin' | 'isActive' | 'createdAt'>[];
  currentUserId: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (userId: string, isActive: boolean) => {
    startTransition(async () => {
      const res = await toggleUserActive(userId);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success(isActive ? 'Usuário desativado.' : 'Usuário reativado.');
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      {users.map((user, i) => (
        <div
          key={user.id}
          className={`flex items-center gap-3 px-4 py-3 ${i !== users.length - 1 ? 'border-b' : ''} ${!user.isActive ? 'opacity-50' : ''}`}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(user.displayName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{user.displayName}</span>
              {user.isAdmin && (
                <Badge variant="default" className="text-xs py-0">
                  Admin
                </Badge>
              )}
              {!user.isActive && (
                <Badge variant="outline" className="text-xs py-0">
                  Inativo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>

          <div className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
            desde {format(new Date(user.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
          </div>

          {user.id !== currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => handleToggle(user.id, user.isActive)}
              className="text-xs text-muted-foreground gap-1.5 shrink-0"
            >
              {user.isActive ? (
                <>
                  <ShieldOff className="size-3.5" />
                  Desativar
                </>
              ) : (
                <>
                  <Shield className="size-3.5" />
                  Reativar
                </>
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
