/**
 * Cloudflare Pages Function - User stats API
 * Handles GET /api/user/stats
 */
import { Auth } from '@auth/core';
import { getAuthConfig } from '../../_shared/auth.js';

export const onRequest = async (context) => {
  const request = context.request;
  const env = context.env;

  // Check auth via @auth/core session
  const config = getAuthConfig(env);
  const sessionRes = await Auth(request, { ...config, raw: true });
  const session = sessionRes?.body ? await new Response(sessionRes.body).json() : null;

  if (!session?.user) {
    return new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error fetching stats:', error);
    return new Response(JSON.stringify({ error: '获取统计失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
