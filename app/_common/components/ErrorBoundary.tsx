'use client'

/**
 * ErrorBoundary - Capture les erreurs React et affiche un fallback
 * Intégré avec le service de tracking d'erreurs
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { captureException } from '@/app/_common/lib/error-tracking'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  componentName?: string
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Track l'erreur
    captureException(error, {
      component: this.props.componentName || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    })

    // Callback personnalisé
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = (): void => {
    window.location.href = '/dashboard'
  }

  handleRefresh = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback personnalisé
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback par défaut
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Une erreur est survenue
            </h2>
            
            <p className="text-gray-600 mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite. 
              Notre équipe a été notifiée et travaille à résoudre le problème.
            </p>

            {/* Détails en développement */}
            {(process.env.NODE_ENV === 'development' || this.props.showDetails) && this.state.error && (
              <details className="mb-6 text-left bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Détails de l'erreur
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">Erreur:</span>
                    <pre className="mt-1 text-sm text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <span className="font-medium text-gray-600">Stack trace:</span>
                      <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <span className="font-medium text-gray-600">Component stack:</span>
                      <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir la page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC pour wraper un composant avec ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    componentName?: string
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
  }
): React.ComponentType<P> {
  const componentName = options?.componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary
      componentName={componentName}
      fallback={options?.fallback}
      onError={options?.onError}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  WithErrorBoundary.displayName = `withErrorBoundary(${componentName})`
  return WithErrorBoundary
}

/**
 * ErrorBoundary minimaliste pour les sections
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName 
}: { 
  children: ReactNode
  sectionName: string 
}) {
  return (
    <ErrorBoundary
      componentName={sectionName}
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Erreur dans cette section</span>
          </div>
          <p className="mt-1 text-sm text-red-500">
            La section "{sectionName}" n'a pas pu être chargée.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
