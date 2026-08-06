import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary atrapó un error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Ocurrió un error inesperado</h2>
            <p className="text-sm text-gray-600">
              Se produjo un problema al renderizar este componente. Puedes intentar recargar la página.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs bg-gray-100 p-3 rounded text-red-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
