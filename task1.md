# Task 1: Fix All Data Files, Their Connections, Numbering, And Display Flow

## Current Understanding

The supplier auth work can be handled later.

Right now the more important problem is the project data layer itself:

- purchases
- bulk purchases
- sales
- sales returns
- purchase returns
- customers
- inventory
- dashboard/report data

At the moment this project uses a mixed system:

- some data is saved in Java backend database tables
- some data is saved into JSON files inside `data/`
- some data is still saved in browser `localStorage`
- some pages read from backend APIs
- some pages read directly from `/data/*.json`
- some pages use fallback logic that makes the same data exist in more than one place

So the real issue is not only saving data.
The real issue is:

- where each type of data should live
- which file is the real source of truth
- how one record affects another
- how inventory should update
- how numbering should work
- how the same data should appear correctly across pages, reports, and dashboard

## Main Goal

Make the complete business data flow consistent for this project.

That means this task is about fixing:

1. how data is created
2. how data is saved
3. how data files are updated
4. how related records affect each other
5. how records are displayed in pages
6. how numbering is generated
7. how dashboard/report pages read the correct data

## Main Rule For This Task

This task is **not complete** if only frontend `.tsx` pages are changed.

This task must check and fix:

- React pages
- frontend services
- Java controllers
- Java services
- file save/read logic
- inventory update rules
- dashboard data loading rules

## Current State Of The Project

### What already exists

- billing file endpoints already exist in Java
- purchase file endpoints already exist in Java
- bulk purchase file update/read endpoints already exist in Java
- customer file endpoints already exist in Java
- purchase backend APIs already exist
- inventory backend APIs already exist
- customer backend APIs already exist
- billing data is being appended to `data/billing-records.json`
- purchase data is being appended to `data/purchase-records.json`
- bulk purchase records are being read/written from `data/bulkpurchase-records.json`
- customer records are being read/written from `data/customer-records.json`

### What is still wrong right now

- there is no single clean source of truth across all modules
- returns are still mainly stored in browser `localStorage`
- dashboard still reads raw `/data/*.json` files directly
- inventory connection is incomplete and partly mismatched with frontend types
- sales are represented by billing records, but not all pages treat them the same way
- sales return does not yet have backend storage
- purchase return does not yet have backend storage
- numbering is not fully centralized
- record relationships are not consistently enforced
- deleting or updating one record does not always correctly update inventory and linked records

## Correct Business Connection For This Project

This is the data relationship that the project should follow.

### 1. Purchase

Purchase creates incoming stock.

Purchase should:

- create a purchase record
- save the purchase record in backend
- update `data/purchase-records.json`
- increase inventory for the purchased `productCode`

Important identity fields:

- `purchaseBillNo`
- `productCode`
- `purchaseDate`
- supplier details

### 2. Bulk Purchase

Bulk purchase is also incoming stock.

Bulk purchase should:

- create a bulk purchase record
- save the bulk purchase in backend
- update `data/bulkpurchase-records.json`
- increase inventory for all related product items

Important identity fields:

- `purchaseBillNo` or bulk purchase reference number
- supplier/import reference if used
- list of product codes/items

### 3. Sales

In this project, sales are effectively the billing/invoice records.

Sales should:

- be created from billing flow
- save invoice data in backend
- update `data/billing-records.json`
- reduce inventory for the sold product(s)
- connect customer information with the bill

Important identity fields:

- `billNumber`
- `billDate`
- customer identifier or customer mobile/email
- `productCode` for each billed item

### 4. Sales Return

Sales return is a reverse movement of a sale.

Sales return should:

- link to the original sale/bill
- save return data in backend
- update a dedicated JSON file
- increase inventory back for the returned quantity
- keep the original bill number reference

Important identity fields:

- `salesReturnNo`
- `originalSaleBillNo`
- `productCode`
- return quantity

### 5. Purchase Return

Purchase return is a reverse movement of a purchase.

Purchase return should:

- link to the original purchase
- save return data in backend
- update a dedicated JSON file
- decrease inventory for the returned quantity
- keep the original purchase bill number reference

Important identity fields:

- `purchaseReturnNo`
- `originalPurchaseBillNo`
- `productCode`
- return quantity

### 6. Customers

Customer data should act like the customer master.

Customer records should:

- be created from customer form or from billing if customer is new
- save in backend
- update `data/customer-records.json`
- be linked to bills/sales history
- show visit count, spending, last bill, and contact history correctly

Important identity fields:

- `id`
- mobile number
- email
- full name

### 7. Inventory

Inventory is the central stock hub of the project.

Inventory should not behave like isolated manual data.
It should reflect the result of all stock movements.

Inventory should change when:

- purchase is added
- bulk purchase is added
- sale is created
- sales return is created
- purchase return is created
- manual adjustment is made

The best stable key for inventory connection is:

- `productCode`

## Target Data Files

For this phase, the project should clearly use these files:

- `data/purchase-records.json`
- `data/bulkpurchase-records.json`
- `data/billing-records.json`
- `data/customer-records.json`
- `data/inventory-records.json`
- `data/sales-return-records.json`
- `data/purchase-return-records.json`

If a file does not exist yet, this task should define and add it properly.

## Source Of Truth Rule

This task should decide and enforce one clear rule:

- Java backend handles create/read/update/delete
- JSON files in `data/` are the persisted file layer for this phase
- frontend should call backend APIs
- frontend should not be the main database
- `localStorage` should not be the main storage for business records

`localStorage` may be used only as temporary cache if absolutely needed, but not as the real source of truth.

## Proper Numbering Rules

This task must define proper numbering for all major records.

### Billing / Sales Numbering

- each bill must have a unique `billNumber`
- next bill number must be generated centrally, not guessed differently on multiple pages
- return records must keep reference to the original bill number

### Purchase Numbering

- each purchase must have a unique `purchaseBillNo`
- numbering should be generated consistently for normal purchase and bulk purchase

### Sales Return Numbering

- each return must have its own `salesReturnNo`
- each sales return must also store `originalSaleBillNo`

### Purchase Return Numbering

- each return must have its own `purchaseReturnNo`
- each purchase return must also store `originalPurchaseBillNo`

### Customer Numbering

- each customer must have one stable unique `id`
- do not create duplicate customers for the same mobile/email unless truly different

### Product / Inventory Identity

- each inventory item must be tied to one stable `productCode`
- `productCode` should be the main connector across purchase, sale, return, and inventory

## What Must Be Fixed In This Task

### Part A. Standardize where each module saves data

- purchase must save through backend and update `data/purchase-records.json`
- bulk purchase must save through backend and update `data/bulkpurchase-records.json`
- billing/sales must save through backend and update `data/billing-records.json`
- customer records must save through backend and update `data/customer-records.json`
- inventory records must save through backend and update `data/inventory-records.json`
- sales return must stop using only `localStorage` and use backend + file
- purchase return must stop using only `localStorage` and use backend + file

### Part B. Fix record-to-record connection

- purchase must increase inventory
- bulk purchase must increase inventory
- sale/billing must reduce inventory
- sales return must restore inventory
- purchase return must reduce inventory
- customer history must connect with billing records
- dashboard totals must be based on the same saved data

### Part C. Fix numbering

- create one proper next-number generator for bills
- create one proper next-number generator for purchases
- create one proper next-number generator for sales returns
- create one proper next-number generator for purchase returns
- make sure numbers do not repeat after reload

### Part D. Remove broken mixed storage behavior

- remove dependence on business-record `localStorage` where backend/file storage should exist
- remove direct page assumptions that bypass backend unexpectedly
- reduce duplicate copies of the same records in frontend memory, localStorage, file, and backend

### Part E. Fix display and reporting

- list pages must load the correct saved records
- dashboard must read correct unified data
- totals, quantities, and profit calculations must use the real connected records
- return pages must show linked original bill/purchase references
- customer pages must show real bill and visit linkage

## Current Missing Pieces That This Task Must Cover

### Sales return is still incomplete

Right now `SalesReturn.tsx` is still using:

- `localStorage['salesRecords']`
- `localStorage['salesReturns']`

That means:

- no Java backend source of truth
- no JSON file persistence in `data/`
- no proper inventory update from return

### Purchase return is still incomplete

Right now `PurchaseReturn.tsx` still stores return data in:

- `localStorage['purchaseReturns']`

That means:

- no backend module for purchase returns
- no dedicated JSON file in `data/`
- inventory effect is not properly centralized

### Inventory is not fully reliable yet

Right now inventory has these issues:

- frontend inventory service still has mock fallback behavior
- frontend inventory type does not fully match backend model
- some purchase delete logic expects inventory methods that may not exist properly
- there is no fully clean movement history source of truth

### Dashboard is still reading direct JSON snapshots

Right now dashboard reads:

- `/data/purchase-records.json`
- `/data/billing-records.json`
- `/data/customer-records.json`
- `/data/inventory-records.json`

That means dashboard can drift from the real backend flow if saving logic is inconsistent.

### Billing numbering still needs cleanup

The billing flow still needs proper centralized invoice numbering.
This task must make sure numbering is not left half-generated in frontend-only logic.

## Files That Must Be Reviewed Or Changed

### Frontend services

- `src/services/fileService.ts`
- `src/services/purchaseService.ts`
- `src/services/bulkPurchaseService.ts`
- `src/services/customerService.ts`
- `src/services/inventoryService.ts`
- `src/services/dashboardService.ts`
- `src/services/billingService.ts`

### Frontend pages/components

- `src/pages/supplier/NewBilling.tsx`
- `src/pages/supplier/SalesReturn.tsx`
- `src/pages/supplier/PurchaseReturn.tsx`
- purchase pages
- bulk purchase pages
- customer pages that show history
- inventory pages
- movement history / reports pages

### Java backend controllers/services

- `src/main/java/com/nayaneyecare/controller/FileController.java`
- purchase controller/service
- bulk purchase controller/service
- billing controller/service
- customer controller/service
- inventory controller/service
- data initialization / migration logic
- any new controller/service needed for sales returns
- any new controller/service needed for purchase returns
- any numbering helper service if needed

### Data files

- `data/purchase-records.json`
- `data/bulkpurchase-records.json`
- `data/billing-records.json`
- `data/customer-records.json`
- `data/inventory-records.json`
- `data/sales-return-records.json`
- `data/purchase-return-records.json`

## Expected Final Flow

When this task is done, the project should behave like this:

1. user creates purchase or bulk purchase
2. backend saves record and updates the correct JSON file
3. inventory increases for matching `productCode`
4. user creates billing/sale
5. backend saves billing record and updates the correct JSON file
6. inventory decreases for sold items
7. customer record is created or updated properly
8. user creates sales return or purchase return
9. backend saves return record in its own JSON file
10. inventory is updated correctly based on the return type
11. list pages show the same records that were saved
12. dashboard/report pages read the correct connected data
13. numbering stays unique and traceable

## Test Checklist

1. Create one purchase and confirm it appears in backend, file, inventory, and purchase history page.
2. Create one bulk purchase and confirm it appears in backend, file, inventory, and bulk purchase page.
3. Create one bill/sale and confirm it appears in billing records and reduces inventory.
4. Confirm the customer from that bill is created or updated correctly.
5. Create one sales return and confirm it is saved in backend and `data/sales-return-records.json`.
6. Confirm sales return increases inventory correctly.
7. Create one purchase return and confirm it is saved in backend and `data/purchase-return-records.json`.
8. Confirm purchase return decreases inventory correctly.
9. Confirm customer page shows linked billing history correctly.
10. Confirm dashboard totals match the saved files and backend records.
11. Confirm all record numbers are unique and not duplicated after refresh or restart.
12. Confirm the app no longer depends on `localStorage` as the real storage for business records.

## Token Tracking

While doing this task with Ollama GLM5, record:

- total input tokens
- total output tokens
- total tokens used for implementation
- total tokens used for testing/fixing errors

### Token Log

| Run | Purpose | Input Tokens | Output Tokens | Total Tokens | Notes |
|------|---------|--------------|---------------|--------------|-------|
| 1 | Planning and data flow analysis |  |  |  |  |
| 2 | Frontend service fixes |  |  |  |  |
| 3 | Java backend file/controller fixes |  |  |  |  |
| 4 | Inventory connection fixes |  |  |  |  |
| 5 | Numbering fixes |  |  |  |  |
| 6 | Return module fixes |  |  |  |  |
| 7 | Dashboard/report fixes |  |  |  |  |
| 8 | Testing and final cleanup |  |  |  |  |

## Done Definition

This task is complete only if:

- all major business records use backend + project data files as the real source of truth
- `localStorage` is no longer the main storage for sales returns or purchase returns
- purchase, bulk purchase, sales, returns, customers, and inventory are properly connected
- inventory updates correctly for every stock movement
- record numbering is centralized and consistent
- pages show the same saved data that exists in backend/files
- dashboard and reports reflect the correct connected data
- the new return data files exist and work if they are part of the chosen design
- end-to-end tests confirm the full flow works
