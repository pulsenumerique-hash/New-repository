import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Sparkles,
  Palette,
  Type,
  ShieldCheck,
  Store,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandKitModal: React.FC<BrandKitModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'colors' | 'typography' | 'guidelines'>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadSvg = () => {
    const link = document.createElement('a');
    link.href = '/icon.svg';
    link.download = 'boutiquepro-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colors = [
    {
      name: 'Teal Vibrant',
      role: 'Couleur primaire — Actions clés, validation de vente, boutons principaux',
      hex: '#0d9488',
      tailwind: 'teal-600',
      textLight: true,
    },
    {
      name: 'Teal Émeraude',
      role: 'Succès & Accent — Statuts en ligne, badge caissier, solde positif',
      hex: '#14b8a6',
      tailwind: 'teal-500',
      textLight: true,
    },
    {
      name: 'Indigo Impérial',
      role: 'Accent Administrateur — Dégradés logo, mode gestion, synchronisation cloud',
      hex: '#4f46e5',
      tailwind: 'indigo-600',
      textLight: true,
    },
    {
      name: 'Indigo Profond',
      role: 'Surfaces de contraste — Arrière-plans d’accent, bordures d’en-tête',
      hex: '#1e1b4b',
      tailwind: 'indigo-950',
      textLight: true,
    },
    {
      name: 'Slate Sombre',
      role: 'Fond principal (Canvas Dark) — Barre de navigation, en-têtes et modales',
      hex: '#0f172a',
      tailwind: 'slate-900',
      textLight: true,
    },
    {
      name: 'Slate Surface',
      role: 'Composants sombres — Cartes secondaires, pills de navigation',
      hex: '#1e293b',
      tailwind: 'slate-800',
      textLight: true,
    },
    {
      name: 'Slate Fond Clair',
      role: 'Fond d’écran principal — Confort visuel prolongé pour les caissiers',
      hex: '#f8fafc',
      tailwind: 'slate-50',
      textLight: false,
    },
    {
      name: 'Bordure Neutre',
      role: 'Séparateurs & Contours — Délimitation des cartes et tableaux de ventes',
      hex: '#e2e8f0',
      tailwind: 'slate-200',
      textLight: false,
    },
    {
      name: 'Ambre Alerte',
      role: 'Avertissement Stock — Produits sous seuil d’alerte, stocks bas',
      hex: '#f59e0b',
      tailwind: 'amber-500',
      textLight: true,
    },
    {
      name: 'Rose Écarlate',
      role: 'Alerte Critique — Crédits clients échus (> 14 jours), pertes, annulations',
      hex: '#f43f5e',
      tailwind: 'rose-500',
      textLight: true,
    },
  ];

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <g transform="translate(106, 106)">
    <path d="M 20 110 L 150 30 L 280 110 Z" fill="url(#storeGrad)"/>
    <path d="M 10 110 Q 150 80 290 110 L 275 140 Q 150 110 25 140 Z" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="45" y="135" width="210" height="135" rx="8" fill="#ffffff" fill-opacity="0.95"/>
    <rect x="115" y="175" width="70" height="95" rx="6" fill="#0f172a"/>
    <circle cx="170" cy="225" r="5" fill="url(#goldGrad)"/>
    <rect x="60" y="175" width="40" height="50" rx="4" fill="url(#storeGrad)" fill-opacity="0.8"/>
    <rect x="200" y="175" width="40" height="50" rx="4" fill="url(#storeGrad)" fill-opacity="0.8"/>
    <circle cx="240" cy="80" r="32" fill="url(#goldGrad)"/>
    <path d="M 228 80 L 236 88 L 254 70" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/10">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Charte Graphique & Branding</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Kit Officiel v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identité visuelle, codes couleurs, typographie et assets officiels de BoutiquePro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Identité & Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition whitespace-nowrap ${
              activeTab === 'colors'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Palette de Couleurs</span>
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition whitespace-nowrap ${
              activeTab === 'typography'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Typographie & UI</span>
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition whitespace-nowrap ${
              activeTab === 'guidelines'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Directives & Baseline</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          {/* TAB 1: OVERVIEW & LOGO */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Brand Header Banner */}
              <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-950 rounded-3xl text-white border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30">
                    <Store className="w-3.5 h-3.5" />
                    <span>Marque & Produit</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">BoutiquePro</h3>
                  <p className="text-xs text-slate-300 max-w-md">
                    Système moderne de caisse et de gestion pour épiceries, commerces d'alimentation et dépôts grossistes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadSvg}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger SVG</span>
                  </button>
                  <button
                    onClick={() => handleCopy(svgCode, 'svg')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition active:scale-95 cursor-pointer"
                  >
                    {copiedCode === 'svg' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode === 'svg' ? 'Copié !' : 'Copier le SVG'}</span>
                  </button>
                </div>
              </div>

              {/* Logo Previews in Light / Dark */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Prévisualisation du Logo Officiel</span>
                  </h4>
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setPreviewTheme('dark')}
                      className={`px-3 py-1 rounded-lg transition ${
                        previewTheme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Fond Sombre
                    </button>
                    <button
                      onClick={() => setPreviewTheme('light')}
                      className={`px-3 py-1 rounded-lg transition ${
                        previewTheme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Fond Clair
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Square App Icon Variant */}
                  <div
                    className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center transition ${
                      previewTheme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="w-24 h-24 mb-4 rounded-3xl shadow-xl overflow-hidden">
                      <img
                        src="/icon.svg"
                        alt="BoutiquePro App Icon"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="font-black text-sm">Icône d'Application (App Icon)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Format carré 512x512 pour PWA, APK et raccourci bureau</div>
                  </div>

                  {/* Horizontal Lockup Variant */}
                  <div
                    className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center transition ${
                      previewTheme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/10">
                        <Store className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-black tracking-tight leading-none">BoutiquePro</div>
                        <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mt-1">
                          Gestion & Encaissement
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-sm">Logotype Horizontal (Header / Impression)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Adapté aux tickets de caisse et barres de navigation</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Nuancier Officiel & Rôles d'Usage</h4>
                  <p className="text-xs text-slate-500">Cliquez sur un code HEX pour le copier dans votre presse-papiers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {colors.map((c) => (
                  <div
                    key={c.hex}
                    onClick={() => handleCopy(c.hex, c.hex)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition cursor-pointer flex items-center gap-3.5 group"
                  >
                    <div
                      className="w-12 h-12 rounded-xl shadow-inner border border-black/10 flex items-center justify-center shrink-0 transition group-hover:scale-105"
                      style={{ backgroundColor: c.hex }}
                    >
                      {copiedCode === c.hex && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{c.name}</span>
                        <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-indigo-600 transition">
                          {copiedCode === c.hex ? 'Copié !' : c.hex}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.role}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{c.tailwind}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & UI TOKENS */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* Font Family Info */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">Police Principale : Plus Jakarta Sans</h4>
                    <p className="text-xs text-slate-500">
                      Famille sans-serif géométrique optimisée pour la lisibilité sur écrans tactiles et caisses.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Google Fonts (Libre)
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono text-slate-400">800 ExtraBold</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">BoutiquePro — Titres & Hero (24-32px)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono text-slate-400">700 Bold</span>
                    <span className="text-lg font-bold text-slate-800">Total Vente : 14 500 FCFA (18-20px)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono text-slate-400">600 SemiBold</span>
                    <span className="text-sm font-semibold text-slate-700">Crédit Client & Mouvements de Caisse (14px)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-mono text-slate-400">400 Regular</span>
                    <span className="text-xs font-normal text-slate-600">Texte descriptif, tickets et messages d'aide (12-14px)</span>
                  </div>
                </div>
              </div>

              {/* Design System UI Tokens */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <div className="font-extrabold text-xs text-slate-900">Rayons de Courbure</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold">12</div>
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold">16</div>
                    <div className="w-10 h-10 rounded-3xl bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold">24</div>
                  </div>
                  <p className="text-[11px] text-slate-500">12px (boutons), 16px (cartes), 24px (conteneurs principaux)</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <div className="font-extrabold text-xs text-slate-900">Badges & Rôles</div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
                      Admin
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-600 border border-teal-500/30">
                      Caissier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Distinction visuelle instantanée des permissions utilisateur</p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <div className="font-extrabold text-xs text-slate-900">Ombres & Éclairage</div>
                  <div className="h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white text-[11px] font-bold">
                    Ombre colorée
                  </div>
                  <p className="text-[11px] text-slate-500">Légère diffusion aux teintes du dégradé officiel</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GUIDELINES & SLOGAN */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900">Slogans & Proposition de Valeur</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Slogan Principal</div>
                    <div className="font-black text-slate-900 text-sm mt-0.5">
                      « L'encaissement et la gestion de stock moderne, connectée et hors-ligne pour commerces alimentaires. »
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Baseline Courte</div>
                    <div className="font-black text-slate-900 text-sm mt-0.5">
                      « BoutiquePro : Vendez vite, encaissez juste, contrôlez tout. »
                    </div>
                  </div>
                </div>
              </div>

              {/* Do's & Don'ts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>À faire (Bonnes Pratiques)</span>
                  </div>
                  <ul className="text-[11px] text-emerald-900 space-y-1.5 pl-4 list-disc">
                    <li>Utiliser le dégradé officiel Indigo (#4f46e5) vers Teal (#14b8a6) pour les boutons majeurs.</li>
                    <li>Garder un contraste élevé entre le texte et le fond (WCAG AA).</li>
                    <li>Afficher l'état du réseau (Temps réel actif / Hors-ligne) de façon permanente.</li>
                  </ul>
                </div>

                <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>À éviter</span>
                  </div>
                  <ul className="text-[11px] text-rose-900 space-y-1.5 pl-4 list-disc">
                    <li>Ne pas altérer les proportions du logo ni déformer l'auvent.</li>
                    <li>Ne pas remplacer la police Plus Jakarta Sans par une police fantaisie.</li>
                    <li>Ne jamais masquer les indicateurs de synchronisation hors-ligne.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>BoutiquePro Design System • Export SVG & PNG disponible</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
