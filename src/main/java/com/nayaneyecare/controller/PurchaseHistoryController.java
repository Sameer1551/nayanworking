package com.nayaneyecare.controller;

import com.nayaneyecare.dto.PurchaseHistoryDTO;
import com.nayaneyecare.service.PurchaseHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-history")
public class PurchaseHistoryController {

    @Autowired
    private PurchaseHistoryService purchaseHistoryService;

    /**
     * Get combined purchase history from both single purchases and bulk purchases.
     * Returns all records sorted by date (latest first).
     */
    @GetMapping
    public ResponseEntity<List<PurchaseHistoryDTO>> getPurchaseHistory() {
        if (com.nayaneyecare.util.SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(purchaseHistoryService.getGlobalPurchaseHistory());
        }
        String uniqueKey = com.nayaneyecare.util.SecurityUtils.getCurrentSupplierKey();
        List<PurchaseHistoryDTO> history = purchaseHistoryService.getPurchaseHistory(uniqueKey);
        return ResponseEntity.ok(history);
    }
}
