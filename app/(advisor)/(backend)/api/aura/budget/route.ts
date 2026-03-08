/**
 * AURA Budget Status API Route
 *
 * GET /api/aura/budget — Retourne le statut budgétaire complet
 */

import { NextResponse } from 'next/server'
import { getBudgetStatus } from '@/app/_common/lib/services/aura'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || !isRegularUser(authUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cabinetId = authUser.cabinetId
  const userId = authUser.id

  if (!cabinetId || !userId) {
    return NextResponse.json({ error: 'Missing cabinetId or userId' }, { status: 400 })
  }

  try {
    const budget = await getBudgetStatus(cabinetId, userId)
    return NextResponse.json({ success: true, budget })
  } catch (error) {
    console.error('[AURA Budget] Status check failed:', error)
    return NextResponse.json(
      { error: 'Budget check failed', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
