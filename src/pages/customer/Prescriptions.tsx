import React, { useEffect, useMemo, useState } from 'react';
import { Glasses, NotebookTabs } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { CustomerPortalBill } from '../../services/customerPortalService';

const prescriptionValue = (value?: string) => value || 'N/A';

const CustomerPrescriptionsPage: React.FC = () => {
  const [bills, setBills] = useState<CustomerPortalBill[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadPrescriptions = async () => {
      const context = await customerPortalService.getPortalContext();
      setBills(context.bills);
    };

    loadPrescriptions();
  }, []);

  const prescriptionBills = useMemo(
    () =>
      bills.filter((bill) =>
        Object.values(bill.prescription).some((value) => !!value)
      ),
    [bills]
  );

  const latestPrescription = prescriptionBills[0];

  return (
    <CustomerPortalLayout
      title="Prescription History"
      description="View your saved optical powers, pupillary distance, notes, and delivery dates from past bills."
    >
      <div className="space-y-6">
        {latestPrescription && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">
                  Latest prescription
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {latestPrescription.billNumber}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {latestPrescription.branchName} ·{' '}
                  {new Date(latestPrescription.billDate).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Delivery date:{' '}
                <span className="font-semibold">
                  {latestPrescription.prescriptionDeliveryDate
                    ? new Date(latestPrescription.prescriptionDeliveryDate).toLocaleDateString('en-IN')
                    : 'Not specified'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Right Eye</p>
                <p className="mt-3 text-sm text-slate-700">
                  SPH {prescriptionValue(latestPrescription.prescription.sphRight)} · CYL{' '}
                  {prescriptionValue(latestPrescription.prescription.cylRight)} · AXIS{' '}
                  {prescriptionValue(latestPrescription.prescription.axisRight)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Left Eye</p>
                <p className="mt-3 text-sm text-slate-700">
                  SPH {prescriptionValue(latestPrescription.prescription.sphLeft)} · CYL{' '}
                  {prescriptionValue(latestPrescription.prescription.cylLeft)} · AXIS{' '}
                  {prescriptionValue(latestPrescription.prescription.axisLeft)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lens Power</p>
                <p className="mt-3 text-sm text-slate-700">
                  R {prescriptionValue(latestPrescription.prescription.lensPowerRight)} · L{' '}
                  {prescriptionValue(latestPrescription.prescription.lensPowerLeft)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">PD</p>
                <p className="mt-3 text-sm text-slate-700">
                  Total {prescriptionValue(latestPrescription.prescription.pd)} · R{' '}
                  {prescriptionValue(latestPrescription.prescription.pdRight)} · L{' '}
                  {prescriptionValue(latestPrescription.prescription.pdLeft)}
                </p>
              </div>
            </div>

            {latestPrescription.prescription.additionalNotes && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <span className="font-semibold">Notes:</span>{' '}
                {latestPrescription.prescription.additionalNotes}
              </div>
            )}
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          {prescriptionBills.map((bill) => (
            <article key={bill.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <Glasses className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{bill.billNumber}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {bill.branchName} · {new Date(bill.billDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {bill.prescriptionDeliveryDate ? 'Delivery tracked' : 'Prescription saved'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-medium text-slate-900">Right Eye</p>
                  <p className="mt-2">SPH {prescriptionValue(bill.prescription.sphRight)}</p>
                  <p>CYL {prescriptionValue(bill.prescription.cylRight)}</p>
                  <p>AXIS {prescriptionValue(bill.prescription.axisRight)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-medium text-slate-900">Left Eye</p>
                  <p className="mt-2">SPH {prescriptionValue(bill.prescription.sphLeft)}</p>
                  <p>CYL {prescriptionValue(bill.prescription.cylLeft)}</p>
                  <p>AXIS {prescriptionValue(bill.prescription.axisLeft)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                  PD {prescriptionValue(bill.prescription.pd)}
                </span>
                {bill.prescriptionDeliveryDate && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                    Delivery {new Date(bill.prescriptionDeliveryDate).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>

              {bill.prescription.additionalNotes && (
                <div className="mt-4 rounded-2xl border border-slate-200 px-4 py-4 text-sm text-slate-600">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    <NotebookTabs className="h-4 w-4 text-sky-700" />
                    Notes
                  </p>
                  <p className="mt-2 leading-6">{bill.prescription.additionalNotes}</p>
                </div>
              )}
            </article>
          ))}

          {prescriptionBills.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
              No prescription entries have been matched to this account yet.
            </div>
          )}
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerPrescriptionsPage;
