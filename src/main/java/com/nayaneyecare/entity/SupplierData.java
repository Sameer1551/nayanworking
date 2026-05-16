package com.nayaneyecare.entity;

import java.time.LocalDateTime;

/**
 * Supplier data transfer object — backed by the MySQL {@code users} table
 * (filtered by {@code user_type = 'SUPPLIER'}).
 * The old data/supplier.json file is no longer used.
 */
public class SupplierData {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String hashedPassword;
    private String companyName;
    private String gstNumber;
    private String businessAddress;
    private LocalDateTime createdAt;
    private boolean active;
    private String uniqueSupplierKey;

    // Constructors
    public SupplierData() {
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getHashedPassword() {
        return hashedPassword;
    }

    public void setHashedPassword(String hashedPassword) {
        this.hashedPassword = hashedPassword;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getBusinessAddress() {
        return businessAddress;
    }

    public void setBusinessAddress(String businessAddress) {
        this.businessAddress = businessAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getUniqueSupplierKey() {
        return uniqueSupplierKey;
    }

    public void setUniqueSupplierKey(String uniqueSupplierKey) {
        this.uniqueSupplierKey = uniqueSupplierKey;
    }
}