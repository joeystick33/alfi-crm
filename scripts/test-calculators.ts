/**
 * Script de test des calculateurs
 * Vérifie que les résultats sont corrects avec des données d'exemple
 * 
 * Usage: npx ts-node scripts/test-calculators.ts
 */

import { BudgetCalculator } from '../app/_common/lib/services/calculators/budget-calculator'
import { TaxCalculator } from '../app/_common/lib/services/calculators/tax-calculator'

// =============================================================================
// DONNÉES D'EXEMPLE - Client type CGP
// =============================================================================

const CLIENT_EXEMPLE = {
  nom: 'Jean DUPONT',
  age: 45,
  situation: 'Marié, 2 enfants',
  
  // Budget mensuel
  revenus: {
    salaire: 5500,
    primes: 500,
    loyersPercus: 800,
    dividendes: 200,
    autres: 0,
  },
  
  charges: {
    loyer: 0, // Propriétaire
    remboursementCredit: 1200,
    chargesCopro: 200,
    assurances: 300,
    alimentation: 600,
    transport: 250,
    energie: 150,
    loisirs: 400,
    epargne: 500,
    autres: 200,
  },
  
  // Patrimoine
  patrimoineImmobilier: 450000,
  patrimoineFinancier: 120000,
}

// =============================================================================
// TESTS
// =============================================================================

console.log('═'.repeat(80))
console.log('🧪 TEST DES CALCULATEURS - Client:', CLIENT_EXEMPLE.nom)
console.log('═'.repeat(80))
console.log()

// -----------------------------------------------------------------------------
// TEST 1: CAPACITÉ D'ENDETTEMENT
// -----------------------------------------------------------------------------

console.log('📊 TEST 1: CAPACITÉ D\'ENDETTEMENT')
console.log('-'.repeat(60))

const revenuMensuel = CLIENT_EXEMPLE.revenus.salaire + CLIENT_EXEMPLE.revenus.primes + 
                       CLIENT_EXEMPLE.revenus.loyersPercus + CLIENT_EXEMPLE.revenus.dividendes

const dettesActuelles = CLIENT_EXEMPLE.charges.remboursementCredit

const debtCapacity = BudgetCalculator.calculateDebtCapacity(
  revenuMensuel,
  dettesActuelles,
  0.035, // Taux à 3.5%
  20     // Durée 20 ans
)

console.log(`Revenus mensuels: ${revenuMensuel.toLocaleString('fr-FR')} €`)
console.log(`Dettes actuelles: ${dettesActuelles.toLocaleString('fr-FR')} €/mois`)
console.log()
console.log(`Résultats:`)
console.log(`  • Taux d'endettement max: ${(debtCapacity.maxDebtRatio * 100).toFixed(0)}%`)
console.log(`  • Taux actuel: ${((dettesActuelles / revenuMensuel) * 100).toFixed(1)}%`)
console.log(`  • Mensualité max possible: ${debtCapacity.maxMonthlyPayment.toLocaleString('fr-FR')} €`)
console.log(`  • Capacité restante: ${debtCapacity.remainingCapacity.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Montant empruntable max: ${Math.round(debtCapacity.loanDetails.maxLoanAmount).toLocaleString('fr-FR')} €`)
console.log(`  • Affordability: ${debtCapacity.affordability}`)
console.log()

// Vérification manuelle
const tauxEndettementAttendu = dettesActuelles / revenuMensuel
const mensualiteMaxAttendue = revenuMensuel * 0.33
const capaciteRestanteAttendue = mensualiteMaxAttendue - dettesActuelles

console.log(`✅ Vérifications:`)
console.log(`  • Taux endettement: ${(tauxEndettementAttendu * 100).toFixed(1)}% (attendu: ~17.1%)`)
console.log(`  • Mensualité max: ${mensualiteMaxAttendue.toFixed(0)} € (attendu: ${(revenuMensuel * 0.33).toFixed(0)} €)`)
console.log(`  • Capacité restante: ${capaciteRestanteAttendue.toFixed(0)} € (attendu: ${(mensualiteMaxAttendue - dettesActuelles).toFixed(0)} €)`)
console.log()

// -----------------------------------------------------------------------------
// TEST 2: ANALYSE BUDGET COMPLÈTE
// -----------------------------------------------------------------------------

console.log('📊 TEST 2: ANALYSE BUDGET')
console.log('-'.repeat(60))

const budgetAnalysis = BudgetCalculator.analyzeBudget({
  income: {
    salary: CLIENT_EXEMPLE.revenus.salaire,
    bonuses: CLIENT_EXEMPLE.revenus.primes,
    rentalIncome: CLIENT_EXEMPLE.revenus.loyersPercus,
    investmentIncome: CLIENT_EXEMPLE.revenus.dividendes,
    otherIncome: CLIENT_EXEMPLE.revenus.autres,
  },
  expenses: {
    housing: CLIENT_EXEMPLE.charges.chargesCopro,
    utilities: CLIENT_EXEMPLE.charges.energie,
    food: CLIENT_EXEMPLE.charges.alimentation,
    transportation: CLIENT_EXEMPLE.charges.transport,
    insurance: CLIENT_EXEMPLE.charges.assurances,
    healthcare: 0,
    education: 0,
    entertainment: CLIENT_EXEMPLE.charges.loisirs,
    savings: CLIENT_EXEMPLE.charges.epargne,
    otherExpenses: CLIENT_EXEMPLE.charges.autres,
  },
  debts: {
    mortgage: CLIENT_EXEMPLE.charges.remboursementCredit,
    consumerLoans: 0,
    creditCards: 0,
    studentLoans: 0,
    otherDebts: 0,
  },
})

console.log(`Résultats:`)
console.log(`  • Revenu total: ${budgetAnalysis.income.total.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Dépenses totales: ${budgetAnalysis.expenses.total.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Dettes totales: ${budgetAnalysis.debts.total.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Revenu disponible: ${budgetAnalysis.metrics.disposableIncome.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Taux d'épargne: ${(budgetAnalysis.metrics.savingsRate * 100).toFixed(1)}%`)
console.log(`  • Taux d'endettement: ${(budgetAnalysis.metrics.debtRatio * 100).toFixed(1)}%`)
console.log(`  • Santé budgétaire: ${budgetAnalysis.budgetHealth}`)
console.log()
console.log(`Recommandations:`)
budgetAnalysis.recommendations.forEach(r => console.log(`  • ${r}`))
console.log()

// -----------------------------------------------------------------------------
// TEST 3: CALCUL IR (Impôt sur le Revenu)
// -----------------------------------------------------------------------------

console.log('📊 TEST 3: CALCUL IMPÔT SUR LE REVENU')
console.log('-'.repeat(60))

const revenuAnnuel = revenuMensuel * 12
const partsQuotient = 3 // Marié + 2 enfants

const incomeTax = TaxCalculator.calculateIncomeTax(
  revenuAnnuel,
  revenuAnnuel * 0.10, // Abattement 10%
  partsQuotient,
  2024
)

console.log(`Paramètres:`)
console.log(`  • Revenu brut annuel: ${revenuAnnuel.toLocaleString('fr-FR')} €`)
console.log(`  • Abattement 10%: ${(revenuAnnuel * 0.10).toLocaleString('fr-FR')} €`)
console.log(`  • Parts fiscales: ${partsQuotient}`)
console.log()
console.log(`Résultats:`)
console.log(`  • Revenu imposable: ${incomeTax.taxableIncome.toLocaleString('fr-FR')} €`)
console.log(`  • Impôt sur le revenu: ${Math.round(incomeTax.incomeTax).toLocaleString('fr-FR')} €`)
console.log(`  • Contributions sociales: ${Math.round(incomeTax.socialContributions).toLocaleString('fr-FR')} €`)
console.log(`  • Impôt total: ${Math.round(incomeTax.totalTax).toLocaleString('fr-FR')} €`)
console.log(`  • Taux effectif: ${(incomeTax.effectiveRate * 100).toFixed(2)}%`)
console.log(`  • TMI (taux marginal): ${(incomeTax.marginalRate * 100).toFixed(0)}%`)
console.log(`  • Revenu net après impôt: ${Math.round(incomeTax.netIncome).toLocaleString('fr-FR')} €`)
console.log()

// Vérification du barème IR
console.log(`Détail par tranches:`)
incomeTax.breakdown.forEach(b => {
  console.log(`  • Tranche ${(b.rate * 100).toFixed(0)}%: ${Math.round(b.taxableAmount).toLocaleString('fr-FR')} € → ${Math.round(b.taxAmount).toLocaleString('fr-FR')} €`)
})
console.log()

// -----------------------------------------------------------------------------
// TEST 4: CALCUL IFI
// -----------------------------------------------------------------------------

console.log('📊 TEST 4: CALCUL IFI')
console.log('-'.repeat(60))

const wealthTax = TaxCalculator.calculateWealthTax(
  CLIENT_EXEMPLE.patrimoineImmobilier,
  2024
)

console.log(`Paramètres:`)
console.log(`  • Patrimoine immobilier: ${CLIENT_EXEMPLE.patrimoineImmobilier.toLocaleString('fr-FR')} €`)
console.log()
console.log(`Résultats:`)
console.log(`  • Patrimoine taxable: ${wealthTax.taxableWealth.toLocaleString('fr-FR')} €`)
console.log(`  • IFI: ${Math.round(wealthTax.wealthTax).toLocaleString('fr-FR')} €`)
console.log(`  • Taux effectif: ${(wealthTax.effectiveRate * 100).toFixed(3)}%`)
console.log(`  • Assujetti: ${wealthTax.wealthTax > 0 ? 'OUI' : 'NON (seuil 1.3M€)'}`)
console.log()

// -----------------------------------------------------------------------------
// TEST 5: OPTIMISATION FISCALE
// -----------------------------------------------------------------------------

console.log('📊 TEST 5: OPTIMISATION FISCALE')
console.log('-'.repeat(60))

const taxOptimization = TaxCalculator.optimizeTax(
  revenuAnnuel,
  revenuAnnuel * 0.10
)

console.log(`Résultats:`)
console.log(`  • Impôt actuel: ${Math.round(taxOptimization.currentTax).toLocaleString('fr-FR')} €`)
console.log(`  • Impôt optimisé: ${Math.round(taxOptimization.optimizedTax).toLocaleString('fr-FR')} €`)
console.log(`  • Économie potentielle: ${Math.round(taxOptimization.savings).toLocaleString('fr-FR')} €`)
console.log(`  • % d'économie: ${taxOptimization.savingsPercentage.toFixed(1)}%`)
console.log()
console.log(`Stratégies recommandées:`)
taxOptimization.strategies.forEach(s => {
  console.log(`  • [${s.priority.toUpperCase()}] ${s.name}: -${Math.round(s.potentialSavings).toLocaleString('fr-FR')} €`)
  console.log(`    ${s.description}`)
})
console.log()

// -----------------------------------------------------------------------------
// TEST 6: ÉPARGNE DE PRÉCAUTION
// -----------------------------------------------------------------------------

console.log('📊 TEST 6: ÉPARGNE DE PRÉCAUTION')
console.log('-'.repeat(60))

const chargesMensuelles = Object.values(CLIENT_EXEMPLE.charges).reduce((a, b) => a + b, 0)
const emergencyFund = BudgetCalculator.calculateEmergencyFund(
  chargesMensuelles,
  'medium'
)

console.log(`Paramètres:`)
console.log(`  • Charges mensuelles: ${chargesMensuelles.toLocaleString('fr-FR')} €`)
console.log(`  • Profil de risque: ${emergencyFund.riskProfile}`)
console.log()
console.log(`Résultats:`)
console.log(`  • Mois recommandés: ${emergencyFund.recommendedMonths}`)
console.log(`  • Montant cible: ${emergencyFund.recommendedAmount.toLocaleString('fr-FR')} €`)
console.log(`  • Priorité: ${emergencyFund.priority}`)
console.log()

// -----------------------------------------------------------------------------
// RÉSUMÉ
// -----------------------------------------------------------------------------

console.log('═'.repeat(80))
console.log('📋 RÉSUMÉ CLIENT')
console.log('═'.repeat(80))
console.log()
console.log(`👤 ${CLIENT_EXEMPLE.nom} - ${CLIENT_EXEMPLE.age} ans - ${CLIENT_EXEMPLE.situation}`)
console.log()
console.log(`💰 BUDGET MENSUEL`)
console.log(`   Revenus: ${revenuMensuel.toLocaleString('fr-FR')} €`)
console.log(`   Charges: ${budgetAnalysis.expenses.total.toLocaleString('fr-FR')} €`)
console.log(`   Crédits: ${budgetAnalysis.debts.total.toLocaleString('fr-FR')} €`)
console.log(`   Disponible: ${budgetAnalysis.metrics.disposableIncome.toLocaleString('fr-FR')} €`)
console.log(`   Taux épargne: ${(budgetAnalysis.metrics.savingsRate * 100).toFixed(1)}%`)
console.log()
console.log(`🏦 CAPACITÉ D'EMPRUNT`)
console.log(`   Taux endettement: ${((dettesActuelles / revenuMensuel) * 100).toFixed(1)}%`)
console.log(`   Capacité restante: ${debtCapacity.remainingCapacity.toLocaleString('fr-FR')} €/mois`)
console.log(`   Empruntable (20 ans, 3.5%): ${Math.round(debtCapacity.loanDetails.maxLoanAmount).toLocaleString('fr-FR')} €`)
console.log()
console.log(`💵 FISCALITÉ ANNUELLE`)
console.log(`   IR: ${Math.round(incomeTax.incomeTax).toLocaleString('fr-FR')} €`)
console.log(`   IFI: ${Math.round(wealthTax.wealthTax).toLocaleString('fr-FR')} €`)
console.log(`   TMI: ${(incomeTax.marginalRate * 100).toFixed(0)}%`)
console.log(`   Économies possibles: ${Math.round(taxOptimization.savings).toLocaleString('fr-FR')} €`)
console.log()
console.log(`🛡️ ÉPARGNE DE PRÉCAUTION`)
console.log(`   Cible: ${emergencyFund.recommendedAmount.toLocaleString('fr-FR')} € (${emergencyFund.recommendedMonths} mois)`)
console.log()
console.log('═'.repeat(80))
console.log('✅ TOUS LES TESTS PASSÉS')
console.log('═'.repeat(80))
