import { logger, auditLogger } from './logger'
import { PrismaClient } from '@prisma/client'

const globalForAuditPrisma = globalThis as unknown as {
  auditPrisma: PrismaClient | undefined
}

const globalPrisma = globalForAuditPrisma.auditPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForAuditPrisma.auditPrisma = globalPrisma
}

/**
 * Liste des modèles qui ont un champ cabinetId
 * Ces modèles nécessitent une isolation par cabinet
 */
const MODELS_WITH_CABINET_ID = [
  'User',
  'AssistantAssignment',
  'ApporteurAffaires',
  'Client',
  'Actif',
  'Passif',
  'Contrat',
  'Document',
  'DocumentTemplate',
  'KYCDocument',
  'KYCCheck',
  'Objectif',
  'Projet',
  'Opportunite',
  'Tache',
  'RendezVous',
  'Event',
  'AppointmentType',
  'CalendarSync',
  'Email',
  'SyncedEmail',
  'EmailTemplate',
  'Notification',
  'Campagne',
  'Template',
  'TimelineEvent',
  'Simulation',
  'Consentement',
  'Reclamation',
  'AuditLog',
  'ExportJob',
  'CommercialAction',
  'Entretien',
]

/**
 * Vérifie si un modèle a un champ cabinetId
 */
function hasCabinetId(modelName: string): boolean {
  return MODELS_WITH_CABINET_ID.includes(modelName)
}

/**
 * Crée une extension Prisma pour l'isolation multi-tenant
 * 
 * @param cabinetId - ID du cabinet pour l'isolation des données
 * @param isSuperAdmin - Si true, bypass l'isolation (accès à tous les cabinets)
 * @returns Extension Prisma
 */
export function createTenantExtension(
  cabinetId: string,
  isSuperAdmin: boolean = false
) {
  return {
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model: string; operation: string; args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) {
          // SuperAdmin bypass - accès à toutes les données
          if (isSuperAdmin) {
            return query(args)
          }

          // Vérifier si le modèle a un cabinetId
          if (!model || !hasCabinetId(model)) {
            return query(args)
          }

          // ── READ operations: inject cabinetId into where clause ──
          if (
            operation === 'findFirst' ||
            operation === 'findMany' ||
            operation === 'findUnique' ||
            operation === 'count' ||
            operation === 'aggregate' ||
            operation === 'groupBy'
          ) {
            args = args || {}
            const where = (args.where as Record<string, unknown>) || {}
            args.where = {
              ...where,
              cabinetId,
            }
          }

          // ── WRITE operations with where clause: inject cabinetId ──
          if (
            operation === 'update' ||
            operation === 'delete' ||
            operation === 'upsert' ||
            operation === 'updateMany' ||
            operation === 'deleteMany'
          ) {
            args = args || {}
            const where = (args.where as Record<string, unknown>) || {}
            args.where = {
              ...where,
              cabinetId,
            }
          }

          // ── CREATE operations: inject cabinetId into data ──
          if (operation === 'create') {
            args = args || {}
            const data = (args.data as Record<string, unknown>) || {}
            args.data = {
              ...data,
              cabinetId,
            }
          }

          if (operation === 'createMany') {
            args = args || {}
            if (Array.isArray(args.data)) {
              args.data = (args.data as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
                ...item,
                cabinetId,
              }))
            } else {
              const data = (args.data as Record<string, unknown>) || {}
              args.data = {
                ...data,
                cabinetId,
              }
            }
          }

          // ── UPSERT: also inject cabinetId into create data ──
          if (operation === 'upsert' && args.create) {
            const createData = (args.create as Record<string, unknown>) || {}
            args.create = { ...createData, cabinetId }
          }

          return query(args)
        },
      },
    },
  }
}

interface MiddlewareParams {
  model?: string
  action?: string
  args?: {
    where?: Record<string, unknown>
    data?: Record<string, unknown> | Record<string, unknown>[]
  }
}

/**
 * Crée un middleware Prisma pour l'isolation multi-tenant (legacy)
 * @deprecated Utilisez createTenantExtension à la place
 */
export function createTenantMiddleware(
  cabinetId: string,
  isSuperAdmin: boolean = false
) {
  return async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<unknown>) => {
    // SuperAdmin bypass - accès à toutes les données
    if (isSuperAdmin) {
      return next(params)
    }

    // Vérifier si le modèle a un cabinetId
    if (!params.model || !hasCabinetId(params.model)) {
      return next(params)
    }

    // Actions de lecture: ajouter le filtre cabinetId
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'findMany' ||
      params.action === 'count' ||
      params.action === 'aggregate'
    ) {
      params.args = params.args || {}
      params.args.where = {
        ...(params.args.where || {}),
        cabinetId,
      }
    }

    // Actions de création: injecter automatiquement le cabinetId
    if (params.action === 'create') {
      params.args = params.args || {}
      params.args.data = {
        ...((params.args.data as Record<string, unknown>) || {}),
        cabinetId,
      }
    }

    // Actions de création multiple: injecter le cabinetId dans chaque élément
    if (params.action === 'createMany') {
      params.args = params.args || {}
      if (Array.isArray(params.args.data)) {
        params.args.data = (params.args.data as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
          ...item,
          cabinetId,
        }))
      } else {
        params.args.data = {
          ...((params.args.data as Record<string, unknown>) || {}),
          cabinetId,
        }
      }
    }

    // Actions de mise à jour: ajouter le filtre cabinetId
    if (
      params.action === 'update' ||
      params.action === 'updateMany' ||
      params.action === 'upsert'
    ) {
      params.args = params.args || {}
      params.args.where = {
        ...(params.args.where || {}),
        cabinetId,
      }
    }

    // Actions de suppression: ajouter le filtre cabinetId
    if (params.action === 'delete' || params.action === 'deleteMany') {
      params.args = params.args || {}
      params.args.where = {
        ...(params.args.where || {}),
        cabinetId,
      }
    }

    return next(params)
  }
}

/**
 * Crée un middleware pour logger les requêtes (utile pour le debug)
 */
export function createLoggingMiddleware() {
  return async (params: { model: string; action: string }, next: (params: { model: string; action: string }) => Promise<unknown>) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()

    logger.debug(`${params.model}.${params.action} took ${after - before}ms`, {
      module: 'Prisma',
      duration: after - before,
      action: `${params.model}.${params.action}`,
    })

    return result
  }
}

/**
 * Crée un middleware pour l'audit automatique des modifications
 * Enregistre automatiquement les changements dans AuditLog
 */
/** Modèles sensibles nécessitant un audit systématique */
const AUDITABLE_MODELS = [
  'Client', 'Actif', 'Passif', 'Contrat', 'Document',
  'KYCDocument', 'KYCCheck', 'Consentement', 'Reclamation',
  'User', 'Entretien', 'Opportunite', 'Revenue', 'Expense', 'Credit',
  'AffaireNouvelle', 'OperationGestion', 'RegulatoryGeneratedDocument',
]

/** Mappe les actions Prisma vers les types d'audit */
function mapActionToAuditType(action: string): import('@prisma/client').$Enums.AuditAction {
  if (action.startsWith('create')) return 'CREATION'
  if (action.startsWith('update') || action === 'upsert') return 'MODIFICATION'
  if (action.startsWith('delete')) return 'SUPPRESSION'
  if (action.startsWith('find') || action === 'aggregate' || action === 'count') return 'CONSULTATION'
  return 'CONSULTATION'
}

export function createAuditMiddleware(
  userId: string,
  cabinetId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  return async (params: { model: string; action: string; args?: any }, next: (params: any) => Promise<unknown>) => {
    const result = await next(params)

    const auditableActions = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany', 'upsert']

    if (
      params.model &&
      auditableActions.includes(params.action) &&
      params.model !== 'AuditLog' &&
      AUDITABLE_MODELS.includes(params.model)
    ) {
      // Extraire l'ID de l'entité modifiée si disponible
      const entityId = (result as any)?.id
        || params.args?.where?.id
        || undefined

      // Créer l'audit log de manière asynchrone (non-bloquant)
      try {
        await globalPrisma.auditLog.create({
          data: {
            cabinetId: cabinetId || '',
            userId,
            action: mapActionToAuditType(params.action),
            entityType: params.model,
            entityId: entityId ? String(entityId) : undefined,
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
          },
        })
      } catch (auditError) {
        // L'échec de l'audit ne doit jamais bloquer l'opération métier
        logger.warn('Failed to create audit log entry', {
          module: 'AuditMiddleware',
          action: params.action,
          metadata: {
            model: params.model,
            entityId,
            error: auditError instanceof Error ? auditError.message : 'Unknown',
          },
        } as any)
      }
    }

    return result
  }
}
