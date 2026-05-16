package com.nayaneyecare.service;

import com.nayaneyecare.repository.UserRepository;
import com.nayaneyecare.util.UniqueKeyGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for managing unique supplier key generation with database-backed uniqueness verification.
 * Ensures thread-safe, collision-free key generation.
 */
@Service
public class UniqueKeyService {

    private static final Logger logger = LoggerFactory.getLogger(UniqueKeyService.class);
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final UniqueKeyGenerator keyGenerator;
    private final UserRepository userRepository;
    private final AtomicInteger generationCounter;

    @Autowired
    public UniqueKeyService(UniqueKeyGenerator keyGenerator, UserRepository userRepository) {
        this.keyGenerator = keyGenerator;
        this.userRepository = userRepository;
        this.generationCounter = new AtomicInteger(0);
    }

    /**
     * Generates a unique 10-character alphanumeric supplier key.
     * Verifies uniqueness against the database before returning.
     *
     * @return A unique 10-character alphanumeric string
     * @throws IllegalStateException if unable to generate a unique key after max attempts
     */
    public String generateUniqueSupplierKey() {
        int attempts = 0;

        while (attempts < MAX_GENERATION_ATTEMPTS) {
            String candidateKey = keyGenerator.generateKey();

            if (!isKeyExistsInDatabase(candidateKey)) {
                logger.debug("Generated unique supplier key after {} attempts", attempts + 1);
                return candidateKey;
            }

            attempts++;
            logger.warn("Key collision detected for candidate: {}, attempt: {}", candidateKey, attempts);
        }

        throw new IllegalStateException("Unable to generate unique supplier key after " + MAX_GENERATION_ATTEMPTS + " attempts");
    }

    /**
     * Checks if a key already exists in the database.
     *
     * @param key The key to check
     * @return true if exists, false otherwise
     */
    private boolean isKeyExistsInDatabase(String key) {
        return userRepository.existsByUniqueSupplierKey(key);
    }

    /**
     * Validates if a key is properly formatted and unique.
     *
     * @param key The key to validate
     * @return true if valid and unique, false otherwise
     */
    public boolean isValidAndUniqueKey(String key) {
        if (!keyGenerator.isValidKey(key)) {
            return false;
        }
        return !isKeyExistsInDatabase(key);
    }

    /**
     * Gets the next sequential counter value for this service instance.
     * Used for tracking generation attempts.
     *
     * @return The next counter value
     */
    public int getNextCounter() {
        return generationCounter.incrementAndGet();
    }
}