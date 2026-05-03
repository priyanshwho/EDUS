const {
  DEFAULT_TTL_SECONDS,
  buildCacheKey,
  getCachedJson,
  setCachedJson,
  invalidateByPattern,
} = require('../cache/cache.service');

function serializeObject(obj = {}) {
  return Object.keys(obj)
    .sort()
    .map((key) => {
      const value = obj[key];
      const normalized = Array.isArray(value) ? value.join(',') : String(value);
      return `${key}=${normalized}`;
    })
    .join('&');
}

function makeRequestCacheKey(req, { scope, varyByUser, varyByRole }) {
  const queryPart = serializeObject(req.query);
  const paramsPart = serializeObject(req.params);

  const parts = [scope || req.baseUrl || 'route'];
  if (req.path) parts.push(req.path);
  if (paramsPart) parts.push(`params:${paramsPart}`);
  if (queryPart) parts.push(`query:${queryPart}`);
  if (varyByRole && req.user?.role) parts.push(`role:${req.user.role}`);
  if (varyByUser && req.user?.id) parts.push(`user:${req.user.id}`);

  return buildCacheKey(parts);
}

function cacheGet(options = {}) {
  const {
    scope,
    ttlSeconds = DEFAULT_TTL_SECONDS,
    varyByUser = false,
    varyByRole = false,
  } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = makeRequestCacheKey(req, { scope, varyByUser, varyByRole });
    const cached = await getCachedJson(cacheKey);

    if (cached !== null) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCachedJson(cacheKey, payload, ttlSeconds).catch(() => {});
      }
      return originalJson(payload);
    };

    next();
  };
}

function invalidateAllCache() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        invalidateByPattern('*').catch(() => {});
      }
      return originalJson(payload);
    };

    next();
  };
}

module.exports = {
  cacheGet,
  invalidateAllCache,
};
