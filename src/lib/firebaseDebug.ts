/**
 * Outil de diagnostic et de débogage pour Firebase Authentication et Firestore
 * Permet de valider l'environnement (Local vs Netlify vs Preview), les domaines autorisés et la configuration Google OAuth.
 * Ne trace JAMAIS de mots de passe ou d'informations sensibles.
 */

import { firebaseConfig } from './firebase';

export interface AuthorizedDomainsStatus {
  currentHostname: string;
  isKnownDomain: boolean;
  requiredDomains: string[];
  firebaseConsoleSettingsUrl: string;
  googleCloudConsentScreenUrl: string;
}

export interface FirebaseDiagnosticReport {
  isInitialized: boolean;
  projectId: string;
  authDomain: string;
  hasApiKey: boolean;
  currentHostname: string;
  isNetlify: boolean;
  isAuthorizedDomainLikely: boolean;
  status: AuthorizedDomainsStatus;
  timestamp: string;
}

/**
 * Liste exhaustive des domaines qui doivent être présents dans Firebase Console
 * (Authentification > Paramètres > Domaines autorisés) pour garantir que tous les
 * utilisateurs Google peuvent s'authentifier sans blocage.
 */
export const RECOMMENDED_AUTHORIZED_DOMAINS: string[] = [
  'localhost',
  '127.0.0.1',
  'gen-lang-client-0999962485.firebaseapp.com',
  'gen-lang-client-0999962485.web.app',
  'phenomenal-quokka-994360.netlify.app',
  'ais-dev-k6uejuuzoqpdni67b2mlip-129794840770.europe-west2.run.app',
  'ais-pre-k6uejuuzoqpdni67b2mlip-129794840770.europe-west2.run.app',
];

export function getAuthorizedDomainsStatus(): AuthorizedDomainsStatus {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0999962485';

  const isKnown =
    RECOMMENDED_AUTHORIZED_DOMAINS.includes(currentHostname) ||
    currentHostname.endsWith('.firebaseapp.com') ||
    currentHostname.endsWith('.web.app') ||
    currentHostname.endsWith('.netlify.app') ||
    currentHostname.endsWith('.run.app');

  return {
    currentHostname,
    isKnownDomain: isKnown,
    requiredDomains: Array.from(new Set([...RECOMMENDED_AUTHORIZED_DOMAINS, currentHostname])),
    firebaseConsoleSettingsUrl: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
    googleCloudConsentScreenUrl: `https://console.cloud.google.com/apis/credentials/consent?project=${projectId}`,
  };
}

export function runFirebaseDiagnostics(): FirebaseDiagnosticReport {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  const isNetlify = currentHostname.includes('netlify.app');
  const status = getAuthorizedDomainsStatus();

  const report: FirebaseDiagnosticReport = {
    isInitialized: Boolean(firebaseConfig.apiKey && firebaseConfig.projectId),
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: Boolean(firebaseConfig.apiKey),
    currentHostname,
    isNetlify,
    isAuthorizedDomainLikely: status.isKnownDomain,
    status,
    timestamp: new Date().toISOString(),
  };

  // Affichage dans la console développeur
  if (typeof window !== 'undefined') {
    console.groupCollapsed('🔍 [BoutiquePro / Firebase Diagnostic]');
    console.info('Projet Firebase ID :', report.projectId);
    console.info('Domaine Auth :', report.authDomain);
    console.info('Hôte actuel :', report.currentHostname);
    console.info('Environnement Netlify détecté :', report.isNetlify);
    console.info('Domaine reconnu dans la configuration :', report.isAuthorizedDomainLikely);
    if (!report.isAuthorizedDomainLikely) {
      console.warn(
        `⚠️ Domaine non standard détecté (${report.currentHostname}). Assurez-vous que ce domaine est ajouté dans Firebase Console > Authentification > Paramètres > Domaines autorisés.`
      );
    }
    console.groupEnd();
  }

  return report;
}

