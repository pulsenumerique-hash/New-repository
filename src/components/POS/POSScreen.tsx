import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Smartphone,
  User,
  UserPlus,
  Printer,
  Sparkles,
  Package,
  ArrowRight,
  Filter,
  X,
  History,
  ScanLine,
  Check,
  Barcode,
  Command,
  Zap,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Sale, Client } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { SalesHistoryModal } from './SalesHistoryModal';

interface CartItem {
  product: Product;
  quantity: number;
}

// Bip audio agréable lors du scan réussi d'un produit
function playBeepSuccess(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // Note C6 claire
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Ignore les erreurs audio en environnement restreint
  }
}

// Normalise une chaîne (retrait des accents, casse minuscule, espaces nettoyés)
function normalizeSearchText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const POSScreen: React.FC = () => {
  const { products, clients, boutique, createSale, createClient } = useApp();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier global pour focus immédiat sur la barre de recherche ('/' ou Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // History modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Barcode feedback
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);

  // Checkout modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit' | 'mobile_money'>('cash');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'wave' | 'orange_money' | 'free_money'>('wave');
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

  // Détection du mode de recherche (Chiffres = Code-barres, Texte = Nom)
  const isBarcodeSearchMode = useMemo(() => {
    const trimmed = searchQuery.trim();
    return trimmed.length > 0 && /^[0-9\s-]+$/.test(trimmed);
  }, [searchQuery]);

  // Filtered products en temps réel (Nom ou Code-barres)
  const filteredProducts = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) {
      if (selectedCategory === 'all') return products;
      return products.filter((p) => p.category === selectedCategory);
    }

    const rawQueryNoSpaces = searchQuery.replace(/[\s-]/g, '').toLowerCase();

    return products.filter((p) => {
      // 1. Recherche par nom (insensible aux accents et à la casse)
      const nameMatch = normalizeSearchText(p.name).includes(q);

      // 2. Recherche par code-barres (partielle ou exacte, sans espaces ni tirets)
      const rawBarcodeNoSpaces = p.barcode ? p.barcode.replace(/[\s-]/g, '').toLowerCase() : '';
      const barcodeMatch = rawBarcodeNoSpaces.length > 0 && rawBarcodeNoSpaces.includes(rawQueryNoSpaces);

      // 3. Correspondance catégorie ou type d'emballage
      const catMatch = p.category ? normalizeSearchText(p.category).includes(q) : false;
      const pkgMatch = p.package_type ? normalizeSearchText(p.package_type).includes(q) : false;

      const matchesSearch = nameMatch || barcodeMatch || catMatch || pkgMatch;
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
    let finalClientPhone: string | null = null;

    if (paymentType === 'credit') {
      if (isCreatingNewClient) {
        if (!newClientName.trim()) {
          setErrorMessage('Le nom du client est obligatoire pour une vente à crédit.');
          return;
        }
        if (!newClientPhone.trim()) {
          setErrorMessage('Le numéro WhatsApp du client est obligatoire pour une vente à crédit (ex. +237 6XXXXXXXX ou +221 7XXXXXXXX).');
          return;
        }
        const cleanDigits = newClientPhone.replace(/[^0-9]/g, '');
        if (cleanDigits.length < 8) {
          setErrorMessage('Veuillez saisir un numéro WhatsApp valide avec indicatif pays (au moins 8 chiffres).');
          return;
        }

        // Si le client existe déjà avec ce même numéro WhatsApp -> rattacher sans doublon
        const existingClientByPhone = clients.find(
          (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === cleanDigits
        );

        if (existingClientByPhone) {
          finalClientId = existingClientByPhone.id;
          finalClientName = existingClientByPhone.name;
          finalClientPhone = existingClientByPhone.phone || newClientPhone.trim();
        } else {
          finalClientName = newClientName.trim();
          finalClientPhone = newClientPhone.trim();
        }
      } else {
        if (!selectedClientId) {
          setErrorMessage('Veuillez sélectionner le client concerné par ce crédit.');
          return;
        }
        finalClientId = selectedClientId;
        finalClientName = selectedClient?.name || null;
        finalClientPhone = selectedClient?.phone || (newClientPhone.trim() ? newClientPhone.trim() : null);
        if (!finalClientPhone) {
          setErrorMessage('Ce client n’a pas de numéro WhatsApp enregistré. Veuillez renseigner son numéro WhatsApp ci-dessous.');
          return;
        }
        const cleanDigits = finalClientPhone.replace(/[^0-9]/g, '');
        if (cleanDigits.length < 8) {
          setErrorMessage('Numéro WhatsApp invalide. Veuillez renseigner un numéro valide avec indicatif.');
          return;
        }
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
        payment_method_detail: paymentType === 'mobile_money' ? mobileMoneyProvider : (paymentType as any),
        client_id: finalClientId,
        client_name: finalClientName,
        client_phone: finalClientPhone,
      });

      // Si vente à crédit, ouvrir automatiquement WhatsApp avec le message de confirmation pré-rempli
      if (paymentType === 'credit' && finalClientPhone) {
        const cleanDigits = finalClientPhone.replace(/[^0-9]/g, '');
        const itemsSummary = saleItems
          .map((i) => `• ${i.quantity}x ${i.product_name} (${formatCurrency(i.quantity * i.unit_price)})`)
          .join('\n');
        const shopTitle = boutique?.name || 'BoutiquePro';
        const msg = `Bonjour ${finalClientName},\nConfirmation de votre achat à crédit du ${new Date().toLocaleDateString('fr-FR')} chez ${shopTitle} :\n${itemsSummary}\nMontant total dû : ${formatCurrency(cartTotal)}.\nMerci de votre confiance !`;
        try {
          window.open(`https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`, '_blank');
        } catch {
          // Ignore popup block
        }
      }

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

  // Traitement automatique scan code-barres (douchette physique / émulateur ou clavier)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      return;
    }

    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const rawTrimmed = searchQuery.trim();
      const normalized = normalizeSearchText(rawTrimmed);
      const rawNoSpace = rawTrimmed.replace(/[\s-]/g, '').toLowerCase();

      // 1. Recherche exacte par code-barres
      let match = products.find(
        (p) => p.barcode && p.barcode.replace(/[\s-]/g, '').toLowerCase() === rawNoSpace
      );

      // 2. Recherche exacte par nom
      if (!match) {
        match = products.find((p) => normalizeSearchText(p.name) === normalized);
      }

      // 3. Si un seul produit correspond au filtre actuel
      if (!match && filteredProducts.length === 1) {
        match = filteredProducts[0];
      }

      if (match) {
        if (match.unit_stock > 0) {
          addToCart(match);
          playBeepSuccess();
          setBarcodeFeedback(`✓ "${match.name}" ajouté au panier !`);
          setTimeout(() => setBarcodeFeedback(null), 2500);
          setSearchQuery('');
        } else {
          setBarcodeFeedback(`⚠️ Rupture de stock pour "${match.name}" (0 unité en stock)`);
          setTimeout(() => setBarcodeFeedback(null), 3000);
        }
      } else if (filteredProducts.length > 1) {
        setBarcodeFeedback(`ℹ️ ${filteredProducts.length} articles correspondent. Cliquez sur l'un d'eux ou affinez.`);
        setTimeout(() => setBarcodeFeedback(null), 3500);
      } else {
        setBarcodeFeedback(`❌ Aucun article trouvé pour "${rawTrimmed}"`);
        setTimeout(() => setBarcodeFeedback(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* BARRE DE RECHERCHE GLOBALE DU POINT DE VENTE (POS) */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3.5">
        {/* En-tête de la barre de recherche globale */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Barre de Recherche Globale</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <ScanLine className="w-3 h-3" />
                  Douchette active
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Filtrez instantanément le catalogue par nom de produit ou scannez un code-barres
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Statut du filtrage */}
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} {searchQuery ? 'trouvé(s)' : 'au catalogue'}
            </span>

            {/* Bouton Historique & Reçus */}
            <button
              id="btn-pos-sales-history"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Historique & Reçus</span>
            </button>
          </div>
        </div>

        {/* Bannière de feedback scan ou ajout */}
        {barcodeFeedback && (
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{barcodeFeedback}</span>
            </div>
            <button onClick={() => setBarcodeFeedback(null)} className="text-indigo-400 hover:text-indigo-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Champ de saisie de la barre globale */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {isBarcodeSearchMode ? (
              <Barcode className="w-5 h-5 text-indigo-600 animate-pulse" />
            ) : (
              <Search className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <input
            ref={searchInputRef}
            id="input-pos-global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Recherche globale : tapez le nom du produit ou scannez le code-barres (ex: Lait, Savon, 619...)"
            className="w-full pl-12 pr-28 sm:pr-32 py-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium placeholder:text-slate-400"
          />

          {/* Indicateur de mode et actions à droite */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {/* Badge de détection du mode */}
            {searchQuery ? (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border hidden sm:inline-flex items-center gap-1 ${
                  isBarcodeSearchMode
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {isBarcodeSearchMode ? (
                  <>
                    <Barcode className="w-3 h-3" />
                    Code-barres
                  </>
                ) : (
                  'Nom'
                )}
              </span>
            ) : (
              <span
                title="Raccourci clavier pour rechercher"
                className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md hidden sm:inline"
              >
                /
              </span>
            )}

            {searchQuery && (
              <button
                id="btn-clear-global-search"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Effacer la recherche (Échap)"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barre de suggestions et de filtrage instantané rapide si une recherche est en cours */}
        {searchQuery && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-800">
                Filtre actif : « <span className="text-indigo-600 font-bold">{searchQuery}</span> »
              </span>
              <span>— {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}</span>
            </div>

            {/* Quick chips si 1 à 4 résultats pour ajout en 1 clic direct */}
            {filteredProducts.length > 0 && filteredProducts.length <= 4 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Ajout rapide :</span>
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.unit_stock > 0) {
                        addToCart(p);
                        playBeepSuccess();
                        setBarcodeFeedback(`✓ "${p.name}" ajouté !`);
                        setTimeout(() => setBarcodeFeedback(null), 2500);
                      }
                    }}
                    disabled={p.unit_stock <= 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition active:scale-95 disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{p.name}</span>
                    <span className="text-slate-500 font-normal">({formatCurrency(p.unit_sale_price)})</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline ml-auto"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}
      </div>

      {/* GRILLE PRINCIPALE : CATALOGUE PRODUITS ET PANIER DE CAISSE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT AREA: Product Catalog (Cols 1 to 7/8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Filter Pills */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
              <span className="text-slate-400 font-bold px-1 text-[11px] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Rayons :
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all duration-150 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
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

              {/* MODE DE PAIEMENT : CASH, MOBILE MONEY OU CRÉDIT */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                  Mode de Paiement (Sélection obligatoire) :
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    id="btn-select-cash"
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition duration-150 ${
                      paymentType === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>CASH</span>
                    <span className="text-[10px] font-normal text-emerald-700">Espèces</span>
                  </button>

                  <button
                    id="btn-select-mobile-money"
                    type="button"
                    onClick={() => setPaymentType('mobile_money')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition duration-150 ${
                      paymentType === 'mobile_money'
                        ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-sky-600" />
                    <span>MOBILE</span>
                    <span className="text-[10px] font-normal text-sky-700">Wave / OM</span>
                  </button>

                  <button
                    id="btn-select-credit"
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-1.5 transition duration-150 ${
                      paymentType === 'credit'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-rose-600" />
                    <span>CRÉDIT</span>
                    <span className="text-[10px] font-normal text-rose-700">Dette client</span>
                  </button>
                </div>
              </div>

              {/* SOUS-CHOIX OPÉRATEUR MOBILE MONEY */}
              {paymentType === 'mobile_money' && (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2.5">
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-sky-700" />
                    Opérateur Mobile Money :
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileMoneyProvider('wave')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        mobileMoneyProvider === 'wave'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Wave
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileMoneyProvider('orange_money')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        mobileMoneyProvider === 'orange_money'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Orange Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileMoneyProvider('free_money')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        mobileMoneyProvider === 'free_money'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Free Money
                    </button>
                  </div>
                </div>
              )}

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
                    <div className="space-y-2.5">
                      <select
                        id="select-credit-client"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      >
                        <option value="">-- Sélectionner un client débiteur --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : '⚠️ Pas de tél'} — Dette : {formatCurrency(c.credit_balance)}
                          </option>
                        ))}
                      </select>

                      {selectedClient && (
                        <div className="space-y-2">
                          <div className="text-xs text-rose-800 bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                            <div>Client : <strong>{selectedClient.name}</strong></div>
                            <div>Numéro WhatsApp : <strong>{selectedClient.phone || 'Non renseigné'}</strong></div>
                            <div>Solde débiteur actuel : <strong>{formatCurrency(selectedClient.credit_balance)}</strong></div>
                            <div>Nouvelle dette après vente : <strong>{formatCurrency(selectedClient.credit_balance + cartTotal)}</strong></div>
                          </div>

                          {!selectedClient.phone && (
                            <div>
                              <label className="block text-[11px] font-bold text-rose-900 mb-1">
                                Numéro WhatsApp obligatoire pour ce client (avec indicatif, ex. +237...) *
                              </label>
                              <input
                                type="tel"
                                required
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                placeholder="ex: +237 6XXXXXXXX ou +221 7XXXXXXXX"
                                className="w-full p-2.5 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white"
                              />
                            </div>
                          )}
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
                          Numéro WhatsApp du client (avec indicatif pays, ex. +237 / +221) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="ex: +237 6XXXXXXXX ou +221 7XXXXXXXX"
                          className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Si ce numéro existe déjà, le crédit sera rattaché à la fiche existante sans doublon.
                        </p>
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
                  <span
                    className={
                      completedSale.payment_type === 'cash'
                        ? 'text-emerald-700'
                        : completedSale.payment_type === 'mobile_money'
                        ? 'text-sky-700'
                        : 'text-rose-700'
                    }
                  >
                    {completedSale.payment_type === 'mobile_money'
                      ? `MOBILE (${(completedSale.payment_method_detail || 'WAVE').replace('_', ' ').toUpperCase()})`
                      : completedSale.payment_type.toUpperCase()}
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

            {completedSale.payment_type === 'credit' && (() => {
              const matchedClient = clients.find(c => c.id === completedSale.client_id || c.name === completedSale.client_name);
              const clientPhone = matchedClient?.phone;
              const cleanDigits = clientPhone ? clientPhone.replace(/[^0-9]/g, '') : '';
              const itemsList = completedSale.items.map(it => `• ${it.quantity}x ${it.product_name} (${formatCurrency(it.total_price)})`).join('\n');
              const msg = `Bonjour ${completedSale.client_name},\nConfirmation de votre achat à crédit du ${new Date(completedSale.date).toLocaleDateString('fr-FR')} chez ${boutique?.name || 'BoutiquePro'} :\n${itemsList}\nTotal restant dû : ${formatCurrency(completedSale.total_amount)}.\nMerci de votre confiance !`;
              const waUrl = cleanDigits
                ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(msg)}`
                : `https://wa.me/?text=${encodeURIComponent(msg)}`;

              return (
                <div className="p-4 bg-emerald-50 border-t border-emerald-200">
                  <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Confirmation WhatsApp
                    </span>
                    {cleanDigits && <span className="text-emerald-700 font-mono">+{cleanDigits}</span>}
                  </div>
                  <a
                    id="btn-send-whatsapp-credit-confirm"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer la confirmation WhatsApp</span>
                  </a>
                </div>
              );
            })()}

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

      {/* SALES HISTORY & REPRINTS MODAL */}
      <SalesHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectSaleForReprint={(s) => setCompletedSale(s)}
      />
    </div>
  </div>
  );
};
