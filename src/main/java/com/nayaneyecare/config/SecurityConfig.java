package com.nayaneyecare.config;

import com.nayaneyecare.service.SecurityLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    // PHASE 7: Structured JSON Logging
    @Autowired
    private SecurityLogger securityLogger;

    /**
     * Comma-separated list of allowed CORS origins from application.properties.
     * Example: http://localhost:5173,http://192.168.1.10:5173
     * Supports both localhost development AND LAN network access.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsRaw;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * PHASE 2: Role Hierarchy — ADMIN inherits all SUPPLIER permissions,
     * SUPPLIER inherits all CUSTOMER permissions.
     * This eliminates the need to list every role on every @PreAuthorize.
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("ROLE_ADMIN > ROLE_SUPPLIER > ROLE_CUSTOMER");
        return hierarchy;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // PHASE 8: Enable CSRF protection using cookies for SPA frontend compatibility
            // We ignore CSRF for public auth endpoints because they don't have a token yet.
            .csrf(csrf -> csrf
                .csrfTokenRepository(org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/auth/**", "/api/security/test", "/api/coupons/**")
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ----------------------------------------------------------------
            // PHASE 1: Strict Security Headers
            // ----------------------------------------------------------------
            .headers(headers -> headers
                // Prevent browsers from MIME-sniffing away from declared content type
                .contentTypeOptions(contentType -> {})

                // Prevent the app from being embedded in iframes (Clickjacking protection)
                .frameOptions(frame -> frame.deny())

                // HSTS: force HTTPS for 1 year, including subdomains
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )

                // Content Security Policy:
                // 'self' covers the current origin (works for both localhost AND network IP).
                // http: allows API calls to the backend on any host (port 8080).
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data:; " +
                        "connect-src 'self' http: https:; " +
                        "frame-ancestors 'none';"
                    )
                )

                // Referrer Policy: only send origin on same-site requests
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )

                // Permissions Policy: disable dangerous browser features
                .permissionsPolicy(permissions -> permissions
                    .policy("geolocation=(), microphone=(), camera=(), payment=()")
                )
            )

            .authorizeHttpRequests(authz -> authz
                // Allow ASYNC dispatches for CompletableFutures and ERROR dispatches for exceptions
                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ASYNC, jakarta.servlet.DispatcherType.ERROR).permitAll()
                // Public endpoints – auth, signup, login, security test
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/security/test").permitAll()
                .requestMatchers("/api/coupons/validate/**").permitAll()
                .requestMatchers("/api/coupons/seed").permitAll() // Allow seeding for now
                // Supplier-specific and Admin-bypass APIs – require ROLE_SUPPLIER or ROLE_ADMIN
                .requestMatchers("/api/purchases/**").hasAnyRole("SUPPLIER", "ADMIN")
                .requestMatchers("/api/bulk-purchases/**").hasAnyRole("SUPPLIER", "ADMIN")
                .requestMatchers("/api/purchase-returns/**").hasAnyRole("SUPPLIER", "ADMIN")
                .requestMatchers("/api/sales-returns/**").hasAnyRole("SUPPLIER", "ADMIN")
                .requestMatchers("/api/inventory/**").hasAnyRole("SUPPLIER", "ADMIN")
                .requestMatchers("/api/dashboard/**").hasAnyRole("SUPPLIER", "ADMIN")
                // Admin APIs – require ROLE_ADMIN
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // All other API endpoints – require authentication (any role)
                .requestMatchers("/api/**").authenticated()
                // Non-API paths – permit (serves React frontend static assets)
                .anyRequest().permitAll()
            )
            // PHASE 7: Custom exception handlers to log 401 and 403 to structured JSON
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    securityLogger.logRequestError(request, "UNAUTHORIZED_401", authException.getMessage());
                    response.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    securityLogger.logRequestError(request, "FORBIDDEN_403", accessDeniedException.getMessage());
                    response.sendError(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN, "Access Denied");
                })
            )
            // Add JWT filter before the standard username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Use AllowedOriginPatterns to support wildcards (e.g. http://10.*:5173) 
        // which works even when allowCredentials is true.
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // Explicitly list allowed headers instead of wildcard
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie"));
        configuration.setAllowCredentials(true);
        // Cache preflight responses for 1 hour to reduce OPTIONS requests
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
