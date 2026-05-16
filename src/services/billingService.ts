// Billing service for handling billing operations
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';

function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

/** Full billing data structure used when creating/saving a billing invoice. */
export interface BillingData {
  store: {
    name: string;
    tagline: string;
    branch: { code: string; name: string; address: string };
    address: { street: string; building: string; city: string; state: string; pincode: string; country: string };
    contact: { phone: string; email: string; website: string; gstin: string };
  };
  invoice: { billNumber: string; billDate: string; paymentDueDate: string; generatedAt: string };
  customer: { name: string; contact: string; email: string; address: string };
  prescription: {
    lensPowerRight: string; lensPowerLeft: string; pd: string;
    sphRight?: string; cylRight?: string; axisRight?: string; pdRight?: string;
    sphLeft?: string; cylLeft?: string; axisLeft?: string; pdLeft?: string;
    additionalNotes: string;
  };
  products: Array<{
    id: number; productName: string; category: string; description: string;
    hsnCode: string; quantity: number; pricePerUnit: number;
    gstPercentage: number; gstAmount: number; total: number;
  }>;
  billingSummary: { subtotal: number; totalGst: number; amount: number; discount: number; advancePaid: number; finalPayable: number };
  payment: { method: string; transactionRef: string; status: string };
  additionalInfo: { warrantyDetails: string; returnPolicy: string; prescriptionDeliveryDate: string; authorizedSignatory: string };
}

export interface BillingProduct {
  id: number;
  productName: string;
  category: string;
  description: string;
  hsnCode: string;
  productCode?: string;
  quantity: number;
  pricePerUnit: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
}

export interface BillingRecordDB {
  id: number;
  billNumber: string;
  billDate: string;
  branchCode: string;
  branchName: string;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  customerAddress?: string;
  lensPowerRight?: string;
  lensPowerLeft?: string;
  pd?: string;
  sphRight?: string;
  cylRight?: string;
  axisRight?: string;
  pdRight?: string;
  sphLeft?: string;
  cylLeft?: string;
  axisLeft?: string;
  pdLeft?: string;
  additionalNotes?: string;
  subtotal: number;
  totalGst: number;
  amount: number;
  discount: number;
  advancePaid: number;
  finalPayable: number;
  paymentMethod?: string;
  transactionRef?: string;
  paymentStatus: string;
  paymentDate?: string;
  warrantyDetails?: string;
  returnPolicy?: string;
  prescriptionDeliveryDate?: string;
  authorizedSignatory?: string;
  createdAt?: string;
  updatedAt?: string;
  products: BillingProduct[];
  customer?: any;
}

export interface BillingCustomerData {
  customerId: string;
  name: string;
  mobileNo: string;
  email?: string;
  address?: string;
  branchName: string;
  branchCode: string;
  dateOfVisit: string;
  billNumber: string;
  billDate: string;
  totalAmount: number;
  lastVisitDate: string;
  visitCount: number;
}

export interface CustomerBillingSummary {
  id: string | number;
  dbId: string | number | null;
  name: string;
  mobileNo: string;
  email?: string;
  address?: string;
  branchName: string;
  branchCode: string;
  dateOfBirth?: string;
  anniversary?: string;
  dateOfVisit: string;
  lastVisitDate: string;
  visitCount: number;
  totalSpent: number;
  averageBillAmount: number;
  lastBillNumber: string;
  lastBillDate: string;
  source: 'customer_record' | 'billing_record' | 'combined';
}

class BillingService {
  private baseUrl = API_BASE_URL;

  private mapBillingRecordToCustomerData(billingRecord: BillingRecordDB): BillingCustomerData {
    return {
      customerId: billingRecord.billNumber || `BILL-${billingRecord.id ?? Date.now()}`,
      name: billingRecord.customerName || 'Unknown Customer',
      mobileNo: billingRecord.customerContact || '',
      email: billingRecord.customerEmail || '',
      address: billingRecord.customerAddress || '',
      branchName: billingRecord.branchName || 'Unknown Branch',
      branchCode: billingRecord.branchCode || '',
      dateOfVisit: billingRecord.billDate || new Date().toISOString().split('T')[0],
      billNumber: billingRecord.billNumber || '',
      billDate: billingRecord.billDate || '',
      totalAmount: billingRecord.amount || 0,
      lastVisitDate: billingRecord.billDate || '',
      visitCount: 1,
    };
  }

  /**
   * Save billing record to MySQL database via REST API
   */
  async saveBillingRecordToDatabase(billingData: any): Promise<{ success: boolean; message: string; id?: number; duplicate?: boolean }> {
    try {
      // Transform frontend billing data to backend BillingRecord format
      const billingRecord = this.transformToBackendFormat(billingData);

      const response = await fetch(`${this.baseUrl}/billing-records`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(billingRecord),
      });

      if (response.ok) {
        const savedRecord = await response.json();
        return {
          success: true,
          message: savedRecord.message || 'Billing record saved to database',
          id: savedRecord.id ?? savedRecord.record?.id,
          duplicate: Boolean(savedRecord.duplicate),
        };
      } else {
        const errorText = await response.text();
        console.error('Failed to save billing record to database:', errorText);
        return {
          success: false,
          message: `Database save failed: ${response.status} - ${errorText}`,
        };
      }
    } catch (error) {
      console.error('Error saving billing record to database:', error);
      return {
        success: false,
        message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Transform frontend billing data format to backend BillingRecord format
   */
  private transformToBackendFormat(billingData: any): any {
    return {
      billNumber: billingData.invoice?.billNumber || billingData.billNumber,
      billDate: billingData.invoice?.billDate || billingData.billDate || new Date().toISOString().split('T')[0],
      branchCode: billingData.store?.branch?.code || billingData.selectedBranch || '',
      branchName: billingData.store?.branch?.name || '',
      customerName: billingData.customer?.name || billingData.customerName || '',
      customerContact: billingData.customer?.contact || billingData.customerContact || '',
      customerEmail: billingData.customer?.email || billingData.customerEmail || '',
      customerAddress: billingData.customer?.address || billingData.customerAddress || '',
      lensPowerRight: billingData.prescription?.lensPowerRight || '',
      lensPowerLeft: billingData.prescription?.lensPowerLeft || '',
      pd: billingData.prescription?.pd || '',
      sphRight: billingData.prescription?.sphRight || '',
      cylRight: billingData.prescription?.cylRight || '',
      axisRight: billingData.prescription?.axisRight || '',
      pdRight: billingData.prescription?.pdRight || '',
      sphLeft: billingData.prescription?.sphLeft || '',
      cylLeft: billingData.prescription?.cylLeft || '',
      axisLeft: billingData.prescription?.axisLeft || '',
      pdLeft: billingData.prescription?.pdLeft || '',
      additionalNotes: billingData.prescription?.additionalNotes || '',
      subtotal: billingData.billingSummary?.subtotal || 0,
      totalGst: billingData.billingSummary?.totalGst || 0,
      amount: billingData.billingSummary?.amount || billingData.billingSummary?.subtotal || 0,
      discount: billingData.billingSummary?.discount || 0,
      advancePaid: billingData.billingSummary?.advancePaid || 0,
      finalPayable: billingData.billingSummary?.finalPayable || 0,
      paymentMethod: billingData.payment?.method || billingData.paymentMethod || '',
      transactionRef: billingData.payment?.transactionRef || billingData.transactionRef || '',
      paymentStatus: billingData.payment?.status || billingData.paymentStatus || 'Pending',
      warrantyDetails: billingData.additionalInfo?.warrantyDetails || '',
      returnPolicy: billingData.additionalInfo?.returnPolicy || '',
      prescriptionDeliveryDate: billingData.additionalInfo?.prescriptionDeliveryDate || '',
      authorizedSignatory: billingData.additionalInfo?.authorizedSignatory || '',
      products: (billingData.products || []).map((p: any, index: number) => ({
        productName: p.productName || '',
        category: p.category || '',
        description: p.description || '',
        hsnCode: p.hsnCode || '',
        productCode: p.productCode || '',
        quantity: p.quantity || 1,
        pricePerUnit: p.pricePerUnit || 0,
        gstPercentage: p.gstPercentage || 0,
        gstAmount: p.gstAmount || 0,
        total: p.total || 0,
      })),
    };
  }

  async loadBillingData(): Promise<BillingRecordDB[]> {
    try {
      const response = await fetch(`${this.baseUrl}/billing-records`, { headers: getHeaders() });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load billing data');
    } catch (error) {
      console.error('Error loading billing data:', error);
      return [];
    }
  }

  /**
   * Load billing records from MySQL database with all fields properly mapped for BillingRecords.tsx
   */
  async loadBillingRecordsFromDatabase(year?: number): Promise<BillingRecordDB[]> {
    try {
      const url = year
        ? `${this.baseUrl}/billing-records/year/${year}`
        : `${this.baseUrl}/billing-records/all-with-products`;
      const response = await fetch(url, { headers: getHeaders() });
      if (response.ok) {
        const records: BillingRecordDB[] = await response.json();
        return records;
      }
      throw new Error('Failed to load billing records from database');
    } catch (error) {
      console.error('Error loading billing records from database:', error);
      return [];
    }
  }
  
  async loadCustomerData(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, { headers: getHeaders() });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load customer data');
    } catch (error) {
      console.error('Error loading customer data:', error);
      return [];
    }
  }
  
  extractCustomerDataFromBilling(billingRecord: BillingRecordDB): BillingCustomerData {
    return this.mapBillingRecordToCustomerData(billingRecord);
  }
  
  aggregateCustomerBillingData(mobileNo: string, email?: string): CustomerBillingSummary | null {
    // This method will be implemented to aggregate data from the backend
    // For now, return null as we'll get aggregated data directly from the backend
    return null;
  }
  
  async mergeCustomerAndBillingData(customers: any[], billingData: BillingRecordDB[]): Promise<CustomerBillingSummary[]> {
    const mergedCustomers: CustomerBillingSummary[] = [];
    
    // Process customers first
    for (const customer of customers) {
      const customerSummary: CustomerBillingSummary = {
        id: customer.id?.toString() || `CUST-${Date.now()}`,
        dbId: customer.id ?? null,
        name: customer.fullName || 'Unknown Customer',
        mobileNo: customer.mobileNo || '',
        email: customer.email || '',
        address: customer.address || '',
        branchName: customer.branchName || 'Unknown Branch',
        branchCode: customer.branchCode || '',
        dateOfBirth: customer.dateOfBirth || '',
        anniversary: customer.anniversary || '',
        dateOfVisit: customer.dateOfVisit || new Date().toISOString().split('T')[0],
        lastVisitDate: customer.lastVisitDate || customer.dateOfVisit || '',
        visitCount: customer.visitCount || 0,
        totalSpent: customer.totalSpent || 0,
        averageBillAmount: customer.averageBillAmount || 0,
        lastBillNumber: customer.lastBillNumber || '',
        lastBillDate: customer.lastBillDate || '',
        source: 'customer_record'
      };
      
      mergedCustomers.push(customerSummary);
    }
    
    // Process billing data to find customers not in customer records
    for (const billing of billingData) {
      const billingCustomer = this.mapBillingRecordToCustomerData(billing);
      const existingCustomer = mergedCustomers.find(c => c.mobileNo === billingCustomer.mobileNo);
      
      if (!existingCustomer) {
        // Create new customer from billing data
        const customerSummary: CustomerBillingSummary = {
          id: `BILL-${billing.id || Date.now()}`,
          dbId: null,
          name: billingCustomer.name,
          mobileNo: billingCustomer.mobileNo,
          email: billingCustomer.email || '',
          address: billingCustomer.address || '',
          branchName: billingCustomer.branchName || 'Unknown Branch',
          branchCode: billingCustomer.branchCode || '',
          dateOfBirth: '',
          anniversary: '',
          dateOfVisit: billingCustomer.dateOfVisit,
          lastVisitDate: billingCustomer.lastVisitDate,
          visitCount: 1,
          totalSpent: billing.finalPayable || 0,
          averageBillAmount: billing.finalPayable || 0,
          lastBillNumber: billingCustomer.billNumber,
          lastBillDate: billingCustomer.billDate,
          source: 'billing_record'
        };
        
        mergedCustomers.push(customerSummary);
      } else {
        // Update existing customer with billing data
        existingCustomer.visitCount = (existingCustomer.visitCount || 0) + 1;
        existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + (billing.finalPayable || 0);
        existingCustomer.averageBillAmount = existingCustomer.totalSpent / existingCustomer.visitCount;
        existingCustomer.lastBillNumber = billingCustomer.billNumber || existingCustomer.lastBillNumber;
        existingCustomer.lastBillDate = billingCustomer.billDate || existingCustomer.lastBillDate;
        existingCustomer.branchName = existingCustomer.branchName || billingCustomer.branchName;
        existingCustomer.branchCode = existingCustomer.branchCode || billingCustomer.branchCode;
        existingCustomer.source = 'combined';
      }
    }
    
    return mergedCustomers;
  }
  
  async syncCustomerData(): Promise<CustomerBillingSummary[]> {
    const billingData = await this.loadBillingData();
    const customerData = await this.loadCustomerData();
    
    const mergedData = this.mergeCustomerAndBillingData(customerData, billingData);
    
    return mergedData;
  }
  
  getCustomerBillingHistory(mobileNo: string): any[] {
    // This will be implemented to get data from the backend
    return [];
  }
  
  async getNextInvoiceNumber(branchCode: string, branchName: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/numbering/next-bill-number?branchCode=${encodeURIComponent(branchCode)}&branchName=${encodeURIComponent(branchName)}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        return data.billNumber || data.nextBillNumber || data;
      }
      // Fallback: generate locally
      return this.generateLocalBillNumber(branchName);
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      // Fallback: generate locally
      return this.generateLocalBillNumber(branchName);
    }
  }

  /**
   * Validate and fix invoice number if incorrect
   * Returns { isValid, correctedBillNumber, message }
   */
  async validateAndFixInvoiceNumber(billNumber: string, branchCode: string, branchName: string): Promise<{ isValid: boolean; correctedBillNumber: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/numbering/validate-bill-number?billNumber=${encodeURIComponent(billNumber)}&branchCode=${encodeURIComponent(branchCode)}&branchName=${encodeURIComponent(branchName)}`, { headers: getHeaders() });
      if (response.ok) {
        return await response.json();
      }
      // Fallback: generate new number
      const newNumber = this.generateLocalBillNumber(branchName);
      return { isValid: false, correctedBillNumber: newNumber, message: 'Validation failed. Generated new number.' };
    } catch (error) {
      console.error('Error validating invoice number:', error);
      const newNumber = this.generateLocalBillNumber(branchName);
      return { isValid: false, correctedBillNumber: newNumber, message: 'Validation error. Generated new number.' };
    }
  }

  /**
   * Get next bill number with consistency check between MySQL and JSON
   * Returns { nextBillNumber, mysqlLatest, jsonLatest, isConsistent }
   */
  async getNextInvoiceNumberWithConsistencyCheck(branchCode: string, branchName: string): Promise<{ nextBillNumber: string; mysqlLatest: string | null; jsonLatest: string | null; isConsistent: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/numbering/next-bill-number-with-check?branchCode=${encodeURIComponent(branchCode)}&branchName=${encodeURIComponent(branchName)}`, { headers: getHeaders() });
      if (response.ok) {
        return await response.json();
      }
      const newNumber = this.generateLocalBillNumber(branchName);
      return { nextBillNumber: newNumber, mysqlLatest: null, jsonLatest: null, isConsistent: true };
    } catch (error) {
      console.error('Error checking invoice number consistency:', error);
      const newNumber = this.generateLocalBillNumber(branchName);
      return { nextBillNumber: newNumber, mysqlLatest: null, jsonLatest: null, isConsistent: true };
    }
  }

  /**
   * Generate bill number locally as fallback
   * Format: [FIRST4BRANCH]-DDMMYYYY-XXXX (e.g., JUNG-01042026-0001)
   */
  private generateLocalBillNumber(branchName: string): string {
    const branchPrefix = this.extractBranchPrefix(branchName);
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}${month}${year}`;
    // Deterministic offline fallback; real sequencing should come from the backend.
    return `${branchPrefix}-${dateStr}-0001`;
  }

  /**
   * Extract first 4 uppercase letters from branch name
   */
  private extractBranchPrefix(branchName: string): string {
    if (!branchName) return 'XXXX';
    const uppercased = branchName.toUpperCase().replace(/[^A-Z]/g, '');
    if (uppercased.length < 4) {
      return (uppercased + 'XXXX').substring(0, 4);
    }
    return uppercased.substring(0, 4);
  }
  async getCustomerBillingHistoryFromBackend(mobileNo: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/billing-records/customer-history/${mobileNo}`, { headers: getHeaders() });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting customer billing history:', error);
      return [];
    }
  }
}

export default new BillingService();
