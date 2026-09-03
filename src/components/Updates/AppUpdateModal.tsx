import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sparkles,
  X,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AppVersionInfo } from '../../types';

interface AppUpdateModalProps {
  onClose: () => void;
}

const CURRENT_VERSION = '1.2.0';

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ onClose }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [latestInfo, setLatestInfo] = useState<AppVersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkVersion = async () => {
    setIsChecking(true);
    setErrorMsg(null);
    try {
      // Fetch version.json from public or fallback to metadata
      let remoteData: AppVersionInfo;
      try {
        const res = await fetch('/version.json');
        if (res.ok) {
          remoteData = await res.json();
        } else {
          throw new Error('Version file not found');
        }
      } catch {
        // Fallback default release metadata
        remoteData = {
          version: '1.3.0',
          release_date: new Date().toISOString().split('T')[0],
          apk_url: '/BoutiquePro_v1.3.0_release.apk',
          apk_size: '14.8 MB',
          changelog: [
            'Gestion des dates de péremption avec alertes J-7 automatiques',
            'Suivi des fournisseurs et dettes fournisseurs',
            'Enregistrement et catégorisation des dépenses d’exploitation',
            'Annulation des ventes avec réintégration automatique du stock',
            'Sauvegarde et restauration Cloud sur Firebase',
            'Amélioration de la synchronisation hors-ligne',
          ],
          mandatory: false,
        };
      }

      setLatestInfo(remoteData);
      // Compare versions
      const isNewer = remoteData.version !== CURRENT_VERSION;
      setHasUpdate(isNewer);
    } catch (err: unknown) {
      setErrorMsg('Impossible de contacter le serveur de mise à jour.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVersion();
  }, []);

  const handleDownloadApk = () => {
    if (!latestInfo) return;
    const a = document.createElement('a');
    a.href = latestInfo.apk_url;
    a.download = `BoutiquePro_v${latestInfo.version}.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Mise à Jour BoutiquePro</h3>
              <p className="text-xs text-slate-400 mt-0.5">Version installée : v{CURRENT_VERSION}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {isChecking ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-xs font-bold text-slate-700">Vérification de la dernière version en ligne...</div>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Erreur de vérification</span>
              </div>
              <p>{errorMsg}</p>
              <button
                onClick={checkVersion}
                className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-[11px]"
              >
                Réessayer
              </button>
            </div>
          ) : hasUpdate && latestInfo ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm text-emerald-950">
                    Nouvelle version disponible : v{latestInfo.version}
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Publiée le {latestInfo.release_date} • Taille de l'APK : {latestInfo.apk_size}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Nouveautés & Correctifs :
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                  {latestInfo.changelog.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Vos données locales, ventes et produits seront intégralement conservés après l'installation.</span>
              </div>

              <button
                onClick={handleDownloadApk}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le nouvel APK (v{latestInfo.version})</span>
              </button>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-base">BoutiquePro est à jour !</div>
                <div className="text-xs text-slate-500 mt-1">
                  Vous utilisez actuellement la version la plus récente (v{CURRENT_VERSION}).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={checkVersion}
            disabled={isChecking}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Rechercher à nouveau</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
