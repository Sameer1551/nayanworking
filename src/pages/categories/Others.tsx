import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';

type OtherProduct = {
  id: number;
  name: string;
  brand: string;
  image: string;
  productType: 'Tools' | 'Equipment' | 'Supplies' | 'Parts' | 'Miscellaneous';
  description: string;
  price: number;
  gst: number;
  inStock: boolean;
  createdAt: string; // ISO date
  subcategory: 'Professional Tools' | 'Testing Equipment' | 'Office Supplies' | 'Replacement Parts' | 'Other Items';
  supplierOnly: boolean;
};

const dummyProducts: OtherProduct[] = [
  {
    id: 1,
    name: 'Professional Lens Edger',
    brand: 'Essilor',
    image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Equipment',
    description: 'High-precision lens edging machine for professional use',
    price: 125000,
    gst: 22500,
    inStock: true,
    createdAt: '2024-11-12T10:00:00Z',
    subcategory: 'Testing Equipment',
    supplierOnly: true,
  },
  {
    id: 2,
    name: 'Digital Pupillometer',
    brand: 'Zeiss',
    image: 'https://images.pexels.com/photos/17089328/pexels-photo-17089328.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Equipment',
    description: 'Advanced digital pupillometer for accurate measurements',
    price: 45000,
    gst: 8100,
    inStock: true,
    createdAt: '2025-05-10T10:00:00Z',
    subcategory: 'Testing Equipment',
    supplierOnly: true,
  },
  {
    id: 3,
    name: 'Frame Adjustment Kit',
    brand: 'Professional Tools Co.',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Tools',
    description: 'Complete set of professional frame adjustment tools',
    price: 2500,
    gst: 450,
    inStock: true,
    createdAt: '2025-03-15T10:00:00Z',
    subcategory: 'Professional Tools',
    supplierOnly: true,
  },
  {
    id: 4,
    name: 'Lens Coating Machine',
    brand: 'Bausch & Lomb',
    image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Equipment',
    description: 'Industrial lens coating machine for anti-reflective coatings',
    price: 350000,
    gst: 63000,
    inStock: false,
    createdAt: '2025-01-20T10:00:00Z',
    subcategory: 'Testing Equipment',
    supplierOnly: true,
  },
  {
    id: 5,
    name: 'Office Stationery Set',
    brand: 'Office Supplies Pro',
    image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Supplies',
    description: 'Complete office stationery set for optical business',
    price: 899,
    gst: 162,
    inStock: true,
    createdAt: '2024-12-01T10:00:00Z',
    subcategory: 'Office Supplies',
    supplierOnly: true,
  },
  {
    id: 6,
    name: 'Frame Hinges (Pack of 100)',
    brand: 'Frame Parts Ltd.',
    image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Parts',
    description: 'High-quality replacement hinges for various frame types',
    price: 1500,
    gst: 270,
    inStock: true,
    createdAt: '2025-02-15T10:00:00Z',
    subcategory: 'Replacement Parts',
    supplierOnly: true,
  },
  {
    id: 7,
    name: 'Optical Testing Chart',
    brand: 'Vision Testing Co.',
    image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Equipment',
    description: 'Professional optical testing chart for eye examinations',
    price: 1200,
    gst: 216,
    inStock: true,
    createdAt: '2024-10-15T10:00:00Z',
    subcategory: 'Testing Equipment',
    supplierOnly: true,
  },
  {
    id: 8,
    name: 'Lens Cleaning Machine',
    brand: 'Cleaning Systems Inc.',
    image: 'https://images.pexels.com/photos/17089328/pexels-photo-17089328.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    productType: 'Equipment',
    description: 'Automated lens cleaning machine for high-volume operations',
    price: 75000,
    gst: 13500,
    inStock: true,
    createdAt: '2025-04-01T10:00:00Z',
    subcategory: 'Testing Equipment',
    supplierOnly: true,
  },
];

const OthersPage: React.FC = () => {
  const [selectedSubcategory, setSelectedSubcategory] = useState<'All' | OtherProduct['subcategory']>('All');
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 500000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');

  useEffect(() => {
    document.title = 'Others - Supplier Only | Nayan Eye Care';
    const desc = 'Professional tools, equipment, and supplies for optical businesses. Supplier-only access to specialized equipment and professional tools.';
    const keywords = 'optical tools, professional equipment, supplier tools, optical supplies, professional equipment, GST inclusive';
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
    const uniqueProductTypes = [...new Set(dummyProducts.map(p => p.productType))];
    const uniqueBrands = [...new Set(dummyProducts.map(p => p.brand))];
    setProductTypes(uniqueProductTypes);
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

  const subcategories: OtherProduct['subcategory'][] = ['Professional Tools', 'Testing Equipment', 'Office Supplies', 'Replacement Parts', 'Other Items'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Others - Supplier Only', to: '/others' }
      ]} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>Supplier Only Access:</strong> This category contains professional tools, equipment, and supplies that are only available to suppliers and optical professionals.
                </p>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Professional Tools & Equipment
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Specialized equipment, professional tools, and supplies for optical businesses. Access to high-quality equipment and professional-grade tools.
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
                onChange={(e) => setSelectedSubcategory(e.target.value as 'All' | OtherProduct['subcategory'])}
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
                <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {product.productType}
                </div>
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Supplier Only
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
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    product.inStock
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'Add to Purchase' : 'Out of Stock'}
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
                setPrice({ min: 0, max: 500000 });
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

export default OthersPage;
