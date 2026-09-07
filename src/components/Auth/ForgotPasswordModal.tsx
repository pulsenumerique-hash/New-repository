import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ForgotPasswordModalProps {
  isOpen?: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccessLogin?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen = true,
  initialEmail = '',
  onClose,
  onSuccessLogin,
}) => {
  const { requestPasswordResetCode, verifyPasswordResetCode, completePasswordReset } = useAuth();

  // Étape du flux :
  // 1 = Saisie de l'e-mail pour recevoir le code à 8 chiffres
  // 2 = Saisie et vérification du code à 8 chiffres
  // 3 = Formulaire pour définir le nouveau mot de passe
  // 4 = Confirmation de succès
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Champs de saisie
  const [email, setEmail] = useState(initialEmail);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Données de validation
  const [activeResetId, setActiveResetId] = useState<string | undefined>(undefined);
  const [activeOobCode, setActiveOobCode] = useState<string | undefined>(undefined);
  const [generatedCodePreview, setGeneratedCodePreview] = useState<string | null>(null);

  // États de chargement et retours d'informations
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Synchronisation avec les paramètres d'URL (si l'utilisateur clique sur un lien reçu par e-mail)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      const urlCode = params.get('code') || params.get('oobCode');
      const mode = params.get('mode');

      if (urlEmail) {
        setEmail(urlEmail);
      }

      if (urlCode && (mode === 'resetPassword' || urlCode.length >= 8)) {
        setVerificationCode(urlCode);
        if (mode === 'resetPassword') {
          setActiveOobCode(urlCode);
        }
        setStep(2);
      }
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  // Étape 1 : Demande du code de vérification à 8 chiffres par email
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestPasswordResetCode(cleanEmail);
      setActiveResetId(result.resetId);
      setGeneratedCodePreview(result.code);
      setSuccessMessage(`Un code de vérification à 8 chiffres a été généré et envoyé à ${cleanEmail}.`);
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’envoi du code de vérification.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2 : Vérification du code à 8 chiffres
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanCode = verificationCode.trim().replace(/[\s-]/g, '');
    if (!cleanCode) {
      setErrorMessage('Veuillez saisir le code à 8 chiffres reçu.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyPasswordResetCode(email, cleanCode);
      if (result.valid) {
        if (result.resetId) setActiveResetId(result.resetId);
        if (result.oobCode) setActiveOobCode(result.oobCode);
        setSuccessMessage('Code de vérification validé avec succès ! Définissez maintenant votre nouveau mot de passe.');
        setStep(3);
      } else {
        setErrorMessage(result.error || 'Le code à 8 chiffres est incorrect ou a expiré.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de valider le code.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 3 : Définition du nouveau mot de passe une fois le code validé
  const handleSetNewPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmation ne correspond pas au nouveau mot de passe saisi.');
      return;
    }

    setIsLoading(true);
    try {
      await completePasswordReset({
        email: email.trim(),
        code: verificationCode.trim(),
        newPassword,
        resetId: activeResetId,
        oobCode: activeOobCode,
      });
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du mot de passe.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Insertion ou copie rapide du code généré (facilite les tests en prévisualisation)
  const handleCopyCode = () => {
    if (generatedCodePreview) {
      navigator.clipboard.writeText(generatedCodePreview);
      setCopiedCode(true);
      setVerificationCode(generatedCodePreview);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div
      id="forgot-password-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
    >
      <div
        id="forgot-password-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200"
      >
        {/* Bouton pour fermer la fenêtre */}
        <button
          id="btn-close-forgot-modal"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête de la modale */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 id="forgot-password-modal-title" className="text-base font-black text-slate-900 leading-tight">
              Réinitialisation du mot de passe
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Vérification par code à 8 chiffres &amp; nouveau mot de passe
            </p>
          </div>
        </div>

        {/* Étapes du parcours */}
        {step < 4 && (
          <div className="flex items-center justify-between my-4 px-2">
            {[
              { num: 1, label: '1. Email' },
              { num: 2, label: '2. Code 8 chiffres' },
              { num: 3, label: '3. Nouveau mot de passe' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s.num
                        ? 'bg-teal-600 text-white shadow-xs scale-105'
                        : step > s.num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      step === s.num ? 'text-teal-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                      step > idx + 1 ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Bannière de message d'erreur */}
        {errorMessage && (
          <div
            id="forgot-password-error-message"
            className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 1 : Saisir l'email pour recevoir le code à 8 chiffres               */}
        {/* ========================================================================= */}
        {step === 1 && (
          <form id="form-forgot-step-1" onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Saisissez l’adresse e-mail de votre compte. Vous recevrez un{' '}
              <strong className="text-slate-900 font-bold">code de vérification à 8 chiffres</strong> pour
              sécuriser la redéfinition de votre mot de passe.
            </p>

            <div>
              <label htmlFor="input-forgot-email-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                Adresse e-mail du compte
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="input-forgot-email-field"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@boutique.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-hidden font-medium text-slate-800"
                  autoFocus
                />
              </div>
            </div>

            <button
              id="btn-submit-send-code"
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-600/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Génération du code en cours...</span>
                </>
              ) : (
                <>
                  <span>Recevoir le code à 8 chiffres</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : Saisie et vérification du code à 8 chiffres                     */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form id="form-forgot-step-2" onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-teal-900 text-xs">
              <p className="font-medium leading-relaxed">
                Un code de vérification à 8 chiffres a été envoyé à l'adresse :{' '}
                <strong className="font-black text-teal-950">{email}</strong>.
              </p>
            </div>

            {/* Assistance test / aperçu direct du code généré */}
            {generatedCodePreview && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Code prêt :{' '}
                    <strong className="font-mono text-xs font-black text-slate-900 tracking-wider">
                      {generatedCodePreview}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Insérer automatiquement le code"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Insérer</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Champ de saisie des 8 chiffres */}
            <div>
              <label
                htmlFor="input-verification-code-field"
                className="block text-xs font-extrabold text-slate-800 mb-1.5 text-center"
              >
                Saisissez le code de vérification à 8 chiffres
              </label>
              <div className="relative">
                <input
                  id="input-verification-code-field"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={16}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="12345678"
                  className="w-full py-3 px-4 text-center text-xl sm:text-2xl font-black font-mono tracking-[0.3em] bg-slate-50 border-2 border-teal-500/40 rounded-2xl focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100 transition outline-hidden text-slate-900 uppercase"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Format attendu : 8 chiffres (valable 15 minutes)
              </p>
            </div>

            <button
              id="btn-submit-verify-code"
              type="submit"
              disabled={isLoading || !verificationCode.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-600/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <span>Vérifier le code &amp; continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                &larr; Changer d'adresse
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isLoading}
                className="font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Renvoyer un code</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : Formulaire pour définir le nouveau mot de passe                 */}
        {/* ========================================================================= */}
        {step === 3 && (
          <form id="form-forgot-step-3" onSubmit={handleSetNewPassword} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Code vérifié ! Définissez dès maintenant votre nouveau mot de passe.</span>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="input-new-password-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="input-new-password-field"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-hidden font-medium text-slate-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmer le nouveau mot de passe */}
            <div>
              <label htmlFor="input-confirm-password-field" className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="input-confirm-password-field"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le même mot de passe"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-hidden font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist de validation visuelle */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px]">
                <Check
                  className={`w-3.5 h-3.5 ${
                    newPassword.length >= 6 ? 'text-emerald-600 stroke-[3]' : 'text-slate-300'
                  }`}
                />
                <span className={newPassword.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  Au moins 6 caractères
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Check
                  className={`w-3.5 h-3.5 ${
                    confirmPassword && newPassword === confirmPassword
                      ? 'text-emerald-600 stroke-[3]'
                      : 'text-slate-300'
                  }`}
                />
                <span
                  className={
                    confirmPassword && newPassword === confirmPassword
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-500'
                  }
                >
                  Les deux mots de passe correspondent
                </span>
              </div>
            </div>

            <button
              id="btn-submit-save-new-password"
              type="submit"
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-teal-600/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider mon nouveau mot de passe</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 4 : Confirmation du succès et invitation à la connexion             */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div id="forgot-password-success-view" className="text-center py-3 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">Mot de passe réinitialisé !</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                Votre nouveau mot de passe a été enregistré avec succès. Vous pouvez dès maintenant vous connecter à votre compte BoutiquePro.
              </p>
            </div>

            <button
              id="btn-goto-login-success"
              type="button"
              onClick={() => {
                onClose();
                if (onSuccessLogin) {
                  onSuccessLogin(email);
                }
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Se connecter avec le nouveau mot de passe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
