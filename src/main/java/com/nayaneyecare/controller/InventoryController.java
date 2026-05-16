package com.nayaneyecare.controller;

import com.nayaneyecare.dto.InventoryItemViewDto;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.service.InventoryItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
public class InventoryController {
    
    @Autowired
    private InventoryItemService inventoryItemService;
    
    @GetMapping
    public ResponseEntity<List<InventoryItemViewDto>> getAllInventoryItems() {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getAllInventoryItemViews();
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemViewDto> getInventoryItemById(@PathVariable Long id) {
        Optional<InventoryItemViewDto> inventoryItem = inventoryItemService.getInventoryItemViewById(id);
        return inventoryItem.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/product-code/{productCode}")
    public ResponseEntity<InventoryItemViewDto> getInventoryItemByProductCode(@PathVariable String productCode) {
        Optional<InventoryItemViewDto> inventoryItem = inventoryItemService.getInventoryItemViewByProductCode(productCode);
        return inventoryItem.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<InventoryItemViewDto>> getInventoryItemsByCategory(@PathVariable String category) {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getInventoryItemViewsByCategory(category);
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/subcategory/{subcategory}")
    public ResponseEntity<List<InventoryItemViewDto>> getInventoryItemsBySubcategory(@PathVariable String subcategory) {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getInventoryItemViewsBySubcategory(subcategory);
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/supplier/{supplierName}")
    public ResponseEntity<List<InventoryItemViewDto>> getInventoryItemsBySupplier(@PathVariable String supplierName) {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getInventoryItemViewsBySupplier(supplierName);
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<InventoryItemViewDto>> searchInventoryItems(@RequestParam String searchTerm) {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.searchInventoryItemViews(searchTerm);
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItemViewDto>> getLowStockItems() {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getLowStockItemViews();
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryItemViewDto>> getOutOfStockItems() {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getOutOfStockItemViews();
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/stock-level")
    public ResponseEntity<List<InventoryItemViewDto>> getItemsByStockLevel() {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getInventoryItemViewsByStockLevel();
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/expiring")
    public ResponseEntity<List<InventoryItemViewDto>> getExpiringItems(@RequestParam String expiryDate) {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getExpiringItemViews(expiryDate);
        return ResponseEntity.ok(inventoryItems);
    }
    
    @GetMapping("/need-reorder")
    public ResponseEntity<List<InventoryItemViewDto>> getItemsNeedingReorder() {
        List<InventoryItemViewDto> inventoryItems = inventoryItemService.getItemsNeedingReorderViews();
        return ResponseEntity.ok(inventoryItems);
    }
    
    @PostMapping
    public ResponseEntity<InventoryItemViewDto> createInventoryItem(@RequestBody InventoryItem inventoryItem) {
        InventoryItem createdInventoryItem = inventoryItemService.createInventoryItem(inventoryItem);
        return inventoryItemService.getInventoryItemViewById(createdInventoryItem.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemViewDto> updateInventoryItem(@PathVariable Long id, @RequestBody InventoryItem inventoryItemDetails) {
        InventoryItem updatedInventoryItem = inventoryItemService.updateInventoryItem(id, inventoryItemDetails);
        if (updatedInventoryItem != null) {
            return inventoryItemService.getInventoryItemViewById(updatedInventoryItem.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable Long id) {
        boolean deleted = inventoryItemService.deleteInventoryItem(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/stock")
    public ResponseEntity<InventoryItemViewDto> updateStockQuantity(@PathVariable Long id, @RequestParam Integer quantity) {
        InventoryItem updatedInventoryItem = inventoryItemService.updateStockQuantity(id, quantity);
        if (updatedInventoryItem != null) {
            return inventoryItemService.getInventoryItemViewById(updatedInventoryItem.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/add-stock")
    public ResponseEntity<InventoryItemViewDto> addStock(@PathVariable Long id, @RequestParam Integer quantity) {
        InventoryItem updatedInventoryItem = inventoryItemService.addStock(id, quantity);
        if (updatedInventoryItem != null) {
            return inventoryItemService.getInventoryItemViewById(updatedInventoryItem.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/remove-stock")
    public ResponseEntity<InventoryItemViewDto> removeStock(@PathVariable Long id, @RequestParam Integer quantity) {
        InventoryItem updatedInventoryItem = inventoryItemService.removeStock(id, quantity);
        if (updatedInventoryItem != null) {
            return inventoryItemService.getInventoryItemViewById(updatedInventoryItem.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/by-code/{productCode}/add-stock")
    public ResponseEntity<Boolean> addStockByProductCode(@PathVariable String productCode, @RequestParam Integer quantity) {
        boolean success = inventoryItemService.addStockByProductCode(productCode, quantity);
        if (success) {
            return ResponseEntity.ok(true);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/by-code/{productCode}/remove-stock")
    public ResponseEntity<Boolean> removeStockByProductCode(@PathVariable String productCode, @RequestParam Integer quantity) {
        boolean success = inventoryItemService.removeStockByProductCode(productCode, quantity);
        if (success) {
            return ResponseEntity.ok(true);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/cleanup")
    public ResponseEntity<InventoryItemService.CleanupResult> cleanupOrphanedItems() {
        InventoryItemService.CleanupResult result = inventoryItemService.cleanupOrphanedItemsWithResult();
        return ResponseEntity.ok(result);
    }
}
