const { createHash } = require('node:crypto');
const { StudyError } = require('./errors');

function createRequestLimiter({ sql, now = () => Date.now() }) {
  return async function limit(req, _res, next) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const time = now();
    const window = new Date(Math.floor(time / 600000) * 600000);
    const ip = createHash('sha256').update(String(req.ip || req.socket?.remoteAddress || 'unknown')).digest('hex');
    // The IP cap is deliberately broad for campus networks; user limits are primary.
    const entries = [[`http:ip:${ip}`, 500], [`http:user:${req.user.id}`, 60]].sort((a, b) => a[0].localeCompare(b[0]));
    try {
      await sql.begin(async tx => {
        for (const [scope, cap] of entries) {
          const rows = await tx.unsafe(`INSERT INTO study_usage(scope,bucket,window_start,amount) VALUES($1,'mutations_10m',$2,1)
            ON CONFLICT(scope,bucket,window_start) DO UPDATE SET amount=study_usage.amount+1
            WHERE study_usage.amount < $3 RETURNING amount`, [scope, window.toISOString(), cap]);
          if (!rows.length) throw new StudyError(429, 'REQUEST_RATE_LIMIT', 'Too many study requests. Please wait before trying again.', Math.ceil((window.getTime() + 600000 - time) / 1000));
        }
      });
      next();
    } catch (error) { next(error); }
  };
}

module.exports = { createRequestLimiter };
