import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error Boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 my-8 shadow-2xl">
          <div className="max-w-md text-center space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl inline-block">
              <AlertCircle className="w-10 h-10 mx-auto" />
            </div>
            <h3 className="text-xl font-bold">{this.props.fallbackTitle || 'Ocurrió un inconveniente al cargar esta sección'}</h3>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'Error de procesamiento visual en la vista.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
