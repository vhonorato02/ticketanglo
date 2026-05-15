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
  Menu,
  X,
  User as UserIcon,
  KeyRound,
  ChevronDown,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { TicketForm } from '@/components/tickets/ticket-form';
import { CommandPalette } from '@/components/command-palette';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { cn } from '@/lib/utils';
import type { User } from '@/db/schema';

const NAV_LINKS = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/kanban', label: 'Quadro', icon: Kanban },
  { href: '/tickets', label: 'Demandas', icon: List },
];

interface NavProps {
  user: { id?: string; name?: string | null; isAdmin?: boolean };
  users: Pick<User, 'id' | 'displayName'>[];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Nav({ user, users }: NavProps) {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
    if ((e.target as HTMLElement)?.isContentEditable) return;

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen(true);
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
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

  const userName = user.name ?? 'Usuário';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-semibold shrink-0 group">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20 transition-transform group-hover:scale-105">
              T
            </div>
            <span className="hidden sm:block tracking-tight">TicketAnglo</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 h-9 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Command palette hint */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted hover:border-foreground/20 transition-colors"
              aria-label="Buscar (Ctrl+K)"
            >
              <span>Buscar</span>
              <span className="kbd">⌘K</span>
            </button>

            {/* Novo */}
            <Button
              size="sm"
              onClick={() => setFormOpen(true)}
              className="gap-1.5 shadow-sm shadow-primary/20"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nova demanda</span>
            </Button>

            <ThemeToggle />

            {/* User menu (desktop) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden md:flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-md hover:bg-accent transition-colors"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                      {initials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-tight">{userName}</p>
                    {user.isAdmin && (
                      <p className="text-xs text-muted-foreground">Administrador</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPasswordDialogOpen(true)}>
                  <KeyRound className="size-4" />
                  Alterar minha senha
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/configuracoes">
                      <Settings className="size-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => signOut({ callbackUrl: '/login' })}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
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
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setPasswordDialogOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              <KeyRound className="size-4" />
              Alterar minha senha
            </button>
            {user.isAdmin && (
              <Link
                href="/configuracoes"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60"
              >
                <Settings className="size-4" />
                Configurações
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sair — {userName}
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
      {user.id && (
        <ChangePasswordDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
          targetUserId={user.id}
          targetUserName={userName}
          isSelf
        />
      )}
    </>
  );
}
