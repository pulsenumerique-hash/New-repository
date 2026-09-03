import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  MinusCircle,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  DollarSign,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface CashManagementProps {
  onOpenWithdrawal: () => void;
  onOpenInjection: () => void;
  onOpenClosing: () => void;
}

export const CashManagement: React.FC<CashManagementProps> = ({
  onOpenWithdrawal,
  onOpenInjection,
  onOpenClosing,
}) => {
  const { stats, movements, closings, sales, refunds } = useApp();
  const { role, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'movements' | 'closings'>('movements');

  return (
    <div className="space-y-6">
      {/* Bento Top Banner with Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-teal-400" />
            </div>
            <span>Gestion de la Caisse & Trésorerie</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mt-1">
            Solde Actuel : {formatCurrency(stats?.solde_caisse || 0)}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Traçabilité intégrale de toutes les entrées, sorties et clôtures journalières en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            id="btn-cash-inject"
            onClick={onOpenInjection}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Injecter Capital</span>
          </button>
          <button
            id="btn-cash-withdraw"
            onClick={onOpenWithdrawal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Retrait Caisse</span>
          </button>
          {role === 'admin' && (
            <button
              id="btn-cash-close"
              onClick={onOpenClosing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Clôture Journalière</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Tabs Switcher: Mouvements vs Clôtures */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-indigo-600" />
          <span>Mouvements d'Espèces ({movements.length})</span>
        </button>

        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('closings')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 ${
              activeTab === 'closings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Historique des Clôtures ({closings.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: Mouvements d'espèces (Retraits & Injections) */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date / Heure</th>
                  <th className="py-3.5 px-4">Type Mouvement</th>
                  <th className="py-3.5 px-4">Motif Saisi</th>
                  <th className="py-3.5 px-4">Auteur du Mouvement</th>
                  <th className="py-3.5 px-5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucun mouvement de caisse enregistré.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isInjection = mov.type === 'injection';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-medium text-slate-500">
                          {formatDate(mov.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                              isInjection
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {isInjection ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>{isInjection ? 'INJECTION CAPITAL' : 'RETRAIT CAISSE'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {mov.reason}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <strong className="text-slate-800">{mov.author}</strong>
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-sm">
                          <span className={isInjection ? 'text-emerald-700' : 'text-rose-700'}>
                            {isInjection ? '+' : '-'}
                            {formatCurrency(mov.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Historique des clôtures journalières (Admin) */}
      {activeTab === 'closings' && role === 'admin' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date de Clôture</th>
                  <th className="py-3.5 px-4 text-right">Solde Théorique</th>
                  <th className="py-3.5 px-4 text-right">Montant Compté</th>
                  <th className="py-3.5 px-4 text-center">Écart de Caisse</th>
                  <th className="py-3.5 px-4 text-right">Ventes Cash</th>
                  <th className="py-3.5 px-4 text-right">Remboursements</th>
                  <th className="py-3.5 px-5">Clôturé par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucune clôture de caisse archivée pour le moment.
                    </td>
                  </tr>
                ) : (
                  closings.map((c) => {
                    const isExact = c.discrepancy === 0;
                    const isSurplus = c.discrepancy > 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-medium text-slate-800">
                          {formatDate(c.date)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          {formatCurrency(c.theoretical_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {formatCurrency(c.counted_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full font-extrabold text-[11px] border ${
                              isExact
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isSurplus
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isSurplus ? '+' : ''}
                            {formatCurrency(c.discrepancy)} ({isExact ? 'Exact' : isSurplus ? 'Excédent' : 'Manquant'})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                          {formatCurrency(c.total_cash_sales)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">
                          {formatCurrency(c.total_refunds)}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-bold">
                          {c.closed_by_name}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
