 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API ADRESSE - RECHERCHE ET ENRICHISSEMENT
 * GET: Recherche d'adresses avec autocomplétion
 * POST: Validation et enrichissement d'une adresse (zone PTZ + aides)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import AdresseService from '@/lib/services/adresse'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

const RechercheSchema = z.object({
  q: z.string().min(3, 'Minimum 3 caractères'),
  type: z.enum(['housenumber', 'street', 'locality', 'municipality']).optional(),
  postcode: z.string().regex(/^\d{5}$/).optional(),
  limit: z.number().min(1).max(20).optional(),
  enrichir: z.boolean().optional(),
})

const ValidationSchema = z.object({
  adresse: z.string().min(5, 'Minimum 5 caractères'),
})

// ══════════════════════════════════════════════════════════════════════════════
// GET - Recherche d'adresses avec autocomplétion
// ══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      q: searchParams.get('q') || '',
      type: searchParams.get('type') as any || undefined,
      postcode: searchParams.get('postcode') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      enrichir: searchParams.get('enrichir') === 'true',
    }
    
    const validation = RechercheSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { q, type, postcode, limit, enrichir } = validation.data
    
    // Recherche avec ou sans enrichissement
    const adresses = await AdresseService.rechercherEnrichie(q, {
      limit: limit || 10,
      enrichir: enrichir || false,
    })
    
    // Filtrer par type si spécifié
    const resultats = type
      ? adresses.filter(a => a.type === type)
      : adresses
    
    return NextResponse.json({
      success: true,
      data: {
        query: q,
        count: resultats.length,
        adresses: resultats,
      },
    })
    
  } catch (error) {
    logger.error('[API Adresse] Erreur GET:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST - Valider et enrichir une adresse
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = ValidationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { adresse } = validation.data
    
    // Valider et enrichir l'adresse
    const resultat = await AdresseService.validerProjet(adresse)
    
    if (resultat.statut === 'erreur') {
      return NextResponse.json(
        { success: false, error: resultat.erreur },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        adresseSaisie: resultat.adresseSaisie,
        adresseValidee: resultat.adresseValidee,
        statut: resultat.statut,
        resume: resultat.adresseValidee
          ? AdresseService.getResumeAides(resultat.adresseValidee)
          : null,
      },
    })
    
  } catch (error) {
    logger.error('[API Adresse] Erreur POST:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
