import { PrismaClient } from '@prisma/client'
import { createTenantExtension } from './prisma-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Crée un client Prisma avec isolation multi-tenant
 * À utiliser dans les API routes et les server components
 * 
 * @param cabinetId - ID du cabinet pour l'isolation des données
 * @param isSuperAdmin - Si true, bypass l'isolation (accès à tous les cabinets)
 * @returns Client Prisma avec extension appliquée
 */
export function getPrismaClient(cabinetId: string, isSuperAdmin: boolean = false) {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Appliquer l'extension d'isolation multi-tenant
  return client.$extends(createTenantExtension(cabinetId, isSuperAdmin)) as any
}

/**
 * Configure les paramètres de session PostgreSQL pour RLS
 * À appeler au début de chaque requête pour activer Row Level Security
 * 
 * @param cabinetId - ID du cabinet
 * @param isSuperAdmin - Si l'utilisateur est SuperAdmin
 */
export async function setRLSContext(
  cabinetId: string,
  isSuperAdmin: boolean = false
) {
  await prisma.$executeRawUnsafe(
    `SET LOCAL app.current_cabinet_id = '${cabinetId}'`
  )
  await prisma.$executeRawUnsafe(
    `SET LOCAL app.is_superadmin = ${isSuperAdmin}`
  )
}
