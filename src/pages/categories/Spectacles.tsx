import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import authService from '../../services/authService';
import shopService from '../../services/shopService';
import { ShopProduct } from '../../types/shop';

type SpectacleProduct = {
  id: number;
  name: string;
  brand: string;
  image: string;
  frameShape: 'Round' | 'Square' | 'Rectangle' | 'Cat-eye' | 'Aviator';
  frameColor: 'Black' | 'Brown' | 'Blue' | 'Red' | 'Gold' | 'Silver';
  lensPowerRange: { min: number; max: number };
  price: number;
  gst: number;
  inStock: boolean;
  createdAt: string; // ISO date
  subcategory: 'Men' | 'Women' | 'Kids' | 'Unisex';
};

const dummyProducts: SpectacleProduct[] = [
  {
    id: 1,
    name: 'Classic Rectangle Frame',
    brand: 'Ray-Ban',
    image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    frameShape: 'Rectangle',
    frameColor: 'Black',
    lensPowerRange: { min: -8, max: +6 },
    price: 4999,
    gst: 900,
    inStock: true,
    createdAt: '2024-11-12T10:00:00Z',
    subcategory: 'Men',
  },
  {
    id: 2,
    name: 'Elegant Cat-eye',
    brand: 'Gucci',
    image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    frameShape: 'Cat-eye',
    frameColor: 'Red',
    lensPowerRange: { min: -6, max: +4 },
    price: 12999,
    gst: 2340,
    inStock: false,
    createdAt: '2025-05-10T10:00:00Z',
    subcategory: 'Women',
  },
  {
    id: 3,
    name: 'Lightweight Round Kids',
    brand: 'Lenskart',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    frameShape: 'Round',
    frameColor: 'Blue',
    lensPowerRange: { min: -5, max: +5 },
    price: 1999,
    gst: 360,
    inStock: true,
    createdAt: '2025-03-15T10:00:00Z',
    subcategory: 'Kids',
  },
  {
    id: 4,
    name: 'Minimalist Square Unisex',
    brand: 'Zeiss',
    image: 'https://images.pexels.com/photos/17089328/pexels-photo-17089328.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    frameShape: 'Square',
    frameColor: 'Gold',
    lensPowerRange: { min: -10, max: +8 },
    price: 6999,
    gst: 1260,
    inStock: true,
    createdAt: '2025-01-20T10:00:00Z',
    subcategory: 'Unisex',
  },
];

const SpectaclesPage: React.FC = () => {
  const [selectedSubcategory, setSelectedSubcategory] = useState<'All' | SpectacleProduct['subcategory']>('All');
  const [shapes, setShapes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [lensPower, setLensPower] = useState<{ min: number; max: number }>({ min: -12, max: 12 });
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 20000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: SpectacleProduct, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map dummy product to ShopProduct format
    const shopProduct: any = {
      id: `SPEC-${p.id}`,
      productCode: `SPEC-${p.id}`,
      name: p.name,
      category: 'spectacles',
      categoryLabel: 'Spectacles',
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
    document.title = 'Spectacles | Nayan Eye Care';
    const desc = 'Shop men\'s, women\'s, kids\'s, and unisex spectacles. Filter by frame shape, color, lens power, brand, and price. GST-inclusive pricing.';
    const keywords = 'spectacles, prescription glasses, men spectacles, women spectacles, kids spectacles, unisex frames, GST inclusive';
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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    let list = [...dummyProducts];
    if (selectedSubcategory !== 'All') {
      list = list.filter(p => p.subcategory === selectedSubcategory);
    }
    if (shapes.length) list = list.filter(p => shapes.includes(p.frameShape));
    if (colors.length) list = list.filter(p => colors.includes(p.frameColor));
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    list = list.filter(p => p.price >= price.min && p.price <= price.max);
    list = list.filter(p => p.lensPowerRange.min <= lensPower.max && p.lensPowerRange.max >= lensPower.min);

    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        break; // 'best' could use rating if available
    }
    return list;
  }, [selectedSubcategory, shapes, colors, brands, price, lensPower, sortBy]);

  const shapeOptions = ['Round', 'Square', 'Rectangle', 'Cat-eye', 'Aviator'];
  const colorOptions = ['Black', 'Brown', 'Blue', 'Red', 'Gold', 'Silver'];
  const brandOptions = ['Ray-Ban', 'Gucci', 'Lenskart', 'Zeiss'];
  const subcategories: Array<'Men' | 'Women' | 'Kids' | 'Unisex'> = ['Men', 'Women', 'Kids', 'Unisex'];

  const toggleInArray = (value: string, arr: string[], setArr: (v: string[]) => void) => {
    if (arr.includes(value)) setArr(arr.filter(v => v !== value));
    else setArr([...arr, value]);
  };

  return (
    <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Spectacles' }]} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spectacles</h1>
          <p className="text-gray-600">GST-inclusive pricing. Free basic lens fitting on selected frames.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="best">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Subcategories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSubcategory('All')}
          className={`px-4 py-2 rounded-full border ${selectedSubcategory === 'All' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
        >
          All
        </button>
        {subcategories.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSubcategory(s)}
            className={`px-4 py-2 rounded-full border ${selectedSubcategory === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
          >
            {s}’s Spectacles
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="md:col-span-1 bg-white border rounded-xl p-4 h-max">
          <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="space-y-5">
            {/* Frame Shape */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Frame Shape</p>
              <div className="flex flex-wrap gap-2">
                {shapeOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleInArray(opt, shapes, setShapes)}
                    className={`px-3 py-1 rounded-full border text-sm ${shapes.includes(opt) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {/* Frame Color */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Frame Color</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleInArray(opt, colors, setColors)}
                    className={`px-3 py-1 rounded-full border text-sm ${colors.includes(opt) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {/* Lens Power Range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Lens Power Range (D)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={lensPower.min} onChange={(e) => setLensPower({ ...lensPower, min: Number(e.target.value) })} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={lensPower.max} onChange={(e) => setLensPower({ ...lensPower, max: Number(e.target.value) })} />
              </div>
            </div>
            {/* Price Range */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Price Range (₹)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={price.min} onChange={(e) => setPrice({ ...price, min: Number(e.target.value) })} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={price.max} onChange={(e) => setPrice({ ...price, max: Number(e.target.value) })} />
              </div>
            </div>
            {/* Brand */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Brand</p>
              <div className="flex flex-wrap gap-2">
                {brandOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleInArray(opt, brands, setBrands)}
                    className={`px-3 py-1 rounded-full border text-sm ${brands.includes(opt) ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <section className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const total = p.price + p.gst;
            return (
              <div key={p.id} className="bg-white rounded-xl border hover:shadow-md transition group">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img src={p.image} alt={p.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                  {!p.inStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{p.brand}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Shape</span><span className="font-medium">{p.frameShape}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color</span><span className="font-medium">{p.frameColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Power</span><span className="font-medium">{p.lensPowerRange.min} to {p.lensPowerRange.max} D</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</span>
                      {p.inStock ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Price includes GST (₹{p.gst.toLocaleString()})</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={(e) => handleAction(e, p, 'cart')}
                      disabled={!p.inStock} 
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        p.inStock 
                          ? addedItems[p.id]
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {addedItems[p.id] ? 'Added!' : 'Add to Cart'}
                    </button>
                    <button 
                      onClick={(e) => handleAction(e, p, 'buy')}
                      disabled={!p.inStock} 
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${p.inStock ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-500'}`}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default SpectaclesPage;

