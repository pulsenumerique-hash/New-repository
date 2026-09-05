import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemTitle: string;
  itemSubtitle?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Confirmer la suppression',
  itemTitle,
  itemSubtitle,
  message = 'Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-confirm-delete"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">{title}</h3>
              <p className="text-xs text-rose-200 mt-0.5">Suppression définitive de la base de données</p>
            </div>
          </div>
          <button
            id="btn-close-delete-modal"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target Item Details Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Élément sélectionné
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5 break-words">
              {itemTitle}
            </h4>
            {itemSubtitle && (
              <div className="text-xs text-slate-600 mt-1">
                {itemSubtitle}
              </div>
            )}
          </div>

          {/* Exact Warning Banner */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-rose-950 font-bold">
                {message}
              </strong>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                L’élément sera immédiatement et définitivement retiré du stockage local et du Cloud Firebase. Les listes, compteurs et tableaux de bord seront automatiquement recalculés.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            id="btn-confirm-delete"
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suppression en cours...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
