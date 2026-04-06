/**
 * Cloudflare Pages Function - Remove background API
 * Handles POST /api/remove-bg
 */
import { Auth } from '@auth/core';
import { getAuthConfig } from '../../_shared/auth.js';

export const onRequest = async (context) => {
  const request = context.request;
  const env = context.env;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  const apiKey = env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image_file');
    if (!file) {
      return new Response(JSON.stringify({ error: '请上传图片文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: '请上传 JPG、PNG 或 WEBP 格式的图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > 12 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '图片大小不能超过 12MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', file);
    removeBgFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgFormData,
    });

    if (!response.ok) {
      let errorMsg = '处理失败，请稍后重试';
      if (response.status === 401) errorMsg = 'API 密钥无效';
      else if (response.status === 402) errorMsg = 'API 额度已用尽';
      else if (response.status === 429) errorMsg = '请求过于频繁，请稍后重试';

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const blob = await response.blob();

    // Increment usage in D1
    if (session.user.id) {
      try {
        await env.DB.prepare(
          'INSERT INTO usage_stats (user_id, images_processed) VALUES (?, 1) ON CONFLICT(user_id) DO UPDATE SET images_processed = images_processed + 1, last_processed_at = CURRENT_TIMESTAMP'
        ).bind(session.user.id).run();
      } catch (e) {
        console.error('Failed to update usage:', e);
      }
    }

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(JSON.stringify({ error: '处理失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
