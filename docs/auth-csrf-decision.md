# Auth & CSRF Protection Decision

## Decision
We will use **bearer token authentication** (immune to CSRF by construction) with locked-down CORS configuration, rather than cookie-based sessions with CSRF tokens.

## Rationale
- **CSRF immunity**: Bearer tokens are not automatically included in cross-origin requests (unlike cookies), eliminating CSRF risk entirely.
- **Simplicity**: No need to implement CSRF token issuance/validation (double-submit cookie or synchronizer token patterns).
- **Alignment with wallet architecture**: Wallet apps often use client-side key management, making bearer tokens a natural fit.
- **CORS hardening**: Restricting allowed origins and methods further reduces attack surface.

## Implementation Details
1. **CORS Configuration**: 
   - Allow only same-origin requests (or explicitly trusted origins if needed)
   - Restrict allowed methods to those needed by each route
   - Allow necessary headers (including `Authorization` for bearer tokens)

2. **Bearer Token Validation**:
   - API routes will require a valid bearer token in the `Authorization` header
   - For now, this is simulated (since full auth system isn't built yet), but the structure is in place for real token validation later

3. **API Route Updates**:
   - All mutating routes (POST/PUT/DELETE) will enforce bearer token presence
   - CORS headers will be set on all API responses
