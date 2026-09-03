import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  Banknote,
  Receipt,
  CheckCircle2,
  Lock,
  ArrowDownLeft,
  X,
  History,
  Phone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Client, Refund } from '../../types';
import { formatCurrency, formatDate, formatDateShort } from '../../lib/formatters';

export const CreditManagement: React.FC = () => {
  const { clients, sales, refunds, createClient, deleteClient, createRefund } = useApp();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // New Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundTargetClient, setRefundTargetClient] = useState<Client | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundNote, setRefundNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Total credit in circulation
  const totalCreditDebt = clients.reduce((sum, c) => sum + c.credit_balance, 0);
  const debtorClientsCount = clients.filter((c) => c.credit_balance > 0).length;

  const handleOpenRefund = (client: Client) => {
    setRefundTargetClient(client);
    setRefundAmount(client.credit_balance); // prefill with full balance
    setRefundNote('');
    setErrorMsg(null);
    setIsRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetClient || !refundAmount || Number(refundAmount) <= 0) {
      setErrorMsg('Veuillez saisir un montant de remboursement supérieur à 0.');
      return;
    }

    if (Number(refundAmount) > refundTargetClient.credit_balance) {
      setErrorMsg('Le montant du remboursement ne peut pas dépasser la dette totale du client.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRefund({
        client_id: refundTargetClient.id,
        amount: Number(refundAmount),
        note: refundNote.trim() || undefined,
      });
      setIsRefundModalOpen(false);
      // Update selected detail if viewing
      if (selectedClientDetail?.id === refundTargetClient.id) {
        setSelectedClientDetail((prev) =>
          prev ? { ...prev, credit_balance: Math.max(0, prev.credit_balance - Number(refundAmount)) } : null
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur remboursement';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    setIsSubmitting(true);
    try {
      await createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        notes: newClientNotes.trim() || undefined,
      });
      setIsClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientNotes('');
    } catch (err) {
      alert('Erreur lors de la création du client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (client.credit_balance > 0) {
      alert(
        `Impossible de supprimer le client "${client.name}" car il a encore une dette impayée de ${formatCurrency(
          client.credit_balance
        )}.`
      );
      return;
    }

    if (confirm(`Confirmez-vous la suppression de la fiche de "${client.name}" ?`)) {
      try {
        await deleteClient(client.id);
        if (selectedClientDetail?.id === client.id) {
          setSelectedClientDetail(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur suppression';
        alert(msg);
      }
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Top Bento Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-950 text-white rounded-3xl p-6 border border-rose-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Total Crédits en Cours
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-900/80 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-rose-300" />
            </div>
          </div>
          <div className="text-2xl font-black mt-3 text-white">
            {formatCurrency(totalCreditDebt)}
          </div>
          <div className="text-xs text-rose-200 mt-1 font-medium">
            Créances à recouvrer ({debtorClientsCount} clients concernés)
          </div>
        </div>

        <div className="bg-emerald-950 text-white rounded-3xl p-6 border border-emerald-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Remboursements Encaissés
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-900/80 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
          <div className="text-2xl font-black mt-3 text-white">
            {formatCurrency(refunds.reduce((sum, r) => sum + r.amount, 0))}
          </div>
          <div className="text-xs text-emerald-200 mt-1 font-medium">
            {refunds.length} opération(s) de remboursement
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Répertoire Clients
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-3">
            {clients.length} fiches
          </div>
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un nouveau client</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Client List (Left) & Client Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Clients Table Bento Box (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou téléphone..."
                className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <button
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Client & Contact</th>
                  <th className="py-3.5 px-4 text-right">Dette Actuelle</th>
                  <th className="py-3.5 px-4 text-right">Total Acheté</th>
                  <th className="py-3.5 px-4 text-right">Total Remboursé</th>
                  <th className="py-3.5 px-4 text-center">Action Encaissement</th>
                  <th className="py-3.5 px-5 text-right">Suppr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucun client trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const hasDebt = client.credit_balance > 0;
                    const isSelected = selectedClientDetail?.id === client.id;

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClientDetail(client)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 text-sm">{client.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            {client.phone ? (
                              <>
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{client.phone}</span>
                              </>
                            ) : (
                              <span>Pas de téléphone</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-full inline-block border ${
                              hasDebt
                                ? 'text-rose-800 bg-rose-50 border-rose-200'
                                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            {formatCurrency(client.credit_balance)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                          {formatCurrency(client.total_credit_purchased)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                          {formatCurrency(client.total_repaid)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {hasDebt ? (
                            <button
                              id={`btn-refund-${client.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRefund(client);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
                            >
                              Encaisser
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              À jour (0 FCFA)
                            </span>
                          )}
                        </td>

                        {/* RÈGLE STRICTE : BOUTON SUPPRESSION ACTIF UNIQUEMENT SI DETTE == 0 */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            id={`btn-delete-client-${client.id}`}
                            disabled={hasDebt}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client);
                            }}
                            title={
                              hasDebt
                                ? 'Suppression impossible : le client a une dette en cours'
                                : 'Supprimer la fiche client'
                            }
                            className={`p-2 rounded-xl transition ${
                              hasDebt
                                ? 'text-slate-300 cursor-not-allowed bg-slate-100'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {hasDebt ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Detail & Transaction History Bento Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-20">
          {selectedClientDetail ? (
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedClientDetail.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedClientDetail.phone || 'Aucun numéro'}</p>
                </div>
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border ${
                    selectedClientDetail.credit_balance > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  Dette : {formatCurrency(selectedClientDetail.credit_balance)}
                </span>
              </div>

              {/* Action Buttons */}
              {selectedClientDetail.credit_balance > 0 && (
                <button
                  onClick={() => handleOpenRefund(selectedClientDetail)}
                  className="mt-3.5 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Encaisser un Remboursement</span>
                </button>
              )}

              {/* History of Sales on Credit for this Client */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Historique des achats à crédit</span>
                </h4>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {sales
                    .filter((s) => s.client_id === selectedClientDetail.id || s.client_name === selectedClientDetail.name)
                    .map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{formatDateShort(s.created_at)}</span>
                          <span className="text-rose-700 font-extrabold">{formatCurrency(s.total_amount)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {s.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* History of Refunds for this Client */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Historique des remboursements</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {refunds
                    .filter((r) => r.client_id === selectedClientDetail.id)
                    .map((r) => (
                      <div key={r.id} className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs">
                        <div className="flex justify-between font-bold text-emerald-950">
                          <span>{formatDateShort(r.created_at)}</span>
                          <span className="font-black text-emerald-800">+{formatCurrency(r.amount)}</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">
                          Encaissé par {r.cashier_name} {r.note ? `• ${r.note}` : ''}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2.5">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="font-medium">Sélectionnez un client dans le tableau pour consulter son historique et ses remboursements.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL REMBOURSEMENT DE CRÉDIT */}
      {isRefundModalOpen && refundTargetClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-lg">Encaisser un Remboursement</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client : <strong className="text-white">{refundTargetClient.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Dette totale à payer :</span>
                  <span className="font-bold text-rose-700">{formatCurrency(refundTargetClient.credit_balance)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Reste dû après versement :</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(Math.max(0, refundTargetClient.credit_balance - (Number(refundAmount) || 0)))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant versé par le client (FCFA) *
                </label>
                <input
                  id="input-refund-amount"
                  type="number"
                  min="10"
                  max={refundTargetClient.credit_balance}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ex: 5000"
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Référence du paiement (optionnel)
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="ex: Espèces reçues en main propre"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  id="btn-confirm-refund"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? 'Validation...' : 'Valider le Remboursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION CLIENT */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-lg">Nouveau Client</h3>
                <p className="text-xs text-slate-400 mt-0.5">Créer une fiche client pour les crédits</p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom et Prénom du client *
                </label>
                <input
                  id="input-client-name"
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="ex: Seydou Keita"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="ex: +223 70 12 34 56"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Localisation (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="ex: Habite en face de la mosquée, client régulier"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-create-client"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? 'Création...' : 'Créer la fiche client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
