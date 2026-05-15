'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copy } from '@/lib/copy';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const form = event.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    startTransition(async () => {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(copy.auth.errors.invalidCredentials);
        return;
      }

      router.push('/');
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-background">
      <div
        className="absolute inset-0 -z-10 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent), transparent), radial-gradient(40% 40% at 80% 100%, color-mix(in oklch, var(--success) 10%, transparent), transparent)',
        }}
      />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex size-12 rounded-xl bg-primary items-center justify-center text-primary-foreground font-bold mb-5 shadow-lg shadow-primary/20">
            <Lock className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.brand.name}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{copy.brand.institution}</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username">{copy.auth.labels.username}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder={copy.auth.placeholders.username}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{copy.auth.labels.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={copy.auth.placeholders.password}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg ring-1 ring-inset ring-destructive/20"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? copy.auth.buttons.pending : copy.auth.buttons.submit}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {copy.brand.restrictedAccess}
        </p>
      </div>
    </div>
  );
}
