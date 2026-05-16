package com.nayaneyecare.controller;

import com.nayaneyecare.dto.ErrorResponse;
import com.nayaneyecare.dto.PurchaseRequest;
import com.nayaneyecare.dto.PurchaseResponse;
import com.nayaneyecare.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
public class PurchaseController {
    
    @Autowired
    private PurchaseService purchaseService;
    
    /**
     * Create a new purchase record
     */
    @PostMapping
    public ResponseEntity<?> createPurchase(@Valid @RequestBody PurchaseRequest request) {
        System.out.println("Received purchase request: " + request);
        System.out.println("Request details - Bill No: " + request.getPurchaseBillNo() +
                          ", Category: " + request.getCategory() +
                          ", Price: " + request.getPurchasePrice() +
                          ", Total: " + request.getTotalAmount());

        try {
            PurchaseResponse response = purchaseService.createPurchase(request);
            System.out.println("Purchase created successfully: " + response);
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

    @Autowired
    private com.nayaneyecare.repository.PurchaseItemRepository purchaseItemRepository;

    /**
     * Get all purchase records
     */
    @GetMapping
    public ResponseEntity<List<PurchaseResponse>> getAllPurchases() {
        List<PurchaseResponse> purchases = purchaseService.getAllPurchases();
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/items")
    public ResponseEntity<List<com.nayaneyecare.entity.PurchaseItem>> getAllPurchaseItems() {
        return ResponseEntity.ok(purchaseItemRepository.findAll());
    }
    
    /**
     * Get purchase by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseResponse> getPurchaseById(@PathVariable @org.springframework.lang.NonNull Long id) {
        return purchaseService.getPurchaseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get purchase by purchase bill number
     */
    @GetMapping("/bill/{purchaseBillNo}")
    public ResponseEntity<PurchaseResponse> getPurchaseByBillNo(@PathVariable String purchaseBillNo) {
        return purchaseService.getPurchaseByBillNo(purchaseBillNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Update purchase record
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable @org.springframework.lang.NonNull Long id, @Valid @RequestBody PurchaseRequest request) {
        try {
            System.out.println("Received update request for purchase ID: " + id);
            System.out.println("Request details: " + request);

            PurchaseResponse response = purchaseService.updatePurchase(id, request);
            System.out.println("Purchase updated successfully: " + response);
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
     * Delete purchase record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable @org.springframework.lang.NonNull Long id) {
        try {
            System.out.println("Attempting to delete purchase with ID: " + id);
            purchaseService.deletePurchase(id);
            System.out.println("Purchase deleted successfully");
            return ResponseEntity.ok("Purchase deleted successfully");
        } catch (RuntimeException e) {
            System.err.println("Purchase not found: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error deleting purchase: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new ErrorResponse("INTERNAL_ERROR", e.getMessage()));
        }
    }
    
    /**
     * Search purchases with filters
     */
    @GetMapping("/search")
    public ResponseEntity<List<PurchaseResponse>> searchPurchases(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String hsn,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) String purchaseBillNo,
            @RequestParam(required = false) String productCode,
            @RequestParam(required = false) String branchName,
            @RequestParam(required = false) String importRef) {
        
        List<PurchaseResponse> purchases = purchaseService.searchPurchases(
            dateFrom, dateTo, productName, hsn, supplierName, purchaseBillNo,
            productCode, branchName, importRef
        );
        
        return ResponseEntity.ok(purchases);
    }
    
    /**
     * Get purchases by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<PurchaseResponse>> getPurchasesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<PurchaseResponse> purchases = purchaseService.getPurchasesByDateRange(startDate, endDate);
        return ResponseEntity.ok(purchases);
    }
    
    /**
     * Get purchases by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<?> getPurchasesByCategory(@PathVariable String category) {
        try {
            List<PurchaseResponse> purchases = purchaseService.getPurchasesByCategory(category);
            return ResponseEntity.ok(purchases);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST", e.getMessage()));
        }
    }

    /**
     * Get purchases by supplier
     */
    @GetMapping("/supplier/{supplierName}")
    public ResponseEntity<List<PurchaseResponse>> getPurchasesBySupplier(@PathVariable String supplierName) {
        List<PurchaseResponse> purchases = purchaseService.getPurchasesBySupplier(supplierName);
        return ResponseEntity.ok(purchases);
    }
    
    /**
     * Get purchases by branch
     */
    @GetMapping("/branch/{branch}")
    public ResponseEntity<List<PurchaseResponse>> getPurchasesByBranch(@PathVariable String branch) {
        List<PurchaseResponse> purchases = purchaseService.getPurchasesByBranch(branch);
        return ResponseEntity.ok(purchases);
    }
}
