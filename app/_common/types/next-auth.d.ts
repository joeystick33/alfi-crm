import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      role: 'ADMIN' | 'ADVISOR' | 'ASSISTANT' | 'OWNER' | 'DEVELOPER' | 'SUPPORT'
      cabinetId: string | null
      cabinetName?: string
      cabinetSlug?: string
      isSuperAdmin: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    cabinetId: string | null
    cabinetName?: string
    cabinetSlug?: string
    isSuperAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    role: string
    cabinetId: string | null
    cabinetName?: string
    cabinetSlug?: string
    isSuperAdmin: boolean
  }
}
