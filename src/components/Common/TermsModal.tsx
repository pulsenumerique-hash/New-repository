import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  if (!isOpen) return null;

  const sections = [
    {
      id: 1,
      title: '1. Éditeur du service',
      content: (
        <div className="space-y-3">
          <p>BoutiquePro est édité et exploité par :</p>
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl text-slate-800 space-y-1 text-xs sm:text-sm">
            <div className="font-extrabold text-teal-950 text-base">Fadir</div>
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
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Objet du service',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro est une solution logicielle destinée à faciliter la gestion quotidienne des commerces, notamment des boutiques alimentaires.</p>
          <p>Le service peut notamment permettre :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>La gestion des produits et des catégories ;</li>
            <li>Le suivi des stocks (gros et détail) ;</li>
            <li>L'enregistrement des ventes et l'encaissement ;</li>
            <li>La gestion de la caisse et le suivi des dépenses ;</li>
            <li>La gestion des crédits clients et remboursements ;</li>
            <li>La consultation de l'historique des opérations et traçabilité ;</li>
            <li>La génération et impression de tickets de caisse ou documents ;</li>
            <li>La synchronisation des données multi-appareils ;</li>
            <li>L'utilisation de certaines fonctionnalités hors connexion.</li>
          </ul>
          <p className="text-slate-500 italic mt-1">Les fonctionnalités disponibles peuvent évoluer au cours du développement de BoutiquePro.</p>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Création et gestion du compte',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Certaines fonctionnalités nécessitent la création d'un compte utilisateur.</p>
          <p>L'utilisateur s'engage à :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fournir des informations exactes et ne pas fournir volontairement de fausses informations ;</li>
            <li>Maintenir ses informations à jour ;</li>
            <li>Protéger ses identifiants de connexion ;</li>
            <li>Ne pas partager son compte avec des personnes non autorisées ;</li>
            <li>Signaler rapidement toute utilisation suspecte ou non autorisée.</li>
          </ul>
          <p className="p-3 bg-slate-100 rounded-xl text-slate-800 font-medium">
            L'utilisateur est responsable des opérations effectuées depuis son compte, sauf lorsqu'une utilisation frauduleuse indépendante de sa volonté est signalée dans un délai raisonnable.
          </p>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. Connexion avec Google',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro peut proposer une authentification via <strong>Google</strong>.</p>
          <p>Lorsque cette option est utilisée, certaines informations peuvent être transmises par Google à BoutiquePro conformément aux autorisations accordées par l'utilisateur.</p>
          <p>L'utilisation de l'authentification Google est également soumise aux conditions et politiques applicables de Google.</p>
          <p>Les données obtenues via Google sont utilisées pour permettre notamment la création, l'authentification et la sécurisation du compte BoutiquePro.</p>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. Utilisation autorisée',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>L'utilisateur peut utiliser BoutiquePro uniquement :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Conformément aux présentes Conditions ;</li>
            <li>Conformément aux lois et réglementations applicables ;</li>
            <li>Dans le cadre d'une utilisation commerciale ou personnelle légitime ;</li>
            <li>Dans le respect des droits des autres utilisateurs et des tiers.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 6,
      title: '6. Utilisations interdites',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p className="font-semibold text-rose-700">Il est formellement interdit d'utiliser BoutiquePro pour :</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Commettre une activité illégale ou frauduleuse ;</li>
            <li>Usurper l'identité d'une personne ou d'une entreprise ;</li>
            <li>Accéder au compte ou aux données d'un autre utilisateur sans autorisation ;</li>
            <li>Contourner les mécanismes de sécurité ou de chiffrement ;</li>
            <li>Introduire des virus ou logiciels malveillants ;</li>
            <li>Perturber volontairement le fonctionnement du service ou effectuer des attaques informatiques ;</li>
            <li>Tenter d'obtenir un accès non autorisé aux serveurs ou systèmes hébergés ;</li>
            <li>Revendre ou exploiter le service sans autorisation expresse ;</li>
            <li>Copier, modifier ou reproduire le logiciel ou ses composants sans autorisation.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 7,
      title: '7. Responsabilité concernant les données saisies',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>L'utilisateur reste responsable des données qu'il saisit dans BoutiquePro.</p>
          <p>Cela comprend notamment : les informations relatives à la boutique, les produits, les prix, les stocks, les ventes, les clients, les crédits, les dépenses et les opérations de caisse.</p>
          <p>L'utilisateur doit s'assurer que les informations enregistrées sont exactes et qu'il dispose des droits nécessaires pour les utiliser.</p>
        </div>
      ),
    },
    {
      id: 8,
      title: '8. Données des clients du commerçant',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Lorsque le commerçant utilise BoutiquePro pour enregistrer des données concernant ses clients, il reste responsable de la collecte et de l'utilisation de ces informations dans le cadre de son activité.</p>
          <p>Le commerçant doit respecter les obligations légales qui lui sont applicables concernant la protection des données personnelles.</p>
          <p>BoutiquePro fournit un outil technique destiné à faciliter la gestion commerciale et ne détermine pas les finalités propres à l'activité commerciale de chaque utilisateur.</p>
        </div>
      ),
    },
    {
      id: 9,
      title: '9. Fonctionnement Offline-First',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro peut permettre à certaines fonctionnalités de fonctionner sans connexion Internet.</p>
          <p>Les données saisies hors connexion peuvent être conservées localement sur l'appareil (IndexedDB) puis synchronisées lorsque la connexion est rétablie.</p>
          <p>L'utilisateur reconnaît que :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Certaines fonctionnalités peuvent ne pas être disponibles hors connexion ;</li>
            <li>La synchronisation peut être retardée en cas d'instabilité du réseau ;</li>
            <li>Des conflits de données peuvent exceptionnellement survenir ;</li>
            <li>Une panne, une perte ou une réinitialisation de l'appareil peut affecter les données qui n'ont pas encore été synchronisées avec le cloud.</li>
          </ul>
          <p className="font-semibold text-slate-900">L'utilisateur doit prendre les précautions nécessaires pour protéger son appareil et ses données.</p>
        </div>
      ),
    },
    {
      id: 10,
      title: '10. Exactitude des informations commerciales',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro est un outil de gestion.</p>
          <p>L'utilisateur reste responsable de vérifier l'exactitude des informations saisies dans le système, notamment les prix, les quantités, les ventes, les dépenses, les paiements, les crédits et les informations de caisse.</p>
          <p>BoutiquePro ne garantit pas que les informations saisies par l'utilisateur sont exactes ou conformes à sa comptabilité.</p>
        </div>
      ),
    },
    {
      id: 11,
      title: '11. Disponibilité du service',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Fadir fait des efforts raisonnables afin de maintenir BoutiquePro disponible.</p>
          <p>Toutefois, le service peut être temporairement indisponible en raison notamment de maintenance, de mises à jour, de problèmes techniques, de pannes de réseau, de problèmes liés à des prestataires tiers ou d'événements indépendants de la volonté raisonnable de Fadir.</p>
          <p className="italic text-slate-500">Fadir ne garantit pas une disponibilité permanente ou ininterrompue du service.</p>
        </div>
      ),
    },
    {
      id: 12,
      title: '12. Évolution du service',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Fadir peut modifier, améliorer, remplacer ou supprimer certaines fonctionnalités de BoutiquePro.</p>
          <p>Ces changements peuvent notamment avoir pour objectif : d'améliorer la sécurité, de corriger des erreurs, d'améliorer les performances, d'ajouter de nouvelles fonctionnalités ou de respecter des exigences techniques ou légales.</p>
        </div>
      ),
    },
    {
      id: 13,
      title: '13. Propriété intellectuelle',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro, son nom, son logo, son identité visuelle, son interface, son code, ses textes, ses éléments graphiques et ses fonctionnalités peuvent être protégés par les règles applicables en matière de propriété intellectuelle.</p>
          <p>Sauf autorisation expresse de Fadir, l'utilisateur ne peut pas :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Copier le logiciel ;</li>
            <li>Reproduire le logo ou l'identité visuelle à des fins commerciales ;</li>
            <li>Revendre le service ou distribuer le code source ;</li>
            <li>Modifier ou créer des versions dérivées du logiciel ;</li>
            <li>Exploiter commercialement les éléments propriétaires de BoutiquePro.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 14,
      title: '14. Abonnements et services payants',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Si BoutiquePro propose des abonnements ou fonctionnalités payantes, les prix et modalités applicables seront présentés à l'utilisateur avant toute souscription.</p>
          <p>Les conditions de paiement, de renouvellement et d'annulation seront précisées au moment de la souscription lorsque cela est applicable.</p>
          <p>Les paiements peuvent être traités par des prestataires de paiement tiers sécurisés.</p>
        </div>
      ),
    },
    {
      id: 15,
      title: '15. Résiliation du compte',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>
            L'utilisateur peut cesser d'utiliser BoutiquePro et demander la suppression de son compte en contactant :{' '}
            <a href="mailto:pulsenumerique@gmail.com" className="font-bold text-teal-700 hover:underline">
              pulsenumerique@gmail.com
            </a>
          </p>
          <p>Fadir peut également suspendre ou résilier un compte lorsqu'il existe notamment :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Une violation des présentes Conditions ;</li>
            <li>Une activité frauduleuse ou illégale ;</li>
            <li>Une tentative de compromission du service ;</li>
            <li>Un comportement susceptible de porter atteinte à la sécurité du service ou aux autres utilisateurs ;</li>
            <li>Un défaut de paiement lorsqu'un abonnement payant est applicable.</li>
          </ul>
          <p className="text-slate-500 italic">Lorsque cela est raisonnablement possible, Fadir peut informer l'utilisateur avant la suspension ou la résiliation.</p>
        </div>
      ),
    },
    {
      id: 16,
      title: '16. Sauvegarde des données',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro peut proposer des mécanismes de synchronisation et de stockage des données. Ces mécanismes sont conçus pour réduire les risques de perte de données, mais ne constituent pas une garantie absolue.</p>
          <p>L'utilisateur reste responsable de conserver les documents et informations nécessaires à son activité professionnelle.</p>
          <p className="font-semibold text-slate-900">Pour les données commerciales importantes, il est vivement recommandé de générer des sauvegardes appropriées via la section Sauvegardes du logiciel.</p>
        </div>
      ),
    },
    {
      id: 17,
      title: '17. Limitation de responsabilité',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro est un outil logiciel destiné à faciliter la gestion d'une activité commerciale.</p>
          <p>Fadir ne garantit pas notamment :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Une augmentation du chiffre d'affaires ou des bénéfices ;</li>
            <li>L'absence totale d'erreurs ou d'interruptions ;</li>
            <li>L'absence totale de perte de données ;</li>
            <li>L'adéquation du service à une situation comptable, fiscale ou juridique particulière.</li>
          </ul>
          <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            L'utilisateur reste responsable de ses décisions commerciales ainsi que du respect de ses obligations comptables, fiscales, administratives et légales. BoutiquePro ne constitue pas un service de conseil comptable, fiscal ou juridique.
          </p>
          <p className="text-slate-500">Dans les limites autorisées par la loi applicable, Fadir ne pourra être tenu responsable des conséquences résultant notamment d'une mauvaise utilisation du service, d'informations incorrectement saisies, ou d'événements indépendants de son contrôle.</p>
        </div>
      ),
    },
    {
      id: 18,
      title: '18. Services tiers',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>BoutiquePro peut utiliser ou intégrer certains services tiers nécessaires à son fonctionnement (authentification, hébergement cloud, stockage de base de données, paiement, analyse technique).</p>
          <p>Ces services peuvent être soumis à leurs propres conditions d'utilisation et politiques de confidentialité.</p>
        </div>
      ),
    },
    {
      id: 19,
      title: '19. Sécurité',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>L'utilisateur doit contribuer à la sécurité de son compte et du service. Il doit notamment :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Protéger ses identifiants et mot de passe ;</li>
            <li>Protéger son appareil de caisse ;</li>
            <li>Ne pas partager ses accès avec des personnes non autorisées ;</li>
            <li>Signaler toute activité suspecte ;</li>
            <li>Utiliser les mécanismes de sécurité disponibles.</li>
          </ul>
          <p className="font-bold text-rose-700">Toute tentative visant à compromettre la sécurité de BoutiquePro est formellement interdite.</p>
        </div>
      ),
    },
    {
      id: 20,
      title: '20. Modification des Conditions',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Fadir peut modifier les présentes Conditions afin de tenir compte de l'évolution de BoutiquePro, de ses fonctionnalités ou des exigences légales.</p>
          <p>La date de dernière mise à jour sera indiquée en haut de cette page.</p>
          <p className="italic text-slate-500">La poursuite de l'utilisation du service après l'entrée en vigueur de nouvelles Conditions peut constituer une acceptation des modifications, dans les limites autorisées par la législation applicable.</p>
        </div>
      ),
    },
    {
      id: 21,
      title: '21. Droit applicable et règlement des différends',
      content: (
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <p>Les présentes Conditions sont interprétées conformément aux lois applicables dans la juridiction où Fadir est légalement établi, sous réserve des règles impératives applicables.</p>
          <p>En cas de différend concernant BoutiquePro, les parties chercheront en priorité à trouver une solution amiable.</p>
          <p>À défaut d'accord amiable, le différend pourra être soumis aux juridictions compétentes conformément au droit applicable.</p>
        </div>
      ),
    },
    {
      id: 22,
      title: '22. Contact',
      content: (
        <div className="space-y-3 text-xs sm:text-sm">
          <p>Pour toute question concernant BoutiquePro ou les présentes Conditions d'utilisation :</p>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
            <div className="font-extrabold text-base text-teal-950">Fadir</div>
            <div>
              <strong>E-mail officiel :</strong>{' '}
              <a href="mailto:pulsenumerique@gmail.com" className="text-teal-700 font-bold hover:underline">
                pulsenumerique@gmail.com
              </a>
            </div>
            <div>
              <strong>Site officiel :</strong>{' '}
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
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter((sec) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return sec.title.toLowerCase().includes(term);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Conditions d'Utilisation</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Fadir • 2026
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                BoutiquePro • Dernière mise à jour : 7 septembre 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimer ou enregistrer en PDF"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir dans un nouvel onglet"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Intro Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{filteredSections.length}</span> articles
            <span>•</span>
            <span>Édité par Fadir</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl text-xs text-slate-700 leading-relaxed">
            Les présentes Conditions d'utilisation régissent l'accès et l'utilisation de <strong>BoutiquePro</strong>,
            solution SaaS de gestion de boutique alimentaire éditée par <strong>Fadir</strong>. En créant un compte ou en utilisant
            l'application, vous reconnaissez avoir pris connaissance des présentes Conditions et acceptez de les respecter.
          </div>

          {filteredSections.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Aucun article ne correspond à votre recherche « {searchTerm} ».
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isExpanded = expandedSection === sec.id || searchTerm.trim().length > 0;
              return (
                <div
                  key={sec.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white hover:border-teal-200"
                >
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
                  >
                    <span className="font-bold text-sm text-slate-900">{sec.title}</span>
                    <div className="flex items-center gap-2 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/30">
                      {sec.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Contact assistance :{' '}
            <a href="mailto:pulsenumerique@gmail.com" className="text-teal-700 font-bold hover:underline">
              pulsenumerique@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
            >
              Fermer
            </button>
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <span>Page web dédiée</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
