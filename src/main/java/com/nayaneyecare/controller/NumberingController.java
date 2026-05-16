package com.nayaneyecare.controller;

import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.repository.BillingRecordRepository;
import com.nayaneyecare.service.NumberingService;
import com.nayaneyecare.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/numbering")
public class NumberingController {

    private static final Logger logger = LoggerFactory.getLogger(NumberingController.class);

    @Autowired
    private NumberingService numberingService;

    @Autowired
    private com.nayaneyecare.repository.NumberingStateRepository numberingStateRepository;

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @GetMapping("/states")
    public ResponseEntity<List<com.nayaneyecare.entity.NumberingState>> getAllNumberingStates() {
        return ResponseEntity.ok(numberingStateRepository.findAll());
    }

    /**
     * Generate next bill number for a specific branch
     * Format: [FIRST4BRANCH]-DDMMYYYY-XXXX (e.g., JUNG-01042026-0001)
     */
    @GetMapping("/next-bill-number")
    public ResponseEntity<Map<String, String>> getNextBillNumber(
            @RequestParam String branchCode,
            @RequestParam String branchName) {
        String billNumber = calculateNextBillNumber(branchCode, branchName);
        Map<String, String> response = new HashMap<>();
        response.put("billNumber", billNumber);
        response.put("nextBillNumber", billNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the next bill number from MySQL.
     * Returns: { nextBillNumber, mysqlLatest }
     */
    @GetMapping("/next-bill-number-with-check")
    public ResponseEntity<Map<String, Object>> getNextBillNumberWithConsistencyCheck(
            @RequestParam String branchCode,
            @RequestParam String branchName) {
        Map<String, Object> response = new HashMap<>();

        String nextBillNumber = calculateNextBillNumber(branchCode, branchName);
        response.put("nextBillNumber", nextBillNumber);

        String mysqlLatest = getLatestBillNumberFromMySQL(branchCode, branchName);
        response.put("mysqlLatest", mysqlLatest);

        // MySQL is the single source of truth — always consistent
        response.put("isConsistent", true);

        return ResponseEntity.ok(response);
    }

    /**
     * Validate a bill number - check if it's correctly formatted and in sequence
     * If incorrect, returns the corrected bill number
     */
    @GetMapping("/validate-bill-number")
    public ResponseEntity<Map<String, Object>> validateBillNumber(
            @RequestParam String billNumber,
            @RequestParam String branchCode,
            @RequestParam String branchName) {
        Map<String, Object> response = new HashMap<>();

        String expectedBillNumber = calculateNextBillNumber(branchCode, branchName);
        String latestBillNumber = getLatestBillNumberFromMySQL(branchCode, branchName);
        boolean isValid = billNumber != null && billNumber.equals(expectedBillNumber);
        response.put("isValid", isValid);
        response.put("inputBillNumber", billNumber);
        response.put("expectedBillNumber", expectedBillNumber);
        response.put("highestExistingBillNumber", latestBillNumber);

        if (!isValid) {
            response.put("correctedBillNumber", expectedBillNumber);
            response.put("message", "Bill number was not the next sequential number for this branch.");
        } else {
            response.put("correctedBillNumber", billNumber);
            response.put("message", "Bill number is valid and sequential.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Get next purchase number
     */
    @GetMapping("/next-purchase-number")
    public ResponseEntity<Map<String, String>> getNextPurchaseNumber() {
        String purchaseNumber = numberingService.generatePurchaseNumber();
        Map<String, String> response = new HashMap<>();
        response.put("purchaseNumber", purchaseNumber);
        response.put("nextPurchaseNumber", purchaseNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current counter value
     */
    @GetMapping("/current/{type}")
    public ResponseEntity<Map<String, Long>> getCurrentCounter(@PathVariable String type) {
        long currentValue = numberingService.getCurrentValue(type);
        Map<String, Long> response = new HashMap<>();
        response.put("current", currentValue);
        return ResponseEntity.ok(response);
    }

    /**
     * Reset counter for a specific type
     */
    @PostMapping("/reset/{type}")
    public ResponseEntity<Map<String, String>> resetCounter(
            @PathVariable String type,
            @RequestParam long value) {
        numberingService.resetCounter(type, value);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Counter reset successfully");
        response.put("type", type);
        response.put("value", String.valueOf(value));
        return ResponseEntity.ok(response);
    }

    /**
     * Get latest bill number from MySQL for a branch
     */
    private String getLatestBillNumberFromMySQL(String branchCode, String branchName) {
        try {
            String branchPrefix = getBranchPrefix(branchCode, branchName);
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy"));
            int latestSequence = 0;
            String latestBillNumber = null;

            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            List<BillingRecord> records = billingRecordRepository.findByBranchCodeAndUniqueKey(branchCode, uniqueKey);
            for (BillingRecord record : records) {
                String candidate = record.getBillNumber();
                int sequence = extractSequence(candidate, branchPrefix, today);
                if (sequence > latestSequence) {
                    latestSequence = sequence;
                    latestBillNumber = candidate;
                }
            }
            return latestBillNumber;
        } catch (Exception e) {
            logger.error("Error getting latest bill from MySQL: {}", e.getMessage());
        }
        return null;
    }


    private String calculateNextBillNumber(String branchCode, String branchName) {
        String branchPrefix = getBranchPrefix(branchCode, branchName);
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy"));
        Set<Integer> usedSequences = getUsedSequencesForBranchDate(branchCode, branchPrefix, today);
        int nextSequence = usedSequences.size() + 1;

        while (usedSequences.contains(nextSequence)) {
            nextSequence++;
        }

        return String.format("%s-%s-%04d", branchPrefix, today, nextSequence);
    }

    private String getBranchPrefix(String branchCode, String branchName) {
        if (branchCode != null && !branchCode.isBlank()) {
            return branchCode.trim().toUpperCase();
        }

        if (branchName == null || branchName.isBlank()) {
            return "XXXX";
        }

        String normalized = branchName.toUpperCase().replaceAll("[^A-Z]", "");
        if (normalized.length() >= 4) {
            return normalized.substring(0, 4);
        }
        return (normalized + "XXXX").substring(0, 4);
    }

    private int extractSequence(String billNumber, String expectedPrefix, String expectedDate) {
        if (billNumber == null || billNumber.isBlank()) {
            return -1;
        }

        String suffixPattern = "-" + expectedDate + "-";
        int separatorIndex = billNumber.lastIndexOf(suffixPattern);
        if (separatorIndex < 0) {
            return -1;
        }

        String actualPrefix = billNumber.substring(0, separatorIndex);
        String sequencePart = billNumber.substring(separatorIndex + suffixPattern.length());

        if (!expectedPrefix.equalsIgnoreCase(actualPrefix) || sequencePart.length() != 4) {
            return -1;
        }

        try {
            return Integer.parseInt(sequencePart);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private Set<Integer> getUsedSequencesForBranchDate(String branchCode, String branchPrefix, String date) {
        Set<Integer> usedSequences = new HashSet<>();

        try {
            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            List<BillingRecord> records = billingRecordRepository.findByBranchCodeAndUniqueKey(branchCode, uniqueKey);
            for (BillingRecord record : records) {
                int sequence = extractSequence(record.getBillNumber(), branchPrefix, date);
                if (sequence > 0) {
                    usedSequences.add(sequence);
                }
            }
        } catch (Exception e) {
            logger.error("Error collecting used bill sequences for branch {}: {}", branchCode, e.getMessage());
        }

        return usedSequences;
    }
}
