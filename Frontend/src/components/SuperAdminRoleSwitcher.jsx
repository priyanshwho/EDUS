import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SuperAdminRoleSwitcher() {
  const { user, superadminSwitchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Only render for the super admin
  if (user?.email !== 'priyanshu82711@gmail.com') return null;
  // Only render on dashboard routes
  if (!location.pathname.startsWith('/dashboard')) return null;

  const handleSwitch = async (role) => {
    setLoading(true);
    try {
      await superadminSwitchRole(role);
      // Navigate to the appropriate dashboard
      navigate(`/dashboard/${role}`);
    } catch (err) {
      console.error('Failed to switch role:', err);
      alert('Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-n-8/90 backdrop-blur border border-color-1 rounded-xl p-3 shadow-xl">
      <div className="text-xs font-semibold text-color-1 mb-2">SuperAdmin Testing Mode</div>
      <div className="flex gap-2">
        {['student', 'professor', 'admin'].map((role) => (
          <button
            key={role}
            disabled={loading || user.role === role}
            onClick={() => handleSwitch(role)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              user.role === role
                ? 'bg-color-1 text-n-8 cursor-not-allowed'
                : 'bg-n-6 text-n-1 hover:bg-n-5'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
}
