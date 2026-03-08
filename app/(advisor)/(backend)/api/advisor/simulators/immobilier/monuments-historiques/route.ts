/**
 * API Route - Simulateur Monuments Historiques
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/monuments-historiques
 * 
 * Régime Monuments Historiques (CGI art. 156 bis, 156-I-3°) :
 * - Déduction des travaux et charges sur revenu global
 * - Pas de plafond de déduction (contrairement au déficit foncier)
 * - HORS PLAFOND DES NICHES FISCALES
 * - Immeubles classés MH ou inscrits à l'Inventaire Supplémentaire
 * 
 * Taux de déduction selon ouverture au public :
 * - Ouvert au public (≥50 jours/an) : 100% travaux, 100% charges
 * - Partiellement ouvert : 100% travaux, 50% charges
 * - Non ouvert au public : 100% travaux, 50% charges (si loué)
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
  MONUMENTS_HISTORIQUES,
  PRELEVEMENTS_SOCIAUX,
} from '../_shared/constants'
import { monumentsHistoriquesInputSchema, type MonumentsHistoriquesInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION MONUMENTS HISTORIQUES
// ══════════════════════════════════════════════════════════════════════════════

function simulerMonumentsHistoriques(input: MonumentsHistoriquesInput) {
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
  // 2. TAUX DE DÉDUCTION SELON OUVERTURE AU PUBLIC
  // ─────────────────────────────────────────────────────────────────────────────
  const regimeOuverture = MONUMENTS_HISTORIQUES.OUVERTURE_PUBLIC[input.ouverturePublic]
  const tauxDeductionTravaux = regimeOuverture.travaux // Toujours 100%
  const tauxDeductionCharges = regimeOuverture.charges // 100% ou 50%

  // Vérification ouverture suffisante
  const ouvertureSuffisante = input.ouverturePublic === 'OUI' 
    ? input.joursOuverture >= MONUMENTS_HISTORIQUES.MINIMUM_JOURS_OUVERTURE
    : true

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
  // 4. RÉPARTITION DES TRAVAUX
  // ─────────────────────────────────────────────────────────────────────────────
  const travauxParAn = input.travaux / input.dureeTravaux
  const travauxDeductiblesParAn = travauxParAn * (tauxDeductionTravaux / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesRecurrentesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.chargesEntretienMH
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)
  const chargesDeductibles = (chargesRecurrentesAnnuelles + fraisGestionAnnuel) * (tauxDeductionCharges / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    chargesReelles: number
    chargesDeductibles: number
    travaux: number
    travauxDeductibles: number
    interets: number
    deductionTotale: number
    economieIR: number
    revenuFoncierNet: number
    ir: number
    ps: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
    phaseTravaux: boolean
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let loyerActuel = loyerAnnuelNet
  let valeurBien = input.prixAcquisition + input.travaux
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let economieIRCumulee = 0
  let deductionCumulee = 0

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1
    const phaseTravaux = i <= input.dureeTravaux

    // Revalorisation
    if (i > 1) {
      if (!phaseTravaux || input.loyerMensuel > 0) {
        loyerActuel *= (1 + input.revalorisationLoyer / 100)
      }
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Travaux de l'année
    const travauxAnnee = phaseTravaux ? travauxParAn : 0
    const travauxDeductiblesAnnee = phaseTravaux ? travauxDeductiblesParAn : 0

    // Loyer (peut être perçu même pendant les travaux si bien partiellement loué)
    const loyerAnnee = input.loyerMensuel > 0 ? loyerActuel : 0

    // Déduction totale sur revenu global (travaux + charges + intérêts)
    // MH : tout est déductible du revenu global, pas de limitation
    const interetsDeductibles = interetsAnnuels * (tauxDeductionCharges / 100)
    const deductionTotale = travauxDeductiblesAnnee + chargesDeductibles + interetsDeductibles

    // Économie d'IR (déduction sur revenu global)
    const economieIR = deductionTotale * (tmi / 100)

    // Revenu foncier net (si loyer)
    const revenuFoncierNet = loyerAnnee > 0 
      ? Math.max(0, loyerAnnee - chargesRecurrentesAnnuelles - fraisGestionAnnuel - interetsAnnuels)
      : 0

    // IR et PS sur revenus fonciers nets (après déductions MH)
    const ir = revenuFoncierNet > 0 ? revenuFoncierNet * (tmi / 100) : 0
    const ps = revenuFoncierNet > 0 ? revenuFoncierNet * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL : 0

    irCumule += ir
    psCumule += ps
    economieIRCumulee += economieIR
    deductionCumulee += deductionTotale

    // Cash-flow
    const cfAvantImpots = loyerAnnee - chargesRecurrentesAnnuelles - fraisGestionAnnuel - travauxAnnee - creditAnnuel
    const cfApresImpots = cfAvantImpots + economieIR - ir - ps
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerAnnee),
      chargesReelles: Math.round(chargesRecurrentesAnnuelles + fraisGestionAnnuel),
      chargesDeductibles: Math.round(chargesDeductibles),
      travaux: Math.round(travauxAnnee),
      travauxDeductibles: Math.round(travauxDeductiblesAnnee),
      interets: Math.round(interetsAnnuels),
      deductionTotale: Math.round(deductionTotale),
      economieIR: Math.round(economieIR),
      revenuFoncierNet: Math.round(revenuFoncierNet),
      ir: Math.round(ir),
      ps: Math.round(ps),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
      phaseTravaux,
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
  // MH classés peuvent bénéficier d'un abattement IFI (75% si ouvert au public)
  const abattementIFI_MH = input.ouverturePublic === 'OUI' ? 0.75 : 0
  const valeurIFI_MH = valeurBien * (1 - abattementIFI_MH)

  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurIFI_MH,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rentaBrute = loyerAnnuelBrut > 0 ? (loyerAnnuelBrut / (input.prixAcquisition + input.travaux)) * 100 : 0
  const rentaNette = loyerAnnuelNet > 0 ? ((loyerAnnuelNet - chargesRecurrentesAnnuelles) / investTotal) * 100 : 0
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  // Note: l'économie d'IR MH est déjà incluse dans le cash-flow
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - pvResult.impotTotal)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesMH(input, economieIRCumulee, tmi, ouvertureSuffisante, tauxDeductionCharges)

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
      deductionCumulee: Math.round(deductionCumulee),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    regimeMH: {
      ouverturePublic: input.ouverturePublic,
      joursOuverture: input.joursOuverture,
      minimumJoursOuverture: MONUMENTS_HISTORIQUES.MINIMUM_JOURS_OUVERTURE,
      ouvertureSuffisante,
      tauxDeductionTravaux,
      tauxDeductionCharges,
      travaux: input.travaux,
      travauxParAn: Math.round(travauxParAn),
      travauxDeductiblesParAn: Math.round(travauxDeductiblesParAn),
      dureeTravaux: input.dureeTravaux,
      chargesEntretienMH: input.chargesEntretienMH,
      abattementIFI: abattementIFI_MH * 100,
      horsPlafondNiches: MONUMENTS_HISTORIQUES.HORS_PLAFOND_NICHES,
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

function generateAlertesMH(
  input: MonumentsHistoriquesInput,
  economieIRCumulee: number,
  tmi: number,
  ouvertureSuffisante: boolean,
  tauxDeductionCharges: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Hors plafond niches
  alertes.push({
    type: 'success',
    message: `✅ Déduction MH HORS PLAFOND des niches fiscales. Avantage fiscal sans limite.`,
  })

  // Économie d'IR
  if (economieIRCumulee > 0) {
    alertes.push({
      type: 'success',
      message: `✅ Économie d'IR estimée : ${economieIRCumulee.toLocaleString('fr-FR')} € (TMI ${tmi}%).`,
    })
  }

  // Ouverture au public
  if (input.ouverturePublic === 'OUI') {
    if (!ouvertureSuffisante) {
      alertes.push({
        type: 'warning',
        message: `⚠️ Ouverture (${input.joursOuverture} jours) < minimum requis (${MONUMENTS_HISTORIQUES.MINIMUM_JOURS_OUVERTURE} jours). Risque de requalification.`,
      })
    } else {
      alertes.push({
        type: 'success',
        message: `✅ Ouverture au public ≥ ${MONUMENTS_HISTORIQUES.MINIMUM_JOURS_OUVERTURE} jours : 100% des charges déductibles + abattement IFI 75%.`,
      })
    }
  } else {
    alertes.push({
      type: 'info',
      message: `📋 Bien non ouvert au public : ${tauxDeductionCharges}% des charges déductibles. 100% des travaux restent déductibles.`,
    })
  }

  // Location
  if (input.loyerMensuel === 0) {
    alertes.push({
      type: 'info',
      message: `📋 Bien non loué : pas de revenus fonciers, mais déduction des travaux et charges sur revenu global.`,
    })
  }

  // TMI
  if (tmi >= 41) {
    alertes.push({
      type: 'success',
      message: `✅ TMI ${tmi}% : dispositif très efficace pour les hauts revenus.`,
    })
  } else if (tmi < 30) {
    alertes.push({
      type: 'info',
      message: `💡 TMI ${tmi}% : l'économie d'impôt est proportionnelle à votre TMI.`,
    })
  }

  // Contraintes MH
  alertes.push({
    type: 'info',
    message: `📋 Contraintes MH : travaux soumis à autorisation DRAC, architecte des Bâtiments de France.`,
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
    const input = monumentsHistoriquesInputSchema.parse(body)

    const resultat = simulerMonumentsHistoriques(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur MH:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Monuments Historiques - Déduction sur revenu global',
      tauxDeduction: MONUMENTS_HISTORIQUES.OUVERTURE_PUBLIC,
      minimumJoursOuverture: MONUMENTS_HISTORIQUES.MINIMUM_JOURS_OUVERTURE,
      horsPlafondNiches: MONUMENTS_HISTORIQUES.HORS_PLAFOND_NICHES,
      typesOuverture: ['OUI', 'NON', 'PARTIEL'],
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 500000,
        travaux: 400000,
        dureeTravaux: 3,
        ouverturePublic: 'OUI',
        joursOuverture: 60,
        loyerMensuel: 2000,
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 20,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
