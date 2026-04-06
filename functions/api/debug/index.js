/**
 * Debug endpoint - /api/debug
 * Shows environment variable status and D1 connectivity
 * Remove in production
 */
export const onRequest = async (context) => {
  const env = context.env;
  const result = {
    env_check: {
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ? `SET (${env.GOOGLE_CLIENT_ID.substring(0, 15)}...)` : 'MISSING',
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ? `SET (${env.GOOGLE_CLIENT_SECRET.length} chars)` : 'MISSING',
      NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ? `SET (${env.NEXTAUTH_SECRET.length} chars)` : 'MISSING',
      NEXTAUTH_URL: env.NEXTAUTH_URL || 'MISSING',
      REMOVE_BG_API_KEY: env.REMOVE_BG_API_KEY ? 'SET' : 'MISSING',
    },
    d1_binding: env.DB ? 'EXISTS' : 'MISSING',
  };

  // Test D1 query
  if (env.DB) {
    try {
      const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      result.d1_tables = tables.results.map(r => r.name);
      
      // Test a simple write/read
      await env.DB.prepare("SELECT 1 as test").run();
      result.d1_query = 'OK';
    } catch (e) {
      result.d1_error = e.message;
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
