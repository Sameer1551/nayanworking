package com.nayaneyecare.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * PHASE 7: Security Test Endpoint.
 * Publicly accessible endpoint to demonstrate rate limits, IP extraction,
 * and security headers.
 */
@RestController
@RequestMapping("/api/security")
public class SecurityTestController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testSecurityFeatures(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("status", "SUCCESS");
        response.put("message", "Security monitoring is active. Try hitting this endpoint 100 times in a minute to trigger the Rate Limiter (429 Too Many Requests), which will be logged to the structured JSON audit log.");
        
        // Extract IP
        String xfHeader = request.getHeader("X-Forwarded-For");
        String clientIp = (xfHeader == null || xfHeader.isEmpty()) ? request.getRemoteAddr() : xfHeader.split(",")[0].trim();
        response.put("clientIp", clientIp);
        
        // Extract User-Agent
        response.put("userAgent", request.getHeader("User-Agent"));
        
        // Extract headers
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames != null && headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }
        response.put("headers", headers);
        
        return ResponseEntity.ok(response);
    }
}
