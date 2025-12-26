 
/**
 * Route dynamique proxy pour tous les backends simulateurs
 * POST /api/advisor/simulators-proxy/[backend]/[...path]
 * 
 * Exemples:
 * - /api/advisor/simulators-proxy/assurance-vie/simulate
 * - /api/advisor/simulators-proxy/patrimoine/lifeinsurance/analyze
 * - /api/advisor/simulators-proxy/ptz/eligibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyRequest, getStartupInstructions } from '../../proxy'
import { getBackendConfig } from '../../config'

interface RouteParams {
  params: {
    backend: string
    path: string[]
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params, 'GET')
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params, 'POST')
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params, 'PUT')
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return handleRequest(request, params, 'SUPPRESSION')
}

async function handleRequest(
  request: NextRequest,
  params: { backend: string; path: string[] },
  method: 'GET' | 'POST' | 'PUT' | 'SUPPRESSION'
) {
  try {
    const { backend, path } = params
    const config = getBackendConfig(backend)

    if (!config) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend '${backend}' non trouvé`,
          availableBackends: [
            'assurance-vie', 'patrimoine', 'per-salaries', 'immobilier', 'prevoyance-tns',
            'capacite-emprunt', 'mensualite', 'enveloppe-fiscale', 'per-tns', 'ptz', 'epargne'
          ]
        },
        { status: 404 }
      )
    }

    // Construire le chemin de l'endpoint
    const endpoint = `/api/${path.join('/')}`
    
    // Récupérer le body pour POST/PUT
    let body: any = undefined
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.json()
      } catch {
        // Pas de body, ce n'est pas forcément une erreur
      }
    }

    // Effectuer la requête proxy
    const result = await proxyRequest(backend, endpoint, method, body)

    if (!result.success) {
      // Si le backend est offline, fournir des instructions
      if (result.backend?.status === 'offline') {
        return NextResponse.json({
          success: false,
          error: result.error,
          backend: result.backend,
          instructions: getStartupInstructions(config),
        }, { status: 503 })
      }

      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Proxy Dynamic] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
