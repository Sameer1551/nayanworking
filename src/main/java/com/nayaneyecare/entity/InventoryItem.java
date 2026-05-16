package com.nayaneyecare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(name = "product_name")
    private String productName;
    
    @NotBlank
    @Column(name = "product_code", unique = true)
    private String productCode;
    
    @NotBlank
    private String category;
    
    @NotBlank
    private String subcategory;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotBlank
    @Column(name = "hsn_code")
    private String hsnCode;
    
    @NotNull
    @Positive
    private Integer quantity;
    
    @NotNull
    @Positive
    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;
    
    @NotNull
    @Positive
    @Column(name = "selling_price")
    private BigDecimal sellingPrice;
    
    @NotNull
    @PositiveOrZero
    @Column(name = "gst_percentage")
    private BigDecimal gstPercentage;
    
    @NotBlank
    @Column(name = "supplier_name")
    private String supplierName;
    
    @Column(name = "supplier_address", columnDefinition = "TEXT")
    private String supplierAddress;
    
    @Column(name = "supplier_gstin")
    private String supplierGstin;
    
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    @Column(name = "minimum_stock")
    private Integer minimumStock = 0;
    
    @Column(name = "maximum_stock")
    private Integer maximumStock;
    
    @Column(name = "reorder_point")
    private Integer reorderPoint = 0;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;

    // Unique Supplier Key for row-level data isolation
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public InventoryItem() {}
    
    public InventoryItem(String productName, String productCode, String category, String subcategory,
                        String description, String hsnCode, Integer quantity, BigDecimal purchasePrice,
                        BigDecimal sellingPrice, BigDecimal gstPercentage, String supplierName) {
        this.productName = productName;
        this.productCode = productCode;
        this.category = category;
        this.subcategory = subcategory;
        this.description = description;
        this.hsnCode = hsnCode;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.sellingPrice = sellingPrice;
        this.gstPercentage = gstPercentage;
        this.supplierName = supplierName;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getProductName() {
        return productName;
    }
    
    public void setProductName(String productName) {
        this.productName = productName;
    }
    
    public String getProductCode() {
        return productCode;
    }
    
    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getSubcategory() {
        return subcategory;
    }
    
    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getHsnCode() {
        return hsnCode;
    }
    
    public void setHsnCode(String hsnCode) {
        this.hsnCode = hsnCode;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }
    
    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }
    
    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }
    
    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }
    
    public BigDecimal getGstPercentage() {
        return gstPercentage;
    }
    
    public void setGstPercentage(BigDecimal gstPercentage) {
        this.gstPercentage = gstPercentage;
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
    
    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }
    
    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }
    
    public LocalDate getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public Integer getMinimumStock() {
        return minimumStock;
    }
    
    public void setMinimumStock(Integer minimumStock) {
        this.minimumStock = minimumStock;
    }
    
    public Integer getMaximumStock() {
        return maximumStock;
    }
    
    public void setMaximumStock(Integer maximumStock) {
        this.maximumStock = maximumStock;
    }
    
    public Integer getReorderPoint() {
        return reorderPoint;
    }
    
    public void setReorderPoint(Integer reorderPoint) {
        this.reorderPoint = reorderPoint;
    }
    
    public String getRemarks() {
        return remarks;
    }
    
    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }
}
