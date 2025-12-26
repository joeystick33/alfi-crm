/**
 * Service de tracking d'erreurs frontend
 * Compatible Sentry - peut être branché sur n'importe quel provider
 */

export interface ErrorContext {
  userId?: string
  clientId?: string
  page?: string
  component?: string
  action?: string
  metadata?: Record<string, unknown>
}

export interface BreadcrumbData {
  category: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}

// Configuration du provider (Sentry, etc.)
interface ErrorTrackingConfig {
  dsn?: string
  environment: string
  release?: string
  enabled: boolean
}

const config: ErrorTrackingConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
}

// Buffer pour les erreurs avant initialisation
const errorBuffer: Array<{ error: Error; context?: ErrorContext }> = []
let isInitialized = false

/**
 * Initialise le service de tracking d'erreurs
 * À appeler au démarrage de l'application (dans _app.tsx ou layout.tsx)
 */
export async function initErrorTracking(): Promise<void> {
  if (!config.enabled) {
    console.info('[ErrorTracking] Disabled in non-production environment')
    return
  }

  try {
    // Ici, vous pouvez importer et configurer Sentry
    // import * as Sentry from '@sentry/nextjs'
    // Sentry.init({
    //   dsn: config.dsn,
    //   environment: config.environment,
    //   release: config.release,
    //   tracesSampleRate: 0.1,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // })

    isInitialized = true
    console.info('[ErrorTracking] Initialized successfully')

    // Flush buffered errors
    for (const { error, context } of errorBuffer) {
      captureException(error, context)
    }
    errorBuffer.length = 0
  } catch (error) {
    console.error('[ErrorTracking] Failed to initialize:', error)
  }
}

/**
 * Configure le contexte utilisateur
 */
export function setUser(user: { id: string; email?: string; name?: string } | null): void {
  if (!config.enabled) return

  // Sentry.setUser(user)
  if (user) {
    console.debug('[ErrorTracking] User set:', user.id)
  } else {
    console.debug('[ErrorTracking] User cleared')
  }
}

/**
 * Ajoute un breadcrumb (fil d'Ariane pour le contexte)
 */
export function addBreadcrumb(data: BreadcrumbData): void {
  if (!config.enabled) return

  // Sentry.addBreadcrumb({
  //   category: data.category,
  //   message: data.message,
  //   level: data.level || 'info',
  //   data: data.data,
  // })

  console.debug('[ErrorTracking] Breadcrumb:', data.category, '-', data.message)
}

/**
 * Capture une exception avec contexte
 */
export function captureException(error: Error, context?: ErrorContext): string | null {
  // En développement, toujours logger
  console.error('[ErrorTracking] Exception:', error.message, context)

  if (!config.enabled) {
    return null
  }

  if (!isInitialized) {
    // Buffer l'erreur pour plus tard
    errorBuffer.push({ error, context })
    return null
  }

  // Sentry.withScope((scope) => {
  //   if (context?.userId) scope.setUser({ id: context.userId })
  //   if (context?.page) scope.setTag('page', context.page)
  //   if (context?.component) scope.setTag('component', context.component)
  //   if (context?.action) scope.setTag('action', context.action)
  //   if (context?.clientId) scope.setExtra('clientId', context.clientId)
  //   if (context?.metadata) scope.setExtras(context.metadata)
  //   
  //   return Sentry.captureException(error)
  // })

  // Retourne un ID fictif en dev
  return `error-${Date.now()}`
}

/**
 * Capture un message (non-erreur)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): string | null {
  console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`, context)

  if (!config.enabled || !isInitialized) {
    return null
  }

  // Sentry.withScope((scope) => {
  //   if (context) {
  //     scope.setExtras(context)
  //   }
  //   return Sentry.captureMessage(message, level)
  // })

  return `message-${Date.now()}`
}

/**
 * Wrapper pour capturer les erreurs dans les composants React
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.ComponentType<P> {
  // Implémentation simplifiée - en prod utiliser Sentry.ErrorBoundary
  return Component
}

/**
 * Hook pour tracker les erreurs dans les effets
 */
export function useErrorTracking(componentName: string) {
  const trackError = (error: Error, action?: string) => {
    captureException(error, {
      component: componentName,
      action,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }

  const trackAction = (action: string, metadata?: Record<string, unknown>) => {
    addBreadcrumb({
      category: 'user-action',
      message: `${componentName}: ${action}`,
      level: 'info',
      data: metadata,
    })
  }

  return { trackError, trackAction }
}

/**
 * Wrapper pour les appels API avec tracking automatique
 */
export async function trackApiCall<T>(
  apiCall: () => Promise<T>,
  context: { endpoint: string; method: string }
): Promise<T> {
  const startTime = Date.now()

  addBreadcrumb({
    category: 'api',
    message: `${context.method} ${context.endpoint}`,
    level: 'info',
  })

  try {
    const result = await apiCall()
    
    addBreadcrumb({
      category: 'api',
      message: `${context.method} ${context.endpoint} succeeded`,
      level: 'info',
      data: { duration: Date.now() - startTime },
    })

    return result
  } catch (error) {
    captureException(error as Error, {
      action: `API ${context.method}`,
      metadata: {
        endpoint: context.endpoint,
        duration: Date.now() - startTime,
      },
    })
    throw error
  }
}

/**
 * Initialisation automatique des handlers d'erreurs globaux
 */
if (typeof window !== 'undefined') {
  // Erreurs JavaScript non capturées
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      action: 'uncaught-error',
      page: window.location.pathname,
    })
  })

  // Rejections de promesses non gérées
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    captureException(error, {
      action: 'unhandled-rejection',
      page: window.location.pathname,
    })
  })
}

export default {
  init: initErrorTracking,
  setUser,
  addBreadcrumb,
  captureException,
  captureMessage,
  trackApiCall,
  useErrorTracking,
}
