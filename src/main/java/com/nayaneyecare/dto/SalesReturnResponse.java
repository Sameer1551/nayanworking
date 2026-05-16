package com.nayaneyecare.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SalesReturnResponse {

    private Long id;
    private String returnNumber;
    private String billNumber;
    private LocalDate returnDate;
    private String serialNo;
    private String branchName;
    private String customerName;
    private String customerContact;
    private String customerEmail;
    private String customerAddress;
    private String notes;
    private BigDecimal totalReturnAmount;
    private LocalDateTime createdAt;
    private List<SalesReturnItemResponse> items;

    public SalesReturnResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReturnNumber() {
        return returnNumber;
    }

    public void setReturnNumber(String returnNumber) {
        this.returnNumber = returnNumber;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getSerialNo() {
        return serialNo;
    }

    public void setSerialNo(String serialNo) {
        this.serialNo = serialNo;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerContact() {
        return customerContact;
    }

    public void setCustomerContact(String customerContact) {
        this.customerContact = customerContact;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getTotalReturnAmount() {
        return totalReturnAmount;
    }

    public void setTotalReturnAmount(BigDecimal totalReturnAmount) {
        this.totalReturnAmount = totalReturnAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<SalesReturnItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SalesReturnItemResponse> items) {
        this.items = items;
    }

    public static class SalesReturnItemResponse {
        private Long id;
        private Long billingProductId;
        private String productCode;
        private String productName;
        private String productDescription;
        private String category;
        private String subcategory;
        private String hsn;
        private Integer originalQty;
        private Integer returnedQty;
        private BigDecimal unitPrice;
        private BigDecimal gstPercent;
        private BigDecimal gstAmount;
        private BigDecimal lineReturnAmount;
        private String returnReason;
        private String remarks;

        public SalesReturnItemResponse() {}

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getBillingProductId() {
            return billingProductId;
        }

        public void setBillingProductId(Long billingProductId) {
            this.billingProductId = billingProductId;
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

        public String getHsn() {
            return hsn;
        }

        public void setHsn(String hsn) {
            this.hsn = hsn;
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

        public BigDecimal getGstAmount() {
            return gstAmount;
        }

        public void setGstAmount(BigDecimal gstAmount) {
            this.gstAmount = gstAmount;
        }

        public BigDecimal getLineReturnAmount() {
            return lineReturnAmount;
        }

        public void setLineReturnAmount(BigDecimal lineReturnAmount) {
            this.lineReturnAmount = lineReturnAmount;
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
    }
}
