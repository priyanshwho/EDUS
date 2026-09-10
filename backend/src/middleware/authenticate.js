const { verifyAccessToken } = require('../auth/jwt.utils');
const { sql } = require('../db/client');

// Debounce last_active_at updates: at most once per 60s per user
const _lastActiveCache = new Map();
const DEBOUNCE_MS = 60 * 1000;

function touchLastActive(userId) {
  const now = Date.now();
  const prev = _lastActiveCache.get(userId) || 0;
  if (now - prev < DEBOUNCE_MS) return;
  _lastActiveCache.set(userId, now);
  // Fire-and-forget — don't await, don't block the request
  sql`UPDATE users SET last_active_at = now() WHERE id = ${userId}`.catch(() => {});
}

/**
 * Authenticate request via Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.pin_pending)
      return res.status(403).json({ error: 'Professor PIN verification required' });
    req.user = decoded;
    touchLastActive(decoded.id);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Allow unauthenticated requests through but attach user if token present.
 */
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // ignore invalid token in optional auth
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
