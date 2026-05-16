# Part 1 — Technology Stack & Module Overview

> 📂 Part of the [System Architecture Docs](./00_INDEX.md)

---

## 📦 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Spring Boot (Java) + JPA/Hibernate |
| Database | H2 (embedded, file: `data/nayan-db.mv.db`) |
| Auth | JWT (sessionStorage) + Mock fallback |
| File Storage | JSON files (`data/`) + localStorage fallback |

---

## 🗂️ Module Overview

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/supplier/dashboard` | Analytics, P&L, charts |
| Purchase (Single) | `/supplier/purchase` | One product per bill |
| Bulk Purchase | `/supplier/bulk-purchase` | Multiple products per bill |
| Purchase History | `/supplier/purchase-history` | View/edit/delete purchases |
| Purchase Return | `/supplier/purchase-return` | Return goods to supplier |
| Inventory | `/supplier/inventory` | Stock tracking |
| New Billing | `/supplier/billing` | Create sales invoice |
| Billing Records | `/supplier/billing-records` | Sales history |
| Customers | `/supplier/customers` | Customer management |
| Sales Return | `/supplier/sales-return` | Return from customer |

---

## 🏢 Branch Codes

| Branch Name | Code |
|-------------|------|
| Junglighat | JUNG |
| Bathubasti | BATH |
| Diglipur | DIGL |
| Mayabunder | MAYA |
| Rangat | RANG |
| Havelock | HAVE |
| Neil Island | NEIL |

---

## 🔐 Authentication Flow

```
User opens app (/)
    ↓
authService.isAuthenticated()  (checks sessionStorage for token)
    ↓
If authenticated + userType === 'supplier'
    → Redirect to /supplier/dashboard
Else
    → Show Home (public customer-facing pages)
```

> ⚠️ **Current State**: Auth is mocked — hardcoded credentials:  
> `siddhesh@amityonline.com` / `Sameer123`  
> Auth state stored in `sessionStorage` (cleared on tab close).

---

## 🗺️ Frontend File Structure (Key Files)

```
src/
├── pages/
│   ├── supplier/
│   │   ├── Dashboard.tsx          ← Analytics dashboard
│   │   ├── Purchase.tsx           ← Single purchase form
│   │   ├── BulkPurchase.tsx       ← Bulk purchase form
│   │   ├── PurchaseHistory.tsx    ← Purchase records
│   │   ├── PurchaseReturn.tsx     ← Return to supplier
│   │   ├── Inventory.tsx          ← Stock view
│   │   ├── NewBilling.tsx         ← Create sale/invoice
│   │   ├── BillingRecords.tsx     ← Sales history (component)
│   │   ├── Customers.tsx          ← Customer management
│   │   └── SalesReturn.tsx        ← Return from customer
│   └── categories/
│       ├── Spectacles.tsx
│       ├── Sunglasses.tsx
│       ├── ContactLenses.tsx
│       ├── Frames.tsx
│       └── Solutions.tsx
├── services/
│   ├── authService.ts
│   ├── purchaseService.ts
│   ├── bulkPurchaseService.ts
│   ├── inventoryService.ts
│   ├── customerService.ts
│   ├── billingService.ts
│   └── dashboardService.ts
└── types/
    ├── auth.ts
    └── inventory.ts
```

---

## ☕ Backend File Structure (Key Files)

```
src/main/java/com/nayaneyecare/
├── entity/
│   ├── Purchase.java
│   ├── BulkPurchase.java
│   ├── PurchaseItem.java
│   ├── InventoryItem.java
│   ├── Customer.java
│   ├── BillingRecord.java
│   ├── BillingProduct.java
│   └── User.java
├── service/
│   ├── PurchaseService.java
│   ├── BulkPurchaseService.java
│   ├── InventoryItemService.java
│   ├── CustomerService.java
│   ├── BillingRecordService.java
│   └── AuthService.java
├── controller/
│   ├── PurchaseController.java
│   ├── BulkPurchaseController.java
│   ├── InventoryController.java
│   ├── CustomerController.java
│   ├── BillingRecordController.java
│   ├── AuthController.java
│   └── FileController.java
├── repository/          ← JPA Repositories (Spring Data)
├── dto/                 ← Request/Response DTOs
└── config/              ← CORS, Security config
```
