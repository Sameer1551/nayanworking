package com.nayaneyecare.service;

import com.nayaneyecare.dto.BillingRecordSaveResult;
import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.entity.BillingProduct;
import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.entity.InventoryItem;
import com.nayaneyecare.repository.BillingRecordRepository;
import com.nayaneyecare.repository.CustomerRepository;
import com.nayaneyecare.repository.InventoryItemRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

/**
 * Service for managing billing records with row-level data isolation.
 * All methods automatically filter by the current supplier's unique key.
 */
@Service
public class BillingRecordService {

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    /**
     * Gets all billing records for the current supplier.
     */
    public List<BillingRecord> getAllBillingRecords() {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findAllByUniqueKey(uniqueKey);
    }

    /**
     * Gets a billing record by ID with data isolation check.
     */
    public Optional<BillingRecord> getBillingRecordById(Long id) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.findById(id);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findById(id)
                .filter(record -> uniqueKey.equals(record.getUniqueKey()));
    }

    /**
     * Gets a billing record by bill number with data isolation check.
     */
    public Optional<BillingRecord> getBillingRecordByBillNumber(String billNumber) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.findByBillNumberWithProductsGlobal(billNumber);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByBillNumberWithProducts(billNumber, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByBranch(String branchCode) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByBranchCodeAndUniqueKey(branchCode, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByBranchName(String branchName) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByBranchNameAndUniqueKey(branchName, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByCustomerContact(String customerContact) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByCustomerContactAndUniqueKey(customerContact, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByCustomerName(String customerName) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByCustomerNameContainingIgnoreCaseAndUniqueKey(customerName, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByDateRange(LocalDate startDate, LocalDate endDate) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.findByYearWithProductsGlobal(startDate, endDate);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByDateRange(startDate, endDate, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByAmountRange(minAmount, maxAmount, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByPaymentStatus(String status) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findByPaymentStatus(status, uniqueKey);
    }

    public List<BillingRecord> getCustomerBillingHistory(String mobileNo) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobal();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findCustomerBillingHistory(mobileNo, uniqueKey);
    }

    public String getTotalRevenueForPeriod(LocalDate startDate, LocalDate endDate) {
        if (SecurityUtils.isAdmin()) {
            BigDecimal revenue = billingRecordRepository.getTotalRevenueForPeriodGlobal(startDate, endDate);
            return revenue != null ? revenue.toPlainString() : "0";
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        BigDecimal revenue = billingRecordRepository.getTotalRevenueForPeriod(startDate, endDate, uniqueKey);
        return revenue != null ? revenue.toPlainString() : "0";
    }

    public Long getTotalBillsForPeriod(LocalDate startDate, LocalDate endDate) {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.getTotalBillsForPeriodGlobal(startDate, endDate);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.getTotalBillsForPeriod(startDate, endDate, uniqueKey);
    }

    public List<BillingRecord> getBillingRecordsByYear(int year) {
        if (SecurityUtils.isAdmin()) {
            LocalDate startDate = LocalDate.of(year, 1, 1);
            LocalDate endDate = LocalDate.of(year, 12, 31);
            return billingRecordRepository.findByYearWithProductsGlobal(startDate, endDate);
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        return billingRecordRepository.findByYearWithProducts(startDate, endDate, uniqueKey);
    }

    public List<BillingRecord> getAllBillingRecordsWithProducts() {
        if (SecurityUtils.isAdmin()) {
            return billingRecordRepository.queryAllGlobalWithProducts();
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        return billingRecordRepository.findAllWithProducts(uniqueKey);
    }

    /**
     * Creates a billing record with automatic unique key assignment and data isolation.
     */
    @Transactional
    public BillingRecordSaveResult createBillingRecord(BillingRecord billingRecord) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();

        // DUPLICATE PREVENTION: If bill number already exists for this supplier, return existing record
        List<BillingRecord> existingList = SecurityUtils.isAdmin() 
                ? billingRecordRepository.findByBillNumberWithProductsGlobal(billingRecord.getBillNumber()).map(List::of).orElse(List.of())
                : billingRecordRepository.findByBillNumberAndUniqueKey(billingRecord.getBillNumber(), uniqueKey);
        if (existingList != null && !existingList.isEmpty()) {
            BillingRecord existing = existingList.get(0);
            System.out.println("Billing record already exists with bill number: " + billingRecord.getBillNumber()
                    + " for supplier: " + uniqueKey);
            return new BillingRecordSaveResult(existing, true);
        }

        // Stamp unique key on billing record
        billingRecord.setUniqueKey(uniqueKey);

        // Stamp unique key on all products
        if (billingRecord.getProducts() != null) {
            for (BillingProduct product : billingRecord.getProducts()) {
                product.setUniqueKey(uniqueKey);
            }
        }

        // Upsert customer: find by mobile, else create new from billing data
        String mobile = billingRecord.getCustomerContact();
        Customer customer = null;

        if (mobile != null && !mobile.isBlank()) {
            Optional<Customer> customerOpt = SecurityUtils.isAdmin()
                    ? customerRepository.findByMobileNo(mobile)
                    : customerRepository.findByMobileNoAndUniqueKey(mobile, uniqueKey);
            if (customerOpt.isPresent()) {
                customer = customerOpt.get();
                if (customer.getFullName() == null || customer.getFullName().isBlank()) {
                    customer.setFullName(billingRecord.getCustomerName());
                }
                if ((customer.getEmail() == null || customer.getEmail().isBlank())
                        && billingRecord.getCustomerEmail() != null
                        && !billingRecord.getCustomerEmail().isBlank()) {
                    customer.setEmail(billingRecord.getCustomerEmail());
                }
                if ((customer.getAddress() == null || customer.getAddress().isBlank())
                        && billingRecord.getCustomerAddress() != null) {
                    customer.setAddress(billingRecord.getCustomerAddress());
                }
                if ((customer.getCity() == null || customer.getCity().isBlank())
                        && billingRecord.getCustomerAddress() != null) {
                    customer.setCity(deriveCityFromAddress(billingRecord.getCustomerAddress()));
                }
                updateCustomerBillingInfo(customer, billingRecord.getBillNumber(),
                        billingRecord.getBillDate().toString(),
                        billingRecord.getFinalPayable().doubleValue());
            } else {
                customer = new Customer();
                customer.setUniqueKey(uniqueKey);
                customer.setBranchName(billingRecord.getBranchName());
                customer.setBranchCode(billingRecord.getBranchCode());
                customer.setTitle("-");
                customer.setFullName(billingRecord.getCustomerName());
                customer.setMobileNo(mobile);
                String email = billingRecord.getCustomerEmail();
                customer.setEmail((email != null && !email.isBlank()) ? email : null);
                customer.setAddress(billingRecord.getCustomerAddress());
                customer.setCity(deriveCityFromAddress(billingRecord.getCustomerAddress()));
                customer.setSource(Customer.CustomerSource.BILLING_RECORD);
                customer.setVisitCount(1);
                double amount = billingRecord.getFinalPayable().doubleValue();
                customer.setTotalSpent(amount);
                customer.setAverageBillAmount(amount);
                customer.setLastBillNumber(billingRecord.getBillNumber());
                customer.setLastBillDate(billingRecord.getBillDate());
                customer.setLastVisitDate(billingRecord.getBillDate());
                customer.setDateOfVisit(billingRecord.getBillDate());
                customer = customerRepository.save(customer);
                System.out.println("Created new customer from billing: " + customer.getFullName()
                        + " (mobile: " + mobile + ", id: " + customer.getId() + ")");
            }
        } else {
            System.out.println("WARNING: Billing record has no customer contact — skipping customer upsert for bill: "
                    + billingRecord.getBillNumber());
        }

        if (customer != null) {
            billingRecord.setCustomer(customer);
        }

        // Save billing record
        BillingRecord savedBillingRecord = billingRecordRepository.save(billingRecord);

        // Reduce inventory for sold products
        reduceInventoryFromSale(savedBillingRecord, uniqueKey);

        return new BillingRecordSaveResult(savedBillingRecord, false);
    }

    private void reduceInventoryFromSale(BillingRecord billingRecord, String uniqueKey) {
        try {
            System.out.println("Reducing inventory from sale. Bill Number: " + billingRecord.getBillNumber());

            if (billingRecord.getProducts() == null || billingRecord.getProducts().isEmpty()) {
                System.out.println("No products in billing record to reduce from inventory");
                return;
            }

            for (BillingProduct product : billingRecord.getProducts()) {
                reduceInventoryForProduct(product, uniqueKey);
            }

            System.out.println("Inventory reduced successfully for sale");
        } catch (Exception e) {
            System.err.println("Error reducing inventory from sale: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void reduceInventoryForProduct(BillingProduct product, String uniqueKey) {
        try {
            Optional<InventoryItem> inventoryItemOpt = Optional.empty();

            if (product.getProductCode() != null && !product.getProductCode().isEmpty()) {
                inventoryItemOpt = inventoryItemRepository.findByProductCodeAndUniqueKey(
                        product.getProductCode(), uniqueKey);
            }

            if (!inventoryItemOpt.isPresent() && product.getProductName() != null) {
                List<InventoryItem> items = inventoryItemRepository.findBySearchTerm(
                        product.getProductName(), uniqueKey);
                if (!items.isEmpty()) {
                    inventoryItemOpt = Optional.of(items.get(0));
                }
            }

            if (inventoryItemOpt.isPresent()) {
                InventoryItem inventoryItem = inventoryItemOpt.get();
                Integer currentQuantity = inventoryItem.getQuantity() != null ? inventoryItem.getQuantity() : 0;
                Integer soldQuantity = product.getQuantity() != null ? product.getQuantity() : 1;
                Integer newQuantity = Math.max(0, currentQuantity - soldQuantity);

                inventoryItem.setQuantity(newQuantity);
                inventoryItemRepository.save(inventoryItem);

                System.out.println("Reduced inventory for " + product.getProductName()
                        + ": " + currentQuantity + " -> " + newQuantity + " (sold: " + soldQuantity + ")");

                if (newQuantity <= inventoryItem.getMinimumStock()) {
                    System.out.println("WARNING: Low stock for " + product.getProductName()
                            + ". Current: " + newQuantity + ", Minimum: " + inventoryItem.getMinimumStock());
                }
            } else {
                System.out.println("WARNING: No inventory item found for product: "
                        + product.getProductName() + " (Code: " + product.getProductCode() + ")");
            }
        } catch (Exception e) {
            System.err.println("Error reducing inventory for product " + product.getProductName() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public Optional<BillingRecord> updateBillingRecord(Long id, BillingRecord billingRecordDetails) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<BillingRecord> billingRecordOpt = billingRecordRepository.findById(id)
                .filter(record -> SecurityUtils.isAdmin() || uniqueKey.equals(record.getUniqueKey()));

        if (billingRecordOpt.isPresent()) {
            BillingRecord billingRecord = billingRecordOpt.get();

            if (billingRecordDetails.getBillNumber() != null) {
                billingRecord.setBillNumber(billingRecordDetails.getBillNumber());
            }
            if (billingRecordDetails.getBillDate() != null) {
                billingRecord.setBillDate(billingRecordDetails.getBillDate());
            }
            if (billingRecordDetails.getBranchCode() != null) {
                billingRecord.setBranchCode(billingRecordDetails.getBranchCode());
            }
            if (billingRecordDetails.getBranchName() != null) {
                billingRecord.setBranchName(billingRecordDetails.getBranchName());
            }
            if (billingRecordDetails.getCustomerName() != null) {
                billingRecord.setCustomerName(billingRecordDetails.getCustomerName());
            }
            if (billingRecordDetails.getCustomerContact() != null) {
                billingRecord.setCustomerContact(billingRecordDetails.getCustomerContact());
            }
            if (billingRecordDetails.getCustomerEmail() != null) {
                billingRecord.setCustomerEmail(billingRecordDetails.getCustomerEmail());
            }
            if (billingRecordDetails.getCustomerAddress() != null) {
                billingRecord.setCustomerAddress(billingRecordDetails.getCustomerAddress());
            }
            if (billingRecordDetails.getLensPowerRight() != null) {
                billingRecord.setLensPowerRight(billingRecordDetails.getLensPowerRight());
            }
            if (billingRecordDetails.getLensPowerLeft() != null) {
                billingRecord.setLensPowerLeft(billingRecordDetails.getLensPowerLeft());
            }
            if (billingRecordDetails.getPd() != null) {
                billingRecord.setPd(billingRecordDetails.getPd());
            }
            if (billingRecordDetails.getSphRight() != null) {
                billingRecord.setSphRight(billingRecordDetails.getSphRight());
            }
            if (billingRecordDetails.getCylRight() != null) {
                billingRecord.setCylRight(billingRecordDetails.getCylRight());
            }
            if (billingRecordDetails.getAxisRight() != null) {
                billingRecord.setAxisRight(billingRecordDetails.getAxisRight());
            }
            if (billingRecordDetails.getPdRight() != null) {
                billingRecord.setPdRight(billingRecordDetails.getPdRight());
            }
            if (billingRecordDetails.getSphLeft() != null) {
                billingRecord.setSphLeft(billingRecordDetails.getSphLeft());
            }
            if (billingRecordDetails.getCylLeft() != null) {
                billingRecord.setCylLeft(billingRecordDetails.getCylLeft());
            }
            if (billingRecordDetails.getAxisLeft() != null) {
                billingRecord.setAxisLeft(billingRecordDetails.getAxisLeft());
            }
            if (billingRecordDetails.getPdLeft() != null) {
                billingRecord.setPdLeft(billingRecordDetails.getPdLeft());
            }
            if (billingRecordDetails.getAdditionalNotes() != null) {
                billingRecord.setAdditionalNotes(billingRecordDetails.getAdditionalNotes());
            }
            if (billingRecordDetails.getSubtotal() != null) {
                billingRecord.setSubtotal(billingRecordDetails.getSubtotal());
            }
            if (billingRecordDetails.getTotalGst() != null) {
                billingRecord.setTotalGst(billingRecordDetails.getTotalGst());
            }
            if (billingRecordDetails.getAmount() != null) {
                billingRecord.setAmount(billingRecordDetails.getAmount());
            }
            if (billingRecordDetails.getDiscount() != null) {
                billingRecord.setDiscount(billingRecordDetails.getDiscount());
            }
            if (billingRecordDetails.getAdvancePaid() != null) {
                billingRecord.setAdvancePaid(billingRecordDetails.getAdvancePaid());
            }
            if (billingRecordDetails.getFinalPayable() != null) {
                billingRecord.setFinalPayable(billingRecordDetails.getFinalPayable());
            }
            if (billingRecordDetails.getPaymentMethod() != null) {
                billingRecord.setPaymentMethod(billingRecordDetails.getPaymentMethod());
            }
            if (billingRecordDetails.getTransactionRef() != null) {
                billingRecord.setTransactionRef(billingRecordDetails.getTransactionRef());
            }
            if (billingRecordDetails.getPaymentStatus() != null) {
                billingRecord.setPaymentStatus(billingRecordDetails.getPaymentStatus());
            }
            if (billingRecordDetails.getPaymentDate() != null) {
                billingRecord.setPaymentDate(billingRecordDetails.getPaymentDate());
            }
            if (billingRecordDetails.getWarrantyDetails() != null) {
                billingRecord.setWarrantyDetails(billingRecordDetails.getWarrantyDetails());
            }
            if (billingRecordDetails.getReturnPolicy() != null) {
                billingRecord.setReturnPolicy(billingRecordDetails.getReturnPolicy());
            }
            if (billingRecordDetails.getPrescriptionDeliveryDate() != null) {
                billingRecord.setPrescriptionDeliveryDate(billingRecordDetails.getPrescriptionDeliveryDate());
            }
            if (billingRecordDetails.getAuthorizedSignatory() != null) {
                billingRecord.setAuthorizedSignatory(billingRecordDetails.getAuthorizedSignatory());
            }
            if (billingRecordDetails.getProducts() != null) {
                billingRecord.setProducts(billingRecordDetails.getProducts());
            }

            return Optional.of(billingRecordRepository.save(billingRecord));
        }
        return Optional.empty();
    }

    public boolean deleteBillingRecord(Long id) {
        String uniqueKey = SecurityUtils.isAdmin() ? "GLOBAL_ADMIN" : SecurityUtils.getCurrentSupplierKey();
        Optional<BillingRecord> billingRecordOpt = billingRecordRepository.findById(id)
                .filter(record -> SecurityUtils.isAdmin() || uniqueKey.equals(record.getUniqueKey()));

        if (billingRecordOpt.isPresent()) {
            billingRecordRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private void updateCustomerBillingInfo(Customer customer, String billNumber, String billDate, Double amount) {
        Integer currentVisitCount = customer.getVisitCount() != null ? customer.getVisitCount() : 0;
        customer.setVisitCount(currentVisitCount + 1);

        try {
            LocalDate parsedBillDate = LocalDate.parse(billDate, DateTimeFormatter.ISO_LOCAL_DATE);
            customer.setLastVisitDate(parsedBillDate);
            customer.setDateOfVisit(parsedBillDate);
        } catch (Exception e) {
        }

        Double currentTotalSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : 0.0;
        customer.setTotalSpent(currentTotalSpent + amount);
        customer.setAverageBillAmount(customer.getTotalSpent() / customer.getVisitCount());
        customer.setLastBillNumber(billNumber);
        try {
            LocalDate parsedBillDate = LocalDate.parse(billDate, DateTimeFormatter.ISO_LOCAL_DATE);
            customer.setLastBillDate(parsedBillDate);
        } catch (Exception e) {
        }

        customerRepository.save(customer);
    }

    /**
     * Sync billing records to customers with row-level isolation.
     */
    @Transactional
    public Map<String, Object> syncBillingRecordsToCustomers() {
        if (SecurityUtils.isAdmin()) {
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Sync not allowed globally for Admin.");
            return result;
        }
        String uniqueKey = SecurityUtils.getCurrentSupplierKey();
        Map<String, Object> result = new HashMap<>();
        int totalRecords = 0;
        int customersCreated = 0;
        int customersUpdated = 0;

        List<BillingRecord> billingRecords = billingRecordRepository.findAllOrderByBillDateAscIdAsc(uniqueKey);
        totalRecords = billingRecords.size();
        Set<String> processedMobiles = new HashSet<>();

        for (BillingRecord br : billingRecords) {
            String mobile = br.getCustomerContact();
            if (mobile == null || mobile.isBlank() || !processedMobiles.add(mobile)) {
                continue;
            }

            List<BillingRecord> customerBills = billingRecordRepository.findCustomerBillingHistory(mobile, uniqueKey);
            if (customerBills.isEmpty()) {
                continue;
            }

            customerBills.sort(Comparator
                    .comparing(BillingRecord::getBillDate)
                    .thenComparing(BillingRecord::getId));

            BillingRecord latestBill = customerBills.get(customerBills.size() - 1);
            double totalSpent = customerBills.stream()
                    .map(BillingRecord::getFinalPayable)
                    .filter(amount -> amount != null)
                    .mapToDouble(BigDecimal::doubleValue)
                    .sum();

            Optional<Customer> existingCustomer = customerRepository.findByMobileNoAndUniqueKey(mobile, uniqueKey);
            Customer customer;

            if (existingCustomer.isPresent()) {
                customer = existingCustomer.get();
                if (customer.getSource() == Customer.CustomerSource.CUSTOMER_RECORD) {
                    customer.setSource(Customer.CustomerSource.COMBINED);
                }
                customersUpdated++;
            } else {
                customer = new Customer();
                customer.setUniqueKey(uniqueKey);
                customer.setBranchName(latestBill.getBranchName());
                customer.setBranchCode(latestBill.getBranchCode());
                customer.setTitle("-");
                customer.setFullName(latestBill.getCustomerName());
                customer.setMobileNo(latestBill.getCustomerContact());
                customer.setEmail(latestBill.getCustomerEmail());
                customer.setAddress(latestBill.getCustomerAddress());
                customer.setCity(deriveCityFromAddress(latestBill.getCustomerAddress()));
                customer.setSource(Customer.CustomerSource.BILLING_RECORD);
                customersCreated++;
            }

            customer.setBranchName(latestBill.getBranchName());
            customer.setBranchCode(latestBill.getBranchCode());
            customer.setFullName(latestBill.getCustomerName());
            customer.setAddress(latestBill.getCustomerAddress());
            if (latestBill.getCustomerEmail() != null && !latestBill.getCustomerEmail().isBlank()) {
                customer.setEmail(latestBill.getCustomerEmail());
            }
            if (customer.getCity() == null || customer.getCity().isBlank()) {
                customer.setCity(deriveCityFromAddress(latestBill.getCustomerAddress()));
            }
            customer.setVisitCount(customerBills.size());
            customer.setTotalSpent(totalSpent);
            customer.setAverageBillAmount(customerBills.isEmpty() ? 0.0 : totalSpent / customerBills.size());
            customer.setLastBillNumber(latestBill.getBillNumber());
            customer.setLastBillDate(latestBill.getBillDate());
            customer.setLastVisitDate(latestBill.getBillDate());
            customer.setDateOfVisit(latestBill.getBillDate());

            customer = customerRepository.save(customer);

            for (BillingRecord customerBill : customerBills) {
                customerBill.setCustomer(customer);
                billingRecordRepository.save(customerBill);
            }
        }

        result.put("totalBillingRecords", totalRecords);
        result.put("customersCreated", customersCreated);
        result.put("customersUpdated", customersUpdated);
        result.put("billingRecordsUpdated", totalRecords);

        System.out.println("Sync complete: " + totalRecords + " billing records, "
                + customersCreated + " customers created, " + customersUpdated + " customers updated");
        return result;
    }

    private String deriveCityFromAddress(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }

        String[] segments = address.split(",");
        if (segments.length >= 2) {
            String city = segments[segments.length - 2].trim();
            return city.isEmpty() ? null : city;
        }

        String normalized = address.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            return null;
        }

        String[] words = normalized.split(" ");
        return words.length == 0 ? null : words[words.length - 1].trim();
    }
}
