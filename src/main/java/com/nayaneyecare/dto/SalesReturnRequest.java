package com.nayaneyecare.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SalesReturnRequest {

    private String returnNumber;

    @NotNull(message = "Return date is required")
    private LocalDate returnDate;

    @NotBlank(message = "Bill number is required")
    private String billNumber;

    private String serialNo;

    @NotBlank(message = "Branch name is required")
    private String branchName;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer contact is required")
    private String customerContact;

    private String customerEmail;
    private String customerAddress;
    private String notes;

    @NotEmpty(message = "At least one product is required")
    @Valid
    private List<SalesReturnItemRequest> items;

    public SalesReturnRequest() {}

    public String getReturnNumber() {
        return returnNumber;
    }

    public void setReturnNumber(String returnNumber) {
        this.returnNumber = returnNumber;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
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

    public List<SalesReturnItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SalesReturnItemRequest> items) {
        this.items = items;
    }

    public static class SalesReturnItemRequest {
        @NotNull(message = "Billing product id is required")
        private Long billingProductId;

        @NotBlank(message = "Product code is required")
        private String productCode;

        @NotBlank(message = "Product name is required")
        private String productName;
        private String productDescription;

        @NotBlank(message = "Category is required")
        private String category;

        @NotBlank(message = "Subcategory is required")
        private String subcategory;

        @NotBlank(message = "HSN is required")
        private String hsn;

        @NotNull(message = "Original quantity is required")
        @Positive(message = "Original quantity must be greater than zero")
        private Integer originalQty;

        @NotNull(message = "Return quantity is required")
        @Positive(message = "Return quantity must be greater than zero")
        private Integer returnQty;

        @NotNull(message = "Unit price is required")
        @PositiveOrZero(message = "Unit price cannot be negative")
        private BigDecimal unitPrice;

        @NotNull(message = "GST percent is required")
        @PositiveOrZero(message = "GST percent cannot be negative")
        private BigDecimal gstPercent;
        private String returnReason;
        private String remarks;

        public SalesReturnItemRequest() {}

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

        public Integer getReturnQty() {
            return returnQty;
        }

        public void setReturnQty(Integer returnQty) {
            this.returnQty = returnQty;
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
    }
}
