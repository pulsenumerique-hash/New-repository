import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  X,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/formatters';

interface QuickRestockModalProps {
  product: Product;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const { updateProduct } = useApp();
  const threshold = product.min_alert_threshold ?? 10;
  const unitsPerPkg = Math.max(1, product.units_per_package || 1);

  // We default to enough packages to bring it above safety threshold + buffer
  const initialPackagesNeeded = useMemo(() => {
    const deficit = Math.max(0, threshold - product.unit_stock);
    const pkgs = Math.ceil((deficit + unitsPerPkg) / unitsPerPkg);
    return Math.max(1, pkgs);
  }, [threshold, product.unit_stock, unitsPerPkg]);

  const [packagesToAdd, setPackagesToAdd] = useState<number | ''>(initialPackagesNeeded);
  const [extraUnitsToAdd, setExtraUnitsToAdd] = useState<number | ''>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalUnitsAdded = useMemo(() => {
    const pkgs = Number(packagesToAdd) || 0;
    const units = Number(extraUnitsToAdd) || 0;
    return pkgs * unitsPerPkg + units;
  }, [packagesToAdd, extraUnitsToAdd, unitsPerPkg]);

  const newUnitStock = (product.unit_stock || 0) + totalUnitsAdded;
  const newPackageStock = Math.floor(newUnitStock / unitsPerPkg);

  const totalCost = useMemo(() => {
    const pkgs = Number(packagesToAdd) || 0;
    const units = Number(extraUnitsToAdd) || 0;
    const pkgCost = pkgs * (product.package_purchase_price || 0);
    const unitCost = units * (product.unit_purchase_price || 0);
    return pkgCost + unitCost;
  }, [packagesToAdd, extraUnitsToAdd, product.package_purchase_price, product.unit_purchase_price]);

  const willClearAlert = newUnitStock > threshold;

  const handleQuickAddPackages = (count: number) => {
    setPackagesToAdd((prev) => (Number(prev) || 0) + count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalUnitsAdded <= 0) {
      setError('Veuillez ajouter au moins une unité ou un conditionnement.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await updateProduct(product.id, {
        unit_stock: newUnitStock,
        package_stock: newPackageStock,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du réassort');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <PackagePlus className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Réassort Rapide de Stock</h3>
              <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                Sortir le produit de son état d'alerte critique
              </p>
            </div>
          </div>
          <button
            id="btn-close-restock-modal"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Identification & Current Alert Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Produit sélectionné
                </span>
                <h4 className="text-base font-black text-slate-900">{product.name}</h4>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Conditionnement : <strong className="text-slate-800">{product.package_type}</strong> ({unitsPerPkg} unités/{product.package_type.toLowerCase()})
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                  product.unit_stock <= 0
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-amber-100 text-amber-900 border-amber-200'
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>{product.unit_stock <= 0 ? 'Rupture (0)' : 'Stock Faible'}</span>
                </span>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  Actuel : <span className="text-rose-600 font-black">{product.unit_stock}</span> / {threshold} seuil
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets for Packages */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Ajout rapide de {product.package_type}s :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickAddPackages(num)}
                  className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black border border-indigo-200 transition active:scale-95 text-center"
                >
                  +{num} {product.package_type.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de {product.package_type}s entiers à ajouter :
              </label>
              <div className="relative">
                <input
                  id="input-restock-packages"
                  type="number"
                  min="0"
                  value={packagesToAdd}
                  onChange={(e) => setPackagesToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  placeholder="0"
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                  {product.package_type}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unités supplémentaires au détail :
              </label>
              <div className="relative">
                <input
                  id="input-restock-units"
                  type="number"
                  min="0"
                  value={extraUnitsToAdd}
                  onChange={(e) => setExtraUnitsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  placeholder="0"
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                  unités
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Restock Calculation Preview */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-emerald-50/70 border border-indigo-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Total unités réapprovisionnées :</span>
              <strong className="text-indigo-900 font-black text-sm">+{totalUnitsAdded} unités</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Nouveau niveau de stock :</span>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                <span>{product.unit_stock}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className={willClearAlert ? 'text-emerald-700' : 'text-amber-700'}>
                  {newUnitStock} unités ({newPackageStock} {product.package_type}s)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-indigo-200/50">
              <span className="text-slate-600 font-medium">Coût d'achat total estimé :</span>
              <span className="font-black text-slate-900 text-sm">{formatCurrency(totalCost)}</span>
            </div>

            <div className="pt-2">
              {willClearAlert ? (
                <div className="p-2 bg-emerald-100/70 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Le stock dépassera le seuil de sécurité ({threshold} unités). Alerte résolue !</span>
                </div>
              ) : (
                <div className="p-2 bg-amber-100/70 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Attention : {newUnitStock} unités reste en dessous ou égal au seuil ({threshold}).</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Annuler
            </button>
            <button
              id="btn-confirm-restock"
              type="submit"
              disabled={isSubmitting || totalUnitsAdded <= 0}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Valider le Réassort (+)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
