package com.nayaneyecare.util;

import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.entity.SupplierData;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    public static final String CLAIM_SUPPLIER_KEY = "supplierKey";
    public static final String CLAIM_USER_TYPE = "userType";
    public static final String CLAIM_DEVICE_FINGERPRINT = "deviceFp";

    @Value("${app.jwt.expiration}")
    private int jwtExpirationMs;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        // In a real production environment, you would load these from a secure vault or .env
        // Here we generate a 2048-bit RSA key pair for demonstration of RS256
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        this.privateKey = keyPair.getPrivate();
        this.publicKey = keyPair.getPublic();
        logger.info("JWT RSA KeyPair initialized for RS256 signing.");
    }

    /**
     * PHASE 8: Generate a fingerprint from User-Agent for Replay Mitigation
     */
    public String generateDeviceFingerprint(String userAgent) {
        if (userAgent == null) userAgent = "unknown";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(userAgent.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(userAgent.hashCode());
        }
    }

    /**
     * Generates JWT token for User (supplier/admin) with unique supplier key.
     */
    public String generateToken(User user, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put(CLAIM_USER_TYPE, user.getUserType().name());

        if (user.getUniqueSupplierKey() != null) {
            claims.put(CLAIM_SUPPLIER_KEY, user.getUniqueSupplierKey());
        }
        claims.put(CLAIM_DEVICE_FINGERPRINT, generateDeviceFingerprint(userAgent));

        return createToken(claims, user.getEmail());
    }

    /**
     * Generates JWT token for Customer.
     */
    public String generateTokenForCustomer(Customer customer, String firstName, String lastName, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", customer.getId());
        claims.put("firstName", firstName);
        claims.put("lastName", lastName);
        claims.put(CLAIM_USER_TYPE, "CUSTOMER");

        // Customers share the supplier key of the supplier who created them
        if (customer.getUniqueKey() != null) {
            claims.put(CLAIM_SUPPLIER_KEY, customer.getUniqueKey());
        }

        String subject = customer.getEmail();
        if (subject == null || subject.isBlank()) {
            subject = customer.getMobileNo();
        }
        claims.put(CLAIM_DEVICE_FINGERPRINT, generateDeviceFingerprint(userAgent));

        return createToken(claims, subject);
    }

    /**
     * Generates token for SupplierData (file-based supplier).
     */
    public String generateTokenForSupplier(SupplierData supplier, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", supplier.getId());
        claims.put("firstName", supplier.getFirstName());
        claims.put("lastName", supplier.getLastName());
        claims.put(CLAIM_USER_TYPE, "SUPPLIER");
        claims.put("authSource", "file");

        if (supplier.getUniqueSupplierKey() != null) {
            claims.put(CLAIM_SUPPLIER_KEY, supplier.getUniqueSupplierKey());
        }
        claims.put(CLAIM_DEVICE_FINGERPRINT, generateDeviceFingerprint(userAgent));

        return createToken(claims, supplier.getEmail());
    }

    /**
     * Generates token with explicit supplier key (for cases where user entity doesn't have the key yet).
     */
    public String generateTokenWithSupplierKey(User user, String uniqueSupplierKey, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put(CLAIM_USER_TYPE, user.getUserType().name());
        claims.put(CLAIM_SUPPLIER_KEY, uniqueSupplierKey);
        claims.put(CLAIM_DEVICE_FINGERPRINT, generateDeviceFingerprint(userAgent));

        return createToken(claims, user.getEmail());
    }

    /**
     * Generates JWT token for Admin with ROLE_ADMIN authority and global access.
     */
    public String generateTokenWithAdminRole(User user, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put(CLAIM_USER_TYPE, "ADMIN");
        claims.put(CLAIM_SUPPLIER_KEY, "GLOBAL_ADMIN_ACCESS");
        claims.put("authSource", "admin");
        claims.put(CLAIM_DEVICE_FINGERPRINT, generateDeviceFingerprint(userAgent));

        return createToken(claims, user.getEmail());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * Gets the unique supplier key from the token claims.
     */
    public String getSupplierKeyFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get(CLAIM_SUPPLIER_KEY, String.class);
    }

    /**
     * Gets the user type from the token claims.
     */
    public String getUserTypeFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get(CLAIM_USER_TYPE, String.class);
    }

    public <T> T getClaimFromToken(String token, ClaimsResolver<T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.resolve(claims);
    }

    public Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    public Boolean validateToken(String token, String username, String currentUserAgent) {
        try {
            final String tokenUsername = getUsernameFromToken(token);
            if (!tokenUsername.equals(username) || isTokenExpired(token)) {
                return false;
            }

            // PHASE 8: Device Binding Validation
            String tokenFingerprint = getClaimFromToken(token, claims -> claims.get(CLAIM_DEVICE_FINGERPRINT, String.class));
            String currentFingerprint = generateDeviceFingerprint(currentUserAgent);
            if (tokenFingerprint != null && !tokenFingerprint.equals(currentFingerprint)) {
                logger.warn("Token rejected: Device fingerprint mismatch (Replay Attack Mitigation)");
                return false;
            }
            
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    @FunctionalInterface
    public interface ClaimsResolver<T> {
        T resolve(Claims claims);
    }
}