import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Receipt, Search } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { CustomerPortalBill } from '../../services/customerPortalService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value || 0);

const CustomerBillsPage: React.FC = () => {
  const [bills, setBills] = useState<CustomerPortalBill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadBills = async () => {
      const context = await customerPortalService.getPortalContext();
      setBills(context.bills);
    };

    loadBills();
  }, []);

  const filteredBills = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return bills;
    }

    return bills.filter((bill) => {
      return (
        bill.billNumber.toLowerCase().includes(normalizedSearch) ||
        bill.branchName.toLowerCase().includes(normalizedSearch) ||
        bill.products.some((product) => product.productName.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [bills, searchTerm]);

  return (
    <CustomerPortalLayout
      title="Bills & Invoice History"
      description="Review your saved invoices, product lines, payment snapshots, and branch-wise purchase history."
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Your saved bills</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search by bill number, branch, or product name.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Search your bills"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {filteredBills.map((bill) => {
            const isExpanded = expandedBillId === bill.id;

            return (
              <article key={bill.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                  className="flex w-full flex-col gap-4 px-6 py-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{bill.billNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {bill.branchName} · {new Date(bill.billDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(bill.finalPayable)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {bill.paymentStatus || 'Pending'}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 px-6 py-5">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Products
                        </h3>
                        <div className="mt-4 space-y-3">
                          {bill.products.map((product, index) => (
                            <div key={`${bill.id}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">{product.productName}</p>
                                  <p className="text-sm text-slate-500">
                                    {product.category}
                                    {product.description ? ` · ${product.description}` : ''}
                                  </p>
                                </div>
                                <div className="text-sm text-slate-600">
                                  Qty {product.quantity} · {formatCurrency(product.total)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl bg-slate-50 p-5">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Invoice snapshot
                        </h3>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                          <p>
                            <span className="font-medium text-slate-900">Customer:</span> {bill.customerName}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Contact:</span>{' '}
                            {bill.customerContact || 'Not available'}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Subtotal:</span>{' '}
                            {formatCurrency(bill.subtotal)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">GST:</span>{' '}
                            {formatCurrency(bill.totalGst)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Discount:</span>{' '}
                            {formatCurrency(bill.discount)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Advance paid:</span>{' '}
                            {formatCurrency(bill.advancePaid)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Final payable:</span>{' '}
                            {formatCurrency(bill.finalPayable)}
                          </p>
                          {bill.returnPolicy && (
                            <p>
                              <span className="font-medium text-slate-900">Return policy:</span>{' '}
                              {bill.returnPolicy}
                            </p>
                          )}
                          {bill.warrantyDetails && (
                            <p>
                              <span className="font-medium text-slate-900">Warranty:</span>{' '}
                              {bill.warrantyDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {filteredBills.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
              No matching bills were found for this account yet.
            </div>
          )}
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerBillsPage;
