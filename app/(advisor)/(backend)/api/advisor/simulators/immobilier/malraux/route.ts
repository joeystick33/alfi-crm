/**
 * API Route - Simulateur Malraux
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/malraux
 * 
 * Dispositif Malraux (CGI art. 199 tervicies) :
 * - Réduction d'impôt sur travaux de restauration
 * - Immeubles situés en SPR (Site Patrimonial Remarquable) ou QAD
 * - Taux : 30% SPR/PSMV, 22% QAD
 * - Plafond travaux : 400 000 € sur 4 ans
 * - Engagement de location 9 ans
 * - HORS PLAFOND DES NICHES FISCALES (avantage majeur)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import {
  calculNombreParts,
  calculIRDetaille,
  calculIFI,
  calculMensualiteCredit,
  calculTableauAmortissement,
  calculImpotPlusValue,
  calculTRI,
} from '../_shared/calculations'
import {
  MALRAUX,
  PRELEVEMENTS_SOCIAUX,
} from '../_shared/constants'
import { malrauxInputSchema, type MalrauxInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION MALRAUX
// ══════════════════════════════════════════════════════════════════════════════

function simulerMalraux(input: MalrauxInput) {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. PROFIL FISCAL
  // ─────────────────────────────────────────────────────────────────────────────
  const nombreParts = calculNombreParts({
    situationFamiliale: input.situationFamiliale,
    enfantsACharge: input.enfantsACharge,
    enfantsGardeAlternee: input.enfantsGardeAlternee,
    parentIsole: input.parentIsole,
  })

  const revenusTotaux = input.revenusSalaires + input.revenusFonciersExistants + input.autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi

  // IFI avant investissement
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant,
    dettesDeductibles: input.dettesImmobilieres,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CALCUL DE LA RÉDUCTION MALRAUX
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxReduction = input.typeSecteur === 'SPR' ? MALRAUX.TAUX_SPR : MALRAUX.TAUX_QAD
  const travauxEligibles = Math.min(input.travaux, MALRAUX.PLAFOND_TRAVAUX)
  const reductionTotale = travauxEligibles * (tauxReduction / 100)
  const reductionParAn = reductionTotale / input.dureeTravaux

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = input.prixAcquisition + input.fraisNotaire + input.travaux
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    charges: number
    interets: number
    revenuFoncier: number
    ir: number
    ps: number
    reductionMalraux: number
    reductionEffective: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
    phaseTravaux: boolean
    engagementLocation: boolean
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let loyerActuel = 0 // Pas de loyer pendant les travaux
  let valeurBien = input.prixAcquisition + input.travaux
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let reductionMalrauxCumulee = 0
  let reductionEffectiveCumulee = 0
  
  const anneeFinTravaux = anneeAcq + input.dureeTravaux - 1
  const anneeDebutLocation = anneeFinTravaux + 1
  const anneeFinEngagement = anneeDebutLocation + MALRAUX.ENGAGEMENT_LOCATION - 1

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1
    const phaseTravaux = i <= input.dureeTravaux
    const engagementLocation = annee >= anneeDebutLocation && annee <= anneeFinEngagement

    // Loyer (après travaux uniquement)
    if (!phaseTravaux) {
      if (i === input.dureeTravaux + 1) {
        loyerActuel = loyerAnnuelNet
      } else if (i > input.dureeTravaux + 1) {
        loyerActuel *= (1 + input.revalorisationLoyer / 100)
      }
    }

    // Revalorisation bien
    if (i > 1) {
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Revenu foncier (régime réel)
    const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceMensuelle * 12
    const revenuFoncier = loyerActuel - chargesDeductibles

    // IR et PS sur revenus fonciers (après travaux)
    const ir = revenuFoncier > 0 ? revenuFoncier * (tmi / 100) : 0
    const ps = revenuFoncier > 0 ? revenuFoncier * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL : 0

    // Réduction Malraux (pendant les travaux)
    const reductionMalraux = phaseTravaux ? reductionParAn : 0
    // Plafonnée par l'IR dû (MAIS HORS PLAFOND NICHES)
    const irDuTotal = irAvant.impotNet
    const reductionEffective = Math.min(reductionMalraux, irDuTotal)

    irCumule += ir
    psCumule += ps
    reductionMalrauxCumulee += reductionMalraux
    reductionEffectiveCumulee += reductionEffective

    // Cash-flow
    const cfAvantImpots = loyerActuel - chargesAnnuelles - fraisGestionAnnuel - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps + reductionEffective
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerActuel),
      charges: Math.round(chargesAnnuelles + fraisGestionAnnuel),
      interets: Math.round(interetsAnnuels),
      revenuFoncier: Math.round(revenuFoncier),
      ir: Math.round(ir),
      ps: Math.round(ps),
      reductionMalraux: Math.round(reductionMalraux),
      reductionEffective: Math.round(reductionEffective),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
      phaseTravaux,
      engagementLocation,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PLUS-VALUE À LA REVENTE
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  const prixRevientPV = input.prixAcquisition + input.fraisNotaire + input.travaux
  const pvResult = calculImpotPlusValue(
    prixRevientPV,
    valeurRevente,
    input.dureeDetention
  )
  
  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  const plusValueNette = pvResult.plusValueBrute - pvResult.impotTotal - fraisReventeEur

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. IFI APRÈS INVESTISSEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rentaBrute = (loyerAnnuelBrut / (input.prixAcquisition + input.travaux)) * 100
  const rentaNette = ((loyerAnnuelNet - chargesAnnuelles) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  // Note: les réductions Malraux sont déjà incluses dans le cash-flow via l'IR réduit
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesMalraux(input, reductionTotale, irAvant.impotNet, tauxReduction)

  return {
    success: true,
    synthese: {
      investTotal,
      montantEmprunte,
      mensualite: Math.round(mensualite),
      loyerAnnuel: Math.round(loyerAnnuelNet),
      rentaBrute: Math.round(rentaBrute * 100) / 100,
      rentaNette: Math.round(rentaNette * 100) / 100,
      tri,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel: Math.round(cashFlowMoyen / 12),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      reductionMalrauxTotale: Math.round(reductionMalrauxCumulee),
      reductionEffective: Math.round(reductionEffectiveCumulee),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    dispositifMalraux: {
      typeSecteur: input.typeSecteur,
      tauxReduction,
      travaux: input.travaux,
      travauxEligibles,
      plafondTravaux: MALRAUX.PLAFOND_TRAVAUX,
      dureeTravaux: input.dureeTravaux,
      dureeMaxTravaux: MALRAUX.DUREE_TRAVAUX_MAX,
      reductionTotale: Math.round(reductionTotale),
      reductionParAn: Math.round(reductionParAn),
      engagementLocation: MALRAUX.ENGAGEMENT_LOCATION,
      anneeFinTravaux,
      anneeDebutLocation,
      anneeFinEngagement,
      horsPlafondNiches: MALRAUX.HORS_PLAFOND_NICHES,
    },
    profilClient: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
      ifiAvant: ifiAvant.impotNet,
      assujettiIFIAvant: ifiAvant.assujetti,
      ifiApres: ifiApres.impotNet,
      assujettiIFIApres: ifiApres.assujetti,
    },
    plusValue: pvResult,
    projections,
    alertes,
  }
}

function generateAlertesMalraux(
  input: MalrauxInput,
  reductionTotale: number,
  irAvant: number,
  tauxReduction: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Hors plafond niches
  alertes.push({
    type: 'success',
    message: `✅ Réduction Malraux HORS PLAFOND des niches fiscales (10 000 €). Avantage majeur.`,
  })

  // Taux selon secteur
  alertes.push({
    type: 'info',
    message: `📋 Secteur ${input.typeSecteur} : taux de réduction ${tauxReduction}%.`,
  })

  // Plafond travaux
  if (input.travaux > MALRAUX.PLAFOND_TRAVAUX) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Travaux (${input.travaux.toLocaleString('fr-FR')} €) > plafond (${MALRAUX.PLAFOND_TRAVAUX.toLocaleString('fr-FR')} €). Réduction calculée sur ${MALRAUX.PLAFOND_TRAVAUX.toLocaleString('fr-FR')} €.`,
    })
  }

  // IR insuffisant
  const reductionParAn = reductionTotale / input.dureeTravaux
  if (reductionParAn > irAvant) {
    alertes.push({
      type: 'warning',
      message: `⚠️ IR (${irAvant.toLocaleString('fr-FR')} €) < réduction annuelle (${Math.round(reductionParAn).toLocaleString('fr-FR')} €). Excédent perdu (pas de report).`,
    })
  }

  // Engagement location
  alertes.push({
    type: 'info',
    message: `📋 Engagement de location nue ${MALRAUX.ENGAGEMENT_LOCATION} ans. Non-respect = reprise de la réduction.`,
  })

  // Durée travaux
  if (input.dureeTravaux > MALRAUX.DUREE_TRAVAUX_MAX) {
    alertes.push({
      type: 'error',
      message: `❌ Durée travaux (${input.dureeTravaux} ans) > maximum (${MALRAUX.DUREE_TRAVAUX_MAX} ans).`,
    })
  }

  return alertes
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const input = malrauxInputSchema.parse(body)

    const resultat = simulerMalraux(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur Malraux:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Malraux - Réduction sur travaux de restauration',
      tauxReduction: {
        SPR: MALRAUX.TAUX_SPR,
        QAD: MALRAUX.TAUX_QAD,
      },
      plafondTravaux: MALRAUX.PLAFOND_TRAVAUX,
      dureeMaxTravaux: MALRAUX.DUREE_TRAVAUX_MAX,
      engagementLocation: MALRAUX.ENGAGEMENT_LOCATION,
      horsPlafondNiches: MALRAUX.HORS_PLAFOND_NICHES,
      secteurs: ['SPR', 'QAD'],
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 200000,
        travaux: 300000,
        dureeTravaux: 3,
        typeSecteur: 'SPR',
        loyerMensuel: 1200,
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 15,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
