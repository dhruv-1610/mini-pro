# Auth & token storage strategy

## Current implementation

- **Access token:** Stored in memory (Zustand) and persisted to `localStorage` under `cleanupcrew_access_token`. Short-lived (e.g. 15 min); sent as `Authorization: Bearer <token>` on API requests.
- **Refresh token:** Stored in Zustand and persisted to `localStorage` under `cleanupcrew_refresh_token`. Long-lived (e.g. 7 days); used only to call `POST /auth/refresh` when the access token expires or the API returns 401.
- **User:** Fetched from `GET /auth/me` when a token is present; stored in Zustand (not persisted) for role checks and UI.

## Axios behavior

1. **Request interceptor:** Attaches `Authorization: Bearer <accessToken>` from the store. Single source of truth for the token.
2. **Response interceptor (401):** Tries to refresh once (single in-flight refresh for concurrent requests). On success, saves the new access token and retries the failed request. On failure (or no refresh token), clears tokens and user, then redirects to `/login?redirect=...`.

## Security notes

- **XSS:** Tokens in `localStorage` are readable by any script on the page. Mitigations: keep access token short-lived; avoid storing sensitive data in tokens; use CSP and avoid inline scripts.
- **Stronger option:** Prefer **httpOnly cookies** for the refresh token when the API supports it (same-site, secure in production). The backend would set a cookie on login/refresh and the SPA would not read it; refresh would be done via a cookie-sent request. Access token can remain in memory only (no localStorage) so it is not persisted across tabs and is cleared on close.
- **Logout:** Always call `logout()` to clear both tokens and user and (when triggered by 401) redirect to login.

## Route guards

- **ProtectedRoute:** Renders children only when `accessToken` is present; otherwise redirects to `/login?redirect=<current path>`.
- **AdminRoute:** Requires authentication, then requires `user.role === 'admin'`; otherwise redirects to login or home.
