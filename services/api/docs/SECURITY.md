# API Security

## CSRF

This API uses **JWT in the `Authorization` header** for authenticated requests. No session cookies are used for auth. Therefore:

- **CSRF tokens are not required.** CSRF attacks rely on the browser automatically sending cookies to a malicious site. Because we do not use cookies for authentication, there is no automatic credential send that an attacker could exploit.
- If the API later uses cookies (e.g. refresh token in httpOnly cookie), set **SameSite=Strict** (or Lax) and **Secure** in production so the browser does not send them on cross-site requests.

## Token storage (frontend)

Access and refresh tokens are held by the client (e.g. in memory or localStorage). The API does not store tokens; it only validates the JWT and issues new ones. See the web app’s auth strategy for client-side storage and httpOnly-cookie options.
