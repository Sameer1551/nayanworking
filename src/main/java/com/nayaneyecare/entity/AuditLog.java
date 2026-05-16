package com.nayaneyecare.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * PHASE 3: Tamper-Evident Audit Log entry.
 *
 * Each record includes a SHA-256 hash computed from its own content
 * PLUS the hash of the previous record. This creates a "hash chain":
 * if anyone alters a past entry in the database, all subsequent hashes
 * become invalid and the chain breaks — making tampering detectable.
 *
 * Hash formula: SHA-256( userEmail + "|" + action + "|" + timestamp + "|" + previousHash )
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "user_email"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Who performed the action (email or "SYSTEM"). */
    @Column(name = "user_email", nullable = false)
    private String userEmail;

    /** Action type, e.g. LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, SUPPLIER_DELETED. */
    @Column(nullable = false, length = 100)
    private String action;

    /** Optional human-readable details, e.g. IP address, affected resource. */
    @Column(length = 1000)
    private String details;

    /** Exact timestamp of the event. */
    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    /** Hash of the PREVIOUS audit log entry (null for the first entry = "GENESIS"). */
    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    /**
     * SHA-256 hash of: userEmail + "|" + action + "|" + timestamp + "|" + previousHash
     * This ties this record to the chain.
     */
    @Column(name = "current_hash", nullable = false, length = 64)
    private String currentHash;

    public AuditLog() {}

    public AuditLog(String userEmail, String action, String details,
                    String previousHash, String currentHash) {
        this.userEmail = userEmail;
        this.action = action;
        this.details = details;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
    }

    // ---- Getters & Setters ----

    public Long getId() { return id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }
}
