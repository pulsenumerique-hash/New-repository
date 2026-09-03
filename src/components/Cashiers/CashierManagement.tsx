import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  Mail,
  User,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User as UserType } from '../../types';
import { formatDate } from '../../lib/formatters';

export const CashierManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [cashiers, setCashiers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCashiers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCashiers();
      setCashiers(res.cashiers);
    } catch (err) {
      console.error('Error fetching cashiers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setErrorMsg('Tous les champs sont obligatoires.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCashier({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      setIsModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      fetchCashiers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur création caissier';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cashier: UserType) => {
    try {
      await api.toggleCashierStatus(cashier.id, !cashier.is_active);
      setCashiers((prev) =>
        prev.map((c) => (c.id === cashier.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      alert('Erreur modification statut');
    }
  };

  const handleDeleteCashier = async (cashier: UserType) => {
    if (confirm(`Confirmez-vous la suppression du compte de ${cashier.first_name} ${cashier.last_name} ?`)) {
      try {
        await api.deleteCashier(cashier.id);
        setCashiers((prev) => prev.filter((c) => c.id !== cashier.id));
      } catch (err) {
        alert('Erreur suppression caissier');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <span>Gestion des Comptes Caissiers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Créez et administrez les accès de vos employés. Les caissiers ont accès à la caisse et aux ventes sans pouvoir modifier les bilans.
          </p>
        </div>

        <button
          id="btn-add-cashier"
          onClick={() => {
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Caissier</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Caissier</th>
                <th className="py-3.5 px-4">Identifiant / E-mail</th>
                <th className="py-3.5 px-4">Rôle</th>
                <th className="py-3.5 px-4">Statut d'Accès</th>
                <th className="py-3.5 px-4">Date de Création</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashiers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Aucun caissier enregistré pour votre boutique.
                  </td>
                </tr>
              ) : (
                cashiers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {c.first_name} {c.last_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {c.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                        Caissier
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition border ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {c.is_active ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-rose-600" />}
                        <span>{c.is_active ? 'Actif' : 'Désactivé'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDeleteCashier(c)}
                        title="Supprimer"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRÉATION CAISSIER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-black text-lg">Nouveau Compte Caissier</h3>
                <p className="text-xs text-slate-400 mt-0.5">Accès caisse & ventes pour un employé</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Moussa"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Coulibaly"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identifiant / E-mail de connexion *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="moussa@boutiquepro.com"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe provisoire *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 caractères"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-create-cashier"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? 'Création...' : 'Créer le Caissier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
