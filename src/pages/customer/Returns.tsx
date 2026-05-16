import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Send } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { CustomerPortalBill, CustomerReturnRequest } from '../../services/customerPortalService';

const CustomerReturnsPage: React.FC = () => {
  const [bills, setBills] = useState<CustomerPortalBill[]>([]);
  const [requests, setRequests] = useState<CustomerReturnRequest[]>([]);
  const [form, setForm] = useState({
    billNumber: '',
    productName: '',
    quantity: 1,
    reason: '',
    preferredResolution: 'Exchange',
    notes: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadData = async () => {
      const context = await customerPortalService.getPortalContext();
      setBills(context.bills);
      setRequests(customerPortalService.getReturnRequests(context.user));
    };

    loadData();
  }, []);

  const selectedBill = useMemo(
    () => bills.find((bill) => bill.billNumber === form.billNumber) || null,
    [bills, form.billNumber]
  );

  const availableProducts = selectedBill?.products || [];

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.billNumber || !form.productName || !form.reason.trim()) {
      setMessage('Please fill in the bill, product, and reason.');
      return;
    }

    const createdRequest = customerPortalService.saveReturnRequest({
      billNumber: form.billNumber,
      productName: form.productName,
      quantity: form.quantity,
      reason: form.reason,
      preferredResolution: form.preferredResolution,
      notes: form.notes,
    });

    setRequests((previous) => [createdRequest, ...previous]);
    setForm({
      billNumber: '',
      productName: '',
      quantity: 1,
      reason: '',
      preferredResolution: 'Exchange',
      notes: '',
    });
    setMessage('Return request submitted. The store team can now review it.');
  };

  return (
    <CustomerPortalLayout
      title="Returns & Service Requests"
      description="Start a return request for an existing bill and keep track of what you have already submitted."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Create a return request</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose the original bill and tell us what should happen next.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Bill number</span>
              <select
                name="billNumber"
                value={form.billNumber}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select a bill</option>
                {bills.map((bill) => (
                  <option key={bill.id} value={bill.billNumber}>
                    {bill.billNumber} · {bill.branchName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Product</span>
              <select
                name="productName"
                value={form.productName}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select a product</option>
                {availableProducts.map((product, index) => (
                  <option key={`${product.productName}-${index}`} value={product.productName}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Quantity</span>
                <input
                  type="number"
                  min={1}
                  name="quantity"
                  value={form.quantity}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Preferred resolution</span>
                <select
                  name="preferredResolution"
                  value={form.preferredResolution}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="Exchange">Exchange</option>
                  <option value="Store Credit">Store Credit</option>
                  <option value="Repair">Repair</option>
                  <option value="Refund Review">Refund Review</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Reason</span>
              <textarea
                name="reason"
                rows={3}
                value={form.reason}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Example: frame fit issue, lens issue, wrong power, damaged item"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Additional notes</span>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              Submit request
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Your submitted requests</h2>
          <div className="mt-5 space-y-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {request.productName} · {request.billNumber}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.reason} · Qty {request.quantity}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {request.status}
                  </span>
                </div>
                {request.notes && <p className="mt-3 text-sm text-slate-600">{request.notes}</p>}
              </article>
            ))}

            {requests.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                You have not submitted any return requests yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerReturnsPage;
