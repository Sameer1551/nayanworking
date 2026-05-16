# Nayan Eye Care Backend APIs

The backend exposes several REST API endpoints at `http://localhost:8080`. Most of these APIs require a valid JWT token passed in the `Authorization: Bearer <token>` header, except for public endpoints like `/api/auth/login`.

## Authentication APIs
Base URL: `/api/auth`
- `POST /login` : Authenticate user & get JWT token
- `POST /register` : Register a new user

## Branch APIs
Base URL: `/api/branches`
- `GET /` : Get all branches
- `GET /{id}` : Get a branch by ID
- `POST /` : Create a new branch
- `PUT /{id}` : Update a branch
- `DELETE /{id}` : Delete a branch
- `GET /code/{code}` : Get unique branch by branch code

## Dashboard APIs
Base URL: `/api/dashboard`
- `GET /` : Get main dashboard stats
- `GET /summary` : Get high level summary metrics
- `GET /category-breakdown` : Chart data for inventory categories
- `GET /branch-performance` : Branch level metrics
- `GET /recent-activity` : Recent system actions

## Inventory APIs
Base URL: `/api/inventory`
- `GET /` : Get all inventory items
- `GET /{id}` : Get inventory item by ID
- `POST /` : Create a new inventory record manually
- `PUT /{id}` : Update an existing inventory record
- `DELETE /{id}` : Delete an inventory item
- `GET /search?searchTerm={term}` : Search inventory
- `GET /low-stock` : Get items below minimum threshold
- `GET /out-of-stock` : Get items with 0 stock
- `GET /category/{category}` : Filter inventory by category
- `PUT /{id}/add-stock` : Add stock amount to item
- `PUT /{id}/remove-stock` : Deduct stock from item

## Supplier & Purchases APIs
Base URL: `/api/purchases`
- `GET /` : Get list of all purchases
- `GET /{id}` : Get purchase by ID
- `POST /` : Record a new standalone purchase
- `PUT /{id}` : Edit purchase record
- `DELETE /{id}` : Delete purchase record (auto-reverses inventory)
- `GET /search` : Search purchases via filters

Base URL: `/api/bulk-purchases`
- `GET /` : Get list of all bulk purchases
- `GET /{id}` : Get bulk purchase by ID
- `POST /` : Upload a new bulk purchase invoice containing multiple items
- `PUT /{id}` : Edit a bulk purchase
- `DELETE /{id}` : Delete entire bulk purchase

Base URL: `/api/purchase-history`
- `GET /` : Get combined timeline of standalone and bulk purchases

## Customer & Billing APIs
Base URL: `/api/customers`
- `GET /` : Get customer list
- `GET /{id}` : Get specific customer profile
- `POST /` : Create new customer profile
- `PUT /{id}` : Edit customer profile
- `DELETE /{id}` : Remove customer profile
- `GET /search?term={term}` : Search customer directory

Base URL: `/api/billing-records`
- `GET /` : Get list of all billing records (invoices)
- `GET /{id}` : Get exact billing record
- `POST /` : Create a new bill (auto-decrements inventory)
- `PUT /{id}` : Update billing record (e.g. tracking advance payments)
- `DELETE /{id}` : Delete bill
- `PUT /{id}/payment-status` : Update status to PAID or PARTIAL

## Configuration APIs
Base URL: `/api/numbering`
- `GET /next-bill-number` : Auto-generates the next sequential invoice code
- `GET /next-purchase-number` : Auto-generates the next purchase record ID
