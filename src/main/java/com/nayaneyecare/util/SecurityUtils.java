package com.nayaneyecare.util;

import com.nayaneyecare.config.SupplierKeyAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility class for retrieving the current supplier's unique key from Spring Security Context.
 * Provides thread-safe access to the authenticated supplier's identifier.
 */
@Component
public class SecurityUtils {

    private static final String NO_SUPPLIER_KEY_ERROR = "No supplier key found in security context. User may not be authenticated.";
    
    /**
     * Checks if the current session is authenticated.
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser");
    }

    /**
     * Retrieves the current supplier's unique key from the Spring Security Context.
     *
     * @return The unique supplier key of the currently authenticated user
     * @throws IllegalStateException if no supplier key is found in the security context
     */
    public static String getCurrentSupplierKey() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(NO_SUPPLIER_KEY_ERROR);
        }

        if (authentication instanceof SupplierKeyAuthenticationToken) {
            SupplierKeyAuthenticationToken supplierToken = (SupplierKeyAuthenticationToken) authentication;
            String supplierKey = supplierToken.getUniqueSupplierKey();

            if (supplierKey == null || supplierKey.isBlank()) {
                throw new IllegalStateException(NO_SUPPLIER_KEY_ERROR);
            }

            return supplierKey;
        }

        // Fallback: check principal details for backward compatibility
        Object principal = authentication.getPrincipal();
        if (principal != null && principal instanceof String) {
            String principalStr = (String) principal;
            if (principalStr.length() == 10 && principalStr.matches("[A-Z0-9]+")) {
                return principalStr;
            }
        }

        throw new IllegalStateException(NO_SUPPLIER_KEY_ERROR);
    }

    /**
     * Checks if a supplier key is present in the current security context.
     *
     * @return true if a valid supplier key exists, false otherwise
     */
    public static boolean hasSupplierKey() {
        try {
            return getCurrentSupplierKey() != null;
        } catch (IllegalStateException e) {
            return false;
        }
    }

    /**
     * Safely gets the supplier key, returning null if not present instead of throwing.
     *
     * @return The unique supplier key or null if not authenticated
     */
    public static String getCurrentSupplierKeyOrNull() {
        try {
            return getCurrentSupplierKey();
        } catch (IllegalStateException e) {
            return null;
        }
    }

    /**
     * Gets the username (email) of the currently authenticated user.
     *
     * @return The username or null if not authenticated
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getName();
    }

    /**
     * Gets the user type of the currently authenticated user.
     *
     * @return The user type or null if not authenticated
     */
    public static String getCurrentUserType() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse(null);
    }

    /**
     * Checks if the current user has ADMIN role (global bypass).
     *
     * @return true if the user is an admin, false otherwise
     */
    public static boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));
    }

    /**
     * Gets supplier key for queries — returns null for admin (bypass).
     */
    public static String getSupplierKeyForQuery() {
        if (isAdmin()) {
            return null; // null signals no filtering
        }
        return getCurrentSupplierKey();
    }
}