import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuth as useClerkAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { api } from '../services/api';

function isSafeInternalRoute(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('/auth');
}

/**
 * AuthCallbackPage
 * Handles the redirect from OAuth (Google/GitHub).
 * For Passport/GitHub: backend redirects to /auth/callback?token=<jwt>&role=<role>
 * For Clerk/Google: Clerk redirects back to /auth/callback, we sync token with backend.
 */
export default function AuthCallbackPage() {
  const { handleOAuthCallback } = useAuth();
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const role  = params.get('role');
    const returnTo = sessionStorage.getItem('edusphere:returnTo');

    // Case 1: Legacy Passport.js (e.g. GitHub OAuth) redirect
    if (token) {
      if (returnTo) sessionStorage.removeItem('edusphere:returnTo');
      handleOAuthCallback(token);

      if (isSafeInternalRoute(returnTo)) {
        navigate(returnTo, { replace: true });
        return;
      }

      if (role === 'admin') navigate('/dashboard/admin', { replace: true });
      else if (role === 'professor') navigate('/dashboard/professor', { replace: true });
      else navigate('/dashboard/student', { replace: true });
      return;
    }

    // Case 2: Clerk Google OAuth redirect
    if (!clerkLoaded) return;

    if (clerkSignedIn) {
      (async () => {
        try {
          const clerkToken = await getToken();
          if (!clerkToken) {
            throw new Error('Failed to retrieve Clerk token');
          }

          // Exchange Clerk token for backend internal token
          const res = await api.post('/auth/clerk-sync', { token: clerkToken });

          if (returnTo) sessionStorage.removeItem('edusphere:returnTo');
          handleOAuthCallback(res.accessToken);

          const finalRole = res.user?.role || 'student';
          if (isSafeInternalRoute(returnTo)) {
            navigate(returnTo, { replace: true });
            return;
          }

          if (finalRole === 'admin') navigate('/dashboard/admin', { replace: true });
          else if (finalRole === 'professor') navigate('/dashboard/professor', { replace: true });
          else navigate('/dashboard/student', { replace: true });
        } catch (err) {
          console.error('Clerk backend token exchange failed:', err);
          navigate('/login?error=oauth_failed', { replace: true });
        }
      })();
    }
  }, [clerkLoaded, clerkSignedIn, getToken, handleOAuthCallback, navigate, params]);

  // If we are not signed in yet and Clerk is loaded, mount the callback handler to process it.
  if (clerkLoaded && !clerkSignedIn && !params.get('token')) {
    return <AuthenticateWithRedirectCallback />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-8">
      <p className="text-n-4 text-sm animate-pulse">Completing sign in…</p>
    </div>
  );
}
