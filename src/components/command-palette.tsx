'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Kanban,
  List,
  Settings,
  Plus,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNewTicket: () => void;
}

const NAV_ITEMS = [
  { label: 'Painel', href: '/', icon: LayoutDashboard },
  { label: 'Quadro Kanban', href: '/kanban', icon: Kanban },
  { label: 'Lista de demandas', href: '/tickets', icon: List },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function CommandPalette({ open, onClose, onNewTicket }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const actions = [
    {
      label: 'Registrar nova demanda',
      icon: Plus,
      action: () => {
        onClose();
        onNewTicket();
      },
      keywords: 'novo registrar criar ticket demanda',
      group: 'Ações',
    },
    ...NAV_ITEMS.map((item) => ({
      label: item.label,
      icon: item.icon,
      action: () => {
        router.push(item.href);
        onClose();
      },
      keywords: item.label.toLowerCase(),
      group: 'Ir para',
    })),
  ];

  const filtered = query
    ? actions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.keywords.includes(query.toLowerCase()),
      )
    : actions;

  useEffect(() => {
    setSelected(0);
  }, [filtered.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        filtered[selected].action();
        setQuery('');
      }
    },
    [filtered, selected],
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Group items
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <DialogTitle className="sr-only">Buscar ação ou página</DialogTitle>
        <div className="flex items-center border-b px-4 gap-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="O que você quer fazer?"
            className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <kbd className="kbd">esc</kbd>
        </div>

        <div className="py-1.5 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma ação encontrada para “{query}”.
            </p>
          ) : (
            Object.entries(groups).map(([group, items], gi) => {
              let runningIndex = filtered.findIndex((f) => f === items[0]);
              return (
                <div key={group} className={gi > 0 ? 'mt-1.5' : ''}>
                  <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  {items.map((item) => {
                    const i = runningIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          setQuery('');
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left mx-1.5 rounded-md',
                          'w-[calc(100%-0.75rem)]',
                          i === selected
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50',
                        )}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <Icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {i === selected && (
                          <CornerDownLeft className="size-3 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t px-4 py-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ArrowUp className="size-3" />
            <ArrowDown className="size-3" />
            navegar
          </span>
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="size-3" />
            selecionar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
