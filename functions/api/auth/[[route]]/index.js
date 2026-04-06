/**
 * Cloudflare Pages Function - Auth.js catch-all handler
 * Handles all /api/auth/* routes
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
    debug: true,
  };
}

export const onRequest = async (context) => {
  try {
    console.log('[auth] DB binding:', context.env.DB ? 'EXISTS' : 'MISSING');
    console.log('[auth] GOOGLE_CLIENT_ID:', context.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('[auth] GOOGLE_CLIENT_SECRET:', context.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('[auth] NEXTAUTH_SECRET:', context.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING');
    console.log('[auth] NEXTAUTH_URL:', context.env.NEXTAUTH_URL || 'MISSING');

    const config = getAuthConfig(context.env);
    const response = await Auth(context.request, config);
    console.log('[auth] Response status:', response.status);
    return response;
  } catch (error) {
    console.error('[auth] FATAL ERROR:', error.message);
    console.error('[auth] Stack:', error.stack);
    return new Response(JSON.stringify({
      error: 'Auth configuration error',
      message: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
