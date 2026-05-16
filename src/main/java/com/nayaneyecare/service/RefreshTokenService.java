package com.nayaneyecare.service;

import com.nayaneyecare.entity.RefreshToken;
import com.nayaneyecare.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * PHASE 2: Service for creating, validating, rotating, and revoking refresh tokens.
 *
 * Token Rotation: every time a refresh token is used to obtain a new access token,
 * the old refresh token is immediately revoked and a brand-new one is issued.
 * This limits the damage window if a token is ever stolen.
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    /**
     * Refresh token lifetime in milliseconds from application.properties.
     * Default: 7 days = 604800000 ms
     */
    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshTokenDurationMs;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Create and persist a new refresh token for the given user.
     * Called on login and after token rotation.
     */
    @Transactional
    public RefreshToken createRefreshToken(String userEmail, String userType) {
        RefreshToken token = new RefreshToken(
                UUID.randomUUID().toString(),
                userEmail,
                userType,
                Instant.now().plusMillis(refreshTokenDurationMs)
        );
        RefreshToken saved = refreshTokenRepository.save(token);
        log.info("Refresh token issued for: {} ({})", userEmail, userType);
        return saved;
    }

    /**
     * Validate a refresh token string.
     * Returns the entity if valid, throws an exception if expired or revoked.
     */
    public RefreshToken validateRefreshToken(String tokenString) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (token.isRevoked()) {
            log.warn("Attempted use of revoked refresh token for user: {}", token.getUserEmail());
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        if (token.isExpired()) {
            log.warn("Attempted use of expired refresh token for user: {}", token.getUserEmail());
            refreshTokenRepository.delete(token);
            throw new IllegalArgumentException("Refresh token has expired. Please log in again.");
        }

        return token;
    }

    /**
     * Token Rotation: revoke the old token and issue a fresh one.
     * This is called by the /refresh endpoint on every use.
     */
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken) {
        // Revoke the old token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);
        log.info("Refresh token rotated for user: {}", oldToken.getUserEmail());

        // Issue a new token
        return createRefreshToken(oldToken.getUserEmail(), oldToken.getUserType());
    }

    /**
     * Logout: explicitly revoke all refresh tokens for the user.
     */
    @Transactional
    public void revokeAllUserTokens(String userEmail) {
        int count = refreshTokenRepository.revokeAllByUserEmail(userEmail);
        log.info("Revoked {} refresh token(s) for user: {}", count, userEmail);
    }

    /**
     * Find a refresh token by its raw string value.
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }
}
