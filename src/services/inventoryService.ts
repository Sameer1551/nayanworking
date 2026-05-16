// Inventory service for managing inventory operations via backend API
import { InventoryItem } from '../types/inventory';
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';


function getHeaders(): HeadersInit {
  return authService.getAuthHeaders() as HeadersInit;
}

class InventoryService {
  private baseUrl = `${API_BASE_URL}/inventory`;
  private listeners: Array<(data: InventoryItem[]) => void> = [];

  private normalizeInventoryItem(item: any): InventoryItem {
    return {
      id: Number(item.id ?? 0),
      productCode: item.productCode ?? '',
      productName: item.productName ?? '',
      category: item.category ?? '',
      subcategory: item.subcategory ?? '',
      hsnCode: item.hsnCode ?? '',
      description: item.description ?? '',
      currentStock: Number(item.currentStock ?? 0),
      minimumStock: Number(item.minimumStock ?? 0),
      maximumStock: Number(item.maximumStock ?? 0),
      unitCost: Number(item.unitCost ?? 0),
      sellingPrice: Number(item.sellingPrice ?? 0),
      totalValue: Number(item.totalValue ?? 0),
      estimatedSalesPrice: Number(item.estimatedSalesPrice ?? 0),
      totalPurchaseCost: Number(item.totalPurchaseCost ?? 0),
      totalSalesRevenue: Number(item.totalSalesRevenue ?? 0),
      netProfit: Number(item.netProfit ?? 0),
      branch: item.branch ?? 'Unassigned',
      supplier: item.supplier ?? '',
      lastUpdated: item.lastUpdated ?? '',
      status: item.status ?? 'In Stock',
      location: item.location ?? 'Main Inventory',
      expiryDate: item.expiryDate ?? null,
      batchNumber: item.batchNumber ?? item.productCode ?? '',
      updatedAt: item.updatedAt ?? undefined,
      movements: Array.isArray(item.movements)
        ? item.movements.map((movement: any) => ({
            id: movement.id,
            date: movement.date,
            type: movement.type,
            quantity: Number(movement.quantity ?? 0),
            reference: movement.reference ?? '',
            balance: Number(movement.balance ?? 0),
            branch: movement.branch ?? '',
            details: movement.details
              ? {
                  billNumber: movement.details.billNumber ?? '',
                  customerName: movement.details.customerName ?? '',
                  supplierName: movement.details.supplierName ?? '',
                  unitPrice: movement.details.unitPrice != null ? Number(movement.details.unitPrice) : undefined,
                  totalAmount: movement.details.totalAmount != null ? Number(movement.details.totalAmount) : undefined,
                  remarks: movement.details.remarks ?? '',
                }
              : undefined,
          }))
        : [],
    };
  }

  // Load inventory data from backend
  async loadInventory(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(this.baseUrl, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        const inventoryData = Array.isArray(rawData)
          ? rawData.map((item) => this.normalizeInventoryItem(item))
          : [];
        this.notifyListeners(inventoryData);
        return inventoryData;
      }
      throw new Error(`Failed to load inventory: ${response.status}`);
    } catch (error) {
      console.error('Error loading inventory:', error);
      throw error;
    }
  }

  // Search inventory items
  async searchInventory(searchTerm: string): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?searchTerm=${encodeURIComponent(searchTerm)}`, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        return Array.isArray(rawData) ? rawData.map((item) => this.normalizeInventoryItem(item)) : [];
      }
      throw new Error(`Search failed: ${response.status}`);
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }

  // Get inventory items by category
  async getInventoryByCategory(category: string): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/category/${encodeURIComponent(category)}`, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        return Array.isArray(rawData) ? rawData.map((item) => this.normalizeInventoryItem(item)) : [];
      }
      throw new Error(`Failed to filter by category: ${response.status}`);
    } catch (error) {
      console.error('Error getting inventory by category:', error);
      throw error;
    }
  }

  // Get low stock items
  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/low-stock`, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        return Array.isArray(rawData) ? rawData.map((item) => this.normalizeInventoryItem(item)) : [];
      }
      throw new Error(`Failed to get low stock items: ${response.status}`);
    } catch (error) {
      console.error('Error getting low stock items:', error);
      throw error;
    }
  }

  // Get out of stock items
  async getOutOfStockItems(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/out-of-stock`, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        return Array.isArray(rawData) ? rawData.map((item) => this.normalizeInventoryItem(item)) : [];
      }
      throw new Error(`Failed to get out of stock items: ${response.status}`);
    } catch (error) {
      console.error('Error getting out of stock items:', error);
      throw error;
    }
  }

  // Get items needing reorder
  async getItemsNeedingReorder(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/need-reorder`, { headers: getHeaders() });

      if (response.ok) {
        const rawData = await response.json();
        return Array.isArray(rawData) ? rawData.map((item) => this.normalizeInventoryItem(item)) : [];
      }
      throw new Error(`Failed to get items needing reorder: ${response.status}`);
    } catch (error) {
      console.error('Error getting items needing reorder:', error);
      throw error;
    }
  }

  // Create new inventory item
  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item),
      });

      if (response.ok) {
        const createdItem = this.normalizeInventoryItem(await response.json());
        await this.loadInventory();
        return createdItem;
      }
      throw new Error(`Failed to create inventory item: ${response.status}`);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Update inventory item
  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedItem = this.normalizeInventoryItem(await response.json());
        await this.loadInventory();
        return updatedItem;
      }
      throw new Error(`Failed to update inventory item: ${response.status}`);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  // Delete inventory item
  async deleteInventoryItem(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        await this.loadInventory();
        return true;
      }
      throw new Error(`Failed to delete inventory item: ${response.status}`);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // Update stock quantity
  async updateStockQuantity(id: number, quantity: number): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/stock?quantity=${quantity}`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (response.ok) {
        const updatedItem = this.normalizeInventoryItem(await response.json());
        await this.loadInventory();
        return updatedItem;
      }
      throw new Error(`Failed to update stock quantity: ${response.status}`);
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      throw error;
    }
  }

  // Add stock
  async addStock(id: number, quantity: number): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/add-stock?quantity=${quantity}`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (response.ok) {
        const updatedItem = this.normalizeInventoryItem(await response.json());
        await this.loadInventory();
        return updatedItem;
      }
      throw new Error(`Failed to add stock: ${response.status}`);
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  // Remove stock
  async removeStock(id: number, quantity: number): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/remove-stock?quantity=${quantity}`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      if (response.ok) {
        const updatedItem = this.normalizeInventoryItem(await response.json());
        await this.loadInventory();
        return updatedItem;
      }
      throw new Error(`Failed to remove stock: ${response.status}`);
    } catch (error) {
      console.error('Error removing stock:', error);
      throw error;
    }
  }

  // Add stock by product code
  async addStockByProductCode(productCode: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/by-code/${encodeURIComponent(productCode)}/add-stock?quantity=${quantity}`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error adding stock by product code:', error);
      return false;
    }
  }

  // Remove stock by product code
  async removeStockByProductCode(productCode: string, quantity: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/by-code/${encodeURIComponent(productCode)}/remove-stock?quantity=${quantity}`, {
        method: 'PUT',
        headers: getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing stock by product code:', error);
      return false;
    }
  }

  // Refresh inventory data
  async refreshInventory(): Promise<InventoryItem[]> {
    return await this.loadInventory();
  }

  // Cleanup orphaned inventory items
  async cleanupOrphanedInventoryItems(): Promise<{ removed: string[], message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/cleanup`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        await this.loadInventory();
        return result;
      }
      throw new Error(`Cleanup failed: ${response.status}`);
    } catch (error) {
      console.error('Error cleaning up inventory:', error);
      throw error;
    }
  }

  // Add listener for inventory updates
  addListener(listener: (data: InventoryItem[]) => void): void {
    this.listeners.push(listener);
  }

  // Subscribe method (alias for addListener)
  subscribe(listener: (data: InventoryItem[]) => void): () => void {
    this.addListener(listener);
    return () => this.removeListener(listener);
  }

  // Remove listener
  removeListener(listener: (data: InventoryItem[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners
  private notifyListeners(data: InventoryItem[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }
}

export default new InventoryService();
