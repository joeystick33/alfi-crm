import { prisma } from '../lib/prisma'
import { setRLSContext } from '../lib/prisma'

/**
 * Test script to verify multi-tenant isolation
 * Ensures users can only access data from their own cabinet
 */
async function testMultiTenantIsolation() {
  console.log('🔒 Testing Multi-Tenant Isolation...\n')

  try {
    // 1. Create two test cabinets
    console.log('1️⃣ Creating test cabinets...')
    
    const cabinet1 = await prisma.cabinet.upsert({
      where: { slug: 'cabinet-alpha' },
      update: {},
      create: {
        name: 'Cabinet Alpha',
        slug: 'cabinet-alpha',
        email: 'contact@cabinet-alpha.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })

    const cabinet2 = await prisma.cabinet.upsert({
      where: { slug: 'cabinet-beta' },
      update: {},
      create: {
        name: 'Cabinet Beta',
        slug: 'cabinet-beta',
        email: 'contact@cabinet-beta.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })

    console.log('✅ Cabinet 1:', cabinet1.name, `(${cabinet1.id})`)
    console.log('✅ Cabinet 2:', cabinet2.name, `(${cabinet2.id})`)

    // 2. Create test clients for each cabinet
    console.log('\n2️⃣ Creating test clients...')
    
    const client1 = await prisma.client.create({
      data: {
        cabinetId: cabinet1.id,
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '0601020304',
        status: 'ACTIF',
      },
    })

    const client2 = await prisma.client.create({
      data: {
        cabinetId: cabinet2.id,
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        phone: '0605060708',
        status: 'ACTIF',
      },
    })

    console.log('✅ Client 1 (Cabinet Alpha):', client1.firstName, client1.lastName)
    console.log('✅ Client 2 (Cabinet Beta):', client2.firstName, client2.lastName)

    // 3. Test RLS isolation for Cabinet 1
    console.log('\n3️⃣ Testing RLS for Cabinet Alpha...')
    await setRLSContext(cabinet1.id, false)
    
    const cabinet1Clients = await prisma.client.findMany()
    console.log(`✅ Cabinet Alpha sees ${cabinet1Clients.length} client(s)`)
    
    if (cabinet1Clients.length !== 1) {
      throw new Error('❌ Cabinet Alpha should only see 1 client!')
    }
    
    if (cabinet1Clients[0].id !== client1.id) {
      throw new Error('❌ Cabinet Alpha should only see its own client!')
    }

    // 4. Test RLS isolation for Cabinet 2
    console.log('\n4️⃣ Testing RLS for Cabinet Beta...')
    await setRLSContext(cabinet2.id, false)
    
    const cabinet2Clients = await prisma.client.findMany()
    console.log(`✅ Cabinet Beta sees ${cabinet2Clients.length} client(s)`)
    
    if (cabinet2Clients.length !== 1) {
      throw new Error('❌ Cabinet Beta should only see 1 client!')
    }
    
    if (cabinet2Clients[0].id !== client2.id) {
      throw new Error('❌ Cabinet Beta should only see its own client!')
    }

    // 5. Test SuperAdmin access
    console.log('\n5️⃣ Testing SuperAdmin access...')
    await setRLSContext('', true)
    
    const allClients = await prisma.client.findMany()
    console.log(`✅ SuperAdmin sees ${allClients.length} client(s) (all cabinets)`)
    
    if (allClients.length < 2) {
      throw new Error('❌ SuperAdmin should see all clients!')
    }

    // 6. Cleanup
    console.log('\n6️⃣ Cleaning up test data...')
    await prisma.client.deleteMany({
      where: {
        OR: [
          { id: client1.id },
          { id: client2.id },
        ],
      },
    })
    console.log('✅ Test clients deleted')

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All multi-tenant isolation tests passed!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🔒 Multi-tenant isolation is working correctly:')
    console.log('  • Each cabinet only sees its own data')
    console.log('  • SuperAdmin can see all data')
    console.log('  • RLS context switching works')
    console.log('')
  } catch (error) {
    console.error('\n❌ Multi-tenant isolation test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testMultiTenantIsolation()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
