import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, ClipboardPlus, FileText, Receipt, RotateCcw, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { CustomerPortalContext } from '../../services/customerPortalService';

const emptyContext: CustomerPortalContext = {
  user: null,
  customerRecord: null,
  bills: [],
  summary: {
    totalSpent: 0,
    totalBills: 0,
    totalVisits: 0,
    prescriptionsCount: 0,
    upcomingDeliveries: 0,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const CustomerDashboardPage: React.FC = () => {
  const [context, setContext] = useState<CustomerPortalContext>(emptyContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadPortal = async () => {
      setLoading(true);
      const portalContext = await customerPortalService.getPortalContext();
      setContext(portalContext);
      setLoading(false);
    };

    loadPortal();
  }, []);

  const returnRequests = customerPortalService.getReturnRequests(context.user);
  const bookings = customerPortalService.getBookings(context.user);
  const reorders = customerPortalService.getReorders(context.user);

  const statCards = [
    {
      label: 'Lifetime Spend',
      value: formatCurrency(context.summary.totalSpent),
      icon: Wallet,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Bills Saved',
      value: String(context.summary.totalBills),
      icon: Receipt,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Prescriptions',
      value: String(context.summary.prescriptionsCount),
      icon: ClipboardPlus,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Upcoming Deliveries',
      value: String(context.summary.upcomingDeliveries),
      icon: CalendarClock,
      tone: 'bg-violet-50 text-violet-700',
    },
  ];

  const quickLinks = [
    {
      to: '/customer/bills',
      title: 'Review my bills',
      description: 'See every saved invoice and payment snapshot.',
    },
    {
      to: '/customer/prescriptions',
      title: 'Check prescriptions',
      description: 'Open your latest optical details and delivery dates.',
    },
    {
      to: '/customer/returns',
      title: 'Request a return',
      description: 'Start a return request for a billed product.',
    },
    {
      to: '/customer/book-eye-test',
      title: 'Book an eye test',
      description: 'Reserve a visit with your preferred branch.',
    },
  ];

  return (
    <CustomerPortalLayout
      title={`Hello${context.user?.firstName ? `, ${context.user.firstName}` : ''}`}
      description="This is your customer hub for bills, prescriptions, returns, and service follow-ups."
    >
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading your customer dashboard...
        </div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`inline-flex rounded-2xl p-3 ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Recent billing activity</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your latest invoices and prescription-linked orders.
                  </p>
                </div>
                <Link
                  to="/customer/bills"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {context.bills.slice(0, 4).map((bill) => (
                  <div
                    key={bill.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{bill.billNumber}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {bill.branchName} · {new Date(bill.billDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-semibold text-slate-900">
                          {formatCurrency(bill.finalPayable)}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {bill.paymentStatus || 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {context.bills.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No billing history has been matched to this account yet.
                  </div>
                )}
              </div>
            </article>

            <div className="space-y-6">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Open requests</h2>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">Return requests</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{returnRequests.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">Eye test bookings</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{bookings.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">Reorder requests</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{reorders.length}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Customer card</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Email:</span>{' '}
                    {context.user?.email || 'Not available'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Phone:</span>{' '}
                    {context.user?.phone || context.customerRecord?.mobileNo || 'Not added yet'}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Preferred branch:</span>{' '}
                    {context.user?.preferredBranch || context.customerRecord?.branchName || 'Choose in profile'}
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-md"
              >
                <p className="text-lg font-semibold text-slate-900">{link.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{link.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </section>
        </div>
      )}
    </CustomerPortalLayout>
  );
};

export default CustomerDashboardPage;
