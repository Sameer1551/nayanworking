// Branch service for handling branch data operations
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';

function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

export interface Branch {
  id?: number;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

class BranchService {
  private baseUrl = `${API_BASE_URL}/branches`;

  /**
   * Get all active branches from backend API
   */
  async getAllBranches(): Promise<Branch[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const branches = await response.json();
        console.log('Loaded branches from backend API:', branches.length);
        return branches;
      } else {
        console.error('Failed to load branches from backend:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error loading branches from backend:', error);
      return [];
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branch: Omit<Branch, 'id'>): Promise<Branch | null> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(branch),
      });

      if (response.ok) {
        const createdBranch = await response.json();
        console.log('Branch created successfully:', createdBranch);
        return createdBranch;
      } else {
        console.error('Failed to create branch:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      return null;
    }
  }

  /**
   * Update an existing branch
   */
  async updateBranch(id: number, branch: Partial<Branch>): Promise<Branch | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(branch),
      });

      if (response.ok) {
        const updatedBranch = await response.json();
        console.log('Branch updated successfully:', updatedBranch);
        return updatedBranch;
      } else {
        console.error('Failed to update branch:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      return null;
    }
  }

  /**
   * Delete a branch (soft delete by setting isActive to false)
   */
  async deleteBranch(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        console.log('Branch deleted successfully:', id);
        return true;
      } else {
        console.error('Failed to delete branch:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      return false;
    }
  }
}

export default new BranchService();