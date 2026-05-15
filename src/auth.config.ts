import type { NextAuthConfig } from 'next-auth';

// Edge-safe config (no DB/bcrypt imports) — used by middleware
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? '';
        token.username = (user as { username?: string }).username ?? '';
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.displayName = user.name ?? '';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as Record<string, unknown>).username = token.username;
      (session.user as Record<string, unknown>).isAdmin = token.isAdmin;
      session.user.name = token.displayName as string;
      return session;
    },
  },
  providers: [],
};
