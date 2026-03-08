/**
 * API Route - Simulateur LMNP
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/lmnp
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import {
  calculNombreParts,
  calculIRDetaille,
  calculIFI,
  calculMensualiteCredit,
} from '../_shared/calculations'
import { LMNP, PRELEVEMENTS_SOCIAUX } from '../_shared/constants'
import { lmnpInputSchema, type LMNPInput } from '../_shared/validators'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION (Zod)
// ══════════════════════════════════════════════════════════════════════════════

// Removed local lmnpInputSchema definition

function getMicroBICParams(typeMeuble: LMNPInput['typeMeuble']) {
  switch (typeMeuble) {
    case 'TOURISME_CLASSE':
      return {
        plafond: LMNP.MICRO_BIC.TOURISME_CLASSE.PLAFOND,
        abattement: LMNP.MICRO_BIC.TOURISME_CLASSE.ABATTEMENT,
      }
    case 'CHAMBRE_HOTES':
      return {
        plafond: LMNP.MICRO_BIC.CHAMBRE_HOTES.PLAFOND,
        abattement: LMNP.MICRO_BIC.CHAMBRE_HOTES.ABATTEMENT,
      }
    default:
      return {
        plafond: LMNP.MICRO_BIC.CLASSIQUE.PLAFOND,
        abattement: LMNP.MICRO_BIC.CLASSIQUE.ABATTEMENT,
      }
  }
}

function simulerLMNP(input: LMNPInput) {
  // Profil fiscal
  const nombreParts = calculNombreParts({
    situationFamiliale: input.situationFamiliale,
    enfantsACharge: input.enfantsACharge,
    enfantsGardeAlternee: input.enfantsGardeAlternee,
    parentIsole: input.parentIsole,
  })
  
  // Revenus totaux incluant BIC existants pour calcul TMI correct
  const revenusTotaux = input.revenusSalaires + input.revenusFonciersExistants + input.revenusBICExistants + input.autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts, { parentIsole: input.parentIsole })
  const tmi = irAvant.tmi
  
  // Paramètres micro-BIC selon type de meublé (LF 2024)
  const microBICParams = getMicroBICParams(input.typeMeuble)

  // IFI avant
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant,
    dettesDeductibles: input.dettesImmobilieres,
    valeurRP: input.valeurRP,
  })

  // Investissement
  const investTotal = input.prixAchat + input.fraisNotaire + input.travaux + input.mobilier
  const montantEmprunte = Math.max(0, investTotal - input.apport)
  
  // Crédit
  const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
  const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
  const mensualite = mensualiteHorsAss + assuranceMensuelle

  // Revenus et charges
  const loyerAnnuel = input.loyerMensuel * 12 * (1 - input.vacanceSemaines / 52)
  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.cfe + input.comptabilite
  const fraisGestionAnnuel = loyerAnnuel * (input.fraisGestion / 100)

  // ══════════════════════════════════════════════════════════════════════════════
  // AMORTISSEMENTS LINÉAIRES (régime réel uniquement)
  // L'amortissement comptable est CONSTANT pendant la durée de vie de chaque composant
  // puis s'arrête une fois la base totalement amortie
  // ══════════════════════════════════════════════════════════════════════════════
  const valeurAmortissable = input.prixAchat * (1 - input.partTerrain / 100)
  
  // Amortissements annuels (constants pendant leur durée respective)
  const amortImmeubleAnnuel = valeurAmortissable / LMNP.DUREE_AMORT_IMMEUBLE  // 30 ans
  const amortMobilierAnnuel = input.mobilier / LMNP.DUREE_AMORT_MOBILIER      // 7 ans
  const amortTravauxAnnuel = input.travaux / LMNP.DUREE_AMORT_TRAVAUX         // 10 ans
  
  // Fonction pour calculer l'amortissement disponible selon l'année
  // L'amortissement s'arrête après la durée de vie de chaque composant
  const calculerAmortissementAnnee = (annee: number): number => {
    let amortAnnee = 0
    // Immeuble : 30 ans
    if (annee <= LMNP.DUREE_AMORT_IMMEUBLE) amortAnnee += amortImmeubleAnnuel
    // Mobilier : 7 ans
    if (annee <= LMNP.DUREE_AMORT_MOBILIER) amortAnnee += amortMobilierAnnuel
    // Travaux : 10 ans
    if (annee <= LMNP.DUREE_AMORT_TRAVAUX) amortAnnee += amortTravauxAnnuel
    return amortAnnee
  }
  
  // Amortissement année 1 (pour référence)
  const amortTotal = calculerAmortissementAnnee(1)

  // Projections
  const projections = []
  let capitalRestant = montantEmprunte
  let loyerActuel = loyerAnnuel
  let valeurBien = input.prixAchat
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VARIABLES DE SUIVI FISCAL LMNP (conformité CGI)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 1. Stock d'amortissements non utilisés (CGI art. 39 C)
  //    → Reportable SANS LIMITE DE DURÉE
  //    → Utilisable UNIQUEMENT sur bénéfices futurs de l'activité LMNP
  //    → JAMAIS imputable sur le revenu global (contrairement au LMP)
  let amortStocke = input.amortDiffereAnterieur
  
  // 2. Déficit LMNP (CGI art. 156 I-1° ter)
  //    → Reportable 10 ANS sur les revenus LMNP futurs UNIQUEMENT
  //    → JAMAIS imputable sur le revenu global (différence majeure avec LMP)
  //    → Provient de : Charges > Loyers (avant amortissement)
  //    → L'amortissement n'est JAMAIS inclus dans ce déficit
  let deficitLMNPReportable = 0 // Cumul des déficits reportables
  
  // 3. Cumul des amortissements effectivement pratiqués (pour info)
  let amortCumule = 0

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)

  for (let i = 1; i <= input.dureeDetention; i++) {
    const annee = anneeAcq + i - 1

    // Revalorisation
    if (i > 1) {
      loyerActuel *= (1 + input.revalorisationLoyer / 100)
      valeurBien *= (1 + input.revalorisationBien / 100)
    }

    // Crédit
    const interetsAnnuels = capitalRestant * (input.tauxCredit / 100)
    const capitalRembourse = i <= input.dureeCredit ? Math.min(mensualiteHorsAss * 12 - interetsAnnuels, capitalRestant) : 0
    capitalRestant = Math.max(0, capitalRestant - capitalRembourse)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // Fiscalité
    let baseImposable = 0
    let ir = 0
    let ps = 0
    let amortUtilise = 0
    let amortDispo = 0
    let amortAnnuel = 0 // Amortissement théorique de l'année (dépend de la durée de vie)
    let resultatAvantAmort = 0
    const assuranceAnnuelle = assuranceMensuelle * 12

    if (input.regimeFiscal === 'MICRO_BIC') {
      // Abattement selon type de meublé (LF 2024)
      baseImposable = loyerActuel * (1 - microBICParams.abattement / 100)
      ir = baseImposable * (tmi / 100)
      ps = baseImposable * PRELEVEMENTS_SOCIAUX.FINANCIER.TAUX_GLOBAL
      resultatAvantAmort = baseImposable // Pour affichage
    } else {
      // ═══════════════════════════════════════════════════════════════════════════
      // RÉGIME RÉEL LMNP - Ordre EXACT des calculs (CGI art. 39 C + 156 I-1° ter)
      // ═══════════════════════════════════════════════════════════════════════════
      
      // ─────────────────────────────────────────────────────────────────────────
      // ÉTAPE 1 : Résultat avant amortissement = Loyers - Charges
      // ─────────────────────────────────────────────────────────────────────────
      const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceAnnuelle
      resultatAvantAmort = loyerActuel - chargesDeductibles
      
      // ─────────────────────────────────────────────────────────────────────────
      // ÉTAPE 2 : Vérifier le signe du résultat avant amortissement
      // ─────────────────────────────────────────────────────────────────────────
      amortAnnuel = calculerAmortissementAnnee(i)
      amortDispo = amortAnnuel + amortStocke
      
      if (resultatAvantAmort < 0) {
        // ═══════════════════════════════════════════════════════════════════════
        // CAS A : RÉSULTAT AVANT AMORT < 0 (DÉFICIT LMNP)
        // ═══════════════════════════════════════════════════════════════════════
        // → Ce déficit est REPORTABLE 10 ANS sur les revenus LMNP futurs
        // → JAMAIS imputable sur le revenu global (différence majeure avec LMP)
        // → L'amortissement NE PEUT PAS être utilisé (CGI art. 39 C)
        // → L'amortissement est entièrement STOCKÉ pour report ultérieur
        
        amortUtilise = 0
        amortStocke = amortDispo // Tout l'amort passe dans le stock
        deficitLMNPReportable += Math.abs(resultatAvantAmort) // Cumul déficit reportable 10 ans
        baseImposable = 0 // Résultat final = 0 (déficit non imputable sur autres revenus)
        
      } else {
        // ═══════════════════════════════════════════════════════════════════════
        // CAS B : RÉSULTAT AVANT AMORT >= 0 (BÉNÉFICE OU NUL)
        // ═══════════════════════════════════════════════════════════════════════
        
        // B1. D'abord : imputer les déficits LMNP reportables des années précédentes
        let resultatApresDeficit = resultatAvantAmort
        if (deficitLMNPReportable > 0) {
          const imputationDeficit = Math.min(deficitLMNPReportable, resultatAvantAmort)
          resultatApresDeficit = resultatAvantAmort - imputationDeficit
          deficitLMNPReportable -= imputationDeficit
        }
        
        // B2. Ensuite : appliquer l'amortissement (plafonné au résultat après imputation déficit)
        // → L'amortissement NE PEUT JAMAIS CRÉER DE DÉFICIT
        const plafondAmort = resultatApresDeficit
        amortUtilise = Math.min(amortDispo, plafondAmort)
        amortStocke = amortDispo - amortUtilise
        
        // B3. Résultat fiscal final = résultat après déficit - amortissement utilisé
        // → Ce résultat est TOUJOURS >= 0 (jamais de déficit via amortissement)
        baseImposable = resultatApresDeficit - amortUtilise
      }
      
      ir = baseImposable * (tmi / 100)
      ps = baseImposable * PRELEVEMENTS_SOCIAUX.FINANCIER.TAUX_GLOBAL
      amortCumule += amortUtilise
    }

    irCumule += ir
    psCumule += ps

    // Cash-flow
    const cfAvantImpots = loyerActuel - chargesAnnuelles - fraisGestionAnnuel - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - ps
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerActuel),
      charges: Math.round(chargesAnnuelles + fraisGestionAnnuel),
      credit: Math.round(creditAnnuel),
      interets: Math.round(interetsAnnuels),
      assuranceCredit: Math.round(assuranceAnnuelle),
      capitalRestant: Math.round(capitalRestant),
      // Amortissement détaillé
      resultatAvantAmort: Math.round(resultatAvantAmort),
      amortAnnuel: Math.round(amortAnnuel), // Amortissement théorique de l'année (variable selon durée de vie)
      amortDispo: Math.round(amortDispo),  // Amortissement disponible (annuel + stock)
      amortUtilise: Math.round(amortUtilise),
      amortDiffere: Math.round(amortStocke), // Stock reporté après utilisation
      // Fiscalité
      baseImposable: Math.round(baseImposable),
      ir: Math.round(ir),
      ps: Math.round(ps),
      // Cash-flow
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
    })
  }

  // Revente
  const valeurRevente = Math.round(valeurBien)
  
  // ══════════════════════════════════════════════════════════════════════════════
  // CALCUL DE LA PLUS-VALUE IMMOBILIÈRE (CGI art. 150 VB)
  // ══════════════════════════════════════════════════════════════════════════════
  
  // 1. Prix d'acquisition = Prix d'achat seul (hors frais notaire, hors mobilier)
  const prixAchatPV = input.prixAchat
  
  // 2. Frais d'acquisition - CGI art. 150 VB II 4°
  // Option A: Frais réels (si justificatifs) - frais de notaire saisis
  // Option B: Forfait 7.5% du prix d'achat
  // → On prend le MAX entre les deux (cas neuf avec frais réduits ou frais offerts)
  const forfaitAcquisition = Math.round(prixAchatPV * 0.075)
  const fraisAcquisitionReels = input.fraisNotaire || 0
  const majorationAcquisition = Math.max(forfaitAcquisition, fraisAcquisitionReels)
  const utiliseForfaitAcquisition = majorationAcquisition === forfaitAcquisition
  
  // 3. Travaux - CGI art. 150 VB II 4°
  // Option A: Travaux réels (si justificatifs)
  // Option B: Forfait 15% du prix d'achat (si détention > 5 ans)
  // → On prend le MAX entre les deux
  const forfaitTravaux = input.dureeDetention > 5 ? Math.round(prixAchatPV * 0.15) : 0
  const travauxReels = input.travaux || 0
  const majorationTravaux = Math.max(forfaitTravaux, travauxReels)
  const utiliseForfaitTravaux = majorationTravaux === forfaitTravaux
  
  // 4. Prix d'acquisition majoré (avant réforme LF 2024)
  const prixAcquisitionMajore = prixAchatPV + majorationAcquisition + majorationTravaux
  
  // 5. Réintégration des amortissements (LF 2024 - art. 30)
  // Les amortissements pratiqués viennent minorer le prix d'acquisition
  const amortissementsReintegres = amortCumule
  
  // 6. Prix d'acquisition rectifié (avec réforme LF 2024)
  const prixAcquisitionRectifie = prixAcquisitionMajore - amortissementsReintegres
  
  // 7. Plus-value brute = Prix de vente - Prix d'acquisition rectifié
  const plusValueBrute = Math.max(0, valeurRevente - prixAcquisitionRectifie)
  
  // Pour comparaison: PV sans la réforme LF 2024
  const plusValueBruteSansReforme = Math.max(0, valeurRevente - prixAcquisitionMajore)
  
  // Calcul abattements PV (art. 150 VC CGI - BOI-RFPI-PVI-20-20)
  // Source: https://bofip.impots.gouv.fr/bofip/248-PGP.html
  const anneesPV = input.dureeDetention
  
  // IR : 6% par an de la 6e à la 21e année, 4% la 22e année → exonération totale à 22 ans
  let abattementIR = 0
  if (anneesPV >= 22) {
    abattementIR = 100
  } else if (anneesPV > 5) {
    // 6% par an de l'année 6 à 21
    abattementIR = 6 * Math.min(anneesPV - 5, 16)
    // 4% la 22e année (si applicable)
    if (anneesPV === 21) abattementIR += 0 // pas encore 22 ans
  }
  
  // PS : 1.65% par an de la 6e à la 21e, 1.60% la 22e année, 9% par an de la 23e à la 30e
  let abattementPS = 0
  if (anneesPV >= 30) {
    abattementPS = 100
  } else if (anneesPV > 5) {
    // 1.65% par an de l'année 6 à 21
    const anneesPhase1 = Math.min(anneesPV - 5, 16)
    abattementPS = 1.65 * anneesPhase1
    // 1.60% la 22e année
    if (anneesPV >= 22) {
      abattementPS += 1.60
      // 9% par an de la 23e à la 30e
      if (anneesPV > 22) {
        abattementPS += 9 * Math.min(anneesPV - 22, 8)
      }
    }
  }
  
  const pvImposableIR = Math.max(0, plusValueBrute) * (1 - abattementIR / 100)
  const pvImposablePS = Math.max(0, plusValueBrute) * (1 - abattementPS / 100)
  const impotPV = Math.round(pvImposableIR * 0.19 + pvImposablePS * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL)
  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  
  // Capital restant dû à la revente
  const capitalRestantRevente = projections[projections.length - 1]?.capitalRestant || 0
  
  // Produit net de la vente = Valeur - Frais - Impôt PV - Dette restante
  const produitNetVente = valeurRevente - fraisReventeEur - impotPV - capitalRestantRevente
  
  // Gain total = Cash-flows cumulés + Produit net de vente - Apport initial
  const gainTotal = cashFlowCumule + produitNetVente - input.apport
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = produitNetVente

  // IFI après
  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // Rentabilités
  const rentaBrute = (input.loyerMensuel * 12 / input.prixAchat) * 100
  const rentaNette = ((loyerAnnuel - chargesAnnuelles) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention

  // TRI (méthode Newton-Raphson)
  // Flux : -Apport au T0, puis CF annuels, puis produit net de vente au dernier flux
  let tri = 0.05
  if (input.apport > 0) {
    const flux = [-input.apport]
    for (const p of projections) {
      flux.push(p.cfApresImpots)
    }
    // Dernier flux = CF dernière année + produit net de vente
    flux[flux.length - 1] += produitNetVente
    
    for (let iter = 0; iter < 100; iter++) {
      let van = 0, deriv = 0
      for (let t = 0; t < flux.length; t++) {
        van += flux[t] / Math.pow(1 + tri, t)
        deriv -= t * flux[t] / Math.pow(1 + tri, t + 1)
      }
      if (Math.abs(deriv) < 1e-10) break
      const newTri = tri - van / deriv
      if (Math.abs(newTri - tri) < 0.0001) break
      tri = newTri
    }
  }

  // Cash-flow mensuel moyen
  const cashFlowMoyenMensuel = Math.round(cashFlowCumule / input.dureeDetention / 12)

  // Impôt PV détaillé
  const impotIR_PV = Math.round(pvImposableIR * 0.19)
  const impotPS_PV = Math.round(pvImposablePS * PRELEVEMENTS_SOCIAUX.FONCIER.TAUX_GLOBAL)

  return {
    success: true,
    synthese: {
      investTotal,
      montantEmprunte,
      mensualite: Math.round(mensualite),
      loyerAnnuel: Math.round(loyerAnnuel),
      rentaBrute: Math.round(rentaBrute * 100) / 100,
      rentaNette: Math.round(rentaNette * 100) / 100,
      tri: Math.round(tri * 10000) / 100,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel,
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
      // Champs attendus par le frontend
      amortCumule: Math.round(amortCumule),
      amortDiffereRestant: Math.round(amortStocke),
      // Suivi fiscal LMNP (conformité CGI)
      fiscalLMNP: {
        // Stock d'amortissements non utilisés (CGI art. 39 C)
        // → Reportable SANS LIMITE DE DURÉE
        // → Utilisable UNIQUEMENT sur bénéfices futurs de l'activité LMNP
        // → JAMAIS imputable sur le revenu global
        amortStockeRestant: Math.round(amortStocke),
        // Déficit LMNP reportable (CGI art. 156 I-1° ter)
        // → Reportable 10 ANS sur les revenus LMNP futurs UNIQUEMENT
        // → JAMAIS imputable sur le revenu global (contrairement au LMP)
        deficitLMNPReportable: Math.round(deficitLMNPReportable),
      },
    },
    amortissements: {
      totalAnnee1: Math.round(amortTotal),
      immeuble: Math.round(amortImmeubleAnnuel),
      mobilier: Math.round(amortMobilierAnnuel),
      travaux: Math.round(amortTravauxAnnuel),
      dureeImmeuble: LMNP.DUREE_AMORT_IMMEUBLE,
      dureeMobilier: LMNP.DUREE_AMORT_MOBILIER,
      dureeTravaux: LMNP.DUREE_AMORT_TRAVAUX,
    },
    plusValue: {
      valeurRevente,
      // Détail du calcul du prix d'acquisition fiscal (CGI art. 150 VB)
      prixAchat: prixAchatPV,
      // Frais d'acquisition: MAX(forfait 7.5%, réel)
      forfaitAcquisition,         // 7.5% du prix d'achat
      fraisAcquisitionReels,      // Frais notaire saisis
      majorationAcquisition,      // Montant retenu (max des deux)
      utiliseForfaitAcquisition,  // true si forfait > réel
      // Travaux: réel si renseigné, sinon forfait 15%
      forfaitTravaux,             // 15% du prix d'achat si > 5 ans
      travauxReels,               // Travaux réels déclarés
      majorationTravaux,          // Montant retenu
      utiliseForfaitTravaux,      // true si forfait utilisé
      // Totaux
      prixAcquisitionMajore,      // Prix + majorations (avant réforme LF 2024)
      amortissementsReintegres,   // LF 2024: amortissements pratiqués
      prixAcquisitionRectifie,    // Prix corrigé (après réforme LF 2024)
      plusValueBrute,             // PV avec réforme
      plusValueBruteSansReforme,  // PV sans réforme (comparaison)
      dureeDetention: input.dureeDetention,
      abattementIR,
      abattementPS,
      pvImposableIR: Math.round(pvImposableIR),
      pvImposablePS: Math.round(pvImposablePS),
      impotIR: impotIR_PV,
      impotPS: impotPS_PV,
      impotTotal: impotPV,
      fraisRevente: Math.round(fraisReventeEur),
      plusValueNette: Math.round(plusValueBrute - impotPV),
      capitalFinal,
    },
    profilClient: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
      irBrut: irAvant.impotBrut,
      plafonnementQF: irAvant.plafonnementApplique, // Montant du plafonnement QF appliqué
      ifiAvant: ifiAvant.impotNet,
      assujettiIFIAvant: ifiAvant.assujetti,
      ifiApres: ifiApres.impotNet,
      assujettiIFIApres: ifiApres.assujetti,
    },
    fiscalite: {
      regimeFiscal: input.regimeFiscal,
      tmi,
      typeMeuble: input.typeMeuble,
      plafondMicroBIC: microBICParams.plafond,
      abattementMicroBIC: microBICParams.abattement,
    },
    projections,
    alertes: generateAlertes(input, loyerAnnuel, tmi, microBICParams),
  }
}

function generateAlertes(
  input: LMNPInput, 
  loyerAnnuel: number, 
  tmi: number,
  microBICParams: { plafond: number; abattement: number }
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Alerte dépassement plafond micro-BIC (selon type de meublé)
  if (loyerAnnuel > microBICParams.plafond && input.regimeFiscal === 'MICRO_BIC') {
    alertes.push({
      type: 'warning',
      message: `⚠️ Recettes (${Math.round(loyerAnnuel).toLocaleString('fr-FR')} €) > plafond micro-BIC ${input.typeMeuble} (${microBICParams.plafond.toLocaleString('fr-FR')} €). Régime réel obligatoire.`,
    })
  }

  // Conseil régime réel si TMI élevé
  if (input.regimeFiscal === 'MICRO_BIC' && tmi >= 30) {
    alertes.push({
      type: 'info',
      message: `💡 TMI ${tmi}% : le régime réel avec amortissements pourrait être plus avantageux.`,
    })
  }

  // Alerte seuil LMNP - risque de basculement en LMP
  if (loyerAnnuel > LMNP.SEUIL_RECETTES_LMNP) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Recettes (${Math.round(loyerAnnuel).toLocaleString('fr-FR')} €) > seuil LMNP (23 000 €). Si elles dépassent aussi vos revenus d'activité, vous basculez en LMP (régime professionnel).`,
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
    const input = lmnpInputSchema.parse(body)

    const resultat = simulerLMNP(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    logger.error('Erreur simulateur LMNP:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAchat: 200000,
        loyerMensuel: 800,
        tauxCredit: 3.5,
        dureeCredit: 20,
        regimeFiscal: 'REEL',
        dureeDetention: 20,
      },
      constantes: {
        // Plafonds et abattements micro-BIC 2025 selon type de meublé
        microBIC: LMNP.MICRO_BIC,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
