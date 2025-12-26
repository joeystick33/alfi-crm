'use client'

/**
 * Client360 Error Boundary Component
 * 
 * Provides contextual error handling and recovery for Client360 tabs.
 * Displays user-friendly error messages with retry functionality.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 15.4**
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { captureException } from '@/app/_common/lib/error-tracking'

interface Client360ErrorBoundaryProps {
  children: ReactNode
  tabName?: string
  clientId?: string
  onRetry?: () => void
  onNavigateHome?: () => void
  fallback?: ReactNode
}

interface Client360ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// Error type classification for contextual messages
type ErrorType = 'network' | 'auth' | 'notFound' | 'validation' | 'server' | 'unknown'

function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network'
  }
  if (message.includes('unauthorized') || message.includes('401') || message.includes('auth')) {
    return 'auth'
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'notFound'
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('400')) {
    return 'validation'
  }
  if (message.includes('server') || message.includes('500') || message.includes('503')) {
    return 'server'
  }
  return 'unknown'
}


// Error messages by type
const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string; action: string }> = {
  network: {
    title: 'Problème de connexion',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    action: 'Réessayer'
  },
  auth: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    action: 'Se reconnecter'
  },
  notFound: {
    title: 'Données introuvables',
    message: 'Les données demandées n\'ont pas été trouvées.',
    action: 'Retour'
  },
  validation: {
    title: 'Données invalides',
    message: 'Les données reçues sont invalides ou incomplètes.',
    action: 'Réessayer'
  },
  server: {
    title: 'Erreur serveur',
    message: 'Une erreur s\'est produite sur le serveur. Nos équipes ont été notifiées.',
    action: 'Réessayer'
  },
  unknown: {
    title: 'Une erreur est survenue',
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    action: 'Réessayer'
  }
}

export class Client360ErrorBoundary extends Component<Client360ErrorBoundaryProps, Client360ErrorBoundaryState> {
  constructor(props: Client360ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<Client360ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Track the error
    captureException(error, {
      component: `Client360_${this.props.tabName || 'Unknown'}`,
      metadata: {
        clientId: this.props.clientId,
        componentStack: errorInfo.componentStack,
      },
    })
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    this.props.onRetry?.()
  }

  handleNavigateHome = (): void => {
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome()
    } else {
      window.location.href = '/dashboard'
    }
  }

  handleRefresh = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.state.error ? classifyError(this.state.error) : 'unknown'
      const errorConfig = ERROR_MESSAGES[errorType]

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {errorConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{errorConfig.message}</p>
            
            {this.props.tabName && (
              <p className="text-sm text-muted-foreground">
                Section concernée : <span className="font-medium">{this.props.tabName}</span>
              </p>
            )}

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <summary className="cursor-pointer font-medium">Détails techniques</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-32 text-destructive">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground">
                    {this.state.error.stack}
                  </pre>
                )}
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={this.handleRetry} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {errorConfig.action}
              </Button>
              
              <Button onClick={this.handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rafraîchir la page
              </Button>
              
              <Button onClick={this.handleNavigateHome} variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}


/**
 * Section-level error boundary for individual sections within a tab
 */
export function SectionErrorBoundary({ 
  children, 
  sectionName,
  onRetry 
}: { 
  children: ReactNode
  sectionName: string
  onRetry?: () => void
}) {
  return (
    <Client360ErrorBoundary
      tabName={sectionName}
      onRetry={onRetry}
      fallback={
        <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium text-sm">Erreur dans cette section</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            La section "{sectionName}" n'a pas pu être chargée.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Réessayer
            </Button>
          )}
        </div>
      }
    >
      {children}
    </Client360ErrorBoundary>
  )
}

/**
 * HOC to wrap a component with Client360ErrorBoundary
 */
export function withClient360ErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    tabName?: string
    clientId?: string
  }
): React.ComponentType<P> {
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const WithErrorBoundary: React.FC<P> = (props) => (
    <Client360ErrorBoundary
      tabName={options?.tabName || componentName}
      clientId={options?.clientId}
    >
      <WrappedComponent {...props} />
    </Client360ErrorBoundary>
  )

  WithErrorBoundary.displayName = `withClient360ErrorBoundary(${componentName})`
  return WithErrorBoundary
}

/**
 * Inline error display component for API errors
 */
export function InlineError({
  error,
  onRetry,
  className = ''
}: {
  error: Error | string
  onRetry?: () => void
  className?: string
}) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorType = typeof error === 'string' ? 'unknown' : classifyError(error)
  const errorConfig = ERROR_MESSAGES[errorType]

  return (
    <div className={`flex items-center justify-between p-3 border border-destructive/30 bg-destructive/5 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive">{errorMessage || errorConfig.message}</span>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm" className="shrink-0">
          <RefreshCw className="h-3 w-3 mr-1" />
          Réessayer
        </Button>
      )}
    </div>
  )
}

/**
 * Empty state with error styling
 */
export function ErrorEmptyState({
  title,
  message,
  onRetry,
  onNavigate,
  navigateLabel
}: {
  title: string
  message: string
  onRetry?: () => void
  onNavigate?: () => void
  navigateLabel?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        )}
        {onNavigate && (
          <Button onClick={onNavigate} variant="outline">
            {navigateLabel || 'Retour'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default Client360ErrorBoundary
