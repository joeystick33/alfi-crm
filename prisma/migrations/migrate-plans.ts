/**
 * Script de migration des plans
 * 
 * Migre les cabinets ayant des plans ENTERPRISE ou CUSTOM vers PREMIUM
 * 
 * Usage: npx tsx prisma/migrations/migrate-plans.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Début de la migration des plans...\n')

  // 1. Trouver tous les cabinets avec des plans obsolètes
  const obsoletePlans = ['ENTERPRISE', 'CUSTOM']
  
  const cabinetsToMigrate = await prisma.cabinet.findMany({
    where: {
      plan: {
        in: obsoletePlans as any,
      },
    },
    select: {
      id: true,
      name: true,
      plan: true,
      email: true,
    },
  })

  console.log(`📋 Cabinets à migrer: ${cabinetsToMigrate.length}`)

  if (cabinetsToMigrate.length === 0) {
    console.log('✅ Aucun cabinet à migrer.')
    return
  }

  // 2. Afficher les cabinets concernés
  console.log('\nCabinets concernés:')
  cabinetsToMigrate.forEach((cabinet, index) => {
    console.log(`  ${index + 1}. ${cabinet.name} (${cabinet.email}) - Plan actuel: ${cabinet.plan}`)
  })

  // 3. Migrer vers PREMIUM (équivalent le plus proche)
  console.log('\n🔄 Migration vers PREMIUM...')
  
  const result = await prisma.cabinet.updateMany({
    where: {
      plan: {
        in: obsoletePlans as any,
      },
    },
    data: {
      plan: 'PREMIUM',
      updatedAt: new Date(),
    },
  })

  console.log(`✅ ${result.count} cabinet(s) migré(s) vers PREMIUM`)

  // 4. Vérification
  console.log('\n📊 Vérification de la distribution des plans:')
  const planDistribution = await prisma.cabinet.groupBy({
    by: ['plan'],
    _count: {
      id: true,
    },
  })

  planDistribution.forEach((item) => {
    console.log(`  - ${item.plan}: ${item._count.id} cabinet(s)`)
  })

  console.log('\n✅ Migration terminée avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
