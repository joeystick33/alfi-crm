/**
 * API Route - Simulateur Denormandie
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/denormandie
 * 
 * Dispositif Denormandie (CGI art. 199 novovicies) :
 * - Réduction d'impôt sur acquisition ancien + travaux
 * - Communes éligibles "Cœur de ville" ou ORT
 * - Travaux ≥ 25% du coût total
 * - Mêmes plafonds loyer/ressources que Pinel
 * 
 * Taux 2024 :
 * - 6 ans : 12%
 * - 9 ans : 18%
 * - 12 ans : 21%
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
  DENORMANDIE,
  PINEL,
  PRELEVEMENTS_SOCIAUX,
  PLAFOND_NICHES,
} from '../_shared/constants'
import { denormandieInputSchema, type DenormandieInput } from '../_shared/validators'

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION DENORMANDIE
// ══════════════════════════════════════════════════════════════════════════════

function simulerDenormandie(input: DenormandieInput) {
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
  // 2. VÉRIFICATION CONDITION TRAVAUX 25%
  // ─────────────────────────────────────────────────────────────────────────────
  const coutTotal = input.prixAcquisition + input.travaux
  const pourcentageTravaux = (input.travaux / coutTotal) * 100
  const respecteConditionTravaux = pourcentageTravaux >= DENORMANDIE.SEUIL_TRAVAUX_POURCENTAGE

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CALCUL DE LA RÉDUCTION DENORMANDIE
  // ─────────────────────────────────────────────────────────────────────────────
  const baseReduction = Math.min(coutTotal, DENORMANDIE.PLAFOND_INVESTISSEMENT)
  const tauxReduction = DENORMANDIE.TAUX_REDUCTION[input.dureeEngagement as keyof typeof DENORMANDIE.TAUX_REDUCTION] || 12
  const reductionTotale = baseReduction * (tauxReduction / 100)
  const reductionAnnuelle = reductionTotale / input.dureeEngagement

  // Vérification plafond des niches fiscales
  const plafondNiches = verifierPlafondNiches(input.autresReductionsImpot, reductionAnnuelle)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. PLAFONDS LOYER (identiques Pinel)
  // ─────────────────────────────────────────────────────────────────────────────
  const plafondLoyerM2 = PINEL.PLAFONDS_LOYER_M2[input.zone]
  const coeffSurface = Math.min(1.2, 0.7 + 19 / input.surface)
  const loyerPlafond = plafondLoyerM2 * coeffSurface * input.surface
  const respectePlafondLoyer = input.loyerMensuel <= loyerPlafond

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = input.prixAcquisition + input.fraisNotaire + input.travaux
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    charges: number
    interets: number
    revenuFoncier: number
    ir: number
    ps: number
    reductionDenormandie: number
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
  let valeurBien = input.prixAcquisition + input.travaux // Valeur après travaux
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let reductionCumulee = 0
  let reductionEffectiveCumulee = 0

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

    // Revenu foncier (régime réel)
    const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceMensuelle * 12
    const revenuFoncier = loyerActuel - chargesDeductibles

    // IR et PS sur revenus fonciers
    const ir = revenuFoncier > 0 ? revenuFoncier * (tmi / 100) : 0
    const ps = revenuFoncier > 0 ? revenuFoncier * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL : 0

    // Réduction Denormandie (si engagement actif)
    const reductionDenormandie = engagementActif ? reductionAnnuelle : 0
    const irDuTotal = irAvant.impotNet + ir
    const reductionEffective = Math.min(
      reductionDenormandie, 
      irDuTotal, 
      PLAFOND_NICHES.GLOBAL - input.autresReductionsImpot
    )

    irCumule += ir
    psCumule += ps
    reductionCumulee += reductionDenormandie
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
      reductionDenormandie: Math.round(reductionDenormandie),
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
  // 8. PLUS-VALUE À LA REVENTE
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
  // 9. IFI APRÈS INVESTISSEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rentaBrute = (loyerAnnuelBrut / (input.prixAcquisition + input.travaux)) * 100
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
  // 11. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesDenormandie(
    input,
    pourcentageTravaux,
    coutTotal,
    loyerPlafond,
    plafondNiches,
    reductionAnnuelle,
    irAvant.impotNet,
    respecteConditionTravaux
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
      reductionDenormandieTotale: Math.round(reductionCumulee),
      reductionEffective: Math.round(reductionEffectiveCumulee),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    dispositifDenormandie: {
      zone: input.zone,
      dureeEngagement: input.dureeEngagement,
      tauxReduction,
      prixAcquisition: input.prixAcquisition,
      travaux: input.travaux,
      coutTotal,
      pourcentageTravaux: Math.round(pourcentageTravaux * 10) / 10,
      seuilTravauxRequis: DENORMANDIE.SEUIL_TRAVAUX_POURCENTAGE,
      respecteConditionTravaux,
      baseReduction,
      reductionTotale: Math.round(reductionTotale),
      reductionAnnuelle: Math.round(reductionAnnuelle),
      plafondInvestissement: DENORMANDIE.PLAFOND_INVESTISSEMENT,
      loyerMaximal: Math.round(loyerPlafond),
      loyerReel: input.loyerMensuel,
      respectePlafondLoyer,
    },
    plafondNiches: {
      plafondGlobal: PLAFOND_NICHES.GLOBAL,
      autresReductions: input.autresReductionsImpot,
      reductionDenormandie: Math.round(reductionAnnuelle),
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

function generateAlertesDenormandie(
  input: DenormandieInput,
  pourcentageTravaux: number,
  coutTotal: number,
  loyerPlafond: number,
  plafondNiches: ReturnType<typeof verifierPlafondNiches>,
  reductionAnnuelle: number,
  irAvant: number,
  respecteConditionTravaux: boolean
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Condition travaux 25%
  if (!respecteConditionTravaux) {
    alertes.push({
      type: 'error',
      message: `❌ Travaux (${Math.round(pourcentageTravaux)}%) < seuil requis (${DENORMANDIE.SEUIL_TRAVAUX_POURCENTAGE}%). Non éligible Denormandie.`,
    })
  } else {
    alertes.push({
      type: 'success',
      message: `✅ Condition travaux respectée : ${Math.round(pourcentageTravaux)}% ≥ ${DENORMANDIE.SEUIL_TRAVAUX_POURCENTAGE}%.`,
    })
  }

  // Plafond investissement
  if (coutTotal > DENORMANDIE.PLAFOND_INVESTISSEMENT) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Coût total (${coutTotal.toLocaleString('fr-FR')} €) > plafond (${DENORMANDIE.PLAFOND_INVESTISSEMENT.toLocaleString('fr-FR')} €). Réduction calculée sur ${DENORMANDIE.PLAFOND_INVESTISSEMENT.toLocaleString('fr-FR')} €.`,
    })
  }

  // Plafond loyer
  if (input.loyerMensuel > loyerPlafond) {
    alertes.push({
      type: 'error',
      message: `❌ Loyer (${input.loyerMensuel.toLocaleString('fr-FR')} €) > plafond zone ${input.zone} (${Math.round(loyerPlafond).toLocaleString('fr-FR')} €).`,
    })
  }

  // Plafond niches
  if (!plafondNiches.respecte) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Plafond niches fiscales dépassé de ${plafondNiches.exces.toLocaleString('fr-FR')} €.`,
    })
  }

  // IR insuffisant
  if (reductionAnnuelle > irAvant) {
    alertes.push({
      type: 'info',
      message: `💡 IR (${irAvant.toLocaleString('fr-FR')} €) < réduction (${Math.round(reductionAnnuelle).toLocaleString('fr-FR')} €). Report non prévu.`,
    })
  }

  // Avantage vs Pinel
  alertes.push({
    type: 'info',
    message: `💡 Denormandie : taux plus avantageux que Pinel (${input.dureeEngagement} ans = ${DENORMANDIE.TAUX_REDUCTION[input.dureeEngagement as keyof typeof DENORMANDIE.TAUX_REDUCTION]}% vs ${PINEL.TAUX_REDUCTION[input.dureeEngagement as keyof typeof PINEL.TAUX_REDUCTION]}%).`,
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
    const input = denormandieInputSchema.parse(body)

    const resultat = simulerDenormandie(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    console.error('Erreur simulateur Denormandie:', error)
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Denormandie - Réduction d\'impôt ancien + travaux',
      tauxReduction: DENORMANDIE.TAUX_REDUCTION,
      conditionTravaux: `Travaux ≥ ${DENORMANDIE.SEUIL_TRAVAUX_POURCENTAGE}% du coût total`,
      plafondInvestissement: DENORMANDIE.PLAFOND_INVESTISSEMENT,
      plafondsLoyer: PINEL.PLAFONDS_LOYER_M2,
      plafondsRessources: PINEL.PLAFONDS_RESSOURCES,
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 150000,
        travaux: 60000,
        surface: 60,
        zone: 'B1',
        dureeEngagement: 9,
        loyerMensuel: 600,
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 15,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
