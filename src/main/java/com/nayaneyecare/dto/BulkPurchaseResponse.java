package com.nayaneyecare.dto;

import com.nayaneyecare.entity.BulkPurchase;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class BulkPurchaseResponse {
    
    private Long id;
    private String purchaseBillNo;
    private LocalDate purchaseDate;
    private String branch;
    private String supplierName;
    private String supplierAddress;
    private String supplierGstin;
    private String remarks;
    private BigDecimal totalBillAmount;
    private BigDecimal totalGstAmount;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private List<PurchaseItemResponse> purchaseItems;
    
    // Constructors
    public BulkPurchaseResponse() {}
    
    public BulkPurchaseResponse(BulkPurchase bulkPurchase) {
        this.id = bulkPurchase.getId();
        this.purchaseBillNo = bulkPurchase.getPurchaseBillNo();
        this.purchaseDate = bulkPurchase.getPurchaseDate();
        this.branch = bulkPurchase.getBranch();
        this.supplierName = bulkPurchase.getSupplierName();
        this.supplierAddress = bulkPurchase.getSupplierAddress();
        this.supplierGstin = bulkPurchase.getSupplierGstin();
        this.remarks = bulkPurchase.getRemarks();
        this.totalBillAmount = bulkPurchase.getTotalBillAmount();
        this.totalGstAmount = bulkPurchase.getTotalGstAmount();
        this.createdAt = bulkPurchase.getCreatedAt();
        this.updatedAt = bulkPurchase.getUpdatedAt();
        
        if (bulkPurchase.getPurchaseItems() != null) {
            this.purchaseItems = bulkPurchase.getPurchaseItems().stream()
                    .map(PurchaseItemResponse::new)
                    .collect(Collectors.toList());
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getPurchaseBillNo() {
        return purchaseBillNo;
    }
    
    public void setPurchaseBillNo(String purchaseBillNo) {
        this.purchaseBillNo = purchaseBillNo;
    }
    
    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }
    
    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }
    
    public String getBranch() {
        return branch;
    }
    
    public void setBranch(String branch) {
        this.branch = branch;
    }
    
    public String getSupplierName() {
        return supplierName;
    }
    
    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }
    
    public String getSupplierAddress() {
        return supplierAddress;
    }
    
    public void setSupplierAddress(String supplierAddress) {
        this.supplierAddress = supplierAddress;
    }
    
    public String getSupplierGstin() {
        return supplierGstin;
    }
    
    public void setSupplierGstin(String supplierGstin) {
        this.supplierGstin = supplierGstin;
    }
    
    public String getRemarks() {
        return remarks;
    }
    
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
    
    public BigDecimal getTotalBillAmount() {
        return totalBillAmount;
    }
    
    public void setTotalBillAmount(BigDecimal totalBillAmount) {
        this.totalBillAmount = totalBillAmount;
    }
    
    public BigDecimal getTotalGstAmount() {
        return totalGstAmount;
    }
    
    public void setTotalGstAmount(BigDecimal totalGstAmount) {
        this.totalGstAmount = totalGstAmount;
    }
    
    public LocalDate getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDate getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDate updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<PurchaseItemResponse> getPurchaseItems() {
        return purchaseItems;
    }
    
    public void setPurchaseItems(List<PurchaseItemResponse> purchaseItems) {
        this.purchaseItems = purchaseItems;
    }
    
    @Override
    public String toString() {
        return "BulkPurchaseResponse{" +
                "id=" + id +
                ", purchaseBillNo='" + purchaseBillNo + '\'' +
                ", purchaseDate=" + purchaseDate +
                ", branch='" + branch + '\'' +
                ", supplierName='" + supplierName + '\'' +
                ", supplierAddress='" + supplierAddress + '\'' +
                ", supplierGstin='" + supplierGstin + '\'' +
                ", remarks='" + remarks + '\'' +
                ", totalBillAmount=" + totalBillAmount +
                ", totalGstAmount=" + totalGstAmount +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", purchaseItems=" + purchaseItems +
                '}';
    }
}
