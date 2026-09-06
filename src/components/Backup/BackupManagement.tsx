import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Cloud,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  History,
  ShieldCheck,
  FileCode,
  Lock,
  Save,
  Store,
  FileText,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ResetAppModal } from '../Common/ResetAppModal';
import { firebaseDb } from '../../services/firebaseDb';

/**
 * Fonction utilitaire de purge intégrale de toutes les collections Firestore de la boutique.
 * Itère sur l'ensemble des collections Firestore :
 * - produits (products)
 * - achats & fournisseurs (suppliers, supplier_payments)
 * - ventes & tickets de caisse (sales)
 * - caisse & mouvements (cash_movements, cash_closings)
 * - charges & dépenses (expenses)
 * - clients & comptes crédits (clients, refunds)
 * - journaux d'audit & logs (audit_logs)
 * - sauvegardes (backups)
 * - sessions (active_sessions)
 * - solde de caisse actuel (remise à 0 du capital initial dans boutiques/{id})
 * 
 * Garantit un état 'zéro' absolu pour toutes les données métier.
 */
export async function purgeAllFirestoreCollections(
  boutiqueId: string,
  onProgress?: (collectionName: string, count: number, currentStep: number, totalSteps: number) => void
): Promise<{ totalDeleted: number; collectionCounts: Record<string, number> }> {
  return firebaseDb.resetAllBusinessData(boutiqueId, onProgress);
}

export const BackupManagement: React.FC = () => {
  const {
    boutique,
    exportDataJson,
    importDataJson,
    saveCloudBackup,
    getCloudBackups,
    restoreCloudBackup,
    resetAllBusinessData,
    updateBoutiqueSettings,
    lockPin,
    setLockPin,
  } = useApp();
  const { user } = useAuth();

  const [cloudBackups, setCloudBackups] = useState<
    Array<{
      id: string;
      title: string;
      item_count: number;
      created_by: string;
      created_at: string;
      data_json: string;
    }>
  >([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Boutique settings form
  const [boutiqueName, setBoutiqueName] = useState(boutique?.name || '');
  const [boutiquePhone, setBoutiquePhone] = useState(boutique?.phone || '');
  const [boutiqueAddress, setBoutiqueAddress] = useState(boutique?.address || '');
  const [newPin, setNewPin] = useState(lockPin || '1234');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchCloudBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await getCloudBackups();
      setCloudBackups(list);
    } catch {
      console.warn('Could not fetch cloud backups');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchCloudBackups();
  }, []);

  // 1. Export local JSON
  const handleExportLocal = () => {
    try {
      const jsonStr = exportDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `boutiquepro-backup-${boutique?.name || 'store'}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Sauvegarde locale téléchargée avec succès (format JSON).' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: 'Erreur lors de l’export local.' });
    }
  };

  // 2. Import local JSON
  const handleImportLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      if (
        confirm(
          'Attention : La restauration remplacera ou fusionnera les données locales actuelles. Souhaitez-vous continuer ?'
        )
      ) {
        try {
          const res = await importDataJson(content);
          if (res.success) {
            setFeedback({
              type: 'success',
              message: `Restauration réussie ! Produits: ${res.counts.products || 0}, Ventes: ${res.counts.sales || 0}, Clients: ${res.counts.clients || 0}`,
            });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } catch (err: unknown) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Fichier de sauvegarde invalide.',
          });
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  // 3. Create Cloud Backup
  const handleCreateCloudBackup = async () => {
    setIsSavingCloud(true);
    setFeedback(null);
    try {
      await saveCloudBackup();
      setFeedback({ type: 'success', message: 'Sauvegarde Cloud créée avec succès sur Firebase !' });
      await fetchCloudBackups();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde Cloud.',
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  // 4. Restore Cloud Backup
  const handleRestoreCloud = async (backupId: string, title: string) => {
    if (confirm(`Voulez-vous vraiment restaurer la sauvegarde "${title}" ? Vos données locales seront mises à jour.`)) {
      try {
        await restoreCloudBackup(backupId);
        setFeedback({ type: 'success', message: `Sauvegarde Cloud "${title}" restaurée avec succès !` });
      } catch (err: unknown) {
        setFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Erreur lors de la restauration.',
        });
      }
    }
  };

  // 5. Save Boutique Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateBoutiqueSettings({
        name: boutiqueName.trim(),
        phone: boutiquePhone.trim() || undefined,
        address: boutiqueAddress.trim() || undefined,
      });
      if (newPin.trim().length >= 4) {
        setLockPin(newPin.trim());
      }
      setFeedback({ type: 'success', message: 'Paramètres de la boutique mis à jour avec succès !' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: 'Erreur lors de la mise à jour des paramètres.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Database className="w-3.5 h-3.5" />
            <span>Sécurité & Résilience</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Sauvegarde & Restauration des Données</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export/Import local JSON, sauvegardes Cloud automatiques sur Firebase et protection par code PIN.
          </p>
        </div>

        <button
          onClick={handleCreateCloudBackup}
          disabled={isSavingCloud}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
        >
          {isSavingCloud ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
          <span>{isSavingCloud ? 'Sauvegarde en cours...' : 'Créer Sauvegarde Cloud'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: Local Backup vs Cloud Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Export / Import Local */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Sauvegarde Locale (Fichier JSON)</h3>
              <p className="text-[11px] text-slate-500">Pour archiver sur clé USB ou transférer sur un autre appareil.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800">Contenu inclus dans l'archive :</div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Catalogue complet des produits, stocks et prix</li>
              <li>Historique de toutes les ventes et caissiers</li>
              <li>Dettes clients et remboursements</li>
              <li>Fournisseurs et dépenses d'exploitation</li>
              <li>Journal d'audit de sécurité</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleExportLocal}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger JSON</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition active:scale-95">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Restaurer JSON</span>
              <input type="file" accept=".json" onChange={handleImportLocal} className="hidden" />
            </label>
          </div>
        </div>

        {/* 2. Cloud Backup on Firestore */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Sauvegarde Cloud (Firebase)</h3>
              <p className="text-[11px] text-slate-500">Stockage distant redondant et chiffré sur Google Cloud.</p>
            </div>
          </div>

          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-teal-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Protection automatique & Restauration 1-Clic</span>
            </div>
            <p className="text-[11px] text-slate-600">
              En cas de perte ou panne de téléphone, vous pouvez vous reconnecter sur n'importe quel autre appareil et
              restaurer l'intégralité de votre boutique en quelques secondes.
            </p>
          </div>

          <button
            onClick={handleCreateCloudBackup}
            disabled={isSavingCloud}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {isSavingCloud ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{isSavingCloud ? 'Sauvegarde Cloud en cours...' : 'Créer un Point de Restauration Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Backups History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-slate-900">Historique des Sauvegardes Cloud</h3>
          </div>
          <button
            onClick={fetchCloudBackups}
            disabled={isLoadingBackups}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {cloudBackups.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Cloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Aucune sauvegarde Cloud enregistrée pour cette boutique. Cliquez sur "Créer Sauvegarde Cloud" pour en créer une.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cloudBackups.map((b) => (
              <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">{b.title}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Créée par {b.created_by} • {b.item_count} éléments enregistrés • {formatDate(b.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => handleRestoreCloud(b.id, b.title)}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutique Configuration & Security PIN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Informations de la Boutique & Sécurité PIN</h3>
            <p className="text-[11px] text-slate-500">Coordonnées affichées sur les tickets et code de verrouillage rapide.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la boutique</label>
              <input
                type="text"
                value={boutiqueName}
                onChange={(e) => setBoutiqueName(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de contact (Tickets)</label>
              <input
                type="text"
                value={boutiquePhone}
                onChange={(e) => setBoutiquePhone(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse physique / Commune</label>
              <input
                type="text"
                value={boutiqueAddress}
                onChange={(e) => setBoutiqueAddress(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Code PIN de verrouillage (4 chiffres)</label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-4 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ZONE DE DANGER : RÉINITIALISATION COMPLÈTE & ÉTAT ZÉRO TOTAL */}
      <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 shadow-sm overflow-hidden relative space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <span>Réinitialisation intégrale & État 'Zéro' Total</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Zone sensible
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Itère sur toutes les collections Firestore (produits, achats, ventes, caisse, logs, solde de caisse actuel etc.) pour les supprimer réellement et garantir un état 'zéro' total. Vos accès administrateurs et paramètres généraux de la boutique restent protégés.
              </p>
            </div>
          </div>

          <button
            id="btn-open-reset-app-modal"
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser totalement l'application</span>
          </button>
        </div>

        {/* Badges de contrôle de l'état zéro */}
        <div className="pt-2 border-t border-rose-100 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px] font-bold text-slate-600">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>📦 Produits</span>
            <span className="text-rose-600 font-mono">0</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>🚚 Achats</span>
            <span className="text-rose-600 font-mono">0</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>🧾 Ventes</span>
            <span className="text-rose-600 font-mono">0</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>💰 Caisse</span>
            <span className="text-rose-600 font-mono">0</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>💵 Solde</span>
            <span className="text-rose-600 font-mono">0 FCFA</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span>📋 Logs</span>
            <span className="text-rose-600 font-mono">0</span>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMATION DE RÉINITIALISATION */}
      <ResetAppModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={resetAllBusinessData}
        boutiqueName={boutique?.name}
      />
    </div>
  );
};
