'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Kanban, List, Settings, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNewTicket: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Kanban', href: '/kanban', icon: Kanban },
  { label: 'Lista de tickets', href: '/tickets', icon: List },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function CommandPalette({ open, onClose, onNewTicket }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const actions = [
    {
      label: 'Novo ticket',
      icon: Plus,
      action: () => {
        onClose();
        onNewTicket();
      },
      keywords: 'novo registrar criar',
    },
    ...NAV_ITEMS.map((item) => ({
      label: item.label,
      icon: item.icon,
      action: () => {
        router.push(item.href);
        onClose();
      },
      keywords: item.label.toLowerCase(),
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
        filtered[selected].action();
        setQuery('');
      }
    },
    [filtered, selected],
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-md overflow-hidden">
        <div className="flex items-center border-b px-4 gap-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ação ou página..."
            className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma ação encontrada.
            </p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setQuery('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                    i === selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                  )}
                  onMouseEnter={() => setSelected(i)}
                >
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  {item.label}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t px-4 py-2 flex gap-4 text-xs text-muted-foreground">
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
          <span>Esc fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
