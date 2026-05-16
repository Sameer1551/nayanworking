import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, MessageSquare, RefreshCw, TrendingUp, Calendar, X } from 'lucide-react';
import customerService from '../../services/customerService';
import branchService, { Branch } from '../../services/branchService';

interface Customer {
  id: string | number;
  branchName: string;
  title: string;
  fullName: string;
  mobileNo: string;
  mobileNo2?: string;
  gender: 'Male' | 'Female' | 'Other';
  gstinNo?: string;
  dateOfBirth?: string;
  age?: number;
  notes?: string;
  email?: string;
  city?: string;
  anniversary?: string;
  dateOfVisit?: string;
  createdAt: string;
  // Billing-related fields
  branchCode?: string;
  lastVisitDate?: string;
  visitCount?: number;
  totalSpent?: number;
  averageBillAmount?: number;
  lastBillNumber?: string;
  lastBillDate?: string;
  source?: 'customer_record' | 'billing_record' | 'combined';
}

interface CustomerFormData {
  branchName: string;
  title: string;
  fullName: string;
  mobileNo: string;
  mobileNo2: string;
  gender: 'Male' | 'Female' | 'Other';
  gstinNo: string;
  dateOfBirth: string;
  notes: string;
  email: string;
  city: string;
  anniversary: string;
  dateOfVisit: string;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [smsData, setSmsData] = useState({
    messageType: 'individual', // 'individual', 'branch', 'all'
    selectedCustomer: '',
    selectedBranch: '',
    message: '',
    selectedCustomers: [] as string[]
  });
  const [formData, setFormData] = useState<CustomerFormData>({
    branchName: '',
    title: 'Mr.',
    fullName: '',
    mobileNo: '',
    mobileNo2: '',
    gender: 'Male',
    gstinNo: '',
    dateOfBirth: '',
    notes: '',
    email: '',
    city: '',
    anniversary: '',
    dateOfVisit: ''
  });

  const [branchOptions, setBranchOptions] = useState<string[]>([]);

  const titleOptions = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

  const normalizeGender = (gender?: string): Customer['gender'] => {
    if (!gender) return 'Other';
    const normalized = gender.trim().toUpperCase();
    if (normalized === 'MALE') return 'Male';
    if (normalized === 'FEMALE') return 'Female';
    return 'Other';
  };

  // Load customers from backend database on component mount
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setIsLoading(true);
        // Load from backend database API
        const backendCustomers = await customerService.getAllCustomers();
        if (backendCustomers && backendCustomers.length > 0) {
          console.log('Loaded customers from backend database:', backendCustomers.length);
          setCustomers(backendCustomers);
          setLoadError(null);
        } else {
          console.log('No customers found in backend database');
          setCustomers([]);
          setLoadError(null);
        }
      } catch (error) {
        console.error('Error loading customer data from backend:', error);
        setCustomers([]);
        setLoadError('Failed to connect to database. Please check your connection.');
      } finally {
        setIsLoading(false);
      }

      // Load branches from backend API
      try {
        const branchesData = await branchService.getAllBranches();
        setBranchOptions(branchesData.map(b => b.name));
      } catch (branchError) {
        console.error('Error loading branches:', branchError);
      }
    };

    loadCustomerData();
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate age when date of birth changes
    if (name === 'dateOfBirth') {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        age
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.branchName.trim()) {
      alert('Branch Name is required');
      return false;
    }
    if (!formData.fullName.trim()) {
      alert('Full Name is required');
      return false;
    }
    if (!formData.mobileNo.trim()) {
      alert('Mobile Number is required');
      return false;
    }
    if (formData.mobileNo.length < 10) {
      alert('Mobile Number must be at least 10 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Prepare customer data - do NOT set id, let backend generate it
    const customerData: Customer = {
      branchName: formData.branchName,
      title: formData.title,
      fullName: formData.fullName,
      mobileNo: formData.mobileNo,
      mobileNo2: formData.mobileNo2 || undefined,
      gender: formData.gender,
      gstinNo: formData.gstinNo || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      age: formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : undefined,
      notes: formData.notes || undefined,
      email: formData.email || undefined,
      city: formData.city || undefined,
      anniversary: formData.anniversary || undefined,
      dateOfVisit: formData.dateOfVisit || undefined,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString()
    };

    try {
      let result;

      if (editingCustomer) {
        // Update existing customer in backend DB
        result = await customerService.updateCustomer(editingCustomer.id, customerData);
      } else {
        // Create new customer in backend DB only
        result = await customerService.createCustomer(customerData);
      }

      if (!result.success) {
        alert(result.message || 'Failed to save customer. Please try again.');
        return;
      }

      console.log(editingCustomer ? 'Customer updated successfully' : 'Customer created successfully');

      // Refresh data from backend DB after successful save
      await refreshFromBackend();

    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    }

    handleCloseModal();
  };

  const handleView = async (customer: Customer) => {
    try {
      const customerData = await customerService.getCustomerById(customer.id.toString());

      if (customerData) {
        const customerForView: Customer = {
          id: customerData.id ?? customer.id,
          branchName: customerData.branchName || customer.branchName,
          title: customerData.title || customer.title,
          fullName: customerData.fullName || customer.fullName,
          mobileNo: customerData.mobileNo || customer.mobileNo,
          mobileNo2: customerData.mobileNo2 || '',
          gender: normalizeGender(customerData.gender),
          gstinNo: customerData.gstinNo || '',
          dateOfBirth: customerData.dateOfBirth || customer.dateOfBirth,
          age: customerData.age,
          notes: customerData.notes || '',
          email: customerData.email || customer.email,
          city: customerData.city || customer.city,
          anniversary: customerData.anniversary || customer.anniversary,
          dateOfVisit: customerData.dateOfVisit || customer.dateOfVisit,
          createdAt: customerData.createdAt || customer.createdAt,
          branchCode: customerData.branchCode || customer.branchCode,
          lastVisitDate: customerData.lastVisitDate || customer.lastVisitDate,
          visitCount: customerData.visitCount ?? customer.visitCount,
          totalSpent: customerData.totalSpent ?? customer.totalSpent,
          averageBillAmount: customerData.averageBillAmount ?? customer.averageBillAmount,
          lastBillNumber: customerData.lastBillNumber || customer.lastBillNumber,
          lastBillDate: customerData.lastBillDate || customer.lastBillDate,
          source: (customerData.source as Customer['source']) || customer.source
        };
        setViewingCustomer(customerForView);
        setIsViewModalOpen(true);
        return;
      }
      alert('Customer record was not found in the database.');
      return;
    } catch (error) {
      console.error('Error fetching customer data for view:', error);
      alert('Failed to load customer details from database.');
      return;
    }

    setIsViewModalOpen(true);
  };

  const handleEdit = async (customer: Customer) => {
    try {
      const customerData = await customerService.getCustomerById(customer.id.toString());

      if (customerData) {
        setEditingCustomer({
          id: customerData.id ?? customer.id,
          branchName: customerData.branchName || customer.branchName,
          title: customerData.title || customer.title,
          fullName: customerData.fullName || customer.fullName,
          mobileNo: customerData.mobileNo || customer.mobileNo,
          mobileNo2: customerData.mobileNo2 || '',
          gender: normalizeGender(customerData.gender),
          gstinNo: customerData.gstinNo || '',
          dateOfBirth: customerData.dateOfBirth || customer.dateOfBirth || '',
          age: customerData.age,
          notes: customerData.notes || '',
          email: customerData.email || customer.email || '',
          city: customerData.city || customer.city || '',
          anniversary: customerData.anniversary || customer.anniversary || '',
          dateOfVisit: customerData.dateOfVisit || customer.dateOfVisit || '',
          createdAt: customerData.createdAt || customer.createdAt,
          branchCode: customerData.branchCode || customer.branchCode,
          lastVisitDate: customerData.lastVisitDate || customer.lastVisitDate,
          visitCount: customerData.visitCount ?? customer.visitCount,
          totalSpent: customerData.totalSpent ?? customer.totalSpent,
          averageBillAmount: customerData.averageBillAmount ?? customer.averageBillAmount,
          lastBillNumber: customerData.lastBillNumber || customer.lastBillNumber,
          lastBillDate: customerData.lastBillDate || customer.lastBillDate,
          source: (customerData.source as Customer['source']) || customer.source
        });
        setFormData({
          branchName: customerData.branchName || customer.branchName,
          title: customerData.title || customer.title,
          fullName: customerData.fullName || customer.fullName,
          mobileNo: customerData.mobileNo || customer.mobileNo,
          mobileNo2: customerData.mobileNo2 || '',
          gender: normalizeGender(customerData.gender),
          gstinNo: customerData.gstinNo || '',
          dateOfBirth: customerData.dateOfBirth || customer.dateOfBirth || '',
          notes: customerData.notes || '',
          email: customerData.email || customer.email || '',
          city: customerData.city || customer.city || '',
          anniversary: customerData.anniversary || customer.anniversary || '',
          dateOfVisit: customerData.dateOfVisit || customer.dateOfVisit || ''
        });
        setIsModalOpen(true);
        return;
      }
      alert('Customer record was not found in the database.');
      return;
    } catch (error) {
      console.error('Error fetching customer data for edit:', error);
      alert('Failed to load customer details for editing.');
      return;
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const result = await customerService.deleteCustomer(customer.id.toString());
      if (!result.success) {
        alert(result.message || 'Failed to delete customer. Please try again.');
        return;
      }

      // Refresh data from backend
      await refreshFromBackend();

      alert('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({
      branchName: '',
      title: 'Mr.',
      fullName: '',
      mobileNo: '',
      mobileNo2: '',
      gender: 'Male',
      gstinNo: '',
      dateOfBirth: '',
      notes: '',
      email: '',
      city: '',
      anniversary: '',
      dateOfVisit: ''
    });
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCustomer(null);
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (customer.fullName || '').toLowerCase().includes(term) ||
      (customer.mobileNo || '').includes(searchTerm) ||
      (customer.branchName || '').toLowerCase().includes(term) ||
      (customer.city || '').toLowerCase().includes(term) ||
      (customer.email || '').toLowerCase().includes(term) ||
      (customer.mobileNo2 || '').includes(searchTerm)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleSmsSend = () => {
    const { messageType, selectedCustomer, selectedBranch, message, selectedCustomers } = smsData;
    
    if (!message.trim()) {
      alert('Please enter a message to send');
      return;
    }

    let targetCustomers: any[] = [];

    switch (messageType) {
      case 'individual':
        if (!selectedCustomer) {
          alert('Please select a customer');
          return;
        }
        targetCustomers = customers.filter(c => c.id.toString() === selectedCustomer);
        break;
      
      case 'branch':
        if (!selectedBranch) {
          alert('Please select a branch');
          return;
        }
        targetCustomers = customers.filter(c => c.branchName === selectedBranch);
        break;
      
      case 'all':
        targetCustomers = customers;
        break;
      
      case 'multiple':
        if (selectedCustomers.length === 0) {
          alert('Please select at least one customer');
          return;
        }
        targetCustomers = customers.filter(c => selectedCustomers.includes(c.id.toString()));
        break;
    }

    if (targetCustomers.length === 0) {
      alert('No customers found for the selected criteria');
      return;
    }

    // Here you would integrate with your SMS service
    console.log('Sending SMS to customers:', targetCustomers);
    console.log('Message:', message);
    
    // For demo purposes, show success message
    alert(`SMS sent successfully to ${targetCustomers.length} customer(s)!`);
    
    // Reset SMS form
    setSmsData({
      messageType: 'individual',
      selectedCustomer: '',
      selectedBranch: '',
      message: '',
      selectedCustomers: []
    });
    setIsSmsModalOpen(false);
  };

  const handleSmsModalClose = () => {
    setIsSmsModalOpen(false);
    setSmsData({
      messageType: 'individual',
      selectedCustomer: '',
      selectedBranch: '',
      message: '',
      selectedCustomers: []
    });
  };

  const refreshFromBackend = async () => {
    try {
      const backendCustomers = await customerService.getAllCustomers();

      if (backendCustomers && backendCustomers.length > 0) {
        setCustomers(backendCustomers);
      } else {
        setCustomers([]);
      }

      setLoadError(null);
    } catch (error) {
      console.error('Error refreshing customer data from backend:', error);
      setLoadError('Failed to refresh customer data from database');
    }
  };

  const refreshCustomerData = async () => {
    try {
      setIsLoading(true);
      await refreshFromBackend();
      alert(`Customer data refreshed successfully!`);
    } catch (error) {
      console.error('Error refreshing customer data:', error);
      alert('Failed to refresh customer data. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <h1 className="text-xl font-bold mb-1">Customer Management</h1>
      <p className="text-gray-600 text-sm mb-3">Manage your customer database and track customer information.</p>
      
      <div className="bg-white p-3 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-3">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              className="border rounded-lg pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                title="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsSmsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Send SMS
            </button>
            <button
              onClick={refreshCustomerData}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Refresh customer data from database"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Status Information */}
        <div className={`mb-2 p-2 border rounded-lg ${
          isLoading ? 'bg-yellow-50 border-yellow-200' : 
          loadError ? 'bg-red-50 border-red-200' : 
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <div className={`${
              isLoading ? 'text-yellow-800' : 
              loadError ? 'text-red-800' : 
              'text-blue-800'
            }`}>
              <span className="font-medium">Total Customers:</span> {customers.length}
            </div>
            <div className={`${
              isLoading ? 'text-yellow-600' : 
              loadError ? 'text-red-600' : 
              'text-blue-600'
            }`}>
              {isLoading ? '🔄 Loading...' : 
               loadError ? '❌ Error loading data' : 
               customers.length > 0 ? '✅ Data loaded successfully' : '⚠️ No customer data loaded'}
            </div>
          </div>
          {loadError && (
            <div className="mt-2 text-sm text-red-700">
              <button 
                onClick={refreshCustomerData}
                className="text-red-600 hover:text-red-800 underline"
              >
                Click here to retry loading data
              </button>
            </div>
          )}
        </div>

        {/* Customer Records Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Sr. No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Branch Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Mobile Nos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">DOB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Anniversary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Last Visit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visit Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center h-full">
                      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-3">Loading customer data...</span>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-red-500">
                    {loadError}
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Click "Add Customer" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <div className="flex items-center gap-2">
                          <span>{customer.branchName}</span>
                          {customer.branchCode && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {customer.branchCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b font-medium">{customer.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <div className="font-mono">{customer.mobileNo}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">{customer.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">{customer.city || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {customer.anniversary ? formatDate(customer.anniversary) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {customer.lastVisitDate ? formatDate(customer.lastVisitDate) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{customer.visitCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <span className="font-medium whitespace-nowrap">
                          {customer.totalSpent ? `₹ ${customer.totalSpent.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.source === 'combined' ? 'bg-blue-100 text-blue-800' :
                          customer.source === 'billing_record' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.source === 'combined' ? 'Combined' :
                           customer.source === 'billing_record' ? 'Billing' : 'Customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(customer)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Customer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Edit Customer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMS Modal */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Send SMS to Customers</h2>
              <p className="text-sm text-gray-600 mt-1">Send messages to individual customers, by branch, or to all customers</p>
            </div>

            <div className="p-6">
              {/* Message Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Message Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      value="individual"
                      checked={smsData.messageType === 'individual'}
                      onChange={(e) => setSmsData(prev => ({ ...prev, messageType: e.target.value }))}
                      className="mr-2"
                    />
                    Individual
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      value="branch"
                      checked={smsData.messageType === 'branch'}
                      onChange={(e) => setSmsData(prev => ({ ...prev, messageType: e.target.value }))}
                      className="mr-2"
                    />
                    By Branch
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      value="multiple"
                      checked={smsData.messageType === 'multiple'}
                      onChange={(e) => setSmsData(prev => ({ ...prev, messageType: e.target.value }))}
                      className="mr-2"
                    />
                    Multiple
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      value="all"
                      checked={smsData.messageType === 'all'}
                      onChange={(e) => setSmsData(prev => ({ ...prev, messageType: e.target.value }))}
                      className="mr-2"
                    />
                    All Customers
                  </label>
                </div>
              </div>

              {/* Individual Customer Selection */}
              {smsData.messageType === 'individual' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                  <select
                    value={smsData.selectedCustomer}
                    onChange={(e) => setSmsData(prev => ({ ...prev, selectedCustomer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id.toString()}>
                        {customer.fullName} - {customer.mobileNo} ({customer.branchName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Selection */}
              {smsData.messageType === 'branch' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
                  <select
                    value={smsData.selectedBranch}
                    onChange={(e) => setSmsData(prev => ({ ...prev, selectedBranch: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a branch</option>
                    {branchOptions.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                  {smsData.selectedBranch && (
                    <p className="text-sm text-gray-600 mt-2">
                      {customers.filter(c => c.branchName === smsData.selectedBranch).length} customers found in {smsData.selectedBranch}
                    </p>
                  )}
                </div>
              )}

              {/* Multiple Customer Selection */}
              {smsData.messageType === 'multiple' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customers</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {customers.map(customer => (
                      <label key={customer.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={smsData.selectedCustomers.includes(customer.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSmsData(prev => ({
                                ...prev,
                                selectedCustomers: [...prev.selectedCustomers, customer.id.toString()]
                              }));
                            } else {
                              setSmsData(prev => ({
                                ...prev,
                                selectedCustomers: prev.selectedCustomers.filter(id => id !== customer.id.toString())
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm">
                          {customer.fullName} - {customer.mobileNo} ({customer.branchName})
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {smsData.selectedCustomers.length} customer(s) selected
                  </p>
                </div>
              )}

              {/* All Customers Info */}
              {smsData.messageType === 'all' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This will send SMS to all {customers.length} customers across all branches.
                  </p>
                </div>
              )}

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={smsData.message}
                  onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-600 mt-2">
                  Character count: {smsData.message.length}
                </p>
              </div>

              {/* Customer Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients Preview</label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                  {(() => {
                    let previewCustomers: any[] = [];
                    switch (smsData.messageType) {
                      case 'individual':
                        previewCustomers = customers.filter(c => c.id.toString() === smsData.selectedCustomer);
                        break;
                      case 'branch':
                        previewCustomers = customers.filter(c => c.branchName === smsData.selectedBranch);
                        break;
                      case 'multiple':
                        previewCustomers = customers.filter(c => smsData.selectedCustomers.includes(c.id.toString()));
                        break;
                      case 'all':
                        previewCustomers = customers;
                        break;
                    }
                    
                    if (previewCustomers.length === 0) {
                      return <p className="text-gray-500 text-sm">No customers selected</p>;
                    }
                    
                    return (
                      <div className="space-y-1">
                        {previewCustomers.slice(0, 10).map(customer => (
                          <div key={customer.id} className="text-sm text-gray-700">
                            {customer.fullName} - {customer.mobileNo} ({customer.branchName})
                          </div>
                        ))}
                        {previewCustomers.length > 10 && (
                          <p className="text-gray-500 text-sm">... and {previewCustomers.length - 10} more</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSmsModalClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSmsSend}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                {/* Title + Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name with Title <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {titleOptions.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Numbers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                    placeholder="Primary Mobile Number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile No 2
                  </label>
                  <input
                    type="tel"
                    name="mobileNo2"
                    value={formData.mobileNo2}
                    onChange={handleInputChange}
                    placeholder="Secondary Mobile Number (Optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSTIN No
                  </label>
                  <input
                    type="text"
                    name="gstinNo"
                    value={formData.gstinNo}
                    onChange={handleInputChange}
                    placeholder="GSTIN Number (Optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.dateOfBirth && (
                    <div className="text-sm text-gray-500 mt-1">
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address (Optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City (Optional)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Anniversary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anniversary
                  </label>
                  <input
                    type="date"
                    name="anniversary"
                    value={formData.anniversary}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date of Visit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Visit
                  </label>
                  <input
                    type="date"
                    name="dateOfVisit"
                    value={formData.dateOfVisit}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes about the customer (Optional)"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {isViewModalOpen && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Branch Name */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Branch Name - </span>
                  <span className="text-gray-900">{viewingCustomer.branchName}</span>
                </div>

                {/* Full Name with Title */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Full Name - </span>
                  <span className="text-gray-900">{viewingCustomer.title || ''} {viewingCustomer.fullName}</span>
                </div>

                {/* Mobile Numbers */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Mobile Numbers - </span>
                  <span className="text-gray-900">
                    {viewingCustomer.mobileNo}
                    {viewingCustomer.mobileNo2 && ` / ${viewingCustomer.mobileNo2}`}
                  </span>
                </div>

                {/* Gender */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Gender - </span>
                  <span className="text-gray-900">{viewingCustomer.gender || '-'}</span>
                </div>

                {/* GSTIN */}
                <div>
                  <span className="text-sm font-bold text-gray-800">GSTIN No - </span>
                  <span className="text-gray-900">{viewingCustomer.gstinNo || '-'}</span>
                </div>

                {/* Date of Birth */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Date of Birth - </span>
                  <span className="text-gray-900">
                    {viewingCustomer.dateOfBirth ? formatDate(viewingCustomer.dateOfBirth) : '-'}
                    {viewingCustomer.age ? ` (${viewingCustomer.age} yrs)` : ''}
                  </span>
                </div>

                {/* Email */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Email - </span>
                  <span className="text-gray-900">{viewingCustomer.email || '-'}</span>
                </div>

                {/* City */}
                <div>
                  <span className="text-sm font-bold text-gray-800">City - </span>
                  <span className="text-gray-900">{viewingCustomer.city || '-'}</span>
                </div>

                {/* Anniversary */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Anniversary - </span>
                  <span className="text-gray-900">{formatDate(viewingCustomer.anniversary)}</span>
                </div>

                {/* Date of Visit */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Date of Visit - </span>
                  <span className="text-gray-900">{formatDate(viewingCustomer.dateOfVisit)}</span>
                </div>

                {/* Created At */}
                <div>
                  <span className="text-sm font-bold text-gray-800">Created At - </span>
                  <span className="text-gray-900">{formatDate(viewingCustomer.createdAt)}</span>
                </div>

                {/* Notes - Full Width */}
                <div className="md:col-span-2">
                  <span className="text-sm font-bold text-gray-800">Notes - </span>
                  <span className="text-gray-900">{viewingCustomer.notes || '-'}</span>
                </div>

                {/* Billing Information - Full Width */}
                {(viewingCustomer.source || viewingCustomer.totalSpent || viewingCustomer.visitCount) && (
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Billing & Visit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Source */}
                      {viewingCustomer.source && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Data Source - </span>
                          <span className="text-gray-900">
                            {viewingCustomer.source === 'combined' ? 'Combined (Customer + Billing)' :
                             viewingCustomer.source === 'billing_record' ? 'Billing Records Only' : 'Customer Record Only'}
                          </span>
                        </div>
                      )}

                      {/* Visit Count */}
                      {viewingCustomer.visitCount && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Total Visits - </span>
                          <span className="text-gray-900">{viewingCustomer.visitCount}</span>
                        </div>
                      )}

                      {/* Last Visit Date */}
                      {viewingCustomer.lastVisitDate && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Last Visit - </span>
                          <span className="text-gray-900">{formatDate(viewingCustomer.lastVisitDate)}</span>
                        </div>
                      )}

                      {/* Total Spent */}
                      {viewingCustomer.totalSpent && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Total Spent - </span>
                          <span className="text-gray-900 font-medium text-green-600">₹{viewingCustomer.totalSpent.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Average Bill Amount */}
                      {viewingCustomer.averageBillAmount && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Average Bill - </span>
                          <span className="text-gray-900">₹{viewingCustomer.averageBillAmount.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Last Bill Number */}
                      {viewingCustomer.lastBillNumber && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Last Bill Number - </span>
                          <span className="text-gray-900 font-mono text-sm">{viewingCustomer.lastBillNumber}</span>
                        </div>
                      )}

                      {/* Last Bill Date */}
                      {viewingCustomer.lastBillDate && (
                        <div>
                          <span className="text-sm font-bold text-gray-800">Last Bill Date - </span>
                          <span className="text-gray-900">{formatDate(viewingCustomer.lastBillDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseViewModal();
                    handleEdit(viewingCustomer);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Edit Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
