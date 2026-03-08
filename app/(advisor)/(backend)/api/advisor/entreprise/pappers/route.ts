/**
 * API Route - Données Entreprise
 * 
 * Utilise les APIs officielles françaises :
 * - recherche-entreprises.api.gouv.fr (gratuit, sans clé)
 * - RNE INPI : comptes annuels détaillés (optionnel)
 * 
 * Configuration optionnelle (.env) :
 * - INPI_USERNAME / INPI_PASSWORD (pour les bilans financiers)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import {
  searchEntreprises,
  getEntreprise,
  entrepriseToClientData,
} from '@/lib/services/entreprise'

// =============================================================================
// GET - Recherche ou récupération entreprise
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const siren = searchParams.get('siren')
    const siret = searchParams.get('siret')
    const query = searchParams.get('q')
    
    // Récupération par SIREN/SIRET
    if (siren || siret) {
      const identifier = siren || siret!
      const entreprise = await getEntreprise(identifier)
      
      return NextResponse.json({
        success: true,
        source: entreprise.source,
        data: {
          ...entreprise,
          ratios_financiers: entreprise.ratios,
          client_data: entrepriseToClientData(entreprise),
        }
      })
    }
    
    // Recherche par nom
    if (query) {
      const results = await searchEntreprises(query)
      
      return NextResponse.json({
        success: true,
        source: 'api-gouv',
        data: {
          resultats_nombre: results.length,
          resultats: results,
        }
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Paramètre manquant: siren, siret ou q (recherche)' },
      { status: 400 }
    )
    
  } catch (error) {
    logger.error('[API Entreprise] Erreur GET:', { error: error instanceof Error ? error.message : String(error) })
    
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données entreprise', details: message },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST - Enrichir données client avec RNE/INSEE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    
    const body = await request.json()
    const { siren, siret } = body
    
    if (!siren && !siret) {
      return NextResponse.json(
        { success: false, error: 'SIREN ou SIRET requis' },
        { status: 400 }
      )
    }
    
    const identifier = siren || siret
    const entreprise = await getEntreprise(identifier)
    
    // Préparer les données enrichies pour le client
    const clientData = entrepriseToClientData(entreprise)
    
    return NextResponse.json({
      success: true,
      source: entreprise.source,
      data: {
        entreprise,
        client_data: clientData,
        ratios_financiers: entreprise.ratios,
        chiffres_cles: {
          chiffre_affaires: entreprise.derniers_chiffres?.chiffre_affaires,
          resultat_net: entreprise.derniers_chiffres?.resultat_net,
          effectif: entreprise.effectif_estime || entreprise.derniers_chiffres?.effectif,
          annee_reference: entreprise.derniers_chiffres?.annee,
          croissance_ca: entreprise.ratios?.croissance_ca,
          marge_nette: entreprise.ratios?.marge_nette,
        },
        liens: entreprise.liens,
      }
    })
    
  } catch (error) {
    logger.error('[API Entreprise] Erreur POST:', { error: error instanceof Error ? error.message : String(error) })
    
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enrichissement des données', details: message },
      { status: 500 }
    )
  }
}
