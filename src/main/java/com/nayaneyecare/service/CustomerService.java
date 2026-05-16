package com.nayaneyecare.service;

import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.repository.CustomerRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing customers with row-level data isolation.
 * All methods automatically filter by the current supplier's unique key.
 */
@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * Gets all customers for the current supplier.
     * Automatically filtered by unique key from security context.
     */
    public List<Customer> getAllCustomers() {
        if (SecurityUtils.isAdmin()) return customerRepository.queryAllGlobal();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findAllByUniqueKey(uniqueKey);
    }

    /**
     * Gets a customer by ID, ensuring it belongs to the current supplier.
     */
    public Optional<Customer> getCustomerById(Long id) {
        if (SecurityUtils.isAdmin()) return customerRepository.findById(id);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findById(id)
                .filter(customer -> uniqueKey.equals(customer.getUniqueKey()));
    }

    /**
     * Gets a customer by mobile number within the current supplier's data.
     */
    public Optional<Customer> getCustomerByMobileNo(String mobileNo) {
        if (SecurityUtils.isAdmin()) return customerRepository.findByMobileNo(mobileNo);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findByMobileNoAndUniqueKey(mobileNo, uniqueKey);
    }

    /**
     * Gets a customer by email within the current supplier's data.
     */
    public Optional<Customer> getCustomerByEmail(String email) {
        if (SecurityUtils.isAdmin()) return customerRepository.findByEmail(email);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findByEmailAndUniqueKey(email, uniqueKey);
    }

    /**
     * Gets customers by branch, filtered by the current supplier's unique key.
     */
    public List<Customer> getCustomersByBranch(String branchName) {
        if (SecurityUtils.isAdmin()) return customerRepository.findByBranchName(branchName);
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findByBranchNameAndUniqueKey(branchName, uniqueKey);
    }

    /**
     * Gets customers by branch code, filtered by the current supplier's unique key.
     */
    public List<Customer> getCustomersByBranchCode(String branchCode) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findByBranchCodeAndUniqueKey(branchCode, uniqueKey);
    }

    /**
     * Searches customers by various criteria, filtered by the current supplier's unique key.
     */
    public List<Customer> searchCustomers(String searchTerm) {
        if (SecurityUtils.isAdmin()) return customerRepository.queryAllGlobal().stream()
            .filter(c -> c.getFullName().contains(searchTerm) || c.getMobileNo().contains(searchTerm) || (c.getEmail() != null && c.getEmail().contains(searchTerm)))
            .toList();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findBySearchTerm(searchTerm, uniqueKey);
    }

    /**
     * Gets top customers by visit count, filtered by the current supplier's unique key.
     */
    public List<Customer> getTopCustomersByVisitCount() {
        if (SecurityUtils.isAdmin()) return customerRepository.findTopCustomersByVisitCountGlobal();
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findTopCustomersByVisitCount(uniqueKey);
    }

    /**
     * Gets top customers by total spent, filtered by the current supplier's unique key.
     */
    public List<Customer> getTopCustomersByTotalSpent() {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findTopCustomersByTotalSpent(uniqueKey);
    }

    /**
     * Gets customers by date range, filtered by the current supplier's unique key.
     */
    public List<Customer> getCustomersByDateRange(String startDate, String endDate) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return customerRepository.findByDateRange(startDate, endDate, uniqueKey);
    }

    /**
     * Creates a new customer, automatically assigning the current supplier's unique key.
     * Data isolation is enforced by stamping the unique key from the security context.
     */
    public Customer createCustomer(Customer customer) {
        // If an admin is logged in, use the provided key or default to GLOBAL_ADMIN
        if (SecurityUtils.isAdmin()) {
            if (customer.getUniqueKey() == null || customer.getUniqueKey().isBlank()) {
                customer.setUniqueKey("GLOBAL_ADMIN");
            }
        } 
        // If a supplier is logged in, force the customer to belong to that supplier
        else if (SecurityUtils.isAuthenticated()) {
            String uniqueKey = SecurityUtils.getCurrentSupplierKey();
            customer.setUniqueKey(uniqueKey);
        }
        // If this is a public signup (no one authenticated), 
        // keep the uniqueKey that was generated during the signup process.
        
        return customerRepository.save(customer);
    }

    /**
     * Updates a customer, ensuring it belongs to the current supplier.
     * The unique key cannot be changed once set.
     */
    public Optional<Customer> updateCustomer(Long id, Customer customerDetails) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<Customer> customerOpt = customerRepository.findById(id);

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();

            // Enforce data isolation - ensure customer belongs to current supplier
            if (!SecurityUtils.isAdmin() && !uniqueKey.equals(customer.getUniqueKey())) {
                return Optional.empty();
            }

            // Update fields
            if (customerDetails.getBranchName() != null) {
                customer.setBranchName(customerDetails.getBranchName());
            }
            if (customerDetails.getTitle() != null) {
                customer.setTitle(customerDetails.getTitle());
            }
            if (customerDetails.getFullName() != null) {
                customer.setFullName(customerDetails.getFullName());
            }
            if (customerDetails.getMobileNo() != null) {
                customer.setMobileNo(customerDetails.getMobileNo());
            }
            if (customerDetails.getMobileNo2() != null) {
                customer.setMobileNo2(customerDetails.getMobileNo2());
            }
            if (customerDetails.getGender() != null) {
                customer.setGender(customerDetails.getGender());
            }
            if (customerDetails.getGstinNo() != null) {
                customer.setGstinNo(customerDetails.getGstinNo());
            }
            if (customerDetails.getDateOfBirth() != null) {
                customer.setDateOfBirth(customerDetails.getDateOfBirth());
            }
            if (customerDetails.getAge() != null) {
                customer.setAge(customerDetails.getAge());
            }
            if (customerDetails.getNotes() != null) {
                customer.setNotes(customerDetails.getNotes());
            }
            if (customerDetails.getEmail() != null) {
                customer.setEmail(customerDetails.getEmail());
            }
            if (customerDetails.getAddress() != null) {
                customer.setAddress(customerDetails.getAddress());
            }
            if (customerDetails.getCity() != null) {
                customer.setCity(customerDetails.getCity());
            }
            if (customerDetails.getAnniversary() != null) {
                customer.setAnniversary(customerDetails.getAnniversary());
            }
            if (customerDetails.getDateOfVisit() != null) {
                customer.setDateOfVisit(customerDetails.getDateOfVisit());
            }
            if (customerDetails.getBranchCode() != null) {
                customer.setBranchCode(customerDetails.getBranchCode());
            }
            if (customerDetails.getLastVisitDate() != null) {
                customer.setLastVisitDate(customerDetails.getLastVisitDate());
            }
            if (customerDetails.getVisitCount() != null) {
                customer.setVisitCount(customerDetails.getVisitCount());
            }
            if (customerDetails.getTotalSpent() != null) {
                customer.setTotalSpent(customerDetails.getTotalSpent());
            }
            if (customerDetails.getAverageBillAmount() != null) {
                customer.setAverageBillAmount(customerDetails.getAverageBillAmount());
            }
            if (customerDetails.getLastBillNumber() != null) {
                customer.setLastBillNumber(customerDetails.getLastBillNumber());
            }
            if (customerDetails.getLastBillDate() != null) {
                customer.setLastBillDate(customerDetails.getLastBillDate());
            }
            if (customerDetails.getSource() != null) {
                customer.setSource(customerDetails.getSource());
            }

            // uniqueKey cannot be changed for security reasons
            return Optional.of(customerRepository.save(customer));
        }
        return Optional.empty();
    }

    /**
     * Deletes a customer, ensuring it belongs to the current supplier.
     */
    public boolean deleteCustomer(Long id) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<Customer> customerOpt = customerRepository.findById(id);

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            // Enforce data isolation
            if (!SecurityUtils.isAdmin() && !uniqueKey.equals(customer.getUniqueKey())) {
                return false;
            }
            customerRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Updates customer billing info, ensuring data isolation.
     */
    public Customer updateCustomerBillingInfo(String mobileNo, String billNumber, String billDate, Double amount) {
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Optional<Customer> customerOpt = customerRepository.findByMobileNoAndUniqueKey(mobileNo, uniqueKey);

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();

            // Update visit count
            Integer currentVisitCount = customer.getVisitCount() != null ? customer.getVisitCount() : 0;
            customer.setVisitCount(currentVisitCount + 1);

            // Update last visit date
            try {
                LocalDate parsedBillDate = LocalDate.parse(billDate, DateTimeFormatter.ISO_LOCAL_DATE);
                customer.setLastVisitDate(parsedBillDate);
                customer.setDateOfVisit(parsedBillDate);
            } catch (Exception e) {
                // Handle date parsing error
            }

            // Update total spent
            Double currentTotalSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : 0.0;
            customer.setTotalSpent(currentTotalSpent + amount);

            // Update average bill amount
            customer.setAverageBillAmount(customer.getTotalSpent() / customer.getVisitCount());

            // Update last bill info
            customer.setLastBillNumber(billNumber);
            try {
                LocalDate parsedBillDate = LocalDate.parse(billDate, DateTimeFormatter.ISO_LOCAL_DATE);
                customer.setLastBillDate(parsedBillDate);
            } catch (Exception e) {
                // Handle date parsing error
            }

            return customerRepository.save(customer);
        }
        return null;
    }

    /**
     * Gets the next available customer ID.
     * Note: This should be replaced with database sequence in production.
     */
    public Long getNextAvailableCustomerId() {
        List<Customer> customers = customerRepository.findAll();
        long nextId = 1L;
        while (true) {
            final long candidate = nextId;
            boolean exists = customers.stream()
                    .anyMatch(customer -> customer.getId() != null && customer.getId().equals(candidate));
            if (!exists) {
                return nextId;
            }
            nextId++;
        }
    }
}
