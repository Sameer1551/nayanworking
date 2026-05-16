package com.nayaneyecare.service;

import com.nayaneyecare.entity.BulkPurchase;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.entity.Purchase;
import com.nayaneyecare.entity.PurchaseItem;
import com.nayaneyecare.entity.PurchaseReturn;
import com.nayaneyecare.repository.BulkPurchaseRepository;
import com.nayaneyecare.repository.PurchaseItemRepository;
import com.nayaneyecare.repository.PurchaseRepository;
import com.nayaneyecare.repository.PurchaseReturnRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Service
public class PurchaseReturnService {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseReturnService.class);

    private final PurchaseReturnRepository purchaseReturnRepository;
    private final PurchaseRepository purchaseRepository;
    private final BulkPurchaseRepository bulkPurchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final NumberingService numberingService;
    private final InventoryItemService inventoryItemService;

    @Autowired
    public PurchaseReturnService(
            PurchaseReturnRepository purchaseReturnRepository,
            PurchaseRepository purchaseRepository,
            BulkPurchaseRepository bulkPurchaseRepository,
            PurchaseItemRepository purchaseItemRepository,
            NumberingService numberingService,
            InventoryItemService inventoryItemService) {
        this.purchaseReturnRepository = purchaseReturnRepository;
        this.purchaseRepository = purchaseRepository;
        this.bulkPurchaseRepository = bulkPurchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.numberingService = numberingService;
        this.inventoryItemService = inventoryItemService;
    }

    /**
     * Get all purchase returns for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<PurchaseReturn> loadAllReturns() {
        if (SecurityUtils.isAdmin()) {
            List<PurchaseReturn> returns = purchaseReturnRepository.findAll();
            returns.sort((a, b) -> b.getReturnDate().compareTo(a.getReturnDate()));
            return returns;
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findAllByOrderByReturnDateDesc(uniqueKey);
    }

    /**
     * Create a new purchase return.
     * Automatically assigns the current supplier's unique key.
     */
    @Transactional
    public PurchaseReturn createReturn(PurchaseReturn purchaseReturn) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        if (purchaseReturn.getReturnNumber() == null || purchaseReturn.getReturnNumber().isEmpty()) {
            purchaseReturn.setReturnNumber(numberingService.generatePurchaseReturnNumber());
        }

        if (purchaseReturn.getSerialNo() == null || purchaseReturn.getSerialNo().isEmpty()) {
            purchaseReturn.setSerialNo(purchaseReturn.getReturnNumber());
        }

        if (purchaseReturn.getReturnDate() == null) {
            purchaseReturn.setReturnDate(LocalDate.now());
        }

        // Set unique key for row-level isolation
        purchaseReturn.setUniqueKey(uniqueKey);

        validateAndPopulateReturn(purchaseReturn, null, uniqueKey);
        adjustInventoryForReturn(purchaseReturn.getProductCode(), purchaseReturn.getReturnQuantity(), false);

        PurchaseReturn saved = purchaseReturnRepository.save(purchaseReturn);

        logger.info("Created purchase return {} for bill {} and product {}",
                saved.getReturnNumber(), saved.getOriginalPurchaseBillNo(), saved.getProductCode());

        return saved;
    }

    /**
     * Get purchase return by ID for the current supplier.
     */
    public Optional<PurchaseReturn> findById(Long id) {
        if (SecurityUtils.isAdmin()) return purchaseReturnRepository.findById(id);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findById(id)
                .filter(pr -> uniqueKey.equals(pr.getUniqueKey()));
    }

    /**
     * Get purchase return by return number for the current supplier.
     */
    public Optional<PurchaseReturn> findByReturnNumber(String returnNumber) {
        if (SecurityUtils.isAdmin()) return purchaseReturnRepository.findByReturnNumber(returnNumber);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findByReturnNumberAndUniqueKey(returnNumber, uniqueKey);
    }

    /**
     * Find purchase returns by bill number for the current supplier.
     */
    public List<PurchaseReturn> findByBillNumber(String billNumber) {
        if (SecurityUtils.isAdmin()) {
            return purchaseReturnRepository.findAll().stream()
                .filter(pr -> billNumber.equals(pr.getOriginalPurchaseBillNo()))
                .toList();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findByOriginalPurchaseBillNoAndUniqueKey(billNumber, uniqueKey);
    }

    /**
     * Find purchase returns by product code for the current supplier.
     */
    public List<PurchaseReturn> findByProductCode(String productCode) {
        if (SecurityUtils.isAdmin()) {
            return purchaseReturnRepository.findAll().stream()
                .filter(pr -> productCode.equals(pr.getProductCode()))
                .toList();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findByProductCodeAndUniqueKey(productCode, uniqueKey);
    }

    /**
     * Find purchase returns by date range for the current supplier.
     */
    public List<PurchaseReturn> findByDateRange(LocalDate dateFrom, LocalDate dateTo) {
        if (SecurityUtils.isAdmin()) {
            return purchaseReturnRepository.findAll().stream()
                .filter(pr -> pr.getReturnDate() != null && !pr.getReturnDate().isBefore(dateFrom) && !pr.getReturnDate().isAfter(dateTo))
                .toList();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findByDateRange(dateFrom, dateTo, uniqueKey);
    }

    /**
     * Find purchase returns by branch for the current supplier.
     */
    public List<PurchaseReturn> findByBranch(String branch) {
        if (SecurityUtils.isAdmin()) {
            return purchaseReturnRepository.findAll().stream()
                .filter(pr -> branch.equals(pr.getBranchName()))
                .toList();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findByBranchNameAndUniqueKey(branch, uniqueKey);
    }

    /**
     * Delete a purchase return.
     * Enforces data isolation.
     */
    @Transactional
    public boolean deleteReturn(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<PurchaseReturn> returnToDelete = purchaseReturnRepository.findById(id)
                .filter(pr -> SecurityUtils.isAdmin() || uniqueKey.equals(pr.getUniqueKey()));
        if (returnToDelete.isEmpty()) {
            return false;
        }

        PurchaseReturn purchaseReturn = returnToDelete.get();
        adjustInventoryForReturn(purchaseReturn.getProductCode(), purchaseReturn.getReturnQuantity(), true);
        purchaseReturnRepository.deleteById(id);

        logger.info("Deleted purchase return {} and restored inventory for {}",
                purchaseReturn.getReturnNumber(), purchaseReturn.getProductCode());
        return true;
    }

    /**
     * Update a purchase return.
     * Enforces data isolation.
     */
    @Transactional
    public Optional<PurchaseReturn> updateReturn(Long id, PurchaseReturn updatedReturn) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        return purchaseReturnRepository.findById(id)
                .filter(pr -> SecurityUtils.isAdmin() || uniqueKey.equals(pr.getUniqueKey()))
                .map(existing -> {
                    adjustInventoryForReturn(existing.getProductCode(), existing.getReturnQuantity(), true);

                    try {
                        if (updatedReturn.getReturnNumber() == null || updatedReturn.getReturnNumber().isBlank()) {
                            updatedReturn.setReturnNumber(existing.getReturnNumber());
                        }
                        if (updatedReturn.getSerialNo() == null || updatedReturn.getSerialNo().isBlank()) {
                            updatedReturn.setSerialNo(existing.getSerialNo());
                        }
                        validateAndPopulateReturn(updatedReturn, id, uniqueKey);

                        existing.setReturnNumber(updatedReturn.getReturnNumber());
                        existing.setSerialNo(updatedReturn.getSerialNo());
                        existing.setSourceRecordType(updatedReturn.getSourceRecordType());
                        existing.setSourceRecordId(updatedReturn.getSourceRecordId());
                        existing.setReturnDate(updatedReturn.getReturnDate());
                        existing.setOriginalPurchaseBillNo(updatedReturn.getOriginalPurchaseBillNo());
                        existing.setBranchName(updatedReturn.getBranchName());
                        existing.setSupplierName(updatedReturn.getSupplierName());
                        existing.setSupplierContact(updatedReturn.getSupplierContact());
                        existing.setSupplierGstin(updatedReturn.getSupplierGstin());
                        existing.setSupplierAddress(updatedReturn.getSupplierAddress());
                        existing.setProductName(updatedReturn.getProductName());
                        existing.setProductCode(updatedReturn.getProductCode());
                        existing.setProductDescription(updatedReturn.getProductDescription());
                        existing.setCategory(updatedReturn.getCategory());
                        existing.setSubcategory(updatedReturn.getSubcategory());
                        existing.setHsn(updatedReturn.getHsn());
                        existing.setReturnQuantity(updatedReturn.getReturnQuantity());
                        existing.setOriginalQuantity(updatedReturn.getOriginalQuantity());
                        existing.setPurchasePrice(updatedReturn.getPurchasePrice());
                        existing.setInputGSTPercent(updatedReturn.getInputGSTPercent());
                        existing.setInputGSTAmount(updatedReturn.getInputGSTAmount());
                        existing.setTotalAmount(updatedReturn.getTotalAmount());
                        existing.setReturnReason(updatedReturn.getReturnReason());
                        existing.setRemarks(updatedReturn.getRemarks());

                        adjustInventoryForReturn(existing.getProductCode(), existing.getReturnQuantity(), false);
                        logger.info("Updated purchase return {} for bill {} and product {}",
                                existing.getReturnNumber(), existing.getOriginalPurchaseBillNo(), existing.getProductCode());
                        return purchaseReturnRepository.save(existing);
                    } catch (RuntimeException ex) {
                        adjustInventoryForReturn(existing.getProductCode(), existing.getReturnQuantity(), false);
                        throw ex;
                    }
                });
    }

    /**
     * Get total count of purchase returns for the current supplier.
     */
    public long getTotalCount() {
        if (SecurityUtils.isAdmin()) return purchaseReturnRepository.count();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findAllByUniqueKey(uniqueKey).stream().count();
    }

    /**
     * Get total value of purchase returns for the current supplier.
     */
    public BigDecimal getTotalValue() {
        if (SecurityUtils.isAdmin()) {
            return purchaseReturnRepository.findAll().stream()
                    .map(PurchaseReturn::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return purchaseReturnRepository.findAllByUniqueKey(uniqueKey).stream()
                .map(PurchaseReturn::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PurchaseSourceDetails validateAndPopulateReturn(PurchaseReturn purchaseReturn, Long excludeReturnId, String uniqueKey) {
        if (purchaseReturn.getReturnQuantity() == null || purchaseReturn.getReturnQuantity() <= 0) {
            throw new RuntimeException("Return quantity must be greater than 0");
        }
        if (purchaseReturn.getReturnReason() == null || purchaseReturn.getReturnReason().isBlank()) {
            throw new RuntimeException("Return reason is required");
        }

        PurchaseSourceDetails sourceDetails = resolvePurchaseSource(purchaseReturn, uniqueKey);
        long alreadyReturned = getAlreadyReturnedQuantity(sourceDetails, excludeReturnId, uniqueKey);
        long requestedTotal = alreadyReturned + purchaseReturn.getReturnQuantity();

        if (requestedTotal > sourceDetails.originalQuantity()) {
            throw new RuntimeException(
                    "Return quantity exceeds available purchase quantity. Purchased: " +
                            sourceDetails.originalQuantity() + ", already returned: " + alreadyReturned);
        }

        populateReturnFromSource(purchaseReturn, sourceDetails);
        return sourceDetails;
    }

    private long getAlreadyReturnedQuantity(PurchaseSourceDetails sourceDetails, Long excludeReturnId, String uniqueKey) {
        if (sourceDetails.sourceRecordType() != null && sourceDetails.sourceRecordId() != null) {
            Long total = purchaseReturnRepository.getReturnedQuantityForSource(
                    sourceDetails.sourceRecordType(),
                    sourceDetails.sourceRecordId(),
                    uniqueKey,
                    excludeReturnId
            );
            return total != null ? total : 0L;
        }

        Long total = purchaseReturnRepository.getReturnedQuantityForBillAndProduct(
                sourceDetails.purchaseBillNo(),
                sourceDetails.productCode(),
                uniqueKey,
                excludeReturnId
        );
        return total != null ? total : 0L;
    }

    private void populateReturnFromSource(PurchaseReturn purchaseReturn, PurchaseSourceDetails sourceDetails) {
        purchaseReturn.setSourceRecordType(sourceDetails.sourceRecordType());
        purchaseReturn.setSourceRecordId(sourceDetails.sourceRecordId());
        purchaseReturn.setOriginalPurchaseBillNo(sourceDetails.purchaseBillNo());
        purchaseReturn.setBranchName(sourceDetails.branchName());
        purchaseReturn.setSupplierName(sourceDetails.supplierName());
        purchaseReturn.setSupplierAddress(sourceDetails.supplierAddress());
        purchaseReturn.setSupplierGstin(sourceDetails.supplierGstin());
        purchaseReturn.setProductName(sourceDetails.productName());
        purchaseReturn.setProductCode(sourceDetails.productCode());
        purchaseReturn.setProductDescription(sourceDetails.productDescription());
        purchaseReturn.setCategory(sourceDetails.category());
        purchaseReturn.setSubcategory(sourceDetails.subcategory());
        purchaseReturn.setHsn(sourceDetails.hsn());
        purchaseReturn.setOriginalQuantity(sourceDetails.originalQuantity());
        purchaseReturn.setPurchasePrice(sourceDetails.purchasePrice());
        purchaseReturn.setInputGSTPercent(sourceDetails.inputGstPercent());

        BigDecimal quantity = BigDecimal.valueOf(purchaseReturn.getReturnQuantity());
        BigDecimal subtotal = sourceDetails.purchasePrice().multiply(quantity);
        BigDecimal gstAmount = subtotal.multiply(sourceDetails.inputGstPercent()).divide(BigDecimal.valueOf(100));

        purchaseReturn.setInputGSTAmount(gstAmount);
        purchaseReturn.setTotalAmount(subtotal);
    }

    private PurchaseSourceDetails resolvePurchaseSource(PurchaseReturn purchaseReturn, String uniqueKey) {
        String sourceType = normalizeSourceType(purchaseReturn.getSourceRecordType());

        if (sourceType != null && purchaseReturn.getSourceRecordId() != null) {
            if ("SINGLE".equals(sourceType)) {
                Purchase purchase = purchaseRepository.findById(purchaseReturn.getSourceRecordId())
                        .filter(p -> uniqueKey.equals(p.getUniqueKey()))
                        .orElseThrow(() -> new RuntimeException("Source purchase not found"));
                return fromPurchase(purchase);
            }

            PurchaseItem purchaseItem = purchaseItemRepository.findById(purchaseReturn.getSourceRecordId())
                    .filter(pi -> uniqueKey.equals(pi.getUniqueKey()))
                    .orElseThrow(() -> new RuntimeException("Source bulk purchase item not found"));
            return fromPurchaseItem(purchaseItem);
        }

        if (purchaseReturn.getOriginalPurchaseBillNo() == null || purchaseReturn.getOriginalPurchaseBillNo().isBlank()
                || purchaseReturn.getProductCode() == null || purchaseReturn.getProductCode().isBlank()) {
            throw new RuntimeException("Purchase bill number and product code are required");
        }

        Optional<Purchase> purchase = purchaseRepository.findByPurchaseBillNoAndUniqueKey(purchaseReturn.getOriginalPurchaseBillNo(), uniqueKey);
        if (purchase.isPresent() && purchaseReturn.getProductCode().equalsIgnoreCase(purchase.get().getProductCode())) {
            return fromPurchase(purchase.get());
        }

        Optional<BulkPurchase> bulkPurchase = bulkPurchaseRepository.findByPurchaseBillNoAndUniqueKey(purchaseReturn.getOriginalPurchaseBillNo(), uniqueKey);
        if (bulkPurchase.isPresent()) {
            PurchaseItem matchingItem = bulkPurchase.get().getPurchaseItems().stream()
                    .filter(item -> purchaseReturn.getProductCode().equalsIgnoreCase(item.getProductCode()))
                    .findFirst()
                    .orElse(null);

            if (matchingItem != null) {
                return fromPurchaseItem(matchingItem);
            }
        }

        throw new RuntimeException("Original purchase record not found for the provided bill and product");
    }

    private PurchaseSourceDetails fromPurchase(Purchase purchase) {
        return new PurchaseSourceDetails(
                "SINGLE",
                Objects.requireNonNull(purchase.getId(), "Purchase id must not be null"),
                purchase.getPurchaseBillNo(),
                purchase.getBranch(),
                purchase.getSupplierName(),
                purchase.getSupplierAddress(),
                purchase.getSupplierGstin(),
                purchase.getMaterialName(),
                purchase.getProductCode(),
                purchase.getProductDescription(),
                mapCategoryToFrontend(purchase.getCategory() != null ? purchase.getCategory().name() : null),
                purchase.getSubcategory(),
                purchase.getHsn(),
                purchase.getQuantity(),
                purchase.getPurchasePrice(),
                purchase.getInputGSTPercent()
        );
    }

    private PurchaseSourceDetails fromPurchaseItem(PurchaseItem purchaseItem) {
        BulkPurchase bulkPurchase = purchaseItem.getBulkPurchase();
        return new PurchaseSourceDetails(
                "BULK",
                Objects.requireNonNull(purchaseItem.getId(), "Purchase item id must not be null"),
                bulkPurchase.getPurchaseBillNo(),
                bulkPurchase.getBranch(),
                bulkPurchase.getSupplierName(),
                bulkPurchase.getSupplierAddress(),
                bulkPurchase.getSupplierGstin(),
                purchaseItem.getMaterialName(),
                purchaseItem.getProductCode(),
                purchaseItem.getProductDescription(),
                mapCategoryToFrontend(purchaseItem.getCategory() != null ? purchaseItem.getCategory().name() : null),
                purchaseItem.getSubcategory(),
                purchaseItem.getHsn(),
                purchaseItem.getQuantity(),
                purchaseItem.getPurchasePrice(),
                purchaseItem.getInputGSTPercent()
        );
    }

    private void adjustInventoryForReturn(String productCode, Integer quantity, boolean restoreStock) {
        if (productCode == null || productCode.isBlank() || quantity == null || quantity <= 0) {
            return;
        }

        if (restoreStock) {
            boolean added = inventoryItemService.addStockByProductCode(productCode, quantity);
            if (!added) {
                throw new RuntimeException("Failed to restore inventory for product code: " + productCode);
            }
            return;
        }

        InventoryItem inventoryItem = inventoryItemService.getInventoryItemByProductCode(productCode)
                .orElseThrow(() -> new RuntimeException("Inventory item not found for product code: " + productCode));

        int currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
        if (currentQuantity < quantity) {
            throw new RuntimeException("Not enough stock available to process purchase return for product code: " + productCode);
        }

        boolean removed = inventoryItemService.removeStockByProductCode(productCode, quantity);
        if (!removed) {
            throw new RuntimeException("Failed to update inventory for product code: " + productCode);
        }
    }

    private String normalizeSourceType(String sourceRecordType) {
        if (sourceRecordType == null || sourceRecordType.isBlank()) {
            return null;
        }

        String normalized = sourceRecordType.trim().toUpperCase(Locale.ROOT);
        if ("PURCHASE".equals(normalized)) {
            return "SINGLE";
        }
        if ("BULK_PURCHASE".equals(normalized)) {
            return "BULK";
        }
        return normalized;
    }

    private String mapCategoryToFrontend(String backendCategory) {
        if (backendCategory == null) {
            return null;
        }

        return switch (backendCategory) {
            case "SPECTACLES" -> "Spectacles";
            case "SUNGLASSES" -> "Sunglasses";
            case "LENS" -> "Lens";
            case "CONTACT_LENSES" -> "Contact Lens";
            case "FRAMES" -> "Frame";
            case "SOLUTIONS" -> "Solution";
            case "NON_CHARGEABLE" -> "Non-Chargeable";
            default -> "Other";
        };
    }

    private record PurchaseSourceDetails(
            String sourceRecordType,
            Long sourceRecordId,
            String purchaseBillNo,
            String branchName,
            String supplierName,
            String supplierAddress,
            String supplierGstin,
            String productName,
            String productCode,
            String productDescription,
            String category,
            String subcategory,
            String hsn,
            Integer originalQuantity,
            BigDecimal purchasePrice,
            BigDecimal inputGstPercent
    ) {
    }
}