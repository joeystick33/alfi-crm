// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/optimisations-chiffrees
// Calcul des optimisations chiffrées (donation-partage, AV, démembrement)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { availableQuotaFraction } from '../engines/forced-heirship-calculator'
import { logger } from '@/app/_common/lib/logger'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sd = body.simulationData || body

    const nbEnfants = Number(sd.nombre_enfants || 0)
    const patrimoineNet = Number(sd.patrimoine_net_total || 0)
    const presenceAV = !!sd.presence_assurance_vie
    const presenceDonations = !!sd.presence_donations
    const ageDefunt = Number(sd.age_defunt || 0)
    const statut = (sd.statut_matrimonial || '').toLowerCase()

    const optimisations: Array<{
      type: string
      titre: string
      description: string
      economieEstimee: number
      montantOptimal: number
      conditions: string[]
    }> = []

    // 1. Donation-partage
    if (nbEnfants > 0) {
      const abattementTotal = nbEnfants * 100000
      const montantOptimal = Math.min(abattementTotal, patrimoineNet * 0.3)
      const economie = Math.round(montantOptimal * 0.20) // ~20% de droits économisés
      optimisations.push({
        type: 'DONATION_PARTAGE',
        titre: 'Donation-partage anticipée',
        description: `Donation de ${montantOptimal.toLocaleString('fr-FR')} € répartie entre ${nbEnfants} enfant(s), avec abattement de 100 000 € chacun.`,
        economieEstimee: economie,
        montantOptimal,
        conditions: [
          'Abattement renouvelable tous les 15 ans',
          'Rapport fiscal si décès < 15 ans après donation',
          `Quotité disponible: ${Math.round(availableQuotaFraction(nbEnfants) * 100)}% du patrimoine`,
        ],
      })
    }

    // 2. Assurance-vie avant 70 ans
    if (ageDefunt < 70 || ageDefunt === 0) {
      const abattementAV = nbEnfants > 0 ? nbEnfants * 152500 : 152500
      const montantOptimal = Math.min(abattementAV, patrimoineNet * 0.25)
      const economie = Math.round(montantOptimal * 0.20)
      optimisations.push({
        type: 'ASSURANCE_VIE_AVANT_70',
        titre: 'Assurance-vie (versements avant 70 ans)',
        description: `Versement de ${montantOptimal.toLocaleString('fr-FR')} € sur contrat(s) d'assurance-vie avec clause bénéficiaire démembrée.`,
        economieEstimee: economie,
        montantOptimal,
        conditions: [
          'Abattement 152 500 € par bénéficiaire (art. 990 I CGI)',
          'Primes non rapportables à la succession',
          'Clause bénéficiaire démembrée recommandée si conjoint + enfants',
        ],
      })
    }

    // 3. Assurance-vie après 70 ans
    if (ageDefunt >= 70) {
      const montantOptimal = Math.min(30500, patrimoineNet * 0.05)
      const economie = Math.round(montantOptimal * 0.15)
      optimisations.push({
        type: 'ASSURANCE_VIE_APRES_70',
        titre: 'Assurance-vie (versements après 70 ans)',
        description: `Versement complémentaire de ${montantOptimal.toLocaleString('fr-FR')} € après 70 ans.`,
        economieEstimee: economie,
        montantOptimal,
        conditions: [
          'Abattement global de 30 500 € (art. 757 B CGI)',
          'Intérêts et plus-values exonérés',
          'Complémentaire aux versements avant 70 ans',
        ],
      })
    }

    // 4. Démembrement
    if (statut.includes('mari') && nbEnfants > 0 && patrimoineNet > 300000) {
      const valeurNP = Math.round(patrimoineNet * 0.15 * 0.5) // ~50% NP sur 15% du patrimoine
      const economie = Math.round(valeurNP * 0.20)
      optimisations.push({
        type: 'DEMEMBREMENT',
        titre: 'Démembrement de propriété',
        description: 'Donation de la nue-propriété aux enfants en conservant l\'usufruit sur des biens sélectionnés.',
        economieEstimee: economie,
        montantOptimal: valeurNP,
        conditions: [
          'Réduction de la base taxable future',
          'Conservation de l\'usufruit (revenus/jouissance)',
          'Valorisation fiscale selon barème art. 669 CGI',
        ],
      })
    }

    const totalEconomie = optimisations.reduce((s, o) => s + o.economieEstimee, 0)

    return NextResponse.json({
      succes: true,
      resultat: {
        optimisations,
        synthese: {
          nombreOptimisations: optimisations.length,
          economieGlobaleEstimee: totalEconomie,
          tauxOptimisation: patrimoineNet > 0 ? Math.round(totalEconomie / patrimoineNet * 10000) / 100 : 0,
        },
      },
    })
  } catch (error: any) {
    logger.error('[optimisations-chiffrees] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { succes: false, erreur: error.message || 'Erreur interne' },
      { status: 400 },
    )
  }
}
