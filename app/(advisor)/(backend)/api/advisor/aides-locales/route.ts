/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API AIDES LOCALES
 * GET: Recherche aides par commune/département
 * POST: Simulation complète éligibilité + montants
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import AidesLocalesService from '@/lib/services/aides-locales'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

const RechercheSchema = z.object({
  codeInsee: z.string().optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  nomCommune: z.string().min(2).optional(),
  departement: z.string().regex(/^\d{2,3}$/).optional(),
})

const SimulationSchema = z.object({
  // Localisation (au moins un requis)
  codeInsee: z.string().optional(),
  codePostal: z.string().regex(/^\d{5}$/).optional(),
  nomCommune: z.string().min(2).optional(),
  
  // Profil emprunteur
  revenus: z.number().min(0).max(500000),
  tailleFoyer: z.number().min(1).max(10),
  primoAccedant: z.boolean(),
  
  // Projet
  typeLogement: z.enum(['neuf', 'ancien']),
  travaux: z.number().min(0).optional(),
  travauxEnergetiques: z.boolean().optional(),
  
  // Situation professionnelle
  salariePrive: z.boolean().optional(),
  tailleEntreprise: z.number().min(0).optional(),
})

// ══════════════════════════════════════════════════════════════════════════════
// GET - Recherche aides
// ══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      codeInsee: searchParams.get('codeInsee') || undefined,
      codePostal: searchParams.get('codePostal') || undefined,
      nomCommune: searchParams.get('nomCommune') || undefined,
      departement: searchParams.get('departement') || undefined,
    }
    
    const validation = RechercheSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { codeInsee, codePostal, nomCommune, departement } = validation.data
    
    // Recherche par département
    if (departement) {
      const aides = await AidesLocalesService.ANIL.getAidesLocales(departement)
      return NextResponse.json({
        success: true,
        data: {
          departement,
          aides,
          total: aides.length,
        },
      })
    }
    
    // Recherche par commune
    if (codeInsee) {
      const result = await AidesLocalesService.ANIL.rechercherAidesParCommune(codeInsee)
      const communeInfo = await AidesLocalesService.DGFiP.getCommuneInfo(codeInsee)
      
      return NextResponse.json({
        success: true,
        data: {
          commune: communeInfo,
          aides: result.aides,
          total: result.total,
          capaciteBoost: result.capaciteBoost,
        },
      })
    }
    
    // Recherche par code postal ou nom
    if (codePostal || nomCommune) {
      const communes = await AidesLocalesService.DGFiP.rechercherCommune(codePostal || nomCommune || '')
      
      return NextResponse.json({
        success: true,
        data: {
          communes,
          total: communes.length,
        },
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Au moins un paramètre de recherche requis (codeInsee, codePostal, nomCommune, departement)' },
      { status: 400 }
    )
    
  } catch (error) {
    logger.error('[API AidesLocales] Erreur GET:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST - Simulation éligibilité complète
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = SimulationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const params = validation.data
    
    // Vérifier qu'au moins une localisation est fournie
    if (!params.codeInsee && !params.codePostal && !params.nomCommune) {
      return NextResponse.json(
        { success: false, error: 'Localisation requise (codeInsee, codePostal ou nomCommune)' },
        { status: 400 }
      )
    }
    
    // Simulation complète
    const result = await AidesLocalesService.simulerAides({
      codeInsee: params.codeInsee,
      codePostal: params.codePostal,
      nomCommune: params.nomCommune,
      revenus: params.revenus,
      tailleFoyer: params.tailleFoyer,
      primoAccedant: params.primoAccedant,
      typeLogement: params.typeLogement,
      travaux: params.travaux,
      travauxEnergetiques: params.travauxEnergetiques,
      salariePrive: params.salariePrive,
      tailleEntreprise: params.tailleEntreprise,
    })
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Commune non trouvée' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error) {
    logger.error('[API AidesLocales] Erreur POST:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
