/**
 * API Route - Simulateur Colocation
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/colocation
 * 
 * Colocation (meublée ou nue) :
 * - Location à plusieurs locataires d'un même bien
 * - Optimisation du rendement par m²
 * - Fiscalité LMNP (meublé) ou revenus fonciers (nu)
 * - Gestion plus intensive (turnover, baux individuels)
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
  LMNP,
  LOCATION_NUE,
  PRELEVEMENTS_SOCIAUX,
  LMP,
} from '../_shared/constants'
import { colocationInputSchema, type ColocationInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION COLOCATION
// ══════════════════════════════════════════════════════════════════════════════

function simulerColocation(input: ColocationInput) {
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
  const investTotal = input.prixAcquisition + input.fraisNotaire + input.travaux + input.mobilier
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REVENUS COLOCATION
  // ─────────────────────────────────────────────────────────────────────────────
  const loyerMensuelTotal = input.loyerParChambre * input.nbChambres
  const loyerAnnuelBrut = loyerMensuelTotal * 12
  const loyerAnnuelNet = loyerAnnuelBrut * (input.tauxOccupation / 100)

  // Coût du turnover (frais d'état des lieux, remise en état, recherche locataire)
  const coutTurnoverParChangement = 200 // Estimation
  const nbChangementsAn = (input.turnoverAnnuel / 100) * input.nbChambres
  const coutTurnoverAnnuel = coutTurnoverParChangement * nbChangementsAn

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const chargesRecurrentes = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.chargesCommunes
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)
  const chargesAnnuelles = chargesRecurrentes + fraisGestionAnnuel + coutTurnoverAnnuel

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. AMORTISSEMENTS LINÉAIRES (si meublé réel)
  // L'amortissement comptable est CONSTANT pendant la durée de vie
  // ─────────────────────────────────────────────────────────────────────────────
  const partTerrain = 15
  const valeurAmortissableImmeuble = input.prixAcquisition * (1 - partTerrain / 100)
  
  // Amortissements annuels (constants pendant leur durée respective)
  const amortImmeubleAnnuel = valeurAmortissableImmeuble / LMNP.DUREE_AMORT_IMMEUBLE  // 30 ans
  const amortMobilierAnnuel = input.mobilier / LMNP.DUREE_AMORT_MOBILIER              // 7 ans
  const amortTravauxAnnuel = input.travaux / LMNP.DUREE_AMORT_TRAVAUX                 // 10 ans
  
  // Fonction pour calculer l'amortissement disponible selon l'année
  const calculerAmortissementAnnee = (annee: number): number => {
    let amortAnnee = 0
    if (annee <= LMNP.DUREE_AMORT_IMMEUBLE) amortAnnee += amortImmeubleAnnuel
    if (annee <= LMNP.DUREE_AMORT_MOBILIER) amortAnnee += amortMobilierAnnuel
    if (annee <= LMNP.DUREE_AMORT_TRAVAUX) amortAnnee += amortTravauxAnnuel
    return amortAnnee
  }
  
  const amortTotal = calculerAmortissementAnnee(1)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. VÉRIFICATION PLAFONDS
  // ─────────────────────────────────────────────────────────────────────────────
  const estMeuble = input.typeLocation === 'MEUBLE'
  const plafondMicroBIC = LMNP.PLAFOND_MICRO_BIC
  const plafondMicroFoncier = LOCATION_NUE.MICRO_FONCIER.PLAFOND
  const depassePlafond = estMeuble 
    ? loyerAnnuelBrut > plafondMicroBIC
    : (loyerAnnuelBrut + input.revenusFonciersExistants) > plafondMicroFoncier

  // Vérification LMP
  const estLMP = estMeuble && loyerAnnuelBrut > LMP.SEUIL_RECETTES && loyerAnnuelBrut > revenusTotaux * 0.5

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    charges: number
    coutTurnover: number
    interets: number
    amortissement: number
    amortUtilise: number
    baseImposable: number
    ir: number
    ps: number
    cotisationsSSI: number
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
  let ssiCumule = 0
  let amortStocke = 0

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

    // Détermination du régime applicable
    let regimeApplique = input.regimeFiscal
    const loyerBrutAnnee = loyerActuel / (input.tauxOccupation / 100)
    
    if (estMeuble && loyerBrutAnnee > plafondMicroBIC && input.regimeFiscal === 'MICRO_BIC') {
      regimeApplique = 'REEL'
    }
    if (!estMeuble && (loyerBrutAnnee + input.revenusFonciersExistants) > plafondMicroFoncier && input.regimeFiscal === 'MICRO_FONCIER') {
      regimeApplique = 'REEL_FONCIER'
    }

    let baseImposable = 0
    let ir = 0
    let ps = 0
    let cotisationsSSI = 0
    let amortUtilise = 0

    if (estMeuble) {
      // Fiscalité meublé (BIC)
      if (regimeApplique === 'MICRO_BIC') {
        baseImposable = loyerBrutAnnee * (1 - LMNP.ABATTEMENT_MICRO_BIC / 100)
        ir = baseImposable * (tmi / 100)
        ps = baseImposable * PRELEVEMENTS_SOCIAUX.FINANCIER.TAUX_GLOBAL // Meublé = BIC → 18,6% (LFSS 2026)
      } else {
        // Réel
        const chargesDeductibles = chargesAnnuelles + interetsAnnuels + assuranceMensuelle * 12
        const resultatAvantAmort = loyerActuel - chargesDeductibles
        
        // Amortissement de l'année (linéaire, s'arrête après durée de vie)
        const amortAnnuel = calculerAmortissementAnnee(i)
        const amortDispo = amortAnnuel + amortStocke
        amortUtilise = Math.min(amortDispo, Math.max(0, resultatAvantAmort))
        amortStocke = amortDispo - amortUtilise
        
        baseImposable = Math.max(0, resultatAvantAmort - amortUtilise)
        
        if (estLMP) {
          cotisationsSSI = Math.max(0, resultatAvantAmort) * LMP.SSI.TAUX_MOYEN
          ir = baseImposable * (tmi / 100)
        } else {
          ir = baseImposable * (tmi / 100)
          ps = baseImposable * PRELEVEMENTS_SOCIAUX.FINANCIER.TAUX_GLOBAL // Meublé = BIC → 18,6% (LFSS 2026)
        }
      }
    } else {
      // Fiscalité revenus fonciers
      if (regimeApplique === 'MICRO_FONCIER') {
        baseImposable = loyerBrutAnnee * (1 - LOCATION_NUE.MICRO_FONCIER.ABATTEMENT / 100)
        ir = baseImposable * (tmi / 100)
        ps = baseImposable * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL // Foncier → 17,2% (inchangé LFSS 2026)
      } else {
        // Réel foncier
        const chargesDeductibles = chargesAnnuelles + interetsAnnuels + assuranceMensuelle * 12
        const revenuFoncier = loyerActuel - chargesDeductibles
        baseImposable = Math.max(0, revenuFoncier)
        ir = baseImposable * (tmi / 100)
        ps = baseImposable * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL // Foncier → 17,2% (inchangé LFSS 2026)
      }
    }

    irCumule += ir
    psCumule += ps
    ssiCumule += cotisationsSSI

    // Cash-flow
    const cfAvantImpots = loyerActuel - chargesAnnuelles - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps - cotisationsSSI
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerActuel),
      charges: Math.round(chargesAnnuelles - coutTurnoverAnnuel),
      coutTurnover: Math.round(coutTurnoverAnnuel),
      interets: Math.round(interetsAnnuels),
      amortissement: Math.round(amortTotal),
      amortUtilise: Math.round(amortUtilise),
      baseImposable: Math.round(baseImposable),
      ir: Math.round(ir),
      ps: Math.round(ps),
      cotisationsSSI: Math.round(cotisationsSSI),
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
  // 8. PLUS-VALUE À LA REVENTE
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  const pvResult = calculImpotPlusValue(
    input.prixAcquisition,
    valeurRevente,
    input.dureeDetention,
    input.fraisNotaire,
    input.travaux
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
  const rentaBrute = (loyerAnnuelBrut / input.prixAcquisition) * 100
  const rentaNette = ((loyerAnnuelNet - chargesAnnuelles) / investTotal) * 100
  const loyerParM2 = loyerMensuelTotal / input.surface
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

  // Comparaison location classique
  const loyerClassiqueEstime = input.surface * 12 // Estimation 12€/m²/mois
  const gainColocation = loyerAnnuelBrut - loyerClassiqueEstime

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesColocation(input, estMeuble, estLMP, gainColocation, tmi)

  return {
    success: true,
    synthese: {
      investTotal,
      montantEmprunte,
      mensualite: Math.round(mensualite),
      nbChambres: input.nbChambres,
      loyerParChambre: input.loyerParChambre,
      loyerMensuelTotal: Math.round(loyerMensuelTotal),
      loyerAnnuel: Math.round(loyerAnnuelNet),
      loyerParM2: Math.round(loyerParM2 * 100) / 100,
      rentaBrute: Math.round(rentaBrute * 100) / 100,
      rentaNette: Math.round(rentaNette * 100) / 100,
      tri,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel: Math.round(cashFlowMoyen / 12),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      ssiCumule: Math.round(ssiCumule),
      amortStockeRestant: Math.round(amortStocke),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
      gainVsLocationClassique: Math.round(gainColocation),
    },
    colocation: {
      typeLocation: input.typeLocation,
      typeBail: input.typeBail,
      surface: input.surface,
      nbChambres: input.nbChambres,
      surfaceParChambre: Math.round(input.surface / input.nbChambres),
      tauxOccupation: input.tauxOccupation,
      turnoverAnnuel: input.turnoverAnnuel,
      coutTurnoverAnnuel: Math.round(coutTurnoverAnnuel),
    },
    fiscalite: {
      regimeFiscal: input.regimeFiscal,
      estMeuble,
      estLMP,
      depassePlafond,
      plafond: estMeuble ? plafondMicroBIC : plafondMicroFoncier,
      abattement: estMeuble ? LMNP.ABATTEMENT_MICRO_BIC : LOCATION_NUE.MICRO_FONCIER.ABATTEMENT,
    },
    amortissements: estMeuble ? {
      immeuble: Math.round(amortImmeubleAnnuel),
      mobilier: Math.round(amortMobilierAnnuel),
      travaux: Math.round(amortTravauxAnnuel),
      totalAnnee1: Math.round(amortTotal),
      dureeImmeuble: LMNP.DUREE_AMORT_IMMEUBLE,
      dureeMobilier: LMNP.DUREE_AMORT_MOBILIER,
      dureeTravaux: LMNP.DUREE_AMORT_TRAVAUX,
    } : null,
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

function generateAlertesColocation(
  input: ColocationInput,
  estMeuble: boolean,
  estLMP: boolean,
  gainColocation: number,
  tmi: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Avantage colocation
  if (gainColocation > 0) {
    alertes.push({
      type: 'success',
      message: `✅ Gain colocation vs location classique : +${gainColocation.toLocaleString('fr-FR')} €/an.`,
    })
  }

  // Type de bail
  if (input.typeBail === 'SOLIDAIRE') {
    alertes.push({
      type: 'success',
      message: `✅ Bail solidaire : tous les colocataires garants des loyers impayés.`,
    })
  } else {
    alertes.push({
      type: 'warning',
      message: `⚠️ Baux individuels : gestion plus complexe, risque de vacance partielle.`,
    })
  }

  // Turnover
  if (input.turnoverAnnuel > 50) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Turnover élevé (${input.turnoverAnnuel}%) : gestion intensive, coûts récurrents.`,
    })
  }

  // LMP
  if (estLMP) {
    alertes.push({
      type: 'error',
      message: `❌ Requalification LMP : recettes > 23 000 € ET > 50% revenus. Cotisations SSI obligatoires.`,
    })
  }

  // Meublé vs nu
  if (estMeuble) {
    alertes.push({
      type: 'info',
      message: `📋 Colocation meublée : fiscalité BIC, amortissements possibles en réel.`,
    })
  } else {
    alertes.push({
      type: 'info',
      message: `📋 Colocation nue : revenus fonciers, charges déductibles uniquement.`,
    })
  }

  // Règlementation
  alertes.push({
    type: 'info',
    message: `📋 Surface minimum : 9 m² par chambre. Vérifiez la règlementation locale.`,
  })

  // TMI élevé
  if (tmi >= 41 && estMeuble) {
    alertes.push({
      type: 'info',
      message: `💡 TMI ${tmi}% : le régime réel avec amortissements optimise la fiscalité.`,
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
    const input = colocationInputSchema.parse(body)

    const resultat = simulerColocation(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur colocation:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Colocation - Location multi-locataires',
      typesLocation: ['MEUBLE', 'NUE'],
      typesBail: ['INDIVIDUEL', 'SOLIDAIRE'],
      regimesFiscaux: ['MICRO_BIC', 'REEL', 'MICRO_FONCIER', 'REEL_FONCIER'],
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 250000,
        surface: 100,
        nbChambres: 4,
        typeLocation: 'MEUBLE',
        typeBail: 'SOLIDAIRE',
        loyerParChambre: 450,
        tauxOccupation: 90,
        turnoverAnnuel: 30,
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
