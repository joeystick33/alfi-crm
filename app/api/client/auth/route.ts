import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const clientAuthSchema = z.object({
  email: z.string().email(),
  portalPassword: z.string().min(6),
});

/**
 * POST /api/client/auth
 * Authenticate a client for portal access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, portalPassword } = clientAuthSchema.parse(body);

    // Find client by email
    const client = await prisma.client.findFirst({
      where: {
        email: email.toLowerCase(),
        portalAccess: true,
        status: {
          in: ['PROSPECT', 'ACTIVE'],
        },
      },
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        cabinet: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or portal access not enabled' },
        { status: 404 }
      );
    }

    if (!client.portalPassword) {
      return NextResponse.json(
        { error: 'Portal password not set. Please contact your advisor.' },
        { status: 400 }
      );
    }

    // Verify portal password
    const isValid = await bcrypt.compare(portalPassword, client.portalPassword);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last portal login
    await prisma.client.update({
      where: { id: client.id },
      data: { lastPortalLogin: new Date() },
    });

    // Return client data (without sensitive info)
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        cabinetId: client.cabinetId,
        conseiller: client.conseiller,
        cabinet: client.cabinet,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Client Auth Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
