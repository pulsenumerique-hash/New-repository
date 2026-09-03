import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Calendar,
  User,
  Ban,
  Receipt,
  ArrowRight,
  Clock,
  Trash2,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Sale } from '../../types';
import { formatCurrency, formatDate, formatDateShort } from '../../lib/formatters';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSaleForReprint?: (sale: Sale) => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSaleForReprint,
}) => {
  const { sales, cancelSale } = useApp();
  const { user, role } = useAuth();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cash' | 'credit' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Sale cancellation modal state
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Erreur de saisie / caisse');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Selected sale for ticket view
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Search
      const searchLower = search.toLowerCase();
      const matchesSearch =
        s.id.toLowerCase().includes(searchLower) ||
        (s.cashier_name && s.cashier_name.toLowerCase().includes(searchLower)) ||
        (s.client_name && s.client_name.toLowerCase().includes(searchLower)) ||
        s.items.some((item) => item.product_name.toLowerCase().includes(searchLower));

      // Type filter
      let matchesType = true;
      if (filterType === 'cash') {
        matchesType = s.payment_type === 'cash' && s.status !== 'cancelled';
      } else if (filterType === 'credit') {
        matchesType = s.payment_type === 'credit' && s.status !== 'cancelled';
      } else if (filterType === 'cancelled') {
        matchesType = s.status === 'cancelled';
      }

      // Date filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const saleDate = new Date(s.created_at);
        const now = new Date();
        if (dateRange === 'today') {
          matchesDate = saleDate.toDateString() === now.toDateString();
        } else if (dateRange === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          matchesDate = saleDate >= oneWeekAgo;
        } else if (dateRange === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          matchesDate = saleDate >= oneMonthAgo;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [sales, search, filterType, dateRange]);

  const handleConfirmCancel = async () => {
    if (!saleToCancel) return;
    const finalReason =
      cancelReason === 'Autre raison' ? customReason.trim() || 'Raison non spécifiée' : cancelReason;

    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelSale(saleToCancel.id, finalReason);
      setSaleToCancel(null);
      setCustomReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'annulation de la vente";
      setCancelError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Historique & Annulation des Ventes</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez les tickets, réimprimez les reçus et effectuez des annulations avec réintégration des stocks.
              </p>
            </div>
          </div>
          <button
            id="btn-close-sales-history"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="input-search-sales"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher ticket #, caissier, client, article..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status pills */}
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Toutes ({sales.length})
            </button>
            <button
              onClick={() => setFilterType('cash')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'credit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              Crédit
            </button>
            <button
              onClick={() => setFilterType('cancelled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'cancelled'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Annulées ({sales.filter((s) => s.status === 'cancelled').length})
            </button>

            {/* Date Select */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs"
            >
              <option value="all">Toutes périodes</option>
              <option value="today">Aujourd’hui</option>
              <option value="week">7 derniers jours</option>
              <option value="month">Ce mois-ci</option>
            </select>
          </div>
        </div>

        {/* Sales Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredSales.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm">Aucune vente ne correspond à vos critères.</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou la période sélectionnée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket / Date</th>
                    <th className="py-3 px-4">Caissier</th>
                    <th className="py-3 px-4">Articles</th>
                    <th className="py-3 px-4">Mode / Client</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const isCancelled = sale.status === 'cancelled';
                    return (
                      <tr
                        key={sale.id}
                        className={`transition ${isCancelled ? 'bg-slate-50/80 opacity-75' : 'hover:bg-slate-50/60'}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            #{sale.id.substring(sale.id.length - 6).toUpperCase()}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(sale.created_at)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{sale.cashier_name || 'Caissier'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-slate-700 truncate" title={sale.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}>
                            {sale.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {sale.items.reduce((sum, i) => sum + i.quantity, 0)} unité(s) au total
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase w-fit ${
                                sale.payment_type === 'cash'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {sale.payment_type.toUpperCase()}
                            </span>
                            {sale.client_name && (
                              <span className="text-[10px] text-slate-600 font-bold mt-1">
                                Client: {sale.client_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className={`font-black text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {formatCurrency(sale.total_amount)}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isCancelled ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                <Ban className="w-3 h-3 text-rose-600" />
                                <span>ANNULÉE</span>
                              </span>
                              {sale.cancel_reason && (
                                <div className="text-[10px] text-rose-700 italic mt-0.5 max-w-[140px] truncate mx-auto" title={sale.cancel_reason}>
                                  {sale.cancel_reason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Validée</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reprint ticket */}
                            <button
                              id={`btn-reprint-sale-${sale.id}`}
                              onClick={() => setViewingSale(sale)}
                              title="Voir & Réimprimer le Reçu"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Cancel sale action button (only if not already cancelled and role allows) */}
                            {!isCancelled && (
                              <button
                                id={`btn-cancel-sale-${sale.id}`}
                                onClick={() => {
                                  setSaleToCancel(sale);
                                  setCancelReason('Erreur de saisie / caisse');
                                  setCustomReason('');
                                  setCancelError(null);
                                }}
                                title="Annuler cette vente (restaure le stock et annule la dette client)"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-extrabold text-[11px] transition active:scale-95 shadow-2xs"
                              >
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                <span>Annuler</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Total affiché : <strong>{filteredSales.length}</strong> vente(s) • Montant cumulé :{' '}
            <strong className="text-slate-900">
              {formatCurrency(
                filteredSales.filter((s) => s.status !== 'cancelled').reduce((acc, s) => acc + s.total_amount, 0)
              )}
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* CONFIRM CANCELLATION DIALOG */}
      {saleToCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-700/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-base">Annulation de la Vente</h4>
                <p className="text-xs text-rose-100">
                  Ticket #{saleToCancel.id.substring(saleToCancel.id.length - 6).toUpperCase()} • {formatCurrency(saleToCancel.total_amount)}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                <p className="font-bold">Conséquences automatiques de l'annulation :</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Les articles vendus seront <strong>automatiquement réintégrés au stock</strong>.</li>
                  {saleToCancel.payment_type === 'credit' && (
                    <li>La dette du client <strong>{saleToCancel.client_name}</strong> sera réduite de {formatCurrency(saleToCancel.total_amount)}.</li>
                  )}
                  {saleToCancel.payment_type === 'cash' && (
                    <li>Le montant cash sera déduit du chiffre d'affaires et du solde de caisse.</li>
                  )}
                  <li>Cette action sera consignée dans le journal d'audit de sécurité.</li>
                </ul>
              </div>

              {cancelError && (
                <div className="p-3 bg-rose-100 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold">
                  {cancelError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Motif d'annulation obligatoire *
                </label>
                <select
                  id="select-cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-slate-800"
                >
                  <option value="Erreur de saisie / caisse">Erreur de saisie / caisse</option>
                  <option value="Retour marchandise client">Retour marchandise client</option>
                  <option value="Produit défectueux / périmé">Produit défectueux / périmé</option>
                  <option value="Annulation à la demande du client">Annulation à la demande du client</option>
                  <option value="Autre raison">Autre raison...</option>
                </select>
              </div>

              {cancelReason === 'Autre raison' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Précisez le motif :
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="ex: Client a oublié son portefeuille..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Retour
              </button>
              <button
                id="btn-confirm-cancel-sale-action"
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
              >
                {isCancelling ? 'Annulation en cours...' : "Confirmer l'Annulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPRINT TICKET VIEW MODAL */}
      {viewingSale && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-black text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-400" />
                <span>Reçu de Caisse #{viewingSale.id.substring(viewingSale.id.length - 6).toUpperCase()}</span>
              </div>
              <button
                onClick={() => setViewingSale(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 font-mono text-xs text-slate-800 space-y-3 bg-slate-50/50">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-bold text-sm text-slate-900">BOUTIQUEPRO ALIMENTATION</div>
                <div>Ticket N° #{viewingSale.id.substring(viewingSale.id.length - 6).toUpperCase()}</div>
                <div>Date : {formatDate(viewingSale.created_at)}</div>
                <div>Caissier : {viewingSale.cashier_name}</div>
                {viewingSale.status === 'cancelled' && (
                  <div className="mt-1 px-2 py-0.5 bg-rose-100 text-rose-800 font-bold border border-rose-300 rounded">
                    *** TICKET ANNULÉ *** ({viewingSale.cancel_reason})
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
                {viewingSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-bold">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL :</span>
                  <span>{formatCurrency(viewingSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>MODE :</span>
                  <span className={viewingSale.payment_type === 'cash' ? 'text-emerald-700' : 'text-rose-700'}>
                    {viewingSale.payment_type.toUpperCase()}
                  </span>
                </div>
                {viewingSale.payment_type === 'credit' && (
                  <div className="flex justify-between text-xs text-rose-700 font-bold">
                    <span>CLIENT :</span>
                    <span>{viewingSale.client_name}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-400">
                Duplicata de reçu • BoutiquePro
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Reçu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
