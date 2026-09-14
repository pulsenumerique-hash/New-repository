import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Info,
  Users,
} from 'lucide-react';
import {
  RECOMMENDED_AUTHORIZED_DOMAINS,
  getAuthorizedDomainsStatus,
} from '../../lib/firebaseDebug';

interface GoogleAuthDomainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthDomainsModal: React.FC<GoogleAuthDomainsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const status = getAuthorizedDomainsStatus();

  const handleCopySingle = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleCopyAll = () => {
    const text = status.requiredDomains.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 border border-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight">Configuration Google Auth & Domaines</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tous Utilisateurs Google
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Vérification du GoogleAuthProvider et des domaines autorisés Firebase Console
              </p>
            </div>
          </div>
          <button
            id="btn-close-google-auth-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Card 1: GoogleAuthProvider Status */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>GoogleAuthProvider : Accès Ouvert à Tous les Comptes</span>
            </div>
            <p className="text-emerald-950 text-xs leading-relaxed">
              Le fournisseur <code>GoogleAuthProvider</code> est configuré dans le projet pour accepter <strong>tous les utilisateurs Google</strong> (adresses @gmail.com, comptes Google Workspace d'entreprises, etc.). Aucune restriction de domaine (<code>hd</code>) ni filtrage développeur n'est actif dans le code applicatif.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-200">
                <span className="font-bold text-slate-800">Scopes autorisés :</span>
                <div className="text-slate-600 font-mono mt-0.5">email, profile, openid</div>
              </div>
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-200">
                <span className="font-bold text-slate-800">Prompt de connexion :</span>
                <div className="text-slate-600 font-mono mt-0.5">select_account (multi-compte)</div>
              </div>
              <div className="bg-white/80 rounded-xl p-2 border border-emerald-200">
                <span className="font-bold text-slate-800">Création automatique :</span>
                <div className="text-slate-600 font-mono mt-0.5">Boutique & rôle gérant</div>
              </div>
            </div>
          </div>

          {/* Card 2: Current Hostname verification */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Domaine actif de votre session</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  status.isKnownDomain
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {status.isKnownDomain ? 'Domaine Référencé' : 'À Vérifier'}
              </span>
            </div>
            <div className="font-mono text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 select-all flex items-center justify-between">
              <span>{status.currentHostname}</span>
              <button
                type="button"
                onClick={() => handleCopySingle(status.currentHostname)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold ml-2 transition cursor-pointer"
              >
                {copiedDomain === status.currentHostname ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Card 3: Authorized Domains in Firebase Console */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Domaines à autoriser dans la Console Firebase
                </h3>
                <p className="text-xs text-slate-500">
                  Ces hôtes doivent figurer dans <strong>Authentification &gt; Paramètres &gt; Domaines autorisés</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{copiedAll ? 'Tous copiés !' : 'Copier la liste'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-2xl p-3.5 font-mono text-[11px] space-y-1.5 border border-slate-800">
              {status.requiredDomains.map((dom) => (
                <div
                  key={dom}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/60 transition group"
                >
                  <span className={dom === status.currentHostname ? 'text-teal-300 font-bold' : ''}>
                    {dom} {dom === status.currentHostname && '(Actuel)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(dom)}
                    className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-white text-[10px] transition cursor-pointer"
                  >
                    {copiedDomain === dom ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Google Cloud Console OAuth Consent Screen (Testing vs Production) */}
          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Rappel capital : Mode de l’écran de consentement OAuth</span>
            </div>
            <p className="text-amber-900 text-[11px] leading-relaxed">
              Si un utilisateur reçoit le message d’erreur Google <em>« Accès bloqué : l’application n’a pas terminé le processus de validation de Google »</em> (Erreur 403 : access_denied), cela signifie que l'écran de consentement dans <strong>Google Cloud Console</strong> est actuellement en mode <strong>« Test »</strong> (où seuls les e-mails test ajoutés par le développeur sont autorisés).
            </p>
            <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 text-[11px] text-amber-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Pour autoriser tous les utilisateurs Google sans exception :</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                <li>
                  Ouvrez la <strong>Google Cloud Console</strong> sur le projet <code>{RECOMMENDED_AUTHORIZED_DOMAINS[2]?.split('.')[0] || 'votre projet'}</code>.
                </li>
                <li>
                  Accédez à <strong>API et services &gt; Écran de consentement OAuth</strong>.
                </li>
                <li>
                  Sous <strong>État de publication</strong>, cliquez sur le bouton <strong>« PUBLIER L'APPLICATION »</strong> (Publish app) pour passer du mode Test au mode Production.
                </li>
              </ol>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={status.firebaseConsoleSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition text-center flex items-center justify-center gap-1.5"
            >
              <span>Ouvrir Firebase Console (Domaines)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={status.googleCloudConsentScreenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition text-center flex items-center justify-center gap-1.5"
            >
              <span>Écran OAuth (Google Cloud)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>BoutiquePro • Google OAuth v2</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
