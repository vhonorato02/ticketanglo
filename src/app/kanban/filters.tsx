'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
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
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex gap-2 flex-wrap">
      <Select
        value={searchParams.get('area') ?? 'all'}
        onValueChange={(v) => update('area', v)}
      >
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas áreas</SelectItem>
          <SelectItem value="TI">TI</SelectItem>
          <SelectItem value="MKT">Marketing</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('assigneeId') ?? 'all'}
        onValueChange={(v) => update('assigneeId', v)}
      >
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
