'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AREA_OPTIONS } from '@/lib/constants';
import { copy } from '@/lib/copy';

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
      <Select value={activeArea} onValueChange={(value) => update('area', value)}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder={copy.kanban.filters.area} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{copy.kanban.filters.allAreas}</SelectItem>
          {AREA_OPTIONS.map((area) => (
            <SelectItem key={area.value} value={area.value}>
              {area.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={activeAssignee} onValueChange={(value) => update('assigneeId', value)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder={copy.kanban.filters.assignee} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{copy.kanban.filters.allAssignees}</SelectItem>
          <SelectItem value="unassigned">{copy.tickets.table.unassigned}</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.displayName}
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
          {copy.common.clear}
        </Button>
      )}
    </div>
  );
}
