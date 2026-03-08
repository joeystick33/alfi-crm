import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DashboardService } from '@/app/_common/lib/services/dashboard-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: 'Invalid user or cabinet' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const rangeDays = parseInt(searchParams.get('rangeDays') || '30', 10)

    const service = new DashboardService(context.cabinetId, user.id, context.isSuperAdmin);
    const celebrations = await service.getCelebrations(rangeDays);

    return NextResponse.json(celebrations)
  } catch (error) {
    logger.error('Error fetching celebrations:', { error: error instanceof Error ? error.message : String(error) })
    // En cas d'erreur inattendue côté serveur, on renvoie simplement une liste vide
    // pour ne pas casser le dashboard ; aucune donnée mockée n'est injectée.
    return NextResponse.json({ events: [], error: 'Internal server error' }, { status: 200 })
  }
}
