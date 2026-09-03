import React from 'react';
import { Smartphone, Laptop, Tablet, Trash2, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../lib/formatters';

interface DeviceManagerModalProps {
  onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ onClose }) => {
  const { sessions, revokeSession } = useApp();

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
    } catch (err) {
      console.error('Error revoking session:', err);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-teal-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      default:
        return <Laptop className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Appareils & Sessions Connectées</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Synchronisation Firebase Cloud temps réel multi-terminaux (Android, Tablette, PC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {sessions.length || 1} appareil(s) synchronisé(s)
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Chiffrement Cloud Firestore</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {sessions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs text-indigo-600">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">Navigateur Actuel</span>
                      <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Cet appareil
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      Session Cloud Active • En direct
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    session.is_current
                      ? 'bg-indigo-50/50 border-indigo-200/80'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs text-indigo-600">
                      {getDeviceIcon(session.device_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">{session.device_name}</span>
                        {session.is_current && (
                          <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Cet appareil
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {session.user_name} • {session.browser} • {formatDate(session.last_active)}
                      </div>
                    </div>
                  </div>

                  {!session.is_current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      title="Déconnecter cet appareil à distance"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
