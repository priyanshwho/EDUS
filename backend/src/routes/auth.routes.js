const express = require('express');
const router  = express.Router();
const passport = require('passport');
const { authenticate } = require('../middleware/authenticate');
const { invalidateAllCache } = require('../middleware/cache.middleware');
const {
  signup, login, verifyPin, upgradeToProfessor, refresh, logout, me,
} = require('../controllers/auth.controller');
const { signupValidator, loginValidator, pinValidator } = require('../validators/auth.validator');
const { signAccessToken, signRefreshToken, buildPayload } = require('../auth/jwt.utils');

// ── Traditional auth ───────────────────────────────────────────────────────
router.post('/signup',     signupValidator, invalidateAllCache(), signup);
router.post('/login',      loginValidator,  login);
router.post('/verify-pin', pinValidator,    verifyPin);
router.post('/upgrade-professor', authenticate, pinValidator, invalidateAllCache(), upgradeToProfessor);
router.post('/refresh',    refresh);
router.post('/logout',     logout);
router.get('/me',          authenticate, me);

// ── Google OAuth ───────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  oauthCallback
);

// ── GitHub OAuth ───────────────────────────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  oauthCallback
);

// ── Shared OAuth success handler ───────────────────────────────────────────
function oauthCallback(req, res) {
  const user         = req.user;
  const payload      = buildPayload(user);
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const clientUrl = process.env.CLIENT_URL || '';
  const isSecure = process.env.NODE_ENV === 'production' || clientUrl.startsWith('https://');
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  const sameSiteEnv = process.env.COOKIE_SAMESITE;
  const sameSite = sameSiteEnv ? sameSiteEnv.toLowerCase() : (isSecure ? 'none' : 'lax');

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   isSecure,
    sameSite,
    domain:   cookieDomain,
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  // Redirect back to client with access token in query (client stores in memory)
  const redirectBase = clientUrl || 'http://localhost:5173';
  res.redirect(`${redirectBase}/auth/callback?token=${accessToken}&role=${user.role}`);
}

module.exports = router;
