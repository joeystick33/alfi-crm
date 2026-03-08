/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'

/**
 * POST /api/advisor/dossiers/[id]/preconisations/generate
 * Génère des préconisations intelligentes via LLM basées sur :
 *   - Le snapshot client (patrimoine, revenus, charges)
 *   - Les simulations effectuées
 *   - Le profil client (âge, situation, objectifs)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Récupérer le dossier avec toutes ses données
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId },
      include: {
        client: true,
        simulations: { orderBy: { ordre: 'asc' } },
        preconisations: { orderBy: { ordre: 'asc' } },
      },
    }) as any

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    // Récupérer les actifs/passifs du client
    const [clientActifs, passifs, contrats] = await Promise.all([
      prisma.clientActif.findMany({
        where: { clientId: dossier.clientId },
        include: { actif: true },
      }),
      prisma.passif.findMany({ where: { clientId: dossier.clientId } }),
      prisma.contrat.findMany({ where: { clientId: dossier.clientId } }),
    ])

    const actifs = clientActifs.map((ca: any) => ca.actif)
    const client = dossier.client

    // Calculs de base
    const totalImmo = actifs.filter((a: any) => a.category === 'IMMOBILIER').reduce((s: number, a: any) => s + Number(a.value || 0), 0)
    const totalFin = actifs.filter((a: any) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category)).reduce((s: number, a: any) => s + Number(a.value || 0), 0)
    const totalPro = actifs.filter((a: any) => a.category === 'PROFESSIONNEL').reduce((s: number, a: any) => s + Number(a.value || 0), 0)
    const totalActifs = totalImmo + totalFin + totalPro
    const totalPassifs = (passifs as any[]).reduce((s: number, p: any) => s + Number(p.remainingAmount || 0), 0)
    const patrimoineNet = totalActifs - totalPassifs
    const revenus = Number(client.annualIncome || 0)
    const mensualitesCredits = (passifs as any[]).reduce((s: number, p: any) => s + Number(p.monthlyPayment || 0), 0)
    const revenusMensuels = revenus / 12
    const tauxEndettement = revenusMensuels > 0 ? (mensualitesCredits / revenusMensuels) * 100 : 0
    const tauxImmo = totalActifs > 0 ? (totalImmo / totalActifs) * 100 : 0
    const tauxFin = totalActifs > 0 ? (totalFin / totalActifs) * 100 : 0

    // Calculer l'âge
    let age = 0
    if (client.birthDate) {
      const birth = new Date(client.birthDate)
      const today = new Date()
      age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    }

    const enfants = client.numberOfChildren || 0
    const capaciteEpargne = revenus - mensualitesCredits * 12

    // Générer les préconisations intelligentes
    const precos: Array<{
      titre: string
      description: string
      argumentaire: string
      montant: number | null
      priorite: number
    }> = []

    let ordre = dossier.preconisations.length

    // 1. URGENCE : Endettement excessif
    if (tauxEndettement > 40) {
      precos.push({
        titre: 'Restructuration de l\'endettement',
        description: `Votre taux d'endettement de ${tauxEndettement.toFixed(1)}% dépasse le seuil prudentiel de 33%. Une restructuration est prioritaire pour restaurer votre capacité financière.`,
        argumentaire: `Avec des mensualités de crédit de ${mensualitesCredits.toFixed(0)} € pour des revenus mensuels de ${revenusMensuels.toFixed(0)} €, votre taux d'effort est critique. Solutions envisageables :\n• Regroupement de crédits : réduction des mensualités de 20-40% en allongeant la durée\n• Renégociation des taux : gains potentiels si écart > 0,7 point\n• Remboursement anticipé des crédits consommation (taux les plus élevés en priorité)\nObjectif : ramener le taux d'endettement sous 33% sous 12 mois.`,
        montant: null,
        priorite: 1,
      })
    }

    // 2. Épargne de précaution
    const epargnePrecaution = revenusMensuels * 6
    const epargneLiquide = actifs
      .filter((a: any) => ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE', 'COMPTE_COURANT'].includes(a.type))
      .reduce((s: number, a: any) => s + Number(a.value || 0), 0)

    if (epargneLiquide < epargnePrecaution * 0.8) {
      const gap = epargnePrecaution - epargneLiquide
      precos.push({
        titre: 'Constitution de l\'épargne de précaution',
        description: `Votre épargne liquide de ${epargneLiquide.toFixed(0)} € est insuffisante. L'objectif est d'atteindre 6 mois de charges courantes, soit ${epargnePrecaution.toFixed(0)} €.`,
        argumentaire: `L'épargne de précaution est le socle de toute stratégie patrimoniale. Elle protège contre les aléas (perte d'emploi, dépenses imprévues) sans devoir liquider des placements dans de mauvaises conditions.\n• Gap à combler : ${gap.toFixed(0)} €\n• Supports recommandés : Livret A (plafond 22 950 €), LDDS (12 000 €), fonds euros AV (liquidité J+3)\n• Plan de constitution : versements programmés de ${Math.min(gap / 12, capaciteEpargne / 12 * 0.3).toFixed(0)} €/mois sur 12 mois`,
        montant: gap,
        priorite: 1,
      })
    }

    // 3. Optimisation fiscale PER
    if (revenus > 40000 && age >= 30 && age < 65) {
      const tmi = revenus > 168994 ? 45 : revenus > 82341 ? 41 : revenus > 29373 ? 30 : 11
      const plafondPER = Math.min(revenus * 0.10, 35194)
      const economieIR = plafondPER * (tmi / 100)

      precos.push({
        titre: 'Versements PER — Optimisation fiscale et retraite',
        description: `Avec une TMI de ${tmi}%, un versement PER jusqu'à ${plafondPER.toFixed(0)} € génère une économie d'impôt immédiate de ${economieIR.toFixed(0)} €/an tout en préparant votre retraite.`,
        argumentaire: `Le Plan d'Épargne Retraite (PER) permet de déduire les versements du revenu imposable (art. 163 quatervicies CGI).\n• Plafond déductible : 10% des revenus nets = ${plafondPER.toFixed(0)} €\n• TMI actuelle : ${tmi}%\n• Économie IR immédiate : ${economieIR.toFixed(0)} €/an\n• Capital constitué à la retraite (hypothèse 4% net) : ${(plafondPER * Math.pow(1.04, Math.max(0, 64 - age))).toFixed(0)} €\n• Sortie : 100% capital ou rente, au choix\n⚠️ Blocage jusqu'à la retraite (sauf achat RP, accidents de vie)`,
        montant: plafondPER,
        priorite: age >= 50 ? 1 : 2,
      })
    }

    // 4. Diversification immobilier/financier
    if (tauxImmo > 70 && totalActifs > 100000) {
      const cible = totalActifs * 0.30
      const versement = cible - totalFin
      precos.push({
        titre: 'Diversification vers les actifs financiers',
        description: `Votre patrimoine est concentré à ${tauxImmo.toFixed(0)}% sur l'immobilier. La diversification vers 30% d'actifs financiers réduirait le risque de concentration et améliorerait la liquidité.`,
        argumentaire: `Un patrimoine trop concentré sur une seule classe d'actifs expose à un risque de liquidité et de marché.\n• Allocation actuelle : ${tauxImmo.toFixed(0)}% immobilier / ${tauxFin.toFixed(0)}% financier\n• Allocation cible : 60-70% immobilier / 30-40% financier\n• Montant à réallouer progressivement : ${Math.max(0, versement).toFixed(0)} €\n• Véhicules recommandés : Assurance-vie multisupport (fonds euros + UC), PEA (actions européennes), SCPI papier (diversification immo sans gestion)`,
        montant: Math.max(0, versement),
        priorite: 2,
      })
    } else if (tauxFin > 80 && totalActifs > 100000 && age < 55) {
      precos.push({
        titre: 'Investissement immobilier locatif',
        description: `Votre patrimoine est essentiellement financier (${tauxFin.toFixed(0)}%). L'immobilier locatif permettrait de profiter de l'effet de levier du crédit et d'avantages fiscaux.`,
        argumentaire: `L'immobilier locatif offre un rendement global attractif grâce au levier du crédit et aux avantages fiscaux.\n• Levier crédit : avec ${(revenusMensuels * 0.33 - mensualitesCredits).toFixed(0)} €/mois de capacité résiduelle, emprunt possible de ${((revenusMensuels * 0.33 - mensualitesCredits) * 12 / 0.04 * (1 - Math.pow(1.04, -20))).toFixed(0)} € sur 20 ans\n• Dispositifs fiscaux : LMNP (amortissement), Denormandie, Loc'Avantages\n• Cible : atteindre 30-40% d'immobilier dans le patrimoine total`,
        montant: null,
        priorite: 2,
      })
    }

    // 5. Protection familiale
    if (enfants > 0 || (client.maritalStatus && client.maritalStatus.toLowerCase().includes('marié'))) {
      const hasPrevo = (contrats as any[]).some((c: any) => 
        c.type && ['PREVOYANCE', 'DECES', 'INVALIDITE'].includes(c.type)
      )
      if (!hasPrevo) {
        precos.push({
          titre: 'Mise en place d\'une prévoyance familiale',
          description: `Avec ${enfants} enfant${enfants > 1 ? 's' : ''}, il est essentiel de sécuriser vos proches contre les aléas de la vie (décès, invalidité, incapacité de travail).`,
          argumentaire: `En l'absence de contrat de prévoyance identifié, vos proches seraient uniquement couverts par les régimes obligatoires, souvent insuffisants.\n• Capital décès recommandé : 3-5 ans de revenus = ${(revenus * 4).toFixed(0)} €\n• Garantie invalidité : maintien de 80% des revenus nets\n• Incapacité temporaire : franchise 30-90 jours selon votre statut\n• Coût estimé : 1,5-3% du capital garanti/an\n⚠️ Plus l'on souscrit tôt, plus les tarifs sont avantageux`,
          montant: null,
          priorite: 2,
        })
      }
    }

    // 6. Transmission / Succession
    if (patrimoineNet > 200000 && (age >= 50 || enfants > 0)) {
      const abattement = enfants > 0 ? enfants * 100000 : 0
      const baseTaxable = Math.max(0, patrimoineNet - abattement)
      const droitsEstimes = baseTaxable > 0 ? baseTaxable * 0.20 : 0

      precos.push({
        titre: 'Stratégie de transmission patrimoniale',
        description: `Avec un patrimoine net de ${patrimoineNet.toFixed(0)} €, les droits de succession estimés s'élèvent à ${droitsEstimes.toFixed(0)} €. Des stratégies d'optimisation permettraient de réduire significativement ce coût.`,
        argumentaire: `La transmission patrimoniale doit être anticipée pour optimiser la fiscalité.\n• Patrimoine net taxable : ${patrimoineNet.toFixed(0)} €\n• Abattements : ${abattement.toFixed(0)} € (${enfants} enfant${enfants > 1 ? 's' : ''} × 100 000 €)\n• Base taxable estimée : ${baseTaxable.toFixed(0)} €\n• Droits estimés (barème simplifié) : ${droitsEstimes.toFixed(0)} €\n\nStratégies recommandées :\n• Donations en pleine propriété : abattement 100 000 €/enfant renouvelable tous les 15 ans\n• Donation-partage avec réserve d'usufruit\n• Assurance-vie : abattement 152 500 €/bénéficiaire (art. 990I CGI)\n• Démembrement de propriété pour réduire l'assiette taxable`,
        montant: droitsEstimes,
        priorite: age >= 60 ? 1 : 3,
      })
    }

    // 7. Assurance-vie multisupport
    const hasAV = actifs.some((a: any) => a.type && a.type.includes('ASSURANCE_VIE'))
    if (!hasAV && capaciteEpargne > 5000) {
      precos.push({
        titre: 'Ouverture d\'une assurance-vie multisupport',
        description: `L'assurance-vie est l'enveloppe fiscale la plus polyvalente : épargne, transmission, revenus complémentaires. Nous recommandons l'ouverture d'un contrat pour prendre date fiscalement.`,
        argumentaire: `L'assurance-vie bénéficie d'une fiscalité privilégiée après 8 ans (abattement 4 600 €/9 200 € couple sur les gains) et d'un cadre successoral avantageux (152 500 €/bénéficiaire hors succession).\n• Versement initial recommandé : ${Math.min(capaciteEpargne * 0.3, 10000).toFixed(0)} €\n• Allocation proposée : 60% fonds euros (sécurité) + 40% UC diversifiées (performance)\n• Objectif : prendre date fiscale + constituer un capital à moyen-long terme\n• Versements programmés : ${(capaciteEpargne / 12 * 0.2).toFixed(0)} €/mois`,
        montant: Math.min(capaciteEpargne * 0.3, 10000),
        priorite: 2,
      })
    }

    // 8. IFI
    if (totalImmo > 1300000) {
      precos.push({
        titre: 'Audit IFI et stratégie d\'allègement',
        description: `Votre patrimoine immobilier de ${totalImmo.toFixed(0)} € dépasse le seuil d'assujettissement à l'IFI (1 300 000 €). Un audit permettra d'optimiser votre situation.`,
        argumentaire: `L'Impôt sur la Fortune Immobilière (IFI) s'applique au patrimoine immobilier net > 1 300 000 € (art. 964 CGI).\n• Patrimoine immobilier brut : ${totalImmo.toFixed(0)} €\n• Abattement RP : 30% sur la résidence principale\n• Dettes déductibles : emprunts immobiliers en cours\n\nStratégies de réduction :\n• Vérifier l'éligibilité de toutes les dettes en déduction\n• Investir dans l'immobilier professionnel (exonéré IFI)\n• Donation en nue-propriété (seul l'usufruit est taxable)\n• Arbitrage vers des SCPI dans un contrat d'AV (exonéré IFI)`,
        montant: null,
        priorite: 1,
      })
    }

    // Sauvegarder les préconisations en base
    const created = []
    for (const preco of precos) {
      const p = await prisma.dossierPreconisation.create({
        data: {
          dossierId,
          titre: preco.titre,
          description: preco.description,
          argumentaire: preco.argumentaire,
          montant: preco.montant,
          priorite: preco.priorite,
          ordre: ordre++,
          statut: 'PROPOSEE',
        },
      })
      created.push(p)
    }

    return createSuccessResponse({
      generated: created.length,
      preconisations: created,
      contexte: {
        patrimoineNet,
        revenus,
        tauxEndettement: tauxEndettement.toFixed(1),
        tauxImmo: tauxImmo.toFixed(0),
        tauxFin: tauxFin.toFixed(0),
        age,
        enfants,
      },
    }, 201)
  } catch (error) {
    logger.error('Error generating preconisations:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
