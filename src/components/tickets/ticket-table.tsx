'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Download, SlidersHorizontal } from 'lucide-react';
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
  users: { id: string; displayName: string }[];
}

function exportCSV(tickets: TicketRow[]) {
  const headers = ['Código', 'Área', 'Título', 'Subcategoria', 'Prioridade', 'Status', 'Responsável', 'Criado em'];
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

export function TicketTable({ tickets, users }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
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
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="search-input"
          />
        </div>

        <Select
          value={searchParams.get('area') ?? 'all'}
          onValueChange={(v) => updateParam('area', v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas áreas</SelectItem>
            <SelectItem value="TI">TI</SelectItem>
            <SelectItem value="MKT">Marketing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('status') ?? 'all'}
          onValueChange={(v) => updateParam('status', v)}
        >
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

        <Select
          value={searchParams.get('priority') ?? 'all'}
          onValueChange={(v) => updateParam('priority', v)}
        >
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

        <Button variant="outline" size="icon" onClick={() => exportCSV(tickets)} title="Exportar CSV">
          <Download />
        </Button>
      </div>

      {/* Table */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <SlidersHorizontal className="mx-auto size-8 mb-3 opacity-40" />
          <p className="font-medium">Nenhum ticket encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou registre um novo ticket.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Área</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Prioridade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.code}`}
                        className="font-mono text-xs text-primary hover:underline font-medium"
                      >
                        {ticket.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <Link href={`/tickets/${ticket.code}`} className="hover:underline line-clamp-1">
                        {ticket.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">{ticket.subcategory}</span>
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
                      {format(new Date(ticket.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} encontrado{tickets.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
