package com.nayaneyecare.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "branch_name")
    private String branchName;

    @NotBlank
    @Size(max = 10)
    private String title;

    @NotBlank
    @Size(max = 100)
    @Column(name = "full_name")
    private String fullName;

    @Size(max = 15)
    @Column(name = "mobile_no", unique = true, nullable = true)
    private String mobileNo;

    @Size(max = 15)
    @Column(name = "mobile_no2")
    private String mobileNo2;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Size(max = 15)
    @Column(name = "gstin_no")
    private String gstinNo;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "age")
    private Integer age;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Email
    @Size(max = 255)
    @Column(unique = true, nullable = true)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Size(max = 255)
    @Column(name = "password")
    private String password;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Size(max = 100)
    private String city;

    @Column(name = "anniversary")
    private LocalDate anniversary;

    @Column(name = "date_of_visit")
    private LocalDate dateOfVisit;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Billing-related fields
    @Size(max = 10)
    @Column(name = "branch_code")
    private String branchCode;

    @Column(name = "last_visit_date")
    private LocalDate lastVisitDate;

    @Column(name = "visit_count")
    private Integer visitCount = 0;

    @Column(name = "total_spent")
    private Double totalSpent = 0.0;

    @Column(name = "average_bill_amount")
    private Double averageBillAmount = 0.0;

    @Size(max = 50)
    @Column(name = "last_bill_number")
    private String lastBillNumber;

    @Column(name = "last_bill_date")
    private LocalDate lastBillDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private CustomerSource source = CustomerSource.CUSTOMER_RECORD;

    // Link to User for authentication
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Unique Supplier Key for row-level data isolation
    @Convert(converter = com.nayaneyecare.util.AttributeEncryptor.class)
    @Column(name = "unique_key", nullable = false, length = 255)
    private String uniqueKey;

    // PHASE 4: Brute force protection - Account Lockout
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "lockout_until")
    private LocalDateTime lockoutUntil;

    public enum Gender {
        MALE, FEMALE, OTHER;

        @JsonCreator
        public static Gender fromValue(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }
            return Gender.valueOf(value.trim().toUpperCase(Locale.ROOT));
        }

        @JsonValue
        public String toValue() {
            return name();
        }
    }
    
    public enum CustomerSource {
        CUSTOMER_RECORD, BILLING_RECORD, COMBINED
    }
    
    // Constructors
    public Customer() {}
    
    public Customer(String branchName, String title, String fullName, String mobileNo, Gender gender) {
        this.branchName = branchName;
        this.title = title;
        this.fullName = fullName;
        this.mobileNo = mobileNo;
        this.gender = gender;
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
    
    public String getBranchName() {
        return branchName;
    }
    
    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getMobileNo() {
        return mobileNo;
    }
    
    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
    }
    
    public String getMobileNo2() {
        return mobileNo2;
    }
    
    public void setMobileNo2(String mobileNo2) {
        this.mobileNo2 = mobileNo2;
    }
    
    public Gender getGender() {
        return gender;
    }
    
    public void setGender(Gender gender) {
        this.gender = gender;
    }
    
    public String getGstinNo() {
        return gstinNo;
    }
    
    public void setGstinNo(String gstinNo) {
        this.gstinNo = gstinNo;
    }
    
    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }
    
    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
    
    public Integer getAge() {
        return age;
    }
    
    public void setAge(Integer age) {
        this.age = age;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public LocalDate getAnniversary() {
        return anniversary;
    }
    
    public void setAnniversary(LocalDate anniversary) {
        this.anniversary = anniversary;
    }
    
    public LocalDate getDateOfVisit() {
        return dateOfVisit;
    }
    
    public void setDateOfVisit(LocalDate dateOfVisit) {
        this.dateOfVisit = dateOfVisit;
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
    
    public String getBranchCode() {
        return branchCode;
    }
    
    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
    }
    
    public LocalDate getLastVisitDate() {
        return lastVisitDate;
    }
    
    public void setLastVisitDate(LocalDate lastVisitDate) {
        this.lastVisitDate = lastVisitDate;
    }
    
    public Integer getVisitCount() {
        return visitCount;
    }
    
    public void setVisitCount(Integer visitCount) {
        this.visitCount = visitCount;
    }
    
    public Double getTotalSpent() {
        return totalSpent;
    }
    
    public void setTotalSpent(Double totalSpent) {
        this.totalSpent = totalSpent;
    }
    
    public Double getAverageBillAmount() {
        return averageBillAmount;
    }
    
    public void setAverageBillAmount(Double averageBillAmount) {
        this.averageBillAmount = averageBillAmount;
    }
    
    public String getLastBillNumber() {
        return lastBillNumber;
    }
    
    public void setLastBillNumber(String lastBillNumber) {
        this.lastBillNumber = lastBillNumber;
    }
    
    public LocalDate getLastBillDate() {
        return lastBillDate;
    }
    
    public void setLastBillDate(LocalDate lastBillDate) {
        this.lastBillDate = lastBillDate;
    }
    
    public CustomerSource getSource() {
        return source;
    }

    public void setSource(CustomerSource source) {
        this.source = source;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public void setUniqueKey(String uniqueKey) {
        this.uniqueKey = uniqueKey;
    }

    public boolean isAccountNonLocked() {
        if (lockoutUntil == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(lockoutUntil);
    }

    public Integer getFailedLoginAttempts() {
        return failedLoginAttempts != null ? failedLoginAttempts : 0;
    }

    public void setFailedLoginAttempts(Integer failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts != null ? failedLoginAttempts : 0;
    }

    public LocalDateTime getLockoutUntil() {
        return lockoutUntil;
    }

    public void setLockoutUntil(LocalDateTime lockoutUntil) {
        this.lockoutUntil = lockoutUntil;
    }
}
