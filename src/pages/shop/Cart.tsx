import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import shopService from '../../services/shopService';
import authService from '../../services/authService';
import { CartItem } from '../../types/shop';

const formatPrice = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(shopService.getCartItems());
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const user = authService.getUser();

  useEffect(() => {
    const syncCart = () => setCartItems(shopService.getCartItems());

    window.addEventListener('cartUpdated', syncCart);
    return () => window.removeEventListener('cartUpdated', syncCart);
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const discountAmount = shopService.getCouponDiscount(validatedCoupon, subtotal, user?.email);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * 0.18);
  const shipping = discountedSubtotal > 1000 ? 0 : 150;
  const total = discountedSubtotal + tax + shipping;

  const handleCouponSubmit = async () => {
    setCouponError(null);
    setValidatedCoupon(null);
    
    if (!couponCode.trim()) return;

    const coupon = await shopService.validateCouponWithBackend(couponCode);
    if (coupon) {
      // Check first purchase rule
      if (coupon.isFirstPurchaseOnly) {
        const history = shopService.getOrdersHistory();
        const hasPreviousOrders = history.some(order => order.shippingAddress.email === user?.email);
        if (hasPreviousOrders) {
          setCouponError('This coupon is only valid for your first purchase.');
          return;
        }
      }

      // Check expiry
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        setCouponError('This coupon has expired.');
        return;
      }

      if (!coupon.isActive) {
        setCouponError('This coupon is no longer active.');
        return;
      }

      setValidatedCoupon(coupon);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    shopService.updateCartItemQuantity(id, newQuantity);
    setCartItems(shopService.getCartItems());
  };

  const removeItem = (id: string) => {
    shopService.removeCartItem(id);
    setCartItems(shopService.getCartItems());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mb-8 text-gray-600">
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
        </p>

        {cartItems.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">Your cart is empty</h2>
            <p className="mb-6 text-gray-600">Start shopping to add items to your cart</p>
            <Link
              to="/products/search"
              className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-6 border-b border-gray-200 p-6 last:border-b-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="mb-1 text-xs text-gray-500">{item.categoryLabel}</p>
                      <h3 className="mb-2 font-semibold text-gray-900">{item.name}</h3>
                      {item.selectedPower ? (
                        <p className="mb-2 text-sm text-gray-600">
                          Power: {item.selectedPower}
                        </p>
                      ) : null}
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-4 rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Apply Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleCouponSubmit}
                    className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Apply
                  </button>
                </div>
                {discountAmount > 0 ? (
                  <p className="mt-2 text-sm font-medium text-green-600">
                    Coupon "{validatedCoupon.code}" applied! You saved {formatPrice(discountAmount)}.
                  </p>
                ) : couponError ? (
                  <p className="mt-2 text-sm text-red-500">
                    {couponError}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">Order Summary</h3>

                <div className="mb-6 space-y-4 border-b border-gray-200 pb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Discount (15%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between text-gray-700">
                    <span>Tax (18%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'font-medium text-green-600' : ''}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
                </div>

                <Link
                  to={`/checkout${validatedCoupon ? `?coupon=${encodeURIComponent(validatedCoupon.code)}` : ''}`}
                  className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/products/search"
                  className="mt-3 block w-full rounded-lg border-2 border-gray-300 py-3 text-center font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
