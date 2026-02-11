import { Category, Product, User, SiteSettings } from '@/types';

export const mockUsers: User[] = [
  { id: '1', email: 'caisse@restaurant.com', name: 'Marie Dupont', role: 'caissiere', active: true },
  { id: '2', email: 'manager@restaurant.com', name: 'Jean Martin', role: 'manager', active: true },
  { id: '3', email: 'admin@restaurant.com', name: 'Pierre Admin', role: 'admin', active: true },
];

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Entrées', description: 'Salades, soupes, amuse-bouches' },
  { id: 'cat2', name: 'Plats Principaux', description: 'Viandes, poissons, pâtes' },
  { id: 'cat3', name: 'Desserts', description: 'Gâteaux, glaces, fruits' },
  { id: 'cat4', name: 'Boissons', description: 'Sodas, jus, eaux' },
  { id: 'cat5', name: 'Boissons Alcoolisées', description: 'Vins, bières, cocktails' },
];

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Salade César', categoryId: 'cat1', priceHT: 8.33, tvaRate: 20, stock: 50, active: true },
  { id: 'p2', name: 'Soupe à l\'oignon', categoryId: 'cat1', priceHT: 5.83, tvaRate: 20, stock: 30, active: true },
  { id: 'p3', name: 'Steak Frites', categoryId: 'cat2', priceHT: 14.17, tvaRate: 20, stock: 25, active: true },
  { id: 'p4', name: 'Saumon Grillé', categoryId: 'cat2', priceHT: 16.67, tvaRate: 20, stock: 20, active: true },
  { id: 'p5', name: 'Pâtes Carbonara', categoryId: 'cat2', priceHT: 10.83, tvaRate: 20, stock: 40, active: true },
  { id: 'p6', name: 'Poulet Rôti', categoryId: 'cat2', priceHT: 12.50, tvaRate: 20, stock: 30, active: true },
  { id: 'p7', name: 'Tiramisu', categoryId: 'cat3', priceHT: 5.83, tvaRate: 20, stock: 35, active: true },
  { id: 'p8', name: 'Crème Brûlée', categoryId: 'cat3', priceHT: 6.67, tvaRate: 20, stock: 30, active: true },
  { id: 'p9', name: 'Coca-Cola', categoryId: 'cat4', priceHT: 2.50, tvaRate: 20, stock: 100, active: true },
  { id: 'p10', name: 'Eau Minérale', categoryId: 'cat4', priceHT: 1.67, tvaRate: 20, stock: 200, active: true },
  { id: 'p11', name: 'Jus d\'Orange', categoryId: 'cat4', priceHT: 3.33, tvaRate: 20, stock: 80, active: true },
  { id: 'p12', name: 'Vin Rouge (verre)', categoryId: 'cat5', priceHT: 4.17, tvaRate: 20, stock: 60, active: true },
  { id: 'p13', name: 'Bière Pression', categoryId: 'cat5', priceHT: 3.75, tvaRate: 20, stock: 80, active: true },
];

export const defaultSiteSettings: SiteSettings = {
  restaurantName: 'Le Bon Goût',
  address: '12 Rue de la Paix, 75002 Paris',
  phone: '+33 1 42 00 00 00',
  defaultTvaRate: 20,
  currency: 'FCFA',
};
