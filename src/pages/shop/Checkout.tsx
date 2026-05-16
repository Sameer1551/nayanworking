import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Lock, Truck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import shopService from '../../services/shopService';

const formatPrice = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const couponCode = searchParams.get('coupon') ?? '';
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
  const user = authService.getUser();
  const cartItems = shopService.getCartItems();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    city: user?.city ?? '',
    state: '',
    pincode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateShipping = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First Name is required';
    if (!formData.lastName) newErrors.lastName = 'Last Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone Number is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode) newErrors.pincode = 'Pincode is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.cardNumber) newErrors.cardNumber = 'Card Number is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry Date is required';
    if (!formData.cvv) newErrors.cvv = 'CVV is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepChange = (targetStep: number) => {
    if (targetStep > step) {
      if (step === 1 && !validateShipping()) return;
      if (step === 2 && !validatePayment()) return;
    }
    setStep(targetStep);
  };

  useEffect(() => {
    if (couponCode) {
      shopService.validateCouponWithBackend(couponCode).then(setValidatedCoupon);
    }
  }, [couponCode]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const discount = shopService.getCouponDiscount(validatedCoupon, subtotal, user?.email);
  const discountedSubtotal = subtotal - discount;
  const tax = Math.round(discountedSubtotal * 0.18);
  const shipping = discountedSubtotal >= 1000 ? 0 : 150;
  const total = discountedSubtotal + tax + shipping;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePlaceOrder = () => {
    const order = shopService.createOrder(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      discount,
    );

    if (order) {
      navigate('/order-success');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Your checkout is empty</h1>
          <p className="mt-3 text-gray-600">
            Add products to the cart before moving to checkout.
          </p>
          <Link
            to="/products/search"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {[1, 2, 3].map((currentStep) => (
                    <button
                      key={currentStep}
                      onClick={() => handleStepChange(currentStep)}
                      className={`flex-1 py-4 text-center font-medium transition ${
                        step === currentStep
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'border-b-2 border-transparent text-gray-600'
                      }`}
                    >
                      {currentStep === 1
                        ? 'Shipping'
                        : currentStep === 2
                          ? 'Payment'
                          : 'Review'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {step === 1 ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="firstName"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.firstName && <span className="mt-1 text-xs text-red-500">{errors.firstName}</span>}
                      </div>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.lastName && <span className="mt-1 text-xs text-red-500">{errors.lastName}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border px-4 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && <span className="mt-1 text-xs text-red-500">{errors.email}</span>}
                    </div>
                    <div className="flex flex-col">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border px-4 py-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.phone && <span className="mt-1 text-xs text-red-500">{errors.phone}</span>}
                    </div>
                    <div className="flex flex-col">
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border px-4 py-2 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.address && <span className="mt-1 text-xs text-red-500">{errors.address}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.city && <span className="mt-1 text-xs text-red-500">{errors.city}</span>}
                      </div>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.state && <span className="mt-1 text-xs text-red-500">{errors.state}</span>}
                      </div>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="pincode"
                          placeholder="Pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.pincode && <span className="mt-1 text-xs text-red-500">{errors.pincode}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStepChange(2)}
                      className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Continue to Payment
                    </button>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                      <Lock size={20} />
                      Payment Details
                    </h2>
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Secure Payment:</span> Your payment
                        information is encrypted and secure.
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card Number (1234 5678 9012 3456)"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border px-4 py-2 font-mono ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.cardNumber && <span className="mt-1 text-xs text-red-500">{errors.cardNumber}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.expiryDate && <span className="mt-1 text-xs text-red-500">{errors.expiryDate}</span>}
                      </div>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="cvv"
                          placeholder="CVV"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className={`rounded-lg border px-4 py-2 ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.cvv && <span className="mt-1 text-xs text-red-500">{errors.cvv}</span>}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStepChange(1)}
                        className="flex-1 rounded-lg border-2 border-gray-300 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleStepChange(3)}
                        className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Review Order
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Review Your Order</h2>

                    <div className="space-y-4 rounded-lg bg-gray-50 p-6">
                      <div>
                        <p className="text-sm text-gray-600">Shipping Address</p>
                        <p className="font-semibold text-gray-900">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-gray-700">{formData.address}</p>
                        <p className="text-gray-700">
                          {formData.city}, {formData.state} {formData.pincode}
                        </p>
                        <p className="text-gray-700">{formData.phone}</p>
                      </div>
                      <div className="border-t border-gray-300 pt-4">
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-semibold text-gray-900">
                          Card ending in {formData.cardNumber.slice(-4) || '0000'}
                        </p>
                      </div>
                      <div className="border-t border-gray-300 pt-4">
                        <p className="mb-2 text-sm text-gray-600">Items</p>
                        <div className="space-y-2">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-gray-700">
                              <span>
                                {item.name} x {item.quantity}
                              </span>
                              <span>{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 rounded-lg border-2 border-gray-300 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="flex-1 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Order Summary</h3>

              <div className="mb-6 space-y-4 border-b border-gray-200 pb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">{cartItems.length} Items</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Purchase Discount (15%)</span>
                    <span className="font-semibold text-green-600">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">{formatPrice(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Truck size={16} />
                    Shipping
                  </span>
                  <span className="font-semibold text-green-600">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-sm font-medium text-green-700">
                  {shipping === 0
                    ? 'Free shipping on this order.'
                    : 'Add more products to unlock free shipping.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
