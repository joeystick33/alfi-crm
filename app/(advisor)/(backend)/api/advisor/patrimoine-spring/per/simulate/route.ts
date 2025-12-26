 
/**
 * Proxy API - PER Simulate
 * Redirige vers le backend Java: POST /api/per/simulate
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToJavaBackend } from '../../proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation basique
    if (!body.monthlyContribution && !body.initialAmount) {
      return NextResponse.json(
        { success: false, error: 'Un montant initial ou un versement mensuel est requis' },
        { status: 400 }
      )
    }

    const result = await proxyToJavaBackend(
      '/api/per/simulate',
      'POST',
      body
    )

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.javaBackendStatus === 'offline' ? 503 : 500 
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[PER Simulate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
