'use client';

import { useTransition, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUser } from '@/actions/users';

export function CreateUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createUser(fd);
      if (res && 'error' in res) {
        setError(res.error ?? 'Não foi possível criar o usuário.');
        return;
      }
      const name = String(fd.get('displayName') ?? 'Usuário');
      toast.success(`${name} foi adicionado à equipe.`);
      formRef.current?.reset();
      setShowPwd(false);
      router.refresh();
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-5 space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">Usuário</Label>
          <Input
            id="username"
            name="username"
            placeholder="nome.sobrenome"
            pattern="[a-z0-9_]+"
            title="Apenas letras minúsculas, números e _"
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nome exibido</Label>
          <Input
            id="displayName"
            name="displayName"
            placeholder="Ex: Natália Costa"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha provisória</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              disabled={isPending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPwd ? 'Ocultar' : 'Mostrar'}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              name="isAdmin"
              value="true"
              className="size-4 rounded border-input accent-primary cursor-pointer"
              disabled={isPending}
            />
            <span>Conceder acesso de administrador</span>
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg ring-1 ring-inset ring-destructive/20">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-muted-foreground">
          O usuário poderá alterar a própria senha após o primeiro acesso.
        </p>
        <Button type="submit" disabled={isPending} className="gap-1.5 shrink-0">
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Adicionar
        </Button>
      </div>
    </form>
  );
}
