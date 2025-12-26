 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  filterConfidentialData,
  getClientAllowedOperations,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

const updateProfileSchema = z.object({
  clientId: z.string().min(1),
  // Contact information (modifiable by client)
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  // Communication preferences
  preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

/**
 * GET /api/client/profile?clientId=xxx
 * Get client profile for portal
 * READ-ONLY access with strict client isolation
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(clientId, 'CONSULTATION', 'PROFILE');

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        address: true,
        birthDate: true,
        maritalStatus: true,
        numberOfChildren: true,
        profession: true,
        clientType: true,
        companyName: true,
        status: true,
        portalAccess: true,
        lastPortalLogin: true,
        createdAt: true,
        // Advisor info
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        // Family members (for display)
        familyMembers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            relationship: true,
          },
        },
        // Cabinet info
        cabinet: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Filter confidential data
    const filteredClient = filterConfidentialData(client);

    return NextResponse.json({
      profile: {
        ...filteredClient,
        fullName: `${client.firstName} ${client.lastName}`,
      },
      advisor: client.conseiller,
      cabinet: client.cabinet,
      familyMembers: client.familyMembers,
      preferences: {
        // These would come from a preferences table or client metadata
        preferredContactMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: false,
      },
    });
  } catch (error: any) {
    console.error('[Client Profile Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/profile
 * Update client profile (limited fields)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, data.clientId);
    if (accessDenied) return accessDenied;

    // Check if client can update profile
    const permissions = getClientAllowedOperations('profile');
    if (!permissions.canUpdate) {
      return NextResponse.json(
        { error: 'Profile update is not allowed' },
        { status: 403 }
      );
    }

    // Build update data (only allowed fields)
    const updateData: any = {};

    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.address !== undefined) updateData.address = data.address;

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: data.clientId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        address: true,
      },
    });

    // Log action for audit
    await logClientPortalAccess(data.clientId, 'MODIFICATION', 'PROFILE', data.clientId, {
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      profile: updatedClient,
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Profile Update Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
