package com.nayaneyecare.service;

import com.nayaneyecare.dto.AuthResponse;
import com.nayaneyecare.dto.LoginRequest;
import com.nayaneyecare.dto.SignupRequest;
import com.nayaneyecare.entity.RefreshToken;
import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.UserType;
import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.repository.UserRepository;
import com.nayaneyecare.repository.CustomerRepository;
import com.nayaneyecare.util.JwtUtils;
import com.nayaneyecare.service.UniqueKeyService;
import com.nayaneyecare.service.LoginHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private SupplierFileService supplierFileService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UniqueKeyService uniqueKeyService;

    // PHASE 2: Refresh token service for token issuance and rotation
    @Autowired
    private RefreshTokenService refreshTokenService;

    // PHASE 3: Tamper-Evident Audit Logging
    @Autowired
    private AuditLogService auditLogService;

    // PHASE 6: Login Tracking
    @Autowired
    private LoginHistoryService loginHistoryService;

    public AuthResponse signup(SignupRequest signupRequest, jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (!signupRequest.isAgreeToTerms()) {
                return new AuthResponse("You must agree to the terms and conditions");
            }

            UserType userType;
            try {
                userType = UserType.valueOf(signupRequest.getUserType().toUpperCase());
            } catch (IllegalArgumentException e) {
                return new AuthResponse("Invalid user type");
            }

        if (userType == UserType.SUPPLIER) {
            return new AuthResponse("Supplier registration is restricted. Please contact Admin for account creation.");
        }

        return signupCustomer(signupRequest, userType, request);

    } catch (Exception e) {
        logger.error("Registration failed", e);
        return new AuthResponse("Registration failed: " + e.getMessage());
    }
}

    /**
     * Handle customer signup using the customers table as the primary store.
     */
    private AuthResponse signupCustomer(SignupRequest signupRequest, UserType userType, jakarta.servlet.http.HttpServletRequest request) {
        String email = signupRequest.getEmail();
        String phone = signupRequest.getPhone();
        boolean hasEmail = email != null && !email.trim().isEmpty();
        boolean hasPhone = phone != null && !phone.trim().isEmpty();

        if (!hasEmail && !hasPhone) {
            return new AuthResponse("Email or phone number is required");
        }
        if (hasEmail && customerRepository.existsByEmail(email.toLowerCase().trim())) {
            return new AuthResponse("Email is already registered as a customer");
        }
        if (hasPhone && customerRepository.existsByMobileNo(phone.trim())) {
            return new AuthResponse("Phone number is already registered as a customer");
        }
        if (signupRequest.getAddress() == null || signupRequest.getAddress().trim().isEmpty()) {
            return new AuthResponse("Address is required for customers");
        }

        // Generate unique key for row-level data isolation
        String uniqueKey = uniqueKeyService.generateUniqueSupplierKey();

        Customer customer = new Customer();
        customer.setId(customerService.getNextAvailableCustomerId());
        customer.setFullName(signupRequest.getFirstName().trim() + " " + signupRequest.getLastName().trim());
        customer.setMobileNo(hasPhone ? phone.trim() : null);
        customer.setEmail(hasEmail ? email.toLowerCase().trim() : null);
        customer.setAddress(signupRequest.getAddress().trim());
        customer.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        customer.setIsActive(true);
        customer.setBranchName("Main Branch");
        customer.setTitle("Mr.");
        customer.setUniqueKey(uniqueKey);

        Customer savedCustomer = customerService.createCustomer(customer);
        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        String accessToken = jwtUtils.generateTokenForCustomer(
                savedCustomer,
                signupRequest.getFirstName().trim(),
                signupRequest.getLastName().trim(),
                userAgent);
        // PHASE 2: Issue refresh token on signup
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                savedCustomer.getEmail() != null ? savedCustomer.getEmail() : savedCustomer.getMobileNo(),
                UserType.CUSTOMER.name());

        logger.info("Customer signup successful for: {} (customer ID: {})",
                savedCustomer.getEmail() != null ? savedCustomer.getEmail() : savedCustomer.getMobileNo(),
                savedCustomer.getId());

        // PHASE 3: Audit Log Event
        auditLogService.logEvent(
                savedCustomer.getEmail() != null ? savedCustomer.getEmail() : savedCustomer.getMobileNo(), 
                "SIGNUP_SUCCESS", 
                "Customer account created"
        );

        return buildCustomerAuthResponse(accessToken, refreshToken.getToken(), savedCustomer,
                signupRequest.getFirstName().trim(),
                signupRequest.getLastName().trim(),
                UserType.CUSTOMER.name(),
                "This is your first time logging in!");
    }

    public AuthResponse login(LoginRequest loginRequest, HttpServletRequest request) {
        try {
            UserType userType;
            try {
                userType = UserType.valueOf(loginRequest.getUserType().toUpperCase());
            } catch (IllegalArgumentException e) {
                return new AuthResponse("Invalid user type");
            }

            if (userType == UserType.SUPPLIER) {
                return loginSupplier(loginRequest, request);
            }

            if (userType == UserType.ADMIN) {
                return loginAdmin(loginRequest, request);
            }

            return loginCustomer(loginRequest, userType, request);

        } catch (Exception e) {
            logger.error("Login failed", e);
            return new AuthResponse("Login failed: " + e.getMessage());
        }
    }

    /**
     * Handle admin login — requires dual-password authentication.
     */
    private AuthResponse loginAdmin(LoginRequest loginRequest, HttpServletRequest request) {
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            return new AuthResponse("Password is required");
        }
        if (loginRequest.getSecondaryPassword() == null || loginRequest.getSecondaryPassword().trim().isEmpty()) {
            return new AuthResponse("Secondary password is required");
        }

        Optional<User> userOptional = Optional.empty();

        String identifier = (loginRequest.getEmail() != null && !loginRequest.getEmail().trim().isEmpty())
                ? loginRequest.getEmail().toLowerCase().trim()
                : (loginRequest.getPhone() != null ? loginRequest.getPhone().trim() : "");

        if (identifier.isEmpty()) {
            return new AuthResponse("Email or phone number is required");
        }

        // Try email first, then phone
        userOptional = userRepository.findByEmailAndUserType(identifier, UserType.ADMIN);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByPhoneAndUserType(identifier, UserType.ADMIN);
        }

        if (userOptional.isEmpty()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Admin invalid credentials (user not found)");
            return new AuthResponse("Invalid credentials");
        }

        User user = userOptional.get();

        // PHASE 4: Account Lockout Check
        if (!user.isAccountNonLocked()) {
            auditLogService.logEvent(identifier, "LOGIN_BLOCKED", "Admin account is temporarily locked due to brute force attempts");
            return new AuthResponse("Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.");
        }

        if (!user.getIsActive()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Admin account is deactivated");
            return new AuthResponse("Account is deactivated");
        }

        // Verify primary password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            handleFailedLogin(user, identifier, "Admin");
            return new AuthResponse("Invalid credentials");
        }

        // Verify secondary password
        if (!passwordEncoder.matches(loginRequest.getSecondaryPassword(), user.getSecondaryPassword())) {
            handleFailedLogin(user, identifier, "Admin");
            return new AuthResponse("Invalid credentials");
        }

        // Successful login -> reset failed attempts
        resetFailedLogin(user);

        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        String accessToken = jwtUtils.generateTokenWithAdminRole(user, userAgent);
        // PHASE 2: Issue refresh token on admin login
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getEmail(), UserType.ADMIN.name());
        logger.info("Admin login successful for: {}", user.getEmail());
        
        // PHASE 3: Audit Log
        auditLogService.logEvent(user.getEmail(), "LOGIN_SUCCESS", "Admin logged in");
        
        // PHASE 6: Login Tracking
        loginHistoryService.recordLogin(user.getEmail(), request);
        String lastLoginDetails = loginHistoryService.getLastLoginDetails(user.getEmail());

        return buildUserAuthResponse(accessToken, refreshToken.getToken(), user, lastLoginDetails);
    }

    /**
     * Handle supplier login — MySQL is the only source of truth.
     * The old JSON fallback has been removed.
     */
    private AuthResponse loginSupplier(LoginRequest loginRequest, HttpServletRequest request) {
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            return new AuthResponse("Password is required");
        }

        Optional<User> userOptional = Optional.empty();

        String identifier = (loginRequest.getEmail() != null && !loginRequest.getEmail().trim().isEmpty())
                ? loginRequest.getEmail().toLowerCase().trim()
                : (loginRequest.getPhone() != null ? loginRequest.getPhone().trim() : "");

        if (identifier.isEmpty()) {
            return new AuthResponse("Email or phone number is required");
        }

        // Try email first, then phone
        userOptional = userRepository.findByEmailAndUserType(identifier, UserType.SUPPLIER);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByPhoneAndUserType(identifier, UserType.SUPPLIER);
        }

        if (userOptional.isEmpty()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Supplier invalid credentials");
            return new AuthResponse("Invalid credentials");
        }

        User user = userOptional.get();

        // PHASE 4: Account Lockout Check
        if (!user.isAccountNonLocked()) {
            auditLogService.logEvent(identifier, "LOGIN_BLOCKED", "Supplier account is temporarily locked");
            return new AuthResponse("Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.");
        }

        if (!user.getIsActive()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Supplier account deactivated");
            return new AuthResponse("Account is deactivated");
        }
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            handleFailedLogin(user, identifier, "Supplier");
            return new AuthResponse("Invalid credentials");
        }

        // Successful login -> reset failed attempts
        resetFailedLogin(user);

        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        String accessToken = jwtUtils.generateTokenWithSupplierKey(user, user.getUniqueSupplierKey(), userAgent);
        // PHASE 2: Issue refresh token on supplier login
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getEmail(), UserType.SUPPLIER.name());
        logger.info("Supplier login successful for: {}", user.getEmail());
        
        // PHASE 3: Audit Log
        auditLogService.logEvent(user.getEmail(), "LOGIN_SUCCESS", "Supplier logged in");
        
        // PHASE 6: Login Tracking
        loginHistoryService.recordLogin(user.getEmail(), request);
        String lastLoginDetails = loginHistoryService.getLastLoginDetails(user.getEmail());

        return buildUserAuthResponse(accessToken, refreshToken.getToken(), user, lastLoginDetails);
    }

    /**
     * Handle customer login from the customers table.
     */
    private AuthResponse loginCustomer(LoginRequest loginRequest, UserType userType, HttpServletRequest request) {
        Optional<Customer> customerOptional;

        String identifier = (loginRequest.getEmail() != null && !loginRequest.getEmail().trim().isEmpty())
                ? loginRequest.getEmail().toLowerCase().trim()
                : (loginRequest.getPhone() != null ? loginRequest.getPhone().trim() : "");

        if (identifier.isEmpty()) {
            return new AuthResponse("Email or phone number is required");
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            return new AuthResponse("Password is required");
        }

        // Try email first, then phone
        customerOptional = customerRepository.findByEmail(identifier);
        if (customerOptional.isEmpty()) {
            customerOptional = customerRepository.findByMobileNo(identifier);
        }

        if (customerOptional.isEmpty()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Customer invalid credentials");
            return new AuthResponse("Invalid credentials");
        }

        Customer customer = customerOptional.get();

        // PHASE 4: Account Lockout Check
        if (!customer.isAccountNonLocked()) {
            auditLogService.logEvent(identifier, "LOGIN_BLOCKED", "Customer account is temporarily locked");
            return new AuthResponse("Account is temporarily locked due to too many failed attempts. Try again in 15 minutes.");
        }

        if (Boolean.FALSE.equals(customer.getIsActive())) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Customer account deactivated");
            return new AuthResponse("Account is deactivated");
        }

        // Check if the customer has a password set up (not just a billing record)
        if (customer.getPassword() == null || customer.getPassword().trim().isEmpty()) {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Customer has no account set up (billing record only)");
            return new AuthResponse("Online account not set up. Please register or contact the branch.");
        }

        if (loginRequest.getPassword() != null &&
                !passwordEncoder.matches(loginRequest.getPassword(), customer.getPassword())) {
            handleFailedCustomerLogin(customer, identifier);
            return new AuthResponse("Invalid credentials");
        }

        // Successful login -> reset failed attempts
        resetCustomerFailedLogin(customer);

        String[] names = splitFullName(customer.getFullName());
        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";
        String accessToken = jwtUtils.generateTokenForCustomer(customer, names[0], names[1], userAgent);
        // PHASE 2: Issue refresh token on customer login
        String customerIdentifier = customer.getEmail() != null ? customer.getEmail() : customer.getMobileNo();
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(customerIdentifier, UserType.CUSTOMER.name());
        
        // PHASE 3: Audit Log
        auditLogService.logEvent(customerIdentifier, "LOGIN_SUCCESS", "Customer logged in");
        
        // PHASE 6: Login Tracking
        loginHistoryService.recordLogin(customerIdentifier, request);
        String lastLoginDetails = loginHistoryService.getLastLoginDetails(customerIdentifier);

        return buildCustomerAuthResponse(accessToken, refreshToken.getToken(), customer, names[0], names[1], userType.name(), lastLoginDetails);
    }

    public AuthResponse updateProfile(String email, User updates) {
        try {
            Optional<User> userOptional = userRepository.findByEmail(email);
            // PHASE 1: Generic error — never reveal whether a user ID exists
            if (userOptional.isEmpty()) {
                return new AuthResponse("Invalid credentials");
            }

            User user = userOptional.get();
            
            // Update basic info
            if (updates.getFirstName() != null) user.setFirstName(updates.getFirstName().trim());
            if (updates.getLastName() != null) user.setLastName(updates.getLastName().trim());
            if (updates.getPhone() != null) user.setPhone(updates.getPhone().trim());
            
            // Update supplier info
            if (user.getUserType() == UserType.SUPPLIER) {
                if (updates.getCompanyName() != null) user.setCompanyName(updates.getCompanyName().trim());
                if (updates.getBusinessAddress() != null) user.setBusinessAddress(updates.getBusinessAddress().trim());
                if (updates.getAddress() != null) user.setAddress(updates.getAddress().trim());
                if (updates.getGstNumber() != null) {
                    String gst = updates.getGstNumber().trim().toUpperCase();
                    if (!supplierFileService.isValidGstNumber(gst)) {
                        return new AuthResponse("Invalid GST number format");
                    }
                    user.setGstNumber(gst);
                }
            }

            User savedUser = userRepository.save(user);
            logger.info("Profile updated successfully for: {}", savedUser.getEmail());

            String lastLoginDetails = loginHistoryService.getLastLoginDetails(savedUser.getEmail());
            return buildUserAuthResponse(null, null, savedUser, lastLoginDetails);

        } catch (Exception e) {
            logger.error("Profile update failed", e);
            return new AuthResponse("Profile update failed: " + e.getMessage());
        }
    }

    public AuthResponse getUserProfile(String identifier) {
        Optional<User> userOptional = userRepository.findByEmail(identifier);
        if (userOptional.isPresent()) {
            String lastLoginDetails = loginHistoryService.getLastLoginDetails(userOptional.get().getEmail());
            return buildUserAuthResponse(null, null, userOptional.get(), lastLoginDetails);
        }

        Optional<Customer> customerOptional = customerRepository.findByEmail(identifier);
        if (customerOptional.isEmpty()) {
            customerOptional = customerRepository.findByMobileNo(identifier);
        }
        if (customerOptional.isPresent()) {
            Customer customer = customerOptional.get();
            String[] names = splitFullName(customer.getFullName());
            String customerIdentifier = customer.getEmail() != null ? customer.getEmail() : customer.getMobileNo();
            String lastLoginDetails = loginHistoryService.getLastLoginDetails(customerIdentifier);
            return buildCustomerAuthResponse(null, null, customer, names[0], names[1], UserType.CUSTOMER.name(), lastLoginDetails);
        }

        // PHASE 1: Generic fallback — never reveal whether any account exists
        return new AuthResponse("Invalid credentials");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    // PHASE 4: Brute force lockout logic
    private void handleFailedLogin(User user, String identifier, String userRole) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        if (user.getFailedLoginAttempts() >= 5) {
            user.setLockoutUntil(LocalDateTime.now().plusMinutes(15));
            auditLogService.logEvent(identifier, "ACCOUNT_LOCKED", userRole + " account locked due to 5 failed attempts");
        } else {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", userRole + " invalid password (Attempt " + user.getFailedLoginAttempts() + "/5)");
        }
        userRepository.save(user);
    }

    private void resetFailedLogin(User user) {
        if (user.getFailedLoginAttempts() > 0 || user.getLockoutUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
        }
    }

    private void handleFailedCustomerLogin(Customer customer, String identifier) {
        customer.setFailedLoginAttempts(customer.getFailedLoginAttempts() + 1);
        if (customer.getFailedLoginAttempts() >= 5) {
            customer.setLockoutUntil(LocalDateTime.now().plusMinutes(15));
            auditLogService.logEvent(identifier, "ACCOUNT_LOCKED", "Customer account locked due to 5 failed attempts");
        } else {
            auditLogService.logEvent(identifier, "LOGIN_FAILED", "Customer invalid password (Attempt " + customer.getFailedLoginAttempts() + "/5)");
        }
        customerRepository.save(customer);
    }

    private void resetCustomerFailedLogin(Customer customer) {
        if (customer.getFailedLoginAttempts() > 0 || customer.getLockoutUntil() != null) {
            customer.setFailedLoginAttempts(0);
            customer.setLockoutUntil(null);
            customerRepository.save(customer);
        }
    }

    private String[] splitFullName(String fullName) {
        String trimmed = fullName == null ? "" : fullName.trim();
        if (trimmed.isEmpty()) return new String[]{"", ""};
        String[] parts = trimmed.split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : ""};
    }

    private AuthResponse buildUserAuthResponse(String accessToken, String refreshTokenStr, User user, String lastLoginDetails) {
        AuthResponse response = new AuthResponse(accessToken, user.getId(), user.getFirstName(),
                user.getLastName(), user.getEmail(), user.getUserType().name());
        response.setPhone(user.getPhone());
        response.setAddress(user.getAddress());
        response.setRefreshToken(refreshTokenStr);
        response.setLastLoginDetails(lastLoginDetails);

        if (user.getUserType() == UserType.SUPPLIER) {
            response.setCompanyName(user.getCompanyName());
            response.setGstNumber(user.getGstNumber());
            response.setBusinessAddress(user.getBusinessAddress());
        }

        return response;
    }

    private AuthResponse buildCustomerAuthResponse(String accessToken, String refreshTokenStr,
            Customer customer, String firstName, String lastName, String userType, String lastLoginDetails) {
        AuthResponse response = new AuthResponse(accessToken, customer.getId(), firstName,
                lastName, customer.getEmail(), userType);
        response.setPhone(customer.getMobileNo());
        response.setRefreshToken(refreshTokenStr);
        response.setLastLoginDetails(lastLoginDetails);
        return response;
    }

    // -------------------------------------------------------------------------
    // PHASE 2: Token Refresh & Logout
    // -------------------------------------------------------------------------

    /**
     * Use a refresh token to obtain a new access token.
     * Applies Token Rotation: old refresh token is revoked, new one is issued.
     */
    public AuthResponse refreshAccessToken(String refreshTokenStr, jakarta.servlet.http.HttpServletRequest request) {
        RefreshToken oldToken = refreshTokenService.validateRefreshToken(refreshTokenStr);

        // Rotate: revoke old, issue new refresh token
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(oldToken);

        // Re-issue access token based on the user type stored in the refresh token
        String newAccessToken;
        String email = oldToken.getUserEmail();
        String userType = oldToken.getUserType();
        String userAgent = request != null ? request.getHeader("User-Agent") : "unknown";

        if (UserType.ADMIN.name().equals(userType)) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
            newAccessToken = jwtUtils.generateTokenWithAdminRole(user, userAgent);
        } else if (UserType.SUPPLIER.name().equals(userType)) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
            newAccessToken = jwtUtils.generateTokenWithSupplierKey(user, user.getUniqueSupplierKey(), userAgent);
        } else {
            // CUSTOMER
            var customerOpt = customerRepository.findByEmail(email);
            if (customerOpt.isEmpty()) {
                customerOpt = customerRepository.findByMobileNo(email);
            }
            Customer customer = customerOpt
                    .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
            String[] names = splitFullName(customer.getFullName());
            newAccessToken = jwtUtils.generateTokenForCustomer(customer, names[0], names[1], userAgent);
        }

        logger.info("Access token refreshed for: {} ({})", email, userType);

        AuthResponse response = new AuthResponse();
        response.setToken(newAccessToken);
        response.setRefreshToken(newRefreshToken.getToken());
        return response;
    }

    /**
     * PHASE 2: Explicit logout — revoke all refresh tokens for this user.
     * This ensures the user is fully signed out even if the access token
     * is still technically valid (until its 15-minute expiry).
     */
    public void logout(String userEmail) {
        refreshTokenService.revokeAllUserTokens(userEmail);
        logger.info("User logged out, all refresh tokens revoked for: {}", userEmail);
        
        // PHASE 3: Audit Log
        auditLogService.logEvent(userEmail, "LOGOUT", "User requested logout, tokens revoked");
    }
}
