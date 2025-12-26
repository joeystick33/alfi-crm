/**
 * API Route - Simulateur LMP (Loueur Meublé Professionnel)
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/lmp
 * 
 * Conditions LMP (CGI art. 155 IV) :
 * - Recettes locatives > 23 000 €/an
 * - Recettes > autres revenus du foyer
 * 
 * Spécificités :
 * - Cotisations sociales SSI (environ 45%)
 * - Déficit imputable sur revenu global (sans limite)
 * - Plus-value professionnelle (exonération possible art. 151 septies)
 * - Exonération IFI si activité principale
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
  calculTRI,
  calculCotisationsSSI,
  calculSSIViaAPIURSSAF,
  verifierStatutLMP,
  type SSICalculResult,
} from '../_shared/calculations'
import {
  LMNP,
  LMP,
} from '../_shared/constants'
import { lmpInputSchema, type LMPInput } from '../_shared/validators'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION LMP
// ══════════════════════════════════════════════════════════════════════════════

async function simulerLMP(input: LMPInput) {
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
  const irBase = irAvant.impotNet
  const tmi = irAvant.tmi

  // IFI avant investissement
  const patrimoineNetAvant = input.patrimoineImmobilierExistant - input.dettesImmobilieres + input.valeurRP * 0.7
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
  // 3. REVENUS ET CHARGES
  // ─────────────────────────────────────────────────────────────────────────────
  const tauxOccupation = 1 - (input.vacanceSemaines / 52)
  const loyerAnnuelBrut = input.loyerMensuel * 12
  const loyerAnnuelNet = loyerAnnuelBrut * tauxOccupation

  const chargesAnnuelles = input.taxeFonciere + input.chargesCopro + input.assurancePNO + input.fraisComptable
  const fraisGestionAnnuel = loyerAnnuelNet * (input.fraisGestion / 100)

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. AMORTISSEMENTS LINÉAIRES (conformité comptable LMP)
  // Les amortissements sont CONSTANTS chaque année pendant leur durée de vie
  // Puis s'arrêtent une fois la base totalement amortie
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Durées d'amortissement (constantes)
  const DUREE_AMORT_FRAIS_ACQUISITION = 10
  
  // 4.1 Amortissement immeuble (hors terrain non amortissable) - 30 ans
  const valeurAmortissableImmeuble = input.prixAcquisition * (1 - input.partTerrain / 100)
  const amortImmeubleAnnuel = valeurAmortissableImmeuble / LMNP.DUREE_AMORT_IMMEUBLE
  
  // 4.2 Amortissement mobilier - 7 ans
  const amortMobilierAnnuel = input.mobilier / LMNP.DUREE_AMORT_MOBILIER
  
  // 4.3 Amortissement travaux - 10 ans
  const amortTravauxAnnuel = input.travaux / LMNP.DUREE_AMORT_TRAVAUX
  
  // 4.4 Amortissement frais d'acquisition (notaire) - 10 ans
  const fraisAcquisitionAmortissables = input.fraisNotaire
  const amortFraisAnnuel = fraisAcquisitionAmortissables / DUREE_AMORT_FRAIS_ACQUISITION
  
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
    // Frais acquisition : 10 ans
    if (annee <= DUREE_AMORT_FRAIS_ACQUISITION) amortAnnee += amortFraisAnnuel
    return amortAnnee
  }
  
  // Amortissement année 1 (pour estimation API URSSAF)
  const amortTotal = calculerAmortissementAnnee(1)
  
  // Bases amortissables totales (pour calcul VNC à la revente)
  const baseAmortissableImmeuble = valeurAmortissableImmeuble
  const baseAmortissableMobilier = input.mobilier
  const baseAmortissableTravaux = input.travaux
  const baseAmortissableFrais = fraisAcquisitionAmortissables

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. VÉRIFICATION STATUT LMP
  // Conditions : recettes > 23 000 € ET recettes > 50% des revenus pro du foyer
  // ─────────────────────────────────────────────────────────────────────────────
  const recettesLMP = loyerAnnuelBrut
  const autresRevenusActivite = input.revenusSalaires + input.autresRevenusProfessionnels
  const estLMP = verifierStatutLMP(recettesLMP, autresRevenusActivite)

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    loyer: number
    charges: number
    interets: number
    assurance: number
    amortissement: number
    amortUtilise: number
    resultatComptable: number
    resultatFiscal: number
    cotisationsSSI: number
    ir: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    valeurBien: number
    capitalNet: number
  }> = []

  const [anneeAcq] = input.dateAcquisition.split('-').map(Number)
  let capitalRestant = montantEmprunte
  let loyerActuel = loyerAnnuelNet
  let valeurBien = input.prixAcquisition
  let cashFlowCumule = 0
  let irCumule = 0
  let ssiCumule = 0
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VARIABLES DE SUIVI FISCAL LMP (conformité CGI)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 1. Stock d'amortissements non utilisés (CGI art. 39 C dernier alinéa)
  //    → Reportable SANS LIMITE DE DURÉE
  //    → Utilisable UNIQUEMENT sur bénéfices futurs de l'activité meublée
  //    → JAMAIS imputable sur le revenu global
  let amortStocke = 0
  
  // 2. Déficit HORS amortissement (CGI art. 156 I-1° bis)
  //    → Imputable sur le revenu global SANS LIMITATION
  //    → Provient uniquement de : Charges > Loyers (avant amortissement)
  //    → L'amortissement n'est JAMAIS inclus dans ce déficit
  let deficitHorsAmortCumule = 0
  
  // 3. Cumul des amortissements effectivement pratiqués (pour calcul PVCT à la revente)
  let amortissementsCumules = 0
  
  let firstYearSSI: SSICalculResult | null = null // Stocker détails SSI année 1
  
  // ─────────────────────────────────────────────────────────────────────────────
  // 6bis. TENTATIVE API URSSAF POUR CALCUL SSI PRÉCIS
  // On appelle l'API une fois pour obtenir le taux effectif, puis on l'applique
  // ─────────────────────────────────────────────────────────────────────────────
  let useApiSSI = false
  let apiSSIResult: SSICalculResult | null = null
  let tauxSSIEffectif = LMP.SSI.TAUX_MOYEN // Fallback
  
  if (estLMP) {
    // Estimer le bénéfice année 1 pour l'appel API
    const chargesDeductiblesAn1 = chargesAnnuelles + fraisGestionAnnuel + (tableauAmort[0]?.interets || 0) + assuranceMensuelle * 12
    const resultatAvantAmortAn1 = loyerAnnuelNet - chargesDeductiblesAn1
    const amortUtiliseAn1 = Math.min(amortTotal, Math.max(0, resultatAvantAmortAn1))
    const beneficeEstimeAn1 = Math.max(0, resultatAvantAmortAn1 - amortUtiliseAn1)
    
    // Tenter l'appel API URSSAF
    try {
      apiSSIResult = await calculSSIViaAPIURSSAF(loyerAnnuelBrut, beneficeEstimeAn1)
      if (apiSSIResult && apiSSIResult.cotisationsTotal > 0 && beneficeEstimeAn1 > 0) {
        useApiSSI = true
        tauxSSIEffectif = apiSSIResult.cotisationsTotal / beneficeEstimeAn1
        console.log(`[LMP] API URSSAF utilisée - Taux effectif: ${(tauxSSIEffectif * 100).toFixed(1)}%`)
      }
    } catch (error) {
      console.warn('[LMP] API URSSAF indisponible, utilisation du calcul local')
    }
  }

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
    const capitalRembourse = amort?.capitalRembourse || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant - capitalRembourse)
    const creditAnnuel = i <= input.dureeCredit ? mensualite * 12 : 0

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : CALCUL DU RÉSULTAT AVANT AMORTISSEMENT (CGI art. 156)
    // ═══════════════════════════════════════════════════════════════════════════
    // Loyers - Charges déductibles = Résultat avant amortissement
    // Ce résultat peut être NÉGATIF = déficit imputable sur revenu global
    const chargesDeductibles = chargesAnnuelles + fraisGestionAnnuel + interetsAnnuels + assuranceMensuelle * 12
    const resultatAvantAmort = loyerActuel - chargesDeductibles

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : VÉRIFIER LE SIGNE DU RÉSULTAT AVANT AMORTISSEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    // Amortissement de l'année (linéaire, s'arrête après durée de vie)
    const amortAnnuel = calculerAmortissementAnnee(i)
    
    // Amortissement disponible = amort. de l'année + stock reporté des années précédentes
    const amortDispo = amortAnnuel + amortStocke
    
    let amortUtilise = 0
    let resultatFiscal = 0
    
    if (resultatAvantAmort < 0) {
      // ═══════════════════════════════════════════════════════════════════════════
      // CAS A : RÉSULTAT AVANT AMORT < 0 (DÉFICIT)
      // ═══════════════════════════════════════════════════════════════════════════
      // → Le déficit est IMPUTABLE SUR LE REVENU GLOBAL (CGI 156 I-1° bis)
      // → L'amortissement NE PEUT PAS être utilisé (CGI art. 39 C)
      // → L'amortissement est entièrement STOCKÉ pour report ultérieur
      
      amortUtilise = 0                           // Aucun amortissement utilisable
      amortStocke = amortDispo                   // Tout passe dans le stock reportable
      resultatFiscal = resultatAvantAmort        // Le déficit hors amort = résultat fiscal
      deficitHorsAmortCumule += Math.abs(resultatFiscal) // Imputable revenu global SANS LIMITATION (CGI 156 I-1° bis)
      
    } else {
      // ═══════════════════════════════════════════════════════════════════════════
      // CAS B : RÉSULTAT AVANT AMORT >= 0 (BÉNÉFICE OU NUL)
      // ═══════════════════════════════════════════════════════════════════════════
      // → On peut MAINTENANT appliquer l'amortissement
      // → Plafonné au résultat avant amortissement (CGI art. 39 C)
      // → L'amortissement NE PEUT JAMAIS CRÉER DE DÉFICIT
      
      // Plafond = Résultat avant amortissement
      const plafondAmortDeductible = resultatAvantAmort
      
      // Amortissement déductible = min(disponible, plafond)
      amortUtilise = Math.min(amortDispo, plafondAmortDeductible)
      
      // Surplus non utilisé → stock reportable (sans limite de durée)
      amortStocke = amortDispo - amortUtilise
      
      // Résultat fiscal final = bénéfice avant amort - amortissement utilisé
      // Ce résultat est TOUJOURS >= 0 (jamais de déficit via amortissement)
      resultatFiscal = resultatAvantAmort - amortUtilise
    }
    
    // Cumuler les amortissements effectivement pratiqués (pour calcul PVCT à la revente)
    amortissementsCumules += amortUtilise

    // Cotisations sociales SSI (LMP uniquement = activité professionnelle)
    // On calcule TOUJOURS les détails SSI pour l'affichage, même si pas LMP
    let cotisationsSSI = 0
    
    // Toujours calculer les détails SSI pour l'affichage (simulation LMP)
    const ssiDetails = calculCotisationsSSI(
      loyerActuel, // recettes de l'année
      resultatFiscal, // bénéfice net après amortissement
      autresRevenusActivite,
      true // forcer le calcul pour afficher le détail même si statut LMP non validé
    )
    
    // Stocker les détails de la première année pour la synthèse
    if (i === 1) {
      firstYearSSI = ssiDetails
    }
    
    // Mais on n'applique les cotisations que si LMP validé
    if (estLMP) {
      if (useApiSSI && resultatFiscal > 0) {
        // Utiliser le taux effectif obtenu de l'API pour le montant total
        cotisationsSSI = Math.max(
          Math.round(resultatFiscal * tauxSSIEffectif),
          LMP.SSI.MINIMUM_TOTAL // Minimum obligatoire
        )
      } else {
        // Utiliser le calcul local
        cotisationsSSI = ssiDetails.cotisationsTotal
      }
    }

    // IR global après intégration du résultat LMP (les amortissements réduisent donc le revenu global)
    const revenuGlobalApres = Math.max(0, revenusTotaux + resultatFiscal)
    const irApres = calculIRDetaille(revenuGlobalApres, nombreParts).impotNet
    const ir = irApres - irBase

    irCumule += ir
    ssiCumule += cotisationsSSI

    // Cash-flow
    const cfAvantImpots = loyerActuel - chargesAnnuelles - fraisGestionAnnuel - creditAnnuel
    const cfApresImpots = cfAvantImpots - ir - cotisationsSSI
    cashFlowCumule += cfApresImpots

    projections.push({
      annee,
      loyer: Math.round(loyerActuel),
      charges: Math.round(chargesAnnuelles + fraisGestionAnnuel),
      interets: Math.round(interetsAnnuels),
      assurance: Math.round(assuranceMensuelle * 12), // Pour affichage
      amortissement: Math.round(amortUtilise),
      amortUtilise: Math.round(amortUtilise),
      resultatComptable: Math.round(resultatAvantAmort),
      resultatFiscal: Math.round(resultatFiscal),
      cotisationsSSI: Math.round(cotisationsSSI),
      ir: Math.round(ir),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      valeurBien: Math.round(valeurBien),
      capitalNet: Math.round(valeurBien - capitalRestant),
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PLUS-VALUE À LA REVENTE (Régime professionnel - PVCT + PVLT)
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurBien)
  
  // Calcul Valeur Nette Comptable (VNC)
  // VNC = Prix d'achat amortissable - Amortissements cumulés pratiqués
  const baseAmortissableTotal = baseAmortissableImmeuble + baseAmortissableMobilier + baseAmortissableTravaux + baseAmortissableFrais
  const valeurNetteComptable = Math.max(0, baseAmortissableTotal - amortissementsCumules)
  
  // Plus-Value professionnelle totale
  const plusValueTotale = valeurRevente - valeurNetteComptable
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DÉCOMPOSITION PVCT / PVLT (conformité fiscale LMP)
  // ═══════════════════════════════════════════════════════════════════════════
  // PVCT (Plus-Value Court Terme) = Amortissements cumulés
  //   → Taxée : IR au barème + cotisations sociales URSSAF + CSG 17.2%
  // PVLT (Plus-Value Long Terme) = PV totale - PVCT
  //   → Taxée : 19% IR + 17.2% PS = 36.2%
  
  const pvCT = amortissementsCumules // PVCT = amortissements pratiqués
  const pvLT = Math.max(0, plusValueTotale - pvCT) // PVLT = (Prix vente - VNC) - PVCT
  
  // Exonérations possibles
  let impotPV = 0
  let impotPVCT = 0
  let impotPVLT = 0
  let exonerationPV = false
  let tauxExoneration = 0
  let typeExoneration = 'Aucune'
  const moyenneRecettes = loyerAnnuelBrut

  // Art. 151 septies : exonération si recettes < 90k ET activité > 5 ans
  if (input.dureeDetention >= 5 && moyenneRecettes < LMP.EXONERATION_PV_PRO_SEUIL) {
    exonerationPV = true
    tauxExoneration = 100
    typeExoneration = 'Totale (art. 151 septies)'
    impotPV = 0
  } else if (input.dureeDetention >= 5 && moyenneRecettes < LMP.EXONERATION_PV_PRO_PLAFOND) {
    // Exonération partielle dégressive
    tauxExoneration = Math.round(((LMP.EXONERATION_PV_PRO_PLAFOND - moyenneRecettes) / 
      (LMP.EXONERATION_PV_PRO_PLAFOND - LMP.EXONERATION_PV_PRO_SEUIL)) * 100)
    typeExoneration = `Partielle ${tauxExoneration}% (art. 151 septies)`
    
    const pvCTImposable = pvCT * (1 - tauxExoneration / 100)
    const pvLTImposable = pvLT * (1 - tauxExoneration / 100)
    
    // PVCT : IR au barème (~30%) + CS (~45%) sur la part non exonérée - simplification
    impotPVCT = Math.round(pvCTImposable * (tmi / 100 + 0.172)) // IR + PS 17.2%
    // PVLT : 19% + 17.2% = 36.2%
    impotPVLT = Math.round(pvLTImposable * 0.362)
    impotPV = impotPVCT + impotPVLT
  } else {
    // Pas d'exonération 151 septies
    // Vérifier exonération 238 quindecies (prix de cession < 500k)
    if (valeurRevente < 500000 && input.dureeDetention >= 5) {
      typeExoneration = 'Totale (art. 238 quindecies - prix < 500k)'
      exonerationPV = true
      tauxExoneration = 100
      impotPV = 0
    } else {
      // Imposition normale
      // PVCT : IR au barème + PS 17.2%
      impotPVCT = Math.round(pvCT * (tmi / 100 + 0.172))
      // PVLT : 19% + 17.2% = 36.2%
      impotPVLT = Math.round(pvLT * 0.362)
      impotPV = impotPVCT + impotPVLT
    }
  }

  const fraisReventeEur = valeurRevente * (input.fraisRevente / 100)
  const plusValueNette = plusValueTotale - impotPV - fraisReventeEur

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. IFI APRÈS INVESTISSEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  // Si LMP = activité principale, le bien peut être exonéré d'IFI (art. 975)
  const bienExonereIFI = estLMP && recettesLMP > autresRevenusActivite
  const patrimoineNetApres = bienExonereIFI
    ? patrimoineNetAvant
    : patrimoineNetAvant + valeurBien - capitalRestant

  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: bienExonereIFI
      ? input.patrimoineImmobilierExistant
      : input.patrimoineImmobilierExistant + valeurBien,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rentaBrute = (loyerAnnuelBrut / input.prixAcquisition) * 100
  const rentaNette = ((loyerAnnuelNet - chargesAnnuelles - fraisGestionAnnuel) / investTotal) * 100
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = ce qu'il reste après revente et remboursement
  const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - impotPV
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  const gainTotal = cashFlowCumule + capitalFinal - input.apport

  // TRI
  const fluxTresorerie = [-input.apport]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant - fraisReventeEur - impotPV)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. ALERTES ET RECOMMANDATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesLMP(input, loyerAnnuelBrut, autresRevenusActivite, estLMP, tmi)

  return {
    success: true,
    synthese: {
      investTotal,
      montantEmprunte,
      mensualite: Math.round(mensualite),
      loyerAnnuel: Math.round(loyerAnnuelNet),
      recettesAnnuelles: Math.round(loyerAnnuelBrut),
      rentaBrute: Math.round(rentaBrute * 100) / 100,
      rentaNette: Math.round(rentaNette * 100) / 100,
      tri,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel: Math.round(cashFlowMoyen / 12),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      ssiCumule: Math.round(ssiCumule),
      chargesFiscalesCumulees: Math.round(irCumule + ssiCumule),
      plusValueTotale: Math.round(plusValueTotale),
      pvCT: Math.round(pvCT),
      pvLT: Math.round(pvLT),
      exonerationPV,
      typeExoneration,
      impotPV,
      impotPVCT: Math.round(impotPVCT),
      impotPVLT: Math.round(impotPVLT),
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
      amortStockeRestant: Math.round(amortStocke),
      // Suivi fiscal LMP (conformité CGI)
      fiscalLMP: {
        // Déficit HORS amortissement (CGI art. 156 I-1° bis)
        // → Imputable sur revenu global SANS LIMITATION de montant
        // → Ce déficit provient UNIQUEMENT de : Charges > Loyers
        // → L'amortissement n'est JAMAIS inclus (car ne peut créer de déficit)
        deficitHorsAmortCumule: Math.round(deficitHorsAmortCumule),
        // Stock d'amortissements non utilisés (CGI art. 39 C)
        // → Reportable SANS LIMITE DE DURÉE
        // → Utilisable UNIQUEMENT sur bénéfices futurs de l'activité
        // → JAMAIS imputable sur le revenu global
        amortStockeRestant: Math.round(amortStocke),
      },
    },
    // Détail plus-value professionnelle LMP avec PVCT/PVLT
    pvDetail: {
      regimeFiscal: 'Professionnel (PVCT + PVLT)',
      prixCession: Math.round(valeurRevente),
      valeurNetteComptable: Math.round(valeurNetteComptable),
      baseAmortissableTotal: Math.round(baseAmortissableTotal),
      prixAcquisition: input.prixAcquisition,
      amortissementsCumules: Math.round(amortissementsCumules),
      // Décomposition PVCT / PVLT
      pvTotale: Math.round(plusValueTotale),
      pvCT: Math.round(pvCT), // = amortissements pratiqués
      pvLT: Math.round(pvLT), // = PV totale - PVCT
      impotPVCT: Math.round(impotPVCT), // IR + PS 17.2%
      impotPVLT: Math.round(impotPVLT), // 36.2%
      dureeDetention: input.dureeDetention,
      recettesMoyennes: Math.round(loyerAnnuelBrut),
      exoneration: {
        eligible: input.dureeDetention >= 5,
        type: typeExoneration,
        tauxExoneration,
        seuilTotal: LMP.EXONERATION_PV_PRO_SEUIL,
        seuilPartiel: LMP.EXONERATION_PV_PRO_PLAFOND,
        seuil238quindecies: 500000,
        conditionDuree: 'Activité ≥ 5 ans',
        conditionRecettes: 'Recettes < 90 000 € (totale) ou < 126 000 € (partielle)',
        condition238quindecies: 'Prix de cession < 500 000 €',
      },
      fraisRevente: Math.round(fraisReventeEur),
      impotPV: Math.round(impotPV),
      pvNette: Math.round(plusValueNette),
      capitalRestantDu: Math.round(capitalRestant),
      capitalNetFinal: Math.round(capitalFinal),
    },
    statutLMP: {
      estLMP,
      recettesAnnuelles: Math.round(loyerAnnuelBrut),
      seuilRecettes: LMP.SEUIL_RECETTES,
      autresRevenusActivite: Math.round(autresRevenusActivite),
      revenusTotauxFoyer: Math.round(recettesLMP + autresRevenusActivite),
      partRecettes: Math.round((recettesLMP / (recettesLMP + autresRevenusActivite)) * 100),
      conditionRecettes: recettesLMP > LMP.SEUIL_RECETTES,
      conditionRevenus: recettesLMP > (recettesLMP + autresRevenusActivite) * LMP.SEUIL_PART_REVENUS,
      seuilPartRevenus: `${LMP.SEUIL_PART_REVENUS * 100}%`,
      bienExonereIFI,
      cotisationsSSI: {
        sourceCalcul: useApiSSI ? 'API URSSAF' : 'Calcul local',
        tauxEffectif: useApiSSI ? `${(tauxSSIEffectif * 100).toFixed(1)}%` : `${LMP.SSI.TAUX_MIN * 100}%-${LMP.SSI.TAUX_MAX * 100}%`,
        tauxApplique: `${LMP.SSI.TAUX_MIN * 100}%-${LMP.SSI.TAUX_MAX * 100}%`,
        minimumAnnuel: LMP.SSI.MINIMUM_TOTAL,
        apiDisponible: useApiSSI,
      },
    },
    // Détail complet SSI année 1 (pour affichage frontend)
    ssiDetail: firstYearSSI ? {
      beneficeNet: firstYearSSI.beneficeNet,
      cotisationsTotal: firstYearSSI.cotisationsTotal,
      cotisationsHorsCSG: firstYearSSI.cotisationsHorsCSG,
      csgCrds: firstYearSSI.csgCrds,
      tauxEffectif: firstYearSSI.beneficeNet > 0 
        ? Math.round((firstYearSSI.cotisationsTotal / firstYearSSI.beneficeNet) * 1000) / 10 
        : 0,
      minimumApplied: firstYearSSI.minimumApplied,
      details: {
        maladie: firstYearSSI.details.maladie,
        retraiteBase: firstYearSSI.details.retraiteBase,
        retraiteComplementaire: firstYearSSI.details.retraiteComplementaire,
        invaliditeDeces: firstYearSSI.details.invaliditeDeces,
        allocationsFamiliales: firstYearSSI.details.allocationsFamiliales,
        cfp: firstYearSSI.details.cfp,
        csgCrds: firstYearSSI.details.csgCrds,
      },
      droitsSociaux: {
        trimestresRetraite: firstYearSSI.beneficeNet >= LMP.SSI.PASS_2025 * 0.05 ? 4 : Math.ceil((firstYearSSI.beneficeNet / (LMP.SSI.PASS_2025 * 0.05)) * 4),
        couvertureMaladie: true,
        couvertureInvalidite: true,
      },
    } : null,
    profilClient: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
      ifiAvant: ifiAvant.impotNet,
      assujettiIFIAvant: ifiAvant.assujetti,
      ifiApres: ifiApres.impotNet,
      assujettiIFIApres: ifiApres.assujetti,
      economieIFI: bienExonereIFI ? Math.round(valeurBien * 0.007) : 0,
    },
    amortissements: {
      immeuble: Math.round(amortImmeubleAnnuel),
      mobilier: Math.round(amortMobilierAnnuel),
      travaux: Math.round(amortTravauxAnnuel),
      fraisAcquisition: Math.round(amortFraisAnnuel),
      totalAnnee1: Math.round(amortTotal),
      dureeImmeuble: LMNP.DUREE_AMORT_IMMEUBLE,
      dureeMobilier: LMNP.DUREE_AMORT_MOBILIER,
      dureeTravaux: LMNP.DUREE_AMORT_TRAVAUX,
      dureeFrais: DUREE_AMORT_FRAIS_ACQUISITION,
    },
    projections,
    alertes,
  }
}

function generateAlertesLMP(
  input: LMPInput,
  recettes: number,
  autresRevenus: number,
  estLMP: boolean,
  tmi: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Vérification statut LMP (recettes > 23k ET > 50% des revenus pro du foyer)
  const revenusTotaux = recettes + autresRevenus
  const partRecettes = revenusTotaux > 0 ? (recettes / revenusTotaux) * 100 : 0
  
  if (!estLMP) {
    if (recettes <= LMP.SEUIL_RECETTES) {
      alertes.push({
        type: 'warning',
        message: `⚠️ Recettes (${Math.round(recettes).toLocaleString('fr-FR')} €) ≤ seuil LMP (23 000 €). Vous êtes LMNP, pas LMP.`,
      })
    }
    if (recettes <= revenusTotaux * LMP.SEUIL_PART_REVENUS) {
      alertes.push({
        type: 'warning',
        message: `⚠️ Recettes représentent ${Math.round(partRecettes)}% des revenus pro (seuil : >50%). Condition LMP non remplie.`,
      })
    }
  } else {
    alertes.push({
      type: 'success',
      message: `✅ Statut LMP confirmé : recettes > 23 000 € ET > 50% des revenus professionnels (${Math.round(partRecettes)}%).`,
    })
  }

  // Cotisations SSI
  alertes.push({
    type: 'info',
    message: `📋 LMP : cotisations SSI obligatoires (35-45% du bénéfice net, min. ${LMP.SSI.MINIMUM_TOTAL} €/an). Affiliation au régime des indépendants.`,
  })

  // Exonération PV
  if (recettes < LMP.EXONERATION_PV_PRO_SEUIL) {
    alertes.push({
      type: 'success',
      message: `✅ Recettes < 90 000 € : plus-value potentiellement exonérée après 5 ans (art. 151 septies).`,
    })
  } else if (recettes < LMP.EXONERATION_PV_PRO_PLAFOND) {
    alertes.push({
      type: 'info',
      message: `📋 Recettes entre 90 000 € et 126 000 € : exonération partielle de la plus-value possible.`,
    })
  }

  // IFI
  if (estLMP) {
    alertes.push({
      type: 'success',
      message: `✅ LMP activité principale : bien potentiellement exonéré d'IFI (art. 975 CGI).`,
    })
  }

  // Déficit
  alertes.push({
    type: 'info',
    message: `💡 LMP : déficit imputable sur revenu global (sans limite), contrairement au LMNP.`,
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
    const input = lmpInputSchema.parse(body)

    const resultat = await simulerLMP(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    console.error('Erreur simulateur LMP:', error)
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur LMP - Loueur Meublé Professionnel',
      conditionsLMP: {
        seuilRecettes: LMP.SEUIL_RECETTES,
        conditionRevenus: 'Recettes > 50% des revenus professionnels du foyer',
      },
      specificites: {
        cotisationsSSI: `${LMP.SSI.TAUX_MIN * 100}% à ${LMP.SSI.TAUX_MAX * 100}% (progressif)`,
        minimumAnnuel: `${LMP.SSI.MINIMUM_TOTAL} € minimum`,
        deficitImputable: 'Sur revenu global sans limite',
        exonerationPV: {
          totale: `Recettes < ${LMP.EXONERATION_PV_PRO_SEUIL.toLocaleString('fr-FR')} € (après 5 ans)`,
          partielle: `Recettes entre ${LMP.EXONERATION_PV_PRO_SEUIL.toLocaleString('fr-FR')} € et ${LMP.EXONERATION_PV_PRO_PLAFOND.toLocaleString('fr-FR')} €`,
        },
        ifi: 'Bien potentiellement exonéré si activité principale',
      },
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        prixAcquisition: 300000,
        loyerMensuel: 2500,
        tauxCredit: 3.5,
        dureeCredit: 20,
        dureeDetention: 20,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
