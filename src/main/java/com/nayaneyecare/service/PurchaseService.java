package com.nayaneyecare.service;

import com.nayaneyecare.dto.PurchaseRequest;
import com.nayaneyecare.dto.PurchaseResponse;
import com.nayaneyecare.entity.Purchase;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.repository.PurchaseRepository;
import com.nayaneyecare.repository.InventoryItemRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    /**
     * Create a new purchase record (transactional - rolls back if inventory sync fails)
     * Automatically assigns the current supplier's unique key.
     */
    @Transactional
    public PurchaseResponse createPurchase(PurchaseRequest request) {
        System.out.println("Creating purchase with request: " + request);

        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        // Check if purchase bill number already exists for this supplier
        if (!SecurityUtils.isAdmin() && purchaseRepository.existsByPurchaseBillNoAndUniqueKey(request.getPurchaseBillNo(), uniqueKey)) {
            throw new RuntimeException("Purchase bill number already exists: " + request.getPurchaseBillNo());
        }

        // Convert category string to enum
        Purchase.ProductCategory category;
        try {
            String categoryStr = request.getCategory();
            System.out.println("Processing category: " + categoryStr);
            String mappedCategory;

            switch (categoryStr) {
                case "Spectacles":
                    mappedCategory = "SPECTACLES";
                    break;
                case "Frame":
                    mappedCategory = "FRAMES";
                    break;
                case "Contact Lens":
                    mappedCategory = "CONTACT_LENSES";
                    break;
                case "Sunglasses":
                    mappedCategory = "SUNGLASSES";
                    break;
                case "Lens":
                    mappedCategory = "LENS";
                    break;
                case "Solution":
                    mappedCategory = "SOLUTIONS";
                    break;
                case "Other":
                    mappedCategory = "OTHER";
                    break;
                case "Non-Chargeable":
                    mappedCategory = "NON_CHARGEABLE";
                    break;
                default:
                    try {
                        mappedCategory = categoryStr.toUpperCase();
                        Purchase.ProductCategory.valueOf(mappedCategory);
                    } catch (IllegalArgumentException e) {
                        mappedCategory = "SPECTACLES";
                    }
                    break;
            }

            System.out.println("Mapped category: " + mappedCategory);
            category = Purchase.ProductCategory.valueOf(mappedCategory);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + request.getCategory() + ". Supported categories: Spectacles, Frame, Contact Lens, Sunglasses, Lens, Solution, Other, Non-Chargeable");
        }

        System.out.println("Creating purchase entity with category: " + category);

        // Create purchase entity
        Purchase purchase = new Purchase(
            request.getPurchaseBillNo(),
            request.getPurchaseDate(),
            request.getBranch(),
            request.getMaterialName(),
            request.getProductCode(),
            request.getProductDescription(),
            category,
            request.getSubcategory(),
            request.getHsn(),
            request.getQuantity(),
            request.getPurchasePrice(),
            request.getInputGSTPercent(),
            request.getInputGSTAmount(),
            request.getTotalAmount(),
            request.getSupplierName(),
            request.getSupplierAddress(),
            request.getSupplierGstin(),
            request.getRemarks()
        );

        // Set unique key for row-level isolation
        purchase.setUniqueKey(uniqueKey);

        // Set conditional fields
        purchase.setColor(request.getColor());
        purchase.setSize(request.getSize());
        purchase.setType(request.getType());
        purchase.setGender(request.getGender());
        purchase.setShape(request.getShape());
        purchase.setMaterial(request.getMaterial());
        purchase.setTempleDetails(request.getTempleDetails());
        purchase.setBridgeSize(request.getBridgeSize());
        purchase.setLensDetail(request.getLensDetail());
        purchase.setLensCoating(request.getLensCoating());
        purchase.setDesign(request.getDesign());
        purchase.setLensIndex(request.getLensIndex());
        purchase.setLensNumber(request.getLensNumber());
        purchase.setLensAddition(request.getLensAddition());
        purchase.setLensAxis(request.getLensAxis());
        purchase.setLensNumberRange(request.getLensNumberRange());
        purchase.setLensProductName(request.getLensProductName());
        purchase.setCt(request.getCt());
        purchase.setBaseCurve(request.getBaseCurve());
        purchase.setDiameter(request.getDiameter());
        purchase.setModality(request.getModality());
        purchase.setValidity(request.getValidity());
        purchase.setWaterContent(request.getWaterContent());
        purchase.setDkt(request.getDkt());
        purchase.setSolutionName(request.getSolutionName());
        purchase.setVariant(request.getVariant());
        purchase.setPackingType(request.getPackingType());
        purchase.setName(request.getName());

        System.out.println("Purchase entity created: " + purchase);

        Purchase savedPurchase = purchaseRepository.save(purchase);
        System.out.println("Purchase saved successfully with ID: " + savedPurchase.getId());

        // Update or create inventory item
        updateInventoryFromPurchase(request);

        return new PurchaseResponse(savedPurchase);
    }

    /**
     * Update inventory from purchase data
     */
    private void updateInventoryFromPurchase(PurchaseRequest request) {
        try {
            System.out.println("Updating inventory from purchase: " + request.getProductCode());

            String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
            Optional<InventoryItem> existingItemOpt = SecurityUtils.isAdmin() 
                ? inventoryItemRepository.findByProductCodeAndUniqueKey(request.getProductCode(), "GLOBAL_ADMIN") // Admin creates global inventory
                : inventoryItemRepository.findByProductCodeAndUniqueKey(request.getProductCode(), uniqueKey);

            if (existingItemOpt.isPresent()) {
                // Update existing inventory item
                InventoryItem existingItem = existingItemOpt.get();
                Integer currentQuantity = existingItem.getQuantity() != null ? existingItem.getQuantity() : 0;
                Integer newQuantity = currentQuantity + request.getQuantity();
                existingItem.setQuantity(newQuantity);

                // Update purchase date if this is a newer purchase
                if (request.getPurchaseDate() != null &&
                    (existingItem.getPurchaseDate() == null ||
                     request.getPurchaseDate().isAfter(existingItem.getPurchaseDate()))) {
                    existingItem.setPurchaseDate(request.getPurchaseDate());
                }

                inventoryItemRepository.save(existingItem);
                System.out.println("Updated existing inventory item. New quantity: " + newQuantity);
            } else {
                // Create new inventory item
                InventoryItem newItem = new InventoryItem();
                newItem.setProductCode(request.getProductCode());
                newItem.setProductName(request.getMaterialName());
                newItem.setCategory(request.getCategory());
                newItem.setSubcategory(request.getSubcategory());
                newItem.setDescription(request.getProductDescription());
                newItem.setHsnCode(request.getHsn());
                newItem.setQuantity(request.getQuantity());
                newItem.setPurchasePrice(request.getPurchasePrice());

                // Calculate selling price (e.g., 30% markup on purchase price + GST)
                BigDecimal markup = new BigDecimal("1.30");
                BigDecimal sellingPrice = request.getPurchasePrice().multiply(markup);
                newItem.setSellingPrice(sellingPrice);

                newItem.setGstPercentage(request.getInputGSTPercent());
                newItem.setSupplierName(request.getSupplierName());
                newItem.setSupplierAddress(request.getSupplierAddress());
                newItem.setSupplierGstin(request.getSupplierGstin());
                newItem.setPurchaseDate(request.getPurchaseDate());

                // Set default stock levels
                newItem.setMinimumStock(5);
                newItem.setMaximumStock(request.getQuantity() * 2);
                newItem.setReorderPoint(10);

                // Set unique key for row-level isolation
                newItem.setUniqueKey(uniqueKey);

                inventoryItemRepository.save(newItem);
                System.out.println("Created new inventory item with quantity: " + request.getQuantity());
            }
        } catch (Exception e) {
            System.err.println("Error updating inventory from purchase: " + e.getMessage());
            e.printStackTrace();
            // Rethrow so the parent @Transactional rolls back the purchase
            throw new RuntimeException("Inventory sync failed for product " + request.getProductCode() + ": " + e.getMessage(), e);
        }
    }

    /**
     * Get all purchase records for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<PurchaseResponse> getAllPurchases() {
        if (SecurityUtils.isAdmin()) {
            return purchaseRepository.queryAllGlobal().stream().map(PurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<Purchase> purchases = purchaseRepository.findAllByUniqueKey(uniqueKey);
        return purchases.stream()
                .map(PurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get purchase by ID for the current supplier.
     */
    public Optional<PurchaseResponse> getPurchaseById(Long id) {
        if (SecurityUtils.isAdmin()) return purchaseRepository.findById(id).map(PurchaseResponse::new);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<Purchase> purchase = purchaseRepository.findById(id)
                .filter(p -> uniqueKey.equals(p.getUniqueKey()));
        return purchase.map(PurchaseResponse::new);
    }

    /**
     * Get purchase by purchase bill number for the current supplier.
     */
    public Optional<PurchaseResponse> getPurchaseByBillNo(String purchaseBillNo) {
        if (SecurityUtils.isAdmin()) return purchaseRepository.findByPurchaseBillNo(purchaseBillNo).map(PurchaseResponse::new);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<Purchase> purchase = purchaseRepository.findByPurchaseBillNoAndUniqueKey(purchaseBillNo, uniqueKey);
        return purchase.map(PurchaseResponse::new);
    }

    /**
     * Update purchase record and reconcile inventory.
     * Enforces data isolation by ensuring the purchase belongs to the current supplier.
     */
    @Transactional
    public PurchaseResponse updatePurchase(Long id, PurchaseRequest request) {
        System.out.println("Updating purchase with ID: " + id);
        System.out.println("Request object: " + request);

        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        Optional<Purchase> existingPurchase = purchaseRepository.findById(id);
        if (existingPurchase.isEmpty()) {
            throw new RuntimeException("Purchase not found with ID: " + id);
        }

        Purchase purchase = existingPurchase.get();

        // Enforce data isolation - ensure purchase belongs to current supplier
        if (!SecurityUtils.isAdmin() && !uniqueKey.equals(purchase.getUniqueKey())) {
            throw new RuntimeException("Purchase not found with ID: " + id);
        }

        System.out.println("Found existing purchase: " + purchase.getPurchaseBillNo());

        // Reconcile inventory: reverse old purchase qty, then new purchase qty will be added via updateInventoryFromPurchase
        reconcileInventoryForUpdate(purchase, request);

        // Check if purchase bill number is being changed and if it already exists
        if (!SecurityUtils.isAdmin() && !purchase.getPurchaseBillNo().equals(request.getPurchaseBillNo()) &&
            purchaseRepository.existsByPurchaseBillNoAndUniqueKey(request.getPurchaseBillNo(), uniqueKey)) {
            throw new RuntimeException("Purchase bill number already exists: " + request.getPurchaseBillNo());
        }

        // Convert category string to enum
        Purchase.ProductCategory category;
        try {
            String categoryStr = request.getCategory();
            String mappedCategory;

            switch (categoryStr) {
                case "Spectacles":
                    mappedCategory = "SPECTACLES";
                    break;
                case "Frame":
                    mappedCategory = "FRAMES";
                    break;
                case "Contact Lens":
                    mappedCategory = "CONTACT_LENSES";
                    break;
                case "Sunglasses":
                    mappedCategory = "SUNGLASSES";
                    break;
                case "Lens":
                    mappedCategory = "LENS";
                    break;
                case "Solution":
                    mappedCategory = "SOLUTIONS";
                    break;
                case "Other":
                    mappedCategory = "OTHER";
                    break;
                case "Non-Chargeable":
                    mappedCategory = "NON_CHARGEABLE";
                    break;
                default:
                    try {
                        mappedCategory = categoryStr.toUpperCase();
                        Purchase.ProductCategory.valueOf(mappedCategory);
                    } catch (IllegalArgumentException e) {
                        mappedCategory = "SPECTACLES";
                    }
                    break;
            }

            category = Purchase.ProductCategory.valueOf(mappedCategory);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + request.getCategory());
        }

        // Validate and recalculate amounts
        BigDecimal quantity = BigDecimal.valueOf(request.getQuantity());
        BigDecimal purchasePrice = request.getPurchasePrice();
        BigDecimal inputGSTPercent = request.getInputGSTPercent();

        boolean isNonChargeable = Purchase.ProductCategory.NON_CHARGEABLE.equals(category) || "Non-Chargeable".equals(request.getCategory());

        if (!isNonChargeable && quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Quantity must be greater than 0");
        }
        if (!isNonChargeable && purchasePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Purchase price must be greater than 0");
        }

        BigDecimal calculatedGSTAmount = purchasePrice.multiply(quantity).multiply(inputGSTPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal calculatedTotalAmount = purchasePrice.multiply(quantity).add(calculatedGSTAmount);

        // Update fields
        purchase.setPurchaseBillNo(request.getPurchaseBillNo());
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setBranch(request.getBranch());
        purchase.setMaterialName(request.getMaterialName());
        purchase.setProductCode(request.getProductCode());
        purchase.setProductDescription(request.getProductDescription());
        purchase.setCategory(category);
        purchase.setSubcategory(request.getSubcategory());
        purchase.setHsn(request.getHsn());
        purchase.setQuantity(request.getQuantity());
        purchase.setPurchasePrice(purchasePrice);
        purchase.setInputGSTPercent(inputGSTPercent);
        purchase.setInputGSTAmount(calculatedGSTAmount);
        purchase.setTotalAmount(calculatedTotalAmount);
        purchase.setSupplierName(request.getSupplierName());
        purchase.setSupplierAddress(request.getSupplierAddress());
        purchase.setSupplierGstin(request.getSupplierGstin());
        purchase.setRemarks(request.getRemarks());

        // Set conditional fields
        purchase.setColor(request.getColor());
        purchase.setSize(request.getSize());
        purchase.setType(request.getType());
        purchase.setGender(request.getGender());
        purchase.setShape(request.getShape());
        purchase.setMaterial(request.getMaterial());
        purchase.setTempleDetails(request.getTempleDetails());
        purchase.setBridgeSize(request.getBridgeSize());
        purchase.setLensDetail(request.getLensDetail());
        purchase.setLensCoating(request.getLensCoating());
        purchase.setDesign(request.getDesign());
        purchase.setLensIndex(request.getLensIndex());
        purchase.setLensNumber(request.getLensNumber());
        purchase.setLensAddition(request.getLensAddition());
        purchase.setLensAxis(request.getLensAxis());
        purchase.setLensNumberRange(request.getLensNumberRange());
        purchase.setLensProductName(request.getLensProductName());
        purchase.setCt(request.getCt());
        purchase.setBaseCurve(request.getBaseCurve());
        purchase.setDiameter(request.getDiameter());
        purchase.setModality(request.getModality());
        purchase.setValidity(request.getValidity());
        purchase.setWaterContent(request.getWaterContent());
        purchase.setDkt(request.getDkt());
        purchase.setSolutionName(request.getSolutionName());
        purchase.setVariant(request.getVariant());
        purchase.setPackingType(request.getPackingType());
        purchase.setName(request.getName());

        Purchase updatedPurchase = purchaseRepository.save(purchase);

        // Update inventory with new values
        updateInventoryFromPurchase(request);

        return new PurchaseResponse(updatedPurchase);
    }

    /**
     * Reconcile inventory when a purchase is updated.
     */
    private void reconcileInventoryForUpdate(Purchase oldPurchase, PurchaseRequest newRequest) {
        try {
            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            if (oldPurchase.getQuantity() != null && oldPurchase.getQuantity() > 0) {
                inventoryItemRepository.findByProductCodeAndUniqueKey(oldPurchase.getProductCode(), uniqueKey)
                    .ifPresent(inventoryItem -> {
                        Integer currentQty = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
                        inventoryItem.setQuantity(Math.max(0, currentQty - oldPurchase.getQuantity()));
                        inventoryItemRepository.save(inventoryItem);
                    });
            }
        } catch (Exception e) {
            System.err.println("Error reconciling inventory for purchase update: " + e.getMessage());
        }
    }

    /**
     * Delete purchase record and reverse inventory.
     * Enforces data isolation by ensuring the purchase belongs to the current supplier.
     */
    @Transactional
    public void deletePurchase(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Purchase purchase = purchaseRepository.findById(id)
            .filter(p -> SecurityUtils.isAdmin() || uniqueKey.equals(p.getUniqueKey()))
            .orElseThrow(() -> new RuntimeException("Purchase not found with ID: " + id));

        // Reverse inventory
        if (purchase.getQuantity() != null && purchase.getQuantity() > 0) {
            inventoryItemRepository.findByProductCodeAndUniqueKey(purchase.getProductCode(), purchase.getUniqueKey())
                .ifPresent(inventoryItem -> {
                    Integer currentQty = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
                    inventoryItem.setQuantity(Math.max(0, currentQty - purchase.getQuantity()));
                    inventoryItemRepository.save(inventoryItem);
                });
        }

        purchaseRepository.deleteById(id);
    }

    /**
     * Search purchases with filters for the current supplier.
     */
    public List<PurchaseResponse> searchPurchases(
            LocalDate dateFrom, LocalDate dateTo, String productName, String hsn,
            String supplierName, String purchaseBillNo, String productCode,
            String branchName, String importRef) {

        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        List<Purchase> purchases = purchaseRepository.findWithFilters(
            dateFrom, dateTo, productName, hsn, supplierName, purchaseBillNo,
            productCode, branchName, importRef, uniqueKey
        );

        return purchases.stream()
                .map(PurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get purchases by date range for the current supplier.
     */
    public List<PurchaseResponse> getPurchasesByDateRange(LocalDate startDate, LocalDate endDate) {
        if (SecurityUtils.isAdmin()) {
            return purchaseRepository.queryAllGlobal().stream()
                .filter(p -> p.getPurchaseDate() != null && !p.getPurchaseDate().isBefore(startDate) && !p.getPurchaseDate().isAfter(endDate))
                .map(PurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<Purchase> purchases = purchaseRepository.findByPurchaseDateBetweenAndUniqueKey(startDate, endDate, uniqueKey);
        return purchases.stream()
                .map(PurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get purchases by category for the current supplier.
     */
    public List<PurchaseResponse> getPurchasesByCategory(String category) {
        try {
            Purchase.ProductCategory productCategory = Purchase.ProductCategory.valueOf(category.toUpperCase());
            if (SecurityUtils.isAdmin()) {
                return purchaseRepository.queryAllGlobal().stream()
                    .filter(p -> productCategory.equals(p.getCategory()))
                    .map(PurchaseResponse::new).collect(Collectors.toList());
            }
            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            List<Purchase> purchases = purchaseRepository.findByCategoryAndUniqueKey(productCategory, uniqueKey);
            return purchases.stream()
                    .map(PurchaseResponse::new)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + category);
        }
    }

    /**
     * Get purchases by supplier for the current supplier.
     */
    public List<PurchaseResponse> getPurchasesBySupplier(String supplierName) {
        if (SecurityUtils.isAdmin()) {
            return purchaseRepository.queryAllGlobal().stream()
                .filter(p -> p.getSupplierName() != null && p.getSupplierName().toLowerCase().contains(supplierName.toLowerCase()))
                .map(PurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<Purchase> purchases = purchaseRepository.findBySupplierNameContainingIgnoreCaseAndUniqueKey(supplierName, uniqueKey);
        return purchases.stream()
                .map(PurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get purchases by branch for the current supplier.
     */
    public List<PurchaseResponse> getPurchasesByBranch(String branch) {
        if (SecurityUtils.isAdmin()) {
            return purchaseRepository.queryAllGlobal().stream()
                .filter(p -> branch.equals(p.getBranch()))
                .map(PurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<Purchase> purchases = purchaseRepository.findByBranchAndUniqueKey(branch, uniqueKey);
        return purchases.stream()
                .map(PurchaseResponse::new)
                .collect(Collectors.toList());
    }
}