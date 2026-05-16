import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config/apiConfig';

export interface BillingRecord {
  billNumber: string;
  billDate: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  lensPowerRight: string;
  lensPowerLeft: string;
  pd: string;
  // New prescription fields
  sphRight?: string;
  cylRight?: string;
  axisRight?: string;
  pdRight?: string;
  sphLeft?: string;
  cylLeft?: string;
  axisLeft?: string;
  pdLeft?: string;
  paymentMethod: string;
  transactionRef: string;
  paidAmount: number;
  additionalNotes: string;
  subtotal: number;
  totalGst: number;
  amount: number;
  discount: number;
  advancePaid: number;
  finalPayable: number;
  paymentStatus: string;
  warrantyDetails: string;
  returnPolicy: string;
  prescriptionDeliveryDate: string;
  authorizedSignatory: string;
  products: Array<{
    productName: string;
    category: string;
    description: string;
    hsnCode: string;
    quantity: number;
    pricePerUnit: number;
    gstPercentage: number;
    gstAmount: number;
    total: number;
  }>;
}

class ExcelService {
  private readonly WEBSITE_NAME = 'Nayan Eye Care';
  private baseUrl = API_BASE_URL;
  
  /**
   * Create a new Excel file with headers
   */
  private createNewExcelFile(year: number): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Define headers for the billing records
    const headers = [
      'Bill Number',
      'Bill Date',
      'Customer Name',
      'Customer Contact',
      'Customer Email',
      'Customer Address',
      'Lens Power Right',
      'Lens Power Left',
      'PD',
      'SPH Right',
      'CYL Right',
      'Axis Right',
      'PD Right',
      'SPH Left',
      'CYL Left',
      'Axis Left',
      'PD Left',
      'Payment Method',
      'Transaction Ref',
      'Paid Amount',
      'Additional Notes',
      'Subtotal',
      'Total GST',
      'Amount',
      'Discount',
      'Advance Paid',
      'Final Payable',
      'Payment Status',
      'Warranty Details',
      'Return Policy',
      'Prescription Delivery Date',
      'Authorized Signatory',
      'Product Names',
      'Product Categories',
      'Product Descriptions',
      'HSN Codes',
      'Quantities',
      'Price Per Unit',
      'GST Percentages',
      'GST Amounts',
      'Product Totals'
    ];
    
    // Create worksheet with headers
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Billing Records ${year}`);
    
    return wb;
  }
  
  /**
   * Load billing records from backend API
   */
  private async loadBillingRecordsFromBackend(year: number): Promise<BillingRecord[]> {
    try {
      // Get all billing records from backend
      const response = await fetch(`${this.baseUrl}/billing-records`);
      if (!response.ok) {
        throw new Error('Failed to load billing records from backend');
      }
      
      const allRecords = await response.json();
      
      // Filter records for the specified year
      const yearRecords = allRecords.filter((record: any) => {
        const billDate = new Date(record.billDate);
        return billDate.getFullYear() === year;
      });
      
      return yearRecords;
    } catch (error) {
      console.error('Error loading billing records from backend:', error);
      return [];
    }
  }
  
  /**
   * Convert billing records to Excel format
   */
  private convertBillingRecordsToExcelData(records: BillingRecord[]): any[][] {
    return records.map(record => {
      // Combine product information into single columns
      const productNames = record.products.map(p => p.productName).join('; ');
      const productCategories = record.products.map(p => p.category).join('; ');
      const productDescriptions = record.products.map(p => p.description).join('; ');
      const hsnCodes = record.products.map(p => p.hsnCode).join('; ');
      const quantities = record.products.map(p => p.quantity).join('; ');
      const pricePerUnits = record.products.map(p => p.pricePerUnit).join('; ');
      const gstPercentages = record.products.map(p => p.gstPercentage).join('; ');
      const gstAmounts = record.products.map(p => p.gstAmount).join('; ');
      const productTotals = record.products.map(p => p.total).join('; ');
      
      return [
        record.billNumber,
        record.billDate,
        record.customerName,
        record.customerContact,
        record.customerEmail,
        record.customerAddress,
        record.lensPowerRight,
        record.lensPowerLeft,
        record.pd,
        record.sphRight || '',
        record.cylRight || '',
        record.axisRight || '',
        record.pdRight || '',
        record.sphLeft || '',
        record.cylLeft || '',
        record.axisLeft || '',
        record.pdLeft || '',
        record.paymentMethod,
        record.transactionRef,
        record.paidAmount,
        record.additionalNotes,
        record.subtotal,
        record.totalGst,
        record.amount,
        record.discount,
        record.advancePaid,
        record.finalPayable,
        record.paymentStatus,
        record.warrantyDetails,
        record.returnPolicy,
        record.prescriptionDeliveryDate,
        record.authorizedSignatory,
        productNames,
        productCategories,
        productDescriptions,
        hsnCodes,
        quantities,
        pricePerUnits,
        gstPercentages,
        gstAmounts,
        productTotals
      ];
    });
  }
  
  /**
   * Save billing record to Excel file
   */
  async saveBillingRecord(record: BillingRecord): Promise<void> {
    const year = new Date(record.billDate).getFullYear();
    
    try {
      // Load existing records from backend
      const existingRecords = await this.loadBillingRecordsFromBackend(year);
      
      // Add new record
      const updatedRecords = [...existingRecords, record];
      
      // Create Excel workbook
      const wb = this.createNewExcelFile(year);
      const ws = wb.Sheets[`Billing Records ${year}`];
      
      // Convert records to Excel data
      const excelData = this.convertBillingRecordsToExcelData(updatedRecords);
      
      // Add data to worksheet (skip first row as it contains headers)
      XLSX.utils.sheet_add_aoa(ws, excelData, { origin: 'A2' });
      
      // Generate filename
      const filename = `billing_records_${year}_${Date.now()}.xlsx`;
      
      // Save to backend (you can implement this if needed)
      await this.saveExcelToBackend(wb, filename);
      
      console.log(`Billing record saved to Excel file: ${filename}`);
    } catch (error) {
      console.error('Error saving billing record to Excel:', error);
      throw error;
    }
  }
  
  /**
   * Save Excel file to backend
   */
  private async saveExcelToBackend(wb: XLSX.WorkBook, filename: string): Promise<void> {
    try {
      // Convert workbook to buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', new Blob([excelBuffer]), filename);
      
      // Send to backend
      const response = await fetch(`${this.baseUrl}/files/save-excel`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Excel file to backend');
      }
      
      console.log('Excel file saved to backend successfully');
    } catch (error) {
      console.error('Error saving Excel file to backend:', error);
      // Fallback: download file locally
      this.downloadExcelFile(wb, filename);
    }
  }
  
  /**
   * Download Excel file locally (fallback)
   */
  private downloadExcelFile(wb: XLSX.WorkBook, filename: string): void {
    try {
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      window.URL.revokeObjectURL(url);
      console.log(`Excel file downloaded locally: ${filename}`);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
    }
  }
  
  /**
   * Export all billing records for a specific year to Excel
   */
  async exportBillingRecordsForYear(year: number): Promise<void> {
    try {
      // Load records from backend
      const records = await this.loadBillingRecordsFromBackend(year);
      
      if (records.length === 0) {
        console.log(`No billing records found for year ${year}`);
        return;
      }
      
      // Create Excel workbook
      const wb = this.createNewExcelFile(year);
      const ws = wb.Sheets[`Billing Records ${year}`];
      
      // Convert records to Excel data
      const excelData = this.convertBillingRecordsToExcelData(records);
      
      // Add data to worksheet (skip first row as it contains headers)
      XLSX.utils.sheet_add_aoa(ws, excelData, { origin: 'A2' });
      
      // Generate filename
      const filename = `billing_records_${year}_${Date.now()}.xlsx`;
      
      // Save to backend
      await this.saveExcelToBackend(wb, filename);
      
      console.log(`Exported ${records.length} billing records for year ${year}`);
    } catch (error) {
      console.error('Error exporting billing records:', error);
      throw error;
    }
  }
  
  /**
   * Export billing records for a date range
   */
  async exportBillingRecordsForDateRange(startDate: string, endDate: string): Promise<void> {
    try {
      // Get billing records for date range from backend
      const response = await fetch(`${this.baseUrl}/billing-records/date-range?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to load billing records for date range');
      }
      
      const records = await response.json();
      
      if (records.length === 0) {
        console.log(`No billing records found for date range ${startDate} to ${endDate}`);
        return;
      }
      
      // Create Excel workbook
      const year = new Date(startDate).getFullYear();
      const wb = this.createNewExcelFile(year);
      const ws = wb.Sheets[`Billing Records ${year}`];
      
      // Convert records to Excel data
      const excelData = this.convertBillingRecordsToExcelData(records);
      
      // Add data to worksheet (skip first row as it contains headers)
      XLSX.utils.sheet_add_aoa(ws, excelData, { origin: 'A2' });
      
      // Generate filename
      const filename = `billing_records_${startDate}_to_${endDate}_${Date.now()}.xlsx`;
      
      // Save to backend
      await this.saveExcelToBackend(wb, filename);
      
      console.log(`Exported ${records.length} billing records for date range ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error exporting billing records for date range:', error);
      throw error;
    }
  }
}

export default new ExcelService();
