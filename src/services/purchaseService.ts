// Purchase service for handling data saving operations

import inventoryService from './inventoryService';
import authService from './authService';
import { API_BASE_URL } from '../config/apiConfig';


/** Helper — returns Content-Type + Authorization header for supplier API calls */
function getHeaders(): HeadersInit {
  return authService.getAuthHeaders() as HeadersInit;
}

export interface PurchaseData {
  id?: string;
  recordType?: 'SINGLE' | 'BULK';
  parentId?: string;
  itemId?: string;
  purchaseDate: string;
  purchaseBillNo: string; // Added purchase bill number
  branch: string; // Added branch field
  materialName: string;
  productCode: string; // Added product code
  productDescription: string; // Added product description
  category: 'Spectacles' | 'Sunglasses' | 'Lens' | 'Contact Lens' | 'Frame' | 'Solution' | 'Other' | 'Non-Chargeable';
  subcategory: string;
  hsn: string;
  quantity: number;
  purchasePrice: number;
  inputGSTPercent: number;
  inputGSTAmount: number;
  totalAmount: number;
  supplier: {
    name: string;
    address: string;
    gstin: string;
  };
  remarks?: string;
  // Conditional fields for Spectacles/Frame/Sunglasses
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

class PurchaseService {
  private baseUrl = `${API_BASE_URL}/purchases`;

  /**
   * Create a new purchase record
   */
  async createPurchase(purchaseData: PurchaseData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Format date to ISO string (YYYY-MM-DD) for backend
      const formatDateForBackend = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const requestBody = {
        purchaseBillNo: purchaseData.purchaseBillNo,
        purchaseDate: formatDateForBackend(purchaseData.purchaseDate),
        branch: purchaseData.branch,
        materialName: purchaseData.materialName,
        productCode: purchaseData.productCode,
        productDescription: purchaseData.productDescription,
        category: purchaseData.category, // Send original frontend category names
        subcategory: purchaseData.subcategory,
        hsn: purchaseData.hsn,
        quantity: purchaseData.quantity,
        purchasePrice: purchaseData.purchasePrice,
        inputGSTPercent: purchaseData.inputGSTPercent,
        inputGSTAmount: purchaseData.inputGSTAmount,
        totalAmount: purchaseData.totalAmount,
        supplierName: purchaseData.supplier.name,
        supplierAddress: purchaseData.supplier.address,
        supplierGstin: purchaseData.supplier.gstin,
        remarks: purchaseData.remarks,
        // Conditional fields for Spectacles/Frame/Sunglasses
        color: purchaseData.color,
        size: purchaseData.size,
        type: purchaseData.type,
        gender: purchaseData.gender,
        shape: purchaseData.shape,
        material: purchaseData.material,
        templeDetails: purchaseData.templeDetails,
        bridgeSize: purchaseData.bridgeSize,
        // Conditional fields for Lens
        lensDetail: purchaseData.lensDetail,
        lensCoating: purchaseData.lensCoating,
        design: purchaseData.design,
        lensIndex: purchaseData.lensIndex,
        lensNumber: purchaseData.lensNumber,
        lensAddition: purchaseData.lensAddition,
        lensAxis: purchaseData.lensAxis,
        lensNumberRange: purchaseData.lensNumberRange,
        // Conditional fields for Contact Lens
        lensProductName: purchaseData.lensProductName,
        ct: purchaseData.ct,
        baseCurve: purchaseData.baseCurve,
        diameter: purchaseData.diameter,
        modality: purchaseData.modality,
        validity: purchaseData.validity,
        waterContent: purchaseData.waterContent,
        dkt: purchaseData.dkt,
        // Conditional fields for Solution
        solutionName: purchaseData.solutionName,
        variant: purchaseData.variant,
        packingType: purchaseData.packingType,
        // Conditional fields for Other/Non-Chargeable
        name: purchaseData.name,
      };

      // Debug logging
      console.log('Sending to backend:', requestBody);
      console.log('Original purchaseData:', purchaseData);
      console.log('Backend URL:', this.baseUrl);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        try {
          const result = await response.json();
          console.log('Success response:', result);
          
          // Sync inventory with new purchase data
          try {
            console.log('Syncing inventory with new purchase...');
            await inventoryService.refreshInventory();
            console.log('Inventory synced successfully');
          } catch (syncError) {
            console.warn('Failed to sync inventory after purchase:', syncError);
            // Don't fail the purchase creation if inventory sync fails
          }
          
          return {
            success: true,
            message: 'Purchase created successfully',
            data: result
          };
        } catch (e) {
          console.log('Response ok but JSON parsing failed:', e);
          // If response is ok but can't parse JSON, return success with empty data
          return {
            success: true,
            message: 'Purchase created successfully',
            data: null
          };
        }
      } else {
        let errorMessage = 'Failed to create purchase';
        
        // Try to get error details from response
        try {
          const errorData = await response.json();
          console.log('Error response JSON:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors && errorData.errors.length > 0) {
            // Handle validation errors
            const validationErrors = errorData.errors.map((err: any) => err.defaultMessage).join(', ');
            errorMessage = `Validation errors: ${validationErrors}`;
          }
        } catch (e) {
          console.log('JSON parsing failed, trying text:', e);
          // If can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            console.log('Error response text:', errorText);
            if (errorText && errorText.trim() !== '') {
              errorMessage = errorText;
            } else {
              // Use status text if response body is empty
              errorMessage = response.statusText || `HTTP ${response.status} error`;
            }
          } catch (textError) {
            console.log('Text reading also failed:', textError);
            // If both JSON and text reading fail, use status text
            errorMessage = response.statusText || `HTTP ${response.status} error`;
          }
        }
        
        console.error('Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage
        });
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      let errorMessage = 'Failed to create purchase. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Append purchase data to MySQL database
   * MySQL is the single source of truth - if this fails, the operation fails entirely
   * @param purchaseData - The purchase data to save
   */
  async appendPurchaseData(purchaseData: PurchaseData): Promise<{ success: boolean; message: string; totalRecords?: number }> {
    try {
      // Save directly to MySQL backend - no file fallback
      const backendResult = await this.createPurchase(purchaseData);

      if (backendResult.success) {
        // Sync inventory with new purchase data
        try {
          console.log('Syncing inventory after purchase data append...');
          await inventoryService.refreshInventory();
          console.log('Inventory synced successfully after append');
        } catch (syncError) {
          console.warn('Failed to sync inventory after purchase append:', syncError);
          // Don't fail the purchase append if inventory sync fails
        }

        return {
          success: true,
          message: 'Purchase saved successfully to MySQL database',
          totalRecords: 1
        };
      } else {
        // Backend (MySQL) save failed - return failure without file fallback
        console.error('MySQL save failed:', backendResult.message);
        return {
          success: false,
          message: `Failed to save purchase to MySQL: ${backendResult.message}. Please ensure the backend is running and MySQL is accessible.`
        };
      }
    } catch (error) {
      console.error('Error in appendPurchaseData:', error);
      return {
        success: false,
        message: `Failed to save purchase: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all purchase records from MySQL database
   * MySQL is the single source of truth - returns empty array if MySQL is unavailable
   */
  async getPurchaseRecords(): Promise<PurchaseData[]> {
    try {
      console.log('getPurchaseRecords: Fetching data from MySQL...');

      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: getHeaders(),
      });

      console.log('Backend API response status:', response.status);

      if (!response.ok) {
        console.error('MySQL fetch failed with status:', response.status, response.statusText);
        return [];
      }

      const purchases = await response.json();
      console.log('Backend API returned data:', purchases.length, 'records');

      // Convert backend format to frontend format
      const convertedPurchases = purchases.map((p: any) => {
        // Map backend category values to frontend category values
        const mapBackendCategoryToFrontend = (backendCategory: string): PurchaseData['category'] => {
          switch (backendCategory) {
            case 'SPECTACLES':
              return 'Spectacles';
            case 'SUNGLASSES':
              return 'Sunglasses';
            case 'LENS':
              return 'Lens';
            case 'CONTACT_LENSES':
              return 'Contact Lens';
            case 'FRAMES':
              return 'Frame';
            case 'SOLUTIONS':
              return 'Solution';
            case 'OTHER':
              return 'Other';
            case 'NON_CHARGEABLE':
              return 'Non-Chargeable';
            default:
              return 'Other'; // fallback
          }
        };

        return {
          id: p.id?.toString() || '',
          purchaseDate: p.purchaseDate,
          purchaseBillNo: p.purchaseBillNo,
          branch: p.branch || '',
          materialName: p.materialName,
          productCode: p.productCode,
          productDescription: p.productDescription,
          category: mapBackendCategoryToFrontend(p.category),
          subcategory: p.subcategory,
          hsn: p.hsn,
          quantity: p.quantity,
          purchasePrice: Number(p.purchasePrice),
          inputGSTPercent: Number(p.inputGSTPercent),
          inputGSTAmount: Number(p.inputGSTAmount),
          totalAmount: Number(p.totalAmount),
          supplier: {
            name: p.supplierName,
            address: p.supplierAddress,
            gstin: p.supplierGstin,
          },
          remarks: p.remarks,
          // Conditional fields for Spectacles/Frame/Sunglasses
          color: p.color,
          size: p.size,
          type: p.type,
          gender: p.gender,
          shape: p.shape,
          material: p.material,
          templeDetails: p.templeDetails,
          bridgeSize: p.bridgeSize,
          // Conditional fields for Lens
          lensDetail: p.lensDetail,
          lensCoating: p.lensCoating,
          design: p.design,
          lensIndex: p.lensIndex,
          lensNumber: p.lensNumber,
          lensAddition: p.lensAddition,
          lensAxis: p.lensAxis,
          lensNumberRange: p.lensNumberRange,
          // Conditional fields for Contact Lens
          lensProductName: p.lensProductName,
          ct: p.ct,
          baseCurve: p.baseCurve,
          diameter: p.diameter,
          modality: p.modality,
          validity: p.validity,
          waterContent: p.waterContent,
          dkt: p.dkt,
          // Conditional fields for Solution
          solutionName: p.solutionName,
          variant: p.variant,
          packingType: p.packingType,
          // Conditional fields for Other/Non-Chargeable
          name: p.name,
        };
      });

      console.log('Converted purchases:', convertedPurchases.length, 'records');
      return convertedPurchases;
    } catch (error) {
      console.error('Error fetching purchase records from MySQL:', error);
      return [];
    }
  }

  /**
   * Search purchase records with filters
   */
  async searchPurchaseRecords(filters: {
    dateFrom?: string;
    dateTo?: string;
    productName?: string;
    hsn?: string;
    supplierBillNo?: string;
    purchaseBillNo?: string;
    productCode?: string;
    branchName?: string;
    importRefNumber?: string;
  }): Promise<PurchaseData[]> {
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.productName) params.append('productName', filters.productName);
      if (filters.hsn) params.append('hsn', filters.hsn);
      if (filters.supplierBillNo) params.append('supplierBillNo', filters.supplierBillNo);
      if (filters.purchaseBillNo) params.append('purchaseBillNo', filters.purchaseBillNo);
      if (filters.productCode) params.append('productCode', filters.productCode);
      if (filters.branchName) params.append('branchName', filters.branchName);
      if (filters.importRefNumber) params.append('importRef', filters.importRefNumber);

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (response.ok) {
        const purchases = await response.json();
        // Convert backend format to frontend format
        return purchases.map((p: any) => {
          // Map backend category values to frontend category values
          const mapBackendCategoryToFrontend = (backendCategory: string): PurchaseData['category'] => {
            switch (backendCategory) {
              case 'SPECTACLES':
                return 'Spectacles';
              case 'SUNGLASSES':
                return 'Sunglasses';
              case 'LENS':
                return 'Lens';
              case 'CONTACT_LENSES':
                return 'Contact Lens';
              case 'FRAMES':
                return 'Frame';
              case 'SOLUTIONS':
                return 'Solution';
              case 'OTHER':
                return 'Other';
              case 'NON_CHARGEABLE':
                return 'Non-Chargeable';
              default:
                return 'Other'; // fallback
            }
          };

          return {
            id: p.id?.toString() || '',
            purchaseDate: p.purchaseDate,
            purchaseBillNo: p.purchaseBillNo,
            branch: p.branch || '',
            materialName: p.materialName,
            productCode: p.productCode,
            productDescription: p.productDescription,
            category: mapBackendCategoryToFrontend(p.category),
            subcategory: p.subcategory,
            hsn: p.hsn,
            quantity: p.quantity,
            purchasePrice: Number(p.purchasePrice),
            inputGSTPercent: Number(p.inputGSTPercent),
            inputGSTAmount: Number(p.inputGSTAmount),
            totalAmount: Number(p.totalAmount),
            supplier: {
              name: p.supplierName,
              address: p.supplierAddress,
              gstin: p.supplierGstin,
            },
            remarks: p.remarks,
            // Conditional fields for Spectacles/Frame/Sunglasses
            color: p.color,
            size: p.size,
            type: p.type,
            gender: p.gender,
            shape: p.shape,
            material: p.material,
            templeDetails: p.templeDetails,
            bridgeSize: p.bridgeSize,
            // Conditional fields for Lens
            lensDetail: p.lensDetail,
            lensCoating: p.lensCoating,
            design: p.design,
            lensIndex: p.lensIndex,
            lensNumber: p.lensNumber,
            lensAddition: p.lensAddition,
            lensAxis: p.lensAxis,
            lensNumberRange: p.lensNumberRange,
            // Conditional fields for Contact Lens
            lensProductName: p.lensProductName,
            ct: p.ct,
            baseCurve: p.baseCurve,
            diameter: p.diameter,
            modality: p.modality,
            validity: p.validity,
            waterContent: p.waterContent,
            dkt: p.dkt,
            // Conditional fields for Solution
            solutionName: p.solutionName,
            variant: p.variant,
            packingType: p.packingType,
            // Conditional fields for Other/Non-Chargeable
            name: p.name,
          };
        });
      } else {
        console.error('Failed to search purchase records:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error searching purchase records:', error);
      return [];
    }
  }

  /**
   * Delete a specific purchase record by ID
   */
  async deletePurchaseRecord(recordId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Attempting to delete purchase record with ID:', recordId);

      let numericId = recordId;
      if (typeof recordId === 'string' && recordId.startsWith('purchase-')) {
        numericId = recordId.split('-')[1];
      }

      // Delete from MySQL
      const response = await fetch(`${this.baseUrl}/${numericId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      console.log('Backend delete response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        try {
          const responseText = await response.text();
          return {
            success: true,
            message: responseText || 'Purchase record deleted successfully'
          };
        } catch (e) {
          return {
            success: true,
            message: 'Purchase record deleted successfully'
          };
        }
      } else {
        let errorMessage = 'Failed to delete purchase record';
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (e) {
          console.log('Could not read error response text');
        }

        console.error('Backend delete failed:', errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('Error deleting purchase record:', error);
      return {
        success: false,
        message: 'Failed to delete purchase record. Please try again.'
      };
    }
  }

  /**
   * Validate that the purchase API is reachable.
   */
  async syncLocalDataWithFile(): Promise<{ success: boolean; message: string; syncedRecords?: number }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const records = await response.json();
        return {
          success: true,
          message: 'Purchase data is available from MySQL',
          syncedRecords: Array.isArray(records) ? records.length : 0
        };
      }

      return {
        success: false,
        message: 'Failed to reach the purchase API'
      };
    } catch (error) {
      console.error('Error validating purchase API:', error);
      return {
        success: false,
        message: 'Failed to reach the purchase API'
      };
    }
  }

  /**
   * Update a specific purchase record by ID
   */
  async updatePurchaseRecord(recordId: string, purchaseData: PurchaseData): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Format date to ISO string (YYYY-MM-DD) for backend
      const formatDateForBackend = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      const requestBody = {
        purchaseBillNo: purchaseData.purchaseBillNo,
        purchaseDate: formatDateForBackend(purchaseData.purchaseDate),
        branch: purchaseData.branch,
        materialName: purchaseData.materialName,
        productCode: purchaseData.productCode,
        productDescription: purchaseData.productDescription,
        category: purchaseData.category, // Send original frontend category names
        subcategory: purchaseData.subcategory,
        hsn: purchaseData.hsn,
        quantity: purchaseData.quantity,
        purchasePrice: purchaseData.purchasePrice,
        inputGSTPercent: purchaseData.inputGSTPercent,
        inputGSTAmount: purchaseData.inputGSTAmount,
        totalAmount: purchaseData.totalAmount,
        supplierName: purchaseData.supplier.name,
        supplierAddress: purchaseData.supplier.address,
        supplierGstin: purchaseData.supplier.gstin,
        remarks: purchaseData.remarks,
        // Conditional fields for Spectacles/Frame/Sunglasses
        color: purchaseData.color,
        size: purchaseData.size,
        type: purchaseData.type,
        gender: purchaseData.gender,
        shape: purchaseData.shape,
        material: purchaseData.material,
        templeDetails: purchaseData.templeDetails,
        bridgeSize: purchaseData.bridgeSize,
        // Conditional fields for Lens
        lensDetail: purchaseData.lensDetail,
        lensCoating: purchaseData.lensCoating,
        design: purchaseData.design,
        lensIndex: purchaseData.lensIndex,
        lensNumber: purchaseData.lensNumber,
        lensAddition: purchaseData.lensAddition,
        lensAxis: purchaseData.lensAxis,
        lensNumberRange: purchaseData.lensNumberRange,
        // Conditional fields for Contact Lens
        lensProductName: purchaseData.lensProductName,
        ct: purchaseData.ct,
        baseCurve: purchaseData.baseCurve,
        diameter: purchaseData.diameter,
        modality: purchaseData.modality,
        validity: purchaseData.validity,
        waterContent: purchaseData.waterContent,
        dkt: purchaseData.dkt,
        // Conditional fields for Solution
        solutionName: purchaseData.solutionName,
        variant: purchaseData.variant,
        packingType: purchaseData.packingType,
        // Conditional fields for Other/Non-Chargeable
        name: purchaseData.name,
      };

      let numericId = recordId;
      if (typeof recordId === 'string' && recordId.startsWith('purchase-')) {
        numericId = recordId.split('-')[1];
      }

      console.log('Sending update request to:', `${this.baseUrl}/${numericId}`);
      console.log('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/${numericId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('Update successful, response:', result);
        return {
          success: true,
          message: 'Purchase record updated successfully',
          data: result
        };
      } else {
        const error = await response.text();
        console.error('Update failed with status:', response.status);
        console.error('Error response:', error);
        return {
          success: false,
          message: `HTTP ${response.status}: ${error || 'Failed to update purchase record'}`
        };
      }
    } catch (error) {
      console.error('Error updating purchase record:', error);
      return {
        success: false,
        message: 'Failed to update purchase record. Please try again.'
      };
    }
  }

  /**
   * Backward-compatible wrapper that now updates MySQL directly.
   */
  async updateLocalPurchaseRecord(recordId: string, updatedData: PurchaseData): Promise<{ success: boolean; message: string }> {
    const result = await this.updatePurchaseRecord(recordId, updatedData);
    return {
      success: result.success,
      message: result.message
    };
  }

  /**
   * Get a specific purchase record by ID from MySQL
   */
  async getPurchaseRecordById(recordId: string): Promise<PurchaseData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${recordId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error getting purchase record by ID:', error);
      return null;
    }
  }

  /**
   * Get all saved purchase files from the data folder
   */
  async getSavedPurchaseFiles(): Promise<string[]> {
    // This method is kept for backward compatibility
    // In the new system, we don't have separate files
    return [];
  }

  /**
   * Export purchase data to JSON file
   */
  async exportPurchaseData(): Promise<{ success: boolean; message: string; data?: string }> {
    try {
      const records = await this.getPurchaseRecords();
      const jsonData = JSON.stringify(records, null, 2);
      
      // Create a download link for the user
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase-records.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Purchase data exported successfully',
        data: jsonData
      };
    } catch (error) {
      console.error('Error exporting purchase data:', error);
      return {
        success: false,
        message: 'Failed to export purchase data'
      };
    }
  }

  /**
   * Import purchase data from JSON file — saves each record into MySQL via the purchase API.
   */
  async importPurchaseData(file: File): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const text = await file.text();
      const records = JSON.parse(text);

      if (!Array.isArray(records)) {
        return {
          success: false,
          message: 'Invalid file format. Expected an array of purchase records.'
        };
      }

      // Validate records
      for (const record of records) {
        if (!record.purchaseDate || !record.purchaseBillNo) {
          return {
            success: false,
            message: 'Invalid record format. Each record must have purchaseDate and purchaseBillNo.'
          };
        }
      }

      let imported = 0;
      const errors: string[] = [];

      for (const record of records) {
        const result = await this.createPurchase(record);
        if (result.success) {
          imported++;
        } else {
          errors.push(`${record.purchaseBillNo}: ${result.message}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: imported > 0,
          message: `Imported ${imported}/${records.length} records. Errors: ${errors.slice(0, 3).join('; ')}`,
          count: imported
        };
      }

      return {
        success: true,
        message: `Successfully imported ${imported} purchase records`,
        count: imported
      };
    } catch (error) {
      console.error('Error importing purchase data:', error);
      return {
        success: false,
        message: 'Failed to import purchase data. Please check the file format.'
      };
    }
  }

  /**
   * Get combined purchase history from both single purchases and bulk purchases.
   * This calls the unified /api/purchase-history endpoint.
   */
  async getPurchaseHistory(): Promise<PurchaseData[]> {
  try {
    console.log('getPurchaseHistory: Fetching combined data from unified API...');

    const response = await fetch(`${API_BASE_URL}/purchase-history`, {
      method: 'GET',
      headers: getHeaders(),
    });

    console.log('Unified API response status:', response.status);

    if (!response.ok) {
      console.error('Unified API fetch failed with status:', response.status, response.statusText);
      return [];
    }

    const history = await response.json();
    console.log('Unified API returned data:', history.length, 'records');

    // Convert backend PurchaseHistoryDTO format to frontend PurchaseData format
    const mapBackendCategoryToFrontend = (backendCategory: string): PurchaseData['category'] => {
      switch (backendCategory) {
        case 'SPECTACLES':
          return 'Spectacles';
        case 'SUNGLASSES':
          return 'Sunglasses';
        case 'LENS':
          return 'Lens';
        case 'CONTACT_LENSES':
          return 'Contact Lens';
        case 'FRAMES':
          return 'Frame';
        case 'SOLUTIONS':
          return 'Solution';
        case 'OTHER':
          return 'Other';
        case 'NON_CHARGEABLE':
          return 'Non-Chargeable';
        default:
          return 'Other';
      }
    };

    const convertedHistory = history.map((item: any) => ({
      id: item.recordType === 'BULK' ? `${item.parentId}-${item.itemId}` : item.id?.toString() || '',
      recordType: item.recordType,
      parentId: item.parentId?.toString(),
      itemId: item.itemId?.toString(),
      purchaseDate: item.purchaseDate,
      purchaseBillNo: item.purchaseBillNo,
      branch: item.branch || '',
      materialName: item.materialName,
      productCode: item.productCode,
      productDescription: item.productDescription,
      category: mapBackendCategoryToFrontend(item.category),
      subcategory: item.subcategory,
      hsn: item.hsn,
      quantity: item.quantity,
      purchasePrice: Number(item.purchasePrice),
      inputGSTPercent: Number(item.inputGSTPercent),
      inputGSTAmount: Number(item.inputGSTAmount),
      totalAmount: Number(item.totalAmount),
      supplier: {
        name: item.supplierName,
        address: item.supplierAddress,
        gstin: item.supplierGstin,
      },
      remarks: item.remarks,
      // Conditional fields for Spectacles/Frame/Sunglasses
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
    }));

    console.log('Converted history:', convertedHistory.length, 'records');
    return convertedHistory;
  } catch (error) {
    console.error('Error fetching unified purchase history:', error);
    return [];
  }
}
}

export default new PurchaseService();
