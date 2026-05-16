# Part 2 — Purchase & Supplier Flow

> 📂 Part of the [System Architecture Docs](./00_INDEX.md)

---

## 🔄 Single Purchase Flow

**Frontend**: `src/pages/supplier/Purchase.tsx`  
**Service**: `src/services/purchaseService.ts`  
**Backend**: `PurchaseService.java` → `PurchaseController.java`  
**DB Table**: `purchases`

```
User fills Purchase Form
        ↓
purchaseService.appendPurchaseData(purchaseData)
        ↓
  → POST /api/purchases  (backend REST endpoint)
  → Backend saves to H2 `purchases` table
  → Backend auto-creates/updates InventoryItem  ← KEY STEP
        ↓
purchaseService.saveToLocalFile()  (backup to purchase-records.json)
        ↓
inventoryService.refreshInventory()  (refresh frontend state cache)
```

### PurchaseData Fields (TypeScript Interface)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID |
| `purchaseBillNo` | string | **UNIQUE** |
| `purchaseDate` | string | ISO date |
| `branch` | string | e.g. JUNG, DIGL |
| `materialName` | string | Product name |
| `productCode` | string | Used for inventory match |
| `productDescription` | string | Full description |
| `category` | enum | Spectacles / Sunglasses / Lens / Contact Lens / Frame / Solution / Other / Non-Chargeable |
| `subcategory` | string | |
| `hsn` | string | GST HSN code |
| `quantity` | number | |
| `purchasePrice` | number | Per unit |
| `inputGSTPercent` | number | |
| `inputGSTAmount` | number | |
| `totalAmount` | number | |
| `supplier.name` | string | |
| `supplier.address` | string | |
| `supplier.gstin` | string | |
| `remarks` | string | Optional |

---

## 🔄 Bulk Purchase Flow

**Frontend**: `src/pages/supplier/BulkPurchase.tsx`  
**Service**: `src/services/bulkPurchaseService.ts`  
**Backend**: `BulkPurchaseService.java` → `BulkPurchaseController.java`  
**DB Tables**: `bulk_purchases` + `purchase_items`

```
User fills Bulk Purchase Form (1 bill → multiple products)
        ↓
bulkPurchaseService.createBulkPurchase(bulkPurchaseData)
        ↓
  → POST /api/bulk-purchases  (backend REST endpoint)
  → Creates BulkPurchase header record
  → Creates child PurchaseItems (cascade save)
  → For EACH PurchaseItem:
       findByProductCode() in inventory_items
       ├── if EXISTS → quantity += soldQty
       └── if NEW → create InventoryItem (sellingPrice = purchasePrice × 1.30)
```

> ⚠️ **Note**: The 30% markup for selling price is **hardcoded** in `BulkPurchaseService.java` line 157.  
> Single purchases do NOT apply this markup.

### BulkPurchase Header Fields

| Field | Type | Notes |
|-------|------|-------|
| `purchaseBillNo` | string | **UNIQUE** |
| `purchaseDate` | date | |
| `branch` | string | |
| `supplierName` | string | |
| `supplierAddress` | string | |
| `supplierGstin` | string | |
| `remarks` | string | |
| `totalBillAmount` | decimal | Auto-calculated from items |
| `totalGstAmount` | decimal | Auto-calculated from items |

### PurchaseItem Fields (per product in bulk)

| Field | Type | Notes |
|-------|------|-------|
| `materialName` | string | |
| `productCode` | string | Used for inventory lookup |
| `productDescription` | string | |
| `category` | enum | Same 8 categories |
| `subcategory` | string | |
| `hsn` | string | |
| `quantity` | int | |
| `purchasePrice` | decimal | |
| `inputGSTPercent` | decimal | |
| `inputGSTAmount` | decimal | |
| `totalAmount` | decimal | |
| **Conditional (Spectacles/Frames)** | | color, size, type, gender, shape, material, templeDetails, bridgeSize |
| **Conditional (Lens)** | | lensDetail, lensCoating, design, lensIndex, lensNumber, lensAddition, lensAxis, lensNumberRange |
| **Conditional (Contact Lenses)** | | lensProductName, ct, baseCurve, diameter, modality, validity, waterContent, dkt |
| **Conditional (Solutions)** | | solutionName, variant, packingType |
| **Conditional (Other/Non-Chargeable)** | | name |

---

## 🔁 Category Mapping (Frontend → Backend)

| Frontend Display | Java Enum Value |
|-----------------|----------------|
| Spectacles | `SPECTACLES` |
| Frame | `FRAMES` |
| Contact Lens | `CONTACT_LENSES` |
| Sunglasses | `SUNGLASSES` |
| Lens | `LENS` |
| Solution | `SOLUTIONS` |
| Other | `OTHER` |
| Non-Chargeable | `NON_CHARGEABLE` |

---

## 📂 Data Persistence (Dual-Layer)

Both purchase types use a dual-layer storage:

```
Layer 1 (Primary):   H2 Database via Spring Boot REST API
Layer 2 (Fallback):  JSON files in /data/ directory
                     └── purchase-records.json
```

If the backend API at `localhost:8080` is **unreachable**, the frontend falls back to:
1. Reading from `localStorage`
2. Reading from `/data/purchase-records.json` (static file)
