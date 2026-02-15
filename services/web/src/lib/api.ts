import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retried?: boolean };

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'http://localhost:4000');

/** Base URL for API (used e.g. for image src like /uploads/...). In dev with proxy, use explicit origin so images load. */
export const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

/** Attempt to refresh access token. Returns new access token or throws. */
async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token');
  }
  const { data } = await axios.post<{ accessToken: string }>(`${baseURL}/auth/refresh`, { refreshToken: refresh });
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data.accessToken;
}

function logoutAndRedirect(): void {
  useAuthStore.getState().logout();
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?redirect=${redirect}`;
}

// ── Request: attach JWT ────────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: on 401 try refresh, then logout if needed ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const config = originalRequest as RequestConfigWithRetry;
    if (error.response?.status !== 401 || config._retried) {
      return Promise.reject(error);
    }
    config._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }
      await refreshPromise;
      refreshPromise = null;
      const newToken = getAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }
    } catch {
      refreshPromise = null;
      logoutAndRedirect();
      return Promise.reject(error);
    }

    logoutAndRedirect();
    return Promise.reject(error);
  }
);

export interface DriveSummary {
  _id: string;
  title: string;
  date: string;
  status: string;
  location: { type: string; coordinates: [number, number] };
  fundingGoal?: number;
  fundingRaised?: number;
  maxVolunteers?: number;
  requiredRoles?: Array<{ role: string; capacity: number; booked: number }>;
}

export interface MapReport {
  _id: string;
  location: { type: string; coordinates: [number, number] };
  severity: string;
  status: string;
  description?: string;
  createdAt?: string;
  photoUrls?: string[];
}

export interface MapDrive {
  _id: string;
  location: { type: string; coordinates: [number, number] };
  title: string;
  status: string;
  date?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  maxVolunteers?: number;
  requiredRoles?: Array<{ role: string; capacity: number; booked: number }>;
}

export interface MapCleaned {
  _id: string;
  location: { type: string; coordinates: [number, number] };
  status: string;
  title?: string;
  impactSummary?: {
    wasteCollected: number;
    areaCleaned: number;
    workHours: number;
  };
}
