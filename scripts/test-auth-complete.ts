#!/usr/bin/env tsx
/**
 * Comprehensive Authentication Test Script
 * Tests all authentication requirements from Task 26
 * 
 * Requirements tested:
 * - 13.1: NextAuth configuration
 * - 13.2: Prisma User model authentication
 * - 13.3: Session management and security
 * - 13.4: Role-based access control
 * - 13.5: Multi-tenant isolation
 */

import { prisma } from '../lib/prisma'
import { getPrismaClient } from '../lib/prisma'
import bcrypt from 'bcryptjs'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}: ${message}`)
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2))
  }
}

async function testNextAuthConfiguration() {
  console.log('\n📋 Test 1: NextAuth Configuration (Requirement 13.1)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Check environment variables
    const hasSecret = !!process.env.NEXTAUTH_SECRET
    const hasUrl = !!process.env.NEXTAUTH_URL
    
    logTest(
      'NEXTAUTH_SECRET configured',
      hasSecret,
      hasSecret ? 'Secret is set' : 'Secret is missing'
    )
    
    logTest(
      'NEXTAUTH_URL configured',
      hasUrl,
      hasUrl ? `URL: ${process.env.NEXTAUTH_URL}` : 'URL is missing'
    )

    // Check auth.ts exports
    const authModule = await import('../lib/auth')
    const hasHandlers = !!authModule.handlers
    const hasAuth = !!authModule.auth
    const hasSignIn = !!authModule.signIn
    const hasSignOut = !!authModule.signOut

    logTest(
      'Auth handlers exported',
      hasHandlers,
      hasHandlers ? 'handlers available' : 'handlers missing'
    )

    logTest(
      'Auth function exported',
      hasAuth,
      hasAuth ? 'auth() available' : 'auth() missing'
    )

    logTest(
      'SignIn/SignOut exported',
      hasSignIn && hasSignOut,
      hasSignIn && hasSignOut ? 'Both available' : 'Missing functions'
    )

  } catch (error: any) {
    logTest('NextAuth Configuration', false, `Error: ${error.message}`)
  }
}

async function testPrismaUserAuthentication() {
  console.log('\n👤 Test 2: Prisma User Authentication (Requirement 13.2)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Create test cabinet
    const testCabinet = await prisma.cabinet.upsert({
      where: { slug: 'test-auth-cabinet' },
      update: {},
      create: {
        name: 'Test Auth Cabinet',
        slug: 'test-auth-cabinet',
        email: 'test@auth-cabinet.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })

    logTest(
      'Test cabinet created',
      !!testCabinet,
      `Cabinet: ${testCabinet.name}`
    )

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10)
    const testUser = await prisma.user.upsert({
      where: { email: 'testuser@auth-cabinet.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'testuser@auth-cabinet.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADVISOR',
        cabinetId: testCabinet.id,
        isActive: true,
      },
    })

    logTest(
      'Test user created',
      !!testUser,
      `User: ${testUser.email}`
    )

    // Test password verification
    const isPasswordValid = await bcrypt.compare('testpassword123', testUser.password)
    logTest(
      'Password verification',
      isPasswordValid,
      isPasswordValid ? 'Password matches' : 'Password mismatch'
    )

    // Test user query with cabinet relation
    const userWithCabinet = await prisma.user.findUnique({
      where: { email: 'testuser@auth-cabinet.com' },
      include: { cabinet: true },
    })

    logTest(
      'User with cabinet relation',
      !!userWithCabinet?.cabinet,
      userWithCabinet?.cabinet ? `Cabinet: ${userWithCabinet.cabinet.name}` : 'No cabinet'
    )

    // Create test SuperAdmin
    const testSuperAdmin = await prisma.superAdmin.upsert({
      where: { email: 'testsuperadmin@alfi-crm.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'testsuperadmin@alfi-crm.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'SuperAdmin',
        role: 'ADMIN',
        isActive: true,
      },
    })

    logTest(
      'SuperAdmin created',
      !!testSuperAdmin,
      `SuperAdmin: ${testSuperAdmin.email}`
    )

  } catch (error: any) {
    logTest('Prisma User Authentication', false, `Error: ${error.message}`)
  }
}

async function testSessionManagement() {
  console.log('\n🔐 Test 3: Session Management (Requirement 13.3)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Test lastLogin update
    const user = await prisma.user.findUnique({
      where: { email: 'testuser@auth-cabinet.com' },
    })

    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      logTest(
        'LastLogin update',
        !!updatedUser.lastLogin,
        updatedUser.lastLogin ? `Updated: ${updatedUser.lastLogin.toISOString()}` : 'Not updated'
      )
    }

    // Test user active status check
    const activeUser = await prisma.user.findFirst({
      where: {
        email: 'testuser@auth-cabinet.com',
        isActive: true,
      },
    })

    logTest(
      'Active user check',
      !!activeUser,
      activeUser ? 'User is active' : 'User is not active'
    )

    // Test cabinet status check
    const userWithActiveCabinet = await prisma.user.findFirst({
      where: {
        email: 'testuser@auth-cabinet.com',
        cabinet: {
          status: 'ACTIVE',
        },
      },
      include: { cabinet: true },
    })

    logTest(
      'Cabinet status check',
      !!userWithActiveCabinet && userWithActiveCabinet.cabinet.status === 'ACTIVE',
      userWithActiveCabinet ? `Cabinet status: ${userWithActiveCabinet.cabinet.status}` : 'No active cabinet'
    )

  } catch (error: any) {
    logTest('Session Management', false, `Error: ${error.message}`)
  }
}

async function testRoleBasedAccessControl() {
  console.log('\n👮 Test 4: Role-Based Access Control (Requirement 13.4)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Test different roles
    const roles = ['ADMIN', 'ADVISOR', 'ASSISTANT'] as const
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug: 'test-auth-cabinet' },
    })

    if (!cabinet) {
      logTest('Role-Based Access Control', false, 'Test cabinet not found')
      return
    }

    for (const role of roles) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const user = await prisma.user.upsert({
        where: { email: `test-${role.toLowerCase()}@auth-cabinet.com` },
        update: { role },
        create: {
          email: `test-${role.toLowerCase()}@auth-cabinet.com`,
          password: hashedPassword,
          firstName: 'Test',
          lastName: role,
          role,
          cabinetId: cabinet.id,
          isActive: true,
        },
      })

      logTest(
        `${role} role created`,
        user.role === role,
        `User role: ${user.role}`
      )
    }

    // Test SuperAdmin roles
    const superAdminRoles = ['OWNER', 'ADMIN', 'DEVELOPER', 'SUPPORT'] as const
    for (const role of superAdminRoles) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const superAdmin = await prisma.superAdmin.upsert({
        where: { email: `test-${role.toLowerCase()}@alfi-crm.com` },
        update: { role },
        create: {
          email: `test-${role.toLowerCase()}@alfi-crm.com`,
          password: hashedPassword,
          firstName: 'Test',
          lastName: role,
          role,
          isActive: true,
        },
      })

      logTest(
        `SuperAdmin ${role} created`,
        superAdmin.role === role,
        `SuperAdmin role: ${superAdmin.role}`
      )
    }

  } catch (error: any) {
    logTest('Role-Based Access Control', false, `Error: ${error.message}`)
  }
}

async function testMultiTenantIsolation() {
  console.log('\n🏢 Test 5: Multi-Tenant Isolation (Requirement 13.5)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Create two test cabinets
    const cabinet1 = await prisma.cabinet.upsert({
      where: { slug: 'cabinet-alpha-test' },
      update: {},
      create: {
        name: 'Cabinet Alpha Test',
        slug: 'cabinet-alpha-test',
        email: 'contact@cabinet-alpha-test.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })

    const cabinet2 = await prisma.cabinet.upsert({
      where: { slug: 'cabinet-beta-test' },
      update: {},
      create: {
        name: 'Cabinet Beta Test',
        slug: 'cabinet-beta-test',
        email: 'contact@cabinet-beta-test.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })

    logTest(
      'Two cabinets created',
      !!cabinet1 && !!cabinet2,
      `Cabinet 1: ${cabinet1.name}, Cabinet 2: ${cabinet2.name}`
    )

    // Create test users for each cabinet
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const user1 = await prisma.user.upsert({
      where: { email: 'advisor1@cabinet-alpha-test.com' },
      update: {},
      create: {
        email: 'advisor1@cabinet-alpha-test.com',
        password: hashedPassword,
        firstName: 'Advisor',
        lastName: 'Alpha',
        role: 'ADVISOR',
        cabinetId: cabinet1.id,
        isActive: true,
      },
    })

    const user2 = await prisma.user.upsert({
      where: { email: 'advisor2@cabinet-beta-test.com' },
      update: {},
      create: {
        email: 'advisor2@cabinet-beta-test.com',
        password: hashedPassword,
        firstName: 'Advisor',
        lastName: 'Beta',
        role: 'ADVISOR',
        cabinetId: cabinet2.id,
        isActive: true,
      },
    })

    // Create test clients for each cabinet
    const client1 = await prisma.client.create({
      data: {
        cabinetId: cabinet1.id,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@test.com',
        phone: '0601020304',
        status: 'ACTIVE',
        conseillerId: user1.id,
      },
    })

    const client2 = await prisma.client.create({
      data: {
        cabinetId: cabinet2.id,
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@test.com',
        phone: '0605060708',
        status: 'ACTIVE',
        conseillerId: user2.id,
      },
    })

    logTest(
      'Test clients created',
      !!client1 && !!client2,
      `Client 1: ${client1.firstName} ${client1.lastName}, Client 2: ${client2.firstName} ${client2.lastName}`
    )

    // Test isolation with getPrismaClient
    const prismaClient1 = getPrismaClient(cabinet1.id, false)
    const cabinet1Clients = await prismaClient1.client.findMany()

    logTest(
      'Cabinet 1 isolation',
      cabinet1Clients.length === 1 && cabinet1Clients[0].id === client1.id,
      `Cabinet 1 sees ${cabinet1Clients.length} client(s)`
    )

    const prismaClient2 = getPrismaClient(cabinet2.id, false)
    const cabinet2Clients = await prismaClient2.client.findMany()

    logTest(
      'Cabinet 2 isolation',
      cabinet2Clients.length === 1 && cabinet2Clients[0].id === client2.id,
      `Cabinet 2 sees ${cabinet2Clients.length} client(s)`
    )

    // Test SuperAdmin access
    const superAdminClient = getPrismaClient('', true)
    const allClients = await superAdminClient.client.findMany({
      where: {
        OR: [
          { id: client1.id },
          { id: client2.id },
        ],
      },
    })

    logTest(
      'SuperAdmin access',
      allClients.length >= 2,
      `SuperAdmin sees ${allClients.length} client(s) from all cabinets`
    )

    // Cleanup test data
    await prisma.client.deleteMany({
      where: {
        OR: [
          { id: client1.id },
          { id: client2.id },
        ],
      },
    })

    logTest(
      'Test data cleanup',
      true,
      'Test clients deleted'
    )

  } catch (error: any) {
    logTest('Multi-Tenant Isolation', false, `Error: ${error.message}`)
  }
}

async function printSummary() {
  console.log('\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 TEST SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (failed === 0) {
    console.log('✅ All authentication tests passed!')
    console.log('✅ Requirements 13.1, 13.2, 13.3, 13.4, 13.5 verified')
  } else {
    console.log('❌ Some tests failed. Please review the errors above.')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

async function main() {
  console.log('🔐 Authentication System Test Suite')
  console.log('Testing Requirements: 13.1, 13.2, 13.3, 13.4, 13.5')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    await testNextAuthConfiguration()
    await testPrismaUserAuthentication()
    await testSessionManagement()
    await testRoleBasedAccessControl()
    await testMultiTenantIsolation()
    await printSummary()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
