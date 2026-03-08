 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API Route - Simulateur Plus-Values 2026
 * LF2026 : PV immo INCHANGÉ (22 ans IR / 30 ans PS, PS 17,2%)
 * LFSS 2026 : PV mobilières PS 18,6%, PFU 31,4%
 * 
 * POST /api/advisor/simulators/plus-values
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES FISCALES — Source : RULES (fiscal-rules.ts)
// ══════════════════════════════════════════════════════════════════════════════

const PFU = {
  TAUX_IR: RULES.ps.pfu_ir * 100,
  TAUX_PS: RULES.ps.pfu_per_2026 * 100,
  TAUX_GLOBAL: (RULES.ps.pfu_ir + RULES.ps.pfu_per_2026) * 100,
}

const PS = {
  TAUX_GLOBAL: RULES.ps.pfu_per_2026 * 100,
  CSG_DEDUCTIBLE: RULES.ps.csg_deductible * 100,
}

const BAREME_IR = RULES.ir.bareme.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

const ABATTEMENT_MOBILIER = {
  DROIT_COMMUN: [
    { dureeMin: 0, dureeMax: 2, taux: 0 },
    { dureeMin: 2, dureeMax: 8, taux: 50 },
    { dureeMin: 8, dureeMax: Infinity, taux: 65 },
  ],
  PME: [
    { dureeMin: 0, dureeMax: 1, taux: 0 },
    { dureeMin: 1, dureeMax: 4, taux: 50 },
    { dureeMin: 4, dureeMax: 8, taux: 65 },
    { dureeMin: 8, dureeMax: Infinity, taux: 85 },
  ],
}

const IMMO = {
  TAUX_IR: RULES.immobilier.plus_value.taux_ir * 100,
  TAUX_PS: RULES.immobilier.plus_value.taux_ps * 100,
}

const OBJETS = {
  OR: { TAUX_FORFAITAIRE: 11.5 },
  BIJOUX: { TAUX_FORFAITAIRE: 6.5 },
  PV_REELLES: { TAUX_IR: 19, TAUX_PS: RULES.ps.total * 100, ABATTEMENT_ANNUEL: 5 },
}

const CRYPTO = {
  TAUX_IR: RULES.ps.pfu_ir * 100,
  TAUX_PS: RULES.ps.pfu_per_2026 * 100,
  FRANCHISE: 305,
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

const pvInputSchema = z.object({
  type: z.enum(['mobiliere', 'immobiliere', 'or', 'bijoux_art', 'crypto']),
  
  // Commun
  pvBrute: z.number().min(0),
  dureeDetention: z.number().min(0).default(0),
  
  // Mobilières
  titresAvant2018: z.boolean().optional().default(false),
  typesTitres: z.enum(['droit_commun', 'pme']).optional().default('droit_commun'),
  revenuImposable: z.number().min(0).optional().default(0),
  nombreParts: z.number().min(1).optional().default(1),
  
  // Immobilières
  prixCession: z.number().min(0).optional(),
  prixAcquisition: z.number().min(0).optional(),
  fraisAcquisitionReels: z.number().min(0).optional().default(0),
  fraisAcquisitionForfait: z.boolean().optional().default(false),
  travauxReels: z.number().min(0).optional().default(0),
  travauxForfait: z.boolean().optional().default(false),
  
  // Objets précieux
  prixAcquisitionObjet: z.number().min(0).optional(),
})

type PVInput = z.infer<typeof pvInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

function getAbattementMobilier(duree: number, type: 'droit_commun' | 'pme'): number {
  const grille = type === 'pme' ? ABATTEMENT_MOBILIER.PME : ABATTEMENT_MOBILIER.DROIT_COMMUN
  for (const t of grille) {
    if (duree >= t.dureeMin && duree < t.dureeMax) return t.taux
  }
  return grille[grille.length - 1].taux
}

function getAbattementImmoIR(annees: number): number {
  // Exonération IR à 22 ans (INCHANGÉ — amendement Le Fur NON RETENU)
  // 6% par an de l'année 6 à 21, 4% la 22e année
  if (annees <= 5) return 0
  if (annees <= 21) return (annees - 5) * 6  // 6% × (annees - 5)
  if (annees >= 22) return 100               // Exonération totale
  return 100
}

function getAbattementImmoPS(annees: number): number {
  if (annees <= 5) return 0
  if (annees <= 21) return (annees - 5) * 1.65
  if (annees === 22) return 26.4 + 1.6
  if (annees <= 30) return 28 + (annees - 22) * 9
  return 100
}

function calculerSurtaxeImmo(pvImposable: number): number {
  if (pvImposable <= 50000) return 0
  
  let taux = 0
  if (pvImposable <= 100000) taux = 2
  else if (pvImposable <= 150000) taux = 3
  else if (pvImposable <= 200000) taux = 4
  else if (pvImposable <= 250000) taux = 5
  else taux = 6
  
  const decotes: { [key: number]: number } = {
    2: 1200, 3: 3300, 4: 6400, 5: 10500, 6: 15600,
  }
  
  return Math.max(0, Math.round(pvImposable * taux / 100 - (decotes[taux] || 0)))
}

function calculerIRBareme(revenu: number, parts: number): number {
  const quotient = revenu / parts
  let ir = 0
  for (const t of BAREME_IR) {
    if (quotient > t.min) {
      const base = Math.min(quotient, t.max) - t.min
      ir += base * t.taux / 100
    }
  }
  return Math.round(ir * parts)
}

function getTMI(revenu: number, parts: number): number {
  const quotient = revenu / parts
  for (let i = BAREME_IR.length - 1; i >= 0; i--) {
    if (quotient > BAREME_IR[i].min) return BAREME_IR[i].taux
  }
  return 0
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMULATIONS PAR TYPE
// ══════════════════════════════════════════════════════════════════════════════

function simulerPVMobiliere(input: PVInput) {
  const { pvBrute, dureeDetention, titresAvant2018, typesTitres, revenuImposable, nombreParts } = input
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL PFU (régime par défaut)
  // ═══════════════════════════════════════════════════════════════════════════
  const pfuIR = pvBrute * PFU.TAUX_IR / 100
  const pfuPS = pvBrute * PFU.TAUX_PS / 100
  const pfuTotal = pfuIR + pfuPS
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL BARÈME (option - uniquement si titres avant 2018)
  // ═══════════════════════════════════════════════════════════════════════════
  let baremeResult = null
  
  if (titresAvant2018) {
    const abattement = getAbattementMobilier(dureeDetention, typesTitres || 'droit_commun')
    const pvNette = pvBrute * (1 - abattement / 100)
    
    // IR sur PV avec revenus existants (calcul différentiel)
    const irAvec = calculerIRBareme(revenuImposable + pvNette, nombreParts)
    const irSans = calculerIRBareme(revenuImposable, nombreParts)
    const irPV = irAvec - irSans
    
    // PS toujours sur brut
    const baremePS = pvBrute * PS.TAUX_GLOBAL / 100
    const csgDeductible = pvBrute * PS.CSG_DEDUCTIBLE / 100
    
    const tmi = getTMI(revenuImposable + pvNette, nombreParts)
    
    baremeResult = {
      abattement,
      pvNette: Math.round(pvNette),
      irPV: Math.round(irPV),
      ps: Math.round(baremePS),
      csgDeductible: Math.round(csgDeductible),
      total: Math.round(irPV + baremePS),
      tmi,
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARAISON ET RECOMMANDATION
  // ═══════════════════════════════════════════════════════════════════════════
  const meilleurChoix = baremeResult && baremeResult.total < pfuTotal ? 'BAREME' : 'PFU'
  const economie = baremeResult ? Math.abs(pfuTotal - baremeResult.total) : 0
  const impotOptimal = meilleurChoix === 'PFU' ? pfuTotal : (baremeResult?.total || pfuTotal)
  
  return {
    type: 'mobiliere',
    pvBrute,
    dureeDetention,
    
    pfu: {
      ir: Math.round(pfuIR),
      ps: Math.round(pfuPS),
      total: Math.round(pfuTotal),
      tauxEffectif: 30,
    },
    
    bareme: baremeResult,
    titresAvant2018,
    
    comparaison: {
      meilleurChoix,
      economie: Math.round(economie),
      impotOptimal: Math.round(impotOptimal),
    },
    
    synthese: {
      impotDu: Math.round(impotOptimal),
      netApresImpot: Math.round(pvBrute - impotOptimal),
      tauxEffectif: Math.round((impotOptimal / pvBrute) * 10000) / 100,
    },
  }
}

function simulerPVImmobiliere(input: PVInput) {
  const { 
    pvBrute, 
    prixCession = 0, 
    prixAcquisition = 0, 
    dureeDetention,
    fraisAcquisitionReels,
    fraisAcquisitionForfait,
    travauxReels,
    travauxForfait,
  } = input
  
  // Calcul de la PV brute si non fournie
  const pvCalculee = pvBrute > 0 ? pvBrute : (prixCession - prixAcquisition)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FRAIS DÉDUCTIBLES
  // ═══════════════════════════════════════════════════════════════════════════
  let fraisAcquisition = fraisAcquisitionReels || 0
  if (fraisAcquisitionForfait && prixAcquisition > 0) {
    fraisAcquisition = Math.max(fraisAcquisition, prixAcquisition * 0.075)
  }
  
  let travaux = travauxReels || 0
  if (travauxForfait && dureeDetention > 5 && prixAcquisition > 0) {
    travaux = Math.max(travaux, prixAcquisition * 0.15)
  }
  
  const fraisTotal = fraisAcquisition + travaux
  const pvNette = Math.max(0, pvCalculee - fraisTotal)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ABATTEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const abattementIR = getAbattementImmoIR(Math.floor(dureeDetention))
  const abattementPS = getAbattementImmoPS(Math.floor(dureeDetention))
  
  const pvImposableIR = pvNette * (1 - abattementIR / 100)
  const pvImposablePS = pvNette * (1 - abattementPS / 100)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPÔTS
  // ═══════════════════════════════════════════════════════════════════════════
  const impotIR = pvImposableIR * IMMO.TAUX_IR / 100
  const impotPS = pvImposablePS * IMMO.TAUX_PS / 100
  const surtaxe = calculerSurtaxeImmo(pvImposableIR)
  
  const impotTotal = impotIR + impotPS + surtaxe
  
  // Timeline exonérations
  const exonereIR = abattementIR >= 100
  const exonerePS = abattementPS >= 100
  const anneesRestantesIR = exonereIR ? 0 : Math.max(0, 22 - Math.floor(dureeDetention))
  const anneesRestantesPS = exonerePS ? 0 : Math.max(0, 30 - dureeDetention)
  
  return {
    type: 'immobiliere',
    
    acquisition: {
      prixAcquisition,
      fraisAcquisition: Math.round(fraisAcquisition),
      travaux: Math.round(travaux),
      fraisTotal: Math.round(fraisTotal),
    },
    
    cession: {
      prixCession,
      pvBrute: Math.round(pvCalculee),
      pvNette: Math.round(pvNette),
    },
    
    abattements: {
      dureeDetention,
      ir: { taux: abattementIR, pvImposable: Math.round(pvImposableIR) },
      ps: { taux: abattementPS, pvImposable: Math.round(pvImposablePS) },
    },
    
    impots: {
      ir: Math.round(impotIR),
      ps: Math.round(impotPS),
      surtaxe,
      total: Math.round(impotTotal),
    },
    
    exonerations: {
      exonereIR,
      exonerePS,
      anneesRestantesIR,
      anneesRestantesPS,
    },
    
    synthese: {
      impotDu: Math.round(impotTotal),
      netApresImpot: Math.round(pvNette - impotTotal),
      tauxEffectif: pvNette > 0 ? Math.round((impotTotal / pvNette) * 10000) / 100 : 0,
    },
  }
}

function simulerPVObjetsPrecieux(input: PVInput, type: 'or' | 'bijoux_art') {
  const { pvBrute, prixAcquisitionObjet, dureeDetention } = input
  
  // Prix de cession = PV brute + prix acquisition (approximation si PV fournie)
  const prixCession = prixAcquisitionObjet ? pvBrute + prixAcquisitionObjet : pvBrute
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TAXE FORFAITAIRE (sur prix de cession)
  // ═══════════════════════════════════════════════════════════════════════════
  const tauxForfaitaire = type === 'or' ? OBJETS.OR.TAUX_FORFAITAIRE : OBJETS.BIJOUX.TAUX_FORFAITAIRE
  const taxeForfaitaire = prixCession * tauxForfaitaire / 100
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RÉGIME PV RÉELLES (si prix acquisition connu)
  // ═══════════════════════════════════════════════════════════════════════════
  let regimePV = null
  
  if (prixAcquisitionObjet && prixAcquisitionObjet > 0 && pvBrute > 0) {
    // Abattement : 5% par an au-delà de 2 ans
    const anneesAbattement = Math.max(0, dureeDetention - 2)
    const abattement = Math.min(100, anneesAbattement * OBJETS.PV_REELLES.ABATTEMENT_ANNUEL)
    
    const pvImposable = pvBrute * (1 - abattement / 100)
    const ir = pvImposable * OBJETS.PV_REELLES.TAUX_IR / 100
    const ps = pvImposable * OBJETS.PV_REELLES.TAUX_PS / 100
    
    regimePV = {
      pvBrute,
      abattement,
      pvImposable: Math.round(pvImposable),
      ir: Math.round(ir),
      ps: Math.round(ps),
      total: Math.round(ir + ps),
      exonere: abattement >= 100,
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARAISON
  // ═══════════════════════════════════════════════════════════════════════════
  const meilleurRegime = regimePV && regimePV.total < taxeForfaitaire ? 'PV_REELLES' : 'FORFAITAIRE'
  const impotOptimal = meilleurRegime === 'FORFAITAIRE' ? taxeForfaitaire : (regimePV?.total || taxeForfaitaire)
  const economie = regimePV ? Math.abs(taxeForfaitaire - regimePV.total) : 0
  
  return {
    type: type === 'or' ? 'or' : 'bijoux_art',
    typeLabel: type === 'or' ? 'Or et métaux précieux' : 'Bijoux et objets d\'art',
    prixCession: Math.round(prixCession),
    pvBrute,
    dureeDetention,
    
    forfaitaire: {
      base: Math.round(prixCession),
      taux: tauxForfaitaire,
      montant: Math.round(taxeForfaitaire),
      info: type === 'or' ? 'TMP 11% + CRDS 0.5%' : 'TFOA 6% + CRDS 0.5%',
    },
    
    pvReelles: regimePV,
    
    comparaison: {
      meilleurRegime,
      economie: Math.round(economie),
    },
    
    synthese: {
      impotDu: Math.round(impotOptimal),
      netApresImpot: Math.round(pvBrute - impotOptimal),
      tauxEffectif: pvBrute > 0 ? Math.round((impotOptimal / pvBrute) * 10000) / 100 : 0,
    },
  }
}

function simulerPVCrypto(input: PVInput) {
  const { pvBrute } = input
  
  // Franchise annuelle
  const franchise = CRYPTO.FRANCHISE
  const pvImposable = Math.max(0, pvBrute - franchise)
  
  const ir = pvImposable * CRYPTO.TAUX_IR / 100
  const ps = pvImposable * CRYPTO.TAUX_PS / 100
  const total = ir + ps
  
  return {
    type: 'crypto',
    pvBrute,
    
    calcul: {
      franchise,
      pvImposable: Math.round(pvImposable),
      ir: Math.round(ir),
      ps: Math.round(ps),
      total: Math.round(total),
    },
    
    regime: {
      nom: 'PFU (Flat Tax)',
      tauxIR: CRYPTO.TAUX_IR,
      tauxPS: CRYPTO.TAUX_PS,
      tauxGlobal: 30,
    },
    
    synthese: {
      impotDu: Math.round(total),
      netApresImpot: Math.round(pvBrute - total),
      tauxEffectif: pvBrute > 0 ? Math.round((total / pvBrute) * 10000) / 100 : 0,
    },
    
    alertes: [
      pvBrute <= franchise ? '✅ Plus-value inférieure à la franchise de 305 € : pas d\'impôt' : null,
      '💡 Les échanges crypto/crypto ne sont pas imposables',
      '⚠️ Conservez vos justificatifs de transactions',
    ].filter(Boolean),
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════

function simulerPV(input: PVInput) {
  switch (input.type) {
    case 'mobiliere':
      return simulerPVMobiliere(input)
    case 'immobiliere':
      return simulerPVImmobiliere(input)
    case 'or':
      return simulerPVObjetsPrecieux(input, 'or')
    case 'bijoux_art':
      return simulerPVObjetsPrecieux(input, 'bijoux_art')
    case 'crypto':
      return simulerPVCrypto(input)
    default:
      throw new Error('Type de plus-value non reconnu')
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE API
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parseResult = pvInputSchema.safeParse(body)

    if (!parseResult.success) {
      return createErrorResponse('Données invalides: ' + parseResult.error.message, 400)
    }

    const result = simulerPV(parseResult.data)

    return createSuccessResponse(result)
  } catch (error: any) {
    logger.error('Erreur simulation PV:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation: ' + (error.message || 'Erreur inconnue'), 500)
  }
}
