package com.nayaneyecare.service;

import com.nayaneyecare.dto.InventoryItemViewDto;
import com.nayaneyecare.dto.InventoryMovementDto;
import com.nayaneyecare.entity.BillingProduct;
import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.entity.Purchase;
import com.nayaneyecare.entity.PurchaseItem;
import com.nayaneyecare.entity.PurchaseReturn;
import com.nayaneyecare.entity.SalesReturn;
import com.nayaneyecare.entity.SalesReturnItem;
import com.nayaneyecare.repository.BillingRecordRepository;
import com.nayaneyecare.repository.BulkPurchaseRepository;
import com.nayaneyecare.repository.InventoryItemRepository;
import com.nayaneyecare.repository.PurchaseItemRepository;
import com.nayaneyecare.repository.PurchaseRepository;
import com.nayaneyecare.repository.PurchaseReturnRepository;
import com.nayaneyecare.repository.SalesReturnRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Service for managing inventory items with row-level data isolation.
 * All methods automatically filter by the current supplier's unique key.
 */
@Service
public class InventoryItemService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private PurchaseItemRepository purchaseItemRepository;

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @Autowired
    private PurchaseReturnRepository purchaseReturnRepository;

    @Autowired
    private SalesReturnRepository salesReturnRepository;

    /**
     * Gets all inventory items for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<InventoryItem> getAllInventoryItems() {
        if (SecurityUtils.isAdmin()) return inventoryItemRepository.findAll();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findAllByUniqueKey(uniqueKey);
    }

    public List<InventoryItemViewDto> getAllInventoryItemViews() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        List<InventoryItem> items = SecurityUtils.isAdmin() 
                ? inventoryItemRepository.findAll()
                : inventoryItemRepository.findAllByUniqueKey(uniqueKey);
        return items.stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public Optional<InventoryItemViewDto> getInventoryItemViewById(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findById(id)
                .filter(item -> SecurityUtils.isAdmin() || uniqueKey.equals(item.getUniqueKey()))
                .map(item -> toInventoryView(item, context));
    }

    public Optional<InventoryItemViewDto> getInventoryItemViewByProductCode(String productCode) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        Optional<InventoryItem> itemOpt = SecurityUtils.isAdmin()
                ? inventoryItemRepository.findByProductCode(productCode)
                : inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);
        return itemOpt.map(item -> toInventoryView(item, context));
    }

    public List<InventoryItemViewDto> getInventoryItemViewsByCategory(String category) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        List<InventoryItem> items = SecurityUtils.isAdmin() 
                ? inventoryItemRepository.findAll().stream().filter(i -> category.equals(i.getCategory())).toList()
                : inventoryItemRepository.findByCategoryAndUniqueKey(category, uniqueKey);
        return items.stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getInventoryItemViewsBySubcategory(String subcategory) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        List<InventoryItem> items = SecurityUtils.isAdmin()
                ? inventoryItemRepository.findAll().stream().filter(i -> subcategory.equals(i.getSubcategory())).toList()
                : inventoryItemRepository.findBySubcategoryAndUniqueKey(subcategory, uniqueKey);
        return items.stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getInventoryItemViewsBySupplier(String supplierName) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        List<InventoryItem> items = SecurityUtils.isAdmin()
                ? inventoryItemRepository.findAll().stream().filter(i -> supplierName.equals(i.getSupplierName())).toList()
                : inventoryItemRepository.findBySupplierNameAndUniqueKey(supplierName, uniqueKey);
        return items.stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> searchInventoryItemViews(String searchTerm) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findBySearchTerm(searchTerm, uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getLowStockItemViews() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findLowStockItems(uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getOutOfStockItemViews() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findOutOfStockItems(uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getInventoryItemViewsByStockLevel() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findItemsByStockLevel(uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getExpiringItemViews(String expiryDate) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findExpiringItems(expiryDate, uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    public List<InventoryItemViewDto> getItemsNeedingReorderViews() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        InventoryContext context = buildInventoryContext(uniqueKey);
        return inventoryItemRepository.findItemsNeedingReorder(uniqueKey).stream()
                .map(item -> toInventoryView(item, context))
                .toList();
    }

    /**
     * Gets an inventory item by ID with data isolation check.
     */
    public Optional<InventoryItem> getInventoryItemById(Long id) {
        if (SecurityUtils.isAdmin()) return inventoryItemRepository.findById(id);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findById(id)
                .filter(item -> uniqueKey.equals(item.getUniqueKey()));
    }

    /**
     * Gets an inventory item by product code with data isolation check.
     */
    public Optional<InventoryItem> getInventoryItemByProductCode(String productCode) {
        if (SecurityUtils.isAdmin()) return inventoryItemRepository.findByProductCode(productCode);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);
    }

    public List<InventoryItem> getInventoryItemsByCategory(String category) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        if (SecurityUtils.isAdmin()) {
            return inventoryItemRepository.findAll().stream().filter(i -> category.equals(i.getCategory())).toList();
        }
        return inventoryItemRepository.findByCategoryAndUniqueKey(category, uniqueKey);
    }

    public List<InventoryItem> getInventoryItemsBySubcategory(String subcategory) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        if (SecurityUtils.isAdmin()) {
            return inventoryItemRepository.findAll().stream().filter(i -> subcategory.equals(i.getSubcategory())).toList();
        }
        return inventoryItemRepository.findBySubcategoryAndUniqueKey(subcategory, uniqueKey);
    }

    public List<InventoryItem> getInventoryItemsBySupplier(String supplierName) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        if (SecurityUtils.isAdmin()) {
            return inventoryItemRepository.findAll().stream().filter(i -> supplierName.equals(i.getSupplierName())).toList();
        }
        return inventoryItemRepository.findBySupplierNameAndUniqueKey(supplierName, uniqueKey);
    }

    public List<InventoryItem> searchInventoryItems(String searchTerm) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findBySearchTerm(searchTerm, uniqueKey);
    }

    public List<InventoryItem> getLowStockItems() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findLowStockItems(uniqueKey);
    }

    public List<InventoryItem> getOutOfStockItems() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findOutOfStockItems(uniqueKey);
    }

    public List<InventoryItem> getItemsByStockLevel() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findItemsByStockLevel(uniqueKey);
    }

    public List<InventoryItem> getExpiringItems(String expiryDate) {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findExpiringItems(expiryDate, uniqueKey);
    }

    public List<InventoryItem> getItemsNeedingReorder() {
        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        return inventoryItemRepository.findItemsNeedingReorder(uniqueKey);
    }

    /**
     * Creates a new inventory item with automatic unique key assignment.
     * Data isolation is enforced by stamping the unique key from the security context.
     */
    public InventoryItem createInventoryItem(InventoryItem inventoryItem) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        inventoryItem.setUniqueKey(uniqueKey);
        return inventoryItemRepository.save(inventoryItem);
    }

    /**
     * Updates an inventory item with data isolation check.
     */
    public InventoryItem updateInventoryItem(Long id, InventoryItem inventoryItemDetails) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findById(id);

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();

            // Enforce data isolation
            if (!SecurityUtils.isAdmin() && !uniqueKey.equals(inventoryItem.getUniqueKey())) {
                return null;
            }

            if (inventoryItemDetails.getProductName() != null) {
                inventoryItem.setProductName(inventoryItemDetails.getProductName());
            }
            if (inventoryItemDetails.getProductCode() != null) {
                inventoryItem.setProductCode(inventoryItemDetails.getProductCode());
            }
            if (inventoryItemDetails.getCategory() != null) {
                inventoryItem.setCategory(inventoryItemDetails.getCategory());
            }
            if (inventoryItemDetails.getSubcategory() != null) {
                inventoryItem.setSubcategory(inventoryItemDetails.getSubcategory());
            }
            if (inventoryItemDetails.getDescription() != null) {
                inventoryItem.setDescription(inventoryItemDetails.getDescription());
            }
            if (inventoryItemDetails.getHsnCode() != null) {
                inventoryItem.setHsnCode(inventoryItemDetails.getHsnCode());
            }
            if (inventoryItemDetails.getQuantity() != null) {
                inventoryItem.setQuantity(inventoryItemDetails.getQuantity());
            }
            if (inventoryItemDetails.getPurchasePrice() != null) {
                inventoryItem.setPurchasePrice(inventoryItemDetails.getPurchasePrice());
            }
            if (inventoryItemDetails.getSellingPrice() != null) {
                inventoryItem.setSellingPrice(inventoryItemDetails.getSellingPrice());
            }
            if (inventoryItemDetails.getGstPercentage() != null) {
                inventoryItem.setGstPercentage(inventoryItemDetails.getGstPercentage());
            }
            if (inventoryItemDetails.getSupplierName() != null) {
                inventoryItem.setSupplierName(inventoryItemDetails.getSupplierName());
            }
            if (inventoryItemDetails.getSupplierAddress() != null) {
                inventoryItem.setSupplierAddress(inventoryItemDetails.getSupplierAddress());
            }
            if (inventoryItemDetails.getSupplierGstin() != null) {
                inventoryItem.setSupplierGstin(inventoryItemDetails.getSupplierGstin());
            }
            if (inventoryItemDetails.getPurchaseDate() != null) {
                inventoryItem.setPurchaseDate(inventoryItemDetails.getPurchaseDate());
            }
            if (inventoryItemDetails.getExpiryDate() != null) {
                inventoryItem.setExpiryDate(inventoryItemDetails.getExpiryDate());
            }
            if (inventoryItemDetails.getMinimumStock() != null) {
                inventoryItem.setMinimumStock(inventoryItemDetails.getMinimumStock());
            }
            if (inventoryItemDetails.getMaximumStock() != null) {
                inventoryItem.setMaximumStock(inventoryItemDetails.getMaximumStock());
            }
            if (inventoryItemDetails.getReorderPoint() != null) {
                inventoryItem.setReorderPoint(inventoryItemDetails.getReorderPoint());
            }
            if (inventoryItemDetails.getRemarks() != null) {
                inventoryItem.setRemarks(inventoryItemDetails.getRemarks());
            }

            return inventoryItemRepository.save(inventoryItem);
        }
        return null;
    }

    /**
     * Deletes an inventory item with data isolation check.
     */
    public boolean deleteInventoryItem(Long id) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findById(id);

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.get();
            // Enforce data isolation
            if (!SecurityUtils.isAdmin() && !uniqueKey.equals(inventoryItem.getUniqueKey())) {
                return false;
            }
            inventoryItemRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Updates stock quantity with data isolation check.
     */
    public InventoryItem updateStockQuantity(Long id, Integer newQuantity) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findById(id)
                .filter(item -> SecurityUtils.isAdmin() || uniqueKey.equals(item.getUniqueKey()));

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();
            inventoryItem.setQuantity(newQuantity);
            return inventoryItemRepository.save(inventoryItem);
        }
        return null;
    }

    /**
     * Adds stock with data isolation check.
     */
    public InventoryItem addStock(Long id, Integer quantityToAdd) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findById(id)
                .filter(item -> SecurityUtils.isAdmin() || uniqueKey.equals(item.getUniqueKey()));

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();
            Integer currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
            inventoryItem.setQuantity(currentQuantity + quantityToAdd);
            return inventoryItemRepository.save(inventoryItem);
        }
        return null;
    }

    /**
     * Removes stock with data isolation check.
     */
    public InventoryItem removeStock(Long id, Integer quantityToRemove) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findById(id)
                .filter(item -> SecurityUtils.isAdmin() || uniqueKey.equals(item.getUniqueKey()));

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();
            Integer currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
            Integer newQuantity = Math.max(0, currentQuantity - quantityToRemove);
            inventoryItem.setQuantity(newQuantity);
            return inventoryItemRepository.save(inventoryItem);
        }
        return null;
    }

    /**
     * Add stock by product code with data isolation check.
     */
    public boolean addStockByProductCode(String productCode, Integer quantityToAdd) {
        if (SecurityUtils.isAdmin()) {
            return inventoryItemRepository.findByProductCode(productCode).map(item -> {
                item.setQuantity((item.getQuantity() != null ? item.getQuantity() : 0) + quantityToAdd);
                inventoryItemRepository.save(item);
                return true;
            }).orElse(false);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();
            Integer currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
            inventoryItem.setQuantity(currentQuantity + quantityToAdd);
            inventoryItemRepository.save(inventoryItem);
            return true;
        }
        return false;
    }

    /**
     * Remove stock by product code with data isolation check.
     */
    public boolean removeStockByProductCode(String productCode, Integer quantityToRemove) {
        if (SecurityUtils.isAdmin()) {
            return inventoryItemRepository.findByProductCode(productCode).map(item -> {
                Integer currentQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
                item.setQuantity(Math.max(0, currentQuantity - quantityToRemove));
                inventoryItemRepository.save(item);
                return true;
            }).orElse(false);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> inventoryItemOpt = inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);

        if (inventoryItemOpt.isPresent()) {
            InventoryItem inventoryItem = inventoryItemOpt.orElseThrow();
            Integer currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
            Integer newQuantity = Math.max(0, currentQuantity - quantityToRemove);
            inventoryItem.setQuantity(newQuantity);
            inventoryItemRepository.save(inventoryItem);
            return true;
        }
        return false;
    }

    /**
     * Create or update inventory item from purchase with data isolation.
     */
    public InventoryItem createOrUpdateFromPurchase(String productCode, String productName, String category,
            String subcategory, String hsnCode, Integer quantity, BigDecimal purchasePrice) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<InventoryItem> existingItem = SecurityUtils.isAdmin() 
                ? inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, "GLOBAL_ADMIN") 
                : inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);

        if (existingItem.isPresent()) {
            InventoryItem item = existingItem.orElseThrow();
            Integer currentQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
            item.setQuantity(currentQuantity + quantity);
            return inventoryItemRepository.save(item);
        } else {
            InventoryItem newItem = new InventoryItem();
            newItem.setProductCode(productCode);
            newItem.setProductName(productName);
            newItem.setCategory(category);
            newItem.setSubcategory(subcategory);
            newItem.setHsnCode(hsnCode);
            newItem.setQuantity(quantity);
            newItem.setPurchasePrice(purchasePrice);
            newItem.setUniqueKey(uniqueKey);
            return inventoryItemRepository.save(newItem);
        }
    }

    /**
     * Cleanup orphaned inventory items for current supplier.
     */
    public CleanupResult cleanupOrphanedItemsWithResult() {
        if (SecurityUtils.isAdmin()) {
            return new CleanupResult(new ArrayList<>(), "Cleanup not allowed globally for Admin.");
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Set<String> knownProductCodes = new HashSet<>();
        purchaseRepository.findAllByUniqueKey(uniqueKey)
                .forEach(purchase -> knownProductCodes.add(normalizeCode(purchase.getProductCode())));
        purchaseItemRepository.findAllByUniqueKey(uniqueKey)
                .forEach(item -> knownProductCodes.add(normalizeCode(item.getProductCode())));

        List<String> removed = new ArrayList<>();
        for (InventoryItem item : inventoryItemRepository.findAllByUniqueKey(uniqueKey)) {
            String productCode = normalizeCode(item.getProductCode());
            int quantity = safeInt(item.getQuantity());
            if (!knownProductCodes.contains(productCode) && quantity <= 0) {
                removed.add(item.getProductCode());
                inventoryItemRepository.delete(item);
            }
        }
        String message = removed.isEmpty()
                ? "No orphaned inventory items found."
                : "Removed " + removed.size() + " orphaned inventory items.";
        return new CleanupResult(removed, message);
    }

    private InventoryContext buildInventoryContext(String uniqueKey) {
        if (SecurityUtils.isAdmin()) {
            return new InventoryContext(
                purchaseRepository.queryAllGlobal(),
                purchaseItemRepository.findAll(),
                billingRecordRepository.queryAllGlobalWithProducts(),
                purchaseReturnRepository.findAll(),
                salesReturnRepository.findAll()
            );
        }
        return new InventoryContext(
                purchaseRepository.findAllByUniqueKey(uniqueKey),
                purchaseItemRepository.findAllByUniqueKey(uniqueKey),
                billingRecordRepository.findAllWithProducts(uniqueKey),
                purchaseReturnRepository.findAllByUniqueKey(uniqueKey),
                salesReturnRepository.findAllWithItems(uniqueKey)
        );
    }

    // Remaining methods are unchanged but use the filtered context
    private InventoryItemViewDto toInventoryView(InventoryItem item, InventoryContext context) {
        String normalizedCode = normalizeCode(item.getProductCode());
        BigDecimal unitCost = safeMoney(item.getPurchasePrice());
        BigDecimal sellingPrice = safeMoney(item.getSellingPrice());
        BigDecimal gstPercent = safeMoney(item.getGstPercentage());
        BigDecimal gstMultiplier = BigDecimal.ONE.add(gstPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal unitCostWithGst = unitCost.multiply(gstMultiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal sellingPriceWithGst = sellingPrice.multiply(gstMultiplier).setScale(2, RoundingMode.HALF_UP);
        int currentStock = safeInt(item.getQuantity());

        BigDecimal totalPurchaseExGst = BigDecimal.ZERO;
        BigDecimal totalPurchaseIncGst = BigDecimal.ZERO;
        int purchasedQty = 0;

        for (Purchase p : context.purchases()) {
            if (matchesInventoryItem(item, p.getProductCode(), p.getMaterialName(), p.getHsn())) {
                BigDecimal qty = BigDecimal.valueOf(safeInt(p.getQuantity()));
                BigDecimal price = safeMoney(p.getPurchasePrice());
                totalPurchaseExGst = totalPurchaseExGst.add(price.multiply(qty));
                totalPurchaseIncGst = totalPurchaseIncGst.add(safeMoney(p.getTotalAmount()));
                purchasedQty += safeInt(p.getQuantity());
            }
        }
        for (PurchaseItem pi : context.purchaseItems()) {
            if (matchesInventoryItem(item, pi.getProductCode(), pi.getMaterialName(), pi.getHsn())) {
                BigDecimal qty = BigDecimal.valueOf(safeInt(pi.getQuantity()));
                BigDecimal price = safeMoney(pi.getPurchasePrice());
                totalPurchaseExGst = totalPurchaseExGst.add(price.multiply(qty));
                totalPurchaseIncGst = totalPurchaseIncGst.add(safeMoney(pi.getTotalAmount()));
                purchasedQty += safeInt(pi.getQuantity());
            }
        }

        BigDecimal avgCostIncGst = purchasedQty > 0
            ? totalPurchaseIncGst.divide(BigDecimal.valueOf(purchasedQty), 4, RoundingMode.HALF_UP)
            : unitCostWithGst;

        int salesQty = countSalesQuantity(item, context);
        int salesReturnQty = countSalesReturnedQuantity(item, context);
        int netSoldQty = Math.max(0, salesQty - salesReturnQty);

        List<InventoryMovementDto> movements = buildMovements(item, context);
        MovementSummary movementSummary = summarizeMovements(movements, item, context);

        InventoryItemViewDto dto = new InventoryItemViewDto();
        dto.setId(item.getId());
        dto.setProductCode(item.getProductCode());
        dto.setProductName(item.getProductName());
        dto.setCategory(nullSafe(item.getCategory()));
        dto.setSubcategory(nullSafe(item.getSubcategory()));
        dto.setHsnCode(nullSafe(item.getHsnCode()));
        dto.setDescription(nullSafe(item.getDescription()));
        dto.setCurrentStock(currentStock);
        dto.setMinimumStock(safeInt(item.getMinimumStock()));
        dto.setMaximumStock(safeInt(item.getMaximumStock()));
        dto.setUnitCost(unitCost);
        dto.setSellingPrice(sellingPrice);
        dto.setTotalValue(avgCostIncGst.multiply(BigDecimal.valueOf(currentStock)).setScale(2, RoundingMode.HALF_UP));
        dto.setEstimatedSalesPrice(multiply(sellingPriceWithGst, currentStock));
        dto.setTotalPurchaseCost(totalPurchaseExGst.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalSalesRevenue(multiply(sellingPrice, netSoldQty));
        dto.setNetProfit(multiply(sellingPrice.subtract(unitCost), netSoldQty));
        dto.setBranch(movementSummary.branch());
        dto.setSupplier(firstNonBlank(movementSummary.supplier(), item.getSupplierName()));
        dto.setLastUpdated(formatDateTime(firstNonNull(movementSummary.lastUpdated(), item.getUpdatedAt())));
        dto.setStatus(getStockStatus(currentStock, safeInt(item.getMinimumStock()), safeInt(item.getMaximumStock())));
        dto.setLocation(buildLocation(movementSummary.branch()));
        dto.setExpiryDate(item.getExpiryDate());
        dto.setBatchNumber(firstNonBlank(movementSummary.batchNumber(), normalizedCode));
        dto.setMovements(movements);
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }

    private List<InventoryMovementDto> buildMovements(InventoryItem item, InventoryContext context) {
        List<InventoryMovementDto> movements = new ArrayList<>();

        for (Purchase purchase : context.purchases()) {
            if (!matchesInventoryItem(item, purchase.getProductCode(), purchase.getMaterialName(), purchase.getHsn())) {
                continue;
            }
            movements.add(createMovement(
                    "purchase-" + purchase.getId(),
                    purchase.getPurchaseDate(),
                    "Purchase",
                    safeInt(purchase.getQuantity()),
                    purchase.getPurchaseBillNo(),
                    purchase.getBranch(),
                    purchase.getPurchaseBillNo(),
                    null,
                    purchase.getSupplierName(),
                    purchase.getPurchasePrice(),
                    purchase.getTotalAmount(),
                    purchase.getRemarks()
            ));
        }

        for (PurchaseItem purchaseItem : context.purchaseItems()) {
            if (!matchesInventoryItem(item, purchaseItem.getProductCode(), purchaseItem.getMaterialName(), purchaseItem.getHsn())) {
                continue;
            }
            movements.add(createMovement(
                    "bulk-purchase-" + purchaseItem.getId(),
                    purchaseItem.getBulkPurchase().getPurchaseDate(),
                    "Purchase",
                    safeInt(purchaseItem.getQuantity()),
                    purchaseItem.getBulkPurchase().getPurchaseBillNo(),
                    purchaseItem.getBulkPurchase().getBranch(),
                    purchaseItem.getBulkPurchase().getPurchaseBillNo(),
                    null,
                    purchaseItem.getBulkPurchase().getSupplierName(),
                    purchaseItem.getPurchasePrice(),
                    purchaseItem.getTotalAmount(),
                    purchaseItem.getBulkPurchase().getRemarks()
            ));
        }

        for (PurchaseReturn purchaseReturn : context.purchaseReturns()) {
            if (!matchesInventoryItem(item, purchaseReturn.getProductCode(), purchaseReturn.getProductName(), purchaseReturn.getHsn())) {
                continue;
            }
            movements.add(createMovement(
                    "purchase-return-" + purchaseReturn.getId(),
                    purchaseReturn.getReturnDate(),
                    "Purchase Return",
                    -safeInt(purchaseReturn.getReturnQuantity()),
                    purchaseReturn.getReturnNumber(),
                    purchaseReturn.getBranchName(),
                    purchaseReturn.getOriginalPurchaseBillNo(),
                    null,
                    purchaseReturn.getSupplierName(),
                    purchaseReturn.getPurchasePrice(),
                    purchaseReturn.getTotalAmount(),
                    purchaseReturn.getReturnReason()
            ));
        }

        for (BillingRecord billingRecord : context.billingRecords()) {
            if (billingRecord.getProducts() == null) {
                continue;
            }
            for (BillingProduct product : billingRecord.getProducts()) {
                if (!matchesInventoryItem(item, product.getProductCode(), product.getProductName(), product.getHsnCode())) {
                    continue;
                }
                movements.add(createMovement(
                        "sale-" + billingRecord.getId() + "-" + product.getId(),
                        billingRecord.getBillDate(),
                        "Sale",
                        -safeInt(product.getQuantity()),
                        billingRecord.getBillNumber(),
                        billingRecord.getBranchName(),
                        billingRecord.getBillNumber(),
                        billingRecord.getCustomerName(),
                        null,
                        product.getPricePerUnit(),
                        product.getTotal(),
                        billingRecord.getAdditionalNotes()
                ));
            }
        }

        for (SalesReturn salesReturn : context.salesReturns()) {
            if (salesReturn.getItems() == null) {
                continue;
            }
            for (SalesReturnItem itemReturn : salesReturn.getItems()) {
                if (!matchesInventoryItem(item, itemReturn.getProductCode(), itemReturn.getProductName(), itemReturn.getHsnCode())) {
                    continue;
                }
                movements.add(createMovement(
                        "sales-return-" + salesReturn.getId() + "-" + itemReturn.getId(),
                        salesReturn.getReturnDate(),
                        "Sales Return",
                        safeInt(itemReturn.getReturnedQty()),
                        salesReturn.getReturnNumber(),
                        salesReturn.getBranchName(),
                        salesReturn.getBillNumber(),
                        salesReturn.getCustomerName(),
                        null,
                        itemReturn.getUnitPrice(),
                        itemReturn.getLineReturnAmount(),
                        itemReturn.getReturnReason()
                ));
            }
        }

        movements.sort(Comparator
                .comparing(InventoryMovementDto::getDate, Comparator.nullsLast(LocalDate::compareTo))
                .thenComparing(InventoryMovementDto::getReference, Comparator.nullsLast(String::compareTo))
                .thenComparing(InventoryMovementDto::getId, Comparator.nullsLast(String::compareTo)));

        int runningBalance = 0;
        for (InventoryMovementDto movement : movements) {
            runningBalance += safeInt(movement.getQuantity());
            movement.setBalance(runningBalance);
        }

        movements.sort(Comparator
                .comparing(InventoryMovementDto::getDate, Comparator.nullsLast(LocalDate::compareTo))
                .reversed()
                .thenComparing(InventoryMovementDto::getReference, Comparator.nullsLast(String::compareTo)));

        return movements;
    }

    private MovementSummary summarizeMovements(List<InventoryMovementDto> movements, InventoryItem item, InventoryContext context) {
        String branch = null;
        String supplier = item.getSupplierName();
        String batchNumber = item.getProductCode();
        LocalDateTime lastUpdated = item.getUpdatedAt();

        if (!movements.isEmpty()) {
            InventoryMovementDto latest = movements.get(0);
            branch = latest.getBranch();
            batchNumber = latest.getReference();
            if (latest.getDetails() != null && latest.getDetails().getSupplierName() != null) {
                supplier = latest.getDetails().getSupplierName();
            }
            if (latest.getDate() != null) {
                lastUpdated = latest.getDate().atStartOfDay();
            }
        } else {
            for (Purchase purchase : context.purchases()) {
                if (matchesInventoryItem(item, purchase.getProductCode(), purchase.getMaterialName(), purchase.getHsn())) {
                    branch = purchase.getBranch();
                    batchNumber = purchase.getPurchaseBillNo();
                    lastUpdated = purchase.getPurchaseDate() != null ? purchase.getPurchaseDate().atStartOfDay() : lastUpdated;
                    break;
                }
            }
        }

        return new MovementSummary(firstNonBlank(branch, "Unassigned"), supplier, batchNumber, lastUpdated);
    }

    private int countPurchaseReturnedQuantity(InventoryItem item, InventoryContext context) {
        int total = 0;
        for (PurchaseReturn purchaseReturn : context.purchaseReturns()) {
            if (matchesInventoryItem(item, purchaseReturn.getProductCode(), purchaseReturn.getProductName(), purchaseReturn.getHsn())) {
                total += safeInt(purchaseReturn.getReturnQuantity());
            }
        }
        return total;
    }

    private int countSalesQuantity(InventoryItem item, InventoryContext context) {
        int total = 0;
        for (BillingRecord billingRecord : context.billingRecords()) {
            if (billingRecord.getProducts() == null) {
                continue;
            }
            for (BillingProduct product : billingRecord.getProducts()) {
                if (matchesInventoryItem(item, product.getProductCode(), product.getProductName(), product.getHsnCode())) {
                    total += safeInt(product.getQuantity());
                }
            }
        }
        return total;
    }

    private int countSalesReturnedQuantity(InventoryItem item, InventoryContext context) {
        int total = 0;
        for (SalesReturn salesReturn : context.salesReturns()) {
            if (salesReturn.getItems() == null) {
                continue;
            }
            for (SalesReturnItem returnItem : salesReturn.getItems()) {
                if (matchesInventoryItem(item, returnItem.getProductCode(), returnItem.getProductName(), returnItem.getHsnCode())) {
                    total += safeInt(returnItem.getReturnedQty());
                }
            }
        }
        return total;
    }

    private InventoryMovementDto createMovement(
            String id,
            LocalDate date,
            String type,
            Integer quantity,
            String reference,
            String branch,
            String billNumber,
            String customerName,
            String supplierName,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            String remarks
    ) {
        InventoryMovementDto movement = new InventoryMovementDto();
        movement.setId(id);
        movement.setDate(date);
        movement.setType(type);
        movement.setQuantity(quantity);
        movement.setReference(reference);
        movement.setBranch(branch);

        InventoryMovementDto.Details details = new InventoryMovementDto.Details();
        details.setBillNumber(billNumber);
        details.setCustomerName(customerName);
        details.setSupplierName(supplierName);
        details.setUnitPrice(unitPrice);
        details.setTotalAmount(totalAmount);
        details.setRemarks(remarks);
        movement.setDetails(details);

        return movement;
    }

    private boolean matchesInventoryItem(InventoryItem item, String productCode, String productName, String hsnCode) {
        String normalizedInventoryCode = normalizeCode(item.getProductCode());
        String normalizedProductCode = normalizeCode(productCode);
        if (!normalizedInventoryCode.isBlank() && normalizedInventoryCode.equals(normalizedProductCode)) {
            return true;
        }

        if (normalizedProductCode.isBlank()) {
            String normalizedInventoryName = normalizeText(item.getProductName());
            String normalizedProductName = normalizeText(productName);
            String normalizedInventoryHsn = normalizeText(item.getHsnCode());
            String normalizedHsn = normalizeText(hsnCode);
            return !normalizedInventoryName.isBlank()
                    && normalizedInventoryName.equals(normalizedProductName)
                    && (normalizedInventoryHsn.isBlank() || normalizedHsn.isBlank() || normalizedInventoryHsn.equals(normalizedHsn));
        }

        return false;
    }

    private BigDecimal multiply(BigDecimal amount, int quantity) {
        return safeMoney(amount).multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value != null ? value.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private String normalizeCode(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private String firstNonBlank(String first, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return fallback == null ? "" : fallback;
    }

    private <T> T firstNonNull(T first, T fallback) {
        return first != null ? first : fallback;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    private String buildLocation(String branch) {
        if (branch == null || branch.isBlank() || "Unassigned".equalsIgnoreCase(branch)) {
            return "Main Inventory";
        }
        return branch + " Store";
    }

    private String getStockStatus(int currentStock, int minimumStock, int maximumStock) {
        if (currentStock <= 0) {
            return "Out of Stock";
        }
        if (minimumStock > 0 && currentStock <= minimumStock) {
            return "Low Stock";
        }
        if (maximumStock > 0 && currentStock >= maximumStock) {
            return "Overstocked";
        }
        return "In Stock";
    }

    public record CleanupResult(List<String> removed, String message) {
    }

    private record InventoryContext(
            List<Purchase> purchases,
            List<PurchaseItem> purchaseItems,
            List<BillingRecord> billingRecords,
            List<PurchaseReturn> purchaseReturns,
            List<SalesReturn> salesReturns
    ) {
    }

    private record MovementSummary(String branch, String supplier, String batchNumber, LocalDateTime lastUpdated) {
    }
}
