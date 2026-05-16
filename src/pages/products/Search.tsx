import { useEffect, useMemo, useState } from 'react';
import { Filter, Grid2x2 as Grid, List, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import shopService from '../../services/shopService';
import { ShopCategory } from '../../types/shop';

const formatPrice = (value: number) => `Rs. ${value.toLocaleString()}`;

const CATEGORY_OPTIONS: Array<{ value: '' | ShopCategory; label: string }> = [
  { value: '', label: 'All Categories' },
  { value: 'spectacles', label: 'Spectacles' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'contact-lenses', label: 'Contact Lenses' },
  { value: 'frames', label: 'Frames' },
  { value: 'solutions', label: 'Solutions' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<'' | ShopCategory>(
    (searchParams.get('category') as ShopCategory | '') ?? '',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 50000]);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
    setCategory((searchParams.get('category') as ShopCategory | '') ?? '');
  }, [searchParams]);

  const filteredProducts = useMemo(
    () => shopService.searchProducts(searchQuery, category || undefined, priceRange[1]),
    [searchQuery, category, priceRange],
  );

  const syncSearchParams = (nextQuery: string, nextCategory: string) => {
    const next = new URLSearchParams();
    if (nextQuery.trim()) {
      next.set('q', nextQuery.trim());
    }
    if (nextCategory) {
      next.set('category', nextCategory);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Search Products</h1>
        <p className="mb-8 text-gray-600">Find the perfect eyewear for your needs</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Filter size={20} />
                Filters
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={category}
                    onChange={(event) => {
                      const nextCategory = event.target.value as '' | ShopCategory;
                      setCategory(nextCategory);
                      syncSearchParams(searchQuery, nextCategory);
                    }}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <div className="mt-4 space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(event) =>
                        setPriceRange([priceRange[0], parseInt(event.target.value, 10)])
                      }
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategory('');
                    setPriceRange([0, 50000]);
                    setSearchParams({}, { replace: true });
                  }}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-200"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, brand, feature, or code..."
                    value={searchQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setSearchQuery(nextQuery);
                      syncSearchParams(nextQuery, category);
                    }}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg p-2 transition ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg p-2 transition ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                <Search size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product) => (
                  <Link key={product.productCode} to={`/product/${product.productCode}`}>
                    {viewMode === 'grid' ? (
                      <div className="group h-full cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md">
                        <div className="relative h-48 overflow-hidden bg-gray-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <div className="absolute right-3 top-3 rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="mb-2 text-xs text-gray-500">{product.categoryLabel}</p>
                          <h3 className="mb-1 font-semibold text-gray-900 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="mb-3 text-sm text-gray-600">{product.brand}</p>
                          <div className="mb-3 flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, index) => (
                                <span
                                  key={index}
                                  className={
                                    index < Math.floor(product.rating)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }
                                >
                                  *
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({product.rating})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-sm text-gray-500">{product.stock} left</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="group flex cursor-pointer gap-4 rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-4">
                          <div>
                            <p className="mb-1 text-xs text-gray-500">{product.categoryLabel}</p>
                            <h3 className="mb-1 font-semibold text-gray-900">{product.name}</h3>
                            <p className="mb-2 text-sm text-gray-600">{product.brand}</p>
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[...Array(5)].map((_, index) => (
                                  <span
                                    key={index}
                                    className={
                                      index < Math.floor(product.rating)
                                        ? 'text-sm text-yellow-400'
                                        : 'text-sm text-gray-300'
                                    }
                                  >
                                    *
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">({product.rating})</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            <p className="mt-2 text-sm text-gray-500">
                              {product.stock} in stock
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-600">
              Showing {filteredProducts.length} of {shopService.getAllProducts().length} products
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
