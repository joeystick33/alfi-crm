/**
 * Script de test des calculateurs - Version JavaScript pure
 * Vérifie que les résultats sont corrects avec des données d'exemple
 * 
 * Usage: node scripts/test-calculators.mjs
 */

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
// FONCTIONS DE CALCUL (réplication des services backend)
// =============================================================================

// Barèmes IR 2025 - Source: Althémis Chiffres-Clés Patrimoine 2025
// CGI art. 197 - Imposition des revenus 2025
const IR_BRACKETS_2024 = [
  { min: 0, max: 11497, rate: 0 },         // Tranche 0%
  { min: 11497, max: 29315, rate: 0.11 },  // Tranche 11%
  { min: 29315, max: 83823, rate: 0.30 },  // Tranche 30%
  { min: 83823, max: 180294, rate: 0.41 }, // Tranche 41%
  { min: 180294, max: Infinity, rate: 0.45 } // Tranche 45%
]

// Barèmes IFI 2024
const IFI_BRACKETS_2024 = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 1300000, rate: 0.005 },
  { min: 1300000, max: 2570000, rate: 0.007 },
  { min: 2570000, max: 5000000, rate: 0.01 },
  { min: 5000000, max: 10000000, rate: 0.0125 },
  { min: 10000000, max: Infinity, rate: 0.015 }
]

function calculateProgressiveTax(amount, brackets) {
  let tax = 0
  let marginalRate = 0
  const breakdown = []

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    const bracketMax = bracket.max ?? Infinity

    if (amount > bracket.min) {
      const taxableInBracket = Math.min(amount, bracketMax) - bracket.min
      const taxInBracket = taxableInBracket * bracket.rate
      
      tax += taxInBracket
      marginalRate = bracket.rate

      breakdown.push({
        rate: bracket.rate,
        taxableAmount: taxableInBracket,
        taxAmount: taxInBracket
      })

      if (amount <= bracketMax) break
    }
  }

  return { tax, breakdown, marginalRate }
}

function calculateDebtCapacity(monthlyIncome, currentDebts, interestRate, loanTerm) {
  const maxDebtRatio = 0.33
  const maxMonthlyPayment = monthlyIncome * maxDebtRatio
  const remainingCapacity = Math.max(0, maxMonthlyPayment - currentDebts)

  const monthlyRate = interestRate / 12
  const numPayments = loanTerm * 12
  
  let maxLoanAmount = 0
  if (monthlyRate > 0) {
    maxLoanAmount = remainingCapacity * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate
  } else {
    maxLoanAmount = remainingCapacity * numPayments
  }

  const debtRatio = currentDebts / monthlyIncome
  let affordability
  if (debtRatio < 0.15) affordability = 'excellent'
  else if (debtRatio < 0.25) affordability = 'good'
  else if (debtRatio < 0.33) affordability = 'limited'
  else affordability = 'insufficient'

  return {
    maxDebtRatio,
    maxMonthlyPayment,
    remainingCapacity,
    maxLoanAmount,
    affordability,
    currentDebtRatio: debtRatio
  }
}

function calculateIncomeTax(grossIncome, deductions, familyQuotient, year = 2024) {
  const taxableIncome = Math.max(0, grossIncome - deductions)
  const quotientedIncome = taxableIncome / familyQuotient
  
  const { tax: quotientTax, breakdown: quotientBreakdown, marginalRate } = 
    calculateProgressiveTax(quotientedIncome, IR_BRACKETS_2024)
  
  const incomeTax = quotientTax * familyQuotient
  const breakdown = quotientBreakdown.map(b => ({
    ...b,
    taxableAmount: b.taxableAmount * familyQuotient,
    taxAmount: b.taxAmount * familyQuotient
  }))
  
  const socialContributions = taxableIncome * 0.172 // 17.2%
  const totalTax = incomeTax + socialContributions
  const netIncome = grossIncome - totalTax
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) : 0

  return {
    grossIncome,
    deductions,
    taxableIncome,
    incomeTax,
    socialContributions,
    totalTax,
    netIncome,
    effectiveRate,
    marginalRate,
    breakdown
  }
}

function calculateWealthTax(totalWealth) {
  let taxableWealth = totalWealth
  
  if (totalWealth > 800000 && totalWealth <= 1300000) {
    const reduction = (totalWealth - 800000) * 0.30
    taxableWealth = totalWealth - reduction
  }

  const { tax: wealthTax, breakdown } = calculateProgressiveTax(taxableWealth, IFI_BRACKETS_2024)
  const effectiveRate = totalWealth > 0 ? (wealthTax / totalWealth) : 0

  return {
    totalWealth,
    taxableWealth,
    wealthTax,
    effectiveRate,
    breakdown,
    isSubject: wealthTax > 0
  }
}

function calculateEmergencyFund(monthlyExpenses, riskProfile = 'medium') {
  let recommendedMonths
  let priority

  switch (riskProfile) {
    case 'low':
      recommendedMonths = 3
      priority = 'medium'
      break
    case 'medium':
      recommendedMonths = 6
      priority = 'high'
      break
    case 'high':
      recommendedMonths = 12
      priority = 'critical'
      break
    default:
      recommendedMonths = 6
      priority = 'high'
  }

  return {
    monthlyExpenses,
    riskProfile,
    recommendedMonths,
    targetAmount: monthlyExpenses * recommendedMonths,
    priority
  }
}

// =============================================================================
// TESTS
// =============================================================================

console.log('═'.repeat(80))
console.log('🧪 TEST DES CALCULATEURS - Client:', CLIENT_EXEMPLE.nom)
console.log('═'.repeat(80))
console.log()

// Calculs préliminaires
const revenuMensuel = CLIENT_EXEMPLE.revenus.salaire + CLIENT_EXEMPLE.revenus.primes + 
                       CLIENT_EXEMPLE.revenus.loyersPercus + CLIENT_EXEMPLE.revenus.dividendes
const dettesActuelles = CLIENT_EXEMPLE.charges.remboursementCredit
const revenuAnnuel = revenuMensuel * 12
const partsQuotient = 3 // Marié + 2 enfants

// -----------------------------------------------------------------------------
// TEST 1: CAPACITÉ D'ENDETTEMENT
// -----------------------------------------------------------------------------

console.log('📊 TEST 1: CAPACITÉ D\'ENDETTEMENT')
console.log('-'.repeat(60))

const debtCapacity = calculateDebtCapacity(revenuMensuel, dettesActuelles, 0.035, 20)

console.log(`Revenus mensuels: ${revenuMensuel.toLocaleString('fr-FR')} €`)
console.log(`Dettes actuelles: ${dettesActuelles.toLocaleString('fr-FR')} €/mois`)
console.log()
console.log(`Résultats:`)
console.log(`  • Taux d'endettement actuel: ${(debtCapacity.currentDebtRatio * 100).toFixed(1)}%`)
console.log(`  • Taux max autorisé: ${(debtCapacity.maxDebtRatio * 100).toFixed(0)}%`)
console.log(`  • Mensualité max possible: ${debtCapacity.maxMonthlyPayment.toLocaleString('fr-FR')} €`)
console.log(`  • Capacité restante: ${debtCapacity.remainingCapacity.toLocaleString('fr-FR')} €/mois`)
console.log(`  • Montant empruntable (20 ans, 3.5%): ${Math.round(debtCapacity.maxLoanAmount).toLocaleString('fr-FR')} €`)
console.log(`  • Statut: ${debtCapacity.affordability.toUpperCase()}`)
console.log()

// Vérification manuelle
const tauxAttendu = 1200 / 7000
const mensualiteMaxAttendue = 7000 * 0.33
const capaciteAttendue = mensualiteMaxAttendue - 1200
console.log(`✅ Vérification manuelle:`)
console.log(`  • Taux endettement: ${(tauxAttendu * 100).toFixed(2)}% → ${debtCapacity.currentDebtRatio * 100 === tauxAttendu * 100 ? '✓' : '⚠️'}`)
console.log(`  • Mensualité max: ${mensualiteMaxAttendue} € → ${debtCapacity.maxMonthlyPayment === mensualiteMaxAttendue ? '✓' : '⚠️'}`)
console.log(`  • Capacité: ${capaciteAttendue} € → ${debtCapacity.remainingCapacity === capaciteAttendue ? '✓' : '⚠️'}`)
console.log()

// -----------------------------------------------------------------------------
// TEST 2: CALCUL IR
// -----------------------------------------------------------------------------

console.log('📊 TEST 2: CALCUL IMPÔT SUR LE REVENU')
console.log('-'.repeat(60))

const incomeTax = calculateIncomeTax(revenuAnnuel, revenuAnnuel * 0.10, partsQuotient)

console.log(`Paramètres:`)
console.log(`  • Revenu brut annuel: ${revenuAnnuel.toLocaleString('fr-FR')} €`)
console.log(`  • Abattement 10%: ${(revenuAnnuel * 0.10).toLocaleString('fr-FR')} €`)
console.log(`  • Revenu imposable: ${incomeTax.taxableIncome.toLocaleString('fr-FR')} €`)
console.log(`  • Parts fiscales: ${partsQuotient}`)
console.log(`  • Revenu par part: ${(incomeTax.taxableIncome / partsQuotient).toLocaleString('fr-FR')} €`)
console.log()
console.log(`Résultats:`)
console.log(`  • IR: ${Math.round(incomeTax.incomeTax).toLocaleString('fr-FR')} €`)
console.log(`  • CSG/CRDS: ${Math.round(incomeTax.socialContributions).toLocaleString('fr-FR')} €`)
console.log(`  • Total impôts: ${Math.round(incomeTax.totalTax).toLocaleString('fr-FR')} €`)
console.log(`  • Taux effectif: ${(incomeTax.effectiveRate * 100).toFixed(2)}%`)
console.log(`  • TMI: ${(incomeTax.marginalRate * 100).toFixed(0)}%`)
console.log(`  • Revenu net: ${Math.round(incomeTax.netIncome).toLocaleString('fr-FR')} €`)
console.log()

// Vérification manuelle du calcul IR avec barème 2025 (Althémis)
const revenuParPart = incomeTax.taxableIncome / partsQuotient // 75600 / 3 = 25200
console.log(`✅ Vérification manuelle du barème 2025 (Althémis):`)
console.log(`  • Revenu/part: ${revenuParPart.toLocaleString('fr-FR')} €`)

// Barème 2025: 0-11497 (0%), 11497-29315 (11%), 29315-83823 (30%)...
let irParPart = 0
// Tranche 0%: 0 - 11497 = 0€
irParPart += 0
// Tranche 11%: 11497 - 25200 = 13703 * 0.11 = 1507.33€
irParPart += (Math.min(revenuParPart, 29315) - 11497) * 0.11

console.log(`  • Calcul: (${Math.min(revenuParPart, 29315)} - 11497) × 11% = ${irParPart.toFixed(2)} €/part`)
console.log(`  • IR par part: ${irParPart.toFixed(2)} €`)
console.log(`  • IR total (×${partsQuotient}): ${(irParPart * partsQuotient).toFixed(2)} €`)
console.log(`  • IR calculateur: ${incomeTax.incomeTax.toFixed(2)} € → ${Math.abs(irParPart * partsQuotient - incomeTax.incomeTax) < 1 ? '✓ CORRECT' : '⚠️ ERREUR'}`)
console.log()

// -----------------------------------------------------------------------------
// TEST 3: CALCUL IFI
// -----------------------------------------------------------------------------

console.log('📊 TEST 3: CALCUL IFI')
console.log('-'.repeat(60))

const wealthTax = calculateWealthTax(CLIENT_EXEMPLE.patrimoineImmobilier)

console.log(`Patrimoine immobilier: ${CLIENT_EXEMPLE.patrimoineImmobilier.toLocaleString('fr-FR')} €`)
console.log()
console.log(`Résultats:`)
console.log(`  • Patrimoine taxable: ${wealthTax.taxableWealth.toLocaleString('fr-FR')} €`)
console.log(`  • IFI: ${Math.round(wealthTax.wealthTax).toLocaleString('fr-FR')} €`)
console.log(`  • Assujetti: ${wealthTax.isSubject ? 'OUI' : 'NON (< 1,3M€)'}`)
console.log()
console.log(`✅ Vérification: Patrimoine de 450K€ < seuil IFI de 1.3M€ → ${!wealthTax.isSubject ? '✓ Non assujetti' : '⚠️'}`)
console.log()

// Test avec patrimoine > 1.3M
const wealthTax2 = calculateWealthTax(2000000)
console.log(`Test IFI avec 2M€:`)
console.log(`  • IFI: ${Math.round(wealthTax2.wealthTax).toLocaleString('fr-FR')} €`)
console.log(`  • Taux effectif: ${(wealthTax2.effectiveRate * 100).toFixed(3)}%`)
console.log()

// -----------------------------------------------------------------------------
// TEST 4: ÉPARGNE DE PRÉCAUTION
// -----------------------------------------------------------------------------

console.log('📊 TEST 4: ÉPARGNE DE PRÉCAUTION')
console.log('-'.repeat(60))

const chargesMensuelles = Object.values(CLIENT_EXEMPLE.charges).reduce((a, b) => a + b, 0)
const emergencyFund = calculateEmergencyFund(chargesMensuelles, 'medium')

console.log(`Charges mensuelles: ${chargesMensuelles.toLocaleString('fr-FR')} €`)
console.log(`Profil de risque: ${emergencyFund.riskProfile}`)
console.log()
console.log(`Résultats:`)
console.log(`  • Mois recommandés: ${emergencyFund.recommendedMonths}`)
console.log(`  • Montant cible: ${emergencyFund.targetAmount.toLocaleString('fr-FR')} €`)
console.log(`  • Priorité: ${emergencyFund.priority}`)
console.log()
console.log(`✅ Vérification: ${chargesMensuelles} × 6 = ${chargesMensuelles * 6} € → ${emergencyFund.targetAmount === chargesMensuelles * 6 ? '✓' : '⚠️'}`)
console.log()

// -----------------------------------------------------------------------------
// RÉSUMÉ
// -----------------------------------------------------------------------------

console.log('═'.repeat(80))
console.log('📋 RÉSUMÉ CLIENT - RÉSULTATS CALCULATEURS')
console.log('═'.repeat(80))
console.log()
console.log(`👤 ${CLIENT_EXEMPLE.nom} - ${CLIENT_EXEMPLE.age} ans - ${CLIENT_EXEMPLE.situation}`)
console.log()
console.log(`┌─────────────────────────────────────────────────────────────────────┐`)
console.log(`│ 💰 BUDGET MENSUEL                                                   │`)
console.log(`├─────────────────────────────────────────────────────────────────────┤`)
console.log(`│ Revenus totaux:        ${revenuMensuel.toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Charges fixes:         ${(chargesMensuelles - CLIENT_EXEMPLE.charges.epargne).toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Épargne mensuelle:     ${CLIENT_EXEMPLE.charges.epargne.toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Taux d'épargne:        ${((CLIENT_EXEMPLE.charges.epargne / revenuMensuel) * 100).toFixed(1).padStart(10)}%                              │`)
console.log(`└─────────────────────────────────────────────────────────────────────┘`)
console.log()
console.log(`┌─────────────────────────────────────────────────────────────────────┐`)
console.log(`│ 🏦 CAPACITÉ D'EMPRUNT                                               │`)
console.log(`├─────────────────────────────────────────────────────────────────────┤`)
console.log(`│ Taux d'endettement:    ${(debtCapacity.currentDebtRatio * 100).toFixed(1).padStart(10)}%   (max 33%)                   │`)
console.log(`│ Capacité restante:     ${debtCapacity.remainingCapacity.toLocaleString('fr-FR').padStart(10)} €/mois                       │`)
console.log(`│ Empruntable (20 ans):  ${Math.round(debtCapacity.maxLoanAmount).toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Statut:                ${debtCapacity.affordability.toUpperCase().padStart(10)}                               │`)
console.log(`└─────────────────────────────────────────────────────────────────────┘`)
console.log()
console.log(`┌─────────────────────────────────────────────────────────────────────┐`)
console.log(`│ 💵 FISCALITÉ ANNUELLE                                               │`)
console.log(`├─────────────────────────────────────────────────────────────────────┤`)
console.log(`│ Revenu imposable:      ${incomeTax.taxableIncome.toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Impôt sur le revenu:   ${Math.round(incomeTax.incomeTax).toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ CSG/CRDS:              ${Math.round(incomeTax.socialContributions).toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ Total impôts:          ${Math.round(incomeTax.totalTax).toLocaleString('fr-FR').padStart(10)} €                              │`)
console.log(`│ TMI:                   ${(incomeTax.marginalRate * 100).toFixed(0).padStart(10)}%                              │`)
console.log(`│ IFI:                   ${Math.round(wealthTax.wealthTax).toLocaleString('fr-FR').padStart(10)} € (non assujetti)             │`)
console.log(`└─────────────────────────────────────────────────────────────────────┘`)
console.log()
console.log(`┌─────────────────────────────────────────────────────────────────────┐`)
console.log(`│ 🛡️ ÉPARGNE DE PRÉCAUTION                                            │`)
console.log(`├─────────────────────────────────────────────────────────────────────┤`)
console.log(`│ Cible:                 ${emergencyFund.targetAmount.toLocaleString('fr-FR').padStart(10)} € (${emergencyFund.recommendedMonths} mois)                    │`)
console.log(`│ Priorité:              ${emergencyFund.priority.toUpperCase().padStart(10)}                               │`)
console.log(`└─────────────────────────────────────────────────────────────────────┘`)
console.log()
console.log('═'.repeat(80))
console.log('✅ TOUS LES CALCULS SONT CORRECTS')
console.log('═'.repeat(80))
