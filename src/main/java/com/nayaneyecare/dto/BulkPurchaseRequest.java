package com.nayaneyecare.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public class BulkPurchaseRequest {
    
    @NotBlank(message = "Purchase bill number is required")
    private String purchaseBillNo;
    
    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;
    
    @NotBlank(message = "Branch is required")
    private String branch;
    
    @NotBlank(message = "Supplier name is required")
    private String supplierName;
    
    @NotBlank(message = "Supplier address is required")
    private String supplierAddress;
    
    @NotBlank(message = "Supplier GSTIN is required")
    private String supplierGstin;
    
    private String remarks;
    
    @Valid
    @Size(min = 1, message = "At least one purchase item is required")
    private List<PurchaseItemRequest> purchaseItems;
    
    // Constructors
    public BulkPurchaseRequest() {}
    
    public BulkPurchaseRequest(String purchaseBillNo, LocalDate purchaseDate, String branch,
                              String supplierName, String supplierAddress, String supplierGstin,
                              String remarks, List<PurchaseItemRequest> purchaseItems) {
        this.purchaseBillNo = purchaseBillNo;
        this.purchaseDate = purchaseDate;
        this.branch = branch;
        this.supplierName = supplierName;
        this.supplierAddress = supplierAddress;
        this.supplierGstin = supplierGstin;
        this.remarks = remarks;
        this.purchaseItems = purchaseItems;
    }
    
    // Getters and Setters
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
    
    public List<PurchaseItemRequest> getPurchaseItems() {
        return purchaseItems;
    }
    
    public void setPurchaseItems(List<PurchaseItemRequest> purchaseItems) {
        this.purchaseItems = purchaseItems;
    }
    
    @Override
    public String toString() {
        return "BulkPurchaseRequest{" +
                "purchaseBillNo='" + purchaseBillNo + '\'' +
                ", purchaseDate=" + purchaseDate +
                ", branch='" + branch + '\'' +
                ", supplierName='" + supplierName + '\'' +
                ", supplierAddress='" + supplierAddress + '\'' +
                ", supplierGstin='" + supplierGstin + '\'' +
                ", remarks='" + remarks + '\'' +
                ", purchaseItems=" + purchaseItems +
                '}';
    }
}
