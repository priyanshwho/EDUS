const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase.config');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  buildPayload,
} = require('../auth/jwt.utils');

const ADMIN_EMAIL   = process.env.ADMIN_EMAIL;
const PROFESSOR_PIN = process.env.PROFESSOR_PIN;

// ── Helper: set refresh cookie ─────────────────────────────────────────────
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────
async function signup(req, res, next) {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // Validate
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'Email or username already in use' });

    const password_hash = await bcrypt.hash(password, 12);

    // Admin auto-detection
    const resolvedRole = email === ADMIN_EMAIL ? 'admin' : role;

    const { data: user, error } = await supabase
      .from('users')
      .insert({ username, email, password_hash, role: resolvedRole })
      .select()
      .single();
    if (error) throw error;

    const payload      = buildPayload(user);
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ accessToken, user: payload });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ───────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Admin auto-detection
    if (email === ADMIN_EMAIL && user.role !== 'admin') {
      await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
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
    const { pin_token, pin } = req.body;
    if (!pin_token || !pin)
      return res.status(400).json({ error: 'pin_token and pin are required' });

    let decoded;
    try {
      decoded = require('../auth/jwt.utils').verifyAccessToken(pin_token);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired PIN token' });
    }

    if (!decoded.pin_pending)
      return res.status(400).json({ error: 'Token is not a PIN-pending token' });

    if (pin !== PROFESSOR_PIN)
      return res.status(403).json({ error: 'Invalid PIN' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });

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

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    if (!user) return res.status(401).json({ error: 'User not found' });

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
    const { data: user } = await supabase
      .from('users')
      .select('id, username, name, email, role, created_at')
      .eq('id', req.user.id)
      .single();
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, verifyPin, refresh, logout, me };
