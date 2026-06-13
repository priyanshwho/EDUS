const rateLimit = require('express-rate-limit');
const { getRedisClient, isRedisEnabled } = require('../cache/redis.client');

let RedisStore;
try {
  const rlr = require('rate-limit-redis');
  // Handle both ESM default export and CommonJS
  RedisStore = rlr.default || rlr;
} catch (error) {
  console.warn('[RateLimiter] rate-limit-redis not found, will fallback to memory store');
}

/**
 * Creates a rate limiter that uses Redis if available, 
 * falling back to memory store otherwise.
 */
function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: message || "Too many requests. Try again later." },
    // If Redis is enabled and we successfully loaded RedisStore, use it
    store: (isRedisEnabled() && RedisStore) ? new RedisStore({
      // We pass a sendCommand function that delegates to our redis client instance
      sendCommand: (...args) => {
        const client = getRedisClient();
        if (client) {
          return client.sendCommand(args);
        }
        throw new Error('Redis client not available');
      },
    }) : undefined, // undefined uses the default memory store
  });
}

// Login: 5 attempts per minute per IP
const loginLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again in a minute.",
});

// Signup: 3 attempts per minute per IP
const signupLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: "Too many signup attempts. Try again in a minute.",
});

// Google / GitHub OAuth: 20 requests per minute per IP
const oauthLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many OAuth requests. Try again in a minute.",
});

module.exports = {
  loginLimiter,
  signupLimiter,
  oauthLimiter,
};
