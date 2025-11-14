/**
 * Error State Component
 * Displays error messages with retry functionality
 */

import React from 'react'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, ShieldAlert } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  error?: Error | string | null
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
  variant?: 'default' | 'network' | 'server' | 'permission'
}

const errorVariants = {
  default: {
    icon: AlertCircle,
    title: 'Une erreur est survenue',
    description: 'Impossible de charger les données. Veuillez réessayer.',
  },
  network: {
    icon: WifiOff,
    title: 'Erreur de connexion',
    description: 'Vérifiez votre connexion internet et réessayez.',
  },
  server: {
    icon: ServerCrash,
    title: 'Erreur serveur',
    description: 'Le serveur ne répond pas. Veuillez réessayer dans quelques instants.',
  },
  permission: {
    icon: ShieldAlert,
    title: 'Accès refusé',
    description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
  },
}

export function ErrorState({
  error,
  title,
  description,
  onRetry,
  className,
  variant = 'default',
}: ErrorStateProps) {
  const variantConfig = errorVariants[variant]
  const Icon = variantConfig.icon

  // Extract error message if error is an Error object
  const errorMessage = error instanceof Error ? error.message : error

  // Use custom title/description or fallback to variant defaults
  const displayTitle = title || variantConfig.title
  const displayDescription = description || errorMessage || variantConfig.description

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-destructive/5',
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold mb-1">{displayTitle}</h3>
      
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {displayDescription}
      </p>

      {process.env.NODE_ENV === 'development' && error instanceof Error && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs font-medium mb-2 text-muted-foreground">
            Détails de l'erreur (dev only)
          </summary>
          <div className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-32">
            <pre className="whitespace-pre-wrap text-destructive">
              {error.stack || error.message}
            </pre>
          </div>
        </details>
      )}
      
      {onRetry && variant !== 'permission' && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  )
}

/**
 * Determine error variant from error object
 */
export function getErrorVariant(error: Error | string | null): ErrorStateProps['variant'] {
  if (!error) return 'default'
  
  const message = error instanceof Error ? error.message.toLowerCase() : error.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connexion')) {
    return 'network'
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('serveur')) {
    return 'server'
  }
  
  if (message.includes('403') || message.includes('401') || message.includes('permission') || message.includes('accès')) {
    return 'permission'
  }
  
  return 'default'
}
