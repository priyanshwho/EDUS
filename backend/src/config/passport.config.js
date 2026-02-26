const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const supabase = require('./supabase.config');

// ── Google OAuth ───────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name  = profile.displayName;

      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'student';
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ email, name, username: email.split('@')[0], role, oauth_provider: 'google' })
          .select()
          .single();
        if (error) return done(error, null);
        user = newUser;
      } else if (user.role !== 'admin' && email === process.env.ADMIN_EMAIL) {
        await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
        user.role = 'admin';
      }

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
      const email    = profile.emails[0].value;
      const name     = profile.displayName || profile.username;
      const username = profile.username;

      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'student';
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ email, name, username, role, oauth_provider: 'github' })
          .select()
          .single();
        if (error) return done(error, null);
        user = newUser;
      } else if (user.role !== 'admin' && email === process.env.ADMIN_EMAIL) {
        await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
        user.role = 'admin';
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  done(null, data);
});
