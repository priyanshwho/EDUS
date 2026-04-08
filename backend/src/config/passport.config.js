const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { sql } = require('../db/client');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function normalizeUsername(value) {
  return (value || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24) || 'user';
}

async function getUserByEmail(email) {
  const rows = await sql`
    select *
    from users
    where email = ${email}
    limit 1
  `;
  return rows[0] || null;
}

async function getUniqueUsername(baseValue) {
  const base = normalizeUsername(baseValue);
  let candidate = base;
  let suffix = 0;

  while (true) {
    const rows = await sql`select id from users where username = ${candidate} limit 1`;
    if (rows.length === 0) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
}

async function createOAuthUser({ email, name, usernameSeed, provider }) {
  const username = await getUniqueUsername(usernameSeed);
  const role = email === ADMIN_EMAIL ? 'admin' : 'student';

  const rows = await sql`
    insert into users (email, name, username, role, oauth_provider)
    values (${email}, ${name}, ${username}, ${role}, ${provider})
    returning *
  `;
  return rows[0] || null;
}

async function elevateAdminIfNeeded(user, email) {
  if (user.role === 'admin' || email !== ADMIN_EMAIL) return user;
  const rows = await sql`
    update users
    set role = 'admin'
    where id = ${user.id}
    returning *
  `;
  return rows[0] || { ...user, role: 'admin' };
}

// ── Google OAuth ───────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name  = profile.displayName;

      if (!email) return done(new Error('Google account email is required'), null);

      let user = await getUserByEmail(email);

      if (!user) {
        user = await createOAuthUser({
          email,
          name,
          usernameSeed: email.split('@')[0],
          provider: 'google',
        });
      } else {
        user = await elevateAdminIfNeeded(user, email);
      }

      if (!user) return done(new Error('Failed to resolve Google OAuth user'), null);

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// ── GitHub OAuth ───────────────────────────────────────────────────────────
passport.use(new GitHubStrategy(
  {
    clientID:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:  process.env.GITHUB_CALLBACK_URL,
    scope:        ['user:email'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value;
      const name     = profile.displayName || profile.username;
      const username = profile.username;

      if (!email) return done(new Error('GitHub account email is required'), null);

      let user = await getUserByEmail(email);

      if (!user) {
        user = await createOAuthUser({
          email,
          name,
          usernameSeed: username || email.split('@')[0],
          provider: 'github',
        });
      } else {
        user = await elevateAdminIfNeeded(user, email);
      }

      if (!user) return done(new Error('Failed to resolve GitHub OAuth user'), null);

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const rows = await sql`select * from users where id = ${id} limit 1`;
    done(null, rows[0] || false);
  } catch (err) {
    done(err, null);
  }
});
