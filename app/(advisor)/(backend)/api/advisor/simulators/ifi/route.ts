 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API Route - Simulateur IFI 2026
 * Calculs sécurisés côté serveur - CGI art. 964-983 (barème inchangé)
 * 
 * POST /api/advisor/simulators/ifi
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES FISCALES IFI 2025
// ══════════════════════════════════════════════════════════════════════════════

const SEUIL_IFI = 1300000

const BAREME_IFI_2025 = [
  { min: 0, max: 800000, taux: 0 },
  { min: 800000, max: 1300000, taux: 0.50 },
  { min: 1300000, max: 2570000, taux: 0.70 },
  { min: 2570000, max: 5000000, taux: 1.00 },
  { min: 5000000, max: 10000000, taux: 1.25 },
  { min: 10000000, max: Infinity, taux: 1.50 },
]

const DECOTE = {
  SEUIL_MIN: 1300000,
  SEUIL_MAX: 1400000,
  COEFFICIENT: 0.0125,
  MONTANT_FIXE: 17500,
}

const ABATTEMENTS = {
  RESIDENCE_PRINCIPALE: 0.30,
  BOIS_FORETS_SEUIL: 101897,
  BOIS_FORETS_TAUX_1: 0.75,
  BOIS_FORETS_TAUX_2: 0.50,
}

const REDUCTION_DONS = {
  TAUX: 0.75,
  PLAFOND: 50000,
}

const PLAFONNEMENT_DETTES = {
  SEUIL_PATRIMOINE: 5000000,
  SEUIL_RATIO: 0.60,
  TAUX_REDUCTION: 0.50,
}

const PLAFONNEMENT_IR_IFI = {
  TAUX: 0.75,
}

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

const ifiInputSchema = z.object({
  // Patrimoine immobilier brut
  residencePrincipale: z.number().min(0).default(0),
  residencesSecondaires: z.number().min(0).default(0),
  immeublesLocatifs: z.number().min(0).default(0),
  scpiOpci: z.number().min(0).default(0),
  sciParts: z.number().min(0).default(0),
  autresImmeubles: z.number().min(0).default(0),
  
  // Exonérations
  biensProfessionnels: z.number().min(0).default(0),
  boisForets: z.number().min(0).default(0),
  biensRurauxLoues: z.number().min(0).default(0),
  
  // Passif déductible
  empruntsImmobiliers: z.number().min(0).default(0),
  dettesTravaux: z.number().min(0).default(0),
  ifiEstime: z.number().min(0).default(0),
  autresDettes: z.number().min(0).default(0),
  
  // Réductions
  donsIFI: z.number().min(0).default(0),
  
  // Plafonnement
  revenusFoyer: z.number().min(0).default(0),
  irFoyer: z.number().min(0).default(0),
})

type IFIInput = z.infer<typeof ifiInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

function calculerExonerationBoisForets(valeur: number): number {
  if (valeur <= 0) return 0
  if (valeur <= ABATTEMENTS.BOIS_FORETS_SEUIL) {
    return valeur * ABATTEMENTS.BOIS_FORETS_TAUX_1
  }
  return ABATTEMENTS.BOIS_FORETS_SEUIL * ABATTEMENTS.BOIS_FORETS_TAUX_1 +
         (valeur - ABATTEMENTS.BOIS_FORETS_SEUIL) * ABATTEMENTS.BOIS_FORETS_TAUX_2
}

function calculerPlafondDettes(patrimoineBrut: number, dettes: number): {
  dettesDeductibles: number
  plafonnement: number
} {
  if (patrimoineBrut <= PLAFONNEMENT_DETTES.SEUIL_PATRIMOINE) {
    return { dettesDeductibles: dettes, plafonnement: 0 }
  }

  const seuilDettes = patrimoineBrut * PLAFONNEMENT_DETTES.SEUIL_RATIO
  
  if (dettes <= seuilDettes) {
    return { dettesDeductibles: dettes, plafonnement: 0 }
  }

  const dettesPlafonnees = seuilDettes + (dettes - seuilDettes) * PLAFONNEMENT_DETTES.TAUX_REDUCTION
  return {
    dettesDeductibles: Math.round(dettesPlafonnees),
    plafonnement: Math.round(dettes - dettesPlafonnees),
  }
}

function calculerIFIBrut(patrimoineNet: number): {
  ifiBrut: number
  detailTranches: Array<{ tranche: string; base: number; taux: number; impot: number }>
  tmi: number
} {
  if (patrimoineNet < SEUIL_IFI) {
    return { ifiBrut: 0, detailTranches: [], tmi: 0 }
  }

  let ifiBrut = 0
  let tmi = 0
  const detailTranches: Array<{ tranche: string; base: number; taux: number; impot: number }> = []

  for (const tranche of BAREME_IFI_2025) {
    if (patrimoineNet > tranche.min) {
      const base = Math.min(patrimoineNet, tranche.max) - tranche.min
      const impotTranche = base * (tranche.taux / 100)
      ifiBrut += impotTranche

      if (tranche.taux > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} € - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          base: Math.round(base),
          taux: tranche.taux,
          impot: Math.round(impotTranche),
        })
        tmi = tranche.taux
      }
    }
  }

  return { ifiBrut: Math.round(ifiBrut), detailTranches, tmi }
}

function calculerDecote(patrimoineNet: number): number {
  if (patrimoineNet < DECOTE.SEUIL_MIN || patrimoineNet >= DECOTE.SEUIL_MAX) {
    return 0
  }
  return Math.max(0, Math.round(DECOTE.MONTANT_FIXE - patrimoineNet * DECOTE.COEFFICIENT))
}

function calculerReductionDons(dons: number): number {
  return Math.min(Math.round(dons * REDUCTION_DONS.TAUX), REDUCTION_DONS.PLAFOND)
}

function calculerPlafonnementIRIFI(ir: number, ifi: number, revenus: number): {
  plafonnement: number
  ifiDu: number
  applicable: boolean
} {
  if (revenus <= 0) {
    return { plafonnement: 0, ifiDu: ifi, applicable: false }
  }

  const plafond = revenus * PLAFONNEMENT_IR_IFI.TAUX
  const total = ir + ifi

  if (total <= plafond) {
    return { plafonnement: 0, ifiDu: ifi, applicable: false }
  }

  const depassement = total - plafond
  const ifiReduit = Math.max(0, ifi - depassement)

  return {
    plafonnement: Math.round(depassement),
    ifiDu: Math.round(ifiReduit),
    applicable: true,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE DE SIMULATION
// ══════════════════════════════════════════════════════════════════════════════

function simulerIFI(input: IFIInput) {
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PATRIMOINE BRUT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const patrimoineBrut = 
    input.residencePrincipale +
    input.residencesSecondaires +
    input.immeublesLocatifs +
    input.scpiOpci +
    input.sciParts +
    input.autresImmeubles

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : ABATTEMENTS ET EXONÉRATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Abattement résidence principale (30%)
  const abattementRP = Math.round(input.residencePrincipale * ABATTEMENTS.RESIDENCE_PRINCIPALE)
  
  // Exonérations
  const exonerationBiensPro = input.biensProfessionnels // 100%
  const exonerationBoisForets = Math.round(calculerExonerationBoisForets(input.boisForets))
  const exonerationBiensRuraux = Math.round(calculerExonerationBoisForets(input.biensRurauxLoues)) // Même règle
  
  const totalExonerations = exonerationBiensPro + exonerationBoisForets + exonerationBiensRuraux

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : PASSIF DÉDUCTIBLE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const totalDettes = 
    input.empruntsImmobiliers +
    input.dettesTravaux +
    input.ifiEstime +
    input.autresDettes

  const { dettesDeductibles, plafonnement: plafonnementDettes } = calculerPlafondDettes(patrimoineBrut, totalDettes)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : PATRIMOINE NET TAXABLE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const patrimoineNetTaxable = Math.max(0, patrimoineBrut - abattementRP - totalExonerations - dettesDeductibles)
  const assujetti = patrimoineNetTaxable >= SEUIL_IFI

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 : CALCUL IFI BRUT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const { ifiBrut, detailTranches, tmi } = calculerIFIBrut(patrimoineNetTaxable)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 6 : DÉCOTE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const decote = calculerDecote(patrimoineNetTaxable)
  const ifiApresDecote = Math.max(0, ifiBrut - decote)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 7 : RÉDUCTION DONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const reductionDons = calculerReductionDons(input.donsIFI)
  const ifiApresReductions = Math.max(0, ifiApresDecote - reductionDons)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 8 : PLAFONNEMENT IR + IFI
  // ═══════════════════════════════════════════════════════════════════════════
  
  const plafonnement = calculerPlafonnementIRIFI(input.irFoyer, ifiApresReductions, input.revenusFoyer)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 9 : IFI NET À PAYER
  // ═══════════════════════════════════════════════════════════════════════════
  
  const ifiNet = plafonnement.ifiDu

  // Taux effectif
  const tauxEffectif = patrimoineNetTaxable > 0 ? (ifiNet / patrimoineNetTaxable) * 100 : 0

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTES ET CONSEILS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const alertes: string[] = []
  const conseils: string[] = []

  if (!assujetti) {
    alertes.push(`✅ Non assujetti à l'IFI (patrimoine < ${SEUIL_IFI.toLocaleString('fr-FR')} €)`)
  } else {
    if (decote > 0) {
      alertes.push(`💡 Décote appliquée : −${decote.toLocaleString('fr-FR')} €`)
    }
    if (plafonnementDettes > 0) {
      alertes.push(`⚠️ Plafonnement dettes : ${plafonnementDettes.toLocaleString('fr-FR')} € non déductibles`)
    }
    if (plafonnement.applicable) {
      alertes.push(`✅ Plafonnement IR+IFI appliqué : économie de ${plafonnement.plafonnement.toLocaleString('fr-FR')} €`)
    }
  }

  if (assujetti && input.donsIFI === 0) {
    conseils.push(`💡 Les dons IFI offrent une réduction de 75% (vs 66% en IR). Max : ${REDUCTION_DONS.PLAFOND.toLocaleString('fr-FR')} € de réduction.`)
  }

  if (input.residencePrincipale > 0 && input.residencePrincipale > patrimoineBrut * 0.5) {
    conseils.push(`🏠 La résidence principale représente plus de 50% de votre patrimoine. L'abattement de 30% est significatif.`)
  }

  if (assujetti && input.biensProfessionnels === 0) {
    conseils.push(`💼 Vérifiez si certains biens peuvent être qualifiés de professionnels (exonération totale).`)
  }

  if (assujetti) {
    conseils.push(`🌳 L'investissement forestier (GFF) offre une exonération de 75% puis 50%.`)
    conseils.push(`📋 Le démembrement de propriété permet de sortir des biens de l'IFI (donation de la nue-propriété).`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RÉSULTAT
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // Statut
    assujetti,
    seuilIFI: SEUIL_IFI,
    
    // Patrimoine
    patrimoine: {
      brut: patrimoineBrut,
      abattementRP,
      exonerations: {
        biensProfessionnels: exonerationBiensPro,
        boisForets: exonerationBoisForets,
        biensRuraux: exonerationBiensRuraux,
        total: totalExonerations,
      },
      dettes: {
        total: totalDettes,
        deductibles: dettesDeductibles,
        plafonnement: plafonnementDettes,
      },
      netTaxable: patrimoineNetTaxable,
    },
    
    // Calcul IFI
    calcul: {
      ifiBrut,
      decote,
      ifiApresDecote,
      reductionDons,
      ifiApresReductions,
      detailTranches,
      tmi,
    },
    
    // Plafonnement
    plafonnement: {
      revenusFoyer: input.revenusFoyer,
      irFoyer: input.irFoyer,
      plafond75: Math.round(input.revenusFoyer * PLAFONNEMENT_IR_IFI.TAUX),
      totalIRIFI: input.irFoyer + ifiApresReductions,
      reduction: plafonnement.plafonnement,
      applicable: plafonnement.applicable,
    },
    
    // Synthèse
    synthese: {
      ifiNet,
      tauxEffectif: Math.round(tauxEffectif * 100) / 100,
    },
    
    // Alertes et conseils
    alertes,
    conseils,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTE API
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parseResult = ifiInputSchema.safeParse(body)

    if (!parseResult.success) {
      return createErrorResponse('Données invalides: ' + parseResult.error.message, 400)
    }

    const result = simulerIFI(parseResult.data)

    return createSuccessResponse(result)
  } catch (error: any) {
    logger.error('Erreur simulation IFI:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation: ' + (error.message || 'Erreur inconnue'), 500)
  }
}
