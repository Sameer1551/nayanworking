import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Eye, Filter } from 'lucide-react';
import authService from '../services/authService';
import shopService from '../services/shopService';

const FeaturedProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: any, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map to ShopProduct
    const shopProduct: any = {
      id: p.id.toString(),
      productCode: p.id.toString(),
      name: p.name,
      category: p.category,
      categoryLabel: p.category.charAt(0).toUpperCase() + p.category.slice(1),
      price: p.price,
      gst: p.gst,
      stock: p.inStock ? 10 : 0,
      image: p.image,
      brand: p.brand
    };

    if (action === 'cart') {
      shopService.addToCart(shopProduct, 1);
      setAddedItems(prev => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [p.id]: false }));
      }, 2000);
    } else {
      shopService.buyNow(shopProduct, 1);
      navigate('/checkout');
    }
  };

  const products = [
    {
      id: 1,
      name: 'Classic Metal Frame',
      brand: 'Ray-Ban',
      price: 4999,
      originalPrice: 6999,
      gst: 899,
      rating: 4.5,
      reviews: 125,
      image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'spectacles',
      material: 'Metal',
      lensType: 'Anti-glare',
      warranty: '2 years',
      inStock: true,
      features: ['UV Protection', 'Scratch Resistant', 'Anti-glare']
    },
    {
      id: 2,
      name: 'Polarized Sunglasses',
      brand: 'Oakley',
      price: 7999,
      originalPrice: 9999,
      gst: 1440,
      rating: 4.8,
      reviews: 89,
      image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'sunglasses',
      material: 'Acetate',
      lensType: 'Polarized',
      warranty: '1 year',
      inStock: true,
      features: ['100% UV Protection', 'Polarized', 'Impact Resistant']
    },
    {
      id: 3,
      name: 'Daily Contact Lenses',
      brand: 'Acuvue',
      price: 1299,
      originalPrice: 1499,
      gst: 234,
      rating: 4.3,
      reviews: 267,
      image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'lenses',
      material: 'Silicone Hydrogel',
      lensType: 'Daily',
      warranty: 'N/A',
      inStock: true,
      features: ['Daily Disposable', 'UV Blocking', 'Moisture Lock']
    },
    {
      id: 4,
      name: 'Designer Plastic Frame',
      brand: 'Gucci',
      price: 12999,
      originalPrice: 15999,
      gst: 2340,
      rating: 4.7,
      reviews: 45,
      image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'frames',
      material: 'Acetate',
      lensType: 'Progressive',
      warranty: '2 years',
      inStock: false,
      features: ['Designer', 'Lightweight', 'Adjustable']
    },
    {
      id: 5,
      name: 'Sports Sunglasses',
      brand: 'Nike',
      price: 3999,
      originalPrice: 4999,
      gst: 720,
      rating: 4.4,
      reviews: 156,
      image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'sunglasses',
      material: 'Polycarbonate',
      lensType: 'Mirrored',
      warranty: '1 year',
      inStock: true,
      features: ['Sport Design', 'Lightweight', 'Non-slip']
    },
    {
      id: 6,
      name: 'Blue Light Blocking',
      brand: 'Zeiss',
      price: 2999,
      originalPrice: 3999,
      gst: 540,
      rating: 4.6,
      reviews: 203,
      image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      category: 'spectacles',
      material: 'TR90',
      lensType: 'Blue Light Filter',
      warranty: '1 year',
      inStock: true,
      features: ['Blue Light Filter', 'Computer Use', 'Lightweight']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'spectacles', name: 'Spectacles' },
    { id: 'sunglasses', name: 'Sunglasses' },
    { id: 'lenses', name: 'Contact Lenses' },
    { id: 'frames', name: 'Frames' },
    { id: 'solutions', name: 'Solutions' }
  ];

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  });

  const ProductCard = ({ product }: { product: any }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-xl"
        />
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
            <Heart className="h-4 w-4 text-gray-600" />
          </button>
          <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-t-xl">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
        {product.originalPrice > product.price && (
          <div className="absolute top-3 left-3">
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 text-lg">{product.name}</h3>
          <span className="text-sm text-gray-500 font-medium">{product.brand}</span>
        </div>
        
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {product.rating} ({product.reviews} reviews)
          </span>
        </div>

        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-2xl font-bold text-gray-800">₹{product.price.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <span className="text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <span>+ ₹{product.gst} GST</span>
            <span className="ml-2 text-gray-800 font-medium">
              Total: ₹{(product.price + product.gst).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Material:</span>
            <span className="font-medium">{product.material}</span>
          </div>
          <div className="flex justify-between">
            <span>Lens Type:</span>
            <span className="font-medium">{product.lensType}</span>
          </div>
          <div className="flex justify-between">
            <span>Warranty:</span>
            <span className="font-medium">{product.warranty}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {product.features.map((feature: string, index: number) => (
            <span
              key={index}
              className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={(e) => handleAction(e, product, 'cart')}
            disabled={!product.inStock}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              product.inStock
                ? addedItems[product.id]
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            {addedItems[product.id] ? 'Added!' : 'Add to Cart'}
          </button>
          <button
            onClick={(e) => handleAction(e, product, 'buy')}
            disabled={!product.inStock}
            className={`px-4 py-3 rounded-lg font-medium transition-all ${
              product.inStock
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section id="products" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium eyewear with detailed specifications
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filter Products</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="all">All Brands</option>
                <option value="ray-ban">Ray-Ban</option>
                <option value="oakley">Oakley</option>
                <option value="gucci">Gucci</option>
                <option value="nike">Nike</option>
                <option value="zeiss">Zeiss</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors">
            Load More Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;