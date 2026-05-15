'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Download, Inbox, X, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge, AreaBadge } from './ticket-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TicketRow } from '@/actions/tickets';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';

interface Props {
  tickets: TicketRow[];
}

function exportCSV(tickets: TicketRow[]) {
  const headers = ['Código', 'Área', 'Título', 'Subcategoria', 'Prioridade', 'Status', 'Autor', 'Criado em'];
  const rows = tickets.map((t) => [
    t.code,
    t.area,
    `"${t.title.replace(/"/g, '""')}"`,
    t.subcategory,
    PRIORITY_LABELS[t.priority],
    STATUS_LABELS[t.status],
    t.authorName ?? '',
    format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
  ]);

  const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tickets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TicketTable({ tickets }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  // Sync local state when URL changes externally
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
  }, [searchParams]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const activeArea = searchParams.get('area') ?? 'all';
  const activeStatus = searchParams.get('status') ?? 'all';
  const activePriority = searchParams.get('priority') ?? 'all';
  const hasActiveFilters =
    activeArea !== 'all' || activeStatus !== 'all' || activePriority !== 'all' || !!search;

  const clearFilters = () => router.push(pathname);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por código, título ou descrição..."
            className="pl-9 pr-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="search-input"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              aria-label="Limpar busca"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select value={activeArea} onValueChange={(v) => updateParam('area', v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas áreas</SelectItem>
            <SelectItem value="TI">TI</SelectItem>
            <SelectItem value="MKT">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activeStatus} onValueChange={(v) => updateParam('status', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="resolvido">Resolvido</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activePriority} onValueChange={(v) => updateParam('priority', v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground gap-1.5"
          >
            <FilterX className="size-3.5" />
            Limpar
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
            {tickets.length} {tickets.length === 1 ? 'demanda' : 'demandas'}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => exportCSV(tickets)}
            title="Exportar CSV"
            aria-label="Exportar CSV"
            disabled={tickets.length === 0}
          >
            <Download />
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {tickets.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <div className="size-12 rounded-2xl bg-muted/60 mx-auto flex items-center justify-center mb-4">
            <Inbox className="size-5 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {hasActiveFilters
              ? 'Nenhuma demanda encontrada com esses filtros'
              : 'Nenhuma demanda registrada'}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">
            {hasActiveFilters ? (
              <>Ajuste os filtros ou{' '}
                <button onClick={clearFilters} className="text-primary hover:underline">
                  limpe a busca
                </button>
                .
              </>
            ) : (
              <>
                Pressione <kbd className="kbd mx-0.5">N</kbd> para registrar a primeira.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                    Código
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                    Demanda
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                    Área
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Prioridade
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                    Criada
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer focus-within:bg-muted/40"
                    onClick={() => router.push(`/tickets/${ticket.code}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-primary font-medium">
                        {ticket.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="line-clamp-1 font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.subcategory}
                        {ticket.authorName && (
                          <> · por {ticket.authorName.split(' ')[0]}</>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <AreaBadge area={ticket.area} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
                      {format(new Date(ticket.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
