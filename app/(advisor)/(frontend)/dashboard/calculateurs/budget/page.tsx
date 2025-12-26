'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/app/_common/components/ui/Button'
import { 
  ArrowLeft, 
  Wallet,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  PiggyBank,
  Home,
  Car,
  Utensils,
  Heart,
  CreditCard,
  Briefcase,
  Gift,
  Building,
  Zap,
  Shield,
  GraduationCap,
  Gamepad2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  AlertOctagon,
  ThumbsUp,
  ChevronRight,
  Target,
  BarChart3,
  PieChart,
} from 'lucide-react'
import {
  ENDETTEMENT_2025,
} from './parameters-budget-2025'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface Income {
  salary: string
  bonuses: string
  rentalIncome: string
  investmentIncome: string
  otherIncome: string
}

interface Expenses {
  housing: string
  utilities: string
  food: string
  transportation: string
  insurance: string
  healthcare: string
  education: string
  entertainment: string
  savings: string
  otherExpenses: string
}

interface Debts {
  mortgage: string
  consumerLoans: string
  creditCards: string
  studentLoans: string
  otherDebts: string
}

interface BudgetResult {
  synthese: {
    santeBudgetaire: {
      niveau: 'excellent' | 'bonne' | 'attention' | 'critique'
      label: string
      color: string
      score: number
    }
    totalRevenus: number
    totalDepenses: number
    totalDettes: number
    resteAVivre: number
  }
  metriques: {
    tauxEpargne: number
    tauxEndettement: number
    tauxDepenses: number
    ratioLogement: number
  }
  revenus: {
    total: number
    detail: Record<string, number>
  }
  depenses: {
    total: number
    categories: Array<{
      id: string
      label: string
      montant: number
      pourcentage: number
      seuilMax: number
      statut: 'ok' | 'warning' | 'alert'
    }>
  }
  dettes: {
    total: number
    detail: Record<string, number>
  }
  repartition50_30_20: {
    besoins: { montant: number; pourcentage: number; objectif: number; ecart: number; statut: string }
    envies: { montant: number; pourcentage: number; objectif: number; ecart: number; statut: string }
    epargne: { montant: number; pourcentage: number; objectif: number; ecart: number; statut: string }
  }
  capaciteEmprunt: {
    mensualiteMaximale: number
    capaciteRestante: number
    capitalEmpruntable: number
    tauxUtilise: number
    tauxDisponible: number
  }
  epargnePrecaution: {
    moisRecommandes: number
    depensesMensuelles: number
    montantRecommande: number
    profil: string
  }
  alertes: string[]
  recommandations: string[]
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function BudgetPage() {
  // États du formulaire
  const [income, setIncome] = useState<Income>({
    salary: '4000',
    bonuses: '500',
    rentalIncome: '0',
    investmentIncome: '0',
    otherIncome: '0',
  })

  const [expenses, setExpenses] = useState<Expenses>({
    housing: '1200',
    utilities: '150',
    food: '400',
    transportation: '300',
    insurance: '200',
    healthcare: '100',
    education: '0',
    entertainment: '200',
    savings: '500',
    otherExpenses: '100',
  })

  const [debts, setDebts] = useState<Debts>({
    mortgage: '0',
    consumerLoans: '0',
    creditCards: '0',
    studentLoans: '0',
    otherDebts: '0',
  })

  const [profilProfessionnel, setProfilProfessionnel] = useState<string>('CDI_PME')
  const [activeSection, setActiveSection] = useState<'income' | 'expenses' | 'debts'>('income')
  const [result, setResult] = useState<BudgetResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Calculs en temps réel
  const totalIncome = Object.values(income).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  const totalDebts = Object.values(debts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  const balance = totalIncome - totalExpenses - totalDebts

  // Formatage
  const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const fmtPct = (n: number) => `${n.toFixed(1)}%`

  // Analyse du budget
  const analyserBudget = async () => {
    if (totalIncome <= 0) {
      setError('Veuillez entrer au moins un revenu')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/advisor/simulators/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: {
            salary: parseFloat(income.salary) || 0,
            bonuses: parseFloat(income.bonuses) || 0,
            rentalIncome: parseFloat(income.rentalIncome) || 0,
            investmentIncome: parseFloat(income.investmentIncome) || 0,
            otherIncome: parseFloat(income.otherIncome) || 0,
          },
          expenses: {
            housing: parseFloat(expenses.housing) || 0,
            utilities: parseFloat(expenses.utilities) || 0,
            food: parseFloat(expenses.food) || 0,
            transportation: parseFloat(expenses.transportation) || 0,
            insurance: parseFloat(expenses.insurance) || 0,
            healthcare: parseFloat(expenses.healthcare) || 0,
            education: parseFloat(expenses.education) || 0,
            entertainment: parseFloat(expenses.entertainment) || 0,
            savings: parseFloat(expenses.savings) || 0,
            otherExpenses: parseFloat(expenses.otherExpenses) || 0,
          },
          debts: {
            mortgage: parseFloat(debts.mortgage) || 0,
            consumerLoans: parseFloat(debts.consumerLoans) || 0,
            creditCards: parseFloat(debts.creditCards) || 0,
            studentLoans: parseFloat(debts.studentLoans) || 0,
            otherDebts: parseFloat(debts.otherDebts) || 0,
          },
          profilProfessionnel,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur lors de l\'analyse')
      }

      const data = await response.json()
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse du budget')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setIncome({ salary: '4000', bonuses: '500', rentalIncome: '0', investmentIncome: '0', otherIncome: '0' })
    setExpenses({ housing: '1200', utilities: '150', food: '400', transportation: '300', insurance: '200', healthcare: '100', education: '0', entertainment: '200', savings: '500', otherExpenses: '100' })
    setDebts({ mortgage: '0', consumerLoans: '0', creditCards: '0', studentLoans: '0', otherDebts: '0' })
    setResult(null)
    setError('')
  }

  // Icône de santé budgétaire
  const getSanteIcon = (niveau: string) => {
    switch (niveau) {
      case 'excellent': return <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      case 'bonne': return <ThumbsUp className="h-8 w-8 text-blue-600" />
      case 'attention': return <AlertTriangle className="h-8 w-8 text-amber-600" />
      case 'critique': return <AlertOctagon className="h-8 w-8 text-red-600" />
      default: return <Info className="h-8 w-8 text-gray-600" />
    }
  }

  const getSanteColor = (niveau: string) => {
    switch (niveau) {
      case 'excellent': return 'emerald'
      case 'bonne': return 'blue'
      case 'attention': return 'amber'
      case 'critique': return 'red'
      default: return 'gray'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/dashboard/calculateurs" className="hover:text-blue-600 transition-colors">
                Calculateurs
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-700">Analyseur de Budget</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Wallet className="h-7 w-7 text-blue-600" />
              </div>
              Analyseur de Budget 2025
            </h1>
            <p className="text-slate-600 mt-1">
              Analyse complète selon la règle 50/30/20 avec recommandations personnalisées
            </p>
          </div>
          <Link href="/dashboard/calculateurs">
            <Button variant="outline" className="border-slate-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>

        {/* Info pédagogique */}
        <div className="sim-card bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">La règle budgétaire 50/30/20</h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>50%</strong> pour les besoins essentiels (logement, alimentation, transport) • 
                <strong> 30%</strong> pour les envies (loisirs, sorties) • 
                <strong> 20%</strong> pour l'épargne et le remboursement de dettes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Résumé temps réel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sim-card bg-emerald-50 border-emerald-200">
                <p className="text-xs text-emerald-600 font-medium">Revenus</p>
                <p className="text-xl font-bold text-emerald-700">{fmtEur(totalIncome)}</p>
              </div>
              <div className="sim-card bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-600 font-medium">Dépenses</p>
                <p className="text-xl font-bold text-blue-700">{fmtEur(totalExpenses)}</p>
              </div>
              <div className="sim-card bg-red-50 border-red-200">
                <p className="text-xs text-red-600 font-medium">Dettes</p>
                <p className="text-xl font-bold text-red-700">{fmtEur(totalDebts)}</p>
              </div>
              <div className={`sim-card ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Solde</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmtEur(balance)}</p>
              </div>
            </div>

            {/* Navigation par sections */}
            <div className="sim-card">
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {[
                  { key: 'income', label: 'Revenus', icon: TrendingUp, color: 'emerald' },
                  { key: 'expenses', label: 'Dépenses', icon: PieChart, color: 'blue' },
                  { key: 'debts', label: 'Dettes', icon: CreditCard, color: 'red' },
                ].map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key as 'income' | 'expenses' | 'debts')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 -mb-[2px] transition-all ${
                      activeSection === section.key
                        ? `border-${section.color}-500 text-${section.color}-600`
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
              </div>

              {/* Section Revenus */}
              {activeSection === 'income' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Revenus mensuels nets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'salary', label: 'Salaire net', icon: Briefcase, placeholder: '4000' },
                      { key: 'bonuses', label: 'Primes mensualisées', icon: Gift, placeholder: '500' },
                      { key: 'rentalIncome', label: 'Revenus locatifs', icon: Building, placeholder: '0' },
                      { key: 'investmentIncome', label: 'Revenus placements', icon: TrendingUp, placeholder: '0' },
                      { key: 'otherIncome', label: 'Autres revenus', icon: Wallet, placeholder: '0' },
                    ].map((field) => {
                      const Icon = field.icon
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-emerald-500" />
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={income[field.key as keyof Income]}
                              onChange={(e) => setIncome({ ...income, [field.key]: e.target.value })}
                              className="w-full h-11 pl-3 pr-8 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                              placeholder={field.placeholder}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section Dépenses */}
              {activeSection === 'expenses' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Dépenses mensuelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[
                      { key: 'housing', label: 'Logement', icon: Home, placeholder: '1200', tip: 'Max 33%' },
                      { key: 'utilities', label: 'Charges', icon: Zap, placeholder: '150' },
                      { key: 'food', label: 'Alimentation', icon: Utensils, placeholder: '400' },
                      { key: 'transportation', label: 'Transport', icon: Car, placeholder: '300' },
                      { key: 'insurance', label: 'Assurances', icon: Shield, placeholder: '200' },
                      { key: 'healthcare', label: 'Santé', icon: Heart, placeholder: '100' },
                      { key: 'education', label: 'Éducation', icon: GraduationCap, placeholder: '0' },
                      { key: 'entertainment', label: 'Loisirs', icon: Gamepad2, placeholder: '200' },
                      { key: 'savings', label: 'Épargne', icon: PiggyBank, placeholder: '500', tip: 'Objectif 20%' },
                      { key: 'otherExpenses', label: 'Autres', icon: MoreHorizontal, placeholder: '100' },
                    ].map((field) => {
                      const Icon = field.icon
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-blue-500" />
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={expenses[field.key as keyof Expenses]}
                              onChange={(e) => setExpenses({ ...expenses, [field.key]: e.target.value })}
                              className="w-full h-11 pl-3 pr-8 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder={field.placeholder}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                          </div>
                          {field.tip && <p className="text-xs text-slate-500">{field.tip}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Section Dettes */}
              {activeSection === 'debts' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    Remboursements mensuels de dettes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'mortgage', label: 'Crédit immobilier', icon: Home, placeholder: '0' },
                      { key: 'consumerLoans', label: 'Crédits conso', icon: CreditCard, placeholder: '0' },
                      { key: 'creditCards', label: 'Cartes revolving', icon: AlertTriangle, placeholder: '0', alert: true },
                      { key: 'studentLoans', label: 'Prêt étudiant', icon: GraduationCap, placeholder: '0' },
                      { key: 'otherDebts', label: 'Autres dettes', icon: MoreHorizontal, placeholder: '0' },
                    ].map((field) => {
                      const Icon = field.icon
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <label className={`text-sm font-medium flex items-center gap-1.5 ${field.alert ? 'text-red-600' : 'text-slate-700'}`}>
                            <Icon className={`h-4 w-4 ${field.alert ? 'text-red-500' : 'text-red-500'}`} />
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={debts[field.key as keyof Debts]}
                              onChange={(e) => setDebts({ ...debts, [field.key]: e.target.value })}
                              className={`w-full h-11 pl-3 pr-8 rounded-lg border ${field.alert ? 'border-red-200 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-red-500 focus:ring-red-200'} transition-all focus:ring-2`}
                              placeholder={field.placeholder}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                          </div>
                          {field.alert && <p className="text-xs text-red-500">⚠️ Taux élevés, rembourser en priorité</p>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Profil professionnel */}
                  <div className="pt-4 border-t border-slate-200">
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Profil professionnel (pour l'épargne de précaution)
                    </label>
                    <select
                      value={profilProfessionnel}
                      onChange={(e) => setProfilProfessionnel(e.target.value)}
                      className="w-full md:w-auto h-11 px-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value="FONCTIONNAIRE">Fonctionnaire (3 mois recommandés)</option>
                      <option value="CDI_GRANDE_ENTREPRISE">CDI Grande entreprise (4 mois)</option>
                      <option value="CDI_PME">CDI PME (6 mois)</option>
                      <option value="CDD_INTERIM">CDD / Intérim (9 mois)</option>
                      <option value="TNS_INDEPENDANT">TNS / Indépendant (12 mois)</option>
                      <option value="RETRAITE">Retraité (6 mois)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Bouton d'analyse */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6 mt-6 border-t border-slate-200">
                <Button
                  onClick={analyserBudget}
                  disabled={loading || totalIncome <= 0}
                  size="lg"
                  className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold btn-primary shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Analyser mon budget
                    </>
                  )}
                </Button>
                {result && (
                  <Button variant="outline" size="lg" onClick={resetForm} className="border-slate-200">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              {/* Erreur */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Rappels */}
          <div className="space-y-6">
            {/* Rappel règle 50/30/20 */}
            <div className="sim-card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Objectifs budgétaires
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Besoins essentiels</span>
                  <span className="font-bold text-blue-800">≤ 50%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm text-amber-700">Envies / Loisirs</span>
                  <span className="font-bold text-amber-800">≤ 30%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-emerald-700">Épargne</span>
                  <span className="font-bold text-emerald-800">≥ 20%</span>
                </div>
              </div>
            </div>

            {/* Rappel endettement */}
            <div className="sim-card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Taux d'endettement
              </h3>
              <div className="space-y-2 text-sm">
                {ENDETTEMENT_2025.NIVEAUX.slice(0, 5).map((niveau, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className={`text-${niveau.color}-700`}>{niveau.label}</span>
                    <span className="text-slate-600">≤ {niveau.max}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Le seuil HCSF de 35% s'applique aux nouveaux crédits immobiliers depuis 2022.
              </p>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {result && (
          <div className="space-y-6 mt-8">
            {/* Santé budgétaire */}
            <div className={`sim-card bg-${getSanteColor(result.synthese.santeBudgetaire.niveau)}-50 border-${getSanteColor(result.synthese.santeBudgetaire.niveau)}-200`}>
              <div className="flex items-center gap-4">
                {getSanteIcon(result.synthese.santeBudgetaire.niveau)}
                <div>
                  <p className="text-sm font-medium text-slate-600">Santé budgétaire</p>
                  <p className={`text-2xl font-bold text-${getSanteColor(result.synthese.santeBudgetaire.niveau)}-700`}>
                    {result.synthese.santeBudgetaire.label}
                  </p>
                </div>
                <div className="ml-auto">
                  <div className={`text-4xl font-bold text-${getSanteColor(result.synthese.santeBudgetaire.niveau)}-600`}>
                    {result.synthese.santeBudgetaire.score}/100
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sim-card text-center">
                <p className="text-sm text-slate-500">Taux d'épargne</p>
                <p className={`text-2xl font-bold ${result.metriques.tauxEpargne >= 20 ? 'text-emerald-600' : result.metriques.tauxEpargne >= 10 ? 'text-blue-600' : 'text-red-600'}`}>
                  {fmtPct(result.metriques.tauxEpargne)}
                </p>
                <p className="text-xs text-slate-400">Objectif : ≥ 20%</p>
              </div>
              <div className="sim-card text-center">
                <p className="text-sm text-slate-500">Taux d'endettement</p>
                <p className={`text-2xl font-bold ${result.metriques.tauxEndettement <= 25 ? 'text-emerald-600' : result.metriques.tauxEndettement <= 35 ? 'text-amber-600' : 'text-red-600'}`}>
                  {fmtPct(result.metriques.tauxEndettement)}
                </p>
                <p className="text-xs text-slate-400">Max HCSF : 35%</p>
              </div>
              <div className="sim-card text-center">
                <p className="text-sm text-slate-500">Ratio logement</p>
                <p className={`text-2xl font-bold ${result.metriques.ratioLogement <= 33 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {fmtPct(result.metriques.ratioLogement)}
                </p>
                <p className="text-xs text-slate-400">Idéal : ≤ 33%</p>
              </div>
              <div className="sim-card text-center">
                <p className="text-sm text-slate-500">Reste à vivre</p>
                <p className={`text-2xl font-bold ${result.synthese.resteAVivre >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmtEur(result.synthese.resteAVivre)}
                </p>
                <p className="text-xs text-slate-400">Par mois</p>
              </div>
            </div>

            {/* Répartition 50/30/20 */}
            <div className="sim-card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Répartition selon la règle 50/30/20
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Besoins */}
                <div className={`p-4 rounded-xl border-2 ${result.repartition50_30_20.besoins.statut === 'ok' ? 'bg-blue-50 border-blue-200' : result.repartition50_30_20.besoins.statut === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Besoins essentiels</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-current opacity-80">Objectif : 50%</span>
                  </div>
                  <div className="text-3xl font-bold">{fmtPct(result.repartition50_30_20.besoins.pourcentage)}</div>
                  <div className="text-sm text-slate-600">{fmtEur(result.repartition50_30_20.besoins.montant)}</div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${result.repartition50_30_20.besoins.statut === 'ok' ? 'bg-blue-500' : result.repartition50_30_20.besoins.statut === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(result.repartition50_30_20.besoins.pourcentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Envies */}
                <div className={`p-4 rounded-xl border-2 ${result.repartition50_30_20.envies.statut === 'ok' ? 'bg-amber-50 border-amber-200' : result.repartition50_30_20.envies.statut === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Envies / Loisirs</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/80">Objectif : 30%</span>
                  </div>
                  <div className="text-3xl font-bold">{fmtPct(result.repartition50_30_20.envies.pourcentage)}</div>
                  <div className="text-sm text-slate-600">{fmtEur(result.repartition50_30_20.envies.montant)}</div>
                  <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${result.repartition50_30_20.envies.statut === 'ok' ? 'bg-amber-500' : result.repartition50_30_20.envies.statut === 'warning' ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(result.repartition50_30_20.envies.pourcentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Épargne */}
                <div className={`p-4 rounded-xl border-2 ${result.repartition50_30_20.epargne.statut === 'ok' ? 'bg-emerald-50 border-emerald-200' : result.repartition50_30_20.epargne.statut === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Épargne</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-current opacity-80">Objectif : 20%</span>
                  </div>
                  <div className="text-3xl font-bold">{fmtPct(result.repartition50_30_20.epargne.pourcentage)}</div>
                  <div className="text-sm text-slate-600">{fmtEur(result.repartition50_30_20.epargne.montant)}</div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${result.repartition50_30_20.epargne.statut === 'ok' ? 'bg-emerald-500' : result.repartition50_30_20.epargne.statut === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(result.repartition50_30_20.epargne.pourcentage * 5, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Capacité d'emprunt et Épargne de précaution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capacité d'emprunt */}
              <div className="sim-card">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  Capacité d'emprunt restante
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mensualité max (35%)</span>
                    <span className="font-bold">{fmtEur(result.capaciteEmprunt.mensualiteMaximale)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Dettes actuelles</span>
                    <span className="font-bold text-red-600">-{fmtEur(result.dettes.total)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-slate-600">Capacité restante</span>
                    <span className="font-bold text-emerald-600">{fmtEur(result.capaciteEmprunt.capaciteRestante)}</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg mt-3">
                    <p className="text-sm text-blue-700">
                      <strong>Capital empruntable :</strong> ~{fmtEur(result.capaciteEmprunt.capitalEmpruntable)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">(Estimation à 4% sur 20 ans)</p>
                  </div>
                </div>
              </div>

              {/* Épargne de précaution */}
              <div className="sim-card">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-emerald-600" />
                  Épargne de précaution recommandée
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Profil</span>
                    <span className="font-medium">{result.epargnePrecaution.profil.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Dépenses mensuelles</span>
                    <span className="font-bold">{fmtEur(result.epargnePrecaution.depensesMensuelles)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mois recommandés</span>
                    <span className="font-bold">{result.epargnePrecaution.moisRecommandes} mois</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg mt-3">
                    <p className="text-sm text-emerald-700">
                      <strong>Montant cible :</strong> {fmtEur(result.epargnePrecaution.montantRecommande)}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">À placer sur Livret A, LDDS ou LEP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Détail des dépenses par catégorie */}
            <div className="sim-card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Répartition des dépenses par catégorie
              </h3>
              <div className="space-y-3">
                {result.depenses.categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600">{cat.label}</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cat.statut === 'ok' ? 'bg-blue-500' : cat.statut === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(cat.pourcentage * 2, 100)}%` }}
                      />
                    </div>
                    <div className="w-20 text-right">
                      <span className="font-medium">{fmtPct(cat.pourcentage)}</span>
                    </div>
                    <div className="w-24 text-right text-sm text-slate-600">
                      {fmtEur(cat.montant)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertes */}
            {result.alertes.length > 0 && (
              <div className="sim-card bg-red-50 border-red-200">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes
                </h3>
                <ul className="space-y-2">
                  {result.alertes.map((alerte, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {alerte}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommandations */}
            {result.recommandations.length > 0 && (
              <div className="sim-card bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Recommandations personnalisées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.recommandations.map((rec, i) => (
                    <div key={i} className="p-3 bg-white border border-blue-100 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
