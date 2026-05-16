package com.nayaneyecare.config;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Custom authentication token that holds the unique supplier key in addition to standard auth info.
 * This token is used to store the supplier key in Spring Security Context after JWT validation.
 */
public class SupplierKeyAuthenticationToken extends AbstractAuthenticationToken {

    private final String username;
    private final String uniqueSupplierKey;
    private final String userType;

    /**
     * Creates an unauthenticated token with supplier key details.
     */
    public SupplierKeyAuthenticationToken(String username, String uniqueSupplierKey, String userType,
                                         Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.username = username;
        this.uniqueSupplierKey = uniqueSupplierKey;
        this.userType = userType;
        setAuthenticated(false);
    }

    /**
     * Creates an authenticated token with full details.
     */
    public SupplierKeyAuthenticationToken(String username, String uniqueSupplierKey, String userType,
                                         Collection<? extends GrantedAuthority> authorities, boolean authenticated) {
        super(authorities);
        this.username = username;
        this.uniqueSupplierKey = uniqueSupplierKey;
        this.userType = userType;
        setAuthenticated(authenticated);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return username;
    }

    /**
     * Gets the unique supplier key associated with this authentication.
     *
     * @return The unique 10-character supplier key
     */
    public String getUniqueSupplierKey() {
        return uniqueSupplierKey;
    }

    /**
     * Gets the username (email) associated with this authentication.
     *
     * @return The username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Gets the user type associated with this authentication.
     *
     * @return The user type (SUPPLIER, CUSTOMER, ADMIN)
     */
    public String getUserType() {
        return userType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        SupplierKeyAuthenticationToken that = (SupplierKeyAuthenticationToken) o;

        if (username != null ? !username.equals(that.username) : that.username != null) return false;
        if (uniqueSupplierKey != null ? !uniqueSupplierKey.equals(that.uniqueSupplierKey) : that.uniqueSupplierKey != null)
            return false;
        return userType != null ? userType.equals(that.userType) : that.userType == null;
    }

    @Override
    public int hashCode() {
        int result = username != null ? username.hashCode() : 0;
        result = 31 * result + (uniqueSupplierKey != null ? uniqueSupplierKey.hashCode() : 0);
        result = 31 * result + (userType != null ? userType.hashCode() : 0);
        return result;
    }
}