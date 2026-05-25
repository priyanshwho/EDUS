import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, LogOut, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * ProfileDropdown
 *
 * Props:
 *  user                — { id, email, username, name?, role }
 *  isStudent           — bool   — show "Become a Professor" row only for students
 *  upgradeToProfessor  — async fn(pin) — from AuthContext
 *  logout              — async fn      — from AuthContext
 *  onClose             — fn            — called after every action
 *  mobile              — bool          — disables absolute positioning (mobile inline mode)
 */
const ProfileDropdown = ({
  user,
  isStudent,
  upgradeToProfessor,
  logout,
  onClose,
  mobile = false,
}) => {
  const navigate = useNavigate();

  // PIN expand state
  const [pinExpanded, setPinExpanded]   = useState(false);
  const [pin, setPin]                   = useState('');
  const [pinError, setPinError]         = useState('');
  const [pinLoading, setPinLoading]     = useState(false);
  const [pinSuccess, setPinSuccess]     = useState(false);

  // ── Graceful fallbacks ────────────────────────────────────────────
  const displayName     = user?.name || user?.username || 'Unknown User';
  const displayEmail    = user?.email || 'No email provided';
  const displayUsername = user?.username ? `@${user.username}` : '—';
  const displayRole     = user?.role || 'user';

  // ── Role-based dashboard path ────────────────────────────────────
  const dashboardPath =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'professor'
      ? '/dashboard/professor'
      : '/dashboard/student';

  // ── Handlers ──────────────────────────────────────────────────────
  const handleDashboard = () => {
    navigate(dashboardPath);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/');
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinLoading(true);
    try {
      await upgradeToProfessor(pin);
      setPinSuccess(true);
      setTimeout(() => {
        onClose();
        navigate('/dashboard/professor');
      }, 1200);
    } catch (err) {
      setPinError(err?.response?.data?.message || 'Invalid PIN. Try again.');
    } finally {
      setPinLoading(false);
    }
  };

  // ── Wrapper class — absolute on desktop, inline on mobile ────────
  const wrapperClass = mobile
    ? 'w-full bg-n-7 border-t border-n-6'
    : 'absolute right-0 top-[calc(100%+0.5rem)] w-72 bg-n-7 border border-n-6 rounded-2xl shadow-2xl z-50 overflow-hidden animate-dropdown';

  return (
    <div className={wrapperClass}>

      {/* ── User info header ─────────────────────────────────────── */}
      <div className="px-5 py-4 bg-n-8/60 border-b border-n-6">
        <p className="text-n-1 font-semibold text-sm truncate">{displayName}</p>
        <p className="text-n-3 text-xs mt-0.5">{displayUsername}</p>
        <p className="text-n-4 text-xs mt-0.5 truncate">{displayEmail}</p>
        <span
          className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold
                     bg-color-1/20 text-color-1 rounded-full capitalize"
        >
          {displayRole}
        </span>
      </div>

      {/* ── Dashboard link ───────────────────────────────────────── */}
      <button
        onClick={handleDashboard}
        className="flex items-center gap-3 w-full px-5 py-3.5 text-n-1
                   hover:bg-n-6/60 transition-colors text-sm text-left"
      >
        <LayoutDashboard size={16} className="text-color-1 shrink-0" />
        <span>Dashboard</span>
        <ChevronRight size={14} className="ml-auto text-n-4" />
      </button>

      {/* ── Become a Professor (students only) ──────────────────── */}
      {isStudent && (
        <div className="border-t border-n-6/50">
          <button
            onClick={() => setPinExpanded((prev) => !prev)}
            className="flex items-center gap-3 w-full px-5 py-3.5 text-n-1
                       hover:bg-n-6/60 transition-colors text-sm text-left"
          >
            <GraduationCap size={16} className="text-color-2 shrink-0" />
            <span>Become a Professor</span>
            <ChevronDown
              size={14}
              className={`ml-auto text-n-4 transition-transform duration-200 ${
                pinExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Inline PIN form */}
          {pinExpanded && !pinSuccess && (
            <form
              onSubmit={handleUpgrade}
              className="px-5 pb-4 pt-1 flex flex-col gap-2"
            >
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter professor PIN"
                maxLength={8}
                autoFocus
                className="w-full bg-n-8 border border-n-5 rounded-lg px-3 py-2
                           text-sm text-n-1 placeholder-n-4 focus:outline-none
                           focus:border-color-1 transition-colors"
              />
              {pinError && (
                <p className="text-red-400 text-xs">{pinError}</p>
              )}
              <button
                type="submit"
                disabled={pinLoading || !pin.trim()}
                className="bg-color-1 text-white rounded-lg px-3 py-2 text-sm
                           font-semibold hover:bg-color-1/80 disabled:opacity-50
                           transition-all"
              >
                {pinLoading ? 'Verifying…' : 'Submit PIN'}
              </button>
            </form>
          )}

          {pinSuccess && (
            <p className="px-5 pb-4 text-xs text-green-400">
              ✓ Upgraded! Redirecting to professor dashboard…
            </p>
          )}
        </div>
      )}

      {/* ── Sign Out ─────────────────────────────────────────────── */}
      <div className="border-t border-n-6/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-5 py-3.5 text-red-400
                     hover:bg-red-500/10 transition-colors text-sm text-left"
        >
          <LogOut size={16} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
