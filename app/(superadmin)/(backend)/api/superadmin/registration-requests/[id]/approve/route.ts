import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'

/**
 * API SuperAdmin - Approuver une demande d'inscription
 * POST /api/superadmin/registration-requests/[id]/approve
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: requestId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Récupérer la demande
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    })

    if (!registrationRequest) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      )
    }

    if (registrationRequest.status !== 'EN_ATTENTE') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    // Générer un slug unique pour le cabinet
    const baseSlug = registrationRequest.cabinetName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Vérifier si le slug existe déjà
    let slug = baseSlug
    let counter = 1
    while (await prisma.cabinet.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Déterminer les quotas selon le plan
    const planQuotas = getPlanQuotas(registrationRequest.planRequested)

    // Créer le cabinet
    const cabinet = await prisma.cabinet.create({
      data: {
        name: registrationRequest.cabinetName,
        slug,
        email: registrationRequest.cabinetEmail,
        phone: registrationRequest.cabinetPhone,
         
        address: registrationRequest.cabinetAddress as any,
        plan: registrationRequest.planRequested as 'TRIAL' | 'STARTER' | 'BUSINESS' | 'PREMIUM',
        status: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours d'essai
        quotas: planQuotas,
        features: getPlanFeatures(registrationRequest.planRequested),
        createdBy: superAdmin.id,
      },
    })

    // Hasher un mot de passe temporaire
    const bcrypt = await import('bcryptjs')
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Créer l'utilisateur admin
    const adminUser = await prisma.user.create({
      data: {
        cabinetId: cabinet.id,
        email: registrationRequest.adminEmail,
        password: hashedPassword,
        firstName: registrationRequest.adminFirstName,
        lastName: registrationRequest.adminLastName,
        phone: registrationRequest.adminPhone,
        role: 'ADMIN',
        isActive: true,
      },
    })

    // Créer l'utilisateur dans Supabase Auth
    try {
      const supabase = createAdminClient()
      const { error: authError } = await supabase.auth.admin.createUser({
        email: registrationRequest.adminEmail.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          firstName: registrationRequest.adminFirstName,
          lastName: registrationRequest.adminLastName,
          role: 'ADMIN',
          cabinetId: cabinet.id,
          isSuperAdmin: false,
          prismaUserId: adminUser.id,
        },
      })

      if (authError && !authError.message.includes('already')) {
        console.error('Erreur Supabase Auth:', authError)
      }
    } catch (supabaseError) {
      console.error('Erreur création Supabase:', supabaseError)
    }

    // Mettre à jour la demande
    await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROUVEE',
        processedAt: new Date(),
        processedBy: superAdmin.id,
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: cabinet.id,
        action: 'CREATION',
        entityType: 'Cabinet',
        entityId: cabinet.id,
        changes: {
          approved: true,
          requestId,
          cabinetName: cabinet.name,
          adminEmail: adminUser.email,
        },
      },
    })

    // TODO: Envoyer un email de bienvenue avec les identifiants

    return NextResponse.json({
      success: true,
      cabinet: {
        id: cabinet.id,
        name: cabinet.name,
        slug: cabinet.slug,
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        tempPassword, // À envoyer par email, pas à afficher dans la réponse en prod
      },
      message: 'Cabinet créé avec succès',
    })
  } catch (error) {
    console.error('Erreur approbation demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getPlanQuotas(plan: string) {
  // STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
  const quotas: Record<string, object> = {
    TRIAL: { maxUsers: 2, maxClients: 50, maxStorageGB: 1, maxSimulationsPerMonth: 0 },
    STARTER: { maxUsers: 3, maxClients: 150, maxStorageGB: 5, maxSimulationsPerMonth: 0 },
    BUSINESS: { maxUsers: 10, maxClients: 500, maxStorageGB: 20, maxSimulationsPerMonth: 0 },
    PREMIUM: { maxUsers: -1, maxClients: -1, maxStorageGB: 100, maxSimulationsPerMonth: -1 },
  }
  return quotas[plan] || quotas.STARTER
}

function getPlanFeatures(plan: string) {
  // STARTER: CRM uniquement
  // BUSINESS: CRM + Tous calculateurs
  // PREMIUM: CRM + Calculateurs + Tous simulateurs
  const allFeatures = {
    // Simulateurs - uniquement PREMIUM
    SIMULATION_RETRAITE: plan === 'PREMIUM',
    SIMULATION_EPARGNE: plan === 'PREMIUM',
    SIMULATION_IMMOBILIER: plan === 'PREMIUM',
    SIMULATION_SUCCESSION: plan === 'PREMIUM',
    SIMULATION_PER: plan === 'PREMIUM',
    SIMULATION_PREVOYANCE: plan === 'PREMIUM',
    // Calculateurs - BUSINESS et PREMIUM
    CALCULATEUR_IR: plan === 'BUSINESS' || plan === 'PREMIUM',
    CALCULATEUR_IFI: plan === 'BUSINESS' || plan === 'PREMIUM',
    CALCULATEUR_PLUS_VALUES: plan === 'BUSINESS' || plan === 'PREMIUM',
    CALCULATEUR_SUCCESSION: plan === 'BUSINESS' || plan === 'PREMIUM',
    // Modules
    EXPORT_PDF: true,
    EXPORT_EXCEL: plan === 'BUSINESS' || plan === 'PREMIUM',
    MULTI_CONSEILLER: plan !== 'TRIAL',
    API_ACCESS: plan === 'PREMIUM',
    WHITE_LABEL: plan === 'PREMIUM',
    PORTAIL_CLIENT: plan === 'BUSINESS' || plan === 'PREMIUM',
    SUPPORT_PRIORITAIRE: plan === 'PREMIUM',
  }
  return allFeatures
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
