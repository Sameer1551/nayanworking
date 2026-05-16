package com.nayaneyecare.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

@Entity
@Table(name = "billing_products")
public class BillingProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(name = "product_name")
    private String productName;
    
    @NotBlank
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotBlank
    @Column(name = "hsn_code")
    private String hsnCode;
    
    @NotNull
    @Positive
    private Integer quantity;
    
    @NotNull
    @PositiveOrZero
    @Column(name = "price_per_unit")
    private BigDecimal pricePerUnit;

    @NotNull
    @PositiveOrZero
    @Column(name = "gst_percentage")
    private BigDecimal gstPercentage;

    @NotNull
    @PositiveOrZero
    @Column(name = "gst_amount")
    private BigDecimal gstAmount;

    @NotNull
    @PositiveOrZero
    private BigDecimal total;
    
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_record_id")
    private BillingRecord billingRecord;
    
    @Column(name = "product_code")
    private String productCode;

    @Column(name = "returned_quantity")
    private Integer returnedQuantity = 0;

    @Column(name = "return_status")
    private String returnStatus = "NONE";

    // Unique Supplier Key for row-level data isolation (inherited from parent BillingRecord)
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    // Constructors
    public BillingProduct() {}
    
    public BillingProduct(String productName, String category, String description, String hsnCode,
                         Integer quantity, BigDecimal pricePerUnit, BigDecimal gstPercentage,
                         BigDecimal gstAmount, BigDecimal total) {
        this.productName = productName;
        this.category = category;
        this.description = description;
        this.hsnCode = hsnCode;
        this.quantity = quantity;
        this.pricePerUnit = pricePerUnit;
        this.gstPercentage = gstPercentage;
        this.gstAmount = gstAmount;
        this.total = total;
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
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
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
    
    public BigDecimal getPricePerUnit() {
        return pricePerUnit;
    }
    
    public void setPricePerUnit(BigDecimal pricePerUnit) {
        this.pricePerUnit = pricePerUnit;
    }
    
    public BigDecimal getGstPercentage() {
        return gstPercentage;
    }
    
    public void setGstPercentage(BigDecimal gstPercentage) {
        this.gstPercentage = gstPercentage;
    }
    
    public BigDecimal getGstAmount() {
        return gstAmount;
    }
    
    public void setGstAmount(BigDecimal gstAmount) {
        this.gstAmount = gstAmount;
    }
    
    public BigDecimal getTotal() {
        return total;
    }
    
    public void setTotal(BigDecimal total) {
        this.total = total;
    }
    
    public BillingRecord getBillingRecord() {
        return billingRecord;
    }
    
    public void setBillingRecord(BillingRecord billingRecord) {
        this.billingRecord = billingRecord;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public Integer getReturnedQuantity() {
        return returnedQuantity;
    }

    public void setReturnedQuantity(Integer returnedQuantity) {
        this.returnedQuantity = returnedQuantity;
    }

    public String getReturnStatus() {
        return returnStatus;
    }

    public void setReturnStatus(String returnStatus) {
        this.returnStatus = returnStatus;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }
}
