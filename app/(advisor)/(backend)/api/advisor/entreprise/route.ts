 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API ENTREPRISE - RECHERCHE ET ENRICHISSEMENT
 * GET: Recherche d'entreprises
 * POST: Enrichissement et vérification
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import EntrepriseService from '@/lib/services/entreprise'

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

const RechercheSchema = z.object({
  q: z.string().min(2, 'Minimum 2 caractères'),
  limit: z.number().min(1).max(25).optional(),
  activeOnly: z.boolean().optional(),
})

const EnrichissementSchema = z.object({
  siren: z.string().regex(/^\d{9}$/, 'SIREN invalide'),
})

const VerificationSchema = z.object({
  sirens: z.array(z.string().regex(/^\d{9}$/)).min(1).max(100),
})

// ══════════════════════════════════════════════════════════════════════════════
// GET - Recherche d'entreprises
// ══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      activeOnly: searchParams.get('activeOnly') === 'true',
    }
    
    const validation = RechercheSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }
    
    const { q, limit, activeOnly } = validation.data
    
    // Détecter le type de recherche
    const typeRecherche = EntrepriseService.detecterTypeRecherche(q)
    
    let entreprises
    
    if (typeRecherche === 'siren') {
      const entreprise = await EntrepriseService.rechercherParSiren(q)
      entreprises = entreprise ? [entreprise] : []
    } else if (typeRecherche === 'siret') {
      const entreprise = await EntrepriseService.rechercherParSiret(q)
      entreprises = entreprise ? [entreprise] : []
    } else {
      entreprises = await EntrepriseService.rechercherParNom(q, {
        per_page: limit || 10,
        etat_administratif: activeOnly ? 'A' : undefined,
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        query: q,
        type: typeRecherche,
        count: entreprises.length,
        entreprises,
      },
    })
    
  } catch (error) {
    console.error('[API Entreprise] Erreur GET:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// POST - Enrichissement ou vérification batch
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'enrichir'
    
    // Action: Enrichir une entreprise
    if (action === 'enrichir') {
      const validation = EnrichissementSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'SIREN invalide', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      
      const { siren } = validation.data
      const profil = await EntrepriseService.genererProfilEntreprise(siren)
      
      if (!profil) {
        return NextResponse.json(
          { success: false, error: 'Entreprise non trouvée' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: profil,
      })
    }
    
    // Action: Vérifier plusieurs entreprises (batch)
    if (action === 'verifier') {
      const validation = VerificationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: 'Liste de SIREN invalide', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      
      const { sirens } = validation.data
      const resultats: {
        siren: string
        statut: 'active' | 'cessee' | 'non_trouvee'
        alertes: any[]
        score?: number
      }[] = []
      
      // Traiter par lots pour éviter de surcharger l'API
      for (const siren of sirens) {
        try {
          const entreprise = await EntrepriseService.rechercherParSiren(siren)
          
          if (!entreprise) {
            resultats.push({
              siren,
              statut: 'non_trouvee',
              alertes: [{
                type: 'non_trouvee',
                niveau: 'danger',
                titre: 'Entreprise non trouvée',
                message: 'Le SIREN ne correspond à aucune entreprise dans la base SIRENE.',
              }],
            })
          } else {
            const alertes = EntrepriseService.detecterAlertes(entreprise)
            const score = EntrepriseService.calculerScoreFinancier(entreprise)
            
            resultats.push({
              siren,
              statut: entreprise.etat_administratif === 'A' ? 'active' : 'cessee',
              alertes,
              score: score.score,
            })
          }
          
          // Pause pour respecter la limite de 7 req/s
          await new Promise(resolve => setTimeout(resolve, 150))
          
        } catch (err) {
          resultats.push({
            siren,
            statut: 'non_trouvee',
            alertes: [{
              type: 'erreur',
              niveau: 'warning',
              titre: 'Erreur de vérification',
              message: 'Impossible de vérifier cette entreprise.',
            }],
          })
        }
      }
      
      // Résumé
      const resume = {
        total: resultats.length,
        actives: resultats.filter(r => r.statut === 'active').length,
        cessees: resultats.filter(r => r.statut === 'cessee').length,
        nonTrouvees: resultats.filter(r => r.statut === 'non_trouvee').length,
        avecAlertes: resultats.filter(r => r.alertes.length > 0).length,
      }
      
      return NextResponse.json({
        success: true,
        data: {
          resume,
          resultats,
        },
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Action inconnue' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('[API Entreprise] Erreur POST:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
