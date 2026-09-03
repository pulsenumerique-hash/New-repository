import React, { useState } from 'react';
import {
  SplitSquareVertical,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateShort } from '../../lib/formatters';

interface MultiDeviceSimulatorProps {
  onClose: () => void;
}

export const MultiDeviceSimulator: React.FC<MultiDeviceSimulatorProps> = ({ onClose }) => {
  const { products, sales, stats, createSale } = useApp();
  const [isSimulatingSale, setIsSimulatingSale] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const handleSimulateCashierSale = async () => {
    if (products.length === 0) return;
    const targetProduct = products[0];
    if (targetProduct.unit_stock <= 0) return;

    setIsSimulatingSale(true);
    try {
      const sale = await createSale({
        items: [
          {
            product_id: targetProduct.id,
            product_name: targetProduct.name,
            quantity: 1,
            unit_price: targetProduct.unit_sale_price,
          },
        ],
        payment_type: 'cash',
      });

      const logEntry = `[${new Date().toLocaleTimeString('fr-FR')}] Vente de 1x "${targetProduct.name}" (${formatCurrency(
        targetProduct.unit_sale_price
      )}) validée sur le Smartphone Caissier -> Données synchronisées en temps réel vers le Dashboard Admin !`;

      setSimulationLog((prev) => [logEntry, ...prev.slice(0, 5)]);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulatingSale(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <SplitSquareVertical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Simulateur de Synchronisation Temps Réel</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Visualisez la propagation instantanée des événements entre le Smartphone Caissier et le Poste Administrateur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-side Dual Screens */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SCREEN 1: Terminal Caissier (Smartphone) */}
            <div className="bg-white rounded-3xl p-6 border border-teal-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-900 text-sm">Terminal 1 : Smartphone Caissier</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    Déclenchez une vente rapide depuis ce terminal pour observer la mise à jour immédiate sur l'écran du Gérant.
                  </p>

                  <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200/80 text-xs space-y-1.5">
                    <div className="font-extrabold text-teal-900">Produit prêt à l'encaissement :</div>
                    {products.length > 0 ? (
                      <div>
                        <div className="font-bold text-slate-900">{products[0].name}</div>
                        <div className="text-slate-500 mt-0.5">
                          Prix : <strong>{formatCurrency(products[0].unit_sale_price)}</strong> • Stock restant : <strong>{products[0].unit_stock} unités</strong>
                        </div>
                      </div>
                    ) : (
                      <div>Aucun produit</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                id="btn-simulate-cashier-sale"
                disabled={isSimulatingSale || products.length === 0 || products[0]?.unit_stock <= 0}
                onClick={handleSimulateCashierSale}
                className="mt-6 w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSimulatingSale ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Encaisser Vente Cash (1x {products[0]?.name?.slice(0, 15) || 'Article'})</span>
                  </>
                )}
              </button>
            </div>

            {/* SCREEN 2: Poste Gérant (Ordinateur / Dashboard) */}
            <div className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-900 text-sm">Terminal 2 : Bureau Gérant (Admin)</span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>

                <div className="mt-4 space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    Les indicateurs financiers et les stocks sont recalculés et affichés sans recharger la page.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solde Caisse</div>
                      <div className="font-black text-teal-700 text-sm mt-0.5">
                        {formatCurrency(stats?.solde_caisse || 0)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ventes du Jour</div>
                      <div className="font-black text-indigo-700 text-sm mt-0.5">
                        {formatCurrency(stats?.ventes_jour || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 text-xs">
                    <div className="font-bold text-indigo-900 mb-1">Dernière Vente reçue via WebSocket :</div>
                    {sales.length > 0 ? (
                      <div className="text-slate-700 font-medium">
                        {sales[0].items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')} ({formatCurrency(sales[0].total_amount)})
                      </div>
                    ) : (
                      <div className="text-slate-400">En attente d'une vente...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-2.5 text-center text-[11px] text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Synchronisation active en flux continu</span>
              </div>
            </div>
          </div>

          {/* Simulation Log Stream */}
          {simulationLog.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Flux d'événements temps réel :
              </div>
              <div className="space-y-1.5">
                {simulationLog.map((log, index) => (
                  <div key={index} className="text-xs font-mono p-2.5 bg-slate-50 rounded-xl text-slate-700 border border-slate-200/80">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
          >
            Fermer le simulateur
          </button>
        </div>
      </div>
    </div>
  );
};
