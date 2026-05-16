import authService from './authService';
import billingService from './billingService';
import customerService, { Customer } from './customerService';
import { User } from '../types/auth';

export interface CustomerPortalPrescription {
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
}

export interface CustomerPortalBillProduct {
  productName: string;
  category: string;
  description?: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface CustomerPortalBill {
  id: string;
  billNumber: string;
  billDate: string;
  branchName: string;
  branchCode: string;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  customerAddress?: string;
  finalPayable: number;
  subtotal: number;
  totalGst: number;
  discount: number;
  advancePaid: number;
  paymentStatus: string;
  warrantyDetails?: string;
  returnPolicy?: string;
  prescriptionDeliveryDate?: string;
  products: CustomerPortalBillProduct[];
  prescription: CustomerPortalPrescription;
}

export interface CustomerPortalSummary {
  totalSpent: number;
  totalBills: number;
  totalVisits: number;
  prescriptionsCount: number;
  upcomingDeliveries: number;
}

export interface CustomerPortalContext {
  user: User | null;
  customerRecord: Customer | null;
  bills: CustomerPortalBill[];
  summary: CustomerPortalSummary;
}

export interface CustomerReturnRequest {
  id: string;
  billNumber: string;
  productName: string;
  quantity: number;
  reason: string;
  preferredResolution: string;
  notes?: string;
  status: 'Submitted' | 'Reviewing' | 'Approved' | 'Rejected' | 'Completed';
  createdAt: string;
}

export interface EyeTestBooking {
  id: string;
  branchName: string;
  appointmentDate: string;
  timeSlot: string;
  concern: string;
  notes?: string;
  status: 'Requested' | 'Confirmed' | 'Completed';
  createdAt: string;
}

export interface ContactLensReorder {
  id: string;
  productName: string;
  lensPower?: string;
  quantity: number;
  preferredBranch: string;
  notes?: string;
  status: 'Requested' | 'Preparing' | 'Ready for Pickup';
  createdAt: string;
}

const BRANCH_OPTIONS = [
  'Junglighat',
  'Bathubasti',
  'Diglipur',
  'Mayabunder',
  'Rangat',
  'Havelock',
  'Neil Island',
];

class CustomerPortalService {
  private normalizeGender(value?: string): string | undefined {
    if (!value) {
      return value;
    }

    const normalized = value.trim().toUpperCase();
    return normalized || undefined;
  }

  private pickProfileValue<T>(updatedValue: T | null | undefined, existingValue: T | null | undefined): T | null | undefined {
    return updatedValue !== undefined ? updatedValue : existingValue;
  }

  private normalizeText(value?: string | null): string {
    return (value || '').trim().toLowerCase();
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  private hasPrescription(prescription: CustomerPortalPrescription): boolean {
    return Object.values(prescription).some((value) => !!value);
  }

  private normalizeProducts(products: any[] = []): CustomerPortalBillProduct[] {
    return products.map((product, index) => ({
      productName: product.productName || product.name || `Item ${index + 1}`,
      category: product.category || 'General',
      description: product.description || '',
      quantity: this.toNumber(product.quantity),
      pricePerUnit: this.toNumber(product.pricePerUnit),
      total:
        this.toNumber(product.total) ||
        this.toNumber(product.quantity) * this.toNumber(product.pricePerUnit),
    }));
  }

  private normalizeBill(record: any, index: number): CustomerPortalBill {
    const nestedInvoice = record.invoice || {};
    const nestedCustomer = record.customer || {};
    const nestedPrescription = record.prescription || {};
    const nestedSummary = record.billingSummary || {};
    const nestedAdditional = record.additionalInfo || {};
    const nestedStore = record.store || {};
    const nestedBranch = nestedStore.branch || {};

    return {
      id: String(record.id ?? nestedInvoice.billNumber ?? index),
      billNumber: record.billNumber || nestedInvoice.billNumber || `BILL-${index + 1}`,
      billDate: record.billDate || nestedInvoice.billDate || new Date().toISOString().split('T')[0],
      branchName: record.branchName || nestedBranch.name || 'Unknown Branch',
      branchCode: record.branchCode || nestedBranch.code || '',
      customerName: record.customerName || nestedCustomer.name || '',
      customerContact: record.customerContact || nestedCustomer.contact || '',
      customerEmail: record.customerEmail || nestedCustomer.email || '',
      customerAddress: record.customerAddress || nestedCustomer.address || '',
      finalPayable: this.toNumber(record.finalPayable ?? nestedSummary.finalPayable),
      subtotal: this.toNumber(record.subtotal ?? nestedSummary.subtotal),
      totalGst: this.toNumber(record.totalGst ?? nestedSummary.totalGst),
      discount: this.toNumber(record.discount ?? nestedSummary.discount),
      advancePaid: this.toNumber(record.advancePaid ?? nestedSummary.advancePaid),
      paymentStatus: record.paymentStatus || nestedAdditional.paymentStatus || 'Pending',
      warrantyDetails: record.warrantyDetails || nestedAdditional.warrantyDetails || '',
      returnPolicy: record.returnPolicy || nestedAdditional.returnPolicy || '',
      prescriptionDeliveryDate:
        record.prescriptionDeliveryDate || nestedAdditional.prescriptionDeliveryDate || '',
      products: this.normalizeProducts(record.products || []),
      prescription: {
        lensPowerRight: record.lensPowerRight || nestedPrescription.lensPowerRight || '',
        lensPowerLeft: record.lensPowerLeft || nestedPrescription.lensPowerLeft || '',
        pd: record.pd || nestedPrescription.pd || '',
        sphRight: record.sphRight || nestedPrescription.sphRight || '',
        cylRight: record.cylRight || nestedPrescription.cylRight || '',
        axisRight: record.axisRight || nestedPrescription.axisRight || '',
        pdRight: record.pdRight || nestedPrescription.pdRight || '',
        sphLeft: record.sphLeft || nestedPrescription.sphLeft || '',
        cylLeft: record.cylLeft || nestedPrescription.cylLeft || '',
        axisLeft: record.axisLeft || nestedPrescription.axisLeft || '',
        pdLeft: record.pdLeft || nestedPrescription.pdLeft || '',
        additionalNotes: record.additionalNotes || nestedPrescription.additionalNotes || '',
      },
    };
  }

  private matchCustomerRecord(user: User, customers: Customer[]): Customer | null {
    const userEmail = this.normalizeText(user.email);
    const userPhone = this.normalizeText(user.phone);
    const userName = this.normalizeText(`${user.firstName} ${user.lastName}`);

    return (
      customers.find((customer) => {
        const emailMatches = userEmail && this.normalizeText(customer.email) === userEmail;
        const phoneMatches = userPhone && this.normalizeText(customer.mobileNo) === userPhone;
        const nameMatches = userName && this.normalizeText(customer.fullName) === userName;
        return emailMatches || phoneMatches || nameMatches;
      }) || null
    );
  }

  private matchBill(
    bill: CustomerPortalBill,
    user: User,
    customerRecord: Customer | null
  ): boolean {
    const userEmail = this.normalizeText(user.email);
    const userPhone = this.normalizeText(user.phone);
    const userName = this.normalizeText(`${user.firstName} ${user.lastName}`);
    const recordEmail = this.normalizeText(customerRecord?.email);
    const recordPhone = this.normalizeText(customerRecord?.mobileNo);
    const recordName = this.normalizeText(customerRecord?.fullName);

    const billEmail = this.normalizeText(bill.customerEmail);
    const billPhone = this.normalizeText(bill.customerContact);
    const billName = this.normalizeText(bill.customerName);

    return Boolean(
      (userEmail && billEmail && userEmail === billEmail) ||
        (userPhone && billPhone && userPhone === billPhone) ||
        (userName && billName && userName === billName) ||
        (recordEmail && billEmail && recordEmail === billEmail) ||
        (recordPhone && billPhone && recordPhone === billPhone) ||
        (recordName && billName && recordName === billName)
    );
  }

  private buildSummary(
    bills: CustomerPortalBill[],
    customerRecord: Customer | null
  ): CustomerPortalSummary {
    const prescriptionsCount = bills.filter((bill) => this.hasPrescription(bill.prescription)).length;
    const upcomingDeliveries = bills.filter((bill) => {
      if (!bill.prescriptionDeliveryDate) {
        return false;
      }

      return new Date(bill.prescriptionDeliveryDate) >= new Date();
    }).length;

    return {
      totalSpent:
        customerRecord?.totalSpent ||
        bills.reduce((sum, bill) => sum + this.toNumber(bill.finalPayable), 0),
      totalBills: bills.length,
      totalVisits: customerRecord?.visitCount || bills.length,
      prescriptionsCount,
      upcomingDeliveries,
    };
  }

  private getUserStorageKey(prefix: string, user: User | null): string {
    const identifier =
      user?.email ||
      user?.phone ||
      `${this.normalizeText(user?.firstName)}-${this.normalizeText(user?.lastName)}` ||
      'guest';

    return `customer-portal:${prefix}:${identifier}`;
  }

  private readStorage<T>(prefix: string, user: User | null): T[] {
    try {
      const stored = localStorage.getItem(this.getUserStorageKey(prefix, user));
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`CustomerPortalService: failed to read ${prefix}`, error);
      return [];
    }
  }

  private writeStorage<T>(prefix: string, user: User | null, items: T[]) {
    localStorage.setItem(this.getUserStorageKey(prefix, user), JSON.stringify(items));
  }

  getBranchOptions(): string[] {
    return BRANCH_OPTIONS;
  }

  getCurrentUser(): User | null {
    const user = authService.getUser();
    if (!user || user.userType !== 'customer') {
      return null;
    }

    return user;
  }

  async getPortalContext(): Promise<CustomerPortalContext> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        user: null,
        customerRecord: null,
        bills: [],
        summary: {
          totalSpent: 0,
          totalBills: 0,
          totalVisits: 0,
          prescriptionsCount: 0,
          upcomingDeliveries: 0,
        },
      };
    }

    const [customers, billingRecords] = await Promise.all([
      customerService.getAllCustomers(),
      billingService.loadBillingData(),
    ]);

    const customerRecord = this.matchCustomerRecord(user, customers);
    const bills = billingRecords
      .map((record, index) => this.normalizeBill(record, index))
      .filter((bill) => this.matchBill(bill, user, customerRecord))
      .sort((left, right) => new Date(right.billDate).getTime() - new Date(left.billDate).getTime());

    return {
      user,
      customerRecord,
      bills,
      summary: this.buildSummary(bills, customerRecord),
    };
  }

  async saveProfile(updates: Partial<User & Customer>): Promise<{ success: boolean; message: string }> {
    const user = this.getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: 'No authenticated customer session found',
      };
    }

    const customers = await customerService.getAllCustomers();
    const existingRecord = this.matchCustomerRecord(user, customers);

    if (!existingRecord) {
      authService.updateCurrentUser(updates);
      return {
        success: true,
        message: 'Profile saved to your session. A customer master record was not found yet.',
      };
    }

    const result = await customerService.updateCustomer(existingRecord.id, {
      ...existingRecord,
      fullName:
        `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`.trim() ||
        existingRecord.fullName,
      email: this.pickProfileValue(updates.email, existingRecord.email),
      mobileNo: this.pickProfileValue(updates.phone, existingRecord.mobileNo),
      address: this.pickProfileValue(updates.address, existingRecord.address),
      city: this.pickProfileValue(updates.city, existingRecord.city),
      dateOfBirth: this.pickProfileValue(updates.dateOfBirth, existingRecord.dateOfBirth),
      anniversary: this.pickProfileValue(updates.anniversary, existingRecord.anniversary),
      notes: this.pickProfileValue(updates.notes, existingRecord.notes),
      branchName: this.pickProfileValue(updates.preferredBranch, existingRecord.branchName),
      gender: this.normalizeGender(updates.gender) || this.normalizeGender(existingRecord.gender) || '',
    });

    if (result.success) {
      authService.updateCurrentUser(updates);
    }

    return {
      success: result.success,
      message: result.message,
    };
  }

  getReturnRequests(user: User | null = this.getCurrentUser()): CustomerReturnRequest[] {
    return this.readStorage<CustomerReturnRequest>('returns', user).sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  saveReturnRequest(
    request: Omit<CustomerReturnRequest, 'id' | 'status' | 'createdAt'>,
    user: User | null = this.getCurrentUser()
  ): CustomerReturnRequest {
    const requests = this.getReturnRequests(user);
    const createdRequest: CustomerReturnRequest = {
      ...request,
      id: `RET-${Date.now()}`,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    this.writeStorage('returns', user, [createdRequest, ...requests]);
    return createdRequest;
  }

  getBookings(user: User | null = this.getCurrentUser()): EyeTestBooking[] {
    return this.readStorage<EyeTestBooking>('bookings', user).sort(
      (left, right) => new Date(left.appointmentDate).getTime() - new Date(right.appointmentDate).getTime()
    );
  }

  saveBooking(
    booking: Omit<EyeTestBooking, 'id' | 'status' | 'createdAt'>,
    user: User | null = this.getCurrentUser()
  ): EyeTestBooking {
    const bookings = this.getBookings(user);
    const createdBooking: EyeTestBooking = {
      ...booking,
      id: `APT-${Date.now()}`,
      status: 'Requested',
      createdAt: new Date().toISOString(),
    };

    this.writeStorage('bookings', user, [...bookings, createdBooking]);
    return createdBooking;
  }

  getReorders(user: User | null = this.getCurrentUser()): ContactLensReorder[] {
    return this.readStorage<ContactLensReorder>('reorders', user).sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  saveReorder(
    reorder: Omit<ContactLensReorder, 'id' | 'status' | 'createdAt'>,
    user: User | null = this.getCurrentUser()
  ): ContactLensReorder {
    const reorders = this.getReorders(user);
    const createdReorder: ContactLensReorder = {
      ...reorder,
      id: `REO-${Date.now()}`,
      status: 'Requested',
      createdAt: new Date().toISOString(),
    };

    this.writeStorage('reorders', user, [createdReorder, ...reorders]);
    return createdReorder;
  }
}

export default new CustomerPortalService();
