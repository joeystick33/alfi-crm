/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API KYC ENTREPRISE - ENRICHISSEMENT COMPLET
 * GET: Enrichissement par SIREN
 * POST: Recherche + Enrichissement multi-sources
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import KYCService from '@/lib/services/kyc'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

const EnrichissementSchema = z.object({
  siren: z.string().regex(/^\d{9}$/, 'SIREN invalide (9 chiffres)'),
  effectif: z.number().min(0).optional(),
  options: z.object({
    includeFinances: z.boolean().optional(),
    includeSocial: z.boolean().optional(),
    includeAdresse: z.boolean().optional(),
  }).optional(),
})

const RechercheSchema = z.object({
  query: z.string().min(2, 'Minimum 2 caractères'),
  limit: z.number().min(1).max(10).optional(),
})

// ══════════════════════════════════════════════════════════════════════════════
// GET - Enrichissement KYC par SIREN
// ══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const siren = searchParams.get('siren')
    const effectif = searchParams.get('effectif')
    const includeFinances = searchParams.get('includeFinances') !== 'false'
    const includeSocial = searchParams.get('includeSocial') !== 'false'
    const includeAdresse = searchParams.get('includeAdresse') !== 'false'
    
    if (!siren || !/^\d{9}$/.test(siren)) {
      return NextResponse.json(
        { success: false, error: 'SIREN invalide (9 chiffres requis)' },
        { status: 400 }
      )
    }
    
    const result = await KYCService.enrichirEntrepriseBySiren(
      siren,
      effectif ? parseInt(effectif) : undefined,
      { includeFinances, includeSocial, includeAdresse }
    )
    
    if (!result.entreprise) {
      return NextResponse.json(
        { success: false, error: 'Entreprise non trouvée', erreurs: result.erreurs },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error) {
    logger.error('[API KYC Entreprise] Erreur GET:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST - Recherche + Enrichissement multi-entreprises
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'rechercher'
    
    // Action: Recherche avec enrichissement léger
    if (action === 'rechercher') {
      const validation = RechercheSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Paramètres invalides', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      
      const { query, limit } = validation.data
      const resultats = await KYCService.rechercherEtEnrichir(query, limit || 5)
      
      return NextResponse.json({
        success: true,
        data: {
          query,
          count: resultats.length,
          entreprises: resultats,
        },
      })
    }
    
    // Action: Enrichissement complet d'un SIREN
    if (action === 'enrichir') {
      const validation = EnrichissementSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Paramètres invalides', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      
      const { siren, effectif, options } = validation.data
      const result = await KYCService.enrichirEntrepriseBySiren(siren, effectif, options)
      
      if (!result.entreprise) {
        return NextResponse.json(
          { success: false, error: 'Entreprise non trouvée', erreurs: result.erreurs },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: result,
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Action inconnue (rechercher | enrichir)' },
      { status: 400 }
    )
    
  } catch (error) {
    logger.error('[API KYC Entreprise] Erreur POST:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
