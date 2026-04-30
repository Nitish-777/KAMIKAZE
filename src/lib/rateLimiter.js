/**
 * Rate Limiter using in-memory store (for production, use Redis)
 * Format: IP or UserID -> { count, resetTime }
 */

const rateLimitStore = new Map();

// Configuration for different endpoints
const RATE_LIMIT_CONFIG = {
  default: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 registration attempts per hour
  reviews: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 reviews per hour
  orders: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 orders per hour
  cart: { limit: 50, windowMs: 15 * 60 * 1000 }, // 50 cart operations per 15 minutes
};

/**
 * Get client IP from request
 */
export function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Rate limit middleware
 * @param {Request} req - The request object
 * @param {string} userId - User ID (optional)
 * @param {string} endpoint - Endpoint type for config lookup
 * @returns {object} - { allowed: boolean, remaining: number, resetTime: number, retryAfter: number }
 */
export function checkRateLimit(req, userId = null, endpoint = 'default') {
  const config = RATE_LIMIT_CONFIG[endpoint] || RATE_LIMIT_CONFIG.default;
  const ip = getClientIP(req);
  
  // Use userId if authenticated, otherwise use IP
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const now = Date.now();

  // Get or initialize rate limit data
  let limitData = rateLimitStore.get(key);
  
  if (!limitData || now >= limitData.resetTime) {
    // Reset or initialize
    limitData = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Increment counter
  limitData.count += 1;
  rateLimitStore.set(key, limitData);

  // Check if limit exceeded
  const remaining = Math.max(0, config.limit - limitData.count);
  const allowed = limitData.count <= config.limit;
  const retryAfter = allowed ? 0 : Math.ceil((limitData.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: limitData.resetTime,
    retryAfter,
    limit: config.limit,
  };
}

/**
 * Cleanup old entries periodically (runs every minute)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  const entriesToDelete = [];

  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetTime) {
      entriesToDelete.push(key);
    }
  }

  entriesToDelete.forEach(key => rateLimitStore.delete(key));
}

// Clean up every 60 seconds
setInterval(cleanupRateLimit, 60 * 1000);

/**
 * Middleware helper to check rate limit and return 429 if exceeded
 */
export function createRateLimitResponse(req, userId = null, endpoint = 'default') {
  const { allowed, remaining, retryAfter, limit } = checkRateLimit(req, userId, endpoint);

  if (!allowed) {
    return {
      response: new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.", 
          retryAfter,
          rateLimit: { limit, remaining }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
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
