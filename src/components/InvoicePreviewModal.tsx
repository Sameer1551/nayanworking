import React from 'react';
import { BillingData } from '../services/billingService';
import { X, Printer } from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData: BillingData;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, billingData }) => {
  if (!isOpen) return null;

  const { store, invoice, customer, products, billingSummary, payment } = billingData;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '\u00A0';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
  };

  // Build HSN tax breakdown
  const hsnBreakdown = Object.entries(
    products.reduce((acc, p) => {
      const key = p.hsnCode || 'Unknown';
      if (!acc[key]) acc[key] = { taxable: 0, cgst: 0, sgst: 0 };
      acc[key].taxable += p.total;
      acc[key].cgst += p.gstAmount / 2;
      acc[key].sgst += p.gstAmount / 2;
      return acc;
    }, {} as Record<string, { taxable: number; cgst: number; sgst: number }>)
  );

  // Generate the invoice HTML string for printing in a popup window
  const buildInvoiceHTML = () => {
    const productRows = products.map((product, index) => `
      <tr>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:center;">${index + 1}</td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;">
          ${product.productName}
          ${product.description ? `<br/><small>${product.description}</small>` : ''}
        </td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:center;">${product.hsnCode || ''}</td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:center;">${product.quantity}</td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:right;">&#8377;${product.pricePerUnit.toFixed(2)}</td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:center;">Nos</td>
        <td style="border:1px solid #000;border-bottom:none;padding:3px;text-align:right;">&#8377;${product.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const hsnRows = hsnBreakdown.map(([hsn, data]) => `
      <tr>
        <td style="border:1px solid #000;padding:3px;">${hsn}</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${data.taxable.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;text-align:center;">9%</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${data.cgst.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;text-align:center;">9%</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${data.sgst.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${(data.cgst + data.sgst).toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice - ${invoice.billNumber || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #000;
      background: #fff;
    }
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    .invoice-wrapper {
      width: 100%;
      border: 1px solid #000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    td, th {
      font-size: 9pt;
    }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <!-- Header -->
  <div style="text-align:center;font-weight:bold;font-size:14pt;background:#f2f2f2;border-bottom:1px solid #000;padding:3px;">
    Invoice
  </div>

  <!-- Company & Invoice Info -->
  <table>
    <tbody>
      <tr>
        <td rowspan="4" colspan="2" style="width:50%;border:1px solid #000;vertical-align:top;padding:4px;">
          <div style="float:right;border:1px dashed #ccc;padding:15px;margin-bottom:8px;font-size:8pt;color:#999;">+Add Business Logo</div>
          <strong>${store.name || "Company's Name"}</strong><br/>
          ${store.address?.building || store.address?.street || 'Address'}<br/>
          ${store.address?.city ? store.address.city + ', ' : ''}${store.address?.state || ''} ${store.address?.pincode || ''}<br/><br/>
          <strong>GSTIN/UIN:</strong> ${store.contact?.gstin || ''}<br/>
          <strong>State:</strong> ${store.address?.state || ''}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;; <strong>Pin code:</strong> ${store.address?.pincode || ''}<br/>
          <strong>Contact Details:</strong> ${store.contact?.phone || ''}<br/>
          <strong>e-Mail:</strong> ${store.contact?.email || ''}
        </td>
        <td style="width:25%;border:1px solid #000;padding:4px;">
          <span style="font-size:8pt;color:#333;">Invoice No.</span><br/>${invoice.billNumber || ''}
        </td>
        <td style="width:25%;border:1px solid #000;padding:4px;">
          <span style="font-size:8pt;color:#333;">Dated</span><br/>${formatDate(invoice.billDate)}
        </td>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Delivery Note</span><br/>&nbsp;</td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Mode/Terms of Payment</span><br/>${payment.method || ''}</td>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Reference No. &amp; Date.</span><br/>&nbsp;</td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Other References</span><br/>&nbsp;</td>
      </tr>
      <tr>
        <td colspan="2" style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Buyer's Order No.</span><br/>&nbsp;</td>
      </tr>

      <!-- Consignee -->
      <tr>
        <td colspan="2" style="border:1px solid #000;vertical-align:top;padding:4px;background:#fff9e6;">
          <span style="font-weight:bold;text-decoration:underline;">Consignee (Ship to)</span><br/>
          ${customer.name || 'Customer Name'}<br/>
          ${customer.address || 'Customer Address'}<br/><br/>
          <strong>GSTIN/UIN:</strong><br/>
          <strong>State:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;; <strong>Pin code:</strong>
        </td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Dispatch Doc No.</span><br/>&nbsp;</td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Delivery Note Date</span><br/>&nbsp;</td>
      </tr>

      <!-- Buyer -->
      <tr>
        <td colspan="2" rowspan="2" style="border:1px solid #000;vertical-align:top;padding:4px;background:#fff9e6;">
          <span style="font-weight:bold;text-decoration:underline;">Buyer (Bill to)</span><br/>
          ${customer.name || 'Customer Name'}<br/>
          ${customer.address || 'Customer Address'}<br/><br/>
          <strong>GSTIN/UIN:</strong><br/>
          <strong>State:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;; <strong>Pin code:</strong>
        </td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Dispatched through</span><br/>&nbsp;</td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Destination</span><br/>&nbsp;</td>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Bill of Lading/LR-RR No. & Motor Vehicle No.</span><br/>&nbsp;</td>
        <td style="border:1px solid #000;padding:4px;"><span style="font-size:8pt;color:#333;">Terms of Delivery</span><br/>&nbsp;</td>
      </tr>
    </tbody>
  </table>

  <!-- Products Table -->
  <table>
    <tbody>
      <tr style="background:#fff9e6;text-align:center;">
        <td style="width:5%;border:1px solid #000;padding:3px;font-weight:bold;">Sl. No.</td>
        <td style="width:40%;border:1px solid #000;padding:3px;font-weight:bold;">Description of Goods</td>
        <td style="width:10%;border:1px solid #000;padding:3px;font-weight:bold;">HSN/SAC</td>
        <td style="width:10%;border:1px solid #000;padding:3px;font-weight:bold;">Quantity</td>
        <td style="width:12%;border:1px solid #000;padding:3px;font-weight:bold;">Rate</td>
        <td style="width:8%;border:1px solid #000;padding:3px;font-weight:bold;">per</td>
        <td style="width:15%;border:1px solid #000;padding:3px;font-weight:bold;">Amount</td>
      </tr>
      ${productRows}
      <tr>
        <td colspan="2" style="border:1px solid #000;border-top:none;padding:3px;text-align:right;"><i>CGST</i><br/><i>SGST</i></td>
        <td style="border:1px solid #000;border-top:none;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;border-top:none;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;border-top:none;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;border-top:none;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;border-top:none;padding:3px;text-align:right;">
          &#8377;${(billingSummary.totalGst / 2).toFixed(2)}<br/>&#8377;${(billingSummary.totalGst / 2).toFixed(2)}
        </td>
      </tr>
      <tr style="font-weight:bold;">
        <td colspan="2" style="border:1px solid #000;padding:3px;text-align:right;">Total</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${billingSummary.finalPayable.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Amount in Words -->
  <table>
    <tbody>
      <tr>
        <td style="border:1px solid #000;padding:4px;">
          <span style="font-size:8pt;color:#333;">Amount Chargeable (in words)</span><br/>
          <strong>${billingSummary.finalPayable > 0 ? numberToWords(Math.floor(billingSummary.finalPayable)) + ' Only' : ''}</strong>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- HSN Tax Table -->
  <table>
    <tbody>
      <tr style="background:#fff9e6;text-align:center;font-weight:bold;">
        <td rowspan="2" style="width:30%;border:1px solid #000;padding:3px;">HSN/SAC</td>
        <td rowspan="2" style="width:15%;border:1px solid #000;padding:3px;">Taxable Value</td>
        <td colspan="2" style="border:1px solid #000;padding:3px;">CGST</td>
        <td colspan="2" style="border:1px solid #000;padding:3px;">SGST/UTGST</td>
        <td rowspan="2" style="border:1px solid #000;padding:3px;">Total Tax Amount</td>
      </tr>
      <tr style="background:#fff9e6;text-align:center;font-weight:bold;">
        <td style="border:1px solid #000;padding:3px;">Rate</td>
        <td style="border:1px solid #000;padding:3px;">Amount</td>
        <td style="border:1px solid #000;padding:3px;">Rate</td>
        <td style="border:1px solid #000;padding:3px;">Amount</td>
      </tr>
      ${hsnRows}
      <tr style="font-weight:bold;">
        <td style="border:1px solid #000;padding:3px;text-align:right;">Total</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${billingSummary.subtotal.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${(billingSummary.totalGst / 2).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;">&nbsp;</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${(billingSummary.totalGst / 2).toFixed(2)}</td>
        <td style="border:1px solid #000;padding:3px;text-align:right;">&#8377;${billingSummary.totalGst.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Declaration & Signatures -->
  <table>
    <tbody>
      <tr>
        <td colspan="4" style="border:1px solid #000;border-bottom:none;padding:4px;">
          <span style="font-size:8pt;color:#333;">Tax Amount (in words):</span><br/>
          <strong>${billingSummary.totalGst > 0 ? numberToWords(Math.floor(billingSummary.totalGst)) + ' Only' : ''}</strong>
          <br/><br/>
          <span style="font-size:8pt;color:#333;">Declaration</span><br/>
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        </td>
        <td colspan="3" rowspan="2" style="border:1px solid #000;padding:4px;text-align:right;vertical-align:bottom;height:80px;">
          for ${store.name || 'Company Name'}<br/><br/><br/>
          <span style="font-size:8pt;color:#333;">Authorised Signatory</span>
        </td>
      </tr>
      <tr>
        <td colspan="4" style="border:1px solid #000;height:35px;vertical-align:bottom;padding:4px;">
          Customer's Seal and Signature
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div style="background:#4a90e2;color:white;text-align:center;padding:4px;font-size:8pt;">
    This invoice is generated using online invoice template by Tally.
  </div>
</div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups for this site to print invoices.');
      return;
    }
    printWindow.document.write(buildInvoiceHTML());
    printWindow.document.close();
    printWindow.focus();
    // Small delay to ensure content is fully rendered before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-screen overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-800">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content - screen preview (scaled down for display) */}
        <div className="p-2 sm:p-3" id="invoice-print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#000', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
          <div style={{ width: '800px', margin: '0 auto', border: '1px solid #000' }}>
            {/* Header Title */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f2f2f2', borderBottom: '1px solid #000', padding: '2px' }}>
              Invoice
            </div>

            {/* Company Info & Invoice Details Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <tbody>
                <tr>
                  <td rowSpan={4} colSpan={2} style={{ width: '50%', border: '1px solid #000', verticalAlign: 'top', padding: '4px' }}>
                    <div style={{ float: 'right', border: '1px dashed #ccc', padding: '20px', marginBottom: '10px', fontSize: '10px', color: '#999' }}>+Add Business Logo</div>
                    <strong>{store.name || "Company's Name"}</strong><br />
                    {store.address?.building || store.address?.street || 'Address'}<br />
                    {store.address?.city && `${store.address?.city}, `}{store.address?.state} {store.address?.pincode}<br /><br />
                    <strong>GSTIN/UIN:</strong> {store.contact?.gstin || '\u00A0'}<br />
                    <strong>State:</strong> {store.address?.state || '\u00A0'}{"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}; <strong>Pin code:</strong> {store.address?.pincode || '\u00A0'}<br />
                    <strong>Contact Details:</strong> {store.contact?.phone || '\u00A0'}<br />
                    <strong>e-Mail:</strong> {store.contact?.email || '\u00A0'}
                  </td>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Invoice No.</span><br />{invoice.billNumber || '\u00A0'}
                  </td>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Dated</span><br />{formatDate(invoice.billDate)}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Delivery Note</span><br />&nbsp;
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Mode/Terms of Payment</span><br />{payment.method || '\u00A0'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Reference No. &amp; Date.</span><br />&nbsp;
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Other References</span><br />&nbsp;
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Buyer&apos;s Order No.</span><br />&nbsp;
                  </td>
                </tr>

                {/* Consignee & Dispatch */}
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', verticalAlign: 'top', padding: '4px', backgroundColor: '#fff9e6' }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Consignee (Ship to)</span><br />
                    {customer.name || 'Customer Name'}<br />
                    {customer.address || 'Customer Address'}<br /><br />
                    <strong>GSTIN/UIN:</strong><br />
                    <strong>State:</strong> {"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}; <strong>Pin code:</strong> {"\u00A0"}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Dispatch Doc No.</span><br />&nbsp;
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Delivery Note Date</span><br />&nbsp;
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} rowSpan={2} style={{ border: '1px solid #000', verticalAlign: 'top', padding: '4px', backgroundColor: '#fff9e6' }}>
                    <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Buyer (Bill to)</span><br />
                    {customer.name || 'Customer Name'}<br />
                    {customer.address || 'Customer Address'}<br /><br />
                    <strong>GSTIN/UIN:</strong><br />
                    <strong>State:</strong> {"\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}; <strong>Pin code:</strong> {"\u00A0"}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Dispatched through</span><br />&nbsp;
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Destination</span><br />&nbsp;
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Bill of Lading/LR-RR No. & Motor Vehicle No.</span><br />&nbsp;
                  </td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Terms of Delivery</span><br />&nbsp;
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Products Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderTop: 'none' }}>
              <tbody>
                <tr style={{ backgroundColor: '#fff9e6', textAlign: 'center' }}>
                  <td style={{ width: '5%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Sl. No.</td>
                  <td style={{ width: '45%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Description of Goods</td>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>HSN/SAC</td>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Quantity</td>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Rate</td>
                  <td style={{ width: '5%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>per</td>
                  <td style={{ width: '15%', border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>Amount</td>
                </tr>
                {products.map((product, index) => (
                  <tr key={product.id || index}>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px' }}>
                      {product.productName}
                      {product.description && <><br /><small>{product.description}</small></>}
                    </td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'center' }}>{product.hsnCode || '\u00A0'}</td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'center' }}>{product.quantity}</td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'right' }}>₹{product.pricePerUnit.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'center' }}>Nos</td>
                    <td style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px', textAlign: 'right' }}>₹{product.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', borderTop: 'none', padding: '4px', textAlign: 'right' }}>
                    <i>CGST</i><br />
                    <i>SGST</i>
                  </td>
                  <td style={{ border: '1px solid #000', borderTop: 'none', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', borderTop: 'none', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', borderTop: 'none', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', borderTop: 'none', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', borderTop: 'none', padding: '4px', textAlign: 'right' }}>
                    ₹{(billingSummary.totalGst / 2).toFixed(2)}<br />
                    ₹{(billingSummary.totalGst / 2).toFixed(2)}
                  </td>
                </tr>
                <tr style={{ fontWeight: 'bold' }}>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Total</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{billingSummary.finalPayable.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Amount in Words */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td colSpan={7} style={{ border: '1px solid #000', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Amount Chargeable (in words)</span><br />
                    <strong>{billingSummary.finalPayable > 0 ? numberToWords(Math.floor(billingSummary.finalPayable)) + ' Only' : '\u00A0'}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* HSN Tax Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ backgroundColor: '#fff9e6', textAlign: 'center', fontWeight: 'bold' }}>
                  <td rowSpan={2} style={{ width: '40%', border: '1px solid #000', padding: '4px' }}>HSN/SAC</td>
                  <td rowSpan={2} style={{ width: '10%', border: '1px solid #000', padding: '4px' }}>Taxable Value</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>CGST</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>SGST/UTGST</td>
                  <td rowSpan={2} style={{ border: '1px solid #000', padding: '4px' }}>Total Tax Amount</td>
                </tr>
                <tr style={{ backgroundColor: '#fff9e6', textAlign: 'center', fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>Rate</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>Amount</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>Rate</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>Amount</td>
                </tr>
                {hsnBreakdown.map(([hsn, data]) => (
                  <tr key={hsn} style={{ height: '20px' }}>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>{hsn}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{data.taxable.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>9%</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{data.cgst.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>9%</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{data.sgst.toFixed(2)}</td>
                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{(data.cgst + data.sgst).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Total</td>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{(billingSummary.subtotal).toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{(billingSummary.totalGst / 2).toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{(billingSummary.totalGst / 2).toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>₹{billingSummary.totalGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Declaration & Signatures */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#333' }}>Tax Amount (in words):</span><br />
                    <strong>{billingSummary.totalGst > 0 ? numberToWords(Math.floor(billingSummary.totalGst)) + ' Only' : '\u00A0'}</strong>
                    <br /><br />
                    <span style={{ fontSize: '10px', color: '#333' }}>Declaration</span><br />
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                  </td>
                  <td colSpan={3} rowSpan={2} style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', verticalAlign: 'bottom', height: '100px' }}>
                    for {store.name || 'Company Name'}<br /><br /><br />
                    <span style={{ fontSize: '10px', color: '#333' }}>Authorised Signatory</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', height: '40px', verticalAlign: 'bottom', padding: '4px' }}>
                    Customer&apos;s Seal and Signature
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer Note */}
            <div style={{ backgroundColor: '#4a90e2', color: 'white', textAlign: 'center', padding: '5px', fontSize: '10px' }}>
              This invoice is generated using online invoice template by Tally. To automate the process of invoice generation, get started with TallyPrime by clicking here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;