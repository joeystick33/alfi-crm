/**
 * Auth configuration stub
 * 
 * This file provides a placeholder for next-auth configuration.
 * The actual authentication is handled by the custom auth system in app/_common/lib/auth-helpers.ts
 */

import type { NextAuthOptions } from 'next-auth'

// Placeholder auth options for compatibility with routes that import from next-auth
export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {},
  pages: {
    signIn: '/login',
  },
}

export default authOptions
