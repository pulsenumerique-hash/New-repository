import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Search, X, CheckCircle2, User } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { formatDate } from '../../lib/formatters';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getAuditLogs()
      .then((res) => setLogs(res.logs))
      .catch((err) => console.error('Error fetching audit logs:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg">Journal d'Audit & Traçabilité</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Historique inaltérable des ventes, remboursements, stocks et connexions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans le journal d'audit..."
            className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Aucun événement dans le journal.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 hover:bg-indigo-50/30 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {log.user_name} ({log.action})
                  </span>
                  <span>{formatDate(log.timestamp)}</span>
                </div>
                <div className="font-semibold text-slate-800">{log.details}</div>
                {log.device_info && (
                  <div className="text-[10px] text-slate-400 font-mono">Appareil : {log.device_info}</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
