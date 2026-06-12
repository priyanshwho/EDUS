import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { redirectByRole } from '../utils/redirectByRole';
import { ParticleHero } from '../components/ui/particle-hero';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

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
    
    // Username validation
    const username = form.username.trim();
    if (username.length < 3 || username.length > 30) {
      setError('Username must be 3–30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, dots, and hyphens');
      return;
    }

    // Password validation
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(form);

      if (isSafeInternalRoute(returnTo)) {
        navigate(returnTo, { replace: true });
        return;
      }

      redirectByRole(res.user?.role, navigate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParticleHero>
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-n-6 bg-n-7 p-8 shadow-[0_0_40px_rgba(56,189,248,0.1)]">
        <h1 className="h4 text-center mb-8">Join EduSphere</h1>

        {error && (
          <p className="mb-4 text-sm text-center text-red-400 bg-red-400/10 py-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="username" required placeholder="Username" value={form.username} onChange={onChange}
            className="w-full rounded-xl border border-n-6 bg-n-8 px-4 py-3 text-sm focus:outline-none focus:border-color-1" />
          <input name="email" type="email" required placeholder="Email" value={form.email} onChange={onChange}
            className="w-full rounded-xl border border-n-6 bg-n-8 px-4 py-3 text-sm focus:outline-none focus:border-color-1" />
          <input name="password" type="password" required placeholder="Password (8+ chars, 1 uppercase, 1 number)" value={form.password} onChange={onChange}
            className="w-full rounded-xl border border-n-6 bg-n-8 px-4 py-3 text-sm focus:outline-none focus:border-color-1" />

          <p className="text-xs text-n-4 bg-n-8 border border-n-6 rounded-xl px-4 py-3">
            New accounts start as <span className="text-n-2 font-semibold">Student</span>. You can upgrade to Professor later using your secure PIN.
          </p>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-color-1 text-n-8 font-semibold hover:bg-color-1/90 disabled:opacity-50 transition">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-n-4 text-sm mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            state={isSafeInternalRoute(returnTo) ? { from: returnTo } : undefined}
            className="text-color-1 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </ParticleHero>
  );
}
