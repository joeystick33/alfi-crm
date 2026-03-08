 
/**
 * Simulateur Assurance-Vie - Transmission Décès
 * Calcule les droits selon régimes 990I et 757B
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Barème art. 990 I CGI
const ABATTEMENT_990I = 152500
const SEUIL_990I = 700000
const TAUX_990I_1 = 0.20
const TAUX_990I_2 = 0.3125

// Barème art. 757 B CGI
const ABATTEMENT_757B = 30500

// Abattements succession par lien de parenté (CGI art. 779)
const ABATTEMENTS_SUCCESSION = {
  conjoint: Infinity, // Exonération totale TEPA
  enfant: 100000,
  'petit-enfant': 31865,
  'frere-soeur': 15932,
  'neveu-niece': 7967,
  autre: 1594, // Abattement par défaut
}

// Barème démembrement art. 669 CGI
const BAREME_DEMEMBREMENT = [
  { ageMax: 21, usufruit: 90, nuePropriete: 10 },
  { ageMax: 31, usufruit: 80, nuePropriete: 20 },
  { ageMax: 41, usufruit: 70, nuePropriete: 30 },
  { ageMax: 51, usufruit: 60, nuePropriete: 40 },
  { ageMax: 61, usufruit: 50, nuePropriete: 50 },
  { ageMax: 71, usufruit: 40, nuePropriete: 60 },
  { ageMax: 81, usufruit: 30, nuePropriete: 70 },
  { ageMax: 91, usufruit: 20, nuePropriete: 80 },
  { ageMax: Infinity, usufruit: 10, nuePropriete: 90 },
]

// Barème succession ligne directe
const BAREME_SUCCESSION = [
  { min: 0, max: 8072, taux: 0.05 },
  { min: 8072, max: 12109, taux: 0.10 },
  { min: 12109, max: 15932, taux: 0.15 },
  { min: 15932, max: 552324, taux: 0.20 },
  { min: 552324, max: 902838, taux: 0.30 },
  { min: 902838, max: 1805677, taux: 0.40 },
  { min: 1805677, max: Infinity, taux: 0.45 },
]

const beneficiaireSchema = z.object({
  nom: z.string().default('Bénéficiaire'),
  lien_parente: z.enum(['conjoint', 'enfant', 'petit-enfant', 'frere-soeur', 'neveu-niece', 'autre']).default('enfant'),
  quotite: z.number().min(0).max(100).default(100),
  type_clause: z.enum(['standard', 'demembree']).default('standard'),
  usufruitier: z.object({
    nom: z.string().optional(),
    age: z.number().min(0).max(120).optional(),
  }).optional(),
})

const decesInputSchema = z.object({
  valeur_contrat: z.number().min(0).default(100000),
  primes_avant_70: z.number().min(0).default(80000),
  primes_apres_70: z.number().min(0).default(0),
  patrimoine_net_taxable: z.number().min(0).default(0),
  contrat_avant_1991: z.boolean().default(false),
  primes_avant_1998: z.number().min(0).default(0),
  clause_type: z.enum(['standard', 'demembree']).default('standard'),
  beneficiaires: z.array(beneficiaireSchema).min(1),
})

function getDemembrement(age: number) {
  for (const tranche of BAREME_DEMEMBREMENT) {
    if (age <= tranche.ageMax) {
      return tranche
    }
  }
  return BAREME_DEMEMBREMENT[BAREME_DEMEMBREMENT.length - 1]
}

function calculerImpot990I(baseTaxable: number): { impot: number; tranches: any[] } {
  if (baseTaxable <= 0) return { impot: 0, tranches: [] }
  
  const tranches = []
  let impotTotal = 0
  
  if (baseTaxable <= SEUIL_990I) {
    const impot = baseTaxable * TAUX_990I_1
    impotTotal = impot
    tranches.push({ base_tranche: baseTaxable, taux: TAUX_990I_1, impot_tranche: impot })
  } else {
    const impot1 = SEUIL_990I * TAUX_990I_1
    const impot2 = (baseTaxable - SEUIL_990I) * TAUX_990I_2
    impotTotal = impot1 + impot2
    tranches.push({ base_tranche: SEUIL_990I, taux: TAUX_990I_1, impot_tranche: impot1 })
    tranches.push({ base_tranche: baseTaxable - SEUIL_990I, taux: TAUX_990I_2, impot_tranche: impot2 })
  }
  
  return { impot: impotTotal, tranches }
}

function calculerImpotSuccession(baseTaxable: number, lienParente: string): { impot: number; tranches: any[] } {
  if (baseTaxable <= 0) return { impot: 0, tranches: [] }
  
  // Pour les conjoints: exonération totale
  if (lienParente === 'conjoint') return { impot: 0, tranches: [] }
  
  // Pour enfants: barème ligne directe
  if (lienParente === 'enfant' || lienParente === 'petit-enfant') {
    let restant = baseTaxable
    let impotTotal = 0
    const tranches = []
    
    for (const tranche of BAREME_SUCCESSION) {
      if (restant <= 0) break
      const baseTraanche = Math.min(restant, tranche.max - tranche.min)
      const impotTranche = baseTraanche * tranche.taux
      impotTotal += impotTranche
      tranches.push({ base_tranche: baseTraanche, taux: tranche.taux, impot_tranche: impotTranche })
      restant -= baseTraanche
    }
    
    return { impot: impotTotal, tranches }
  }
  
  // Pour frère/sœur: barème spécifique (CGI art. 777)
  if (lienParente === 'frere-soeur') {
    const tranches = []
    let restant = baseTaxable
    let impotTotal = 0
    // Tranche 1 : 35% jusqu'à 24 430 €
    if (restant > 0) {
      const base1 = Math.min(restant, 24430)
      const impot1 = base1 * 0.35
      impotTotal += impot1
      tranches.push({ base_tranche: base1, taux: 0.35, impot_tranche: impot1 })
      restant -= base1
    }
    // Tranche 2 : 45% au-delà
    if (restant > 0) {
      const impot2 = restant * 0.45
      impotTotal += impot2
      tranches.push({ base_tranche: restant, taux: 0.45, impot_tranche: impot2 })
    }
    return { impot: impotTotal, tranches }
  }
  
  // Pour autres: taux forfaitaires (CGI art. 777)
  const taux = lienParente === 'neveu-niece' ? 0.55 : 0.60
  return { impot: baseTaxable * taux, tranches: [{ base_tranche: baseTaxable, taux, impot_tranche: baseTaxable * taux }] }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!context.user) {
      return createErrorResponse('Accès non autorisé', 403)
    }

    const body = await request.json()
    const input = decesInputSchema.parse(body)

    const resultats: any[] = []
    const messages: string[] = []
    const alertes: string[] = []
    
    // Gestion des contrats avant 20/11/1991
    let primesExonerees = 0
    if (input.contrat_avant_1991 && input.primes_avant_1998 > 0) {
      // Primes versées avant le 13/10/1998 sur contrats avant 20/11/1991 : exonérées
      primesExonerees = input.primes_avant_1998
      messages.push(`Contrat souscrit avant le 20/11/1991 : ${primesExonerees.toLocaleString('fr-FR')} € de primes versées avant le 13/10/1998 sont totalement exonérées.`)
    }
    
    // Répartition des primes entre régimes (hors primes exonérées)
    const primesAvant70Taxables = Math.max(0, input.primes_avant_70 - primesExonerees)
    const totalPrimes = primesAvant70Taxables + input.primes_apres_70
    const ratio990I = totalPrimes > 0 ? primesAvant70Taxables / totalPrimes : 1
    const ratio757B = totalPrimes > 0 ? input.primes_apres_70 / totalPrimes : 0
    
    // Plus-values proportionnelles (attribuées au régime 990 I)
    const plusValues = Math.max(0, input.valeur_contrat - input.primes_avant_70 - input.primes_apres_70)
    const plusValues990I = plusValues * ratio990I
    
    // Base 990I = primes avant 70 (taxables) + plus-values proportionnelles
    const base990ITotale = primesAvant70Taxables + plusValues990I
    
    // Base 757B = primes après 70 ans après abattement global (hors intérêts capitalisés)
    const nbBeneficiaires = input.beneficiaires.length
    const abattement757BParBenef = ABATTEMENT_757B / nbBeneficiaires // Abattement global réparti

    // Traitement de chaque bénéficiaire
    for (const benef of input.beneficiaires) {
      const quotiteRatio = benef.quotite / 100
      
      // Montant brut (quote-part du contrat)
      let montantBrut = input.valeur_contrat * quotiteRatio
      let montantRecu = montantBrut
      
      // Variables pour démembrement
      let pourcentageUsufruit = 0
      let pourcentageNuePropriete = 100
      let usufruitier = null
      
      // Si clause démembrée
      if (benef.type_clause === 'demembree' && benef.usufruitier?.age) {
        const demembrement = getDemembrement(benef.usufruitier.age)
        pourcentageUsufruit = demembrement.usufruit
        pourcentageNuePropriete = demembrement.nuePropriete
        usufruitier = benef.usufruitier.nom || 'Usufruitier'
        
        // Le nu-propriétaire ne reçoit rien mais paie sur la nue-propriété
        montantRecu = 0
        montantBrut = input.valeur_contrat * quotiteRatio * (pourcentageNuePropriete / 100)
      }
      
      // Exonération conjoint (TEPA)
      const isExonereTEPA = benef.lien_parente === 'conjoint'
      
      if (isExonereTEPA) {
        resultats.push({
          nom: benef.nom,
          lien_parente: benef.lien_parente,
          quotite: benef.quotite,
          montant_brut: Math.round(montantBrut * 100) / 100,
          montant_recu: Math.round(montantRecu * 100) / 100,
          impot_total: 0,
          montant_net: Math.round(montantRecu * 100) / 100,
          taux_imposition: 0,
          is_exonere_tepa: true,
          usufruitier,
          pourcentage_usufruit: pourcentageUsufruit,
          pourcentage_nue_propriete: pourcentageNuePropriete,
        })
        continue
      }
      
      // Calcul 990I
      let base990I = base990ITotale * quotiteRatio
      if (benef.type_clause === 'demembree') {
        base990I = base990I * (pourcentageNuePropriete / 100)
      }
      const abattement990I = benef.type_clause === 'demembree' 
        ? ABATTEMENT_990I * (pourcentageNuePropriete / 100)
        : ABATTEMENT_990I
      const taxable990I = Math.max(0, base990I - abattement990I)
      const calc990I = calculerImpot990I(taxable990I)
      
      // Calcul 757B (régime droits de succession classiques)
      let base757BBrute = input.primes_apres_70 * quotiteRatio
      if (benef.type_clause === 'demembree') {
        base757BBrute = base757BBrute * (pourcentageNuePropriete / 100)
      }
      // Abattement 757B (30 500 € global réparti) + abattement succession selon lien
      const abattement757BPart = Math.min(base757BBrute, abattement757BParBenef)
      const base757BApresAbat = Math.max(0, base757BBrute - abattement757BPart)
      
      // Abattement succession par lien de parenté (100k enfant, etc.)
      const abattementSuccession = ABATTEMENTS_SUCCESSION[benef.lien_parente as keyof typeof ABATTEMENTS_SUCCESSION] || ABATTEMENTS_SUCCESSION.autre
      const abattementSuccessionApplique = Math.min(base757BApresAbat, abattementSuccession)
      const base757B = Math.max(0, base757BApresAbat - abattementSuccessionApplique)
      
      const calc757B = calculerImpotSuccession(base757B, benef.lien_parente)
      
      const impotTotal = calc990I.impot + calc757B.impot
      const montantNet = montantRecu - impotTotal
      const tauxImposition = montantBrut > 0 ? (impotTotal / montantBrut) * 100 : 0
      
      resultats.push({
        nom: benef.nom,
        lien_parente: benef.lien_parente,
        quotite: benef.quotite,
        montant_brut: Math.round(montantBrut * 100) / 100,
        montant_recu: Math.round(montantRecu * 100) / 100,
        base_990i: Math.round(base990I * 100) / 100,
        abattement_990i: Math.round(abattement990I * 100) / 100,
        taxable_990i: Math.round(taxable990I * 100) / 100,
        impot_990i: Math.round(calc990I.impot * 100) / 100,
        base_757b_brute: Math.round(base757BBrute * 100) / 100,
        abattement_757b: Math.round(abattement757BPart * 100) / 100,
        abattement_succession: Math.round(abattementSuccessionApplique * 100) / 100,
        base_757b: Math.round(base757B * 100) / 100,
        impot_757b: Math.round(calc757B.impot * 100) / 100,
        impot_total: Math.round(impotTotal * 100) / 100,
        montant_net: Math.round(montantNet * 100) / 100,
        taux_imposition: Math.round(tauxImposition * 100) / 100,
        is_exonere_tepa: false,
        usufruitier,
        pourcentage_usufruit: pourcentageUsufruit,
        pourcentage_nue_propriete: pourcentageNuePropriete,
        details: {
          regime_990i: {
            base: Math.round(base990I * 100) / 100,
            abattement: Math.round(abattement990I * 100) / 100,
            taxable: Math.round(taxable990I * 100) / 100,
            impot_990i: Math.round(calc990I.impot * 100) / 100,
            tranches: calc990I.tranches.map(t => ({
              base_tranche: Math.round(t.base_tranche * 100) / 100,
              taux: t.taux,
              impot_tranche: Math.round(t.impot_tranche * 100) / 100,
            })),
          },
          regime_757b: base757B > 0 ? {
            base: Math.round(base757B * 100) / 100,
            impot_757b: Math.round(calc757B.impot * 100) / 100,
            tranches: calc757B.tranches.map(t => ({
              base_tranche: Math.round(t.base_tranche * 100) / 100,
              taux: t.taux,
              impot_tranche: Math.round(t.impot_tranche * 100) / 100,
            })),
          } : null,
        },
      })
    }

    // Messages et alertes
    if (input.primes_apres_70 > ABATTEMENT_757B) {
      alertes.push(`Primes après 70 ans (${input.primes_apres_70.toLocaleString('fr-FR')} €) > abattement 757B (30 500 €). L'excédent de ${(input.primes_apres_70 - ABATTEMENT_757B).toLocaleString('fr-FR')} € est soumis aux droits de succession.`)
    }
    
    if (input.clause_type === 'demembree') {
      messages.push('Clause démembrée : l\'usufruitier reçoit 100% du capital. Les nus-propriétaires paient l\'impôt sur leur part fiscale (nue-propriété).')
    }
    
    if (input.contrat_avant_1991 && !input.primes_avant_1998) {
      alertes.push('Contrat avant 1991 détecté mais aucune prime avant 1998 renseignée. Vérifiez si des primes exonérées existent.')
    }

    // Totaux
    const totalImpot = resultats.reduce((sum, r) => sum + (r.impot_total || 0), 0)
    const totalNet = resultats.reduce((sum, r) => sum + (r.montant_net || 0), 0)

    return createSuccessResponse({
      resultats,
      messages,
      alertes,
      total_impot: Math.round(totalImpot * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      valeur_contrat: input.valeur_contrat,
      primes_exonerees: primesExonerees,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Données invalides: ${error.issues.map(e => e.message).join(', ')}`, 400)
    }
    logger.error('Erreur simulateur décès AV:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}
