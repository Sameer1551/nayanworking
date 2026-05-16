package com.nayaneyecare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

@Entity
@Table(name = "sales_return_items")
public class SalesReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_return_id")
    private SalesReturn salesReturn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_product_id")
    private BillingProduct billingProduct;

    @NotBlank
    @Column(name = "product_code")
    private String productCode;

    @NotBlank
    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_description", columnDefinition = "TEXT")
    private String productDescription;

    @NotBlank
    private String category;

    @NotBlank
    private String subcategory;

    @NotBlank
    @Column(name = "hsn_code")
    private String hsnCode;

    @NotNull
    @Positive
    @Column(name = "original_qty")
    private Integer originalQty;

    @NotNull
    @Positive
    @Column(name = "returned_qty")
    private Integer returnedQty;

    @NotNull
    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @NotNull
    @Column(name = "gst_percent")
    private BigDecimal gstPercent;

    @Column(name = "return_reason")
    private String returnReason;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @NotNull
    @Column(name = "line_return_amount")
    private BigDecimal lineReturnAmount;

    // Unique Supplier Key for row-level data isolation (inherited from parent SalesReturn)
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    public SalesReturnItem() {}

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SalesReturn getSalesReturn() {
        return salesReturn;
    }

    public void setSalesReturn(SalesReturn salesReturn) {
        this.salesReturn = salesReturn;
    }

    public BillingProduct getBillingProduct() {
        return billingProduct;
    }

    public void setBillingProduct(BillingProduct billingProduct) {
        this.billingProduct = billingProduct;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductDescription() {
        return productDescription;
    }

    public void setProductDescription(String productDescription) {
        this.productDescription = productDescription;
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

    public String getHsnCode() {
        return hsnCode;
    }

    public void setHsnCode(String hsnCode) {
        this.hsnCode = hsnCode;
    }

    public Integer getOriginalQty() {
        return originalQty;
    }

    public void setOriginalQty(Integer originalQty) {
        this.originalQty = originalQty;
    }

    public Integer getReturnedQty() {
        return returnedQty;
    }

    public void setReturnedQty(Integer returnedQty) {
        this.returnedQty = returnedQty;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getGstPercent() {
        return gstPercent;
    }

    public void setGstPercent(BigDecimal gstPercent) {
        this.gstPercent = gstPercent;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public BigDecimal getLineReturnAmount() {
        return lineReturnAmount;
    }

    public void setLineReturnAmount(BigDecimal lineReturnAmount) {
        this.lineReturnAmount = lineReturnAmount;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }
}
