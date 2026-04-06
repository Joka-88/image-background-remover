/**
 * Auth.js configuration for Cloudflare Pages Functions
 * Uses D1 Adapter for session/user storage
 */
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { D1Adapter } from '@auth/d1-adapter';

export function getAuthOptions(env) {
  return {
    providers: [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    adapter: new D1Adapter(env.DB),
    session: {
      strategy: 'jwt',
    },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id;
        }
        return session;
      },
    },
    secret: env.NEXTAUTH_SECRET,
  };
}
