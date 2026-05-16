package com.nayaneyecare.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * PHASE 2: Refresh Token entity for token rotation and revocation.
 * Stored in MySQL so tokens can be explicitly invalidated on logout
 * or compromised-token scenarios — unlike stateless JWTs which cannot
 * be revoked before expiry.
 */
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The opaque token string sent to the client. */
    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /** The subject (email) this token belongs to. */
    @Column(nullable = false)
    private String userEmail;

    /** The user type (SUPPLIER / ADMIN / CUSTOMER) for re-issuing the right JWT. */
    @Column(nullable = false)
    private String userType;

    /** Absolute expiry — tokens older than this are invalid regardless of revoked flag. */
    @Column(nullable = false)
    private Instant expiryDate;

    /** Explicit revocation flag — set to true on logout or token rotation. */
    @Column(nullable = false)
    private boolean revoked = false;

    /** Timestamp of creation for audit purposes. */
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public RefreshToken() {}

    public RefreshToken(String token, String userEmail, String userType, Instant expiryDate) {
        this.token = token;
        this.userEmail = userEmail;
        this.userType = userType;
        this.expiryDate = expiryDate;
    }

    // ---- Getters & Setters ----

    public Long getId() { return id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public Instant getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Instant expiryDate) { this.expiryDate = expiryDate; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public Instant getCreatedAt() { return createdAt; }

    public boolean isExpired() {
        return Instant.now().isAfter(this.expiryDate);
    }

    public boolean isValid() {
        return !isRevoked() && !isExpired();
    }
}
