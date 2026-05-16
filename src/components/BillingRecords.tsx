import React, { useState, useEffect } from 'react';
import { Eye, Download, Calendar, Search, FileText, Edit, Trash2, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import billingService, { BillingRecordDB } from '../services/billingService';
import authService from '../services/authService';
import { API_BASE_URL } from '../config/apiConfig';


const getHeaders = (): HeadersInit => {
  return authService.getAuthHeaders() as HeadersInit;
};

// Interface for billing records from MySQL database
interface BillingRecord {
  id: number;
  billNumber: string;
  billDate: string;
  branchCode: string;
  branchName: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  lensPowerRight: string;
  lensPowerLeft: string;
  pd: string;
  paymentMethod: string;
  transactionRef: string;
  additionalNotes: string;
  subtotal: number;
  totalGst: number;
  amount: number;
  discount: number;
  advancePaid: number;
  finalPayable: number;
  paymentStatus: string;
  warrantyDetails: string;
  returnPolicy: string;
  prescriptionDeliveryDate: string;
  authorizedSignatory: string;
  products: Array<{
    id: number;
    productName: string;
    category: string;
    description: string;
    hsnCode: string;
    quantity: number;
    pricePerUnit: number;
    gstPercentage: number;
    gstAmount: number;
    total: number;
  }>;
  branch?: {
    code: string;
    name: string;
    address: string;
  };
}

const BillingRecords: React.FC = () => {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingBillingRecord, setEditingBillingRecord] = useState<BillingRecordDB | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadRecords(selectedYear);
    }
  }, [selectedYear]);

  // Auto-refresh records every 10 minutes to catch new saves in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedYear) {
        loadRecords(selectedYear);
      }
    }, 600000); // Refresh every 10 minutes (600,000 milliseconds)

    return () => clearInterval(interval);
  }, [selectedYear]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadAvailableYears = async () => {
    try {
      const billingRecords = await billingService.loadBillingRecordsFromDatabase();
      const years = new Set<number>();

      billingRecords.forEach(record => {
        const billDate = new Date(record.billDate);
        years.add(billDate.getFullYear());
      });

      const sortedYears = Array.from(years).sort((a, b) => b - a);
      setAvailableYears(sortedYears);

      if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
        setSelectedYear(sortedYears[0]);
      }
    } catch (error) {
      console.error('Error loading available years:', error);
    }
  };

  const loadRecords = async (year: number) => {
    setLoading(true);
    try {
      const billingRecords = await billingService.loadBillingRecordsFromDatabase(year);
      const yearRecords: BillingRecord[] = [];

      billingRecords.forEach(billingData => {
        const billDate = new Date(billingData.billDate);
        if (billDate.getFullYear() === year) {
          const record: BillingRecord = {
            id: billingData.id,
            billNumber: billingData.billNumber,
            billDate: billingData.billDate,
            branchCode: billingData.branchCode,
            branchName: billingData.branchName,
            customerName: billingData.customerName,
            customerContact: billingData.customerContact,
            customerEmail: billingData.customerEmail || '',
            customerAddress: billingData.customerAddress || '',
            lensPowerRight: billingData.lensPowerRight || '',
            lensPowerLeft: billingData.lensPowerLeft || '',
            pd: billingData.pd || '',
            paymentMethod: billingData.paymentMethod || '',
            transactionRef: billingData.transactionRef || '',
            additionalNotes: billingData.additionalNotes || '',
            subtotal: billingData.subtotal,
            totalGst: billingData.totalGst,
            amount: billingData.amount,
            discount: billingData.discount,
            advancePaid: billingData.advancePaid || 0,
            finalPayable: billingData.finalPayable,
            paymentStatus: billingData.paymentStatus,
            warrantyDetails: billingData.warrantyDetails || '',
            returnPolicy: billingData.returnPolicy || '',
            prescriptionDeliveryDate: billingData.prescriptionDeliveryDate || '',
            authorizedSignatory: billingData.authorizedSignatory || '',
            products: billingData.products || [],
            branch: {
              code: billingData.branchCode,
              name: billingData.branchName,
              address: ''
            }
          };
          yearRecords.push(record);
        }
      });

      // Sort records by date (newest first)
      yearRecords.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      setRecords(yearRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => r.products?.forEach(p => p.category && set.add(p.category)));
    return Array.from(set).sort();
  }, [records]);

  const productOptions = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => r.products?.forEach(p => p.productName && set.add(p.productName)));
    return Array.from(set).sort();
  }, [records]);

  const paymentMethodOptions = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => r.paymentMethod && set.add(r.paymentMethod));
    return Array.from(set).sort();
  }, [records]);

  const monthOptions = React.useMemo(() => {
    const months = [
      { value: 'all', label: 'All Months' },
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];
    return months;
  }, []);

  const branchOptions = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => r.branch?.name && set.add(r.branch.name));
    const branches = Array.from(set).sort();
    return [{ value: 'all', label: 'All Branches' }, ...branches.map(b => ({ value: b, label: b }))];
  }, [records]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerContact.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || record.paymentStatus === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || record.products?.some(p => p.category === filterDepartment);
    const matchesProduct = filterProduct === 'all' || record.products?.some(p => p.productName === filterProduct);
    const matchesPaymentMethod = filterPaymentMethod === 'all' || record.paymentMethod === filterPaymentMethod;
    
    // Month filter
    const billDate = new Date(record.billDate);
    const billMonth = billDate.getMonth() + 1;
    const billMonthStr = billMonth.toString().padStart(2, '0');
    const matchesMonth = filterMonth === 'all' || billMonthStr === filterMonth;
    
    // Branch filter
    const matchesBranch = filterBranch === 'all' || record.branch?.name === filterBranch;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesProduct && matchesPaymentMethod && matchesMonth && matchesBranch;
  });

  // Reset current page when filters/search/year/records change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDepartment, filterProduct, filterPaymentMethod, filterMonth, filterBranch, selectedYear, records]);

  // Reset current page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedRecords = filteredRecords.slice(startIndex, endIndex);

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

  const exportYearlyReport = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export');
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Create summary data
    const summaryData = [
      ['Nayan Eye Care - Billing Records Summary'],
      [`Year: ${selectedYear}`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [''],
      ['Summary Statistics'],
      ['Total Records', filteredRecords.length],
              ['Total Final Amount', `₹${filteredRecords.reduce((sum, record) => sum + record.amount, 0).toFixed(2)}`],
      ['Paid Records', filteredRecords.filter(r => r.paymentStatus === 'Paid').length],
      ['Pending Records', filteredRecords.filter(r => r.paymentStatus === 'Pending').length],
      [''],
      ['Detailed Records']
    ];

         // Add column headers
     summaryData.push([
       'Date',
       'Bill Number',
       'Branch',
       'Customer Name',
       'Contact',
       'Products Summary',
       'Eye Power (Right)',
       'Eye Power (Left)',
       'PD',
       'Payment Method',
       'Transaction Ref',
       'Subtotal',
       'GST Amount',
       'Discount',
        'Advance Paid',
       'Final Amount (After Discount)',
       'Final Payable',
       'Status',
       'Notes'
     ]);

     // Add record data
     filteredRecords.forEach(record => {
       summaryData.push([
         record.billDate,
         record.billNumber,
         record.branch?.name || 'N/A',
         record.customerName,
         record.customerContact,
         getProductSummary(record.products),
         record.lensPowerRight || 'N/A',
         record.lensPowerLeft || 'N/A',
         record.pd || 'N/A',
         record.paymentMethod || 'N/A',
         record.transactionRef || 'N/A',
         record.subtotal,
         record.totalGst,
         record.discount,
          record.advancePaid,
         record.amount,
         record.finalPayable,
         record.paymentStatus,
         record.additionalNotes || 'N/A'
       ]);
     });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, `Billing Records ${selectedYear}`);
    XLSX.writeFile(wb, `billing_summary_${selectedYear}.xlsx`);
  };

  // Function to refresh records (can be called after saving new data)
  const refreshRecords = async () => {
    await loadAvailableYears();
    if (selectedYear) {
      await loadRecords(selectedYear);
    }
  };

  // Function to toggle row expansion
  const toggleRowExpansion = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Function to get product summary
  const getProductSummary = (products: BillingRecord['products']) => {
    if (!products || products.length === 0) return 'No products';
    
    const categories = products.map(p => p.category).filter(Boolean);
    const uniqueCategories = [...new Set(categories)];
    
    if (uniqueCategories.length === 1) {
      return `${uniqueCategories[0]} (${products.length} item${products.length > 1 ? 's' : ''})`;
    }
    
    return `${uniqueCategories.join(', ')} (${products.length} items)`;
  };

  // Function to download invoice
  const downloadInvoice = (record: BillingRecord) => {
    // Create a simple invoice download from the record data
    const invoiceData = {
      billNumber: record.billNumber,
      billDate: record.billDate,
      customerName: record.customerName,
      customerContact: record.customerContact,
      customerEmail: record.customerEmail,
      customerAddress: record.customerAddress,
      lensPowerRight: record.lensPowerRight,
      lensPowerLeft: record.lensPowerLeft,
      pd: record.pd,
      paymentMethod: record.paymentMethod,
      transactionRef: record.transactionRef,
      additionalNotes: record.additionalNotes,
      subtotal: record.subtotal,
      totalGst: record.totalGst,
      amount: record.amount,
      discount: record.discount,
      advancePaid: record.advancePaid,
      finalPayable: record.finalPayable,
      paymentStatus: record.paymentStatus,
      warrantyDetails: record.warrantyDetails,
      returnPolicy: record.returnPolicy,
      prescriptionDeliveryDate: record.prescriptionDeliveryDate,
      authorizedSignatory: record.authorizedSignatory,
      branch: record.branch
    };

    // Convert to JSON and download
    const jsonData = JSON.stringify(invoiceData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${record.billNumber}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Function to handle payment status update
  const handlePaymentUpdate = async (billNumber: string) => {
    if (!paymentDate) {
      alert('Please enter the payment date');
      return;
    }

    try {
      // Update the payment status in MySQL via backend API
      const response = await fetch(`${API_BASE_URL}/billing-records/bill-number/${billNumber}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Record not found');
      }

      const billingRecord = await response.json();
      billingRecord.paymentStatus = 'Paid';
      billingRecord.paymentDate = paymentDate;

      const updateResponse = await fetch(`${API_BASE_URL}/billing-records/${billingRecord.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(billingRecord),
      });

      if (updateResponse.ok) {
        alert('Payment status updated successfully!');
        // Refresh the records
        await refreshRecords();
        // Reset editing state
        setEditingRecord(null);
        setPaymentDate('');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  // Function to handle record deletion
  const handleDeleteRecord = async (billNumber: string) => {
    try {
      // Get the record first to get its ID
      const response = await fetch(`${API_BASE_URL}/billing-records/bill-number/${billNumber}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error('Record not found');
      }

      const billingRecord = await response.json();

      // Delete from MySQL via backend API
      const deleteResponse = await fetch(`${API_BASE_URL}/billing-records/${billingRecord.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (deleteResponse.ok) {
        alert('Record deleted successfully!');
        // Refresh the records
        await refreshRecords();
        // Reset delete confirmation state
        setShowDeleteConfirm(null);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record. Please try again.');
    }
  };

  // Function to start editing payment status
  const startEditingPayment = (billNumber: string) => {
    setEditingRecord(billNumber);
    setPaymentDate(new Date().toISOString().split('T')[0]); // Set today's date as default
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingRecord(null);
    setPaymentDate('');
  };

  // Function to start editing billing record
  const startEditingBillingRecord = async (billNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing-records/bill-number/${billNumber}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const billingRecord = await response.json();
        setEditingBillingRecord(billingRecord);
        setShowEditModal(true);
      } else {
        alert('Record not found');
      }
    } catch (error) {
      console.error('Error loading record for editing:', error);
      alert('Failed to load record for editing');
    }
  };

  // Function to handle billing record update
  const handleBillingRecordUpdate = async () => {
    if (!editingBillingRecord) return;

    setEditLoading(true);
    try {
      // Save the updated record to MySQL via backend API
      const response = await fetch(`${API_BASE_URL}/billing-records/${editingBillingRecord.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editingBillingRecord),
      });

      if (response.ok) {
        alert('Billing record updated successfully!');
        setShowEditModal(false);
        setEditingBillingRecord(null);
        // Refresh the records
        await refreshRecords();
      } else {
        throw new Error('Failed to update record');
      }
    } catch (error) {
      console.error('Error updating billing record:', error);
      alert('Failed to update billing record. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Function to cancel editing billing record
  const cancelEditingBillingRecord = () => {
    setShowEditModal(false);
    setEditingBillingRecord(null);
  };

  // Function to handle field changes in edit form
  // Function to add new product to edit form
  const addNewProduct = () => {
    if (!editingBillingRecord) return;

    const newProduct = {
      id: Date.now(),
      productName: '',
      category: '',
      description: '',
      hsnCode: '',
      quantity: 1,
      pricePerUnit: 0,
      gstPercentage: 18,
      gstAmount: 0,
      total: 0
    };

    setEditingBillingRecord(prev => prev ? {
      ...prev,
      products: [...prev!.products, newProduct]
    } : null);
  };

  // Function to remove product from edit form
  const removeProduct = (index: number) => {
    if (!editingBillingRecord) return;

    setEditingBillingRecord(prev => ({
      ...prev!,
      products: prev!.products.filter((_, i) => i !== index)
    }));
  };

  // Function to calculate totals when editing
  const calculateEditTotals = () => {
    setEditingBillingRecord(prev => {
      if (!prev) return prev;

      const updatedProducts = prev.products.map(product => {
        const qty = product.quantity || 0;
        const price = product.pricePerUnit || 0;
        const gstPct = product.gstPercentage || 0;
        const productTotal = qty * price;
        const productGstAmount = (productTotal * gstPct) / 100;
        return {
          ...product,
          total: productTotal,
          gstAmount: productGstAmount,
        };
      });

      const subtotal = updatedProducts.reduce((sum, product) => sum + (product.total || 0), 0);
      const totalGst = updatedProducts.reduce((sum, product) => sum + (product.gstAmount || 0), 0);
      const amount = subtotal + totalGst - (prev.discount || 0);
      const finalPayable = amount - (prev.advancePaid || 0);

      const productsChanged = updatedProducts.some((product, index) => {
        const current = prev.products[index];
        return !current ||
          current.total !== product.total ||
          current.gstAmount !== product.gstAmount;
      });

      const summaryChanged =
        prev.subtotal !== subtotal ||
        prev.totalGst !== totalGst ||
        prev.amount !== amount ||
        prev.finalPayable !== finalPayable;

      if (!productsChanged && !summaryChanged) {
        return prev;
      }

      return {
        ...prev,
        products: updatedProducts,
        subtotal,
        totalGst,
        amount,
        finalPayable,
      };
    });
  };

  // Update totals when products change
  useEffect(() => {
    if (editingBillingRecord) {
      calculateEditTotals();
    }
  }, [editingBillingRecord?.products, editingBillingRecord?.discount, editingBillingRecord?.advancePaid]);

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Sales Records</h1>
                <p className="text-emerald-100 text-sm">View and manage all sales records</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-100">Total Records: {filteredRecords.length}</p>
              <p className="text-emerald-100">Year: {selectedYear}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-2 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Branch</label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {branchOptions.map(branch => (
                  <option key={branch.value} value={branch.value}>{branch.label}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, bill number, or contact"
                  className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Payment Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Product</label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                {productOptions.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">Payment Method</label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                {paymentMethodOptions.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Action Buttons - Moved to right side */}
          <div className="flex justify-end mt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshRecords}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                title="Refresh records"
              >
                <Calendar className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportYearlyReport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics - Moved above the table */}
        {filteredRecords.length > 0 && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-800">{filteredRecords.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Final Amount</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{filteredRecords.reduce((sum, record) => sum + record.amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid Records</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRecords.filter(r => r.paymentStatus === 'Paid').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Records</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredRecords.filter(r => r.paymentStatus === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No billing records found for {selectedYear}</p>
              <p className="text-gray-500 text-sm">Records will appear here once you save billing data</p>
            </div>
          ) : (
                         <table className="w-full border-collapse border border-gray-300">
               <thead>
                 <tr className="bg-gray-50">
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">S.No.</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Bill No.</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Branch</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Customer</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Contact</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Products</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Prescription</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Payment</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Final Amount (₹)</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                   <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                 </tr>
               </thead>
                             <tbody>
                 {displayedRecords.map((record, index) => (
                   <React.Fragment key={index}>
                     <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(index)}>
                       <td className="border border-gray-300 px-3 py-2 text-center font-medium">{startIndex + index + 1}</td>
                       <td className="border border-gray-300 px-3 py-2">{record.billDate}</td>
                       <td className="border border-gray-300 px-3 py-2 font-medium">{record.billNumber}</td>
                       <td className="border border-gray-300 px-3 py-2">
                         <span className="text-sm font-medium text-blue-600">
                           {record.branch?.name || 'N/A'}
                         </span>
                       </td>
                       <td className="border border-gray-300 px-3 py-2">{record.customerName}</td>
                       <td className="border border-gray-300 px-3 py-2">{record.customerContact}</td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="text-sm">
                           <div className="font-medium text-gray-800">
                             {getProductSummary(record.products)}
                           </div>
                           <div className="text-xs text-gray-500">
                             Click to view details
                           </div>
                         </div>
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="text-sm">
                           <div>R: {record.lensPowerRight || 'N/A'}</div>
                           <div>L: {record.lensPowerLeft || 'N/A'}</div>
                           <div className="text-xs text-gray-500">PD: {record.pd || 'N/A'}</div>
                         </div>
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="text-sm">
                           <div className="font-medium">{record.paymentMethod || 'N/A'}</div>
                           <div className="text-xs text-gray-500">
                             {record.transactionRef ? `Ref: ${record.transactionRef}` : ''}
                           </div>
                         </div>
                       </td>
                       <td className="border border-gray-300 px-3 py-2 font-medium">₹{record.amount.toFixed(2)}</td>
                       <td className="border border-gray-300 px-3 py-2">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                           record.paymentStatus === 'Paid' 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {record.paymentStatus}
                         </span>
                       </td>
                       <td className="border border-gray-300 px-3 py-2">
                         <div className="flex space-x-1">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               startEditingBillingRecord(record.billNumber);
                             }}
                             className="text-blue-600 hover:text-blue-800 p-1"
                             title="Edit Record"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               downloadInvoice(record);
                             }}
                             className="text-emerald-600 hover:text-emerald-800 p-1"
                             title="Download Invoice"
                           >
                             <Download className="h-4 w-4" />
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               toggleRowExpansion(index);
                             }}
                             className="text-blue-600 hover:text-blue-800 p-1"
                             title={expandedRows.has(index) ? "Collapse Details" : "Expand Details"}
                           >
                             <Eye className="h-4 w-4" />
                           </button>
                           {record.paymentStatus === 'Pending' && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 startEditingPayment(record.billNumber);
                               }}
                               className="text-orange-600 hover:text-orange-800 p-1"
                               title="Mark as Paid"
                             >
                               <Edit className="h-4 w-4" />
                             </button>
                           )}
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setShowDeleteConfirm(record.billNumber);
                             }}
                             className="text-red-600 hover:text-red-800 p-1"
                             title="Delete Record"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                       </td>
                     </tr>
                     
                     {/* Expanded Row with Detailed Information */}
                     {expandedRows.has(index) && (
                       <tr className="bg-gray-50">
                         <td colSpan={12} className="border border-gray-300 px-4 py-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Product Details */}
                             <div>
                               <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                 <span className="mr-2">📦</span>
                                 Product Details
                               </h4>
                               {record.products && record.products.length > 0 ? (
                                 <div className="space-y-3">
                                   {record.products.map((product, pIndex) => (
                                     <div key={pIndex} className="bg-white p-3 rounded-lg border">
                                       <div className="flex justify-between items-start mb-2">
                                         <div className="font-medium text-gray-800">{product.productName}</div>
                                         <span className="text-sm font-medium text-emerald-600">₹{product.total.toFixed(2)}</span>
                                       </div>
                                       <div className="text-sm text-gray-600 space-y-1">
                                         <div><span className="font-medium">Category:</span> {product.category}</div>
                                         <div><span className="font-medium">Description:</span> {product.description}</div>
                                         <div><span className="font-medium">HSN Code:</span> {product.hsnCode}</div>
                                         <div className="flex justify-between">
                                           <span><span className="font-medium">Qty:</span> {product.quantity}</span>
                                           <span><span className="font-medium">Price:</span> ₹{product.pricePerUnit.toFixed(2)}</span>
                                           <span><span className="font-medium">GST:</span> {product.gstPercentage}%</span>
                                         </div>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-gray-500">No products listed</p>
                               )}
                             </div>

                             {/* Additional Information */}
                             <div>
                               <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                 <span className="mr-2">📋</span>
                                 Additional Information
                               </h4>
                               <div className="space-y-3">
                                 <div className="bg-white p-3 rounded-lg border">
                                   <h5 className="font-medium text-gray-800 mb-2">Prescription Details</h5>
                                   <div className="text-sm text-gray-600 space-y-1">
                                     <div><span className="font-medium">Right Eye:</span> {record.lensPowerRight || 'N/A'}</div>
                                     <div><span className="font-medium">Left Eye:</span> {record.lensPowerLeft || 'N/A'}</div>
                                     <div><span className="font-medium">PD:</span> {record.pd || 'N/A'}</div>
                                     <div><span className="font-medium">Notes:</span> {record.additionalNotes || 'N/A'}</div>
                                   </div>
                                 </div>

                                 <div className="bg-white p-3 rounded-lg border">
                                   <h5 className="font-medium text-gray-800 mb-2">Billing Summary</h5>
                                   <div className="text-xs text-gray-500 mb-2 italic">
                                     Final Amount = Subtotal + GST Amount - Discount
                                   </div>
                                   <div className="text-sm text-gray-600 space-y-1">
                                     <div className="flex justify-between">
                                       <span>Subtotal:</span>
                                       <span>₹{record.subtotal.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span>GST Amount:</span>
                                       <span>₹{record.totalGst.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span>Discount:</span>
                                       <span>₹{record.discount.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between font-medium text-gray-800">
                                       <span>Final Amount:</span>
                                       <span>₹{record.amount.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span>Advance Paid:</span>
                                       <span>₹{record.advancePaid.toFixed(2)}</span>
                                     </div>
                                     <div className="flex justify-between font-medium text-emerald-600">
                                       <span>Final Payable:</span>
                                       <span>₹{record.finalPayable.toFixed(2)}</span>
                                     </div>
                                     <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                       <span className="font-medium">Verification:</span> Final Amount ({record.amount.toFixed(2)}) - Advance Paid ({record.advancePaid.toFixed(2)}) = Final Payable ({record.finalPayable.toFixed(2)})
                                     </div>
                                   </div>
                                 </div>

                                 <div className="bg-white p-3 rounded-lg border">
                                   <h5 className="font-medium text-gray-800 mb-2">Warranty & Delivery</h5>
                                   <div className="text-sm text-gray-600 space-y-1">
                                     <div><span className="font-medium">Warranty:</span> {record.warrantyDetails || 'N/A'}</div>
                                     <div><span className="font-medium">Return Policy:</span> {record.returnPolicy || 'N/A'}</div>
                                     <div><span className="font-medium">Delivery Date:</span> {record.prescriptionDeliveryDate || 'N/A'}</div>
                                     <div><span className="font-medium">Signatory:</span> {record.authorizedSignatory || 'N/A'}</div>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </td>
                       </tr>
                     )}
                   </React.Fragment>
                 ))}
               </tbody>
            </table>
          )}
        </div>

        {/* Summary - Removed duplicate summary section */}
        {filteredRecords.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            {/* Pagination Controls */}
            {filteredRecords.length > 0 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 mt-6">
                <div className="flex items-center justify-between">
                  {/* Page Info */}
                  <div className="text-sm text-gray-700">
                    Showing records <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredRecords.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredRecords.length}</span> results
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
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                              ? 'bg-emerald-600 text-white'
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
        )}
      </div>

      {/* Payment Status Update Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Payment Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mark bill <span className="font-medium">{editingRecord}</span> as paid
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handlePaymentUpdate(editingRecord)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Update</span>
              </button>
              <button
                onClick={cancelEditing}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete bill <span className="font-medium">{showDeleteConfirm}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Billing Record Modal */}
      {showEditModal && editingBillingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-gray-800">Edit Billing Record</h3>
                <button
                  onClick={cancelEditingBillingRecord}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Bill Number: <span className="font-medium">{editingBillingRecord.billNumber}</span>
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Invoice Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                      <input
                        type="date"
                        value={editingBillingRecord.billDate}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, billDate: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={editingBillingRecord.customerName}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                      <input
                        type="text"
                        value={editingBillingRecord.customerContact}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, customerContact: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingBillingRecord.customerEmail || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, customerEmail: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={editingBillingRecord.customerAddress || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, customerAddress: e.target.value } : null)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Prescription Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Right Eye Power</label>
                      <input
                        type="text"
                        value={editingBillingRecord.lensPowerRight || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, lensPowerRight: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Left Eye Power</label>
                      <input
                        type="text"
                        value={editingBillingRecord.lensPowerLeft || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, lensPowerLeft: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PD</label>
                      <input
                        type="text"
                        value={editingBillingRecord.pd || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, pd: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={editingBillingRecord.additionalNotes || ''}
                      onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, additionalNotes: e.target.value } : null)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Products</h4>
                  <button
                    onClick={addNewProduct}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    + Add Product
                  </button>
                </div>
                <div className="space-y-4">
                  {editingBillingRecord.products.map((product, index) => (
                    <div key={product.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium text-gray-800">Product {index + 1}</h5>
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={product.productName}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], productName: e.target.value };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={product.category}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], category: e.target.value };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                          <input
                            type="text"
                            value={product.hsnCode}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], hsnCode: e.target.value };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], quantity: parseInt(e.target.value) || 0 };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit</label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.pricePerUnit}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], pricePerUnit: parseFloat(e.target.value) || 0 };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                          <input
                            type="number"
                            step="0.01"
                            value={product.gstPercentage}
                            onChange={(e) => {
                              const newProducts = [...(editingBillingRecord.products || [])];
                              newProducts[index] = { ...newProducts[index], gstPercentage: parseFloat(e.target.value) || 0 };
                              setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm">
                        <div className="bg-white px-3 py-1.5 rounded border">
                          <span className="text-gray-500">GST Amount: </span>
                          <span className="font-medium">₹{(product.gstAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded border">
                          <span className="text-gray-500">Line Total: </span>
                          <span className="font-medium">₹{(product.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={product.description || ''}
                          onChange={(e) => {
                            const newProducts = [...(editingBillingRecord.products || [])];
                            newProducts[index] = { ...newProducts[index], description: e.target.value };
                            setEditingBillingRecord(prev => prev ? { ...prev, products: newProducts } : null);
                          }}
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Billing Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingBillingRecord.discount || 0}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, discount: parseFloat(e.target.value) || 0 } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Paid</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingBillingRecord.advancePaid || 0}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, advancePaid: parseFloat(e.target.value) || 0 } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-3">Calculated Totals</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{(editingBillingRecord.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Amount:</span>
                        <span className="font-medium">₹{(editingBillingRecord.totalGst || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-medium">₹{(editingBillingRecord.discount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-800 border-t pt-2">
                        <span>Final Amount:</span>
                        <span>₹{(editingBillingRecord.amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Paid:</span>
                        <span className="font-medium">₹{(editingBillingRecord.advancePaid || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-emerald-600 border-t pt-2">
                        <span>Final Payable:</span>
                        <span>₹{(editingBillingRecord.finalPayable || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={editingBillingRecord.paymentMethod || ''}
                      onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, paymentMethod: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                    <input
                      type="text"
                      value={editingBillingRecord.transactionRef || ''}
                      onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, transactionRef: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                    <select
                      value={editingBillingRecord.paymentStatus || 'Pending'}
                      onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, paymentStatus: e.target.value } : null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Details</label>
                      <textarea
                        value={editingBillingRecord.warrantyDetails || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, warrantyDetails: e.target.value } : null)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
                      <textarea
                        value={editingBillingRecord.returnPolicy || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, returnPolicy: e.target.value } : null)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Delivery Date</label>
                      <input
                        type="date"
                        value={editingBillingRecord.prescriptionDeliveryDate || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, prescriptionDeliveryDate: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Signatory</label>
                      <input
                        type="text"
                        value={editingBillingRecord.authorizedSignatory || ''}
                        onChange={(e) => setEditingBillingRecord(prev => prev ? { ...prev, authorizedSignatory: e.target.value } : null)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEditingBillingRecord}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBillingRecordUpdate}
                  disabled={editLoading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingRecords;
