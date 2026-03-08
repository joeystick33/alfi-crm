import { PrismaClient, SuperAdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

type CliOptions = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: SuperAdminRole
}

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string>()

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const [rawKey, inlineValue] = token.split('=')
    const key = rawKey.replace(/^--/, '')
    const nextValue = argv[i + 1]
    const value = inlineValue ?? (nextValue && !nextValue.startsWith('--') ? nextValue : '')

    if (value) {
      args.set(key, value)
      if (!inlineValue && nextValue && !nextValue.startsWith('--')) i++
    }
  }

  const email = (args.get('email') || '').trim().toLowerCase()
  const password = (args.get('password') || '').trim()
  const firstName = (args.get('firstName') || args.get('first') || 'Super').trim()
  const lastName = (args.get('lastName') || args.get('last') || 'Admin').trim()
  const roleRaw = (args.get('role') || 'OWNER').trim().toUpperCase()

  const allowedRoles = new Set<SuperAdminRole>(['OWNER', 'ADMIN', 'DEVELOPER', 'SUPPORT'])
  if (!email) throw new Error('Missing --email')
  if (!password) throw new Error('Missing --password')
  if (password.length < 8) throw new Error('Password must be at least 8 characters')
  if (!allowedRoles.has(roleRaw as SuperAdminRole)) {
    throw new Error('Invalid --role. Allowed: OWNER, ADMIN, DEVELOPER, SUPPORT')
  }

  return {
    email,
    password,
    firstName,
    lastName,
    role: roleRaw as SuperAdminRole,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const prisma = new PrismaClient()

  try {
    const passwordHash = await bcrypt.hash(options.password, 10)

    const superAdmin = await prisma.superAdmin.upsert({
      where: { email: options.email },
      update: {
        password: passwordHash,
        firstName: options.firstName,
        lastName: options.lastName,
        role: options.role,
        isActive: true,
      },
      create: {
        email: options.email,
        password: passwordHash,
        firstName: options.firstName,
        lastName: options.lastName,
        role: options.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    console.log('SuperAdmin upserted successfully:')
    console.log(JSON.stringify(superAdmin, null, 2))
    console.log('You can now sign in at /login with this email and password.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Failed to create superadmin:', error.message)
  process.exit(1)
})
