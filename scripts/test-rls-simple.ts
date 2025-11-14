/**
 * Script de test simplifié de l'isolation multi-tenant (RLS)
 * Version qui fonctionne avec le schéma actuel de la base de données
 * 
 * Usage: npx tsx scripts/test-rls-simple.ts
 */

import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from '../lib/prisma'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logTest(test: string, passed: boolean, message: string, details?: any) {
  results.push({ test, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2))
  }
}

/**
 * Test principal: Vérifier l'isolation avec les cabinets existants
 */
async function testWithExistingData() {
  console.log('\n🧪 Test: Isolation avec les données existantes')
  
  try {
    // Récupérer tous les cabinets
    const cabinets = await prisma.cabinet.findMany({
      take: 2,
      include: {
        users: { take: 1 },
        clients: { take: 5 }
      }
    })
    
    if (cabinets.length < 1) {
      logTest(
        'Données existantes',
        false,
        'Aucun cabinet trouvé dans la base de données. Créez d\'abord des données de test.',
        null
      )
      return false
    }
    
    console.log(`\n📊 Trouvé ${cabinets.length} cabinet(s) dans la base`)
    
    for (const cabinet of cabinets) {
      console.log(`   - ${cabinet.name} (${cabinet.id}): ${cabinet.clients.length} clients`)
    }
    
    // Test avec le premier cabinet
    const cabinet1 = cabinets[0]
    const prisma1 = getPrismaClient(cabinet1.id, false)
    
    // Lister les clients du cabinet 1
    const clients1 = await prisma1.client.findMany()
    
    const allBelongToCabinet1 = clients1.every(c => c.cabinetId === cabinet1.id)
    
    logTest(
      `Cabinet "${cabinet1.name}" voit uniquement ses clients`,
      allBelongToCabinet1,
      allBelongToCabinet1
        ? `${clients1.length} clients, tous avec cabinetId = ${cabinet1.id}`
        : `ALERTE: Certains clients ont un cabinetId différent!`,
      {
        cabinetId: cabinet1.id,
        clientCount: clients1.length,
        cabinetIds: [...new Set(clients1.map(c => c.cabinetId))]
      }
    )
    
    // Si on a 2 cabinets, tester l'isolation entre eux
    if (cabinets.length >= 2) {
      const cabinet2 = cabinets[1]
      const prisma2 = getPrismaClient(cabinet2.id, false)
      
      const clients2 = await prisma2.client.findMany()
      const allBelongToCabinet2 = clients2.every(c => c.cabinetId === cabinet2.id)
      
      logTest(
        `Cabinet "${cabinet2.name}" voit uniquement ses clients`,
        allBelongToCabinet2,
        allBelongToCabinet2
          ? `${clients2.length} clients, tous avec cabinetId = ${cabinet2.id}`
          : `ALERTE: Certains clients ont un cabinetId différent!`,
        {
          cabinetId: cabinet2.id,
          clientCount: clients2.length,
          cabinetIds: [...new Set(clients2.map(c => c.cabinetId))]
        }
      )
      
      // Vérifier qu'il n'y a pas de chevauchement
      const client1Ids = new Set(clients1.map(c => c.id))
      const client2Ids = new Set(clients2.map(c => c.id))
      const overlap = [...client1Ids].filter(id => client2Ids.has(id))
      
      logTest(
        'Aucun chevauchement entre les cabinets',
        overlap.length === 0,
        overlap.length === 0
          ? 'Isolation confirmée: aucun client partagé'
          : `ALERTE: ${overlap.length} clients visibles par les 2 cabinets!`,
        { overlapCount: overlap.length, overlapIds: overlap }
      )
      
      // Tester qu'un cabinet ne peut pas voir un client spécifique de l'autre
      if (clients2.length > 0) {
        const client2Id = clients2[0].id
        const clientInCabinet1 = await prisma1.client.findFirst({
          where: { id: client2Id }
        })
        
        logTest(
          `Cabinet 1 ne peut pas voir les clients de Cabinet 2`,
          clientInCabinet1 === null,
          clientInCabinet1 === null
            ? 'Isolation confirmée'
            : `ALERTE: Cabinet 1 peut voir le client ${client2Id} de Cabinet 2!`,
          { clientId: client2Id, foundInCabinet1: clientInCabinet1 !== null }
        )
      }
    }
    
    // Test SuperAdmin
    console.log('\n🧪 Test: Mode SuperAdmin')
    const prismaSuperAdmin = getPrismaClient(cabinet1.id, true)
    const allClients = await prismaSuperAdmin.client.findMany()
    
    const totalClientsExpected = cabinets.reduce((sum, c) => sum + c.clients.length, 0)
    const canSeeAll = allClients.length >= totalClientsExpected
    
    logTest(
      'SuperAdmin peut voir tous les clients',
      canSeeAll,
      canSeeAll
        ? `SuperAdmin voit ${allClients.length} clients (attendu: >= ${totalClientsExpected})`
        : `SuperAdmin voit seulement ${allClients.length} clients au lieu de >= ${totalClientsExpected}`,
      {
        totalClients: allClients.length,
        expectedMin: totalClientsExpected,
        cabinetIds: [...new Set(allClients.map(c => c.cabinetId))]
      }
    )
    
    return true
    
  } catch (error: any) {
    console.error('\n❌ Erreur lors du test:', error.message)
    return false
  }
}

/**
 * Génère un rapport de test
 */
function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RAPPORT DE TEST RLS')
  console.log('='.repeat(60))
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0'
  
  console.log(`\nTotal de tests: ${totalTests}`)
  console.log(`✅ Réussis: ${passedTests}`)
  console.log(`❌ Échoués: ${failedTests}`)
  console.log(`📈 Taux de réussite: ${successRate}%`)
  
  if (failedTests > 0) {
    console.log('\n⚠️  TESTS ÉCHOUÉS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (failedTests === 0 && totalTests > 0) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!')
    console.log('🔒 L\'isolation multi-tenant (RLS) fonctionne correctement.')
  } else if (totalTests === 0) {
    console.log('⚠️  AUCUN TEST EXÉCUTÉ')
    console.log('Créez d\'abord des données de test dans la base.')
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ!')
    console.log('⚠️  L\'isolation multi-tenant présente des failles de sécurité.')
  }
  
  console.log('='.repeat(60) + '\n')
  
  return failedTests === 0 && totalTests > 0
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Test d\'isolation multi-tenant (RLS) - Version simplifiée\n')
  console.log('ℹ️  Ce test utilise les données existantes dans la base de données.')
  console.log('ℹ️  Assurez-vous d\'avoir au moins 1 cabinet avec des clients.\n')
  
  try {
    await testWithExistingData()
    const allPassed = generateReport()
    process.exit(allPassed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ Erreur fatale lors des tests:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
main()
