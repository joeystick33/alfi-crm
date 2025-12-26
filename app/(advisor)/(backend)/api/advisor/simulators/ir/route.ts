 
/**
 * API Route - Simulateur IR Complet
 * Calculs sécurisés côté serveur - Barème 2025
 * 
 * POST /api/advisor/simulators/ir
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES FISCALES 2025
// ══════════════════════════════════════════════════════════════════════════════

const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 11 },
  { min: 29315, max: 83823, taux: 30 },
  { min: 83823, max: 180294, taux: 41 },
  { min: 180294, max: Infinity, taux: 45 },
]

const DECOTE_2025 = {
  SEUL: { seuil: 1929, plafond: 873 },
  COUPLE: { seuil: 3191, plafond: 1444 },
}

const PLAFOND_QF_2025 = {
  GENERAL: 1759,
  PARENT_ISOLE: 4149,
}

const ABATTEMENT_10 = { MIN: 495, MAX: 14171 }
const ABATTEMENT_PENSIONS = { MIN: 442, MAX: 4321 }
const PFU_TAUX = 0.30
const PS_TAUX = 0.172 // 17.2%

// CEHR (Contribution Exceptionnelle sur les Hauts Revenus)
const CEHR = {
  SEUL: [
    { min: 0, max: 250000, taux: 0 },
    { min: 250000, max: 500000, taux: 3 },
    { min: 500000, max: Infinity, taux: 4 },
  ],
  COUPLE: [
    { min: 0, max: 500000, taux: 0 },
    { min: 500000, max: 1000000, taux: 3 },
    { min: 1000000, max: Infinity, taux: 4 },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION (Zod)
// ══════════════════════════════════════════════════════════════════════════════

const irInputSchema = z.object({
  // Situation familiale
  situationFamiliale: z.enum(['CELIBATAIRE', 'MARIE_PACSE', 'DIVORCE', 'VEUF']),
  enfantsCharge: z.number().int().min(0).default(0),
  enfantsGardeAlternee: z.number().int().min(0).default(0),
  parentIsole: z.boolean().default(false),
  invalidite: z.boolean().default(false),
  invaliditeConjoint: z.boolean().default(false),
  ancienCombattant: z.boolean().default(false),
  
  // Revenus d'activité - Déclarant 1
  salaires1: z.number().min(0).default(0),
  fraisReels1: z.number().min(0).default(0),
  optionFraisReels1: z.boolean().default(false),
  
  // Revenus d'activité - Déclarant 2
  salaires2: z.number().min(0).default(0),
  fraisReels2: z.number().min(0).default(0),
  optionFraisReels2: z.boolean().default(false),
  
  // Autres revenus
  pensions: z.number().min(0).default(0),
  revenusTNS: z.number().min(0).default(0),
  
  // Revenus du patrimoine
  fonciersBruts: z.number().min(0).default(0),
  chargesFoncieres: z.number().min(0).default(0),
  regimeFoncier: z.enum(['MICRO', 'REEL']).default('MICRO'),
  deficitFoncierAnterieur: z.number().min(0).default(0),
  
  // Revenus des capitaux mobiliers
  dividendes: z.number().min(0).default(0),
  interets: z.number().min(0).default(0),
  optionPFU: z.boolean().default(true),
  
  // Plus-values
  pvMobilieres: z.number().min(0).default(0),
  pvImmobilieres: z.number().min(0).default(0),
  
  // Charges déductibles
  pensionEnfant: z.number().min(0).default(0),
  pensionExConjoint: z.number().min(0).default(0),
  pensionAscendant: z.number().min(0).default(0),
  versementsPER: z.number().min(0).default(0),
  versementsPER2: z.number().min(0).default(0),
  csgDeductible: z.number().min(0).default(0),
  
  // Réductions d'impôt
  donsInteret: z.number().min(0).default(0),
  donsAide: z.number().min(0).default(0),
  emploiDomicile: z.number().min(0).default(0),
  fraisGarde: z.number().min(0).default(0),
  nbEnfantsGarde: z.number().int().min(0).default(0),
  reductionPinel: z.number().min(0).default(0),
  reductionDenormandie: z.number().min(0).default(0),
  investPME: z.number().min(0).default(0),
  investFIP: z.number().min(0).default(0),
  investFCPI: z.number().min(0).default(0),
})

type IRInput = z.infer<typeof irInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

function calculerNombreParts(input: IRInput): number {
  const { situationFamiliale, enfantsCharge, enfantsGardeAlternee, parentIsole, invalidite, invaliditeConjoint, ancienCombattant } = input
  
  let parts = situationFamiliale === 'CELIBATAIRE' || situationFamiliale === 'DIVORCE' ? 1 : 2
  
  // Veuf avec enfant(s) = 2 parts minimum
  if (situationFamiliale === 'VEUF' && enfantsCharge > 0) parts = 2
  
  // Enfants à charge
  if (enfantsCharge >= 1) parts += 0.5
  if (enfantsCharge >= 2) parts += 0.5
  if (enfantsCharge >= 3) parts += (enfantsCharge - 2)
  
  // Enfants en garde alternée
  if (enfantsGardeAlternee >= 1) parts += 0.25
  if (enfantsGardeAlternee >= 2) parts += 0.25
  if (enfantsGardeAlternee >= 3) parts += (enfantsGardeAlternee - 2) * 0.5
  
  // Parent isolé (case T)
  if (parentIsole && (enfantsCharge > 0 || enfantsGardeAlternee > 0)) parts += 0.5
  
  // Invalidité
  if (invalidite) parts += 0.5
  if (invaliditeConjoint) parts += 0.5
  
  // Ancien combattant >74 ans
  if (ancienCombattant) parts += 0.5
  
  return parts
}

function calculerIRBrut(quotient: number): { irParPart: number; detailTranches: any[] } {
  let irParPart = 0
  const detailTranches = []
  
  for (const tranche of BAREME_IR_2025) {
    if (quotient > tranche.min) {
      const base = Math.min(quotient, tranche.max) - tranche.min
      const impot = base * (tranche.taux / 100)
      irParPart += impot
      detailTranches.push({
        min: tranche.min,
        max: tranche.max === Infinity ? null : tranche.max,
        taux: tranche.taux,
        baseImposable: Math.round(base),
        impot: Math.round(impot),
      })
    }
  }
  
  return { irParPart, detailTranches }
}

function calculerCEHR(rfi: number, isCouple: boolean): number {
  const tranches = isCouple ? CEHR.COUPLE : CEHR.SEUL
  let cehr = 0
  
  for (const tranche of tranches) {
    if (rfi > tranche.min) {
      const base = Math.min(rfi, tranche.max) - tranche.min
      cehr += base * (tranche.taux / 100)
    }
  }
  
  return Math.round(cehr)
}

function simulerIR(input: IRInput) {
  const isCouple = input.situationFamiliale === 'MARIE_PACSE'
  const nombreParts = calculerNombreParts(input)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : REVENUS CATÉGORIELS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Salaires après abattement 10% ou frais réels
  let salairesNet1 = input.salaires1
  let abattement1 = 0
  if (!input.optionFraisReels1 && input.salaires1 > 0) {
    abattement1 = Math.min(Math.max(input.salaires1 * 0.1, ABATTEMENT_10.MIN), ABATTEMENT_10.MAX)
    salairesNet1 = input.salaires1 - abattement1
  } else if (input.optionFraisReels1) {
    salairesNet1 = Math.max(0, input.salaires1 - input.fraisReels1)
    abattement1 = input.fraisReels1
  }
  
  let salairesNet2 = 0
  let abattement2 = 0
  if (isCouple) {
    salairesNet2 = input.salaires2
    if (!input.optionFraisReels2 && input.salaires2 > 0) {
      abattement2 = Math.min(Math.max(input.salaires2 * 0.1, ABATTEMENT_10.MIN), ABATTEMENT_10.MAX)
      salairesNet2 = input.salaires2 - abattement2
    } else if (input.optionFraisReels2) {
      salairesNet2 = Math.max(0, input.salaires2 - input.fraisReels2)
      abattement2 = input.fraisReels2
    }
  }
  
  // Pensions avec abattement 10%
  let pensionsNet = input.pensions
  let abattementPensions = 0
  if (input.pensions > 0) {
    abattementPensions = Math.min(Math.max(input.pensions * 0.1, ABATTEMENT_PENSIONS.MIN), ABATTEMENT_PENSIONS.MAX)
    pensionsNet = input.pensions - abattementPensions
  }
  
  // Revenus fonciers
  let revenusFonciersNet = 0
  let abattementFoncier = 0
  if (input.regimeFoncier === 'MICRO') {
    abattementFoncier = input.fonciersBruts * 0.3
    revenusFonciersNet = input.fonciersBruts * 0.7
  } else {
    revenusFonciersNet = Math.max(-10700, input.fonciersBruts - input.chargesFoncieres) // Déficit foncier max imputable
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : REVENU BRUT GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════
  
  const revenuBrutGlobal = Math.max(0,
    salairesNet1 +
    salairesNet2 +
    pensionsNet +
    input.revenusTNS +
    revenusFonciersNet
  )
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : CHARGES DÉDUCTIBLES
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Pensions alimentaires plafonnées
  const pensionEnfantMax = 6674 * Math.max(1, input.enfantsCharge) // 6674€ par enfant majeur
  const pensionEnfantDeductible = Math.min(input.pensionEnfant, pensionEnfantMax)
  
  const totalCharges = 
    pensionEnfantDeductible +
    input.pensionExConjoint +
    input.pensionAscendant +
    input.versementsPER +
    (isCouple ? input.versementsPER2 : 0) +
    input.csgDeductible
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : REVENU NET IMPOSABLE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const revenuNetImposable = Math.max(0, revenuBrutGlobal - totalCharges)
  const quotientFamilial = revenuNetImposable / nombreParts
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 : CALCUL IR BRUT PAR TRANCHES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const { irParPart, detailTranches } = calculerIRBrut(quotientFamilial)
  const irBrut = Math.round(irParPart * nombreParts)
  
  // TMI
  let tmi = 0
  for (const tranche of BAREME_IR_2025) {
    if (quotientFamilial > tranche.min) tmi = tranche.taux
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 6 : PLAFONNEMENT DU QUOTIENT FAMILIAL (CGI art. 197 I-2°)
  // ═══════════════════════════════════════════════════════════════════════════
  // Règles 2025 (revenus 2024) :
  // - Plafond général : 1 759 € par demi-part supplémentaire
  // - Parent isolé (case T) : 1ère demi-part pour 1er enfant = 4 149 €
  // - Veuf avec enfant : la part supplémentaire (1→2) n'est PAS plafonnée
  // - Quart de part (garde alternée) : 879,50 € (= 1759/2)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Déterminer les parts de référence (sans avantages)
  let partsReference = isCouple ? 2 : 1
  
  // Cas spécial : Veuf avec enfant(s) - la part supplémentaire n'est pas plafonnée
  // Le veuf garde 2 parts comme s'il était marié (cette part n'est pas plafonnée)
  const veufAvecEnfant = input.situationFamiliale === 'VEUF' && input.enfantsCharge > 0
  if (veufAvecEnfant) {
    partsReference = 2 // La part supplémentaire du veuf n'entre pas dans le plafonnement
  }
  
  // Calcul de l'IR avec les parts de référence (sans les parts supplémentaires plafonnées)
  const quotientReference = revenuNetImposable / partsReference
  const { irParPart: irParPartRef } = calculerIRBrut(quotientReference)
  const irReference = Math.round(irParPartRef * partsReference)
  
  // Avantage procuré par les parts supplémentaires
  const avantageQF = irReference - irBrut
  
  // Calcul du plafond selon la composition du foyer
  // Nombre de demi-parts supplémentaires (au-delà des parts de référence)
  const partsSupplémentaires = nombreParts - partsReference
  
  // Décomposition des demi-parts pour appliquer les bons plafonds
  let plafondTotal = 0
  
  // 1. Parent isolé (case T) : la 1ère demi-part pour le 1er enfant bénéficie du plafond majoré
  if (input.parentIsole && (input.enfantsCharge > 0 || input.enfantsGardeAlternee > 0)) {
    // 1ère demi-part = plafond majoré 4 149 €
    plafondTotal += PLAFOND_QF_2025.PARENT_ISOLE
    // Les autres demi-parts = plafond général
    const autresDemiParts = Math.max(0, partsSupplémentaires * 2 - 1)
    plafondTotal += autresDemiParts * PLAFOND_QF_2025.GENERAL
  } else {
    // Cas général : toutes les demi-parts au plafond général
    // Attention aux quarts de part (garde alternée) : plafond = 879,50 €
    const demiPartsEntieres = Math.floor(partsSupplémentaires * 2)
    const aQuartDePart = (partsSupplémentaires * 2) % 1 !== 0
    
    plafondTotal = demiPartsEntieres * PLAFOND_QF_2025.GENERAL
    if (aQuartDePart) {
      plafondTotal += PLAFOND_QF_2025.GENERAL / 2 // 879,50 € par quart de part
    }
  }
  
  // Application du plafonnement
  const plafonnement = Math.max(0, avantageQF - plafondTotal)
  const irApresPlafonnement = irBrut + plafonnement
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 7 : DÉCOTE
  // ═══════════════════════════════════════════════════════════════════════════
  
  let decote = 0
  const decoteParams = isCouple ? DECOTE_2025.COUPLE : DECOTE_2025.SEUL
  if (irApresPlafonnement > 0 && irApresPlafonnement < decoteParams.seuil) {
    decote = Math.round(Math.max(0, decoteParams.plafond - irApresPlafonnement * 0.4525))
  }
  const irApresDecote = Math.max(0, irApresPlafonnement - decote)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 8 : RÉDUCTIONS D'IMPÔT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const reductionDonsAide = Math.min(input.donsAide, 1000) * 0.75
  const reductionDonsInteret = input.donsInteret * 0.66
  const reductionEmploiDomicile = Math.min(input.emploiDomicile * 0.5, 12000 + input.enfantsCharge * 1500)
  const reductionGarde = Math.min(input.fraisGarde, input.nbEnfantsGarde * 3500) * 0.5
  const reductionInvestLoc = input.reductionPinel + input.reductionDenormandie
  const reductionInvestPME = (input.investPME + input.investFIP + input.investFCPI) * 0.18
  
  const totalReductions = Math.round(
    reductionDonsAide +
    reductionDonsInteret +
    reductionEmploiDomicile +
    reductionGarde +
    reductionInvestLoc +
    reductionInvestPME
  )
  
  // IR après réductions (ne peut être négatif)
  const irNet = Math.max(0, irApresDecote - totalReductions)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 9 : CEHR (Contribution Exceptionnelle Hauts Revenus)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const cehr = calculerCEHR(revenuNetImposable, isCouple)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 10 : PFU OU BARÈME POUR REVENUS DU PATRIMOINE
  // ═══════════════════════════════════════════════════════════════════════════
  
  let pfuMontant = 0
  let irCapitaux = 0
  let psCapitaux = 0
  
  const revenus_capitaux = input.dividendes + input.interets + input.pvMobilieres
  
  if (input.optionPFU && revenus_capitaux > 0) {
    pfuMontant = Math.round(revenus_capitaux * PFU_TAUX)
  } else if (revenus_capitaux > 0) {
    // Option barème : dividendes avec abattement 40%
    const dividendesApresAbatt = input.dividendes * 0.6
    const baseCapitaux = dividendesApresAbatt + input.interets + input.pvMobilieres
    // Ajouté au revenu imposable pour calcul IR
    irCapitaux = Math.round(baseCapitaux * (tmi / 100))
    psCapitaux = Math.round(revenus_capitaux * PS_TAUX)
  }
  
  // PV immobilières (toujours taxées séparément)
  const pvImmoPFU = Math.round(input.pvImmobilieres * 0.19) // IR à 19%
  const pvImmoPS = Math.round(input.pvImmobilieres * PS_TAUX)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTHÈSE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const impotTotal = irNet + cehr + pfuMontant + irCapitaux + pvImmoPFU + psCapitaux + pvImmoPS
  const tauxMoyen = revenuNetImposable > 0 ? (irNet / revenuNetImposable) * 100 : 0
  const tauxGlobal = (revenuBrutGlobal + revenus_capitaux + input.pvImmobilieres) > 0 
    ? (impotTotal / (revenuBrutGlobal + revenus_capitaux + input.pvImmobilieres)) * 100 
    : 0
  
  // Économies réalisées
  const economieQF = Math.min(avantageQF, plafondTotal)
  const economieDecote = decote
  const economieReductions = Math.min(totalReductions, irApresDecote)
  const economieAbattements = abattement1 + abattement2 + abattementPensions + abattementFoncier
  
  // Alertes et conseils
  const alertes: string[] = []
  const conseils: string[] = []
  
  if (plafonnement > 0) {
    alertes.push(`⚠️ Plafonnement QF appliqué : ${plafonnement.toLocaleString('fr-FR')} €`)
  }
  
  if (cehr > 0) {
    alertes.push(`⚠️ CEHR applicable : ${cehr.toLocaleString('fr-FR')} €`)
  }
  
  if (!input.optionPFU && revenus_capitaux > 0 && tmi <= 11) {
    conseils.push(`💡 Avec votre TMI de ${tmi}%, l'option barème pourrait être plus avantageuse pour vos revenus de capitaux`)
  }
  
  if (input.optionPFU && revenus_capitaux > 0 && tmi >= 41) {
    conseils.push(`💡 Avec votre TMI de ${tmi}%, le PFU (30%) est plus avantageux - bon choix !`)
  }
  
  if (input.versementsPER === 0 && tmi >= 30) {
    conseils.push(`💰 Versements PER : économie de ${tmi}% sur chaque euro versé (TMI ${tmi}%)`)
  }
  
  if (input.regimeFoncier === 'MICRO' && input.fonciersBruts > 0 && input.chargesFoncieres > input.fonciersBruts * 0.3) {
    conseils.push(`🏠 Régime réel potentiellement plus avantageux (charges > 30% des loyers)`)
  }
  
  return {
    input: {
      situationFamiliale: input.situationFamiliale,
      nombreParts,
      isCouple,
    },
    revenus: {
      salaires1: { brut: input.salaires1, abattement: Math.round(abattement1), net: Math.round(salairesNet1) },
      salaires2: isCouple ? { brut: input.salaires2, abattement: Math.round(abattement2), net: Math.round(salairesNet2) } : null,
      pensions: { brut: input.pensions, abattement: Math.round(abattementPensions), net: Math.round(pensionsNet) },
      tns: input.revenusTNS,
      fonciers: { brut: input.fonciersBruts, abattement: Math.round(abattementFoncier), net: Math.round(revenusFonciersNet), regime: input.regimeFoncier },
      capitaux: { dividendes: input.dividendes, interets: input.interets, pv: input.pvMobilieres, optionPFU: input.optionPFU },
      pvImmobilieres: input.pvImmobilieres,
    },
    calcul: {
      revenuBrutGlobal: Math.round(revenuBrutGlobal),
      totalCharges: Math.round(totalCharges),
      revenuNetImposable: Math.round(revenuNetImposable),
      quotientFamilial: Math.round(quotientFamilial),
      nombreParts,
      detailTranches,
      irBrut,
      plafonnementQF: plafonnement,
      irApresPlafonnement,
      decote,
      irApresDecote,
      totalReductions,
      detailReductions: {
        donsAide: Math.round(reductionDonsAide),
        donsInteret: Math.round(reductionDonsInteret),
        emploiDomicile: Math.round(reductionEmploiDomicile),
        gardeEnfants: Math.round(reductionGarde),
        investissementsLocatifs: Math.round(reductionInvestLoc),
        investissementsPME: Math.round(reductionInvestPME),
      },
      irNet,
      cehr,
      pfuMontant,
      irCapitaux,
      psCapitaux,
      pvImmoPFU,
      pvImmoPS,
    },
    synthese: {
      tmi,
      tauxMoyen: Math.round(tauxMoyen * 100) / 100,
      tauxGlobal: Math.round(tauxGlobal * 100) / 100,
      irNet,
      cehr,
      prelevementsPatrimoine: pfuMontant + irCapitaux + psCapitaux + pvImmoPFU + pvImmoPS,
      impotTotal,
      revenuNetApresImpot: Math.round(revenuBrutGlobal + input.dividendes + input.interets + input.pvMobilieres + input.pvImmobilieres - impotTotal),
    },
    economies: {
      quotientFamilial: Math.round(economieQF),
      decote: economieDecote,
      reductions: Math.round(economieReductions),
      abattements: Math.round(economieAbattements),
      total: Math.round(economieQF + economieDecote + economieReductions),
    },
    alertes,
    conseils,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Auth check (optionnel pour un simulateur public)
    // const authResult = await requireAuth(request)
    // if ('error' in authResult) return authResult.error
    
    const body = await request.json()
    const parseResult = irInputSchema.safeParse(body)
    
    if (!parseResult.success) {
      return createErrorResponse('Données invalides: ' + parseResult.error.message, 400)
    }
    
    const result = simulerIR(parseResult.data)
    
    return createSuccessResponse(result)
  } catch (error: any) {
    console.error('Erreur simulation IR:', error)
    return createErrorResponse('Erreur lors de la simulation: ' + (error.message || 'Erreur inconnue'), 500)
  }
}
