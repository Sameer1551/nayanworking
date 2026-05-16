package com.nayaneyecare.dto;

import com.nayaneyecare.entity.PurchaseItem;

import java.math.BigDecimal;

public class PurchaseItemResponse {
    private Long id;
    private String materialName;
    private String productCode;
    private String productDescription;
    private String category;
    private String subcategory;
    private String hsn;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal inputGSTPercent;
    private BigDecimal inputGSTAmount;
    private BigDecimal totalAmount;
    
    // Conditional fields for Spectacles/Frame
    private String color;
    private String size;
    private String type;
    private String gender;
    private String shape;
    private String material;
    private String templeDetails;
    private String bridgeSize;
    
    // Conditional fields for Lens
    private String lensDetail;
    private String lensCoating;
    private String design;
    private String lensIndex;
    private String lensNumber;
    private String lensAddition;
    private String lensAxis;
    private String lensNumberRange;
    
    // Conditional fields for Contact Lens
    private String lensProductName;
    private String ct;
    private String baseCurve;
    private String diameter;
    private String modality;
    private String validity;
    private String waterContent;
    private String dkt;
    
    // Conditional fields for Solution
    private String solutionName;
    private String variant;
    private String packingType;
    
    // Conditional fields for Other/Non-Chargeable
    private String name;
    
    // Constructors
    public PurchaseItemResponse() {}
    
    public PurchaseItemResponse(PurchaseItem purchaseItem) {
        this.id = purchaseItem.getId();
        this.materialName = purchaseItem.getMaterialName();
        this.productCode = purchaseItem.getProductCode();
        this.productDescription = purchaseItem.getProductDescription();
        this.category = purchaseItem.getCategory().name();
        this.subcategory = purchaseItem.getSubcategory();
        this.hsn = purchaseItem.getHsn();
        this.quantity = purchaseItem.getQuantity();
        this.purchasePrice = purchaseItem.getPurchasePrice();
        this.inputGSTPercent = purchaseItem.getInputGSTPercent();
        this.inputGSTAmount = purchaseItem.getInputGSTAmount();
        this.totalAmount = purchaseItem.getTotalAmount();
        
        // Set conditional fields based on category
        switch (purchaseItem.getCategory()) {
            case SPECTACLES:
            case SUNGLASSES:
            case FRAMES:
                this.color = purchaseItem.getColor();
                this.size = purchaseItem.getSize();
                this.type = purchaseItem.getType();
                this.gender = purchaseItem.getGender();
                this.shape = purchaseItem.getShape();
                this.material = purchaseItem.getMaterial();
                this.templeDetails = purchaseItem.getTempleDetails();
                this.bridgeSize = purchaseItem.getBridgeSize();
                break;
            case LENS:
                this.lensDetail = purchaseItem.getLensDetail();
                this.lensCoating = purchaseItem.getLensCoating();
                this.design = purchaseItem.getDesign();
                this.lensIndex = purchaseItem.getLensIndex();
                this.lensNumber = purchaseItem.getLensNumber();
                this.lensAddition = purchaseItem.getLensAddition();
                this.lensAxis = purchaseItem.getLensAxis();
                this.lensNumberRange = purchaseItem.getLensNumberRange();
                break;
            case CONTACT_LENSES:
                this.lensProductName = purchaseItem.getLensProductName();
                this.ct = purchaseItem.getCt();
                this.baseCurve = purchaseItem.getBaseCurve();
                this.diameter = purchaseItem.getDiameter();
                this.modality = purchaseItem.getModality();
                this.validity = purchaseItem.getValidity();
                this.waterContent = purchaseItem.getWaterContent();
                this.dkt = purchaseItem.getDkt();
                break;
            case SOLUTIONS:
                this.solutionName = purchaseItem.getSolutionName();
                this.variant = purchaseItem.getVariant();
                this.packingType = purchaseItem.getPackingType();
                break;
            case OTHER:
            case NON_CHARGEABLE:
                this.name = purchaseItem.getName();
                break;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    // Conditional fields getters and setters
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public String getSize() {
        return size;
    }
    
    public void setSize(String size) {
        this.size = size;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getGender() {
        return gender;
    }
    
    public void setGender(String gender) {
        this.gender = gender;
    }
    
    public String getShape() {
        return shape;
    }
    
    public void setShape(String shape) {
        this.shape = shape;
    }
    
    public String getMaterial() {
        return material;
    }
    
    public void setMaterial(String material) {
        this.material = material;
    }
    
    public String getTempleDetails() {
        return templeDetails;
    }
    
    public void setTempleDetails(String templeDetails) {
        this.templeDetails = templeDetails;
    }
    
    public String getBridgeSize() {
        return bridgeSize;
    }
    
    public void setBridgeSize(String bridgeSize) {
        this.bridgeSize = bridgeSize;
    }
    
    public String getLensDetail() {
        return lensDetail;
    }
    
    public void setLensDetail(String lensDetail) {
        this.lensDetail = lensDetail;
    }
    
    public String getLensCoating() {
        return lensCoating;
    }
    
    public void setLensCoating(String lensCoating) {
        this.lensCoating = lensCoating;
    }
    
    public String getDesign() {
        return design;
    }
    
    public void setDesign(String design) {
        this.design = design;
    }
    
    public String getLensIndex() {
        return lensIndex;
    }
    
    public void setLensIndex(String lensIndex) {
        this.lensIndex = lensIndex;
    }
    
    public String getLensNumber() {
        return lensNumber;
    }
    
    public void setLensNumber(String lensNumber) {
        this.lensNumber = lensNumber;
    }
    
    public String getLensAddition() {
        return lensAddition;
    }
    
    public void setLensAddition(String lensAddition) {
        this.lensAddition = lensAddition;
    }
    
    public String getLensAxis() {
        return lensAxis;
    }
    
    public void setLensAxis(String lensAxis) {
        this.lensAxis = lensAxis;
    }
    
    public String getLensNumberRange() {
        return lensNumberRange;
    }
    
    public void setLensNumberRange(String lensNumberRange) {
        this.lensNumberRange = lensNumberRange;
    }
    
    public String getLensProductName() {
        return lensProductName;
    }
    
    public void setLensProductName(String lensProductName) {
        this.lensProductName = lensProductName;
    }
    
    public String getCt() {
        return ct;
    }
    
    public void setCt(String ct) {
        this.ct = ct;
    }
    
    public String getBaseCurve() {
        return baseCurve;
    }
    
    public void setBaseCurve(String baseCurve) {
        this.baseCurve = baseCurve;
    }
    
    public String getDiameter() {
        return diameter;
    }
    
    public void setDiameter(String diameter) {
        this.diameter = diameter;
    }
    
    public String getModality() {
        return modality;
    }
    
    public void setModality(String modality) {
        this.modality = modality;
    }
    
    public String getValidity() {
        return validity;
    }
    
    public void setValidity(String validity) {
        this.validity = validity;
    }
    
    public String getWaterContent() {
        return waterContent;
    }
    
    public void setWaterContent(String waterContent) {
        this.waterContent = waterContent;
    }
    
    public String getDkt() {
        return dkt;
    }
    
    public void setDkt(String dkt) {
        this.dkt = dkt;
    }
    
    public String getSolutionName() {
        return solutionName;
    }
    
    public void setSolutionName(String solutionName) {
        this.solutionName = solutionName;
    }
    
    public String getVariant() {
        return variant;
    }
    
    public void setVariant(String variant) {
        this.variant = variant;
    }
    
    public String getPackingType() {
        return packingType;
    }
    
    public void setPackingType(String packingType) {
        this.packingType = packingType;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    @Override
    public String toString() {
        return "PurchaseItemResponse{" +
                "id=" + id +
                ", materialName='" + materialName + '\'' +
                ", productCode='" + productCode + '\'' +
                ", productDescription='" + productDescription + '\'' +
                ", category='" + category + '\'' +
                ", subcategory='" + subcategory + '\'' +
                ", hsn='" + hsn + '\'' +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", inputGSTPercent=" + inputGSTPercent +
                ", inputGSTAmount=" + inputGSTAmount +
                ", totalAmount=" + totalAmount +
                '}';
    }
}
