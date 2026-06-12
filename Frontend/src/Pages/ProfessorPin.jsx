import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ParticleHero } from '../components/ui/particle-hero';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

const PIN_LENGTH = 6;

/**
 * ProfessorPinPage — security gate for professor access
 */
export default function ProfessorPinPage() {
  const { verifyPin } = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();
  const returnTo      = location.state?.from;

  const [digits,  setDigits]  = useState(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [shake,   setShake]   = useState(false);
  const inputRefs = useRef([]);

  const pin = digits.join('');

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError('');
    if (val && i < PIN_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = Array(PIN_LENGTH).fill('');
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus();
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setError('');
    setLoading(true);
    try {
      await verifyPin(pin);
      if (isSafeInternalRoute(returnTo)) { navigate(returnTo, { replace: true }); return; }
      navigate('/dashboard/professor');
    } catch (err) {
      setError(err.message || 'Invalid PIN. Please try again.');
      setShake(true);
      setTimeout(() => { setShake(false); setDigits(Array(PIN_LENGTH).fill('')); inputRefs.current[0]?.focus(); }, 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParticleHero>
      <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '0 16px' }}>
        <div
          className="edus-card"
          style={{
            padding: '44px 36px 40px',
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              className="edus-animate-pulse-ring"
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 0 rgba(56,189,248,0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="white"/>
              </svg>
            </div>
          </div>

          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Professor Access
          </h1>
          <p style={{ color: '#757185', fontSize: '13px', margin: '0 0 32px', lineHeight: 1.6 }}>
            Enter your secure PIN to access the<br />professor dashboard.
          </p>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', textAlign: 'left',
              }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* PIN dot inputs */}
            <div
              style={{
                display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '28px',
                animation: shake ? 'edus-pin-shake 0.5s ease' : 'none',
              }}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  autoFocus={i === 0}
                  style={{
                    width: '48px', height: '56px',
                    textAlign: 'center', fontSize: '22px',
                    background: '#15131D',
                    border: `2px solid ${d ? 'rgba(56,189,248,0.6)' : 'rgba(37,33,52,1)'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    caretColor: '#38bdf8',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: d ? '0 0 0 3px rgba(56,189,248,0.1)' : 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = d ? 'rgba(56,189,248,0.6)' : '#252134'; e.target.style.boxShadow = 'none'; }}
                />
              ))}
            </div>

            {/* PIN dot progress indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
              {Array(PIN_LENGTH).fill(0).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i < pin.replace('', '').length || digits[i] ? '#38bdf8' : '#252134',
                    transition: 'background 0.18s',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="edus-btn"
              disabled={loading || pin.length < 4}
              style={{ width: '100%', padding: '13px', fontSize: '15px' }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'edus-spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Verifying…
                </>
              ) : 'Verify PIN'}
            </button>
          </form>

          <p style={{ color: '#3F3A52', fontSize: '12px', marginTop: '20px', lineHeight: 1.5 }}>
            This PIN was assigned when your professor account was created.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes edus-pin-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </ParticleHero>
  );
}
