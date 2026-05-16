import React, { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService from '../../services/customerPortalService';
import { User } from '../../types/auth';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  preferredBranch: string;
  gender: string;
  city: string;
  dateOfBirth: string;
  anniversary: string;
  notes: string;
}

const emptyForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  preferredBranch: '',
  gender: '',
  city: '',
  dateOfBirth: '',
  anniversary: '',
  notes: '',
};

const CustomerProfilePage: React.FC = () => {
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadProfile = async () => {
      const context = await customerPortalService.getPortalContext();
      const user = context.user;
      const customer = context.customerRecord;

      if (!user) {
        return;
      }

      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || customer?.email || '',
        phone: user.phone || customer?.mobileNo || '',
        address: user.address || customer?.address || '',
        preferredBranch: user.preferredBranch || customer?.branchName || '',
        gender: user.gender || customer?.gender || '',
        city: user.city || customer?.city || '',
        dateOfBirth: user.dateOfBirth || customer?.dateOfBirth || '',
        anniversary: user.anniversary || customer?.anniversary || '',
        notes: user.notes || customer?.notes || '',
      });
    };

    loadProfile();
  }, []);

  const branchOptions = customerPortalService.getBranchOptions();

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const updates: Partial<User> = {
      ...form,
    };

    const result = await customerPortalService.saveProfile(updates);
    setMessage(result.message);
    setSaving(false);
  };

  return (
    <CustomerPortalLayout
      title="Profile & Preferences"
      description="Keep your contact details, preferred branch, and visit notes ready for your next purchase or eye test."
    >
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <UserRound className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">Your portal identity</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            We use these details to match your customer history, prescription records, and service requests.
          </p>

          <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>Keep the same email or phone number you use in-store for better history matching.</p>
            <p>Add your preferred branch so bookings and reorders go to the right team first.</p>
            <p>Profile updates save to your current session and update an existing customer record when one matches.</p>
          </div>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">First name</span>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Last name</span>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Preferred branch</span>
                <select
                  name="preferredBranch"
                  value={form.preferredBranch}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select branch</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Gender</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">City</span>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Date of birth</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Anniversary</span>
                <input
                  type="date"
                  name="anniversary"
                  value={form.anniversary}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
              <textarea
                name="address"
                rows={3}
                value={form.address}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Add anything useful for follow-ups, reminders, or vision preferences."
              />
            </label>

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving profile...' : 'Save profile'}
            </button>
          </form>
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerProfilePage;
