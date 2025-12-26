import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Création des utilisateurs de test...')

  // 1. Créer un SuperAdmin
  const superAdminPassword = await bcrypt.hash('superadmin123', 10)
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'superadmin@aura.fr' },
    update: {},
    create: {
      email: 'superadmin@aura.fr',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'OWNER',
      isActive: true,
    },
  })
  console.log('✅ SuperAdmin créé:', superAdmin.email)

  // 2. Créer un Cabinet de test
  const cabinet = await prisma.cabinet.upsert({
    where: { slug: 'cabinet-test' },
    update: {},
    create: {
      name: 'Cabinet Patrimoine Test',
      slug: 'cabinet-test',
      email: 'contact@cabinet-test.fr',
      phone: '0123456789',
      address: '123 Avenue Test, 75001 Paris',
      plan: 'BUSINESS',
      status: 'ACTIVE',
      quotas: {
        maxUsers: 10,
        maxClients: 100,
        maxStorage: 10737418240, // 10GB
      },
      usage: {
        users: 0,
        clients: 0,
        storage: 0,
      },
      features: {
        analytics: true,
        emailSync: true,
        advancedReports: true,
        api: true,
        whiteLabel: false,
      },
    },
  })
  console.log('✅ Cabinet créé:', cabinet.name)

  // 3. Créer un Admin du cabinet
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cabinet-test.fr' },
    update: {},
    create: {
      email: 'admin@cabinet-test.fr',
      password: adminPassword,
      firstName: 'Jean',
      lastName: 'Administrateur',
      role: 'ADMIN',
      cabinetId: cabinet.id,
      isActive: true,
      permissions: {
        canManageUsers: true,
        canManageClients: true,
        canManageDocuments: true,
        canViewReports: true,
        canManageSettings: true,
      },
    },
  })
  console.log('✅ Admin cabinet créé:', admin.email)

  // 4. Créer un Conseiller
  const advisorPassword = await bcrypt.hash('conseiller123', 10)
  const advisor = await prisma.user.upsert({
    where: { email: 'conseiller@cabinet-test.fr' },
    update: {},
    create: {
      email: 'conseiller@cabinet-test.fr',
      password: advisorPassword,
      firstName: 'Marie',
      lastName: 'Conseillère',
      role: 'ADVISOR',
      cabinetId: cabinet.id,
      isActive: true,
      permissions: {
        canManageClients: true,
        canManageDocuments: true,
        canViewReports: true,
      },
    },
  })
  console.log('✅ Conseiller créé:', advisor.email)

  // 5. Créer un Assistant
  const assistantPassword = await bcrypt.hash('assistant123', 10)
  const assistant = await prisma.user.upsert({
    where: { email: 'assistant@cabinet-test.fr' },
    update: {},
    create: {
      email: 'assistant@cabinet-test.fr',
      password: assistantPassword,
      firstName: 'Pierre',
      lastName: 'Assistant',
      role: 'ASSISTANT',
      cabinetId: cabinet.id,
      isActive: true,
      permissions: {
        canViewClients: true,
        canManageDocuments: true,
      },
    },
  })
  console.log('✅ Assistant créé:', assistant.email)

  // Mettre à jour l'usage du cabinet
  await prisma.cabinet.update({
    where: { id: cabinet.id },
    data: {
      usage: {
        users: 3, // admin + advisor + assistant
        clients: 0,
        storage: 0,
      },
    },
  })

  console.log('\n🎉 Tous les utilisateurs de test ont été créés !')
  console.log('\n📋 IDENTIFIANTS DE TEST:\n')
  console.log('1️⃣  SUPERADMIN (Gestion globale)')
  console.log('   Email: superadmin@aura.fr')
  console.log('   Mot de passe: superadmin123\n')
  console.log('2️⃣  ADMIN CABINET (Gestion du cabinet)')
  console.log('   Email: admin@cabinet-test.fr')
  console.log('   Mot de passe: admin123\n')
  console.log('3️⃣  CONSEILLER (Gestion clients)')
  console.log('   Email: conseiller@cabinet-test.fr')
  console.log('   Mot de passe: conseiller123\n')
  console.log('4️⃣  ASSISTANT (Support)')
  console.log('   Email: assistant@cabinet-test.fr')
  console.log('   Mot de passe: assistant123\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
