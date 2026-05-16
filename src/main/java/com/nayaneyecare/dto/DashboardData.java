package com.nayaneyecare.dto;

import java.util.List;

public class DashboardData {

    private List<PurchaseData> purchases;
    private List<SalesData> sales;
    private SummaryStats summary;
    private List<CategoryData> categoryBreakdown;
    private List<BranchData> branchPerformance;
    private List<RecentActivity> recentActivity;

    // Getters and Setters
    public List<PurchaseData> getPurchases() { return purchases; }
    public void setPurchases(List<PurchaseData> purchases) { this.purchases = purchases; }

    public List<SalesData> getSales() { return sales; }
    public void setSales(List<SalesData> sales) { this.sales = sales; }

    public SummaryStats getSummary() { return summary; }
    public void setSummary(SummaryStats summary) { this.summary = summary; }

    public List<CategoryData> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<CategoryData> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public List<BranchData> getBranchPerformance() { return branchPerformance; }
    public void setBranchPerformance(List<BranchData> branchPerformance) { this.branchPerformance = branchPerformance; }

    public List<RecentActivity> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<RecentActivity> recentActivity) { this.recentActivity = recentActivity; }

    // Inner classes
    public static class PurchaseData {
        private String date;
        private double amount;
        private String category;
        private String branch;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
    }

    public static class SalesData {
        private String date;
        private double amount;
        private double cost;
        private String category;
        private String branch;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        public double getCost() { return cost; }
        public void setCost(double cost) { this.cost = cost; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }
    }

    public static class SummaryStats {
        private double totalPurchases;
        private double totalSales;
        private double netProfit;
        private double profitMargin;
        private int activeCustomers;
        private double monthlyGrowth;

        public double getTotalPurchases() { return totalPurchases; }
        public void setTotalPurchases(double totalPurchases) { this.totalPurchases = totalPurchases; }
        public double getTotalSales() { return totalSales; }
        public void setTotalSales(double totalSales) { this.totalSales = totalSales; }
        public double getNetProfit() { return netProfit; }
        public void setNetProfit(double netProfit) { this.netProfit = netProfit; }
        public double getProfitMargin() { return profitMargin; }
        public void setProfitMargin(double profitMargin) { this.profitMargin = profitMargin; }
        public int getActiveCustomers() { return activeCustomers; }
        public void setActiveCustomers(int activeCustomers) { this.activeCustomers = activeCustomers; }
        public double getMonthlyGrowth() { return monthlyGrowth; }
        public void setMonthlyGrowth(double monthlyGrowth) { this.monthlyGrowth = monthlyGrowth; }
    }

    public static class CategoryData {
        private String category;
        private double sales;
        private double purchases;
        private double percentage;

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public double getSales() { return sales; }
        public void setSales(double sales) { this.sales = sales; }
        public double getPurchases() { return purchases; }
        public void setPurchases(double purchases) { this.purchases = purchases; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
    }

    public static class BranchData {
        private String name;
        private String code;
        private double sales;
        private double purchases;
        private double profit;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public double getSales() { return sales; }
        public void setSales(double sales) { this.sales = sales; }
        public double getPurchases() { return purchases; }
        public void setPurchases(double purchases) { this.purchases = purchases; }
        public double getProfit() { return profit; }
        public void setProfit(double profit) { this.profit = profit; }
    }

    public static class RecentActivity {
        private String type;
        private int count;
        private String title;
        private String description;
        private String icon;
        private String color;
        private String lastActivity;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public String getLastActivity() { return lastActivity; }
        public void setLastActivity(String lastActivity) { this.lastActivity = lastActivity; }
    }
}