/**
 * Budget Service
 * Calculs budgétaires, détection anomalies, recommandations
 * Aura CRM - Aucune simplification
 */

import type {
  ClientBudget,
  BudgetMetrics,
  BudgetAlert,
  BudgetRecommendation,
} from '../api-types'

// ============================================================================
// CONSTANTES
// ============================================================================

// Catégories de revenus (pour référence)
export const INCOME_CATEGORIES = {
  PROFESSIONAL: {
    netSalary: 'Salaire net',
    selfEmployedIncome: 'Revenus BNC/BIC',
    bonuses: 'Primes et bonus',
    other: 'Autres revenus professionnels',
  },
  ASSET: {
    rentalIncome: 'Revenus fonciers',
    dividends: 'Dividendes',
    interest: 'Intérêts',
    capitalGains: 'Plus-values',
  },
  SPOUSE: {
    netSalary: 'Salaire conjoint',
    other: 'Autres revenus conjoint',
  },
  RETIREMENT: {
    total: 'Pensions retraite',
  },
  ALLOWANCES: {
    total: 'Allocations / aides',
  },
} as const

// Catégories de charges (pour référence)
export const EXPENSE_CATEGORIES = {
  housing: { label: 'Logement', icon: '🏠' },
  utilities: { label: 'Énergie & utilities', icon: '⚡' },
  food: { label: 'Alimentation', icon: '🍽️' },
  transportation: { label: 'Transport', icon: '🚗' },
  insurance: { label: 'Assurances', icon: '🛡️' },
  leisure: { label: 'Loisirs & culture', icon: '🎭' },
  health: { label: 'Santé', icon: '🏥' },
  education: { label: 'Éducation', icon: '📚' },
  loans: { label: 'Crédits (hors immo)', icon: '💳' },
  other: { label: 'Autres charges', icon: '📋' },
} as const

// Seuils de détection d'anomalies
const THRESHOLDS = {
  SAVINGS_RATE_LOW: 5, // Taux épargne < 5% = alerte
  SAVINGS_RATE_MEDIUM: 10, // Taux épargne < 10% = warning
  SAVINGS_RATE_HIGH: 20, // Taux épargne >= 20% = bon
  HOUSING_RATE_WARNING: 35, // Logement > 35% = warning
  HOUSING_RATE_HIGH: 40, // Logement > 40% = critique
  DEBT_RATE_WARNING: 33, // Endettement > 33% = warning
  DEBT_RATE_HIGH: 40, // Endettement > 40% = critique
  LEISURE_RATE_HIGH: 15, // Loisirs > 15% = peut optimiser
  FOOD_RATE_HIGH: 20, // Alimentation > 20% = peut optimiser
  SAVINGS_CAPACITY_MIN: 500, // Capacité épargne min pour recommandations
  EMERGENCY_FUND_MONTHS_MIN: 3, // Épargne sécurité minimum (mois)
  EMERGENCY_FUND_MONTHS_MAX: 6, // Épargne sécurité recommandée (mois)
} as const

// ============================================================================
// CALCUL DES MÉTRIQUES BUDGÉTAIRES
// ============================================================================

/**
 * Calcule toutes les métriques budgétaires à partir d'un budget client
 * @param budget - Budget client avec revenus et charges
 * @returns Métriques calculées (revenus, charges, épargne, taux, etc.)
 */
export function calculateBudgetMetrics(budget: ClientBudget): BudgetMetrics {
  // === CALCUL REVENUS MENSUELS ===

  // Revenus professionnels
  const profIncome = (budget.professionalIncome || {}) as Record<string, number>
  const professionalMonthly =
    (profIncome.netSalary || 0) +
    (profIncome.selfEmployedIncome || 0) +
    (profIncome.bonuses || 0) / 12 + // Bonus lissés sur l'année
    (profIncome.other || 0)

  // Revenus du patrimoine (annuels divisés par 12)
  const assetInc = (budget.assetIncome || {}) as Record<string, number>
  const assetMonthly =
    (assetInc.rentalIncome || 0) / 12 +
    (assetInc.dividends || 0) / 12 +
    (assetInc.interest || 0) / 12 +
    (assetInc.capitalGains || 0) / 12

  // Revenus conjoint
  const spouseInc = (budget.spouseIncome || {}) as Record<string, number>
  const spouseMonthly = (spouseInc.netSalary || 0) + (spouseInc.other || 0)

  // Pensions retraite (annuelles divisées par 12)
  const pension = (budget.retirementPensions || {}) as Record<string, number>
  const pensionMonthly = (pension.total || 0) / 12

  // Allocations (annuelles divisées par 12)
  const allow = (budget.allowances || {}) as Record<string, number>
  const allowanceMonthly = (allow.total || 0) / 12

  // Total revenus mensuels
  const revenusMensuels =
    professionalMonthly +
    assetMonthly +
    spouseMonthly +
    pensionMonthly +
    allowanceMonthly

  const revenusAnnuels = revenusMensuels * 12

  // === CALCUL CHARGES MENSUELLES ===

  const expenses = (budget.monthlyExpenses || {}) as Record<string, { total?: number }>
  const chargesMensuelles =
    (expenses.housing?.total || 0) +
    (expenses.utilities?.total || 0) +
    (expenses.food?.total || 0) +
    (expenses.transportation?.total || 0) +
    (expenses.insurance?.total || 0) +
    (expenses.leisure?.total || 0) +
    (expenses.health?.total || 0) +
    (expenses.education?.total || 0) +
    (expenses.loans?.total || 0) +
    (expenses.other?.total || 0)

  const chargesAnnuelles = chargesMensuelles * 12

  // === CALCUL ÉPARGNE ===

  const capaciteEpargneMensuelle = revenusMensuels - chargesMensuelles
  const capaciteEpargneAnnuelle = capaciteEpargneMensuelle * 12

  // Taux d'épargne (en %)
  const tauxEpargne =
    revenusMensuels > 0
      ? (capaciteEpargneMensuelle / revenusMensuels) * 100
      : 0

  // === ÉPARGNE DE SÉCURITÉ ===

  // Recommandation : 3 à 6 mois de charges
  const epargneSecuriteMin =
    chargesMensuelles * THRESHOLDS.EMERGENCY_FUND_MONTHS_MIN
  const epargneSecuriteMax =
    chargesMensuelles * THRESHOLDS.EMERGENCY_FUND_MONTHS_MAX

  // Reste à vivre (équivalent capacité épargne)
  const resteAVivre = capaciteEpargneMensuelle

  // === ARRONDIS ===

  return {
    revenusMensuels: Math.round(revenusMensuels),
    revenusAnnuels: Math.round(revenusAnnuels),
    chargesMensuelles: Math.round(chargesMensuelles),
    chargesAnnuelles: Math.round(chargesAnnuelles),
    capaciteEpargneMensuelle: Math.round(capaciteEpargneMensuelle),
    capaciteEpargneAnnuelle: Math.round(capaciteEpargneAnnuelle),
    tauxEpargne: Math.round(tauxEpargne * 10) / 10, // 1 décimale
    epargneSecuriteMin: Math.round(epargneSecuriteMin),
    epargneSecuriteMax: Math.round(epargneSecuriteMax),
    resteAVivre: Math.round(resteAVivre),
  }
}

// ============================================================================
// DÉTECTION D'ANOMALIES BUDGÉTAIRES
// ============================================================================

/**
 * Détecte les anomalies et problèmes dans le budget client
 * @param budget - Budget client
 * @param metrics - Métriques calculées
 * @returns Liste d'alertes avec sévérité et recommandations
 */
export function detectBudgetAnomalies(
  budget: ClientBudget,
  metrics: BudgetMetrics
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []

  // === 1. ÉPARGNE NÉGATIVE (CRITIQUE) ===

  if (metrics.capaciteEpargneMensuelle < 0) {
    alerts.push({
      severity: 'CRITIQUE',
      category: 'SAVINGS',
      message: `Capacité d'épargne négative de ${Math.abs(
        metrics.capaciteEpargneMensuelle
      ).toLocaleString('fr-FR')} €/mois`,
      recommendation:
        'Réduire les dépenses non essentielles ou augmenter les revenus. Situation budgétaire critique nécessitant une action immédiate.',
    })
  }

  // === 2. TAUX D'ÉPARGNE FAIBLE (WARNING) ===

  if (
    metrics.tauxEpargne >= 0 &&
    metrics.tauxEpargne < THRESHOLDS.SAVINGS_RATE_LOW
  ) {
    alerts.push({
      severity: 'WARNING',
      category: 'SAVINGS',
      message: `Taux d'épargne très faible (${metrics.tauxEpargne}%)`,
      recommendation: `Objectif recommandé : minimum ${THRESHOLDS.SAVINGS_RATE_MEDIUM}% des revenus. Automatiser l'épargne pour améliorer progressivement.`,
    })
  } else if (
    metrics.tauxEpargne >= THRESHOLDS.SAVINGS_RATE_LOW &&
    metrics.tauxEpargne < THRESHOLDS.SAVINGS_RATE_MEDIUM
  ) {
    alerts.push({
      severity: 'INFO',
      category: 'SAVINGS',
      message: `Taux d'épargne faible (${metrics.tauxEpargne}%)`,
      recommendation: `Objectif recommandé : ${THRESHOLDS.SAVINGS_RATE_MEDIUM}% minimum. Augmenter progressivement l'épargne mensuelle.`,
    })
  }

  // === 3. LOGEMENT TROP CHER (WARNING/CRITIQUE) ===

  const housingExpenses = budget.monthlyExpenses?.housing?.total || 0
  const housingRate =
    metrics.revenusMensuels > 0
      ? (housingExpenses / metrics.revenusMensuels) * 100
      : 0

  if (housingRate > THRESHOLDS.HOUSING_RATE_HIGH) {
    alerts.push({
      severity: 'CRITIQUE',
      category: 'HOUSING',
      message: `Logement représente ${housingRate.toFixed(
        1
      )}% des revenus (>${THRESHOLDS.HOUSING_RATE_HIGH}%)`,
      recommendation:
        'Taux de logement critique. Envisager un déménagement, colocation, ou négociation du loyer/crédit.',
    })
  } else if (housingRate > THRESHOLDS.HOUSING_RATE_WARNING) {
    alerts.push({
      severity: 'WARNING',
      category: 'HOUSING',
      message: `Logement représente ${housingRate.toFixed(
        1
      )}% des revenus (>${THRESHOLDS.HOUSING_RATE_WARNING}%)`,
      recommendation:
        'Taux de logement élevé. Optimiser les charges ou renégocier le crédit immobilier si possible.',
    })
  }

  // === 4. ENDETTEMENT ÉLEVÉ (WARNING/CRITIQUE) ===

  const loansExpenses = budget.monthlyExpenses?.loans?.total || 0
  const debtRate =
    metrics.revenusMensuels > 0
      ? (loansExpenses / metrics.revenusMensuels) * 100
      : 0

  if (debtRate > THRESHOLDS.DEBT_RATE_HIGH) {
    alerts.push({
      severity: 'CRITIQUE',
      category: 'DEBT',
      message: `Taux d'endettement ${debtRate.toFixed(1)}% (>${
        THRESHOLDS.DEBT_RATE_HIGH
      }%)`,
      recommendation:
        "Taux d'endettement très élevé. Restructuration urgente des crédits ou rachat de crédit recommandé.",
    })
  } else if (debtRate > THRESHOLDS.DEBT_RATE_WARNING) {
    alerts.push({
      severity: 'WARNING',
      category: 'DEBT',
      message: `Taux d'endettement ${debtRate.toFixed(1)}% (>${
        THRESHOLDS.DEBT_RATE_WARNING
      }%)`,
      recommendation:
        "Taux d'endettement à la limite. Éviter de nouveaux crédits et anticiper le remboursement.",
    })
  }

  // === 5. LOISIRS EXCESSIFS (INFO) ===

  const leisureExpenses = budget.monthlyExpenses?.leisure?.total || 0
  const leisureRate =
    metrics.revenusMensuels > 0
      ? (leisureExpenses / metrics.revenusMensuels) * 100
      : 0

  if (leisureRate > THRESHOLDS.LEISURE_RATE_HIGH) {
    const potentialSavings = leisureExpenses * 0.2 // 20% d'économie
    alerts.push({
      severity: 'INFO',
      category: 'LEISURE',
      message: `Loisirs représentent ${leisureRate.toFixed(1)}% des revenus`,
      recommendation: `Potentiel d'optimisation : réduire de 20% permettrait d'économiser ${Math.round(
        potentialSavings * 12
      ).toLocaleString('fr-FR')} € par an.`,
    })
  }

  // === 6. ALIMENTATION EXCESSIVE (INFO) ===

  const foodExpenses = budget.monthlyExpenses?.food?.total || 0
  const foodRate =
    metrics.revenusMensuels > 0
      ? (foodExpenses / metrics.revenusMensuels) * 100
      : 0

  if (foodRate > THRESHOLDS.FOOD_RATE_HIGH) {
    const potentialSavings = foodExpenses * 0.15 // 15% d'économie
    alerts.push({
      severity: 'INFO',
      category: 'FOOD',
      message: `Alimentation représente ${foodRate.toFixed(
        1
      )}% des revenus`,
      recommendation: `Optimisation possible : courses en gros, repas maison permettraient d'économiser ~${Math.round(
        potentialSavings * 12
      ).toLocaleString('fr-FR')} € par an.`,
    })
  }

  return alerts
}

// ============================================================================
// EXPENSE PIE CHART DATA TRANSFORMATION
// ============================================================================

/**
 * Expense category configuration for pie chart
 */
export const EXPENSE_CHART_CATEGORIES = [
  { key: 'housing', label: 'Logement', color: '#3b82f6' },
  { key: 'utilities', label: 'Énergie', color: '#f59e0b' },
  { key: 'food', label: 'Alimentation', color: '#10b981' },
  { key: 'transportation', label: 'Transport', color: '#6366f1' },
  { key: 'insurance', label: 'Assurances', color: '#8b5cf6' },
  { key: 'leisure', label: 'Loisirs', color: '#ec4899' },
  { key: 'health', label: 'Santé', color: '#ef4444' },
  { key: 'education', label: 'Éducation', color: '#14b8a6' },
  { key: 'loans', label: 'Crédits', color: '#f97316' },
  { key: 'other', label: 'Autres', color: '#64748b' },
] as const

export type ExpenseChartCategory = typeof EXPENSE_CHART_CATEGORIES[number]['key']

export interface ExpensePieChartItem {
  name: string
  value: number
  color: string
}

/**
 * Transforms monthly expenses data into pie chart format
 * 
 * Property 3: Expense pie chart data transformation
 * - Only includes categories with value > 0
 * - Sum of all slice values equals total monthly expenses
 * 
 * @param monthlyExpenses - Monthly expenses data from budget
 * @returns Array of pie chart items with only non-zero values
 */
export function transformExpensesToPieChartData(
  monthlyExpenses: ClientBudget['monthlyExpenses']
): ExpensePieChartItem[] {
  if (!monthlyExpenses) return []

  return EXPENSE_CHART_CATEGORIES
    .map((cat) => ({
      name: cat.label,
      value: monthlyExpenses[cat.key as keyof typeof monthlyExpenses]?.total || 0,
      color: cat.color,
    }))
    .filter((item) => item.value > 0)
}

/**
 * Calculates total monthly expenses from budget data
 * @param monthlyExpenses - Monthly expenses data from budget
 * @returns Total monthly expenses
 */
export function calculateTotalMonthlyExpenses(
  monthlyExpenses: ClientBudget['monthlyExpenses']
): number {
  if (!monthlyExpenses) return 0

  return EXPENSE_CHART_CATEGORIES.reduce((total, cat) => {
    const value = monthlyExpenses[cat.key as keyof typeof monthlyExpenses]?.total || 0
    return total + value
  }, 0)
}

// ============================================================================
// GÉNÉRATION DE RECOMMANDATIONS BUDGÉTAIRES
// ============================================================================

/**
 * Génère des recommandations personnalisées pour améliorer la situation budgétaire
 * @param budget - Budget client
 * @param metrics - Métriques calculées
 * @param client - Infos client (revenu annuel, TMI, etc.)
 * @returns Liste de recommandations priorisées
 */
export function generateBudgetRecommendations(
  budget: ClientBudget,
  metrics: BudgetMetrics,
  client: { annualIncome?: number; taxBracket?: number }
): BudgetRecommendation[] {
  const recommendations: BudgetRecommendation[] = []

  // === 1. AUTOMATISER L'ÉPARGNE ===

  if (metrics.capaciteEpargneMensuelle > THRESHOLDS.SAVINGS_CAPACITY_MIN) {
    const autoSaveAmount = Math.round(metrics.capaciteEpargneMensuelle * 0.8) // 80% de la capacité
    const annualSavings = autoSaveAmount * 12

    recommendations.push({
      priority: 'HAUTE',
      category: 'SAVINGS',
      title: "Automatiser l'épargne mensuelle",
      description: `Mettre en place un virement automatique de ${autoSaveAmount.toLocaleString(
        'fr-FR'
      )} €/mois vers un compte épargne dès réception du salaire.`,
      impact: `${annualSavings.toLocaleString(
        'fr-FR'
      )} € épargnés sur 1 an, soit ${(annualSavings * 5).toLocaleString(
        'fr-FR'
      )} € sur 5 ans (hors intérêts).`,
    })
  }

  // === 2. OPTIMISATION FISCALE VIA PER ===

  if (
    client.taxBracket &&
    client.taxBracket >= 30 &&
    metrics.capaciteEpargneMensuelle > 300
  ) {
    const perContribution = Math.min(
      metrics.capaciteEpargneMensuelle * 12,
      (client.annualIncome || 0) * 0.1 // Max 10% du revenu
    )
    const taxSavings = perContribution * (client.taxBracket / 100)

    recommendations.push({
      priority: 'HAUTE',
      category: 'TAX',
      title: 'Optimisation fiscale via PER',
      description: `Versement PER de ${perContribution.toLocaleString(
        'fr-FR'
      )} €/an pour réduire l'impôt à payer. Déduction fiscale immédiate au taux marginal de ${
        client.taxBracket
      }%.`,
      impact: `Économie fiscale de ${Math.round(taxSavings).toLocaleString(
        'fr-FR'
      )} € dès la première année. Épargne retraite constituée avec avantage fiscal.`,
    })
  }

  // === 3. CONSTITUTION ÉPARGNE DE SÉCURITÉ ===

  if (metrics.capaciteEpargneMensuelle > 0) {
    const emergencyTarget = metrics.epargneSecuriteMin
    const monthsNeeded = Math.ceil(
      emergencyTarget / metrics.capaciteEpargneMensuelle
    )

    recommendations.push({
      priority: 'HAUTE',
      category: 'SAVINGS',
      title: "Constituer une épargne de sécurité",
      description: `Épargner ${emergencyTarget.toLocaleString(
        'fr-FR'
      )} € (${
        THRESHOLDS.EMERGENCY_FUND_MONTHS_MIN
      } mois de charges) sur un Livret A ou LDDS pour faire face aux imprévus.`,
      impact: `Sécurité financière assurée en ${monthsNeeded} mois d'épargne régulière. Protection contre les coups durs (chômage, réparations, santé).`,
    })
  }

  // === 4. RÉDUIRE LES DÉPENSES LOISIRS ===

  const leisureExpenses = budget.monthlyExpenses?.leisure?.total || 0
  const leisureRate =
    metrics.revenusMensuels > 0
      ? (leisureExpenses / metrics.revenusMensuels) * 100
      : 0

  if (leisureRate > THRESHOLDS.LEISURE_RATE_HIGH) {
    const reductionAmount = leisureExpenses * 0.2 // 20% de réduction
    const annualSavings = reductionAmount * 12

    recommendations.push({
      priority: 'MOYENNE',
      category: 'EXPENSES',
      title: 'Optimiser les dépenses loisirs',
      description: `Réduire de 20% les dépenses loisirs (${Math.round(
        reductionAmount
      ).toLocaleString(
        'fr-FR'
      )} €/mois). Privilégier activités gratuites/low-cost, abonnements mutualisés, promotions.`,
      impact: `${Math.round(annualSavings).toLocaleString(
        'fr-FR'
      )} € économisés par an sans sacrifier la qualité de vie.`,
    })
  }

  // === 5. OPTIMISER LES ASSURANCES ===

  const insuranceExpenses = budget.monthlyExpenses?.insurance?.total || 0

  if (insuranceExpenses > 200) {
    const potentialSavings = insuranceExpenses * 0.15 // 15% d'économie
    const annualSavings = potentialSavings * 12

    recommendations.push({
      priority: 'MOYENNE',
      category: 'EXPENSES',
      title: 'Renégocier les assurances',
      description: `Comparer les offres d'assurances (auto, habitation, santé) et renégocier ou changer de contrat. Utiliser comparateurs en ligne.`,
      impact: `Économie potentielle de ${Math.round(
        annualSavings
      ).toLocaleString(
        'fr-FR'
      )} € par an avec mêmes garanties. ROI immédiat.`,
    })
  }

  // === 6. RENÉGOCIER LE CRÉDIT IMMOBILIER ===

  const housingExpenses = budget.monthlyExpenses?.housing?.total || 0

  if (housingExpenses > 1000) {
    const potentialSavings = housingExpenses * 0.1 // 10% d'économie potentielle
    const annualSavings = potentialSavings * 12

    recommendations.push({
      priority: 'MOYENNE',
      category: 'HOUSING',
      title: 'Renégocier le crédit immobilier',
      description: `Si crédit immobilier : renégocier le taux avec la banque actuelle ou faire racheter par concurrent. Taux actuels attractifs.`,
      impact: `Économie potentielle jusqu'à ${Math.round(
        annualSavings
      ).toLocaleString(
        'fr-FR'
      )} € par an sur les mensualités. Vérifier coûts de renégociation.`,
    })
  }

  // === 7. RÉDUIRE LES ABONNEMENTS ===

  if (leisureExpenses > 50) {
    recommendations.push({
      priority: 'BASSE',
      category: 'EXPENSES',
      title: 'Auditer les abonnements',
      description:
        'Faire le tri dans les abonnements (streaming, salle de sport, magazines). Supprimer ceux peu utilisés, mutualiser en famille.',
      impact: `Économie estimée 200-500 € par an. Désencombrement et simplification.`,
    })
  }

  // === 8. AUGMENTER LES REVENUS ===

  if (metrics.tauxEpargne < THRESHOLDS.SAVINGS_RATE_MEDIUM) {
    recommendations.push({
      priority: 'BASSE',
      category: 'REVENUE',
      title: 'Augmenter les revenus',
      description:
        "Envisager sources de revenus complémentaires : freelance, vente d'objets inutilisés, locations (parking, chambre Airbnb), heures supplémentaires.",
      impact: `Même 200 € supplémentaires par mois = 2 400 € par an. Effet levier important sur l'épargne.`,
    })
  }

  // Trier par priorité (HIGH > MEDIUM > LOW)
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 }
  return recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )
}
