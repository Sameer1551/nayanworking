package com.nayaneyecare.config;

import com.nayaneyecare.util.JwtUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT authentication filter that validates Bearer tokens and populates Spring Security context
 * with user details including the unique supplier key.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtils.getAllClaimsFromToken(token);
                String email = claims.getSubject();
                String userType = jwtUtils.getUserTypeFromToken(token);
                String supplierKey = jwtUtils.getSupplierKeyFromToken(token);
                
                // PHASE 8: Device Binding Validation
                String tokenFingerprint = claims.get(JwtUtils.CLAIM_DEVICE_FINGERPRINT, String.class);
                String currentFingerprint = jwtUtils.generateDeviceFingerprint(request.getHeader("User-Agent"));
                if (tokenFingerprint != null && !tokenFingerprint.equals(currentFingerprint)) {
                    log.warn("Token rejected: Device fingerprint mismatch (Replay Attack Mitigation)");
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid device footprint");
                    return;
                }

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Map userType to a Spring Security role
                    String role = userType != null ? "ROLE_" + userType.toUpperCase() : "ROLE_USER";
                    List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

                    // Create custom authentication token with supplier key
                    SupplierKeyAuthenticationToken auth = new SupplierKeyAuthenticationToken(
                            email,
                            supplierKey,
                            userType,
                            authorities,
                            true
                    );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.debug("Authenticated user: {} with role: {} and supplierKey: {}",
                            email, role, supplierKey != null ? supplierKey : "N/A");
                }
            } catch (ExpiredJwtException e) {
                log.warn("JWT token expired: {}", e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expired");
                return;
            } catch (MalformedJwtException e) {
                log.warn("Malformed JWT token: {}", e.getMessage());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
                return;
            } catch (Exception e) {
                log.warn("JWT validation error: {}", e.getMessage());
                // Don't block — let the security rules handle it
            }
        }

        filterChain.doFilter(request, response);
    }
}