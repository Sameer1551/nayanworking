package com.nayaneyecare.service;

import com.nayaneyecare.dto.PurchaseHistoryDTO;
import com.nayaneyecare.entity.Purchase;
import com.nayaneyecare.entity.BulkPurchase;
import com.nayaneyecare.entity.PurchaseItem;
import com.nayaneyecare.repository.PurchaseRepository;
import com.nayaneyecare.repository.BulkPurchaseRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service for unified purchase history combining both single purchases and bulk purchases.
 * All methods automatically filter by the current supplier's unique key.
 */
@Service
public class PurchaseHistoryService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private BulkPurchaseRepository bulkPurchaseRepository;

    /**
     * Get all purchase history from both single purchases and bulk purchases.
     * Items are expanded from bulk purchases to individual line items.
     * Combined results are sorted by date (latest first).
     * Automatically filtered by the current supplier's unique key.
     */
    public List<PurchaseHistoryDTO> getPurchaseHistory(String uniqueKey) {
        List<PurchaseHistoryDTO> history = new ArrayList<>();

        // Add single purchases filtered by unique key
        List<Purchase> purchases = purchaseRepository.findAllByUniqueKey(uniqueKey);
        for (Purchase p : purchases) {
            history.add(convertPurchaseToDTO(p));
        }

        // Add bulk purchase items (expanded to individual records) filtered by unique key
        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findAllWithPurchaseItems(uniqueKey);
        for (BulkPurchase bulk : bulkPurchases) {
            if (bulk.getPurchaseItems() != null) {
                for (PurchaseItem item : bulk.getPurchaseItems()) {
                    history.add(convertBulkPurchaseItemToDTO(bulk, item));
                }
            }
        }

        // Sort by date (latest first)
        history.sort(Comparator.comparing(
                PurchaseHistoryDTO::getPurchaseDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ).reversed());

        return history;
    }

    /**
     * Get global purchase history (all records, no filtering) - for ADMIN bypass.
     */
    public List<PurchaseHistoryDTO> getGlobalPurchaseHistory() {
        List<PurchaseHistoryDTO> history = new ArrayList<>();

        List<Purchase> purchases = purchaseRepository.findAll();
        for (Purchase p : purchases) {
            history.add(convertPurchaseToDTO(p));
        }

        List<BulkPurchase> bulkPurchases = bulkPurchaseRepository.findAllWithItems();
        for (BulkPurchase bulk : bulkPurchases) {
            if (bulk.getPurchaseItems() != null) {
                for (PurchaseItem item : bulk.getPurchaseItems()) {
                    history.add(convertBulkPurchaseItemToDTO(bulk, item));
                }
            }
        }

        history.sort(Comparator.comparing(
                PurchaseHistoryDTO::getPurchaseDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ).reversed());

        return history;
    }

    /**
     * Convert a single Purchase entity to PurchaseHistoryDTO.
     */
    private PurchaseHistoryDTO convertPurchaseToDTO(Purchase p) {
        PurchaseHistoryDTO dto = new PurchaseHistoryDTO();
        dto.setRecordType("SINGLE");
        dto.setId(p.getId());
        dto.setParentId(p.getId());
        dto.setItemId(null);
        dto.setPurchaseBillNo(p.getPurchaseBillNo());
        dto.setPurchaseDate(p.getPurchaseDate());
        dto.setBranch(p.getBranch());
        dto.setMaterialName(p.getMaterialName());
        dto.setProductCode(p.getProductCode());
        dto.setProductDescription(p.getProductDescription());
        dto.setCategory(p.getCategory() != null ? p.getCategory().name() : null);
        dto.setSubcategory(p.getSubcategory());
        dto.setHsn(p.getHsn());
        dto.setQuantity(p.getQuantity());
        dto.setPurchasePrice(p.getPurchasePrice());
        dto.setInputGSTPercent(p.getInputGSTPercent());
        dto.setInputGSTAmount(p.getInputGSTAmount());
        dto.setTotalAmount(p.getTotalAmount());
        dto.setSupplierName(p.getSupplierName());
        dto.setSupplierAddress(p.getSupplierAddress());
        dto.setSupplierGstin(p.getSupplierGstin());
        dto.setRemarks(p.getRemarks());

        // Conditional fields
        dto.setColor(p.getColor());
        dto.setSize(p.getSize());
        dto.setType(p.getType());
        dto.setGender(p.getGender());
        dto.setShape(p.getShape());
        dto.setMaterial(p.getMaterial());
        dto.setTempleDetails(p.getTempleDetails());
        dto.setBridgeSize(p.getBridgeSize());
        dto.setLensDetail(p.getLensDetail());
        dto.setLensCoating(p.getLensCoating());
        dto.setDesign(p.getDesign());
        dto.setLensIndex(p.getLensIndex());
        dto.setLensNumber(p.getLensNumber());
        dto.setLensAddition(p.getLensAddition());
        dto.setLensAxis(p.getLensAxis());
        dto.setLensNumberRange(p.getLensNumberRange());
        dto.setLensProductName(p.getLensProductName());
        dto.setCt(p.getCt());
        dto.setBaseCurve(p.getBaseCurve());
        dto.setDiameter(p.getDiameter());
        dto.setModality(p.getModality());
        dto.setValidity(p.getValidity());
        dto.setWaterContent(p.getWaterContent());
        dto.setDkt(p.getDkt());
        dto.setSolutionName(p.getSolutionName());
        dto.setVariant(p.getVariant());
        dto.setPackingType(p.getPackingType());
        dto.setName(p.getName());

        return dto;
    }

    /**
     * Convert a BulkPurchase and its PurchaseItem to PurchaseHistoryDTO.
     */
    private PurchaseHistoryDTO convertBulkPurchaseItemToDTO(BulkPurchase bulk, PurchaseItem item) {
        PurchaseHistoryDTO dto = new PurchaseHistoryDTO();
        dto.setRecordType("BULK");
        dto.setId(item.getId());
        dto.setParentId(bulk.getId());
        dto.setItemId(item.getId());
        dto.setPurchaseBillNo(bulk.getPurchaseBillNo());
        dto.setPurchaseDate(bulk.getPurchaseDate());
        dto.setBranch(bulk.getBranch());
        dto.setMaterialName(item.getMaterialName());
        dto.setProductCode(item.getProductCode());
        dto.setProductDescription(item.getProductDescription());
        dto.setCategory(item.getCategory() != null ? item.getCategory().name() : null);
        dto.setSubcategory(item.getSubcategory());
        dto.setHsn(item.getHsn());
        dto.setQuantity(item.getQuantity());
        dto.setPurchasePrice(item.getPurchasePrice());
        dto.setInputGSTPercent(item.getInputGSTPercent());
        dto.setInputGSTAmount(item.getInputGSTAmount());
        dto.setTotalAmount(item.getTotalAmount());
        dto.setSupplierName(bulk.getSupplierName());
        dto.setSupplierAddress(bulk.getSupplierAddress());
        dto.setSupplierGstin(bulk.getSupplierGstin());
        dto.setRemarks(bulk.getRemarks());

        // Conditional fields
        dto.setColor(item.getColor());
        dto.setSize(item.getSize());
        dto.setType(item.getType());
        dto.setGender(item.getGender());
        dto.setShape(item.getShape());
        dto.setMaterial(item.getMaterial());
        dto.setTempleDetails(item.getTempleDetails());
        dto.setBridgeSize(item.getBridgeSize());
        dto.setLensDetail(item.getLensDetail());
        dto.setLensCoating(item.getLensCoating());
        dto.setDesign(item.getDesign());
        dto.setLensIndex(item.getLensIndex());
        dto.setLensNumber(item.getLensNumber());
        dto.setLensAddition(item.getLensAddition());
        dto.setLensAxis(item.getLensAxis());
        dto.setLensNumberRange(item.getLensNumberRange());
        dto.setLensProductName(item.getLensProductName());
        dto.setCt(item.getCt());
        dto.setBaseCurve(item.getBaseCurve());
        dto.setDiameter(item.getDiameter());
        dto.setModality(item.getModality());
        dto.setValidity(item.getValidity());
        dto.setWaterContent(item.getWaterContent());
        dto.setDkt(item.getDkt());
        dto.setSolutionName(item.getSolutionName());
        dto.setVariant(item.getVariant());
        dto.setPackingType(item.getPackingType());
        dto.setName(item.getName());

        return dto;
    }
}