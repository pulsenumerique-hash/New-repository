import React, { useState, useMemo } from 'react';
import { Lock, AlertCircle, CheckCircle2, DollarSign, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/formatters';

interface CashClosingModalProps {
  onClose: () => void;
}

export const CashClosingModal: React.FC<CashClosingModalProps> = ({ onClose }) => {
  const { stats, createCashClosing, sales, refunds, movements } = useApp();
  const { user } = useAuth();

  const theoreticalCash = stats?.solde_caisse || 0;
  const [countedCash, setCountedCash] = useState<number | ''>(theoreticalCash);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Discrepancy
  const discrepancy = useMemo(() => {
    if (countedCash === '') return 0;
    return Number(countedCash) - theoreticalCash;
  }, [countedCash, theoreticalCash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash === '' || isNaN(Number(countedCash))) {
      setErrorMsg('Veuillez saisir le montant physique compté dans la caisse.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCashClosing({
        counted_cash: Number(countedCash),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur clôture';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Clôture de Caisse Journalière</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Arrêté des comptes et calcul automatique des écarts
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Synthèse Théorique Bento Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
            <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
              Synthèse Financière Actuelle :
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>Ventes du jour (CA) : <strong>{formatCurrency(stats?.ventes_jour || 0)}</strong></div>
              <div>Remboursements reçus : <strong>{formatCurrency(refunds.reduce((acc, r) => acc + r.amount, 0))}</strong></div>
              <div>Injections de capital : <strong>{formatCurrency(stats?.injections_total || 0)}</strong></div>
              <div>Retraits effectués : <strong>{formatCurrency(stats?.retraits_total || 0)}</strong></div>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-extrabold text-slate-900">Solde Théorique Attendu :</span>
              <span className="font-black text-teal-700 text-base">{formatCurrency(theoreticalCash)}</span>
            </div>
          </div>

          {/* Saisie montant compté */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Montant physique compté dans le tiroir-caisse (FCFA) *
            </label>
            <input
              id="input-counted-cash"
              type="number"
              min="0"
              required
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="ex: 125000"
              className="w-full p-3 text-base font-black border border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 text-slate-900"
            />
          </div>

          {/* Écart en temps réel */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-extrabold ${
              discrepancy === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : discrepancy > 0
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>Écart de caisse calculé :</span>
            <span className="text-sm font-black">
              {discrepancy > 0 ? '+' : ''}
              {formatCurrency(discrepancy)} ({discrepancy === 0 ? 'Caisse exacte ✅' : discrepancy > 0 ? 'Excédent 🟢' : 'Manquant 🔴'})
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observations / Notes de fin de journée (optionnel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Clôture sans incident, monnaie prête pour demain..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Annuler
            </button>
            <button
              id="btn-submit-closing"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? 'Enregistrement...' : 'Confirmer et Archiver la Clôture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
