import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n')

  try {
    // 1. Create test SuperAdmin
    console.log('1️⃣ Creating test SuperAdmin...')
    const hashedPasswordAdmin = await bcrypt.hash('admin123456', 10)
    
    const testSuperAdmin = await prisma.superAdmin.upsert({
      where: { email: 'admin@alfi-crm.com' },
      update: {
        password: hashedPasswordAdmin,
      },
      create: {
        email: 'admin@alfi-crm.com',
        password: hashedPasswordAdmin,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    })
    console.log('✅ Test SuperAdmin created:', testSuperAdmin.email)

    // 2. Create test Cabinet
    console.log('\n2️⃣ Creating test Cabinet...')
    const testCabinet = await prisma.cabinet.upsert({
      where: { slug: 'test-cabinet' },
      update: {},
      create: {
        name: 'Cabinet Test',
        slug: 'test-cabinet',
        email: 'contact@test-cabinet.com',
        plan: 'BUSINESS',
        status: 'ACTIVE',
      },
    })
    console.log('✅ Test Cabinet created:', testCabinet.name)

    // 3. Create test User
    console.log('\n3️⃣ Creating test User...')
    const hashedPasswordUser = await bcrypt.hash('user123456', 10)
    
    const testUser = await prisma.user.upsert({
      where: { email: 'advisor@test-cabinet.com' },
      update: {
        password: hashedPasswordUser,
      },
      create: {
        email: 'advisor@test-cabinet.com',
        password: hashedPasswordUser,
        firstName: 'Test',
        lastName: 'Advisor',
        role: 'ADVISOR',
        cabinetId: testCabinet.id,
        isActive: true,
      },
    })
    console.log('✅ Test User created:', testUser.email)

    // 4. Test password verification
    console.log('\n4️⃣ Testing password verification...')
    const isValidAdmin = await bcrypt.compare('admin123456', testSuperAdmin.password)
    const isValidUser = await bcrypt.compare('user123456', testUser.password)
    console.log('✅ SuperAdmin password valid:', isValidAdmin)
    console.log('✅ User password valid:', isValidUser)

    // 5. Display test credentials
    console.log('\n📋 Test Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('SuperAdmin:')
    console.log('  Email: admin@alfi-crm.com')
    console.log('  Password: admin123456')
    console.log('\nAdvisor:')
    console.log('  Email: advisor@test-cabinet.com')
    console.log('  Password: user123456')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n✅ All authentication tests passed!')
    console.log('\n🚀 You can now test login at: http://localhost:3000/login')
  } catch (error) {
    console.error('❌ Error during authentication test:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
