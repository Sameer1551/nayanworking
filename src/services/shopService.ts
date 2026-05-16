import { CartItem, OrderRecord, ShopCategory, ShopProduct } from '../types/shop';
import { API_BASE_URL } from '../config/apiConfig';
import authService from './authService';

const CART_STORAGE_KEY = 'shop-cart';
const LAST_ORDER_STORAGE_KEY = 'shop-last-order';
const ORDERS_HISTORY_KEY = 'shop-orders-history';

const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'SPEC-001',
    productCode: 'SPEC-001',
    name: 'Classic Black Frame Spectacles',
    category: 'spectacles',
    categoryLabel: 'Spectacles',
    price: 2500,
    originalPrice: 3500,
    gst: 450,
    stock: 15,
    image: 'https://images.pexels.com/photos/2608849/pexels-photo-2608849.jpeg?auto=compress&cs=tinysrgb&w=600',
    images: [
      'https://images.pexels.com/photos/2608849/pexels-photo-2608849.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2522665/pexels-photo-2522665.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    rating: 4.5,
    reviews: 156,
    brand: 'Ray-Ban',
    description:
      'A lightweight everyday spectacle frame with anti-glare lens compatibility and a clean rectangular silhouette.',
    shortDescription: 'A premium everyday spectacle frame for work, study, and all-day wear.',
    features: ['Anti-glare compatible', 'UV protection', 'Lightweight frame', '2-year warranty'],
    specifications: {
      'Frame Material': 'Titanium alloy',
      Shape: 'Rectangle',
      Color: 'Black',
      Warranty: '2 years',
      Weight: '18g',
    },
    tags: ['men', 'women', 'rectangle'],
  },
  {
    id: 'SPEC-002',
    productCode: 'SPEC-002',
    name: 'Blue Light Blocking Spectacles',
    category: 'spectacles',
    categoryLabel: 'Spectacles',
    price: 2999,
    originalPrice: 3999,
    gst: 540,
    stock: 9,
    image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.6,
    reviews: 203,
    brand: 'Zeiss',
    description:
      'Designed for long screen hours with blue light filtering support and a durable TR90 frame.',
    shortDescription: 'Ideal for office work, students, and digital eye-strain reduction.',
    features: ['Blue light filter', 'TR90 frame', 'Lightweight', 'Computer-friendly'],
    specifications: {
      'Frame Material': 'TR90',
      Shape: 'Square',
      Color: 'Navy blue',
      Warranty: '1 year',
      Weight: '16g',
    },
    tags: ['computer', 'office'],
  },
  {
    id: 'SUN-001',
    productCode: 'SUN-001',
    name: 'UV Protection Sunglasses',
    category: 'sunglasses',
    categoryLabel: 'Sunglasses',
    price: 3500,
    originalPrice: 4500,
    gst: 630,
    stock: 8,
    image: 'https://images.pexels.com/photos/2522665/pexels-photo-2522665.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.8,
    reviews: 124,
    brand: 'Oakley',
    description:
      'Polarized sunglasses with UV400 protection built for bright daytime use and comfort.',
    shortDescription: 'Polarized lenses with a clean lifestyle fit.',
    features: ['UV400 protection', 'Polarized lens', 'Scratch resistant', 'Travel case included'],
    specifications: {
      'Lens Type': 'Polarized',
      'UV Rating': 'UV400',
      Frame: 'Full-rim',
      Color: 'Brown / black',
      Warranty: '1 year',
    },
    tags: ['polarized', 'summer'],
  },
  {
    id: 'SUN-002',
    productCode: 'SUN-002',
    name: 'Sports Performance Sunglasses',
    category: 'sunglasses',
    categoryLabel: 'Sunglasses',
    price: 3999,
    originalPrice: 4999,
    gst: 720,
    stock: 11,
    image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.4,
    reviews: 89,
    brand: 'Nike',
    description:
      'A wrap-around design with impact-resistant lenses and a grip-first sports fit.',
    shortDescription: 'Performance eyewear for outdoor activity and travel.',
    features: ['Wrap frame', 'Impact resistant', 'Non-slip temples', 'Lightweight'],
    specifications: {
      'Lens Type': 'Mirrored',
      'UV Rating': 'UV400',
      Frame: 'Wrap',
      Color: 'Mirror blue',
      Warranty: '1 year',
    },
    tags: ['sports', 'outdoor'],
  },
  {
    id: 'LENS-001',
    productCode: 'LENS-001',
    name: 'Daily Disposable Contact Lenses',
    category: 'contact-lenses',
    categoryLabel: 'Contact Lenses',
    price: 1200,
    originalPrice: 1500,
    gst: 216,
    stock: 45,
    image: 'https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.3,
    reviews: 211,
    brand: 'Acuvue',
    description:
      'Soft daily disposable lenses with high comfort and easy routine replacement.',
    shortDescription: 'Comfortable daily wear lenses for beginners and regular users.',
    features: ['Daily disposable', 'Moisture lock', 'UV blocking', 'Soft silicone hydrogel'],
    specifications: {
      Material: 'Silicone hydrogel',
      Diameter: '14.2 mm',
      'Base Curve': '8.5 mm',
      Water: '48%',
      Replacement: 'Daily',
    },
    tags: ['daily', 'soft'],
    requiresPrescription: true,
  },
  {
    id: 'LENS-002',
    productCode: 'LENS-002',
    name: 'Monthly Comfort Contact Lenses',
    category: 'contact-lenses',
    categoryLabel: 'Contact Lenses',
    price: 1499,
    originalPrice: 1799,
    gst: 270,
    stock: 30,
    image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.4,
    reviews: 132,
    brand: 'Bausch + Lomb',
    description:
      'Monthly contact lenses with stable hydration and reliable everyday comfort.',
    shortDescription: 'A cost-effective monthly lens option with strong comfort.',
    features: ['Monthly replacement', 'Hydrogel material', 'Clear vision', 'Easy handling'],
    specifications: {
      Material: 'Hydrogel',
      Diameter: '14.0 mm',
      'Base Curve': '8.6 mm',
      Water: '55%',
      Replacement: 'Monthly',
    },
    tags: ['monthly'],
    requiresPrescription: true,
  },
  {
    id: 'FRAME-001',
    productCode: 'FRAME-001',
    name: 'Premium Metal Frame',
    category: 'frames',
    categoryLabel: 'Frames',
    price: 4000,
    originalPrice: 5200,
    gst: 720,
    stock: 12,
    image: 'https://images.pexels.com/photos/1152359/pexels-photo-1152359.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.6,
    reviews: 77,
    brand: 'Titan',
    description:
      'A premium standalone frame crafted for lens customization and long-term daily use.',
    shortDescription: 'Minimal metal frame ready for prescription or fashion lenses.',
    features: ['Metal build', 'Adjustable nose pads', 'Lens-ready', 'Premium finish'],
    specifications: {
      Material: 'Metal',
      Shape: 'Round',
      Color: 'Gold',
      Size: 'Medium',
      Warranty: '2 years',
    },
    tags: ['metal', 'minimal'],
  },
  {
    id: 'FRAME-002',
    productCode: 'FRAME-002',
    name: 'Designer Black Frame',
    category: 'frames',
    categoryLabel: 'Frames',
    price: 6999,
    originalPrice: 8499,
    gst: 1260,
    stock: 6,
    image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.7,
    reviews: 45,
    brand: 'Gucci',
    description:
      'A bold acetate frame for customers who want a premium branded look with customizable lenses.',
    shortDescription: 'Designer statement frame with strong daily durability.',
    features: ['Designer finish', 'Acetate build', 'Comfort fit', 'Premium case included'],
    specifications: {
      Material: 'Acetate',
      Shape: 'Rectangle',
      Color: 'Black',
      Size: 'Large',
      Warranty: '2 years',
    },
    tags: ['designer'],
  },
  {
    id: 'SOL-001',
    productCode: 'SOL-001',
    name: 'Anti-Glare Lens Cleaning Solution',
    category: 'solutions',
    categoryLabel: 'Solutions',
    price: 800,
    originalPrice: 999,
    gst: 144,
    stock: 30,
    image: 'https://images.pexels.com/photos/4045479/pexels-photo-4045479.jpeg?auto=compress&cs=tinysrgb&w=600',
    rating: 4.2,
    reviews: 64,
    brand: 'Nayan Care',
    description:
      'Lens cleaning solution for spectacles and sunglasses that helps reduce smudges and residue.',
    shortDescription: 'Daily eyewear cleaning solution for clear, streak-free lenses.',
    features: ['Anti-smudge', 'Quick dry', 'Travel safe bottle', 'Works on coated lenses'],
    specifications: {
      Volume: '150 ml',
      Usage: 'Lens cleaning',
      Compatibility: 'Spectacles and sunglasses',
      Finish: 'Streak free',
      Safety: 'Coating safe',
    },
    tags: ['care', 'cleaning'],
  },
];

const getCategoryLabel = (category: ShopCategory) =>
  SHOP_PRODUCTS.find((product) => product.category === category)?.categoryLabel ?? category;

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const emitCartUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

const calculateTax = (subtotal: number) => Math.round(subtotal * 0.18);

const calculateShipping = (subtotal: number) => (subtotal >= 1000 ? 0 : 150);

class ShopService {
  getAllProducts() {
    return SHOP_PRODUCTS;
  }

  getFeaturedProducts(limit = 6) {
    return [...SHOP_PRODUCTS]
      .sort((left, right) => right.rating - left.rating)
      .slice(0, limit);
  }

  getProductsByCategory(category: ShopCategory) {
    return SHOP_PRODUCTS.filter((product) => product.category === category);
  }

  getCategoryLabel(category: ShopCategory) {
    return getCategoryLabel(category);
  }

  searchProducts(query: string, category?: ShopCategory, maxPrice?: number) {
    const normalizedQuery = query.trim().toLowerCase();

    return SHOP_PRODUCTS.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.productCode.toLowerCase().includes(normalizedQuery) ||
        product.categoryLabel.toLowerCase().includes(normalizedQuery) ||
        product.features.some((feature) => feature.toLowerCase().includes(normalizedQuery));

      const matchesCategory = !category || product.category === category;
      const matchesPrice = maxPrice === undefined || product.price <= maxPrice;

      return matchesQuery && matchesCategory && matchesPrice;
    });
  }

  getProductByCode(productCode?: string) {
    if (!productCode) {
      return null;
    }

    return (
      SHOP_PRODUCTS.find(
        (product) => product.productCode.toLowerCase() === productCode.toLowerCase(),
      ) ?? null
    );
  }

  getCartItems(): CartItem[] {
    return readJson<CartItem[]>(CART_STORAGE_KEY, []);
  }

  getCartCount() {
    return this.getCartItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  getCartSubtotal() {
    return this.getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addToCart(product: ShopProduct, quantity = 1, selectedPower?: string) {
    const items = this.getCartItems();
    const lineId = selectedPower
      ? `${product.productCode}:${selectedPower}`
      : product.productCode;
    const existingItem = items.find((item) => item.id === lineId);

    let nextItems: CartItem[];
    if (existingItem) {
      nextItems = items.map((item) =>
        item.id === lineId
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item,
      );
    } else {
      nextItems = [
        ...items,
        {
          id: lineId,
          productCode: product.productCode,
          name: product.name,
          category: product.category,
          categoryLabel: product.categoryLabel,
          price: product.price,
          image: product.image,
          quantity: Math.min(quantity, product.stock),
          selectedPower,
        },
      ];
    }

    writeJson(CART_STORAGE_KEY, nextItems);
    emitCartUpdate();
    return nextItems;
  }

  replaceCart(items: CartItem[]) {
    writeJson(CART_STORAGE_KEY, items);
    emitCartUpdate();
  }

  buyNow(product: ShopProduct, quantity = 1, selectedPower?: string) {
    const item: CartItem = {
      id: selectedPower ? `${product.productCode}:${selectedPower}` : product.productCode,
      productCode: product.productCode,
      name: product.name,
      category: product.category,
      categoryLabel: product.categoryLabel,
      price: product.price,
      image: product.image,
      quantity: Math.min(quantity, product.stock),
      selectedPower,
    };

    this.replaceCart([item]);
    return item;
  }

  updateCartItemQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeCartItem(id);
    }

    const nextItems = this.getCartItems().map((item) =>
      item.id === id ? { ...item, quantity } : item,
    );
    writeJson(CART_STORAGE_KEY, nextItems);
    emitCartUpdate();
    return nextItems;
  }

  removeCartItem(id: string) {
    const nextItems = this.getCartItems().filter((item) => item.id !== id);
    writeJson(CART_STORAGE_KEY, nextItems);
    emitCartUpdate();
    return nextItems;
  }

  clearCart() {
    writeJson(CART_STORAGE_KEY, []);
    emitCartUpdate();
  }



  getOrdersHistory() {
    return readJson<OrderRecord[]>(ORDERS_HISTORY_KEY, []);
  }

  async validateCouponWithBackend(code: string) {
    const normalizedCode = code.trim();
    if (!normalizedCode) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/coupons/validate/${normalizedCode}`, {
        method: 'GET',
        headers: authService.getAuthHeaders()
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to validate coupon with backend:', error);
      return null;
    }
  }

  getCouponDiscount(coupon: any, subtotal: number, userEmail?: string) {
    if (!coupon || !coupon.isActive) return 0;
    
    // Check first purchase rule if applicable
    if (coupon.isFirstPurchaseOnly) {
      const history = this.getOrdersHistory();
      const hasPreviousOrders = history.some(order => order.shippingAddress.email === userEmail);
      if (hasPreviousOrders) return 0;
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return 0;
    }

    return Math.round(subtotal * (coupon.discountPercentage / 100));
  }

  createOrder(
    shippingAddress: OrderRecord['shippingAddress'],
    discountAmount = 0
  ): OrderRecord | null {
    const items = this.getCartItems();
    if (items.length === 0) {
      return null;
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = calculateTax(discountedSubtotal);
    const shipping = calculateShipping(discountedSubtotal);
    const total = discountedSubtotal + tax + shipping;
    const createdAt = new Date();
    const estimatedDelivery = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);

    const order: OrderRecord = {
      orderNumber: `ORD-${createdAt.getTime().toString(36).toUpperCase()}`,
      createdAt: createdAt.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
      items,
      subtotal: discountedSubtotal,
      tax,
      shipping,
      total,
      shippingAddress,
    };

    // Save to last order
    writeJson(LAST_ORDER_STORAGE_KEY, order);
    
    // Save to history
    const history = this.getOrdersHistory();
    writeJson(ORDERS_HISTORY_KEY, [...history, order]);

    this.clearCart();
    return order;
  }

  getLastOrder() {
    return readJson<OrderRecord | null>(LAST_ORDER_STORAGE_KEY, null);
  }
}

const shopService = new ShopService();

export default shopService;
