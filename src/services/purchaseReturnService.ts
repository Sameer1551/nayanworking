// Purchase Return service for handling purchase return operations via backend API
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';

function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

export interface PurchaseReturnRecord {
  id?: number;
  returnNumber?: string;
  sourceRecordType?: 'SINGLE' | 'BULK';
  sourceRecordId?: number;
  returnDate: string;
  originalPurchaseBillNo: string;
  serialNo?: string;
  branchName: string;
  supplierName: string;
  supplierContact: string;
  supplierGstin: string;
  supplierAddress: string;
  productName: string;
  productCode: string;
  productDescription: string;
  category: string;
  subcategory: string;
  hsn: string;
  returnQuantity: number;
  originalQuantity?: number;
  purchasePrice: number;
  inputGSTPercent: number;
  inputGSTAmount: number;
  totalAmount: number;
  returnReason: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

class PurchaseReturnService {
  private baseUrl = `${API_BASE_URL}/purchase-returns`;

  /**
   * Get all purchase returns from backend
   */
  async getAllReturns(): Promise<PurchaseReturnRecord[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to load purchase returns');
    } catch (error) {
      console.error('Error loading purchase returns:', error);
      return [];
    }
  }

  /**
   * Get purchase return by ID (numeric database ID)
   */
  async getReturnById(id: number): Promise<PurchaseReturnRecord | null> {
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
      console.error('Error loading purchase return:', error);
      return null;
    }
  }

  /**
   * Get purchase return by return number (e.g., PR-20260408-0001)
   */
  async getReturnByReturnNumber(returnNumber: string): Promise<PurchaseReturnRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/returnNumber/${encodeURIComponent(returnNumber)}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error loading purchase return:', error);
      return null;
    }
  }

  /**
   * Search purchase returns with filters
   */
  async searchReturns(filters: {
    dateFrom?: string;
    dateTo?: string;
    branch?: string;
  }): Promise<PurchaseReturnRecord[]> {
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
      console.error('Error searching purchase returns:', error);
      return [];
    }
  }

  /**
   * Create a new purchase return
   * This will also decrease inventory for the returned product
   */
  async createReturn(record: PurchaseReturnRecord): Promise<{ success: boolean; message: string; data?: PurchaseReturnRecord }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(record),
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
        message: result.message || 'Failed to create purchase return',
      };
    } catch (error) {
      console.error('Error creating purchase return:', error);
      return {
        success: false,
        message: 'Failed to create purchase return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Update an existing purchase return
   */
  async updateReturn(id: number, record: Partial<PurchaseReturnRecord>): Promise<{ success: boolean; message: string; data?: PurchaseReturnRecord }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(record),
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
        message: result.message || 'Failed to update purchase return',
      };
    } catch (error) {
      console.error('Error updating purchase return:', error);
      return {
        success: false,
        message: 'Failed to update purchase return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Delete a purchase return
   * This will also increase inventory (reverse the return)
   */
  async deleteReturn(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
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
        message: result.message || 'Failed to delete purchase return',
      };
    } catch (error) {
      console.error('Error deleting purchase return:', error);
      return {
        success: false,
        message: 'Failed to delete purchase return. Please check if the backend is running.',
      };
    }
  }

  /**
   * Get statistics for purchase returns
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
      console.error('Error getting purchase return stats:', error);
      return { totalCount: 0, totalValue: 0 };
    }
  }

  /**
   * Get returns by original purchase bill number
   */
  async getReturnsByBillNumber(billNumber: string): Promise<PurchaseReturnRecord[]> {
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
  async getReturnsByProductCode(productCode: string): Promise<PurchaseReturnRecord[]> {
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
}

export default new PurchaseReturnService();
