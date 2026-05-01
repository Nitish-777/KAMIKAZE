/**
 * Rate Limiter using in-memory store.
 * Uses lazy cleanup instead of setInterval to avoid leaks in serverless environments.
 */

const rateLimitStore = new Map();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000; // Clean up every 60s

const RATE_LIMIT_CONFIG = {
  default: { limit: 100, windowMs: 15 * 60 * 1000 },
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  register: { limit: 3, windowMs: 60 * 60 * 1000 },
  reviews: { limit: 10, windowMs: 60 * 60 * 1000 },
  orders: { limit: 20, windowMs: 60 * 60 * 1000 },
  cart: { limit: 50, windowMs: 15 * 60 * 1000 },
};

/**
 * Lazy cleanup — runs only when enough time has passed since last cleanup.
 */
function lazyCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function checkRateLimit(req, userId = null, endpoint = 'default') {
  lazyCleanup();

  const config = RATE_LIMIT_CONFIG[endpoint] || RATE_LIMIT_CONFIG.default;
  const ip = getClientIP(req);
  const key = userId ? `user:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`;
  const now = Date.now();

  let limitData = rateLimitStore.get(key);

  if (!limitData || now >= limitData.resetTime) {
    limitData = { count: 0, resetTime: now + config.windowMs };
  }

  limitData.count += 1;
  rateLimitStore.set(key, limitData);

  const remaining = Math.max(0, config.limit - limitData.count);
  const allowed = limitData.count <= config.limit;
  const retryAfter = allowed ? 0 : Math.ceil((limitData.resetTime - now) / 1000);

  return { allowed, remaining, resetTime: limitData.resetTime, retryAfter, limit: config.limit };
}

export function createRateLimitResponse(req, userId = null, endpoint = 'default') {
  const { allowed, remaining, retryAfter, limit } = checkRateLimit(req, userId, endpoint);

  if (!allowed) {
    return {
      response: new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter,
          rateLimit: { limit, remaining },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
      rateLimitExceeded: true,
    };
  }

  return {
    rateLimitExceeded: false,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
    },
  };
}
