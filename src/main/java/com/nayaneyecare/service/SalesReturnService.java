package com.nayaneyecare.service;

import com.nayaneyecare.dto.SalesReturnRequest;
import com.nayaneyecare.dto.SalesReturnResponse;
import com.nayaneyecare.entity.BillingProduct;
import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.entity.SalesReturn;
import com.nayaneyecare.entity.SalesReturnItem;
import com.nayaneyecare.repository.BillingProductRepository;
import com.nayaneyecare.repository.BillingRecordRepository;
import com.nayaneyecare.repository.SalesReturnRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SalesReturnService {

    private static final Logger logger = LoggerFactory.getLogger(SalesReturnService.class);

    @Autowired
    private SalesReturnRepository salesReturnRepository;

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @Autowired
    private BillingProductRepository billingProductRepository;

    @Autowired
    private InventoryItemService inventoryItemService;

    @Autowired
    private NumberingService numberingService;

    /**
     * Get all sales returns for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<SalesReturnResponse> loadAllReturns() {
        if (SecurityUtils.isAdmin()) {
            return salesReturnRepository.queryAllGlobalWithItems().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findAllWithItems(uniqueKey).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get sales return by ID for the current supplier.
     */
    public Optional<SalesReturnResponse> findById(Long id) {
        if (SecurityUtils.isAdmin()) return salesReturnRepository.findById(id).map(this::toResponse);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findById(id)
            .filter(sr -> uniqueKey.equals(sr.getUniqueKey()))
            .map(this::toResponse);
    }

    /**
     * Find sales returns by bill number for the current supplier.
     */
    public List<SalesReturnResponse> findByBillNumber(String billNumber) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findByBillNumberAndUniqueKey(billNumber, uniqueKey).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Find sales returns by product code for the current supplier.
     */
    public List<SalesReturnResponse> findByProductCode(String productCode) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findByItemProductCode(productCode, uniqueKey).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Find sales returns by date range for the current supplier.
     */
    public List<SalesReturnResponse> findByDateRange(LocalDate dateFrom, LocalDate dateTo) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findByDateRange(dateFrom, dateTo, uniqueKey).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Find sales returns by branch for the current supplier.
     */
    public List<SalesReturnResponse> findByBranch(String branchName) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findByBranchNameAndUniqueKey(branchName, uniqueKey).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Create a new sales return.
     * Automatically assigns the current supplier's unique key.
     */
    @Transactional
    public SalesReturnResponse createReturn(SalesReturnRequest request) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        // Generate return number if not supplied
        String returnNumber = request.getReturnNumber();
        if (returnNumber == null || returnNumber.isEmpty()) {
            returnNumber = numberingService.generateSalesReturnNumber();
        }

        // Find billing record with unique key filter
        BillingRecord billingRecord = SecurityUtils.isAdmin() 
            ? billingRecordRepository.findByBillNumberWithProductsGlobal(request.getBillNumber())
                .orElseThrow(() -> new IllegalArgumentException("Billing record not found for bill: " + request.getBillNumber()))
            : billingRecordRepository.findByBillNumberWithProducts(request.getBillNumber(), uniqueKey)
                .orElseThrow(() -> new IllegalArgumentException("Billing record not found for bill: " + request.getBillNumber()));

        // Build return header
        SalesReturn salesReturn = new SalesReturn();
        salesReturn.setReturnNumber(returnNumber);
        salesReturn.setBillingRecord(billingRecord);
        salesReturn.setBillNumber(request.getBillNumber());
        salesReturn.setReturnDate(request.getReturnDate());
        salesReturn.setSerialNo(request.getSerialNo());
        salesReturn.setBranchName(request.getBranchName());
        salesReturn.setCustomerName(request.getCustomerName());
        salesReturn.setCustomerContact(request.getCustomerContact());
        salesReturn.setCustomerEmail(request.getCustomerEmail());
        salesReturn.setCustomerAddress(request.getCustomerAddress());
        salesReturn.setNotes(request.getNotes());

        // Set unique key for row-level isolation
        salesReturn.setUniqueKey(uniqueKey);

        BigDecimal totalReturnAmount = BigDecimal.ZERO;

        for (SalesReturnRequest.SalesReturnItemRequest itemReq : request.getItems()) {
            // Find the billing product
            BillingProduct billingProduct = resolveBillingProduct(billingRecord, itemReq.getBillingProductId());

            // Validate available quantity
            int soldQty = billingProduct != null ? billingProduct.getQuantity() : itemReq.getOriginalQty();
            int alreadyReturned = billingProduct != null && billingProduct.getReturnedQuantity() != null
                ? billingProduct.getReturnedQuantity() : 0;
            int availableToReturn = soldQty - alreadyReturned;

            if (itemReq.getReturnQty() > availableToReturn) {
                throw new IllegalArgumentException(
                    "Return qty " + itemReq.getReturnQty() + " exceeds available qty " + availableToReturn
                    + " for product: " + itemReq.getProductName()
                );
            }

            // Build line item
            SalesReturnItem item = new SalesReturnItem();
            item.setSalesReturn(salesReturn);
            item.setBillingProduct(billingProduct);
            item.setProductCode(itemReq.getProductCode());
            item.setProductName(itemReq.getProductName());
            item.setProductDescription(itemReq.getProductDescription());
            item.setCategory(itemReq.getCategory());
            item.setSubcategory(itemReq.getSubcategory());
            item.setHsnCode(itemReq.getHsn());
            item.setOriginalQty(itemReq.getOriginalQty());
            item.setReturnedQty(itemReq.getReturnQty());
            item.setUnitPrice(itemReq.getUnitPrice());
            item.setGstPercent(itemReq.getGstPercent());
            item.setReturnReason(itemReq.getReturnReason());
            item.setRemarks(itemReq.getRemarks());

            BigDecimal lineAmount = itemReq.getUnitPrice()
                .multiply(BigDecimal.valueOf(itemReq.getReturnQty()));
            BigDecimal lineGst = lineAmount.multiply(itemReq.getGstPercent())
                .divide(BigDecimal.valueOf(100));
            item.setLineReturnAmount(lineAmount.add(lineGst));

            salesReturn.addItem(item);
            totalReturnAmount = totalReturnAmount.add(item.getLineReturnAmount());

            // Update billing product returned quantity
            if (billingProduct != null) {
                int newReturned = alreadyReturned + itemReq.getReturnQty();
                billingProduct.setReturnedQuantity(newReturned);
                if (newReturned >= soldQty) {
                    billingProduct.setReturnStatus("FULLY_RETURNED");
                } else if (newReturned > 0) {
                    billingProduct.setReturnStatus("PARTIALLY_RETURNED");
                }
                billingProductRepository.save(billingProduct);
            }

            // Restore inventory
            boolean invUpdated = inventoryItemService.addStockByProductCode(
                itemReq.getProductCode(),
                itemReq.getReturnQty()
            );
            if (!invUpdated) {
                throw new IllegalStateException(
                    "Cannot restore inventory: no inventory item found for product code '"
                    + itemReq.getProductCode() + "'"
                );
            }
        }

        salesReturn.setTotalReturnAmount(totalReturnAmount);
        SalesReturn saved = salesReturnRepository.save(salesReturn);

        logger.info("Created sales return {} for bill {} with total {}",
            returnNumber, request.getBillNumber(), totalReturnAmount);

        return toResponse(saved);
    }

    /**
     * Update an existing sales return.
     * Enforces data isolation.
     */
    @Transactional
    public Optional<SalesReturnResponse> updateReturn(Long id, SalesReturnRequest request) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        return salesReturnRepository.findById(id)
            .filter(sr -> SecurityUtils.isAdmin() || uniqueKey.equals(sr.getUniqueKey()))
            .map(existing -> {
                // Reverse previous inventory adjustments
                for (SalesReturnItem oldItem : existing.getItems()) {
                    inventoryItemService.removeStockByProductCode(
                        oldItem.getProductCode(),
                        oldItem.getReturnedQty()
                    );
                    if (oldItem.getBillingProduct() != null) {
                        BillingProduct bp = oldItem.getBillingProduct();
                        int currentReturned = bp.getReturnedQuantity() != null ? bp.getReturnedQuantity() : 0;
                        bp.setReturnedQuantity(Math.max(0, currentReturned - oldItem.getReturnedQty()));
                        int soldQty = bp.getQuantity();
                        int newReturned = bp.getReturnedQuantity();
                        if (newReturned <= 0) {
                            bp.setReturnStatus("NONE");
                        } else if (newReturned < soldQty) {
                            bp.setReturnStatus("PARTIALLY_RETURNED");
                        }
                        billingProductRepository.save(bp);
                    }
                }

                // Clear old items and apply new ones
                existing.getItems().clear();

                existing.setReturnDate(request.getReturnDate());
                existing.setSerialNo(request.getSerialNo());
                existing.setBranchName(request.getBranchName());
                existing.setCustomerName(request.getCustomerName());
                existing.setCustomerContact(request.getCustomerContact());
                existing.setCustomerEmail(request.getCustomerEmail());
                existing.setCustomerAddress(request.getCustomerAddress());
                existing.setNotes(request.getNotes());

                BigDecimal totalReturnAmount = BigDecimal.ZERO;

                for (SalesReturnRequest.SalesReturnItemRequest itemReq : request.getItems()) {
                    BillingProduct billingProduct = resolveBillingProduct(existing.getBillingRecord(), itemReq.getBillingProductId());

                    int soldQty = billingProduct != null ? billingProduct.getQuantity() : itemReq.getOriginalQty();
                    int alreadyReturned = billingProduct != null && billingProduct.getReturnedQuantity() != null
                        ? billingProduct.getReturnedQuantity() : 0;
                    int availableToReturn = soldQty - alreadyReturned;

                    if (itemReq.getReturnQty() > availableToReturn) {
                        throw new IllegalArgumentException(
                            "Return qty " + itemReq.getReturnQty() + " exceeds available qty " + availableToReturn
                            + " for product: " + itemReq.getProductName()
                        );
                    }

                    SalesReturnItem item = new SalesReturnItem();
                    item.setSalesReturn(existing);
                    item.setBillingProduct(billingProduct);
                    item.setProductCode(itemReq.getProductCode());
                    item.setProductName(itemReq.getProductName());
                    item.setProductDescription(itemReq.getProductDescription());
                    item.setCategory(itemReq.getCategory());
                    item.setSubcategory(itemReq.getSubcategory());
                    item.setHsnCode(itemReq.getHsn());
                    item.setOriginalQty(itemReq.getOriginalQty());
                    item.setReturnedQty(itemReq.getReturnQty());
                    item.setUnitPrice(itemReq.getUnitPrice());
                    item.setGstPercent(itemReq.getGstPercent());
                    item.setReturnReason(itemReq.getReturnReason());
                    item.setRemarks(itemReq.getRemarks());

                    BigDecimal lineAmount = itemReq.getUnitPrice()
                        .multiply(BigDecimal.valueOf(itemReq.getReturnQty()));
                    BigDecimal lineGst = lineAmount.multiply(itemReq.getGstPercent())
                        .divide(BigDecimal.valueOf(100));
                    item.setLineReturnAmount(lineAmount.add(lineGst));

                    existing.addItem(item);
                    totalReturnAmount = totalReturnAmount.add(item.getLineReturnAmount());

                    if (billingProduct != null) {
                        int newReturned = alreadyReturned + itemReq.getReturnQty();
                        billingProduct.setReturnedQuantity(newReturned);
                        if (newReturned >= soldQty) {
                            billingProduct.setReturnStatus("FULLY_RETURNED");
                        } else if (newReturned > 0) {
                            billingProduct.setReturnStatus("PARTIALLY_RETURNED");
                        }
                        billingProductRepository.save(billingProduct);
                    }

                    inventoryItemService.addStockByProductCode(
                        itemReq.getProductCode(),
                        itemReq.getReturnQty()
                    );
                }

                existing.setTotalReturnAmount(totalReturnAmount);
                return toResponse(salesReturnRepository.save(existing));
            });
    }

    /**
     * Delete a sales return.
     * Enforces data isolation.
     */
    @Transactional
    public boolean deleteReturn(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        return salesReturnRepository.findById(id)
            .filter(sr -> SecurityUtils.isAdmin() || uniqueKey.equals(sr.getUniqueKey()))
            .map(salesReturn -> {
                // Reverse inventory
                for (SalesReturnItem item : salesReturn.getItems()) {
                    inventoryItemService.removeStockByProductCode(
                        item.getProductCode(),
                        item.getReturnedQty()
                    );
                    if (item.getBillingProduct() != null) {
                        BillingProduct bp = item.getBillingProduct();
                        int currentReturned = bp.getReturnedQuantity() != null ? bp.getReturnedQuantity() : 0;
                        bp.setReturnedQuantity(Math.max(0, currentReturned - item.getReturnedQty()));
                        int soldQty = bp.getQuantity();
                        int newReturned = bp.getReturnedQuantity();
                        if (newReturned <= 0) {
                            bp.setReturnStatus("NONE");
                        } else if (newReturned < soldQty) {
                            bp.setReturnStatus("PARTIALLY_RETURNED");
                        }
                        billingProductRepository.save(bp);
                    }
                }
                salesReturnRepository.delete(salesReturn);
                logger.info("Deleted sales return: {}", salesReturn.getReturnNumber());
                return true;
            })
            .orElse(false);
    }

    /**
     * Get total count of sales returns for the current supplier.
     */
    public long getTotalCount() {
        if (SecurityUtils.isAdmin()) return salesReturnRepository.count();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findAllByUniqueKey(uniqueKey).stream().count();
    }

    /**
     * Get total value of sales returns for the current supplier.
     */
    public BigDecimal getTotalValue() {
        if (SecurityUtils.isAdmin()) {
            return salesReturnRepository.findAll().stream()
                .map(SalesReturn::getTotalReturnAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return salesReturnRepository.findAllByUniqueKey(uniqueKey).stream()
            .map(SalesReturn::getTotalReturnAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BillingProduct resolveBillingProduct(BillingRecord billingRecord, Long billingProductId) {
        BillingProduct billingProduct = billingProductRepository.findById(billingProductId)
            .orElseThrow(() -> new IllegalArgumentException("Billing product not found: " + billingProductId));

        Long billingRecordId = Objects.requireNonNull(billingRecord.getId(), "Billing record id must not be null");
        Long productBillingRecordId = billingProduct.getBillingRecord() != null
                ? billingProduct.getBillingRecord().getId()
                : null;

        if (productBillingRecordId == null || !billingRecordId.equals(productBillingRecordId)) {
            throw new IllegalArgumentException(
                "Billing product " + billingProductId + " does not belong to bill " + billingRecord.getBillNumber()
            );
        }

        return billingProduct;
    }

    private SalesReturnResponse toResponse(SalesReturn sr) {
        SalesReturnResponse resp = new SalesReturnResponse();
        resp.setId(sr.getId());
        resp.setReturnNumber(sr.getReturnNumber());
        resp.setBillNumber(sr.getBillNumber());
        resp.setReturnDate(sr.getReturnDate());
        resp.setSerialNo(sr.getSerialNo());
        resp.setBranchName(sr.getBranchName());
        resp.setCustomerName(sr.getCustomerName());
        resp.setCustomerContact(sr.getCustomerContact());
        resp.setCustomerEmail(sr.getCustomerEmail());
        resp.setCustomerAddress(sr.getCustomerAddress());
        resp.setNotes(sr.getNotes());
        resp.setTotalReturnAmount(sr.getTotalReturnAmount());
        resp.setCreatedAt(sr.getCreatedAt());

        List<SalesReturnResponse.SalesReturnItemResponse> itemResponses = new ArrayList<>();
        for (SalesReturnItem si : sr.getItems()) {
            SalesReturnResponse.SalesReturnItemResponse ir = new SalesReturnResponse.SalesReturnItemResponse();
            ir.setId(si.getId());
            ir.setBillingProductId(si.getBillingProduct() != null ? si.getBillingProduct().getId() : null);
            ir.setProductCode(si.getProductCode());
            ir.setProductName(si.getProductName());
            ir.setProductDescription(si.getProductDescription());
            ir.setCategory(si.getCategory());
            ir.setSubcategory(si.getSubcategory());
            ir.setHsn(si.getHsnCode());
            ir.setOriginalQty(si.getOriginalQty());
            ir.setReturnedQty(si.getReturnedQty());
            ir.setUnitPrice(si.getUnitPrice());
            ir.setGstPercent(si.getGstPercent());
            BigDecimal lineAmt = si.getUnitPrice().multiply(BigDecimal.valueOf(si.getReturnedQty()));
            ir.setGstAmount(lineAmt.multiply(si.getGstPercent()).divide(BigDecimal.valueOf(100)));
            ir.setLineReturnAmount(si.getLineReturnAmount());
            ir.setReturnReason(si.getReturnReason());
            ir.setRemarks(si.getRemarks());
            itemResponses.add(ir);
        }
        resp.setItems(itemResponses);
        return resp;
    }
}