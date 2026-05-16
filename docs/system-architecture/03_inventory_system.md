# Part 3 — Inventory System

> 📂 Part of the [System Architecture Docs](./00_INDEX.md)

---

## 📦 Inventory Table Structure

**DB Table**: `inventory_items`  
**Java Entity**: `InventoryItem.java`  
**Key Unique Field**: `product_code`

| Field | Type | Notes |
|-------|------|-------|
| `id` | bigint PK | Auto-generated |
| `product_code` | string UNIQUE | Primary lookup key |
| `product_name` | string | |
| `category` | string | Spectacles / Frame / etc. |
| `subcategory` | string | |
| `description` | text | |
| `hsn_code` | string | GST HSN code |
| `quantity` | int | **Current stock level** |
| `purchase_price` | decimal | Cost from supplier |
| `selling_price` | decimal | Retail price |
| `gst_percentage` | decimal | |
| `supplier_name` | string | |
| `supplier_address` | text | |
| `supplier_gstin` | string | |
| `purchase_date` | date | Date of last purchase |
| `expiry_date` | date | For contact lenses / solutions |
| `minimum_stock` | int | Default: 0 (bulk sets 5) |
| `maximum_stock` | int | Default: null (bulk sets qty×2) |
| `reorder_point` | int | Default: 0 (bulk sets 10) |
| `remarks` | text | |
| `created_at` | datetime | Auto-set on insert |
| `updated_at` | datetime | Auto-set on update |

---

## ➕ Stock Increment (After Purchase)

### Triggered by Single Purchase
```
PurchaseService.java → updateInventoryFromPurchase()

findByProductCode(productCode)
    ├── FOUND → existingItem.quantity += purchasedQty
    │            save(existingItem)
    └── NOT FOUND → create new InventoryItem
                     set all fields from Purchase
                     save(newItem)
```

### Triggered by Bulk Purchase
```
BulkPurchaseService.java → updateInventoryFromBulkPurchase()

foreach PurchaseItem in bulkPurchase:
    findByProductCode(item.productCode)
    ├── FOUND → existingItem.quantity += item.quantity
    │            update purchaseDate if newer
    │            save(existingItem)
    └── NOT FOUND → create new InventoryItem
                     sellingPrice = purchasePrice × 1.30  ← 30% markup
                     minimumStock = 5
                     maximumStock = item.quantity × 2
                     reorderPoint = 10
                     save(newItem)
```

> ⚠️ Both paths update the **same `inventory_items` table** — single and bulk purchases share unified inventory.

---

## ➖ Stock Decrement (After Sale)

```
BillingRecordService.java → reduceInventoryFromSale()
    ↓
foreach BillingProduct in billingRecord:
    reduceInventoryForProduct(product)
    ↓
    Step 1: find by productCode  → inventoryItemRepository.findByProductCode()
    Step 2: if not found → find by productName (fallback search)
    Step 3: if found:
        newQty = max(0, currentQty - soldQty)
        inventoryItem.quantity = newQty
        save(inventoryItem)
    Step 4: if newQty ≤ minimumStock → log WARNING (no alert sent to frontend)
```

### Low Stock Warning Logic
```java
if (newQuantity <= inventoryItem.getMinimumStock()) {
    // Only prints to server console — NOT surfaced to frontend UI
    System.out.println("WARNING: Low stock for " + product.getProductName());
}
```

> ⚠️ Low stock alerts are only printed server-side, not sent to the frontend.

---

## 🔄 Stock Adjustment (Returns) — INCOMPLETE

### Sales Return (Customer Returns Product)
```
SalesReturn.tsx → handleSaveReturn()
    ↓
Creates SalesReturnRecord (in memory + localStorage)
    ↓
❌ MISSING: inventoryItem.quantity += returnQty   ← stock NOT restored
❌ MISSING: POST to backend API
```

### Purchase Return (Goods Sent Back to Supplier)
```
PurchaseReturn.tsx → handleSaveReturn()
    ↓
Creates PurchaseReturnRecord (in memory + localStorage)
    ↓
❌ MISSING: inventoryItem.quantity -= returnQty   ← stock NOT deducted
❌ MISSING: POST to backend API
```

> ⚠️ **Impact**: After a Sales Return, the inventory shows lower stock than actual physical stock. After a Purchase Return, inventory shows higher stock than actual physical stock. Both cause inaccurate stock levels.

---

## 🖥️ Frontend Inventory Service

**File**: `src/services/inventoryService.ts`

Key methods:
```typescript
inventoryService.refreshInventory()    // Fetches all inventory from backend
inventoryService.addStock(productCode, qty)    // Increment stock
inventoryService.removeStock(productCode, qty) // Decrement stock
inventoryService.getInventory()        // Get current in-memory state
```

> These frontend methods exist but the **return pages do not call them**.

---

## ⚠️ Known Field Naming Inconsistency

| TypeScript (`inventory.ts`) | Java (`InventoryItem.java`) |
|-----------------------------|-----------------------------|
| `currentStock` | `quantity` |
| `movements[]` (array defined) | ❌ Not in Java entity |
| `unitCost` | `purchasePrice` |
| `estimatedSalesPrice` | `sellingPrice` |

The TypeScript type has more fields than the backend entity, causing partial data mapping.
