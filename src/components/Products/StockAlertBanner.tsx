import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Boxes,
  FileText,
  Filter,
  CheckCircle2,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import {
  playStockAlertChime,
  requestBrowserNotificationPermission,
  sendStockAlertNotification,
  getSoundAlertSetting,
  setSoundAlertSetting,
} from '../../lib/alerts';
import { QuickRestockModal } from './QuickRestockModal';
import { SupplierOrderModal } from './SupplierOrderModal';

interface StockAlertBannerProps {
  products: Product[];
  isFilteringAlerts: boolean;
  onToggleFilterAlerts: () => void;
}

export const StockAlertBanner: React.FC<StockAlertBannerProps> = ({
  products,
  isFilteringAlerts,
  onToggleFilterAlerts,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getSoundAlertSetting());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Filter alerted products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.min_alert_threshold ?? 10;
      return (p.unit_stock || 0) <= threshold;
    });
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return lowStockProducts.filter((p) => (p.unit_stock || 0) <= 0).length;
  }, [lowStockProducts]);

  const criticalStockCount = lowStockProducts.length - outOfStockCount;

  // Track previous count to trigger automated alert sound & notification when new alerts occur
  const prevAlertCountRef = useRef<number>(lowStockProducts.length);
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevAlertCountRef.current = lowStockProducts.length;
      return;
    }

    // If new alerts have been triggered
    if (lowStockProducts.length > prevAlertCountRef.current) {
      if (soundEnabled) {
        playStockAlertChime();
      }

      // Find the most critical newly alerted product
      const newlyAlerted = lowStockProducts[0];
      if (newlyAlerted) {
        sendStockAlertNotification(
          newlyAlerted.name,
          newlyAlerted.unit_stock,
          newlyAlerted.min_alert_threshold ?? 10
        );
      }
    }

    prevAlertCountRef.current = lowStockProducts.length;
  }, [lowStockProducts, soundEnabled]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setSoundAlertSetting(next);
    if (next) {
      playStockAlertChime();
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted' && lowStockProducts.length > 0) {
      const first = lowStockProducts[0];
      sendStockAlertNotification(first.name, first.unit_stock, first.min_alert_threshold ?? 10);
    }
  };

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <span>Système d'Alerte Automatique Actif</span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-black px-2 py-0.5 rounded-full">
                0 Alerte
              </span>
            </div>
            <p className="text-emerald-800 text-[11px] mt-0.5 font-medium">
              Tous les produits enregistrés disposent d'un stock supérieur à leur seuil de sécurité configuré.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-toggle-sound-alert-ok"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Désactiver le carillon sonore d’alerte' : 'Activer le carillon sonore d’alerte'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300/60 bg-white/80 hover:bg-white text-emerald-900 font-bold transition text-xs"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{soundEnabled ? 'Son activé' : 'Son muet'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/60 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-black text-white">
                  Alerte Automatique : Stock Critique Détecté !
                </span>
                {outOfStockCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 border border-rose-400/40 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {outOfStockCount} {outOfStockCount === 1 ? 'Rupture Totale' : 'Ruptures Totales'}
                  </span>
                )}
                {criticalStockCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/90 border border-amber-300/40 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                    {criticalStockCount} {criticalStockCount === 1 ? 'Seuil Atteint' : 'Seuils Atteints'}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/90 font-medium mt-1">
                {lowStockProducts.length} référence(s) sous le seuil de sécurité minimum. Risque de manque à gagner lors des encaissements.
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Filter Toggle */}
            <button
              id="btn-filter-stock-alerts"
              onClick={onToggleFilterAlerts}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-md ${
                isFilteringAlerts
                  ? 'bg-amber-400 text-slate-950 border border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isFilteringAlerts ? 'Voir Tous les Produits' : `Filtrer Alertes (${lowStockProducts.length})`}</span>
            </button>

            {/* Supplier Order Generator */}
            <button
              id="btn-generate-supplier-order"
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition active:scale-95 shadow-md"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bon de Commande</span>
            </button>

            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound-alert"
              onClick={handleToggleSound}
              title={soundEnabled ? 'Désactiver le carillon d’alerte sonore' : 'Activer le carillon d’alerte sonore'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Browser notification permission */}
            {notificationPermission !== 'granted' && (
              <button
                id="btn-enable-browser-notifications"
                onClick={handleEnableNotifications}
                title="Activer les notifications du navigateur"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-[11px] font-bold border border-indigo-400/40 transition"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-200" />
                <span className="hidden sm:inline">Notifier</span>
              </button>
            )}

            {/* Accordion Expand/Collapse */}
            <button
              id="btn-expand-stock-alerts"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              <span>{isExpanded ? 'Masquer détail' : 'Voir détail'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Alert Details Grid */}
        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 relative z-10 space-y-3">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Boxes className="w-4 h-4" />
              <span>Détail des Produits Nécessitant un Réapprovisionnement Immédiat</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((prod) => {
                const threshold = prod.min_alert_threshold ?? 10;
                const isOut = prod.unit_stock <= 0;
                const percent = Math.min(100, Math.max(0, Math.round((prod.unit_stock / threshold) * 100)));

                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md flex flex-col justify-between hover:border-amber-400/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-sm text-white line-clamp-1">{prod.name}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isOut ? 'Rupture' : 'Stock Bas'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                        <span>Conditionnement : {prod.package_type}</span>
                        <span className="text-white font-bold">
                          {prod.unit_stock} / {threshold} unités
                        </span>
                      </div>

                      {/* Stock Level Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOut ? 'w-0' : percent <= 30 ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Restock Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {prod.package_stock} {prod.package_type}(s) en réserve
                      </span>
                      <button
                        id={`btn-quick-restock-${prod.id}`}
                        onClick={() => setRestockProduct(prod)}
                        className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-slate-950" />
                        <span>Réassort (+)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Restock Modal */}
      {restockProduct && (
        <QuickRestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onSuccess={() => setRestockProduct(null)}
        />
      )}

      {/* Supplier Order Modal */}
      {isSupplierModalOpen && (
        <SupplierOrderModal
          products={products}
          onClose={() => setIsSupplierModalOpen(false)}
        />
      )}
    </>
  );
};
