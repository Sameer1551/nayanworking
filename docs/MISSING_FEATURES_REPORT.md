# Nayan Eye Care Missing Features Report

Last updated: 2026-04-04

Status legend:
- [x] Done in core form
- [~] Partially done, but still needs hardening or deeper backend work
- [ ] Still missing

## Work Completed Recently

- [x] Sales return backend module added with entity, service, controller, JSON persistence, and inventory stock-restore logic.
- [x] Sales return page moved off browser-only storage and now calls the backend return API.
- [x] Purchase return backend module added with entity, service, controller, JSON persistence, and inventory stock-deduction logic.
- [x] Purchase return page moved off browser-only storage and now calls the backend return API.
- [x] Return numbering is now centralized server-side for sales returns and purchase returns.
- [x] `src/services/dashboardService.ts` now calls the backend dashboard API instead of reading JSON files directly in the browser.
- [x] Customer portal pages and routes now exist for login, register, dashboard, profile, bills, prescriptions, returns, eye-test booking, and contact-lens reorders.
- [x] Supplier auth is no longer hardcoded mock-only on the frontend; it now calls the Java backend first.
- [x] Auth session persistence now uses `localStorage` instead of tab-only session storage.
- [x] `src/services/purchaseService.ts` no longer uses `localStorage` as the primary fallback for purchase records.
- [x] Broken inventory calls inside `purchaseService.ts` were fixed.

## Critical / High Priority Items Still Left

- [ ] Backend security is still open. `SecurityConfig` still permits `/api/**`, so JWT auth is not yet enforcing protected APIs.
- [~] Returns are backend-connected now, but they are still file-backed modules, not full repository-backed DB modules.
- [~] Dashboard frontend uses the backend API now, but backend dashboard aggregation still needs stronger live-source normalization and return-aware analytics.
- [ ] `billingService.getNextInvoiceNumber()` is still missing while `NewBilling.tsx` calls it.
- [ ] `PurchaseHistory.tsx` still contains heavy `localStorage` and file-fallback logic.
- [ ] `Customers.tsx` still contains `localStorage` fallback/sync logic.
- [ ] Inventory movement ledger / audit trail is still missing.
- [ ] Billing records should store and use stable `productCode` identity more consistently.

## Supplier-Side Work Status

- [x] Purchase page exists.
- [x] Bulk purchase page exists.
- [x] Purchase history page exists.
- [x] Sales return page exists and is backend-connected.
- [x] Purchase return page exists and is backend-connected.
- [x] Inventory page exists.
- [x] Billing records page exists.
- [x] Dashboard page exists.
- [ ] Real reports page is still missing. `Data.tsx` is still not a finished reporting module.
- [ ] Dedicated low-stock page is still missing.
- [ ] Supplier master page is still missing.
- [ ] Inventory adjustments page is still missing.
- [ ] Stock audit / reconciliation page is still missing.
- [ ] Expiry alerts page is still missing.
- [ ] Warranty page is still missing.
- [ ] Users / roles page is still missing.
- [ ] Settings page is still missing.

## Customer-Side Work Status

- [x] Customer login page exists.
- [x] Customer register page exists.
- [x] Customer dashboard page exists.
- [x] Customer profile page exists.
- [x] Customer bills page exists.
- [x] Customer prescriptions page exists.
- [x] Customer returns page exists.
- [x] Customer eye-test booking page exists.
- [x] Customer contact-lens reorder page exists.
- [~] Customer portal backend depth is still incomplete for service requests, appointment workflow, and reorder processing.

## Public Website Work Status

- [x] Public category pages exist for spectacles, sunglasses, contact lenses, frames, and solutions.
- [ ] Category pages are not fully connected to live product/catalog data yet.
- [ ] Product detail page is missing.
- [ ] Product search page is missing.
- [ ] Offers page is missing.
- [ ] Clear online-ordering path is still undecided or unfinished.

## Operations, Alerts, and Reporting Still Missing

- [ ] Low stock UI alerts.
- [ ] Expiry date alerts.
- [ ] Print / PDF bill output.
- [ ] Credit-note / debit-note style return documents.
- [ ] Email notifications.
- [ ] WhatsApp / SMS reminders.
- [ ] GST / financial year reports.

## Best Short Summary Of Current State

The project is no longer missing the core supplier skeleton.

What is done now:
- backend-first supplier auth
- customer portal core pages
- backend-connected sales returns
- backend-connected purchase returns
- dashboard frontend moved to backend API
- purchase-service cleanup for the reviewed issues

What is still left now:
- real backend security enforcement
- billing contract cleanup
- movement ledger and audit trail
- localStorage cleanup in purchase history and customers pages
- reports, alerts, settings, supplier master, and stock-control pages
- live public catalog and product-detail/search flow
