# Security Implementation Details

This file is maintained as a living record of every security change made to the project.
It is updated at the end of each implementation phase.

---

## Phase 1: Core Security Hardening ✅ COMPLETE

**Date:** 2026-04-29

### Files Modified

| File | Change Summary |
|------|---------------|
| `src/main/java/com/nayaneyecare/config/SecurityConfig.java` | Added Security Headers, Strict CORS |
| `src/main/java/com/nayaneyecare/service/AuthService.java` | Fixed User Enumeration vulnerability |

---

### 1.1 Strict CORS Configuration

**File:** `SecurityConfig.java`

**What changed:** Replaced the `setAllowedOriginPatterns(List.of("*"))` wildcard with `setAllowedOrigins(List.of(allowedOrigins))`, where `allowedOrigins` is read from `application.properties` (`app.cors.allowed-origins`). Also replaced `setAllowedHeaders(Arrays.asList("*"))` with an explicit list.

**How it works:**
- Only requests from the exact origin `http://localhost:5173` (your React dev server) are accepted.
- Any request from a different domain (e.g., a malicious website) will receive a CORS error and the browser will block the response.
- Preflight (`OPTIONS`) responses are cached for 1 hour.

**Why it improves security:** A wildcard CORS policy means any website in the world could make API calls to your backend using a logged-in user's credentials. Strict CORS prevents Cross-Origin attacks.

**How to test:**
1. Open the browser Console on any website (e.g., google.com).
2. Run: `fetch('http://localhost:8080/api/dashboard/overview').then(r => console.log(r))`
3. You will see: `Access to fetch at '...' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin.`

---

### 1.2 Security Headers

**File:** `SecurityConfig.java` — `.headers()` block

**Headers added and their purpose:**

| Header | Value | Protection |
|--------|-------|------------|
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from guessing content type (MIME sniffing attacks) |
| `X-Frame-Options` | `DENY` | Prevents your app from being embedded in iframes (Clickjacking) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS for 1 year after first visit |
| `Content-Security-Policy` | `default-src 'self'; ...` | Restricts which resources the browser can load |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits URL information sent in Referer headers |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=()` | Disables dangerous browser APIs |

**How to test:**
1. Make any API request from the React app.
2. Open Chrome DevTools → Network → Select any request → Response Headers.
3. You will see all the above headers in the response.

---

### 1.3 API Error Standardization (User Enumeration Prevention)

**File:** `AuthService.java`

**What changed:**
- `updateProfile()` — Changed `"User not found"` → `"Invalid credentials"`
- `getUserProfile()` — Changed `"User not found"` → `"Invalid credentials"`

**How it works:** When an attacker tries to find valid user accounts by submitting different emails, they no longer get different error messages for "email exists" vs. "email not found". All failures return the same generic error.

**Why it improves security:** Without this, an attacker could enumerate all valid email addresses in the system by scripting login/profile requests and watching for "User not found" vs. "Invalid credentials".

**How to test:**
1. Send a `PUT /api/auth/profile` request with a non-existent email.
2. Confirm the response is `"Invalid credentials"` (not `"User not found"`).

---

## Phase 2: Session, Token Security & CSRF ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `entity/RefreshToken.java` | JPA entity backed by `refresh_tokens` MySQL table |
| `repository/RefreshTokenRepository.java` | DB access with revocation & cleanup queries |
| `service/RefreshTokenService.java` | Token issuance, validation, rotation, and revocation |
| `dto/RefreshRequest.java` | Request body for the `/api/auth/refresh` endpoint |

### Files Modified

| File | Change Summary |
|------|---------------|
| `dto/AuthResponse.java` | Added `refreshToken` field returned on every login |
| `service/AuthService.java` | Issues refresh tokens on login; added `refreshAccessToken()` and `logout()` |
| `controller/AuthController.java` | Added `/api/auth/refresh` and upgraded `/api/auth/logout` |
| `config/SecurityConfig.java` | Added Role Hierarchy (`ROLE_ADMIN > ROLE_SUPPLIER > ROLE_CUSTOMER`) |
| `resources/application.properties` | Reduced access token lifetime to 15 min; added 7-day refresh expiry config |

---

### 2.1 Refresh Token Storage (MySQL-backed)

**Why:** Stateless JWTs cannot be revoked — once issued, they are valid until expiry. A DB-backed refresh token table allows us to instantly invalidate any session (on logout, on suspicious activity).

**How it works:**
- On every login, two tokens are now issued: a short-lived **Access Token** (15 minutes) and a long-lived **Refresh Token** (7 days).
- The Refresh Token is stored in the `refresh_tokens` MySQL table with fields: `token`, `user_email`, `user_type`, `expiry_date`, `revoked`, `created_at`.
- The Access Token is short-lived so even if stolen, it expires quickly.

**How to test:**
1. Login and check the response JSON — it now contains both `token` (access) and `refreshToken`.
2. Run `SELECT * FROM refresh_tokens;` in MySQL to see the stored token.

---

### 2.2 Token Rotation (Anti-Theft)

**Why:** If a refresh token is stolen, an attacker could use it to get new access tokens forever. Token Rotation prevents this by invalidating the old token every time it is used.

**How it works:**
- Client calls `POST /api/auth/refresh` with the current refresh token.
- Backend validates the token, marks it as `revoked=true` in the DB.
- A brand-new refresh token is issued and returned alongside the new access token.
- If an attacker tries to reuse the old token, they get a `401 Unauthorized`.

**How to test:**
1. Login and capture the `refreshToken` from the response.
2. Call `POST /api/auth/refresh` with `{ "refreshToken": "<token>" }` — get new tokens.
3. Call `POST /api/auth/refresh` again with the **same old token** — get `401: Refresh token has been revoked`.

---

### 2.3 Strict Logout Flow

**Before:** `POST /api/auth/logout` simply returned a success message. Client-side token deletion was the only protection.

**After:** The endpoint now extracts the user's email from the Authorization header and calls `refreshTokenService.revokeAllUserTokens(email)`. All active refresh tokens for that user are marked `revoked=true` in the DB.

**How to test:**
1. Login → capture both tokens.
2. Call `POST /api/auth/logout` with the `Authorization: Bearer <accessToken>` header.
3. Run `SELECT revoked FROM refresh_tokens WHERE user_email = 'your@email.com';` — all rows should show `1` (revoked).

---

### 2.4 Role Hierarchy

**File:** `SecurityConfig.java`

**Hierarchy:** `ROLE_ADMIN > ROLE_SUPPLIER > ROLE_CUSTOMER`

**Why:** Without this, you need to write `hasAnyRole('ADMIN', 'SUPPLIER')` everywhere. With hierarchy, since Admin inherits Supplier, writing `hasRole('SUPPLIER')` automatically grants access to Admins too — without code duplication.

**How to test:** Login as Admin and confirm you can access endpoints that only say `hasAnyRole("SUPPLIER")` — they now work for Admin automatically.

---

### 2.5 Access Token Lifetime Reduced

**Before:** `app.jwt.expiration=86400000` (24 hours)

**After:** `app.jwt.expiration=900000` (15 minutes)

**Why:** Shorter-lived access tokens minimize the damage if a token is intercepted. The Refresh Token (7 days) is stored server-side and can be revoked.

---

## Phase 3: Tamper-Evident Audit Logging ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `entity/AuditLog.java` | JPA entity for the audit log with hash chaining fields |
| `repository/AuditLogRepository.java` | DB access for fetching the log chain |
| `service/AuditLogService.java` | Cryptographic hash chaining logic and startup verification |
| `controller/AuditLogController.java` | Exposes `/api/admin/audit/verify` for manual verification |

### Files Modified

| File | Change Summary |
|------|---------------|
| `service/AuthService.java` | Wired `AuditLogService` to log successful/failed logins, signups, and logouts |

---

### 3.1 SHA-256 Hash Chaining (Tamper Evidence)

**Why:** A traditional database log is easily editable by anyone with direct SQL access (e.g., a rogue DBA or an attacker who gained root access). We need a way to prove mathematically that a log has not been altered since it was written.

**How it works:**
- Every time an event occurs (e.g., `LOGIN_SUCCESS`), `AuditLogService.logEvent()` is called.
- The service retrieves the `currentHash` of the most recently written log entry in the database.
- It concatenates the new event data: `userEmail + "|" + action + "|" + timestamp + "|" + previousHash`.
- It computes a new `SHA-256` hash of that string.
- The record is saved. Because the new hash incorporates the *previous* hash, all records are cryptographically linked together like a blockchain.
- If someone manually edits a record in MySQL, its data no longer matches its hash. And because the *next* record relies on that broken hash, the entire chain after the tampered record breaks.

---

### 3.2 Automated Startup Verification

**Why:** Tampering should trigger an immediate alarm, not wait for an admin to notice.

**How it works:**
- `AuditLogService` has a `@PostConstruct` method `verifyChainOnStartup()`.
- When the Spring Boot server starts, it pulls the entire log history.
- It recalculates the hash for every single row and compares it to the stored hash.
- If they match, the server logs a green `✅ Audit Log Hash Chain is INTACT`.
- If tampering is detected, it logs a severe `🚨 CRITICAL SECURITY ALERT`.

---

### 3.3 Admin Verification Endpoint

**File:** `AuditLogController.java`

**How it works:** Admins can trigger the verification manually at any time via `GET /api/admin/audit/verify`.

**How to test the tampering detection:**
1. Restart the Spring Boot server. Check the console to see the `INTACT` message.
2. Log in (this writes an audit log).
3. Log out (this writes another audit log).
4. Connect to your MySQL database and run: `UPDATE audit_logs SET action = 'LOGIN_FAILED' WHERE id = 1;`
5. Hit the `GET /api/admin/audit/verify` endpoint (with Admin token). You will see `"status": "COMPROMISED"`.
6. Restart the server — the console will scream `🚨 CRITICAL SECURITY ALERT: Database tampering detected!`.

---

## Phase 4: Dynamic Rate Limiting & Account Lockout ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `config/RateLimitingFilter.java` | Spring Filter implementing Bucket4j IP-based rate limits |

### Files Modified

| File | Change Summary |
|------|---------------|
| `pom.xml` | Added `bucket4j-core` dependency |
| `entity/User.java` | Added `failedLoginAttempts` and `lockoutUntil`; implemented `isAccountNonLocked()` |
| `entity/Customer.java` | Added `failedLoginAttempts`, `lockoutUntil`, and `isAccountNonLocked()` |
| `service/AuthService.java` | Implemented 5-attempt lockout logic and audit logging for blocks |

---

### 4.1 IP-Based Rate Limiting (Bucket4j)

**Why:** To prevent denial-of-service (DoS) attacks and slow down brute-force scripts.

**How it works:**
- Every API request is intercepted by `RateLimitingFilter`.
- The filter extracts the client's IP address (handling `X-Forwarded-For` if behind a proxy).
- It uses two separate in-memory token buckets:
  1. **Login Bucket (`/api/auth/login`)**: Strict limit of 5 requests per minute.
  2. **General API Bucket (`/api/**`)**: Standard limit of 100 requests per minute.
- If the limit is exceeded, the server instantly returns `429 Too Many Requests`.

---

### 4.2 Account Lockout (5 Attempts)

**Why:** Rate limiting protects the *server*, but a distributed botnet using many IPs could still brute-force a specific *account*. Account lockout protects the *user*.

**How it works:**
- When a user enters the wrong password, `failedLoginAttempts` increments.
- If it reaches 5, `lockoutUntil` is set to `now + 15 minutes`.
- For the next 15 minutes, `user.isAccountNonLocked()` returns `false`, and `AuthService` explicitly rejects the login attempt even if the correct password is provided.
- An `ACCOUNT_LOCKED` audit log is written.
- If a successful login occurs *before* 5 failures, the counter resets to 0.

**How to test:**
1. Try logging into an account with the wrong password 5 times.
2. Observe the error changes to: `"Account is temporarily locked due to too many failed attempts. Try again in 15 minutes."`
3. Check the `audit_logs` table to see the `LOGIN_FAILED` and `ACCOUNT_LOCKED` events forming an intact hash chain.

---

## Phase 5: Encryption at Rest & Secure Configuration ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `util/AttributeEncryptor.java` | JPA Converter for AES-256 field-level encryption |
| `.env.example` | Template for required production secrets |
| `.github/dependabot.yml` | Automated dependency vulnerability scanning |

### Files Modified

| File | Change Summary |
|------|---------------|
| `entity/User.java` | Added `@Convert` to encrypt `uniqueSupplierKey` |
| `entity/Customer.java` | Added `@Convert` to encrypt `uniqueKey` |
| `resources/application.properties` | Replaced hardcoded secrets with `${ENV_VAR}` fallbacks |

---

### 5.1 AES-256 Field Level Encryption

**Why:** If the database is compromised, highly sensitive PII and tenant-isolation keys must not be readable in plain text. 

**How it works:**
- We created `AttributeEncryptor` which implements `AttributeConverter<String, String>`.
- It uses the `AES` cipher with a 256-bit key provided by the `ENCRYPTION_KEY` environment variable.
- We annotated `uniqueSupplierKey` (User) and `uniqueKey` (Customer) with `@Convert(converter = AttributeEncryptor.class)`.
- When Hibernate saves these entities, it transparently encrypts these fields. When it reads them, it decrypts them. The Java application only ever sees the plain text.

---

### 5.2 Secrets Management

**Why:** Hardcoding database passwords and JWT secrets in `application.properties` is a massive security risk if the repository is ever exposed.

**How it works:**
- `application.properties` now uses Spring's expression language for secrets: `${DB_PASSWORD:root}`.
- In production, these are passed as OS environment variables (e.g., `export DB_PASSWORD=prod_secure_password`).
- A `.env.example` file was created to document the required variables without exposing actual secrets to source control.

---

### 5.3 Automated Dependency Management

**Why:** Outdated dependencies (like a vulnerable version of Log4j or an old JSON parser) are the #1 cause of major breaches.

**How it works:**
- We added `.github/dependabot.yml`.
- If this project is hosted on GitHub, Dependabot will scan the `pom.xml` weekly.
- If a vulnerability (CVE) is discovered in any dependency, it will automatically generate a Pull Request to patch it.

---

## Phase 6: Login Tracking & "Wow" UI Features ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `entity/LoginHistory.java` | JPA entity storing IP, User-Agent, and timestamp |
| `repository/LoginHistoryRepository.java` | DB access for login history records |
| `service/LoginHistoryService.java` | IP extraction, User-Agent parsing, and string formatting |
| `backup_db.bat` | Automated daily MySQL backup script |

### Files Modified

| File | Change Summary |
|------|---------------|
| `service/AuthService.java` | Passed `HttpServletRequest` to record logins; added `lastLoginDetails` |
| `dto/AuthResponse.java` | Added `lastLoginDetails` field for the frontend UI |
| `controller/AuthController.java` | Injected `HttpServletRequest` into the login endpoint |

---

### 6.1 User Location & Device Tracking

**Why:** Gives users visibility into their account security (so they can spot unauthorized access) and provides admins with forensics data.

**How it works:**
- `AuthController` receives the HTTP request and passes it to `AuthService`.
- `LoginHistoryService` extracts the IP address (handling `X-Forwarded-For` for proxies).
- It performs basic string matching on the `User-Agent` header to determine the Browser and OS (e.g., "Chrome on Windows").
- This data is saved to the `login_history` table on every successful login.

---

### 6.2 The "Wow" UI Feature

**Why:** Security should be visible to the end-user to build trust.

**How it works:**
- When a user logs in (or fetches their profile), `LoginHistoryService` queries their *previous* login record.
- It formats the time elapsed (e.g., "2 hours ago").
- The `AuthResponse` DTO now includes: `"lastLoginDetails": "Last login: Local Network (Chrome on Windows) - 2 hours ago"`.
- The frontend can simply display this string in a prominent security widget on the Dashboard.

---

### 6.3 Automated Database Backups

**Why:** Ransomware or accidental drops.

**How it works:**
- We created a `backup_db.bat` script.
- It uses `mysqldump` to export the entire database to a `.sql` file with a timestamp.
- It automatically deletes backups older than 30 days to save disk space.
- The system administrator can schedule this to run daily using Windows Task Scheduler (or a Cron job on Linux).

---

## Phase 7: Structured Monitoring & Security Test Endpoint ✅ COMPLETE

**Date:** 2026-04-29

### Files Created

| File | Purpose |
|------|---------|
| `resources/logback-spring.xml` | Configured a `RollingFileAppender` for `logs/security.json` |
| `service/SecurityLogger.java` | Centralized JSON logging service utilizing `LogstashEncoder` |
| `controller/SecurityTestController.java` | Exposes `/api/security/test` for monitoring validation |

### Files Modified

| File | Change Summary |
|------|---------------|
| `pom.xml` | Added `logstash-logback-encoder` dependency |
| `config/RateLimitingFilter.java` | Intercepts 429 errors and pushes them to `SecurityLogger` |
| `config/SecurityConfig.java` | Added custom handlers for 401 and 403 errors |

---

### 7.1 Structured JSON Security Logs

**Why:** Parsing standard text logs (`2026-04-29 10:00:00 - User failed login from IP...`) is error-prone. Modern security tools (Splunk, ELK, Datadog) ingest JSON instantly.

**How it works:**
- We imported `logstash-logback-encoder`.
- Defined `logback-spring.xml` to intercept the `SECURITY_AUDIT` logger.
- `SecurityLogger.java` uses `StructuredArguments.entries()` to output perfectly formatted JSON directly into `logs/security.json`.
- The log files rollover daily and are kept for 30 days.

---

### 7.2 Centralized Error Auditing (401, 403, 429)

**Why:** A spike in these HTTP status codes is the #1 indicator of a cyber attack.
- `401 Unauthorized`: Attackers guessing passwords or using expired tokens.
- `403 Forbidden`: Attackers trying to access endpoints they don't have roles for.
- `429 Too Many Requests`: DoS or brute force bots hitting Bucket4j rate limits.

**How it works:**
- `SecurityConfig` uses `.exceptionHandling()` to intercept `AuthenticationEntryPoint` (401) and `AccessDeniedHandler` (403), piping the request data to `SecurityLogger`.
- `RateLimitingFilter` pipes 429 errors to `SecurityLogger`.

---

### 7.3 Security Test Endpoint

**Why:** To easily verify that the rate limiter, headers, and IP extraction are working correctly in any environment.

**How it works:**
- `GET /api/security/test`
- Returns your IP, User-Agent, and all headers.
- Since Bucket4j protects `/api/**` with 100 requests per minute, you can write a simple loop script against this endpoint to verify that the `429` block works and appears in `logs/security.json`.
