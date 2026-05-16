package com.nayaneyecare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "bulk_purchases")
public class BulkPurchase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(name = "purchase_bill_no", unique = true)
    private String purchaseBillNo;
    
    @NotNull
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    
    @NotBlank
    @Column(name = "branch")
    private String branch;
    
    @NotBlank
    @Column(name = "supplier_name")
    private String supplierName;
    
    @NotBlank
    @Column(name = "supplier_address", columnDefinition = "TEXT")
    private String supplierAddress;
    
    @NotBlank
    @Column(name = "supplier_gstin")
    private String supplierGstin;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "total_bill_amount")
    private BigDecimal totalBillAmount;
    
    @Column(name = "total_gst_amount")
    private BigDecimal totalGstAmount;
    
    @Column(name = "created_at")
    private LocalDate createdAt;
    
    @Column(name = "updated_at")
    private LocalDate updatedAt;
    
    @OneToMany(mappedBy = "bulkPurchase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Size(min = 1, message = "At least one purchase item is required")
    private List<PurchaseItem> purchaseItems;

    // Unique Supplier Key for row-level data isolation
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    // Constructors
    public BulkPurchase() {}
    
    public BulkPurchase(String purchaseBillNo, LocalDate purchaseDate, String branch, 
                       String supplierName, String supplierAddress, String supplierGstin, 
                       String remarks, BigDecimal totalBillAmount, BigDecimal totalGstAmount) {
        this.purchaseBillNo = purchaseBillNo;
        this.purchaseDate = purchaseDate;
        this.branch = branch;
        this.supplierName = supplierName;
        this.supplierAddress = supplierAddress;
        this.supplierGstin = supplierGstin;
        this.remarks = remarks;
        this.totalBillAmount = totalBillAmount;
        this.totalGstAmount = totalGstAmount;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        updatedAt = LocalDate.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
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
    
    public List<PurchaseItem> getPurchaseItems() {
        return purchaseItems;
    }
    
    public void setPurchaseItems(List<PurchaseItem> purchaseItems) {
        this.purchaseItems = purchaseItems;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }

    @Override
    public String toString() {
        return "BulkPurchase{" +
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
                '}';
    }
}
