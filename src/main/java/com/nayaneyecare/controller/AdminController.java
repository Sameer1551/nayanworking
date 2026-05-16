package com.nayaneyecare.controller;

import com.nayaneyecare.dto.SignupRequest;
import com.nayaneyecare.entity.User;
import com.nayaneyecare.entity.UserType;
import com.nayaneyecare.repository.UserRepository;
import com.nayaneyecare.service.SupplierFileService;
import com.nayaneyecare.service.UniqueKeyService;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Admin Controller for super admin operations.
 * Provides user management and global data access.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UniqueKeyService uniqueKeyService;

    @Autowired
    private SupplierFileService supplierFileService;

    /**
     * Get all registered suppliers for admin management.
     */
    @GetMapping("/suppliers")
    public ResponseEntity<Map<String, Object>> getAllSuppliers() {
        if (!SecurityUtils.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        List<User> suppliers = userRepository.findAllByUserType(UserType.SUPPLIER);

        List<Map<String, Object>> supplierList = suppliers.stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("firstName", user.getFirstName());
                    map.put("lastName", user.getLastName());
                    map.put("email", user.getEmail());
                    map.put("phone", user.getPhone());
                    map.put("companyName", user.getCompanyName());
                    map.put("gstNumber", user.getGstNumber());
                    map.put("uniqueSupplierKey", user.getUniqueSupplierKey());
                    map.put("isActive", user.getIsActive());
                    map.put("createdAt", user.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("suppliers", supplierList);
        response.put("totalCount", supplierList.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Create a new supplier account.
     */
    @PostMapping("/suppliers")
    public ResponseEntity<Map<String, Object>> createSupplier(@RequestBody SignupRequest request) {
        if (!SecurityUtils.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        // Basic validation
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Company name is required"));
        }
        if (request.getGstNumber() == null || request.getGstNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "GST number is required"));
        }
        if (!supplierFileService.isValidGstNumber(request.getGstNumber())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid GST number format"));
        }

        // Duplicate checks
        if (userRepository.existsByEmailAndUserType(request.getEmail().toLowerCase().trim(), UserType.SUPPLIER)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already registered"));
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()
                && userRepository.existsByPhoneAndUserType(request.getPhone().trim(), UserType.SUPPLIER)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number is already registered"));
        }
        if (userRepository.existsByGstNumber(request.getGstNumber())) {
            return ResponseEntity.badRequest().body(Map.of("message", "GST number is already registered"));
        }

        // Generate unique supplier key
        String uniqueSupplierKey = uniqueKeyService.generateUniqueSupplierKey();

        // Create supplier
        User supplier = new User();
        supplier.setFirstName(request.getFirstName() != null ? request.getFirstName().trim() : "");
        supplier.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        supplier.setEmail(request.getEmail().toLowerCase().trim());
        supplier.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        supplier.setPassword(passwordEncoder.encode(request.getPassword()));
        supplier.setUserType(UserType.SUPPLIER);
        supplier.setCompanyName(request.getCompanyName().trim());
        supplier.setGstNumber(request.getGstNumber().trim().toUpperCase());
        supplier.setBusinessAddress(request.getBusinessAddress() != null ? request.getBusinessAddress().trim() : "");
        supplier.setIsActive(true);
        supplier.setUniqueSupplierKey(uniqueSupplierKey);

        User savedSupplier = userRepository.save(supplier);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Supplier created successfully");
        response.put("id", savedSupplier.getId());
        response.put("uniqueSupplierKey", uniqueSupplierKey);

        return ResponseEntity.ok(response);
    }


    /**
     * Get all admins.
     */
    @GetMapping("/admins")
    public ResponseEntity<Map<String, Object>> getAllAdmins() {
        if (!SecurityUtils.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        List<User> admins = userRepository.findAllByUserType(UserType.ADMIN);

        List<Map<String, Object>> adminList = admins.stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("firstName", user.getFirstName());
                    map.put("lastName", user.getLastName());
                    map.put("email", user.getEmail());
                    map.put("phone", user.getPhone());
                    map.put("isActive", user.getIsActive());
                    map.put("createdAt", user.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("admins", adminList);
        response.put("totalCount", adminList.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Deactivate a supplier account.
     */
    @PostMapping("/suppliers/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateSupplier(@PathVariable Long id) {
        if (!SecurityUtils.isAdmin()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Access denied");
            return ResponseEntity.status(403).body(body);
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.getUserType() != UserType.SUPPLIER) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User is not a supplier");
            return ResponseEntity.badRequest().body(body);
        }

        user.setIsActive(false);
        userRepository.save(user);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Supplier deactivated successfully");
        return ResponseEntity.ok(body);
    }

    /**
     * Reactivate a supplier account.
     */
    @PostMapping("/suppliers/{id}/reactivate")
    public ResponseEntity<Map<String, Object>> reactivateSupplier(@PathVariable Long id) {
        if (!SecurityUtils.isAdmin()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Access denied");
            return ResponseEntity.status(403).body(body);
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.getUserType() != UserType.SUPPLIER) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User is not a supplier");
            return ResponseEntity.badRequest().body(body);
        }

        user.setIsActive(true);
        userRepository.save(user);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Supplier reactivated successfully");
        return ResponseEntity.ok(body);
    }

    /**
     * Delete a supplier account.
     */
    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Map<String, Object>> deleteSupplier(@PathVariable Long id) {
        if (!SecurityUtils.isAdmin()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Access denied");
            return ResponseEntity.status(403).body(body);
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.getUserType() != UserType.SUPPLIER) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "User is not a supplier");
            return ResponseEntity.badRequest().body(body);
        }

        userRepository.delete(user);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Supplier deleted successfully");
        return ResponseEntity.ok(body);
    }

    /**
     * Get system statistics (global).
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        if (!SecurityUtils.isAdmin()) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        long totalSuppliers = userRepository.findAllByUserType(UserType.SUPPLIER).size();
        long totalAdmins = userRepository.findAllByUserType(UserType.ADMIN).size();
        long totalCustomers = userRepository.count() - totalSuppliers - totalAdmins;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSuppliers", totalSuppliers);
        stats.put("totalAdmins", totalAdmins);
        stats.put("totalCustomers", totalCustomers);
        stats.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(stats);
    }
}
