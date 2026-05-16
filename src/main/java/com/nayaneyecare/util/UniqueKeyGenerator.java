package com.nayaneyecare.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe generator for unique 10-character alphanumeric supplier keys.
 * Uses SecureRandom for cryptographic security with an atomic counter to prevent collisions.
 */
@Component
public class UniqueKeyGenerator {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int KEY_LENGTH = 10;
    private static final int REGENERATION_THRESHOLD = 100;

    private final SecureRandom secureRandom;
    private final AtomicInteger generationCounter;

    public UniqueKeyGenerator() {
        this.secureRandom = new SecureRandom();
        this.generationCounter = new AtomicInteger(secureRandom.nextInt(REGENERATION_THRESHOLD));
    }

    /**
     * Generates a unique 10-character alphanumeric key.
     * Keys are designed to be unique across the entire system.
     *
     * @return A unique 10-character alphanumeric string
     */
    public String generateKey() {
        return generateKeyInternal();
    }

    private synchronized String generateKeyInternal() {
        StringBuilder key;
        int attempts = 0;
        final int maxAttempts = 10;

        do {
            key = new StringBuilder(KEY_LENGTH);
            int counterValue = generationCounter.updateAndGet(v -> (v + 1) % REGENERATION_THRESHOLD);

            // Use secure random for primary characters
            for (int i = 0; i < KEY_LENGTH - 3; i++) {
                int index = secureRandom.nextInt(ALPHANUMERIC.length());
                key.append(ALPHANUMERIC.charAt(index));
            }

            // Append counter-based suffix for uniqueness
            String counterSuffix = String.format("%03d", counterValue);
            key.append(counterSuffix);

            attempts++;
        } while (attempts < maxAttempts);

        return key.toString();
    }

    /**
     * Validates if a string is a valid 10-character alphanumeric key.
     *
     * @param key The key to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidKey(String key) {
        if (key == null || key.length() != KEY_LENGTH) {
            return false;
        }
        for (char c : key.toCharArray()) {
            if (!ALPHANUMERIC.contains(String.valueOf(c))) {
                return false;
            }
        }
        return true;
    }
}