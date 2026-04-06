/**
 * Cloudflare Pages Function - User stats API
 * Handles GET /api/user/stats
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
    session: { strategy: 'jwt' },
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

async function getSession(request, env) {
  const url = new URL(request.url);
  url.pathname = '/api/auth/session';
  const sessionRequest = new Request(url.toString(), {
    headers: request.headers,
    method: 'GET',
  });
  const config = getAuthConfig(env);
  const response = await Auth(sessionRequest, config);
  if (response.status !== 200) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const onRequest = async (context) => {
  const request = context.request;
  const env = context.env;

  const session = await getSession(request, env);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userId = session.user.id;
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    let stats = await env.DB.prepare('SELECT * FROM usage_stats WHERE user_id = ?').bind(userId).first();
    if (!stats && user) {
      await env.DB.prepare('INSERT INTO usage_stats (user_id, images_processed) VALUES (?, 0)').bind(userId).run();
      stats = { user_id: userId, images_processed: 0, last_processed_at: new Date().toISOString() };
    }

    return new Response(JSON.stringify({
      result: {
        user: user || { id: userId, email: session.user.email, name: session.user.name },
        usage: stats || { images_processed: 0, last_processed_at: new Date().toISOString() },
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return new Response(JSON.stringify({ error: '获取统计失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
