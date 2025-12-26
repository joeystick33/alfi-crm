
/**
 * Health Check API - Tous les backends simulateurs
 * GET /api/advisor/simulators-proxy/health
 * 
 * Mode DEV: Retourne "online" pour tous les backends (APIs Next.js internes fonctionnent)
 * Mode PROD: Vérifie vraiment les backends externes
 */

import { NextResponse } from 'next/server'
import { checkAllBackendsHealth, getStartupInstructions } from '../proxy'
import { BACKEND_CONFIGS } from '../config'

// Toujours vérifier les vrais backends
const USE_MOCK_STATUS = false

export async function GET(_request: Request) {
  try {
    let results: any[]

    // Vérifier vraiment les backends
    results = await checkAllBackendsHealth()

    const summary = {
      total: results.length,
      online: results.filter(r => r.status === 'online').length,
      offline: results.filter(r => r.status === 'offline').length,
      java: results.filter(r => r.type === 'java').length,
      nodejs: results.filter(r => r.type === 'nodejs').length,
    }

    const detailedResults = results.map(result => {
      const config = BACKEND_CONFIGS.find(c => c.name === result.backend)
      return {
        ...result,
        endpoints: config?.endpoints || [],
        startupInstructions: result.status === 'offline' && config
          ? getStartupInstructions(config)
          : undefined,
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      backends: detailedResults,
      mode: USE_MOCK_STATUS ? 'development' : 'production',
    })
  } catch (error: any) {
    console.error('[Health Check All] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
