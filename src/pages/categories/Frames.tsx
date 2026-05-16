import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import authService from '../../services/authService';
import shopService from '../../services/shopService';

type Frame = {
  id: number;
  name: string;
  brand: string;
  image: string;
  material: 'Metal' | 'Plastic' | 'Titanium';
  color: 'Black' | 'Brown' | 'Gold' | 'Silver' | 'Blue';
  size: 'Small' | 'Medium' | 'Large';
  shape: 'Round' | 'Square' | 'Rectangle' | 'Aviator';
  price: number;
  inStock: boolean;
  createdAt: string;
  subcategory: 'Metal Frames' | 'Plastic Frames' | 'Rimless Frames' | 'Semi-Rimless Frames';
};

const data: Frame[] = [
  { id: 1, name: 'Slim Metal', brand: 'Ray-Ban', image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Metal', color: 'Gold', size: 'Medium', shape: 'Round', price: 3999, inStock: true, createdAt: '2025-04-15', subcategory: 'Metal Frames' },
  { id: 2, name: 'Bold Plastic', brand: 'Gucci', image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Plastic', color: 'Black', size: 'Large', shape: 'Rectangle', price: 6999, inStock: false, createdAt: '2025-02-22', subcategory: 'Plastic Frames' },
  { id: 3, name: 'Feather Rimless', brand: 'Titan', image: 'https://images.pexels.com/photos/1557739/pexels-photo-1557739.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Titanium', color: 'Silver', size: 'Small', shape: 'Square', price: 8999, inStock: true, createdAt: '2025-05-01', subcategory: 'Rimless Frames' },
  { id: 4, name: 'Semi-Rim Breeze', brand: 'Vogue', image: 'https://images.pexels.com/photos/819530/pexels-photo-819530.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', material: 'Metal', color: 'Brown', size: 'Medium', shape: 'Aviator', price: 4999, inStock: true, createdAt: '2025-03-11', subcategory: 'Semi-Rimless Frames' },
];

const FramesPage: React.FC = () => {
  const [subcat, setSubcat] = useState<'All' | Frame['subcategory']>('All');
  const [materials, setMaterials] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [price, setPrice] = useState<{ min: number; max: number }>({ min: 0, max: 20000 });
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'best' | 'newest'>('newest');
  const [addedItems, setAddedItems] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, p: Frame, action: 'cart' | 'buy') => {
    if (!authService.isAuthenticated()) {
      e.preventDefault();
      navigate('/customer/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Map dummy product to ShopProduct format
    const shopProduct: any = {
      id: `FRAME-${p.id}`,
      productCode: `FRAME-${p.id}`,
      name: p.name,
      category: 'frames',
      categoryLabel: 'Frames',
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
    document.title = 'Frames | Nayan Eye Care';
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    setMeta('description', 'Metal, plastic, rimless and semi-rimless frames. Filter by material, color, size, shape, brand and price.');
    setMeta('keywords', 'frames, spectacle frames, rimless, semi-rimless, titanium frames');
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const toggle = (val: string, arr: string[], setArr: (v: string[]) => void) => setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (subcat !== 'All') list = list.filter(p => p.subcategory === subcat);
    if (materials.length) list = list.filter(p => materials.includes(p.material));
    if (colors.length) list = list.filter(p => colors.includes(p.color));
    if (sizes.length) list = list.filter(p => sizes.includes(p.size));
    if (shapes.length) list = list.filter(p => shapes.includes(p.shape));
    if (brands.length) list = list.filter(p => brands.includes(p.brand));
    list = list.filter(p => p.price >= price.min && p.price <= price.max);
    switch (sortBy) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'newest': list.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return list;
  }, [subcat, materials, colors, sizes, shapes, brands, price, sortBy]);

  const subcategories: Frame['subcategory'][] = ['Metal Frames', 'Plastic Frames', 'Rimless Frames', 'Semi-Rimless Frames'];
  const materialOpts = ['Metal', 'Plastic', 'Titanium'];
  const colorOpts = ['Black', 'Brown', 'Gold', 'Silver', 'Blue'];
  const sizeOpts = ['Small', 'Medium', 'Large'];
  const shapeOpts = ['Round', 'Square', 'Rectangle', 'Aviator'];
  const brandOpts = ['Ray-Ban', 'Gucci', 'Titan', 'Vogue'];

  return (
    <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Frames' }]} />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Frames</h1>
          <p className="text-gray-600">Zoom images to inspect details. Material specs included.</p>
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
              <p className="text-sm font-medium text-gray-700 mb-2">Frame Material</p>
              <div className="flex flex-wrap gap-2">
                {materialOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, materials, setMaterials)} className={`px-3 py-1 rounded-full border text-sm ${materials.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colorOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, colors, setColors)} className={`px-3 py-1 rounded-full border text-sm ${colors.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, sizes, setSizes)} className={`px-3 py-1 rounded-full border text-sm ${sizes.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Shape</p>
              <div className="flex flex-wrap gap-2">
                {shapeOpts.map(opt => (
                  <button key={opt} onClick={()=>toggle(opt, shapes, setShapes)} className={`px-3 py-1 rounded-full border text-sm ${shapes.includes(opt)?'bg-gray-900 text-white border-gray-900':'bg-gray-50 text-gray-700'}`}>{opt}</button>
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
                <img src={p.image} alt={p.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform" />
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
                  <div className="flex justify-between"><span>Color</span><span className="font-medium">{p.color}</span></div>
                  <div className="flex justify-between"><span>Size</span><span className="font-medium">{p.size}</span></div>
                  <div className="flex justify-between"><span>Shape</span><span className="font-medium">{p.shape}</span></div>
                </div>
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

export default FramesPage;

