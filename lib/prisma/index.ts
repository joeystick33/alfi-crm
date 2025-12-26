// FILE: lib/prisma/index.ts

import { PrismaClient } from '@prisma/client'
import { createMultiTenantExtension, TenantContext } from './extensions/multi-tenant.extension'

// ===========================================
// GLOBAL PRISMA CLIENT (SINGLETON)
// ===========================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ===========================================
// CLIENT AVEC CONTEXTE MULTI-TENANT
// ===========================================

export type PrismaClientWithContext = ReturnType<typeof createPrismaWithContext>

/**
 * Crée un client Prisma avec contexte multi-tenant
 * Utiliser dans les routes API et server actions
 * 
 * @example
 * const db = createPrismaWithContext({ cabinetId: 'xxx', userId: 'yyy' })
 * const clients = await db.client.findMany() // Filtré automatiquement par cabinetId
 */
export function createPrismaWithContext(context: TenantContext) {
  return prisma.$extends(createMultiTenantExtension(context))
}

// ===========================================
// HELPER: GET PRISMA FROM REQUEST CONTEXT
// ===========================================

/**
 * Crée un client Prisma à partir du contexte de requête
 * À utiliser dans les route handlers API
 */
export function getPrismaForRequest(cabinetId: string, userId?: string) {
  if (!cabinetId) {
    throw new Error('cabinetId is required for multi-tenant queries')
  }
  return createPrismaWithContext({ cabinetId, userId })
}

// ===========================================
// EXPORTS
// ===========================================

export type { TenantContext } from './extensions/multi-tenant.extension'
export default prisma
