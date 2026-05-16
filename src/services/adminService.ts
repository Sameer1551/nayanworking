import { API_BASE_URL } from '../config/apiConfig';
import authService from './authService';

export interface AdminSupplierData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  gstNumber: string;
  uniqueSupplierKey: string;
  isActive: boolean;
  createdAt: string;
}

class AdminService {
  private baseUrl = `${API_BASE_URL}/admin`;

  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async getAllSuppliers(): Promise<AdminSupplierData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const data = await response.json();
      return data.suppliers || [];
    } catch (error) {
      console.error('Error fetching suppliers in adminService:', error);
      throw error;
    }
  }

  async deactivateSupplier(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers/${id}/deactivate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to deactivate supplier');
    } catch (error) {
      console.error('Error deactivating supplier:', error);
      throw error;
    }
  }

  async reactivateSupplier(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers/${id}/reactivate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to reactivate supplier');
    } catch (error) {
      console.error('Error reactivating supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete supplier');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  async createSupplier(supplierData: any): Promise<{ message: string; id: number; uniqueSupplierKey: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/suppliers`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create supplier');
      }

      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }
}

const adminService = new AdminService();
export default adminService;
