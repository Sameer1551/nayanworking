// Bulk purchase service for handling multiple items per bill
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';
function getHeaders(): HeadersInit { return authService.getAuthHeaders() as HeadersInit; }

export interface BulkPurchaseItem {
  id?: string;
  materialName: string;
  productCode: string;
  productDescription: string;
  category: 'Spectacles' | 'Sunglasses' | 'Lens' | 'Contact Lens' | 'Frame' | 'Solution' | 'Other' | 'Non-Chargeable';
  subcategory: string;
  hsn: string;
  quantity: number;
  purchasePrice: number;
  inputGSTPercent: number;
  inputGSTAmount: number;
  totalAmount: number;
  // Conditional fields for Spectacles/Frame
  color?: string;
  size?: string;
  type?: string;
  gender?: string;
  shape?: string;
  material?: string;
  templeDetails?: string;
  bridgeSize?: string;
  // Conditional fields for Lens
  lensDetail?: string;
  lensCoating?: string;
  design?: string;
  lensIndex?: string;
  lensNumber?: string;
  lensAddition?: string;
  lensAxis?: string;
  lensNumberRange?: string;
  // Conditional fields for Contact Lens
  lensProductName?: string;
  ct?: string;
  baseCurve?: string;
  diameter?: string;
  modality?: string;
  validity?: string;
  waterContent?: string;
  dkt?: string;
  // Conditional fields for Solution
  solutionName?: string;
  variant?: string;
  packingType?: string;
  // Conditional fields for Other/Non-Chargeable
  name?: string;
}

export interface BulkPurchaseData {
  id?: string;
  purchaseDate: string;
  purchaseBillNo: string;
  branch: string;
  supplierName: string;
  supplierAddress: string;
  supplierGstin: string;
  remarks?: string;
  purchaseItems: BulkPurchaseItem[];
  totalBillAmount: number;
  totalGstAmount: number;
}

class BulkPurchaseService {
  private baseUrl = `${API_BASE_URL}/bulk-purchases`;

  /**
   * Get the current authentication token
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Map backend category enum values to frontend category strings
   */
  private mapCategoryFromBackend(category: string): string {
    switch (category) {
      case 'SPECTACLES':
        return 'Spectacles';
      case 'FRAMES':
        return 'Frame';
      case 'CONTACT_LENSES':
        return 'Contact Lens';
      case 'SUNGLASSES':
        return 'Sunglasses';
      case 'LENS':
        return 'Lens';
      case 'SOLUTIONS':
        return 'Solution';
      case 'OTHER':
        return 'Other';
      case 'NON_CHARGEABLE':
        return 'Non-Chargeable';
      default:
        return category;
    }
  }

  /**
   * Create headers with authentication token
   */
  private createHeaders(): Record<string, string> {
    const headers: Record<string, string> = getHeaders() as Record<string, string>;

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Create a new bulk purchase with multiple items
   */
  async createBulkPurchase(bulkPurchaseData: BulkPurchaseData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Format date to ISO string (YYYY-MM-DD) for backend
      const formatDateForBackend = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Map frontend categories to backend enum values
      const mapCategoryToBackend = (category: string): string => {
        switch (category) {
          case 'Spectacles':
            return 'SPECTACLES';
          case 'Frame':
            return 'FRAMES';
          case 'Contact Lens':
            return 'CONTACT_LENSES';
          case 'Sunglasses':
            return 'SUNGLASSES';
          case 'Lens':
            return 'LENS';
          case 'Solution':
            return 'SOLUTIONS';
          case 'Other':
            return 'OTHER';
          case 'Non-Chargeable':
            return 'NON_CHARGEABLE';
          default:
            return category.toUpperCase();
        }
      };

      const requestBody = {
        purchaseBillNo: bulkPurchaseData.purchaseBillNo,
        purchaseDate: formatDateForBackend(bulkPurchaseData.purchaseDate),
        branch: bulkPurchaseData.branch,
        supplierName: bulkPurchaseData.supplierName,
        supplierAddress: bulkPurchaseData.supplierAddress,
        supplierGstin: bulkPurchaseData.supplierGstin,
        remarks: bulkPurchaseData.remarks,
        purchaseItems: bulkPurchaseData.purchaseItems.map(item => ({
          materialName: item.materialName,
          productCode: item.productCode,
          productDescription: item.productDescription,
          category: mapCategoryToBackend(item.category),
          subcategory: item.subcategory,
          hsn: item.hsn,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          inputGSTPercent: item.inputGSTPercent,
          inputGSTAmount: item.inputGSTAmount,
          totalAmount: item.totalAmount,
          // Conditional fields for Spectacles/Frame
          color: item.color,
          size: item.size,
          type: item.type,
          gender: item.gender,
          shape: item.shape,
          material: item.material,
          templeDetails: item.templeDetails,
          bridgeSize: item.bridgeSize,
          // Conditional fields for Lens
          lensDetail: item.lensDetail,
          lensCoating: item.lensCoating,
          design: item.design,
          lensIndex: item.lensIndex,
          lensNumber: item.lensNumber,
          lensAddition: item.lensAddition,
          lensAxis: item.lensAxis,
          lensNumberRange: item.lensNumberRange,
          // Conditional fields for Contact Lens
          lensProductName: item.lensProductName,
          ct: item.ct,
          baseCurve: item.baseCurve,
          diameter: item.diameter,
          modality: item.modality,
          validity: item.validity,
          waterContent: item.waterContent,
          dkt: item.dkt,
          // Conditional fields for Solution
          solutionName: item.solutionName,
          variant: item.variant,
          packingType: item.packingType,
          // Conditional fields for Other/Non-Chargeable
          name: item.name,
        }))
      };

      console.log('Sending bulk purchase to backend:', requestBody);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.createHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Bulk purchase created successfully:', result);
        return {
          success: true,
          message: 'Bulk purchase created successfully',
          data: result
        };
      } else {
        let errorMessage = 'Failed to create bulk purchase';
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          errorMessage = response.statusText || `HTTP ${response.status} error`;
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('Error creating bulk purchase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create bulk purchase'
      };
    }
  }

  /**
   * Get all bulk purchase records
   */
  async getAllBulkPurchases(): Promise<BulkPurchaseData[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      if (response.ok) {
        const bulkPurchases = await response.json();
        return bulkPurchases.map((bp: any) => ({
          id: bp.id?.toString(),
          purchaseDate: bp.purchaseDate,
          purchaseBillNo: bp.purchaseBillNo,
          branch: bp.branch,
          supplierName: bp.supplierName,
          supplierAddress: bp.supplierAddress,
          supplierGstin: bp.supplierGstin,
          remarks: bp.remarks,
          purchaseItems: bp.purchaseItems?.map((item: any) => ({
            id: item.id?.toString(),
            materialName: item.materialName,
            productCode: item.productCode,
            productDescription: item.productDescription,
            category: this.mapCategoryFromBackend(item.category),
            subcategory: item.subcategory,
            hsn: item.hsn,
            quantity: item.quantity,
            purchasePrice: Number(item.purchasePrice),
            inputGSTPercent: Number(item.inputGSTPercent),
            inputGSTAmount: Number(item.inputGSTAmount),
            totalAmount: Number(item.totalAmount),
            // Conditional fields for Spectacles/Frame
            color: item.color,
            size: item.size,
            type: item.type,
            gender: item.gender,
            shape: item.shape,
            material: item.material,
            templeDetails: item.templeDetails,
            bridgeSize: item.bridgeSize,
            // Conditional fields for Lens
            lensDetail: item.lensDetail,
            lensCoating: item.lensCoating,
            design: item.design,
            lensIndex: item.lensIndex,
            lensNumber: item.lensNumber,
            lensAddition: item.lensAddition,
            lensAxis: item.lensAxis,
            lensNumberRange: item.lensNumberRange,
            // Conditional fields for Contact Lens
            lensProductName: item.lensProductName,
            ct: item.ct,
            baseCurve: item.baseCurve,
            diameter: item.diameter,
            modality: item.modality,
            validity: item.validity,
            waterContent: item.waterContent,
            dkt: item.dkt,
            // Conditional fields for Solution
            solutionName: item.solutionName,
            variant: item.variant,
            packingType: item.packingType,
            // Conditional fields for Other/Non-Chargeable
            name: item.name,
          })) || [],
          totalBillAmount: Number(bp.totalBillAmount),
          totalGstAmount: Number(bp.totalGstAmount)
        }));
      } else {
        console.error('Failed to fetch bulk purchases:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching bulk purchases:', error);
      return [];
    }
  }

  /**
   * Get bulk purchase by ID
   */
  async getBulkPurchaseById(id: string): Promise<BulkPurchaseData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      if (response.ok) {
        const bulkPurchase = await response.json();
        return {
          id: bulkPurchase.id?.toString(),
          purchaseDate: bulkPurchase.purchaseDate,
          purchaseBillNo: bulkPurchase.purchaseBillNo,
          branch: bulkPurchase.branch,
          supplierName: bulkPurchase.supplierName,
          supplierAddress: bulkPurchase.supplierAddress,
          supplierGstin: bulkPurchase.supplierGstin,
          remarks: bulkPurchase.remarks,
          purchaseItems: bulkPurchase.purchaseItems?.map((item: any) => ({
            id: item.id?.toString(),
            materialName: item.materialName,
            productCode: item.productCode,
            productDescription: item.productDescription,
            category: this.mapCategoryFromBackend(item.category),
            subcategory: item.subcategory,
            hsn: item.hsn,
            quantity: item.quantity,
            purchasePrice: Number(item.purchasePrice),
            inputGSTPercent: Number(item.inputGSTPercent),
            inputGSTAmount: Number(item.inputGSTAmount),
            totalAmount: Number(item.totalAmount),
            // Conditional fields for Spectacles/Frame
            color: item.color,
            size: item.size,
            type: item.type,
            gender: item.gender,
            shape: item.shape,
            material: item.material,
            templeDetails: item.templeDetails,
            bridgeSize: item.bridgeSize,
            // Conditional fields for Lens
            lensDetail: item.lensDetail,
            lensCoating: item.lensCoating,
            design: item.design,
            lensIndex: item.lensIndex,
            lensNumber: item.lensNumber,
            lensAddition: item.lensAddition,
            lensAxis: item.lensAxis,
            lensNumberRange: item.lensNumberRange,
            // Conditional fields for Contact Lens
            lensProductName: item.lensProductName,
            ct: item.ct,
            baseCurve: item.baseCurve,
            diameter: item.diameter,
            modality: item.modality,
            validity: item.validity,
            waterContent: item.waterContent,
            dkt: item.dkt,
            // Conditional fields for Solution
            solutionName: item.solutionName,
            variant: item.variant,
            packingType: item.packingType,
            // Conditional fields for Other/Non-Chargeable
            name: item.name,
          })) || [],
          totalBillAmount: Number(bulkPurchase.totalBillAmount),
          totalGstAmount: Number(bulkPurchase.totalGstAmount)
        };
      } else {
        console.error('Failed to fetch bulk purchase:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching bulk purchase:', error);
      return null;
    }
  }

  /**
   * Get bulk purchase by purchase bill number
   */
  async getBulkPurchaseByBillNo(purchaseBillNo: string): Promise<BulkPurchaseData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bill/${purchaseBillNo}`, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      if (response.ok) {
        const bulkPurchase = await response.json();
        return {
          id: bulkPurchase.id?.toString(),
          purchaseDate: bulkPurchase.purchaseDate,
          purchaseBillNo: bulkPurchase.purchaseBillNo,
          branch: bulkPurchase.branch,
          supplierName: bulkPurchase.supplierName,
          supplierAddress: bulkPurchase.supplierAddress,
          supplierGstin: bulkPurchase.supplierGstin,
          remarks: bulkPurchase.remarks,
          purchaseItems: bulkPurchase.purchaseItems?.map((item: any) => ({
            id: item.id?.toString(),
            materialName: item.materialName,
            productCode: item.productCode,
            productDescription: item.productDescription,
            category: this.mapCategoryFromBackend(item.category),
            subcategory: item.subcategory,
            hsn: item.hsn,
            quantity: item.quantity,
            purchasePrice: Number(item.purchasePrice),
            inputGSTPercent: Number(item.inputGSTPercent),
            inputGSTAmount: Number(item.inputGSTAmount),
            totalAmount: Number(item.totalAmount),
            // Conditional fields for Spectacles/Frame
            color: item.color,
            size: item.size,
            type: item.type,
            gender: item.gender,
            shape: item.shape,
            material: item.material,
            templeDetails: item.templeDetails,
            bridgeSize: item.bridgeSize,
            // Conditional fields for Lens
            lensDetail: item.lensDetail,
            lensCoating: item.lensCoating,
            design: item.design,
            lensIndex: item.lensIndex,
            lensNumber: item.lensNumber,
            lensAddition: item.lensAddition,
            lensAxis: item.lensAxis,
            lensNumberRange: item.lensNumberRange,
            // Conditional fields for Contact Lens
            lensProductName: item.lensProductName,
            ct: item.ct,
            baseCurve: item.baseCurve,
            diameter: item.diameter,
            modality: item.modality,
            validity: item.validity,
            waterContent: item.waterContent,
            dkt: item.dkt,
            // Conditional fields for Solution
            solutionName: item.solutionName,
            variant: item.variant,
            packingType: item.packingType,
            // Conditional fields for Other/Non-Chargeable
            name: item.name,
          })) || [],
          totalBillAmount: Number(bulkPurchase.totalBillAmount),
          totalGstAmount: Number(bulkPurchase.totalGstAmount)
        };
      } else {
        console.error('Failed to fetch bulk purchase by bill number:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching bulk purchase by bill number:', error);
      return null;
    }
  }

  /**
   * Update bulk purchase record
   */
  async updateBulkPurchase(id: string, bulkPurchaseData: BulkPurchaseData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const formatDateForBackend = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Map frontend categories to backend enum values
      const mapCategoryToBackend = (category: string): string => {
        switch (category) {
          case 'Spectacles':
            return 'SPECTACLES';
          case 'Frame':
            return 'FRAMES';
          case 'Contact Lens':
            return 'CONTACT_LENSES';
          case 'Sunglasses':
            return 'SUNGLASSES';
          case 'Lens':
            return 'LENS';
          case 'Solution':
            return 'SOLUTIONS';
          case 'Other':
            return 'OTHER';
          case 'Non-Chargeable':
            return 'NON_CHARGEABLE';
          default:
            return category.toUpperCase();
        }
      };

      const requestBody = {
        purchaseBillNo: bulkPurchaseData.purchaseBillNo,
        purchaseDate: formatDateForBackend(bulkPurchaseData.purchaseDate),
        branch: bulkPurchaseData.branch,
        supplierName: bulkPurchaseData.supplierName,
        supplierAddress: bulkPurchaseData.supplierAddress,
        supplierGstin: bulkPurchaseData.supplierGstin,
        remarks: bulkPurchaseData.remarks,
        purchaseItems: bulkPurchaseData.purchaseItems.map(item => ({
          materialName: item.materialName,
          productCode: item.productCode,
          productDescription: item.productDescription,
          category: mapCategoryToBackend(item.category),
          subcategory: item.subcategory,
          hsn: item.hsn,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          inputGSTPercent: item.inputGSTPercent,
          inputGSTAmount: item.inputGSTAmount,
          totalAmount: item.totalAmount,
          // Conditional fields for Spectacles/Frame
          color: item.color,
          size: item.size,
          type: item.type,
          gender: item.gender,
          shape: item.shape,
          material: item.material,
          templeDetails: item.templeDetails,
          bridgeSize: item.bridgeSize,
          // Conditional fields for Lens
          lensDetail: item.lensDetail,
          lensCoating: item.lensCoating,
          design: item.design,
          lensIndex: item.lensIndex,
          lensNumber: item.lensNumber,
          lensAddition: item.lensAddition,
          lensAxis: item.lensAxis,
          lensNumberRange: item.lensNumberRange,
          // Conditional fields for Contact Lens
          lensProductName: item.lensProductName,
          ct: item.ct,
          baseCurve: item.baseCurve,
          diameter: item.diameter,
          modality: item.modality,
          validity: item.validity,
          waterContent: item.waterContent,
          dkt: item.dkt,
          // Conditional fields for Solution
          solutionName: item.solutionName,
          variant: item.variant,
          packingType: item.packingType,
          // Conditional fields for Other/Non-Chargeable
          name: item.name,
        }))
      };

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.createHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: 'Bulk purchase updated successfully',
          data: result
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `HTTP ${response.status}: ${error || 'Failed to update bulk purchase'}`
        };
      }
    } catch (error) {
      console.error('Error updating bulk purchase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update bulk purchase'
      };
    }
  }

  /**
   * Delete bulk purchase record
   */
  async deleteBulkPurchase(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.createHeaders(),
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Bulk purchase deleted successfully'
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: error || 'Failed to delete bulk purchase'
        };
      }
    } catch (error) {
      console.error('Error deleting bulk purchase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete bulk purchase'
      };
    }
  }

  /**
   * Search bulk purchases with filters
   */
  async searchBulkPurchases(filters: {
    dateFrom?: string;
    dateTo?: string;
    supplierName?: string;
    purchaseBillNo?: string;
    branchName?: string;
  }): Promise<BulkPurchaseData[]> {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.supplierName) params.append('supplierName', filters.supplierName);
      if (filters.purchaseBillNo) params.append('purchaseBillNo', filters.purchaseBillNo);
      if (filters.branchName) params.append('branchName', filters.branchName);

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: this.createHeaders(),
      });

      if (response.ok) {
        const bulkPurchases = await response.json();
        return bulkPurchases.map((bp: any) => ({
          id: bp.id?.toString(),
          purchaseDate: bp.purchaseDate,
          purchaseBillNo: bp.purchaseBillNo,
          branch: bp.branch,
          supplierName: bp.supplierName,
          supplierAddress: bp.supplierAddress,
          supplierGstin: bp.supplierGstin,
          remarks: bp.remarks,
          purchaseItems: bp.purchaseItems?.map((item: any) => ({
            id: item.id?.toString(),
            materialName: item.materialName,
            productCode: item.productCode,
            productDescription: item.productDescription,
            category: this.mapCategoryFromBackend(item.category),
            subcategory: item.subcategory,
            hsn: item.hsn,
            quantity: item.quantity,
            purchasePrice: Number(item.purchasePrice),
            inputGSTPercent: Number(item.inputGSTPercent),
            inputGSTAmount: Number(item.inputGSTAmount),
            totalAmount: Number(item.totalAmount),
            // Conditional fields for Spectacles/Frame
            color: item.color,
            size: item.size,
            type: item.type,
            gender: item.gender,
            shape: item.shape,
            material: item.material,
            templeDetails: item.templeDetails,
            bridgeSize: item.bridgeSize,
            // Conditional fields for Lens
            lensDetail: item.lensDetail,
            lensCoating: item.lensCoating,
            design: item.design,
            lensIndex: item.lensIndex,
            lensNumber: item.lensNumber,
            lensAddition: item.lensAddition,
            lensAxis: item.lensAxis,
            lensNumberRange: item.lensNumberRange,
            // Conditional fields for Contact Lens
            lensProductName: item.lensProductName,
            ct: item.ct,
            baseCurve: item.baseCurve,
            diameter: item.diameter,
            modality: item.modality,
            validity: item.validity,
            waterContent: item.waterContent,
            dkt: item.dkt,
            // Conditional fields for Solution
            solutionName: item.solutionName,
            variant: item.variant,
            packingType: item.packingType,
            // Conditional fields for Other/Non-Chargeable
            name: item.name,
          })) || [],
          totalBillAmount: Number(bp.totalBillAmount),
          totalGstAmount: Number(bp.totalGstAmount)
        }));
      } else {
        console.error('Failed to search bulk purchases:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error searching bulk purchases:', error);
      return [];
    }
  }
}

export default new BulkPurchaseService();
