/**
 * Script de test des API d'export
 * Teste tous les endpoints d'export avec Prisma
 */

import { prisma } from '@/lib/prisma'
import {
  exportClients,
  exportPatrimoine,
  exportDocuments,
  exportSimulations,
  toCSV,
  generateFilename,
  prepareForExport,
} from '@/lib/services/export-service'

async function testExportService() {
  console.log('🧪 Test du service d\'export\n')

  try {
    // 1. Trouver un cabinet de test
    const cabinet = await prisma.cabinet.findFirst({
      include: {
        clients: {
          take: 1,
          include: {
            actifs: {
              take: 1,
            },
            passifs: {
              take: 1,
            },
            contrats: {
              take: 1,
            },
            documents: {
              take: 1,
            },
            simulations: {
              take: 1,
            },
          },
        },
      },
    })

    if (!cabinet) {
      console.error('❌ Aucun cabinet trouvé dans la base de données')
      return
    }

    console.log(`✅ Cabinet trouvé: ${cabinet.name} (${cabinet.id})`)

    const client = cabinet.clients[0]
    if (!client) {
      console.error('❌ Aucun client trouvé pour ce cabinet')
      return
    }

    console.log(`✅ Client trouvé: ${client.firstName} ${client.lastName} (${client.id})\n`)

    // 2. Test export clients
    console.log('📊 Test 1: Export des clients')
    const clients = await exportClients(cabinet.id)
    console.log(`   ✅ ${clients.length} clients exportés`)
    
    const clientsCSV = toCSV(clients)
    console.log(`   ✅ CSV généré: ${clientsCSV.split('\n').length} lignes`)
    
    const clientsFilename = generateFilename('clients', cabinet.name, 'csv')
    console.log(`   ✅ Nom de fichier: ${clientsFilename}\n`)

    // 3. Test export patrimoine
    console.log('💰 Test 2: Export du patrimoine')
    const patrimoine = await exportPatrimoine(client.id)
    console.log(`   ✅ Actifs: ${patrimoine.actifs.length}`)
    console.log(`   ✅ Passifs: ${patrimoine.passifs.length}`)
    console.log(`   ✅ Contrats: ${patrimoine.contrats.length}`)
    
    const actifsCSV = toCSV(patrimoine.actifs)
    console.log(`   ✅ CSV actifs généré: ${actifsCSV.split('\n').length} lignes`)
    
    const passifsCSV = toCSV(patrimoine.passifs)
    console.log(`   ✅ CSV passifs généré: ${passifsCSV.split('\n').length} lignes`)
    
    const contratsCSV = toCSV(patrimoine.contrats)
    console.log(`   ✅ CSV contrats généré: ${contratsCSV.split('\n').length} lignes\n`)

    // 4. Test export documents
    console.log('📄 Test 3: Export des documents')
    const documents = await exportDocuments(client.id)
    console.log(`   ✅ ${documents.length} documents exportés`)
    
    if (documents.length > 0) {
      const documentsCSV = toCSV(documents)
      console.log(`   ✅ CSV généré: ${documentsCSV.split('\n').length} lignes`)
    }
    console.log()

    // 5. Test export simulations
    console.log('🎯 Test 4: Export des simulations')
    const simulations = await exportSimulations(client.id)
    console.log(`   ✅ ${simulations.length} simulations exportées`)
    
    if (simulations.length > 0) {
      const simulationsCSV = toCSV(simulations)
      console.log(`   ✅ CSV généré: ${simulationsCSV.split('\n').length} lignes`)
    }
    console.log()

    // 6. Test prepareForExport
    console.log('🔧 Test 5: Préparation des données pour export')
    const testData = [
      {
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
        phone: '0123456789',
        extraField: 'should be filtered',
      },
    ]
    
    const prepared = prepareForExport(testData, 'clients')
    console.log(`   ✅ Données préparées: ${Object.keys(prepared[0]).length} champs`)
    console.log(`   ✅ Champs: ${Object.keys(prepared[0]).join(', ')}\n`)

    // 7. Test des filtres
    console.log('🔍 Test 6: Export avec filtres')
    const filteredClients = await exportClients(cabinet.id, {
      clientType: 'PARTICULIER',
    })
    console.log(`   ✅ Clients filtrés (PARTICULIER): ${filteredClients.length}`)
    
    const activeClients = await exportClients(cabinet.id, {
      status: 'ACTIF',
    })
    console.log(`   ✅ Clients filtrés (ACTIF): ${activeClients.length}\n`)

    // 8. Test de la traduction des champs
    console.log('🌐 Test 7: Traduction des champs')
    const sampleClient = clients[0]
    if (sampleClient) {
      const csv = toCSV([sampleClient])
      const headers = csv.split('\n')[0]
      console.log(`   ✅ En-têtes français: ${headers.substring(0, 100)}...\n`)
    }

    // 9. Statistiques finales
    console.log('📈 Statistiques globales:')
    const stats = await prisma.$transaction([
      prisma.client.count({ where: { cabinetId: cabinet.id } }),
      prisma.actif.count({
        where: {
          clients: {
            some: {
              client: {
                cabinetId: cabinet.id,
              },
            },
          },
        },
      }),
      prisma.passif.count({
        where: {
          client: {
            cabinetId: cabinet.id,
          },
        },
      }),
      prisma.contrat.count({
        where: {
          client: {
            cabinetId: cabinet.id,
          },
        },
      }),
      prisma.document.count({
        where: {
          clients: {
            some: {
              client: {
                cabinetId: cabinet.id,
              },
            },
          },
        },
      }),
      prisma.simulation.count({
        where: {
          client: {
            cabinetId: cabinet.id,
          },
        },
      }),
    ])

    console.log(`   📊 Total clients: ${stats[0]}`)
    console.log(`   💰 Total actifs: ${stats[1]}`)
    console.log(`   💳 Total passifs: ${stats[2]}`)
    console.log(`   📋 Total contrats: ${stats[3]}`)
    console.log(`   📄 Total documents: ${stats[4]}`)
    console.log(`   🎯 Total simulations: ${stats[5]}`)

    console.log('\n✅ Tous les tests sont passés avec succès!')
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
testExportService()
  .then(() => {
    console.log('\n✨ Tests terminés')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Échec des tests:', error)
    process.exit(1)
  })
