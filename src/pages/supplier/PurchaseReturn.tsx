import React, { useState, useEffect, Fragment } from 'react';
import { Plus, Search, Download, Eye, Edit, Trash2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import purchaseService, { PurchaseData } from '../../services/purchaseService';
import purchaseReturnService, { PurchaseReturnRecord } from '../../services/purchaseReturnService';
import branchService, { Branch } from '../../services/branchService';

const returnReasons = [
  'Defective Product',
  'Wrong Specification',
  'Damaged in Transit',
  'Quality Issues',
  'Wrong Size/Model',
  'Customer Return',
  'Other'
];

const PurchaseReturnPage: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturnRecord[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<PurchaseReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddReturnDialog, setShowAddReturnDialog] = useState(false);
  const [editingReturn, setEditingReturn] = useState<PurchaseReturnRecord | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseData | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [addReturnForm, setAddReturnForm] = useState({
    returnDate: new Date().toISOString().slice(0, 10),
    selectedPurchaseId: '',
    purchaseBillNo: '',
    branchName: '',
    productCode: '',
    materialName: '',
    hsn: '',
    quantity: '',
    price: '',
    category: '',
    subcategory: '',
    gstPercent: '',
    supplierName: '',
    supplierAddress: '',
    supplierGstin: '',
    returnQuantity: '',
    returnReason: '',
    remarks: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [branches, setBranches] = useState<Branch[]>([]);

  const categories = ['Spectacles', 'Sunglasses', 'Frame', 'Lens', 'Contact Lens', 'Solution', 'Other', 'Non-Chargeable'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReturns();
    setCurrentPage(1);
  }, [purchaseReturns, searchTerm, selectedCategory, selectedBranch, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      // Load the unified purchase history so returns can link to both single and bulk purchases
      try {
        const purchaseData = await purchaseService.getPurchaseHistory();
        setPurchases(purchaseData || []);
      } catch (apiError) {
        console.log('Could not load purchase records:', apiError);
      }

      // Load purchase return records from backend API
      const returnsData = await purchaseReturnService.getAllReturns();
      setPurchaseReturns(returnsData);

      // Load branches from backend API
      const branchesData = await branchService.getAllBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReturns = () => {
    let filtered = [...purchaseReturns];

    if (searchTerm) {
      filtered = filtered.filter(returnRecord =>
        returnRecord.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnRecord.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnRecord.originalPurchaseBillNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnRecord.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(returnRecord => returnRecord.category === selectedCategory);
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
    setEditingReturn(null);
    setSelectedPurchase(null);
    setAddReturnForm({
      returnDate: new Date().toISOString().slice(0, 10),
      selectedPurchaseId: '',
      purchaseBillNo: '',
      branchName: '',
      productCode: '',
      materialName: '',
      hsn: '',
      quantity: '',
      price: '',
      category: '',
      subcategory: '',
      gstPercent: '',
      supplierName: '',
      supplierAddress: '',
      supplierGstin: '',
      returnQuantity: '',
      returnReason: '',
      remarks: ''
    });
  };

  const handlePurchaseSelect = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id?.toString() === purchaseId);
    if (purchase) {
      setSelectedPurchase(purchase!);
      setAddReturnForm(prev => ({
        ...prev,
        selectedPurchaseId: purchaseId,
        purchaseBillNo: purchase!.purchaseBillNo,
        branchName: purchase!.branch,
        productCode: purchase!.productCode,
        materialName: purchase!.materialName,
        hsn: purchase!.hsn,
        quantity: purchase!.quantity.toString(),
        price: purchase!.purchasePrice.toString(),
        category: purchase!.category,
        subcategory: purchase!.subcategory,
        gstPercent: purchase!.inputGSTPercent.toString(),
        supplierName: purchase!.supplier?.name || '',
        supplierAddress: purchase!.supplier?.address || '',
        supplierGstin: purchase!.supplier?.gstin || '',
        returnQuantity: '',
        returnReason: '',
        remarks: ''
      }));
    }
  };

  const handleClearPurchaseSelection = () => {
    setSelectedPurchase(null);
    setAddReturnForm(prev => ({
      ...prev,
      selectedPurchaseId: '',
      purchaseBillNo: '',
      branchName: '',
      productCode: '',
      materialName: '',
      hsn: '',
      quantity: '',
      price: '',
      category: '',
      subcategory: '',
      gstPercent: '',
      supplierName: '',
      supplierAddress: '',
      supplierGstin: '',
      returnQuantity: '',
      returnReason: '',
      remarks: ''
    }));
  };

  const handleSaveReturn = async () => {
    if (!addReturnForm.selectedPurchaseId) {
      setNotification({ type: 'error', message: 'Please select a purchase record to return' });
      return;
    }

    if (!addReturnForm.returnQuantity || !addReturnForm.returnReason ||
      !addReturnForm.purchaseBillNo || !addReturnForm.branchName || !addReturnForm.productCode ||
      !addReturnForm.materialName || !addReturnForm.hsn || !addReturnForm.quantity ||
      !addReturnForm.price || !addReturnForm.category || !addReturnForm.subcategory ||
      !addReturnForm.gstPercent || !addReturnForm.supplierName || !addReturnForm.supplierAddress ||
      !addReturnForm.supplierGstin) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const returnQuantity = parseInt(addReturnForm.returnQuantity);
    const originalQuantity = parseInt(addReturnForm.quantity);
    if (returnQuantity > originalQuantity) {
      setNotification({ type: 'error', message: 'Return quantity cannot exceed original purchase quantity' });
      return;
    }

    setIsSaving(true);

    try {
      const returnRecord: PurchaseReturnRecord = {
        sourceRecordType: selectedPurchase!.recordType,
        sourceRecordId: selectedPurchase!.recordType === 'BULK'
          ? Number(selectedPurchase!.itemId)
          : Number(selectedPurchase!.id),
        returnDate: addReturnForm.returnDate,
        originalPurchaseBillNo: addReturnForm.purchaseBillNo,
        branchName: addReturnForm.branchName,
        productName: addReturnForm.materialName,
        productCode: addReturnForm.productCode,
        productDescription: selectedPurchase!.productDescription || addReturnForm.materialName,
        category: addReturnForm.category,
        subcategory: addReturnForm.subcategory,
        hsn: addReturnForm.hsn,
        returnQuantity: returnQuantity,
        originalQuantity: originalQuantity,
        purchasePrice: parseFloat(addReturnForm.price),
        inputGSTPercent: parseFloat(addReturnForm.gstPercent),
        inputGSTAmount: (parseFloat(addReturnForm.price) * returnQuantity * parseFloat(addReturnForm.gstPercent)) / 100,
        totalAmount: parseFloat(addReturnForm.price) * returnQuantity,
        returnReason: addReturnForm.returnReason,
        supplierName: addReturnForm.supplierName,
        supplierContact: '',
        supplierGstin: addReturnForm.supplierGstin,
        supplierAddress: addReturnForm.supplierAddress,
        remarks: addReturnForm.remarks
      };

      const result = await purchaseReturnService.createReturn(returnRecord);

      if (result.success) {
        // Reload data from backend
        await loadData();
        setShowAddReturnDialog(false);
        setNotification({ type: 'success', message: 'Purchase return recorded successfully!' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to save purchase return' });
      }
    } catch (error) {
      console.error('Error saving return:', error);
      setNotification({ type: 'error', message: 'Failed to save purchase return. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditReturn = (returnRecord: PurchaseReturnRecord) => {
    setEditingReturn(returnRecord);
    setSelectedPurchase(null);
    setAddReturnForm({
      returnDate: returnRecord.returnDate,
      selectedPurchaseId: '',
      purchaseBillNo: returnRecord.originalPurchaseBillNo,
      branchName: returnRecord.branchName,
      productCode: returnRecord.productCode,
      materialName: returnRecord.productName,
      hsn: returnRecord.hsn,
      quantity: returnRecord.originalQuantity?.toString() || '',
      price: returnRecord.purchasePrice.toString(),
      category: returnRecord.category,
      subcategory: returnRecord.subcategory,
      gstPercent: returnRecord.inputGSTPercent.toString(),
      supplierName: returnRecord.supplierName,
      supplierAddress: returnRecord.supplierAddress,
      supplierGstin: returnRecord.supplierGstin,
      returnQuantity: returnRecord.returnQuantity.toString(),
      returnReason: returnRecord.returnReason,
      remarks: returnRecord.remarks || ''
    });
    setShowAddReturnDialog(true);
  };

  const handleUpdateReturn = async () => {
    if (!editingReturn) return;

    if (!addReturnForm.returnQuantity || !addReturnForm.returnReason) {
      setNotification({ type: 'error', message: 'Please fill in return quantity and return reason' });
      return;
    }

    const returnQuantity = parseInt(addReturnForm.returnQuantity);
    const originalQuantity = parseInt(addReturnForm.quantity);
    if (returnQuantity <= 0) {
      setNotification({ type: 'error', message: 'Return quantity must be greater than 0' });
      return;
    }
    if (originalQuantity > 0 && returnQuantity > originalQuantity) {
      setNotification({ type: 'error', message: 'Return quantity cannot exceed original purchase quantity' });
      return;
    }

    setIsSaving(true);

    try {
      const updatedRecord: PurchaseReturnRecord = {
        ...editingReturn,
        returnDate: addReturnForm.returnDate,
        returnQuantity: returnQuantity,
        returnReason: addReturnForm.returnReason,
        remarks: addReturnForm.remarks,
        sourceRecordType: editingReturn.sourceRecordType,
        sourceRecordId: editingReturn.sourceRecordId,
        // Preserve original purchase info
        originalPurchaseBillNo: addReturnForm.purchaseBillNo,
        branchName: addReturnForm.branchName,
        productCode: addReturnForm.productCode,
        productName: addReturnForm.materialName,
        productDescription: editingReturn.productDescription,
        category: addReturnForm.category,
        subcategory: addReturnForm.subcategory,
        hsn: addReturnForm.hsn,
        originalQuantity: originalQuantity || 0,
        purchasePrice: parseFloat(addReturnForm.price),
        inputGSTPercent: parseFloat(addReturnForm.gstPercent),
        inputGSTAmount: (parseFloat(addReturnForm.price) * returnQuantity * parseFloat(addReturnForm.gstPercent)) / 100,
        totalAmount: parseFloat(addReturnForm.price) * returnQuantity,
        supplierName: addReturnForm.supplierName,
        supplierContact: '',
        supplierGstin: addReturnForm.supplierGstin,
        supplierAddress: addReturnForm.supplierAddress,
      };

      const result = await purchaseReturnService.updateReturn(editingReturn!.id!, updatedRecord);

      if (result.success) {
        await loadData();
        setShowAddReturnDialog(false);
        setEditingReturn(null);
        setAddReturnForm({
          returnDate: new Date().toISOString().slice(0, 10),
          selectedPurchaseId: '',
          purchaseBillNo: '',
          branchName: '',
          productCode: '',
          materialName: '',
          hsn: '',
          quantity: '',
          price: '',
          category: '',
          subcategory: '',
          gstPercent: '',
          supplierName: '',
          supplierAddress: '',
          supplierGstin: '',
          returnQuantity: '',
          returnReason: '',
          remarks: ''
        });
        setNotification({ type: 'success', message: 'Purchase return updated successfully!' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to update purchase return' });
      }
    } catch (error) {
      console.error('Error updating return:', error);
      setNotification({ type: 'error', message: 'Failed to update purchase return. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReturn = async (returnId: number) => {
    try {
      const result = await purchaseReturnService.deleteReturn(returnId);

      if (result.success) {
        // Reload data from backend
        await loadData();
        setShowDeleteConfirm(null);
        setNotification({ type: 'success', message: 'Purchase return deleted successfully!' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Failed to delete purchase return' });
      }
    } catch (error) {
      console.error('Error deleting return:', error);
      setNotification({ type: 'error', message: 'Failed to delete purchase return. Please try again.' });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Return Date', 'Original Bill No', 'Branch', 'Material Name', 'Product Code',
      'Category', 'Subcategory', 'HSN Code', 'Return Quantity', 'Original Quantity',
      'Price', 'Return Value', 'Return Reason', 'Supplier Name', 'Supplier Address',
      'Supplier GSTIN', 'Remarks'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredReturns.map(returnRecord => [
        returnRecord.returnDate,
        returnRecord.originalPurchaseBillNo,
        returnRecord.branchName,
        returnRecord.productName,
        returnRecord.productCode,
        returnRecord.category,
        returnRecord.subcategory,
        returnRecord.hsn,
        returnRecord.returnQuantity,
        returnRecord.originalQuantity,
        returnRecord.purchasePrice,
        returnRecord.totalAmount,
        returnRecord.returnReason,
        returnRecord.supplierName,
        returnRecord.supplierAddress,
        returnRecord.supplierGstin,
        returnRecord.remarks || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-returns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const isSourceLocked = !!selectedPurchase || !!editingReturn;

  // Pagination calculations
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReturns = filteredReturns.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Purchase Return History</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleAddReturn}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Purchase Return</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
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

      {/* Search and Filters - Condensed Single Line */}
      <div className="bg-white p-1 rounded-lg shadow-sm border mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, codes, bill no, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1 border border-gray-300 rounded-lg w-full text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent min-w-[150px]"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.code} value={branch.code}>{branch.name}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-red-600 p-1 transition-colors"
            title="Clear all filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white p-2 rounded-lg shadow-sm border mb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-600">Showing </span>
            <span className="font-semibold">{startIndex + 1}</span>
            <span className="text-gray-600"> to </span>
            <span className="font-semibold">
              {Math.min(endIndex, filteredReturns.length)}
            </span>
            <span className="text-gray-600"> of </span>
            <span className="font-semibold">{filteredReturns.length}</span>
            <span className="text-gray-600"> return records</span>
            {totalPages > 1 && (
              <span className="text-gray-500 ml-2">(Page {currentPage} of {totalPages})</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Total Return Value: <span className="font-semibold text-red-600">
              {formatCurrency(filteredReturns.reduce((sum, r) => sum + r.totalAmount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Return Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReturns.map((returnRecord) => (
                <Fragment key={returnRecord.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{returnRecord.originalPurchaseBillNo}</div>
                        <div className="text-gray-500">{formatDate(returnRecord.returnDate)}</div>
                        <div className="text-gray-500">{returnRecord.branchName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{returnRecord.productName}</div>
                        <div className="text-gray-500">{returnRecord.productCode}</div>
                        <div className="text-gray-500">{returnRecord.category} - {returnRecord.subcategory}</div>
                        <div className="text-gray-500">HSN: {returnRecord.hsn}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Qty: {returnRecord.returnQuantity}/{returnRecord.originalQuantity}</div>
                        <div className="text-gray-500">Reason: {returnRecord.returnReason}</div>
                        <div className="text-gray-500">Price: {formatCurrency(returnRecord.purchasePrice)}</div>
                        <div className="text-gray-500">Value: {formatCurrency(returnRecord.totalAmount)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{returnRecord.supplierName}</div>
                        <div className="text-gray-500">{returnRecord.supplierAddress}</div>
                        <div className="text-gray-500">GSTIN: {returnRecord.supplierGstin}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleRowExpansion(returnRecord.id!)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditReturn(returnRecord)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit Return"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(returnRecord.id!)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Return"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row Details */}
                  {expandedRows.has(returnRecord.id!) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Product Details</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Description:</span> {returnRecord.productDescription}</div>
                              <div><span className="font-medium">HSN Code:</span> {returnRecord.hsn}</div>
                              <div><span className="font-medium">Original Qty:</span> {returnRecord.originalQuantity}</div>
                              <div><span className="font-medium">Purchase Price:</span> {formatCurrency(returnRecord.purchasePrice)}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Return Information</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Return Reason:</span> {returnRecord.returnReason}</div>
                              <div><span className="font-medium">Remarks:</span> {returnRecord.remarks || 'None'}</div>
                              <div><span className="font-medium">Return Value:</span> {formatCurrency(returnRecord.totalAmount)}</div>
                              <div><span className="font-medium">GST Amount:</span> {formatCurrency(returnRecord.inputGSTAmount)}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Supplier Information</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Name:</span> {returnRecord.supplierName}</div>
                              <div><span className="font-medium">Address:</span> {returnRecord.supplierAddress}</div>
                              <div><span className="font-medium">GSTIN:</span> {returnRecord.supplierGstin}</div>
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
            <div className="text-gray-500 text-lg">No purchase return records found</div>
            <div className="text-gray-400 text-sm mt-2">Try adding a purchase return or adjusting your search criteria</div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredReturns.length > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Page Info */}
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
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
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
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
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${page === currentPage
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

      {/* Add/Edit Purchase Return Dialog */}
      {showAddReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{editingReturn ? 'Edit Purchase Return' : 'Add Purchase Return'}</h3>
              <button
                onClick={() => {
                  setShowAddReturnDialog(false);
                  setEditingReturn(null);
                  setSelectedPurchase(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); editingReturn ? handleUpdateReturn() : handleSaveReturn(); }} className="space-y-3">

              {/* Purchase Selection Section - only show for new returns */}
              {!editingReturn && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">Step 1</span>
                    Select Purchase Record
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-0.5">
                        Purchase Bill No
                      </label>
                      <select
                        value={addReturnForm.selectedPurchaseId}
                        onChange={(e) => handlePurchaseSelect(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">-- Select a purchase --</option>
                        {purchases.map((purchase) => (
                          <option key={purchase.id} value={purchase.id?.toString()}>
                            [{purchase.recordType === 'BULK' ? 'Bulk' : 'Single'}] {purchase.purchaseBillNo} - {purchase.materialName} ({purchase.productCode}) - Qty: {purchase.quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPurchase && (
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleClearPurchaseSelection}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedPurchase && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                      <div className="text-sm text-green-800 font-medium mb-1">Selected Purchase Details:</div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                        <span><strong>Bill No:</strong> {selectedPurchase.purchaseBillNo}</span>
                        <span><strong>Product:</strong> {selectedPurchase.materialName}</span>
                        <span><strong>Code:</strong> {selectedPurchase.productCode}</span>
                        <span><strong>Available Qty:</strong> {selectedPurchase.quantity}</span>
                        <span><strong>Source:</strong> {selectedPurchase.recordType === 'BULK' ? 'Bulk Purchase' : 'Purchase'}</span>
                        <span><strong>Price:</strong> ₹{selectedPurchase.purchasePrice}</span>
                        <span><strong>GST:</strong> {selectedPurchase.inputGSTPercent}%</span>
                        <span><strong>Supplier:</strong> {selectedPurchase.supplier?.name}</span>
                        <span><strong>Branch:</strong> {selectedPurchase.branch}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Return Date</label>
                  <input
                    type="date"
                    value={addReturnForm.returnDate}
                    onChange={(e) => setAddReturnForm({ ...addReturnForm, returnDate: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-0.5">
                    Return Quantity <span className="text-red-500">*</span>
                    {selectedPurchase && !editingReturn && (
                      <span className="text-gray-500 font-normal ml-1">(Max: {addReturnForm.quantity || selectedPurchase.quantity})</span>
                    )}
                    {editingReturn && (
                      <span className="text-gray-500 font-normal ml-1">(Current: {addReturnForm.returnQuantity})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={addReturnForm.returnQuantity}
                    onChange={(e) => setAddReturnForm({ ...addReturnForm, returnQuantity: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                    max={addReturnForm.quantity || undefined}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Return Reason</label>
                  <select
                    value={addReturnForm.returnReason}
                    onChange={(e) => setAddReturnForm({ ...addReturnForm, returnReason: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select return reason</option>
                    {returnReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase Details - Auto-populated from selected purchase */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  {isSourceLocked ? (
                    <>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">Step 2</span>
                      Purchase Details (Linked to Source Record)
                    </>
                  ) : (
                    <>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mr-2">Step 2</span>
                      Purchase Details (Select a purchase above to auto-fill)
                    </>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Purchase Bill No</label>
                    <input
                      type="text"
                      value={addReturnForm.purchaseBillNo}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, purchaseBillNo: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Select purchase to auto-fill"
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Branch Name</label>
                    <input
                      type="text"
                      value={addReturnForm.branchName}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, branchName: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Product Code</label>
                    <input
                      type="text"
                      value={addReturnForm.productCode}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, productCode: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Material Name</label>
                    <input
                      type="text"
                      value={addReturnForm.materialName}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, materialName: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">HSN Code</label>
                    <input
                      type="text"
                      value={addReturnForm.hsn}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, hsn: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Original Quantity</label>
                    <input
                      type="number"
                      value={addReturnForm.quantity}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, quantity: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Price</label>
                    <input
                      type="number"
                      value={addReturnForm.price}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, price: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      step="0.01"
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Category</label>
                    <select
                      value={addReturnForm.category || ''}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, category: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      disabled={isSourceLocked}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Subcategory</label>
                    <input
                      type="text"
                      value={addReturnForm.subcategory || ''}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, subcategory: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="e.g., General, Premium, etc."
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">GST Percentage</label>
                    <input
                      type="number"
                      value={addReturnForm.gstPercent || ''}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, gstPercent: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 18"
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Details - Auto-populated from selected purchase */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isSourceLocked ? 'Supplier Details (Linked to Source Record)' : 'Supplier Details'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Supplier Name</label>
                    <input
                      type="text"
                      value={addReturnForm.supplierName}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, supplierName: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Supplier GSTIN</label>
                    <input
                      type="text"
                      value={addReturnForm.supplierGstin}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, supplierGstin: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Supplier Address</label>
                    <textarea
                      value={addReturnForm.supplierAddress}
                      onChange={(e) => setAddReturnForm({ ...addReturnForm, supplierAddress: e.target.value })}
                      className={`w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isSourceLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={2}
                      required
                      readOnly={isSourceLocked}
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-0.5">Remarks</label>
                <textarea
                  value={addReturnForm.remarks}
                  onChange={(e) => setAddReturnForm({ ...addReturnForm, remarks: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details about the return..."
                />
              </div>

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
                  {isSaving ? 'Saving...' : editingReturn ? 'Update Return' : 'Save Return'}
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
              Are you sure you want to delete this purchase return? This will restore the item to purchase history.
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

export default PurchaseReturnPage;
