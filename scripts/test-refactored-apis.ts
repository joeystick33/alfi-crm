#!/usr/bin/env tsx
/**
 * Manual Testing Script for Refactored APIs
 * Tests the refactored domains: documents, projets, opportunites, clients, objectifs, simulations, notifications, rendez-vous
 */

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

interface TestResult {
  endpoint: string
  method: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []
const BASE_URL = 'http://localhost:3000'

function logTest(endpoint: string, method: string, passed: boolean, message: string, details?: any) {
  results.push({ endpoint, method, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${method} ${endpoint}: ${message}`)
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2))
  }
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Create test cabinet
    const cabinet = await prisma.cabinet.upsert({
      where: { slug: 'test-refactor-cabinet' },
      update: {},
      create: {
        name: 'Test Refactor Cabinet',
        slug: 'test-refactor-cabinet',
        email: 'test@refactor.com',
        plan: 'BUSINESS',
      },
    })

    // Create test user
    const hashedPassword = await bcrypt.hash('Test123!', 10)
    const user = await prisma.user.upsert({
      where: { email: 'testuser@refactor.com' },
      update: {},
      create: {
        email: 'testuser@refactor.com',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        role: 'ADVISOR',
        cabinetId: cabinet.id,
      },
    })

    // Create test client
    const client = await prisma.client.upsert({
      where: { 
        email_cabinetId: {
          email: 'testclient@refactor.com',
          cabinetId: cabinet.id
        }
      },
      update: {},
      create: {
        email: 'testclient@refactor.com',
        firstName: 'Test',
        lastName: 'Client',
        cabinetId: cabinet.id,
        assignedAdvisorId: user.id,
      },
    })

    console.log('✅ Test data created successfully')
    console.log(`   Cabinet ID: ${cabinet.id}`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Client ID: ${client.id}`)

    return { cabinet, user, client }
  } catch (error: any) {
    console.error('❌ Failed to setup test data:', error.message)
    throw error
  }
}

async function testServiceInstantiation() {
  console.log('\n🔍 Testing Service Instantiation')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const { cabinet, user, client } = await setupTestData()

  try {
    // Test DocumentService
    const { DocumentService } = await import('../lib/services/document-service')
    const documentService = new DocumentService(cabinet.id, user.id, user.role, false)
    logTest('/api/documents', 'SERVICE', true, 'DocumentService instantiated successfully')

    // Test ProjetService
    const { ProjetService } = await import('../lib/services/projet-service')
    const projetService = new ProjetService(cabinet.id, user.id, user.role, false)
    logTest('/api/projets', 'SERVICE', true, 'ProjetService instantiated successfully')

    // Test OpportuniteService
    const { OpportuniteService } = await import('../lib/services/opportunite-service')
    const opportuniteService = new OpportuniteService(cabinet.id, user.id, user.role, false)
    logTest('/api/opportunites', 'SERVICE', true, 'OpportuniteService instantiated successfully')

    // Test ClientService
    const { ClientService } = await import('../lib/services/client-service')
    const clientService = new ClientService(cabinet.id, user.id, user.role, false)
    logTest('/api/clients', 'SERVICE', true, 'ClientService instantiated successfully')

    // Test ObjectifService
    const { ObjectifService } = await import('../lib/services/objectif-service')
    const objectifService = new ObjectifService(cabinet.id, user.id, user.role, false)
    logTest('/api/objectifs', 'SERVICE', true, 'ObjectifService instantiated successfully')

    // Test SimulationService
    const { SimulationService } = await import('../lib/services/simulation-service')
    const simulationService = new SimulationService(cabinet.id, user.id, user.role, false)
    logTest('/api/simulations', 'SERVICE', true, 'SimulationService instantiated successfully')

    // Test NotificationService
    const { NotificationService } = await import('../lib/services/notification-service')
    const notificationService = new NotificationService(cabinet.id, user.id, user.role, false)
    logTest('/api/notifications', 'SERVICE', true, 'NotificationService instantiated successfully')

    // Test RendezVousService
    const { RendezVousService } = await import('../lib/services/rendez-vous-service')
    const rendezVousService = new RendezVousService(cabinet.id, user.id, user.role, false)
    logTest('/api/rendez-vous', 'SERVICE', true, 'RendezVousService instantiated successfully')

  } catch (error: any) {
    logTest('Service Instantiation', 'SERVICE', false, `Error: ${error.message}`)
  }
}

async function testValidationUtilities() {
  console.log('\n🔍 Testing Validation Utilities')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Test document utils
    const documentUtils = await import('../app/api/documents/utils')
    logTest('/api/documents/utils', 'UTILS', true, 'Document utils imported successfully', {
      exports: Object.keys(documentUtils)
    })

    // Test projet utils
    const projetUtils = await import('../app/api/projets/utils')
    logTest('/api/projets/utils', 'UTILS', true, 'Projet utils imported successfully', {
      exports: Object.keys(projetUtils)
    })

    // Test opportunite utils
    const opportuniteUtils = await import('../app/api/opportunites/utils')
    logTest('/api/opportunites/utils', 'UTILS', true, 'Opportunite utils imported successfully', {
      exports: Object.keys(opportuniteUtils)
    })

    // Test client utils
    const clientUtils = await import('../app/api/clients/utils')
    logTest('/api/clients/utils', 'UTILS', true, 'Client utils imported successfully', {
      exports: Object.keys(clientUtils)
    })

    // Test objectif utils
    const objectifUtils = await import('../app/api/objectifs/utils')
    logTest('/api/objectifs/utils', 'UTILS', true, 'Objectif utils imported successfully', {
      exports: Object.keys(objectifUtils)
    })

    // Test simulation utils
    const simulationUtils = await import('../app/api/simulations/utils')
    logTest('/api/simulations/utils', 'UTILS', true, 'Simulation utils imported successfully', {
      exports: Object.keys(simulationUtils)
    })

    // Test notification utils
    const notificationUtils = await import('../app/api/notifications/utils')
    logTest('/api/notifications/utils', 'UTILS', true, 'Notification utils imported successfully', {
      exports: Object.keys(notificationUtils)
    })

    // Test rendez-vous utils
    const rendezVousUtils = await import('../app/api/rendez-vous/utils')
    logTest('/api/rendez-vous/utils', 'UTILS', true, 'RendezVous utils imported successfully', {
      exports: Object.keys(rendezVousUtils)
    })

  } catch (error: any) {
    logTest('Validation Utilities', 'UTILS', false, `Error: ${error.message}`)
  }
}

async function printSummary() {
  console.log('\n📊 Test Summary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.method} ${r.endpoint}: ${r.message}`)
    })
  }
}

async function main() {
  console.log('🚀 Starting Manual API Testing')
  console.log('Testing refactored domains for multi-tenant architecture')
  console.log('═══════════════════════════════════════════════════════════\n')

  try {
    await testServiceInstantiation()
    await testValidationUtilities()
    await printSummary()

    console.log('\n✅ Manual testing completed')
    console.log('\n📝 Note: For full API endpoint testing with HTTP requests,')
    console.log('   start the development server with: npm run dev')
    console.log('   Then use curl or HTTPie to test endpoints with authentication')

  } catch (error: any) {
    console.error('\n❌ Testing failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
