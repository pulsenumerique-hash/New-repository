import React, { useState } from 'react';
import {
  Store,
  Mail,
  Lock,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
  Smartphone,
  Globe,
  Download,
  Usb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AndroidUSBInstallModal } from '../PWA/AndroidUSBInstallModal';

export const LoginScreen: React.FC = () => {
  const { login, register, googleLogin, forgotPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state (Tous champs obligatoires)
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regBoutiqueName, setRegBoutiqueName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!loginEmail || !loginPassword) {
      setLocalError('Veuillez remplir votre e-mail et mot de passe.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!regFirstName || !regLastName || !regBoutiqueName || !regEmail || !regPassword || !regPasswordConfirm) {
      setLocalError('Tous les champs marqués sont obligatoires.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setLocalError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    if (regPassword.length < 6) {
      setLocalError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        first_name: regFirstName,
        last_name: regLastName,
        boutique_name: regBoutiqueName,
        email: regEmail,
        password: regPassword,
        password_confirm: regPasswordConfirm,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await googleLogin();
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err || '');
      if (errStr.includes('unauthorized-domain')) {
        setLocalError(
          `Domaine "${window.location.hostname}" non autorisé dans Firebase Auth pour Google. Ajoutez ce domaine dans la Console Firebase (Authentification > Paramètres > Domaines autorisés), ou connectez-vous directement avec votre e-mail et mot de passe ci-dessous.`
        );
      } else {
        setLocalError(err instanceof Error ? err.message : 'Erreur de connexion Google');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setLocalError('Veuillez entrer une adresse e-mail valide.');
      return;
    }
    setIsSendingReset(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSuccessMessage(
        `Un e-mail de réinitialisation sécurisé a été envoyé à ${forgotEmail}. Veuillez vérifier votre boîte de réception.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’envoi';
      setLocalError(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Top Floating Android Install Bar */}
      <div className="relative z-30 max-w-md mx-auto w-full mb-4">
        <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <span>Application Android</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-sm font-bold">PWA 1-Clic</span>
              </div>
              <div className="text-[10px] text-slate-400">Sans mode développeur • Hors-ligne</div>
            </div>
          </div>
          <button
            id="btn-login-top-install"
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Installer Android</span>
          </button>
        </div>
      </div>

      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white shadow-xl shadow-indigo-500/20 mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          BoutiquePro
        </h1>
        <p className="mt-2 text-xs text-slate-400 font-medium">
          Gestion de boutique alimentaire, caisse, crédits & synchro cloud Firebase
        </p>

        {/* Feature Badges Bento Row */}
        <div className="mt-3.5 flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full font-medium">
            <Globe className="w-3.5 h-3.5 text-indigo-400" /> Firebase Cloud
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full font-medium">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" /> Multi-Appareils
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> OAuth & Vérifié
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-8 border border-slate-200">
          {/* Bento Mode Switcher Pills */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold text-center rounded-xl transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Se connecter
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold text-center rounded-xl transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Créer mon compte
            </button>
          </div>

          {(error || localError) && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error || localError}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            id="btn-google-login"
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-2xl shadow-2xs bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400 font-bold">Ou avec e-mail</span>
            </div>
          </div>

          {/* FORMULAIRE DE CONNEXION */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Adresse e-mail
                </label>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="votre-email@boutique.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-2xl shadow-md text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Connexion en cours...</span>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORMULAIRE D'INSCRIPTION (ADMIN AUTO-PROMOTED) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <span className="font-medium">
                  Ce compte deviendra automatiquement le compte <strong>Administrateur</strong> de votre boutique avec validation par e-mail.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    id="input-reg-firstname"
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Amadou"
                    className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom *
                  </label>
                  <input
                    id="input-reg-lastname"
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Diallo"
                    className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de la boutique *
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="input-reg-boutique"
                    type="text"
                    required
                    value={regBoutiqueName}
                    onChange={(e) => setRegBoutiqueName(e.target.value)}
                    placeholder="Alimentation Générale du Sahel"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse e-mail *
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="gerant@boutique.com"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 car."
                    className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmer *
                  </label>
                  <input
                    id="input-reg-confirm"
                    type="password"
                    required
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Confirmer"
                    className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-2xl shadow-md text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 transition active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Création du compte...</span>
                ) : (
                  <>
                    <span>Créer mon compte Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Android PWA Install Prompt Banner on Login */}
        <div className="mt-4 p-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-[11px]">Application Téléphone Android</div>
              <div className="text-[10px] text-slate-400">Installez l'icône sur votre smartphone</div>
            </div>
          </div>
          <button
            id="btn-login-open-pwa"
            type="button"
            onClick={() => setShowPwaModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
        </div>
      </div>

      {/* Android USB & APK Install Modal on Login */}
      {showPwaModal && <AndroidUSBInstallModal onClose={() => setShowPwaModal(false)} />}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <span>Réinitialisation du mot de passe</span>
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              Saisissez votre adresse e-mail pour recevoir un lien officiel Firebase de réinitialisation de mot de passe.
            </p>

            {forgotSuccessMessage ? (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccessMessage}</span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="votre-email@boutique.com"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleSendResetPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-70"
                >
                  {isSendingReset ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotSuccessMessage(null);
              }}
              className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
