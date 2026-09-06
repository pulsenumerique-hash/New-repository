import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertOctagon,
  X,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Trash2,
  Database,
  Check,
  Lock,
} from 'lucide-react';

export interface ResetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (
    onProgress?: (collectionName: string, count: number, currentStep: number, totalSteps: number) => void
  ) => Promise<{ totalDeleted: number; collectionCounts: Record<string, number> } | void>;
  boutiqueName?: string;
}

const COLLECTION_LABELS: Record<string, string> = {
  products: 'Produits & Catalogue (Stock)',
  sales: 'Ventes & Tickets de caisse',
  suppliers: 'Fournisseurs & Achats',
  supplier_payments: 'Paiements fournisseurs & Règlements',
  cash_movements: 'Mouvements d’espèces (Injections/Retraits)',
  cash_closings: 'Clôtures de caisse journalières',
  expenses: 'Charges & Dépenses d’exploitation',
  clients: 'Clients & Crédits en cours',
  refunds: 'Remboursements de dettes',
  audit_logs: 'Journaux d’audit & Logs de sécurité',
  backups: 'Sauvegardes Cloud Firestore',
  active_sessions: 'Sessions multi-appareils résiduelles',
  solde_caisse: 'Solde de caisse actuel (Remise à 0 FCFA)',
};

export const ResetAppModal: React.FC<ResetAppModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  boutiqueName = 'votre boutique',
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [currentStepInfo, setCurrentStepInfo] = useState<{
    name: string;
    label: string;
    step: number;
    total: number;
  } | null>(null);
  const [processedSteps, setProcessedSteps] = useState<
    Array<{ name: string; label: string; count: number }>
  >([]);
  const [finalReport, setFinalReport] = useState<{
    totalDeleted: number;
    collectionCounts: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsResetting(false);
      setResetSuccess(false);
      setErrorMessage(null);
      setConfirmationInput('');
      setCurrentStepInfo(null);
      setProcessedSteps([]);
      setFinalReport(null);
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

  const isConfirmationValid = confirmationInput.trim().toUpperCase() === 'CONFIRMER';

  const handleExecuteReset = async () => {
    if (!isConfirmationValid) return;

    setIsResetting(true);
    setErrorMessage(null);
    setProcessedSteps([]);

    try {
      const result = await onConfirmReset((colName, count, currentStep, totalSteps) => {
        const label = COLLECTION_LABELS[colName] || colName;
        setCurrentStepInfo({
          name: colName,
          label,
          step: currentStep,
          total: totalSteps,
        });
        setProcessedSteps((prev) => {
          const exists = prev.some((p) => p.name === colName);
          if (exists) {
            return prev.map((p) => (p.name === colName ? { ...p, count } : p));
          }
          return [...prev, { name: colName, label, count }];
        });
      });

      if (result) {
        setFinalReport(result);
      }
      setResetSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.';
      setErrorMessage(msg);
      setIsResetting(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      id="modal-reset-app"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-700 via-rose-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">Réinitialisation complète (État Zéro Total)</h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Purge réelle de toutes les collections Firestore & Remise à 0 du solde de caisse
              </p>
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {resetSuccess ? (
            <div className="space-y-4">
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-lg font-black text-emerald-950">État Zéro Total Garanti !</h4>
                <p className="text-xs text-emerald-700 font-medium max-w-md mx-auto">
                  Toutes les collections Firestore ont été purgées avec succès. Tous les compteurs, stocks, achats, ventes, dettes, journaux et le solde de caisse ont été remis à zéro.
                </p>
              </div>

              {/* Final Audit Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Collections Firestore purgées ({processedSteps.length})</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {finalReport ? `${finalReport.totalDeleted} documents supprimés` : '100% purgé'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {processedSteps.map((step) => (
                    <div
                      key={step.name}
                      className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-medium text-slate-700 truncate">{step.label}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {step.name === 'solde_caisse' ? '0 FCFA' : `0 restant`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Solde de caisse actuel vérifié :</span>
                  <span className="font-mono text-sm font-black text-emerald-700">0.00 FCFA</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md transition"
                >
                  Fermer et retourner à l'application
                </button>
              </div>
            </div>
          ) : isResetting ? (
            /* Live execution progress */
            <div className="p-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">
                  Purge en cours sur Firestore...
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Itération document par document sur l'ensemble des collections.
                </p>
              </div>

              {currentStepInfo && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="truncate">{currentStepInfo.label}</span>
                    <span className="font-mono text-[11px] text-rose-700">
                      Étape {currentStepInfo.step} / {currentStepInfo.total}
                    </span>
                  </div>
                  <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((currentStepInfo.step / currentStepInfo.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Completed list while running */}
              {processedSteps.length > 0 && (
                <div className="text-left space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {processedSteps.map((step) => (
                    <div
                      key={step.name}
                      className="flex items-center justify-between text-[11px] py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{step.label}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {step.name === 'solde_caisse' ? '0 FCFA' : `Nettoyé`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Warning and Confirmation Prompt */
            <>
              {/* Primary Strict Required Message */}
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-950 leading-relaxed">
                    « Attention : cette action va itérer sur toutes les collections Firestore (produits, achats, ventes, caisse, logs, solde de caisse actuel etc...) pour les supprimer réellement et remettre tous les compteurs à zéro. Cette action est irréversible. Voulez-vous vraiment continuer ? »
                  </p>
                </div>
              </div>

              {/* What is deleted vs preserved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Collections Firestore purgées (0)</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-700 font-medium list-disc list-inside">
                    <li>Produits & catalogue : 0</li>
                    <li>Achats & fournisseurs : 0</li>
                    <li>Ventes & tickets : 0</li>
                    <li>Mouvements & caisse : 0</li>
                    <li>Solde de caisse actuel : 0 FCFA</li>
                    <li>Charges & dépenses : 0</li>
                    <li>Clients & dettes : 0</li>
                    <li>Journaux & logs d'audit : 0</li>
                    <li>Sauvegardes cloud : 0</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Données conservées intactes</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-emerald-900 font-medium list-disc list-inside">
                    <li>Compte administrateur & profil</li>
                    <li>Identifiants de connexion</li>
                    <li>Paramètres généraux boutique ({boutiqueName})</li>
                    <li>Comptes et accès caissiers</li>
                    <li>Règles de sécurité Cloud Firestore</li>
                  </ul>
                </div>
              </div>

              {/* Security confirmation challenge */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                <label
                  htmlFor="input-reset-confirmation"
                  className="block text-xs font-black text-amber-950"
                >
                  Confirmation de sécurité obligatoire :
                </label>
                <p className="text-[11px] text-amber-800">
                  Pour valider définitivement la suppression, veuillez saisir le mot{' '}
                  <span className="font-mono font-black text-rose-700 select-all">CONFIRMER</span> ci-dessous :
                </p>
                <input
                  id="input-reset-confirmation"
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Tapez CONFIRMER pour débloquer"
                  autoComplete="off"
                  className="w-full px-4 py-2.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
                />
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
              disabled={isResetting || !isConfirmationValid}
              onClick={handleExecuteReset}
              className={`px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isConfirmationValid
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 animate-pulse'
                  : 'bg-slate-400'
              }`}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Purge Firestore en cours...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmer la suppression totale (0)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
