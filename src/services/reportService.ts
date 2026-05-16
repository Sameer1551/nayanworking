/**
 * reportService.ts
 * Generates HTML-in-XLS report files matching the Nayana Eye Care report format.
 */
import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

// ─── Shared HTML-in-XLS boilerplate ──────────────────────────────────────────

const XLS_DOCTYPE = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN"><HTML xmlns:o="urn:schemas-microsoft-com:office:office"><HEAD>`;

const XLS_STYLE = `<style>.tableHeader {border-width: 1px;border-color: #333333;border-style: solid;padding: 5px;margin: 0px;color: #FFFFFF;font-size: small;font-size: 14px;font-weight: bold;font-family: Arial;background-color: #4f81bd;text-transform: none;text-align: center;vertical-align: middle;letter-spacing: 0em;}.tableRow {border-width: 1px;border-color: #333333;border-style: solid;padding: 3px;margin: 0px;color: #000000;font-size: x-small;font-size: 14px;font-weight: normal;font-family: Arial;background-color: #FFFFFF;text-transform: none;text-align: left;vertical-align: middle;letter-spacing: 0em;}</style>`;

function buildXlsHeader(title: string): string {
  return `${XLS_DOCTYPE}<title>${title}</title>${XLS_STYLE}</HEAD><body>`;
}

function buildXlsFooter(): string {
  return `</body></HTML>`;
}

function downloadAsXls(filename: string, htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtNum(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '0.00';
  return Number(val).toFixed(2);
}

function fmtDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  } catch {
    return dateStr;
  }
}

function fmtDateOnly(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return dateStr;
  }
}

function ordinalSuffix(n: number): string {
  const s = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function monthName(m: number): string {
  return ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][m - 1] || '';
}

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────

interface BillingProduct {
  id: number;
  productName: string;
  category: string;
  hsnCode: string;
  quantity: number;
  pricePerUnit: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  description?: string;
  productCode?: string;
}

interface BillingRecord {
  id: number;
  billNumber: string;
  billDate: string;
  branchCode: string;
  branchName: string;
  customerName: string;
  customerContact: string;
  subtotal: number;
  totalGst: number;
  amount: number;
  discount: number;
  advancePaid: number;
  finalPayable: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate?: string;
  prescriptionDeliveryDate?: string;
  createdAt?: string;
  products: BillingProduct[];
}

interface InventoryRaw {
  id: number;
  productName: string;
  productCode: string;
  category: string;
  subcategory: string;
  description?: string;
  quantity: number;
}

// ─── 1. DAILY STATEMENT ───────────────────────────────────────────────────────

export async function generateDailyStatementXLS(reportDate: string): Promise<void> {
  const resp = await fetch(`${BASE_URL}/billing-records/all-with-products`);
  if (!resp.ok) throw new Error('Failed to load billing records');
  const allRecords: BillingRecord[] = await resp.json();

  const dayRecords = allRecords.filter(r => {
    if (!r.billDate) return false;
    return r.billDate.startsWith(reportDate);
  });

  const now = new Date();
  const nowStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const branchName = dayRecords.length > 0 ? dayRecords[0].branchName : 'Nayana Eye Care';

  // Summary: group by paymentMethod
  const paymentGroups: Record<string, { collection: number }> = {};
  dayRecords.forEach(r => {
    const key = `${r.paymentMethod || 'Cash'} (${r.branchCode || '-'})`;
    if (!paymentGroups[key]) paymentGroups[key] = { collection: 0 };
    paymentGroups[key].collection += Number(r.amount) || 0;
  });

  let summaryRows = '';
  let totalCollection = 0;
  Object.entries(paymentGroups).forEach(([mode, v]) => {
    totalCollection += v.collection;
    summaryRows += `<tr><td class="tableRow">${mode}</td><td class="tableRow">${fmtNum(v.collection)}</td><td class="tableRow">0.00</td><td class="tableRow">0.00</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(v.collection)}</td></tr>`;
  });
  if (dayRecords.length === 0) summaryRows = `<tr><td colspan="6" align="center">No Data Found</td></tr>`;

  // Advance Collections
  let advRows = '';
  let advSlNo = 0;
  dayRecords.forEach(r => {
    if ((r.advancePaid || 0) > 0) {
      advSlNo++;
      advRows += `<tr><td class="tableRow">${advSlNo}</td><td class="tableRow">${fmtDate(r.billDate)}</td><td class="tableRow">${r.prescriptionDeliveryDate ? fmtDateOnly(r.prescriptionDeliveryDate) : ''}</td><td class="tableRow">${r.paymentDate ? fmtDateOnly(r.paymentDate) : fmtDate(r.billDate)}</td><td class="tableRow">${fmtDate(r.billDate)}</td><td class="tableRow">-</td><td class="tableRow">${r.billNumber}</td><td class="tableRow">${r.billNumber}</td><td class="tableRow">${r.customerName}</td><td class="tableRow">${fmtNum(r.amount)}</td><td class="tableRow">${fmtNum(r.discount)}</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(r.finalPayable)}</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(r.advancePaid)}</td><td class="tableRow">${fmtNum(r.finalPayable - r.advancePaid)}</td></tr>`;
    }
  });
  if (advSlNo === 0) advRows = `<tr><td colspan="16" align="center">No Data Found</td></tr>`;

  // Final Settled Collections
  let settledRows = '';
  let settledSlNo = 0;
  let totalSettledCollection = 0;
  dayRecords.filter(r => r.paymentStatus === 'Paid').forEach(r => {
    settledSlNo++;
    totalSettledCollection += Number(r.finalPayable) || 0;
    settledRows += `<tr><td class="tableRow">${settledSlNo}</td><td class="tableRow">${fmtDate(r.billDate)}</td><td class="tableRow">${r.prescriptionDeliveryDate ? fmtDateOnly(r.prescriptionDeliveryDate) : ''}</td><td class="tableRow">${r.paymentDate ? fmtDateOnly(r.paymentDate) : fmtDate(r.billDate)}</td><td class="tableRow">${fmtDate(r.billDate)}</td><td class="tableRow">-</td><td class="tableRow">${r.billNumber}</td><td class="tableRow">${r.billNumber}</td><td class="tableRow">${r.customerName}</td><td class="tableRow">${fmtNum(r.amount)}</td><td class="tableRow">${fmtNum(r.discount)}</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(r.finalPayable)}</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(r.finalPayable)}</td><td class="tableRow">0.00</td></tr>`;
  });
  if (settledSlNo === 0) settledRows = `<tr><td colspan="16" align="center">No Data Found</td></tr>`;

  // Payment Summary
  const pmSummary: Record<string, number> = {};
  dayRecords.forEach(r => {
    const pm = (r.paymentMethod || 'CASH').toUpperCase();
    pmSummary[pm] = (pmSummary[pm] || 0) + Number(r.amount || 0);
  });
  let pmRows = '';
  let pmTotal = 0;
  Object.entries(pmSummary).forEach(([pm, amount]) => {
    pmTotal += amount;
    pmRows += `<tr><td class="tableRow" color="black">${pm}</td><td class="tableRow" color="black">${fmtNum(amount)}</td><td class="tableRow" color="black">0.00</td><td class="tableRow" color="black">${fmtNum(amount)}</td></tr>`;
  });
  if (!pmRows) pmRows = `<tr><td colspan="4" align="center">No Data Found</td></tr>`;

  // Sales Summary
  const totalSales = dayRecords.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalDiscount = dayRecords.reduce((s, r) => s + Number(r.discount || 0), 0);
  const totalGrossGst = dayRecords.reduce((s, r) => s + Number(r.totalGst || 0), 0);
  const totalGross = totalSales - totalDiscount;
  const totalNet = dayRecords.reduce((s, r) => s + Number(r.finalPayable || 0), 0);

  const rd = new Date(reportDate);
  const dayOrd = isNaN(rd.getTime()) ? reportDate : `${ordinalSuffix(rd.getDate())} ${monthName(rd.getMonth() + 1)} ${rd.getFullYear()}`;

  const totalAdvance = dayRecords.reduce((s, r) => s + Number(r.advancePaid || 0), 0);

  const html = `${buildXlsHeader('Daily Statement of Nayana Eye Care')}
<table width=500>
  <tr><td style="font-size: 16px;">Shop Name :</td><td align="left" style="font-size: 16px;">Nayana Eye Care</td></tr>
  <tr><td style="font-size: 16px;">Branch Name :</td><td align="left" style="font-size: 16px;">${branchName}</td></tr>
  <tr><td style="font-size: 16px;">Login User Name :</td><td align="left" style="font-size: 16px;">NAYANEYECARE</td></tr>
  <tr><td style="font-size: 16px;">Generated Date &amp; Time  :</td><td align="left" style="font-size: 16px;">${nowStr}</td></tr>
</table>
<table width=500>
  <tr><td colspan="6"><h3 style="text-align:center;">DAILY STATEMENT FOR ${dayOrd}</h3></td></tr>
  <tr><td colspan="6" align="left" style="font-weight: bold;"><h4>Summary</h4></td></tr>
  <tr><td class="tableHeader">Payment Mode</td><td class="tableHeader">Collection</td><td class="tableHeader">Receipts</td><td class="tableHeader">Expenses</td><td class="tableHeader">Payments</td><td class="tableHeader">Difference</td></tr>
  ${summaryRows}
  <tr><td class="tableRow"><b>Total</b></td><td class="tableRow">${fmtNum(totalCollection)}</td><td class="tableRow">0.00</td><td class="tableRow">0.00</td><td class="tableRow">0.00</td><td class="tableRow">${fmtNum(totalCollection)}</td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="16" align="left" style="font-weight: bold;"><h4>New Order Advance Collections</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Order Date</td><td class="tableHeader">Delivery Date</td><td class="tableHeader">Payment Date</td><td class="tableHeader">Invoice Date</td><td class="tableHeader">Sales Staff</td><td class="tableHeader">Order Number</td><td class="tableHeader">Invoice Number</td><td class="tableHeader">Customer Name</td><td class="tableHeader">Order Value</td><td class="tableHeader">Total Discount</td><td class="tableHeader">RoundOff Amount</td><td class="tableHeader">Net Value</td><td class="tableHeader">Previous Balance</td><td class="tableHeader">Amount Collected</td><td class="tableHeader">Current Balance</td></tr>
  ${advRows}
  <tr><td class="tableHeader" colspan="9"><b>TOTAL ADVANCE COLLECTIONS<br>${fmtNum(totalAdvance)}</b></td><td class="tableHeader">TOTAL</td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td></tr>
  <tr><td colspan="16" style="color: #FF0000; font-style: italic;">*Data displayed in the advance collections table is as per order date.</td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="16" align="left" style="font-weight: bold;"><h4>Final Settled Collections</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Order Date</td><td class="tableHeader">Delivery Date</td><td class="tableHeader">Payment Date</td><td class="tableHeader">Invoice Date</td><td class="tableHeader">Sales Staff</td><td class="tableHeader">Order Number</td><td class="tableHeader">Invoice Number</td><td class="tableHeader">Customer Name</td><td class="tableHeader">Order Value</td><td class="tableHeader">Total Discount</td><td class="tableHeader">RoundOff Amount</td><td class="tableHeader">Net Value</td><td class="tableHeader">Previous Balance</td><td class="tableHeader">Amount Collected</td><td class="tableHeader">Current Balance</td></tr>
  ${settledRows}
  <tr><td class="tableHeader" colspan="9"><b>TOTAL FINAL SETTLED COLLECTIONS<br>${fmtNum(totalSettledCollection)}</b></td><td class="tableHeader">TOTAL</td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="7" align="left" style="font-weight: bold;"><h4>Additional Receipts</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Date</td><td class="tableHeader">Sales Staff</td><td class="tableHeader">Voucher Number</td><td class="tableHeader">Narration</td><td class="tableHeader">Credit Ledger</td><td class="tableHeader">Debit Ledger</td></tr>
  <tr><td colspan="7" align="center">No Data Found</td></tr>
  <tr><td class="tableHeader" colspan="3"><b>TOTAL ADDITIONAL RECEIPTS<br>0.00</b></td><td class="tableHeader">TOTAL</td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td></tr>
  <tr><td colspan="7" style="color: #FF0000; font-style: italic;">*Data displayed in the additional receipts table is as per voucher date.</td></tr>
</table>
<table width=500>
  <tr><td colspan="7" align="left" style="font-weight: bold;"><h4>Additional Payments</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Date</td><td class="tableHeader">Sales Staff</td><td class="tableHeader">Voucher Number</td><td class="tableHeader">Narration</td><td class="tableHeader">Credit Ledger</td><td class="tableHeader">Debit Ledger</td></tr>
  <tr><td colspan="7" align="center">No Data Found</td></tr>
  <tr><td class="tableHeader" colspan="3"><b>TOTAL ADDITIONAL PAYMENTS<br>0.00</b></td><td class="tableHeader">TOTAL</td><td class="tableRow"></td><td class="tableRow"></td><td class="tableRow"></td></tr>
  <tr><td colspan="7" style="color: #FF0000; font-style: italic;">*Data displayed in the additional payments table is as per voucher date.</td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="8" align="left" style="font-weight: bold;"><h4>Expenses Payments</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Date</td><td class="tableHeader">Sales Staff</td><td class="tableHeader">Voucher Number</td><td class="tableHeader">Purpose</td><td class="tableHeader">Remarks</td><td class="tableHeader">Payment Mode</td><td class="tableHeader">Payment Amount</td></tr>
  <tr><td colspan="8" align="center">No Data Found</td></tr>
  <tr><td class="tableHeader" colspan="5"><b>TOTAL EXPENSES<br>0.00</b></td><td class="tableHeader">TOTAL</td><td class="tableRow"></td><td class="tableRow"></td></tr>
  <tr><td colspan="8" style="color: #FF0000; font-style: italic;">*Data displayed in the expense payments table is as per expense payment date.</td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="11" align="left" style="font-weight: bold;"><h4>Insurances</h4></td></tr>
  <tr><td class="tableHeader">Sl no</td><td class="tableHeader">Date</td><td class="tableHeader">Order Number</td><td class="tableHeader">Customer Name</td><td class="tableHeader">Insurance Scheme<br>Name</td><td class="tableHeader">Insurance Scheme Number /<br>Insurance Number</td><td class="tableHeader">Pre-Authorised<br>Details</td><td class="tableHeader">Claim Amount</td><td class="tableHeader">Claim Amount<br>Received</td><td class="tableHeader">Claim Number</td><td class="tableHeader">Status</td></tr>
  <tr><td colspan="11" align="center">No Data Found</td></tr>
  <tr><td class="tableHeader" colspan="6"><b>TOTAL INSURANCE CLAIM RECEIVED<br>0.00</b></td><td class="tableHeader">TOTAL</td><td class="tableRow" align="left">0.00</td><td class="tableRow" align="left">0.00</td><td class="tableRow"></td><td class="tableRow"></td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="4" align="left" style="font-weight: bold;"><h4>Payment Summary</h4></td></tr>
  <tr style="font-weight: bold; background-color: #C9C9C9; font-size: 10px;"><td class="tableHeader" color="black">Payment Mode</td><td class="tableHeader" color="black">Collected Payment</td><td class="tableHeader" color="black">Return Payment</td><td class="tableHeader" color="black">Difference</td></tr>
  ${pmRows}
  <tr style="font-weight: bold; background-color: #C9C9C9; font-size: 9px;" align="center"><td class="tableRow" color="black">TOTAL</td><td class="tableRow" color="black">${fmtNum(pmTotal)}</td><td class="tableRow" color="black">0.00</td><td class="tableRow" color="black">${fmtNum(pmTotal)}</td></tr>
</table>
<table width=500>
  <tr><td colspan="2" align="left" style="font-weight: bold;"><h4>Other Summary</h4></td></tr>
  <tr style="font-weight: bold; background-color: #C9C9C9; font-size: 10px;"><td class="tableRow" colspan="2" width="40%" color="black">Customer Credit</td><td class="tableRow" width="60%" color="black">0.00</td></tr>
</table>
<br>
<table width=500>
  <tr><td colspan="6" align="left" style="font-weight: bold;"><h4>Sales Summary</h4></td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total No. of Sales</td><td class="tableRow" width="60%">${dayRecords.length}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Sales</td><td class="tableRow" width="60%">Rs ${fmtNum(totalSales)}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Item Discount</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Cart Discount</td><td class="tableRow" width="60%">Rs ${fmtNum(totalDiscount)}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Loyalty Points Amount</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Discount Coupon</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Gross Sales</td><td class="tableRow" width="60%">Rs ${fmtNum(totalGross)}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Tax</td><td class="tableRow" width="60%">Rs ${fmtNum(totalGrossGst)}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Additional Tax</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Round Off</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Net Sales</td><td class="tableRow" width="60%">Rs ${fmtNum(totalNet)}</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Sales Return</td><td class="tableRow" width="60%">Rs 0.00</td></tr>
  <tr style="font-size: 10px;"><td class="tableRow" colspan="2" width="40%">Total Final Sales</td><td class="tableRow" width="60%">Rs ${fmtNum(totalNet)}</td></tr>
  <tr><td colspan="3" style="color: #FF0000; font-style: italic;">*Data displayed in the sales summary table is as per order date.</td></tr>
</table>
${buildXlsFooter()}`;

  const dateLabel = reportDate.replace(/-/g, '');
  downloadAsXls(`DailyStatement_${dateLabel}.xls`, html);
}

// ─── 2. GST OUTPUT REPORT ─────────────────────────────────────────────────────

export async function generateGSTOutputReportXLS(startDate: string, endDate: string): Promise<void> {
  const resp = await fetch(`${BASE_URL}/billing-records/all-with-products`);
  if (!resp.ok) throw new Error('Failed to load billing records');
  const allRecords: BillingRecord[] = await resp.json();

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const filtered = allRecords.filter(r => {
    if (!r.billDate) return false;
    const d = new Date(r.billDate);
    return d >= start && d <= end;
  });

  let dataRows = '';
  let slNo = 0;

  filtered.forEach(r => {
    if (!r.products || r.products.length === 0) {
      slNo++;
      dataRows += `<tr><td>${slNo}</td><td>${r.branchName || ''}</td><td>35AAIFN0778N1ZQ</td><td>${r.billNumber}</td><td>${r.billNumber}</td><td>${fmtDate(r.billDate)}</td><td>${fmtDate(r.createdAt || r.billDate)}</td><td>${fmtDate(r.billDate)}</td><td>${r.customerName}</td><td></td><td></td><td></td><td>Include</td><td>-</td><td>-</td><td>0</td><td>0</td><td>${fmtNum(r.amount)}</td><td>${fmtNum(r.subtotal)}</td><td>0.00</td><td>0.00</td><td>0.00</td><td></td><td>0.00</td><td>${fmtNum(r.amount)}</td><td>${fmtNum(r.discount)}</td><td>${fmtNum(r.finalPayable)}</td></tr>`;
    } else {
      r.products.forEach(p => {
        slNo++;
        const gstPct = Number(p.gstPercentage) || 0;
        const gstAmt = Number(p.gstAmount) || 0;
        const retail = Number(p.total) || 0;
        const basePrice = gstPct > 0 ? retail / (1 + gstPct / 100) : retail;
        const halfGst = gstAmt / 2;
        const numProds = r.products?.length || 1;
        dataRows += `<tr><td>${slNo}</td><td>${r.branchName || ''}</td><td>35AAIFN0778N1ZQ</td><td>${r.billNumber}</td><td>${r.billNumber}</td><td>${fmtDate(r.billDate)}</td><td>${fmtDate(r.createdAt || r.billDate)}</td><td>${fmtDate(r.billDate)}</td><td>${r.customerName}</td><td></td><td></td><td></td><td>Include</td><td>${p.category || ''}</td><td>${p.hsnCode || ''}</td><td>${p.quantity || 1}</td><td></td><td>${fmtNum(retail)}</td><td>${fmtNum(basePrice)}</td><td>${fmtNum(gstPct)}</td><td>${fmtNum(halfGst)}</td><td>${fmtNum(halfGst)}</td><td></td><td>${fmtNum(gstAmt)}</td><td>${fmtNum(retail)}</td><td>${fmtNum(r.discount / numProds)}</td><td>${fmtNum(retail - r.discount / numProds)}</td></tr>`;
      });
    }
  });

  if (slNo === 0) {
    dataRows = `<tr><td colspan="27" align="center">No Data Found for the selected date range</td></tr>`;
  }

  const html = `${buildXlsHeader('GST Output of Nayana Eye Care')}
<table width=260 border=1>
  <tr><td class="tableHeader">Sl No</td><td class="tableHeader">Branch Name</td><td class="tableHeader">Branch GST Number</td><td class="tableHeader">Order No</td><td class="tableHeader">Bill No</td><td class="tableHeader">Order Date</td><td class="tableHeader">Invoice Date</td><td class="tableHeader">Created Date</td><td class="tableHeader">Name of the Party</td><td class="tableHeader">Company Name</td><td class="tableHeader">GST Number</td><td class="tableHeader">State</td><td class="tableHeader">Tax Type</td><td class="tableHeader">Product Type</td><td class="tableHeader">HSN/SAC</td><td class="tableHeader">Quantity</td><td class="tableHeader">Total Number Of Pieces</td><td class="tableHeader">Total Retail Price</td><td class="tableHeader">Total Base Price</td><td class="tableHeader">GST %</td><td class="tableHeader">Total SGST (Rs )</td><td class="tableHeader">Total CGST (Rs )</td><td class="tableHeader">Total IGST (Rs )</td><td class="tableHeader">Total GST (Rs )</td><td class="tableHeader">Total Gross Amount (Rs )</td><td class="tableHeader">Total Item Discount (Rs )</td><td class="tableHeader">Total Net Amount (Rs )</td></tr>
  ${dataRows}
</table>
${buildXlsFooter()}`;

  const s = startDate.replace(/-/g, '');
  const e = endDate.replace(/-/g, '');
  downloadAsXls(`GSTOutputReport_${s}_${e}.xls`, html);
}

// ─── 3. LENS GRID VIEW REPORT ─────────────────────────────────────────────────
//
// Exact format matching LensGridViewReport.xls sample:
//   ┌── Row 1: meta header spanning all columns
//   ├── Row 2: "SPH" label + one <th rowspan="2"> per power value (columns)
//   ├── Row 3: "CYL" label only (second axis label)
//   └── Rows 4+: one row per CYL power value, cells = inventory quantity at (SPH, CYL)
//
// Power range: 0.00 to 24.00 in 0.25 increments = 97 values (same set for both axes)
// Cell label format: '0  for zero,  '+1.25  for positive values (apostrophe = Excel text)
// Data source: inventory_items WHERE category LIKE '%lens%'
//   SPH/CYL parsed from productCode, subcategory, productName, or description

export async function generateLensGridViewReportXLS(): Promise<void> {
  const resp = await fetch(`${BASE_URL}/inventory`);
  if (!resp.ok) throw new Error('Failed to load inventory');
  const allItems: InventoryRaw[] = await resp.json();

  // Standard positive power series: 0.00, 0.25, 0.50, ..., 24.00 (97 values)
  const powers: string[] = [];
  for (let v = 0; v <= 2400; v += 25) {
    powers.push((v / 100).toFixed(2));
  }

  // Format a power value as an Excel text label: 0.00 -> '0  |  1.25 -> '+1.25
  function powerLabel(val: string): string {
    const n = parseFloat(val);
    if (n === 0) return "'0";
    return `'+${n.toFixed(2)}`;
  }

  // Parse SPH and CYL (as positive absolute values) from an inventory item
  function parseSphCyl(item: InventoryRaw): { sph: number; cyl: number } | null {
    const texts = [
      item.productCode || '',
      item.subcategory || '',
      item.productName || '',
      item.description || '',
    ];
    for (const text of texts) {
      if (!text) continue;
      // Pattern: SPH<number>CYL<number> or SPH <number> CYL <number>
      const labeled = text.match(/sph\s*([+-]?\d+\.?\d*)\s*(?:cyl|x)\s*([+-]?\d+\.?\d*)/i);
      if (labeled) {
        const sph = Math.abs(parseFloat(labeled[1]));
        const cyl = Math.abs(parseFloat(labeled[2]));
        if (!isNaN(sph) && !isNaN(cyl)) return { sph, cyl };
      }
      // Pattern: number / number  or  +number / -number
      const slash = text.match(/([+-]?\d+\.?\d*)\s*\/\s*([+-]?\d+\.?\d*)/);
      if (slash) {
        const sph = Math.abs(parseFloat(slash[1]));
        const cyl = Math.abs(parseFloat(slash[2]));
        if (!isNaN(sph) && !isNaN(cyl)) return { sph, cyl };
      }
      // Pattern: number x number (space-separated cross)
      const cross = text.match(/([+-]?\d+\.?\d*)\s+x\s+([+-]?\d+\.?\d*)/i);
      if (cross) {
        const sph = Math.abs(parseFloat(cross[1]));
        const cyl = Math.abs(parseFloat(cross[2]));
        if (!isNaN(sph) && !isNaN(cyl)) return { sph, cyl };
      }
    }
    return null;
  }

  // Quantity lookup map: "sph:cyl" -> qty
  const qtyMap = new Map<string, number>();

  const lensItems = allItems.filter(item => {
    const cat = (item.category || '').toLowerCase();
    const sub = (item.subcategory || '').toLowerCase();
    return cat === 'lens' || cat.includes('lens') || sub.includes('lens');
  });

  lensItems.forEach(item => {
    const parsed = parseSphCyl(item);
    if (parsed) {
      // Snap to nearest 0.25 grid point
      const sphSnapped = (Math.round(parsed.sph * 4) / 4).toFixed(2);
      const cylSnapped = (Math.round(parsed.cyl * 4) / 4).toFixed(2);
      const key = `${sphSnapped}:${cylSnapped}`;
      qtyMap.set(key, (qtyMap.get(key) ?? 0) + (Number(item.quantity) || 0));
    }
  });

  const totalCols = powers.length + 1; // +1 for the CYL/SPH label column

  // Row 1: meta info row
  const metaRow = `<tr>\n        <th colspan="${totalCols}" align="left">Branch Name : All<br>Parameters : Any<br>Power Numbers : Positive</th>\n    </tr>`;

  // Row 2: SPH header — first cell is "SPH", then one <th rowspan="2"> per power value
  const sphCells = powers.map(p => `<th rowspan="2">${powerLabel(p)}</th>`).join('');
  const sphHeaderRow = `<tr class="tableHeader">\n            <th>SPH</th>${sphCells}\n    </tr>`;

  // Row 3: CYL header — exact quirky HTML from sample (note: </td></th> not </th>)
  const cylHeaderRow = `<tr class="tableHeader"><th>CYL</td></th>`;

  // Data rows: one row per CYL power value
  let dataRows = '';
  powers.forEach(cylVal => {
    const cylLbl = powerLabel(cylVal);
    const cells = powers.map(sphVal => {
      const qty = qtyMap.get(`${sphVal}:${cylVal}`) ?? 0;
      return `<td>${qty}</td>`;
    }).join('');
    dataRows += `<tr><th class="tableHeader">${cylLbl}</th>${cells}</tr>\n`;
  });

  const tableHtml = `<table width=260 border=1>${metaRow}${sphHeaderRow}${cylHeaderRow}${dataRows}</table>`;

  const html = `${buildXlsHeader('Lens Grid View Report of Nayana Eye Care')}
${tableHtml}
${buildXlsFooter()}`;

  downloadAsXls(`LensGridViewReport_${new Date().toISOString().slice(0, 10)}.xls`, html);
}
