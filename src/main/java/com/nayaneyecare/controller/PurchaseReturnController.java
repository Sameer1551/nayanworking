package com.nayaneyecare.controller;

import com.nayaneyecare.dto.ErrorResponse;
import com.nayaneyecare.entity.PurchaseReturn;
import com.nayaneyecare.service.PurchaseReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-returns")
@PreAuthorize("hasRole('SUPPLIER')")
public class PurchaseReturnController {

    @Autowired
    private PurchaseReturnService purchaseReturnService;

    @GetMapping
    public ResponseEntity<List<PurchaseReturn>> getAllReturns() {
        return ResponseEntity.ok(purchaseReturnService.loadAllReturns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseReturn> getReturnById(@PathVariable Long id) {
        return purchaseReturnService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/returnNumber/{returnNumber}")
    public ResponseEntity<PurchaseReturn> getReturnByReturnNumber(@PathVariable String returnNumber) {
        return purchaseReturnService.findByReturnNumber(returnNumber)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/bill/{billNumber}")
    public ResponseEntity<List<PurchaseReturn>> getReturnsByBillNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(purchaseReturnService.findByBillNumber(billNumber));
    }

    @GetMapping("/product/{productCode}")
    public ResponseEntity<List<PurchaseReturn>> getReturnsByProductCode(@PathVariable String productCode) {
        return ResponseEntity.ok(purchaseReturnService.findByProductCode(productCode));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PurchaseReturn>> searchReturns(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String branch) {

        LocalDate from = (dateFrom != null && !dateFrom.isEmpty()) ? LocalDate.parse(dateFrom) : null;
        LocalDate to = (dateTo != null && !dateTo.isEmpty()) ? LocalDate.parse(dateTo) : null;

        List<PurchaseReturn> returns;
        if (from != null && to != null) {
            returns = purchaseReturnService.findByDateRange(from, to);
        } else {
            returns = purchaseReturnService.loadAllReturns();
        }

        // Filter by branch
        if (branch != null && !branch.isEmpty()) {
            returns = returns.stream()
                .filter(r -> branch.equals(r.getBranchName()))
                .toList();
        }

        return ResponseEntity.ok(returns);
    }

    @PostMapping
    public ResponseEntity<?> createReturn(@RequestBody PurchaseReturn purchaseReturn) {
        try {
            PurchaseReturn created = purchaseReturnService.createReturn(purchaseReturn);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Purchase return created successfully",
                "data", created
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to create purchase return: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReturn(
            @PathVariable Long id,
            @RequestBody PurchaseReturn purchaseReturn) {
        try {
            return purchaseReturnService.updateReturn(id, purchaseReturn)
                .<ResponseEntity<?>>map(updated -> ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Purchase return updated successfully",
                    "data", updated
                )))
                .orElse(ResponseEntity.status(404)
                    .body(new ErrorResponse("NOT_FOUND", "Purchase return not found with ID: " + id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to update purchase return: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReturn(@PathVariable Long id) {
        try {
            boolean deleted = purchaseReturnService.deleteReturn(id);
            if (deleted) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Purchase return deleted successfully"
                ));
            } else {
                return ResponseEntity.status(404)
                    .body(new ErrorResponse("NOT_FOUND", "Purchase return not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", "Failed to delete purchase return: " + e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "totalCount", purchaseReturnService.getTotalCount(),
            "totalValue", purchaseReturnService.getTotalValue()
        ));
    }
}
