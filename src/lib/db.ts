/**
 * D1 Database utility functions
 */

export interface User {
  id: string;
  google_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export interface UsageStats {
  id: number;
  user_id: string;
  images_processed: number;
  last_processed_at: string;
}

/**
 * Create or get user from database
 */
export async function createOrUpdateUser(
  env: { DB: D1Database },
  googleId: string,
  email: string,
  name?: string,
  avatarUrl?: string
): Promise<User> {
  const userId = `user_${googleId}`;

  // Try to update existing user
  const existingUser = await env.DB.prepare(
    `SELECT * FROM users WHERE google_id = ?`
  ).bind(googleId).first<User>();

  if (existingUser) {
    // Update last login time
    await env.DB.prepare(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP, name = ?, avatar_url = ? WHERE id = ?`
    ).bind(name || null, avatarUrl || null, existingUser.id).run();

    return existingUser;
  }

  // Create new user
  await env.DB.prepare(
    `INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, googleId, email, name || null, avatarUrl || null).run();

  // Create usage stats for new user
  await env.DB.prepare(
    `INSERT INTO usage_stats (user_id, images_processed) VALUES (?, 0)`
  ).bind(userId).run();

  return {
    id: userId,
    google_id: googleId,
    email,
    name,
    avatar_url: avatarUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(
  env: { DB: D1Database },
  googleId: string
): Promise<User | null> {
  const user = await env.DB.prepare(
    `SELECT * FROM users WHERE google_id = ?`
  ).bind(googleId).first<User>();

  return user || null;
}

/**
 * Get user by ID
 */
export async function getUserById(
  env: { DB: D1Database },
  userId: string
): Promise<User | null> {
  const user = await env.DB.prepare(
    `SELECT * FROM users WHERE id = ?`
  ).bind(userId).first<User>();

  return user || null;
}

/**
 * Increment usage count
 */
export async function incrementUsage(
  env: { DB: D1Database },
  userId: string
): Promise<void> {
  await env.DB.prepare(
    `UPDATE usage_stats
     SET images_processed = images_processed + 1,
         last_processed_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(userId).run();
}

/**
 * Get user usage statistics
 */
export async function getUserUsage(
  env: { DB: D1Database },
  userId: string
): Promise<UsageStats | null> {
  const stats = await env.DB.prepare(
    `SELECT * FROM usage_stats WHERE user_id = ?`
  ).bind(userId).first<UsageStats>();

  return stats || null;
}

/**
 * Get user with usage stats
 */
export async function getUserWithUsage(
  env: { DB: D1Database },
  userId: string
): Promise<{ user: User; usage: UsageStats } | null> {
  const user = await getUserById(env, userId);
  if (!user) return null;

  const usage = await getUserUsage(env, userId);
  if (!usage) return null;

  return { user, usage };
}
