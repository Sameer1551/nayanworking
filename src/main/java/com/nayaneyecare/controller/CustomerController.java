package com.nayaneyecare.controller;

import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.repository.CustomerRepository;
import com.nayaneyecare.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    
    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;
    
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        List<Customer> customers = customerService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        Optional<Customer> customer = customerService.getCustomerById(id);
        return customer.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/mobile/{mobileNo}")
    public ResponseEntity<Customer> getCustomerByMobileNo(@PathVariable String mobileNo) {
        Optional<Customer> customer = customerService.getCustomerByMobileNo(mobileNo);
        return customer.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<Customer> getCustomerByEmail(@PathVariable String email) {
        Optional<Customer> customer = customerService.getCustomerByEmail(email);
        return customer.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/branch/{branchName}")
    public ResponseEntity<List<Customer>> getCustomersByBranch(@PathVariable String branchName) {
        List<Customer> customers = customerService.getCustomersByBranch(branchName);
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/branch-code/{branchCode}")
    public ResponseEntity<List<Customer>> getCustomersByBranchCode(@PathVariable String branchCode) {
        List<Customer> customers = customerService.getCustomersByBranchCode(branchCode);
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Customer>> searchCustomers(@RequestParam String searchTerm) {
        List<Customer> customers = customerService.searchCustomers(searchTerm);
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/top/visits")
    public ResponseEntity<List<Customer>> getTopCustomersByVisitCount() {
        List<Customer> customers = customerService.getTopCustomersByVisitCount();
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/top/spending")
    public ResponseEntity<List<Customer>> getTopCustomersByTotalSpent() {
        List<Customer> customers = customerService.getTopCustomersByTotalSpent();
        return ResponseEntity.ok(customers);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<Customer>> getCustomersByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        List<Customer> customers = customerService.getCustomersByDateRange(startDate, endDate);
        return ResponseEntity.ok(customers);
    }
    
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        try {
            // Check for duplicate mobile number
            if (customer.getMobileNo() != null && !customer.getMobileNo().isBlank()) {
                if (customerRepository.existsByMobileNo(customer.getMobileNo())) {
                    return ResponseEntity.badRequest()
                        .body(java.util.Map.of("success", false, "message", "A customer with this mobile number already exists"));
                }
            }
            // Check for duplicate email
            if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
                if (customerRepository.existsByEmail(customer.getEmail())) {
                    return ResponseEntity.badRequest()
                        .body(java.util.Map.of("success", false, "message", "A customer with this email already exists"));
                }
            }
            Customer createdCustomer = customerService.createCustomer(customer);
            return ResponseEntity.status(201).body(createdCustomer);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer customerDetails) {
        Optional<Customer> updatedCustomer = customerService.updateCustomer(id, customerDetails);
        if (updatedCustomer.isPresent()) {
            return ResponseEntity.ok(updatedCustomer.get());
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        boolean deleted = customerService.deleteCustomer(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/billing-info")
    public ResponseEntity<Customer> updateCustomerBillingInfo(
            @RequestParam String mobileNo,
            @RequestParam String billNumber,
            @RequestParam String billDate,
            @RequestParam Double amount) {
        Customer updatedCustomer = customerService.updateCustomerBillingInfo(mobileNo, billNumber, billDate, amount);
        if (updatedCustomer != null) {
            return ResponseEntity.ok(updatedCustomer);
        }
        return ResponseEntity.notFound().build();
    }
}
