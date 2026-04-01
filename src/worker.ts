/**
 * Cloudflare Worker for D1 Database Operations
 */

import { createOrUpdateUser, incrementUsage, getUserByGoogleId, getUserWithUsage } from './lib/db';

export interface Env {
  DB: D1Database;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  REMOVE_BG_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // User operations
    if (path === '/api/user/create-or-update' && request.method === 'POST') {
      try {
        const body = await request.json();

        if (!body.googleId || !body.email) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = await createOrUpdateUser(
          env,
          body.googleId,
          body.email,
          body.name,
          body.avatarUrl
        );

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error creating/updating user:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user by Google ID
    if (path === '/api/user/get-by-google-id' && request.method === 'GET') {
      try {
        const googleId = url.searchParams.get('googleId');

        if (!googleId) {
          return new Response(
            JSON.stringify({ error: 'Missing googleId parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = await getUserByGoogleId(env, googleId);

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error getting user:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Increment usage
    if (path === '/api/user/increment-usage' && request.method === 'POST') {
      try {
        const body = await request.json();

        if (!body.userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await incrementUsage(env, body.userId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error incrementing usage:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user with usage stats
    if (path === '/api/user/get-with-usage' && request.method === 'GET') {
      try {
        const userId = url.searchParams.get('userId');

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await getUserWithUsage(env, userId);

        return new Response(
          JSON.stringify({ result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error getting user with usage:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Health check
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
