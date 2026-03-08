/**
 * Simulateur Assurance-Vie - Fiscalité Rachat
 * Compare PFU/PFL et Barème IR selon ancienneté du contrat
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// Constantes fiscales — Source : RULES
const BAREME_IR = RULES.ir.bareme
const PRELEVEMENTS_SOCIAUX = RULES.ps.total
const ABATTEMENT_SEUL = RULES.assurance_vie.rachat.abattement_celibataire_8ans
const ABATTEMENT_COUPLE = RULES.assurance_vie.rachat.abattement_couple_8ans

const rachatInputSchema = z.object({
  valeur_contrat: z.number().min(0).default(50000),
  versements: z.number().min(0).default(40000),
  montant_rachat: z.number().min(0).default(15000),
  anciennete: z.enum(['moins4', '4a8', 'plus8']).default('plus8'),
  // Pour gérer les cas mixtes : proportion des versements avant/après 2017
  versements_avant_2017: z.boolean().default(true), // true = 100% avant, false = 100% après
  pct_versements_avant_2017: z.number().min(0).max(100).optional(), // Pour cas mixte : % des versements avant 2017
  mode_tmi: z.enum(['automatique', 'manuel']).default('automatique'),
  revenu_net_imposable: z.number().min(0).optional(),
  statut: z.enum(['celibataire', 'couple']).default('celibataire'),
  enfants: z.number().min(0).default(0),
  foyer: z.number().min(1).default(1),
  tmi: z.number().min(0).max(45).optional(),
  // Pour contrats > 8 ans avec versements post-2017 uniquement
  primes_post_2017_sous_150: z.number().min(0).optional(),
  primes_post_2017_sur_150: z.number().min(0).optional(),
})

function calculerTMI(revenu: number, nbParts: number): number {
  const quotient = revenu / nbParts
  for (const tranche of BAREME_IR) {
    if (quotient <= tranche.max) {
      return tranche.taux * 100
    }
  }
  return 45
}

function calculerNbParts(statut: string, enfants: number): number {
  const base = statut === 'couple' ? 2 : 1
  const partsEnfants = enfants <= 2 ? enfants * 0.5 : 1 + (enfants - 2)
  return base + partsEnfants
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!context.user) {
      return createErrorResponse('Accès non autorisé', 403)
    }

    const body = await request.json()
    const input = rachatInputSchema.parse(body)

    // Calcul des plus-values
    const plusValueTotale = Math.max(0, input.valeur_contrat - input.versements)
    const ratioRachat = input.valeur_contrat > 0 ? input.montant_rachat / input.valeur_contrat : 0
    const partInterets = plusValueTotale * ratioRachat

    // Abattement selon statut
    const abattementMax = input.statut === 'couple' ? ABATTEMENT_COUPLE : ABATTEMENT_SEUL
    const abattement = input.anciennete === 'plus8' ? Math.min(partInterets, abattementMax) : 0
    const baseTaxable = Math.max(0, partInterets - abattement)

    // TMI
    let tmiCalculee = 0
    if (input.mode_tmi === 'manuel') {
      tmiCalculee = input.tmi || 30
    } else {
      const nbParts = calculerNbParts(input.statut, input.enfants)
      tmiCalculee = calculerTMI(input.revenu_net_imposable || 0, nbParts)
    }

    // Prélèvements sociaux (sur la totalité des gains)
    const pso = partInterets * PRELEVEMENTS_SOCIAUX

    // Calcul du ratio avant/après 2017 (pour cas mixtes)
    const pctAvant2017 = input.pct_versements_avant_2017 !== undefined 
      ? input.pct_versements_avant_2017 / 100 
      : (input.versements_avant_2017 ? 1 : 0)
    const pctApres2017 = 1 - pctAvant2017

    // Taux PFU selon ancienneté et date des versements
    let tauxPFU = 0.128 // 12.8% par défaut (flat tax)
    let pfuBreakdown = null
    let impotPFUAvant2017 = 0
    let impotPFUApres2017 = 0
    const gainsAvant2017 = baseTaxable * pctAvant2017
    const gainsApres2017 = baseTaxable * pctApres2017

    if (input.anciennete === 'plus8') {
      // Gains sur versements avant 27/09/2017 : taux 7.5% après abattement
      impotPFUAvant2017 = gainsAvant2017 * 0.075
      
      // Gains sur versements après 27/09/2017 : découpage 150k€
      if (pctApres2017 > 0) {
        const sous150 = input.primes_post_2017_sous_150 || 0
        const sur150 = input.primes_post_2017_sur_150 || 0
        const totalPrimesPost2017 = sous150 + sur150
        
        if (totalPrimesPost2017 > 0) {
          // Répartition des gains post-2017 selon le ratio ≤150k / >150k
          const ratioSous150 = sous150 / totalPrimesPost2017
          const ratioSur150 = sur150 / totalPrimesPost2017
          const base75 = gainsApres2017 * ratioSous150
          const base128 = gainsApres2017 * ratioSur150
          impotPFUApres2017 = (base75 * 0.075) + (base128 * 0.128)
          
          pfuBreakdown = {
            gains_avant_2017: Math.round(gainsAvant2017 * 100) / 100,
            impot_avant_2017: Math.round(impotPFUAvant2017 * 100) / 100,
            base_75: Math.round(base75 * 100) / 100,
            base_128: Math.round(base128 * 100) / 100,
            impot_75: Math.round(base75 * 0.075 * 100) / 100,
            impot_128: Math.round(base128 * 0.128 * 100) / 100,
          }
        } else {
          // Pas de détail des primes post-2017 : on applique 7.5% par défaut (< 150k présumé)
          impotPFUApres2017 = gainsApres2017 * 0.075
        }
      }
      
      tauxPFU = baseTaxable > 0 ? (impotPFUAvant2017 + impotPFUApres2017) / baseTaxable : 0.075
      
    } else if (input.anciennete === '4a8') {
      // 4-8 ans : 15% avant 2017, 12.8% après
      impotPFUAvant2017 = gainsAvant2017 * 0.15
      impotPFUApres2017 = gainsApres2017 * 0.128
      tauxPFU = baseTaxable > 0 ? (impotPFUAvant2017 + impotPFUApres2017) / baseTaxable : 0.128
    } else {
      // < 4 ans : 35% avant 2017, 12.8% après
      impotPFUAvant2017 = gainsAvant2017 * 0.35
      impotPFUApres2017 = gainsApres2017 * 0.128
      tauxPFU = baseTaxable > 0 ? (impotPFUAvant2017 + impotPFUApres2017) / baseTaxable : 0.128
    }

    // Calcul impôt PFU total
    const impotPFU = impotPFUAvant2017 + impotPFUApres2017

    // Calcul impôt IR
    const impotIR = baseTaxable * (tmiCalculee / 100)

    // Nets
    const netPFU = input.montant_rachat - pso - impotPFU
    const netIR = input.montant_rachat - pso - impotIR

    // Économies
    const economiePFU = Math.max(0, netPFU - netIR)
    const economieIR = Math.max(0, netIR - netPFU)

    // Rachat max exonéré (pour atteindre l'abattement)
    const rachatMaxExonere = input.valeur_contrat > 0 && plusValueTotale > 0
      ? (abattementMax / plusValueTotale) * input.valeur_contrat
      : 0

    // Message de recommandation
    let message = ''
    if (netPFU > netIR) {
      message = `Le PFU est plus avantageux (+${Math.round(economiePFU)} €). Optez pour le prélèvement forfaitaire.`
    } else if (netIR > netPFU) {
      message = `Le barème IR est plus avantageux (+${Math.round(economieIR)} €). Optez pour l'imposition au barème progressif.`
    } else {
      message = 'Les deux options sont équivalentes.'
    }

    // Alertes et conseils
    const alertes: string[] = []
    const conseils: string[] = []

    if (input.anciennete !== 'plus8') {
      alertes.push('Votre contrat n\'a pas encore 8 ans. L\'abattement de 4 600 € (ou 9 200 € pour un couple) ne s\'applique pas.')
    }
    
    if (abattement < abattementMax && input.anciennete === 'plus8') {
      conseils.push(`Vous n'utilisez que ${Math.round(abattement)} € sur ${abattementMax} € d'abattement disponible cette année.`)
    }

    if (partInterets > abattementMax && input.anciennete === 'plus8') {
      conseils.push('Vous pourriez fractionner votre rachat sur deux années civiles pour maximiser l\'abattement.')
    }

    if (tmiCalculee <= 11) {
      conseils.push('Avec une TMI de 11% ou moins, le barème IR est souvent plus avantageux que le PFU.')
    }

    if (pctAvant2017 > 0 && pctAvant2017 < 1) {
      conseils.push(`Cas mixte détecté : ${Math.round(pctAvant2017 * 100)}% des versements avant 2017, ${Math.round(pctApres2017 * 100)}% après. Les gains sont répartis proportionnellement.`)
    }

    if (input.montant_rachat > input.valeur_contrat) {
      alertes.push('Le montant du rachat ne peut pas dépasser la valeur du contrat.')
    }

    return createSuccessResponse({
      part_interets: Math.round(partInterets * 100) / 100,
      base_plus_value: Math.round(partInterets * 100) / 100,
      abattement: Math.round(abattement * 100) / 100,
      abattement_max: abattementMax,
      abattement_txt: input.statut === 'couple' ? '9 200 € (couple)' : '4 600 € (célibataire)',
      base_taxable: Math.round(baseTaxable * 100) / 100,
      base_exoneree: Math.round(abattement * 100) / 100,
      pso: Math.round(pso * 100) / 100,
      tmi_calculee: tmiCalculee,
      impot_pfu: Math.round(impotPFU * 100) / 100,
      impot_ir: Math.round(impotIR * 100) / 100,
      net_pfu: Math.round(netPFU * 100) / 100,
      net_ir: Math.round(netIR * 100) / 100,
      economie_pfu: Math.round(economiePFU * 100) / 100,
      economie_ir: Math.round(economieIR * 100) / 100,
      rachat_max_exonere: Math.round(rachatMaxExonere * 100) / 100,
      message,
      pfu_breakdown: pfuBreakdown,
      alertes,
      conseils,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Données invalides: ${error.issues.map(e => e.message).join(', ')}`, 400)
    }
    logger.error('Erreur simulateur rachat AV:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}
