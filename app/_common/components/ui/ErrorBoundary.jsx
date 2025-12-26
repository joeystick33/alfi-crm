'use client';

import { Component } from 'react';
import Button from './Button';
import { Card, CardContent } from './Card';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-lg w-full">
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Une erreur est survenue
                </h2>
                <p className="text-gray-600">
                  Nous sommes désolés, quelque chose s'est mal passé.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      Détails de l'erreur
                    </summary>
                    <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="primary"
                  >
                    Recharger la page
                  </Button>
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                  >
                    Retour
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
