 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Simulateur PER Salariés
 * 
 * Calculs conformes à la réglementation française 2025 :
 * - Plafond de déduction : 10% du revenu net, min 10% PASS, max 10% de 8 PASS
 * - Barème IR 2025 (revenus 2024)
 * - Report des plafonds non utilisés sur 3 ans
 * 
 * ⚠️ MAINTENANCE : Paramètres dans /lib/retirement/config/parameters-2025.ts
 */

// =============================================================================
// PARAMÈTRES 2025 - CENTRALISÉS
// =============================================================================
const PARAMS_2025 = {
  // PASS
  PASS: 47100,
  PASS_N_MOINS_1: 46368,
  
  // Plafonds PER
  PLAFOND_MIN_PER: 4636.8,  // 10% du PASS N-1
  PLAFOND_MAX_PER: 37094.4, // 10% de 8 PASS N-1
  TAUX_DEDUCTION: 0.10,
  
  // Charges sociales salariés
  TAUX_CHARGES_SALARIE: 0.23,
  TAUX_FRAIS_PRO: 0.10,
  PLAFOND_FRAIS_PRO: 14171,
  
  // Barème IR 2025 (revenus 2024)
  BAREME_IR: [
    { min: 0, max: 11294, taux: 0.00 },
    { min: 11294, max: 28797, taux: 0.11 },
    { min: 28797, max: 82341, taux: 0.30 },
    { min: 82341, max: 177106, taux: 0.41 },
    { min: 177106, max: Infinity, taux: 0.45 },
  ],
  
  // Prélèvements sociaux
  PS_PLUS_VALUES: 0.172,
  PFU: 0.30,
  
  // Rendements de référence
  RENDEMENTS: {
    prudent: 0.025,
    equilibre: 0.04,
    dynamique: 0.06,
  },
}

// =============================================================================
// SCHÉMA DE VALIDATION
// =============================================================================
const perSimulationSchema = z.object({
  // Situation
  typeRevenu: z.enum(['brut', 'net']).default('brut'),
  revenuAnnuel: z.number().min(0),
  nbParts: z.number().min(1).max(10).default(1),
  
  // PER existant
  capitalActuel: z.number().min(0).default(0),
  
  // Versement
  versementUnique: z.number().min(0).default(0),
  versementMensuel: z.number().min(0).default(0),
  typeVersement: z.enum(['deductible', 'non-deductible']).default('deductible'),
  
  // Plafonds reportés
  usePlafondsPrecedents: z.boolean().default(false),
  plafondsNonUtilises: z.number().min(0).default(0),
  
  // Projection
  ageActuel: z.number().int().min(18).max(67).optional(),
  ageRetraite: z.number().int().min(55).max(70).default(64),
  profilRisque: z.enum(['prudent', 'equilibre', 'dynamique']).default('equilibre'),
  
  // Sortie
  typeSortie: z.enum(['capital', 'rente', 'mixte']).default('capital'),
})

// =============================================================================
// FONCTIONS DE CALCUL
// =============================================================================

function brutToNetPro(salaireBrut: number): number {
  const salaireNet = salaireBrut * (1 - PARAMS_2025.TAUX_CHARGES_SALARIE)
  const fraisPro = Math.min(
    salaireNet * PARAMS_2025.TAUX_FRAIS_PRO,
    PARAMS_2025.PLAFOND_FRAIS_PRO
  )
  return Math.max(0, salaireNet - fraisPro)
}

function netToNetPro(salaireNet: number): number {
  const fraisPro = Math.min(
    salaireNet * PARAMS_2025.TAUX_FRAIS_PRO,
    PARAMS_2025.PLAFOND_FRAIS_PRO
  )
  return Math.max(0, salaireNet - fraisPro)
}

function getTMI(revenuNetImposable: number, nbParts: number = 1): number {
  const quotient = revenuNetImposable / nbParts
  
  for (const tranche of PARAMS_2025.BAREME_IR) {
    if (quotient <= tranche.max) {
      return tranche.taux
    }
  }
  return 0.45
}

function getPlafondPER(revenuNetPro: number, plafondsReportes: number = 0): {
  plafondBase: number
  plafondTotal: number
  details: string
} {
  // Option 1 : 10% du revenu pro (max 10% de 8 PASS)
  const plafondOption1 = Math.min(
    revenuNetPro * PARAMS_2025.TAUX_DEDUCTION,
    PARAMS_2025.PLAFOND_MAX_PER
  )
  
  // Option 2 : 10% du PASS (minimum garanti)
  const plafondOption2 = PARAMS_2025.PLAFOND_MIN_PER
  
  const plafondBase = Math.max(plafondOption1, plafondOption2)
  const plafondTotal = plafondBase + plafondsReportes
  
  const details = plafondOption1 >= plafondOption2
    ? `10% de votre revenu net pro (${revenuNetPro.toLocaleString('fr-FR')}€)`
    : `Minimum garanti (10% du PASS)`
  
  return { plafondBase, plafondTotal, details }
}

function calculerImpactFiscal(
  versement: number,
  plafondDisponible: number,
  tmi: number,
  typeVersement: string
) {
  if (typeVersement === 'non-deductible') {
    return {
      montantDeductible: 0,
      economieImpot: 0,
      coutNet: versement,
      depassementPlafond: false,
      montantNonDeductible: versement,
    }
  }
  
  const montantDeductible = Math.min(versement, plafondDisponible)
  const economieImpot = montantDeductible * tmi
  const coutNet = versement - economieImpot
  const montantNonDeductible = Math.max(0, versement - plafondDisponible)
  
  return {
    montantDeductible,
    economieImpot,
    coutNet,
    depassementPlafond: versement > plafondDisponible,
    montantNonDeductible,
  }
}

function projetterCapital(
  capitalInitial: number,
  versementMensuel: number,
  dureeAnnees: number,
  tauxRendement: number
): {
  capitalFinal: number
  totalVersements: number
  totalInterets: number
  projection: Array<{ annee: number; capital: number; versements: number; interets: number }>
} {
  let capital = capitalInitial
  let totalVersements = capitalInitial
  const projection = []
  const anneeDepart = new Date().getFullYear()
  
  for (let i = 1; i <= dureeAnnees; i++) {
    const versementAnnuel = versementMensuel * 12
    capital += versementAnnuel
    totalVersements += versementAnnuel
    
    // Capitalisation annuelle
    capital *= (1 + tauxRendement)
    
    projection.push({
      annee: anneeDepart + i,
      capital: Math.round(capital),
      versements: Math.round(totalVersements),
      interets: Math.round(capital - totalVersements),
    })
  }
  
  return {
    capitalFinal: Math.round(capital),
    totalVersements: Math.round(totalVersements),
    totalInterets: Math.round(capital - totalVersements),
    projection,
  }
}

function calculerSortie(
  capital: number,
  plusValues: number,
  typeSortie: string,
  typeVersement: string,
  tmi: number,
  age: number
) {
  const results: any = {}
  
  if (typeSortie === 'capital' || typeSortie === 'mixte') {
    if (typeVersement === 'deductible') {
      // Capital imposé au barème IR
      const impotCapital = capital * tmi
      // Plus-values au PFU
      const impotPV = plusValues * PARAMS_2025.PFU
      results.sortieCapital = {
        brut: capital + plusValues,
        impot: impotCapital + impotPV,
        net: capital + plusValues - impotCapital - impotPV,
        detail: `Capital soumis à l'IR (${(tmi * 100).toFixed(0)}%), plus-values au PFU (30%)`
      }
    } else {
      // Non déductible : capital exonéré, PV au PFU
      const impotPV = plusValues * PARAMS_2025.PFU
      results.sortieCapital = {
        brut: capital + plusValues,
        impot: impotPV,
        net: capital + plusValues - impotPV,
        detail: `Capital exonéré, plus-values au PFU (30%)`
      }
    }
  }
  
  if (typeSortie === 'rente' || typeSortie === 'mixte') {
    // Fraction imposable selon l'âge
    let fractionImposable = 0.40
    if (age < 50) fractionImposable = 0.70
    else if (age < 60) fractionImposable = 0.50
    else if (age < 70) fractionImposable = 0.40
    else fractionImposable = 0.30
    
    // Taux de conversion en rente (~4% pour le calcul)
    const tauxConversion = 0.04
    const renteBrute = (capital + plusValues) * tauxConversion
    const baseImposable = renteBrute * fractionImposable
    const impotRente = baseImposable * tmi
    const ps = renteBrute * PARAMS_2025.PS_PLUS_VALUES
    
    results.sortieRente = {
      mensuelle: Math.round(renteBrute / 12),
      annuelle: Math.round(renteBrute),
      fractionImposable: fractionImposable,
      impotAnnuel: Math.round(impotRente),
      psAnnuel: Math.round(ps),
      netMensuel: Math.round((renteBrute - impotRente - ps) / 12),
      detail: `${(fractionImposable * 100).toFixed(0)}% imposable (âge ${age} ans), PS ${(PARAMS_2025.PS_PLUS_VALUES * 100).toFixed(1)}%`
    }
  }
  
  return results
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = perSimulationSchema.parse(body)
    
    const {
      typeRevenu,
      revenuAnnuel,
      nbParts,
      capitalActuel,
      versementUnique,
      versementMensuel,
      typeVersement,
      usePlafondsPrecedents,
      plafondsNonUtilises,
      ageActuel,
      ageRetraite,
      profilRisque,
      typeSortie,
    } = validatedData
    
    // 1. Calculer le revenu net professionnel
    const revenuNetPro = typeRevenu === 'brut' 
      ? brutToNetPro(revenuAnnuel) 
      : netToNetPro(revenuAnnuel)
    
    // 2. Calculer le TMI
    const tmi = getTMI(revenuNetPro, nbParts)
    
    // 3. Calculer les plafonds PER
    const plafondsReportes = usePlafondsPrecedents ? plafondsNonUtilises : 0
    const { plafondBase, plafondTotal, details: detailsPlafond } = getPlafondPER(revenuNetPro, plafondsReportes)
    
    // 4. Calculer l'impact fiscal du versement
    const versementTotal = versementUnique + (versementMensuel * 12)
    const impactFiscal = calculerImpactFiscal(versementTotal, plafondTotal, tmi, typeVersement)
    
    // 5. Projection du capital
    const dureeAnnees = ageActuel ? (ageRetraite - ageActuel) : 20
    const tauxRendement = PARAMS_2025.RENDEMENTS[profilRisque]
    const projectionCapital = projetterCapital(
      capitalActuel + versementUnique,
      versementMensuel,
      dureeAnnees,
      tauxRendement
    )
    
    // 6. Calculer la sortie
    const sortie = calculerSortie(
      projectionCapital.capitalFinal - projectionCapital.totalInterets,
      projectionCapital.totalInterets,
      typeSortie,
      typeVersement,
      tmi,
      ageRetraite
    )
    
    // 7. Recommandations
    const recommendations: Array<{ priorite: string; type: string; description: string }> = []
    
    // Versement optimal
    if (versementTotal < plafondBase * 0.8) {
      recommendations.push({
        priorite: 'haute',
        type: 'versement',
        description: `Vous pouvez verser jusqu'à ${plafondBase.toLocaleString('fr-FR')}€ de plus cette année et bénéficier d'une économie d'impôt supplémentaire de ${Math.round((plafondBase - versementTotal) * tmi).toLocaleString('fr-FR')}€`
      })
    }
    
    // Dépassement plafond
    if (impactFiscal.depassementPlafond) {
      recommendations.push({
        priorite: 'moyenne',
        type: 'plafond',
        description: `${impactFiscal.montantNonDeductible.toLocaleString('fr-FR')}€ dépassent votre plafond et ne seront pas déductibles. Envisagez un versement non-déductible pour cette part.`
      })
    }
    
    // Plafonds non utilisés
    if (!usePlafondsPrecedents) {
      recommendations.push({
        priorite: 'moyenne',
        type: 'report',
        description: `Vérifiez sur votre avis d'imposition si vous avez des plafonds non utilisés des 3 dernières années. Ils sont cumulables !`
      })
    }
    
    // Profil de risque vs durée
    if (dureeAnnees > 15 && profilRisque === 'prudent') {
      recommendations.push({
        priorite: 'basse',
        type: 'risque',
        description: `Avec ${dureeAnnees} ans devant vous, un profil équilibré ou dynamique pourrait être plus adapté pour optimiser la croissance.`
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        // Paramètres
        revenuAnnuel,
        typeRevenu,
        revenuNetPro: Math.round(revenuNetPro),
        tmi,
        tmiPercent: Math.round(tmi * 100),
        nbParts,
        
        // Plafonds
        plafondBase: Math.round(plafondBase),
        plafondTotal: Math.round(plafondTotal),
        plafondsReportes: Math.round(plafondsReportes),
        detailsPlafond,
        
        // Versement
        versementTotal,
        typeVersement,
        impactFiscal: {
          ...impactFiscal,
          economieImpot: Math.round(impactFiscal.economieImpot),
          coutNet: Math.round(impactFiscal.coutNet),
          montantDeductible: Math.round(impactFiscal.montantDeductible),
          montantNonDeductible: Math.round(impactFiscal.montantNonDeductible),
        },
        
        // Projection
        dureeAnnees,
        tauxRendement,
        tauxRendementPercent: (tauxRendement * 100).toFixed(1),
        profilRisque,
        projection: {
          ...projectionCapital,
          // Limiter à 10 lignes pour l'affichage
          projection: projectionCapital.projection.filter((_, i, arr) => 
            i === 0 || i === arr.length - 1 || (arr.length > 10 ? i % Math.ceil(arr.length / 10) === 0 : true)
          ),
        },
        
        // Sortie
        sortie,
        typeSortie,
        
        // Recommandations
        recommendations,
        
        // Paramètres de référence
        params: {
          PASS: PARAMS_2025.PASS,
          annee: 2025,
        }
      }
    })
    
  } catch (error: any) {
    console.error('Error in PER simulation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation error: ' + error.message 
      }, { status: 400 })
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
