'use client';

import { useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUser } from '@/actions/users';

export function CreateUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createUser(fd);
      if (res && 'error' in res) {
        toast.error(res.error);
      } else {
        toast.success('Usuário criado com sucesso.');
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              name="username"
              className="mt-1"
              placeholder="nome.sobrenome"
              pattern="[a-z0-9_]+"
              title="Apenas letras minúsculas, números e _"
              required
            />
          </div>
          <div>
            <Label htmlFor="displayName">Nome exibido *</Label>
            <Input
              id="displayName"
              name="displayName"
              className="mt-1"
              placeholder="Ex: Natália Costa"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              className="mt-1"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer mb-1">
              <input type="checkbox" name="isAdmin" value="true" className="rounded" />
              Administrador
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Criar usuário
          </Button>
        </div>
      </form>
    </div>
  );
}
