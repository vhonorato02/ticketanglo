'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  List,
  Settings,
  Plus,
  LogOut,
  Command,
  Menu,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { TicketForm } from '@/components/tickets/ticket-form';
import { CommandPalette } from '@/components/command-palette';
import { cn } from '@/lib/utils';
import type { User } from '@/db/schema';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/tickets', label: 'Tickets', icon: List },
];

interface NavProps {
  user: { name?: string | null; isAdmin?: boolean };
  users: Pick<User, 'id' | 'displayName'>[];
}

export function Nav({ user, users }: NavProps) {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen(true);
      return;
    }
    if (e.key === 'k' && !e.metaKey && !e.ctrlKey) {
      setPaletteOpen(true);
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      setFormOpen(true);
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 flex h-14 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm shrink-0">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              A
            </div>
            <span className="hidden sm:block">Anglo Pinda</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === href
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Command palette hint */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 text-muted-foreground h-8 text-xs"
              onClick={() => setPaletteOpen(true)}
            >
              <Command className="size-3" />
              <span>K</span>
            </Button>

            {/* New ticket */}
            <Button size="sm" onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:block">Novo</span>
            </Button>

            <ThemeToggle />

            {/* User menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="gap-1.5 text-muted-foreground hidden md:flex"
              title="Sair"
            >
              <LogOut className="size-4" />
            </Button>

            {(user as { isAdmin?: boolean }).isAdmin && (
              <Link href="/configuracoes">
                <Button variant="ghost" size="icon" title="Configurações">
                  <Settings className="size-4" />
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === href
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            {(user as { isAdmin?: boolean }).isAdmin && (
              <Link
                href="/configuracoes"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
              >
                <Settings className="size-4" />
                Configurações
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <LogOut className="size-4" />
              Sair — {user.name}
            </button>
          </div>
        )}
      </header>

      <TicketForm open={formOpen} onClose={() => setFormOpen(false)} users={users} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTicket={() => setFormOpen(true)}
      />
    </>
  );
}
