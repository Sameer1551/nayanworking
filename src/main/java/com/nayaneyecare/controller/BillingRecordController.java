package com.nayaneyecare.controller;

import com.nayaneyecare.dto.BillingRecordSaveResult;
import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.service.BillingRecordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/billing-records")
public class BillingRecordController {
    
    @Autowired
    private BillingRecordService billingRecordService;
    
    @Autowired
    private com.nayaneyecare.repository.BillingProductRepository billingProductRepository;
    
    @GetMapping
    public ResponseEntity<List<BillingRecord>> getAllBillingRecords() {
        List<BillingRecord> billingRecords = billingRecordService.getAllBillingRecords();
        return ResponseEntity.ok(billingRecords);
    }

    @GetMapping("/products")
    public ResponseEntity<List<com.nayaneyecare.entity.BillingProduct>> getAllBillingProducts() {
        return ResponseEntity.ok(billingProductRepository.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BillingRecord> getBillingRecordById(@PathVariable Long id) {
        Optional<BillingRecord> billingRecord = billingRecordService.getBillingRecordById(id);
        return billingRecord.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/bill-number/{billNumber}")
    public ResponseEntity<BillingRecord> getBillingRecordByBillNumber(@PathVariable String billNumber) {
        Optional<BillingRecord> billingRecord = billingRecordService.getBillingRecordByBillNumber(billNumber);
        return billingRecord.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/branch/{branchCode}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByBranch(@PathVariable String branchCode) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByBranch(branchCode);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/branch-name/{branchName}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByBranchName(@PathVariable String branchName) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByBranchName(branchName);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/customer-contact/{customerContact}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByCustomerContact(@PathVariable String customerContact) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByCustomerContact(customerContact);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/customer-name/{customerName}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByCustomerName(@PathVariable String customerName) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByCustomerName(customerName);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByDateRange(startDate, endDate);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/amount-range")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByAmountRange(
            @RequestParam BigDecimal minAmount,
            @RequestParam BigDecimal maxAmount) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByAmountRange(minAmount, maxAmount);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/payment-status/{status}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByPaymentStatus(@PathVariable String status) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByPaymentStatus(status);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/customer-history/{mobileNo}")
    public ResponseEntity<List<BillingRecord>> getCustomerBillingHistory(@PathVariable String mobileNo) {
        List<BillingRecord> billingRecords = billingRecordService.getCustomerBillingHistory(mobileNo);
        return ResponseEntity.ok(billingRecords);
    }
    
    @GetMapping("/revenue")
    public ResponseEntity<String> getTotalRevenueForPeriod(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        String revenue = billingRecordService.getTotalRevenueForPeriod(startDate, endDate);
        return ResponseEntity.ok(revenue);
    }
    
    @GetMapping("/bill-count")
    public ResponseEntity<Long> getTotalBillsForPeriod(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        Long billCount = billingRecordService.getTotalBillsForPeriod(startDate, endDate);
        return ResponseEntity.ok(billCount);
    }

    @GetMapping("/year/{year}")
    public ResponseEntity<List<BillingRecord>> getBillingRecordsByYear(@PathVariable int year) {
        List<BillingRecord> billingRecords = billingRecordService.getBillingRecordsByYear(year);
        return ResponseEntity.ok(billingRecords);
    }

    @GetMapping("/all-with-products")
    public ResponseEntity<List<BillingRecord>> getAllBillingRecordsWithProducts() {
        List<BillingRecord> billingRecords = billingRecordService.getAllBillingRecordsWithProducts();
        return ResponseEntity.ok(billingRecords);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBillingRecord(@Valid @RequestBody BillingRecord billingRecord) {
        BillingRecordSaveResult saveResult = billingRecordService.createBillingRecord(billingRecord);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("duplicate", saveResult.isDuplicate());
        response.put("message", saveResult.isDuplicate()
                ? "Billing record already exists for this bill number"
                : "Billing record saved successfully");
        response.put("record", saveResult.getBillingRecord());
        response.put("id", saveResult.getBillingRecord().getId());

        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BillingRecord> updateBillingRecord(@PathVariable Long id, @RequestBody BillingRecord billingRecordDetails) {
        Optional<BillingRecord> updatedBillingRecord = billingRecordService.updateBillingRecord(id, billingRecordDetails);
        if (updatedBillingRecord.isPresent()) {
            return ResponseEntity.ok(updatedBillingRecord.get());
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBillingRecord(@PathVariable Long id) {
        boolean deleted = billingRecordService.deleteBillingRecord(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
