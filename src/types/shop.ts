export type ShopCategory =
  | 'spectacles'
  | 'sunglasses'
  | 'contact-lenses'
  | 'frames'
  | 'solutions';

export interface ShopProduct {
  id: string;
  productCode: string;
  name: string;
  category: ShopCategory;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  gst?: number;
  stock: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  brand: string;
  description: string;
  shortDescription?: string;
  features: string[];
  specifications: Record<string, string>;
  tags?: string[];
  requiresPrescription?: boolean;
}

export interface CartItem {
  id: string;
  productCode: string;
  name: string;
  category: ShopCategory;
  categoryLabel: string;
  price: number;
  image: string;
  quantity: number;
  selectedPower?: string;
}

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  estimatedDelivery: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}
