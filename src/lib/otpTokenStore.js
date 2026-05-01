/**
 * In-memory one-time token store for OTP-verified sessions.
 * After Supabase verifies the OTP, we generate a short-lived token
 * that the client exchanges for a NextAuth session via the credentials provider.
 *
 * TTL: 60 seconds (token must be consumed quickly after OTP verification)
 */

const tokenStore = new Map();
const TOKEN_TTL_MS = 60_000; // 60 seconds

/**
 * Generate and store a one-time token for a verified email.
 * @param {string} email
 * @returns {string} the one-time token
 */
export function storeOtpToken(email) {
  const token = crypto.randomUUID();
  const normalizedEmail = email.toLowerCase().trim();

  tokenStore.set(normalizedEmail, {
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });

  return token;
}

/**
 * Consume (validate and remove) a one-time token.
 * @param {string} email
 * @param {string} token
 * @returns {boolean} true if valid
 */
export function consumeOtpToken(email, token) {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = tokenStore.get(normalizedEmail);

  if (!entry) return false;
  if (entry.token !== token) return false;
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(normalizedEmail);
    return false;
  }

  // Consume — one-time use
  tokenStore.delete(normalizedEmail);
  return true;
}

/**
 * Lazy cleanup — called periodically from rate limiter or on-demand.
 */
export function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [key, entry] of tokenStore.entries()) {
    if (now > entry.expiresAt) {
      tokenStore.delete(key);
    }
  }
}
