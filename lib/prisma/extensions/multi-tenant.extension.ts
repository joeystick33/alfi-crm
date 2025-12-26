// FILE: lib/prisma/extensions/multi-tenant.extension.ts

import { Prisma } from '@prisma/client'

// ===========================================
// TYPES
// ===========================================

export interface TenantContext {
  cabinetId: string
  userId?: string
}

// ===========================================
// MODÈLES AVEC MULTI-TENANT (cabinetId)
// ===========================================

const MULTI_TENANT_MODELS = [
  'client',
  'actif',
  'passif',
  'contrat',
  'document',
  'tache',
  'rendezVous',
  'objectif',
  'projet',
  'opportunite',
  'kycDocument',
  'kycCheck',
  'notification',
  'campagne',
  'email',
  'template',
  'simulation',
  'apporteurAffaires',
  'auditLog',
  'invoice',
  'dossier',
  'campaign',
  'emailTemplate',
  'scenario',
  'emailMessage',
  'reclamation',
  'documentTemplate',
  'event',
  'revenue',
  'expense',
  'credit',
  'bienMobilier',
  'interlocuteur',
  'epargneSalariale',
  'protectionSocialePro',
  'financementPro',
  'immobilierPro',
  'patrimoineFinancierPro',
] as const

type MultiTenantModel = (typeof MULTI_TENANT_MODELS)[number]

// ===========================================
// EXTENSION MULTI-TENANT
// ===========================================

/**
 * Extension Prisma pour le filtrage automatique multi-tenant
 * Ajoute automatiquement le cabinetId aux requêtes
 */
export function createMultiTenantExtension(context: TenantContext) {
  return Prisma.defineExtension({
    name: 'multi-tenant',
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async findFirst({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async findUnique({ model, operation, args, query }) {
          // Pour findUnique, on ne peut pas modifier le where
          // La vérification se fait après
          const result = await query(args)
          if (result && isMultiTenantModel(model)) {
            const record = result as { cabinetId?: string }
            if (record.cabinetId && record.cabinetId !== context.cabinetId) {
              return null // Masquer les données d'autres cabinets
            }
          }
          return result
        },
        async create({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args as any).data = {
              ...(args as any).data,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async createMany({ model, operation, args, query }) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const argsAny = args as any
          if (isMultiTenantModel(model) && Array.isArray(argsAny.data)) {
            argsAny.data = argsAny.data.map((item: Record<string, unknown>) => ({
              ...item,
              cabinetId: context.cabinetId,
            }))
          }
          return query(args)
        },
        async update({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            // Ajouter le filtre cabinet pour la sécurité
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async updateMany({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async delete({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async deleteMany({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async count({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async aggregate({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
        async groupBy({ model, operation, args, query }) {
          if (isMultiTenantModel(model)) {
            args.where = {
              ...args.where,
              cabinetId: context.cabinetId,
            }
          }
          return query(args)
        },
      },
    },
  })
}

// ===========================================
// HELPERS
// ===========================================

function isMultiTenantModel(model: string): model is MultiTenantModel {
  return MULTI_TENANT_MODELS.includes(model.toLowerCase() as MultiTenantModel)
}

/**
 * Vérifie si un utilisateur a accès à un enregistrement
 */
export function verifyTenantAccess(
  record: { cabinetId?: string } | null,
  context: TenantContext
): boolean {
  if (!record) return false
  return record.cabinetId === context.cabinetId
}
