package com.nayaneyecare.service;

import com.nayaneyecare.dto.DashboardData;
import com.nayaneyecare.dto.PurchaseHistoryDTO;
import com.nayaneyecare.entity.BillingProduct;
import com.nayaneyecare.entity.BillingRecord;
import com.nayaneyecare.entity.Branch;
import com.nayaneyecare.entity.Customer;
import com.nayaneyecare.repository.BillingRecordRepository;
import com.nayaneyecare.repository.BranchRepository;
import com.nayaneyecare.repository.CustomerRepository;
import com.nayaneyecare.util.SecurityUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final BillingRecordRepository billingRecordRepository;
    private final CustomerRepository customerRepository;
    private final PurchaseHistoryService purchaseHistoryService;
    private final BranchRepository branchRepository;

    public DashboardService(
            BillingRecordRepository billingRecordRepository,
            CustomerRepository customerRepository,
            PurchaseHistoryService purchaseHistoryService,
            BranchRepository branchRepository
    ) {
        this.billingRecordRepository = billingRecordRepository;
        this.customerRepository = customerRepository;
        this.purchaseHistoryService = purchaseHistoryService;
        this.branchRepository = branchRepository;
    }

    /**
     * Get dashboard data filtered by the current supplier's unique key.
     */
    @Transactional(readOnly = true)
    public CompletableFuture<DashboardData> getDashboardData(String timeFilter, int year, String uniqueKey) {
        boolean isAdmin = SecurityUtils.isAdmin();
        return CompletableFuture.supplyAsync(() -> {
            List<PurchaseHistoryDTO> purchaseHistory;
            List<BillingRecord> billingRecords;
            List<Customer> customers;

            if (isAdmin) {
                purchaseHistory = purchaseHistoryService.getGlobalPurchaseHistory();
                billingRecords = billingRecordRepository.queryAllGlobalWithProducts();
                customers = customerRepository.queryAllGlobal();
            } else {
                purchaseHistory = purchaseHistoryService.getPurchaseHistory(uniqueKey);
                billingRecords = billingRecordRepository.findAllWithProducts(uniqueKey);
                customers = customerRepository.findAllByUniqueKey(uniqueKey);
            }

            List<DashboardData.PurchaseData> purchases = processPurchaseData(purchaseHistory);
            List<DashboardData.SalesData> sales = processSalesData(billingRecords, purchaseHistory);

            DashboardData dashboardData = new DashboardData();
            dashboardData.setPurchases(purchases);
            dashboardData.setSales(sales);
            dashboardData.setSummary(calculateSummaryStats(purchases, sales, customers));
            dashboardData.setCategoryBreakdown(calculateCategoryBreakdown(purchases, sales, timeFilter, year));
            dashboardData.setBranchPerformance(calculateBranchPerformance(purchases, sales, timeFilter, year, uniqueKey));
            dashboardData.setRecentActivity(calculateRecentActivity(purchaseHistory, billingRecords, customers));
            return dashboardData;
        });
    }

    public CompletableFuture<DashboardData.SummaryStats> getSummaryStats(String timeFilter, int year, String uniqueKey) {
        return getDashboardData(timeFilter, year, uniqueKey).thenApply(DashboardData::getSummary);
    }

    public CompletableFuture<List<DashboardData.CategoryData>> getCategoryBreakdown(String timeFilter, int year, String uniqueKey) {
        return getDashboardData(timeFilter, year, uniqueKey).thenApply(DashboardData::getCategoryBreakdown);
    }

    public CompletableFuture<List<DashboardData.BranchData>> getBranchPerformance(String timeFilter, int year, String uniqueKey) {
        return getDashboardData(timeFilter, year, uniqueKey).thenApply(DashboardData::getBranchPerformance);
    }

    public CompletableFuture<List<DashboardData.RecentActivity>> getRecentActivity(String timeFilter, int year, String uniqueKey) {
        return getDashboardData(timeFilter, year, uniqueKey).thenApply(DashboardData::getRecentActivity);
    }

    private List<DashboardData.PurchaseData> processPurchaseData(List<PurchaseHistoryDTO> purchases) {
        return purchases.stream()
                .map(this::toPurchaseData)
                .collect(Collectors.toList());
    }

    private DashboardData.PurchaseData toPurchaseData(PurchaseHistoryDTO purchase) {
        DashboardData.PurchaseData data = new DashboardData.PurchaseData();
        data.setDate(purchase.getPurchaseDate() != null ? purchase.getPurchaseDate().toString() : "");
        data.setAmount(toDouble(purchase.getTotalAmount()));
        data.setCategory(normalizeCategory(purchase.getCategory()));
        data.setBranch(normalizeBranchCode(purchase.getBranch()));
        return data;
    }

    private List<DashboardData.SalesData> processSalesData(List<BillingRecord> billingRecords, List<PurchaseHistoryDTO> purchaseHistory) {
        Map<String, List<PurchaseHistoryDTO>> purchaseHistoryByProductCode = purchaseHistory.stream()
                .filter(item -> item.getProductCode() != null && !item.getProductCode().isBlank())
                .sorted(Comparator.comparing(PurchaseHistoryDTO::getPurchaseDate, Comparator.nullsLast(LocalDate::compareTo)))
                .collect(Collectors.groupingBy(item -> item.getProductCode().trim().toUpperCase(Locale.ROOT)));

        List<DashboardData.SalesData> result = new ArrayList<>();

        for (BillingRecord billingRecord : billingRecords) {
            double billAmount = toDouble(billingRecord.getAmount());
            
            // Calculate sum of all product totals to distribute the bill-level amount/discounts
            double totalProductGross = 0;
            if (billingRecord.getProducts() != null) {
                totalProductGross = billingRecord.getProducts().stream()
                        .filter(p -> p != null && p.getTotal() != null)
                        .mapToDouble(p -> p.getTotal().doubleValue())
                        .sum();
            }
            
            // Factor to adjust product totals so they sum up to exactly billingRecord.getAmount()
            double distributionFactor = (totalProductGross > 0) ? (billAmount / totalProductGross) : 1.0;

            if (billingRecord.getProducts() == null || billingRecord.getProducts().isEmpty()) {
                DashboardData.SalesData summarySale = new DashboardData.SalesData();
                summarySale.setDate(billingRecord.getBillDate() != null ? billingRecord.getBillDate().toString() : "");
                summarySale.setAmount(billAmount);
                summarySale.setCost(estimateInvoiceCost(billingRecord, purchaseHistoryByProductCode));
                summarySale.setCategory("Invoice");
                summarySale.setBranch(normalizeBranchCode(billingRecord.getBranchCode()));
                result.add(summarySale);
                continue;
            }

            for (BillingProduct product : billingRecord.getProducts()) {
                if (product == null) continue;
                
                DashboardData.SalesData salesData = new DashboardData.SalesData();
                salesData.setDate(billingRecord.getBillDate() != null ? billingRecord.getBillDate().toString() : "");
                // Scale individual product totals to match the record-level 'amount' field
                salesData.setAmount(toDouble(product.getTotal()) * distributionFactor);
                salesData.setCost(estimateProductCost(product, billingRecord.getBillDate(), purchaseHistoryByProductCode));
                salesData.setCategory(normalizeCategory(product.getCategory()));
                salesData.setBranch(normalizeBranchCode(billingRecord.getBranchCode()));
                result.add(salesData);
            }
        }

        return result;
    }

    private double estimateInvoiceCost(BillingRecord billingRecord, Map<String, List<PurchaseHistoryDTO>> purchaseHistoryByProductCode) {
        if (billingRecord.getProducts() == null) {
            return 0;
        }

        return billingRecord.getProducts().stream()
                .mapToDouble(product -> estimateProductCost(product, billingRecord.getBillDate(), purchaseHistoryByProductCode))
                .sum();
    }

    private double estimateProductCost(
            BillingProduct product,
            LocalDate billDate,
            Map<String, List<PurchaseHistoryDTO>> purchaseHistoryByProductCode
    ) {
        if (product.getProductCode() == null || product.getProductCode().isBlank()) {
            return 0;
        }

        String productCode = product.getProductCode().trim().toUpperCase(Locale.ROOT);
        List<PurchaseHistoryDTO> history = purchaseHistoryByProductCode.get(productCode);
        if (history == null || history.isEmpty()) {
            return 0;
        }

        PurchaseHistoryDTO matchedPurchase = null;
        for (PurchaseHistoryDTO purchase : history) {
            if (purchase.getPurchaseDate() == null) {
                continue;
            }
            if (billDate == null || !purchase.getPurchaseDate().isAfter(billDate)) {
                matchedPurchase = purchase;
            } else {
                break;
            }
        }

        if (matchedPurchase == null) {
            matchedPurchase = history.get(history.size() - 1);
        }

        double quantity = product.getQuantity() != null ? product.getQuantity() : 0;
        double unitCost = toDouble(matchedPurchase.getPurchasePrice());
        double gstPercent = toDouble(matchedPurchase.getInputGSTPercent());
        double baseCost = unitCost * quantity;
        return baseCost + ((baseCost * gstPercent) / 100.0);
    }

    private DashboardData.SummaryStats calculateSummaryStats(
            List<DashboardData.PurchaseData> purchases,
            List<DashboardData.SalesData> sales,
            List<Customer> customers
    ) {
        double totalPurchases = purchases.stream().mapToDouble(DashboardData.PurchaseData::getAmount).sum();
        double totalSales = sales.stream().mapToDouble(DashboardData.SalesData::getAmount).sum();
        double totalCost = sales.stream().mapToDouble(DashboardData.SalesData::getCost).sum();
        double netProfit = totalSales - totalCost;
        double profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

        DashboardData.SummaryStats stats = new DashboardData.SummaryStats();
        stats.setTotalPurchases(totalPurchases);
        stats.setTotalSales(totalSales);
        stats.setNetProfit(netProfit);
        stats.setProfitMargin(roundOneDecimal(profitMargin));
        stats.setActiveCustomers(customers.size());
        stats.setMonthlyGrowth(calculateMonthlyGrowth(sales));
        return stats;
    }

    private double calculateMonthlyGrowth(List<DashboardData.SalesData> sales) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        double currentMonthSales = sales.stream()
                .filter(sale -> matchesYearMonth(sale.getDate(), currentMonth))
                .mapToDouble(DashboardData.SalesData::getAmount)
                .sum();

        double previousMonthSales = sales.stream()
                .filter(sale -> matchesYearMonth(sale.getDate(), previousMonth))
                .mapToDouble(DashboardData.SalesData::getAmount)
                .sum();

        if (previousMonthSales <= 0) {
            return currentMonthSales > 0 ? 100.0 : 0.0;
        }

        return roundOneDecimal(((currentMonthSales - previousMonthSales) / previousMonthSales) * 100.0);
    }

    private boolean matchesYearMonth(String dateValue, YearMonth yearMonth) {
        LocalDate date = parseDate(dateValue);
        return date != null && YearMonth.from(date).equals(yearMonth);
    }

    private List<DashboardData.CategoryData> calculateCategoryBreakdown(
            List<DashboardData.PurchaseData> purchases,
            List<DashboardData.SalesData> sales,
            String timeFilter,
            int year
    ) {
        List<DashboardData.PurchaseData> filteredPurchases = filterPurchasesByTime(purchases, timeFilter, year);
        List<DashboardData.SalesData> filteredSales = filterSalesByTime(sales, timeFilter, year);

        Map<String, double[]> categoryMap = new HashMap<>();

        for (DashboardData.PurchaseData purchase : filteredPurchases) {
            double[] values = categoryMap.getOrDefault(purchase.getCategory(), new double[2]);
            values[1] += purchase.getAmount();
            categoryMap.put(purchase.getCategory(), values);
        }

        for (DashboardData.SalesData sale : filteredSales) {
            double[] values = categoryMap.getOrDefault(sale.getCategory(), new double[2]);
            values[0] += sale.getAmount();
            categoryMap.put(sale.getCategory(), values);
        }

        double totalSalesAmount = filteredSales.stream().mapToDouble(DashboardData.SalesData::getAmount).sum();

        return categoryMap.entrySet().stream()
                .map(entry -> {
                    DashboardData.CategoryData data = new DashboardData.CategoryData();
                    data.setCategory(entry.getKey());
                    data.setSales(entry.getValue()[0]);
                    data.setPurchases(entry.getValue()[1]);
                    data.setPercentage(totalSalesAmount > 0 ? Math.round((entry.getValue()[0] / totalSalesAmount) * 100.0) : 0);
                    return data;
                })
                .sorted(Comparator.comparing(DashboardData.CategoryData::getPercentage).reversed())
                .collect(Collectors.toList());
    }

    private List<DashboardData.BranchData> calculateBranchPerformance(
            List<DashboardData.PurchaseData> purchases,
            List<DashboardData.SalesData> sales,
            String timeFilter,
            int year,
            String uniqueKey
    ) {
        List<DashboardData.PurchaseData> filteredPurchases = filterPurchasesByTime(purchases, timeFilter, year);
        List<DashboardData.SalesData> filteredSales = filterSalesByTime(sales, timeFilter, year);

        Map<String, double[]> branchMap = new HashMap<>();

        for (DashboardData.PurchaseData purchase : filteredPurchases) {
            double[] values = branchMap.getOrDefault(purchase.getBranch(), new double[3]);
            values[1] += purchase.getAmount();
            branchMap.put(purchase.getBranch(), values);
        }

        for (DashboardData.SalesData sale : filteredSales) {
            double[] values = branchMap.getOrDefault(sale.getBranch(), new double[3]);
            values[0] += sale.getAmount();
            values[2] += sale.getCost();
            branchMap.put(sale.getBranch(), values);
        }

        return branchMap.entrySet().stream()
                .map(entry -> {
                    DashboardData.BranchData data = new DashboardData.BranchData();
                    data.setCode(entry.getKey());
                    data.setName(resolveBranchName(entry.getKey(), uniqueKey));
                    data.setSales(entry.getValue()[0]);
                    data.setPurchases(entry.getValue()[1]);
                    data.setProfit(entry.getValue()[0] - entry.getValue()[2]);
                    return data;
                })
                .sorted(Comparator.comparing(DashboardData.BranchData::getSales).reversed())
                .collect(Collectors.toList());
    }

    private List<DashboardData.RecentActivity> calculateRecentActivity(
            List<PurchaseHistoryDTO> purchaseHistory,
            List<BillingRecord> billingRecords,
            List<Customer> customers
    ) {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<DashboardData.RecentActivity> activities = new ArrayList<>();

        long recentPurchases = purchaseHistory.stream()
                .filter(item -> item.getPurchaseDate() != null && !item.getPurchaseDate().atStartOfDay().isBefore(cutoff))
                .count();

        if (recentPurchases > 0) {
            activities.add(buildRecentActivity(
                    "purchase",
                    (int) recentPurchases,
                    "Purchase Orders",
                    recentPurchases + " new purchase" + (recentPurchases > 1 ? "s" : "") + " in last 24 hours",
                    "package",
                    "green",
                    latestPurchaseTime(purchaseHistory)
            ));
        }

        long recentSales = billingRecords.stream()
                .filter(record -> record.getCreatedAt() != null && !record.getCreatedAt().isBefore(cutoff))
                .count();

        if (recentSales > 0) {
            activities.add(buildRecentActivity(
                    "sale",
                    (int) recentSales,
                    "Invoices Created",
                    recentSales + " new invoice" + (recentSales > 1 ? "s" : "") + " in last 24 hours",
                    "receipt",
                    "blue",
                    billingRecords.stream()
                            .map(BillingRecord::getCreatedAt)
                            .filter(value -> value != null)
                            .max(LocalDateTime::compareTo)
                            .orElse(null)
            ));
        }

        long recentCustomers = customers.stream()
                .filter(customer -> customer.getCreatedAt() != null && !customer.getCreatedAt().isBefore(cutoff))
                .count();

        if (recentCustomers > 0) {
            activities.add(buildRecentActivity(
                    "customer",
                    (int) recentCustomers,
                    "Customers Registered",
                    recentCustomers + " new customer" + (recentCustomers > 1 ? "s" : "") + " in last 24 hours",
                    "user",
                    "purple",
                    customers.stream()
                            .map(Customer::getCreatedAt)
                            .filter(value -> value != null)
                            .max(LocalDateTime::compareTo)
                            .orElse(null)
            ));
        }

        if (activities.isEmpty()) {
            activities.add(buildRecentActivity(
                    "info",
                    0,
                    "No Recent Activity",
                    "No new records in the last 24 hours",
                    "info",
                    "gray",
                    null
            ));
        }

        return activities;
    }

    private LocalDateTime latestPurchaseTime(List<PurchaseHistoryDTO> purchaseHistory) {
        return purchaseHistory.stream()
                .map(PurchaseHistoryDTO::getPurchaseDate)
                .filter(value -> value != null)
                .map(LocalDate::atStartOfDay)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private DashboardData.RecentActivity buildRecentActivity(
            String type,
            int count,
            String title,
            String description,
            String icon,
            String color,
            LocalDateTime latestAt
    ) {
        DashboardData.RecentActivity activity = new DashboardData.RecentActivity();
        activity.setType(type);
        activity.setCount(count);
        activity.setTitle(title);
        activity.setDescription(description);
        activity.setIcon(icon);
        activity.setColor(color);
        activity.setLastActivity(formatRelativeTime(latestAt));
        return activity;
    }

    private String formatRelativeTime(LocalDateTime value) {
        if (value == null) {
            return "No activity";
        }

        Duration duration = Duration.between(value, LocalDateTime.now());
        long hours = Math.max(0, duration.toHours());
        if (hours < 1) {
            long minutes = Math.max(1, duration.toMinutes());
            return minutes + "m ago";
        }
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = Math.max(1, duration.toDays());
        return days + "d ago";
    }

    private List<DashboardData.PurchaseData> filterPurchasesByTime(List<DashboardData.PurchaseData> data, String timeFilter, int year) {
        return data.stream()
                .filter(item -> matchesTimeFilter(item.getDate(), timeFilter, year))
                .collect(Collectors.toList());
    }

    private List<DashboardData.SalesData> filterSalesByTime(List<DashboardData.SalesData> data, String timeFilter, int year) {
        return data.stream()
                .filter(item -> matchesTimeFilter(item.getDate(), timeFilter, year))
                .collect(Collectors.toList());
    }

    private boolean matchesTimeFilter(String dateValue, String timeFilter, int year) {
        LocalDate parsedDate = parseDate(dateValue);
        if (parsedDate == null || parsedDate.getYear() != year) {
            return false;
        }

        String normalizedFilter = timeFilter == null ? "yearly" : timeFilter.trim().toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now();

        switch (normalizedFilter) {
            case "daily":
                // If it's a different year, don't show daily unless we specifically want a date selector
                // For now, allow daily for current year's today
                return parsedDate.equals(today);
            case "monthly":
                // For monthly view in the dashboard, we usually want to show everything for that year
                // but allow specific filtering if needed. 
                // Fix: If we are in the selected year, only show up to the current month? 
                // No, a year view should show the whole year.
                // Reducing strictness to show data for the selected year regardless of current month.
                return true; 
            case "yearly":
            default:
                return true;
        }
    }

    private LocalDate parseDate(String dateValue) {
        if (dateValue == null || dateValue.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(dateValue);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) {
            return "Other";
        }

        switch (rawCategory.trim().toUpperCase(Locale.ROOT)) {
            case "SPECTACLES":
                return "Spectacles";
            case "SUNGLASSES":
                return "Sunglasses";
            case "LENS":
                return "Lens";
            case "CONTACT_LENSES":
                return "Contact Lenses";
            case "FRAMES":
                return "Frames";
            case "SOLUTIONS":
                return "Solutions";
            case "NON_CHARGEABLE":
                return "Non-Chargeable";
            case "OTHER":
                return "Other";
            default:
                return rawCategory;
        }
    }

    private String normalizeBranchCode(String branch) {
        if (branch == null || branch.isBlank()) {
            return "Unknown";
        }
        return branch.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveBranchName(String branchCode, String uniqueKey) {
        String normalized = normalizeBranchCode(branchCode);
        if (normalized.equals("UNKNOWN")) {
            return branchCode;
        }
        return branchRepository.findByCodeAndUniqueKey(normalized, uniqueKey)
                .map(Branch::getName)
                .orElse(branchCode);
    }

    private double toDouble(BigDecimal value) {
        return value == null ? 0.0 : value.doubleValue();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}