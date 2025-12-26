/**
 * API Route - Simulateur SCPI
 * Calculs sécurisés côté serveur
 * 
 * POST /api/advisor/simulators/immobilier/scpi
 * 
 * SCPI (Société Civile de Placement Immobilier) :
 * - Investissement indirect dans l'immobilier
 * - Revenus = dividendes (revenus fonciers)
 * - Fiscalité : IR + PS sur revenus fonciers
 * - Possibilité d'acquisition en nue-propriété (démembrement)
 * - Possibilité d'acquisition à crédit
 * 
 * Spécificités :
 * - Délai de jouissance (3-6 mois)
 * - Frais de souscription (8-12%)
 * - Liquidité limitée
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
  getNuePropriete,
} from '../_shared/calculations'
import {
  SCPI,
  PRELEVEMENTS_SOCIAUX,
  BAREME_DEMEMBREMENT,
} from '../_shared/constants'
import { scpiInputSchema, type SCPIInput } from '../_shared/validators'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION DE SIMULATION SCPI
// ══════════════════════════════════════════════════════════════════════════════

function simulerSCPI(input: SCPIInput) {
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
  // 2. CALCULS SELON TYPE D'ACQUISITION
  // ─────────────────────────────────────────────────────────────────────────────
  let investissementNet = input.montantInvesti
  let valeurParts = input.montantInvesti * (1 - input.fraisSouscription / 100)
  let montantEmprunte = 0
  let mensualite = 0
  let recoitRevenus = true
  let dureeSansRevenus = 0
  let valeurPPTheorique = input.montantInvesti

  // Nue-propriété
  if (input.typeAcquisition === 'NUE_PROPRIETE' && input.dureeDemembrement) {
    const decote = input.decoteNuePropriete || getNuePropriete(input.ageUsufruitier || 70)
    valeurPPTheorique = input.montantInvesti / (decote / 100)
    valeurParts = valeurPPTheorique * (1 - input.fraisSouscription / 100)
    recoitRevenus = false
    dureeSansRevenus = input.dureeDemembrement
  }

  // Crédit
  let tableauAmort: Array<{ annee: number; interets: number; capitalFin: number }> = []
  if (input.typeAcquisition === 'CREDIT' && input.tauxCredit && input.dureeCredit) {
    const apport = input.apport || 0
    montantEmprunte = Math.max(0, input.montantInvesti - apport)
    investissementNet = apport
    
    const mensualiteHorsAss = calculMensualiteCredit(montantEmprunte, input.tauxCredit, input.dureeCredit)
    const assuranceMensuelle = montantEmprunte * (input.assuranceCredit / 100) / 12
    mensualite = mensualiteHorsAss + assuranceMensuelle

    tableauAmort = calculTableauAmortissement(montantEmprunte, input.tauxCredit, input.dureeCredit)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REVENUS DISTRIBUÉS
  // ─────────────────────────────────────────────────────────────────────────────
  const distributionAnnuelle = valeurParts * (input.tauxDistribution / 100)
  const partFrance = (100 - input.partRevenusEtrangers) / 100
  const partEtranger = input.partRevenusEtrangers / 100

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. PROJECTIONS ANNUELLES
  // ─────────────────────────────────────────────────────────────────────────────
  const projections: Array<{
    annee: number
    valeurParts: number
    distribution: number
    distributionFrance: number
    distributionEtranger: number
    irFrance: number
    psFrance: number
    creditImpotEtranger: number
    interetsCredit: number
    interetsDeductibles: number
    creditAnnuel: number
    capitalRestant: number
    cfAvantImpots: number
    cfApresImpots: number
    recoitRevenus: boolean
  }> = []

  let valeurActuelle = valeurParts
  let distributionActuelle = distributionAnnuelle
  let cashFlowCumule = 0
  let irCumule = 0
  let psCumule = 0
  let creditImpotCumule = 0
  let capitalRestant = montantEmprunte

  for (let i = 1; i <= input.dureeDetention; i++) {
    // Délai de jouissance la première année
    const delaiJouissanceMois = i === 1 ? input.delaiJouissance : 0
    const prorata = i === 1 ? (12 - delaiJouissanceMois) / 12 : 1

    // Nue-propriété : pas de revenus pendant le démembrement
    const recoitRevenusAnnee = input.typeAcquisition === 'NUE_PROPRIETE'
      ? i > (input.dureeDemembrement || 0)
      : true

    // Revalorisation
    if (i > 1) {
      valeurActuelle *= (1 + input.revalorisationParts / 100)
      distributionActuelle *= (1 + input.revalorisationDistribution / 100)
    }

    // Distribution de l'année
    const distributionAnnee = recoitRevenusAnnee ? distributionActuelle * prorata : 0
    const distributionFrance = distributionAnnee * partFrance
    const distributionEtranger = distributionAnnee * partEtranger

    // Crédit
    const amort = tableauAmort.find(a => a.annee === i)
    const interetsAnnuels = amort?.interets || 0
    capitalRestant = amort?.capitalFin || Math.max(0, capitalRestant)
    const creditAnnuel = i <= (input.dureeCredit || 0) ? mensualite * 12 : 0

    // Intérêts déductibles des revenus fonciers
    const interetsDeductibles = Math.min(interetsAnnuels, distributionFrance)

    // Fiscalité revenus France (IR + PS)
    const baseImposableFrance = Math.max(0, distributionFrance - interetsDeductibles)
    const irFrance = baseImposableFrance * (tmi / 100)
    const psFrance = baseImposableFrance * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL

    // Revenus étrangers : crédit d'impôt (conventionné)
    // Simplifié : crédit d'impôt = taux moyen d'imposition × revenus étrangers
    const tauxMoyen = revenusTotaux > 0 ? irAvant.impotNet / revenusTotaux : 0
    const creditImpotEtranger = distributionEtranger * tauxMoyen

    irCumule += irFrance
    psCumule += psFrance
    creditImpotCumule += creditImpotEtranger

    // Cash-flow
    const cfAvantImpots = distributionAnnee - creditAnnuel
    const cfApresImpots = cfAvantImpots - irFrance - psFrance + creditImpotEtranger
    cashFlowCumule += cfApresImpots

    projections.push({
      annee: i,
      valeurParts: Math.round(valeurActuelle),
      distribution: Math.round(distributionAnnee),
      distributionFrance: Math.round(distributionFrance),
      distributionEtranger: Math.round(distributionEtranger),
      irFrance: Math.round(irFrance),
      psFrance: Math.round(psFrance),
      creditImpotEtranger: Math.round(creditImpotEtranger),
      interetsCredit: Math.round(interetsAnnuels),
      interetsDeductibles: Math.round(interetsDeductibles),
      creditAnnuel: Math.round(creditAnnuel),
      capitalRestant: Math.round(capitalRestant),
      cfAvantImpots: Math.round(cfAvantImpots),
      cfApresImpots: Math.round(cfApresImpots),
      recoitRevenus: recoitRevenusAnnee,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. REVENTE (valeur de retrait)
  // ─────────────────────────────────────────────────────────────────────────────
  const valeurRevente = Math.round(valeurActuelle)
  // Pas de plus-value immobilière classique sur SCPI (régime PV mobilière si >3 ans de détention)
  // Simplifié : pas d'imposition sur PV pour long terme
  const plusValueBrute = valeurRevente - valeurParts
  const impotPV = input.dureeDetention < 3 ? plusValueBrute * 0.30 : 0 // PFU si < 3 ans
  const plusValueNette = plusValueBrute - impotPV

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. IFI APRÈS INVESTISSEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  // SCPI soumises à IFI (sauf nue-propriété pendant démembrement)
  const valeurIFI_SCPI = input.typeAcquisition === 'NUE_PROPRIETE' && input.dureeDemembrement
    ? (input.dureeDetention <= input.dureeDemembrement ? 0 : valeurActuelle)
    : valeurActuelle

  const ifiApres = calculIFI({
    patrimoineImmobilierBrut: input.patrimoineImmobilierExistant + valeurIFI_SCPI,
    dettesDeductibles: input.dettesImmobilieres + capitalRestant,
    valeurRP: input.valeurRP,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. INDICATEURS DE PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────
  const rendementBrut = input.tauxDistribution
  const rendementNet = rendementBrut - (rendementBrut * tmi / 100) - (rendementBrut * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL)
  const cashFlowMoyen = cashFlowCumule / input.dureeDetention
  
  // Capital final = valeur de revente - capital restant dû (SCPI: pas de frais revente ni impôt PV direct)
  const capitalFinal = valeurRevente - capitalRestant
  
  // Gain total = Cash-flows cumulés + Capital final - Apport
  const gainTotal = cashFlowCumule + capitalFinal - investissementNet

  // TRI
  const fluxTresorerie = [-investissementNet]
  projections.forEach(p => fluxTresorerie.push(p.cfApresImpots))
  fluxTresorerie[fluxTresorerie.length - 1] += (valeurRevente - capitalRestant)
  const tri = calculTRI(fluxTresorerie)

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. ALERTES
  // ─────────────────────────────────────────────────────────────────────────────
  const alertes = generateAlertesSCPI(input, tmi, rendementNet, tri)

  return {
    success: true,
    synthese: {
      investissementBrut: input.montantInvesti,
      fraisSouscription: Math.round(input.montantInvesti * input.fraisSouscription / 100),
      investissementNet,
      valeurParts: Math.round(valeurParts),
      montantEmprunte,
      mensualite: Math.round(mensualite),
      distributionAnnuelle: Math.round(distributionAnnuelle),
      rendementBrut,
      rendementNet: Math.round(rendementNet * 100) / 100,
      tri,
      cashFlowMoyen: Math.round(cashFlowMoyen),
      cashFlowMoyenMensuel: Math.round(cashFlowMoyen / 12),
      cashFlowCumule: Math.round(cashFlowCumule),
      irCumule: Math.round(irCumule),
      psCumule: Math.round(psCumule),
      creditImpotCumule: Math.round(creditImpotCumule),
      valeurRevente,
      plusValueBrute: Math.round(plusValueBrute),
      impotPV,
      plusValueNette: Math.round(plusValueNette),
      capitalFinal: Math.round(capitalFinal),
      gainTotal: Math.round(gainTotal),
    },
    parametresSCPI: {
      typeAcquisition: input.typeAcquisition,
      tauxDistribution: input.tauxDistribution,
      fraisSouscription: input.fraisSouscription,
      delaiJouissance: input.delaiJouissance,
      partRevenusEtrangers: input.partRevenusEtrangers,
      dureeDemembrement: input.dureeDemembrement,
      decoteNuePropriete: input.decoteNuePropriete,
      valeurPPTheorique: input.typeAcquisition === 'NUE_PROPRIETE' ? Math.round(valeurPPTheorique) : null,
    },
    profilClient: {
      nombreParts,
      tmi,
      irAvant: irAvant.impotNet,
      ifiAvant: ifiAvant.impotNet,
      assujettiIFIAvant: ifiAvant.assujetti,
      ifiApres: ifiApres.impotNet,
      assujettiIFIApres: ifiApres.assujetti,
      exonereIFIPendantDemembrement: input.typeAcquisition === 'NUE_PROPRIETE',
    },
    projections,
    alertes,
  }
}

function generateAlertesSCPI(
  input: SCPIInput,
  tmi: number,
  rendementNet: number,
  tri: number
): Array<{ type: string; message: string }> {
  const alertes: Array<{ type: string; message: string }> = []

  // Type d'acquisition
  if (input.typeAcquisition === 'NUE_PROPRIETE') {
    alertes.push({
      type: 'success',
      message: `✅ Nue-propriété : pas de revenus pendant ${input.dureeDemembrement} ans = pas de fiscalité + exonération IFI.`,
    })
  } else if (input.typeAcquisition === 'CREDIT') {
    alertes.push({
      type: 'info',
      message: `📋 Acquisition à crédit : intérêts déductibles des revenus fonciers.`,
    })
  }

  // Délai de jouissance
  alertes.push({
    type: 'info',
    message: `📋 Délai de jouissance : ${input.delaiJouissance} mois avant perception des premiers revenus.`,
  })

  // Revenus étrangers
  if (input.partRevenusEtrangers > 30) {
    alertes.push({
      type: 'success',
      message: `✅ ${input.partRevenusEtrangers}% de revenus étrangers : crédit d'impôt sur IR (pas de PS).`,
    })
  }

  // Fiscalité selon TMI
  if (tmi >= 41) {
    alertes.push({
      type: 'warning',
      message: `⚠️ TMI ${tmi}% : forte imposition des revenus (${Math.round(tmi + PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL * 100)}% avec PS). Considérez la nue-propriété ou l'assurance-vie.`,
    })
  }

  // Rendement
  if (rendementNet < 2) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Rendement net après fiscalité : ${rendementNet.toFixed(1)}%. Inférieur à l'inflation.`,
    })
  }

  // Liquidité
  alertes.push({
    type: 'info',
    message: `📋 Liquidité limitée : délai de revente variable (quelques semaines à plusieurs mois).`,
  })

  // Frais de souscription
  if (input.fraisSouscription > 10) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Frais de souscription élevés (${input.fraisSouscription}%). Impact sur la performance.`,
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
    const input = scpiInputSchema.parse(body)

    const resultat = simulerSCPI(input)

    return createSuccessResponse(resultat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Données invalides: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        400
      )
    }
    console.error('Erreur simulateur SCPI:', error)
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    return createSuccessResponse({
      description: 'Simulateur SCPI - Investissement immobilier indirect',
      typesAcquisition: ['PLEINE_PROPRIETE', 'NUE_PROPRIETE', 'CREDIT'],
      parametresMoyens: {
        tauxDistribution: 4.5,
        fraisSouscription: SCPI.FRAIS_SOUSCRIPTION_MOYEN,
        delaiJouissance: SCPI.DELAI_JOUISSANCE_MOYEN,
        partRevenusEtrangers: 40,
      },
      baremeDemembrement: BAREME_DEMEMBREMENT,
      parametresDefaut: {
        situationFamiliale: 'MARIE_PACSE',
        enfantsACharge: 2,
        montantInvesti: 100000,
        typeAcquisition: 'PLEINE_PROPRIETE',
        tauxDistribution: 4.5,
        fraisSouscription: 10,
        delaiJouissance: 4,
        partRevenusEtrangers: 40,
        dureeDetention: 15,
        revalorisationParts: 1,
      },
    })
  } catch (error) {
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
