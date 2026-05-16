import React, { useEffect, useState } from 'react';
import { CalendarPlus2, Clock3 } from 'lucide-react';
import CustomerPortalLayout from '../../components/CustomerPortalLayout';
import customerPortalService, { EyeTestBooking } from '../../services/customerPortalService';

const timeSlots = ['10:00 AM', '11:30 AM', '01:00 PM', '03:30 PM', '05:00 PM'];

const CustomerBookEyeTestPage: React.FC = () => {
  const [bookings, setBookings] = useState<EyeTestBooking[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    branchName: '',
    appointmentDate: '',
    timeSlot: timeSlots[0],
    concern: '',
    notes: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentBookings = customerPortalService.getBookings();
    setBookings(currentBookings);
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.branchName || !form.appointmentDate || !form.concern.trim()) {
      setMessage('Please choose a branch, appointment date, and concern.');
      return;
    }

    const booking = customerPortalService.saveBooking(form);
    setBookings((previous) => [...previous, booking].sort((left, right) => {
      return new Date(left.appointmentDate).getTime() - new Date(right.appointmentDate).getTime();
    }));
    setForm({
      branchName: '',
      appointmentDate: '',
      timeSlot: timeSlots[0],
      concern: '',
      notes: '',
    });
    setMessage('Eye test request submitted. The branch can confirm your slot next.');
  };

  return (
    <CustomerPortalLayout
      title="Book an Eye Test"
      description="Request your next eye exam with the branch and time window that works best for you."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <CalendarPlus2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Request a visit</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a branch, date, and what you want checked.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Branch</span>
              <select
                name="branchName"
                value={form.branchName}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
                <input
                  type="date"
                  name="appointmentDate"
                  value={form.appointmentDate}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Time slot</span>
                <select
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Concern</span>
              <input
                name="concern"
                value={form.concern}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Example: blurred distance vision, follow-up check, eye strain"
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
              <CalendarPlus2 className="h-4 w-4" />
              Submit booking request
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Upcoming and past requests</h2>
          <div className="mt-5 space-y-4">
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.branchName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(booking.appointmentDate).toLocaleDateString('en-IN')} ·{' '}
                      {booking.timeSlot}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {booking.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{booking.concern}</p>
                {booking.notes && <p className="mt-2 text-sm text-slate-500">{booking.notes}</p>}
              </article>
            ))}

            {bookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                No eye test requests submitted yet.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <Clock3 className="h-4 w-4 text-sky-700" />
              What happens next?
            </p>
            <p className="mt-2 leading-6">
              These requests are saved in your portal so you can track them here even before the appointment backend is added.
            </p>
          </div>
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerBookEyeTestPage;
