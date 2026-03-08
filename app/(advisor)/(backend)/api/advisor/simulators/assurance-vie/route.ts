/**
 * Simulateur Assurance-vie - API Route
 * Projections de performance et fiscalité des contrats AV
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation des entrées
const assuranceVieInputSchema = z.object({
  // Capital initial
  capitalInitial: z.number().min(0).default(0),
  versementInitial: z.number().min(0).default(0),
  
  // Versements programmés
  versementsMensuels: z.number().min(0).default(0),
  dureeVersements: z.number().min(0).max(50).default(20), // années
  
  // Allocation d'actifs
  allocation: z.object({
    fondsEuros: z.number().min(0).max(100).default(30),
    obligataire: z.number().min(0).max(100).default(20),
    actionsEurope: z.number().min(0).max(100).default(25),
    actionsMonde: z.number().min(0).max(100).default(15),
    immobilier: z.number().min(0).max(100).default(10),
  }),
  
  // Rendements attendus (par type de support)
  rendements: z.object({
    fondsEuros: z.number().default(2.5),
    obligataire: z.number().default(3.0),
    actionsEurope: z.number().default(6.0),
    actionsMonde: z.number().default(7.0),
    immobilier: z.number().default(4.5),
  }).optional(),
  
  // Frais
  frais: z.object({
    entree: z.number().min(0).max(5).default(0),
    gestionAnnuelle: z.number().min(0).max(2).default(0.75),
    arbitrage: z.number().min(0).max(1).default(0),
  }).optional(),
  
  // Paramètres de simulation
  dureeSimulation: z.number().min(1).max(50).default(20), // années
  inflationAnnuelle: z.number().min(0).max(10).default(2),
  
  // Situation fiscale
  dateOuverture: z.string().optional(), // ISO date
  ageSouscripteur: z.number().min(18).max(100).default(45),
  trancheMarginalImposition: z.number().min(0).max(45).default(30),
  
  // Type de sortie simulé
  typeSortie: z.enum(['rachat_total', 'rachat_partiel', 'rente', 'succession']).default('rachat_total'),
  montantRachatPartiel: z.number().min(0).optional(),
})

// Types
interface ProjectionAnnuelle {
  annee: number
  capitalDebut: number
  versements: number
  gains: number
  frais: number
  capitalFin: number
  rendementNet: number
  plusValue: number
  ancienneteContrat: number
}

interface ResultatSimulation {
  // Projections
  projections: ProjectionAnnuelle[]
  capitalFinal: number
  totalVersements: number
  totalGains: number
  totalFrais: number
  rendementAnnuelMoyen: number
  
  // Fiscalité
  fiscalite: {
    anciennete: number
    regimeFiscal: string
    tauxPrelevements: number
    tauxImpot: number
    abattement: number
    plusValueBrute: number
    prelevementsSociaux: number
    impotRevenu: number
    fiscaliteTotal: number
    capitalNetFiscalite: number
  }
  
  // Allocation
  allocationFinale: {
    fondsEuros: number
    obligataire: number
    actionsEurope: number
    actionsMonde: number
    immobilier: number
  }
  
  // Comparaison
  comparaison: {
    capitalInflationAjuste: number
    rendementReelAnnuel: number
    equivalentLivretA: number
  }
}

// Fonction de calcul du simulateur
function simulerAssuranceVie(input: z.infer<typeof assuranceVieInputSchema>): ResultatSimulation {
  const rendements = input.rendements || {
    fondsEuros: 2.5,
    obligataire: 3.0,
    actionsEurope: 6.0,
    actionsMonde: 7.0,
    immobilier: 4.5,
  }
  
  const frais = input.frais || {
    entree: 0,
    gestionAnnuelle: 0.75,
    arbitrage: 0,
  }
  
  // Calcul du rendement moyen pondéré
  const rendementMoyenBrut = (
    (input.allocation.fondsEuros / 100) * rendements.fondsEuros +
    (input.allocation.obligataire / 100) * rendements.obligataire +
    (input.allocation.actionsEurope / 100) * rendements.actionsEurope +
    (input.allocation.actionsMonde / 100) * rendements.actionsMonde +
    (input.allocation.immobilier / 100) * rendements.immobilier
  )
  
  const rendementNet = rendementMoyenBrut - frais.gestionAnnuelle
  
  // Capital initial après frais d'entrée
  let capital = (input.capitalInitial + input.versementInitial) * (1 - frais.entree / 100)
  let totalVersements = input.capitalInitial + input.versementInitial
  let totalFrais = (input.capitalInitial + input.versementInitial) * (frais.entree / 100)
  
  const projections: ProjectionAnnuelle[] = []
  
  // Calcul année par année
  for (let annee = 1; annee <= input.dureeSimulation; annee++) {
    const capitalDebut = capital
    
    // Versements annuels
    let versementsAnnuels = 0
    if (annee <= input.dureeVersements) {
      versementsAnnuels = input.versementsMensuels * 12 * (1 - frais.entree / 100)
      totalVersements += input.versementsMensuels * 12
      totalFrais += input.versementsMensuels * 12 * (frais.entree / 100)
    }
    
    // Gains
    const gains = (capitalDebut + versementsAnnuels / 2) * (rendementNet / 100)
    
    // Frais de gestion
    const fraisGestion = (capitalDebut + versementsAnnuels) * (frais.gestionAnnuelle / 100)
    totalFrais += fraisGestion
    
    capital = capitalDebut + versementsAnnuels + gains
    
    const plusValue = capital - totalVersements
    
    projections.push({
      annee,
      capitalDebut: Math.round(capitalDebut),
      versements: Math.round(versementsAnnuels),
      gains: Math.round(gains),
      frais: Math.round(fraisGestion),
      capitalFin: Math.round(capital),
      rendementNet: Math.round((gains / capitalDebut) * 10000) / 100,
      plusValue: Math.round(plusValue),
      ancienneteContrat: annee,
    })
  }
  
  // Calcul fiscalité
  const plusValueBrute = capital - totalVersements
  const anciennete = input.dureeSimulation
  
  let regimeFiscal: string
  let tauxPrelevements: number
  let tauxImpot: number
  let abattement = 0
  
  if (anciennete >= 8) {
    // Après 8 ans : PFL 7.5% ou barème avec abattement
    regimeFiscal = 'Après 8 ans - PFL 7.5% + PS'
    tauxPrelevements = 17.2 // 17,2% INCHANGÉ (AV exclue hausse LFSS 2026)
    tauxImpot = 7.5
    abattement = 4600 // abattement annuel (doublé pour couple)
  } else if (anciennete >= 4) {
    // Entre 4 et 8 ans : PFU 12.8%
    regimeFiscal = '4-8 ans - PFU 12.8% + PS'
    tauxPrelevements = 17.2 // 17,2% INCHANGÉ (AV exclue hausse LFSS 2026)
    tauxImpot = 12.8
  } else {
    // Moins de 4 ans : PFU 12.8%
    regimeFiscal = 'Moins de 4 ans - PFU 12.8% + PS'
    tauxPrelevements = 17.2 // 17,2% INCHANGÉ (AV exclue hausse LFSS 2026)
    tauxImpot = 12.8
  }
  
  const prelevementsSociaux = Math.max(0, plusValueBrute - abattement) * (tauxPrelevements / 100)
  const impotRevenu = Math.max(0, plusValueBrute - abattement) * (tauxImpot / 100)
  const fiscaliteTotal = prelevementsSociaux + impotRevenu
  const capitalNetFiscalite = capital - fiscaliteTotal
  
  // Comparaisons
  const capitalInflationAjuste = capital / Math.pow(1 + input.inflationAnnuelle / 100, input.dureeSimulation)
  const rendementReelAnnuel = rendementNet - input.inflationAnnuelle
  const equivalentLivretA = totalVersements * Math.pow(1.03, input.dureeSimulation) // Livret A à 3%
  
  return {
    projections,
    capitalFinal: Math.round(capital),
    totalVersements: Math.round(totalVersements),
    totalGains: Math.round(capital - totalVersements),
    totalFrais: Math.round(totalFrais),
    rendementAnnuelMoyen: Math.round(rendementNet * 100) / 100,
    fiscalite: {
      anciennete,
      regimeFiscal,
      tauxPrelevements,
      tauxImpot,
      abattement,
      plusValueBrute: Math.round(plusValueBrute),
      prelevementsSociaux: Math.round(prelevementsSociaux),
      impotRevenu: Math.round(impotRevenu),
      fiscaliteTotal: Math.round(fiscaliteTotal),
      capitalNetFiscalite: Math.round(capitalNetFiscalite),
    },
    allocationFinale: {
      fondsEuros: Math.round(capital * input.allocation.fondsEuros / 100),
      obligataire: Math.round(capital * input.allocation.obligataire / 100),
      actionsEurope: Math.round(capital * input.allocation.actionsEurope / 100),
      actionsMonde: Math.round(capital * input.allocation.actionsMonde / 100),
      immobilier: Math.round(capital * input.allocation.immobilier / 100),
    },
    comparaison: {
      capitalInflationAjuste: Math.round(capitalInflationAjuste),
      rendementReelAnnuel: Math.round(rendementReelAnnuel * 100) / 100,
      equivalentLivretA: Math.round(equivalentLivretA),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!user) {
      return createErrorResponse('Accès non autorisé', 403)
    }
    
    const body = await request.json()
    const input = assuranceVieInputSchema.parse(body)
    
    // Validation allocation totale = 100%
    const totalAllocation = 
      input.allocation.fondsEuros +
      input.allocation.obligataire +
      input.allocation.actionsEurope +
      input.allocation.actionsMonde +
      input.allocation.immobilier
    
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return createErrorResponse(
        `L'allocation totale doit être égale à 100% (actuelle: ${totalAllocation}%)`,
        400
      )
    }
    
    const resultat = simulerAssuranceVie(input)
    
    return createSuccessResponse({
      simulation: resultat,
      input: {
        capitalInitial: input.capitalInitial,
        versementInitial: input.versementInitial,
        versementsMensuels: input.versementsMensuels,
        dureeVersements: input.dureeVersements,
        dureeSimulation: input.dureeSimulation,
        allocation: input.allocation,
      },
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Données invalides: ${error.issues.map(e => e.message).join(', ')}`, 400)
    }
    logger.error('Erreur simulateur assurance-vie:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    // Retourne les paramètres par défaut et les options disponibles
    return createSuccessResponse({
      parametresDefaut: {
        capitalInitial: 0,
        versementInitial: 10000,
        versementsMensuels: 200,
        dureeVersements: 20,
        dureeSimulation: 20,
        allocation: {
          fondsEuros: 30,
          obligataire: 20,
          actionsEurope: 25,
          actionsMonde: 15,
          immobilier: 10,
        },
        rendements: {
          fondsEuros: 2.5,
          obligataire: 3.0,
          actionsEurope: 6.0,
          actionsMonde: 7.0,
          immobilier: 4.5,
        },
        frais: {
          entree: 0,
          gestionAnnuelle: 0.75,
          arbitrage: 0,
        },
      },
      profilsRisque: [
        { nom: 'Prudent', fondsEuros: 70, obligataire: 20, actionsEurope: 5, actionsMonde: 0, immobilier: 5 },
        { nom: 'Équilibré', fondsEuros: 30, obligataire: 20, actionsEurope: 25, actionsMonde: 15, immobilier: 10 },
        { nom: 'Dynamique', fondsEuros: 10, obligataire: 10, actionsEurope: 35, actionsMonde: 35, immobilier: 10 },
        { nom: 'Offensif', fondsEuros: 0, obligataire: 5, actionsEurope: 40, actionsMonde: 45, immobilier: 10 },
      ],
      fiscalite: {
        prelevementsSociaux: 17.2,
        pfu: 12.8,
        pfl8ans: 7.5,
        abattement8ans: 4600,
        abattement8ansCouples: 9200,
      },
    })
    
  } catch (error) {
    logger.error('Erreur GET simulateur assurance-vie:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}
