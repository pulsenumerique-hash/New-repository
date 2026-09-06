import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BoutiquePro ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Une anomalie est survenue</h1>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              L'affichage de BoutiquePro a rencontré une erreur inattendue. Vous pouvez tenter de rafraîchir l'application ou réinitialiser le cache local.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-950/80 border border-slate-700/60 rounded-lg text-left text-xs font-mono text-rose-300 max-h-32 overflow-y-auto break-all">
                {this.state.error.message || 'Erreur non spécifiée'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Vider le cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
