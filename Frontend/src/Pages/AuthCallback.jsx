import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

/**
 * AuthCallbackPage
 * Handles the redirect from OAuth (Google/GitHub).
 * The backend redirects to: /auth/callback?token=<jwt>&role=<role>
 */
export default function AuthCallbackPage() {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const role  = params.get('role');
    const returnTo = sessionStorage.getItem('edusphere:returnTo');
    if (returnTo) sessionStorage.removeItem('edusphere:returnTo');

    if (!token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    handleOAuthCallback(token);

    if (isSafeInternalRoute(returnTo)) {
      navigate(returnTo, { replace: true });
      return;
    }

    // Redirect to appropriate dashboard
    if (role === 'admin')     navigate('/dashboard/admin',     { replace: true });
    else if (role === 'professor') navigate('/dashboard/professor', { replace: true });
    else                           navigate('/dashboard/student', { replace: true });
  }, [handleOAuthCallback, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-8">
      <p className="text-n-4 text-sm animate-pulse">Completing sign in…</p>
    </div>
  );
}
