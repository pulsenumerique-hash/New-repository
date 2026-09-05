import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  QrCode,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Usb,
  Monitor,
  Info,
  Share2,
  Lock,
  Globe,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AndroidUSBInstallModalProps {
  onClose: () => void;
}

export const AndroidUSBInstallModal: React.FC<AndroidUSBInstallModalProps> = ({ onClose }) => {
  const { isInstallable, isAndroid, isInIframe, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'qrcode' | 'direct' | 'developer'>('qrcode');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Detect Current & Public Share URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isAisDev = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');

  // Derive public preview URL by transforming ais-dev- to ais-pre-
  const publicShareUrl = isAisDev
    ? currentUrl.replace('ais-dev-', 'ais-pre-')
    : currentUrl;

  const [urlMode, setUrlMode] = useState<'public' | 'dev'>(isAisDev ? 'public' : 'dev');
  const activeQrUrl = urlMode === 'public' ? publicShareUrl : currentUrl;

  const handleCopyLink = (textToCopy: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
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

  const handleOpenInNewTab = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      id="android-install-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-teal-500/20 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Connexion & Installation sur Téléphone Android
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Accès Mobile
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ouvrez BoutiquePro sur votre smartphone Android sans blocage de sécurité
              </p>
            </div>
          </div>
          <button
            id="btn-close-android-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Essential Problem Solver Banner */}
        <div className="px-5 sm:px-6 py-3 bg-amber-500/10 border-b border-amber-500/25 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-bold">Pourquoi votre téléphone n'arrive pas à accéder à l'application ?</strong>
            <br />
            L'adresse interne (<code>ais-dev-...</code>) est protégée par Google. Pour que votre téléphone puisse s'y connecter, vous devez cliquer sur le bouton <strong>« Share » (Partager)</strong> en haut à droite d'AI Studio pour activer le <strong>Lien Public Partagé</strong> (ci-dessous).
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-slate-950 border-b border-slate-800 gap-1.5 overflow-x-auto">
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
            <span>Accéder depuis mon téléphone (QR Code)</span>
          </button>

          <button
            id="tab-direct-install"
            onClick={() => setActiveTab('direct')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Installer l'application (Chrome Android)</span>
          </button>

          <button
            id="tab-developer-install"
            onClick={() => setActiveTab('developer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'developer'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>Mode Développeur (Inutile)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* TAB 1: QR CODE & PUBLIC SHARE URL */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4">
              {/* URL Switcher between Public Shared URL and Dev URL */}
              {isAisDev && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white text-xs">Lien à scanner : </span>
                      <span className="text-[11px] text-slate-400">
                        {urlMode === 'public' ? 'Lien Public Partagé (Accessible à tous les smartphones)' : 'Lien Dev Privé (Compte Google requis)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setUrlMode('public')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        urlMode === 'public'
                          ? 'bg-teal-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lien Public (Recommandé)
                    </button>
                    <button
                      onClick={() => setUrlMode('dev')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        urlMode === 'dev'
                          ? 'bg-teal-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lien Dev
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code Card */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0">
                  <QRCodeSVG
                    value={activeQrUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-teal-400" />
                      <span>Scannez avec l'appareil photo de votre téléphone</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Pointez l'appareil photo de votre smartphone Android sur ce QR Code pour ouvrir BoutiquePro directement dans <strong>Google Chrome</strong>.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[10px] text-teal-300 break-all select-all">
                    {activeQrUrl}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      id="btn-copy-public-link"
                      onClick={() => handleCopyLink(activeQrUrl)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{copiedLink ? 'Lien copié !' : 'Copier le lien direct'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenInNewTab(activeQrUrl)}
                      className="px-3.5 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-xl text-teal-300 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                      <span>Ouvrir dans un nouvel onglet</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step by step guide to activate public access */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="font-extrabold text-white text-xs flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-teal-400" />
                  <span>Comment activer l'accès pour votre téléphone en 2 étapes :</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px] border border-teal-500/30">
                      1
                    </span>
                    <div>
                      En haut à droite de votre écran Google AI Studio, cliquez sur le bouton <strong>« Share » (Partager)</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center shrink-0 text-[10px] border border-teal-500/30">
                      2
                    </span>
                    <div>
                      Activez le partage pour générer le lien public. Une fois le partage activé, votre téléphone pourra se connecter immédiatement sans aucune demande de mot de passe Google ni blocage d'autorisation !
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALLATION DIRECTE SUR SMARTPHONE */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              {isInstallable ? (
                <div className="p-4 bg-gradient-to-r from-teal-950 to-indigo-950 rounded-2xl border border-teal-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-teal-300 font-black text-sm">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <span>Installation en 1-Clic Prête !</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Votre navigateur est prêt. Cliquez ci-dessous pour ajouter BoutiquePro directement sur votre écran d'accueil.
                  </p>
                  <button
                    id="btn-trigger-pwa-install"
                    onClick={handleDirectInstall}
                    disabled={isInstalling}
                    className="w-full py-3 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 hover:from-teal-300 hover:to-emerald-200 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-teal-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isInstalling ? 'Installation en cours...' : 'Installer BoutiquePro sur cet appareil'}</span>
                  </button>
                </div>
              ) : isInIframe ? (
                <div className="p-4 bg-indigo-950/70 rounded-2xl border border-indigo-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs">
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    <span>Vous êtes dans la fenêtre d'aperçu</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Pour installer l'application sur votre écran d'accueil Android, vous devez l'ouvrir dans un vrai onglet Google Chrome :
                  </p>
                  <button
                    onClick={() => handleOpenInNewTab(currentUrl)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir dans Google Chrome</span>
                  </button>
                </div>
              ) : null}

              {/* Step-by-step Chrome Android instructions */}
              <div className="space-y-3">
                <div className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Procédure dans Google Chrome sur Android :</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      1
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">Ouvrez le lien dans Google Chrome</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Sur votre téléphone, assurez-vous d'utiliser l'application <strong>Google Chrome</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      2
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">Appuyez sur les 3 points verticaux (⋮)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        En haut à droite de Google Chrome, ouvrez le menu principal.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      3
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">Appuyez sur « Installer l'application »</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        (Ou « Ajouter à l'écran d'accueil » selon votre version d'Android).
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                      4
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-xs">Confirmez l'installation</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        L'icône BoutiquePro est ajoutée à votre téléphone et fonctionne en plein écran, même sans connexion Internet.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER / INUTILE */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Pourquoi le « Mode Développeur » ne fonctionne pas seul</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Le « Mode Développeur » dans les paramètres d'Android n'installe aucune application automatiquement. Il sert uniquement aux développeurs informatiques pour connecter un câble USB à un PC avec Android Studio et exécuter des lignes de commande <code>adb install</code>.
                </p>
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-[11px]">
                  <strong>Ce qu'il faut faire :</strong> Vous pouvez désactiver ce mode développeur. Pour accéder à BoutiquePro sur votre téléphone, il suffit de scanner le <strong>Lien Public Partagé</strong> (dans le premier onglet) après avoir cliqué sur <strong>« Share »</strong> dans Google AI Studio.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span className="text-[11px]">BoutiquePro Android • Connexion Smartphone</span>
          </div>
          <button
            id="btn-close-footer-modal"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
