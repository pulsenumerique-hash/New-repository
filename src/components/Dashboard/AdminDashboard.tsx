import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  CalendarDays,
  CalendarRange,
  Boxes,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Receipt,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, formatDateShort } from '../../lib/formatters';

interface AdminDashboardProps {
  onOpenWithdrawal: () => void;
  onOpenInjection: () => void;
  onOpenClosing: () => void;
  onOpenProductModal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenWithdrawal,
  onOpenInjection,
  onOpenClosing,
  onOpenProductModal,
}) => {
  const { stats, sales, products, clients, refunds, movements, closings, refreshData, isLoadingData, setActiveTab } = useApp();

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Cash Actions Bento Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tableau de Bord Administrateur • Bento Grid</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Supervision & Finances en Direct
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Calculs financiers automatiques, valorisation du stock au prix d’achat, suivi des créances et flux multi-terminaux.
          </p>
        </div>

        {/* Quick Cash Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            id="btn-quick-injection"
            onClick={onOpenInjection}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 border border-emerald-400/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Injecter Capital</span>
          </button>
          <button
            id="btn-quick-withdrawal"
            onClick={onOpenWithdrawal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition active:scale-95 border border-rose-400/30"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Retrait Caisse</span>
          </button>
          <button
            id="btn-quick-closing"
            onClick={onOpenClosing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition active:scale-95 border border-amber-300/40"
          >
            <Lock className="w-4 h-4" />
            <span>Clôturer Caisse</span>
          </button>
        </div>

        {/* Decorative subtle background gradient blob */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 6 BENTO METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Solde de caisse (Primary Bento Anchor) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-md relative overflow-hidden group hover:border-slate-700 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Solde de Caisse Actuel
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-white">
              {formatCurrency(stats?.solde_caisse || 0)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Capital + Ventes Cash + Remboursements − Retraits
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold">Injections: {formatCurrency(stats?.injections_total || 0)}</span>
            <span className="text-rose-400 font-semibold">Retraits: {formatCurrency(stats?.retraits_total || 0)}</span>
          </div>
        </div>

        {/* 2. Ventes du jour */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ventes du Jour (Aujourd’hui)
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-blue-950">
                {formatCurrency(stats?.ventes_jour || 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Total cumulé des ventes (Cash & Crédit) aujourd’hui
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('pos')}
              className="text-blue-700 font-bold hover:text-blue-900 flex items-center gap-1 group"
            >
              <span>Accéder à la Caisse</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* 3. Ventes de la semaine */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ventes de la Semaine
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-indigo-950">
                {formatCurrency(stats?.ventes_semaine || 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Depuis le début de la semaine courante
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center text-xs text-indigo-700 font-semibold">
            Moyenne journalière : {formatCurrency(Math.round((stats?.ventes_semaine || 0) / 7))}
          </div>
        </div>

        {/* 4. Ventes du mois */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ventes du Mois
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center">
                <CalendarRange className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-purple-950">
                {formatCurrency(stats?.ventes_mois || 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Chiffre d’affaires brut du mois en cours
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center text-xs text-purple-700 font-semibold">
            Progression mensuelle en direct
          </div>
        </div>

        {/* 5. Valeur totale du stock (au prix d'achat) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Valeur Totale du Stock
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-amber-950">
                {formatCurrency(stats?.valeur_stock_achat || 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Valorisé au <strong>prix d’achat unitaire</strong> ({products.length} références)
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">
              Valeur vente : {formatCurrency(stats?.valeur_stock_vente || 0)}
            </span>
            <button
              onClick={() => setActiveTab('products')}
              className="text-amber-800 font-bold hover:underline"
            >
              Gérer stock
            </button>
          </div>
        </div>

        {/* 6. Total des crédits en cours */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Crédits en Cours
              </span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-rose-950">
                {formatCurrency(stats?.total_credits_en_cours || 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Créances dues par <strong>{stats?.nb_clients_debiteurs || 0} clients débiteurs</strong>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('clients')}
              className="text-rose-700 font-bold hover:text-rose-900 flex items-center gap-1 group"
            >
              <span>Encaisser un remboursement</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* LOWER BENTO SECTION: Live transactions & Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dernières Ventes en direct */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Flux des Dernières Ventes
                  </h3>
                  <span className="text-[11px] text-slate-500">Synchronisé en temps réel multi-terminaux</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('pos')}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition"
              >
                + Nouvelle Vente
              </button>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Aucune vente enregistrée pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date / Heure</th>
                      <th className="py-3 px-4">Articles</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Caissier / Client</th>
                      <th className="py-3 px-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sales.slice(0, 7).map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {formatDateShort(sale.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {sale.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                              sale.payment_type === 'cash'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {sale.payment_type === 'cash' ? 'CASH' : 'CRÉDIT'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {sale.payment_type === 'credit' ? (
                            <span className="font-semibold text-rose-700">Client : {sale.client_name}</span>
                          ) : (
                            <span>Par : {sale.cashier_name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                          {formatCurrency(sale.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Alertes Stock & Dernières Clôtures */}
        <div className="space-y-6">
          {/* Alertes Stock Bas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Alertes Stock Bas</h3>
              </div>
              <button
                onClick={onOpenProductModal}
                className="text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                Gérer Alertes →
              </button>
            </div>

            {products.filter((p) => (p.unit_stock || 0) <= (p.min_alert_threshold ?? 10)).length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                ✅ Tous les stocks sont à des niveaux suffisants.
              </p>
            ) : (
              <div className="space-y-2.5">
                {products
                  .filter((p) => (p.unit_stock || 0) <= (p.min_alert_threshold ?? 10))
                  .slice(0, 5)
                  .map((p) => {
                    const threshold = p.min_alert_threshold ?? 10;
                    const isOut = (p.unit_stock || 0) <= 0;
                    return (
                      <div
                        key={p.id}
                        onClick={onOpenProductModal}
                        className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 flex items-center justify-between text-xs cursor-pointer transition"
                      >
                        <div>
                          <div className="font-bold text-amber-950 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isOut && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-600 text-white uppercase">
                                Rupture
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-700">
                            Seuil d'alerte : {threshold} unités
                          </div>
                        </div>
                        <div className="text-right font-black text-amber-950">
                          {p.unit_stock} unités
                          <div className="text-[10px] text-amber-700">
                            ({p.package_stock} {p.package_type}s)
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Dernières clôtures de caisse */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Dernières Clôtures</h3>
              </div>
              <button
                onClick={onOpenClosing}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                Clôturer
              </button>
            </div>

            {closings.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                Aucune clôture enregistrée. Effectuez une clôture journalière en fin de service.
              </p>
            ) : (
              <div className="space-y-2.5">
                {closings.slice(0, 3).map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{formatDate(c.date)}</span>
                      <span
                        className={`font-bold ${
                          c.discrepancy === 0
                            ? 'text-emerald-700'
                            : c.discrepancy > 0
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }`}
                      >
                        Écart : {c.discrepancy >= 0 ? '+' : ''}
                        {formatCurrency(c.discrepancy)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Compté : {formatCurrency(c.counted_cash)}</span>
                      <span>Théorique : {formatCurrency(c.theoretical_cash)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
