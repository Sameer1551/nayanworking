import React, { useState, useEffect } from 'react';
import { Search, Eye, AlertTriangle, Package, TrendingUp, TrendingDown, BarChart3, History, CreditCard } from 'lucide-react';
import { InventoryItem } from '../../types/inventory';
import inventoryService from '../../services/inventoryService';
import MovementHistory from '../../components/MovementHistory';
import * as XLSX from 'xlsx';

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showMovements, setShowMovements] = useState(false);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadInventoryData();

    // Subscribe to real-time inventory updates
    const unsubscribe = inventoryService.subscribe((data) => {
      console.log('Inventory component: Received update from service:', data.length, 'items');
      setInventory(data);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchTerm, categoryFilter, statusFilter, branchFilter, stockFilter, sortBy, sortOrder]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const data = await inventoryService.loadInventory();

      if (data && data.length > 0) {
        setInventory(data);
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error('Inventory: failed to load', error);
      setFetchError('Failed to load inventory from the server. Please check your connection and try refreshing.');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInventory = () => {
    console.log('Inventory component: Filtering and sorting inventory. Current inventory count:', inventory.length);

    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply branch filter
    if (branchFilter) {
      filtered = filtered.filter(item => item.branch === branchFilter);
    }

    // Apply stock filter
    if (stockFilter) {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(item => item.currentStock <= item.minimumStock);
          break;
        case 'out':
          filtered = filtered.filter(item => item.currentStock === 0);
          break;
        case 'overstocked':
          filtered = filtered.filter(item => item.currentStock >= item.maximumStock);
          break;
        default:
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy as keyof InventoryItem] as string | number;
      let bValue: string | number = b[sortBy as keyof InventoryItem] as string | number;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('Inventory component: Filtered inventory count:', filtered.length);
    setFilteredInventory(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      case 'Overstocked':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'Out of Stock';
    if (item.currentStock <= item.minimumStock) return 'Low Stock';
    if (item.currentStock >= item.maximumStock) return 'Overstocked';
    return 'In Stock';
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
    return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getSoldQuantity = (item: InventoryItem) => {
    if (!item.sellingPrice || item.sellingPrice <= 0) return 0;
    return Math.round((item.totalSalesRevenue / item.sellingPrice) * 100) / 100;
  };

  const getCategories = () => {
    const categories = [...new Set(inventory.map(item => item.category))];
    return categories.sort();
  };

  const getBranches = () => {
    const branches = [...new Set(inventory.map(item => item.branch))];
    return branches.sort();
  };

  const getStatuses = () => {
    const statuses = [...new Set(inventory.map(item => getStockStatus(item)))];
    return statuses.sort();
  };

  const calculateTotalValue = () => {
    return filteredInventory.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const calculateTotalItems = () => {
    return filteredInventory.reduce((sum, item) => sum + item.currentStock, 0);
  };

  const calculateLowStockItems = () => {
    return filteredInventory.filter(item => item.currentStock <= item.minimumStock).length;
  };

  const calculateOutOfStockItems = () => {
    return filteredInventory.filter(item => item.currentStock === 0).length;
  };

  // New calculation functions for enhanced inventory management
  const calculateTotalEstimatedSalesPrice = () => {
    return filteredInventory.reduce((sum, item) => sum + item.estimatedSalesPrice, 0);
  };

  const calculateTotalNetProfit = () => {
    return filteredInventory.reduce((sum, item) => sum + item.netProfit, 0);
  };

  const handleExportReport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare data for export
      const exportData = filteredInventory.map(item => ({
        'Product Name': item.productName,
        'Product Code': item.productCode,
        'Description': item.description,
        'Category': item.category,
        'Subcategory': item.subcategory,
        'Current Stock': item.currentStock,
        'Minimum Stock': item.minimumStock,
        'Maximum Stock': item.maximumStock,
        'Unit Cost (₹)': item.unitCost,
        'Selling Price (₹)': item.sellingPrice,
        'Net Cost (₹)': item.totalValue,
        'Estimated Sales Price (₹)': item.estimatedSalesPrice,
        'Net Profit (₹)': item.netProfit,
        'Status': getStockStatus(item),
        'Branch': item.branch,
        'Location': item.location,
        'Supplier': item.supplier,
        'Last Updated': item.lastUpdated
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Product Name
        { wch: 15 }, // Product Code
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 15 }, // Subcategory
        { wch: 12 }, // Current Stock
        { wch: 12 }, // Minimum Stock
        { wch: 12 }, // Maximum Stock
        { wch: 15 }, // Unit Cost
        { wch: 15 }, // Selling Price
        { wch: 15 }, // Net Cost
        { wch: 20 }, // Estimated Sales Price
        { wch: 15 }, // Net Profit
        { wch: 12 }, // Status
        { wch: 15 }, // Branch
        { wch: 20 }, // Location
        { wch: 20 }, // Supplier
        { wch: 15 }  // Last Updated
      ];
      ws['!cols'] = columnWidths;

      // Add summary data at the top
      const summaryData = [
        ['Inventory Report Summary'],
        [''],
        ['Total Items', calculateTotalItems()],
        ['Total Net Cost (₹)', calculateTotalValue()],
        ['Total Estimated Sales Price (₹)', calculateTotalEstimatedSalesPrice()],
        ['Total Net Profit (₹)', calculateTotalNetProfit()],
        ['Low Stock Items', calculateLowStockItems()],
        ['Out of Stock Items', calculateOutOfStockItems()],
        [''],
        ['Report Generated', new Date().toLocaleString('en-IN')],
        ['']
      ];

      // Create summary worksheet
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 30 }, { wch: 20 }];

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Data');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `inventory_report_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting inventory report:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your product inventory across all branches</p>
        </div>
        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              setFetchError(null);
              try {
                await inventoryService.refreshInventory();
                setInlineMessage({ type: 'success', text: 'Inventory refreshed successfully.' });
              } catch (error) {
                setFetchError('Failed to refresh inventory. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const result = await inventoryService.cleanupOrphanedInventoryItems();
                if (result.removed.length > 0) {
                  setInlineMessage({ type: 'success', text: `Cleanup completed! Removed ${result.removed.length} orphaned item(s).` });
                } else {
                  setInlineMessage({ type: 'success', text: result.message || 'No orphaned items found. Inventory is already clean.' });
                }
              } catch (error) {
                setFetchError('Error during cleanup. Please check the console for details.');
              } finally {
                setLoading(false);
              }
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            disabled={loading}
            title="Remove inventory items that don't have corresponding purchase records"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {loading ? 'Cleaning...' : 'Cleanup'}
          </button>
          <button
            onClick={handleExportReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Inline success/info message */}
      {inlineMessage && (
        <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 text-sm border ${
          inlineMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{inlineMessage.text}</span>
          <button onClick={() => setInlineMessage(null)} className="ml-auto opacity-60 hover:opacity-100 font-bold">✕</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mb-2">
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Cost</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(calculateTotalValue())}</p>
            </div>
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-xl font-bold text-gray-900">{calculateTotalItems()}</p>
            </div>
            <Package className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">{calculateLowStockItems()}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{calculateOutOfStockItems()}</p>
            </div>
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Est. Sales</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(calculateTotalEstimatedSalesPrice())}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(calculateTotalNetProfit())}</p>
            </div>
            <CreditCard className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-lg shadow-sm border mb-2">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, codes, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {getCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {getStatuses().map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {getBranches().map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'productName') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('productName');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Product
                    {sortBy === 'productName' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'category') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('category');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Category
                    {sortBy === 'category' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'currentStock') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('currentStock');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Stock
                    {sortBy === 'currentStock' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'unitCost') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('unitCost');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Cost
                    {sortBy === 'unitCost' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'sellingPrice') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('sellingPrice');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Price
                    {sortBy === 'sellingPrice' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'totalValue') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('totalValue');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Net Cost
                    {sortBy === 'totalValue' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'estimatedSalesPrice') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('estimatedSalesPrice');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Est. Sales Price
                    {sortBy === 'estimatedSalesPrice' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => {
                  if (sortBy === 'netProfit') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('netProfit');
                    setSortOrder('asc');
                  }
                }}>
                  <div className="flex items-center gap-2">
                    Net Profit
                    {sortBy === 'netProfit' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.productCode}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.category}</div>
                    <div className="text-xs text-gray-500">{item.subcategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.currentStock}</div>
                    <div className="text-xs text-gray-500">
                      Min: {item.minimumStock} | Max: {item.maximumStock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.unitCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.sellingPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                    {formatCurrency(item.estimatedSalesPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {formatCurrency(item.netProfit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getStockStatus(item))}`}>
                      {getStockStatus(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.branch}</div>
                    <div className="text-xs text-gray-500">{item.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowMovements(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowMovementHistory(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="View Movement History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Movements Modal */}
      {showMovements && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Inventory Movements - {selectedItem!.productName}</h3>
                <button
                  onClick={() => setShowMovements(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Product Code</p>
                  <p className="text-sm text-gray-900">{selectedItem!.productCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Stock</p>
                  <p className="text-sm text-gray-900">{selectedItem!.currentStock}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Branch</p>
                  <p className="text-sm text-gray-900">{selectedItem!.branch}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">{selectedItem!.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Cost</p>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedItem!.totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Est. Sales Price</p>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedItem!.estimatedSalesPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Purchase Cost</p>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedItem!.totalPurchaseCost)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Sales Revenue</p>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedItem!.totalSalesRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Net Profit</p>
                  <p className={`text-sm font-medium ${selectedItem!.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(selectedItem!.netProfit)}
                  </p>
                </div>
              </div>

              {/* Net Profit Breakdown */}
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Net Profit Breakdown</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Quantity Sold:</span>
                      <span className="ml-2">
                        {getSoldQuantity(selectedItem!)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Sale Price:</span>
                      <span className="ml-2">{formatCurrency(selectedItem!.sellingPrice)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Cost Per Unit:</span>
                      <span className="ml-2">{formatCurrency(selectedItem!.unitCost)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Revenue:</span>
                      <span className="ml-2">{formatCurrency(selectedItem!.totalSalesRevenue)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Cost of Sold Items:</span>
                      <span className="ml-2">{formatCurrency(getSoldQuantity(selectedItem!) * selectedItem!.unitCost)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Profit Per Unit:</span>
                      <span className="ml-2">{formatCurrency(selectedItem!.sellingPrice - selectedItem!.unitCost)}</span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-white rounded border-l-4 border-blue-500">
                    <p className="text-xs font-medium text-gray-700">Calculation:</p>
                    <p className="text-xs text-gray-600">
                      ({selectedItem!.totalSalesRevenue > 0 ? Math.round((selectedItem!.totalSalesRevenue / selectedItem!.sellingPrice) * 100) / 100 : 0} × {formatCurrency(selectedItem!.sellingPrice)}) - ({selectedItem!.totalSalesRevenue > 0 ? Math.round((selectedItem!.totalSalesRevenue / selectedItem!.sellingPrice) * 100) / 100 : 0} × {formatCurrency(selectedItem!.unitCost)}) = {formatCurrency(selectedItem!.netProfit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Movement History</h4>
                  <button
                    onClick={() => {
                      setShowMovementHistory(true);
                      setShowMovements(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <History className="h-4 w-4" />
                    View Detailed History
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedItem!.movements && selectedItem!.movements.length > 0 ? (
                    selectedItem!.movements.map((movement, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${movement.type === 'Purchase' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{movement.type}</p>
                            <p className="text-xs text-gray-500">{formatDate(movement.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${movement.type === 'Purchase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {movement.type === 'Purchase' ? '+' : ''}{movement.quantity}
                          </p>
                          <p className="text-xs text-gray-500">Balance: {movement.balance}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No movement history available</p>
                      <p className="text-xs">Click "View Detailed History" to see comprehensive data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {showMovementHistory && selectedItem && (
        <MovementHistory
          item={selectedItem!}
          isOpen={showMovementHistory}
          onClose={() => setShowMovementHistory(false)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
