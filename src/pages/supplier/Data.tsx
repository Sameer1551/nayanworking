import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Archive, Database, Download, FileJson, FileSpreadsheet, RefreshCw, ShoppingBag, TrendingUp, Users, Trash2, X, Plus, Calendar, Shield } from 'lucide-react';
import { generateDailyStatementXLS, generateGSTOutputReportXLS, generateLensGridViewReportXLS } from '../../services/reportService';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import billingService, { BillingRecordDB } from '../../services/billingService';
import bulkPurchaseService, { BulkPurchaseData } from '../../services/bulkPurchaseService';
import customerService, { Customer } from '../../services/customerService';
import purchaseService, { PurchaseData } from '../../services/purchaseService';
import branchService, { Branch } from '../../services/branchService';

interface DataSnapshot {
  billingRecords: BillingRecordDB[];
  purchaseRecords: PurchaseData[];
  customerRecords: Customer[];
  bulkPurchaseRecords: BulkPurchaseData[];
}

interface DataSourceHealth {
  key: string;
  label: string;
  count: number;
  status: 'Connected' | 'Empty' | 'Unavailable';
  note: string;
}

interface RecentActivityItem {
  title: string;
  subtitle: string;
  date: string;
  timestamp: number;
}

const formatCount = (value: number) => value.toLocaleString('en-IN');

const formatDateTime = (value?: string) => {
  if (!value) return 'Date unavailable';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const DataPage: React.FC = () => {
  const [snapshot, setSnapshot] = useState<DataSnapshot>({
    billingRecords: [],
    purchaseRecords: [],
    customerRecords: [],
    bulkPurchaseRecords: [],
  });
  const [loading, setLoading] = useState(true);
  const user = authService.getUser();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '' });
  const [branchDeleting, setBranchDeleting] = useState<number | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchSaving, setBranchSaving] = useState(false);

  // Report download state
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [gstStartDate, setGstStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [gstEndDate, setGstEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reportLoading, setReportLoading] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleReport = async (type: 'daily' | 'gst' | 'lens') => {
    setReportLoading(type);
    setReportError(null);
    try {
      if (type === 'daily') await generateDailyStatementXLS(reportDate);
      else if (type === 'gst') await generateGSTOutputReportXLS(gstStartDate, gstEndDate);
      else await generateLensGridViewReportXLS();
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setReportError(`Failed to generate report: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setReportLoading(null);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    void loadSnapshot(true);
  }, []);

  const loadSnapshot = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [billingResult, purchaseResult, customerResult, bulkResult] = await Promise.allSettled([
        billingService.loadBillingRecordsFromDatabase(),
        purchaseService.getPurchaseRecords(),
        customerService.getAllCustomers(),
        bulkPurchaseService.getAllBulkPurchases(),
      ]);

      const nextSnapshot: DataSnapshot = {
        billingRecords: billingResult.status === 'fulfilled' ? billingResult.value : [],
        purchaseRecords: purchaseResult.status === 'fulfilled' ? purchaseResult.value : [],
        customerRecords: customerResult.status === 'fulfilled' ? customerResult.value : [],
        bulkPurchaseRecords: bulkResult.status === 'fulfilled' ? bulkResult.value : [],
      };

      setSnapshot(nextSnapshot);
      setLastUpdated(new Date().toISOString());

      const failedRequests = [billingResult, purchaseResult, customerResult, bulkResult]
        .filter(result => result.status === 'rejected')
        .length;

      setError(
        failedRequests > 0
          ? 'Some MySQL-backed data sources could not be loaded. Showing the records that are available.'
          : null
      );
    } catch (loadError) {
      console.error('Error loading data page snapshot:', loadError);
      setError('Unable to load data management details right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branchesData = await branchService.getAllBranches();
      setBranches(branchesData);
      setBranchError(null);
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranchError('Failed to load branches.');
    }
  };

  const openBranchModal = async () => {
    setShowBranchModal(true);
    setBranchError(null);
    setNewBranch({ name: '', code: '', address: '' });
    await loadBranches();
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.code.trim() || !newBranch.address.trim()) {
      setBranchError('All fields are required.');
      return;
    }
    setBranchSaving(true);
    setBranchError(null);
    try {
      const created = await branchService.createBranch({ ...newBranch, isActive: true });
      if (created) {
        setNewBranch({ name: '', code: '', address: '' });
        await loadBranches();
      } else {
        setBranchError('Failed to create branch. Please check the branch code is unique.');
      }
    } catch (error) {
      setBranchError('Failed to create branch. Please try again.');
    } finally {
      setBranchSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    setBranchDeleting(id);
    try {
      await branchService.deleteBranch(id);
      await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
    } finally {
      setBranchDeleting(null);
    }
  };

  const totalRecords = useMemo(
    () => snapshot.billingRecords.length
      + snapshot.purchaseRecords.length
      + snapshot.customerRecords.length
      + snapshot.bulkPurchaseRecords.length,
    [snapshot]
  );

  const dataHealth = useMemo<DataSourceHealth[]>(() => {
    const definitions = [
      {
        key: 'billing',
        label: 'Billing Records',
        count: snapshot.billingRecords.length,
        note: 'Loaded from the billing records table in MySQL.',
      },
      {
        key: 'purchase',
        label: 'Purchase Records',
        count: snapshot.purchaseRecords.length,
        note: 'Loaded from the purchases table in MySQL.',
      },
      {
        key: 'customer',
        label: 'Customer Records',
        count: snapshot.customerRecords.length,
        note: 'Loaded from the customers table in MySQL.',
      },
      {
        key: 'bulk-purchase',
        label: 'Bulk Purchase Records',
        count: snapshot.bulkPurchaseRecords.length,
        note: 'Loaded from the bulk purchase tables in MySQL.',
      },
    ];

    return definitions.map((item) => ({
      ...item,
      status: item.count > 0 ? 'Connected' : 'Empty',
    }));
  }, [snapshot]);

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    const billingActivity = snapshot.billingRecords
      .map((record, index) => {
        const billNumber = record.billNumber || `Invoice ${index + 1}`;
        const customerName = record.customerName || 'Customer';
        const date = record.createdAt || record.updatedAt || record.billDate || '';

        return {
          title: billNumber,
          subtitle: `Billing record for ${customerName}`,
          date,
          timestamp: date ? new Date(date).getTime() : 0,
        };
      });

    const purchaseActivity = snapshot.purchaseRecords
      .map((record, index) => {
        const billNo = record.purchaseBillNo || `Purchase ${index + 1}`;
        const material = record.materialName || 'Material';
        const date = record.purchaseDate || '';

        return {
          title: billNo,
          subtitle: `Purchase entry for ${material}`,
          date,
          timestamp: date ? new Date(date).getTime() : 0,
        };
      });

    const customerActivity = snapshot.customerRecords
      .map((record, index) => {
        const fullName = record.fullName || `Customer ${index + 1}`;
        const branch = record.branchName || 'Unknown branch';
        const date = record.createdAt || record.dateOfVisit || '';

        return {
          title: fullName,
          subtitle: `Customer record from ${branch}`,
          date,
          timestamp: date ? new Date(date).getTime() : 0,
        };
      });

    return [...billingActivity, ...purchaseActivity, ...customerActivity]
      .filter((item) => item.timestamp > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [snapshot]);

  const handleExport = (type: 'billing' | 'purchase' | 'customer' | 'combined') => {
    if (type === 'billing') {
      downloadJson('billing-records-export.json', snapshot.billingRecords);
      return;
    }

    if (type === 'purchase') {
      downloadJson('purchase-records-export.json', {
        purchases: snapshot.purchaseRecords,
        bulkPurchases: snapshot.bulkPurchaseRecords,
      });
      return;
    }

    if (type === 'customer') {
      downloadJson('customer-records-export.json', snapshot.customerRecords);
      return;
    }

    downloadJson('data-backup-export.json', {
      exportedAt: new Date().toISOString(),
      billingRecords: snapshot.billingRecords,
      purchaseRecords: snapshot.purchaseRecords,
      bulkPurchaseRecords: snapshot.bulkPurchaseRecords,
      customerRecords: snapshot.customerRecords,
      sourceOfTruth: 'MySQL',
    });
  };

  const summaryCards = [
    {
      label: 'Total Data Records',
      value: formatCount(totalRecords),
      helper: 'Across billing, purchase, customer, and bulk purchase data',
      icon: Database,
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      label: 'Sales Records',
      value: formatCount(snapshot.billingRecords.length),
      helper: 'Invoices mirrored into billing records',
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Purchase Records',
      value: formatCount(snapshot.purchaseRecords.length + snapshot.bulkPurchaseRecords.length),
      helper: `${formatCount(snapshot.bulkPurchaseRecords.length)} bulk entries included`,
      icon: ShoppingBag,
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Customer Records',
      value: formatCount(snapshot.customerRecords.length),
      helper: 'Registered customer profiles',
      icon: Users,
      tone: 'bg-violet-50 text-violet-700 border-violet-200',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-800">Loading Data Management</h1>
            <p className="mt-2 text-gray-500">Gathering MySQL record counts, table health, and recent activity.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 bg-gray-50 min-h-screen">
      <div className="w-full">
        <div className="mb-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Supplier Data Hub</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Data Management</h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                Monitor MySQL-backed record health, export snapshots, and quickly spot the latest billing, purchase, and customer activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void loadSnapshot()}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <Link
                to="/supplier/inventory"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                <Archive className="h-4 w-4" />
                Inventory
              </Link>
              <Link
                to="/supplier/billing-records"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                <FileJson className="h-4 w-4" />
                Sales Records
              </Link>
              {user?.userType === 'admin' && (
                <Link
                  to="/supplier/admin-suppliers"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 border border-red-200"
                >
                  <Shield className="h-4 w-4" />
                  Manage Suppliers
                </Link>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Last updated: {lastUpdated ? formatDateTime(lastUpdated) : 'Not refreshed yet'}</span>
            <span>Source of truth: MySQL database</span>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}
        </div>

        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                  </div>
                  <div className={`rounded-xl border p-2 ${card.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-2 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data Health</h2>
                <p className="text-sm text-gray-500">Database-backed record counts for the main data sources.</p>
              </div>
              <Database className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Backed By</th>
                    <th className="pb-3 font-medium">Records</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHealth.map((item) => (
                    <tr key={item.key} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-4 font-medium text-gray-800">{item.label}</td>
                      <td className="py-4 text-gray-500">{item.note}</td>
                      <td className="py-4 text-gray-700">{formatCount(item.count)}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Connected'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'Empty'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export & Backup */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Export &amp; Backup</h2>
                <p className="text-sm text-gray-500">Download JSON snapshots for review, migration, or safekeeping.</p>
              </div>
              <Download className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('billing')}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span>
                  <span className="block font-semibold text-gray-800">Export Billing Data</span>
                  <span className="text-sm text-gray-500">{formatCount(snapshot.billingRecords.length)} records</span>
                </span>
                <Download className="h-4 w-4 text-emerald-600" />
              </button>

              <button
                onClick={() => handleExport('purchase')}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span>
                  <span className="block font-semibold text-gray-800">Export Purchase Data</span>
                  <span className="text-sm text-gray-500">
                    {formatCount(snapshot.purchaseRecords.length + snapshot.bulkPurchaseRecords.length)} records
                  </span>
                </span>
                <Download className="h-4 w-4 text-emerald-600" />
              </button>

              <button
                onClick={() => handleExport('customer')}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span>
                  <span className="block font-semibold text-gray-800">Export Customer Data</span>
                  <span className="text-sm text-gray-500">{formatCount(snapshot.customerRecords.length)} records</span>
                </span>
                <Download className="h-4 w-4 text-emerald-600" />
              </button>

                <button
                  onClick={() => handleExport('combined')}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left transition-colors hover:bg-emerald-100"
                >
                  <span>
                    <span className="block font-semibold text-emerald-900 italic">Export Full Backup</span>
                    <span className="text-xs text-emerald-700">Everything loaded on this page in one file</span>
                  </span>
                  <Download className="h-4 w-4 text-emerald-700" />
                </button>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-2 text-xs text-slate-600">
              Exports are generated in the browser from the latest fetched records, so refreshing first gives you the most current snapshot.
            </div>
          </div>
        </div>

        {/* ── XLS Report Downloads ── */}
        <div className="mb-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Formatted Reports</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Download XLS Reports</h2>
              <p className="mt-0.5 text-sm text-gray-500">Generate professional Excel reports from live database records — identical to the official Nayana Eye Care report format.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            </div>
          </div>

          {reportError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{reportError}</div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Daily Statement */}
            <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <FileSpreadsheet className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Daily Statement</p>
                  <p className="mt-0.5 text-xs text-gray-500">Payment collections, advance & settled orders, payment summary, and sales summary for a single day.</p>
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Report Date</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    id="report-daily-date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
              <button
                id="btn-download-daily-statement"
                onClick={() => void handleReport('daily')}
                disabled={reportLoading === 'daily'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {reportLoading === 'daily' ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Download className="h-4 w-4" /> Download Daily Statement</>   
                )}
              </button>
            </div>

            {/* GST Output Report */}
            <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <FileSpreadsheet className="h-4 w-4 text-violet-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">GST Output Report</p>
                  <p className="mt-0.5 text-xs text-gray-500">Line-item breakdown with HSN codes, SGST/CGST/IGST calculation, and net tax amounts for a date range.</p>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">From Date</label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="report-gst-start"
                      value={gstStartDate}
                      onChange={e => setGstStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">To Date</label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      id="report-gst-end"
                      value={gstEndDate}
                      min={gstStartDate}
                      onChange={e => setGstEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              </div>
              <button
                id="btn-download-gst-report"
                onClick={() => void handleReport('gst')}
                disabled={reportLoading === 'gst'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {reportLoading === 'gst' ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Download className="h-4 w-4" /> Download GST Output Report</>
                )}
              </button>
            </div>

            {/* Lens Grid View */}
            <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <FileSpreadsheet className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Lens Grid View Report</p>
                  <p className="mt-0.5 text-xs text-gray-500">Current lens inventory displayed as a SPH × CYL grid showing stock quantities across all power combinations.</p>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Snapshot of current lens inventory — no date filter required.</span>
              </div>
              <button
                id="btn-download-lens-grid"
                onClick={() => void handleReport('lens')}
                disabled={reportLoading === 'lens'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {reportLoading === 'lens' ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Download className="h-4 w-4" /> Download Lens Grid View</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-500">Latest saved records across sales, purchases, and customers.</p>
              </div>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>

            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={`${item.title}-${item.timestamp}`} className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{item.subtitle}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(item.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 p-4 text-center">
                <Activity className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="font-medium text-gray-700 text-sm">No recent activity found</p>
                <p className="mt-1 text-xs text-gray-500">Add billing, purchase, or customer records to populate this section.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500">Jump to the screens where records are created and reviewed.</p>
              </div>
              <FileJson className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link to="/supplier/billing" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Create Billing</p>
                <p className="mt-0.5 text-xs text-gray-500">Add a new invoice and mirror it into billing records.</p>
              </Link>
              <Link to="/supplier/purchase" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Record Purchase</p>
                <p className="mt-0.5 text-xs text-gray-500">Add single-item purchase entries to your data set.</p>
              </Link>
              <Link to="/supplier/bulk-purchase" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Bulk Purchase</p>
                <p className="mt-0.5 text-xs text-gray-500">Capture multi-item stock arrivals in one flow.</p>
              </Link>
              <Link to="/supplier/customers" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Manage Customers</p>
                <p className="mt-0.5 text-xs text-gray-500">Review profiles, visits, and customer database entries.</p>
              </Link>
              <Link to="/supplier/purchase-history" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Purchase History</p>
                <p className="mt-0.5 text-xs text-gray-500">Inspect and edit the purchase records behind this summary.</p>
              </Link>
              <Link to="/supplier/billing-records" className="rounded-xl border border-gray-200 p-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50">
                <p className="font-semibold text-gray-800 text-sm">Sales History</p>
                <p className="mt-0.5 text-xs text-gray-500">Open billing records to audit invoice-level sales data.</p>
              </Link>
              <button
                onClick={() => void openBranchModal()}
                className="rounded-xl border border-gray-200 p-2 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
              >
                <p className="font-semibold text-emerald-700 text-sm">Manage Branch Network</p>
                <p className="mt-0.5 text-xs text-gray-500">Add, edit, or remove branches from the network.</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Management Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowBranchModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Branch Network</h2>
                <p className="mt-0.5 text-sm text-gray-500">Add new branches or remove existing ones from the network.</p>
              </div>
              <button
                onClick={() => setShowBranchModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Add Branch Form */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-emerald-800 uppercase tracking-wide">Add New Branch</h3>
                <form onSubmit={(e) => void handleAddBranch(e)} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <input
                    type="text"
                    placeholder="Branch name (e.g. Junglighat)"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. JUNG)"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:col-span-2"
                  />
                  {branchError && (
                    <p className="text-xs text-red-600 sm:col-span-4">{branchError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={branchSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:col-span-4"
                  >
                    <Plus className="h-4 w-4" />
                    {branchSaving ? 'Adding...' : 'Add Branch'}
                  </button>
                </form>
              </div>

              {/* Branch Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-3 py-3 font-semibold text-gray-600">Branch Name</th>
                      <th className="px-3 py-3 font-semibold text-gray-600">Code</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 hidden sm:table-cell">Address</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-400">No branches found.</td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr key={branch.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-800">{branch.name}</td>
                          <td className="px-3 py-3 font-mono text-xs text-gray-500">{branch.code}</td>
                          <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">{branch.address}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => branch.id != null && void handleDeleteBranch(branch.id)}
                              disabled={branchDeleting === branch.id}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {branchDeleting === branch.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPage;


