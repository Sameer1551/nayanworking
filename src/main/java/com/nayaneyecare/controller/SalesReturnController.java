package com.nayaneyecare.controller;

import com.nayaneyecare.dto.ErrorResponse;
import com.nayaneyecare.dto.SalesReturnRequest;
import com.nayaneyecare.dto.SalesReturnResponse;
import com.nayaneyecare.service.SalesReturnService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-returns")
@PreAuthorize("hasRole('SUPPLIER')")
public class SalesReturnController {

    @Autowired
    private SalesReturnService salesReturnService;

    @Autowired
    private com.nayaneyecare.repository.SalesReturnItemRepository salesReturnItemRepository;

    @GetMapping
    public ResponseEntity<List<SalesReturnResponse>> getAllReturns() {
        return ResponseEntity.ok(salesReturnService.loadAllReturns());
    }

    @GetMapping("/items")
    public ResponseEntity<List<com.nayaneyecare.entity.SalesReturnItem>> getAllReturnItems() {
        return ResponseEntity.ok(salesReturnItemRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesReturnResponse> getReturnById(@PathVariable Long id) {
        return salesReturnService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/bill/{billNumber}")
    public ResponseEntity<List<SalesReturnResponse>> getReturnsByBillNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(salesReturnService.findByBillNumber(billNumber));
    }

    @GetMapping("/product/{productCode}")
    public ResponseEntity<List<SalesReturnResponse>> getReturnsByProductCode(@PathVariable String productCode) {
        return ResponseEntity.ok(salesReturnService.findByProductCode(productCode));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SalesReturnResponse>> searchReturns(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String branch) {

        LocalDate from = (dateFrom != null && !dateFrom.isEmpty()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to = (dateTo != null && !dateTo.isEmpty()) ? LocalDate.parse(dateTo) : null;
        String branchName = (branch != null && !branch.isEmpty()) ? branch : null;

        List<SalesReturnResponse> results;

        if (from != null && to != null) {
            results = salesReturnService.findByDateRange(from, to);
        } else if (branchName != null) {
            results = salesReturnService.findByBranch(branchName);
        } else {
            results = salesReturnService.loadAllReturns();
        }

        return ResponseEntity.ok(results);
    }

    @PostMapping
    public ResponseEntity<?> createReturn(@Valid @RequestBody SalesReturnRequest request) {
        try {
            SalesReturnResponse created = salesReturnService.createReturn(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sales return created successfully",
                "data", created
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to create sales return: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReturn(
            @PathVariable Long id,
            @Valid @RequestBody SalesReturnRequest request) {
        try {
            return salesReturnService.updateReturn(id, request)
                .<ResponseEntity<?>>map(updated -> ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Sales return updated successfully",
                    "data", updated
                )))
                .orElse(ResponseEntity.status(404)
                    .body(new ErrorResponse("NOT_FOUND", "Sales return not found with ID: " + id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to update sales return: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReturn(@PathVariable Long id) {
        try {
            boolean deleted = salesReturnService.deleteReturn(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Sales return deleted successfully"
                ));
            } else {
                return ResponseEntity.status(404)
                    .body(new ErrorResponse("NOT_FOUND", "Sales return not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to delete sales return: " + e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "totalCount", salesReturnService.getTotalCount(),
            "totalValue", salesReturnService.getTotalValue()
        ));
    }
}
