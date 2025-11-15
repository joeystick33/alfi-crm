import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        // Validation
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          throw new Error('Invalid credentials format')
        }

        const { email, password } = parsed.data

        // 1. Check SuperAdmin first
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (superAdmin) {
          if (!superAdmin.isActive) {
            throw new Error('Account is not active')
          }

          const isValid = await bcrypt.compare(password, superAdmin.password)
          if (!isValid) {
            throw new Error('Invalid credentials')
          }

          // Update last login
          await prisma.superAdmin.update({
            where: { id: superAdmin.id },
            data: { lastLogin: new Date() },
          })

          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: `${superAdmin.firstName} ${superAdmin.lastName}`,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            role: superAdmin.role,
            cabinetId: null,
            isSuperAdmin: true,
          }
        }

        // 2. Check regular User
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { cabinet: true },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.isActive) {
          throw new Error('Account is not active')
        }

        // Check cabinet status
        if (user.cabinet.status === 'SUSPENDED' || user.cabinet.status === 'TERMINATED') {
          throw new Error('Cabinet account is suspended')
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          cabinetId: user.cabinetId,
          cabinetName: user.cabinet.name,
          cabinetSlug: user.cabinet.slug,
          isSuperAdmin: false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
        token.cabinetId = user.cabinetId
        token.cabinetName = user.cabinetName
        token.cabinetSlug = user.cabinetSlug
        token.isSuperAdmin = user.isSuperAdmin
      }

      // Session update
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.role = token.role as any
        session.user.cabinetId = token.cabinetId as string | null
        session.user.cabinetName = token.cabinetName as string | undefined
        session.user.cabinetSlug = token.cabinetSlug as string | undefined
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`)
      // TODO: Add audit log
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token?.email}`)
      // TODO: Add audit log
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
