package com.nayaneyecare.controller;

import com.nayaneyecare.dto.AuthResponse;
import com.nayaneyecare.dto.LoginRequest;
import com.nayaneyecare.dto.RefreshRequest;
import com.nayaneyecare.dto.SignupRequest;
import com.nayaneyecare.service.AuthService;
import com.nayaneyecare.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest signupRequest, 
                                               jakarta.servlet.http.HttpServletRequest request,
                                               HttpServletResponse responseObj) {
        AuthResponse response = authService.signup(signupRequest, request);
        
        if (response.getToken() != null) {
            // PHASE 8: Set HttpOnly Cookie for Refresh Token on Signup
            ResponseCookie cookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(true) // Should be true in production
                    .path("/api/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();
            responseObj.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.setRefreshToken(null); // Remove from JSON body
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest, 
                                              jakarta.servlet.http.HttpServletRequest request,
                                              HttpServletResponse responseObj) {
        AuthResponse response = authService.login(loginRequest, request);
        
        if (response.getToken() != null) {
            // PHASE 8: Set HttpOnly Cookie for Refresh Token
            ResponseCookie cookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(true) // Should be true in production
                    .path("/api/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();
            responseObj.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.setRefreshToken(null); // Remove from JSON body
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/profile")
    public ResponseEntity<AuthResponse> getUserProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest request) {
        String email = getEmailFromHeader(authHeader, request);
        if (email == null) {
            return ResponseEntity.badRequest().body(new AuthResponse("User not authenticated or token invalid"));
        }
        
        AuthResponse response = authService.getUserProfile(email);
        
        if (response.getEmail() != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody com.nayaneyecare.entity.User updates,
            jakarta.servlet.http.HttpServletRequest request) {
        String email = getEmailFromHeader(authHeader, request);
        if (email == null) {
            return ResponseEntity.badRequest().body(new AuthResponse("User not authenticated or token invalid"));
        }
        
        AuthResponse response = authService.updateProfile(email, updates);
        
        if (response.getMessage() == null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String getEmailFromHeader(String authHeader, jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String email = jwtUtils.getUsernameFromToken(token);
                String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
                
                if (jwtUtils.validateToken(token, email, userAgent)) {
                    return email;
                }
            }
        } catch (Exception e) {
            // Log error or handle silently
        }
        return null;
    }
    
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest request,
            HttpServletResponse responseObj) {
        // PHASE 2: Revoke all refresh tokens for the authenticated user
        String email = getEmailFromHeader(authHeader, request);
        if (email != null) {
            authService.logout(email);
        }

        // PHASE 8: Clear the HttpOnly Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
        responseObj.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new AuthResponse("Logged out successfully"));
    }

    /**
     * PHASE 2: Token refresh endpoint.
     * Validates the supplied refresh token, rotates it (revokes old, issues new),
     * and returns a fresh access token + new refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshRequest refreshRequest,
            jakarta.servlet.http.HttpServletRequest request,
            HttpServletResponse responseObj) {
        try {
            // Support both cookie and body for backward compatibility during transition
            String tokenToUse = cookieRefreshToken;
            if (tokenToUse == null || tokenToUse.isEmpty()) {
                if (refreshRequest != null && refreshRequest.getRefreshToken() != null) {
                    tokenToUse = refreshRequest.getRefreshToken();
                }
            }

            if (tokenToUse == null || tokenToUse.isEmpty()) {
                return ResponseEntity.status(401).body(new AuthResponse("Refresh token is missing"));
            }

            AuthResponse response = authService.refreshAccessToken(tokenToUse, request);
            
            // PHASE 8: Set new HttpOnly Cookie
            ResponseCookie cookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                    .httpOnly(true)
                    .secure(true)
                    .path("/api/auth")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();
            responseObj.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            response.setRefreshToken(null); // Remove from body
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(new AuthResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(@RequestHeader("Authorization") String authHeader,
                                                      jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String email = jwtUtils.getUsernameFromToken(token);
                String userAgent = request.getHeader("User-Agent");
                
                if (jwtUtils.validateToken(token, email, userAgent)) {
                    AuthResponse response = authService.getUserProfile(email);
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.badRequest().body(new AuthResponse("Invalid token"));
                }
            } else {
                return ResponseEntity.badRequest().body(new AuthResponse("Invalid authorization header"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("Token validation failed"));
        }
    }
} 