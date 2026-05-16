package com.nayaneyecare.service;

import com.nayaneyecare.entity.AuditLog;
import com.nayaneyecare.repository.AuditLogRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * PHASE 3: Tamper-Evident Audit Log Service.
 *
 * Implements a cryptographically secure hash chain. Each log entry's hash
 * incorporates the hash of the previous entry. If a malicious actor alters
 * a past database record, the hash chain validation will fail.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Auto-verify the integrity of the audit log chain on server startup.
     * Logs a SEVERE alert if tampering is detected.
     */
    @PostConstruct
    public void verifyChainOnStartup() {
        log.info("Starting automated Audit Log Hash Chain verification...");
        boolean isValid = verifyAuditChain();
        if (isValid) {
            log.info("✅ Audit Log Hash Chain is INTACT and secure.");
        } else {
            log.error("🚨 CRITICAL SECURITY ALERT: Audit Log Hash Chain verification FAILED. " +
                      "Database tampering detected!");
        }
    }

    /**
     * Write a new event to the tamper-evident audit log.
     * Transaction isolation is SERIALIZABLE to prevent race conditions
     * from breaking the hash chain if two events happen at the exact same millisecond.
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void logEvent(String userEmail, String action, String details) {
        String previousHash = getLatestHash();
        Instant timestamp = Instant.now();

        String dataToHash = buildDataString(userEmail, action, timestamp, previousHash);
        String currentHash = computeSha256(dataToHash);

        AuditLog auditLog = new AuditLog(userEmail, action, details, previousHash, currentHash);
        auditLog.setTimestamp(timestamp); // Ensure exact match
        
        auditLogRepository.save(auditLog);
        log.debug("Audit event recorded: {} - {}", userEmail, action);
    }

    /**
     * Verifies the entire hash chain from the first record to the last.
     * Returns true if intact, false if tampering is detected.
     */
    public boolean verifyAuditChain() {
        List<AuditLog> allLogs = auditLogRepository.findAllOrdered();
        if (allLogs.isEmpty()) {
            return true; // Empty chain is valid
        }

        String expectedPreviousHash = GENESIS_HASH;

        for (AuditLog entry : allLogs) {
            // 1. Check if the previousHash pointer matches what we expect
            if (!expectedPreviousHash.equals(entry.getPreviousHash())) {
                log.error("Hash chain broken at ID {}: expected previousHash {}, found {}", 
                          entry.getId(), expectedPreviousHash, entry.getPreviousHash());
                return false;
            }

            // 2. Recompute the current hash to ensure data wasn't altered
            String dataToHash = buildDataString(
                    entry.getUserEmail(), 
                    entry.getAction(), 
                    entry.getTimestamp(), 
                    entry.getPreviousHash()
            );
            String recomputedHash = computeSha256(dataToHash);

            if (!recomputedHash.equals(entry.getCurrentHash())) {
                log.error("Data tampering detected at ID {}: recomputed hash {} does not match stored hash {}", 
                          entry.getId(), recomputedHash, entry.getCurrentHash());
                return false;
            }

            // Move the pointer forward
            expectedPreviousHash = entry.getCurrentHash();
        }

        return true;
    }

    // ---- Helper Methods ----

    private String getLatestHash() {
        Optional<AuditLog> latest = auditLogRepository.findLatestEntry();
        return latest.map(AuditLog::getCurrentHash).orElse(GENESIS_HASH);
    }

    private String buildDataString(String email, String action, Instant timestamp, String previousHash) {
        return String.join("|", 
                email != null ? email : "SYSTEM", 
                action, 
                timestamp.toString(), 
                previousHash
        );
    }

    private String computeSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
