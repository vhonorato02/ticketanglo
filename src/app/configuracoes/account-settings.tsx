'use client';

import { useState } from 'react';
import { KeyRound, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

interface AccountSettingsProps {
  userId: string;
  displayName: string;
  isAdmin: boolean;
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

export function AccountSettings({ userId, displayName, isAdmin }: AccountSettingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{displayName || 'Usuário'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {isAdmin ? (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="size-3" />
                  Administrador
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <UserIcon className="size-3" />
                  Usuário
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <KeyRound className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium">Senha</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Atualize sua senha periodicamente para manter a conta segura.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            Alterar senha
          </Button>
        </div>
      </div>

      <ChangePasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        targetUserId={userId}
        targetUserName={displayName}
        isSelf
      />
    </>
  );
}
