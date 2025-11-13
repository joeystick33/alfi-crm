/**
 * Liste des modèles qui ont un champ cabinetId
 * Ces modèles nécessitent une isolation par cabinet
 */
const MODELS_WITH_CABINET_ID = [
  'Cabinet',
  'User',
  'AssistantAssignment',
  'ApporteurAffaires',
  'Client',
  'Actif',
  'Passif',
  'Contrat',
  'Document',
  'Objectif',
  'Projet',
  'Opportunite',
  'Tache',
  'RendezVous',
  'Email',
  'Notification',
  'Campagne',
  'Template',
  'Simulation',
  'Reclamation',
  'AuditLog',
  'ExportJob',
]

/**
 * Vérifie si un modèle a un champ cabinetId
 */
function hasCabinetId(modelName: string): boolean {
  return MODELS_WITH_CABINET_ID.includes(modelName)
}

/**
 * Crée un middleware Prisma pour l'isolation multi-tenant
 * 
 * @param cabinetId - ID du cabinet pour l'isolation des données
 * @param isSuperAdmin - Si true, bypass l'isolation (accès à tous les cabinets)
 * @returns Middleware Prisma
 */
export function createTenantMiddleware(
  cabinetId: string,
  isSuperAdmin: boolean = false
) {
  return async (params: any, next: any) => {
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
        ...params.args.where,
        cabinetId,
      }
    }

    // Actions de création: injecter automatiquement le cabinetId
    if (params.action === 'create') {
      params.args = params.args || {}
      params.args.data = {
        ...params.args.data,
        cabinetId,
      }
    }

    // Actions de création multiple: injecter le cabinetId dans chaque élément
    if (params.action === 'createMany') {
      params.args = params.args || {}
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          cabinetId,
        }))
      } else {
        params.args.data = {
          ...params.args.data,
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
        ...params.args.where,
        cabinetId,
      }
    }

    // Actions de suppression: ajouter le filtre cabinetId
    if (params.action === 'delete' || params.action === 'deleteMany') {
      params.args = params.args || {}
      params.args.where = {
        ...params.args.where,
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
  return async (params: any, next: any) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()

    console.log(
      `[Prisma] ${params.model}.${params.action} took ${after - before}ms`
    )

    return result
  }
}

/**
 * Crée un middleware pour l'audit automatique des modifications
 * Enregistre automatiquement les changements dans AuditLog
 */
export function createAuditMiddleware(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return async (params: any, next: any) => {
    const result = await next(params)

    // Actions à auditer
    const auditableActions = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany']
    
    if (
      params.model &&
      auditableActions.includes(params.action) &&
      params.model !== 'AuditLog' // Éviter la récursion infinie
    ) {
      // TODO: Implémenter la création d'AuditLog
      // Cela nécessite d'avoir accès au client Prisma
      // Pour l'instant, on log juste l'action
      console.log('[Audit]', {
        userId,
        action: params.action,
        model: params.model,
        timestamp: new Date().toISOString(),
      })
    }

    return result
  }
}
