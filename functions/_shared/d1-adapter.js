/**
 * D1 Adapter for Auth.js - uses Cloudflare Pages Function env
 */
import { D1Adapter } from '@auth/d1-adapter';

export function getD1Adapter(db) {
  return new D1Adapter(db);
}
