/**
 * Seeder complet pour les fournisseurs et leurs produits
 * 
 * Utilise la base de données JSON providers-products.json
 * pour créer tous les fournisseurs et leurs produits réels.
 * 
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-providers-complete.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface Product {
  name: string
  code: string
  type: string
  minInvestment: number
}

interface Provider {
  name: string
  siren: string
  type: string
  products: Product[]
}

interface ProvidersData {
  metadata: {
    version: string
    lastUpdate: string
    description: string
  }
  providers: Provider[]
}

async function seedProvidersComplete(cabinetId: string) {
  console.log('🏦 Seeding providers and products for cabinet:', cabinetId)

  // Charger les données JSON
  const dataPath = path.join(__dirname, 'data', 'providers-products.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const data: ProvidersData = JSON.parse(rawData)

  console.log(`📦 Found ${data.providers.length} providers in database`)

  let providersCreated = 0
  let productsCreated = 0

  for (const providerData of data.providers) {
    // Vérifier si le provider existe déjà
    let provider = await prisma.operationProvider.findFirst({
      where: {
        cabinetId,
        name: providerData.name,
      },
    })

    if (!provider) {
      // Créer le provider
      provider = await prisma.operationProvider.create({
        data: {
          cabinetId,
          name: providerData.name,
          siren: providerData.siren,
          type: providerData.type as any,
          conventionStatus: 'ACTIVE',
          isFavorite: false,
        },
      })
      providersCreated++
      console.log(`  ✅ Created provider: ${providerData.name}`)
    } else {
      console.log(`  ⏭️  Provider exists: ${providerData.name}`)
    }

    // Créer les produits
    for (const productData of providerData.products) {
      // Vérifier si le produit existe déjà
      const existingProduct = await prisma.operationProduct.findFirst({
        where: {
          providerId: provider.id,
          code: productData.code,
        },
      })

      if (!existingProduct) {
        await prisma.operationProduct.create({
          data: {
            providerId: provider.id,
            name: productData.name,
            code: productData.code,
            type: productData.type as any,
            characteristics: {
              entryFees: { min: 0, max: 5, default: 2 },
              managementFees: { min: 0.5, max: 1.5, default: 0.8 },
            },
            minimumInvestment: productData.minInvestment,
            isActive: true,
          },
        })
        productsCreated++
      }
    }
  }

  console.log(`\n📊 Summary for cabinet ${cabinetId}:`)
  console.log(`   - Providers created: ${providersCreated}`)
  console.log(`   - Products created: ${productsCreated}`)
}

async function main() {
  console.log('🚀 Starting complete providers seeding...\n')

  // Récupérer tous les cabinets
  const cabinets = await prisma.cabinet.findMany({
    where: {
      OR: [
        { status: 'ACTIVE' },
        { status: 'TRIALING' },
      ],
    },
  })

  if (cabinets.length === 0) {
    console.log('❌ No active cabinets found.')
    return
  }

  console.log(`📋 Found ${cabinets.length} cabinet(s)\n`)

  for (const cabinet of cabinets) {
    await seedProvidersComplete(cabinet.id)
    console.log('')
  }

  console.log('✅ All providers and products seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
