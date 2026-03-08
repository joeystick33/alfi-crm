// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/intelligence-fiscale
// Analyse d'intelligence fiscale — calcule les recommandations d'optimisation
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { availableQuotaFraction, reserveFraction } from '../engines/forced-heirship-calculator'
import { logger } from '@/app/_common/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sd = body.simulationData || body

    const nbEnfants = Number(sd.nombre_enfants || 0)
    const patrimoineNet = Number(sd.patrimoine_net_total || 0)
    const presenceAV = !!sd.presence_assurance_vie
    const presenceDonations = !!sd.presence_donations
    const presenceRP = !!sd.presence_residence_principale
    const valeurRP = Number(sd.valeur_residence_principale || 0)
    const ageDefunt = Number(sd.age_defunt || 0)
    const ageConjoint = Number(sd.age_conjoint_survivant || 0)
    const statut = (sd.statut_matrimonial || '').toLowerCase()

    const recommendations: Array<{ titre: string; description: string; impact: string; priorite: string }> = []

    // Recommendation: Assurance-vie avant 70 ans
    if (!presenceAV && patrimoineNet > 100000) {
      recommendations.push({
        titre: 'Assurance-vie avant 70 ans',
        description: "Versement sur contrat d'assurance-vie avant 70 ans pour bénéficier de l'abattement de 152 500 € par bénéficiaire (art. 990 I CGI).",
        impact: `Économie potentielle: ${Math.min(nbEnfants * 152500 * 0.20, patrimoineNet * 0.15).toFixed(0)} €`,
        priorite: 'HAUTE',
      })
    }

    // Recommendation: Donation-partage
    if (!presenceDonations && nbEnfants > 0 && patrimoineNet > 200000) {
      const abattementParEnfant = 100000
      const economie = Math.min(nbEnfants * abattementParEnfant * 0.20, patrimoineNet * 0.10)
      recommendations.push({
        titre: 'Donation-partage',
        description: `Donation anticipée aux ${nbEnfants} enfant(s) avec abattement de 100 000 € chacun (renouvelable tous les 15 ans).`,
        impact: `Économie potentielle: ${economie.toFixed(0)} €`,
        priorite: 'HAUTE',
      })
    }

    // Recommendation: Démembrement RP
    if (presenceRP && valeurRP > 200000 && statut.includes('mari')) {
      recommendations.push({
        titre: 'Démembrement de la résidence principale',
        description: "Donation de la nue-propriété de la RP aux enfants en conservant l'usufruit. Réduit la base taxable à la succession.",
        impact: `Valeur nue-propriété transmise hors succession: ${Math.round(valeurRP * 0.5).toFixed(0)} € (estimée)`,
        priorite: 'MOYENNE',
      })
    }

    // Recommendation: DDV
    if (statut.includes('mari') && nbEnfants > 0) {
      recommendations.push({
        titre: 'Donation au Dernier Vivant (DDV)',
        description: "Protection renforcée du conjoint survivant au-delà du droit légal. Permet de choisir l'option la plus avantageuse fiscalement.",
        impact: 'Optimisation de la répartition civile et fiscale',
        priorite: 'MOYENNE',
      })
    }

    const analyse = {
      dateAnalyse: new Date().toISOString(),
      profilClient: {
        statutMatrimonial: statut,
        nbEnfants,
        patrimoineNet,
        ageDefunt,
        ageConjoint,
      },
      recommandations: recommendations,
      indicateurs: {
        tauxTransmissionActuel: patrimoineNet > 0 ? Math.round((patrimoineNet * 0.85) / patrimoineNet * 100) : 100,
        tauxTransmissionOptimise: patrimoineNet > 0 ? Math.round((patrimoineNet * 0.92) / patrimoineNet * 100) : 100,
        economieEstimee: recommendations.reduce((s, r) => {
          const match = r.impact.match(/(\d+)/)
          return s + (match ? parseInt(match[1]) : 0)
        }, 0),
        reserveHereditaire: Math.round(patrimoineNet * reserveFraction(nbEnfants)),
        quotiteDisponible: Math.round(patrimoineNet * availableQuotaFraction(nbEnfants)),
      },
      scoreOptimisation: Math.min(100, recommendations.length * 25),
    }

    return NextResponse.json({ succes: true, analyse })
  } catch (error: any) {
    logger.error('[intelligence-fiscale] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { succes: false, erreur: error.message || 'Erreur interne' },
      { status: 400 },
    )
  }
}
