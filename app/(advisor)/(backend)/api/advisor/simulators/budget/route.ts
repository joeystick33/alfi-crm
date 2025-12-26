/**
 * ══════════════════════════════════════════════════════════════════════════════
 * API SIMULATEUR BUDGET 2025
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint : POST /api/advisor/simulators/budget
 * 
 * Analyse complète du budget avec :
 * - Répartition selon la règle 50/30/20
 * - Calcul du taux d'endettement
 * - Évaluation de la santé budgétaire
 * - Recommandations personnalisées
 * - Alertes et conseils
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES FISCALES ET BUDGÉTAIRES 2025
// ══════════════════════════════════════════════════════════════════════════════

const PARAMS = {
  // Règle 50/30/20
  REGLE_BUDGETAIRE: {
    BESOINS: 50,
    ENVIES: 30,
    EPARGNE: 20,
  },
  
  // Taux d'endettement
  ENDETTEMENT: {
    SEUIL_HCSF: 35,       // Seuil HCSF depuis 2022
    SEUIL_STANDARD: 33,   // Seuil classique
    SEUIL_CONFORT: 25,
    SEUIL_OPTIMAL: 15,
  },
  
  // Seuils de santé budgétaire
  SANTE: {
    EXCELLENT: { epargneMin: 20, endettementMax: 25 },
    BONNE: { epargneMin: 10, endettementMax: 33 },
    ATTENTION: { epargneMin: 5, endettementMax: 40 },
    CRITIQUE: { epargneMax: 5, endettementMin: 40 },
  },
  
  // Seuils par catégorie (% du revenu)
  CATEGORIES: {
    housing: { max: 33, alerte: 40 },
    utilities: { max: 8, alerte: 12 },
    food: { max: 15, alerte: 20 },
    transportation: { max: 15, alerte: 20 },
    insurance: { max: 5, alerte: 8 },
    healthcare: { max: 5, alerte: 10 },
    education: { max: 5, alerte: 10 },
    entertainment: { max: 10, alerte: 15 },
    savings: { min: 20, alerte: 10 },
    otherExpenses: { max: 5, alerte: 10 },
  },
  
  // Épargne de précaution (mois de dépenses)
  EPARGNE_PRECAUTION: {
    FONCTIONNAIRE: 3,
    CDI_GRANDE_ENTREPRISE: 4,
    CDI_PME: 6,
    CDD_INTERIM: 9,
    TNS_INDEPENDANT: 12,
    RETRAITE: 6,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// SCHÉMA DE VALIDATION ZOD
// ══════════════════════════════════════════════════════════════════════════════

const IncomeSchema = z.object({
  salary: z.number().min(0, 'Le salaire doit être positif'),
  bonuses: z.number().min(0, 'Les primes doivent être positives'),
  rentalIncome: z.number().min(0, 'Les revenus locatifs doivent être positifs'),
  investmentIncome: z.number().min(0, 'Les revenus de placements doivent être positifs'),
  otherIncome: z.number().min(0, 'Les autres revenus doivent être positifs'),
})

const ExpensesSchema = z.object({
  housing: z.number().min(0, 'Le logement doit être positif'),
  utilities: z.number().min(0, 'Les charges doivent être positives'),
  food: z.number().min(0, 'L\'alimentation doit être positive'),
  transportation: z.number().min(0, 'Le transport doit être positif'),
  insurance: z.number().min(0, 'Les assurances doivent être positives'),
  healthcare: z.number().min(0, 'La santé doit être positive'),
  education: z.number().min(0, 'L\'éducation doit être positive'),
  entertainment: z.number().min(0, 'Les loisirs doivent être positifs'),
  savings: z.number().min(0, 'L\'épargne doit être positive'),
  otherExpenses: z.number().min(0, 'Les autres dépenses doivent être positives'),
})

const DebtsSchema = z.object({
  mortgage: z.number().min(0, 'Le crédit immobilier doit être positif'),
  consumerLoans: z.number().min(0, 'Les crédits conso doivent être positifs'),
  creditCards: z.number().min(0, 'Les cartes de crédit doivent être positives'),
  studentLoans: z.number().min(0, 'Le prêt étudiant doit être positif'),
  otherDebts: z.number().min(0, 'Les autres dettes doivent être positives'),
})

const BudgetInputSchema = z.object({
  income: IncomeSchema,
  expenses: ExpensesSchema,
  debts: DebtsSchema,
  profilProfessionnel: z.enum([
    'FONCTIONNAIRE',
    'CDI_GRANDE_ENTREPRISE',
    'CDI_PME',
    'CDD_INTERIM',
    'TNS_INDEPENDANT',
    'RETRAITE',
  ]).optional().default('CDI_PME'),
})

type BudgetInput = z.infer<typeof BudgetInputSchema>

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

function calculerTotaux(input: BudgetInput) {
  const totalRevenus = Object.values(input.income).reduce((a, b) => a + b, 0)
  const totalDepenses = Object.values(input.expenses).reduce((a, b) => a + b, 0)
  const totalDettes = Object.values(input.debts).reduce((a, b) => a + b, 0)
  
  return { totalRevenus, totalDepenses, totalDettes }
}

function calculerRatios(totalRevenus: number, totalDepenses: number, totalDettes: number, epargne: number) {
  if (totalRevenus <= 0) {
    return {
      tauxEpargne: 0,
      tauxEndettement: 100,
      tauxDepenses: 100,
      resteAVivre: -totalDepenses - totalDettes,
    }
  }
  
  return {
    tauxEpargne: (epargne / totalRevenus) * 100,
    tauxEndettement: (totalDettes / totalRevenus) * 100,
    tauxDepenses: (totalDepenses / totalRevenus) * 100,
    resteAVivre: totalRevenus - totalDepenses - totalDettes,
  }
}

function determinerSanteBudgetaire(tauxEpargne: number, tauxEndettement: number, resteAVivre: number): {
  niveau: 'excellent' | 'bonne' | 'attention' | 'critique'
  label: string
  color: string
  score: number
} {
  // Critique si reste à vivre négatif ou endettement > 40%
  if (resteAVivre < 0 || tauxEndettement > 40) {
    return { niveau: 'critique', label: 'Critique', color: 'red', score: 25 }
  }
  
  // Excellent si épargne >= 20% ET endettement <= 25%
  if (tauxEpargne >= 20 && tauxEndettement <= 25) {
    return { niveau: 'excellent', label: 'Excellente', color: 'emerald', score: 100 }
  }
  
  // Bonne si épargne >= 10% ET endettement <= 33%
  if (tauxEpargne >= 10 && tauxEndettement <= 33) {
    return { niveau: 'bonne', label: 'Bonne', color: 'blue', score: 75 }
  }
  
  // Attention sinon
  return { niveau: 'attention', label: 'Attention requise', color: 'amber', score: 50 }
}

function analyserRepartition50_30_20(revenus: number, expenses: BudgetInput['expenses']) {
  const besoins = expenses.housing + expenses.utilities + expenses.food + 
                  expenses.transportation + expenses.insurance + expenses.healthcare
  const envies = expenses.education + expenses.entertainment + expenses.otherExpenses
  const epargne = expenses.savings
  
  const besoinsP = revenus > 0 ? (besoins / revenus) * 100 : 0
  const enviesP = revenus > 0 ? (envies / revenus) * 100 : 0
  const epargneP = revenus > 0 ? (epargne / revenus) * 100 : 0
  
  return {
    besoins: {
      montant: Math.round(besoins),
      pourcentage: Math.round(besoinsP * 10) / 10,
      objectif: PARAMS.REGLE_BUDGETAIRE.BESOINS,
      ecart: Math.round((besoinsP - PARAMS.REGLE_BUDGETAIRE.BESOINS) * 10) / 10,
      statut: besoinsP <= 55 ? 'ok' : besoinsP <= 60 ? 'warning' : 'alert',
    },
    envies: {
      montant: Math.round(envies),
      pourcentage: Math.round(enviesP * 10) / 10,
      objectif: PARAMS.REGLE_BUDGETAIRE.ENVIES,
      ecart: Math.round((enviesP - PARAMS.REGLE_BUDGETAIRE.ENVIES) * 10) / 10,
      statut: enviesP <= 35 ? 'ok' : enviesP <= 40 ? 'warning' : 'alert',
    },
    epargne: {
      montant: Math.round(epargne),
      pourcentage: Math.round(epargneP * 10) / 10,
      objectif: PARAMS.REGLE_BUDGETAIRE.EPARGNE,
      ecart: Math.round((epargneP - PARAMS.REGLE_BUDGETAIRE.EPARGNE) * 10) / 10,
      statut: epargneP >= 15 ? 'ok' : epargneP >= 10 ? 'warning' : 'alert',
    },
  }
}

function analyserCategories(revenus: number, expenses: BudgetInput['expenses']) {
  const categories: Array<{
    id: string
    label: string
    montant: number
    pourcentage: number
    seuilMax: number
    statut: 'ok' | 'warning' | 'alert'
  }> = []
  
  const mapping = [
    { id: 'housing', label: 'Logement', value: expenses.housing },
    { id: 'utilities', label: 'Charges', value: expenses.utilities },
    { id: 'food', label: 'Alimentation', value: expenses.food },
    { id: 'transportation', label: 'Transport', value: expenses.transportation },
    { id: 'insurance', label: 'Assurances', value: expenses.insurance },
    { id: 'healthcare', label: 'Santé', value: expenses.healthcare },
    { id: 'education', label: 'Éducation', value: expenses.education },
    { id: 'entertainment', label: 'Loisirs', value: expenses.entertainment },
    { id: 'savings', label: 'Épargne', value: expenses.savings },
    { id: 'otherExpenses', label: 'Autres', value: expenses.otherExpenses },
  ]
  
  for (const cat of mapping) {
    const pourcentage = revenus > 0 ? (cat.value / revenus) * 100 : 0
    const config = PARAMS.CATEGORIES[cat.id as keyof typeof PARAMS.CATEGORIES]
    
    let statut: 'ok' | 'warning' | 'alert' = 'ok'
    let seuilMax = 0
    
    if ('max' in config) {
      seuilMax = config.max
      if (pourcentage > config.alerte) {
        statut = 'alert'
      } else if (pourcentage > config.max) {
        statut = 'warning'
      }
    } else if ('min' in config) {
      seuilMax = config.min
      if (pourcentage < config.alerte) {
        statut = 'alert'
      } else if (pourcentage < config.min) {
        statut = 'warning'
      }
    }
    
    if (cat.value > 0) {
      categories.push({
        id: cat.id,
        label: cat.label,
        montant: Math.round(cat.value),
        pourcentage: Math.round(pourcentage * 10) / 10,
        seuilMax,
        statut,
      })
    }
  }
  
  return categories
}

function calculerCapaciteEmprunt(revenus: number, dettesActuelles: number) {
  const seuilHCSF = PARAMS.ENDETTEMENT.SEUIL_HCSF / 100
  const mensualiteMax = revenus * seuilHCSF
  const capaciteRestante = Math.max(0, mensualiteMax - dettesActuelles)
  
  // Calcul approximatif du capital empruntable (taux 4%, 20 ans)
  const tauxMensuel = 0.04 / 12
  const nbMois = 240
  let capitalEmpruntable = 0
  
  if (capaciteRestante > 0) {
    capitalEmpruntable = capaciteRestante * (1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel
  }
  
  return {
    mensualiteMaximale: Math.round(mensualiteMax),
    capaciteRestante: Math.round(capaciteRestante),
    capitalEmpruntable: Math.round(capitalEmpruntable),
    tauxUtilise: revenus > 0 ? Math.round((dettesActuelles / revenus) * 1000) / 10 : 0,
    tauxDisponible: Math.round((seuilHCSF * 100 - (revenus > 0 ? (dettesActuelles / revenus) * 100 : 0)) * 10) / 10,
  }
}

function calculerEpargnePrecaution(totalDepenses: number, totalDettes: number, profil: string) {
  const moisRecommandes = PARAMS.EPARGNE_PRECAUTION[profil as keyof typeof PARAMS.EPARGNE_PRECAUTION] || 6
  const depensesMensuelles = totalDepenses + totalDettes
  const montantRecommande = depensesMensuelles * moisRecommandes
  
  return {
    moisRecommandes,
    depensesMensuelles: Math.round(depensesMensuelles),
    montantRecommande: Math.round(montantRecommande),
    profil,
  }
}

function genererAlertes(
  tauxEndettement: number,
  tauxEpargne: number,
  resteAVivre: number,
  ratioLogement: number,
  expenses: BudgetInput['expenses'],
  debts: BudgetInput['debts']
): string[] {
  const alertes: string[] = []
  
  // Alertes critiques
  if (resteAVivre < 0) {
    alertes.push('🚨 Budget déficitaire : vos dépenses dépassent vos revenus')
  }
  
  if (tauxEndettement > 40) {
    alertes.push('🚨 Taux d\'endettement critique (> 40%) - Risque de surendettement')
  } else if (tauxEndettement > 35) {
    alertes.push('⚠️ Taux d\'endettement supérieur au seuil HCSF (35%)')
  }
  
  // Alertes épargne
  if (expenses.savings === 0) {
    alertes.push('⚠️ Aucune épargne mensuelle détectée')
  } else if (tauxEpargne < 5) {
    alertes.push('⚠️ Taux d\'épargne très faible (< 5%)')
  }
  
  // Alertes logement
  if (ratioLogement > 40) {
    alertes.push('⚠️ Le logement représente plus de 40% de vos revenus')
  }
  
  // Alertes dettes spécifiques
  if (debts.creditCards > 0) {
    alertes.push('⚠️ Solde de carte de crédit revolving - Taux élevés à rembourser en priorité')
  }
  
  return alertes
}

function genererRecommandations(
  santeBudgetaire: ReturnType<typeof determinerSanteBudgetaire>,
  tauxEpargne: number,
  tauxEndettement: number,
  repartition: ReturnType<typeof analyserRepartition50_30_20>,
  categories: ReturnType<typeof analyserCategories>,
  debts: BudgetInput['debts']
): string[] {
  const recommandations: string[] = []
  
  // Recommandations selon la santé globale
  switch (santeBudgetaire.niveau) {
    case 'excellent':
      recommandations.push('✅ Excellente gestion budgétaire - Continuez ainsi !')
      recommandations.push('💡 Diversifiez vos investissements pour optimiser votre patrimoine')
      break
    case 'bonne':
      recommandations.push('👍 Bonne situation financière - Quelques optimisations possibles')
      if (tauxEpargne < 20) {
        recommandations.push('💡 Augmentez votre épargne vers 20% si possible')
      }
      break
    case 'attention':
      recommandations.push('⚠️ Budget tendu - Actions recommandées')
      recommandations.push('💡 Identifiez les postes de dépenses à réduire')
      recommandations.push('💡 Mettez en place un virement automatique d\'épargne')
      break
    case 'critique':
      recommandations.push('🚨 Situation critique - Action urgente nécessaire')
      recommandations.push('💡 Consultez un conseiller financier')
      recommandations.push('💡 Suspendez les achats non essentiels')
      if (tauxEndettement > 40) {
        recommandations.push('💡 Envisagez une restructuration de vos dettes')
      }
      break
  }
  
  // Recommandations spécifiques
  if (repartition.besoins.statut === 'alert') {
    recommandations.push('💡 Vos dépenses essentielles sont trop élevées - Réduisez le logement ou le transport')
  }
  
  if (repartition.envies.statut === 'alert') {
    recommandations.push('💡 Vos dépenses de loisirs sont excessives - Révisez vos abonnements')
  }
  
  if (repartition.epargne.statut === 'alert') {
    recommandations.push('💡 Constituez une épargne de précaution en priorité')
  }
  
  // Conseil sur les dettes
  if (debts.creditCards > 0) {
    recommandations.push('💡 Priorité absolue : rembourser le solde des cartes de crédit revolving')
  }
  
  if (debts.consumerLoans > 0 && tauxEndettement > 25) {
    recommandations.push('💡 Envisagez un regroupement de crédits pour réduire vos mensualités')
  }
  
  return recommandations
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER API
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation Zod
    const validation = BudgetInputSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }
    
    const input = validation.data
    
    // Calculs principaux
    const { totalRevenus, totalDepenses, totalDettes } = calculerTotaux(input)
    const ratios = calculerRatios(totalRevenus, totalDepenses, totalDettes, input.expenses.savings)
    const santeBudgetaire = determinerSanteBudgetaire(ratios.tauxEpargne, ratios.tauxEndettement, ratios.resteAVivre)
    
    // Analyses détaillées
    const repartition50_30_20 = analyserRepartition50_30_20(totalRevenus, input.expenses)
    const categories = analyserCategories(totalRevenus, input.expenses)
    const capaciteEmprunt = calculerCapaciteEmprunt(totalRevenus, totalDettes)
    const epargnePrecaution = calculerEpargnePrecaution(totalDepenses, totalDettes, input.profilProfessionnel)
    
    // Ratio logement
    const ratioLogement = totalRevenus > 0 ? (input.expenses.housing / totalRevenus) * 100 : 0
    
    // Alertes et recommandations
    const alertes = genererAlertes(
      ratios.tauxEndettement, 
      ratios.tauxEpargne, 
      ratios.resteAVivre, 
      ratioLogement,
      input.expenses,
      input.debts
    )
    const recommandations = genererRecommandations(
      santeBudgetaire,
      ratios.tauxEpargne,
      ratios.tauxEndettement,
      repartition50_30_20,
      categories,
      input.debts
    )
    
    // Construction de la réponse
    const result = {
      // Synthèse
      synthese: {
        santeBudgetaire,
        totalRevenus: Math.round(totalRevenus),
        totalDepenses: Math.round(totalDepenses),
        totalDettes: Math.round(totalDettes),
        resteAVivre: Math.round(ratios.resteAVivre),
      },
      
      // Métriques clés
      metriques: {
        tauxEpargne: Math.round(ratios.tauxEpargne * 10) / 10,
        tauxEndettement: Math.round(ratios.tauxEndettement * 10) / 10,
        tauxDepenses: Math.round(ratios.tauxDepenses * 10) / 10,
        ratioLogement: Math.round(ratioLogement * 10) / 10,
      },
      
      // Détail revenus
      revenus: {
        total: Math.round(totalRevenus),
        detail: {
          salaire: Math.round(input.income.salary),
          primes: Math.round(input.income.bonuses),
          locatifs: Math.round(input.income.rentalIncome),
          placements: Math.round(input.income.investmentIncome),
          autres: Math.round(input.income.otherIncome),
        },
      },
      
      // Détail dépenses
      depenses: {
        total: Math.round(totalDepenses),
        categories,
      },
      
      // Détail dettes
      dettes: {
        total: Math.round(totalDettes),
        detail: {
          immobilier: Math.round(input.debts.mortgage),
          consommation: Math.round(input.debts.consumerLoans),
          cartesCredit: Math.round(input.debts.creditCards),
          etudiant: Math.round(input.debts.studentLoans),
          autres: Math.round(input.debts.otherDebts),
        },
      },
      
      // Analyse 50/30/20
      repartition50_30_20,
      
      // Capacité d'emprunt
      capaciteEmprunt,
      
      // Épargne de précaution
      epargnePrecaution,
      
      // Alertes et recommandations
      alertes,
      recommandations,
      
      // Paramètres de référence
      parametres: {
        regleBudgetaire: PARAMS.REGLE_BUDGETAIRE,
        seuilsEndettement: PARAMS.ENDETTEMENT,
        seuilsCategories: PARAMS.CATEGORIES,
      },
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error) {
    console.error('Erreur API simulateur budget:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'analyse du budget',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
