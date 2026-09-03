import React, { useState } from 'react';
import {
  MailCheck,
  RefreshCw,
  Send,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmailVerificationModalProps {
  email: string;
  onVerified: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ email, onVerified }) => {
  const { checkEmailVerification, resendVerificationEmail, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    setMessage(null);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setMessage({
          type: 'success',
          text: 'Votre adresse e-mail a été validée avec succès ! Redirection...',
        });
        setTimeout(() => {
          onVerified();
        }, 1200);
      } else {
        setMessage({
          type: 'error',
          text: 'L’adresse e-mail n’est pas encore confirmée. Veuillez ouvrir le lien reçu dans votre boîte de réception (pensez à vérifier le dossier Spam).',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setMessage({
        type: 'success',
        text: `Un nouvel e-mail de confirmation a été envoyé à ${email}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’envoi';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Subtle decorative header accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-teal-500" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 shadow-inner mb-4">
          <MailCheck className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Vérification de votre adresse e-mail
        </h2>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Pour sécuriser l'accès aux données de votre boutique et activer la synchronisation cloud multi-appareils, un lien de confirmation a été envoyé à :
        </p>

        <div className="mt-3 px-3.5 py-2.5 bg-slate-100/80 rounded-2xl border border-slate-200 text-slate-800 font-mono text-xs font-bold break-all">
          {email}
        </div>

        {message && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2 text-left ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          <button
            id="btn-confirm-email-checked"
            type="button"
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl shadow-md text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Vérification en cours...' : 'J’ai cliqué sur le lien / Actualiser'}</span>
          </button>

          <button
            id="btn-resend-verification-email"
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isResending ? 'Envoi en cours...' : 'Renvoyer l’e-mail de confirmation'}</span>
          </button>

          <button
            id="btn-verification-logout"
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter / Changer d’adresse</span>
          </button>
        </div>

        <div className="mt-5 p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-2 text-[11px] text-amber-800 text-left">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Note : La validation d’e-mail protège votre boutique contre tout accès non autorisé.</span>
        </div>
      </div>
    </div>
  );
};
