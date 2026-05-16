import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, HeartHandshake, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

interface CustomerAuthPageProps {
  mode: 'login' | 'register';
}

const CustomerAuthPage: React.FC<CustomerAuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'register'>(mode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    agreeToTerms: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  useEffect(() => {
    const user = authService.getUser();
    if (authService.isAuthenticated() && user?.userType === 'customer') {
      navigate('/customer/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (authMode === 'register') {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return 'Please enter your full name.';
      }
      if (!formData.email.trim() || !formData.phone.trim()) {
        return 'Email and phone number are required.';
      }
      if (!formData.address.trim()) {
        return 'Address is required for customer registration.';
      }
      if (formData.password.length < 6) {
        return 'Password must be at least 6 characters.';
      }
      if (formData.password !== formData.confirmPassword) {
        return 'Passwords do not match.';
      }
      if (!formData.agreeToTerms) {
        return 'Please accept the terms to continue.';
      }
      return '';
    }

    if (loginMethod === 'email' && !formData.email.trim()) {
      return 'Please enter your email address.';
    }
    if (loginMethod === 'phone' && !formData.phone.trim()) {
      return 'Please enter your phone number.';
    }
    if (!formData.password.trim()) {
      return 'Please enter your password.';
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (authMode === 'register') {
        const result = await authService.signup({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: 'customer',
          address: formData.address,
          agreeToTerms: formData.agreeToTerms,
        });

        if (!result.token) {
          setError(result.message || 'Registration failed.');
          return;
        }
      } else {
        const result = await authService.login({
          email: loginMethod === 'email' ? formData.email : '',
          phone: loginMethod === 'phone' ? formData.phone : '',
          password: formData.password,
          userType: 'customer',
          method: loginMethod,
        });

        if (!result.token) {
          setError(result.message || 'Login failed.');
          return;
        }
      }

      navigate('/customer/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff,_#f8fafc_35%,_#ffffff)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
        <section className="rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_38%),linear-gradient(160deg,_#082f49,_#0f766e_62%,_#e0f2fe_62%,_#f8fafc)] p-8 text-white shadow-xl sm:p-10">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
            Nayan Eye Care
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Your eye-care history, prescriptions, and follow-ups in one place.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-sky-100 sm:text-base">
            Use the customer portal to review bills, keep prescriptions handy, request returns,
            and book your next eye test without calling the store every time.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
              <p className="mt-3 text-sm font-semibold">Secure account access</p>
              <p className="mt-1 text-xs text-sky-100">Use email or phone login for your saved records.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <p className="mt-3 text-sm font-semibold">Prescription ready</p>
              <p className="mt-1 text-xs text-sky-100">Track lens powers, delivery dates, and service notes.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <HeartHandshake className="h-5 w-5 text-cyan-200" />
              <p className="mt-3 text-sm font-semibold">Service requests</p>
              <p className="mt-1 text-xs text-sky-100">Start returns, eye-test bookings, and repeat orders quickly.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">
                Customer Portal
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
            </div>

            <div className="rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </div>
          </div>

          <div className="mt-8 flex rounded-full bg-slate-100 p-1">
            <Link
              to="/customer/login"
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Login
            </Link>
            <Link
              to="/customer/register"
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </Link>
          </div>

          {authMode === 'login' && (
            <div className="mt-6 flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                  loginMethod === 'phone'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Phone Login
              </button>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {authMode === 'register' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">First name</span>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Siddh"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Last name</span>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Kumar"
                  />
                </label>
              </div>
            )}

            {(authMode === 'register' || loginMethod === 'email') && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-transparent px-3 py-3 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </label>
            )}

            {(authMode === 'register' || loginMethod === 'phone') && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone number</span>
                <div className="flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-transparent px-3 py-3 outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </label>
            )}

            {authMode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
                <div className="flex items-start rounded-2xl border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                  <MapPin className="mt-3 h-4 w-4 text-slate-400" />
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full resize-none bg-transparent px-3 py-3 outline-none"
                    placeholder="House, locality, city"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-transparent py-3 outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {authMode === 'register' && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                  <div className="flex items-center rounded-2xl border border-slate-200 px-4 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-transparent py-3 outline-none"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="text-slate-400 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  I agree to the portal terms, prescription handling policy, and privacy practices.
                </label>
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Please wait...' : authMode === 'login' ? 'Open My Dashboard' : 'Create My Account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default CustomerAuthPage;
