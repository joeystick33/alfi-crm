/**
 * API Route - Simulateur Pinel
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/pinel
 * 
 * Dispositif Pinel (CGI art. 199 novovicies) :
 * - Réduction d'impôt sur acquisition neuf/VEFA
 * - Zones A bis, A, B1 (B2 sur agrément jusqu'à 2024)
 * - Plafonds de loyer et de ressources locataires
 * - Engagement de location 6, 9 ou 12 ans
 * 
 * Taux 2024 (dernière année) :
 * - 6 ans : 9%
 * - 9 ans : 12%
 * - 12 ans : 14%
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
  verifierPlafondNiches,
} from '../_shared/calculations'
import {
  PINEL,
  PRELEVEMENTS_SOCIAUX,
  PLAFOND_NICHES,
} from '../_shared/constants'
import { pinelInputSchema, type PinelInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION PINEL
// ══════════════════════════════════════════════════════════════════════════════

function simulerPinel(input: PinelInput) {
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
  // 2. VÉRIFICATION PLAFONDS PINEL
  // ─────────────────────────────────────────────────────────────────────────────
  // Plafond prix au m²
  const prixM2 = input.prixAcquisition / input.surface
  const respectePlafondM2 = prixM2 <= PINEL.PLAFOND_M2

  // Plafond investissement global
  const baseReduction = Math.min(input.prixAcquisition, PINEL.PLAFOND_INVESTISSEMENT)

  // Plafond loyer selon zone
  const plafondLoyerM2 = PINEL.PLAFONDS_LOYER_M2[input.zone]
  // Coefficient de surface : 0.7 + 19/S (plafonné à 1.2)
  const coeffSurface = Math.min(1.2, 0.7 + 19 / input.surface)
  const loyerPlafond = plafondLoyerM2 * coeffSurface * input.surface
  const respectePlafondLoyer = input.loyerMensuel <= loyerPlafond

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CALCUL DE LA RÉDUCTION PINEL
  // ─────────────────────────────────────────────────────────────────────────────
  const isPinelPlus = input.isPinelPlus
  const zoneEligiblePlus = PINEL.ZONES_AUTORISEES_PLUS.includes(input.zone as typeof PINEL.ZONES_AUTORISEES_PLUS[number])
  const surfaceEligiblePlus = input.surface >= PINEL.SURFACE_MIN_PINEL_PLUS
  const dureeKey = input.dureeEngagement as keyof typeof PINEL.TAUX_REDUCTION
  const tauxReduction = isPinelPlus
    ? PINEL.TAUX_REDUCTION_PLUS[dureeKey] || PINEL.TAUX_REDUCTION_PLUS[6]
    : PINEL.TAUX_REDUCTION[dureeKey] || PINEL.TAUX_REDUCTION[6]
  const reductionTotale = baseReduction * (tauxReduction / 100)
  const reductionAnnuelle = reductionTotale / input.dureeEngagement

  // Vérification plafond des niches fiscales
  const plafondNiches = verifierPlafondNiches(input.autresReductionsImpot, reductionAnnuelle)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = input.prixAcquisition + input.fraisNotaire
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    charges: number
    interets: number
    revenuFoncier: number
    ir: number
    ps: number
    reductionPinel: number
    reductionEffective: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
    engagementActif: boolean
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let loyerActuel = loyerAnnuelNet
  let valeurBien = input.prixAcquisition
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let reductionPinelCumulee = 0
  let reductionPinelEffectiveCumulee = 0

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1
    const engagementActif = i <= input.dureeEngagement

    // Revalorisation
    if (i > 1) {
      loyerActuel *= (1 + input.revalorisationLoyer / 100)
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Revenu foncier (régime réel simplifié)
    const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceMensuelle * 12
    const revenuFoncier = loyerActuel - chargesDeductibles

    // IR et PS sur revenus fonciers
    const ir = revenuFoncier > 0 ? revenuFoncier * (tmi / 100) : 0
    const ps = revenuFoncier > 0 ? revenuFoncier * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL : 0

    // Réduction Pinel (si engagement actif)
    const reductionPinel = engagementActif ? reductionAnnuelle : 0
    // Plafonnée par l'IR dû et le plafond des niches
    const irDuTotal = irAvant.impotNet + ir
    const reductionEffective = Math.min(reductionPinel, irDuTotal, PLAFOND_NICHES.GLOBAL - input.autresReductionsImpot)

    irCumule += ir
    psCumule += ps
    reductionPinelCumulee += reductionPinel
    reductionPinelEffectiveCumulee += reductionEffective

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
      reductionPinel: Math.round(reductionPinel),
      reductionEffective: Math.round(reductionEffective),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
      engagementActif,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PLUS-VALUE À LA REVENTE
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  const pvResult = calculImpotPlusValue(
    input.prixAcquisition,
    valeurRevente,
    input.dureeDetention,
    input.fraisNotaire
  )
  
  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  const plusValueNette = pvResult.plusValueBrute - pvResult.impotTotal - fraisReventeEur

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. IFI APRÈS INVESTISSEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rentaBrute = (loyerAnnuelBrut / input.prixAcquisition) * 100
  const rentaNette = ((loyerAnnuelNet - chargesAnnuelles) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. ALERTES ET RECOMMANDATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesPinel(
    input,
    prixM2,
    loyerPlafond,
    plafondNiches,
    reductionAnnuelle,
    irAvant.impotNet,
    {
      isPinelPlus,
      zoneEligiblePlus,
      surfaceEligiblePlus,
      anneeAcquisition: anneeAcq,
    }
  )

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
      reductionPinelTotale: Math.round(reductionPinelCumulee),
      reductionPinelEffective: Math.round(reductionPinelEffectiveCumulee),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    dispositifPinel: {
      zone: input.zone,
      dureeEngagement: input.dureeEngagement,
      isPinelPlus,
      tauxReduction,
      baseReduction,
      reductionTotale: Math.round(reductionTotale),
      reductionAnnuelle: Math.round(reductionAnnuelle),
      plafondInvestissement: PINEL.PLAFOND_INVESTISSEMENT,
      plafondM2: PINEL.PLAFOND_M2,
      prixM2Reel: Math.round(prixM2),
      respectePlafondM2,
      plafondLoyerM2,
      coefficientSurface: Math.round(coeffSurface * 100) / 100,
      loyerMaximal: Math.round(loyerPlafond),
      loyerReel: input.loyerMensuel,
      respectePlafondLoyer,
    },
    plafondNiches: {
      plafondGlobal: PLAFOND_NICHES.GLOBAL,
      autresReductions: input.autresReductionsImpot,
      reductionPinel: Math.round(reductionAnnuelle),
      totalReductions: Math.round(input.autresReductionsImpot + reductionAnnuelle),
      disponible: plafondNiches.disponible,
      respecte: plafondNiches.respecte,
      exces: plafondNiches.exces,
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

function generateAlertesPinel(
  input: PinelInput,
  prixM2: number,
  loyerPlafond: number,
  plafondNiches: ReturnType<typeof verifierPlafondNiches>,
  reductionAnnuelle: number,
  irAvant: number,
  options: {
    isPinelPlus: boolean
    zoneEligiblePlus: boolean
    surfaceEligiblePlus: boolean
    anneeAcquisition: number
  }
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Plafond prix au m²
  if (prixM2 > PINEL.PLAFOND_M2) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Prix au m² (${Math.round(prixM2).toLocaleString('fr-FR')} €) > plafond Pinel (${PINEL.PLAFOND_M2.toLocaleString('fr-FR')} €). Base de réduction limitée.`,
    })
  }

  // Plafond investissement
  if (input.prixAcquisition > PINEL.PLAFOND_INVESTISSEMENT) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Prix (${input.prixAcquisition.toLocaleString('fr-FR')} €) > plafond (${PINEL.PLAFOND_INVESTISSEMENT.toLocaleString('fr-FR')} €). Réduction calculée sur ${PINEL.PLAFOND_INVESTISSEMENT.toLocaleString('fr-FR')} €.`,
    })
  }

  // Plafond loyer
  if (input.loyerMensuel > loyerPlafond) {
    alertes.push({
      type: 'error',
      message: `❌ Loyer (${input.loyerMensuel.toLocaleString('fr-FR')} €) > plafond zone ${input.zone} (${Math.round(loyerPlafond).toLocaleString('fr-FR')} €). Non éligible Pinel.`,
    })
  }

  // Plafond niches fiscales
  if (!plafondNiches.respecte) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Plafond niches fiscales dépassé. Réduction effective limitée à ${plafondNiches.disponible.toLocaleString('fr-FR')} € (au lieu de ${Math.round(reductionAnnuelle).toLocaleString('fr-FR')} €).`,
    })
  }

  // IR insuffisant
  if (reductionAnnuelle > irAvant) {
    alertes.push({
      type: 'info',
      message: `💡 IR actuel (${irAvant.toLocaleString('fr-FR')} €) < réduction Pinel (${Math.round(reductionAnnuelle).toLocaleString('fr-FR')} €). Une partie sera perdue.`,
    })
  }

  // Pinel Plus contraintes spécifiques
  if (options.isPinelPlus) {
    if (!options.zoneEligiblePlus) {
      alertes.push({
        type: 'error',
        message: `❌ Pinel+ uniquement en zones ${PINEL.ZONES_AUTORISEES_PLUS.join(', ')}. La zone ${input.zone} n'est pas éligible.`,
      })
    }
    if (!options.surfaceEligiblePlus) {
      alertes.push({
        type: 'error',
        message: `❌ Pinel+ impose une surface minimale de ${PINEL.SURFACE_MIN_PINEL_PLUS} m². Surface saisie : ${input.surface} m².`,
      })
    }
  } else if (options.anneeAcquisition > PINEL.ANNEE_FIN_STANDARD) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Pinel standard n'est plus ouvert aux acquisitions postérieures au ${PINEL.ANNEE_FIN_STANDARD}. Basculer sur Pinel+ pour rester conforme.`,
    })
  } else {
    alertes.push({
      type: 'info',
      message: `📋 Le dispositif Pinel standard prend fin le 31/12/${PINEL.ANNEE_FIN_STANDARD}. Dernière année pour investir.`,
    })
  }

  // Engagement de location
  alertes.push({
    type: 'info',
    message: `📋 Engagement de location de ${input.dureeEngagement} ans. Non-respect = reprise de la réduction.`,
  })

  return alertes
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const input = pinelInputSchema.parse(body)

    const resultat = simulerPinel(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur Pinel:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Pinel - Réduction d\'impôt investissement locatif neuf',
      tauxReduction: PINEL.TAUX_REDUCTION,
      plafonds: {
        investissement: PINEL.PLAFOND_INVESTISSEMENT,
        prixM2: PINEL.PLAFOND_M2,
      },
      plafondsLoyer: PINEL.PLAFONDS_LOYER_M2,
      plafondsRessources: PINEL.PLAFONDS_RESSOURCES,
      zones: ['A_BIS', 'A', 'B1', 'B2'],
      dureesEngagement: [6, 9, 12],
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 250000,
        surface: 50,
        zone: 'A',
        dureeEngagement: 9,
        loyerMensuel: 700,
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 15,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
