package com.nayaneyecare.service;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

import static net.logstash.logback.argument.StructuredArguments.entries;

/**
 * PHASE 7: Structured JSON Logging.
 * Centralized service to log security events (401, 403, 429) to security.json.
 */
@Service
public class SecurityLogger {

    // Using a specific logger name configured in logback-spring.xml to route to JSON file
    private static final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void logSecurityEvent(String action, String ip, String path, String details, String userAgent) {
        Map<String, Object> logData = new HashMap<>();
        logData.put("action", action);
        logData.put("ip", ip);
        logData.put("path", path);
        logData.put("details", details);
        logData.put("userAgent", userAgent != null ? userAgent : "Unknown");
        logData.put("event_type", "security");

        // The 'entries' method from Logstash encoder appends the map as JSON fields
        auditLogger.info("Security Event: {}", action, entries(logData));
    }

    public void logRequestError(HttpServletRequest request, String action, String details) {
        if (request == null) return;
        
        String ip = getClientIP(request);
        String path = request.getRequestURI();
        String userAgent = request.getHeader("User-Agent");
        
        logSecurityEvent(action, ip, path, details, userAgent);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
