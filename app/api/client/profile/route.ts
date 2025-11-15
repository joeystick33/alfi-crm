import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  getClientAllowedOperations,
  filterConfidentialData,
} from '@/lib/client-permissions';

const querySchema = z.object({
  clientId: z.string().min(1),
});

const updateProfileSchema = z.object({
  clientId: z.string().min(1),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.any().optional(),
});

const updatePasswordSchema = z.object({
  clientId: z.string().min(1),
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

/**
 * GET /api/client/profile?clientId=xxx
 * Get client profile information
 * READ-ONLY access with confidential data filtering
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

    const { clientId: validatedClientId } = querySchema.parse({ clientId });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(validatedClientId, 'VIEW_PROFILE');

    // Get client profile
    const client = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: {
        id: true,
        portalAccess: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        birthPlace: true,
        nationality: true,
        phone: true,
        mobile: true,
        address: true,
        maritalStatus: true,
        numberOfChildren: true,
        profession: true,
        employerName: true,
        clientType: true,
        companyName: true,
        siret: true,
        legalForm: true,
        activitySector: true,
        lastPortalLogin: true,
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        cabinet: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        familyMembers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            relationship: true,
            isBeneficiary: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Filter confidential data before returning
    const filteredProfile = filterConfidentialData(client);

    return NextResponse.json({
      profile: filteredProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Profile GET Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/profile
 * Update client profile (limited fields only)
 * Clients CAN update their contact information
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, phone, mobile, address } = updateProfileSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, clientId);
    if (accessDenied) return accessDenied;

    // Verify client can update profile
    const permissions = getClientAllowedOperations('profile');
    if (!permissions.canUpdate) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      );
    }

    // Update allowed fields only
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (address !== undefined) updateData.address = address;

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        mobile: true,
        address: true,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        clientId,
        type: 'OTHER',
        title: 'Profil mis à jour',
        description: 'Le client a mis à jour ses informations de contact',
        createdBy: clientId,
      },
    });

    // Log update for audit
    await logClientPortalAccess(
      clientId,
      'UPDATE_PROFILE',
      'CLIENT',
      clientId,
      { fields: Object.keys(updateData) }
    );

    return NextResponse.json({
      success: true,
      profile: updatedClient,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Profile PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/profile/password
 * Update client portal password
 * Clients CAN update their own password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, currentPassword, newPassword } = updatePasswordSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, clientId);
    if (accessDenied) return accessDenied;

    // Get client with password
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        portalPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.portalPassword) {
      return NextResponse.json(
        { error: 'Portal password not set' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, client.portalPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.client.update({
      where: { id: clientId },
      data: {
        portalPassword: hashedPassword,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        clientId,
        type: 'OTHER',
        title: 'Mot de passe modifié',
        description: 'Le client a modifié son mot de passe du portail',
        createdBy: clientId,
      },
    });

    // Log password change for audit
    await logClientPortalAccess(
      clientId,
      'UPDATE_PASSWORD',
      'CLIENT',
      clientId
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Password Update Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
