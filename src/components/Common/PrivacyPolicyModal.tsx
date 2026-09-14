import React, { useState } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  Search,
  ExternalLink,
  Mail,
  Lock,
  FileText,
  Building,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  if (!isOpen) return null;

  const sections = [
    {
      id: 1,
      title: '1. Responsable du traitement',
      content: (
        <div className="space-y-3">
          <p>Le service BoutiquePro est édité et exploité par :</p>
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-slate-800 space-y-1 text-xs sm:text-sm">
            <div className="font-extrabold text-emerald-950 text-base">Fadir</div>
            <div>
              <strong>Adresse de contact :</strong>{' '}
              <a href="mailto:pulsenumerique@gmail.com" className="text-teal-700 font-bold hover:underline">
                pulsenumerique@gmail.com
              </a>
            </div>
            <div>
              <strong>E-mail :</strong>{' '}
              <a href="mailto:pulsenumerique@gmail.com" className="text-teal-700 font-bold hover:underline">
                pulsenumerique@gmail.com
              </a>
            </div>
            <div>
              <strong>Site internet :</strong>{' '}
              <a
                href="https://phenomenal-quokka-994360.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>https://phenomenal-quokka-994360.netlify.app/</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Pour toute question relative à la protection des données personnelles, vous pouvez contacter Fadir à
            l'adresse : <strong className="text-slate-900">pulsenumerique@gmail.com</strong>
          </p>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Données que nous pouvons collecter',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>Selon les fonctionnalités utilisées, BoutiquePro peut traiter différentes catégories de données.</p>
          <div className="font-bold text-slate-900">2.1. Informations relatives au compte :</div>
          <p>Lorsque vous créez ou utilisez un compte BoutiquePro, nous pouvons traiter :</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Votre nom et prénom ;</li>
            <li>Votre adresse e-mail ;</li>
            <li>Votre numéro de téléphone lorsque vous choisissez de le fournir ;</li>
            <li>Le nom et les informations de votre boutique ;</li>
            <li>Les informations nécessaires à votre authentification ;</li>
            <li>Les informations nécessaires à la sécurité du compte.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Connexion avec Google',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            BoutiquePro peut permettre aux utilisateurs de créer un compte ou de se connecter à l'aide de{' '}
            <strong>Google OAuth</strong>.
          </p>
          <p>
            Lorsque vous choisissez cette méthode de connexion, Google peut transmettre à BoutiquePro certaines
            informations associées à votre compte Google, conformément aux autorisations accordées.
          </p>
          <p>Ces informations peuvent notamment comprendre :</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Votre nom ;</li>
            <li>Votre adresse e-mail ;</li>
            <li>Votre photo de profil, lorsque celle-ci est fournie et autorisée ;</li>
            <li>Un identifiant associé à votre compte Google.</li>
          </ul>
          <p>Ces informations sont utilisées principalement pour :</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Créer votre compte BoutiquePro ;</li>
            <li>Vous authentifier ;</li>
            <li>Sécuriser votre compte ;</li>
            <li>Vous permettre d'accéder au service.</li>
          </ul>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl font-medium text-teal-900">
            BoutiquePro n'utilise pas les données obtenues via Google à des fins incompatibles avec les finalités pour
            lesquelles elles ont été collectées.
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Données relatives à la boutique',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            BoutiquePro permet aux utilisateurs de saisir des informations nécessaires à la gestion de leur activité
            commerciale.
          </p>
          <p>Ces informations peuvent notamment comprendre :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>• Nom de la boutique</div>
            <div>• Produits & catégories</div>
            <div>• Prix & quantités</div>
            <div>• Niveaux & mouvements de stock</div>
            <div>• Ventes & encaissements</div>
            <div>• Remboursements & annulations</div>
            <div>• Dépenses d'exploitation</div>
            <div>• Opérations de caisse</div>
            <div>• Crédits clients & paiements</div>
            <div>• Historiques de transactions</div>
          </div>
          <p className="text-xs text-slate-500">Ces informations sont généralement saisies directement par l'utilisateur.</p>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Données relatives aux clients des commerçants',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            BoutiquePro peut permettre au commerçant d'enregistrer certaines informations concernant ses propres clients
            (nom ou prénom, numéro de téléphone, historique d'achats, montant d'un crédit, paiements effectués).
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            Le commerçant demeure responsable de la collecte et de l'utilisation de ces données dans le cadre de son
            activité. Il lui appartient de respecter les lois applicables concernant la protection des données
            personnelles et d'informer ses propres clients lorsque cela est nécessaire.
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: '6. Données techniques',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            Certaines informations techniques peuvent être collectées automatiquement lors de l'utilisation de
            BoutiquePro : adresse IP, type d'appareil, système d'exploitation, navigateur, date et heure de connexion,
            journaux techniques et informations d'erreurs.
          </p>
          <p>
            Ces informations peuvent être utilisées pour assurer la sécurité, diagnostiquer les problèmes et améliorer le
            fonctionnement du service.
          </p>
        </div>
      ),
    },
    {
      id: 7,
      title: '7. Fonctionnement Offline-First',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            BoutiquePro est conçu selon une approche <strong>Offline-First</strong>. Certaines fonctionnalités peuvent donc
            continuer à fonctionner lorsque l'utilisateur ne dispose pas temporairement d'une connexion Internet.
          </p>
          <p>
            Dans ce contexte, certaines données peuvent être stockées temporairement sur l'appareil utilisé (IndexedDB).
            Lorsque la connexion Internet est disponible, les données concernées peuvent être synchronisées avec les
            services utilisés par BoutiquePro.
          </p>
          <p className="text-xs text-slate-600">
            L'utilisateur doit protéger son appareil et son compte afin d'empêcher tout accès non autorisé. Les données
            qui n'auraient pas encore été synchronisées peuvent être affectées par la perte, la détérioration ou la
            réinitialisation de l'appareil.
          </p>
        </div>
      ),
    },
    {
      id: 8,
      title: "8. Finalités de l'utilisation des données",
      content: (
        <div className="space-y-2 text-xs sm:text-sm">
          <p>Les données peuvent être utilisées pour :</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Créer et gérer les comptes utilisateurs ;</li>
            <li>Fournir les fonctionnalités de BoutiquePro (ventes, stocks, caisses, crédits) ;</li>
            <li>Assurer la synchronisation et le fonctionnement Offline-First ;</li>
            <li>Sécuriser les comptes et détecter les activités frauduleuses ;</li>
            <li>Corriger les erreurs et améliorer les performances ;</li>
            <li>Communiquer avec les utilisateurs et respecter les obligations légales.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 9,
      title: '9. Partage des données',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-950">
            Fadir ne vend pas les données personnelles des utilisateurs.
          </div>
          <p>
            Certaines données peuvent néanmoins être traitées par des prestataires techniques nécessaires au
            fonctionnement de BoutiquePro (hébergement, authentification, stockage Firestore, synchronisation, sécurité).
            Ces prestataires peuvent accéder aux données uniquement dans la mesure nécessaire à la fourniture de leurs
            services.
          </p>
        </div>
      ),
    },
    {
      id: 10,
      title: '10. Conservation des données',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          Les données sont conservées pendant la durée nécessaire à la fourniture des services BoutiquePro et aux
          finalités décrites dans la présente politique. Lorsqu'un utilisateur demande la suppression de son compte, les
          données concernées peuvent être supprimées ou anonymisées, sous réserve des obligations légales applicables.
        </p>
      ),
    },
    {
      id: 11,
      title: '11. Sécurité des données',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          Fadir met en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données contre
          les accès non autorisés, la perte, l'altération, la divulgation ou la destruction. Cependant, aucun système
          informatique connecté à Internet ne peut garantir une sécurité absolue.
        </p>
      ),
    },
    {
      id: 12,
      title: '12. Droits des utilisateurs',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>
            Selon la législation applicable, les utilisateurs disposent des droits d'accès, de rectification,
            d'effacement, de limitation, d'opposition, de portabilité et de retrait de consentement.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            Pour exercer vos droits, écrivez directement à :{' '}
            <a href="mailto:pulsenumerique@gmail.com" className="font-bold text-teal-700 hover:underline">
              pulsenumerique@gmail.com
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 13,
      title: '13. Suppression du compte',
      content: (
        <div className="space-y-2 text-xs sm:text-sm">
          <p>
            Les utilisateurs peuvent demander la suppression définitive de leur compte en contactant :{' '}
            <strong className="text-slate-900">pulsenumerique@gmail.com</strong>.
          </p>
          <p className="text-xs text-slate-500">
            La demande sera traitée dans les limites prévues par la législation applicable.
          </p>
        </div>
      ),
    },
    {
      id: 14,
      title: '14. Cookies et technologies similaires',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          BoutiquePro peut utiliser des cookies ou des technologies de stockage local (LocalStorage, IndexedDB)
          strictement nécessaires à l'authentification, la gestion des sessions, la sécurité et le mode hors-ligne.
        </p>
      ),
    },
    {
      id: 15,
      title: '15. Transferts internationaux',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          Certains prestataires techniques (services cloud) peuvent héberger des données dans des centres de données
          sécurisés. Fadir s'assure que les garanties appropriées sont en place conformément aux exigences légales.
        </p>
      ),
    },
    {
      id: 16,
      title: '16. Données des mineurs',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          BoutiquePro est destiné aux professionnels. Nous ne collectons pas volontairement de données de mineurs. Pour
          toute demande : <strong className="text-slate-900">pulsenumerique@gmail.com</strong>.
        </p>
      ),
    },
    {
      id: 17,
      title: '17. Modification de la Politique de confidentialité',
      content: (
        <p className="text-xs sm:text-sm text-slate-700">
          Fadir peut modifier la présente Politique afin de tenir compte de l'évolution de BoutiquePro ou des exigences
          légales. La date de dernière mise à jour est toujours indiquée en tête du document.
        </p>
      ),
    },
    {
      id: 18,
      title: '18. Contact & Informations légales',
      content: (
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-slate-800 space-y-1.5 text-xs sm:text-sm">
          <div>
            <strong>Éditeur de BoutiquePro :</strong> Fadir
          </div>
          <div>
            <strong>E-mail de contact :</strong>{' '}
            <a href="mailto:pulsenumerique@gmail.com" className="text-teal-800 font-bold hover:underline">
              pulsenumerique@gmail.com
            </a>
          </div>
          <div>
            <strong>Site officiel :</strong>{' '}
            <a
              href="https://phenomenal-quokka-994360.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-800 font-bold hover:underline"
            >
              https://phenomenal-quokka-994360.netlify.app/
            </a>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm === ''
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">Politique de Confidentialité</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Fadir • 2026
                </span>
              </div>
              <p className="text-xs text-slate-300">Dernière mise à jour : 7 septembre 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Ouvrir la page autonome (nouvel onglet)"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barre de recherche et actions rapides */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Imprimer la politique"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <a
              href="mailto:pulsenumerique@gmail.com"
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contacter Fadir</span>
            </a>
          </div>
        </div>

        {/* Corps des sections */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {/* Note d'accueil */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
            Bienvenue sur <strong>BoutiquePro</strong>, solution SaaS de gestion de boutique alimentaire éditée par{' '}
            <strong>Fadir</strong>. Cette politique détaille la collecte, l'utilisation, la sécurité et vos droits sur
            vos données. En utilisant le service, vous acceptez ces conditions.
          </div>

          {/* Liste des sections filtrées */}
          {filteredSections.map((sec) => {
            const isExpanded = expandedSection === sec.id || searchTerm.length > 0;
            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(isExpanded && !searchTerm ? null : sec.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left font-extrabold text-sm text-slate-900 bg-slate-50/50 hover:bg-slate-100/60 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-black flex items-center justify-center">
                      {sec.id}
                    </span>
                    <span>{sec.title}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {isExpanded && <div className="p-4 pt-2 border-t border-slate-100">{sec.content}</div>}
              </div>
            );
          })}
        </div>

        {/* Bas de modale */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div>&copy; 2026 BoutiquePro • Édité par Fadir (pulsenumerique@gmail.com)</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
