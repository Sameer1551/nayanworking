import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface MovementHistoryProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

interface Movement {
  id: string;
  date: string;
  type: 'Purchase' | 'Sale' | 'Purchase Return' | 'Sales Return' | 'Initial Stock' | 'Adjustment';
  quantity: number;
  reference: string;
  balance: number;
  details?: {
    billNumber?: string;
    customerName?: string;
    supplierName?: string;
    unitPrice?: number;
    totalAmount?: number;
    remarks?: string;
  };
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ item, isOpen, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'sales'>('all');

  useEffect(() => {
    if (isOpen && item) {
      loadMovements();
    }
  }, [isOpen, item]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const normalizedMovements: Movement[] = Array.isArray(item.movements)
        ? item.movements.map((movement, index) => ({
            id: movement.id ?? `movement-${index}`,
            date: movement.date,
            type: movement.type,
            quantity: movement.quantity,
            reference: movement.reference,
            balance: movement.balance,
            details: movement.details,
          }))
        : [];
      setMovements(normalizedMovements);
    } catch (error) {
      console.error('Error loading movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMovements = () => {
    switch (activeTab) {
      case 'purchases':
        return movements.filter(m => ['Purchase', 'Purchase Return', 'Initial Stock'].includes(m.type));
      case 'sales':
        return movements.filter(m => ['Sale', 'Sales Return'].includes(m.type));
      default:
        return movements;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'Purchase':
      case 'Initial Stock':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'Sale':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'Purchase Return':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'Sales Return':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'Purchase':
      case 'Initial Stock':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Sale':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Purchase Return':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Sales Return':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  const filteredMovements = getFilteredMovements();
  const totalPurchases = movements.filter(m => ['Purchase', 'Initial Stock'].includes(m.type)).reduce((sum, m) => sum + Math.max(0, m.quantity), 0);
  const totalSales = Math.abs(movements.filter(m => m.type === 'Sale').reduce((sum, m) => sum + m.quantity, 0));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Movement History</h3>
            <p className="text-sm text-gray-600">{item.productName} ({item.productCode})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Statistics - Moved to top */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-green-600 font-medium">Total Purchases</p>
              <p className="text-lg font-bold text-green-700">{totalPurchases}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-red-600 font-medium">Total Sales</p>
              <p className="text-lg font-bold text-red-700">{totalSales}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-600 font-medium">Current Stock</p>
              <p className="text-lg font-bold text-blue-700">{item.currentStock}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-purple-600 font-medium">Total Value</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(item.totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 border-b">
          {[
            { key: 'all', label: 'All Movements', count: movements.length },
            { key: 'purchases', label: 'Purchases', count: movements.filter(m => ['Purchase', 'Purchase Return', 'Initial Stock'].includes(m.type)).length },
            { key: 'sales', label: 'Sales', count: movements.filter(m => ['Sale', 'Sales Return'].includes(m.type)).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Movements List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No movements found</h3>
              <p className="mt-1 text-sm text-gray-500">No {activeTab === 'all' ? '' : activeTab} movements for this product.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement) => (
                <div
                  key={movement.id}
                  className={`p-4 border rounded-lg ${getMovementColor(movement.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getMovementIcon(movement.type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{movement.type}</span>
                          <span className="text-xs bg-white px-2 py-1 rounded-full">
                            {formatDate(movement.date)}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="font-medium">Reference:</span> {movement.reference}
                        </div>
                        {movement.details?.remarks && (
                          <div className="text-sm mt-1">
                            <span className="font-medium">Remarks:</span> {movement.details.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                      <div className="text-sm text-gray-600">
                        Balance: {movement.balance}
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {movement.details && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {movement.details.billNumber && (
                          <div>
                            <span className="font-medium">Bill No:</span> {movement.details.billNumber}
                          </div>
                        )}
                        {movement.details.customerName && (
                          <div>
                            <span className="font-medium">Customer:</span> {movement.details.customerName}
                          </div>
                        )}
                        {movement.details.supplierName && (
                          <div>
                            <span className="font-medium">Supplier:</span> {movement.details.supplierName}
                          </div>
                        )}
                        {movement.details.unitPrice && (
                          <div>
                            <span className="font-medium">Unit Price:</span> {formatCurrency(movement.details.unitPrice)}
                          </div>
                        )}
                        {movement.details.totalAmount && (
                          <div>
                            <span className="font-medium">Total Amount:</span> {formatCurrency(movement.details.totalAmount)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovementHistory;
