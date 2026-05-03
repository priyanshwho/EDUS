const { getRedisClient } = require('./redis.client');

const CACHE_PREFIX = process.env.REDIS_CACHE_PREFIX || 'edusphere:cache';
const DEFAULT_TTL_SECONDS = Number(process.env.REDIS_CACHE_TTL || 120);

function buildCacheKey(...segments) {
  const suffix = segments
    .flat()
    .filter(Boolean)
    .map((part) => encodeURIComponent(String(part)))
    .join(':');

  return suffix ? `${CACHE_PREFIX}:${suffix}` : `${CACHE_PREFIX}:default`;
}

async function getCachedJson(key) {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Redis] get failed (${key}): ${err.message}`);
    return null;
  }
}

async function setCachedJson(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis] set failed (${key}): ${err.message}`);
  }
}

async function invalidateByPattern(pattern = '*') {
  const client = getRedisClient();
  if (!client) return 0;

  const matchPattern = pattern.startsWith(CACHE_PREFIX)
    ? pattern
    : `${CACHE_PREFIX}:${pattern}`;

  let deleted = 0;
  const keys = [];

  try {
    for await (const key of client.scanIterator({ MATCH: matchPattern, COUNT: 100 })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      deleted = await client.del(keys);
    }

    return deleted;
  } catch (err) {
    console.warn(`[Redis] invalidate failed (${matchPattern}): ${err.message}`);
    return 0;
  }
}

module.exports = {
  DEFAULT_TTL_SECONDS,
  buildCacheKey,
  getCachedJson,
  setCachedJson,
  invalidateByPattern,
};
