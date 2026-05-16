package com.nayaneyecare.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.nayaneyecare.service.SecurityLogger;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * PHASE 4: Dynamic Rate Limiting using Bucket4j.
 * 
 * Enforces endpoint-specific limits based on client IP:
 * - Login Endpoints (/api/auth/login): 5 requests per minute (Stricter)
 * - Standard API Endpoints (/api/**): 100 requests per minute
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    // In-memory store for IP-based rate limiting
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();

    private final SecurityLogger securityLogger;

    public RateLimitingFilter(SecurityLogger securityLogger) {
        this.securityLogger = securityLogger;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            // Do not rate limit static assets or non-API paths
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIP(request);

        Bucket bucket;
        if (path.equals("/api/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(clientIp, this::createNewLoginBucket);
        } else {
            bucket = apiBuckets.computeIfAbsent(clientIp, this::createNewApiBucket);
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} accessing path: {}", clientIp, path);
            
            // PHASE 7: Structured JSON Logging for 429 errors
            securityLogger.logRequestError(request, "RATE_LIMIT_EXCEEDED", "Too many requests to " + path);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"message\": \"Too many requests. Please try again later.\"}");
        }
    }

    private Bucket createNewLoginBucket(String key) {
        // 5 requests per minute
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createNewApiBucket(String key) {
        // 100 requests per minute
        Bandwidth limit = Bandwidth.builder()
                .capacity(100)
                .refillIntervally(100, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
