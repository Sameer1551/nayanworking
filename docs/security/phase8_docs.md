

---

## Phase 8: Production Polish & Final Gaps ✅ COMPLETE

**Date:** 2026-04-30

### Files Created/Modified

| File | Change Summary |
|------|---------------|
| `util/AttributeEncryptor.java` | Added support for `OLD_ENCRYPTION_KEY` for zero-downtime rotation |
| `controller/AuthController.java` | Moved `refreshToken` to HttpOnly cookies; Added Device Fingerprinting |
| `config/SecurityConfig.java` | Enabled CSRF protection with `CookieCsrfTokenRepository` |
| `util/JwtUtils.java` | Implemented SHA-256 Device Fingerprinting (User-Agent binding) |
| `config/JwtAuthFilter.java` | Added verification of Device Fingerprint on every request |
| `backup_db.bat` | Integrated OpenSSL AES-256 encryption for database backups |

---

### 8.1 Zero-Downtime Key Rotation

**Why:** If an encryption key is leaked, you need to change it without losing access to existing data.

**How it works:**
- `AttributeEncryptor` now checks `app.encryption.old-secret-key`.
- If decryption fails with the current key, it automatically tries the old key.
- This allows for a "Rolling Rotation": 
  1. Set the current key as the "Old Key".
  2. Generate a new "Current Key".
  3. The system remains fully functional while you gradually re-encrypt old records.

---

### 8.2 HttpOnly Cookie & CSRF Protection

**Why:** Storing tokens in LocalStorage is vulnerable to XSS. Moving to cookies is safer but requires CSRF protection.

**How it works:**
- The `refreshToken` is no longer sent in the JSON response body.
- It is sent as a `Set-Cookie` header with `HttpOnly; Secure; SameSite=Strict` flags.
- We enabled CSRF protection. Since the frontend needs to read the CSRF token, we use `CookieCsrfTokenRepository.withHttpOnlyFalse()`. The frontend (React) reads the `XSRF-TOKEN` cookie and sends it back in the `X-XSRF-TOKEN` header.

---

### 8.3 Device Fingerprinting (Replay Mitigation)

**Why:** If an attacker steals a valid JWT, they shouldn't be able to use it from a different browser/device.

**How it works:**
- During login, we take the user's `User-Agent` and hash it using SHA-256.
- This hash is embedded into the JWT as a `deviceFp` claim.
- On every request, `JwtAuthFilter` re-calculates the hash from the current request's `User-Agent`.
- If the hashes don't match, the token is rejected as a "Replay Attack."

---

### 8.4 Encrypted Database Backups

**Why:** If your backup server is compromised, your data should still be safe.

**How it works:**
- The `backup_db.bat` script now pipes the `mysqldump` output through OpenSSL.
- It uses `AES-256-CBC` with `PBKDF2` key derivation.
- The plaintext `.sql` file is deleted immediately after the `.enc` file is created.
