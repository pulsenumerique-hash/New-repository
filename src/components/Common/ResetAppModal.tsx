import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertOctagon, X, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export interface ResetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetAppModal: React.FC<ResetAppModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsResetting(false);
      setResetSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isResetting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isResetting, onClose]);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    setIsResetting(true);
    setErrorMessage(null);
    try {
      await onConfirmReset();
      setResetSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.';
      setErrorMessage(msg);
      setIsResetting(false);
    }
  };

  return (
    <div
      id="modal-reset-app"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-700 via-rose-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">Réinitialiser l'application</h3>
              <p className="text-xs text-rose-200 mt-0.5">Remise à zéro totale des données métier</p>
            </div>
          </div>
          <button
            id="btn-close-reset-modal"
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {resetSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-base font-black text-emerald-950">Application réinitialisée avec succès</h4>
              <p className="text-xs text-emerald-700 font-medium">
                Toutes les données métier ont été effacées. Tous les compteurs sont revenus à zéro.
              </p>
            </div>
          ) : (
            <>
              {/* Primary Strict Required Message */}
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-950 leading-relaxed">
                    « Attention : cette action supprimera toutes les données de l'application et remettra tous les compteurs à zéro. Cette action est irréversible. Voulez-vous vraiment continuer ? »
                  </p>
                </div>
              </div>

              {/* What is deleted vs preserved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                    Données supprimées (Remise à 0)
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700 font-medium list-disc list-inside">
                    <li>Produits & catalogue : 0</li>
                    <li>Achats & fournisseurs : 0</li>
                    <li>Ventes & historiques : 0</li>
                    <li>Caisse, recettes & dépenses : 0</li>
                    <li>Crédits & remboursements : 0</li>
                    <li>Statistiques & compteurs : 0</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Données conservées intactes
                  </span>
                  <ul className="space-y-1 text-[11px] text-emerald-900 font-medium list-disc list-inside">
                    <li>Compte utilisateur & profil</li>
                    <li>Identifiants de connexion</li>
                    <li>Configuration boutique & rôles</li>
                    <li>Connexion Cloud Firebase</li>
                  </ul>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!resetSuccess && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-reset"
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              id="btn-confirm-reset"
              type="button"
              disabled={isResetting}
              onClick={handleExecuteReset}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Réinitialisation en cours...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmer la réinitialisation</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
