export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  boutique_id: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  avatar?: string;
}

export interface Boutique {
  id: string;
  name: string;
  owner_id: string;
  initial_capital: number;
  currency: string;
  created_at: string;
}

export interface Product {
  id: string;
  boutique_id: string;
  name: string;
  category: string;
  package_type: string; // e.g. "Carton", "Paquet", "Sac", "Casier", "Boîte", "Unité"
  package_purchase_price: number; // Prix d'achat du conditionnement (ex: 10 000 FCFA)
  units_per_package: number; // Nombre d'unités par conditionnement (ex: 20)
  unit_purchase_price: number; // Calculé auto: package_purchase_price / units_per_package
  unit_sale_price: number; // Prix de vente à l'unité saisi
  package_stock: number; // Quantité en conditionnements entiers
  unit_stock: number; // Quantité totale en unités disponibles à la vente (package_stock * units_per_package + extra)
  min_alert_threshold?: number;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'cash' | 'credit';

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number; // In retail units
  unit_price: number;
  total_price: number;
  unit_purchase_price: number;
}

export interface Sale {
  id: string;
  boutique_id: string;
  items: SaleItem[];
  total_amount: number;
  payment_type: PaymentType;
  client_id?: string | null;
  client_name?: string | null;
  cashier_id: string;
  cashier_name: string;
  date: string;
  created_at: string;
}

export interface Client {
  id: string;
  boutique_id: string;
  name: string;
  phone?: string;
  credit_balance: number; // Montant actuellement dû
  total_credit_purchased: number;
  total_repaid: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  boutique_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  note?: string;
  cashier_id: string;
  cashier_name: string;
  date: string;
  created_at: string;
}

export interface CashMovement {
  id: string;
  boutique_id: string;
  type: 'withdrawal' | 'injection';
  amount: number;
  reason: string;
  author: string; // Nom de la personne ayant effectué
  cashier_id: string;
  date: string;
  created_at: string;
}

export interface CashClosing {
  id: string;
  boutique_id: string;
  date: string;
  theoretical_cash: number;
  counted_cash: number;
  discrepancy: number; // counted - theoretical (positif = excédent, négatif = manquant)
  total_cash_sales: number;
  total_credit_sales: number;
  total_refunds: number;
  total_withdrawals: number;
  total_injections: number;
  notes?: string;
  closed_by_id: string;
  closed_by_name: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  boutique_id: string;
  user_id: string;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CLOSE_CASH' | 'REFUND';
  entity_type: 'product' | 'sale' | 'client' | 'refund' | 'cash_movement' | 'cash_closing' | 'user' | 'auth';
  entity_id?: string;
  details: string;
  device_info?: string;
  timestamp: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  user_name: string;
  boutique_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ip: string;
  last_active: string;
  is_current?: boolean;
}

export interface DashboardStats {
  solde_caisse: number; // Capital + Ventes Cash + Remboursements - Achats/Dépenses - Retraits + Injections
  ventes_jour: number;
  ventes_semaine: number;
  ventes_mois: number;
  valeur_stock_achat: number;
  valeur_stock_vente: number;
  total_credits_en_cours: number;
  nb_clients_debiteurs: number;
  nb_produits: number;
  nb_produits_alerte: number;
  retraits_total: number;
  injections_total: number;
}

export interface SyncEventPayload<T = unknown> {
  action: 'DATA_CREATED' | 'DATA_UPDATED' | 'DATA_DELETED' | 'CASH_CLOSED' | 'SESSION_REVOKED';
  entity: 'product' | 'sale' | 'client' | 'refund' | 'cash_movement' | 'cash_closing' | 'user' | 'stats';
  id?: string;
  data?: T;
  timestamp: string;
  source_device?: string;
  user_id?: string;
}
