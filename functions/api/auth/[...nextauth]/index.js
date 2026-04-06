/**
 * Cloudflare Pages Function - Auth.js handler
 * Handles /api/auth/* routes
 */
import NextAuth from 'next-auth';
import { getAuthOptions } from '../_shared/auth.js';

export const onRequest = async (context) => {
  const authOptions = getAuthOptions(context.env);
  const handler = NextAuth(authOptions);
  return handler(context.request);
};
