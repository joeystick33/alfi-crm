/**
 * NextAuth.js API Route
 * 
 * This file provides a placeholder for next-auth configuration.
 * The actual authentication is handled by the custom auth system.
 */

import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {},
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
