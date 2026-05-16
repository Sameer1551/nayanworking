import { CheckCircle, Home, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import shopService from '../../services/shopService';

const formatPrice = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function OrderSuccessPage() {
  const order = shopService.getLastOrder();

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">No recent order found</h1>
          <p className="mt-3 text-gray-600">
            Place an order first to view the success page details.
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle size={80} className="fill-green-600 text-green-600" />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Order Placed Successfully</h1>
          <p className="mb-6 text-lg text-gray-600">
            Thank you for shopping with Nayan Eye Care.
          </p>

          <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-6 border-b border-gray-200 pb-6">
              <p className="mb-2 text-sm text-gray-600">Order Number</p>
              <p className="font-mono text-3xl font-bold text-gray-900">{order.orderNumber}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-6 border-b border-gray-200 pb-6">
              <div>
                <p className="mb-1 text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-600">Estimated Delivery</p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm text-gray-600">Order Summary</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
                  <span>Total Amount Paid</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <p className="mb-3 text-sm text-gray-700">
              A confirmation email has been sent to your registered email address.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
              <Package size={16} />
              We will keep you updated on your shipment.
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-semibold text-gray-900">Track Your Order</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                    <CheckCircle size={20} />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Order Confirmed</p>
                  <p className="text-sm text-gray-600">Your order has been received.</p>
                </div>
              </div>

              <div className="ml-5 h-6 border-l-2 border-gray-300" />

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-white">
                    <Package size={20} />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Processing</p>
                  <p className="text-sm text-gray-600">Your order is being prepared.</p>
                </div>
              </div>

              <div className="ml-5 h-6 border-l-2 border-gray-300" />

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-white">
                    <Truck size={20} />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Shipped</p>
                  <p className="text-sm text-gray-600">Your order is on the way.</p>
                </div>
              </div>

              <div className="ml-5 h-6 border-l-2 border-gray-300" />

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-white">
                    <Home size={20} />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Delivered</p>
                  <p className="text-sm text-gray-600">Your order will be delivered soon.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Home
            </Link>
            <Link
              to="/products/search"
              className="rounded-lg border-2 border-blue-600 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Have questions? Contact support@nayaneyecare.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
