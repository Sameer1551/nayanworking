package com.nayaneyecare.service;

import com.nayaneyecare.dto.BulkPurchaseRequest;
import com.nayaneyecare.dto.BulkPurchaseResponse;
import com.nayaneyecare.dto.PurchaseItemRequest;
import com.nayaneyecare.entity.BulkPurchase;
import com.nayaneyecare.entity.PurchaseItem;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.repository.BulkPurchaseRepository;
import com.nayaneyecare.repository.InventoryItemRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BulkPurchaseService {

    @Autowired
    private BulkPurchaseRepository bulkPurchaseRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    /**
     * Create a new bulk purchase with multiple items.
     * Automatically assigns the current supplier's unique key.
     */
    @Transactional
    public BulkPurchaseResponse createBulkPurchase(BulkPurchaseRequest request) {
        System.out.println("Creating bulk purchase with request: " + request);

        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        // Check if purchase bill number already exists for this supplier
        if (!SecurityUtils.isAdmin() && bulkPurchaseRepository.existsByPurchaseBillNoAndUniqueKey(request.getPurchaseBillNo(), uniqueKey)) {
            throw new RuntimeException("Purchase bill number already exists: " + request.getPurchaseBillNo());
        }

        // Validate that there's at least one purchase item
        if (request.getPurchaseItems() == null || request.getPurchaseItems().isEmpty()) {
            throw new RuntimeException("At least one purchase item is required");
        }

        // Validate item values
        for (PurchaseItemRequest item : request.getPurchaseItems()) {
            boolean isNonChargeable = "NON_CHARGEABLE".equals(item.getCategory()) || "Non-Chargeable".equals(item.getCategory());

            if (!isNonChargeable) {
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    throw new RuntimeException("Quantity must be greater than 0 for category: " + item.getCategory());
                }
                if (item.getPurchasePrice() == null || item.getPurchasePrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new RuntimeException("Purchase price must be greater than 0 for category: " + item.getCategory());
                }
                if (item.getTotalAmount() == null || item.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new RuntimeException("Total amount must be greater than 0 for category: " + item.getCategory());
                }
            }
        }

        // Calculate total amounts
        BigDecimal totalBillAmount = BigDecimal.ZERO;
        BigDecimal totalGstAmount = BigDecimal.ZERO;

        for (PurchaseItemRequest item : request.getPurchaseItems()) {
            BigDecimal itemTotal = item.getTotalAmount();
            BigDecimal itemGst = item.getInputGSTAmount();

            if (itemTotal != null) {
                totalBillAmount = totalBillAmount.add(itemTotal);
            }
            if (itemGst != null) {
                totalGstAmount = totalGstAmount.add(itemGst);
            }
        }

        // Create bulk purchase entity
        BulkPurchase bulkPurchase = new BulkPurchase(
            request.getPurchaseBillNo(),
            request.getPurchaseDate(),
            request.getBranch(),
            request.getSupplierName(),
            request.getSupplierAddress(),
            request.getSupplierGstin(),
            request.getRemarks(),
            totalBillAmount,
            totalGstAmount
        );

        // Set unique key for row-level isolation
        bulkPurchase.setUniqueKey(uniqueKey);

        // Create purchase items
        List<PurchaseItem> purchaseItems = request.getPurchaseItems().stream()
                .map(item -> createPurchaseItem(item, bulkPurchase, uniqueKey))
                .collect(Collectors.toList());

        bulkPurchase.setPurchaseItems(purchaseItems);

        // Save the bulk purchase (cascade will save the items)
        BulkPurchase savedBulkPurchase = bulkPurchaseRepository.save(bulkPurchase);
        System.out.println("Bulk purchase saved successfully with ID: " + savedBulkPurchase.getId());

        // Update inventory for all purchase items
        updateInventoryFromBulkPurchase(request, uniqueKey);

        return new BulkPurchaseResponse(savedBulkPurchase);
    }

    /**
     * Update inventory from bulk purchase items.
     */
    private void updateInventoryFromBulkPurchase(BulkPurchaseRequest request, String uniqueKey) {
        System.out.println("Updating inventory from bulk purchase items...");

        for (PurchaseItemRequest itemRequest : request.getPurchaseItems()) {
            updateInventoryFromPurchaseItem(itemRequest, request, uniqueKey);
        }

        System.out.println("Inventory updated successfully for bulk purchase");
    }

    /**
     * Update inventory from a single purchase item.
     */
    private void updateInventoryFromPurchaseItem(PurchaseItemRequest itemRequest, BulkPurchaseRequest bulkRequest, String uniqueKey) {
        try {
            String productCode = itemRequest.getProductCode();
            System.out.println("Updating inventory for product: " + productCode);

            Optional<InventoryItem> existingItemOpt = SecurityUtils.isAdmin()
                ? inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, "GLOBAL_ADMIN")
                : inventoryItemRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);

            if (existingItemOpt.isPresent()) {
                // Update existing inventory item
                InventoryItem existingItem = existingItemOpt.get();
                Integer currentQuantity = existingItem.getQuantity() != null ? existingItem.getQuantity() : 0;
                Integer newQuantity = currentQuantity + itemRequest.getQuantity();
                existingItem.setQuantity(newQuantity);

                // Update purchase date if this is a newer purchase
                if (bulkRequest.getPurchaseDate() != null &&
                    (existingItem.getPurchaseDate() == null ||
                     bulkRequest.getPurchaseDate().isAfter(existingItem.getPurchaseDate()))) {
                    existingItem.setPurchaseDate(bulkRequest.getPurchaseDate());
                }

                inventoryItemRepository.save(existingItem);
                System.out.println("Updated existing inventory item. New quantity: " + newQuantity);
            } else {
                // Create new inventory item
                InventoryItem newItem = new InventoryItem();
                newItem.setProductCode(productCode);
                newItem.setProductName(itemRequest.getMaterialName());

                String categoryStr = mapCategoryToString(itemRequest.getCategory());
                newItem.setCategory(categoryStr);
                newItem.setSubcategory(itemRequest.getSubcategory());
                newItem.setDescription(itemRequest.getProductDescription());
                newItem.setHsnCode(itemRequest.getHsn());
                newItem.setQuantity(itemRequest.getQuantity());
                newItem.setPurchasePrice(itemRequest.getPurchasePrice());

                BigDecimal markup = new BigDecimal("1.30");
                BigDecimal sellingPrice = itemRequest.getPurchasePrice().multiply(markup);
                newItem.setSellingPrice(sellingPrice);

                newItem.setGstPercentage(itemRequest.getInputGSTPercent());
                newItem.setSupplierName(bulkRequest.getSupplierName());
                newItem.setSupplierAddress(bulkRequest.getSupplierAddress());
                newItem.setSupplierGstin(bulkRequest.getSupplierGstin());
                newItem.setPurchaseDate(bulkRequest.getPurchaseDate());

                newItem.setMinimumStock(5);
                newItem.setMaximumStock(itemRequest.getQuantity() * 2);
                newItem.setReorderPoint(10);

                // Set unique key for row-level isolation
                newItem.setUniqueKey(uniqueKey);

                inventoryItemRepository.save(newItem);
                System.out.println("Created new inventory item with quantity: " + itemRequest.getQuantity());
            }
        } catch (Exception e) {
            System.err.println("Error updating inventory for product " + itemRequest.getProductCode() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Inventory sync failed for product " + itemRequest.getProductCode() + ": " + e.getMessage(), e);
        }
    }

    /**
     * Map category enum to string for inventory.
     */
    private String mapCategoryToString(String category) {
        if (category == null) return "Other";

        switch (category.toUpperCase()) {
            case "SPECTACLES":
                return "Spectacles";
            case "FRAMES":
                return "Frame";
            case "CONTACT_LENSES":
                return "Contact Lens";
            case "SUNGLASSES":
                return "Sunglasses";
            case "LENS":
                return "Lens";
            case "SOLUTIONS":
                return "Solution";
            case "OTHER":
                return "Other";
            case "NON_CHARGEABLE":
                return "Non-Chargeable";
            default:
                return category;
        }
    }

    /**
     * Create a purchase item entity from request.
     */
    private PurchaseItem createPurchaseItem(PurchaseItemRequest itemRequest, BulkPurchase bulkPurchase, String uniqueKey) {
        PurchaseItem.ProductCategory category;
        try {
            String categoryStr = itemRequest.getCategory();
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
                        PurchaseItem.ProductCategory.valueOf(mappedCategory);
                    } catch (IllegalArgumentException e) {
                        mappedCategory = "SPECTACLES";
                    }
                    break;
            }

            category = PurchaseItem.ProductCategory.valueOf(mappedCategory);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + itemRequest.getCategory());
        }

        PurchaseItem purchaseItem = new PurchaseItem(
            bulkPurchase,
            itemRequest.getMaterialName(),
            itemRequest.getProductCode(),
            itemRequest.getProductDescription(),
            category,
            itemRequest.getSubcategory(),
            itemRequest.getHsn(),
            itemRequest.getQuantity(),
            itemRequest.getPurchasePrice(),
            itemRequest.getInputGSTPercent(),
            itemRequest.getInputGSTAmount(),
            itemRequest.getTotalAmount()
        );

        // Set unique key for row-level isolation
        purchaseItem.setUniqueKey(uniqueKey);

        // Set conditional fields based on category
        switch (category) {
            case SPECTACLES:
            case FRAMES:
            case SUNGLASSES:
                purchaseItem.setColor(itemRequest.getColor());
                purchaseItem.setSize(itemRequest.getSize());
                purchaseItem.setType(itemRequest.getType());
                purchaseItem.setGender(itemRequest.getGender());
                purchaseItem.setShape(itemRequest.getShape());
                purchaseItem.setMaterial(itemRequest.getMaterial());
                purchaseItem.setTempleDetails(itemRequest.getTempleDetails());
                purchaseItem.setBridgeSize(itemRequest.getBridgeSize());
                break;
            case LENS:
                purchaseItem.setLensDetail(itemRequest.getLensDetail());
                purchaseItem.setLensCoating(itemRequest.getLensCoating());
                purchaseItem.setDesign(itemRequest.getDesign());
                purchaseItem.setLensIndex(itemRequest.getLensIndex());
                purchaseItem.setLensNumber(itemRequest.getLensNumber());
                purchaseItem.setLensAddition(itemRequest.getLensAddition());
                purchaseItem.setLensAxis(itemRequest.getLensAxis());
                purchaseItem.setLensNumberRange(itemRequest.getLensNumberRange());
                break;
            case CONTACT_LENSES:
                purchaseItem.setLensProductName(itemRequest.getLensProductName());
                purchaseItem.setCt(itemRequest.getCt());
                purchaseItem.setBaseCurve(itemRequest.getBaseCurve());
                purchaseItem.setDiameter(itemRequest.getDiameter());
                purchaseItem.setModality(itemRequest.getModality());
                purchaseItem.setValidity(itemRequest.getValidity());
                purchaseItem.setWaterContent(itemRequest.getWaterContent());
                purchaseItem.setDkt(itemRequest.getDkt());
                break;
            case SOLUTIONS:
                purchaseItem.setSolutionName(itemRequest.getSolutionName());
                purchaseItem.setVariant(itemRequest.getVariant());
                purchaseItem.setPackingType(itemRequest.getPackingType());
                break;
            case OTHER:
            case NON_CHARGEABLE:
                purchaseItem.setName(itemRequest.getName());
                break;
        }

        return purchaseItem;
    }

    /**
     * Get all bulk purchases for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<BulkPurchaseResponse> getAllBulkPurchases() {
        if (SecurityUtils.isAdmin()) {
            return bulkPurchaseRepository.findAll().stream().map(BulkPurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findAllByUniqueKey(uniqueKey);
        return bulkPurchases.stream()
                .map(BulkPurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get bulk purchase by ID for the current supplier.
     */
    public Optional<BulkPurchaseResponse> getBulkPurchaseById(@org.springframework.lang.NonNull Long id) {
        if (SecurityUtils.isAdmin()) return bulkPurchaseRepository.findById(id).map(BulkPurchaseResponse::new);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<BulkPurchase> bulkPurchase = bulkPurchaseRepository.findById(id)
                .filter(bp -> uniqueKey.equals(bp.getUniqueKey()));
        return bulkPurchase.map(BulkPurchaseResponse::new);
    }

    /**
     * Get bulk purchase by purchase bill number for the current supplier.
     */
    public Optional<BulkPurchaseResponse> getBulkPurchaseByBillNo(String purchaseBillNo) {
        if (SecurityUtils.isAdmin()) return bulkPurchaseRepository.findByPurchaseBillNo(purchaseBillNo).map(BulkPurchaseResponse::new);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<BulkPurchase> bulkPurchase = bulkPurchaseRepository.findByPurchaseBillNoAndUniqueKey(purchaseBillNo, uniqueKey);
        return bulkPurchase.map(BulkPurchaseResponse::new);
    }

    /**
     * Update bulk purchase record and reconcile inventory.
     * Enforces data isolation by ensuring the purchase belongs to the current supplier.
     */
    @Transactional
    public BulkPurchaseResponse updateBulkPurchase(@org.springframework.lang.NonNull Long id, @org.springframework.lang.NonNull BulkPurchaseRequest request) {
        System.out.println("Updating bulk purchase with ID: " + id);

        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        Optional<BulkPurchase> existingBulkPurchase = bulkPurchaseRepository.findById(id);
        if (existingBulkPurchase.isEmpty()) {
            throw new RuntimeException("Bulk purchase not found with ID: " + id);
        }

        BulkPurchase bulkPurchase = existingBulkPurchase.get();

        // Enforce data isolation
        if (!SecurityUtils.isAdmin() && !uniqueKey.equals(bulkPurchase.getUniqueKey())) {
            throw new RuntimeException("Bulk purchase not found with ID: " + id);
        }

        // Reconcile inventory
        reconcileInventoryForBulkPurchaseUpdate(bulkPurchase);

        // Check if purchase bill number is being changed
        if (!SecurityUtils.isAdmin() && !bulkPurchase.getPurchaseBillNo().equals(request.getPurchaseBillNo()) &&
            bulkPurchaseRepository.existsByPurchaseBillNoAndUniqueKey(request.getPurchaseBillNo(), uniqueKey)) {
            throw new RuntimeException("Purchase bill number already exists: " + request.getPurchaseBillNo());
        }

        // Validate
        if (request.getPurchaseItems() == null || request.getPurchaseItems().isEmpty()) {
            throw new RuntimeException("At least one purchase item is required");
        }

        for (PurchaseItemRequest item : request.getPurchaseItems()) {
            boolean isNonChargeable = "NON_CHARGEABLE".equals(item.getCategory()) || "Non-Chargeable".equals(item.getCategory());

            if (!isNonChargeable) {
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    throw new RuntimeException("Quantity must be greater than 0 for category: " + item.getCategory());
                }
                if (item.getPurchasePrice() == null || item.getPurchasePrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new RuntimeException("Purchase price must be greater than 0 for category: " + item.getCategory());
                }
            }
        }

        // Calculate totals
        BigDecimal totalBillAmount = BigDecimal.ZERO;
        BigDecimal totalGstAmount = BigDecimal.ZERO;

        for (PurchaseItemRequest item : request.getPurchaseItems()) {
            BigDecimal itemTotal = item.getTotalAmount();
            BigDecimal itemGst = item.getInputGSTAmount();

            if (itemTotal != null) {
                totalBillAmount = totalBillAmount.add(itemTotal);
            }
            if (itemGst != null) {
                totalGstAmount = totalGstAmount.add(itemGst);
            }
        }

        // Update fields
        bulkPurchase.setPurchaseBillNo(request.getPurchaseBillNo());
        bulkPurchase.setPurchaseDate(request.getPurchaseDate());
        bulkPurchase.setBranch(request.getBranch());
        bulkPurchase.setSupplierName(request.getSupplierName());
        bulkPurchase.setSupplierAddress(request.getSupplierAddress());
        bulkPurchase.setSupplierGstin(request.getSupplierGstin());
        bulkPurchase.setRemarks(request.getRemarks());
        bulkPurchase.setTotalBillAmount(totalBillAmount);
        bulkPurchase.setTotalGstAmount(totalGstAmount);

        // Handle items update
        if (bulkPurchase.getPurchaseItems().size() != request.getPurchaseItems().size()) {
            bulkPurchase.getPurchaseItems().clear();
            List<PurchaseItem> newPurchaseItems = request.getPurchaseItems().stream()
                    .map(item -> createPurchaseItem(item, bulkPurchase, uniqueKey))
                    .collect(Collectors.toList());
            bulkPurchase.setPurchaseItems(newPurchaseItems);
        } else {
            for (int i = 0; i < bulkPurchase.getPurchaseItems().size(); i++) {
                PurchaseItem existingItem = bulkPurchase.getPurchaseItems().get(i);
                PurchaseItemRequest requestItem = request.getPurchaseItems().get(i);
                updatePurchaseItem(existingItem, requestItem, uniqueKey);
            }
        }

        BulkPurchase updatedBulkPurchase = bulkPurchaseRepository.save(bulkPurchase);

        // Apply new inventory values
        updateInventoryFromBulkPurchase(request, uniqueKey);

        return new BulkPurchaseResponse(updatedBulkPurchase);
    }

    /**
     * Reconcile inventory when a bulk purchase is updated.
     */
    private void reconcileInventoryForBulkPurchaseUpdate(BulkPurchase bulkPurchase) {
        try {
            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            if (bulkPurchase.getPurchaseItems() != null) {
                for (PurchaseItem item : bulkPurchase.getPurchaseItems()) {
                    if (item.getQuantity() != null && item.getQuantity() > 0) {
                        inventoryItemRepository.findByProductCodeAndUniqueKey(item.getProductCode(), uniqueKey)
                            .ifPresent(inventoryItem -> {
                                Integer currentQty = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
                                inventoryItem.setQuantity(Math.max(0, currentQty - item.getQuantity()));
                                inventoryItemRepository.save(inventoryItem);
                            });
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reconciling inventory for bulk purchase update: " + e.getMessage());
        }
    }

    /**
     * Update an existing purchase item.
     */
    private void updatePurchaseItem(PurchaseItem existingItem, PurchaseItemRequest requestItem, String uniqueKey) {
        PurchaseItem.ProductCategory category;
        try {
            String categoryStr = requestItem.getCategory();
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
                        PurchaseItem.ProductCategory.valueOf(mappedCategory);
                    } catch (IllegalArgumentException e) {
                        mappedCategory = "SPECTACLES";
                    }
                    break;
            }

            category = PurchaseItem.ProductCategory.valueOf(mappedCategory);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category: " + requestItem.getCategory());
        }

        // Update basic fields
        existingItem.setMaterialName(requestItem.getMaterialName());
        existingItem.setProductCode(requestItem.getProductCode());
        existingItem.setProductDescription(requestItem.getProductDescription());
        existingItem.setCategory(category);
        existingItem.setSubcategory(requestItem.getSubcategory());
        existingItem.setHsn(requestItem.getHsn());
        existingItem.setQuantity(requestItem.getQuantity());
        existingItem.setPurchasePrice(requestItem.getPurchasePrice());
        existingItem.setInputGSTPercent(requestItem.getInputGSTPercent());
        existingItem.setInputGSTAmount(requestItem.getInputGSTAmount());
        existingItem.setTotalAmount(requestItem.getTotalAmount());
        existingItem.setUniqueKey(uniqueKey);

        // Clear conditional fields
        clearConditionalFields(existingItem);

        // Set conditional fields based on category
        switch (category) {
            case SPECTACLES:
            case FRAMES:
            case SUNGLASSES:
                existingItem.setColor(requestItem.getColor());
                existingItem.setSize(requestItem.getSize());
                existingItem.setType(requestItem.getType());
                existingItem.setGender(requestItem.getGender());
                existingItem.setShape(requestItem.getShape());
                existingItem.setMaterial(requestItem.getMaterial());
                existingItem.setTempleDetails(requestItem.getTempleDetails());
                existingItem.setBridgeSize(requestItem.getBridgeSize());
                break;
            case LENS:
                existingItem.setLensDetail(requestItem.getLensDetail());
                existingItem.setLensCoating(requestItem.getLensCoating());
                existingItem.setDesign(requestItem.getDesign());
                existingItem.setLensIndex(requestItem.getLensIndex());
                existingItem.setLensNumber(requestItem.getLensNumber());
                existingItem.setLensAddition(requestItem.getLensAddition());
                existingItem.setLensAxis(requestItem.getLensAxis());
                existingItem.setLensNumberRange(requestItem.getLensNumberRange());
                break;
            case CONTACT_LENSES:
                existingItem.setLensProductName(requestItem.getLensProductName());
                existingItem.setCt(requestItem.getCt());
                existingItem.setBaseCurve(requestItem.getBaseCurve());
                existingItem.setDiameter(requestItem.getDiameter());
                existingItem.setModality(requestItem.getModality());
                existingItem.setValidity(requestItem.getValidity());
                existingItem.setWaterContent(requestItem.getWaterContent());
                existingItem.setDkt(requestItem.getDkt());
                break;
            case SOLUTIONS:
                existingItem.setSolutionName(requestItem.getSolutionName());
                existingItem.setVariant(requestItem.getVariant());
                existingItem.setPackingType(requestItem.getPackingType());
                break;
            case OTHER:
            case NON_CHARGEABLE:
                existingItem.setName(requestItem.getName());
                break;
        }
    }

    /**
     * Clear all conditional fields.
     */
    private void clearConditionalFields(PurchaseItem item) {
        item.setColor(null);
        item.setSize(null);
        item.setType(null);
        item.setGender(null);
        item.setShape(null);
        item.setMaterial(null);
        item.setTempleDetails(null);
        item.setBridgeSize(null);
        item.setLensDetail(null);
        item.setLensCoating(null);
        item.setDesign(null);
        item.setLensIndex(null);
        item.setLensNumber(null);
        item.setLensAddition(null);
        item.setLensAxis(null);
        item.setLensNumberRange(null);
        item.setLensProductName(null);
        item.setCt(null);
        item.setBaseCurve(null);
        item.setDiameter(null);
        item.setModality(null);
        item.setValidity(null);
        item.setWaterContent(null);
        item.setDkt(null);
        item.setSolutionName(null);
        item.setVariant(null);
        item.setPackingType(null);
        item.setName(null);
    }

    /**
     * Delete bulk purchase record and reverse inventory.
     * Enforces data isolation.
     */
    @Transactional
    public void deleteBulkPurchase(@org.springframework.lang.NonNull Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        BulkPurchase bulkPurchase = bulkPurchaseRepository.findById(id)
            .filter(bp -> SecurityUtils.isAdmin() || uniqueKey.equals(bp.getUniqueKey()))
            .orElseThrow(() -> new RuntimeException("Bulk purchase not found with ID: " + id));

        // Reverse inventory
        if (bulkPurchase.getPurchaseItems() != null) {
            for (PurchaseItem item : bulkPurchase.getPurchaseItems()) {
                if (item.getQuantity() != null && item.getQuantity() > 0) {
                    inventoryItemRepository.findByProductCodeAndUniqueKey(item.getProductCode(), uniqueKey)
                        .ifPresent(inventoryItem -> {
                            Integer currentQty = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
                            inventoryItem.setQuantity(Math.max(0, currentQty - item.getQuantity()));
                            inventoryItemRepository.save(inventoryItem);
                        });
                }
            }
        }

        bulkPurchaseRepository.deleteById(id);
    }

    /**
     * Search bulk purchases with filters for the current supplier.
     */
    public List<BulkPurchaseResponse> searchBulkPurchases(
            LocalDate dateFrom, LocalDate dateTo, String supplierName,
            String purchaseBillNo, String branchName) {

        String uniqueKey = SecurityUtils.isAdmin() ? null : SecurityUtils.getCurrentSupplierKey();
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findWithFilters(
            dateFrom, dateTo, supplierName, purchaseBillNo, branchName, uniqueKey
        );

        return bulkPurchases.stream()
                .map(BulkPurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get bulk purchases by date range for the current supplier.
     */
    public List<BulkPurchaseResponse> getBulkPurchasesByDateRange(LocalDate startDate, LocalDate endDate) {
        if (SecurityUtils.isAdmin()) {
            return bulkPurchaseRepository.findAll().stream()
                .filter(bp -> bp.getPurchaseDate() != null && !bp.getPurchaseDate().isBefore(startDate) && !bp.getPurchaseDate().isAfter(endDate))
                .map(BulkPurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findByPurchaseDateBetweenAndUniqueKey(startDate, endDate, uniqueKey);
        return bulkPurchases.stream()
                .map(BulkPurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get bulk purchases by branch for the current supplier.
     */
    public List<BulkPurchaseResponse> getBulkPurchasesByBranch(String branch) {
        if (SecurityUtils.isAdmin()) {
            return bulkPurchaseRepository.findAll().stream()
                .filter(bp -> branch.equals(bp.getBranch()))
                .map(BulkPurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findByBranchAndUniqueKey(branch, uniqueKey);
        return bulkPurchases.stream()
                .map(BulkPurchaseResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * Get bulk purchases by supplier for the current supplier.
     */
    public List<BulkPurchaseResponse> getBulkPurchasesBySupplier(String supplierName) {
        if (SecurityUtils.isAdmin()) {
            return bulkPurchaseRepository.findAll().stream()
                .filter(bp -> bp.getSupplierName() != null && bp.getSupplierName().toLowerCase().contains(supplierName.toLowerCase()))
                .map(BulkPurchaseResponse::new).collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findBySupplierNameContainingIgnoreCaseAndUniqueKey(supplierName, uniqueKey);
        return bulkPurchases.stream()
                .map(BulkPurchaseResponse::new)
                .collect(Collectors.toList());
    }
}