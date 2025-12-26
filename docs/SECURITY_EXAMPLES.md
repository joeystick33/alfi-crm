# Exemples d'Utilisation - Sécurité

Ce document fournit des exemples concrets d'utilisation du système de sécurité.

## 1. API Route Protégée Basique

```typescript
// app/api/clients/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient, setRLSContext } from '@/app/_common/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const context = await requireAuth(request)
    
    // 2. Créer un client Prisma avec isolation
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    // 3. Activer RLS
    await setRLSContext(context.cabinetId, context.isSuperAdmin)
    
    // 4. Récupérer les clients (automatiquement filtrés par cabinetId)
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return createSuccessResponse(clients)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal Server Error', 500)
  }
}
```

## 2. API Route avec Permission Spécifique

```typescript
// app/api/clients/[id]/delete/route.ts
import { NextRequest } from 'next/server'
import { requirePermission, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient, setRLSContext } from '@/app/_common/lib/prisma'
import { canDeleteClient } from '@/app/_common/lib/permissions'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérifier la permission de suppression
    const context = await requirePermission(request, 'canDeleteClients')
    
    // 2. Créer un client Prisma avec isolation
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    await setRLSContext(context.cabinetId, context.isSuperAdmin)
    
    // 3. Récupérer le client pour vérifier les droits
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        conseillerId: true,
      },
    })
    
    if (!client) {
      return createErrorResponse('Client not found', 404)
    }
    
    // 4. Vérifier les droits spécifiques
    if (!canDeleteClient(context.user.role, context.user.id, client.conseillerId)) {
      return createErrorResponse('Forbidden: Cannot delete this client', 403)
    }
    
    // 5. Supprimer le client
    await prisma.client.delete({
      where: { id: params.id },
    })
    
    return createSuccessResponse({ message: 'Client deleted successfully' })
  } catch (error) {
    return createErrorResponse('Internal Server Error', 500)
  }
}
```

## 3. API Route SuperAdmin

```typescript
// app/api/admin/cabinets/route.ts
import { NextRequest } from 'next/server'
import { requireSuperAdmin, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier que l'utilisateur est SuperAdmin
    const context = await requireSuperAdmin(request)
    
    // 2. Créer un client Prisma sans isolation (accès à tout)
    const prisma = getPrismaClient('', true)
    
    // 3. Récupérer tous les cabinets
    const cabinets = await prisma.cabinet.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return createSuccessResponse(cabinets)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return createErrorResponse('Forbidden: SuperAdmin access required', 403)
    }
    return createErrorResponse('Internal Server Error', 500)
  }
}
```

## 4. Server Component avec Isolation

```typescript
// app/dashboard/clients/page.tsx
import { getPrismaClient, setRLSContext } from '@/app/_common/lib/prisma'
import { getServerSession } from 'next-auth'

export default async function ClientsPage() {
  // 1. Récupérer la session
  const session = await getServerSession()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  // 2. Créer un client Prisma avec isolation
  const prisma = getPrismaClient(session.user.cabinetId, false)
  await setRLSContext(session.user.cabinetId, false)
  
  // 3. Récupérer les clients (automatiquement filtrés)
  const clients = await prisma.client.findMany({
    where: {
      // Si ADVISOR, filtrer par conseillerId
      ...(session.user.role === 'ADVISOR' && {
        OR: [
          { conseillerId: session.user.id },
          { conseillerRemplacantId: session.user.id },
        ],
      }),
    },
    include: {
      conseiller: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      lastName: 'asc',
    },
  })
  
  return (
    <div>
      <h1>Mes Clients</h1>
      {/* Render clients */}
    </div>
  )
}
```

## 5. Service avec Audit

```typescript
// lib/services/client-service.ts
import { getPrismaClient, setRLSContext } from '@/app/_common/lib/prisma'
import { createAuditMiddleware } from '@/app/_common/lib/prisma-middleware'

export class ClientService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
    
    // Ajouter l'audit automatique
    this.prisma.$use(createAuditMiddleware(userId))
  }
  
  async createClient(data: any) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)
    
    // Le cabinetId sera automatiquement ajouté par le middleware
    const client = await this.prisma.client.create({
      data: {
        ...data,
        // cabinetId ajouté automatiquement
      },
    })
    
    // L'audit sera automatiquement créé par le middleware
    
    return client
  }
  
  async updateClient(id: string, data: any) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)
    
    // Le filtre cabinetId sera automatiquement ajouté
    const client = await this.prisma.client.update({
      where: { id },
      data,
    })
    
    return client
  }
  
  async getClientById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)
    
    // Le filtre cabinetId sera automatiquement ajouté
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        actifs: {
          include: {
            actif: true,
          },
        },
        passifs: true,
        contrats: true,
      },
    })
    
    return client
  }
}
```

## 6. Utilisation du Service

```typescript
// app/api/clients/[id]/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { ClientService } from '@/app/_common/lib/services/client-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    // Créer le service avec le contexte d'authentification
    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )
    
    // Récupérer le client (avec isolation automatique)
    const client = await clientService.getClientById(params.id)
    
    if (!client) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createSuccessResponse(client)
  } catch (error) {
    return createErrorResponse('Internal Server Error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()
    
    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )
    
    // Mettre à jour le client (avec audit automatique)
    const client = await clientService.updateClient(params.id, body)
    
    return createSuccessResponse(client)
  } catch (error) {
    return createErrorResponse('Internal Server Error', 500)
  }
}
```

## 7. Test d'Isolation

```typescript
// __tests__/security/isolation.test.ts
import { getPrismaClient, setRLSContext } from '@/app/_common/lib/prisma'

describe('Cabinet Isolation', () => {
  it('should only return clients from the same cabinet', async () => {
    const cabinetA = 'cabinet-a-id'
    const cabinetB = 'cabinet-b-id'
    
    // Client pour cabinet A
    const prismaA = getPrismaClient(cabinetA, false)
    await setRLSContext(cabinetA, false)
    
    const clientsA = await prismaA.client.findMany()
    
    // Vérifier que tous les clients appartiennent au cabinet A
    expect(clientsA.every(c => c.cabinetId === cabinetA)).toBe(true)
    
    // Client pour cabinet B
    const prismaB = getPrismaClient(cabinetB, false)
    await setRLSContext(cabinetB, false)
    
    const clientsB = await prismaB.client.findMany()
    
    // Vérifier que tous les clients appartiennent au cabinet B
    expect(clientsB.every(c => c.cabinetId === cabinetB)).toBe(true)
    
    // Vérifier qu'il n'y a pas de chevauchement
    const idsA = new Set(clientsA.map(c => c.id))
    const idsB = new Set(clientsB.map(c => c.id))
    
    expect([...idsA].some(id => idsB.has(id))).toBe(false)
  })
  
  it('should allow SuperAdmin to access all cabinets', async () => {
    const prisma = getPrismaClient('', true)
    await setRLSContext('', true)
    
    const allClients = await prisma.client.findMany()
    
    // SuperAdmin peut voir les clients de tous les cabinets
    const uniqueCabinets = new Set(allClients.map(c => c.cabinetId))
    expect(uniqueCabinets.size).toBeGreaterThan(1)
  })
})
```

## Résumé des Bonnes Pratiques

1. **Toujours utiliser `requireAuth()` ou `requirePermission()`** dans les API routes
2. **Toujours créer un client Prisma avec `getPrismaClient()`** au lieu d'utiliser le client global
3. **Toujours appeler `setRLSContext()`** avant les requêtes
4. **Utiliser les services** pour encapsuler la logique métier
5. **Vérifier les permissions** au niveau applicatif en plus de RLS
6. **Logger les actions sensibles** pour l'audit
7. **Tester l'isolation** avec des tests automatisés
