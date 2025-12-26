import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Demandes d'Inscription
 * GET /api/superadmin/registration-requests - Liste les demandes
 * POST /api/superadmin/registration-requests - Créer une demande (public)
 */

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Paramètres de requête
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    // Construire le filtre
     
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Récupérer les demandes
    const requests = await prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Erreur liste demandes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Cette route est publique pour permettre aux visiteurs de s'inscrire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      cabinetName,
      cabinetEmail,
      cabinetPhone,
      cabinetAddress,
      website,
      siret,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhone,
      planRequested,
      expectedUsers,
      expectedClients,
      message,
      source,
    } = body

    // Validation basique
    if (!cabinetName || !cabinetEmail || !adminFirstName || !adminLastName || !adminEmail) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Vérifier si une demande existe déjà avec cet email
    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [
          { cabinetEmail },
          { adminEmail },
        ],
        status: 'EN_ATTENTE',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Une demande est déjà en cours pour cet email' },
        { status: 400 }
      )
    }

    // Vérifier si un cabinet existe déjà avec cet email
    const existingCabinet = await prisma.cabinet.findFirst({
      where: { email: cabinetEmail },
    })

    if (existingCabinet) {
      return NextResponse.json(
        { error: 'Un cabinet existe déjà avec cet email' },
        { status: 400 }
      )
    }

    // Récupérer les headers pour le tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    // Créer la demande
    const registrationRequest = await prisma.registrationRequest.create({
      data: {
        cabinetName,
        cabinetEmail,
        cabinetPhone,
        cabinetAddress,
        website,
        siret,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPhone,
        planRequested: planRequested || 'STARTER',
        expectedUsers: expectedUsers || 1,
        expectedClients: expectedClients || 100,
        message,
        source,
        ipAddress,
        userAgent,
        status: 'EN_ATTENTE',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Votre demande a été enregistrée. Nous vous contacterons rapidement.',
      requestId: registrationRequest.id,
    })
  } catch (error) {
    console.error('Erreur création demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
