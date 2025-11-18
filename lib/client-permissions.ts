/**
 * Client Portal Permissions System
 * 
 * This module provides utilities to verify client portal access,
 * enforce read-only permissions, and ensure data isolation.
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export interface ClientPermissionCheck {
  clientId: string;
  hasAccess: boolean;
  client?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    cabinetId: string;
    conseillerId: string;
  };
  error?: string;
}

/**
 * Verify that a client has portal access enabled
 */
export async function verifyClientPortalAccess(
  clientId: string
): Promise<ClientPermissionCheck> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cabinetId: true,
        conseillerId: true,
        portalAccess: true,
        status: true,
      },
    });

    if (!client) {
      return {
        clientId,
        hasAccess: false,
        error: 'Client not found',
      };
    }

    if (!client.portalAccess) {
      return {
        clientId,
        hasAccess: false,
        error: 'Portal access not enabled for this client',
      };
    }

    if (client.status !== 'ACTIVE' && client.status !== 'PROSPECT') {
      return {
        clientId,
        hasAccess: false,
        error: 'Client account is not active',
      };
    }

    return {
      clientId,
      hasAccess: true,
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        cabinetId: client.cabinetId,
        conseillerId: client.conseillerId,
      },
    };
  } catch (error: any) {
    console.error('[Client Permission Check Error]:', error);
    return {
      clientId,
      hasAccess: false,
      error: 'Failed to verify client access',
    };
  }
}

/**
 * Verify that a client can only access their own data
 * This prevents clients from accessing other clients' data
 */
export async function verifyClientDataOwnership(
  clientId: string,
  resourceClientId: string
): Promise<boolean> {
  return clientId === resourceClientId;
}

/**
 * Middleware helper to verify client portal access in API routes
 * Returns a NextResponse with error if access is denied
 */
export async function requireClientPortalAccess(
  request: NextRequest,
  clientId: string
): Promise<NextResponse | null> {
  const permissionCheck = await verifyClientPortalAccess(clientId);

  if (!permissionCheck.hasAccess) {
    return NextResponse.json(
      { 
        error: permissionCheck.error || 'Access denied',
        code: 'CLIENT_ACCESS_DENIED'
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Verify that a resource belongs to the specified client
 * Used for checking ownership of actifs, passifs, documents, etc.
 */
export async function verifyResourceOwnership(
  resourceType: 'actif' | 'passif' | 'contrat' | 'document' | 'objectif' | 'projet' | 'opportunite' | 'rendezVous',
  resourceId: string,
  clientId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'actif': {
        const clientActif = await prisma.clientActif.findFirst({
          where: {
            actifId: resourceId,
            clientId: clientId,
          },
        });
        return !!clientActif;
      }

      case 'passif': {
        const passif = await prisma.passif.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!passif;
      }

      case 'contrat': {
        const contrat = await prisma.contrat.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!contrat;
      }

      case 'document': {
        const clientDocument = await prisma.clientDocument.findFirst({
          where: {
            documentId: resourceId,
            clientId: clientId,
          },
        });
        return !!clientDocument;
      }

      case 'objectif': {
        const objectif = await prisma.objectif.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!objectif;
      }

      case 'projet': {
        const projet = await prisma.projet.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!projet;
      }

      case 'opportunite': {
        const opportunite = await prisma.opportunite.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!opportunite;
      }

      case 'rendezVous': {
        const rendezVous = await prisma.rendezVous.findFirst({
          where: {
            id: resourceId,
            clientId: clientId,
          },
        });
        return !!rendezVous;
      }

      default:
        return false;
    }
  } catch (error: any) {
    console.error('[Resource Ownership Check Error]:', error);
    return false;
  }
}

/**
 * Get allowed operations for client portal
 * Clients have read-only access to most resources
 */
export function getClientAllowedOperations(resourceType: string): {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
} {
  // Default: read-only access
  const defaultPermissions = {
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  };

  // Special cases where clients can create/update
  switch (resourceType) {
    case 'message':
      // Clients can send messages to their advisor
      return {
        canRead: true,
        canCreate: true,
        canUpdate: false,
        canDelete: false,
      };

    case 'profile':
      // Clients can update their own profile information
      return {
        canRead: true,
        canCreate: false,
        canUpdate: true,
        canDelete: false,
      };

    default:
      return defaultPermissions;
  }
}

/**
 * Filter confidential data from client responses
 * Removes sensitive information that clients shouldn't see
 */
export function filterConfidentialData<T extends Record<string, any>>(
  data: T,
  confidentialFields: string[] = []
): Partial<T> {
  const filtered = { ...data };
  
  // Default confidential fields
  const defaultConfidential = [
    'portalPassword',
    'internalNotes',
    'advisorNotes',
    'riskScore',
    'creditScore',
    'isConfidential',
  ];

  const allConfidential = [...defaultConfidential, ...confidentialFields];

  allConfidential.forEach(field => {
    if (field in filtered) {
      delete filtered[field];
    }
  });

  return filtered;
}

/**
 * Validate client session from request
 * Extracts and validates clientId from query params or body
 */
export function extractClientId(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get('clientId');
}

/**
 * Create a standardized error response for permission denied
 */
export function createPermissionDeniedResponse(
  message: string = 'Access denied'
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'PERMISSION_DENIED',
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

/**
 * Create a standardized error response for resource not found
 */
export function createResourceNotFoundResponse(
  resourceType: string
): NextResponse {
  return NextResponse.json(
    {
      error: `${resourceType} not found or access denied`,
      code: 'RESOURCE_NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * Log client portal access for audit purposes
 */
export async function logClientPortalAccess(
  clientId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'SHARE' | 'SIGN' | 'APPROVE' | 'REJECT',
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { cabinetId: true },
    });

    if (!client) return;

    await prisma.auditLog.create({
      data: {
        cabinetId: client.cabinetId,
        userId: clientId, // Using clientId as userId for portal access
        action,
        entityType: resourceType || 'CLIENT_PORTAL',
        entityId: resourceId || clientId,
        changes: metadata || {},
        ipAddress: null, // Can be extracted from request headers if needed
        userAgent: null, // Can be extracted from request headers if needed
      },
    });
  } catch (error: any) {
    console.error('[Client Portal Access Log Error]:', error);
    // Don't throw - logging should not break the request
  }
}
