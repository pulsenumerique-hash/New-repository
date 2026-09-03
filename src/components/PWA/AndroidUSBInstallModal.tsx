import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Usb,
  Download,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  QrCode,
  Terminal,
  Zap,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AndroidUSBInstallModalProps {
  onClose: () => void;
}

export const AndroidUSBInstallModal: React.FC<AndroidUSBInstallModalProps> = ({ onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'usb' | 'direct' | 'qrcode'>('usb');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [usbStatus, setUsbStatus] = useState<'idle' | 'checking' | 'connected' | 'unsupported' | 'error'>('idle');
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const adbCommand = 'adb install -r android/app/build/outputs/apk/debug/app-debug.apk';
  const npmCommand = 'npm run cap:install:usb';

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2500);
    }
  };

  // WebUSB Detection
  const handleDetectUSB = async () => {
    if (!('usb' in navigator)) {
      setUsbStatus('unsupported');
      return;
    }

    setUsbStatus('checking');
    try {
      // Prompt user to select USB device
      const device = await (navigator as any).usb.requestDevice({
        filters: [], // Shows all USB devices to allow picking the connected phone
      });

      if (device) {
        setUsbStatus('connected');
        setConnectedDeviceName(
          device.productName || device.manufacturerName || `Périphérique USB (Vendor ID: ${device.vendorId})`
        );
      } else {
        setUsbStatus('idle');
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setUsbStatus('idle');
      } else {
        setUsbStatus('error');
      }
    }
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="android-usb-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Installation sur Téléphone Android
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Android Uniquement
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Application mobile native tactile, fonctionnement hors-ligne & synchronisation Cloud
              </p>
            </div>
          </div>
          <button
            id="btn-close-usb-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs between USB cable, Direct install, and QR Code */}
        <div className="flex p-2 bg-slate-950 border-b border-slate-800 gap-1.5 overflow-x-auto">
          <button
            id="tab-usb-install"
            onClick={() => setActiveTab('usb')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'usb'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>Installation par Câble USB (Ordinateur → Téléphone)</span>
          </button>

          <button
            id="tab-qrcode-install"
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scanner QR Code (Direct Mobile)</span>
          </button>

          {isInstallable && (
            <button
              id="tab-direct-install"
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Installation 1-Clic</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* TAB 1: INSTALLATION PAR CABLE USB */}
          {activeTab === 'usb' && (
            <div className="space-y-4">
              {/* USB Test & Detection Helper Banner */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      usbStatus === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>Câble USB & Détection du Téléphone</span>
                      {usbStatus === 'connected' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/40 font-bold">
                          Connecté
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {usbStatus === 'connected' && connectedDeviceName
                        ? `Appareil détecté : ${connectedDeviceName}`
                        : 'Branchez votre câble USB entre votre ordinateur et votre smartphone Android.'}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-detect-usb-device"
                  onClick={handleDetectUSB}
                  disabled={usbStatus === 'checking'}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usbStatus === 'checking' ? 'animate-spin' : ''}`} />
                  <span>Tester connexion USB</span>
                </button>
              </div>

              {/* Step by step process */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span>Procédure pas-à-pas (Câble USB) :</span>
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Step 1 */}
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      1
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">
                        Sur le Téléphone Android : Activer le Débogage USB
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Allez dans <strong>Paramètres</strong> → <strong>À propos du téléphone</strong> → Tapez{' '}
                        <strong>7 fois sur "Numéro de build"</strong>. Puis activez{' '}
                        <strong>Options pour les développeurs</strong> → <strong>Débogage USB</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      2
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">
                        Brancher le Cordon USB sur l'Ordinateur
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Une invite s'affiche sur le téléphone : cochez{' '}
                        <strong>« Toujours autoriser depuis cet ordinateur »</strong> et cliquez sur{' '}
                        <strong>Autoriser</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="font-extrabold text-white text-xs">
                        Lancer l'installation sur le Téléphone
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Exécutez la commande d'installation directe dans le terminal :
                      </div>

                      {/* Code Block ADB */}
                      <div className="mt-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 flex items-center justify-between gap-2">
                        <span className="truncate">{npmCommand}</span>
                        <button
                          id="btn-copy-npm-cmd"
                          onClick={() => copyToClipboard(npmCommand, 'npm')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          {copiedCmd === 'npm' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedCmd === 'npm' ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>

                      <div className="mt-1.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 flex items-center justify-between gap-2">
                        <span className="truncate">{adbCommand}</span>
                        <button
                          id="btn-copy-adb-cmd"
                          onClick={() => copyToClipboard(adbCommand, 'adb')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          {copiedCmd === 'adb' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedCmd === 'adb' ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      4
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">
                        Débrancher le Cordon USB & Utiliser l'Application
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        L'icône <strong>BoutiquePro</strong> est maintenant installée sur votre écran d'accueil. Vous
                        pouvez débrancher le cordon USB et désactiver le mode développeur : l'application fonctionne de
                        manière 100% autonome avec le Cloud Firebase.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-center gap-3 text-[11px] text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Zéro perte de données</strong> : Toutes vos ventes, produits et crédits clients restent
                  synchronisés en temps réel avec votre base de données sécurisée.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE SCAN */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
                  <QRCodeSVG
                    value={currentUrl}
                    size={140}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <div className="font-extrabold text-white text-sm flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>Scannez avec l'appareil photo du smartphone</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Ouvrez l'appareil photo de votre téléphone Android pour charger directement l'application, puis
                    cliquez sur "Installer" ou "Ajouter à l'écran d'accueil".
                  </p>
                  <div className="pt-1 flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      id="btn-copy-app-link"
                      onClick={() => copyToClipboard(currentUrl, 'link')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCmd === 'link' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{copiedCmd === 'link' ? 'Lien copié !' : 'Copier le lien direct'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT INSTALL */}
          {activeTab === 'direct' && isInstallable && (
            <div className="p-5 bg-gradient-to-br from-teal-950 to-indigo-950 rounded-2xl border border-teal-800/60 space-y-3 text-center sm:text-left">
              <div className="font-black text-sm text-teal-300 flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span>Installation Directe disponible</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Votre navigateur supporte l'installation immédiate sur cet appareil. Cliquez sur le bouton ci-dessous
                pour créer l'icône sur votre écran d'accueil.
              </p>
              <div className="pt-2">
                <button
                  id="btn-confirm-direct-install"
                  onClick={handleDirectInstall}
                  disabled={isInstalling}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Installation en cours...' : "Installer maintenant sur l'appareil"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span className="text-[11px]">BoutiquePro Android • Version 1.0.0</span>
          </div>
          <button
            id="btn-close-footer-modal"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
