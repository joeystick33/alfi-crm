/**
 * API Route - Simulateur Location Saisonnière
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/saisonnier
 * 
 * Location Saisonnière (meublé tourisme) - Réforme LF 2024 pour revenus 2025 :
 * - Revenus imposés en BIC (pas revenus fonciers)
 * - Micro-BIC ou Réel
 * - Meublé tourisme CLASSÉ : abattement 50%, plafond 77 700 €
 * - Meublé tourisme NON CLASSÉ : abattement 30%, plafond 15 000 €
 * - Chambre d'hôtes : abattement 71%, plafond 188 700 € (maintenu)
 * - Requalification LMP si recettes > 23 000 € ET > 50% revenus
 * - Limite 120 nuits/an si résidence principale
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
  LOCATION_SAISONNIERE,
  LMP,
  LMNP,
  PRELEVEMENTS_SOCIAUX,
} from '../_shared/constants'
import { saisonnierInputSchema, type SaisonnierInput } from '../_shared/validators'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION LOCATION SAISONNIÈRE
// ══════════════════════════════════════════════════════════════════════════════

function simulerSaisonnier(input: SaisonnierInput) {
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
  // 2. PARAMÈTRES SELON TYPE DE MEUBLÉ
  // ─────────────────────────────────────────────────────────────────────────────
  let abattementMicroBIC: number
  let plafondMicroBIC: number

  switch (input.typeMeuble) {
    case 'TOURISME_CLASSE':
      abattementMicroBIC = LOCATION_SAISONNIERE.TOURISME_CLASSE.ABATTEMENT
      plafondMicroBIC = LOCATION_SAISONNIERE.TOURISME_CLASSE.PLAFOND_MICRO_BIC
      break
    case 'CHAMBRE_HOTES':
      abattementMicroBIC = LOCATION_SAISONNIERE.CHAMBRE_HOTES.ABATTEMENT
      plafondMicroBIC = LOCATION_SAISONNIERE.CHAMBRE_HOTES.PLAFOND_MICRO_BIC
      break
    default:
      abattementMicroBIC = LOCATION_SAISONNIERE.TOURISME_NON_CLASSE.ABATTEMENT
      plafondMicroBIC = LOCATION_SAISONNIERE.TOURISME_NON_CLASSE.PLAFOND_MICRO_BIC
  }

  // Limite si résidence principale
  const nuitsEffectives = input.estResidencePrincipale
    ? Math.min(input.nbNuitsMax, LOCATION_SAISONNIERE.LIMITE_RP)
    : input.nbNuitsMax

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INVESTISSEMENT ET FINANCEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const investTotal = input.prixAchat + input.fraisNotaire + input.travaux + input.mobilier
  const montantEmprunte = Math.max(0, investTotal - input.apport)

  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  const tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CALCUL DES REVENUS
  // ─────────────────────────────────────────────────────────────────────────────
  const nuitsLouees = Math.round(nuitsEffectives * (input.tauxOccupation / 100))
  const recettesBrutes = nuitsLouees * input.tarifNuitee
  const commissionPlateforme = recettesBrutes * (input.fraisPlateforme / 100)
  const fraisMenageTotal = nuitsLouees * input.fraisMenage / 7 // Menage par semaine
  const recettesNettes = recettesBrutes - commissionPlateforme

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. VÉRIFICATION STATUT LMP
  // ─────────────────────────────────────────────────────────────────────────────
  const estLMP = recettesBrutes > LMP.SEUIL_RECETTES && recettesBrutes > revenusTotaux * 0.5

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. AMORTISSEMENTS LINÉAIRES (régime réel)
  // L'amortissement comptable est CONSTANT pendant la durée de vie
  // ─────────────────────────────────────────────────────────────────────────────
  const partTerrain = 15 // 15% terrain non amortissable
  const valeurAmortissableImmeuble = input.prixAchat * (1 - partTerrain / 100)
  
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
  // 7. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    nuitsLouees: number
    recettesBrutes: number
    recettesNettes: number
    charges: number
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
    regimeApplique: 'MICRO_BIC' | 'REEL' | 'REEL_FORCE'
    alerteLMP: boolean
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let tarifActuel = input.tarifNuitee
  let valeurBien = input.prixAchat
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let ssiCumule = 0
  let amortStocke = 0

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1

    // Revalorisation
    if (i > 1) {
      tarifActuel *= (1 + input.revalorisationTarif / 100)
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Recettes de l'année
    const recettesBrutesAnnee = nuitsLouees * tarifActuel
    const commissionAnnee = recettesBrutesAnnee * (input.fraisPlateforme / 100)
    const menageAnnee = nuitsLouees * input.fraisMenage / 7
    const recettesNettesAnnee = recettesBrutesAnnee - commissionAnnee

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Charges
    const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + 
      menageAnnee + commissionAnnee + input.chargesAnnuelles +
      (recettesNettesAnnee * input.fraisGestion / 100)

    // Vérification LMP année par année
    const alerteLMP = recettesBrutesAnnee > LMP.SEUIL_RECETTES

    // Fiscalité
    let baseImposable = 0
    let ir = 0
    let ps = 0
    let cotisationsSSI = 0
    let amortUtilise = 0
    let regimeApplique: 'MICRO_BIC' | 'REEL' | 'REEL_FORCE' = input.regimeFiscal

    // Vérification plafond Micro-BIC
    const depassePlafond = recettesBrutesAnnee > plafondMicroBIC

    if (input.regimeFiscal === 'MICRO_BIC' && !depassePlafond) {
      baseImposable = recettesBrutesAnnee * (1 - abattementMicroBIC / 100)
      ir = baseImposable * (tmi / 100)
      ps = baseImposable * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL
      regimeApplique = 'MICRO_BIC'
    } else {
      // Régime réel (ou forcé si dépassement plafond)
      regimeApplique = depassePlafond ? 'REEL_FORCE' : 'REEL'
      
      const chargesDeductibles = chargesAnnuelles + interetsAnnuels + assuranceMensuelle * 12
      const resultatAvantAmort = recettesNettesAnnee - chargesDeductibles

      // Amortissement de l'année (linéaire, s'arrête après durée de vie)
      const amortAnnuel = calculerAmortissementAnnee(i)
      const amortDispo = amortAnnuel + amortStocke
      amortUtilise = Math.min(amortDispo, Math.max(0, resultatAvantAmort))
      amortStocke = amortDispo - amortUtilise

      baseImposable = Math.max(0, resultatAvantAmort - amortUtilise)
      
      // Si LMP : cotisations SSI
      if (estLMP) {
        cotisationsSSI = Math.max(0, resultatAvantAmort) * LMP.SSI.TAUX_MOYEN
        ir = baseImposable * (tmi / 100)
        ps = 0 // PS inclus dans cotisations SSI
      } else {
        ir = baseImposable * (tmi / 100)
        ps = baseImposable * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL
      }
    }

    irCumule += ir
    psCumule += ps
    ssiCumule += cotisationsSSI

    // Cash-flow
    const cfAvantImpots = recettesNettesAnnee - chargesAnnuelles - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps - cotisationsSSI
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      nuitsLouees,
      recettesBrutes: Math.round(recettesBrutesAnnee),
      recettesNettes: Math.round(recettesNettesAnnee),
      charges: Math.round(chargesAnnuelles),
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
      alerteLMP,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. PLUS-VALUE À LA REVENTE
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  const pvResult = calculImpotPlusValue(
    input.prixAchat,
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
  const rentaBrute = (recettesBrutes / input.prixAchat) * 100
  const rentaNette = ((recettesNettes - input.taxeFonciere - input.chargesCopro - input.assurancePNO - fraisMenageTotal) / investTotal) * 100
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
  const alertes = generateAlertesSaisonnier(input, recettesBrutes, plafondMicroBIC, abattementMicroBIC, estLMP, tmi)

  return {
    success: true,
    synthese: {
      investTotal,
      montantEmprunte,
      mensualite: Math.round(mensualite),
      nuitsLouees,
      recettesBrutes: Math.round(recettesBrutes),
      recettesNettes: Math.round(recettesNettes),
      rentaBrute: Math.round(rentaBrute * 100) / 100,
      rentaNette: Math.round(rentaNette * 100) / 100,
      tri,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel: Math.round(cashFlowMoyen / 12),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      ssiCumule: Math.round(ssiCumule),
      chargesFiscalesCumulees: Math.round(irCumule + psCumule + ssiCumule),
      amortStockeRestant: Math.round(amortStocke),
      plusValueBrute: pvResult.plusValueBrute,
      impotPV: pvResult.impotTotal,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    exploitation: {
      typeMeuble: input.typeMeuble,
      estResidencePrincipale: input.estResidencePrincipale,
      limiteNuitsRP: input.estResidencePrincipale ? LOCATION_SAISONNIERE.LIMITE_RP : null,
      nbNuitsMax: input.nbNuitsMax,
      nuitsEffectives,
      tauxOccupation: input.tauxOccupation,
      tarifNuitee: input.tarifNuitee,
      fraisPlateforme: input.fraisPlateforme,
    },
    fiscalite: {
      regimeFiscal: input.regimeFiscal,
      abattementMicroBIC,
      plafondMicroBIC,
      depassePlafond: recettesBrutes > plafondMicroBIC,
      estLMP,
      seuilLMP: LMP.SEUIL_RECETTES,
      cotisationsSSI: estLMP ? `${LMP.SSI.TAUX_MOYEN * 100}%` : null,
    },
    amortissements: {
      immeuble: Math.round(amortImmeubleAnnuel),
      mobilier: Math.round(amortMobilierAnnuel),
      travaux: Math.round(amortTravauxAnnuel),
      totalAnnee1: Math.round(amortTotal),
      dureeImmeuble: LMNP.DUREE_AMORT_IMMEUBLE,
      dureeMobilier: LMNP.DUREE_AMORT_MOBILIER,
      dureeTravaux: LMNP.DUREE_AMORT_TRAVAUX,
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

function generateAlertesSaisonnier(
  input: SaisonnierInput,
  recettes: number,
  plafondMicroBIC: number,
  abattement: number,
  estLMP: boolean,
  tmi: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Type de meublé
  if (input.typeMeuble === 'TOURISME_CLASSE') {
    alertes.push({
      type: 'success',
      message: `✅ Meublé tourisme classé : abattement ${abattement}% en Micro-BIC (au lieu de 50%).`,
    })
  } else if (input.typeMeuble === 'CHAMBRE_HOTES') {
    alertes.push({
      type: 'success',
      message: `✅ Chambre d'hôtes : abattement ${abattement}% en Micro-BIC.`,
    })
  }

  // Résidence principale
  if (input.estResidencePrincipale) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Résidence principale : location limitée à ${LOCATION_SAISONNIERE.LIMITE_RP} nuits/an.`,
    })
  }

  // Plafond Micro-BIC
  if (recettes > plafondMicroBIC && input.regimeFiscal === 'MICRO_BIC') {
    alertes.push({
      type: 'warning',
      message: `⚠️ Recettes (${Math.round(recettes).toLocaleString('fr-FR')} €) > plafond Micro-BIC (${plafondMicroBIC.toLocaleString('fr-FR')} €). Régime réel obligatoire.`,
    })
  }

  // Alerte LMP
  if (estLMP) {
    alertes.push({
      type: 'error',
      message: `❌ Requalification LMP : recettes > 23 000 € ET > 50% de vos revenus. Cotisations SSI obligatoires (~45%).`,
    })
  } else if (recettes > LMP.SEUIL_RECETTES) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Recettes > 23 000 €. Attention au seuil LMP (si > 50% de vos revenus).`,
    })
  }

  // Comparaison Micro-BIC vs Réel
  if (input.regimeFiscal === 'MICRO_BIC') {
    const baseImposableMicro = recettes * (1 - abattement / 100)
    const chargesEstimees = input.taxeFonciere + input.chargesCopro + input.assurancePNO + 
      recettes * input.fraisPlateforme / 100
    
    if (chargesEstimees > recettes * abattement / 100) {
      alertes.push({
        type: 'info',
        message: `💡 Vos charges réelles pourraient être > abattement forfaitaire. Comparez avec le régime réel.`,
      })
    }
  }

  // TMI élevé
  if (tmi >= 41) {
    alertes.push({
      type: 'info',
      message: `💡 TMI ${tmi}% : le régime réel avec amortissements peut réduire significativement l'impôt.`,
    })
  }

  // Déclaration en mairie
  alertes.push({
    type: 'info',
    message: `📋 Obligation : déclaration en mairie + numéro d'enregistrement pour les zones tendues.`,
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
    const input = saisonnierInputSchema.parse(body)

    const resultat = simulerSaisonnier(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    console.error('Erreur simulateur saisonnier:', error)
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur Location Saisonnière - Meublé tourisme',
      typesMeuble: ['TOURISME_CLASSE', 'TOURISME_NON_CLASSE', 'CHAMBRE_HOTES'],
      abattements: {
        TOURISME_CLASSE: LOCATION_SAISONNIERE.TOURISME_CLASSE.ABATTEMENT,
        TOURISME_NON_CLASSE: LOCATION_SAISONNIERE.TOURISME_NON_CLASSE.ABATTEMENT,
        CHAMBRE_HOTES: LOCATION_SAISONNIERE.CHAMBRE_HOTES.ABATTEMENT,
      },
      plafondsMicroBIC: {
        TOURISME_CLASSE: LOCATION_SAISONNIERE.TOURISME_CLASSE.PLAFOND_MICRO_BIC,
        TOURISME_NON_CLASSE: LOCATION_SAISONNIERE.TOURISME_NON_CLASSE.PLAFOND_MICRO_BIC,
        CHAMBRE_HOTES: LOCATION_SAISONNIERE.CHAMBRE_HOTES.PLAFOND_MICRO_BIC,
      },
      limiteRP: LOCATION_SAISONNIERE.LIMITE_RP,
      seuilLMP: LMP.SEUIL_RECETTES,
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAchat: 200000,
        typeMeuble: 'TOURISME_NON_CLASSE',
        tarifNuitee: 100,
        tauxOccupation: 60,
        nbNuitsMax: 200,
        regimeFiscal: 'MICRO_BIC',
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 15,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
