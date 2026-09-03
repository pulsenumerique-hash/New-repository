import React, { useState } from 'react';
import { MinusCircle, PlusCircle, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/formatters';

interface CashMovementModalProps {
  type: 'withdrawal' | 'injection';
  onClose: () => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({ type, onClose }) => {
  const { createWithdrawal, createInjection, stats } = useApp();
  const { user } = useAuth();

  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [author, setAuthor] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isWithdrawal = type === 'withdrawal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Veuillez renseigner un montant valide supérieur à 0.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Le motif de l’opération est obligatoire.');
      return;
    }

    if (!author.trim()) {
      setErrorMsg('Le nom de l’auteur de l’opération est obligatoire.');
      return;
    }

    if (isWithdrawal && stats && numAmount > stats.solde_caisse) {
      setErrorMsg(
        `Le montant du retrait (${formatCurrency(numAmount)}) dépasse le solde disponible en caisse (${formatCurrency(
          stats.solde_caisse
        )}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isWithdrawal) {
        await createWithdrawal({
          amount: numAmount,
          reason: reason.trim(),
          author: author.trim(),
        });
      } else {
        await createInjection({
          amount: numAmount,
          reason: reason.trim(),
          author: author.trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’opération';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div
          className={`p-6 text-white flex items-center justify-between border-b ${
            isWithdrawal
              ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-rose-900/40'
              : 'bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border-teal-900/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isWithdrawal
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              }`}
            >
              {isWithdrawal ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-lg">
                {isWithdrawal ? 'Nouveau Retrait de Caisse' : 'Injection de Capital'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Solde actuel : <strong className="text-white">{formatCurrency(stats?.solde_caisse || 0)}</strong>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Montant de l'opération (FCFA) *
            </label>
            <input
              id="input-movement-amount"
              type="number"
              min="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="ex: 15000"
              className="w-full p-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motif de l'opération *
            </label>
            <input
              id="input-movement-reason"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isWithdrawal
                  ? 'ex: Achat fournitures, facture électricité, transport...'
                  : 'ex: Apport personnel gérant, monnaie fond de caisse...'
              }
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Auteur de l'opération (Nom de la personne) *
            </label>
            <input
              id="input-movement-author"
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ex: Amadou Diallo (Gérant)"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
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
              id="btn-submit-movement"
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-md text-white transition active:scale-95 disabled:opacity-70 ${
                isWithdrawal
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
              }`}
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isWithdrawal
                ? 'Valider le Retrait'
                : 'Valider l’Injection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
