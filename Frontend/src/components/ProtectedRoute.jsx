import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a route by authentication and optional role.
 *
 * Usage:
 *   <ProtectedRoute roles={['admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  const requestedPath = `${location.pathname}${location.search}${location.hash}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-n-8">
        <p className="text-n-4 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: requestedPath }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    // Redirect to own dashboard instead of 403
    const fallback =
      user?.role === 'admin'     ? '/dashboard/admin'
      : user?.role === 'professor' ? '/dashboard/professor'
      : '/dashboard/student';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
