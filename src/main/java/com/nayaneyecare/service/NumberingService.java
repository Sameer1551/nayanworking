package com.nayaneyecare.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nayaneyecare.entity.NumberingState;
import com.nayaneyecare.repository.NumberingStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Centralized service for generating unique numbers for all record types.
 * Counters are persisted in the MySQL {@code numbering_state} table.
 * <p>
 * On first startup, if the legacy {@code data/numbering-state.json} file is
 * still present, its values are migrated to MySQL and the file is deleted.
 */
@Service
public class NumberingService {

    private static final Logger logger = LoggerFactory.getLogger(NumberingService.class);

    private static final String PURCHASE_PREFIX      = "PUR";
    private static final String SALES_RETURN_PREFIX  = "SR";
    private static final String PURCHASE_RETURN_PREFIX = "PR";

    private static final String KEY_PURCHASE       = "purchase";
    private static final String KEY_SALES_RETURN   = "salesReturn";
    private static final String KEY_PURCHASE_RETURN = "purchaseReturn";

    @Autowired
    private NumberingStateRepository numberingStateRepository;

    // -------------------------------------------------------------------------
    // Initialisation
    // -------------------------------------------------------------------------

    @PostConstruct
    @Transactional
    public void init() {
        migrateFromFileIfPresent();
        ensureCounterExists(KEY_PURCHASE, 1L);
        ensureCounterExists(KEY_SALES_RETURN, 1L);
        ensureCounterExists(KEY_PURCHASE_RETURN, 1L);
        logger.info("NumberingService initialised — using MySQL numbering_state table");
    }

    /**
     * If the legacy JSON file is still on disk, import its values and then
     * delete the file so it is never consulted again.
     */
    private void migrateFromFileIfPresent() {
        File legacyFile = new File("data/numbering-state.json");
        if (!legacyFile.exists()) {
            return;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Long> state = mapper.readValue(legacyFile,
                    new TypeReference<Map<String, Long>>() {});

            state.forEach((key, value) -> {
                if (numberingStateRepository.findByCounterKey(key).isEmpty()) {
                    numberingStateRepository.save(new NumberingState(key, value));
                    logger.info("Migrated counter '{}' = {} from JSON to MySQL", key, value);
                }
            });

            if (legacyFile.delete()) {
                logger.info("Deleted legacy numbering-state.json");
            }
        } catch (IOException e) {
            logger.warn("Could not migrate numbering-state.json: {}", e.getMessage());
        }
    }

    private void ensureCounterExists(String key, long defaultValue) {
        if (numberingStateRepository.findByCounterKey(key).isEmpty()) {
            numberingStateRepository.save(new NumberingState(key, defaultValue));
        }
    }

    // -------------------------------------------------------------------------
    // Counter operations — all DB-backed, thread-safe via @Transactional
    // -------------------------------------------------------------------------

    /**
     * Atomically read the current value and increment by 1 in the DB.
     *
     * @param key the counter key
     * @return the value before incrementing (i.e., the value to use for the
     *         current number)
     */
    @Transactional
    public synchronized long getAndIncrement(String key) {
        NumberingState state = numberingStateRepository.findByCounterKey(key)
                .orElseThrow(() -> new IllegalStateException("Counter not initialised: " + key));
        long current = state.getCounterValue();
        state.setCounterValue(current + 1);
        numberingStateRepository.save(state);
        return current;
    }

    /**
     * Generate next purchase number.
     * Format: PUR-YYYYMMDD-XXXX (e.g., PUR-20260412-0001)
     */
    public String generatePurchaseNumber() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long number = getAndIncrement(KEY_PURCHASE);
        return String.format("%s-%s-%04d", PURCHASE_PREFIX, today, number);
    }

    /**
     * Generate next sales-return number.
     * Format: SR-YYYYMMDD-XXXX
     */
    public String generateSalesReturnNumber() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long number = getAndIncrement(KEY_SALES_RETURN);
        return String.format("%s-%s-%04d", SALES_RETURN_PREFIX, today, number);
    }

    /**
     * Generate next purchase-return number.
     * Format: PR-YYYYMMDD-XXXX
     */
    public String generatePurchaseReturnNumber() {
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long number = getAndIncrement(KEY_PURCHASE_RETURN);
        return String.format("%s-%s-%04d", PURCHASE_RETURN_PREFIX, today, number);
    }

    /**
     * Generate a unique ID for any record type (non-sequential, timestamp-based).
     */
    public String generateId(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "_"
                + String.format("%04d", (int) (Math.random() * 10000));
    }

    /**
     * Reset counter for a specific type (admin function).
     */
    @Transactional
    public synchronized void resetCounter(String type, long value) {
        NumberingState state = numberingStateRepository.findByCounterKey(type)
                .orElseGet(() -> new NumberingState(type, value));
        state.setCounterValue(value);
        numberingStateRepository.save(state);
        logger.info("Reset counter '{}' to {}", type, value);
    }

    /**
     * Get current counter value.
     */
    public long getCurrentValue(String type) {
        return numberingStateRepository.findByCounterKey(type)
                .map(NumberingState::getCounterValue)
                .orElse(0L);
    }
}
