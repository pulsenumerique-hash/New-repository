/**
 * Traduction et normalisation complètes des erreurs Firebase Authentication en français
 * Fournit des explications claires et orientées utilisateur et administrateur.
 */

export function getFirebaseErrorMessage(error: unknown): string {
  if (!error) return 'Une erreur inconnue est survenue.';

  // Extraction du code et du message
  const errObj = error as { code?: string; message?: string };
  const errorCode = (errObj.code || '').toLowerCase();
  const rawMessage = String(errObj.message || error || '').toLowerCase();

  // 1. Erreurs de création de compte et d'identifiants
  if (errorCode === 'auth/email-already-in-use' || rawMessage.includes('email-already-in-use')) {
    return 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter ou réinitialiser votre mot de passe.';
  }

  if (errorCode === 'auth/invalid-email' || rawMessage.includes('invalid-email')) {
    return 'Le format de l’adresse e-mail est invalide. Veuillez vérifier votre saisie (ex: nom@domaine.com).';
  }

  if (errorCode === 'auth/weak-password' || rawMessage.includes('weak-password')) {
    return 'Le mot de passe est trop court. Il doit comporter au moins 6 caractères.';
  }

  if (errorCode === 'auth/user-not-found' || rawMessage.includes('user-not-found')) {
    return 'Aucun compte n’est associé à cette adresse e-mail. Veuillez vérifier l’e-mail ou créer un compte.';
  }

  if (errorCode === 'auth/wrong-password' || rawMessage.includes('wrong-password')) {
    return 'Le mot de passe saisi est incorrect. Veuillez réessayer ou cliquer sur "Mot de passe oublié".';
  }

  if (errorCode === 'auth/invalid-credential' || rawMessage.includes('invalid-credential')) {
    return 'Identifiants incorrects (adresse e-mail ou mot de passe invalide).';
  }

  // 2. Erreurs de configuration Firebase (Critiques pour déploiement Netlify)
  if (errorCode === 'auth/operation-not-allowed' || rawMessage.includes('operation-not-allowed')) {
    return 'La méthode de connexion Email/Mot de passe n’est pas activée dans la console Firebase. Rendez-vous dans Firebase Console > Authentification > Sign-in method et activez "E-mail/Mot de passe".';
  }

  if (errorCode === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain')) {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ce domaine';
    return `Le domaine "${currentHost}" n’est pas autorisé dans Firebase Authentication. Dans la Console Firebase > Authentification > Paramètres > Domaines autorisés, ajoutez "${currentHost}".`;
  }

  // 3. Erreurs réseau et sécurité
  if (errorCode === 'auth/network-request-failed' || rawMessage.includes('network-request-failed')) {
    return 'Erreur de connexion réseau. Impossible de joindre les serveurs Firebase. Veuillez vérifier votre connexion Internet.';
  }

  if (errorCode === 'auth/too-many-requests' || rawMessage.includes('too-many-requests')) {
    return 'Trop de tentatives infructueuses consécutives. Votre accès est temporairement bloqué par sécurité. Veuillez patienter quelques instants.';
  }

  if (errorCode === 'auth/user-disabled' || rawMessage.includes('user-disabled')) {
    return 'Ce compte utilisateur a été désactivé par l’administrateur.';
  }

  // 4. Erreurs OAuth / Google Sign-In
  if (errorCode === 'auth/popup-blocked' || rawMessage.includes('popup-blocked')) {
    return 'La fenêtre de connexion Google a été bloquée par votre navigateur. Autorisez les fenêtres pop-up ou utilisez le bouton "Connexion Google directe (pleine page)".';
  }

  if (errorCode === 'auth/popup-closed-by-user' || rawMessage.includes('popup-closed-by-user')) {
    return 'La fenêtre de connexion Google a été fermée avant la finalisation de l’authentification. Si Google a affiché "Accès bloqué : l’application n’a pas terminé le processus de validation de Google", l’écran de consentement OAuth dans la Google Cloud Console est en mode "Test" et doit être publié en "Production" (ou le compte doit être ajouté aux utilisateurs test).';
  }

  if (errorCode === 'auth/cancelled-popup-request' || rawMessage.includes('cancelled-popup-request')) {
    return 'Une tentative de connexion était déjà en cours dans une autre fenêtre. Veuillez patienter et réessayer.';
  }

  if (errorCode === 'auth/account-exists-with-different-credential' || rawMessage.includes('account-exists-with-different-credential')) {
    return 'Un compte existe déjà avec cette adresse e-mail via une autre méthode de connexion (ex: Google ou Mot de passe).';
  }

  // 5. Erreurs de réinitialisation de mot de passe
  if (errorCode === 'auth/expired-action-code' || rawMessage.includes('expired-action-code')) {
    return 'Le code de réinitialisation a expiré. Veuillez demander un nouveau code.';
  }

  if (errorCode === 'auth/invalid-action-code' || rawMessage.includes('invalid-action-code')) {
    return 'Le code de réinitialisation est invalide ou a déjà été utilisé.';
  }

  // Si le message d'erreur est déjà un message lisible en français
  if (errObj.message && !errObj.message.startsWith('Firebase:')) {
    return errObj.message;
  }

  return 'Une erreur est survenue lors de l’opération. Veuillez réessayer.';
}
