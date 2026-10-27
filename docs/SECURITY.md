# TimeToMeal Enterprise Security Architecture

## 1. Multi-Tenant Data Isolation
- **Row-Level Security (RLS)**: Enforced in PostgreSQL / Supabase for `college_id` and `canteen_id`.
- **RBAC Roles**: `ADMIN`, `COLLEGE_ADMIN`, `CANTEEN_STAFF`, `STUDENT`.
- **JWT Verification**: Strict asymmetric key signature check on every backend request via middleware.

## 2. API Security Policies
- **Rate Limiting**: IP-based rate limiting via `express-rate-limit` (100 requests per 15 minutes window for standard endpoints; 5 login attempts per window).
- **Helmet Security Headers**: Strict HSTS, CSP (Content Security Policy), anti-clickjacking headers enabled.
- **CORS Protection**: Access control restricted strictly to configured application domain origins.

## 3. Data Protection & Cryptography
- **Passwords**: Hashed with `bcryptjs` (salt rounds >= 10).
- **Payment Verification**: Dual-channel HMAC signature validation for Cashfree webhooks and payment callables.
