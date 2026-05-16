import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import authService from '../../services/authService';
import shopService from '../../services/shopService';

type Sunglass = {
  id: number;
  name: string;
  brand: string;
  image: string;
  lensColor: 'Black' | 'Brown' | 'Green' | 'Blue' | 'Mirror';
  uvProtection: 'UV400' | 'UV300';
  frameType: 'Full-rim' | 'Half-rim' | 'Rimless' | 'Wrap';
  price: number;
  inStock: boolean;
  createdAt: string;
  subcategory: 'Polarized' | 'Non-Polarized' | 'Sports' | 'Fashion';
  features: string[];
};

const data: Sunglass[] = [
  { id: 1, name: 'Polarized Pro', brand: 'Oakley', image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', lensColor: 'Black', uvProtection: 'UV400', frameType: 'Wrap', price: 7999, inStock: true, createdAt: '2025-02-10', subcategory: 'Polarized', features: ['Polarized', 'Impact Resistant', 'Hydrophobic'] },
  { id: 2, name: 'City Fashion', brand: 'Ray-Ban', image: 'https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', lensColor: 'Brown', uvProtection: 'UV400', frameType: 'Full-rim', price: 5999, inStock: true, createdAt: '2025-04-01', subcategory: 'Fashion', features: ['UV Protection', 'Lightweight'] },
  { id: 3, name: 'Sport Runner', brand: 'Nike', image: 'https://images.pexels.com/photos/240340/pexels-photo-240340.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', lensColor: 'Green', uvProtection: 'UV300', frameType: 'Wrap', price: 3999, inStock: true, createdAt: '2024-12-20', subcategory: 'Sports', features: ['Non-slip', 'Ventilated'] },
  { id: 4, name: 'Daily Classic', brand: 'Vogue', image: 'https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', lensColor: 'Blue', uvProtection: 'UV400', frameType: 'Half-rim', price: 2999, inStock: false, createdAt: '2025-05-25', subcategory: 'Non-Polarized', features: ['Stylish', 'Comfort Fit'] },
];

const SunglassesPage: React.FC = () => {
  const [subcat, setSubcat] = useState<'All' | Sunglass['subcategory']>('All');
  const [lensColors, setLensColors] = useState<string[]>([]);
  const [uv, setUv] = useState<string[]>([]);
  const [frameTypes, setFrameTypes] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 20000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: Sunglass, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map dummy product to ShopProduct format
    const shopProduct: any = {
      id: `SUN-${p.id}`,
      productCode: `SUN-${p.id}`,
      name: p.name,
      category: 'sunglasses',
      categoryLabel: 'Sunglasses',
      price: p.price,
      gst: Math.round(p.price * 0.18),
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
    document.title = 'Sunglasses | Nayan Eye Care';
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    setMeta('description', 'Shop polarized, non-polarized, sports and fashion sunglasses. Filter by lens color, UV protection, frame type, brand and price.');
    setMeta('keywords', 'sunglasses, polarized, UV400, sports sunglasses, fashion shades');
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const toggle = (val: string, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const filtered = useMemo(() => {
    let list = [...data];
    if (subcat !== 'All') list = list.filter(p => p.subcategory === subcat);
    if (lensColors.length) list = list.filter(p => lensColors.includes(p.lensColor));
    if (uv.length) list = list.filter(p => uv.includes(p.uvProtection));
    if (frameTypes.length) list = list.filter(p => frameTypes.includes(p.frameType));
    if (brand.length) list = list.filter(p => brand.includes(p.brand));
    list = list.filter(p => p.price >= price.min && p.price <= price.max);
    switch (sortBy) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'newest': list.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return list;
  }, [subcat, lensColors, uv, frameTypes, brand, price, sortBy]);

  const subcategories: Sunglass['subcategory'][] = ['Polarized', 'Non-Polarized', 'Sports', 'Fashion'];
  const lensColorOpts = ['Black', 'Brown', 'Green', 'Blue', 'Mirror'];
  const uvOpts = ['UV400', 'UV300'];
  const frameTypeOpts = ['Full-rim', 'Half-rim', 'Rimless', 'Wrap'];
  const brandOpts = ['Oakley', 'Ray-Ban', 'Nike', 'Vogue'];

  return (
    <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Sunglasses' }]} />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sunglasses</h1>
          <p className="text-gray-600">Lifestyle images, detailed features and quick purchase.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Sort by</label>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="px-3 py-2 border rounded-lg">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="best">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Subcategories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={()=>setSubcat('All')} className={`px-4 py-2 rounded-full border ${subcat==='All'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>All</button>
        {subcategories.map(s=> (
          <button key={s} onClick={()=>setSubcat(s)} className={`px-4 py-2 rounded-full border ${subcat===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>{s} Sunglasses</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="md:col-span-1 bg-white border rounded-xl p-4 h-max">
          <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Lens Color</p>
              <div className="flex flex-wrap gap-2">
                {lensColorOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, lensColors, setLensColors)} className={`px-3 py-1 rounded-full border text-sm ${lensColors.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">UV Protection</p>
              <div className="flex flex-wrap gap-2">
                {uvOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, uv, setUv)} className={`px-3 py-1 rounded-full border text-sm ${uv.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Frame Type</p>
              <div className="flex flex-wrap gap-2">
                {frameTypeOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, frameTypes, setFrameTypes)} className={`px-3 py-1 rounded-full border text-sm ${frameTypes.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Price Range (₹)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={price.min} onChange={(e)=>setPrice({...price, min: Number(e.target.value)})} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={price.max} onChange={(e)=>setPrice({...price, max: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Brand</p>
              <div className="flex flex-wrap gap-2">
                {brandOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, brand, setBrand)} className={`px-3 py-1 rounded-full border text-sm ${brand.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <section className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
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
                <ul className="mt-2 text-sm text-gray-700 list-disc ml-5">
                  {p.features.map((f, i)=> (<li key={i}>{f}</li>))}
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">₹{p.price.toLocaleString()}</span>
                  {p.inStock ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                  )}
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
          ))}
        </section>
      </div>
    </main>
  );
};

export default SunglassesPage;

