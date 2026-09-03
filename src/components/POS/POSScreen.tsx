import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  User,
  UserPlus,
  Printer,
  Sparkles,
  Package,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Sale, Client } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface CartItem {
  product: Product;
  quantity: number;
}

export const POSScreen: React.FC = () => {
  const { products, clients, createSale, createClient } = useApp();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Ticket Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        p.package_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.product.unit_sale_price, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.unit_stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.unit_stock) {
          return prev; // cannot exceed stock
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.unit_stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Selected client details for Credit
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Submit sale
  const handleValidateSale = async () => {
    if (cart.length === 0) return;
    setErrorMessage(null);

    let finalClientId: string | null = null;
    let finalClientName: string | null = null;

    if (paymentType === 'credit') {
      if (isCreatingNewClient) {
        if (!newClientName.trim()) {
          setErrorMessage('Le nom du client est obligatoire pour une vente à crédit.');
          return;
        }
        finalClientName = newClientName.trim();
      } else {
        if (!selectedClientId) {
          setErrorMessage('Veuillez sélectionner le client concerné par ce crédit.');
          return;
        }
        finalClientId = selectedClientId;
        finalClientName = selectedClient?.name || null;
      }
    }

    setIsSubmitting(true);
    try {
      const saleItems = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.unit_sale_price,
      }));

      const sale = await createSale({
        items: saleItems,
        payment_type: paymentType,
        client_id: finalClientId,
        client_name: finalClientName,
      });

      setCompletedSale(sale);
      setCart([]);
      setIsCheckoutModalOpen(false);
      // Reset form
      setSelectedClientId('');
      setNewClientName('');
      setNewClientPhone('');
      setIsCreatingNewClient(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT AREA: Product Catalog & Fast Search (Cols 1 to 7/8) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-5">
        {/* Search and Categories Header Bento Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="input-pos-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit par nom, code-barres ou type de paquet..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold capitalize whitespace-nowrap transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Tous les produits' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800">Aucun produit trouvé</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Modifiez votre recherche ou ajoutez de nouveaux articles dans l'onglet Produits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((item) => item.product.id === product.id);
              const inCartQty = inCartItem?.quantity || 0;
              const isOutOfStock = product.unit_stock <= 0;
              const isLowStock = product.unit_stock > 0 && product.unit_stock <= (product.min_alert_threshold || 5);

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`bg-white rounded-3xl p-4 border transition-all duration-200 flex flex-col justify-between select-none relative overflow-hidden group ${
                    isOutOfStock
                      ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                      : inCartQty > 0
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm cursor-pointer hover:border-indigo-700'
                      : 'border-slate-200/90 hover:border-indigo-400 hover:shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 truncate tracking-wider">
                        {product.category || 'Alimentaire'}
                      </span>
                      {inCartQty > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {inCartQty}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {product.package_type} ({product.units_per_package} pcs)
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Prix Unité</div>
                      <div className="font-black text-sm text-indigo-950">
                        {formatCurrency(product.unit_sale_price)}
                      </div>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Épuisé
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isLowStock
                              ? 'text-amber-800 bg-amber-50 border-amber-200'
                              : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          Stock : {product.unit_stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT AREA: Active Cart & Checkout Bento Box (Cols 8 to 12) */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-6.5rem)] max-h-[750px] overflow-hidden">
          {/* Cart Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Panier de Caisse</h3>
                <p className="text-[11px] text-slate-500 font-medium">{cartItemsCount} article(s) sélectionné(s)</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                id="btn-clear-cart"
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 p-1.5 hover:bg-rose-50 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <ShoppingCart className="w-7 h-7 text-slate-300 stroke-[1.5]" />
                </div>
                <p className="font-bold text-slate-700 text-sm">Le panier est vide</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Sélectionnez un produit dans le catalogue pour l'ajouter à la commande.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-800 text-xs truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-slate-500">
                      {formatCurrency(item.product.unit_sale_price)} / unité
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.unit_stock}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-95 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right w-20">
                    <div className="font-black text-xs text-slate-900">
                      {formatCurrency(item.quantity * item.product.unit_sale_price)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] font-semibold text-rose-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer / Checkout Trigger */}
          <div className="p-5 bg-slate-900 text-white space-y-3.5 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total à Payer :</span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <button
              id="btn-open-checkout-modal"
              disabled={cart.length === 0}
              onClick={() => {
                setPaymentType('cash');
                setIsCheckoutModalOpen(true);
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Valider la Vente ({formatCurrency(cartTotal)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE FINALISATION : CHOIX CASH OU CRÉDIT (OBLIGATOIRE) */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-lg">Finaliser l'Encaissement</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total de la vente : <strong className="text-white">{formatCurrency(cartTotal)}</strong> ({cartItemsCount} articles)
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* MODE DE PAIEMENT : CASH OU CRÉDIT */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                  Mode de Paiement (Sélection obligatoire) :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="btn-select-cash"
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition duration-150 ${
                      paymentType === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-6 h-6 text-emerald-600" />
                    <span>CASH (Espèces)</span>
                    <span className="text-[10px] font-normal text-emerald-700">Encaissement immédiat</span>
                  </button>

                  <button
                    id="btn-select-credit"
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition duration-150 ${
                      paymentType === 'credit'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-rose-600" />
                    <span>CRÉDIT (Créance)</span>
                    <span className="text-[10px] font-normal text-rose-700">Dette inscrite au client</span>
                  </button>
                </div>
              </div>

              {/* SI CRÉDIT SÉLECTIONNÉ : CHOIX DU CLIENT OU CRÉATION RAPIDE */}
              {paymentType === 'credit' && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-700" />
                      Client Débiteur (Obligatoire)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                      className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                    >
                      {isCreatingNewClient ? 'Choisir client existant' : '+ Nouveau Client'}
                    </button>
                  </div>

                  {!isCreatingNewClient ? (
                    <div>
                      <select
                        id="select-credit-client"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      >
                        <option value="">-- Sélectionner un client débiteur --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''} — Dette actuelle : {formatCurrency(c.credit_balance)}
                          </option>
                        ))}
                      </select>

                      {selectedClient && (
                        <div className="mt-2 text-xs text-rose-800 bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                          <div>Solde débiteur actuel : <strong>{formatCurrency(selectedClient.credit_balance)}</strong></div>
                          <div>Nouvelle dette après vente : <strong>{formatCurrency(selectedClient.credit_balance + cartTotal)}</strong></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-rose-200">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nom complet du client *
                        </label>
                        <input
                          type="text"
                          required
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="ex: Mamadou Traoré"
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Numéro de téléphone (optionnel)
                        </label>
                        <input
                          type="tel"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="ex: +221 77 123 45 67"
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-sale-submit"
                type="button"
                disabled={isSubmitting}
                onClick={handleValidateSale}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? 'Enregistrement...' : `Confirmer (${formatCurrency(cartTotal)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET DE REÇU / SUCCESS MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-1 text-white" />
              <h3 className="font-black text-lg">Vente Validée avec Succès !</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Synchronisée en temps réel avec tous les appareils de la boutique
              </p>
            </div>

            {/* Receipt Ticket Box */}
            <div className="p-6 font-mono text-xs text-slate-800 space-y-3 bg-slate-50/50">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-bold text-sm text-slate-900">BOUTIQUEPRO ALIMENTATION</div>
                <div>Ticket N° #{completedSale.id.substring(completedSale.id.length - 6).toUpperCase()}</div>
                <div>Date : {formatDate(completedSale.date)}</div>
                <div>Caissier : {completedSale.cashier_name}</div>
              </div>

              <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-bold">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL :</span>
                  <span>{formatCurrency(completedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>MODE :</span>
                  <span className={completedSale.payment_type === 'cash' ? 'text-emerald-700' : 'text-rose-700'}>
                    {completedSale.payment_type.toUpperCase()}
                  </span>
                </div>
                {completedSale.payment_type === 'credit' && (
                  <div className="flex justify-between text-xs text-rose-700 font-bold">
                    <span>CLIENT :</span>
                    <span>{completedSale.client_name}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-400">
                Merci de votre visite et à bientôt !
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>

              <button
                id="btn-close-ticket"
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Nouvelle Vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
