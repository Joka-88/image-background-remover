/**
 * Cloudflare Pages Function - Auth.js catch-all handler
 * Handles all /api/auth/* routes: signin, signout, callback, session, etc.
 */
import { Auth } from '@auth/core';
import Google from '@auth/core/providers/google';
import { D1Adapter } from '@auth/d1-adapter';

function getAuthConfig(env) {
  return {
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    adapter: new D1Adapter(env.DB),
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.id = user.id; }
        return token;
      },
      async session({ session, token }) {
        if (session.user) { session.user.id = token.id; }
        return session;
      },
    },
    secret: env.NEXTAUTH_SECRET,
    trustHost: true,
    basePath: '/api/auth',
  };
}

export const onRequest = async (context) => {
  const config = getAuthConfig(context.env);
  return Auth(context.request, config);
};
