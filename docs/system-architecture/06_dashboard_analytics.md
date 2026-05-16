# Part 6 — Dashboard & Analytics

> 📂 Part of the [System Architecture Docs](./00_INDEX.md)

---

## 📊 Dashboard Overview

**Frontend**: `src/pages/supplier/Dashboard.tsx`  
**Service**: `src/services/dashboardService.ts`  
**Route**: `/supplier/dashboard`

> ⚠️ **IMPORTANT**: The dashboard reads from **JSON files** (not the live backend API). If data exists only in the H2 database, the dashboard will show stale or empty values.

---

## 🗂️ Data Sources

```
getDashboardData(timeFilter, year)
    ├── readDataFile('purchase-records.json')   → PurchaseData[]
    ├── readDataFile('billing-records.json')    → SalesData[]
    ├── readDataFile('customer-records.json')   → Customer[]
    └── readDataFile('inventory-records.json')  → InventoryItem[]
```

### Why JSON Files?
The `FileController.java` backend endpoint writes data to JSON files as a backup/sync mechanism. The dashboard reads those files because the service was built before the REST API was fully in place.

---

## 💰 Profit & Loss Calculation

### Formula
```
Net Profit = Total Sales Revenue - Cost of Goods Sold (COGS)

COGS per product = unitCost × quantity_sold + (unitCost × quantity_sold × gst%)

Profit Margin = (Net Profit / Total Sales Revenue) × 100%

Monthly Growth Rate = ((Current Month - Previous Month) / Previous Month) × 100%
```

### How COGS is Matched
```typescript
// dashboardService.ts
For each billing record product sold:
    1. Try match by productCode in inventory_items
    2. Try match by productName (case-insensitive)
    3. Try match by category (fallback — least accurate)
    
unitCost = matched inventoryItem.purchasePrice (or unitCost)
COGS += unitCost × soldQuantity + GST on cost
```

---

## 📈 Summary Stats Structure

```typescript
SummaryStats {
    totalPurchases: number   // Sum of all purchase totalAmounts
    totalSales: number       // Sum of all billing finalPayable amounts
    netProfit: number        // totalSales - COGS
    profitMargin: number     // % margin
    activeCustomers: number  // Unique customer count (from both sources)
    monthlyGrowth: number    // % change from last month
}
```

---

## 🗂️ Category Breakdown

| Aspect | Method Used |
|--------|------------|
| **Sales** | Counted by **quantity** (each item sold = 1 unit), NOT monetary |
| **Purchases** | Aggregated by monetary amount |
| **Percentage** | `(categorySalesCount / totalItemsSold) × 100` |

> ⚠️ Dashboard `processSalesData` uses `amount: 1` per item (count), not actual sale price. This means category percentages reflect item volume, not revenue share.

### Categories Tracked
- Spectacles
- Sunglasses
- Contact Lenses / Lens
- Frames
- Solutions
- Other / Non-Chargeable

---

## 🏢 Branch Performance

Branches tracked: `DIGL`, `MAYA`, `RANG`, `JUNG`

```
For each branch:
    branchSales    = sum of finalPayable where branchCode = branch
    branchPurchases = sum of totalAmount where branch = branchCode
    branchProfit   = branchSales - branchPurchases
```

---

## 📅 Time Filter Options

| Filter | Description |
|--------|------------|
| `thisMonth` | Current calendar month |
| `lastMonth` | Previous calendar month |
| `thisQuarter` | Current 3-month quarter |
| `thisYear` | Current year (default) |
| `lastYear` | Previous year |
| `custom` | User-selected date range |

---

## 📉 Monthly Trend Chart Data

```typescript
// 12 months of data built as:
MonthlyData[] = [
    { month: "Jan", sales: number, purchases: number, profit: number },
    ...
]

// Filtered by year parameter
// Returns all 12 months with 0 for months with no data
```

---

## 🔢 Key Metrics Exposed

| Metric | Source |
|--------|--------|
| Total Revenue | billing-records.json → sum of finalPayable |
| Total COGS | inventory-records.json crossed with billing |
| Net Profit | Revenue - COGS |
| Active Customers | customer-records.json count |
| Top Products | Most billed productName |
| Top Branches | Highest revenue branchCode |
| Low Stock Alerts | inventory quantity ≤ minimumStock |
| Monthly Growth % | (this month - last month) / last month |
