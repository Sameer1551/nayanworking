// Sales Return service for handling sales return operations via backend API
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';

function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

export interface SalesReturnItemRecord {
  id?: number;
  billingProductId?: number;
  productCode: string;
  productName: string;
  productDescription: string;
  category: string;
  subcategory: string;
  hsn: string;
  originalQty: number;
  returnedQty: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  lineReturnAmount: number;
  returnReason: string;
  remarks?: string;
}

export interface SalesReturnRecord {
  id?: number;
  returnNumber: string;
  returnDate: string;
  billNumber: string;
  serialNo: string;
  branchName: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
  totalReturnAmount: number;
  createdAt: string;
  items: SalesReturnItemRecord[];
}

class SalesReturnService {
  private baseUrl = `${API_BASE_URL}/sales-returns`;

  /**
   * Get all sales returns from backend
   */
  async getAllReturns(): Promise<SalesReturnRecord[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load sales returns');
    } catch (error) {
      console.error('Error loading sales returns:', error);
      return [];
    }
  }

  /**
   * Get sales return by ID
   */
  async getReturnById(id: string): Promise<SalesReturnRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error loading sales return:', error);
      return null;
    }
  }

  /**
   * Search sales returns with filters
   */
  async searchReturns(filters: {
    dateFrom?: string;
    dateTo?: string;
    branch?: string;
  }): Promise<SalesReturnRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.branch) params.append('branch', filters.branch);

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error searching sales returns:', error);
      return [];
    }
  }

  /**
   * Create a new sales return (nested items format)
   */
  async createReturn(request: {
    returnDate: string;
    billNumber: string;
    serialNo: string;
    branchName: string;
    customerName: string;
    customerContact: string;
    customerEmail?: string;
    customerAddress?: string;
    notes?: string;
    items: Array<{
      billingProductId?: number;
      productCode: string;
      productName: string;
      productDescription?: string;
      category: string;
      subcategory: string;
      hsn: string;
      originalQty: number;
      returnQty: number;
      unitPrice: number;
      gstPercent: number;
      returnReason: string;
      remarks?: string;
    }>;
  }): Promise<{ success: boolean; message: string; data?: SalesReturnRecord }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
        };
      }

      return {
        success: false,
        message: result.message || 'Failed to create sales return',
      };
    } catch (error) {
      console.error('Error creating sales return:', error);
      return {
        success: false,
        message: 'Failed to create sales return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Update an existing sales return
   */
  async updateReturn(id: number, request: {
    returnDate: string;
    billNumber: string;
    serialNo: string;
    branchName: string;
    customerName: string;
    customerContact: string;
    customerEmail?: string;
    customerAddress?: string;
    notes?: string;
    items: Array<{
      billingProductId?: number;
      productCode: string;
      productName: string;
      productDescription?: string;
      category: string;
      subcategory: string;
      hsn: string;
      originalQty: number;
      returnQty: number;
      unitPrice: number;
      gstPercent: number;
      returnReason: string;
      remarks?: string;
    }>;
  }): Promise<{ success: boolean; message: string; data?: SalesReturnRecord }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
        };
      }

      return {
        success: false,
        message: result.message || 'Failed to update sales return',
      };
    } catch (error) {
      console.error('Error updating sales return:', error);
      return {
        success: false,
        message: 'Failed to update sales return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Delete a sales return
   */
  async deleteReturn(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message,
        };
      }

      return {
        success: false,
        message: result.message || 'Failed to delete sales return',
      };
    } catch (error) {
      console.error('Error deleting sales return:', error);
      return {
        success: false,
        message: 'Failed to delete sales return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Get statistics for sales returns
   */
  async getStats(): Promise<{ totalCount: number; totalValue: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return { totalCount: 0, totalValue: 0 };
    } catch (error) {
      console.error('Error getting sales return stats:', error);
      return { totalCount: 0, totalValue: 0 };
    }
  }

  /**
   * Get returns by original sale bill number
   */
  async getReturnsByBillNumber(billNumber: string): Promise<SalesReturnRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bill/${encodeURIComponent(billNumber)}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting returns by bill number:', error);
      return [];
    }
  }

  /**
   * Get returns by product code
   */
  async getReturnsByProductCode(productCode: string): Promise<SalesReturnRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/product/${encodeURIComponent(productCode)}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting returns by product code:', error);
      return [];
    }
  }

  /**
   * Get sale by bill number for auto-fill in return form
   */
  async getSaleByBillNumber(billNumber: string): Promise<{ sale?: any; products?: any[] }> {
    try {
      // Try to fetch from billing records
      const response = await fetch(`${API_BASE_URL}/billing-records/bill-number/${encodeURIComponent(billNumber)}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return { sale: data, products: data.products || [] };
      }
      // Return empty if not found - the UI will just not auto-fill
      return {};
    } catch (error) {
      console.error('Error looking up sale by bill number:', error);
      return {};
    }
  }
}

export default new SalesReturnService();
