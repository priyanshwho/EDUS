import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { setToken, setRefreshFailHandler } from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and exposes authentication state.
 *
 * State:
 *  user          — decoded JWT payload { id, email, username, role }
 *  accessToken   — in-memory JWT (NOT stored in localStorage)
 *  loading       — true while silently refreshing on mount
 *  pinPending    — true when professor submitted credentials and needs PIN
 *  pinToken      — temporary pin-pending token
 */
export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [pinPending,  setPinPending]  = useState(false);
  const [pinToken,    setPinToken]    = useState(null);

  // Keep API client token in sync with auth state.
  useEffect(() => {
    setToken(accessToken);
  }, [accessToken]);

  // If refresh fails globally, reset to logged-out state.
  useEffect(() => {
    setRefreshFailHandler(() => {
      setToken(null);
      setUser(null);
      setAccessToken(null);
      setPinPending(false);
      setPinToken(null);
    });

    return () => setRefreshFailHandler(null);
  }, []);

  // ── Silent refresh on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { accessToken: token, user: u } = await authService.refresh();
        setToken(token);
        setAccessToken(token);
        setUser(u);
      } catch {
        // No valid refresh cookie — user is logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── OAuth callback handler ───────────────────────────────────────────────
  const handleOAuthCallback = useCallback((token) => {
    setToken(token);
    setAccessToken(token);
    // Decode minimal payload from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      // fallback — will be fetched on next /me call
    }
  }, []);

  // ── Signup ───────────────────────────────────────────────────────────────
  const signup = useCallback(async (data) => {
    const res = await authService.signup(data);
    setToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    if (res.pin_required) {
      setPinPending(true);
      setPinToken(res.pin_token);
      return { pin_required: true };
    }
    setToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  }, []);

  // ── Professor PIN verification ───────────────────────────────────────────
  const verifyPin = useCallback(async (pin) => {
    const res = await authService.verifyPin({ pin_token: pinToken, pin });
    setPinPending(false);
    setPinToken(null);
    setToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  }, [pinToken]);

  // ── Student -> Professor upgrade ────────────────────────────────────────
  const upgradeToProfessor = useCallback(async (pin) => {
    const res = await authService.upgradeProfessor({ pin });
    setToken(res.accessToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = {
    user,
    accessToken,
    loading,
    pinPending,
    isAuthenticated: !!user,
    isStudent:   user?.role === 'student',
    isProfessor: user?.role === 'professor',
    isAdmin:     user?.role === 'admin',
    signup,
    login,
    verifyPin,
    upgradeToProfessor,
    logout,
    handleOAuthCallback,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
