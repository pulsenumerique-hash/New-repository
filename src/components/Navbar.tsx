import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  UserCheck,
  Smartphone,
  Usb,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  SplitSquareVertical,
  History,
  Cloud,
  CloudUpload,
  CloudOff,
  ArrowUpCircle,
  Database,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenDevices: () => void;
  onOpenPWA: () => void;
  onOpenSimulator: () => void;
  onOpenAudit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDevices,
  onOpenPWA,
  onOpenSimulator,
  onOpenAudit,
}) => {
  const { user, boutique, role, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    realtimeStatus,
    lastSyncTime,
    pendingSyncCount,
    pendingQueue,
    isSyncingQueue,
    syncNow,
    clearOfflineQueue,
    refreshData,
    isLoadingData,
    products,
  } = useApp();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);
  const syncDropdownRef = useRef<HTMLDivElement>(null);

  // Compute products below safety threshold
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.min_alert_threshold ?? 10;
      return (p.unit_stock || 0) <= threshold;
    });
  }, [products]);

  const lowStockCount = lowStockProducts.length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
      if (syncDropdownRef.current && !syncDropdownRef.current.contains(event.target as Node)) {
        setIsSyncOpen(false);
      }
    };
    if (isAlertsOpen || isSyncOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAlertsOpen, isSyncOpen]);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    try {
      const res = await syncNow();
      if (res.syncedCount > 0) {
        setSyncFeedback(`Succès : ${res.syncedCount} opération(s) synchronisée(s) !`);
      } else if (res.errorCount > 0) {
        setSyncFeedback(`${res.errorCount} opération(s) n'ont pas pu être envoyées. Vérifiez la connexion.`);
      } else {
        setSyncFeedback('Toutes les données sont déjà à jour.');
      }
    } catch {
      setSyncFeedback('Erreur lors de la synchronisation.');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const getStatusBadge = () => {
    switch (realtimeStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Temps réel actif</span>
            <span className="sm:hidden">En ligne</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Connexion...</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <WifiOff className="w-3 h-3 text-rose-400" />
            <span>Hors-ligne</span>
          </div>
        );
    }
  };

  const navItems = [
    ...(role === 'admin'
      ? [
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        ]
      : []),
    { id: 'pos', label: 'Caisse (Ventes)', icon: ShoppingCart },
    { id: 'products', label: 'Produits & Stock', icon: Package },
    { id: 'clients', label: 'Crédits Clients', icon: Users },
    ...(role === 'admin'
      ? [
          { id: 'cash', label: 'Gestion Caisse', icon: Wallet },
          { id: 'cashiers', label: 'Comptes Caissiers', icon: UserCheck },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Boutique info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/10">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                  {boutique?.name || 'BoutiquePro'}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    role === 'admin'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}
                >
                  {role === 'admin' ? 'Admin' : 'Caissier'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-300">{user ? `${user.first_name} ${user.last_name}` : ''}</span>
                {lastSyncTime && <span className="hidden md:inline text-slate-500">• Synchro: {lastSyncTime}</span>}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isProductTab = item.id === 'products';
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isProductTab && lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right quick actions & status */}
          <div className="flex items-center gap-2">
            {/* Realtime connection status badge */}
            {getStatusBadge()}

            {/* Offline Sync Pending Indicator Badge with Detailed Dropdown */}
            <div className="relative" ref={syncDropdownRef}>
              <button
                id="btn-sync-queue-status"
                onClick={() => setIsSyncOpen((prev) => !prev)}
                title={
                  pendingSyncCount > 0
                    ? `${pendingSyncCount} opération(s) hors-ligne en attente de synchronisation`
                    : 'Toutes les données sont synchronisées'
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                  pendingSyncCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20 animate-pulse'
                    : isSyncingQueue
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {isSyncingQueue ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : pendingSyncCount > 0 ? (
                  <CloudUpload className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden sm:inline">
                  {isSyncingQueue
                    ? 'Synchro en cours...'
                    : pendingSyncCount > 0
                    ? `${pendingSyncCount} en attente`
                    : 'Synchro OK'}
                </span>
                {pendingSyncCount > 0 && (
                  <span className="sm:hidden px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                    {pendingSyncCount}
                  </span>
                )}
              </button>

              {/* Sync Queue Dropdown Popover */}
              {isSyncOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl z-50 p-4 text-xs space-y-3">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-400" />
                      <span className="font-extrabold text-sm text-white">Persistance & Synchronisation</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        pendingSyncCount > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {pendingSyncCount > 0 ? `${pendingSyncCount} en attente` : 'À jour'}
                    </span>
                  </div>

                  {/* Feedback message */}
                  {syncFeedback && (
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-center font-bold">
                      {syncFeedback}
                    </div>
                  )}

                  {/* Explanation banner */}
                  <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2">
                    <Cloud className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Mode Hors-Ligne Renforcé :</span>{' '}
                      Vos ventes, stocks et clients sont immédiatement sauvegardés dans le stockage local sécurisé. Dès que le réseau est disponible, les actions sont transmises sans perte.
                    </div>
                  </div>

                  {/* Queue Items or Empty State */}
                  {pendingSyncCount === 0 ? (
                    <div className="py-5 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-90" />
                      <p className="font-bold text-slate-200">Aucune synchronisation en attente</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toutes les opérations locales sont enregistrées sur le serveur cloud.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Opérations locales à envoyer :</span>
                        <span className="font-mono text-amber-300 font-bold">{pendingSyncCount}</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {pendingQueue.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700/70 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-200 truncate">{item.title || item.type}</div>
                              {item.details && (
                                <div className="text-[10px] text-slate-400 truncate">{item.details}</div>
                              )}
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                {new Date(item.timestamp).toLocaleTimeString('fr-FR')} • {item.retryCount ? `Essai #${item.retryCount}` : 'Prêt'}
                              </div>
                            </div>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              En attente
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      id="btn-trigger-manual-sync"
                      onClick={handleManualSync}
                      disabled={isSyncingQueue || typeof navigator !== 'undefined' && !navigator.onLine}
                      className="flex-1 py-2 px-3 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                      <span>{isSyncingQueue ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                    </button>

                    {pendingSyncCount > 0 && (
                      <button
                        id="btn-clear-sync-queue"
                        onClick={() => {
                          if (window.confirm('Voulez-vous vraiment vider la file d’attente hors-ligne ?')) {
                            clearOfflineQueue();
                          }
                        }}
                        title="Vider la file d'attente"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700/60 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stock Alerts Bell & Dropdown */}
            <div className="relative" ref={alertsDropdownRef}>
              <button
                id="btn-stock-alerts-bell"
                onClick={() => setIsAlertsOpen((prev) => !prev)}
                title={lowStockCount > 0 ? `${lowStockCount} alertes de stock bas` : 'Alertes de stock'}
                className={`p-2 rounded-xl transition border relative ${
                  lowStockCount > 0
                    ? 'text-amber-300 bg-amber-950/60 border-amber-500/50 hover:bg-amber-900/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent hover:border-slate-700'
                }`}
              >
                {lowStockCount > 0 ? (
                  <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center border-2 border-slate-900 shadow-xs">
                    {lowStockCount > 9 ? '9+' : lowStockCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl z-50 p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-extrabold text-sm text-white">Alertes de Stock Automatiques</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      lowStockCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {lowStockCount > 0 ? `${lowStockCount} sous le seuil` : 'Stock Optimal'}
                    </span>
                  </div>

                  {lowStockCount === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="font-bold text-slate-300">Aucune alerte de stock</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tous les articles sont au-dessus de leur seuil de sécurité.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {lowStockProducts.slice(0, 5).map((p) => {
                        const threshold = p.min_alert_threshold ?? 10;
                        const isOut = p.unit_stock <= 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActiveTab('products');
                              setIsAlertsOpen(false);
                            }}
                            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-200 line-clamp-1">{p.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {p.package_type} • Seuil : {threshold} u
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                isOut
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {isOut ? 'Rupture (0)' : `${p.unit_stock} restants`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {lowStockCount > 5 && (
                        <p className="text-[10px] text-center text-slate-400 pt-1">
                          + {lowStockCount - 5} autre(s) référence(s) en alerte
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    id="btn-goto-products-alerts"
                    onClick={() => {
                      setActiveTab('products');
                      setIsAlertsOpen(false);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-center transition shadow-md cursor-pointer"
                  >
                    Gérer les alertes dans Produits & Stock →
                  </button>
                </div>
              )}
            </div>

            {/* Manual sync refresh */}
            <button
              id="btn-sync-refresh"
              onClick={() => refreshData()}
              title="Actualiser les données"
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 ${
                isLoadingData ? 'animate-spin text-teal-400' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Multi-device live test simulator */}
            <button
              id="btn-open-simulator"
              onClick={onOpenSimulator}
              title="Simulateur multi-appareils (Test synchro en direct)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 rounded-xl transition shadow-xs"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Synchro</span>
            </button>

            {/* Devices manager */}
            <button
              id="btn-open-devices"
              onClick={onOpenDevices}
              title="Appareils connectés"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Android USB Cable & APK install button */}
            <button
              id="btn-open-pwa"
              onClick={onOpenPWA}
              title="Installer sur téléphone Android (Câble USB / APK)"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-300 rounded-xl transition shadow-md shadow-teal-500/25 cursor-pointer active:scale-95 border border-teal-200/50"
            >
              <Usb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 animate-pulse" />
              <span className="hidden md:inline">Installer Android (USB / APK)</span>
              <span className="md:hidden">Installer Android</span>
            </button>

            {/* Audit log (Admin only) */}
            {role === 'admin' && (
              <button
                id="btn-open-audit"
                onClick={onOpenAudit}
                title="Historique & Traçabilité des opérations"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Logout */}
            <button
              id="btn-logout"
              onClick={logout}
              title="Se déconnecter"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition border border-transparent hover:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isProductTab = item.id === 'products';
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isProductTab && lowStockCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

