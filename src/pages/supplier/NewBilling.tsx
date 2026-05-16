import React, { useState, useEffect } from 'react';
import { Eye, Printer, Plus, Trash2, Save, ArrowLeft, User, MapPin, CreditCard, FileText, Shield, RefreshCw, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import purchaseService, { PurchaseData } from '../../services/purchaseService';
import billingService, { BillingData } from '../../services/billingService';
import branchService, { Branch } from '../../services/branchService';
import InvoicePreviewModal from '../../components/InvoicePreviewModal';

interface ProductRow {
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
  isValid: boolean;
  validationMessage: string;
}

interface BillingForm {
  billNumber: string;
  selectedBranch: string;
  billDate: string;
  paymentDueDate: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
  lensPowerRight: string;
  lensPowerLeft: string;
  pd: string;
  sphRight: string;
  cylRight: string;
  axisRight: string;
  pdRight: string;
  sphLeft: string;
  cylLeft: string;
  axisLeft: string;
  pdLeft: string;
  additionalNotes: string;
  paymentMethod: string;
  transactionRef: string;
  paymentStatus: string;
  warrantyDetails: string;
  returnPolicy: string;
  prescriptionDeliveryDate: string;
  authorizedSignatory: string;
  discount: number;
  advancePaid: number;
}

const NewBillingPage: React.FC = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState<BillingForm>({
    billNumber: '',
    selectedBranch: '',
    billDate: new Date().toISOString().split('T')[0],
    paymentDueDate: '',
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerAddress: '',
    lensPowerRight: '',
    lensPowerLeft: '',
    pd: '',
    sphRight: '',
    cylRight: '',
    axisRight: '',
    pdRight: '',
    sphLeft: '',
    cylLeft: '',
    axisLeft: '',
    pdLeft: '',
    additionalNotes: '',
    paymentMethod: '',
    transactionRef: '',
    paymentStatus: 'Pending',
    warrantyDetails: '',
    returnPolicy: '',
    prescriptionDeliveryDate: '',
    authorizedSignatory: '',
    discount: 0,
    advancePaid: 0,
  });

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isLoadingPurchaseData, setIsLoadingPurchaseData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewBillingData, setPreviewBillingData] = useState<BillingData | null>(null);

  const categories = ['Spectacles', 'Sunglasses', 'Frame', 'Lens', 'Contact Lens', 'Solution', 'Other', 'Non-Chargeable'];
  const gstPercentages = [0, 5, 12, 18, 28];
  const paymentMethods = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'];
  const paymentStatuses = ['Paid', 'Pending'];
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const buildEmptyForm = (selectedBranch: string, billNumber: string): BillingForm => ({
    billNumber,
    selectedBranch,
    billDate: getTodayDate(),
    paymentDueDate: '',
    customerName: '',
    customerContact: '',
    customerEmail: '',
    customerAddress: '',
    lensPowerRight: '',
    lensPowerLeft: '',
    pd: '',
    sphRight: '',
    cylRight: '',
    axisRight: '',
    pdRight: '',
    sphLeft: '',
    cylLeft: '',
    axisLeft: '',
    pdLeft: '',
    additionalNotes: '',
    paymentMethod: '',
    transactionRef: '',
    paymentStatus: 'Pending',
    warrantyDetails: '',
    returnPolicy: '',
    prescriptionDeliveryDate: '',
    authorizedSignatory: '',
    discount: 0,
    advancePaid: 0,
  });

  // Initialize: load purchase data and set default branch
  useEffect(() => {
    loadPurchaseData();
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const fetchedBranches = await branchService.getAllBranches();
      setBranches(fetchedBranches);
      if (fetchedBranches.length > 0) {
        handleBranchChange(fetchedBranches[0].code);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  // Auto-refresh invoice number when date or branch changes
  useEffect(() => {
    if (formData.selectedBranch && formData.billDate) {
      refreshInvoiceNumberForCurrentBranch();
    }
  }, [formData.billDate, formData.selectedBranch]);

  const showNotification = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadPurchaseData = async () => {
    setIsLoadingPurchaseData(true);
    try {
      await purchaseService.getPurchaseRecords();
    } catch (error) {
      console.error('Error loading purchase data:', error);
    } finally {
      setIsLoadingPurchaseData(false);
    }
  };

  const getBranchName = (code: string) => branches.find(b => b.code === code)?.name || '';

  const refreshInvoiceNumberForCurrentBranch = async () => {
    try {
      const branchName = getBranchName(formData.selectedBranch);
      const newInvoiceNumber = await billingService.getNextInvoiceNumber(formData.selectedBranch, branchName);
      setFormData(prev => ({ ...prev, billNumber: newInvoiceNumber }));
    } catch (error) {
      console.error('Error refreshing invoice number:', error);
    }
  };

  const handleBranchChange = async (branchCode: string) => {
    const branchName = getBranchName(branchCode);
    try {
      const newInvoiceNumber = await billingService.getNextInvoiceNumber(branchCode, branchName);
      setFormData(prev => ({
        ...prev,
        selectedBranch: branchCode,
        billNumber: newInvoiceNumber
      }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setFormData(prev => ({ ...prev, selectedBranch: branchCode }));
    }
  };

  // ==================== QUICK ACTIONS ====================

  /** Fill form with sample/demo billing data, replacing current entry data */
  const handleFillSample = () => {
    setFormData({
      ...buildEmptyForm(formData.selectedBranch, formData.billNumber),
      paymentDueDate: '',
      customerName: 'John Doe',
      customerContact: '9876543210',
      customerEmail: 'john.doe@example.com',
      customerAddress: '123 Main Street, Mumbai, Maharashtra',
      lensPowerRight: '-2.50',
      lensPowerLeft: '-2.25',
      pd: '62 mm',
      sphRight: '-2.50',
      cylRight: '-0.75',
      axisRight: '180',
      pdRight: '31 mm',
      sphLeft: '-2.25',
      cylLeft: '-0.50',
      axisLeft: '170',
      pdLeft: '31 mm',
      additionalNotes: 'Sample billing record for testing',
      paymentMethod: 'UPI',
      transactionRef: 'TXN123456',
      paymentStatus: 'Paid',
      warrantyDetails: '1 year warranty on frames',
      returnPolicy: '7 days return policy',
      prescriptionDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      authorizedSignatory: 'Dr. Smith',
      discount: 500,
      advancePaid: 1000,
    });

    setProducts([
      { id: 1, productName: 'Premium Eyeglasses Frame', category: 'Frame', description: 'High-quality metal frame', hsnCode: '9003.11', quantity: 1, pricePerUnit: 2500, gstPercentage: 18, gstAmount: 450, total: 2950, isValid: true, validationMessage: 'Sample product' },
      { id: 2, productName: 'Anti-Glare Lenses', category: 'Spectacles', description: 'Premium anti-glare lenses', hsnCode: '9001.40', quantity: 1, pricePerUnit: 1500, gstPercentage: 18, gstAmount: 270, total: 1770, isValid: true, validationMessage: 'Sample product' }
    ]);
    setNextId(3);
    showNotification('info', 'Sample data loaded. Click Validate to check invoice number, or Save to create the bill.');
  };

  /** Reset form completely and load the next unsaved bill number from the database */
  const handleNewBill = async () => {
    if (!formData.selectedBranch) {
      showNotification('warning', 'Please select a branch first');
      return;
    }

    try {
      const branchName = getBranchName(formData.selectedBranch);
      const newInvoiceNumber = await billingService.getNextInvoiceNumber(formData.selectedBranch, branchName);
      setFormData(buildEmptyForm(formData.selectedBranch, newInvoiceNumber));
      setProducts([]);
      setNextId(1);
      showNotification('success', `New bill ready. Invoice: ${newInvoiceNumber}`);
    } catch (error) {
      console.error('Error resetting form:', error);
      showNotification('error', 'Failed to generate new invoice number');
    }
  };

  /** Validate current invoice number - auto-corrects if wrong */
  const handleValidate = async () => {
    if (!formData.selectedBranch) {
      showNotification('warning', 'Please select a branch first');
      return;
    }

    try {
      const branchName = getBranchName(formData.selectedBranch);
      const result = await billingService.validateAndFixInvoiceNumber(formData.billNumber, formData.selectedBranch, branchName);

      if (!result.isValid) {
        setFormData(prev => ({ ...prev, billNumber: result.correctedBillNumber }));
        showNotification('warning', `Invoice corrected to: ${result.correctedBillNumber}`);
      } else {
        showNotification('success', `Invoice ${formData.billNumber} is valid`);
      }
    } catch (error) {
      console.error('Error validating invoice:', error);
      showNotification('error', 'Failed to validate invoice number');
    }
  };

  // ==================== PRODUCT MANAGEMENT ====================

  const addProductRow = () => {
    setProducts(prev => [...prev, {
      id: nextId,
      productName: '',
      category: '',
      description: '',
      hsnCode: '',
      quantity: 1,
      pricePerUnit: 0,
      gstPercentage: 0,
      gstAmount: 0,
      total: 0,
      isValid: true,
      validationMessage: 'Type product name and click search to validate'
    }]);
    setNextId(prev => prev + 1);
  };

  const removeProductRow = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProduct = (id: number, field: keyof ProductRow, value: any) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updated = { ...product, [field]: value };
        if (['quantity', 'pricePerUnit', 'gstPercentage'].includes(field)) {
          const qty = field === 'quantity' ? value : updated.quantity;
          const price = field === 'pricePerUnit' ? value : updated.pricePerUnit;
          const gst = field === 'gstPercentage' ? value : updated.gstPercentage;
          const subtotal = qty * price;
          updated.gstAmount = (subtotal * gst) / 100;
          updated.total = subtotal + updated.gstAmount;
        }
        return updated;
      }
      return product;
    }));
  };

  const calculateBillingSummary = () => {
    const subtotal = products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);
    const totalGst = products.reduce((sum, p) => sum + p.gstAmount, 0);
    const amount = subtotal + totalGst - formData.discount;
    const finalPayable = amount - formData.advancePaid;
    return { subtotal, totalGst, amount, finalPayable };
  };

  // ==================== SAVE FLOW ====================

  const buildBillingDataForPreview = (): BillingData | null => {
    const branchName = getBranchName(formData.selectedBranch);
    const { subtotal, totalGst, amount, finalPayable } = calculateBillingSummary();

    return {
      store: {
        name: 'Nayan Eye Care',
        tagline: 'Your Vision, Our Priority',
        branch: { code: formData.selectedBranch, name: branchName, address: branches.find(b => b.code === formData.selectedBranch)?.address || '' },
        address: { street: `Nayan Eye Care - ${branchName}`, building: branches.find(b => b.code === formData.selectedBranch)?.address || '', city: 'Port Blair', state: 'Andaman & Nicobar Islands', pincode: '744101', country: 'India' },
        contact: { phone: '+91 98765 43210', email: 'info@nayaneyecare.com', website: 'www.nayaneyecare.com', gstin: '27AABCU9603R1Z5' }
      },
      invoice: {
        billNumber: formData.billNumber,
        billDate: formData.billDate,
        paymentDueDate: formData.paymentDueDate,
        generatedAt: new Date().toISOString()
      },
      customer: {
        name: formData.customerName,
        contact: formData.customerContact,
        email: formData.customerEmail,
        address: formData.customerAddress
      },
      prescription: {
        lensPowerRight: formData.lensPowerRight,
        lensPowerLeft: formData.lensPowerLeft,
        pd: formData.pd,
        sphRight: formData.sphRight,
        cylRight: formData.cylRight,
        axisRight: formData.axisRight,
        pdRight: formData.pdRight,
        sphLeft: formData.sphLeft,
        cylLeft: formData.cylLeft,
        axisLeft: formData.axisLeft,
        pdLeft: formData.pdLeft,
        additionalNotes: formData.additionalNotes
      },
      products: products.map(p => ({
        id: p.id, productName: p.productName, category: p.category, description: p.description,
        hsnCode: p.hsnCode, quantity: p.quantity, pricePerUnit: p.pricePerUnit,
        gstPercentage: p.gstPercentage, gstAmount: p.gstAmount, total: p.total
      })),
      billingSummary: { subtotal, totalGst, amount, discount: formData.discount, advancePaid: formData.advancePaid, finalPayable },
      payment: { method: formData.paymentMethod, transactionRef: formData.transactionRef, status: formData.paymentStatus },
      additionalInfo: {
        warrantyDetails: formData.warrantyDetails,
        returnPolicy: formData.returnPolicy,
        prescriptionDeliveryDate: formData.prescriptionDeliveryDate,
        authorizedSignatory: formData.authorizedSignatory
      }
    };
  };

  const handleOpenInvoicePreview = () => {
    if (products.length === 0) {
      showNotification('warning', 'Add at least one product to preview invoice');
      return;
    }
    const billingData = buildBillingDataForPreview();
    if (billingData) {
      setPreviewBillingData(billingData);
      setShowInvoicePreview(true);
    }
  };

  const handleSaveData = async () => {
    // Validation
    if (!formData.customerName?.trim()) {
      showNotification('error', 'Customer name is required');
      return;
    }
    if (!formData.customerContact?.trim()) {
      showNotification('error', 'Customer contact is required');
      return;
    }
    if (products.length === 0) {
      showNotification('error', 'At least one product is required');
      return;
    }
    if (!formData.billNumber) {
      showNotification('error', 'Invoice number is required');
      return;
    }

    setIsSaving(true);

    const { subtotal, totalGst, amount, finalPayable } = calculateBillingSummary();
    const branchName = getBranchName(formData.selectedBranch);

    const billingData: BillingData = {
      store: {
        name: 'Nayan Eye Care',
        tagline: 'Your Vision, Our Priority',
        branch: { code: formData.selectedBranch, name: branchName, address: branches.find(b => b.code === formData.selectedBranch)?.address || '' },
        address: { street: `Nayan Eye Care - ${branchName}`, building: branches.find(b => b.code === formData.selectedBranch)?.address || '', city: 'Port Blair', state: 'Andaman & Nicobar Islands', pincode: '744101', country: 'India' },
        contact: { phone: '+91 98765 43210', email: 'info@nayaneyecare.com', website: 'www.nayaneyecare.com', gstin: '27AABCU9603R1Z5' }
      },
      invoice: {
        billNumber: formData.billNumber,
        billDate: formData.billDate,
        paymentDueDate: formData.paymentDueDate,
        generatedAt: new Date().toISOString()
      },
      customer: {
        name: formData.customerName,
        contact: formData.customerContact,
        email: formData.customerEmail,
        address: formData.customerAddress
      },
      prescription: {
        lensPowerRight: formData.lensPowerRight,
        lensPowerLeft: formData.lensPowerLeft,
        pd: formData.pd,
        sphRight: formData.sphRight,
        cylRight: formData.cylRight,
        axisRight: formData.axisRight,
        pdRight: formData.pdRight,
        sphLeft: formData.sphLeft,
        cylLeft: formData.cylLeft,
        axisLeft: formData.axisLeft,
        pdLeft: formData.pdLeft,
        additionalNotes: formData.additionalNotes
      },
      products: products.map(p => ({
        id: p.id, productName: p.productName, category: p.category, description: p.description,
        hsnCode: p.hsnCode, quantity: p.quantity, pricePerUnit: p.pricePerUnit,
        gstPercentage: p.gstPercentage, gstAmount: p.gstAmount, total: p.total
      })),
      billingSummary: { subtotal, totalGst, amount, discount: formData.discount, advancePaid: formData.advancePaid, finalPayable },
      payment: { method: formData.paymentMethod, transactionRef: formData.transactionRef, status: formData.paymentStatus },
      additionalInfo: {
        warrantyDetails: formData.warrantyDetails,
        returnPolicy: formData.returnPolicy,
        prescriptionDeliveryDate: formData.prescriptionDeliveryDate,
        authorizedSignatory: formData.authorizedSignatory
      }
    };

    try {
      // Step 1: Save to MySQL (source of truth)
      const dbResult = await billingService.saveBillingRecordToDatabase(billingData);

      if (!dbResult.success) {
        // DB save failed - do NOT save JSON, do NOT reset form
        showNotification('error', `Database save failed: ${dbResult.message}. Bill was NOT saved.`);
        setIsSaving(false);
        return;
      }

      if (dbResult.duplicate) {
        showNotification('warning', `Bill number ${formData.billNumber} already exists in the database. No new bill was created.`);
        setIsSaving(false);
        return;
      }

      // DB success
      showNotification('success', `Bill ${formData.billNumber} saved successfully! DB ID: ${dbResult.id}`);

      // Reset form and generate next invoice number
      const nextInvoiceNumber = await billingService.getNextInvoiceNumber(formData.selectedBranch, branchName);

      setFormData(buildEmptyForm(formData.selectedBranch, nextInvoiceNumber));

      setProducts([]);
      setNextId(1);

    } catch (error) {
      console.error('Error saving billing data:', error);
      showNotification('error', 'Unexpected error saving bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const billingSummary = calculateBillingSummary();

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-3">

        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-2 p-2 flex items-center justify-between">
          <button
            onClick={() => navigate('/supplier/dashboard')}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-emerald-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Billing Invoice</h1>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm">Bill No:</span>
            <span className="font-semibold text-gray-800">{formData.billNumber || '—'}</span>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg border flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden p-3 space-y-3">

          {/* Top Section: Store, Invoice, Branch, Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 border-b pb-2">

            {/* Store Info */}
            <div className="p-3 border rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nayan Eye Care</h3>
              <p className="text-sm text-gray-500 mb-1">Your Vision, Our Priority</p>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{branches.find(b => b.code === formData.selectedBranch)?.address || 'Select a branch'}</span>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="p-3 border rounded-xl bg-blue-50">
              <h3 className="font-semibold text-gray-800 mb-2">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-gray-600">Bill Date:</label>
                  <input type="date" value={formData.billDate}
                    onChange={e => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                    className="w-full border-2 border-blue-200 rounded-lg px-2 py-1 bg-white text-sm focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-gray-600">Due Date:</label>
                  <input type="date" value={formData.paymentDueDate}
                    onChange={e => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                    className="w-full border-2 border-blue-200 rounded-lg px-2 py-1 bg-white text-sm focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Branch Selection */}
            <div className="p-3 border rounded-xl bg-emerald-50">
              <h3 className="font-semibold text-gray-800 mb-2">Branch & Products</h3>
              <div className="flex flex-col space-y-2">
                <select value={formData.selectedBranch}
                  onChange={e => handleBranchChange(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white">
                  {branches.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <button onClick={loadPurchaseData} disabled={isLoadingPurchaseData}
                  className="flex items-center justify-center space-x-1.5 bg-emerald-200 text-emerald-800 px-2 py-1.5 rounded-lg text-xs disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPurchaseData ? 'animate-spin' : ''}`} />
                  <span>{isLoadingPurchaseData ? 'Loading...' : 'Load Products'}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-3 border rounded-xl bg-purple-50">
              <h3 className="font-semibold text-gray-800 mb-2">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button onClick={handleFillSample}
                  className="flex items-center justify-center space-x-1 bg-purple-200 text-purple-800 px-2 py-1.5 rounded-lg text-xs hover:bg-purple-300 transition-all">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Sample</span>
                </button>
                <button onClick={handleNewBill}
                  className="flex items-center justify-center space-x-1 bg-orange-200 text-orange-800 px-2 py-1.5 rounded-lg text-xs hover:bg-orange-300 transition-all">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Bill</span>
                </button>
                <button onClick={handleValidate}
                  className="flex items-center justify-center space-x-1 bg-indigo-200 text-indigo-800 px-2 py-1.5 rounded-lg text-xs hover:bg-indigo-300 transition-all">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Validate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>Customer Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1">Customer Name *</label>
                  <input type="text" value={formData.customerName}
                    onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Full name" className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Contact No. *</label>
                  <input type="tel" value={formData.customerContact}
                    onChange={e => setFormData(prev => ({ ...prev, customerContact: e.target.value }))}
                    placeholder="Mobile number" className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Email</label>
                  <input type="email" value={formData.customerEmail}
                    onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="Email address" className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Address</label>
                  <textarea rows={2} value={formData.customerAddress}
                    onChange={e => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                    placeholder="Full address" className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-sm resize-none" />
                </div>
              </div>
            </div>

            {/* Prescription Details */}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <Eye className="h-4 w-4 text-purple-600" />
                <span>Prescription Details</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 border-2 border-purple-200 rounded-lg bg-white">
                  <h5 className="font-semibold text-center text-purple-700 mb-1 text-xs">Right Eye (OD)</h5>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div><label className="text-gray-500 text-xs">SPH</label><input type="text" value={formData.sphRight} onChange={e => setFormData(p => ({ ...p, sphRight: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0.00" /></div>
                    <div><label className="text-gray-500 text-xs">CYL</label><input type="text" value={formData.cylRight} onChange={e => setFormData(p => ({ ...p, cylRight: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0.00" /></div>
                    <div><label className="text-gray-500 text-xs">AXIS</label><input type="text" value={formData.axisRight} onChange={e => setFormData(p => ({ ...p, axisRight: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0" /></div>
                    <div><label className="text-gray-500 text-xs">PD</label><input type="text" value={formData.pdRight} onChange={e => setFormData(p => ({ ...p, pdRight: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="mm" /></div>
                  </div>
                </div>
                <div className="p-2 border-2 border-purple-200 rounded-lg bg-white">
                  <h5 className="font-semibold text-center text-purple-700 mb-1 text-xs">Left Eye (OS)</h5>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div><label className="text-gray-500 text-xs">SPH</label><input type="text" value={formData.sphLeft} onChange={e => setFormData(p => ({ ...p, sphLeft: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0.00" /></div>
                    <div><label className="text-gray-500 text-xs">CYL</label><input type="text" value={formData.cylLeft} onChange={e => setFormData(p => ({ ...p, cylLeft: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0.00" /></div>
                    <div><label className="text-gray-500 text-xs">AXIS</label><input type="text" value={formData.axisLeft} onChange={e => setFormData(p => ({ ...p, axisLeft: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="0" /></div>
                    <div><label className="text-gray-500 text-xs">PD</label><input type="text" value={formData.pdLeft} onChange={e => setFormData(p => ({ ...p, pdLeft: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5" placeholder="mm" /></div>
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div><label className="text-gray-500 text-xs">Lens Power R</label><input type="text" value={formData.lensPowerRight} onChange={e => setFormData(p => ({ ...p, lensPowerRight: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5 text-xs" placeholder="-2.50" /></div>
                <div><label className="text-gray-500 text-xs">Lens Power L</label><input type="text" value={formData.lensPowerLeft} onChange={e => setFormData(p => ({ ...p, lensPowerLeft: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5 text-xs" placeholder="-2.25" /></div>
                <div><label className="text-gray-500 text-xs">PD</label><input type="text" value={formData.pd} onChange={e => setFormData(p => ({ ...p, pd: e.target.value }))} className="w-full border border-purple-200 rounded px-1 py-0.5 text-xs" placeholder="62 mm" /></div>
              </div>
              <div className="mt-2">
                <label className="text-gray-500 text-xs">Additional Notes</label>
                <textarea rows={2} value={formData.additionalNotes}
                  onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Extra prescription notes..." className="w-full border border-purple-200 rounded px-1 py-0.5 text-xs resize-none" />
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <span>Product Details</span>
              </h3>
              <button onClick={addProductRow}
                className="flex items-center space-x-1 bg-orange-500 text-white px-3 py-1 text-xs rounded-lg hover:bg-orange-600">
                <Plus className="h-3.5 w-3.5" /><span>Add Product</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[1200px]">
                <thead>
                  <tr className="bg-orange-100 text-gray-600">
                    <th className="px-2 py-1.5 text-left w-10">#</th>
                    <th className="px-2 py-1.5 text-left w-40">Product Name</th>
                    <th className="px-2 py-1.5 text-left w-28">Category</th>
                    <th className="px-2 py-1.5 text-left w-36">Description</th>
                    <th className="px-2 py-1.5 text-left w-20">HSN</th>
                    <th className="px-2 py-1.5 text-left w-14">Qty</th>
                    <th className="px-2 py-1.5 text-left w-24">Price/Unit</th>
                    <th className="px-2 py-1.5 text-left w-16">GST %</th>
                    <th className="px-2 py-1.5 text-left w-20">GST Amt</th>
                    <th className="px-2 py-1.5 text-left w-24">Total</th>
                    <th className="px-2 py-1.5 text-left w-12">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-4 text-gray-400">No products added. Click "Add Product" to add line items.</td></tr>
                  )}
                  {products.map((product, idx) => (
                    <tr key={product.id} className="border-b border-orange-100">
                      <td className="px-2 py-1.5">{idx + 1}</td>
                      <td className="px-2 py-1.5"><input type="text" value={product.productName} onChange={e => updateProduct(product.id, 'productName', e.target.value)} className="w-full border-0 bg-transparent text-xs" /></td>
                      <td className="px-2 py-1.5">
                        <select value={product.category} onChange={e => updateProduct(product.id, 'category', e.target.value)} className="w-full border-0 bg-transparent text-xs">
                          <option value="">Select</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5"><input type="text" value={product.description} onChange={e => updateProduct(product.id, 'description', e.target.value)} className="w-full border-0 bg-transparent text-xs" placeholder="Description" /></td>
                      <td className="px-2 py-1.5"><input type="text" value={product.hsnCode} onChange={e => updateProduct(product.id, 'hsnCode', e.target.value)} className="w-full border-0 bg-transparent text-xs" placeholder="HSN" /></td>
                      <td className="px-2 py-1.5"><input type="number" value={product.quantity} onChange={e => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full border-0 bg-transparent text-xs" min="1" /></td>
                      <td className="px-2 py-1.5"><input type="number" value={product.pricePerUnit} onChange={e => updateProduct(product.id, 'pricePerUnit', parseFloat(e.target.value) || 0)} className="w-full border-0 bg-transparent text-xs" step="0.01" /></td>
                      <td className="px-2 py-1.5">
                        <select value={product.gstPercentage} onChange={e => updateProduct(product.id, 'gstPercentage', parseInt(e.target.value) || 0)} className="w-full border-0 bg-transparent text-xs">
                          {gstPercentages.map(p => <option key={p} value={p}>{p}%</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 text-right">₹{product.gstAmount.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right">₹{product.total.toFixed(2)}</td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeProductRow(product.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Row: Summary, Payment, Warranty */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Billing Summary */}
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-green-600" /><span>Billing Summary</span>
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium">₹{billingSummary.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Total GST:</span><span className="font-medium">₹{billingSummary.totalGst.toFixed(2)}</span></div>
                <div className="flex justify-between items-center">
                  <span>Discount:</span>
                  <input type="number" value={formData.discount} onChange={e => setFormData(p => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                    className="w-20 border-2 border-green-300 rounded px-1.5 py-0.5 text-right text-xs" step="0.01" />
                </div>
                <div className="flex justify-between items-center">
                  <span>Advance Paid:</span>
                  <input type="number" value={formData.advancePaid} onChange={e => setFormData(p => ({ ...p, advancePaid: parseFloat(e.target.value) || 0 }))}
                    className="w-20 border-2 border-green-300 rounded px-1.5 py-0.5 text-right text-xs" step="0.01" />
                </div>
                <div className="flex justify-between text-base font-bold text-green-600 pt-1.5 border-t border-green-200">
                  <span>Final Payable:</span><span>₹{billingSummary.finalPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Delivery */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" /><span>Payment & Delivery</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Payment Method</label>
                  <select value={formData.paymentMethod}
                    onChange={e => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Select</option>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Transaction Ref</label>
                  <input type="text" value={formData.transactionRef}
                    onChange={e => setFormData(p => ({ ...p, transactionRef: e.target.value }))}
                    className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Payment Status</label>
                  <select value={formData.paymentStatus}
                    onChange={e => setFormData(p => ({ ...p, paymentStatus: e.target.value }))}
                    className="w-full border-gray-300 rounded-lg px-2 py-1.5 text-xs">
                    {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Delivery Date</label>
                  <input type="date" value={formData.prescriptionDeliveryDate}
                    onChange={e => setFormData(p => ({ ...p, prescriptionDeliveryDate: e.target.value }))}
                    className="w-full border-2 border-blue-200 rounded-lg px-2 py-1.5 text-xs bg-white" />
                </div>
              </div>
            </div>

            {/* Warranty & Policies */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <Shield className="h-4 w-4 text-amber-600" /><span>Warranty & Policies</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Warranty Details</label>
                  <textarea rows={2} value={formData.warrantyDetails}
                    onChange={e => setFormData(p => ({ ...p, warrantyDetails: e.target.value }))}
                    placeholder="Enter warranty terms..." className="w-full border-gray-300 rounded-lg px-2 py-1 text-xs resize-none" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Return Policy</label>
                  <textarea rows={2} value={formData.returnPolicy}
                    onChange={e => setFormData(p => ({ ...p, returnPolicy: e.target.value }))}
                    placeholder="Enter return policy..." className="w-full border-gray-300 rounded-lg px-2 py-1 text-xs resize-none" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 text-xs">Authorized Signatory</label>
                  <input type="text" value={formData.authorizedSignatory}
                    onChange={e => setFormData(p => ({ ...p, authorizedSignatory: e.target.value }))}
                    placeholder="Signatory name..." className="w-full border-gray-300 rounded-lg px-2 py-1 text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-gray-50 flex flex-wrap gap-3 justify-center rounded-xl">
            <button onClick={handleSaveData} disabled={isSaving}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Bill'}</span>
            </button>
            <button onClick={handleOpenInvoicePreview}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm">
              <Printer className="h-4 w-4" /><span>Print Invoice</span>
            </button>
          </div>

        </div>

        {showInvoicePreview && previewBillingData && (
          <InvoicePreviewModal
            isOpen={showInvoicePreview}
            onClose={() => setShowInvoicePreview(false)}
            billingData={previewBillingData}
          />
        )}
    </div>
  );
};

export default NewBillingPage;
