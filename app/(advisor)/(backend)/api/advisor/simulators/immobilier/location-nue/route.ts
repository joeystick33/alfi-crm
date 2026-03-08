/**
 * API Route - Simulateur Location Nue
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/location-nue
 * 
 * Location Nue (revenus fonciers) :
 * - Régime micro-foncier : abattement 30%, plafond 15 000 €/an
 * - Régime réel : déduction des charges réelles
 * - Déficit foncier imputable sur revenu global (10 700 €/an)
 * - Prélèvements sociaux 17,2%
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
import { locationNueInputSchema, type LocationNueInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION LOCATION NUE
// ══════════════════════════════════════════════════════════════════════════════

function simulerLocationNue(input: LocationNueInput) {
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
  // 2. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = input.prixAcquisition + input.fraisNotaire + input.travaux
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.travauxEntretien
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. VÉRIFICATION PLAFOND MICRO-FONCIER
  // ─────────────────────────────────────────────────────────────────────────────
  const revenusFonciersTotal = loyerAnnuelBrut + input.revenusFonciersExistants
  const eligibleMicroFoncier = revenusFonciersTotal <= LOCATION_NUE.MICRO_FONCIER.PLAFOND

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    chargesReelles: number
    interets: number
    revenuFoncier: number
    baseImposable: number
    deficitFoncier: number
    deficitImputeRG: number
    economieIR: number
    ir: number
    ps: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
    regimeApplique: string
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

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1

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

    // Régime fiscal
    const depassePlafond = loyerActuel * 12 / tauxOccupation + input.revenusFonciersExistants > LOCATION_NUE.MICRO_FONCIER.PLAFOND
    const regimeApplique = (input.regimeFiscal === 'MICRO_FONCIER' && !depassePlafond) ? 'MICRO_FONCIER' : 'REEL'

    let baseImposable = 0
    let deficitFoncier = 0
    let deficitImputeRG = 0
    let economieIR = 0
    let ir = 0
    let ps = 0

    if (regimeApplique === 'MICRO_FONCIER') {
      // Micro-foncier : abattement forfaitaire 30%
      const loyerBrutAnnee = loyerActuel * 12 / tauxOccupation
      baseImposable = loyerBrutAnnee * (1 - LOCATION_NUE.MICRO_FONCIER.ABATTEMENT / 100)
      ir = baseImposable * (tmi / 100)
      ps = baseImposable * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL
    } else {
      // Régime réel
      const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceMensuelle * 12
      const revenuFoncier = loyerActuel - chargesDeductibles

      if (revenuFoncier < 0) {
        deficitFoncier = Math.abs(revenuFoncier)
        
        // Déficit hors intérêts (imputable sur RG)
        const deficitHorsInterets = Math.max(0, chargesAnnuelles + fraisGestionAnnuel + assuranceMensuelle * 12 - loyerActuel)
        deficitImputeRG = Math.min(deficitHorsInterets, LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG)
        
        // Économie d'IR
        economieIR = deficitImputeRG * (tmi / 100)
        
        // Déficit reportable
        const deficitExcedentaire = deficitFoncier - deficitImputeRG
        deficitReportable += deficitExcedentaire
      } else {
        // Imputation déficit reportable
        const imputationDeficit = Math.min(deficitReportable, revenuFoncier)
        deficitReportable -= imputationDeficit
        
        baseImposable = revenuFoncier - imputationDeficit
        ir = baseImposable > 0 ? baseImposable * (tmi / 100) : 0
        ps = baseImposable > 0 ? baseImposable * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL : 0
      }
    }

    irCumule += ir
    psCumule += ps
    economieIRCumulee += economieIR

    // Cash-flow
    const cfAvantImpots = loyerActuel - chargesAnnuelles - fraisGestionAnnuel - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps + economieIR
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerActuel),
      chargesReelles: Math.round(chargesAnnuelles + fraisGestionAnnuel),
      interets: Math.round(interetsAnnuels),
      revenuFoncier: Math.round(loyerActuel - chargesAnnuelles - fraisGestionAnnuel - interetsAnnuels),
      baseImposable: Math.round(baseImposable),
      deficitFoncier: Math.round(deficitFoncier),
      deficitImputeRG: Math.round(deficitImputeRG),
      economieIR: Math.round(economieIR),
      ir: Math.round(ir),
      ps: Math.round(ps),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
      regimeApplique,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PLUS-VALUE À LA REVENTE (CGI art. 150 VB)
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  
  // 1. Prix d'acquisition = Prix d'achat seul
  const prixAchatPV = input.prixAcquisition
  
  // 2. Frais d'acquisition - CGI art. 150 VB II 4°
  // MAX(forfait 7.5%, frais réels)
  const forfaitAcquisition = Math.round(prixAchatPV * 0.075)
  const fraisAcquisitionReels = input.fraisNotaire || 0
  const majorationAcquisition = Math.max(forfaitAcquisition, fraisAcquisitionReels)
  const utiliseForfaitAcquisition = majorationAcquisition === forfaitAcquisition
  
  // 3. Travaux - CGI art. 150 VB II 4°
  // MAX(forfait 15% si détention > 5 ans, travaux réels)
  const forfaitTravaux = input.dureeDetention > 5 ? Math.round(prixAchatPV * 0.15) : 0
  const travauxReels = input.travaux || 0
  const majorationTravaux = Math.max(forfaitTravaux, travauxReels)
  const utiliseForfaitTravaux = majorationTravaux === forfaitTravaux
  
  // 4. Prix d'acquisition majoré
  const prixAcquisitionMajore = prixAchatPV + majorationAcquisition + majorationTravaux
  
  // 5. Plus-value brute
  const plusValueBrute = Math.max(0, valeurRevente - prixAcquisitionMajore)
  
  // 6. Abattements pour durée de détention
  // IMPORTANT: Passer les majorations forfaitaires (et non les valeurs réelles)
  // pour que le calcul de l'impôt utilise le prix d'acquisition majoré correct
  const pvResult = calculImpotPlusValue(
    input.prixAcquisition,
    valeurRevente,
    input.dureeDetention,
    majorationAcquisition,  // Forfait 7.5% ou frais réels (le plus avantageux)
    majorationTravaux       // Forfait 15% ou travaux réels (le plus avantageux)
  )
  
  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  const plusValueNette = plusValueBrute - pvResult.impotTotal - fraisReventeEur
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal

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
  const rentaBrute = (loyerAnnuelBrut / input.prixAcquisition) * 100
  const rentaNette = ((loyerAnnuelNet - chargesAnnuelles) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Gain total = Cash-flows cumulés + Capital final net - Apport initial
  // C'est le gain réel par rapport à l'investissement de départ
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesLocationNue(input, loyerAnnuelBrut, eligibleMicroFoncier, economieIRCumulee, tmi)

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
      plusValueBrute: Math.round(plusValueBrute),
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    fiscalite: {
      regimeFiscal: input.regimeFiscal,
      eligibleMicroFoncier,
      plafondMicroFoncier: LOCATION_NUE.MICRO_FONCIER.PLAFOND,
      abattementMicroFoncier: LOCATION_NUE.MICRO_FONCIER.ABATTEMENT,
      plafondDeficitFoncier: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG,
      dureeReportDeficit: LOCATION_NUE.DEFICIT_FONCIER.DUREE_REPORT,
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
    plusValue: {
      valeurRevente,
      // Détail du calcul du prix d'acquisition fiscal (CGI art. 150 VB)
      prixAchat: prixAchatPV,
      forfaitAcquisition,
      fraisAcquisitionReels,
      majorationAcquisition,
      utiliseForfaitAcquisition,
      forfaitTravaux,
      travauxReels,
      majorationTravaux,
      utiliseForfaitTravaux,
      prixAcquisitionMajore,
      plusValueBrute: Math.round(plusValueBrute),
      dureeDetention: input.dureeDetention,
      abattementIR: pvResult.abattementIR,
      abattementPS: pvResult.abattementPS,
      pvImposableIR: pvResult.plusValueImposableIR,
      pvImposablePS: pvResult.plusValueImposablePS,
      impotIR: pvResult.impotIR,
      impotPS: pvResult.prelevementsSociaux,
      impotTotal: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
    },
    projections,
    alertes,
  }
}

function generateAlertesLocationNue(
  input: LocationNueInput,
  loyerBrut: number,
  eligibleMicro: boolean,
  economieIR: number,
  tmi: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Éligibilité micro-foncier
  if (!eligibleMicro && input.regimeFiscal === 'MICRO_FONCIER') {
    alertes.push({
      type: 'warning',
      message: `⚠️ Revenus fonciers > ${LOCATION_NUE.MICRO_FONCIER.PLAFOND.toLocaleString('fr-FR')} €. Régime réel obligatoire.`,
    })
  }

  // Comparaison micro vs réel
  if (eligibleMicro && input.regimeFiscal === 'MICRO_FONCIER') {
    const chargesReelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.travauxEntretien
    const abattementForfaitaire = loyerBrut * (LOCATION_NUE.MICRO_FONCIER.ABATTEMENT / 100)
    
    if (chargesReelles > abattementForfaitaire) {
      alertes.push({
        type: 'info',
        message: `💡 Charges réelles (${chargesReelles.toLocaleString('fr-FR')} €) > abattement forfaitaire (${Math.round(abattementForfaitaire).toLocaleString('fr-FR')} €). Le régime réel pourrait être plus avantageux.`,
      })
    }
  }

  // Économie d'IR (déficit foncier)
  if (economieIR > 0) {
    alertes.push({
      type: 'success',
      message: `✅ Économie d'IR grâce au déficit foncier : ${economieIR.toLocaleString('fr-FR')} € sur la durée.`,
    })
  }

  // TMI
  if (tmi >= 41) {
    alertes.push({
      type: 'warning',
      message: `⚠️ TMI ${tmi}% : forte imposition des revenus fonciers (${tmi + 17.2}% avec PS). Envisagez le LMNP ou la nue-propriété.`,
    })
  }

  // Prélèvements sociaux
  alertes.push({
    type: 'info',
    message: `📋 Prélèvements sociaux 17,2% sur revenus fonciers nets (ou après abattement 30% en micro).`,
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
    const input = locationNueInputSchema.parse(body)

    const resultat = simulerLocationNue(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur location nue:', { error: error instanceof Error ? error.message : String(error) })
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorStack = error instanceof Error ? error.stack : ''
    logger.error('Stack: ' + errorStack)
    return createErrorResponse(`Erreur lors de la simulation: ${errorMessage}`, 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Location Nue - Revenus fonciers',
      regimes: ['MICRO_FONCIER', 'REEL'],
      microFoncier: {
        plafond: LOCATION_NUE.MICRO_FONCIER.PLAFOND,
        abattement: LOCATION_NUE.MICRO_FONCIER.ABATTEMENT,
      },
      deficitFoncier: {
        plafondImputation: LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG,
        dureeReport: LOCATION_NUE.DEFICIT_FONCIER.DUREE_REPORT,
      },
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 200000,
        loyerMensuel: 800,
        regimeFiscal: 'REEL',
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 15,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
