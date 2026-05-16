 Analysis: Invoice Template vs Current Implementation

  Fields That CAN Be Mapped (Already Exist)

  ┌──────────────────┬─────────────────────────────────────────────────────────────┐
  │ Invoice Section  │                       Mappable Fields                       │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Company Info     │ Store Name, Branch Address (partial), GSTIN (in store data) │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Invoice Meta     │ Invoice No., Dated                                          │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Customer (Buyer) │ Customer Name, Address (partial)                            │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Products         │ Sl. No., Description, HSN, Quantity, Rate, Amount           │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Tax              │ GST % (but not split into CGST/SGST)                        │
  ├──────────────────┼─────────────────────────────────────────────────────────────┤
  │ Summary          │ Subtotal, Total, Discount, Advance Paid, Final Payable      │
  └──────────────────┴─────────────────────────────────────────────────────────────┘

  ---
  Fields That NEED to Be Added

  1. Billing Page (NewBilling.tsx) - Add These Fields:

  ┌─────────────┬─────────────────────────────────────────────────────────────────────┐
  │   Section   │                           Missing Fields                            │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Company     │ Business Logo upload, e-Mail, Contact Details (phone)               │
  │ Info        │                                                                     │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │             │ Delivery Note, Mode/Terms of Payment, Reference No. & Date, Other   │
  │ Invoice     │ References, Buyer's Order No. & Date, Dispatch Doc No. & Date,      │
  │ Meta        │ Dispatched through, Destination, Bill of Lading/LR-RR No., Motor    │
  │             │ Vehicle No., Terms of Delivery                                      │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Consignee   │ Separate address fields with GSTIN, State, Pin code                 │
  │ (Ship to)   │                                                                     │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Buyer (Bill │ Separate address fields with GSTIN, State, Pin code (currently only │
  │  to)        │  one address)                                                       │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Products    │ "Per" column (unit of measure - e.g., "pcs", "dozen")               │
  │ Table       │                                                                     │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Tax Split   │ CGST Rate/Amount, SGST Rate/Amount (currently combined)             │
  ├─────────────┼─────────────────────────────────────────────────────────────────────┤
  │ Footer      │ Amount in words (auto-converted), Tax in words, Declaration text,   │
  │             │ Authorized Signatory (has field but not on print)                   │
  └─────────────┴─────────────────────────────────────────────────────────────────────┘

  2. Sales Return Page (SalesReturn.tsx) - Add These Fields:

  ┌─────────────────┬──────────────────────────────────────────────────────────────────┐
  │     Section     │                          Missing Fields                          │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Invoice Meta    │ All dispatch-related fields need to carry over from original     │
  │                 │ invoice                                                          │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Consignee/Buyer │ Separate ship-to and bill-to addresses with GSTIN                │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Return Summary  │ CGST/SGST split, HSN-wise tax summary                            │
  └─────────────────┴──────────────────────────────────────────────────────────────────┘

  3. Edit Billing Record Popup (BillingRecords.tsx) - Add These Fields:

  ┌─────────────────┬──────────────────────────────────────────────────────────────────┐
  │     Section     │                          Missing Fields                          │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │                 │ Delivery Note, Mode/Terms of Payment, Reference No., Buyer's     │
  │ Invoice Meta    │ Order, Dispatch Doc, Dispatched through, Destination, Bill of    │
  │                 │ Lading, Motor Vehicle No., Terms of Delivery                     │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Consignee/Buyer │ Separate ship-to and bill-to addresses                           │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Products        │ "Per" column (unit)                                              │
  ├─────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Footer          │ Amount in words, Tax in words, Declaration, Signatory            │
  └─────────────────┴──────────────────────────────────────────────────────────────────┘

  ---
  Data Structure Changes Needed

  The BillingData interface needs these additions:
  store: { ..., logo: string, contact: { ..., email } }
  invoice: { ..., deliveryNote, paymentTerms, referenceNo, referenceDate, buyersOrderNo,
  buyersOrderDate, dispatchDocNo, dispatchDocDate, dispatchedThrough, destination,
  billOfLading, motorVehicleNo, termsOfDelivery }
  consignee: { name, address, gstin, state, pincode }  // NEW - Ship to
  buyer: { name, address, gstin, state, pincode }      // Already exists as customer, but
  needs splitting
  products: [ ..., per: string ]                        // Unit of measure
  tax: { cgstRate, cgstAmount, sgstRate, sgstAmount }   // Split GST
  footer: { amountInWords, taxInWords, declaration, customerSignature, authorizedSignatory
   }

  ---
  Summary: Priority Order to Implement

  1. Add Consignee & Buyer separate addresses + GSTIN, State, Pin code
  2. Add "Per" unit column to products table
  3. Split GST into CGST/SGST (calculate as half of total GST each for 5, 12, 18, 28%
  slabs)
  4. Add all Invoice Meta fields (delivery note, dispatch info, payment terms, etc.)
  5. Add Company extras (logo, email, contact)
  6. Add HSN-wise tax summary table for invoice print
  7. Add Footer fields (amount in words, declaration, signatures)
  8. Add invoice meta fields to Sales Return and Edit popup

  Would you like me to proceed with implementing any specific section first?