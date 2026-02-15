import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuthStore, type AuthUser } from '../stores/authStore';

interface AuthContextValue {
  /** Fetch current user from API and store. Call after login or when token is present. */
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { accessToken, setUser } = useAuthStore();
  const fetchedRef = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: AuthUser }>('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchUser().finally(() => {
      fetchedRef.current = false;
    });
  }, [accessToken, fetchUser, setUser]);

  const value: AuthContextValue = { fetchUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
