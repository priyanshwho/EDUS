import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  LogOut,
  ChevronRight,
  ChevronDown,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { renameUsername } = useAuth();

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername,       setNewUsername]       = useState('');
  const [usernameError,     setUsernameError]     = useState('');
  const [savingUsername,    setSavingUsername]    = useState(false);
  const [usernameSuccess,   setUsernameSuccess]   = useState(false);

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
  const handleStartEditUsername = () => {
    setNewUsername(user?.username || '');
    setUsernameError('');
    setUsernameSuccess(false);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async (e) => {
    e?.preventDefault();
    const cleaned = newUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '').slice(0, 24);
    if (cleaned.length < 3) {
      setUsernameError('Min 3 chars (letters, numbers, _)');
      return;
    }
    if (cleaned === user?.username) {
      setIsEditingUsername(false);
      return;
    }

    setSavingUsername(true);
    setUsernameError('');
    try {
      await renameUsername(cleaned);
      setUsernameSuccess(true);
      setTimeout(() => {
        setUsernameSuccess(false);
        setIsEditingUsername(false);
      }, 1000);
    } catch (err) {
      setUsernameError(err?.message || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

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

        {!isEditingUsername ? (
          <div className="flex items-center justify-between mt-0.5 group/user">
            <span className="text-n-3 text-xs font-mono">{displayUsername}</span>
            <button
              type="button"
              onClick={handleStartEditUsername}
              className="inline-flex items-center gap-1 text-[11px] text-n-4 hover:text-blue-400 p-1 -mr-1 rounded hover:bg-n-7 transition-colors"
              title="Change your username"
            >
              <Pencil size={12} />
              <span className="text-[10px]">Edit</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveUsername} className="mt-1.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-n-4 text-xs font-mono select-none">
                  @
                </span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24));
                    setUsernameError('');
                  }}
                  placeholder="username"
                  autoFocus
                  disabled={savingUsername}
                  className="w-full pl-6 pr-2 py-1 rounded-lg bg-n-8 border border-blue-500/60 text-xs text-n-1 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={savingUsername || !newUsername.trim() || newUsername === user?.username}
                title="Save username"
                className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition flex items-center justify-center shrink-0 shadow-sm"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingUsername(false);
                  setUsernameError('');
                }}
                disabled={savingUsername}
                title="Cancel"
                className="p-1.5 rounded-lg text-n-4 hover:text-n-1 hover:bg-n-7 transition flex items-center justify-center shrink-0"
              >
                <X size={13} />
              </button>
            </div>
            {usernameError && (
              <p className="text-[11px] text-red-400 leading-tight">{usernameError}</p>
            )}
            {usernameSuccess && (
              <p className="text-[11px] text-green-400 leading-tight flex items-center gap-1">
                <Check size={12} className="inline" /> Username updated!
              </p>
            )}
          </form>
        )}

        <p className="text-n-4 text-xs mt-1 truncate">{displayEmail}</p>
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
