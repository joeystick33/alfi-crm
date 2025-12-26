import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Mise à jour des cabinets avec statut ACTIF vers ACTIVE
  const result = await prisma.$executeRaw`UPDATE "Cabinet" SET status = 'ACTIVE' WHERE status = 'ACTIF'`
  console.log('Updated', result, 'cabinets')
  
  // Afficher les cabinets actuels
  const cabinets = await prisma.cabinet.findMany({ select: { id: true, name: true, status: true } })
  console.log('Current cabinets:', cabinets)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
