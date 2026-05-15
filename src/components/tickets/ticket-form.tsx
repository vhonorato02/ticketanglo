'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
  title: z.string().min(1, 'Título obrigatório').max(80, 'Máximo 80 caracteres'),
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

  const area = watch('area');
  const subcategory = watch('subcategory');
  const subcategories = area === 'TI' ? TI_SUBCATEGORIES : MKT_SUBCATEGORIES;

  const handleAreaChange = (v: 'TI' | 'MKT') => {
    setValue('area', v);
    setValue('subcategory', ''); // reset subcategory when area changes
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

      toast.success(`Ticket ${result.code} registrado com sucesso.`);
      reset();
      setShowExtra(false);
      onClose();
      router.refresh();
    });
  };

  const handleClose = () => {
    if (!isPending) {
      reset();
      setShowExtra(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar demanda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Area + Subcategoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área *</Label>
              <Select value={area} onValueChange={handleAreaChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TI">TI</SelectItem>
                  <SelectItem value="MKT">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategoria *</Label>
              {/* key={area} força remount do Select ao trocar área */}
              <Select
                key={area}
                value={subcategory ?? ''}
                onValueChange={(v) => setValue('subcategory', v)}
              >
                <SelectTrigger className="mt-1">
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
                <p className="text-xs text-destructive mt-1">{errors.subcategory.message}</p>
              )}
            </div>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              className="mt-1"
              placeholder="Ex: Projetor da sala 12 não liga"
              maxLength={80}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Prioridade */}
          <div>
            <Label>Prioridade</Label>
            <Select
              value={watch('priority')}
              onValueChange={(v) => setValue('priority', v as FormData['priority'])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente — precisa de atenção imediata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mais opções */}
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showExtra ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {showExtra ? 'Menos opções' : 'Mais opções'}
          </button>

          {showExtra && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label htmlFor="origin">Origem</Label>
                <Input
                  id="origin"
                  className="mt-1"
                  placeholder="Ex: WhatsApp da Profa. Júlia"
                  {...register('origin')}
                />
              </div>

              <div>
                <Label>Responsável</Label>
                <Select onValueChange={(v) => setValue('assigneeId', v)}>
                  <SelectTrigger className="mt-1">
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

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  className="mt-1 min-h-[80px]"
                  placeholder="Descreva o problema ou solicitação em detalhes..."
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
