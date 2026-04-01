export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update user
    if (path === '/api/user/create-or-update' && request.method === 'POST') {
      try {
        const body = await request.json();

        if (!body.googleId || !body.email) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userId = `user_${body.googleId}`;

        // Check if user exists
        const existingUser = await env.DB.prepare(
          'SELECT * FROM users WHERE google_id = ?'
        ).bind(body.googleId).first();

        let user;
        if (existingUser) {
          await env.DB.prepare(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, name = ?, avatar_url = ? WHERE id = ?'
          ).bind(body.name || null, body.avatarUrl || null, existingUser.id).run();
          user = existingUser;
        } else {
          await env.DB.prepare(
            'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
          ).bind(userId, body.googleId, body.email, body.name || null, body.avatarUrl || null).run();

          await env.DB.prepare(
            'INSERT INTO usage_stats (user_id, images_processed) VALUES (?, 0)'
          ).bind(userId).run();

          user = {
            id: userId,
            google_id: body.googleId,
            email: body.email,
            name: body.name,
            avatar_url: body.avatarUrl,
          };
        }

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
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
            JSON.stringify({ error: 'Missing googleId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE google_id = ?'
        ).bind(googleId).first();

        return new Response(
          JSON.stringify({ user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
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

        await env.DB.prepare(
          'UPDATE usage_stats SET images_processed = images_processed + 1, last_processed_at = CURRENT_TIMESTAMP WHERE user_id = ?'
        ).bind(body.userId).run();

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user with usage
    if (path === '/api/user/get-with-usage' && request.method === 'GET') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const user = await env.DB.prepare(
          'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first();

        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const usage = await env.DB.prepare(
          'SELECT * FROM usage_stats WHERE user_id = ?'
        ).bind(userId).first();

        return new Response(
          JSON.stringify({ result: { user, usage } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  },
};
