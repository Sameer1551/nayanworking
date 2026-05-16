// Customer service for handling customer data operations
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';
function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

export interface Customer {
  id?: string | number;
  branchName: string;
  branchCode?: string;
  title: string;
  fullName: string;
  mobileNo: string;
  mobileNo2?: string;
  gender: string;
  gstinNo?: string;
  dateOfBirth?: string;
  age?: number;
  notes?: string;
  email?: string;
  address?: string;
  city?: string;
  anniversary?: string;
  dateOfVisit?: string;
  createdAt?: string;
  lastVisitDate?: string;
  visitCount?: number;
  totalSpent?: number;
  averageBillAmount?: number;
  lastBillNumber?: string;
  lastBillDate?: string;
  source?: string;
}

class CustomerService {
  private baseUrl = API_BASE_URL;

  /**
   * Get all customers from backend API
   */
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const customers = await response.json();
        console.log('Loaded customers from backend API:', customers.length);
        return customers;
      } else {
        console.error('Failed to load customers from backend:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error loading customers from backend:', error);
      return [];
    }
  }

  /**
   * Get customer by ID from backend API
   */
  async getCustomerById(id: string | number): Promise<Customer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error loading customer by ID:', error);
      return null;
    }
  }

  /**
   * Create a new customer in the backend
   */
  async createCustomer(customer: Customer): Promise<{ success: boolean; message: string; data?: Customer }> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Customer created successfully',
          data: data
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: errorText || 'Failed to create customer'
        };
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create customer'
      };
    }
  }

  /**
   * Update an existing customer in the backend
   */
  async updateCustomer(id: string | number, customer: Customer): Promise<{ success: boolean; message: string; data?: Customer }> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(customer),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Customer updated successfully',
          data: data
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: errorText || 'Failed to update customer'
        };
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update customer'
      };
    }
  }

  /**
   * Delete a customer from the backend
   */
  async deleteCustomer(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Customer deleted successfully'
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: errorText || 'Failed to delete customer'
        };
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete customer'
      };
    }
  }

  /**
   * Get all customer records from the JSON file via backend
   */
  async getCustomerRecordsFromFile(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/files/get-customer-records`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.records) {
          console.log('Loaded customer records from file:', result.records.length);
          return result.records;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading customer records from file:', error);
      return [];
    }
  }

  /**
   * Save all customer records to the JSON file via backend
   */
  async saveCustomerRecordsToFile(customers: Customer[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/save-customer-records`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customers),
      });

      const result = await response.json();
      return {
        success: result.success,
        message: result.message || (result.success ? 'Customer records saved successfully' : 'Failed to save customer records')
      };
    } catch (error) {
      console.error('Error saving customer records to file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save customer records'
      };
    }
  }

  /**
   * Append a new customer record to the JSON file via backend
   */
  async appendCustomerToFile(customer: Customer): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/append-customer-data`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customer),
      });

      const result = await response.json();
      return {
        success: result.success,
        message: result.message || (result.success ? 'Customer appended successfully' : 'Failed to append customer')
      };
    } catch (error) {
      console.error('Error appending customer to file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to append customer'
      };
    }
  }

  /**
   * Update customer records in the JSON file via backend
   */
  async updateCustomerRecordsInFile(customers: Customer[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/files/update-customer-records`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(customers),
      });

      const result = await response.json();
      return {
        success: result.success,
        message: result.message || (result.success ? 'Customer records updated successfully' : 'Failed to update customer records')
      };
    } catch (error) {
      console.error('Error updating customer records in file:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update customer records'
      };
    }
  }

  /**
   * Search customers by term
   */
  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/search?searchTerm=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }
}

export default new CustomerService();

