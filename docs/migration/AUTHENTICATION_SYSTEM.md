# Authentication System - Complete Guide

## Overview

The alfi-crm authentication system provides secure, multi-tenant authentication with role-based access control. It uses NextAuth v5 with Prisma adapter for database-backed sessions.

## Architecture

### Components

1. **NextAuth Configuration** (`lib/auth.ts`)
   - Credentials provider for email/password authentication
   - PrismaAdapter for database sessions
   - JWT strategy with 7-day expiration
   - Custom callbacks for session enrichment

2. **Middleware** (`middleware.ts`)
   - Route protection
   - Automatic redirects for authenticated/unauthenticated users
   - Public route configuration

3. **Prisma Integration** (`lib/prisma.ts`)
   - Multi-tenant isolation via middleware
   - Automatic cabinetId filtering
   - SuperAdmin bypass functionality

4. **Type Definitions** (`types/next-auth.d.ts`)
   - Extended Session type
   - Extended User type
   - JWT token type

## Authentication Flow

### Login Process

```
1. User submits email + password
   ↓
2. NextAuth validates credentials
   ↓
3. Check SuperAdmin table first
   ↓
4. If not found, check User table
   ↓
5. Verify password with bcrypt
   ↓
6. Check account status (isActive)
   ↓
7. Check cabinet status (ACTIVE)
   ↓
8. Update lastLogin timestamp
   ↓
9. Create JWT token with user data
   ↓
10. Return session to client
```

### Session Structure

```typescript
{
  user: {
    id: string                    // User or SuperAdmin ID
    email: string                 // Email address
    name: string                  // Full name
    firstName: string             // First name
    lastName: string              // Last name
    role: UserRole | SuperAdminRole  // User role
    cabinetId: string | null      // Cabinet ID (null for SuperAdmin)
    cabinetName?: string          // Cabinet name
    cabinetSlug?: string          // Cabinet slug
    isSuperAdmin: boolean         // SuperAdmin flag
  }
}
```

## User Roles

### Regular Users (Cabinet-scoped)

- **ADMIN**: Full cabinet administration
- **ADVISOR**: Client management and advisory
- **ASSISTANT**: Limited access, support role

### SuperAdmin (Global access)

- **OWNER**: Full system ownership
- **ADMIN**: System administration
- **DEVELOPER**: Development and debugging
- **SUPPORT**: Customer support access

## Multi-Tenant Isolation

### How It Works

The system uses Prisma middleware to automatically filter all queries by `cabinetId`:

```typescript
// Automatic filtering
const prismaClient = getPrismaClient(session.user.cabinetId!, false)

// This query is automatically scoped to the cabinet
const clients = await prismaClient.client.findMany()
// Returns only clients from the user's cabinet
```

### SuperAdmin Access

SuperAdmins can bypass isolation to access all data:

```typescript
const prismaClient = getPrismaClient('', true) // isSuperAdmin = true

// This query returns data from ALL cabinets
const allClients = await prismaClient.client.findMany()
```

### Protected Models

These models are automatically filtered by `cabinetId`:

- Cabinet
- User
- AssistantAssignment
- ApporteurAffaires
- Client
- Actif
- Passif
- Contrat
- Document
- Objectif
- Projet
- Opportunite
- Tache
- RendezVous
- Email
- Notification
- Campagne
- Template
- Simulation
- Reclamation
- AuditLog
- ExportJob

## Usage Examples

### 1. Protecting API Routes

```typescript
// app/api/clients/route.ts
import { auth } from '@/lib/auth'
import { getPrismaClient } from '@/lib/prisma'

export async function GET(req: Request) {
  // Get session
  const session = await auth()
  
  // Check authentication
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get cabinet-scoped Prisma client
  const prisma = getPrismaClient(
    session.user.cabinetId!,
    session.user.isSuperAdmin
  )
  
  // Query is automatically filtered by cabinetId
  const clients = await prisma.client.findMany()
  
  return Response.json({ clients })
}
```

### 2. Protecting Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Cabinet: {session.user.cabinetName}</p>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
```

### 3. Client-Side Session Access

```typescript
// components/UserMenu.tsx
'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

export function UserMenu() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <p>{session.user.name}</p>
      <p>{session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>
        Logout
      </button>
    </div>
  )
}
```

### 4. Role-Based Access Control

```typescript
// lib/permissions.ts
import { auth } from '@/lib/auth'

export async function requireRole(allowedRoles: string[]) {
  const session = await auth()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }
  
  return session
}

// Usage in API route
export async function DELETE(req: Request) {
  // Only ADMIN can delete
  await requireRole(['ADMIN'])
  
  // ... delete logic
}
```

### 5. SuperAdmin Check

```typescript
// lib/permissions.ts
export async function requireSuperAdmin() {
  const session = await auth()
  
  if (!session || !session.user.isSuperAdmin) {
    throw new Error('SuperAdmin access required')
  }
  
  return session
}

// Usage
export async function GET(req: Request) {
  await requireSuperAdmin()
  
  // Access all cabinets
  const prisma = getPrismaClient('', true)
  const allCabinets = await prisma.cabinet.findMany()
  
  return Response.json({ cabinets: allCabinets })
}
```

## Security Features

### 1. Password Security
- ✅ Bcrypt hashing with 10 salt rounds
- ✅ Minimum 6 character requirement
- ✅ Zod validation for email and password format

### 2. Session Security
- ✅ JWT-based sessions (stateless)
- ✅ 7-day expiration
- ✅ Secure cookies in production (httpOnly, secure, sameSite)
- ✅ CSRF protection via NextAuth

### 3. Account Security
- ✅ Active status checks (`isActive` flag)
- ✅ Cabinet status validation (ACTIVE, SUSPENDED, etc.)
- ✅ Last login tracking
- ✅ Failed login error messages (generic for security)

### 4. Multi-Tenant Security
- ✅ Automatic data isolation by cabinetId
- ✅ No manual filtering required
- ✅ SuperAdmin bypass control
- ✅ Zero cross-cabinet data leakage

### 5. Route Protection
- ✅ Middleware-based protection
- ✅ Automatic redirects
- ✅ Public route configuration
- ✅ Callback URL support

## Environment Variables

Required environment variables:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Testing

### Run Authentication Tests

```bash
cd alfi-crm
npx tsx scripts/test-auth-complete.ts
```

### Test Coverage

The test suite verifies:
- ✅ NextAuth configuration
- ✅ Prisma User authentication
- ✅ Session management
- ✅ Role-based access control
- ✅ Multi-tenant isolation

**Expected Result**: 26/26 tests passed (100%)

## Troubleshooting

### Issue: "Module not found: next-auth"

**Solution**:
```bash
npm install next-auth@beta @auth/prisma-adapter
```

### Issue: "NEXTAUTH_SECRET is not defined"

**Solution**: Add to `.env`:
```env
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Issue: Login doesn't work

**Check**:
1. Database connected? Check `DATABASE_URL`
2. Prisma generated? Run `npm run db:generate`
3. Test accounts created? Run test script
4. Check browser console for errors

### Issue: Cross-cabinet data leakage

**Check**:
1. Using `getPrismaClient()` with correct cabinetId?
2. Not using raw Prisma client directly?
3. Session contains correct cabinetId?

## Production Checklist

Before deploying to production:

- [ ] Generate strong NEXTAUTH_SECRET (32+ characters)
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Enable HTTPS
- [ ] Configure secure cookies
- [ ] Remove test accounts
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Test all authentication flows
- [ ] Verify multi-tenant isolation

## Migration from CRM Source

### Key Changes

1. **NextAuth v4 → v5**
   - New API structure
   - Better TypeScript support
   - Improved middleware

2. **MongoDB → PostgreSQL**
   - ObjectId → cuid
   - Mongoose → Prisma
   - Different query syntax

3. **Enhanced Multi-Tenant**
   - Prisma middleware/extensions
   - Automatic filtering
   - More robust RLS

### No Breaking Changes

The authentication API remains compatible with the CRM source. All existing authentication flows work without modification.

## Additional Resources

- [NextAuth Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Task 26 Complete Documentation](./TASK_26_AUTHENTICATION_MIGRATION_COMPLETE.md)
- [Authentication Installation Guide](./AUTH_INSTALLATION_GUIDE.md)

## Support

For issues or questions:
1. Check this documentation
2. Review test suite: `scripts/test-auth-complete.ts`
3. Check existing auth components in `components/auth/`
4. Review migration documentation in `docs/migration/`
