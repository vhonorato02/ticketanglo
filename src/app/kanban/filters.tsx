'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  users: { id: string; displayName: string }[];
}

export function KanbanFilters({ users }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const activeArea = searchParams.get('area') ?? 'all';
  const activeAssignee = searchParams.get('assigneeId') ?? 'all';
  const hasActive = activeArea !== 'all' || activeAssignee !== 'all';

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Select value={activeArea} onValueChange={(v) => update('area', v)}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas áreas</SelectItem>
          <SelectItem value="TI">TI</SelectItem>
          <SelectItem value="MKT">Marketing</SelectItem>
        </SelectContent>
      </Select>

      <Select value={activeAssignee} onValueChange={(v) => update('assigneeId', v)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos responsáveis</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="text-xs text-muted-foreground gap-1.5 h-8"
        >
          <FilterX className="size-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
