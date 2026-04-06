/**
 * Auth.js v5 configuration for Cloudflare Pages Functions
 * Uses @auth/core directly (not next-auth) for framework-agnostic auth
 */
import { Auth } from '@auth/core';
import Google from '@auth/core/providers/google';
import { D1Adapter } from '@auth/d1-adapter';

export function getAuthConfig(env) {
  const baseUrl = env.NEXTAUTH_URL || 'https://backgroundremoverpro.online';
  
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
    trustHost: true,
    basePath: '/api/auth',
  };
}

/**
 * Handle auth request using @auth/core Auth function
 * Routes: /api/auth/signin, /api/auth/callback/*, /api/auth/session, /api/auth/signout
 */
export async function handleAuth(request, env) {
  const config = getAuthConfig(env);
  const response = await Auth(request, config);
  return response;
}

/**
 * Get current session from request
 */
export async function getSession(request, env) {
  const config = getAuthConfig(env);
  // Use raw mode to get session data
  const { raw } = await import('@auth/core');
  const response = await Auth(request, { ...config, raw });
  return response;
}
