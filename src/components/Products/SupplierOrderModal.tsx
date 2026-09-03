import React, { useState, useMemo } from 'react';
import {
  FileText,
  X,
  Copy,
  Check,
  Printer,
  Boxes,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

interface SupplierOrderModalProps {
  products: Product[];
  onClose: () => void;
}

export const SupplierOrderModal: React.FC<SupplierOrderModalProps> = ({ products, onClose }) => {
  const { boutique } = useAuth();
  const [copied, setCopied] = useState(false);

  // Filter only alerted products
  const alertProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.min_alert_threshold ?? 10;
      return (p.unit_stock || 0) <= threshold;
    });
  }, [products]);

  // Generate suggested order lines
  const orderLines = useMemo(() => {
    return alertProducts.map((p) => {
      const threshold = p.min_alert_threshold ?? 10;
      const targetStock = threshold * 2; // Recommended buffer: 2x threshold
      const unitsDeficit = Math.max(0, targetStock - p.unit_stock);
      const unitsPerPkg = Math.max(1, p.units_per_package || 1);
      const suggestedPackages = Math.max(1, Math.ceil(unitsDeficit / unitsPerPkg));
      const lineCost = suggestedPackages * (p.package_purchase_price || 0);

      return {
        product: p,
        currentStock: p.unit_stock,
        threshold,
        suggestedPackages,
        packageType: p.package_type,
        unitsPerPackage: unitsPerPkg,
        unitPurchasePrice: p.unit_purchase_price,
        packagePurchasePrice: p.package_purchase_price,
        lineCost,
      };
    });
  }, [alertProducts]);

  const totalOrderBudget = useMemo(() => {
    return orderLines.reduce((sum, item) => sum + item.lineCost, 0);
  }, [orderLines]);

  const handleCopyText = () => {
    const dateStr = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    let text = `📦 BON DE COMMANDE FOURNISSEUR — ${boutique?.name || 'Boutique'}\n`;
    text += `Date : ${dateStr}\n`;
    text += `Total articles en alerte : ${alertProducts.length}\n`;
    text += `Budget estimé : ${formatCurrency(totalOrderBudget)}\n\n`;
    text += `LISTE DES ARTICLES À COMMANDER :\n`;
    text += `-------------------------------------------\n`;

    orderLines.forEach((item, index) => {
      text += `${index + 1}. ${item.product.name}\n`;
      text += `   • Quantité : ${item.suggestedPackages} ${item.packageType}(s)\n`;
      text += `   • Stock actuel : ${item.currentStock} unités (Seuil : ${item.threshold})\n`;
      text += `   • Prix estimé : ${formatCurrency(item.lineCost)}\n\n`;
    });

    text += `-------------------------------------------\n`;
    text += `Généré automatiquement par BoutiquePro.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      alert('Impossible de copier automatiquement dans le presse-papier.');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Bon de Réassort & Commande Fournisseur</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculé automatiquement sur la base des seuils de sécurité de stock
              </p>
            </div>
          </div>
          <button
            id="btn-close-supplier-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Header (Only visible on paper print) */}
        <div className="hidden print:block p-6 border-b border-slate-300">
          <h1 className="text-2xl font-black text-slate-900">BON DE COMMANDE FOURNISSEUR</h1>
          <p className="text-sm text-slate-600">{boutique?.name} • Généré le {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Summary Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Articles en Alerte
              </span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {alertProducts.length} références
              </div>
              <span className="text-[11px] text-amber-700 font-medium">Sous le seuil de sécurité</span>
            </div>

            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                Colis à Commander
              </span>
              <div className="text-2xl font-black text-indigo-950 mt-1">
                {orderLines.reduce((acc, l) => acc + l.suggestedPackages, 0)} conditionnements
              </div>
              <span className="text-[11px] text-indigo-700 font-medium">Cartons, sacs, casiers</span>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Budget Réassort Estimé
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {formatCurrency(totalOrderBudget)}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Basé sur les prix d'achat gros</span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-3 text-center">Stock / Seuil</th>
                  <th className="py-3 px-4 text-center">Commande Suggérée</th>
                  <th className="py-3 px-4 text-right">Prix Unité Gros</th>
                  <th className="py-3 px-4 text-right">Total Ligne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      Aucun produit n'est actuellement en dessous de son seuil de sécurité !
                    </td>
                  </tr>
                ) : (
                  orderLines.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {item.product.category} • Conditionnement: {item.packageType} ({item.unitsPerPackage} unités)
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          item.currentStock <= 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.currentStock} / {item.threshold}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-black text-indigo-900 text-sm">
                          {item.suggestedPackages} {item.packageType}(s)
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          ≈ +{item.suggestedPackages * item.unitsPerPackage} unités
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                        {formatCurrency(item.packagePurchasePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(item.lineCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500 font-medium">
            Partagez facilement cette liste à vos grossistes ou fournisseurs.
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-order"
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer</span>
            </button>

            <button
              id="btn-copy-order-text"
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié dans le presse-papier !' : 'Copier pour WhatsApp / SMS'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
