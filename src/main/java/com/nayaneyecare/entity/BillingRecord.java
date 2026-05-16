package com.nayaneyecare.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "billing_records")
public class BillingRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(name = "bill_number", unique = true)
    private String billNumber;
    
    @NotNull
    @Column(name = "bill_date")
    private LocalDate billDate;
    
    @NotBlank
    @Column(name = "branch_code")
    private String branchCode;
    
    @NotBlank
    @Column(name = "branch_name")
    private String branchName;
    
    @NotBlank
    @Column(name = "customer_name")
    private String customerName;
    
    @NotBlank
    @Column(name = "customer_contact")
    private String customerContact;
    
    @Column(name = "customer_email")
    private String customerEmail;
    
    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;
    
    // Prescription details
    @Column(name = "lens_power_right")
    private String lensPowerRight;
    
    @Column(name = "lens_power_left")
    private String lensPowerLeft;
    
    @Column(name = "pd")
    private String pd;
    
    @Column(name = "sph_right")
    private String sphRight;
    
    @Column(name = "cyl_right")
    private String cylRight;
    
    @Column(name = "axis_right")
    private String axisRight;
    
    @Column(name = "pd_right")
    private String pdRight;
    
    @Column(name = "sph_left")
    private String sphLeft;
    
    @Column(name = "cyl_left")
    private String cylLeft;
    
    @Column(name = "axis_left")
    private String axisLeft;
    
    @Column(name = "pd_left")
    private String pdLeft;
    
    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;
    
    // Billing summary
    @NotNull
    @PositiveOrZero
    private BigDecimal subtotal;
    
    @NotNull
    @PositiveOrZero
    @Column(name = "total_gst")
    private BigDecimal totalGst;
    
    @NotNull
    @PositiveOrZero
    private BigDecimal amount;
    
    @NotNull
    @PositiveOrZero
    private BigDecimal discount;
    
    @NotNull
    @PositiveOrZero
    @Column(name = "advance_paid")
    private BigDecimal advancePaid;
    
    @NotNull
    @PositiveOrZero
    @Column(name = "final_payable")
    private BigDecimal finalPayable;
    
    // Payment details
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "transaction_ref")
    private String transactionRef;
    
    @NotBlank
    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "payment_date")
    private LocalDate paymentDate;
    
    // Additional info
    @Column(name = "warranty_details", columnDefinition = "TEXT")
    private String warrantyDetails;
    
    @Column(name = "return_policy", columnDefinition = "TEXT")
    private String returnPolicy;
    
    @Column(name = "prescription_delivery_date")
    private LocalDate prescriptionDeliveryDate;
    
    @Column(name = "authorized_signatory")
    private String authorizedSignatory;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Products relationship
    @Valid
    @JsonManagedReference
    @OneToMany(mappedBy = "billingRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BillingProduct> products;
    
    // Customer relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Customer customer;

    // Unique Supplier Key for row-level data isolation
    @Column(name = "unique_key", nullable = false, length = 10)
    private String uniqueKey;

    // Constructors
    public BillingRecord() {}
    
    public BillingRecord(String billNumber, LocalDate billDate, String branchCode, String branchName, 
                        String customerName, String customerContact, BigDecimal finalPayable) {
        this.billNumber = billNumber;
        this.billDate = billDate;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.customerName = customerName;
        this.customerContact = customerContact;
        this.finalPayable = finalPayable;
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
    
    public String getBillNumber() {
        return billNumber;
    }
    
    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
    }
    
    public LocalDate getBillDate() {
        return billDate;
    }
    
    public void setBillDate(LocalDate billDate) {
        this.billDate = billDate;
    }
    
    public String getBranchCode() {
        return branchCode;
    }
    
    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
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
    
    public String getLensPowerRight() {
        return lensPowerRight;
    }
    
    public void setLensPowerRight(String lensPowerRight) {
        this.lensPowerRight = lensPowerRight;
    }
    
    public String getLensPowerLeft() {
        return lensPowerLeft;
    }
    
    public void setLensPowerLeft(String lensPowerLeft) {
        this.lensPowerLeft = lensPowerLeft;
    }
    
    public String getPd() {
        return pd;
    }
    
    public void setPd(String pd) {
        this.pd = pd;
    }
    
    public String getSphRight() {
        return sphRight;
    }
    
    public void setSphRight(String sphRight) {
        this.sphRight = sphRight;
    }
    
    public String getCylRight() {
        return cylRight;
    }
    
    public void setCylRight(String cylRight) {
        this.cylRight = cylRight;
    }
    
    public String getAxisRight() {
        return axisRight;
    }
    
    public void setAxisRight(String axisRight) {
        this.axisRight = axisRight;
    }
    
    public String getPdRight() {
        return pdRight;
    }
    
    public void setPdRight(String pdRight) {
        this.pdRight = pdRight;
    }
    
    public String getSphLeft() {
        return sphLeft;
    }
    
    public void setSphLeft(String sphLeft) {
        this.sphLeft = sphLeft;
    }
    
    public String getCylLeft() {
        return cylLeft;
    }
    
    public void setCylLeft(String cylLeft) {
        this.cylLeft = cylLeft;
    }
    
    public String getAxisLeft() {
        return axisLeft;
    }
    
    public void setAxisLeft(String axisLeft) {
        this.axisLeft = axisLeft;
    }
    
    public String getPdLeft() {
        return pdLeft;
    }
    
    public void setPdLeft(String pdLeft) {
        this.pdLeft = pdLeft;
    }
    
    public String getAdditionalNotes() {
        return additionalNotes;
    }
    
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }
    
    public BigDecimal getSubtotal() {
        return subtotal;
    }
    
    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
    
    public BigDecimal getTotalGst() {
        return totalGst;
    }
    
    public void setTotalGst(BigDecimal totalGst) {
        this.totalGst = totalGst;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public BigDecimal getDiscount() {
        return discount;
    }
    
    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }
    
    public BigDecimal getAdvancePaid() {
        return advancePaid;
    }
    
    public void setAdvancePaid(BigDecimal advancePaid) {
        this.advancePaid = advancePaid;
    }
    
    public BigDecimal getFinalPayable() {
        return finalPayable;
    }
    
    public void setFinalPayable(BigDecimal finalPayable) {
        this.finalPayable = finalPayable;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getTransactionRef() {
        return transactionRef;
    }
    
    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }
    
    public String getPaymentStatus() {
        return paymentStatus;
    }
    
    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getWarrantyDetails() {
        return warrantyDetails;
    }
    
    public void setWarrantyDetails(String warrantyDetails) {
        this.warrantyDetails = warrantyDetails;
    }
    
    public String getReturnPolicy() {
        return returnPolicy;
    }
    
    public void setReturnPolicy(String returnPolicy) {
        this.returnPolicy = returnPolicy;
    }
    
    public LocalDate getPrescriptionDeliveryDate() {
        return prescriptionDeliveryDate;
    }
    
    public void setPrescriptionDeliveryDate(LocalDate prescriptionDeliveryDate) {
        this.prescriptionDeliveryDate = prescriptionDeliveryDate;
    }
    
    public String getAuthorizedSignatory() {
        return authorizedSignatory;
    }
    
    public void setAuthorizedSignatory(String authorizedSignatory) {
        this.authorizedSignatory = authorizedSignatory;
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
    
    public List<BillingProduct> getProducts() {
        return products;
    }
    
    public void setProducts(List<BillingProduct> products) {
        this.products = products;
        if (this.products != null) {
            for (BillingProduct product : this.products) {
                if (product != null) {
                    product.setBillingRecord(this);
                }
            }
        }
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }
}
