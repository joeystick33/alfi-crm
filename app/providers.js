/**
 * Client Providers
 * Wraps the application with necessary providers (SessionProvider, etc.)
 */

'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
