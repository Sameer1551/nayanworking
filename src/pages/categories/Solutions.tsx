import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import authService from '../../services/authService';
import shopService from '../../services/shopService';

type SolutionProduct = {
  id: number;
  name: string;
  brand: string;
  image: string;
  solutionType: 'Eye Care' | 'Lens Care' | 'Frame Care' | 'Accessories';
  description: string;
  price: number;
  gst: number;
  inStock: boolean;
  createdAt: string; // ISO date
  subcategory: 'Cleaning' | 'Storage' | 'Protection' | 'Maintenance';
};

const dummyProducts: SolutionProduct[] = [
  {
    id: 1,
    name: 'Premium Lens Cleaning Solution',
    brand: 'Bausch & Lomb',
    image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Lens Care',
    description: 'Professional grade cleaning solution for all types of lenses',
    price: 299,
    gst: 54,
    inStock: true,
    createdAt: '2024-11-12T10:00:00Z',
    subcategory: 'Cleaning',
  },
  {
    id: 2,
    name: 'Anti-Fog Lens Spray',
    brand: 'Zeiss',
    image: 'https://images.pexels.com/photos/17089328/pexels-photo-17089328.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Lens Care',
    description: 'Prevents fogging on glasses during temperature changes',
    price: 199,
    gst: 36,
    inStock: true,
    createdAt: '2025-05-10T10:00:00Z',
    subcategory: 'Protection',
  },
  {
    id: 3,
    name: 'Microfiber Cleaning Cloth',
    brand: 'Lenskart',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Lens Care',
    description: 'Ultra-soft microfiber cloth for safe lens cleaning',
    price: 99,
    gst: 18,
    inStock: true,
    createdAt: '2025-03-15T10:00:00Z',
    subcategory: 'Cleaning',
  },
  {
    id: 4,
    name: 'Frame Repair Kit',
    brand: 'Ray-Ban',
    image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Frame Care',
    description: 'Complete kit for minor frame repairs and adjustments',
    price: 599,
    gst: 108,
    inStock: false,
    createdAt: '2025-01-20T10:00:00Z',
    subcategory: 'Maintenance',
  },
  {
    id: 5,
    name: 'UV Protection Lens Coating',
    brand: 'Essilor',
    image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Eye Care',
    description: 'Advanced UV protection coating for enhanced eye safety',
    price: 899,
    gst: 162,
    inStock: true,
    createdAt: '2024-12-01T10:00:00Z',
    subcategory: 'Protection',
  },
  {
    id: 6,
    name: 'Glasses Storage Case',
    brand: 'Gucci',
    image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    solutionType: 'Accessories',
    description: 'Luxury leather case with soft interior lining',
    price: 1299,
    gst: 234,
    inStock: true,
    createdAt: '2025-02-15T10:00:00Z',
    subcategory: 'Storage',
  },
];

const SolutionsPage: React.FC = () => {
  const [selectedSubcategory, setSelectedSubcategory] = useState<'All' | SolutionProduct['subcategory']>('All');
  const [solutionTypes, setSolutionTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 2000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: SolutionProduct, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map dummy product to ShopProduct format
    const shopProduct: any = {
      id: `SOL-${p.id}`,
      productCode: `SOL-${p.id}`,
      name: p.name,
      category: 'solutions',
      categoryLabel: 'Solutions',
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

  useEffect(() => {
    document.title = 'Solutions | Nayan Eye Care';
    const desc = 'Shop eye care solutions, lens care products, frame maintenance, and accessories. Professional cleaning solutions, anti-fog sprays, and protective coatings. GST-inclusive pricing.';
    const keywords = 'eye care solutions, lens cleaning, frame care, anti-fog spray, UV protection, glasses accessories, GST inclusive';
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    setMeta('description', desc);
    setMeta('keywords', keywords);
  }, []);

  useEffect(() => {
    const uniqueSolutionTypes = [...new Set(dummyProducts.map(p => p.solutionType))];
    const uniqueBrands = [...new Set(dummyProducts.map(p => p.brand))];
    setSolutionTypes(uniqueSolutionTypes);
    setBrands(uniqueBrands);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = dummyProducts;

    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter(p => p.subcategory === selectedSubcategory);
    }

    filtered = filtered.filter(p => p.price >= price.min && p.price <= price.max);

    switch (sortBy) {
      case 'price-asc':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return filtered.sort((a, b) => b.price - a.price);
      case 'newest':
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return filtered;
    }
  }, [selectedSubcategory, price, sortBy]);

  const subcategories: SolutionProduct['subcategory'][] = ['Cleaning', 'Storage', 'Protection', 'Maintenance'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Solutions', to: '/solutions' }
      ]} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Eye Care Solutions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional solutions for maintaining and protecting your eyewear. From cleaning solutions to protective coatings, we have everything you need.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value as 'All' | SolutionProduct['subcategory'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Subcategories</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={price.min}
                  onChange={(e) => setPrice(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={price.max}
                  onChange={(e) => setPrice(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price-asc' | 'price-desc' | 'best' | 'newest')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>

        {/* Subcategories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Browse by Subcategory</h2>
          <div className="flex flex-wrap gap-3">
            {subcategories.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSubcategory(s === selectedSubcategory ? 'All' : s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSubcategory === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                {!product.inStock && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Out of Stock
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {product.solutionType}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Brand: <span className="font-medium">{product.brand}</span>
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-800">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    +GST ₹{product.gst}
                  </span>
                </div>
                <button
                  onClick={(e) => handleAction(e, product, 'cart')}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-all ${
                    product.inStock
                      ? addedItems[product.id]
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? (addedItems[product.id] ? 'Added!' : 'Add to Cart') : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedSubcategory('All');
                setPrice({ min: 0, max: 2000 });
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionsPage;
