import React, { useState, useEffect, Fragment } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import salesReturnService, { SalesReturnRecord } from '../../services/salesReturnService';
import branchService, { Branch } from '../../services/branchService';

const returnReasons = [
  'Defective Product',
  'Wrong Specification',
  'Damaged in Transit',
  'Quality Issues',
  'Wrong Size/Model',
  'Customer Dissatisfaction',
  'Other'
];

const categories = ['Spectacles', 'Sunglasses', 'Frame', 'Lens', 'Contact Lens', 'Solution', 'Other', 'Non-Chargeable'];

const SalesReturnPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturnRecord[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<SalesReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddReturnDialog, setShowAddReturnDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const initialProduct = {
    billingProductId: undefined as number | undefined,
    productCode: '',
    productName: '',
    productDescription: '',
    hsn: '',
    quantity: '',
    price: '',
    category: '',
    subcategory: '',
    gstPercent: '',
    returnQuantity: '',
    returnReason: '',
    remarks: ''
  };

  const [addReturnForm, setAddReturnForm] = useState({
    returnDate: new Date().toISOString().slice(0, 10),
    selectedSaleId: '',
    saleBillNo: '',
    serialNo: '',
    branchName: '',
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerAddress: '',
    products: [{ ...initialProduct }],
    lookupLoaded: false,
  });

  const handleAddProduct = () => {
    setAddReturnForm(prev => ({
      ...prev,
      products: [...prev.products, { ...initialProduct }]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    if (addReturnForm.products.length <= 1) return;
    setAddReturnForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const updatedProducts = [...addReturnForm.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setAddReturnForm(prev => ({
      ...prev,
      products: updatedProducts
    }));
  };

  const handleSaleBillChange = (saleBillNo: string) => {
    setAddReturnForm(prev => {
      if (prev.saleBillNo === saleBillNo) {
        return prev;
      }

      return {
        ...prev,
        saleBillNo,
        serialNo: '',
        branchName: '',
        customerName: '',
        customerContact: '',
        customerEmail: '',
        customerAddress: '',
        products: [{ ...initialProduct }],
        lookupLoaded: false,
      };
    });
  };

  // Auto-fill from sale bill lookup
  const handleSaleLookup = async (saleBillNo: string) => {
    if (!saleBillNo || saleBillNo.trim() === '') return;
    try {
      const saleData = await salesReturnService.getSaleByBillNumber(saleBillNo);
      if (saleData && saleData.sale) {
        const sale = saleData.sale;
        setAddReturnForm(prev => ({
          ...prev,
          saleBillNo: sale.billNumber || saleBillNo,
          serialNo: sale.serialNo || '',
          branchName: sale.branchName || '',
          customerName: sale.customerName || '',
          customerContact: sale.customerContact || '',
          customerEmail: sale.customerEmail || '',
          customerAddress: sale.customerAddress || '',
          products: saleData.products && saleData.products.length > 0
            ? saleData.products.map((p: any) => ({
                billingProductId: p.id,
                productCode: p.productCode || '',
                productName: p.productName || '',
                productDescription: p.description || p.productName || '',
                hsn: p.hsnCode || p.hsn || '',
                quantity: String(p.quantity || p.originalQuantity || 0),
                price: String(p.pricePerUnit || p.price || 0),
                category: p.category || '',
                subcategory: p.subcategory || '',
                gstPercent: String(p.gstPercentage || p.gstPercent || 0),
                returnQuantity: '',
                returnReason: '',
                remarks: ''
              }))
            : [{ ...initialProduct }],
          lookupLoaded: true,
        }));
      } else {
        // Clear stale data when lookup returns no result
        setAddReturnForm(prev => ({
          ...prev,
          serialNo: '',
          branchName: '',
          customerName: '',
          customerContact: '',
          customerEmail: '',
          customerAddress: '',
          products: [{ ...initialProduct }],
          lookupLoaded: false,
        }));
        setNotification({ type: 'error', message: 'No billing record found for this bill number.' });
      }
    } catch (error) {
      console.error('Error looking up sale:', error);
      setNotification({ type: 'error', message: 'Failed to lookup bill. Please try again.' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [salesReturns, searchTerm, selectedCategory, selectedBranch, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load sales returns from backend API
      const returnsData = await salesReturnService.getAllReturns();
      setSalesReturns(returnsData);
      // Load branches from backend API
      const branchesData = await branchService.getAllBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...salesReturns];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(returnRecord =>
        returnRecord.billNumber.toLowerCase().includes(term) ||
        returnRecord.customerName.toLowerCase().includes(term) ||
        returnRecord.items.some(item => item.productName.toLowerCase().includes(term)) ||
        returnRecord.serialNo.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(returnRecord =>
        returnRecord.items.some(item => item.category === selectedCategory)
      );
    }

    if (selectedBranch) {
      filtered = filtered.filter(returnRecord => returnRecord.branchName === selectedBranch);
    }

    if (dateFrom) {
      filtered = filtered.filter(returnRecord => returnRecord.returnDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(returnRecord => returnRecord.returnDate <= dateTo);
    }

    setFilteredReturns(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedBranch('');
    setDateFrom('');
    setDateTo('');
  };

  const toggleRowExpansion = (returnId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(returnId)) {
      newExpandedRows.delete(returnId);
    } else {
      newExpandedRows.add(returnId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleAddReturn = () => {
    setShowAddReturnDialog(true);
    setAddReturnForm({
      returnDate: new Date().toISOString().slice(0, 10),
      selectedSaleId: '',
      saleBillNo: '',
      serialNo: '',
      branchName: '',
      customerName: '',
      customerContact: '',
      customerEmail: '',
      customerAddress: '',
      products: [{ ...initialProduct }],
      lookupLoaded: false,
    });
  };

  const handleSaveReturn = async () => {
    if (!addReturnForm.lookupLoaded) {
      setNotification({ type: 'error', message: 'Please lookup a valid sales bill before saving the return' });
      return;
    }

    if (!addReturnForm.saleBillNo || !addReturnForm.branchName ||
        !addReturnForm.customerName || !addReturnForm.customerContact) {
      setNotification({ type: 'error', message: 'Please fill in all required customer and order details' });
      return;
    }

    const invalidProduct = addReturnForm.products.some(p =>
      !p.returnQuantity || !p.returnReason || !p.productCode || !p.productName ||
      !p.hsn || !p.quantity || !p.price || !p.category || !p.subcategory || !p.gstPercent
    );

    if (invalidProduct) {
      setNotification({ type: 'error', message: 'Please fill in all required fields for each product' });
      return;
    }

    for (let i = 0; i < addReturnForm.products.length; i++) {
      const p = addReturnForm.products[i];
      const rq = parseInt(p.returnQuantity);
      const oq = parseInt(p.quantity);
      if (rq > oq) {
        setNotification({ type: 'error', message: `Return quantity for product ${i + 1} (${p.productName}) cannot exceed original sale quantity` });
        return;
      }
    }

    setIsSaving(true);

    try {
      const request = {
        returnDate: addReturnForm.returnDate,
        billNumber: addReturnForm.saleBillNo,
        serialNo: addReturnForm.serialNo || '',
        branchName: addReturnForm.branchName,
        customerName: addReturnForm.customerName,
        customerContact: addReturnForm.customerContact,
        customerEmail: addReturnForm.customerEmail,
        customerAddress: addReturnForm.customerAddress,
        notes: '',
        items: addReturnForm.products.map(p => ({
          billingProductId: p.billingProductId,
          productCode: p.productCode,
          productName: p.productName,
          productDescription: p.productDescription || p.productName,
          category: p.category,
          subcategory: p.subcategory,
          hsn: p.hsn,
          originalQty: parseInt(p.quantity),
          returnQty: parseInt(p.returnQuantity),
          unitPrice: parseFloat(p.price),
          gstPercent: parseFloat(p.gstPercent),
          returnReason: p.returnReason,
          remarks: p.remarks || ''
        }))
      };

      const result = await salesReturnService.createReturn(request);

      if (result.success) {
        await loadData();
        setShowAddReturnDialog(false);
        setNotification({ type: 'success', message: 'Sales return recorded successfully!' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to save sales return' });
      }
    } catch (error) {
      console.error('Error saving return:', error);
      setNotification({ type: 'error', message: 'Failed to save sales return. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReturn = async (returnId: number) => {
    try {
      const result = await salesReturnService.deleteReturn(returnId);

      if (result.success) {
        // Reload data from backend
        await loadData();
        setShowDeleteConfirm(null);
        setNotification({ type: 'success', message: 'Sales return deleted successfully!' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to delete sales return' });
      }
    } catch (error) {
      console.error('Error deleting return:', error);
      setNotification({ type: 'error', message: 'Failed to delete sales return. Please try again.' });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Return Date', 'Original Bill No', 'Serial No', 'Branch', 'Customer Name', 'Customer Contact',
      'Product Name', 'Product Code', 'Category', 'Subcategory', 'HSN Code', 'Return Quantity', 
      'Original Quantity', 'Price', 'Return Value', 'Return Reason', 'Remarks'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredReturns.flatMap(returnRecord =>
        returnRecord.items.map(item => [
          returnRecord.returnDate,
          returnRecord.billNumber,
          returnRecord.serialNo,
          returnRecord.branchName,
          returnRecord.customerName,
          returnRecord.customerContact,
          item.productName,
          item.productCode,
          item.category,
          item.subcategory,
          item.hsn,
          item.returnedQty,
          item.originalQty,
          item.unitPrice,
          item.lineReturnAmount,
          item.returnReason,
          item.remarks || ''
        ].join(','))
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReturns = filteredReturns.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(page);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales return data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Return Management</h1>
            <p className="text-gray-600 mt-1">Manage customer returns and refunds</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleAddReturn}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sales Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`mb-3 p-4 rounded-lg flex items-center justify-between shadow-md ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${
              notification.type === 'success' ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-3 mb-1.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by bill no, customer, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {Array.from(new Set(salesReturns.map(r => r.branchName))).map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-1 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow border p-3 mb-1.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredReturns.length}</div>
            <div className="text-gray-600">Total Returns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(filteredReturns.reduce((sum, r) => sum + r.totalReturnAmount, 0))}
            </div>
            <div className="text-gray-600">Total Return Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredReturns.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.returnedQty, 0), 0)}
            </div>
            <div className="text-gray-600">Total Return Quantity</div>
          </div>
        </div>
      </div>

      {/* Sales Return Records Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReturns.map((returnRecord) => (
                <Fragment key={returnRecord.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{returnRecord.billNumber}</div>
                        <div className="text-gray-500">{formatDate(returnRecord.returnDate)}</div>
                        <div className="text-gray-500">{returnRecord.branchName}</div>
                        <div className="text-gray-500">SN: {returnRecord.serialNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{returnRecord.customerName}</div>
                        <div className="text-gray-500">{returnRecord.customerContact}</div>
                        <div className="text-gray-500">{returnRecord.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {returnRecord.items.length > 0 ? (
                          <>
                            <div className="font-medium text-gray-900">{returnRecord.items[0].productName}</div>
                            <div className="text-gray-500">{returnRecord.items[0].productCode}</div>
                            <div className="text-gray-500">{returnRecord.items[0].category} - {returnRecord.items[0].subcategory}</div>
                            {returnRecord.items.length > 1 && (
                              <div className="text-red-500 text-xs mt-1">+ {returnRecord.items.length - 1} more item(s)</div>
                            )}
                          </>
                        ) : <div className="text-gray-400">No items</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {returnRecord.items.reduce((sum, i) => sum + i.returnedQty, 0)} / {returnRecord.items.reduce((sum, i) => sum + i.originalQty, 0)}
                        </div>
                        <div className="text-gray-500">Total: {formatCurrency(returnRecord.totalReturnAmount)}</div>
                        <div className="text-gray-500">{returnRecord.items[0]?.returnReason || '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleRowExpansion(returnRecord.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(returnRecord.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Return"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row Details */}
                  {returnRecord.id !== undefined && expandedRows.has(returnRecord.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4">
                          {returnRecord.items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-3 last:border-b-0">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Product #{idx + 1}</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-medium">Name:</span> {item.productName}</div>
                                  <div><span className="font-medium">Code:</span> {item.productCode}</div>
                                  <div><span className="font-medium">Description:</span> {item.productDescription || '—'}</div>
                                  <div><span className="font-medium">HSN:</span> {item.hsn}</div>
                                  <div><span className="font-medium">Category:</span> {item.category} - {item.subcategory}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Return Info</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-medium">Orig Qty:</span> {item.originalQty}</div>
                                  <div><span className="font-medium">Return Qty:</span> {item.returnedQty}</div>
                                  <div><span className="font-medium">Unit Price:</span> {formatCurrency(item.unitPrice)}</div>
                                  <div><span className="font-medium">GST %:</span> {item.gstPercent}%</div>
                                  <div><span className="font-medium">Reason:</span> {item.returnReason || '—'}</div>
                                  <div><span className="font-medium">Remarks:</span> {item.remarks || '—'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Amount</h4>
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-medium">Line Amount:</span> {formatCurrency(item.lineReturnAmount)}</div>
                                  <div><span className="font-medium">GST Amount:</span> {formatCurrency(item.gstAmount)}</div>
                                  <div><span className="font-medium">Total:</span> {formatCurrency(item.lineReturnAmount)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t">
                            <h4 className="font-semibold text-gray-900 mb-1">Return Summary</h4>
                            <div className="text-sm space-y-1">
                              <div><span className="font-medium">Return Number:</span> {returnRecord.returnNumber}</div>
                              <div><span className="font-medium">Customer:</span> {returnRecord.customerName} ({returnRecord.customerContact})</div>
                              <div><span className="font-medium">Email:</span> {returnRecord.customerEmail || '—'}</div>
                              <div><span className="font-medium">Address:</span> {returnRecord.customerAddress || '—'}</div>
                              <div><span className="font-medium">Notes:</span> {returnRecord.notes || '—'}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReturns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No sales return records found</div>
            <div className="text-gray-400 text-sm mt-2">Try adding a sales return or adjusting your search criteria</div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredReturns.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Page Info */}
              <div className="text-sm text-gray-700">
                Showing records <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredReturns.length)}
                </span>{' '}
                of <span className="font-medium">{filteredReturns.length}</span> results
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        page === currentPage
                          ? 'bg-red-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Sales Return Dialog */}
      {showAddReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Sales Return</h3>
              <button
                onClick={() => setShowAddReturnDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveReturn(); }} className="space-y-6">

              {/* Order Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Bill No</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={addReturnForm.saleBillNo}
                        onChange={(e) => handleSaleBillChange(e.target.value)}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter bill number"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleSaleLookup(addReturnForm.saleBillNo)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Lookup
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={addReturnForm.returnDate}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, returnDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial No</label>
                    <input
                      type="text"
                      value={addReturnForm.serialNo}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, serialNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <select
                      value={addReturnForm.branchName}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, branchName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b.code} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Customer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={addReturnForm.customerName}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
                    <input
                      type="text"
                      value={addReturnForm.customerContact}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, customerContact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                    <input
                      type="email"
                      value={addReturnForm.customerEmail}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, customerEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                    <textarea
                      value={addReturnForm.customerAddress}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, customerAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Product Details Header */}
              <div className="flex items-center justify-between mt-4 mb-2 border-b pb-2">
                <h4 className="font-semibold text-gray-900">Product Details</h4>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!addReturnForm.lookupLoaded}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Product Sections Mapping */}
              {addReturnForm.products.map((product, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-red-800 bg-red-100 px-2 py-0.5 rounded">Product #{index + 1}</span>
                    {addReturnForm.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                      <input
                        type="text"
                        value={product.productCode}
                        onChange={(e) => handleProductChange(index, 'productCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={product.productName}
                        onChange={(e) => handleProductChange(index, 'productName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                      <input
                        type="text"
                        value={product.productDescription}
                        onChange={(e) => handleProductChange(index, 'productDescription', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                      <input
                        type="text"
                        value={product.hsn}
                        onChange={(e) => handleProductChange(index, 'hsn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                      <input
                        type="number"
                        value={product.gstPercent}
                        onChange={(e) => handleProductChange(index, 'gstPercent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={product.category}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={product.subcategory}
                        onChange={(e) => handleProductChange(index, 'subcategory', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Original Qty</label>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Qty</label>
                      <input
                        type="number"
                        value={product.returnQuantity}
                        onChange={(e) => handleProductChange(index, 'returnQuantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
                      <select
                        value={product.returnReason}
                        onChange={(e) => handleProductChange(index, 'returnReason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select reason</option>
                        {returnReasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={product.remarks}
                        onChange={(e) => handleProductChange(index, 'remarks', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddReturnDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this sales return?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteReturn(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturnPage;
