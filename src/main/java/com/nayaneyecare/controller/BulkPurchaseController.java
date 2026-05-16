package com.nayaneyecare.controller;

import com.nayaneyecare.dto.BulkPurchaseRequest;
import com.nayaneyecare.dto.BulkPurchaseResponse;
import com.nayaneyecare.dto.ErrorResponse;
import com.nayaneyecare.service.BulkPurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bulk-purchases")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
public class BulkPurchaseController {
    
    @Autowired
    private BulkPurchaseService bulkPurchaseService;
    
    /**
     * Create a new bulk purchase record
     */
    @PostMapping
    public ResponseEntity<?> createBulkPurchase(@Valid @RequestBody BulkPurchaseRequest request) {
        System.out.println("Received bulk purchase request: " + request);
        System.out.println("Request details - Bill No: " + request.getPurchaseBillNo() +
                          ", Items: " + request.getPurchaseItems().size());

        try {
            BulkPurchaseResponse response = bulkPurchaseService.createBulkPurchase(request);
            System.out.println("Bulk purchase created successfully: " + response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Business logic error: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new ErrorResponse("INTERNAL_ERROR", e.getMessage()));
        }
    }

    /**
     * Get all bulk purchase records
     */
    @GetMapping
    public ResponseEntity<List<BulkPurchaseResponse>> getAllBulkPurchases() {
        List<BulkPurchaseResponse> bulkPurchases = bulkPurchaseService.getAllBulkPurchases();
        return ResponseEntity.ok(bulkPurchases);
    }
    
    /**
     * Get bulk purchase by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BulkPurchaseResponse> getBulkPurchaseById(@PathVariable @org.springframework.lang.NonNull Long id) {
        return bulkPurchaseService.getBulkPurchaseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get bulk purchase by purchase bill number
     */
    @GetMapping("/bill/{purchaseBillNo}")
    public ResponseEntity<BulkPurchaseResponse> getBulkPurchaseByBillNo(@PathVariable String purchaseBillNo) {
        return bulkPurchaseService.getBulkPurchaseByBillNo(purchaseBillNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update bulk purchase record
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBulkPurchase(@PathVariable @org.springframework.lang.NonNull Long id, @Valid @RequestBody @org.springframework.lang.NonNull BulkPurchaseRequest request) {
        try {
            System.out.println("Received update request for bulk purchase ID: " + id);
            System.out.println("Request details: " + request);

            BulkPurchaseResponse response = bulkPurchaseService.updateBulkPurchase(id, request);
            System.out.println("Bulk purchase updated successfully: " + response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Business logic error: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new ErrorResponse("INTERNAL_ERROR", e.getMessage()));
        }
    }

    /**
     * Delete bulk purchase record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBulkPurchase(@PathVariable @org.springframework.lang.NonNull Long id) {
        try {
            System.out.println("Attempting to delete bulk purchase with ID: " + id);
            bulkPurchaseService.deleteBulkPurchase(id);
            System.out.println("Bulk purchase deleted successfully");
            return ResponseEntity.ok("Bulk purchase deleted successfully");
        } catch (RuntimeException e) {
            System.err.println("Bulk purchase not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error deleting bulk purchase: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new ErrorResponse("INTERNAL_ERROR", e.getMessage()));
        }
    }

    /**
     * Search bulk purchases with filters
     */
    @GetMapping("/search")
    public ResponseEntity<List<BulkPurchaseResponse>> searchBulkPurchases(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) String purchaseBillNo,
            @RequestParam(required = false) String branchName) {
        
        List<BulkPurchaseResponse> bulkPurchases = bulkPurchaseService.searchBulkPurchases(
            dateFrom, dateTo, supplierName, purchaseBillNo, branchName
        );
        
        return ResponseEntity.ok(bulkPurchases);
    }
    
    /**
     * Get bulk purchases by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<BulkPurchaseResponse>> getBulkPurchasesByDateRange(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<BulkPurchaseResponse> bulkPurchases = bulkPurchaseService.getBulkPurchasesByDateRange(startDate, endDate);
        return ResponseEntity.ok(bulkPurchases);
    }
    
    /**
     * Get bulk purchases by branch
     */
    @GetMapping("/branch/{branch}")
    public ResponseEntity<List<BulkPurchaseResponse>> getBulkPurchasesByBranch(@PathVariable String branch) {
        List<BulkPurchaseResponse> bulkPurchases = bulkPurchaseService.getBulkPurchasesByBranch(branch);
        return ResponseEntity.ok(bulkPurchases);
    }
    
    /**
     * Get bulk purchases by supplier
     */
    @GetMapping("/supplier/{supplierName}")
    public ResponseEntity<List<BulkPurchaseResponse>> getBulkPurchasesBySupplier(@PathVariable String supplierName) {
        List<BulkPurchaseResponse> bulkPurchases = bulkPurchaseService.getBulkPurchasesBySupplier(supplierName);
        return ResponseEntity.ok(bulkPurchases);
    }
}
