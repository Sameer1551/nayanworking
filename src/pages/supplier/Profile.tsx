import React, { useEffect, useState } from 'react';
import { Save, UserCircle, Building2, CreditCard, MapPin, Phone, Mail } from 'lucide-react';
import authService from '../../services/authService';
import { User } from '../../types/auth';
import { API_BASE_URL } from '../../config/apiConfig';


interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  gstNumber: string;
  businessAddress: string;
  address: string;
}

const emptyForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  gstNumber: '',
  businessAddress: '',
  address: '',
};

const PHONE_REGEX = /^[6-9]\d{9}$/;
const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const SupplierProfilePage: React.FC = () => {
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[k: string]: string}>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadProfile = async () => {
      // First seed form with whatever is cached in localStorage
      const cachedUser = authService.getUser();
      if (!cachedUser || cachedUser.userType !== 'supplier') return;

      setForm({
        firstName: cachedUser.firstName || '',
        lastName: cachedUser.lastName || '',
        email: cachedUser.email || '',
        phone: cachedUser.phone || '',
        companyName: cachedUser.companyName || '',
        gstNumber: cachedUser.gstNumber || '',
        businessAddress: cachedUser.businessAddress || '',
        address: cachedUser.address || '',
      });

      // Then fetch fresh data from the backend to ensure supplier-specific
      // fields (companyName, gstNumber, businessAddress) are always up to date
      try {
        const token = authService.getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'GET',
          headers: authService.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            companyName: data.companyName || '',
            gstNumber: data.gstNumber || '',
            businessAddress: data.businessAddress || '',
            address: data.address || '',
          });
        }
      } catch (err) {
        console.warn('Profile: could not refresh from backend, using cached data', err);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    // Validate phone and GST before saving
    const errs: {[k: string]: string} = {};
    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (form.gstNumber && !GST_REGEX.test(form.gstNumber.trim())) {
      errs.gstNumber = 'Enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setSaving(false);
      return;
    }
    setFieldErrors({});

    const updates: Partial<User> = { ...form };
    const result = await authService.saveProfile(updates);
    
    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.message);
    }
    
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-3">
      <div className="w-full px-3">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Supplier Profile</h1>
          <p className="text-sm text-gray-600">Manage your business identity and contact information.</p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_3fr]">
          {/* Sidebar Info */}
          <aside className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <UserCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Business Identity</h2>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                These details are used for billing records, tax compliance, and official communications within the Nayan Eye Care network.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{form.companyName || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span>GST: {form.gstNumber || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-xl p-4 text-white shadow-md">
              <h3 className="font-bold text-sm mb-1.5">Professional Account</h3>
              <p className="text-emerald-50 text-xs leading-relaxed">
                As a supplier, your profile matches your business license. Ensure your GST number is accurate for valid input tax credit operations.
              </p>
            </div>
          </aside>

          {/* Main Form */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Section */}
              <section>
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                  Personal Information
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block">First Name</span>
                    <div className="relative">
                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Last Name</span>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email Address
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      disabled
                      className="w-full bg-gray-100 border-0 rounded-xl px-4 py-2 text-gray-500 cursor-not-allowed font-medium text-sm"
                    />
                    <span className="text-[9px] text-gray-400 mt-0.5 block">Email cannot be changed</span>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone Number
                    </span>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className={`w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-sm ${fieldErrors.phone ? 'ring-2 ring-red-400' : ''}`}
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Personal Address
                    </span>
                    <textarea
                      name="address"
                      rows={2}
                      value={form.address}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none text-sm"
                    />
                  </label>
                </div>
              </section>

              {/* Business Section */}
              <section>
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                  Business Information
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block">Company Name</span>
                    <input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-base"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block">GST Number</span>
                    <input
                      name="gstNumber"
                      value={form.gstNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className={`w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium tracking-wider text-sm ${fieldErrors.gstNumber ? 'ring-2 ring-red-400' : ''}`}
                    />
                    {fieldErrors.gstNumber && <p className="text-xs text-red-500 mt-1">{fieldErrors.gstNumber}</p>}
                  </label>
                  <div className="hidden md:block"></div> {/* Spacer */}
                  <label className="block md:col-span-2">
                    <span className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Business Address
                    </span>
                    <textarea
                      name="businessAddress"
                      rows={3}
                      value={form.businessAddress}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-0 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none text-sm"
                    />
                  </label>
                </div>
              </section>

              {message && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl px-6 py-2.5 font-bold text-base hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:bg-emerald-300 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfilePage;
