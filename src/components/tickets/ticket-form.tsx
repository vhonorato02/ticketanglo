'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTicket } from '@/actions/tickets';
import { TI_SUBCATEGORIES, MKT_SUBCATEGORIES } from '@/lib/constants';
import type { User } from '@/db/schema';

const schema = z.object({
  area: z.enum(['TI', 'MKT']),
  title: z.string().min(1, 'Dê um título à demanda').max(80, 'Máximo de 80 caracteres'),
  subcategory: z.string().min(1, 'Escolha uma subcategoria'),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente']),
  description: z.string().optional(),
  origin: z.string().optional(),
  assigneeId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  users: Pick<User, 'id' | 'displayName'>[];
}

export function TicketForm({ open, onClose, users }: TicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showExtra, setShowExtra] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'media', area: 'TI' },
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        reset({ priority: 'media', area: 'TI' });
        setShowExtra(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  const area = watch('area');
  const subcategory = watch('subcategory');
  const subcategories = area === 'TI' ? TI_SUBCATEGORIES : MKT_SUBCATEGORIES;

  const handleAreaChange = (v: 'TI' | 'MKT') => {
    setValue('area', v);
    setValue('subcategory', '');
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '') fd.append(k, String(v));
      });

      const result = await createTicket(fd);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`Demanda ${result.code} registrada.`, {
        description: data.title,
        action: {
          label: 'Abrir',
          onClick: () => router.push(`/tickets/${result.code}`),
        },
      });
      reset({ priority: 'media', area: 'TI' });
      setShowExtra(false);
      onClose();
      router.refresh();
    });
  };

  const handleClose = () => {
    if (!isPending) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Nova demanda</DialogTitle>
              <DialogDescription className="mt-1">
                Registre uma solicitação para TI ou Marketing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Area + Subcategoria */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={area} onValueChange={handleAreaChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="MKT">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Subcategoria</Label>
              <Select
                key={area}
                value={subcategory ?? ''}
                onValueChange={(v) => setValue('subcategory', v)}
              >
                <SelectTrigger aria-invalid={!!errors.subcategory}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subcategory && (
                <p className="text-xs text-destructive">{errors.subcategory.message}</p>
              )}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Projetor da sala 12 não liga"
              maxLength={80}
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Prioridade */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select
              value={watch('priority')}
              onValueChange={(v) => setValue('priority', v as FormData['priority'])}
            >
              <SelectTrigger>
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

          {/* Mais opções */}
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            {showExtra ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {showExtra ? 'Ocultar opções avançadas' : 'Opções avançadas'}
          </button>

          {showExtra && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  placeholder="Ex: WhatsApp da Profa. Júlia"
                  {...register('origin')}
                />
                <p className="text-xs text-muted-foreground">
                  De onde a solicitação veio: pessoa, canal, sala.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Responsável inicial</Label>
                <Select
                  value={watch('assigneeId') ?? ''}
                  onValueChange={(v) => setValue('assigneeId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes do problema, contexto, prazo desejado..."
                  className="min-h-[100px]"
                  {...register('description')}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Registrar demanda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
