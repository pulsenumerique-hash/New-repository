import React, { useState } from 'react';
import { Smartphone, Download, Sparkles, X, CheckCircle2, QrCode } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

interface AndroidInstallBannerProps {
  onOpenModal: () => void;
}

export const AndroidInstallBanner: React.FC<AndroidInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleDirectInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  // If already installed as standalone app, show subtle status badge
  if (isInstalled) {
    return (
      <div className="bg-slate-900/90 text-emerald-400 px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Application Android BoutiquePro installée (Mode Plein Écran Actif)</span>
        </div>
        {!isOnline && (
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
            Hors-ligne (Stockage local actif)
          </span>
        )}
      </div>
    );
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white px-4 py-2.5 border-b border-teal-500/30 shadow-xs flex flex-wrap items-center justify-between gap-3 relative z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <div className="font-extrabold text-xs flex items-center gap-2">
            <span>Application Dédiée Téléphone Android</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> PWA Sans APK
            </span>
          </div>
          <p className="text-[11px] text-slate-300 hidden sm:block">
            Installez BoutiquePro sur votre écran d'accueil Android en 1 clic (aucun mode développeur ni câble requis).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isInstallable && (
          <button
            id="btn-banner-direct-install"
            onClick={handleDirectInstall}
            disabled={installing}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? 'Installation...' : 'Installer maintenant'}</span>
          </button>
        )}

        <button
          id="btn-banner-open-guide-modal"
          onClick={onOpenModal}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Guide d'installation Android</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
          title="Fermer la bannière"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
