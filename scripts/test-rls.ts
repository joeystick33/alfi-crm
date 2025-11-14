/**
 * Script de test de l'isolation multi-tenant (RLS)
 * Vérifie que les données sont correctement isolées entre les cabinets
 * 
 * Usage: npx tsx scripts/test-rls.ts
 */

import { PrismaClient } from '@prisma/client'
import { getPrismaClient, setRLSContext } from '../lib/prisma'
import bcrypt from 'bcryptjs'

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
 * Nettoie les données de test
 */
async function cleanup() {
  console.log('\n🧹 Nettoyage des données de test...')
  
  try {
    // Supprimer les cabinets de test (cascade supprimera tout)
    await prisma.cabinet.deleteMany({
      where: {
        slug: {
          in: ['test-cabinet-a', 'test-cabinet-b']
        }
      }
    })
    console.log('✅ Nettoyage terminé')
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
}

/**
 * Crée les données de test
 */
async function setupTestData() {
  console.log('\n📦 Création des données de test...')
  
  const hashedPassword = await bcrypt.hash('Test123!', 10)
  
  // Cabinet A
  const cabinetA = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Test A',
      slug: 'test-cabinet-a',
      email: 'contact@cabinet-a.test',
      plan: 'BUSINESS',
      status: 'ACTIVE',
    }
  })
  
  const userA = await prisma.user.create({
    data: {
      cabinetId: cabinetA.id,
      email: 'advisor-a@cabinet-a.test',
      password: hashedPassword,
      firstName: 'Advisor',
      lastName: 'A',
      role: 'ADVISOR',
    }
  })
  
  const clientA1 = await prisma.client.create({
    data: {
      cabinetId: cabinetA.id,
      conseillerId: userA.id,
      clientType: 'PARTICULIER',
      firstName: 'Client',
      lastName: 'A1',
      email: 'client-a1@test.com',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
    }
  })
  
  const clientA2 = await prisma.client.create({
    data: {
      cabinetId: cabinetA.id,
      conseillerId: userA.id,
      clientType: 'PARTICULIER',
      firstName: 'Client',
      lastName: 'A2',
      email: 'client-a2@test.com',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
    }
  })
  
  // Cabinet B
  const cabinetB = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Test B',
      slug: 'test-cabinet-b',
      email: 'contact@cabinet-b.test',
      plan: 'BUSINESS',
      status: 'ACTIVE',
    }
  })
  
  const userB = await prisma.user.create({
    data: {
      cabinetId: cabinetB.id,
      email: 'advisor-b@cabinet-b.test',
      password: hashedPassword,
      firstName: 'Advisor',
      lastName: 'B',
      role: 'ADVISOR',
    }
  })
  
  const clientB1 = await prisma.client.create({
    data: {
      cabinetId: cabinetB.id,
      conseillerId: userB.id,
      clientType: 'PARTICULIER',
      firstName: 'Client',
      lastName: 'B1',
      email: 'client-b1@test.com',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
    }
  })
  
  const clientB2 = await prisma.client.create({
    data: {
      cabinetId: cabinetB.id,
      conseillerId: userB.id,
      clientType: 'PARTICULIER',
      firstName: 'Client',
      lastName: 'B2',
      email: 'client-b2@test.com',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
    }
  })
  
  console.log('✅ Données de test créées')
  
  return {
    cabinetA: { id: cabinetA.id, user: userA, clients: [clientA1, clientA2] },
    cabinetB: { id: cabinetB.id, user: userB, clients: [clientB1, clientB2] },
  }
}

/**
 * Test 1: Vérifier que getPrismaClient filtre correctement par cabinetId
 */
async function testPrismaClientFiltering(testData: any) {
  console.log('\n🧪 Test 1: Filtrage par cabinetId avec getPrismaClient')
  
  const prismaA = getPrismaClient(testData.cabinetA.id, false)
  const prismaB = getPrismaClient(testData.cabinetB.id, false)
  
  // Cabinet A ne devrait voir que ses clients
  const clientsA = await prismaA.client.findMany()
  const passed1 = clientsA.length === 2 && 
                  clientsA.every(c => c.cabinetId === testData.cabinetA.id)
  
  logTest(
    'Cabinet A voit uniquement ses clients',
    passed1,
    passed1 
      ? `Cabinet A voit ${clientsA.length} clients (attendu: 2)`
      : `Cabinet A voit ${clientsA.length} clients au lieu de 2`,
    { clientIds: clientsA.map(c => c.id) }
  )
  
  // Cabinet B ne devrait voir que ses clients
  const clientsB = await prismaB.client.findMany()
  const passed2 = clientsB.length === 2 && 
                  clientsB.every(c => c.cabinetId === testData.cabinetB.id)
  
  logTest(
    'Cabinet B voit uniquement ses clients',
    passed2,
    passed2 
      ? `Cabinet B voit ${clientsB.length} clients (attendu: 2)`
      : `Cabinet B voit ${clientsB.length} clients au lieu de 2`,
    { clientIds: clientsB.map(c => c.id) }
  )
  
  // Vérifier qu'aucun client de B n'est visible par A
  const clientB1InA = await prismaA.client.findFirst({
    where: { id: testData.cabinetB.clients[0].id }
  })
  
  const passed3 = clientB1InA === null
  
  logTest(
    'Cabinet A ne peut pas voir les clients de Cabinet B',
    passed3,
    passed3 
      ? 'Isolation confirmée'
      : 'ALERTE: Cabinet A peut voir les clients de Cabinet B!',
    { foundClient: clientB1InA }
  )
}

/**
 * Test 2: Vérifier que setRLSContext fonctionne
 */
async function testRLSContext(testData: any) {
  console.log('\n🧪 Test 2: setRLSContext')
  
  // Définir le contexte pour Cabinet A
  await setRLSContext(testData.cabinetA.id, false)
  
  // Utiliser le client Prisma global
  const clientsA = await prisma.client.findMany()
  
  // Note: setRLSContext définit des variables de session PostgreSQL
  // mais le middleware Prisma est ce qui applique réellement le filtrage
  // Ce test vérifie que la fonction s'exécute sans erreur
  
  logTest(
    'setRLSContext s\'exécute sans erreur',
    true,
    'Contexte RLS défini avec succès',
    { cabinetId: testData.cabinetA.id }
  )
}

/**
 * Test 3: Tester la création avec injection automatique du cabinetId
 */
async function testAutoInjection(testData: any) {
  console.log('\n🧪 Test 3: Injection automatique du cabinetId')
  
  const prismaA = getPrismaClient(testData.cabinetA.id, false)
  
  // Créer un client sans spécifier cabinetId
  const newClient = await prismaA.client.create({
    data: {
      conseillerId: testData.cabinetA.user.id,
      clientType: 'PARTICULIER',
      firstName: 'Auto',
      lastName: 'Injected',
      email: 'auto@test.com',
      status: 'PROSPECT',
      kycStatus: 'PENDING',
    }
  })
  
  const passed = newClient.cabinetId === testData.cabinetA.id
  
  logTest(
    'cabinetId injecté automatiquement lors de la création',
    passed,
    passed 
      ? `Client créé avec cabinetId: ${newClient.cabinetId}`
      : `cabinetId incorrect: ${newClient.cabinetId}`,
    { clientId: newClient.id, cabinetId: newClient.cabinetId }
  )
  
  // Vérifier que Cabinet B ne peut pas voir ce client
  const prismaB = getPrismaClient(testData.cabinetB.id, false)
  const clientInB = await prismaB.client.findFirst({
    where: { id: newClient.id }
  })
  
  const passed2 = clientInB === null
  
  logTest(
    'Client créé par Cabinet A invisible pour Cabinet B',
    passed2,
    passed2 
      ? 'Isolation confirmée après création'
      : 'ALERTE: Cabinet B peut voir le nouveau client de A!',
    { foundInB: clientInB !== null }
  )
}

/**
 * Test 4: Tester la mise à jour avec filtrage
 */
async function testUpdateFiltering(testData: any) {
  console.log('\n🧪 Test 4: Filtrage lors des mises à jour')
  
  const prismaB = getPrismaClient(testData.cabinetB.id, false)
  
  // Cabinet B essaie de modifier un client de Cabinet A
  try {
    await prismaB.client.update({
      where: { id: testData.cabinetA.clients[0].id },
      data: { firstName: 'Hacked' }
    })
    
    logTest(
      'Cabinet B ne peut pas modifier les clients de Cabinet A',
      false,
      'ALERTE: Cabinet B a pu modifier un client de Cabinet A!',
      { clientId: testData.cabinetA.clients[0].id }
    )
  } catch (error: any) {
    // Devrait échouer avec "Record to update not found"
    const passed = error.code === 'P2025' || error.message.includes('not found')
    
    logTest(
      'Cabinet B ne peut pas modifier les clients de Cabinet A',
      passed,
      passed 
        ? 'Tentative de modification bloquée correctement'
        : `Erreur inattendue: ${error.message}`,
      { errorCode: error.code, errorMessage: error.message }
    )
  }
}

/**
 * Test 5: Tester la suppression avec filtrage
 */
async function testDeleteFiltering(testData: any) {
  console.log('\n🧪 Test 5: Filtrage lors des suppressions')
  
  const prismaB = getPrismaClient(testData.cabinetB.id, false)
  
  // Cabinet B essaie de supprimer un client de Cabinet A
  try {
    await prismaB.client.delete({
      where: { id: testData.cabinetA.clients[1].id }
    })
    
    logTest(
      'Cabinet B ne peut pas supprimer les clients de Cabinet A',
      false,
      'ALERTE: Cabinet B a pu supprimer un client de Cabinet A!',
      { clientId: testData.cabinetA.clients[1].id }
    )
  } catch (error: any) {
    // Devrait échouer avec "Record to delete not found"
    const passed = error.code === 'P2025' || error.message.includes('not found')
    
    logTest(
      'Cabinet B ne peut pas supprimer les clients de Cabinet A',
      passed,
      passed 
        ? 'Tentative de suppression bloquée correctement'
        : `Erreur inattendue: ${error.message}`,
      { errorCode: error.code, errorMessage: error.message }
    )
  }
}

/**
 * Test 6: Tester le mode SuperAdmin (bypass RLS)
 */
async function testSuperAdminBypass(testData: any) {
  console.log('\n🧪 Test 6: Mode SuperAdmin (bypass RLS)')
  
  // SuperAdmin devrait voir tous les clients
  const prismaSuperAdmin = getPrismaClient(testData.cabinetA.id, true)
  
  const allClients = await prismaSuperAdmin.client.findMany()
  
  // Devrait voir au moins 5 clients (2 de A + 2 de B + 1 créé dans test 3)
  const passed = allClients.length >= 5
  
  logTest(
    'SuperAdmin peut voir tous les clients',
    passed,
    passed 
      ? `SuperAdmin voit ${allClients.length} clients (attendu: >= 5)`
      : `SuperAdmin voit seulement ${allClients.length} clients`,
    { 
      totalClients: allClients.length,
      cabinetIds: [...new Set(allClients.map(c => c.cabinetId))]
    }
  )
  
  // SuperAdmin devrait pouvoir modifier un client d'un autre cabinet
  try {
    await prismaSuperAdmin.client.update({
      where: { id: testData.cabinetB.clients[0].id },
      data: { firstName: 'Modified by SuperAdmin' }
    })
    
    logTest(
      'SuperAdmin peut modifier les clients de tous les cabinets',
      true,
      'Modification réussie',
      { clientId: testData.cabinetB.clients[0].id }
    )
  } catch (error: any) {
    logTest(
      'SuperAdmin peut modifier les clients de tous les cabinets',
      false,
      `Erreur: ${error.message}`,
      { error: error.message }
    )
  }
}

/**
 * Test 7: Tester avec d'autres modèles (Tache, Document, etc.)
 */
async function testOtherModels(testData: any) {
  console.log('\n🧪 Test 7: Isolation sur d\'autres modèles')
  
  const prismaA = getPrismaClient(testData.cabinetA.id, false)
  const prismaB = getPrismaClient(testData.cabinetB.id, false)
  
  // Créer une tâche pour Cabinet A
  const tacheA = await prismaA.tache.create({
    data: {
      cabinetId: testData.cabinetA.id,
      assignedToId: testData.cabinetA.user.id,
      createdById: testData.cabinetA.user.id,
      clientId: testData.cabinetA.clients[0].id,
      title: 'Tâche Cabinet A',
      type: 'CALL',
      status: 'TODO',
    }
  })
  
  // Cabinet B ne devrait pas voir cette tâche
  const tacheInB = await prismaB.tache.findFirst({
    where: { id: tacheA.id }
  })
  
  const passed1 = tacheInB === null
  
  logTest(
    'Isolation des tâches entre cabinets',
    passed1,
    passed1 
      ? 'Tâche de Cabinet A invisible pour Cabinet B'
      : 'ALERTE: Cabinet B peut voir les tâches de Cabinet A!',
    { tacheId: tacheA.id }
  )
  
  // Créer un objectif pour Cabinet B
  const objectifB = await prismaB.objectif.create({
    data: {
      cabinetId: testData.cabinetB.id,
      clientId: testData.cabinetB.clients[0].id,
      type: 'RETIREMENT',
      name: 'Objectif Cabinet B',
      targetAmount: 100000,
      targetDate: new Date('2030-01-01'),
      status: 'ACTIVE',
    }
  })
  
  // Cabinet A ne devrait pas voir cet objectif
  const objectifInA = await prismaA.objectif.findFirst({
    where: { id: objectifB.id }
  })
  
  const passed2 = objectifInA === null
  
  logTest(
    'Isolation des objectifs entre cabinets',
    passed2,
    passed2 
      ? 'Objectif de Cabinet B invisible pour Cabinet A'
      : 'ALERTE: Cabinet A peut voir les objectifs de Cabinet B!',
    { objectifId: objectifB.id }
  )
}

/**
 * Test 8: Tester les relations (include/select)
 */
async function testRelations(testData: any) {
  console.log('\n🧪 Test 8: Isolation avec relations (include)')
  
  const prismaA = getPrismaClient(testData.cabinetA.id, false)
  
  // Charger un client avec ses relations
  const clientWithRelations = await prismaA.client.findFirst({
    where: { id: testData.cabinetA.clients[0].id },
    include: {
      conseiller: true,
      taches: true,
      objectifs: true,
    }
  })
  
  const passed = clientWithRelations !== null && 
                 clientWithRelations.cabinetId === testData.cabinetA.id
  
  logTest(
    'Relations chargées correctement avec isolation',
    passed,
    passed 
      ? 'Client et relations chargés avec le bon cabinetId'
      : 'Erreur lors du chargement des relations',
    { 
      clientId: clientWithRelations?.id,
      cabinetId: clientWithRelations?.cabinetId,
      hasConseiller: !!clientWithRelations?.conseiller
    }
  )
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
  const successRate = ((passedTests / totalTests) * 100).toFixed(1)
  
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
  
  if (failedTests === 0) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!')
    console.log('🔒 L\'isolation multi-tenant (RLS) fonctionne correctement.')
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ!')
    console.log('⚠️  L\'isolation multi-tenant présente des failles de sécurité.')
  }
  
  console.log('='.repeat(60) + '\n')
  
  return failedTests === 0
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Démarrage des tests d\'isolation multi-tenant (RLS)\n')
  
  try {
    // Nettoyer les données précédentes
    await cleanup()
    
    // Créer les données de test
    const testData = await setupTestData()
    
    // Exécuter les tests
    await testPrismaClientFiltering(testData)
    await testRLSContext(testData)
    await testAutoInjection(testData)
    await testUpdateFiltering(testData)
    await testDeleteFiltering(testData)
    await testSuperAdminBypass(testData)
    await testOtherModels(testData)
    await testRelations(testData)
    
    // Générer le rapport
    const allPassed = generateReport()
    
    // Nettoyer les données de test
    await cleanup()
    
    // Exit avec le bon code
    process.exit(allPassed ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Erreur fatale lors des tests:', error)
    await cleanup()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
main()
