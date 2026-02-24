# ADR-005: Security Headers Strategy

## Status
Accepted

## Context
Web applications are vulnerable to various attacks (XSS, clickjacking, MIME sniffing, etc.) that can be mitigated with proper HTTP security headers.

## Decision
Apply comprehensive security headers at three levels:

1. **Next.js middleware** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy
2. **next.config.ts** — Additional headers for all routes
3. **CSP** — Content Security Policy allowing only necessary external resources (Stripe)

## Headers Applied
- `X-Frame-Options: DENY` — Prevent clickjacking
- `X-Content-Type-Options: nosniff` — Prevent MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` — Limit referrer leakage
- `X-XSS-Protection: 0` — Disabled (CSP is the modern replacement)
- `Permissions-Policy` — Disable camera, microphone, geolocation
- `Strict-Transport-Security` — Force HTTPS with preload
- `Content-Security-Policy` — Restrict resource loading

## Security Utilities
- `secureCompare()` — Constant-time string comparison for token validation
- `sanitizeHtml()` — XSS prevention for user-generated content
- `generateCsrfToken()` — Cryptographic CSRF token generation

## Consequences
- Protection against common web vulnerabilities
- Stripe integration works through CSP frame-src and connect-src exceptions
- HSTS with preload may cause issues on non-HTTPS development environments
