const bcrypt = require('bcryptjs');
const { sql } = require('../db/client');
const { checkValidation } = require('../utils/response');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildPayload,
} = require('../auth/jwt.utils');

const ADMIN_EMAIL   = process.env.ADMIN_EMAIL;
const PROFESSOR_PIN = process.env.PROFESSOR_PIN;
const { verifyClerkToken, clerkClient } = require('../services/clerk.service');

// ── Helper: set refresh cookie ─────────────────────────────────────────────
function setRefreshCookie(res, token) {
  const clientUrl = process.env.CLIENT_URL || '';
  const isSecure = process.env.NODE_ENV === 'production' || clientUrl.startsWith('https://');
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  const sameSiteEnv = process.env.COOKIE_SAMESITE;
  const sameSite = sameSiteEnv ? sameSiteEnv.toLowerCase() : (isSecure ? 'none' : 'lax');

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isSecure,
    sameSite,
    domain:   cookieDomain,
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function getUserById(id) {
  const rows = await sql`select * from users where id = ${id} limit 1`;
  return rows[0] || null;
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────
async function signup(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { username, email, password } = req.body;

    // Validate
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check uniqueness
    const existing = await sql`
      select id
      from users
      where email = ${email} or username = ${username}
      limit 1
    `;
    if (existing.length > 0) return res.status(409).json({ error: 'Email or username already in use' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Everyone signs up as student by default, except configured admin email.
    const resolvedRole = email === ADMIN_EMAIL ? 'admin' : 'student';

    const inserted = await sql`
      insert into users (username, email, password_hash, role, last_active_at)
      values (${username}, ${email}, ${passwordHash}, ${resolvedRole}, now())
      returning *
    `;
    const user = inserted[0];
    if (!user) return res.status(500).json({ error: 'Failed to create user' });

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/upgrade-professor ──────────────────────────────────────
async function upgradeToProfessor(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { pin } = req.body;

    if (!pin) return res.status(400).json({ error: 'PIN is required' });
    if (!PROFESSOR_PIN)
      return res.status(500).json({ error: 'Professor PIN is not configured' });
    if (pin !== PROFESSOR_PIN)
      return res.status(403).json({ error: 'Invalid PIN' });

    const currentUser = await getUserById(req.user.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (currentUser.role === 'admin') {
      const payload = buildPayload(currentUser);
      const accessToken = signAccessToken(payload);
      return res.json({ accessToken, user: payload, message: 'Admin role unchanged' });
    }

    let user = currentUser;
    if (currentUser.role !== 'professor') {
      const rows = await sql`
        update users
        set role = 'professor'
        where id = ${currentUser.id}
        returning *
      `;
      user = rows[0] || null;
      if (!user) return res.status(500).json({ error: 'Failed to upgrade role' });
    }

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: payload, message: 'Role upgraded to professor' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ───────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const rows = await sql`
      select *
      from users
      where email = ${email}
      limit 1
    `;
    const user = rows[0];
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Mark user active immediately upon login
    await sql`update users set last_active_at = now() where id = ${user.id}`.catch(() => {});
    user.last_active_at = new Date();

    // Admin auto-detection
    if (email === ADMIN_EMAIL && user.role !== 'admin') {
      await sql`update users set role = 'admin' where id = ${user.id}`;
      user.role = 'admin';
    }

    // Professors must complete PIN step before full token is issued
    if (user.role === 'professor') {
      // Issue a temporary "pin-pending" token
      const pinToken = signAccessToken({ id: user.id, pin_pending: true });
      return res.json({ pin_required: true, pin_token: pinToken });
    }

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/verify-pin ──────────────────────────────────────────────
async function verifyPin(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { pin_token, pin } = req.body;
    if (!pin_token || !pin)
      return res.status(400).json({ error: 'pin_token and pin are required' });

    let decoded;
    try {
      decoded = verifyAccessToken(pin_token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired PIN token' });
    }

    if (!decoded.pin_pending)
      return res.status(400).json({ error: 'Token is not a PIN-pending token' });

    if (!PROFESSOR_PIN)
      return res.status(500).json({ error: 'Professor PIN is not configured' });

    if (pin !== PROFESSOR_PIN)
      return res.status(403).json({ error: 'Invalid PIN' });

    const user = await getUserById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await sql`update users set last_active_at = now() where id = ${user.id}`.catch(() => {});

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await getUserById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    await sql`update users set last_active_at = now() where id = ${user.id}`.catch(() => {});

    const payload     = buildPayload(user);
    const accessToken = signAccessToken(payload);
    return res.json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout ──────────────────────────────────────────────────
function logout(_req, res) {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out successfully' });
}

// ── GET /api/auth/me ───────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const rows = await sql`
      select id, username, name, email, role, created_at
      from users
      where id = ${req.user.id}
      limit 1
    `;
    const user = rows[0] || null;
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/superadmin/switch-role ───────────────────────────────────
async function superadminSwitchRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const currentUser = await getUserById(req.user.id);
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Only the super admin can use this route' });
    }

    const rows = await sql`
      update users
      set role = ${role}
      where id = ${currentUser.id}
      returning *
    `;
    const user = rows[0] || null;
    if (!user) return res.status(500).json({ error: 'Failed to switch role' });

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: payload, message: `Role switched to ${role}` });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/clerk-sync ────────────────────────────────────────────────
async function clerkSync(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Clerk token is required' });
    }

    // Verify Clerk Token
    let decoded;
    try {
      decoded = await verifyClerkToken(token);
    } catch (err) {
      console.error('Clerk verification error:', err?.message || err);
      return res.status(401).json({ 
        error: 'Invalid Clerk token', 
        reason: err?.message || String(err) 
      });
    }

    const clerkUserId = decoded.sub;

    // Fetch user details from Clerk to get email, name, etc.
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return res.status(400).json({ error: 'Clerk user email not found' });
    }

    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'user';
    const usernameSeed = clerkUser.username || email.split('@')[0];

    // Find or create user in local database
    let user;
    const existing = await sql`
      select * from users where email = ${email} limit 1
    `;

    if (existing.length > 0) {
      user = existing[0];
      // Elevate admin if needed
      if (email === ADMIN_EMAIL && user.role !== 'admin') {
        const rows = await sql`
          update users
          set role = 'admin'
          where id = ${user.id}
          returning *
        `;
        user = rows[0];
      }
    } else {
      // Create user
      const baseUsername = usernameSeed.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || 'user';
      let candidate = baseUsername;
      let suffix = 0;
      while (true) {
        const rows = await sql`select id from users where username = ${candidate} limit 1`;
        if (rows.length === 0) break;
        suffix += 1;
        candidate = `${baseUsername}${suffix}`;
      }

      const role = email === ADMIN_EMAIL ? 'admin' : 'student';
      const rows = await sql`
        insert into users (email, name, username, role, oauth_provider)
        values (${email}, ${name}, ${candidate}, ${role}, 'google')
        returning *
      `;
      user = rows[0];
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to sync user' });
    }

    await sql`update users set last_active_at = now() where id = ${user.id}`.catch(() => {});

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, verifyPin, upgradeToProfessor, refresh, logout, me, superadminSwitchRole, clerkSync };
