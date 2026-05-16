package com.nayaneyecare.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    
    private String email;
    
    private String phone;
    
    @NotBlank
    private String password;
    
    private String otp;
    
    @NotBlank
    private String userType; // "customer" or "supplier"
    
    @NotBlank
    private String method; // "email" or "phone"

    // Secondary password for dual-password authentication (ADMIN only)
    private String secondaryPassword;
    
    // Constructors
    public LoginRequest() {}
    
    public LoginRequest(String email, String password, String userType, String method) {
        this.email = email;
        this.password = password;
        this.userType = userType;
        this.method = method;
    }
    
    // Getters and Setters
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
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getOtp() {
        return otp;
    }
    
    public void setOtp(String otp) {
        this.otp = otp;
    }
    
    public String getUserType() {
        return userType;
    }
    
    public void setUserType(String userType) {
        this.userType = userType;
    }
    
    public String getMethod() {
        return method;
    }
    
    public void setMethod(String method) {
        this.method = method;
    }

    public String getSecondaryPassword() {
        return secondaryPassword;
    }

    public void setSecondaryPassword(String secondaryPassword) {
        this.secondaryPassword = secondaryPassword;
    }
} 
