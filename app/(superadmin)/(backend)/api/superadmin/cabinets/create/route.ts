 
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { CabinetService } from '@/app/_common/lib/services/cabinet-service'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est SuperAdmin
    await requireSuperAdmin(request)

    const body = await request.json()
    const { cabinet, quotas, adminUser } = body

    // Validation
    if (!cabinet?.name || !cabinet?.slug || !cabinet?.email) {
      return NextResponse.json(
        { error: 'Informations cabinet manquantes' },
        { status: 400 }
      )
    }

    const allowedPlans = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM']
    if (cabinet?.plan && !allowedPlans.includes(cabinet.plan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      )
    }

    if (!adminUser?.email || !adminUser?.password || !adminUser?.firstName || !adminUser?.lastName) {
      return NextResponse.json(
        { error: 'Informations administrateur manquantes' },
        { status: 400 }
      )
    }

    const cabinetService = new CabinetService(true)

    try {
      const result = await cabinetService.createCabinet(
        {
          ...cabinet,
          quotas
        },
        adminUser
      )

      return NextResponse.json({
        success: true,
        cabinet: result.cabinet,
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          firstName: result.admin.firstName,
          lastName: result.admin.lastName,
        }
      })
    } catch (error: any) {
      console.error('CabinetService error:', error?.message, error?.stack)
      if (error.message === 'Ce slug est déjà utilisé' || error.message === 'Cet email est déjà utilisé') {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
      throw error
    }

  } catch (error: any) {
    console.error('Create cabinet error:', error?.message, error?.stack)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du cabinet' },
      { status: 500 }
    )
  }
}
