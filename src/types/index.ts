export type UserRole = 'caissiere' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  address?: string;
  photoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  priceHT: number;
  tvaRate: number;
  stock: number;
  active: boolean;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleLine {
  productId: string;
  productName: string;
  quantity: number;
  priceHT: number;
  tvaRate: number;
  priceTTC: number;
  totalTTC: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  clientId?: string;
  lines: SaleLine[];
  totalHT: number;
  totalTTC: number;
  amountReceived: number;
  amountReturned: number;
  creditNoteId?: string;
  status: 'completed' | 'cancelled';
  userId: string;
}

export interface CreditNote {
  id: string;
  amount: number;
  clientId?: string;
  date: string;
  used: boolean;
  usedInSaleId?: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  supplier: string;
  invoiceUrl?: string;
  date: string;
  status: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  userId: string;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
  invoiceUrl?: string;
  date: string;
  userId: string;
}

export interface DayClosure {
  id: string;
  date: string;
  sales: { invoiceNumber: string; totalTTC: number }[];
  totalGeneral: number;
  userId: string;
}

export interface SiteSettings {
  restaurantName: string;
  address: string;
  phone: string;
  logoUrl?: string;
  defaultTvaRate: number;
  currency: string;
}
