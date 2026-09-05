import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  DollarSign,
  Phone,
  MapPin,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Receipt,
  ArrowDownRight,
  TrendingDown,
  Layers,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Supplier, Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, formatDateShort } from '../../lib/formatters';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';

const EXPENSE_CATEGORIES: Array<{ key: ExpenseCategory; label: string }> = [
  { key: 'loyer', label: 'Loyer du local' },
  { key: 'electricite_eau', label: 'Électricité & Eau (CIE/SODECI)' },
  { key: 'transport', label: 'Transport & Carburant' },
  { key: 'salaires', label: 'Salaires & Rémunérations' },
  { key: 'maintenance', label: 'Maintenance & Réparations' },
  { key: 'fournitures', label: 'Fournitures & Emballages' },
  { key: 'autre', label: 'Autres charges diverses' },
];

export const SupplierManagement: React.FC = () => {
  const {
    suppliers,
    expenses,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createSupplierPayment,
    createExpense,
    deleteExpense,
  } = useApp();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'suppliers' | 'expenses'>('suppliers');
  const [search, setSearch] = useState('');

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierDebt, setSupplierDebt] = useState<number | ''>('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Supplier Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'other'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Expense Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('electricite_eau');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'cash' | 'mobile_money'>('cash');

  // Deletion states
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.phone && s.phone.includes(search)) ||
        (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
    );
  }, [suppliers, search]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category_label.toLowerCase().includes(search.toLowerCase()) ||
        e.author_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, search]);

  // Aggregate KPI metrics
  const totalSupplierDebts = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.debt_balance || 0), 0);
  }, [suppliers]);

  const totalExpensesThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Handlers for Supplier
  const handleOpenSupplierCreate = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierAddress('');
    setSupplierDebt('');
    setSupplierNotes('');
    setErrorMsg(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenSupplierEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierName(sup.name);
    setSupplierPhone(sup.phone || '');
    setSupplierAddress(sup.address || '');
    setSupplierDebt(sup.debt_balance);
    setSupplierNotes(sup.notes || '');
    setErrorMsg(null);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setErrorMsg('Le nom du fournisseur est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: supplierName.trim(),
          phone: supplierPhone.trim() || undefined,
          address: supplierAddress.trim() || undefined,
          debt_balance: Number(supplierDebt) || 0,
          notes: supplierNotes.trim() || undefined,
        });
      } else {
        await createSupplier({
          name: supplierName.trim(),
          phone: supplierPhone.trim() || undefined,
          address: supplierAddress.trim() || undefined,
          debt_balance: Number(supplierDebt) || 0,
          total_purchased: Number(supplierDebt) || 0,
          notes: supplierNotes.trim() || undefined,
        });
      }
      setIsSupplierModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = (sup: Supplier) => {
    if (sup.debt_balance > 0) {
      alert(`Dette en cours (${formatCurrency(sup.debt_balance)}). Réglez la dette avant suppression.`);
      return;
    }
    setSupplierToDelete(sup);
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setIsDeletingSupplier(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeletingSupplier(false);
    }
  };

  // Handlers for Supplier Payment
  const handleOpenPayment = (sup: Supplier) => {
    setSelectedSupplierForPayment(sup);
    setPaymentAmount(sup.debt_balance > 0 ? sup.debt_balance : '');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setErrorMsg(null);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment) return;
    const num = Number(paymentAmount);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Montant invalide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createSupplierPayment({
        supplier_id: selectedSupplierForPayment.id,
        amount: num,
        payment_method: paymentMethod,
        notes: paymentNotes.trim() || undefined,
      });
      setIsPaymentModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur de règlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Expense
  const handleOpenExpenseCreate = () => {
    setExpenseCategory('electricite_eau');
    setExpenseAmount('');
    setExpenseDescription('');
    setExpensePaymentMethod('cash');
    setErrorMsg(null);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(expenseAmount);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Montant de la dépense invalide.');
      return;
    }
    if (!expenseDescription.trim()) {
      setErrorMsg('La description ou justification est obligatoire.');
      return;
    }

    const catObj = EXPENSE_CATEGORIES.find((c) => c.key === expenseCategory);

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createExpense({
        category: expenseCategory,
        category_label: catObj?.label || 'Dépense diverse',
        amount: num,
        description: expenseDescription.trim(),
        payment_method: expensePaymentMethod,
      });
      setIsExpenseModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de la dépense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (exp: Expense) => {
    setExpenseToDelete(exp);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2 border border-teal-500/30">
            <Truck className="w-3.5 h-3.5" />
            <span>Approvisionnement & Charges</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Fournisseurs & Dépenses d'Exploitation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des dettes fournisseurs, historique des règlements et catégorisation des charges d'exploitation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'suppliers' ? (
            <button
              id="btn-add-supplier"
              onClick={handleOpenSupplierCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Fournisseur</span>
            </button>
          ) : (
            <button
              id="btn-add-expense"
              onClick={handleOpenExpenseCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer Dépense</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fournisseurs</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{suppliers.length}</div>
            <div className="text-[10px] text-slate-500">Partenaires actifs</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dettes Fournisseurs</div>
            <div className="text-2xl font-black text-amber-950 mt-0.5">{formatCurrency(totalSupplierDebts)}</div>
            <div className="text-[10px] text-amber-700 font-medium">À régler prochainement</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dépenses ce Mois</div>
            <div className="text-2xl font-black text-rose-950 mt-0.5">{formatCurrency(totalExpensesThisMonth)}</div>
            <div className="text-[10px] text-slate-500">{expenses.length} dépenses au total</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Règlements Effectués</div>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">
              {formatCurrency(suppliers.reduce((acc, s) => acc + (s.total_paid || 0), 0))}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium">Cumul paiements fournisseurs</div>
          </div>
        </div>
      </div>

      {/* Sub tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl border border-slate-300/60 w-fit">
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fournisseurs ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dépenses d'Exploitation ({expenses.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeSubTab === 'suppliers'
                ? 'Rechercher un fournisseur, téléphone...'
                : 'Rechercher une dépense, libellé...'
            }
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>
      </div>

      {/* Tab 1: SUPPLIERS TABLE */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Fournisseur</th>
                  <th className="py-3.5 px-4">Contact & Adresse</th>
                  <th className="py-3.5 px-4 text-right">Total Facturé</th>
                  <th className="py-3.5 px-4 text-right">Total Réglé</th>
                  <th className="py-3.5 px-4 text-center">Dette En Cours</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucun fournisseur enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-slate-900 text-sm">{sup.name}</div>
                        {sup.notes && <div className="text-[10px] text-slate-400">{sup.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{sup.phone || 'Non renseigné'}</span>
                        </div>
                        {sup.address && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-300" />
                            <span>{sup.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(sup.total_purchased || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                        {formatCurrency(sup.total_paid || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sup.debt_balance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatCurrency(sup.debt_balance)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>À jour (0 FCFA)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sup.debt_balance > 0 && (
                            <button
                              onClick={() => handleOpenPayment(sup)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1 transition"
                              title="Payer la dette"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Régler</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenSupplierEdit(sup)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: EXPENSES TABLE */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date & Heure</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Description / Motif</th>
                  <th className="py-3.5 px-4 text-center">Mode Paiement</th>
                  <th className="py-3.5 px-4 text-right">Montant Décaissé</th>
                  <th className="py-3.5 px-4">Auteur</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aucune dépense enregistrée.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category_label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{exp.description}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            exp.payment_method === 'cash'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {exp.payment_method === 'cash' ? 'Caisse (Espèces)' : 'Mobile Money'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-700 text-sm">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{exp.author_name}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Supprimer la dépense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg">
                  {editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Renseignez les coordonnées et dettes initiales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de l'entreprise ou du fournisseur *
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ex: Distributeur Nestlé / Brasserie Solibra"
                  required
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone / WhatsApp</label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="+225 07 00 00 00"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dette initiale (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={supplierDebt}
                    onChange={(e) => setSupplierDebt(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse / Dépôt</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="Zone Industrielle Yopougon, Abidjan"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Modalités de livraison</label>
                <textarea
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="Livraison le mardi matin, paiement à 30 jours..."
                  rows={2}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAY SUPPLIER DEBT */}
      {isPaymentModalOpen && selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white">
              <h3 className="font-extrabold text-lg">Règlement Dette Fournisseur</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedSupplierForPayment.name} • Dette en cours :{' '}
                <span className="text-amber-300 font-bold">
                  {formatCurrency(selectedSupplierForPayment.debt_balance)}
                </span>
              </p>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant à régler (FCFA) *</label>
                <input
                  type="number"
                  min="100"
                  max={selectedSupplierForPayment.debt_balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 50000"
                  required
                  className="w-full px-4 py-3 text-base font-black bg-slate-50 border border-slate-200 rounded-2xl text-emerald-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Moyen de règlement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'cash', label: 'Espèces (Caisse)' },
                    { key: 'mobile_money', label: 'Wave / MoMo' },
                    { key: 'other', label: 'Virement / Chèque' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key as 'cash' | 'mobile_money' | 'other')}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold text-center transition ${
                        paymentMethod === m.key
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Référence / Notes de paiement</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: N° reçu #4092, remise en main propre..."
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Validation...' : 'Valider le Règlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white">
              <h3 className="font-extrabold text-lg">Enregistrer une Dépense d'Exploitation</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Charges du local, factures d'énergie, salaires ou frais de transport.
              </p>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie de charge *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-semibold focus:ring-2 focus:ring-rose-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant de la dépense (FCFA) *</label>
                <input
                  type="number"
                  min="100"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ex: 15000"
                  required
                  className="w-full px-4 py-3 text-base font-black bg-slate-50 border border-slate-200 rounded-2xl text-rose-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source des fonds</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpensePaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      expensePaymentMethod === 'cash'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Déduire de la Caisse (Espèces)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpensePaymentMethod('mobile_money')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      expensePaymentMethod === 'mobile_money'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Mobile Money / Autre
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justification / Détail de la dépense *
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Ex: Facture CIE mois d'Août, réapprovisionnement sacs plastiques..."
                  required
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL - FOURNISSEUR */}
      <ConfirmDeleteModal
        isOpen={!!supplierToDelete}
        title="Supprimer le fournisseur"
        itemTitle={supplierToDelete?.name || ''}
        itemSubtitle={supplierToDelete?.phone ? `Téléphone : ${supplierToDelete.phone}` : undefined}
        message="Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeletingSupplier}
        onConfirm={handleConfirmDeleteSupplier}
        onCancel={() => setSupplierToDelete(null)}
      />

      {/* CONFIRM DELETE MODAL - DÉPENSE */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title="Supprimer la dépense"
        itemTitle={expenseToDelete ? `${expenseToDelete.category_label} : ${formatCurrency(expenseToDelete.amount)}` : ''}
        itemSubtitle={expenseToDelete?.description ? `Détails : ${expenseToDelete.description}` : undefined}
        message="Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={isDeletingExpense}
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
