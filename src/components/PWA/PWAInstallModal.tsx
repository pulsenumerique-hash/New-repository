import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Copy, Check, X, Sparkles, QrCode, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Installer sur Téléphone Android</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                PWA certifiée & compatible tous smartphones Android
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

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quick 1-click Install Trigger if available */}
          {isInstallable && (
            <div className="p-4 bg-gradient-to-r from-teal-900 to-indigo-950 rounded-2xl text-white shadow-md flex items-center justify-between gap-3">
              <div>
                <div className="font-black text-sm flex items-center gap-1.5 text-teal-300">
                  <Sparkles className="w-4 h-4" />
                  Prêt pour installation directe !
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Appuyez pour ajouter l'icône sur votre écran d'accueil.
                </div>
              </div>
              <button
                id="btn-pwa-direct-install"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                {isInstalling ? 'Installation...' : 'Installer'}
              </button>
            </div>
          )}

          {/* QR Code Card for Scanning with Android Smartphone */}
          <div className="p-5 bg-slate-50 border border-slate-200/90 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
              <QRCodeSVG
                value={currentUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="font-extrabold text-slate-900 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Scannez avec votre Android
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Ouvrez l'appareil photo de votre téléphone Android pour charger directement BoutiquePro, puis confirmez l'installation.
              </p>
              <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
            <div className="font-extrabold text-teal-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Avantages natifs sur Android :</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-teal-950 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Icône BoutiquePro directe sur votre écran d'accueil</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Affichage plein écran 100% natif (sans barre de navigation)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mode hors-ligne persistant lors des coupures de réseau</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Synchronisation automatique dès reconnexion Internet</span>
              </li>
            </ul>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Procédure manuelle dans Google Chrome Android :
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                  1
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">Ouvrez le lien dans Google Chrome</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Accédez à l'URL de votre boutique sur votre smartphone.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                  2
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">Appuyez sur le menu (3 points verticaux ⋮)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                  3
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">Confirmez l'installation</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    L'icône <strong>BoutiquePro</strong> est instantanément créée sur votre téléphone.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
