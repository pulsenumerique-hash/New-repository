export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  boutique_id: string;
  is_active: boolean;
  pin_code?: string; // 4-digit PIN for fast cashier switch
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
  logo_url?: string;
  phone?: string;
  address?: string;
  receipt_footer?: string;
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
  min_alert_threshold?: number; // Seuil d'alerte stock faible configurable
  expiration_date?: string; // Date de péremption (YYYY-MM-DD)
  supplier_id?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'cash' | 'credit' | 'mobile_money';
export type PaymentMethodDetail = 'cash' | 'credit' | 'wave' | 'orange_money' | 'free_money' | 'mtn' | 'other';

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
  payment_method_detail?: PaymentMethodDetail;
  client_id?: string | null;
  client_name?: string | null;
  cashier_id: string;
  cashier_name: string;
  date: string;
  status: 'completed' | 'cancelled';
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by_name?: string;
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
  due_date?: string; // Date limite de remboursement
  last_reminder_date?: string; // Horodatage du dernier rappel
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  boutique_id: string;
  name: string;
  phone?: string;
  address?: string;
  debt_balance: number; // Montant dû au fournisseur
  total_purchased: number;
  total_paid: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierPayment {
  id: string;
  boutique_id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  payment_method: 'cash' | 'mobile_money' | 'other';
  notes?: string;
  author_name: string;
  created_by?: string;
  date: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'water'
  | 'salary'
  | 'transport'
  | 'packaging'
  | 'loss'
  | 'maintenance'
  | 'other'
  | 'loyer'
  | 'electricite_eau'
  | 'salaires'
  | 'fournitures'
  | 'autre';

export interface Expense {
  id: string;
  boutique_id: string;
  category: ExpenseCategory;
  category_label: string;
  amount: number;
  description: string;
  payment_method: 'cash' | 'mobile_money';
  author_id?: string;
  author_name: string;
  date: string;
  created_at: string;
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
  total_mobile_money_sales?: number;
  total_refunds: number;
  total_withdrawals: number;
  total_injections: number;
  total_expenses?: number;
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
  user_role?: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'CLOSE_CASH'
    | 'REFUND'
    | 'CANCEL_SALE'
    | 'EXPENSE'
    | 'SUPPLIER_PAYMENT'
    | 'BACKUP_EXPORT'
    | 'BACKUP_RESTORE'
    | 'BACKUP'
    | 'RESTORE';
  entity_type:
    | 'product'
    | 'sale'
    | 'client'
    | 'refund'
    | 'cash_movement'
    | 'cash_closing'
    | 'user'
    | 'auth'
    | 'supplier'
    | 'expense'
    | 'backup'
    | 'boutique';
  entity_id?: string;
  details: string;
  device_info?: string;
  timestamp: string;
  created_at?: string;
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
  solde_caisse: number; // Capital + Ventes Cash + Remboursements - Retraits + Injections - Dépenses Cash
  ventes_jour: number;
  ventes_semaine: number;
  ventes_mois: number;
  ventes_cash_total: number;
  ventes_mobile_money_total: number;
  ventes_credit_total: number;
  valeur_stock_achat: number;
  valeur_stock_vente: number;
  total_credits_en_cours: number;
  nb_clients_debiteurs: number;
  nb_credits_en_retard: number;
  total_dettes_fournisseurs: number;
  total_depenses_mois: number;
  benefice_brut_estime: number; // Total ventes réalisées - Coût d'achat des produits vendus
  benefice_net_reel: number; // Marge brute - Dépenses réelles
  nb_produits: number;
  nb_produits_alerte: number;
  nb_produits_perimes: number;
  nb_produits_bientot_perimes: number; // J-7
  retraits_total: number;
  injections_total: number;
}

export interface AppVersionInfo {
  version: string;
  release_date: string;
  apk_url: string;
  apk_size: string;
  changelog: string[];
  mandatory: boolean;
}

export interface SyncEventPayload<T = unknown> {
  action: 'DATA_CREATED' | 'DATA_UPDATED' | 'DATA_DELETED' | 'CASH_CLOSED' | 'SESSION_REVOKED';
  entity: 'product' | 'sale' | 'client' | 'refund' | 'cash_movement' | 'cash_closing' | 'user' | 'stats' | 'supplier' | 'expense';
  id?: string;
  data?: T;
  timestamp: string;
  source_device?: string;
  user_id?: string;
}
