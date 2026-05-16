package com.nayaneyecare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "purchases")
public class Purchase {
    
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
    @Column(name = "material_name")
    private String materialName;
    
    @NotBlank
    @Column(name = "product_code")
    private String productCode;
    
    @NotBlank
    @Column(name = "product_description", columnDefinition = "TEXT")
    private String productDescription;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    private ProductCategory category;
    
    @NotBlank
    private String subcategory;
    
    @NotBlank
    private String hsn;
    
    @NotNull
    @PositiveOrZero
    private Integer quantity;

    @NotNull
    @PositiveOrZero
    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @NotNull
    @PositiveOrZero
    @Column(name = "input_gst_percent")
    private BigDecimal inputGSTPercent;

    @NotNull
    @PositiveOrZero
    @Column(name = "input_gst_amount")
    private BigDecimal inputGSTAmount;

    @NotNull
    @PositiveOrZero
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    
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

    // Conditional fields for Spectacles/Frame
    private String color;
    private String size;
    private String type;
    private String gender;
    private String shape;
    private String material;
    @Column(name = "temple_details")
    private String templeDetails;
    @Column(name = "bridge_size")
    private String bridgeSize;

    // Conditional fields for Lens
    @Column(name = "lens_detail")
    private String lensDetail;
    @Column(name = "lens_coating")
    private String lensCoating;
    private String design;
    @Column(name = "lens_index")
    private String lensIndex;
    @Column(name = "lens_number")
    private String lensNumber;
    @Column(name = "lens_addition")
    private String lensAddition;
    @Column(name = "lens_axis")
    private String lensAxis;
    @Column(name = "lens_number_range")
    private String lensNumberRange;

    // Conditional fields for Contact Lens
    @Column(name = "lens_product_name")
    private String lensProductName;
    private String ct;
    @Column(name = "base_curve")
    private String baseCurve;
    private String diameter;
    private String modality;
    private String validity;
    @Column(name = "water_content")
    private String waterContent;
    private String dkt;

    // Conditional fields for Solution
    @Column(name = "solution_name")
    private String solutionName;
    private String variant;
    @Column(name = "packing_type")
    private String packingType;

    // Conditional fields for Other/Non-Chargeable
    private String name;

    // Unique Supplier Key for row-level data isolation
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    @Column(name = "created_at")
    private LocalDate createdAt;
    
    @Column(name = "updated_at")
    private LocalDate updatedAt;
    
    // Enums
    public enum ProductCategory {
        SPECTACLES, SUNGLASSES, LENS, CONTACT_LENSES, FRAMES, SOLUTIONS, OTHER, NON_CHARGEABLE
    }
    
    // Constructors
    public Purchase() {}
    
    public Purchase(String purchaseBillNo, LocalDate purchaseDate, String branch, String materialName, 
                   String productCode, String productDescription, ProductCategory category,
                   String subcategory, String hsn, Integer quantity, BigDecimal purchasePrice,
                   BigDecimal inputGSTPercent, BigDecimal inputGSTAmount, BigDecimal totalAmount,
                   String supplierName, String supplierAddress, String supplierGstin, String remarks) {
        this.purchaseBillNo = purchaseBillNo;
        this.purchaseDate = purchaseDate;
        this.branch = branch;
        this.materialName = materialName;
        this.productCode = productCode;
        this.productDescription = productDescription;
        this.category = category;
        this.subcategory = subcategory;
        this.hsn = hsn;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.inputGSTPercent = inputGSTPercent;
        this.inputGSTAmount = inputGSTAmount;
        this.totalAmount = totalAmount;
        this.supplierName = supplierName;
        this.supplierAddress = supplierAddress;
        this.supplierGstin = supplierGstin;
        this.remarks = remarks;
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
    
    public String getMaterialName() {
        return materialName;
    }
    
    public void setMaterialName(String materialName) {
        this.materialName = materialName;
    }
    
    public String getProductCode() {
        return productCode;
    }
    
    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }
    
    public String getProductDescription() {
        return productDescription;
    }
    
    public void setProductDescription(String productDescription) {
        this.productDescription = productDescription;
    }
    
    public ProductCategory getCategory() {
        return category;
    }
    
    public void setCategory(ProductCategory category) {
        this.category = category;
    }
    
    public String getSubcategory() {
        return subcategory;
    }
    
    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }
    
    public String getHsn() {
        return hsn;
    }
    
    public void setHsn(String hsn) {
        this.hsn = hsn;
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
    
    public BigDecimal getInputGSTPercent() {
        return inputGSTPercent;
    }
    
    public void setInputGSTPercent(BigDecimal inputGSTPercent) {
        this.inputGSTPercent = inputGSTPercent;
    }
    
    public BigDecimal getInputGSTAmount() {
        return inputGSTAmount;
    }
    
    public void setInputGSTAmount(BigDecimal inputGSTAmount) {
        this.inputGSTAmount = inputGSTAmount;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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

    // Conditional fields getters and setters
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public String getTempleDetails() { return templeDetails; }
    public void setTempleDetails(String templeDetails) { this.templeDetails = templeDetails; }

    public String getBridgeSize() { return bridgeSize; }
    public void setBridgeSize(String bridgeSize) { this.bridgeSize = bridgeSize; }

    public String getLensDetail() { return lensDetail; }
    public void setLensDetail(String lensDetail) { this.lensDetail = lensDetail; }

    public String getLensCoating() { return lensCoating; }
    public void setLensCoating(String lensCoating) { this.lensCoating = lensCoating; }

    public String getDesign() { return design; }
    public void setDesign(String design) { this.design = design; }

    public String getLensIndex() { return lensIndex; }
    public void setLensIndex(String lensIndex) { this.lensIndex = lensIndex; }

    public String getLensNumber() { return lensNumber; }
    public void setLensNumber(String lensNumber) { this.lensNumber = lensNumber; }

    public String getLensAddition() { return lensAddition; }
    public void setLensAddition(String lensAddition) { this.lensAddition = lensAddition; }

    public String getLensAxis() { return lensAxis; }
    public void setLensAxis(String lensAxis) { this.lensAxis = lensAxis; }

    public String getLensNumberRange() { return lensNumberRange; }
    public void setLensNumberRange(String lensNumberRange) { this.lensNumberRange = lensNumberRange; }

    public String getLensProductName() { return lensProductName; }
    public void setLensProductName(String lensProductName) { this.lensProductName = lensProductName; }

    public String getCt() { return ct; }
    public void setCt(String ct) { this.ct = ct; }

    public String getBaseCurve() { return baseCurve; }
    public void setBaseCurve(String baseCurve) { this.baseCurve = baseCurve; }

    public String getDiameter() { return diameter; }
    public void setDiameter(String diameter) { this.diameter = diameter; }

    public String getModality() { return modality; }
    public void setModality(String modality) { this.modality = modality; }

    public String getValidity() { return validity; }
    public void setValidity(String validity) { this.validity = validity; }

    public String getWaterContent() { return waterContent; }
    public void setWaterContent(String waterContent) { this.waterContent = waterContent; }

    public String getDkt() { return dkt; }
    public void setDkt(String dkt) { this.dkt = dkt; }

    public String getSolutionName() { return solutionName; }
    public void setSolutionName(String solutionName) { this.solutionName = solutionName; }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public String getPackingType() { return packingType; }
    public void setPackingType(String packingType) { this.packingType = packingType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    @Override
    public String toString() {
        return "Purchase{" +
                "id=" + id +
                ", purchaseBillNo='" + purchaseBillNo + '\'' +
                ", purchaseDate=" + purchaseDate +
                ", branch='" + branch + '\'' +
                ", materialName='" + materialName + '\'' +
                ", productCode='" + productCode + '\'' +
                ", productDescription='" + productDescription + '\'' +
                ", category=" + category +
                ", subcategory='" + subcategory + '\'' +
                ", hsn='" + hsn + '\'' +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", inputGSTPercent=" + inputGSTPercent +
                ", inputGSTAmount=" + inputGSTAmount +
                ", totalAmount=" + totalAmount +
                ", supplierName='" + supplierName + '\'' +
                ", supplierAddress='" + supplierAddress + '\'' +
                ", supplierGstin='" + supplierGstin + '\'' +
                ", remarks='" + remarks + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
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

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }
}
