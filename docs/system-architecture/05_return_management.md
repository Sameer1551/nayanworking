# Part 5 — Return Management

> 📂 Part of the [System Architecture Docs](./00_INDEX.md)

> ⚠️ **STATUS: INCOMPLETE** — Both return types currently only use `localStorage`. No backend API or inventory updates exist.

---

## 🔄 Sales Return (Customer → System)

**Frontend**: `src/pages/supplier/SalesReturn.tsx`  
**Backend**: ❌ No backend entity/API exists  
**Storage**: `localStorage['salesReturns']` only

### Current Flow
```
Customer returns a product
        ↓
SalesReturn.tsx → handleSaveReturn()
        ↓
Validate form: returnQty ≤ originalQty
        ↓
Create SalesReturnRecord in memory:
  {
    id: `return_${Date.now()}`,
    returnDate,
    originalSaleBillNo,       ← manually entered
    serialNo,
    branch,
    customerName, customerContact, customerEmail, customerAddress,
    productName, productCode, category, subcategory, hsn,
    returnQuantity, originalQuantity,
    salePrice, outputGSTPercent, outputGSTAmount, totalAmount,
    returnReason,  ← selected from dropdown
    remarks
  }
        ↓
localStorage['salesReturns'] = JSON.stringify(updatedReturns)
```

### Return Reasons (Dropdown Options)
- Defective Product
- Wrong Specification
- Damaged in Transit
- Quality Issues
- Wrong Size/Model
- Customer Dissatisfaction
- Other

### ❌ What's MISSING (Sales Return)

| Missing Action | Should Do | API Needed |
|---------------|----------|------------|
| Restore inventory | `inventoryItem.quantity += returnQty` | `PUT /api/inventory/{productCode}/addStock` |
| Save to backend | Persist in DB | `POST /api/sales-returns` |
| Reduce billing revenue | Update P&L | Update billing record status |
| Credit note generation | Issue refund document | New feature needed |

---

## 🔄 Purchase Return (System → Supplier)

**Frontend**: `src/pages/supplier/PurchaseReturn.tsx`  
**Backend**: ❌ No backend entity/API exists  
**Storage**: `localStorage['purchaseReturns']` only

### Current Flow
```
Supplier is sent back rejected goods
        ↓
PurchaseReturn.tsx → handleSaveReturn()
        ↓
Validate form: returnQty ≤ originalQty
        ↓
Create PurchaseReturnRecord in memory:
  {
    id: `return_${Date.now()}`,
    returnDate,
    originalPurchaseBillNo,   ← manually entered or selected
    branch,
    materialName, productCode, productDescription,
    category, subcategory, hsn,
    returnQuantity, originalQuantity,
    purchasePrice, inputGSTPercent, inputGSTAmount, totalAmount,
    returnReason,
    supplier: { name, address, gstin },
    remarks
  }
        ↓
localStorage['purchaseReturns'] = JSON.stringify(updatedReturns)
```

### Special: Delete Purchase Return (Partial Restore)
When a purchase return is **deleted**, the code tries to restore the quantity:
```typescript
// PurchaseReturn.tsx → handleDeleteReturn()
if (existingPurchase found in purchases[]) {
    // Update quantity in local state only
    purchase.quantity += returnRecord.returnQuantity
} else {
    // Re-create the purchase record in local state
}
// Still NO backend API call
```

### ❌ What's MISSING (Purchase Return)

| Missing Action | Should Do | API Needed |
|---------------|----------|------------|
| Deduct inventory | `inventoryItem.quantity -= returnQty` | `PUT /api/inventory/{productCode}/removeStock` |
| Save to backend | Persist in DB | `POST /api/purchase-returns` |
| Reduce purchase cost | Update P&L | Update purchase record |
| Debit note generation | Issue return document | New feature needed |

---

## 📋 Proposed SalesReturn Entity (Future)

```java
@Entity
@Table(name = "sales_returns")
public class SalesReturn {
    @Id @GeneratedValue
    private Long id;
    
    private LocalDate returnDate;
    private String originalBillNumber;  // FK reference
    private String serialNo;
    private String branch;
    private String customerName;
    private String customerContact;
    private String productName;
    private String productCode;
    private String category;
    private Integer returnQuantity;
    private Integer originalQuantity;
    private BigDecimal salePrice;
    private BigDecimal outputGstPercent;
    private BigDecimal outputGstAmount;
    private BigDecimal totalAmount;
    private String returnReason;
    private String remarks;
    
    @ManyToOne
    @JoinColumn(name = "billing_record_id")
    private BillingRecord billingRecord;
}
```

## 📋 Proposed PurchaseReturn Entity (Future)

```java
@Entity
@Table(name = "purchase_returns")
public class PurchaseReturn {
    @Id @GeneratedValue
    private Long id;
    
    private LocalDate returnDate;
    private String originalPurchaseBillNo;
    private String branch;
    private String materialName;
    private String productCode;
    private String category;
    private Integer returnQuantity;
    private Integer originalQuantity;
    private BigDecimal purchasePrice;
    private BigDecimal inputGstPercent;
    private BigDecimal inputGstAmount;
    private BigDecimal totalAmount;
    private String returnReason;
    private String supplierName;
    private String supplierGstin;
    private String remarks;
    
    @ManyToOne
    @JoinColumn(name = "purchase_id")
    private Purchase purchase;
}
```
