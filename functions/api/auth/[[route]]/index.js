/**
 * Cloudflare Pages Function - Auth.js catch-all handler
 * Handles all /api/auth/* routes: signin, signout, callback, session, etc.
 */
import { handleAuth } from '../../_shared/auth.js';

export const onRequest = async (context) => {
  return handleAuth(context.request, context.env);
};
