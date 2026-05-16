package com.nayaneyecare.controller;

import com.nayaneyecare.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * PHASE 3: Admin endpoint for on-demand audit log verification.
 */
@RestController
@RequestMapping("/api/admin/audit")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Triggers a full recalculation of the SHA-256 hash chain to verify integrity.
     * Only accessible by Admins.
     */
    @GetMapping("/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyAuditChain() {
        boolean isValid = auditLogService.verifyAuditChain();
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "status", "SECURE",
                "message", "Audit log hash chain is perfectly intact. No tampering detected."
            ));
        } else {
            return ResponseEntity.status(500).body(Map.of(
                "status", "COMPROMISED",
                "message", "CRITICAL WARNING: The audit log hash chain is broken. Database tampering detected!"
            ));
        }
    }
}
