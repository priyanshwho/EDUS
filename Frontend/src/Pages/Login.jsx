import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { redirectByRole } from '../utils/redirectByRole';
import { ParticleHero } from '../components/ui/particle-hero';
import { useSignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { api } from '../services/api';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

/* ─── tiny Google SVG ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

/* ─── InputField ───────────────────────────────────────────────── */
function InputField({ id, label, type = 'text', value, onChange, placeholder, autoComplete, required }) {
  const [focused, setFocused] = useState(false);
  const filled = value && value.length > 0;

  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          left: '14px',
          top: focused || filled ? '6px' : '50%',
          transform: focused || filled ? 'translateY(0) scale(0.75)' : 'translateY(-50%)',
          transformOrigin: 'left',
          fontSize: focused || filled ? '11px' : '14px',
          color: focused ? '#AC6AFF' : '#757185',
          pointerEvents: 'none',
          transition: 'all 0.18s ease',
          background: focused || filled ? '#15131D' : 'transparent',
          padding: '0 3px',
          zIndex: 1,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: filled || focused ? '22px 14px 8px' : '14px',
          background: '#15131D',
          border: `1.5px solid ${focused ? '#AC6AFF' : '#252134'}`,
          borderRadius: '12px',
          color: '#FFFFFF',
          fontSize: '15px',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(172,106,255,0.12)' : 'none',
          transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ─── LoginPage ────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login, isAuthenticated, user, loading: authLoading, handleOAuthCallback } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const returnTo  = location.state?.from;

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (isSafeInternalRoute(returnTo)) {
        navigate(returnTo, { replace: true });
      } else {
        redirectByRole(user.role, navigate);
      }
    }
  }, [authLoading, isAuthenticated, user, navigate, returnTo]);

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (!form.password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const res = await login(form);
      if (res.pin_required) {
        navigate('/auth/pin', { state: isSafeInternalRoute(returnTo) ? { from: returnTo } : undefined });
        return;
      }
      if (isSafeInternalRoute(returnTo)) { navigate(returnTo, { replace: true }); return; }
      redirectByRole(res.user?.role, navigate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { isSignedIn: clerkIsSignedIn, getToken: getClerkToken } = useClerkAuth();

  const syncClerkSessionWithBackend = async () => {
    setLoading(true);
    try {
      const clerkToken = await getClerkToken();
      if (!clerkToken) throw new Error('Could not retrieve Clerk session token.');
      const res = await api.post('/auth/clerk-sync', { token: clerkToken });
      handleOAuthCallback(res.accessToken);
      const finalRole = res.user?.role || 'student';
      if (isSafeInternalRoute(returnTo)) { navigate(returnTo, { replace: true }); return; }
      redirectByRole(finalRole, navigate);
    } catch (err) {
      console.error('Clerk direct sync failed:', err);
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    saveOAuthReturnTo();

    // If Clerk already has an active session, sync directly with backend
    if (clerkIsSignedIn) {
      await syncClerkSessionWithBackend();
      return;
    }

    if (!signInLoaded || !signIn) {
      setError('Authentication is still loading. Please wait a moment and try again.');
      return;
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/auth/callback`,
        redirectUrlComplete: `${window.location.origin}/auth/callback`,
      });
    } catch (err) {
      console.error('Clerk Google Sign-in error:', err);
      const errMsg = err?.errors?.[0]?.message || err?.message || '';

      // If Clerk says the user is already signed in, sync directly
      if (errMsg.toLowerCase().includes('already signed in')) {
        await syncClerkSessionWithBackend();
        return;
      }

      const msg = err?.errors?.[0]?.longMessage || errMsg || 'Google Sign-in failed. Please try again.';
      setError(msg);
    }
  };

  const saveOAuthReturnTo = () => {
    if (isSafeInternalRoute(returnTo)) sessionStorage.setItem('edusphere:returnTo', returnTo);
    else sessionStorage.removeItem('edusphere:returnTo');
  };

  return (
    <ParticleHero>
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background: 'rgba(21,19,29,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(172,106,255,0.18)',
            borderRadius: '24px',
            padding: '40px 36px 36px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(172,106,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Brand mark */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <img
                src="/eduicon.png"
                alt="EduSphere"
                width={72}
                height={72}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(172,106,255,0.35))' }}
              />
            </div>
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: '22px',
                fontWeight: 700,
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: '#757185', fontSize: '14px', margin: 0 }}>
              Sign in to your EduSphere account
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <InputField
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />

            {/* Password with show/hide */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <InputField
                id="password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#757185',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                )}
              </button>
            </div>

            {/* Forgot password */}
            {/* <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link
                to="/auth/forgot-password"
                style={{ color: '#AC6AFF', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >
                Forgot password?
              </Link>
            </div> */}

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading
                  ? 'rgba(172,106,255,0.4)'
                  : 'linear-gradient(135deg, #AC6AFF 0%, #858DFF 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '0.01em',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(172,106,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(172,106,255,0.5)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 15px rgba(172,106,255,0.35)'; }}
            >
              {loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#252134' }} />
            <span style={{ color: '#3F3A52', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#252134' }} />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '28px' }}>
            {/* Google OAuth (via Clerk) */}
            <button
              onClick={handleGoogleSignIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                background: '#15131D',
                border: '1px solid #252134',
                borderRadius: '11px',
                color: '#CAC6DD',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(172,106,255,0.4)';
                e.currentTarget.style.background = 'rgba(172,106,255,0.06)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#252134';
                e.currentTarget.style.background = '#15131D';
                e.currentTarget.style.color = '#CAC6DD';
              }}
            >
              <GoogleIcon />
              Google
            </button>

            {/* GitHub OAuth (via Passport) */}
            <a
              href={authService.githubOAuthUrl()}
              onClick={saveOAuthReturnTo}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                background: '#15131D',
                border: '1px solid #252134',
                borderRadius: '11px',
                color: '#CAC6DD',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.18s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(172,106,255,0.4)';
                e.currentTarget.style.background = 'rgba(172,106,255,0.06)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#252134';
                e.currentTarget.style.background = '#15131D';
                e.currentTarget.style.color = '#CAC6DD';
              }}
            >
              <GithubIcon />
              GitHub
            </a>
          </div>

          {/* Footer link */}
          <p style={{ textAlign: 'center', color: '#757185', fontSize: '14px', margin: 0 }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              state={isSafeInternalRoute(returnTo) ? { from: returnTo } : undefined}
              style={{ color: '#AC6AFF', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </ParticleHero>
  );
}
