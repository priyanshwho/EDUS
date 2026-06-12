import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { redirectByRole } from '../utils/redirectByRole';
import { ParticleHero } from '../components/ui/particle-hero';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

/* ─── InputField with floating label ────────────────────────────── */
function InputField({ id, label, type = 'text', value, onChange, autoComplete, required, hint }) {
  const [focused, setFocused] = useState(false);
  const filled = value && value.length > 0;

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
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
      {hint && focused && (
        <p style={{ color: '#3F3A52', fontSize: '12px', margin: '5px 0 0 4px' }}>{hint}</p>
      )}
    </div>
  );
}

/* ─── Password field with strength meter ─────────────────────────── */
function PasswordField({ id, label, value, onChange, autoComplete, required, showStrength }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const filled = value && value.length > 0;

  const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = showStrength ? getStrength(value) : 0;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'][strength];

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ position: 'relative' }}>
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
          }}
        >
          {label}
        </label>
        <input
          id={id}
          name={id}
          type={showPw ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: filled || focused ? '22px 44px 8px 14px' : '14px 44px 14px 14px',
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
        <button
          type="button"
          onClick={() => setShowPw(v => !v)}
          style={{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#757185', padding: '4px', display: 'flex', alignItems: 'center',
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
      {/* Strength bar */}
      {showStrength && filled && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: i <= strength ? strengthColor : '#252134',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
          {strengthLabel && (
            <p style={{ fontSize: '11px', color: strengthColor, margin: 0, fontWeight: 500 }}>
              {strengthLabel} password
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── SignupPage ─────────────────────────────────────────────────── */
export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const returnTo   = location.state?.from;

  const [form,    setForm]    = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const username = form.username.trim();
    if (username.length < 3 || username.length > 30) { setError('Username must be 3–30 characters'); return; }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) { setError('Username: only letters, numbers, _ . -'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(form.password)) { setError('Password needs at least one uppercase letter'); return; }
    if (!/[0-9]/.test(form.password)) { setError('Password needs at least one number'); return; }

    setLoading(true);
    try {
      const res = await signup(form);
      if (isSafeInternalRoute(returnTo)) { navigate(returnTo, { replace: true }); return; }
      redirectByRole(res.user?.role, navigate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParticleHero>
      <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto', padding: '0 16px' }}>
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
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #AC6AFF 0%, #858DFF 100%)',
                marginBottom: '16px',
                boxShadow: '0 4px 20px rgba(172,106,255,0.35)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p style={{ color: '#757185', fontSize: '14px', margin: 0 }}>
              Join EduSphere and start learning today
            </p>
          </div>

          {/* Role info badge */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: 'rgba(172,106,255,0.07)',
              border: '1px solid rgba(172,106,255,0.18)',
              borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ marginTop: '1px', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#AC6AFF" strokeWidth="2"/>
              <path d="M12 8v4m0 4h.01" stroke="#AC6AFF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ color: '#ADA8C3', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
              New accounts start as <span style={{ color: '#AC6AFF', fontWeight: 600 }}>Student</span>. Upgrade to Professor later with your secure PIN.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <InputField
              id="username"
              label="Username"
              value={form.username}
              onChange={onChange}
              autoComplete="username"
              required
              hint="3–30 chars, letters, numbers, _ . - only"
            />
            <InputField
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />
            <PasswordField
              id="password"
              label="Password"
              value={form.password}
              onChange={onChange}
              autoComplete="new-password"
              required
              showStrength
            />

            {/* Requirements checklist */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {[
                  { label: 'At least 8 characters', met: form.password.length >= 8 },
                  { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(form.password) },
                  { label: 'One number (0–9)', met: /[0-9]/.test(form.password) },
                ].map(({ label, met }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div
                      style={{
                        width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                        background: met ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${met ? '#22c55e' : '#3F3A52'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {met && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: '12px', color: met ? '#22c55e' : '#3F3A52', transition: 'color 0.2s' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'rgba(172,106,255,0.4)' : 'linear-gradient(135deg, #AC6AFF 0%, #858DFF 100%)',
                border: 'none', borderRadius: '12px', color: '#FFFFFF',
                fontSize: '15px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', letterSpacing: '0.01em',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(172,106,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: 'center', color: '#757185', fontSize: '14px', margin: '24px 0 0' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              state={isSafeInternalRoute(returnTo) ? { from: returnTo } : undefined}
              style={{ color: '#AC6AFF', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: transparent; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #15131D inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
      `}</style>
    </ParticleHero>
  );
}
