import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, ShoppingBag } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { ContactLensReorder, CustomerPortalBillProduct } from '../../services/customerPortalService';

const CustomerContactLensReordersPage: React.FC = () => {
  const [products, setProducts] = useState<CustomerPortalBillProduct[]>([]);
  const [reorders, setReorders] = useState<ContactLensReorder[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    productName: '',
    lensPower: '',
    quantity: 1,
    preferredBranch: '',
    notes: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadData = async () => {
      const context = await customerPortalService.getPortalContext();
      const reorderableProducts = context.bills
        .flatMap((bill) => bill.products)
        .filter((product) => {
          const category = product.category.toLowerCase();
          const name = product.productName.toLowerCase();
          return category.includes('lens') || name.includes('lens');
        });

      setProducts(reorderableProducts);
      setReorders(customerPortalService.getReorders(context.user));
    };

    loadData();
  }, []);

  const uniqueProducts = useMemo(() => {
    const seen = new Map<string, CustomerPortalBillProduct>();
    products.forEach((product) => {
      if (!seen.has(product.productName)) {
        seen.set(product.productName, product);
      }
    });

    return Array.from(seen.values());
  }, [products]);

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
    if (!form.productName.trim() || !form.preferredBranch.trim()) {
      setMessage('Please choose a product and preferred branch.');
      return;
    }

    const reorder = customerPortalService.saveReorder(form);
    setReorders((previous) => [reorder, ...previous]);
    setForm({
      productName: '',
      lensPower: '',
      quantity: 1,
      preferredBranch: '',
      notes: '',
    });
    setMessage('Reorder request submitted. You can track it below.');
  };

  return (
    <CustomerPortalLayout
      title="Contact Lens Reorders"
      description="Quickly reorder your previous contact lens purchases or submit a custom lens repeat request."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Request a reorder</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a previously billed lens product or enter the details manually.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Product</span>
              <select
                name="productName"
                value={form.productName}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select product</option>
                {uniqueProducts.map((product) => (
                  <option key={product.productName} value={product.productName}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Lens power</span>
                <input
                  name="lensPower"
                  value={form.lensPower}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  placeholder="Example: -1.50"
                />
              </label>

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
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Preferred branch</span>
              <select
                name="preferredBranch"
                value={form.preferredBranch}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select branch</option>
                {customerPortalService.getBranchOptions().map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Add wear schedule, preferred brand, or pickup notes."
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
              <RefreshCcw className="h-4 w-4" />
              Submit reorder request
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Eligible past lens products</h2>
            <div className="mt-5 space-y-3">
              {uniqueProducts.map((product) => (
                <div key={product.productName} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{product.productName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.category} · Last billed quantity {product.quantity}
                  </p>
                </div>
              ))}

              {uniqueProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                  No past contact lens products were matched yet, but you can still submit a custom request.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Your reorder requests</h2>
            <div className="mt-5 space-y-4">
              {reorders.map((reorder) => (
                <div key={reorder.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{reorder.productName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty {reorder.quantity} · {reorder.preferredBranch}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                      {reorder.status}
                    </span>
                  </div>
                  {reorder.lensPower && (
                    <p className="mt-3 text-sm text-slate-600">Lens power: {reorder.lensPower}</p>
                  )}
                  {reorder.notes && <p className="mt-2 text-sm text-slate-500">{reorder.notes}</p>}
                </div>
              ))}

              {reorders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                  No reorder requests submitted yet.
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerContactLensReordersPage;
