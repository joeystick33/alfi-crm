/**
 * Logger structuré pour le CRM Aura
 * Format JSON pour faciliter l'indexation et l'analyse
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  userId?: string
  clientId?: string
  advisorId?: string
  sessionId?: string
  requestId?: string
  action?: string
  module?: string
  duration?: number
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, unknown>
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// En production, on n'affiche que les warnings et erreurs par défaut
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (IS_PRODUCTION ? 'warn' : 'info')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: (error as Error & { code?: string }).code,
    }
  }

  return entry
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return

  const entry = createLogEntry(level, message, context, error)
  const formattedEntry = formatLogEntry(entry)

  switch (level) {
    case 'debug':
      console.debug(formattedEntry)
      break
    case 'info':
      console.info(formattedEntry)
      break
    case 'warn':
      console.warn(formattedEntry)
      break
    case 'error':
    case 'fatal':
      console.error(formattedEntry)
      break
  }
}

/**
 * Logger principal
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
  fatal: (message: string, context?: LogContext, error?: Error) => log('fatal', message, context, error),
}

/**
 * Logger pour les API routes
 */
export function createApiLogger(module: string, requestId?: string) {
  const baseContext: LogContext = { module, requestId }

  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...baseContext, ...context }),
    
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...baseContext, ...context }),
    
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...baseContext, ...context }),
    
    error: (message: string, context?: LogContext, error?: Error) => 
      logger.error(message, { ...baseContext, ...context }, error),

    /**
     * Log une action avec sa durée
     */
    action: (action: string, context?: LogContext) => {
      const start = Date.now()
      return {
        success: (_result?: unknown) => {
          logger.info(`${action} completed`, {
            ...baseContext,
            ...context,
            action,
            duration: Date.now() - start,
            success: true,
          })
        },
        failure: (error: Error) => {
          logger.error(`${action} failed`, {
            ...baseContext,
            ...context,
            action,
            duration: Date.now() - start,
            success: false,
          }, error)
        },
      }
    },
  }
}

/**
 * Log les événements de sécurité/audit
 */
export const auditLogger = {
  /**
   * Log une connexion utilisateur
   */
  login: (userId: string, success: boolean, ip?: string) => {
    logger.info('User login attempt', {
      userId,
      action: 'LOGIN',
      module: 'AUTH',
      metadata: { success, ip },
    } as LogContext)
  },

  /**
   * Log une modification de rôle
   */
  roleChange: (adminId: string, targetUserId: string, oldRole: string, newRole: string) => {
    logger.info('User role changed', {
      userId: adminId,
      action: 'ROLE_CHANGE',
      module: 'SETTINGS',
      metadata: { targetUserId, oldRole, newRole },
    } as LogContext)
  },

  /**
   * Log une action sensible sur les données
   */
  dataAccess: (userId: string, action: 'CREATION' | 'MODIFICATION' | 'SUPPRESSION', entity: string, entityId: string) => {
    logger.info(`Data ${action.toLowerCase()}`, {
      userId,
      action,
      module: 'DATA',
      metadata: { entity, entityId },
    } as LogContext)
  },

  /**
   * Log un accès à un dossier client
   */
  clientAccess: (userId: string, clientId: string, section?: string) => {
    logger.info('Client data accessed', {
      userId,
      clientId,
      action: 'ACCESS',
      module: 'CLIENT',
      metadata: { section },
    } as LogContext)
  },

  /**
   * Log une erreur de sécurité
   */
  securityEvent: (event: string, details: Record<string, unknown>) => {
    logger.warn(`Security event: ${event}`, {
      action: 'SECURITY',
      module: 'SECURITY',
      metadata: details,
    } as LogContext)
  },
}

/**
 * Log les événements métier importants
 */
export const businessLogger = {
  /**
   * Log la création d'un client
   */
  clientCreated: (advisorId: string, clientId: string, source?: string) => {
    logger.info('Client created', {
      advisorId,
      clientId,
      action: 'CLIENT_CREATED',
      module: 'CLIENTS',
      metadata: { source },
    } as LogContext)
  },

  /**
   * Log la détection d'opportunités
   */
  opportunitiesDetected: (clientId: string, count: number, types: string[]) => {
    logger.info('Opportunities detected', {
      clientId,
      action: 'OPPORTUNITIES_DETECTED',
      module: 'OPPORTUNITIES',
      metadata: { count, types },
    } as LogContext)
  },

  /**
   * Log l'exécution d'un simulateur
   */
  simulatorExecuted: (userId: string, simulator: string, duration: number, success: boolean) => {
    logger.info('Simulator executed', {
      userId,
      action: 'SIMULATOR_EXECUTED',
      module: 'SIMULATORS',
      duration,
      metadata: { simulator, success },
    } as LogContext)
  },

  /**
   * Log une modification de contrat
   */
  contractModified: (advisorId: string, clientId: string, contractId: string, action: string) => {
    logger.info('Contract modified', {
      advisorId,
      clientId,
      action: 'CONTRACT_MODIFIED',
      module: 'CONTRACTS',
      metadata: { contractId, action },
    } as LogContext)
  },

  /**
   * Log une mise à jour KYC
   */
  kycUpdated: (advisorId: string, clientId: string, status: string) => {
    logger.info('KYC status updated', {
      advisorId,
      clientId,
      action: 'KYC_UPDATED',
      module: 'KYC',
      metadata: { status },
    } as LogContext)
  },
}

export default logger
