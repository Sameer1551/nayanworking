import React, { useState } from 'react';
import { X, User, Building, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'customer' | 'supplier';
  onAuthSuccess: () => void;
}

const LoginModal = ({ isOpen, onClose, type, onAuthSuccess }: LoginModalProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecondaryPassword, setShowSecondaryPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    phone: '',
    password: '',
    secondaryPassword: '',
    // Signup fields
    firstName: '',
    lastName: '',
    confirmPassword: '',
    address: '',
    // Supplier specific fields
    companyName: '',
    gstNumber: '',
    businessAddress: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
      password: '',
      secondaryPassword: '',
      firstName: '',
      lastName: '',
      confirmPassword: '',
      address: '',
      // Supplier specific fields
      companyName: '',
      gstNumber: '',
      businessAddress: '',
      agreeToTerms: false
    });
    setErrors({});
    setShowPassword(false);
    setShowSecondaryPassword(false);
    setShowConfirmPassword(false);
    setIsAdminMode(false);
  };

  const handleModeChange = (newMode: 'login' | 'signup') => {
    if (type === 'supplier' && newMode === 'signup') return;
    setMode(newMode);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Regex patterns
    const PHONE_REGEX = /^[6-9]\d{9}$/;           // Indian 10-digit mobile
    const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i; // GSTIN format

    if (mode === 'signup') {
      // Common validation for both customer and supplier
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!PHONE_REGEX.test(formData.phone.trim())) newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';

      // Supplier specific validation
      if (type === 'supplier') {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.gstNumber.trim()) newErrors.gstNumber = 'GST number is required';
        else if (!GST_REGEX.test(formData.gstNumber.trim())) newErrors.gstNumber = 'Enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)';
        if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
      } else {
        // Customer specific validation
        if (!formData.address.trim()) newErrors.address = 'Address is required';
      }
    } else {
      // Login validation
      if (!identifier.trim()) {
        newErrors.identifier = 'Email or phone number is required';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        const loginData = {
          email: identifier.includes('@') ? identifier.trim() : undefined,
          phone: !identifier.includes('@') ? identifier.trim() : undefined,
          password: formData.password,
          secondaryPassword: isAdminMode ? formData.secondaryPassword : undefined,
          userType: isAdminMode ? 'admin' : type,
          method: identifier.includes('@') ? 'email' : 'phone'
        };

        const result = await authService.login(loginData);

        if (result.token) {
          onAuthSuccess();
          onClose();
        } else {
          setErrors({ general: result.message || 'Login failed' });
        }
      } else {
        const signupData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          userType: type,
          address: type === 'customer' ? formData.address : undefined,
          companyName: type === 'supplier' ? formData.companyName : undefined,
          gstNumber: type === 'supplier' ? formData.gstNumber : undefined,
          businessAddress: type === 'supplier' ? formData.businessAddress : undefined,
          agreeToTerms: formData.agreeToTerms
        };

        console.log('Sending signup data:', signupData); // Debug log

        const result = await authService.signup(signupData);

        if (result.token) {
          onAuthSuccess();
          onClose();
        } else {
          setErrors({ general: result.message || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Signup error:', error); // Debug log
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <div className="mb-4">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="identifier"
            placeholder="Enter your email or phone number"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors({ ...errors, identifier: '' });
            }}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.identifier ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
        </div>
        {errors.identifier && <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      {/* Secondary Password for Admin - Slide-down animation */}
      {isAdminMode && (
        <div className="mb-6 animate-slide-down">
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showSecondaryPassword ? 'text' : 'password'}
              name="secondaryPassword"
              placeholder="Secondary Password"
              value={formData.secondaryPassword}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${
                errors.password ? 'border-red-500' : 'border-red-300'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowSecondaryPassword(!showSecondaryPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showSecondaryPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.secondaryPassword && <p className="text-red-500 text-sm mt-1">{errors.secondaryPassword}</p>}
        </div>
      )}
    </>
  );

  const renderSignupForm = () => (
    <>
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="mb-4">
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      {/* Customer address */}
      {type === 'customer' && (
        <div className="mb-4">
          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
        </div>
      )}

      {/* Supplier specific fields */}
      {type === 'supplier' && (
        <>
          {/* Company Name */}
          <div className="mb-4">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
          </div>

          {/* GST Number */}
          <div className="mb-4">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="gstNumber"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                  errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.gstNumber && <p className="text-red-500 text-sm mt-1">{errors.gstNumber}</p>}
          </div>

          {/* Business Address */}
          <div className="mb-4">
            <textarea
              name="businessAddress"
              placeholder="Business Address"
              value={formData.businessAddress}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                errors.businessAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.businessAddress && <p className="text-sm text-red-500 mt-1">{errors.businessAddress}</p>}
          </div>
        </>
      )}

      {/* Password */}
      <div className="mb-4">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4 relative">
            {type === 'customer' ? (
              <User className="h-12 w-12 text-blue-600" />
            ) : (
              <>
                <Building className="h-12 w-12 text-emerald-600" />
                {/* Secret Admin Trigger - hidden clickable area on center dot */}
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ background: isAdminMode ? '#ef4444' : 'transparent' }}
                  title={isAdminMode ? 'Admin Mode Active' : 'Secret Admin Trigger'}
                />
              </>
            )}
            {isAdminMode && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login'
              ? (isAdminMode ? 'Admin Login' : (type === 'customer' ? 'Customer Login' : 'Supplier Login'))
              : (type === 'customer' ? 'Customer Signup' : 'Supplier Registration')
            }
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'login' 
              ? (type === 'customer' 
                ? 'Access your account to browse and purchase products'
                : 'Manage your inventory and view sales reports')
              : (type === 'customer'
                ? 'Create your account to start shopping'
                : 'Register your business to start selling')
            }
          </p>
        </div>



        <form onSubmit={handleSubmit}>
          {mode === 'login' ? renderLoginForm() : renderSignupForm()}

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : type === 'customer'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>

        {mode === 'login' && (
          <div className="text-center mt-4">
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Forgot Password?
            </a>
          </div>
        )}

        {type !== 'supplier' && (
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login' ? 'Sign up here' : 'Login here'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;