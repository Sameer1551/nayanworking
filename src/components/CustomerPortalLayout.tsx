import React from 'react';
import { CalendarDays, ClipboardList, FileText, HeartPulse, LayoutDashboard, RotateCcw, CircleUser as UserCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';

interface CustomerPortalLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

const navItems = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/profile', label: 'Profile', icon: UserCircle2 },
    { to: '/customer/bills', label: 'Bills', icon: FileText },
    { to: '/customer/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { to: '/customer/returns', label: 'Returns', icon: RotateCcw },
    { to: '/customer/book-eye-test', label: 'Eye Test', icon: HeartPulse },
    { to: '/customer/contact-lens-reorders', label: 'Reorders', icon: CalendarDays },
];

const CustomerPortalLayout: React.FC<CustomerPortalLayoutProps> = ({
    title,
    description,
    children,
}) => {
    const location = useLocation();
    const user = authService.getUser();

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,_#eff6ff,_#f8fafc_48%,_#ecfeff)]">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="mb-3 inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                                Customer Portal
                            </p>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                {description}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-slate-600">{user?.email || 'Customer account'}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.to;

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
    );
};

export default CustomerPortalLayout;
