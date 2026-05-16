# Extreme Security Upgrade Plan ("Fortress Security")

This plan outlines the steps to upgrade Nayan Eye Care's security from "Basic Standard" to "Extreme Level" (similar to high-security systems like Facebook/Google).

## User Review Required

> [!IMPORTANT]
> Some of these changes involve database schema updates and will require the user to configure an email server (SMTP) for OTP codes.

> [!WARNING]
> Moving from `localStorage` to `HttpOnly Cookies` for JWT will require frontend changes to how tokens are handled and may affect cross-domain requests.

## Proposed Changes

### 1. Account & Authentication (MFA)
Implement Multi-Factor Authentication to prevent account takeover even if the password is leaked.

- **TOTP (Time-based One-Time Password)**: Support for apps like Google Authenticator or Authy.
- **Email OTP**: Fallback for users without authenticator apps.
- **Backup Codes**: Generate one-time use codes for account recovery.

### 2. Session & Device Management
Track where and when the user is logged in.

- **Device Fingerprinting**: Store `User-Agent` and `IP Address` for every session.
- **Active Sessions Table**: A new `user_sessions` table to track all active JWTs.
- **Remote Logout**: UI to view active devices and "Log out from all other devices."
- **New Device Alerts**: Email notification when a login occurs from an unrecognized IP or browser.

### 3. Protection Against Attacks
Harden the system against common automated attacks.

- **Brute Force Protection**: Account lockout after 5 consecutive failed attempts (with incremental cooldown).
- **Rate Limiting**: Limit API requests per IP (e.g., max 10 login attempts per minute).
- **JWT Refresh Tokens**: Move to short-lived Access Tokens (15m) and long-lived Refresh Tokens (7d) to minimize damage from stolen tokens.

### 4. Advanced Audit Logging
Maintain a tamper-proof record of sensitive actions.

- **AuditLog Entity**: Record `timestamp`, `user_id`, `action`, `ip_address`, `status`, and `entity_affected`.
- **Sensitive Operations**: Log every login, password change, GST update, and bulky purchase.

### 5. Infrastructure & Headers
Harden the web layer.

- **Security Headers**: Implement `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), and `X-Frame-Options`.
- **HttpOnly Cookies**: Transition from `localStorage` to `Secure; HttpOnly; SameSite=Strict` cookies for storing JWTs to eliminate XSS-based token theft.

---

## Detailed Component Breakdown

### [NEW] [user_sessions table](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/resources/db/migration/V2__Add_Security_Tables.sql)
#### [NEW] [UserSession.java](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/java/com/nayaneyecare/entity/UserSession.java)
#### [NEW] [AuditLog.java](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/java/com/nayaneyecare/entity/AuditLog.java)

### [MODIFY] [User.java](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/java/com/nayaneyecare/entity/User.java)
- Add `mfa_enabled`, `totp_secret`, `failed_login_attempts`, `locked_until` fields.

### [MODIFY] [AuthService.java](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/java/com/nayaneyecare/service/AuthService.java)
- Integrate MFA flow into login.
- Add logic for account locking/unlocking.

### [NEW] [RateLimitingFilter.java](file:///d:/nayan/project/nayanworking-main/nayanworking-main/src/main/java/com/nayaneyecare/config/RateLimitingFilter.java)
- Basic IP-based rate limiting for sensitive endpoints.

## Open Questions

1. **Email Service**: Do you have an SMTP server (like Gmail, SendGrid, or Mailgun) ready for sending OTPs?
2. **Cookie vs Storage**: Are you comfortable moving the token to a `Cookie`? This is much more secure (prevents JS from stealing it) but requires slightly different frontend code.
3. **MFA Enforcement**: Should we make MFA **mandatory** or **optional** for suppliers?

## Verification Plan

### Automated Tests
- `mvn test` for checking login lockout logic.
- JWT validation tests for expired/blacklisted tokens.

### Manual Verification
- Test MFA flow: Login -> Prompt for OTP -> Verify.
- Test Device list: Login from Chrome -> Login from Firefox -> See both in "Active Sessions".
- Test Brute Force: Attempt 6 wrong passwords -> Verify account is locked.
