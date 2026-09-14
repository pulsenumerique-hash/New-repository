import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Calculator,
  ArrowRight,
  TrendingUp,
  Boxes,
  Percent,
  CheckCircle2,
  X,
  Zap,
  ShieldAlert,
  FileText,
  Bell,
  Calendar,
  Clock,
  Truck,
  Layers,
  Tag,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product, PackagingType } from '../../types';
import { formatCurrency, formatDateShort } from '../../lib/formatters';
import { isPackProduct, getItemsPerPack, getProductStockBreakdown } from '../../lib/packaging';
import { StockAlertBanner } from './StockAlertBanner';
import { QuickRestockModal } from './QuickRestockModal';
import { SupplierOrderModal } from './SupplierOrderModal';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';

export const ProductManagement: React.FC = () => {
  const { products, suppliers, createProduct, updateProduct, deleteProduct } = useApp();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'all' | 'alert' | 'out' | 'healthy' | 'expired' | 'expiring_soon'
  >('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Form states: Type de conditionnement (Article ou Paquet)
  const [packagingType, setPackagingType] = useState<PackagingType>('article');
  const [itemsPerPack, setItemsPerPack] = useState<number | ''>(12);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Épicerie');
  const [packageType, setPackageType] = useState('Paquet');
  const [packagePurchasePrice, setPackagePurchasePrice] = useState<number | ''>(10000);
  const [unitPurchasePrice, setUnitPurchasePrice] = useState<number | ''>(500);
  const [unitSalePrice, setUnitSalePrice] = useState<number | ''>(600);
  const [packSalePrice, setPackSalePrice] = useState<number | ''>('');
  const [packageStock, setPackageStock] = useState<number | ''>(5);
  const [extraArticles, setExtraArticles] = useState<number | ''>(0);
  const [unitStock, setUnitStock] = useState<number | ''>(35);
  const [minAlertThreshold, setMinAlertThreshold] = useState<number | ''>(10);
  const [barcode, setBarcode] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Warning when changing items per pack on an existing product with stock
  const [packConversionWarning, setPackConversionWarning] = useState<{
    show: boolean;
    oldItemsPerPack: number;
    newItemsPerPack: number;
    unitStock: number;
    onConfirm: () => void;
  } | null>(null);

  // Expiration helper
  const getExpirationStatus = (expDate?: string) => {
    if (!expDate) return { status: 'none', label: 'Aucune', days: 999 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'expired', label: `Périmé (${Math.abs(diffDays)}j)`, days: diffDays };
    }
    if (diffDays <= 7) {
      return { status: 'warning', label: `Expire dans ${diffDays}j (J-7)`, days: diffDays };
    }
    return { status: 'good', label: `${diffDays}j restants`, days: diffDays };
  };

  const isPack = packagingType === 'pack';
  const effectiveItemsPerPack = isPack ? Math.max(2, Math.floor(Number(itemsPerPack) || 2)) : 1;

  // Calcul automatique du prix d'achat unitaire
  const computedUnitPurchasePrice = useMemo(() => {
    if (packagingType === 'article') {
      return Number(unitPurchasePrice) || 0;
    }
    const pkgPrice = Number(packagePurchasePrice) || 0;
    const items = Number(itemsPerPack) || 1;
    if (items <= 0) return 0;
    return Math.round((pkgPrice / items) * 100) / 100;
  }, [packagingType, unitPurchasePrice, packagePurchasePrice, itemsPerPack]);

  // Marge unitaire en FCFA et %
  const unitMargin = useMemo(() => {
    const sale = Number(unitSalePrice) || 0;
    return sale - computedUnitPurchasePrice;
  }, [unitSalePrice, computedUnitPurchasePrice]);

  const unitMarginPercent = useMemo(() => {
    if (computedUnitPurchasePrice <= 0) return 0;
    return Math.round((unitMargin / computedUnitPurchasePrice) * 100);
  }, [unitMargin, computedUnitPurchasePrice]);

  // Total d'articles calculé automatiquement pour le stock
  const computedTotalStockArticles = useMemo(() => {
    if (packagingType === 'article') {
      return Number(unitStock) || 0;
    }
    const pkgs = Number(packageStock) || 0;
    const extra = Number(extraArticles) || 0;
    const items = Number(itemsPerPack) || 1;
    return pkgs * items + extra;
  }, [packagingType, unitStock, packageStock, extraArticles, itemsPerPack]);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setPackagingType('article');
    setItemsPerPack(12);
    setName('');
    setCategory('Épicerie');
    setPackageType('Paquet');
    setPackagePurchasePrice(10000);
    setUnitPurchasePrice(500);
    setUnitSalePrice(600);
    setPackSalePrice('');
    setPackageStock(5);
    setExtraArticles(0);
    setUnitStock(35);
    setMinAlertThreshold(10);
    setBarcode('');
    setExpirationDate('');
    setSupplierId('');
    setFormError(null);
    setPackConversionWarning(null);
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    const prodIsPack = isPackProduct(prod);
    const prodItemsPerPack = getItemsPerPack(prod);
    const breakdown = getProductStockBreakdown(prod);

    setPackagingType(prodIsPack ? 'pack' : 'article');
    setItemsPerPack(prodIsPack ? prodItemsPerPack : 12);
    setName(prod.name);
    setCategory(prod.category || 'Épicerie');
    setPackageType(prod.package_type || (prodIsPack ? 'Paquet' : 'Article'));
    setPackagePurchasePrice(prod.package_purchase_price || 0);
    setUnitPurchasePrice(prod.unit_purchase_price || prod.package_purchase_price || 0);
    setUnitSalePrice(prod.unit_sale_price || 0);
    setPackSalePrice(prod.pack_sale_price ?? (prodIsPack ? prod.unit_sale_price * prodItemsPerPack : ''));
    setPackageStock(breakdown.fullPacks);
    setExtraArticles(breakdown.looseArticles);
    setUnitStock(prod.unit_stock);
    setMinAlertThreshold(prod.min_alert_threshold ?? 10);
    setBarcode(prod.barcode || '');
    setExpirationDate(prod.expiration_date || '');
    setSupplierId(prod.supplier_id || '');
    setFormError(null);
    setPackConversionWarning(null);
    setIsModalOpen(true);
  };

  const executeSaveProduct = async () => {
    setIsSubmitting(true);
    try {
      const isPackSelected = packagingType === 'pack';
      const itemsPerPackNumber = isPackSelected ? Math.max(2, Math.floor(Number(itemsPerPack) || 2)) : 1;
      const totalArticles = computedTotalStockArticles;
      const fullPacks = isPackSelected ? Math.floor(totalArticles / itemsPerPackNumber) : totalArticles;

      const payload: Partial<Product> = {
        name: name.trim(),
        category: category.trim(),
        packaging_type: packagingType,
        items_per_pack: isPackSelected ? itemsPerPackNumber : undefined,
        package_type: isPackSelected ? (packageType.trim() || 'Paquet') : 'Article',
        package_purchase_price: isPackSelected ? (Number(packagePurchasePrice) || 0) : (Number(unitPurchasePrice) || 0),
        units_per_package: itemsPerPackNumber,
        unit_purchase_price: computedUnitPurchasePrice,
        unit_sale_price: Number(unitSalePrice) || 0,
        pack_sale_price: isPackSelected && packSalePrice !== '' ? Number(packSalePrice) : (isPackSelected ? (Number(unitSalePrice) || 0) * itemsPerPackNumber : undefined),
        package_stock: fullPacks,
        unit_stock: totalArticles,
        min_alert_threshold: Number(minAlertThreshold) || 10,
        barcode: barcode.trim() || undefined,
        expiration_date: expirationDate.trim() || undefined,
        supplier_id: supplierId.trim() || undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setIsModalOpen(false);
      setPackConversionWarning(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }

    if (packagingType === 'pack') {
      if (itemsPerPack === '' || itemsPerPack === null || itemsPerPack === undefined) {
        setFormError('Indiquez le nombre d’articles contenus dans ce paquet.');
        return;
      }
      const numItems = Number(itemsPerPack);
      if (isNaN(numItems) || numItems < 2 || !Number.isInteger(numItems)) {
        setFormError('Le nombre d’articles par paquet doit être un nombre entier supérieur ou égal à 2.');
        return;
      }
    }

    // Safety check when modifying an existing product with existing stock
    if (editingProduct && editingProduct.unit_stock > 0) {
      const oldIsPack = isPackProduct(editingProduct);
      const oldItems = getItemsPerPack(editingProduct);
      const newItems = packagingType === 'pack' ? Number(itemsPerPack) : 1;

      if ((oldIsPack && packagingType === 'pack' && oldItems !== newItems) || (oldIsPack !== (packagingType === 'pack'))) {
        setPackConversionWarning({
          show: true,
          oldItemsPerPack: oldItems,
          newItemsPerPack: newItems,
          unitStock: editingProduct.unit_stock,
          onConfirm: () => executeSaveProduct(),
        });
        return;
      }
    }

    await executeSaveProduct();
  };

  const handleRequestDelete = (prod: Product) => {
    setProductToDelete(prod);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      if (editingProduct?.id === productToDelete.id) {
        setIsModalOpen(false);
        setEditingProduct(null);
      }
    } catch (err: unknown) {
      alert('Erreur lors de la suppression du produit');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => (p.unit_stock || 0) <= (p.min_alert_threshold ?? 10));
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => (p.unit_stock || 0) <= 0);
  }, [products]);

  const healthyProducts = useMemo(() => {
    return products.filter((p) => (p.unit_stock || 0) > (p.min_alert_threshold ?? 10));
  }, [products]);

  const expiredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.expiration_date) return false;
      return getExpirationStatus(p.expiration_date).status === 'expired';
    });
  }, [products]);

  const expiringSoonProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.expiration_date) return false;
      return getExpirationStatus(p.expiration_date).status === 'warning';
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.package_type.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStockStatus = true;
      const threshold = p.min_alert_threshold ?? 10;
      if (stockStatusFilter === 'alert') {
        matchesStockStatus = (p.unit_stock || 0) <= threshold;
      } else if (stockStatusFilter === 'out') {
        matchesStockStatus = (p.unit_stock || 0) <= 0;
      } else if (stockStatusFilter === 'healthy') {
        matchesStockStatus = (p.unit_stock || 0) > threshold;
      } else if (stockStatusFilter === 'expired') {
        matchesStockStatus = getExpirationStatus(p.expiration_date).status === 'expired';
      } else if (stockStatusFilter === 'expiring_soon') {
        matchesStockStatus = getExpirationStatus(p.expiration_date).status === 'warning';
      }

      return matchesSearch && matchesCat && matchesStockStatus;
    });
  }, [products, search, selectedCategory, stockStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Automatic Stock Alert Banner & Action Center */}
      <StockAlertBanner
        products={products}
        isFilteringAlerts={stockStatusFilter === 'alert'}
        onToggleFilterAlerts={() =>
          setStockStatusFilter((prev) => (prev === 'alert' ? 'all' : 'alert'))
        }
      />

      {/* Top Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Références</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{products.length}</div>
            <div className="text-[10px] text-slate-500 font-medium">Articles enregistrés</div>
          </div>
        </div>

        <div
          onClick={() => setStockStatusFilter((prev) => (prev === 'alert' ? 'all' : 'alert'))}
          className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between gap-4 cursor-pointer transition active:scale-98 ${
            lowStockProducts.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
              lowStockProducts.length > 0
                ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alertes Stock Bas</div>
              <div className="text-2xl font-black text-amber-700 mt-0.5">
                {lowStockProducts.length}
              </div>
              <div className="text-[10px] text-amber-800 font-medium">
                {lowStockProducts.length > 0 ? 'Cliquez pour filtrer' : 'Tous les stocks OK'}
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setStockStatusFilter((prev) => (prev === 'expiring_soon' ? 'all' : 'expiring_soon'))}
          className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between gap-4 cursor-pointer transition active:scale-98 ${
            expiringSoonProducts.length > 0 || expiredProducts.length > 0
              ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/80'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
              expiredProducts.length > 0
                ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse'
                : expiringSoonProducts.length > 0
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Péremptions</div>
              <div className="text-2xl font-black text-rose-950 mt-0.5">
                {expiredProducts.length + expiringSoonProducts.length}
              </div>
              <div className="text-[10px] text-rose-800 font-medium">
                {expiredProducts.length} périmé(s) • {expiringSoonProducts.length} à J-7
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unités en Stock</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {products.reduce((acc, p) => acc + (p.unit_stock || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Disponibles à la vente</div>
          </div>
        </div>
      </div>

      {/* Header with Search, Supplier Order & Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Catalogue Produits & Stock (Gros → Détail)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Conversion automatique du prix d'achat au conditionnement vers l'unité de vente, dates de péremption et gestion proactive des seuils d'alerte.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {lowStockProducts.length > 0 && (
            <button
              id="btn-open-supplier-order"
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-2xl border border-emerald-200 transition"
              title="Générer un bon de commande fournisseur basé sur les seuils d'alerte"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Bon de Commande</span>
            </button>
          )}

          <button
            id="btn-add-product"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Status Tabs Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              id="input-product-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer par nom, conditionnement, code-barres..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 shadow-sm w-full sm:w-auto"
          >
            <option value="all">Toutes les catégories</option>
            <option value="Épicerie">Épicerie</option>
            <option value="Boissons & Eau">Boissons & Eau</option>
            <option value="Produits Laitiers">Produits Laitiers</option>
            <option value="Confiserie & Biscuits">Confiserie & Biscuits</option>
            <option value="Huiles & Condiments">Huiles & Condiments</option>
            <option value="Céréales & Féculents">Céréales & Féculents</option>
            <option value="Hygiène & Entretien">Hygiène & Entretien</option>
          </select>
        </div>

        {/* Quick Stock Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="filter-status-all"
            onClick={() => setStockStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Tous les articles</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            id="filter-status-alert"
            onClick={() => setStockStatusFilter('alert')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'alert'
                ? 'bg-amber-600 text-white shadow-xs'
                : lowStockProducts.length > 0
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alertes Stock Bas</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'alert' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {lowStockProducts.length}
            </span>
          </button>

          <button
            id="filter-status-out"
            onClick={() => setStockStatusFilter('out')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'out'
                ? 'bg-rose-700 text-white shadow-xs'
                : outOfStockProducts.length > 0
                ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ruptures (0 u)</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'out' ? 'bg-rose-800 text-white' : 'bg-rose-200 text-rose-900'
            }`}>
              {outOfStockProducts.length}
            </span>
          </button>

          {/* Expired Filter */}
          <button
            id="filter-status-expired"
            onClick={() => setStockStatusFilter('expired')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'expired'
                ? 'bg-rose-900 text-white shadow-xs'
                : expiredProducts.length > 0
                ? 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Périmés</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'expired' ? 'bg-rose-950 text-white' : 'bg-rose-200 text-rose-900'
            }`}>
              {expiredProducts.length}
            </span>
          </button>

          {/* Expiring Soon J-7 Filter */}
          <button
            id="filter-status-expiring-soon"
            onClick={() => setStockStatusFilter('expiring_soon')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'expiring_soon'
                ? 'bg-amber-700 text-white shadow-xs'
                : expiringSoonProducts.length > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Expire sous 7j (J-7)</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'expiring_soon' ? 'bg-amber-900 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {expiringSoonProducts.length}
            </span>
          </button>

          <button
            id="filter-status-healthy"
            onClick={() => setStockStatusFilter('healthy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockStatusFilter === 'healthy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stock Sécurisé</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              stockStatusFilter === 'healthy' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {healthyProducts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Products Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Produit & Catégorie</th>
                <th className="py-3.5 px-4">Péremption</th>
                <th className="py-3.5 px-4">Conditionnement</th>
                <th className="py-3.5 px-4 text-right">Prix Achat Unitaire</th>
                <th className="py-3.5 px-4 text-right">Prix Vente Unitaire</th>
                <th className="py-3.5 px-4 text-center">Marge Unitaire</th>
                <th className="py-3.5 px-4 text-center">Stock Disponible</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Aucun produit ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.min_alert_threshold && p.unit_stock <= p.min_alert_threshold;
                  const isOut = p.unit_stock <= 0;
                  const margin = p.unit_sale_price - p.unit_purchase_price;
                  const marginPct = p.unit_purchase_price > 0 ? Math.round((margin / p.unit_purchase_price) * 100) : 0;
                  const expStatus = getExpirationStatus(p.expiration_date);
                  const isPack = isPackProduct(p);
                  const itemsPerPackCount = getItemsPerPack(p);
                  const breakdown = getProductStockBreakdown(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <span>{p.category}</span>
                          {p.barcode && <span>• Code: {p.barcode}</span>}
                          {p.supplier_id && (
                            <span className="text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-md font-bold">
                              Fournisseur: {suppliers.find((s) => s.id === p.supplier_id)?.name || 'Assoc.'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiration Date Column */}
                      <td className="py-3.5 px-4">
                        {p.expiration_date ? (
                          expStatus.status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{expStatus.label}</span>
                            </span>
                          ) : expStatus.status === 'warning' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{expStatus.label}</span>
                            </span>
                          ) : (
                            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDateShort(p.expiration_date)}</span>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Non définie</span>
                        )}
                      </td>

                      {/* Conditionnement Column */}
                      <td className="py-3.5 px-4">
                        {isPack ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-900 border border-indigo-200">
                              <Boxes className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Paquet ({itemsPerPackCount} art.)</span>
                            </span>
                            {p.package_purchase_price ? (
                              <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                Achat pqt : {formatCurrency(p.package_purchase_price)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Article</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {formatCurrency(p.unit_purchase_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-950 text-sm">
                        {formatCurrency(p.unit_sale_price)}
                        {isPack && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Pqt: {formatCurrency(p.pack_sale_price || p.unit_sale_price * itemsPerPackCount)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            margin >= 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          +{formatCurrency(margin)} ({marginPct}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-extrabold text-[10px] flex items-center gap-1 shadow-xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Rupture (0)</span>
                            </span>
                            <button
                              id={`btn-stock-alert-restock-${p.id}`}
                              type="button"
                              onClick={() => setQuickRestockProduct(p)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                              title="Réapprovisionner immédiatement"
                            >
                              <Boxes className="w-3 h-3" />
                              <span>Réapprovisionner</span>
                            </button>
                          </div>
                        ) : isLow ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs flex items-center gap-1 shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>{isPack ? breakdown.formattedShort : `${p.unit_stock} art.`}</span>
                            </span>
                            <div className="w-16 h-1 bg-amber-200 rounded-full mt-0.5 overflow-hidden">
                              <div
                                className="h-full bg-amber-600 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((p.unit_stock || 0) / (p.min_alert_threshold ?? 10)) * 100))}%`,
                                }}
                              />
                            </div>
                            <button
                              id={`btn-stock-alert-restock-${p.id}`}
                              type="button"
                              onClick={() => setQuickRestockProduct(p)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                              title="Réapprovisionner immédiatement"
                            >
                              <Boxes className="w-3 h-3 text-slate-950" />
                              <span>Réapprovisionner</span>
                            </button>
                            <span className="text-[10px] text-amber-800 font-bold">
                              Total : {p.unit_stock} articles
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            {isPack ? (
                              <>
                                <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-900">
                                  {breakdown.formattedShort}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  Total : {p.unit_stock} articles
                                </span>
                              </>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-50 border border-emerald-200 text-emerald-900">
                                {p.unit_stock} articles
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Restock Button for EVERY Product */}
                          <button
                            id={`btn-table-restock-${p.id}`}
                            type="button"
                            onClick={() => setQuickRestockProduct(p)}
                            title={`Réapprovisionner ${p.name}`}
                            className="px-2.5 py-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition flex items-center gap-1.5 font-bold text-xs active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Réapprovisionner</span>
                          </button>

                          <button
                            id={`btn-edit-product-${p.id}`}
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Modifier la fiche produit"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {role === 'admin' && (
                            <button
                              id={`btn-delete-product-${p.id}`}
                              type="button"
                              onClick={() => handleRequestDelete(p)}
                              title="Supprimer ce produit"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRÉATION / MODIFICATION AVEC CALCULATEUR GROS -> DÉTAIL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-lg">
                  {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit & Conversion Gros → Détail'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saisie du conditionnement et calcul automatique du coût unitaire
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Alerte de stock direct sur la fiche produit */}
              {editingProduct &&
                (editingProduct.unit_stock <= (editingProduct.min_alert_threshold ?? 10)) && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-rose-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <div className="font-black text-amber-950">
                          {editingProduct.unit_stock <= 0
                            ? 'Alerte Rupture Totale (0 unité en stock)'
                            : `Alerte Stock Faible (${editingProduct.unit_stock} / ${editingProduct.min_alert_threshold ?? 10} unités)`}
                        </div>
                        <div className="text-[11px] text-amber-800 font-medium">
                          Ce produit est sous le seuil d'alerte configuré.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-fiche-alert-restock"
                      onClick={() => {
                        setIsModalOpen(false);
                        setQuickRestockProduct(editingProduct);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-slate-950" />
                      <span>Réapprovisionner</span>
                    </button>
                  </div>
                )}

              {/* 1. Identification Produit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du Produit *
                  </label>
                  <input
                    id="input-prod-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Lait concentré sucré Bonnet Rouge"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Épicerie">Épicerie</option>
                    <option value="Boissons & Eau">Boissons & Eau</option>
                    <option value="Produits Laitiers">Produits Laitiers</option>
                    <option value="Confiserie & Biscuits">Confiserie & Biscuits</option>
                    <option value="Huiles & Condiments">Huiles & Condiments</option>
                    <option value="Céréales & Féculents">Céréales & Féculents</option>
                    <option value="Hygiène & Entretien">Hygiène & Entretien</option>
                  </select>
                </div>
              </div>

              {/* 2. CHOIX DU TYPE DE CONDITIONNEMENT : ARTICLE vs PAQUET */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Type de conditionnement *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option Article */}
                  <button
                    type="button"
                    id="btn-select-packaging-article"
                    onClick={() => {
                      setPackagingType('article');
                      setPackageType('Article');
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 cursor-pointer active:scale-[0.98] ${
                      packagingType === 'article'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        packagingType === 'article'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">Article</span>
                        {packagingType === 'article' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Produit stocké et vendu <strong>à l’unité</strong> (ex : Coca-Cola 50 cl, savon, pain).
                      </p>
                    </div>
                  </button>

                  {/* Option Paquet */}
                  <button
                    type="button"
                    id="btn-select-packaging-pack"
                    onClick={() => {
                      setPackagingType('pack');
                      setPackageType('Paquet');
                      if (!itemsPerPack || Number(itemsPerPack) < 2) {
                        setItemsPerPack(12);
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 cursor-pointer active:scale-[0.98] ${
                      packagingType === 'pack'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        packagingType === 'pack'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">Paquet</span>
                        {packagingType === 'pack' && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Stocké ou acheté en <strong>paquet contenant X articles</strong> (ex : Biscuit X, casier, pack d'eau).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. CHAMPS SELON LE CONDITIONNEMENT */}
              {packagingType === 'article' ? (
                /* CAS ARTICLE : Vente et Stockage à l'unité */
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Configuration de l'Article (Vente & Stock à l'unité)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix d'Achat unitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={unitPurchasePrice}
                        onChange={(e) => setUnitPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="ex: 450"
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix de Vente de l'article (FCFA) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={unitSalePrice}
                        onChange={(e) => setUnitSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="ex: 600"
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-emerald-50/50 font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Stock initial (en articles) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={unitStock}
                        onChange={(e) => setUnitStock(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="ex: 35"
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Margin preview */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Marge brute unitaire prévisionnelle :</span>
                    <span className={`font-black ${unitMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      +{formatCurrency(unitMargin)} / article ({unitMarginPercent}%)
                    </span>
                  </div>
                </div>
              ) : (
                /* CAS PAQUET : 1 Paquet = X Articles */
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Configuration du Paquet & Conversion Automatique</span>
                  </div>

                  {/* Nombre d'articles par paquet (OBLIGATOIRE, entier >= 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-indigo-950 mb-1">
                        Nombre d’articles par paquet *
                      </label>
                      <input
                        id="input-items-per-pack"
                        type="number"
                        min="2"
                        step="1"
                        required
                        value={itemsPerPack}
                        onChange={(e) => setItemsPerPack(e.target.value === '' ? '' : Math.floor(Number(e.target.value)))}
                        placeholder="ex: 12"
                        className="w-full p-2.5 text-xs border border-indigo-300 rounded-xl bg-white font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                      <p className="text-[10px] text-indigo-700 mt-1 font-semibold">
                        Entier supérieur ou égal à 2 (ex : 12 pour un paquet de 12 biscuits).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix d’achat du paquet complet (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={packagePurchasePrice}
                        onChange={(e) => setPackagePurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="ex: 10000"
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Prix payé au fournisseur pour 1 paquet complet.
                      </p>
                    </div>
                  </div>

                  {/* Live Formula Banner */}
                  <div className="p-3.5 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Règle : 1 paquet = <strong>{effectiveItemsPerPack} articles</strong>. Formule : {Number(packagePurchasePrice) || 0} FCFA ÷ {effectiveItemsPerPack} =
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        Prix d'Achat Unitaire Calculé : <strong className="text-indigo-900">{formatCurrency(computedUnitPurchasePrice)}</strong> / article
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">Marge brute par article :</div>
                      <div className={`font-black text-sm mt-0.5 ${unitMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        +{formatCurrency(unitMargin)} ({unitMarginPercent}%)
                      </div>
                    </div>
                  </div>

                  {/* Prix de vente détail & paquet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix de Vente par Article individuel (FCFA) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={unitSalePrice}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setUnitSalePrice(val);
                          if (val !== '' && packSalePrice === '') {
                            // Suggestion automatique
                          }
                        }}
                        placeholder="ex: 100"
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-emerald-50/50 font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Prix lorsqu'un client achète 1 article seul à la pièce.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix de Vente du Paquet complet (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={packSalePrice}
                        onChange={(e) => setPackSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={`ex: ${(Number(unitSalePrice) || 0) * effectiveItemsPerPack}`}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Laisser vide pour calcul auto ({effectiveItemsPerPack} × {formatCurrency(Number(unitSalePrice) || 0)} = {formatCurrency(effectiveItemsPerPack * (Number(unitSalePrice) || 0))}).
                      </p>
                    </div>
                  </div>

                  {/* Stock Initial Intelligent */}
                  <div className="pt-2 border-t border-indigo-100">
                    <label className="block text-xs font-black text-indigo-950 mb-1.5">
                      Stock initial
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nombre de paquets complets en stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={packageStock}
                          onChange={(e) => setPackageStock(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="ex: 5"
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Articles individuels hors paquet (optionnel)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={extraArticles}
                          onChange={(e) => setExtraArticles(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="ex: 0"
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Stock total automatique calculé */}
                    <div className="mt-2.5 p-3 bg-indigo-100/70 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <strong>Calcul automatique du stock :</strong>{' '}
                        <span>
                          {Number(packageStock) || 0} paquet(s) × {effectiveItemsPerPack} articles
                          {Number(extraArticles) > 0 ? ` + ${extraArticles} article(s)` : ''} ={' '}
                          <strong className="text-indigo-900 underline decoration-indigo-400">
                            {computedTotalStockArticles} articles au total
                          </strong>{' '}
                          disponibles à la vente.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Alertes de Sécurité & Code-barres */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Seuil de Sécurité & Alerte Automatique</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  BoutiquePro déclenchera automatiquement des alertes visuelles, sonores et des propositions de réassort dès que le stock en unités descendra à ce seuil ou en dessous.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Seuil d'alerte minimum (unités) *
                    </label>
                    <input
                      id="input-product-threshold"
                      type="number"
                      min="1"
                      required
                      value={minAlertThreshold}
                      onChange={(e) => setMinAlertThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="ex: 15"
                      className="w-full p-2.5 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-black text-amber-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Code-barres / Référence (optionnel)
                    </label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="ex: 619123456789"
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Dynamic threshold evaluation feedback */}
                {unitStock !== '' && minAlertThreshold !== '' && (
                  <div className="pt-1">
                    {Number(unitStock) <= Number(minAlertThreshold) ? (
                      <div className="p-2.5 bg-rose-100 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          {Number(unitStock) <= 0
                            ? 'Stock à 0 : Ce produit sera immédiatement marqué en RUPTURE TOTALE.'
                            : `Stock bas détecté : Le stock (${unitStock} u) est inférieur ou égal au seuil (${minAlertThreshold} u). Une alerte de réassort sera active dès l'enregistrement.`}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-100/80 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Stock sécurisé : Le produit dispose d'une marge de {Number(unitStock) - Number(minAlertThreshold)} unités avant le seuil d'alerte.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Date de Péremption & Fournisseur Associé */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200/70 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-xs">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Date de Péremption & Fournisseur Partenaire</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Date de péremption (DLC / DLUO)
                    </label>
                    <input
                      id="input-product-expiration"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Alerte automatique dès J-7 avant cette date.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Fournisseur habituel (optionnel)
                    </label>
                    <select
                      id="select-product-supplier"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="">-- Aucun fournisseur associé --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.phone})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Facilite les commandes groupées de réapprovisionnement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 -mx-6 -mb-6 mt-6">
                <div className="flex items-center gap-2">
                  {editingProduct && role === 'admin' && (
                    <button
                      id="btn-fiche-delete-product"
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setProductToDelete(editingProduct);
                      }}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Supprimer ce produit du stock"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Supprimer ce produit</span>
                    </button>
                  )}
                  {editingProduct && (
                    <button
                      id="btn-fiche-restock-product"
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setQuickRestockProduct(editingProduct);
                      }}
                      className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      title="Réapprovisionner ce produit"
                    >
                      <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Réapprovisionner</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    id="btn-submit-product-form"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70 cursor-pointer"
                  >
                    {isSubmitting ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Ajouter le Produit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL D'AVERTISSEMENT / CONFIRMATION MODIFICATION CONDITIONNEMENT */}
      {packConversionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden">
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Modification du conditionnement
                </h4>
                <p className="text-[11px] text-amber-900 font-medium">
                  Recalcul automatique de la répartition des stocks
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <p>
                Ce produit possède actuellement un stock de{' '}
                <strong className="text-slate-900 font-black">{packConversionWarning.unitStock} articles</strong>.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500 font-medium">Nouvelle répartition calculée :</div>
                <div className="font-bold text-indigo-950">
                  {packConversionWarning.newItemsPerPack > 1 ? (
                    <>
                      {Math.floor(packConversionWarning.unitStock / packConversionWarning.newItemsPerPack)} paquet(s) de{' '}
                      {packConversionWarning.newItemsPerPack} articles
                      {packConversionWarning.unitStock % packConversionWarning.newItemsPerPack > 0
                        ? ` + ${packConversionWarning.unitStock % packConversionWarning.newItemsPerPack} article(s) à l'unité`
                        : ''}
                    </>
                  ) : (
                    <>{packConversionWarning.unitStock} articles vendus à l'unité</>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Le stock global en articles restera strictement intact. Voulez-vous enregistrer cette modification ?
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPackConversionWarning(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-pack-conversion"
                onClick={() => {
                  packConversionWarning.onConfirm();
                }}
                className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                Confirmer la modification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        title="Supprimer le produit"
        itemTitle={productToDelete?.name || ''}
        itemSubtitle={
          productToDelete
            ? `Catégorie : ${productToDelete.category} • Stock : ${productToDelete.unit_stock} unités • Prix de vente : ${formatCurrency(productToDelete.unit_sale_price)}`
            : undefined
        }
        message="Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeletingProduct}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />

      {/* Quick Restock Modal */}
      {quickRestockProduct && (
        <QuickRestockModal
          product={quickRestockProduct}
          onClose={() => setQuickRestockProduct(null)}
          onSuccess={() => setQuickRestockProduct(null)}
        />
      )}

      {/* Supplier Order Modal */}
      {isSupplierModalOpen && (
        <SupplierOrderModal
          products={products}
          onClose={() => setIsSupplierModalOpen(false)}
        />
      )}
    </div>
  );
};
