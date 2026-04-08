import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import ButtonGradient from '../assets/svg/ButtonGradient';
import { redirectByRole } from '../utils/redirectByRole';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form,     setForm]     = useState({ email: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      if (res.pin_required) {
        navigate('/auth/pin');
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
    <div className="min-h-screen flex items-center justify-center bg-n-8 px-4">
      <div className="w-full max-w-md rounded-3xl border border-n-6 bg-n-7 p-8">
        <h1 className="h4 text-center mb-8">Sign in to EduSphere</h1>

        {error && (
          <p className="mb-4 text-sm text-center text-red-400 bg-red-400/10 py-2 rounded-lg">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email" type="email" required placeholder="Email"
            value={form.email} onChange={onChange}
            className="w-full rounded-xl border border-n-6 bg-n-8 px-4 py-3 text-sm focus:outline-none focus:border-color-1"
          />
          <input
            name="password" type="password" required placeholder="Password"
            value={form.password} onChange={onChange}
            className="w-full rounded-xl border border-n-6 bg-n-8 px-4 py-3 text-sm focus:outline-none focus:border-color-1"
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-color-1 text-n-8 font-semibold hover:bg-color-1/90 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-n-6" />
          <span className="text-xs text-n-5">or continue with</span>
          <hr className="flex-1 border-n-6" />
        </div>

        <div className="flex gap-3">
          <a
            href={authService.googleOAuthUrl()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-n-6 text-sm hover:border-color-1 transition"
          >
            Google
          </a>
          <a
            href={authService.githubOAuthUrl()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-n-6 text-sm hover:border-color-1 transition"
          >
            GitHub
          </a>
        </div>

        <p className="text-center text-n-4 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-color-1 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
