import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import authService from '../../services/authService';
import shopService from '../../services/shopService';

type Lens = {
  id: number;
  name: string;
  brand: string;
  image: string;
  material: 'Hydrogel' | 'Silicone Hydrogel';
  waterContent: number; // %
  diameter: number; // mm
  baseCurve: number; // mm
  price: number;
  inStock: boolean;
  createdAt: string;
  subcategory: 'Daily Disposable' | 'Monthly' | 'Colored' | 'Toric / Multifocal';
};

const data: Lens[] = [
  { id: 1, name: 'Daily Comfort', brand: 'Acuvue', image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Silicone Hydrogel', waterContent: 48, diameter: 14.2, baseCurve: 8.5, price: 1299, inStock: true, createdAt: '2025-01-05', subcategory: 'Daily Disposable' },
  { id: 2, name: 'Monthly Clear', brand: 'Bausch+Lomb', image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Hydrogel', waterContent: 55, diameter: 14.0, baseCurve: 8.6, price: 1499, inStock: true, createdAt: '2024-12-10', subcategory: 'Monthly' },
  { id: 3, name: 'Color Pop', brand: 'FreshLook', image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Hydrogel', waterContent: 45, diameter: 14.5, baseCurve: 8.6, price: 1999, inStock: false, createdAt: '2025-06-01', subcategory: 'Colored' },
  { id: 4, name: 'Toric Precision', brand: 'CooperVision', image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Silicone Hydrogel', waterContent: 47, diameter: 14.5, baseCurve: 8.7, price: 2499, inStock: true, createdAt: '2025-05-10', subcategory: 'Toric / Multifocal' },
];

const ContactLensesPage: React.FC = () => {
  const [subcat, setSubcat] = useState<'All' | Lens['subcategory']>('All');
  const [materials, setMaterials] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [water, setWater] = useState<{ min: number; max: number }>({ min: 30, max: 70 });
  const [diameter, setDiameter] = useState<{ min: number; max: number }>({ min: 13.8, max: 15.0 });
  const [baseCurve, setBaseCurve] = useState<{ min: number; max: number }>({ min: 8.3, max: 9.0 });
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');
  const [prescription, setPrescription] = useState<Record<number, number>>({});
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: Lens, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map dummy product to ShopProduct format
    const shopProduct: any = {
      id: `LENS-${p.id}`,
      productCode: `LENS-${p.id}`,
      name: p.name,
      category: 'contact-lenses',
      categoryLabel: 'Contact Lenses',
      price: p.price,
      gst: Math.round(p.price * 0.18),
      stock: p.inStock ? 10 : 0,
      image: p.image,
      brand: p.brand
    };

    const power = prescription[p.id];

    if (action === 'cart') {
      shopService.addToCart(shopProduct, 1, power?.toString());
      setAddedItems(prev => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [p.id]: false }));
      }, 2000);
    } else {
      shopService.buyNow(shopProduct, 1, power?.toString());
      navigate('/checkout');
    }
  };

  useEffect(() => {
    document.title = 'Contact Lenses | Nayan Eye Care';
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    setMeta('description', 'Daily, monthly, colored and toric/multifocal contact lenses. Filter by material, water content, diameter, base curve, brand, and price.');
    setMeta('keywords', 'contact lenses, daily lenses, toric, multifocal, colored lenses');
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const toggle = (val: string, arr: string[], setArr: (v: string[]) => void) => setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (subcat !== 'All') list = list.filter(p => p.subcategory === subcat);
    if (materials.length) list = list.filter(p => materials.includes(p.material));
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    list = list.filter(p => p.price >= price.min && p.price <= price.max);
    list = list.filter(p => p.waterContent >= water.min && p.waterContent <= water.max);
    list = list.filter(p => p.diameter >= diameter.min && p.diameter <= diameter.max);
    list = list.filter(p => p.baseCurve >= baseCurve.min && p.baseCurve <= baseCurve.max);
    switch (sortBy) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'newest': list.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return list;
  }, [subcat, materials, brands, water, diameter, baseCurve, price, sortBy]);

  const subcategories: Lens['subcategory'][] = ['Daily Disposable', 'Monthly', 'Colored', 'Toric / Multifocal'];
  const materialOpts = ['Hydrogel', 'Silicone Hydrogel'];
  const brandOpts = ['Acuvue', 'Bausch+Lomb', 'FreshLook', 'CooperVision'];

  const powerOptions = Array.from({ length: 49 }, (_, i) => (i - 24) * 0.5); // -12 to +12 step 0.5

  return (
    <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Contact Lenses' }]} />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Lenses</h1>
          <p className="text-gray-600">Select your prescription on the product card and proceed to purchase.</p>
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
          <button key={s} onClick={()=>setSubcat(s)} className={`px-4 py-2 rounded-full border ${subcat===s?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="md:col-span-1 bg-white border rounded-xl p-4 h-max">
          <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Material</p>
              <div className="flex flex-wrap gap-2">
                {materialOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, materials, setMaterials)} className={`px-3 py-1 rounded-full border text-sm ${materials.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Water Content (%)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={water.min} onChange={(e)=>setWater({...water, min: Number(e.target.value)})} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={water.max} onChange={(e)=>setWater({...water, max: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Diameter (mm)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={diameter.min} onChange={(e)=>setDiameter({...diameter, min: Number(e.target.value)})} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={diameter.max} onChange={(e)=>setDiameter({...diameter, max: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Base Curve (mm)</p>
              <div className="flex items-center gap-2">
                <input type="number" className="w-24 px-2 py-1 border rounded" value={baseCurve.min} onChange={(e)=>setBaseCurve({...baseCurve, min: Number(e.target.value)})} />
                <span className="text-gray-400">to</span>
                <input type="number" className="w-24 px-2 py-1 border rounded" value={baseCurve.max} onChange={(e)=>setBaseCurve({...baseCurve, max: Number(e.target.value)})} />
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
                  <button key={opt} onClick={()=>toggle(opt, brands, setBrands)} className={`px-3 py-1 rounded-full border text-sm ${brands.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
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
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between"><span>Material</span><span className="font-medium">{p.material}</span></div>
                  <div className="flex justify-between"><span>Water</span><span className="font-medium">{p.waterContent}%</span></div>
                  <div className="flex justify-between"><span>Diameter</span><span className="font-medium">{p.diameter} mm</span></div>
                  <div className="flex justify-between"><span>Base Curve</span><span className="font-medium">{p.baseCurve} mm</span></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">₹{p.price.toLocaleString()}</span>
                  {p.inStock ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">In Stock</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Out of Stock</span>
                  )}
                </div>
                <div className="mt-3">
                  <label className="text-sm text-gray-700 mr-2">Power</label>
                  <select value={prescription[p.id] ?? ''} onChange={(e)=>setPrescription(prev=>({ ...prev, [p.id]: Number(e.target.value) }))} className="px-2 py-2 border rounded-lg">
                    <option value="">Select</option>
                    {powerOptions.map(v=> (<option key={v} value={v}>{v.toFixed(1)} D</option>))}
                  </select>
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
                    disabled={!p.inStock || prescription[p.id]===undefined} 
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${(p.inStock && prescription[p.id]!==undefined) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-500'}`}
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

export default ContactLensesPage;

