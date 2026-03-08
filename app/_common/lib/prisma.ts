import { Prisma, PrismaClient } from '@prisma/client'
import { createTenantExtension } from './prisma-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

type TenantClient = PrismaClient & {
  $extends: PrismaClient['$extends']
}

/**
 * Retourne un client Prisma étendu pour un cabinet donné.
 * Injecte automatiquement l'isolation applicative (where cabinetId).
 */
export function getPrismaClient(cabinetId: string, isSuperAdmin: boolean = false) {
  if (!isSuperAdmin && !cabinetId) {
    throw new Error('cabinetId is required for tenant-scoped Prisma client')
  }

  const baseClient: TenantClient = prisma

  // Extension: isolation applicative (where cabinetId injections)
  return baseClient.$extends(
    createTenantExtension(cabinetId, isSuperAdmin)
  ) as unknown as PrismaClient
}

/**
 * Applique les variables de session nécessaires au RLS.
 * Compatible avec l'ancienne signature (cabinetId, isSuperAdmin).
 */
export async function setRLSContext(
  clientOrCabinetId: PrismaClient | string,
  cabinetIdOrIsSuperAdmin?: string | boolean,
  maybeIsSuperAdmin?: boolean
) {
  let client: PrismaClient
  let cabinetId: string
  let isSuperAdmin: boolean

  if (typeof clientOrCabinetId === 'string') {
    client = prisma
    cabinetId = clientOrCabinetId
    isSuperAdmin = (cabinetIdOrIsSuperAdmin as boolean) ?? false
  } else {
    client = clientOrCabinetId
    cabinetId = cabinetIdOrIsSuperAdmin as string
    isSuperAdmin = maybeIsSuperAdmin ?? false
  }

  if (!client) {
    throw new Error('Prisma client instance is required to set RLS context')
  }

  if (!isSuperAdmin && !cabinetId) {
    throw new Error('cabinetId is required when applying RLS context')
  }

  // Utilise set_config pour éviter la limitation Postgres sur SET LOCAL avec paramètres
  await client.$executeRaw(
    Prisma.sql`SELECT set_config('app.current_cabinet_id', ${cabinetId}, true)`
  )
  await client.$executeRaw(
    Prisma.sql`SELECT set_config('app.is_superadmin', ${isSuperAdmin ? 'true' : 'false'}, true)`
  )
}
