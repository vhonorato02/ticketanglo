'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/actions/users';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  isSelf?: boolean;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  isSelf = false,
}: ChangePasswordDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) {
      setError('');
      setShow(false);
      formRef.current?.reset();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const fd = new FormData(e.currentTarget);
    const newPassword = String(fd.get('newPassword') ?? '');
    const confirmPassword = String(fd.get('confirmPassword') ?? '');

    if (newPassword.length < 6) {
      setError('A senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    fd.append('userId', targetUserId);

    startTransition(async () => {
      const res = await changePassword(fd);
      if (res && 'error' in res) {
        setError(res.error ?? 'Não foi possível alterar a senha.');
        return;
      }
      toast.success(
        isSelf ? 'Senha atualizada com sucesso.' : `Senha de ${targetUserName} atualizada.`,
      );
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>
                {isSelf ? 'Alterar minha senha' : `Redefinir senha`}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isSelf
                  ? 'Defina uma nova senha para acessar sua conta.'
                  : `Defina uma nova senha para ${targetUserName}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={show ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                autoComplete="new-password"
                required
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={show ? 'text' : 'password'}
              placeholder="Digite novamente"
              minLength={6}
              autoComplete="new-password"
              required
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg ring-1 ring-inset ring-destructive/20">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
