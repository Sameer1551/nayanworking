import { useMemo, useState } from 'react';
import { ChevronLeft, Heart, Minus, Plus, Share2, ShoppingCart, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import shopService from '../../services/shopService';
import authService from '../../services/authService';

const formatPrice = (value: number) => `Rs. ${value.toLocaleString()}`;

export default function ProductDetailPage() {
  const { productCode } = useParams();
  const navigate = useNavigate();
  const product = shopService.getProductByCode(productCode);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product?.image ?? '');
  const [selectedPower, setSelectedPower] = useState('');

  const availableImages = useMemo(() => {
    if (!product) {
      return [];
    }

    return product.images && product.images.length > 0 ? product.images : [product.image];
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Product not found</h1>
          <p className="mt-3 text-gray-600">
            The product you were trying to open is not available in the current catalog.
          </p>
          <Link
            to="/products/search"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const canPurchase = !product.requiresPrescription || selectedPower.length > 0;

  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    if (!authService.isAuthenticated()) {
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    shopService.addToCart(product, quantity, selectedPower || undefined);
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!authService.isAuthenticated()) {
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    shopService.buyNow(product, quantity, selectedPower || undefined);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="relative mb-4 overflow-hidden rounded-lg bg-white shadow-sm">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              {discount > 0 && (
                <div className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1 font-bold text-white">
                  -{discount}%
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {availableImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-lg border-2 bg-white shadow-sm transition ${
                    selectedImage === image ? 'border-blue-600' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm text-gray-500">{product.categoryLabel}</p>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mb-4 text-sm font-medium text-gray-600">{product.brand}</p>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className={index < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <div className="mb-6 border-b border-gray-200 pb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-lg font-semibold text-green-600">Save {discount}%</span>
                )}
              </div>
              {product.gst ? (
                <p className="mt-2 text-sm text-gray-500">
                  Includes estimated GST of {formatPrice(product.gst)}
                </p>
              ) : null}
            </div>

            <div className="mb-6">
              <h2 className="mb-3 font-semibold text-gray-900">About this product</h2>
              <p className="leading-7 text-gray-700">{product.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-900">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {product.requiresPrescription ? (
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-900">Select Power</label>
                <select
                  value={selectedPower}
                  onChange={(event) => setSelectedPower(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="">Choose your prescription power</option>
                  {Array.from({ length: 25 }, (_, index) => index - 12).map((value) => (
                    <option key={value} value={`${value}.0`}>
                      {value > 0 ? '+' : ''}
                      {value}.0 D
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-900">Free Shipping:</span> On orders above Rs. 1,000
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-gray-900">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  className="rounded-lg border border-gray-300 p-2 transition hover:bg-gray-50"
                >
                  <Plus size={18} />
                </button>
                <span className="text-sm text-gray-600">({product.stock} available)</span>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!canPurchase}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
                  canPurchase 
                    ? isAdded 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
              >
                <ShoppingCart size={20} />
                {isAdded ? 'Added to Cart!' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!canPurchase}
                className={`w-full rounded-lg py-3 font-semibold transition ${
                  canPurchase ? 'bg-orange-500 text-white hover:bg-orange-600' : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
              >
                Buy Now
              </button>
              <button
                onClick={() => setIsWishlisted((current) => !current)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 py-3 font-semibold text-gray-900 transition hover:border-red-600"
              >
                <Heart size={20} className={isWishlisted ? 'fill-red-600 text-red-600' : ''} />
                {isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 font-semibold text-gray-900 transition hover:bg-gray-200">
              <Share2 size={20} />
              Share
            </button>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Specifications</h2>
          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="w-1/3 px-6 py-4 font-semibold text-gray-900">{key}</td>
                    <td className="px-6 py-4 text-gray-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Continue Shopping</h2>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/products/search?category=${product.category}`}
                className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
              >
                More in {product.categoryLabel}
              </Link>
              <Link
                to="/products/search"
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200"
              >
                Browse all products
              </Link>
              <Link
                to="/cart"
                className="rounded-lg bg-orange-50 px-4 py-2 font-medium text-orange-700 hover:bg-orange-100"
              >
                View cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
