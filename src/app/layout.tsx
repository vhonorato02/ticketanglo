import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Nav } from '@/components/layout/nav';
import { auth } from '@/auth';
import { getUsers } from '@/actions/users';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'TicketAnglo — Anglo Pindamonhangaba',
  description: 'Sistema interno de gestão de demandas — TI e Marketing',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  let users: { id: string; displayName: string }[] = [];
  if (isAuthenticated) {
    try {
      const allUsers = await getUsers();
      users = allUsers
        .filter((u) => u.isActive)
        .map((u) => ({ id: u.id, displayName: u.displayName }));
    } catch {
      // DB not yet connected — graceful fallback
    }
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent dark-mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen`}>
        <Providers>
          {isAuthenticated && (
            <Nav
              user={session.user as { name?: string; isAdmin?: boolean }}
              users={users}
            />
          )}
          <main className={isAuthenticated ? 'max-w-7xl mx-auto px-4 py-6' : ''}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
