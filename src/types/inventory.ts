export interface InventoryItem {
  id: number;
  productCode: string;
  productName: string;
  category: string;
  subcategory: string;
  hsnCode: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  sellingPrice: number;
  totalValue: number;
  // New fields for enhanced inventory management
  estimatedSalesPrice: number; // currentStock * sellingPrice
  totalPurchaseCost: number; // total cost of all purchases
  totalSalesRevenue: number; // total revenue from all sales
  netProfit: number; // totalSalesRevenue - totalPurchaseCost
  branch: string;
  supplier: string;
  lastUpdated: string;
  status: string;
  location: string;
  expiryDate: string | null;
  batchNumber: string;
  updatedAt?: string;
  movements: InventoryMovement[];
}

export interface InventoryMovement {
  id?: string;
  date: string;
  type: 'Purchase' | 'Sale' | 'Sales Return' | 'Purchase Return' | 'Initial Stock' | 'Adjustment';
  quantity: number;
  reference: string;
  balance: number;
  branch?: string;
  details?: {
    billNumber?: string;
    customerName?: string;
    supplierName?: string;
    unitPrice?: number;
    totalAmount?: number;
    remarks?: string;
  };
}

export interface InventoryFilter {
  category?: string;
  status?: string;
  branch?: string;
  stockLevel?: 'low' | 'out' | 'overstocked';
  search?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categories: string[];
  branches: string[];
  itemCount: number;
}

export interface NewInventoryItem {
  productCode: string;
  productName: string;
  category: string;
  subcategory: string;
  hsnCode: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitCost: number;
  sellingPrice: number;
  branch: string;
  supplier: string;
  location: string;
  expiryDate?: string;
  batchNumber: string;
}

export interface StockUpdate {
  productId: string;
  quantity: number;
  reference: string;
  type: 'sale' | 'purchase' | 'return';
  isSalesReturn?: boolean;
}

export interface InventoryReport {
  date: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  recentMovements: InventoryMovement[];
  categoryBreakdown: {
    category: string;
    count: number;
    value: number;
  }[];
  branchBreakdown: {
    branch: string;
    count: number;
    value: number;
  }[];
}
