# Nayan Eye Care Page Audit And Missing Scope

Last updated: 2026-04-04

Status legend:
- [x] Created and routed
- [~] Exists, but still incomplete or mixed
- [ ] Still missing

## 1. Current Project Snapshot

This project is no longer just a frontend prototype.

Backend modules now exist for:
- [x] auth
- [x] inventory
- [x] purchases
- [x] bulk purchases
- [x] billing records
- [x] customers
- [x] dashboard
- [x] sales returns
- [x] purchase returns
- [x] file sync helpers
- [x] numbering service

The main gap now is not "backend missing everywhere".

The main gap now is:
- [ ] backend security is still not enforced properly
- [ ] several supplier pages still carry old `localStorage` or file-fallback logic
- [ ] billing flow still has contract gaps
- [ ] reports/alerts/admin pages are still missing
- [ ] public catalog pages are still mostly static

## 2. Pages Already Created And Routed

### Public Pages

| Route | Status | Notes |
|------|--------|-------|
| `/` | [x] | Home page exists |
| `/spectacles` | [x] | Category page exists, but still not fully live-data driven |
| `/sunglasses` | [x] | Category page exists, but still not fully live-data driven |
| `/contact-lenses` | [x] | Category page exists, but still not fully live-data driven |
| `/frames` | [x] | Category page exists, but still not fully live-data driven |
| `/solutions` | [x] | Category page exists, but still not fully live-data driven |

### Supplier / Staff Pages

| Route | Status | Notes |
|------|--------|-------|
| `/supplier/dashboard` | [~] | Page exists and dashboard frontend now uses backend API, but analytics still need further hardening |
| `/supplier/billing` | [~] | Page exists, but billing contract gaps still remain |
| `/supplier/billing-records` | [x] | Routed and usable |
| `/supplier/customers` | [~] | Page exists, but still has mixed backend/file/localStorage logic |
| `/supplier/purchase` | [~] | Backend create flow exists, but broader cleanup is still pending |
| `/supplier/bulk-purchase` | [~] | Backend exists, but cleanup/security work is still pending |
| `/supplier/purchase-history` | [~] | Page exists, but still contains heavy local fallback logic |
| `/supplier/purchase-return` | [x] | Page exists and is now backend-connected |
| `/supplier/sales-return` | [x] | Page exists and is now backend-connected |
| `/supplier/data` | [ ] | Still only a placeholder instead of a real reports page |
| `/supplier/inventory` | [~] | Page exists, but frontend/backend model cleanup is still not complete |

### Customer Portal Pages

| Route | Status | Notes |
|------|--------|-------|
| `/customer/login` | [x] | Created and routed |
| `/customer/register` | [x] | Created and routed |
| `/customer/dashboard` | [x] | Created and protected |
| `/customer/profile` | [x] | Created and protected |
| `/customer/bills` | [x] | Created and protected |
| `/customer/prescriptions` | [x] | Created and protected |
| `/customer/returns` | [x] | Created and protected |
| `/customer/book-eye-test` | [x] | Created and protected |
| `/customer/contact-lens-reorders` | [x] | Created and protected |

## 3. Existing UI Files That Exist But Still Need Product Cleanup

- [~] `src/components/LoginModal.tsx` still exists even though auth is now more route-driven.
- [~] `src/components/MovementHistory.tsx` exists, but there is still no real movement ledger backend behind it.
- [ ] `src/pages/categories/Others.tsx` exists, but is not routed.
- [~] `src/components/BillingRecords.tsx` is usable, but structurally it still belongs in `pages/`.

## 4. Backend Modules That Already Exist

- [x] `AuthController` / `AuthService`
- [x] `InventoryController` / `InventoryItemService`
- [x] `PurchaseController` / `PurchaseService`
- [x] `BulkPurchaseController` / `BulkPurchaseService`
- [x] `BillingRecordController` / `BillingRecordService`
- [x] `CustomerController` / `CustomerService`
- [x] `DashboardController` / `DashboardService`
- [x] `SalesReturnController` / `SalesReturnService`
- [x] `PurchaseReturnController` / `PurchaseReturnService`
- [x] `FileController`
- [x] `NumberingService`

## 5. Pages That Exist But Are Still Functionally Incomplete

- [~] Public category pages still need live catalog/inventory connection.
- [~] Supplier dashboard is wired better than before, but analytics are still not fully normalized around all business flows.
- [~] Billing page still needs invoice-number, product-source, and overall contract cleanup.
- [~] Customers page still needs full backend-first cleanup.
- [~] Purchase history still needs localStorage cleanup and stock-safe reconciliation.
- [~] Inventory page still needs frontend/backend field-shape cleanup.
- [~] Customer portal pages exist, but some flows still rely on local/client-side service layers until deeper backend support is finished.
- [ ] Data page is still a placeholder.

## 6. Pages You Still Need To Create

### Supplier / Staff Pages Still Missing

- [ ] `/supplier/reports`
- [ ] `/supplier/low-stock`
- [ ] `/supplier/suppliers`
- [ ] `/supplier/inventory-adjustments`
- [ ] `/supplier/stock-audit`
- [ ] `/supplier/prescriptions`
- [ ] `/supplier/expiry-alerts`
- [ ] `/supplier/warranty`
- [ ] `/supplier/settings`
- [ ] `/supplier/users`

### Public Experience Pages Still Missing

- [ ] `/products/search`
- [ ] `/product/:productCode`
- [ ] `/offers`
- [ ] `/cart` if online ordering is in scope
- [ ] `/checkout` if online ordering is in scope
- [ ] `/order-success` if online ordering is in scope

### Utility Pages Still Missing

- [ ] `/unauthorized`
- [ ] `/not-found`

## 7. Everything Missing Right Now In The Project

### A. Backend / Security Gaps

- [ ] Real JWT request-authentication filter / API protection
- [ ] Role-based authorization on backend APIs
- [~] Return modules exist, but are still file-backed rather than full repository-backed DB modules
- [ ] Inventory movement / audit ledger backend
- [ ] Supplier master backend module
- [ ] Appointment / eye-test booking backend module
- [ ] Invoice-number generation backend/service support for billing

### B. Frontend Integration Gaps

- [~] `authService.ts` is backend-first now, but backend enforcement is still open because security config is permissive
- [ ] `NewBilling.tsx` still depends on `billingService.getNextInvoiceNumber()` which is missing
- [ ] `NewBilling.tsx` still needs a cleaner inventory-backed product source
- [ ] `PurchaseHistory.tsx` still contains heavy `localStorage` fallback logic
- [ ] `Customers.tsx` still contains `localStorage` fallback logic
- [ ] `inventoryService.ts` and the inventory page still need final contract cleanup in some endpoints/field mappings

### C. Frontend / Backend Model Mismatches

- [ ] Inventory field naming still needs full cleanup across UI and backend models
- [ ] Billing items should store/use `productCode` more consistently
- [ ] Movement-history UI still has no true backend movement source

### D. Missing Supplier-Side Product Workflows

- [ ] reports
- [ ] low-stock actions
- [ ] supplier master
- [ ] inventory adjustments
- [ ] stock audit
- [ ] expiry alerts
- [ ] warranty
- [ ] users / roles
- [ ] settings
- [ ] supplier-side prescription center

### E. Missing Customer-Side Backend Depth

- [x] core customer pages now exist
- [ ] appointment booking backend workflow
- [ ] customer return/service-request supplier review workflow
- [ ] reorder fulfillment workflow
- [ ] deeper customer record/document integrations

### F. Missing Public Catalog Capabilities

- [ ] live product detail page
- [ ] live search page
- [ ] clear public catalog data model
- [ ] full category-to-product discovery flow

## 8. Best Reading Of The Current Project State

Right now the repo has a strong supplier-core base and much more backend than before.

What changed recently:
- returns are no longer frontend-only
- supplier auth is backend-first
- customer portal core pages now exist
- dashboard frontend reads backend API
- purchase-service review issues were cleaned up

What is still left:
- lock down security
- finish billing contract cleanup
- remove leftover localStorage/file fallbacks from older supplier pages
- build reports, alerts, settings, and admin flows
- complete the public catalog side
