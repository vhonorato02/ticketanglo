import type { NextAuthConfig } from 'next-auth';

// Edge-safe config (no DB/bcrypt imports) — used by middleware
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      if (isLoggedIn) return true;

      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', nextUrl.href);
      return Response.redirect(loginUrl);
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
      session.user.name = token.displayName as string;
      Object.assign(session.user, { username: token.username, isAdmin: token.isAdmin });
      return session;
    },
  },
  providers: [],
};
