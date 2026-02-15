import { create } from 'zustand';

/**
 * Token storage keys. Kept in one place for consistency.
 * Strategy: access + refresh in localStorage for SPA persistence across reloads.
 * For higher security in production, prefer httpOnly cookies for refresh token
 * when the API supports it (avoids XSS reading refresh token).
 */
export const AUTH_KEYS = {
  ACCESS: 'cleanupcrew_access_token',
  REFRESH: 'cleanupcrew_refresh_token',
} as const;

function getStoredAccess(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.ACCESS);
}
function getStoredRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.REFRESH);
}

export interface AuthUser {
  _id: string;
  email: string;
  role: string;
  profile?: { name?: string };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (access: string) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEYS.ACCESS);
  localStorage.removeItem(AUTH_KEYS.REFRESH);
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredAccess(),
  refreshToken: getStoredRefresh(),
  user: null,
  setTokens: (access, refresh) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEYS.ACCESS, access);
      localStorage.setItem(AUTH_KEYS.REFRESH, refresh);
    }
    set({ accessToken: access, refreshToken: refresh });
  },
  setAccessToken: (access) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEYS.ACCESS, access);
    }
    set({ accessToken: access });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    clearStorage();
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));

export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken);
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
