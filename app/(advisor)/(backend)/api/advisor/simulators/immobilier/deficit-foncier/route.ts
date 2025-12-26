/**
 * API Route - Simulateur Déficit Foncier
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/deficit-foncier
 * 
 * Régime du déficit foncier (CGI art. 156-I-3°) :
 * - Location nue (revenus fonciers)
 * - Déficit imputable sur revenu global : 10 700 €/an
 * - Plafond doublé à 21 400 € si travaux de rénovation énergétique (2023-2025)
 * - Déficit > plafond : reportable 10 ans sur revenus fonciers
 * - Engagement de location 3 ans après imputation
 * 
 * Charges déductibles :
 * - Travaux d'entretien, réparation, amélioration
 * - Intérêts d'emprunt (uniquement sur revenus fonciers, pas sur RG)
 * - Charges de copropriété non récupérables
 * - Frais de gestion, assurances
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
  LOCATION_NUE,
  PRELEVEMENTS_SOCIAUX,
} from '../_shared/constants'
import { deficitFoncierInputSchema, type DeficitFoncierInput } from '../_shared/validators'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION DÉFICIT FONCIER
// ══════════════════════════════════════════════════════════════════════════════

function simulerDeficitFoncier(input: DeficitFoncierInput) {
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
  // 2. DÉTERMINATION DU PLAFOND DÉFICIT FONCIER
  // ─────────────────────────────────────────────────────────────────────────────
  // Plafond doublé si travaux de rénovation énergétique (2023-2025)
  const plafondDeficit = input.travauxRenovEnergetique > 0
    ? LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE
    : LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG

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
  // 4. RÉPARTITION DES TRAVAUX PAR ANNÉE
  // ─────────────────────────────────────────────────────────────────────────────
  const travauxParAn = input.travaux / input.dureeTravaux
  const travauxRenovParAn = input.travauxRenovEnergetique / input.dureeTravaux

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesRecurrentesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    chargesRecurrentes: number
    travaux: number
    travauxRenovEnergetique: number
    interets: number
    chargesDeductiblesTotal: number
    revenuFoncierBrut: number
    deficitFoncier: number
    deficitImputeRG: number
    deficitReporte: number
    economieIR: number
    ir: number
    ps: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
    engagementLocation: boolean
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let loyerActuel = loyerAnnuelNet
  let valeurBien = input.prixAcquisition + input.travaux
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let economieIRCumulee = 0
  let deficitReportable = 0
  const anneeDebutLocation = anneeAcq + input.dureeTravaux - 1

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1
    const enTravaux = i <= input.dureeTravaux

    // Revalorisation (après travaux)
    if (i > 1 && !enTravaux) {
      loyerActuel *= (1 + input.revalorisationLoyer / 100)
    }
    if (i > 1) {
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Travaux de l'année
    const travauxAnnee = enTravaux ? travauxParAn : 0
    const travauxRenovAnnee = enTravaux ? travauxRenovParAn : 0

    // Revenu foncier brut (0 si en travaux)
    const loyerAnnee = enTravaux ? 0 : loyerActuel
    const chargesRecurrentes = chargesRecurrentesAnnuelles + fraisGestionAnnuel

    // Charges déductibles totales
    // ATTENTION : intérêts d'emprunt ne peuvent créer de déficit imputable sur RG
    const chargesHorsInterets = chargesRecurrentes + travauxAnnee + travauxRenovAnnee + assuranceMensuelle * 12
    const chargesDeductiblesTotal = chargesHorsInterets + interetsAnnuels

    // Résultat foncier
    const revenuFoncierBrut = loyerAnnee - chargesDeductiblesTotal
    let deficitFoncier = 0
    let deficitImputeRG = 0
    let economieIR = 0

    if (revenuFoncierBrut < 0) {
      deficitFoncier = Math.abs(revenuFoncierBrut)

      // Séparation : déficit hors intérêts (imputable sur RG) / déficit lié aux intérêts
      const deficitHorsInterets = Math.max(0, chargesHorsInterets - loyerAnnee)
      const deficitLieAuxInterets = deficitFoncier - deficitHorsInterets

      // Imputation sur revenu global (plafonné)
      deficitImputeRG = Math.min(deficitHorsInterets, plafondDeficit)

      // Économie d'IR générée
      economieIR = deficitImputeRG * (tmi / 100)

      // Déficit excédentaire + déficit lié aux intérêts : reportable 10 ans
      const deficitExcedentaire = deficitHorsInterets - deficitImputeRG
      deficitReportable += deficitExcedentaire + deficitLieAuxInterets
    } else {
      // Imputation du déficit reportable sur revenus fonciers positifs
      const imputationDeficitReporte = Math.min(deficitReportable, revenuFoncierBrut)
      deficitReportable -= imputationDeficitReporte
      
      // Résultat foncier net après imputation
      const revenuFoncierNet = revenuFoncierBrut - imputationDeficitReporte
      
      // IR et PS sur revenus fonciers nets
      const ir = revenuFoncierNet > 0 ? revenuFoncierNet * (tmi / 100) : 0
      const ps = revenuFoncierNet > 0 ? revenuFoncierNet * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL : 0
      
      irCumule += ir
      psCumule += ps
    }

    economieIRCumulee += economieIR

    // Engagement de location (3 ans après imputation)
    const engagementLocation = annee >= anneeDebutLocation && 
      annee < anneeDebutLocation + LOCATION_NUE.DEFICIT_FONCIER.ENGAGEMENT_LOCATION

    // Cash-flow
    const cfAvantImpots = loyerAnnee - chargesRecurrentes - travauxAnnee - creditAnnuel
    const cfApresImpots = cfAvantImpots + economieIR - (revenuFoncierBrut > 0 ? revenuFoncierBrut * (tmi / 100 + PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL) : 0)
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerAnnee),
      chargesRecurrentes: Math.round(chargesRecurrentes),
      travaux: Math.round(travauxAnnee),
      travauxRenovEnergetique: Math.round(travauxRenovAnnee),
      interets: Math.round(interetsAnnuels),
      chargesDeductiblesTotal: Math.round(chargesDeductiblesTotal),
      revenuFoncierBrut: Math.round(revenuFoncierBrut),
      deficitFoncier: Math.round(deficitFoncier),
      deficitImputeRG: Math.round(deficitImputeRG),
      deficitReporte: Math.round(deficitReportable),
      economieIR: Math.round(economieIR),
      ir: Math.round(revenuFoncierBrut > 0 ? revenuFoncierBrut * (tmi / 100) : 0),
      ps: Math.round(revenuFoncierBrut > 0 ? revenuFoncierBrut * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL : 0),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
      engagementLocation,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PLUS-VALUE À LA REVENTE
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
  const rentaBrute = (loyerAnnuelBrut / (input.prixAcquisition + input.travaux)) * 100
  const rentaNette = ((loyerAnnuelNet - chargesRecurrentesAnnuelles) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  // Note: l'économie d'IR via déficit foncier est déjà incluse dans le cash-flow
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesDeficitFoncier(input, plafondDeficit, economieIRCumulee, tmi)

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
      economieIRCumulee: Math.round(economieIRCumulee),
      deficitReportableRestant: Math.round(deficitReportable),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    deficitFoncier: {
      plafondImputation: plafondDeficit,
      plafondStandard: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG,
      plafondRenovEnergetique: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE,
      travauxRenovEnergetique: input.travauxRenovEnergetique,
      plafondDouble: input.travauxRenovEnergetique > 0,
      engagementLocation: LOCATION_NUE.DEFICIT_FONCIER.ENGAGEMENT_LOCATION,
      dureeReportDeficit: LOCATION_NUE.DEFICIT_FONCIER.DUREE_REPORT,
      travaux: input.travaux,
      travauxParAn: Math.round(travauxParAn),
      dureeTravaux: input.dureeTravaux,
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

function generateAlertesDeficitFoncier(
  input: DeficitFoncierInput,
  plafondDeficit: number,
  economieIRCumulee: number,
  tmi: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Plafond doublé
  if (input.travauxRenovEnergetique > 0) {
    alertes.push({
      type: 'success',
      message: `✅ Plafond déficit foncier doublé à ${plafondDeficit.toLocaleString('fr-FR')} €/an (travaux rénovation énergétique).`,
    })
  } else {
    alertes.push({
      type: 'info',
      message: `📋 Plafond déficit foncier standard : ${plafondDeficit.toLocaleString('fr-FR')} €/an. Doublement possible si travaux de rénovation énergétique (jusqu'en 2025).`,
    })
  }

  // Économie d'IR
  if (economieIRCumulee > 0) {
    alertes.push({
      type: 'success',
      message: `✅ Économie d'IR estimée : ${economieIRCumulee.toLocaleString('fr-FR')} € (TMI ${tmi}%).`,
    })
  }

  // Engagement de location
  alertes.push({
    type: 'warning',
    message: `⚠️ Engagement de location nue ${LOCATION_NUE.DEFICIT_FONCIER.ENGAGEMENT_LOCATION} ans après imputation. Non-respect = reprise de l'avantage fiscal.`,
  })

  // Intérêts d'emprunt
  alertes.push({
    type: 'info',
    message: `💡 Les intérêts d'emprunt ne peuvent créer de déficit imputable sur le revenu global. Ils sont uniquement déductibles des revenus fonciers.`,
  })

  // Report du déficit
  alertes.push({
    type: 'info',
    message: `📋 Le déficit excédentaire est reportable ${LOCATION_NUE.DEFICIT_FONCIER.DUREE_REPORT} ans sur les revenus fonciers futurs.`,
  })

  // TMI faible
  if (tmi < 30) {
    alertes.push({
      type: 'warning',
      message: `⚠️ TMI ${tmi}% : l'économie d'impôt est modérée. Le déficit foncier est plus efficace pour les TMI élevées.`,
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
    const input = deficitFoncierInputSchema.parse(body)

    const resultat = simulerDeficitFoncier(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    console.error('Erreur simulateur déficit foncier:', error)
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Déficit Foncier - Imputation sur revenu global',
      plafonds: {
        standard: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG,
        renovationEnergetique: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE,
      },
      engagement: `Location nue ${LOCATION_NUE.DEFICIT_FONCIER.ENGAGEMENT_LOCATION} ans`,
      reportDeficit: `${LOCATION_NUE.DEFICIT_FONCIER.DUREE_REPORT} ans`,
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 150000,
        travaux: 80000,
        travauxRenovEnergetique: 30000,
        dureeTravaux: 2,
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
