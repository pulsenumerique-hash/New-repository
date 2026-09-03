import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  X,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ArrowRight,
  Wallet,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
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
  const { stats, updateProduct, createWithdrawal, createAuditLog } = useApp();
  const { user } = useAuth();

  const threshold = product.min_alert_threshold ?? 10;
  const unitsPerPkg = Math.max(1, product.units_per_package || 1);

  // Calculate recommendation to exceed safety threshold
  const recommendedPackages = useMemo(() => {
    const deficit = Math.max(0, threshold - product.unit_stock);
    const pkgs = Math.ceil((deficit + unitsPerPkg) / unitsPerPkg);
    return Math.max(1, pkgs);
  }, [threshold, product.unit_stock, unitsPerPkg]);

  // Form states
  const [packagesToAdd, setPackagesToAdd] = useState<number | ''>(recommendedPackages);
  const [packagePurchasePrice, setPackagePurchasePrice] = useState<number | ''>(
    product.package_purchase_price || 0
  );
  const [extraUnitsToAdd, setExtraUnitsToAdd] = useState<number | ''>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Computations
  const numPkgs = Number(packagesToAdd) || 0;
  const numExtraUnits = Number(extraUnitsToAdd) || 0;
  const numPkgPrice = Number(packagePurchasePrice) || 0;

  const totalUnitsAdded = useMemo(() => {
    return numPkgs * unitsPerPkg + numExtraUnits;
  }, [numPkgs, unitsPerPkg, numExtraUnits]);

  const computedUnitPurchasePrice = useMemo(() => {
    if (unitsPerPkg <= 0) return 0;
    return Math.round(numPkgPrice / unitsPerPkg);
  }, [numPkgPrice, unitsPerPkg]);

  const totalCost = useMemo(() => {
    const pkgsCost = numPkgs * numPkgPrice;
    const unitsCost = numExtraUnits * computedUnitPurchasePrice;
    return pkgsCost + unitsCost;
  }, [numPkgs, numPkgPrice, numExtraUnits, computedUnitPurchasePrice]);

  const newUnitStock = (product.unit_stock || 0) + totalUnitsAdded;
  const newPackageStock = Math.floor(newUnitStock / unitsPerPkg);

  // Cash register balance check
  const availableCash = stats?.solde_caisse ?? 0;
  const isInsufficientCash = totalCost > availableCash;
  const remainingCash = availableCash - totalCost;

  const willClearAlert = newUnitStock > threshold;

  const handleQuickAddPackages = (count: number) => {
    setPackagesToAdd((prev) => (Number(prev) || 0) + count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalUnitsAdded <= 0) {
      setErrorMessage('Veuillez ajouter au moins une unité ou un paquet au stock.');
      return;
    }

    if (numPkgPrice <= 0) {
      setErrorMessage("Le prix d'achat du paquet doit être supérieur à zéro.");
      return;
    }

    // STRICT BLOCKING: Check cash register balance
    if (isInsufficientCash) {
      setErrorMessage(
        `Solde de caisse insuffisant ! Le réapprovisionnement coûte ${formatCurrency(
          totalCost
        )} mais votre caisse ne contient que ${formatCurrency(
          availableCash
        )}. Veuillez approvisionner la caisse (injection de fonds ou ventes cash) avant de continuer.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update product stock and purchase prices
      await updateProduct(product.id, {
        unit_stock: newUnitStock,
        package_stock: newPackageStock,
        package_purchase_price: numPkgPrice,
        unit_purchase_price: computedUnitPurchasePrice,
      });

      // 2. Automatically deduct total cost from cash register
      if (totalCost > 0) {
        const authorName = user ? `${user.first_name} ${user.last_name}` : 'Admin';
        await createWithdrawal({
          amount: totalCost,
          reason: `Réapprovisionnement stock : ${product.name} (+${numPkgs} ${product.package_type}${
            numPkgs > 1 ? 's' : ''
          }${numExtraUnits > 0 ? `, +${numExtraUnits} u` : ''})`,
          author: authorName,
        });
      }

      // 3. Create audit entry
      createAuditLog(
        'UPDATE',
        'product',
        `Réapprovisionnement de "${product.name}" : +${totalUnitsAdded} unités (${formatCurrency(
          totalCost
        )} déduits de la caisse)`,
        product.id
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du réapprovisionnement';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <PackagePlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Réapprovisionner le Stock</h3>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">
                Ajout de stock avec déduction automatique de la caisse
              </p>
            </div>
          </div>
          <button
            id="btn-close-restock-modal"
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Product Identification & Current Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Fiche Produit
                </span>
                <h4 className="text-base font-black text-slate-900">{product.name}</h4>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Conditionnement : <strong className="text-slate-800">{product.package_type}</strong> ({unitsPerPkg} unités/{product.package_type.toLowerCase()})
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                    product.unit_stock <= 0
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : product.unit_stock <= threshold
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {product.unit_stock <= 0
                      ? 'Rupture (0)'
                      : product.unit_stock <= threshold
                      ? 'Stock Faible'
                      : 'Stock Normal'}
                  </span>
                </span>
                <div className="text-xs font-bold text-slate-700 mt-1">
                  Stock actuel : <span className="font-black text-slate-900">{product.unit_stock}</span> / {threshold} seuil
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets for Packages */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Raccourcis {product.package_type}s :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickAddPackages(num)}
                  className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200 transition active:scale-95 text-center"
                >
                  +{num} {product.package_type.slice(0, 5)}
                </button>
              ))}
            </div>
          </div>

          {/* Saisie: Nombre de paquets & Prix d'achat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de {product.package_type}s à ajouter <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-restock-packages"
                  type="number"
                  min="0"
                  value={packagesToAdd}
                  onChange={(e) => setPackagesToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                  {product.package_type}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix d'achat du {product.package_type} (FCFA) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-restock-package-price"
                  type="number"
                  min="0"
                  value={packagePurchasePrice}
                  onChange={(e) =>
                    setPackagePurchasePrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: 15000"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">
                  FCFA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Coût unitaire calculé : <strong>{formatCurrency(computedUnitPurchasePrice)}</strong>/u
              </p>
            </div>
          </div>

          {/* Unités supplémentaires au détail (optionnel) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Unités supplémentaires au détail (optionnel) :
            </label>
            <div className="relative">
              <input
                id="input-restock-extra-units"
                type="number"
                min="0"
                value={extraUnitsToAdd}
                onChange={(e) => setExtraUnitsToAdd(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
              />
              <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                unités
              </span>
            </div>
          </div>

          {/* Vérification du Solde de Caisse (Obligatoire) */}
          <div
            className={`p-4 rounded-2xl border transition ${
              isInsufficientCash
                ? 'bg-rose-50 border-rose-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className={`w-4 h-4 ${isInsufficientCash ? 'text-rose-600' : 'text-slate-600'}`} />
                <span className="text-xs font-extrabold text-slate-800">
                  Contrôle du Solde de Caisse
                </span>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  isInsufficientCash
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {formatCurrency(availableCash)} disponible
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Coût total du réapprovisionnement :</span>
                <strong className="font-black text-slate-900 text-sm">
                  {formatCurrency(totalCost)}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Solde de caisse restant après achat :</span>
                <strong
                  className={`font-black ${
                    isInsufficientCash ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(remainingCash)}
                </strong>
              </div>
            </div>

            {/* BLOCKING ALERT IF INSUFFICIENT CASH */}
            {isInsufficientCash && (
              <div className="mt-3 p-3 bg-rose-100/90 border border-rose-300 rounded-xl text-rose-950 text-xs font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <span>
                    Solde insuffisant ! Il vous manque{' '}
                    <strong>{formatCurrency(totalCost - availableCash)}</strong> en caisse pour régler ce
                    réapprovisionnement.
                  </span>
                  <div className="text-[11px] font-normal text-rose-900 mt-1">
                    L'opération est bloquée pour préserver la comptabilité de la boutique. Veuillez effectuer une injection de fonds ou réduire les quantités.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Stock Impact Preview */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Quantité totale ajoutée :</span>
              <strong className="text-emerald-900 font-black text-sm">+{totalUnitsAdded} unités</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Nouveau stock après validation :</span>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                <span>{product.unit_stock}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className={willClearAlert ? 'text-emerald-700' : 'text-amber-700'}>
                  {newUnitStock} unités ({newPackageStock} {product.package_type}s)
                </span>
              </div>
            </div>

            {willClearAlert ? (
              <div className="p-2 bg-emerald-100/80 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Le stock dépassera le seuil d'alerte ({threshold} u). Statut vert garanti.</span>
              </div>
            ) : (
              <div className="p-2 bg-amber-100/80 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Attention : {newUnitStock} unités reste en dessous ou égal au seuil ({threshold} u).</span>
              </div>
            )}
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
              disabled={isSubmitting || totalUnitsAdded <= 0 || isInsufficientCash}
              className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer ${
                isInsufficientCash
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Enregistrement & Déduction...'
                  : isInsufficientCash
                  ? 'Solde insuffisant (Bloqué)'
                  : 'Valider & Déduire de la Caisse'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
