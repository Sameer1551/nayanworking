import React, { useEffect, useState } from 'react';
import { Shield, Building2, Mail, Phone, Hash, Trash2, PowerOff, Power, Plus, X, Lock, MapPin } from 'lucide-react';
import adminService, { AdminSupplierData } from '../../services/adminService';
import authService from '../../services/authService';
import { Navigate } from 'react-router-dom';

const AdminSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<AdminSupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    gstNumber: '',
    businessAddress: '',
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError('Failed to fetch suppliers. Please ensure you are logged in as Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        if (!window.confirm('Are you sure you want to deactivate this supplier? They will not be able to log in.')) return;
        await adminService.deactivateSupplier(id);
      } else {
        await adminService.reactivateSupplier(id);
      }
      // Refresh list
      fetchSuppliers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete supplier ${name}? This action cannot be undone.`)) {
      try {
        await adminService.deleteSupplier(id);
        fetchSuppliers();
      } catch (err) {
        alert('Failed to delete supplier');
      }
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);
      await adminService.createSupplier(newSupplier);
      setShowAddModal(false);
      setNewSupplier({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        companyName: '',
        gstNumber: '',
        businessAddress: '',
      });
      fetchSuppliers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUser = authService.getUser();
  if (currentUser?.userType !== 'admin') {
    return <Navigate to="/supplier/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-red-100 rounded-lg text-red-600">
                  <Shield className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Portal: Manage Suppliers</h1>
              </div>
              <p className="text-gray-600">Global overview and management of all registered suppliers in the platform.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Supplier</span>
            </button>
          </div>


        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Registered Suppliers ({suppliers.length})</h2>
            <button
              onClick={fetchSuppliers}
              className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Key
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No suppliers registered yet.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{supplier.companyName || 'Not Provided'}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              GST: {supplier.gstNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.firstName} {supplier.lastName}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                          <Mail className="h-3 w-3" /> <span>{supplier.email}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                          <Phone className="h-3 w-3" /> <span>{supplier.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {supplier.uniqueSupplierKey || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleToggleStatus(supplier.id, supplier.isActive)}
                            className={`${supplier.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} transition-colors flex items-center`}
                            title={supplier.isActive ? "Deactivate Supplier" : "Reactivate Supplier"}
                          >
                            {supplier.isActive ? <PowerOff className="h-4 w-4 mr-1" /> : <Power className="h-4 w-4 mr-1"/>}
                            {supplier.isActive ? "Deactivate" : "Activate"}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(supplier.id, supplier.companyName || supplier.firstName)}
                            className="text-red-600 hover:text-red-900 transition-colors flex items-center"
                            title="Delete Supplier (DANGER)"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Supplier</h2>
                    <p className="text-sm text-gray-500">Register a new business account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-supplier-form" onSubmit={handleAddSupplier} className="space-y-6">
                  {formError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">First Name</label>
                      <input
                        required
                        type="text"
                        placeholder="John"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                        value={newSupplier.firstName}
                        onChange={e => setNewSupplier({ ...newSupplier, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Last Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Doe"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                        value={newSupplier.lastName}
                        onChange={e => setNewSupplier({ ...newSupplier, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          required
                          type="email"
                          placeholder="john@example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                          value={newSupplier.email}
                          onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          required
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                          value={newSupplier.phone}
                          onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-100 pt-6">
                    <label className="text-sm font-bold text-gray-700">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Nayan Optics Pvt Ltd"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm font-medium transition-all"
                        value={newSupplier.companyName}
                        onChange={e => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">GST Number</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          required
                          type="text"
                          placeholder="27AAAAA0000A1Z5"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm font-mono transition-all"
                          value={newSupplier.gstNumber}
                          onChange={e => setNewSupplier({ ...newSupplier, gstNumber: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          required
                          type="password"
                          placeholder="Set account password"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                          value={newSupplier.password}
                          onChange={e => setNewSupplier({ ...newSupplier, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Business Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        required
                        rows={3}
                        placeholder="Complete business address..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 text-sm transition-all"
                        value={newSupplier.businessAddress}
                        onChange={e => setNewSupplier({ ...newSupplier, businessAddress: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  form="add-supplier-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Register Supplier</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminSuppliersPage;
