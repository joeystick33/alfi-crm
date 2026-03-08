'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePlotlyReady } from '../immobilier/_hooks/usePlotlyReady'
import {
  Search, Baby, FileText, Wallet, PersonStanding, Accessibility,
  Building2, Briefcase, CheckCircle, Lightbulb, BarChart3, Calendar,
  AlertTriangle, Target, TrendingUp, Trophy, Scale, RefreshCw, CircleDot,
  Gift, FileEdit, Coins, Clock,
} from 'lucide-react'

// Types

/** Declare Plotly on window for chart rendering */
declare global {
  interface Window {
    Plotly?: {
      newPlot: (id: string, data: unknown[], layout: unknown, config?: unknown) => void
    }
  }
}

/** Projection data point for charts */
interface ProjectionDataPoint {
  age: number
  savingsBalance: number
  totalContributions: number
  annualWithdrawal: number
  phase: string
}

/** Scenario comparison result */
interface ScenarioComparisonResult {
  scenarios: Array<{
    name: string
    retirementAge: number
    savingsAtRetirement: number
    sustainableMonthlyIncome: number
    isRetirementFeasible: boolean
    isBestScenario?: boolean
  }>
  bestScenario?: { name: string }
  summary: string
}

/** Helper to get error message from unknown error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erreur inconnue'
}

interface PensionResult {
  monthlyPension: number
  annualPension: number
  monthlyBasePension: number
  monthlyComplementaryPension: number
  basePercentage: number
  complementaryPercentage: number
  replacementRate: number
  replacementRatePercent: number
  quartersValidated: number
  quartersRequired: number
  missingQuarters: number
  pensionRate: number
  hasDiscount: boolean
  discountRate: number
  hasBonus: boolean
  bonusRate: number
  legalRetirementAge: number
  birthYear: number
  recommendations: Array<{ priorite: string; type: string; description: string }>
  
  // Champs additionnels
  quartersAlreadyValidated?: number
  futureQuarters?: number
  optimalAge?: number
  
  complementaryDetails?: {
    pensionMensuelleNette: number
    pensionAnnuelleNette: number
    nomRegime: string
    valeurPoint: number
    points: {
      total: number
      existants: number
      projetes: number
      gratuits: number
    }
    coefficients: {
      solidarite: { valeur: number; explication: string }
      majorationFamille: number
    }
    detailCalcul?: {
      formule: string
      etapes: string[]
    }
  }

  projectionByAge?: Array<{
    age: number
    quartersAtAge: number
    missingAtAge: number
    monthlyPension: number
    replacementRatePercent: number
    hasDiscount: boolean
    discountPercent: number
    hasBonus: boolean
    bonusPercent: number
    vsBaseline: number
  }>

  detailedQuartersAnalysis?: {
    validated: {
      totalValides: number
      cotises: { total: number; detail: Array<{ source: string; trimestres: number }> }
      assimiles: { total: number; detail: Array<{ source: string; trimestres: number; limite?: string }> }
      majorations: { total: number; detail: Array<{ source: string; trimestres: number; conditions?: string }> }
    }
    supplementairesGratuits: {
      total: number
      detail: Array<{ source: string; trimestres: number; conditions: string; demarche: string }>
    }
    rachetables: {
      total: number
      detail: Array<{ source: string; trimestres: number; coutEstime?: string; interet: string }>
    }
    carriereLongue: {
      eligible: boolean
      ageDepart?: number
      conditions: string[]
    }
    synthese: {
      totalActuel: number
      totalPotentiel: number
      manquantsTauxPlein: number
      conseilsPrioritaires: string[]
    }
  }
}

interface ProjectionResult {
  savingsAtRetirement: number
  totalContributions: number
  investmentGains: number
  gainPercentage: number
  sustainableAnnualIncome: number
  sustainableMonthlyIncome: number
  incomeShortfall: number
  isRetirementFeasible: boolean
  capitalExhaustionAge: number | null
  capitalLastsUntil: number
  projection: Array<{
    age: number
    savingsBalance: number
    totalContributions: number
    annualWithdrawal: number
    phase: string
  }>
  recommendations: Array<{ priorite: string; type: string; description: string }>
}

interface Scenario {
  nom: string
  retirementAge: number
  monthlyContribution: number
  expectedReturn: number
}

// Styles
const styles = `
  :root { --pri: #1e40af; --pril: #3b82f6; --suc: #059669; --warn: #d97706; --err: #dc2626; --bg: #ffffff; --bgm: #f8fafc; --brd: #e2e8f0; --txt: #1e293b; --txtm: #64748b; }
  .pw { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
  .ph { margin-bottom: 2rem; }
  .ph h1 { font-size: 1.75rem; font-weight: 700; color: var(--txt); margin: .5rem 0; }
  .ph p { color: var(--txtm); font-size: .95rem; }
  
  /* Steps Navigation */
  .steps { display: flex; gap: .5rem; margin-bottom: 2rem; background: var(--bgm); padding: 1rem; border-radius: 1rem; }
  .step { flex: 1; padding: 1rem; border-radius: .75rem; cursor: pointer; transition: all .2s; border: 2px solid transparent; text-align: center; }
  .step:hover { background: #fff; }
  .step.active { background: #fff; border-color: var(--pri); box-shadow: 0 2px 8px rgba(30,64,175,.15); }
  .step.done { background: #ecfdf5; border-color: var(--suc); }
  .step.locked { opacity: .5; cursor: not-allowed; }
  .step-n { font-size: 1.5rem; font-weight: 700; }
  .step.active .step-n { color: var(--pri); }
  .step.done .step-n { color: var(--suc); }
  .step-t { font-size: .85rem; font-weight: 600; margin-top: .25rem; }
  .step-d { font-size: .75rem; color: var(--txtm); margin-top: .25rem; }
  
  /* Cards */
  .card { background: var(--bg); border: 1px solid var(--brd); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card-p { border-left: 4px solid var(--pri); }
  .card-s { border-left: 4px solid var(--suc); }
  .card-w { border-left: 4px solid var(--warn); }
  .card-t { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: .5rem; }
  
  /* Form */
  .fg { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
  .fgrp { display: flex; flex-direction: column; gap: .25rem; }
  .flbl { font-size: .8rem; font-weight: 500; color: var(--txt); }
  .finp { padding: .6rem .75rem; border: 1px solid var(--brd); border-radius: .5rem; font-size: .95rem; transition: border-color .2s; }
  .finp:focus { outline: none; border-color: var(--pri); }
  .finp:disabled { background: #f1f5f9; cursor: not-allowed; }
  .fh { font-size: .7rem; color: var(--txtm); }
  .iw { position: relative; }
  .iw .finp { width: 100%; padding-right: 3rem; }
  .sfx { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); font-size: .8rem; color: var(--txtm); }
  .fsel { padding: .6rem .75rem; border: 1px solid var(--brd); border-radius: .5rem; font-size: .95rem; background: #fff; }
  
  /* Buttons */
  .btn { background: var(--pri); color: #fff; padding: .75rem 2rem; border-radius: .5rem; font-weight: 600; font-size: .95rem; cursor: pointer; border: none; transition: all .2s; }
  .btn:hover { background: #1e3a8a; }
  .btn:disabled { background: #94a3b8; cursor: not-allowed; }
  .btn-o { background: transparent; border: 2px solid var(--pri); color: var(--pri); }
  .btn-o:hover { background: rgba(30,64,175,.05); }
  .btn-s { background: var(--suc); }
  .btn-s:hover { background: #047857; }
  .btns { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
  
  /* KPIs */
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .kpi { background: var(--bgm); padding: 1rem; border-radius: .75rem; text-align: center; }
  .kpi-v { font-size: 1.5rem; font-weight: 700; color: var(--pri); }
  .kpi-l { font-size: .75rem; color: var(--txtm); margin-top: .25rem; }
  .kpi.suc .kpi-v { color: var(--suc); }
  .kpi.warn .kpi-v { color: var(--warn); }
  .kpi.err .kpi-v { color: var(--err); }
  
  /* Info boxes */
  .ibox { background: #eff6ff; border: 1px solid #bfdbfe; padding: 1rem; border-radius: .5rem; font-size: .9rem; color: #1e40af; }
  .tbox { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1rem; border-radius: .5rem; font-size: .9rem; color: #065f46; }
  .wbox { background: #fffbeb; border: 1px solid #fde68a; padding: 1rem; border-radius: .5rem; font-size: .9rem; color: #92400e; }
  .abox { background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: .5rem; font-size: .9rem; color: #991b1b; }
  
  /* Narrative */
  .narr { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 1.25rem; border-radius: .75rem; border: 1px solid #bae6fd; }
  .narr-t { font-weight: 600; color: #0369a1; margin-bottom: .5rem; }
  .narr-x { color: #0c4a6e; font-size: .9rem; line-height: 1.6; }
  
  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: .85rem; }
  th, td { padding: .75rem; text-align: left; border-bottom: 1px solid var(--brd); }
  th { background: var(--bgm); font-weight: 600; }
  .v { font-weight: 700; color: var(--pri); }
  .vs { color: var(--suc); }
  
  /* Charts */
  .chart { height: 350px; margin: 1rem 0; }
  
  /* Gap Analysis */
  .gap { display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap; padding: 1.5rem; }
  .gap-box { text-align: center; padding: 1.5rem 2rem; background: var(--bgm); border-radius: 1rem; min-width: 180px; }
  .gap-v { font-size: 2rem; font-weight: 700; }
  .gap-l { font-size: .85rem; color: var(--txtm); margin-top: .25rem; }
  .gap-op { font-size: 2rem; font-weight: 300; color: var(--txtm); }
  .gap-box.pen .gap-v { color: var(--pri); }
  .gap-box.need .gap-v { color: var(--warn); }
  .gap-box.gap .gap-v { color: var(--err); }
  .gap-box.gap.ok .gap-v { color: var(--suc); }
  
  /* Scenarios */
  .scen { background: var(--bgm); padding: 1rem; border-radius: .75rem; margin-bottom: 1rem; }
  .scen-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .scen-t { font-weight: 600; }
  .scen.best { background: #ecfdf5; border: 2px solid var(--suc); }
  
  /* Badges */
  .bdg { display: inline-block; padding: .25rem .5rem; border-radius: .25rem; font-size: .7rem; font-weight: 600; }
  .bdg-s { background: #dcfce7; color: #166534; }
  .bdg-w { background: #fef3c7; color: #92400e; }
  .bdg-e { background: #fee2e2; color: #991b1b; }
  .bdg-p { background: #dbeafe; color: #1e40af; }
  
  /* Recommendations */
  .recs { display: flex; flex-direction: column; gap: .5rem; margin-top: 1rem; }
  .rec { padding: .75rem 1rem; border-radius: .5rem; font-size: .85rem; display: flex; align-items: flex-start; gap: .5rem; }
  .rec.h { background: #fef2f2; border-left: 3px solid var(--err); }
  .rec.m { background: #fffbeb; border-left: 3px solid var(--warn); }
  .rec.b { background: #ecfdf5; border-left: 3px solid var(--suc); }
  
  /* Utilities */
  .mt { margin-top: 1rem; }
  .mb { margin-bottom: 1rem; }
  .tc { text-align: center; }
  .fi { animation: fadeIn .3s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  @media (max-width: 768px) { .g3, .steps { flex-direction: column; } .gap { flex-direction: column; } }
`

export default function SimulateurRetraitePage() {
  usePlotlyReady()
  // Current step
  const [step, setStep] = useState(1)
  
  // Step 1: Pension estimation form
  const [pensionForm, setPensionForm] = useState({
    regime: 'general',
    currentAge: 45,
    retirementAge: 64,
    yearsWorked: 20,
    averageSalary: 45000,
    fullRateAge: 67
  })
  const [pensionResult, setPensionResult] = useState<PensionResult | null>(null)
  
  // Affiner les trimestres (optionnel)
  const [showDetailedQuarters, setShowDetailedQuarters] = useState(false)
  const [detailedQuarters, setDetailedQuarters] = useState({
    enfants: { nombre: 0, enfantHandicape: false, aAdopte: false },
    assimiles: { chomageIndemnise: 0, maladie: 0, serviceMilitaire: 0, congeParental: 0 },
    rachetables: { anneesEtudesSuperieures: 0, anneesIncompletes: 0 },
    carriereLangue: { aCommenceAvant20Ans: false, trimestresAvant20Ans: 0 },
    aidantFamilial: { estAidant: false, anneesAidant: 0 },
    handicap: { tauxIncapacite: 0, aeeh: false }
  })
  
  // Retraite complémentaire (optionnel)
  const [showComplementary, setShowComplementary] = useState(false)
  const [showComplementaryDetails, setShowComplementaryDetails] = useState(false)
  const [complementary, setComplementary] = useState({
    profession: '',
    regime: '',
    pointsExistants: 0,
    classeCotisation: '',
    nombreEnfants: 0,
    reportAnnees: 0,
    departAnticipe: false
  })
  
  // Mapping métier → régime complémentaire
  const PROFESSION_REGIME_MAP: Record<string, { regime: string; label: string }> = {
    'salarie_prive': { regime: 'AGIRC_ARRCO', label: 'Salarié du privé' },
    'cadre': { regime: 'AGIRC_ARRCO', label: 'Cadre' },
    'fonctionnaire': { regime: 'RAFP', label: 'Fonctionnaire titulaire' },
    'contractuel_public': { regime: 'IRCANTEC', label: 'Contractuel fonction publique' },
    'commercant': { regime: 'SSI', label: 'Commerçant' },
    'artisan': { regime: 'SSI', label: 'Artisan' },
    'medecin': { regime: 'CARMF_COMPLEMENTAIRE', label: 'Médecin' },
    'chirurgien_dentiste': { regime: 'CARCDSF', label: 'Chirurgien-dentiste' },
    'pharmacien': { regime: 'CAVP', label: 'Pharmacien' },
    'infirmier': { regime: 'CARPIMKO_COMPLEMENTAIRE', label: 'Infirmier(e)' },
    'kinesitherapeute': { regime: 'CARPIMKO_COMPLEMENTAIRE', label: 'Kinésithérapeute' },
    'sage_femme': { regime: 'CARPIMKO_COMPLEMENTAIRE', label: 'Sage-femme' },
    'orthophoniste': { regime: 'CARPIMKO_COMPLEMENTAIRE', label: 'Orthophoniste' },
    'avocat': { regime: 'CNBF_COMPLEMENTAIRE', label: 'Avocat' },
    'notaire': { regime: 'CRPCEN_COMPLEMENTAIRE', label: 'Notaire' },
    'architecte': { regime: 'CIPAV', label: 'Architecte' },
    'expert_comptable': { regime: 'CAVEC', label: 'Expert-comptable' },
    'consultant': { regime: 'CIPAV', label: 'Consultant indépendant' },
    'coach': { regime: 'CIPAV', label: 'Coach / Formateur indépendant' },
    'veterinaire': { regime: 'CARPV', label: 'Vétérinaire' },
    'autre_liberal': { regime: 'CIPAV', label: 'Autre profession libérale' },
  }
  
  // Auto-sélection du régime quand la profession change
  const handleProfessionChange = (profession: string) => {
    const mapping = PROFESSION_REGIME_MAP[profession]
    setComplementary({
      ...complementary,
      profession,
      regime: mapping?.regime || '',
      classeCotisation: '' // Reset la classe
    })
  }
  
  // Step 2: Gap analysis
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(3000)
  
  // Step 3: Savings projection
  const [savingsForm, setSavingsForm] = useState({
    currentSavings: 30000,
    monthlyContribution: 400,
    expectedReturn: 4,
    lifeExpectancy: 85
  })
  const [projectionResult, setProjectionResult] = useState<ProjectionResult | null>(null)
  
  // Step 4: Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { nom: 'Départ à 62 ans', retirementAge: 62, monthlyContribution: 400, expectedReturn: 4 },
    { nom: 'Départ à 64 ans', retirementAge: 64, monthlyContribution: 400, expectedReturn: 4 },
    { nom: 'Départ à 67 ans', retirementAge: 67, monthlyContribution: 400, expectedReturn: 4 }
  ])
  const [scenariosResult, setScenariosResult] = useState<ScenarioComparisonResult | null>(null)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)
  
  // Helpers
  const eur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  const _pct = (n: number) => `${(n * 100).toFixed(1)}%` // Prefixed with _ to indicate intentionally unused
  
  // Gap calculation
  const gap = useMemo(() => {
    if (!pensionResult) return null
    const monthlyGap = desiredMonthlyIncome - pensionResult.monthlyPension
    return {
      pension: pensionResult.monthlyPension,
      desired: desiredMonthlyIncome,
      gap: monthlyGap,
      annualGap: monthlyGap * 12,
      isPositive: monthlyGap <= 0
    }
  }, [pensionResult, desiredMonthlyIncome])
  
  // ===== API CALLS =====
  
  // Step 1: Estimate pension
  const estimatePension = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/advisor/simulators/retirement/pension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          regime: pensionForm.regime,
          currentAge: pensionForm.currentAge,
          retirementAge: pensionForm.retirementAge,
          yearsWorked: pensionForm.yearsWorked,
          averageSalary: pensionForm.averageSalary,
          fullRateAge: pensionForm.fullRateAge,
          // Données détaillées trimestres si activées
          ...(showDetailedQuarters && { detailedQuarters }),
          // Données complémentaire si activées
          ...(showComplementary && (complementary.regime || complementary.profession) && { 
            complementary: {
              profession: complementary.profession || undefined,
              regime: complementary.regime || undefined,
              pointsExistants: complementary.pointsExistants || 0,
              classeCotisation: complementary.classeCotisation || undefined,
              nombreEnfants: complementary.nombreEnfants || detailedQuarters.enfants.nombre || 0,
              departAnticipe: complementary.departAnticipe
            }
          })
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.message || `Erreur ${res.status}`)
        return
      }
      if (data.success && data.data) {
        setPensionResult(data.data)
        setStep(2)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setError(data.error || data.message || 'Erreur lors de l\'estimation')
      }
    } catch (err: unknown) {
      console.error('Pension estimation error:', err)
      setError(getErrorMessage(err) || 'Erreur réseau - vérifiez votre connexion')
    } finally {
      setLoading(false)
    }
  }
  
  // Step 3: Project savings
  const projectSavings = async () => {
    if (!pensionResult || !gap) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/advisor/simulators/retirement/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentAge: pensionForm.currentAge,
          retirementAge: pensionForm.retirementAge,
          lifeExpectancy: savingsForm.lifeExpectancy,
          currentSavings: savingsForm.currentSavings,
          monthlyContribution: savingsForm.monthlyContribution,
          expectedReturn: savingsForm.expectedReturn / 100,
          inflationRate: 0.02,
          currentIncome: pensionForm.averageSalary,
          desiredReplacementRate: desiredMonthlyIncome * 12 / pensionForm.averageSalary
        })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProjectionResult(data.data)
        setStep(4)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setError(data.error || 'Erreur lors de la projection')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }
  
  // Step 4: Compare scenarios
  const compareScenarios = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/advisor/simulators/retirement/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          baseInput: {
            currentAge: pensionForm.currentAge,
            lifeExpectancy: savingsForm.lifeExpectancy,
            currentSavings: savingsForm.currentSavings,
            monthlyContribution: savingsForm.monthlyContribution,
            expectedReturn: savingsForm.expectedReturn / 100,
            inflationRate: 0.02,
            currentIncome: pensionForm.averageSalary,
            desiredReplacementRate: desiredMonthlyIncome * 12 / pensionForm.averageSalary
          },
          scenarios: scenarios.map(s => ({
            name: s.nom,
            retirementAge: s.retirementAge,
            monthlyContribution: s.monthlyContribution,
            expectedReturn: s.expectedReturn / 100
          }))
        })
      })
      const data = await res.json()
      if (data.success && data.data) {
        setScenariosResult(data.data)
      } else {
        setError(data.error || 'Erreur lors de la comparaison')
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }
  
  // Draw chart
  const drawChart = (containerId: string, projection: ProjectionDataPoint[]) => {
    if (typeof window !== 'undefined' && window.Plotly && projection?.length > 0) {
      const ages = projection.map(p => p.age)
      const savings = projection.map(p => p.savingsBalance)
      const contributions = projection.map(p => p.totalContributions)
      
      window.Plotly.newPlot(containerId, [
        { x: ages, y: savings, name: 'Capital', type: 'scatter', fill: 'tozeroy', line: { color: '#1e40af' } },
        { x: ages, y: contributions, name: 'Versements', type: 'scatter', line: { color: '#64748b', dash: 'dash' } }
      ], {
        margin: { t: 20, r: 20, b: 40, l: 60 },
        xaxis: { title: 'Âge' },
        yaxis: { title: 'Montant (€)' },
        legend: { orientation: 'h', y: -0.2 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent'
      }, { responsive: true })
    }
  }
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <main className="pw">
        <div className="ph">
          <Link href="/dashboard/simulateurs" style={{ fontSize: '11px', color: '#64748b' }}>← Retour aux simulateurs</Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Clock style={{ width: 24, height: 24 }} /> Simulateur Retraite Complet</h1>
          <p>Estimez votre pension, analysez le gap, et planifiez votre épargne en 4 étapes</p>
        </div>
        
        {/* Steps Navigation */}
        <div className="steps">
          <div 
            className={`step ${step === 1 ? 'active' : ''} ${pensionResult ? 'done' : ''}`}
            onClick={() => setStep(1)}
          >
            <div className="step-n">{pensionResult ? '✓' : '1'}</div>
            <div className="step-t">Ma Pension</div>
            <div className="step-d">Estimer ma pension publique</div>
          </div>
          <div 
            className={`step ${step === 2 ? 'active' : ''} ${gap && step > 2 ? 'done' : ''} ${!pensionResult ? 'locked' : ''}`}
            onClick={() => pensionResult && setStep(2)}
          >
            <div className="step-n">{gap && step > 2 ? '✓' : '2'}</div>
            <div className="step-t">Le Gap</div>
            <div className="step-d">Analyser l'écart</div>
          </div>
          <div 
            className={`step ${step === 3 ? 'active' : ''} ${projectionResult ? 'done' : ''} ${!gap ? 'locked' : ''}`}
            onClick={() => gap && setStep(3)}
          >
            <div className="step-n">{projectionResult ? '✓' : '3'}</div>
            <div className="step-t">Mon Épargne</div>
            <div className="step-d">Projeter mon capital</div>
          </div>
          <div 
            className={`step ${step === 4 ? 'active' : ''} ${!projectionResult ? 'locked' : ''}`}
            onClick={() => projectionResult && setStep(4)}
          >
            <div className="step-n">4</div>
            <div className="step-t">Scénarios</div>
            <div className="step-d">Comparer les options</div>
          </div>
        </div>
        
        {/* ===== STEP 1: PENSION ESTIMATION ===== */}
        {step === 1 && (
          <div className="fi">
            <div className="card card-p">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><FileText style={{ width: 18, height: 18 }} /> Étape 1 : Estimer ma pension de retraite</h2>
              <div className="narr mb">
                <div className="narr-t">Qu'est-ce que je vais toucher à la retraite ?</div>
                <div className="narr-x">
                  Avant de planifier votre épargne, il faut savoir combien vous toucherez de la part des régimes obligatoires 
                  (base + complémentaire). Cette estimation dépend de votre régime, vos années cotisées, et votre salaire moyen.
                </div>
              </div>
              
              <div className="fg">
                <div className="fgrp">
                  <label className="flbl">Régime de retraite</label>
                  <select 
                    className="fsel" 
                    value={pensionForm.regime}
                    onChange={e => setPensionForm({...pensionForm, regime: e.target.value})}
                  >
                    <option value="general">Régime général (salarié privé)</option>
                    <option value="public">Fonction publique</option>
                    <option value="independent">Indépendant / TNS</option>
                    <option value="agricultural">Agricole (MSA)</option>
                    <option value="multiple">Multi-régimes</option>
                  </select>
                  <span className="fh">Votre régime principal de cotisation</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Âge actuel</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={pensionForm.currentAge}
                      onChange={e => setPensionForm({...pensionForm, currentAge: parseInt(e.target.value) || 0})}
                      min="18" max="75"
                    />
                    <span className="sfx">ans</span>
                  </div>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Âge de départ souhaité</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={pensionForm.retirementAge}
                      onChange={e => setPensionForm({...pensionForm, retirementAge: parseInt(e.target.value) || 0})}
                      min="62" max="70"
                    />
                    <span className="sfx">ans</span>
                  </div>
                  <span className="fh">L'âge légal minimum est 62-64 ans selon votre génération</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Années travaillées à ce jour</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={pensionForm.yearsWorked}
                      onChange={e => setPensionForm({...pensionForm, yearsWorked: parseInt(e.target.value) || 0})}
                      min="0" max="50"
                    />
                    <span className="sfx">ans</span>
                  </div>
                  <span className="fh">Nombre d'années déjà cotisées</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Salaire annuel brut moyen</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={pensionForm.averageSalary}
                      onChange={e => setPensionForm({...pensionForm, averageSalary: parseInt(e.target.value) || 0})}
                      min="0" step="1000"
                    />
                    <span className="sfx">€/an</span>
                  </div>
                  <span className="fh">Moyenne des 25 meilleures années (régime général)</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Âge du taux plein</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={pensionForm.fullRateAge}
                      onChange={e => setPensionForm({...pensionForm, fullRateAge: parseInt(e.target.value) || 0})}
                      min="62" max="70"
                    />
                    <span className="sfx">ans</span>
                  </div>
                  <span className="fh">67 ans maximum pour le taux plein automatique</span>
                </div>
              </div>
              
              {/* Section avancée : Affiner les trimestres */}
              <div className="mt">
                <button 
                  type="button"
                  className="btn btn-o" 
                  style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setShowDetailedQuarters(!showDetailedQuarters)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Search style={{ width: 14, height: 14 }} /> Affiner mes trimestres (enfants, chômage, études, handicap...)</span>
                  <span>{showDetailedQuarters ? '▲' : '▼'}</span>
                </button>
                
                {showDetailedQuarters && (
                  <div className="card mt" style={{ background: '#f8fafc' }}>
                    <p className="fh mb">Ces informations permettent un calcul plus précis de vos trimestres et des majorations possibles.</p>
                    
                    {/* Enfants */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><Baby style={{ width: 15, height: 15 }} /> Enfants</h4>
                    <div className="fg mb">
                      <div className="fgrp">
                        <label className="flbl">Nombre d'enfants</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.enfants.nombre}
                          onChange={e => setDetailedQuarters({...detailedQuarters, enfants: {...detailedQuarters.enfants, nombre: parseInt(e.target.value) || 0}})}
                          min="0" max="20"
                        />
                        <span className="fh">+8 trimestres par enfant (4 maternité + 4 éducation)</span>
                      </div>
                      <div className="fgrp">
                        <label className="flbl" style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                          <input 
                            type="checkbox" 
                            checked={detailedQuarters.enfants.enfantHandicape}
                            onChange={e => setDetailedQuarters({...detailedQuarters, enfants: {...detailedQuarters.enfants, enfantHandicape: e.target.checked}})}
                          />
                          Enfant handicapé (+8 trimestres)
                        </label>
                      </div>
                    </div>
                    
                    {/* Périodes assimilées */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><FileText style={{ width: 15, height: 15 }} /> Périodes assimilées</h4>
                    <div className="fg mb">
                      <div className="fgrp">
                        <label className="flbl">Chômage indemnisé (trimestres)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.assimiles.chomageIndemnise}
                          onChange={e => setDetailedQuarters({...detailedQuarters, assimiles: {...detailedQuarters.assimiles, chomageIndemnise: parseInt(e.target.value) || 0}})}
                          min="0"
                        />
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Maladie/AT (trimestres)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.assimiles.maladie}
                          onChange={e => setDetailedQuarters({...detailedQuarters, assimiles: {...detailedQuarters.assimiles, maladie: parseInt(e.target.value) || 0}})}
                          min="0"
                        />
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Service militaire (trimestres)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.assimiles.serviceMilitaire}
                          onChange={e => setDetailedQuarters({...detailedQuarters, assimiles: {...detailedQuarters.assimiles, serviceMilitaire: parseInt(e.target.value) || 0}})}
                          min="0"
                        />
                        <span className="fh">1 trimestre par 90 jours</span>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Congé parental (trimestres)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.assimiles.congeParental}
                          onChange={e => setDetailedQuarters({...detailedQuarters, assimiles: {...detailedQuarters.assimiles, congeParental: parseInt(e.target.value) || 0}})}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Rachat possible */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><Wallet style={{ width: 15, height: 15 }} /> Trimestres rachetables</h4>
                    <div className="fg mb">
                      <div className="fgrp">
                        <label className="flbl">Années d'études supérieures</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.rachetables.anneesEtudesSuperieures}
                          onChange={e => setDetailedQuarters({...detailedQuarters, rachetables: {...detailedQuarters.rachetables, anneesEtudesSuperieures: parseInt(e.target.value) || 0}})}
                          min="0" max="3"
                        />
                        <span className="fh">Max 12 trimestres rachetables</span>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Années incomplètes (&lt;4 trim.)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.rachetables.anneesIncompletes}
                          onChange={e => setDetailedQuarters({...detailedQuarters, rachetables: {...detailedQuarters.rachetables, anneesIncompletes: parseInt(e.target.value) || 0}})}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Carrière longue */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><PersonStanding style={{ width: 15, height: 15 }} /> Carrière longue</h4>
                    <div className="fg mb">
                      <div className="fgrp">
                        <label className="flbl" style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                          <input 
                            type="checkbox" 
                            checked={detailedQuarters.carriereLangue.aCommenceAvant20Ans}
                            onChange={e => setDetailedQuarters({...detailedQuarters, carriereLangue: {...detailedQuarters.carriereLangue, aCommenceAvant20Ans: e.target.checked}})}
                          />
                          J'ai commencé à travailler avant 20 ans
                        </label>
                      </div>
                      {detailedQuarters.carriereLangue.aCommenceAvant20Ans && (
                        <div className="fgrp">
                          <label className="flbl">Trimestres validés avant 20 ans</label>
                          <input 
                            type="number" 
                            className="finp" 
                            value={detailedQuarters.carriereLangue.trimestresAvant20Ans}
                            onChange={e => setDetailedQuarters({...detailedQuarters, carriereLangue: {...detailedQuarters.carriereLangue, trimestresAvant20Ans: parseInt(e.target.value) || 0}})}
                            min="0"
                          />
                          <span className="fh">5 trimestres minimum pour carrière longue</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Handicap / Aidant */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><Accessibility style={{ width: 15, height: 15 }} /> Handicap / Aidant</h4>
                    <div className="fg">
                      <div className="fgrp">
                        <label className="flbl">Taux d'incapacité (%)</label>
                        <input 
                          type="number" 
                          className="finp" 
                          value={detailedQuarters.handicap.tauxIncapacite}
                          onChange={e => setDetailedQuarters({...detailedQuarters, handicap: {...detailedQuarters.handicap, tauxIncapacite: parseInt(e.target.value) || 0}})}
                          min="0" max="100"
                        />
                        <span className="fh">≥80% donne des trimestres supplémentaires</span>
                      </div>
                      <div className="fgrp">
                        <label className="flbl" style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                          <input 
                            type="checkbox" 
                            checked={detailedQuarters.aidantFamilial.estAidant}
                            onChange={e => setDetailedQuarters({...detailedQuarters, aidantFamilial: {...detailedQuarters.aidantFamilial, estAidant: e.target.checked}})}
                          />
                          Je suis aidant familial
                        </label>
                      </div>
                      {detailedQuarters.aidantFamilial.estAidant && (
                        <div className="fgrp">
                          <label className="flbl">Années comme aidant</label>
                          <input 
                            type="number" 
                            className="finp" 
                            value={detailedQuarters.aidantFamilial.anneesAidant}
                            onChange={e => setDetailedQuarters({...detailedQuarters, aidantFamilial: {...detailedQuarters.aidantFamilial, anneesAidant: parseInt(e.target.value) || 0}})}
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Section avancée : Retraite complémentaire */}
              <div className="mt">
                <button 
                  type="button"
                  className="btn btn-o" 
                  style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setShowComplementary(!showComplementary)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Building2 style={{ width: 14, height: 14 }} /> Affiner ma retraite complémentaire</span>
                  <span>{showComplementary ? '▲' : '▼'}</span>
                </button>
                
                {showComplementary && (
                  <div className="card mt" style={{ background: '#f8fafc' }}>
                    
                    {/* Sélection du métier - PRIORITAIRE */}
                    <h4 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}><Briefcase style={{ width: 15, height: 15 }} /> Quelle est votre profession ?</h4>
                    <div className="fg mb">
                      <div className="fgrp" style={{gridColumn:'span 2'}}>
                        <select 
                          className="finp" 
                          value={complementary.profession}
                          onChange={e => handleProfessionChange(e.target.value)}
                          style={{ fontSize: '1rem', padding: '.75rem' }}
                        >
                          <option value="">Sélectionnez votre métier...</option>
                          <optgroup label="Salariés">
                            <option value="salarie_prive">Salarié du secteur privé</option>
                            <option value="cadre">Cadre</option>
                          </optgroup>
                          <optgroup label="Fonction publique">
                            <option value="fonctionnaire">Fonctionnaire titulaire</option>
                            <option value="contractuel_public">Contractuel fonction publique</option>
                          </optgroup>
                          <optgroup label="Artisans / Commerçants">
                            <option value="commercant">Commerçant</option>
                            <option value="artisan">Artisan</option>
                          </optgroup>
                          <optgroup label="Professions médicales">
                            <option value="medecin">Médecin</option>
                            <option value="chirurgien_dentiste">Chirurgien-dentiste</option>
                            <option value="pharmacien">Pharmacien</option>
                            <option value="infirmier">Infirmier(e)</option>
                            <option value="kinesitherapeute">Kinésithérapeute</option>
                            <option value="sage_femme">Sage-femme</option>
                            <option value="orthophoniste">Orthophoniste</option>
                            <option value="veterinaire">Vétérinaire</option>
                          </optgroup>
                          <optgroup label="Professions juridiques">
                            <option value="avocat">Avocat</option>
                            <option value="notaire">Notaire</option>
                          </optgroup>
                          <optgroup label="Autres professions libérales">
                            <option value="architecte">Architecte</option>
                            <option value="expert_comptable">Expert-comptable</option>
                            <option value="consultant">Consultant indépendant</option>
                            <option value="coach">Coach / Formateur</option>
                            <option value="autre_liberal">Autre profession libérale</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    
                    {/* Affichage de la caisse détectée */}
                    {complementary.profession && PROFESSION_REGIME_MAP[complementary.profession] && (
                      <div className="sbox mb" style={{fontSize:'.9rem'}}>
                        <CheckCircle style={{ width: 14, height: 14, display: 'inline', color: '#059669' }} /> <strong>Caisse complémentaire :</strong> {complementary.regime === 'AGIRC_ARRCO' ? 'AGIRC-ARRCO' : complementary.regime === 'RAFP' ? 'RAFP' : complementary.regime === 'IRCANTEC' ? 'IRCANTEC' : complementary.regime === 'SSI' ? 'SSI (ex-RSI)' : complementary.regime?.replace('_COMPLEMENTAIRE', '') || complementary.regime}
                      </div>
                    )}
                    
                    {/* Options selon le régime détecté */}
                    {complementary.profession && (
                      <div className="fg">
                        {/* Points acquis - optionnel */}
                        <div className="fgrp">
                          <label className="flbl">Points déjà acquis (optionnel)</label>
                          <input 
                            type="number" 
                            className="finp" 
                            value={complementary.pointsExistants || ''}
                            onChange={e => setComplementary({...complementary, pointsExistants: parseInt(e.target.value) || 0})}
                            min="0"
                            placeholder="Laissez vide = estimation auto"
                          />
                        </div>
                        
                        {/* Classe de cotisation pour régimes par classes */}
                        {['CIPAV', 'CARMF_COMPLEMENTAIRE', 'CARPIMKO_COMPLEMENTAIRE', 'CNBF_COMPLEMENTAIRE', 'CRPCEN_COMPLEMENTAIRE'].includes(complementary.regime) && (
                          <div className="fgrp">
                            <label className="flbl">Classe de cotisation</label>
                            <select 
                              className="finp" 
                              value={complementary.classeCotisation}
                              onChange={e => setComplementary({...complementary, classeCotisation: e.target.value})}
                            >
                              <option value="">Par défaut</option>
                              {complementary.regime === 'CIPAV' && (
                                <>
                                  <option value="A">Classe A</option>
                                  <option value="B">Classe B</option>
                                  <option value="C">Classe C</option>
                                  <option value="D">Classe D</option>
                                  <option value="E">Classe E</option>
                                </>
                              )}
                              {complementary.regime === 'CARMF_COMPLEMENTAIRE' && (
                                <>
                                  <option value="M">Classe M</option>
                                  <option value="B">Classe B</option>
                                  <option value="C">Classe C</option>
                                  <option value="D">Classe D</option>
                                  <option value="E">Classe E</option>
                                </>
                              )}
                              {complementary.regime === 'CARPIMKO_COMPLEMENTAIRE' && (
                                <>
                                  <option value="1">Classe 1</option>
                                  <option value="2">Classe 2</option>
                                  <option value="3">Classe 3</option>
                                </>
                              )}
                              {complementary.regime === 'CNBF_COMPLEMENTAIRE' && (
                                <>
                                  <option value="1">Classe 1</option>
                                  <option value="2">Classe 2</option>
                                  <option value="3">Classe 3</option>
                                </>
                              )}
                              {complementary.regime === 'CRPCEN_COMPLEMENTAIRE' && (
                                <>
                                  <option value="B1">Classe B1</option>
                                  <option value="B2">Classe B2</option>
                                  <option value="C">Classe C</option>
                                </>
                              )}
                            </select>
                          </div>
                        )}
                        
                        {/* Option départ anticipé AGIRC-ARRCO */}
                        {(complementary.regime === 'AGIRC_ARRCO' || !complementary.regime) && (
                          <div className="fgrp" style={{gridColumn:'span 2'}}>
                            <label className="flbl" style={{display:'flex', alignItems:'center', gap:'.5rem', cursor:'pointer'}}>
                              <input 
                                type="checkbox" 
                                checked={complementary.departAnticipe}
                                onChange={e => setComplementary({...complementary, departAnticipe: e.target.checked})}
                              />
                              Départ anticipé (carrière longue, handicap, pénibilité...)
                            </label>
                            <span className="fh">Évite le malus de -10% pendant 3 ans</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Info AGIRC-ARRCO pour salariés */}
                    {['salarie_prive', 'cadre'].includes(complementary.profession) && (
                      <div className="ibox mt" style={{fontSize:'.8rem'}}>
                        <Lightbulb style={{ width: 14, height: 14, display: 'inline', color: '#2563eb' }} /> <strong>Bon à savoir :</strong> Si vous partez 1 an après le taux plein, vous gagnez +10% à vie sur votre complémentaire.
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="btns">
                <button className="btn" onClick={estimatePension} disabled={loading}>
                  {loading ? 'Calcul...' : 'Estimer ma pension'}
                </button>
              </div>
              {error && <div className="abox mt">{error}</div>}
            </div>
          </div>
        )}
        
        {/* ===== STEP 2: GAP ANALYSIS ===== */}
        {step === 2 && pensionResult && (
          <div className="fi" ref={resultRef}>
            <div className="card card-s">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><CheckCircle style={{ width: 18, height: 18, color: '#059669' }} /> Votre pension estimée</h2>
              
              <div className="kpis">
                <div className="kpi">
                  <div className="kpi-v">{eur(pensionResult.monthlyPension)} €</div>
                  <div className="kpi-l">Pension mensuelle totale</div>
                </div>
                <div className="kpi">
                  <div className="kpi-v">{eur(pensionResult.monthlyBasePension)} €</div>
                  <div className="kpi-l">Pension de base ({pensionResult.basePercentage}%)</div>
                </div>
                <div className="kpi">
                  <div className="kpi-v">{eur(pensionResult.monthlyComplementaryPension)} €</div>
                  <div className="kpi-l">Complémentaire ({pensionResult.complementaryPercentage}%)</div>
                </div>
                <div className={`kpi ${pensionResult.replacementRatePercent >= 70 ? 'suc' : pensionResult.replacementRatePercent >= 50 ? 'warn' : 'err'}`}>
                  <div className="kpi-v">{pensionResult.replacementRatePercent}%</div>
                  <div className="kpi-l">Taux de remplacement</div>
                </div>
              </div>
              
              {/* Trimestres */}
              <div className="ibox mt">
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Calendar style={{ width: 14, height: 14 }} /> Trimestres à {pensionForm.retirementAge} ans :</strong><br/>
                <span style={{display:'inline-block', marginTop:'.5rem'}}>
                  {pensionResult.quartersAlreadyValidated || 0} déjà validés + {pensionResult.futureQuarters || 0} futurs = <strong>{pensionResult.quartersValidated} trimestres</strong> / {pensionResult.quartersRequired} requis
                </span>
                {pensionResult.missingQuarters > 0 && (
                  <span className="bdg bdg-w" style={{marginLeft:'.5rem'}}>
                    {pensionResult.missingQuarters} manquants ({Math.ceil(pensionResult.missingQuarters / 4)} ans)
                  </span>
                )}
                {pensionResult.hasDiscount && (
                  <span className="bdg bdg-e" style={{marginLeft:'.5rem'}}>
                    Décote {(pensionResult.discountRate * 100).toFixed(1)}%
                  </span>
                )}
                {pensionResult.hasBonus && (
                  <span className="bdg bdg-s" style={{marginLeft:'.5rem'}}>
                    Surcote +{(pensionResult.bonusRate * 100).toFixed(1)}%
                  </span>
                )}
                {pensionResult.missingQuarters === 0 && (
                  <span className="bdg bdg-s" style={{marginLeft:'.5rem'}}>
                    Taux plein atteint
                  </span>
                )}
              </div>
            </div>
            
            {/* Retraite complémentaire - Vue simplifiée */}
            {pensionResult.complementaryDetails && (
              <div className="card">
                <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Building2 style={{ width: 18, height: 18 }} /> Retraite complémentaire</h2>
                
                {/* Montants principaux - PRIORITÉ */}
                <div className="kpis">
                  <div className="kpi" style={{flex:2}}>
                    <div className="kpi-v" style={{color:'#059669', fontSize:'1.8rem'}}>
                      {eur(pensionResult.complementaryDetails.pensionMensuelleNette)} €
                    </div>
                    <div className="kpi-l">par mois (net)</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-v">{eur(pensionResult.complementaryDetails.pensionAnnuelleNette)} €</div>
                    <div className="kpi-l">par an (net)</div>
                  </div>
                </div>
                
                {/* Caisse */}
                <div className="ibox mt" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <strong>Caisse :</strong> {pensionResult.complementaryDetails.nomRegime}
                  </div>
                  <div style={{fontSize:'.85rem', color:'#64748b'}}>
                    {pensionResult.complementaryDetails.points.total} points × {pensionResult.complementaryDetails.valeurPoint.toFixed(4)}€
                  </div>
                </div>
                
                {/* Alertes importantes (malus/bonus) - affichées directement */}
                {pensionResult.complementaryDetails.coefficients.solidarite.valeur !== 1 && (
                  <div className={`mt ${pensionResult.complementaryDetails.coefficients.solidarite.valeur < 1 ? 'wbox' : 'sbox'}`} style={{fontSize:'.9rem'}}>
                    {pensionResult.complementaryDetails.coefficients.solidarite.valeur < 1 ? <AlertTriangle style={{ width: 14, height: 14, display: 'inline', color: '#f59e0b' }} /> : <CheckCircle style={{ width: 14, height: 14, display: 'inline', color: '#059669' }} />} 
                    <strong> Coefficient solidarité :</strong> ×{pensionResult.complementaryDetails.coefficients.solidarite.valeur.toFixed(2)}
                    <span style={{marginLeft:'.5rem', opacity:0.8}}>
                      ({pensionResult.complementaryDetails.coefficients.solidarite.explication})
                    </span>
                  </div>
                )}
                {pensionResult.complementaryDetails.coefficients.majorationFamille > 1 && (
                  <div className="sbox mt" style={{fontSize:'.9rem'}}>
                    <CheckCircle style={{ width: 14, height: 14, display: 'inline', color: '#059669' }} /> <strong>Majoration famille :</strong> +10% appliqué (3 enfants ou plus)
                  </div>
                )}
                
                {/* Détails pliables */}
                <button 
                  type="button"
                  className="btn btn-o mt" 
                  style={{ width: '100%', fontSize: '.85rem', padding: '.5rem' }}
                  onClick={() => setShowComplementaryDetails(!showComplementaryDetails)}
                >
                  {showComplementaryDetails ? '▲ Masquer le détail du calcul' : '▼ Voir le détail du calcul'}
                </button>
                
                {showComplementaryDetails && pensionResult.complementaryDetails && (
                  <div className="mt" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '.5rem', fontSize: '.85rem' }}>
                    {/* Points */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginBottom: '1rem' }}>
                      <div style={{ textAlign: 'center', padding: '.5rem', background: '#fff', borderRadius: '.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{pensionResult.complementaryDetails.points.existants}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b' }}>acquis</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '.5rem', background: '#fff', borderRadius: '.25rem' }}>
                        <div style={{ fontWeight: 600 }}>+{pensionResult.complementaryDetails.points.projetes}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b' }}>projetés</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '.5rem', background: '#fff', borderRadius: '.25rem' }}>
                        <div style={{ fontWeight: 600 }}>+{pensionResult.complementaryDetails.points.gratuits}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b' }}>gratuits</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '.5rem', background: '#dcfce7', borderRadius: '.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{pensionResult.complementaryDetails.points.total}</div>
                        <div style={{ fontSize: '.75rem', color: '#059669' }}>total</div>
                      </div>
                    </div>
                    
                    {/* Formule */}
                    <div style={{ marginBottom: '.5rem' }}>
                      <strong>Formule :</strong> {pensionResult.complementaryDetails.detailCalcul?.formule}
                    </div>
                    
                    {/* Étapes */}
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569' }}>
                      {pensionResult.complementaryDetails.detailCalcul?.etapes?.slice(0, 4).map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                    
                    {/* Lien info-retraite */}
                    <div style={{ marginTop: '1rem', fontSize: '.8rem', color: '#64748b' }}>
                      Consultez votre relevé sur <a href="https://info-retraite.fr" target="_blank" rel="noopener noreferrer" style={{color:'#2563eb'}}>info-retraite.fr</a>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Projection par âge de départ */}
            {pensionResult.projectionByAge && (
              <div className="card">
                <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><BarChart3 style={{ width: 18, height: 18 }} /> Évolution de la pension selon l'âge de départ</h2>
                <div className="narr mb">
                  <div className="narr-x">
                    Ce tableau montre comment votre pension évolue si vous partez entre 62 et 70 ans. 
                    Plus vous attendez, plus vous accumulez de trimestres et réduisez la décote.
                    {pensionResult.optimalAge && (
                      <strong> L'âge optimal est {pensionResult.optimalAge} ans.</strong>
                    )}
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Âge</th>
                        <th>Trimestres</th>
                        <th>Décote/Surcote</th>
                        <th>Pension/mois</th>
                        <th>Taux remp.</th>
                        <th>vs {pensionForm.retirementAge} ans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pensionResult.projectionByAge.map((p) => (
                        <tr 
                          key={p.age} 
                          style={{ 
                            background: p.age === pensionForm.retirementAge ? '#dbeafe' : 
                                       p.age === pensionResult.optimalAge ? '#dcfce7' : ''
                          }}
                        >
                          <td>
                            <strong>{p.age} ans</strong>
                            {p.age === pensionForm.retirementAge && <span className="bdg bdg-p" style={{marginLeft:'.3rem'}}>Choisi</span>}
                            {p.age === pensionResult.optimalAge && <span className="bdg bdg-s" style={{marginLeft:'.3rem'}}>Optimal</span>}
                          </td>
                          <td>
                            {p.quartersAtAge}
                            {p.missingAtAge > 0 && <span style={{color:'#dc2626', fontSize:'.75rem'}}> (-{p.missingAtAge})</span>}
                          </td>
                          <td>
                            {p.hasDiscount && <span className="bdg bdg-e">-{p.discountPercent}%</span>}
                            {p.hasBonus && <span className="bdg bdg-s">+{p.bonusPercent}%</span>}
                            {!p.hasDiscount && !p.hasBonus && <span className="bdg bdg-s">Taux plein</span>}
                          </td>
                          <td className="v">{eur(p.monthlyPension)} €</td>
                          <td>{p.replacementRatePercent}%</td>
                          <td style={{ color: p.vsBaseline > 0 ? '#059669' : p.vsBaseline < 0 ? '#dc2626' : '#64748b' }}>
                            {p.vsBaseline > 0 ? '+' : ''}{eur(p.vsBaseline)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="tbox mt">
                  <strong>Conseil :</strong> En partant à {pensionResult.optimalAge || 67} ans au lieu de {pensionForm.retirementAge} ans, 
                  vous gagneriez {eur(Math.abs((pensionResult.projectionByAge?.find((p) => p.age === (pensionResult.optimalAge || 67))?.monthlyPension || 0) - pensionResult.monthlyPension))} €/mois.
                </div>
              </div>
            )}
            
            {/* Analyse détaillée des trimestres (si données fournies) */}
            {pensionResult.detailedQuartersAnalysis && showDetailedQuarters && (
              <div className="card">
                <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><BarChart3 style={{ width: 18, height: 18 }} /> Analyse détaillée de vos trimestres</h2>
                
                {/* Section 1: Trimestres validés */}
                <div className="mb">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#059669', marginBottom: '.75rem' }}>
                    1. Trimestres déjà validés : {pensionResult.detailedQuartersAnalysis?.validated.totalValides}
                  </h3>
                  
                  {(pensionResult.detailedQuartersAnalysis?.validated.cotises.detail.length ?? 0) > 0 && (
                    <div className="mb">
                      <strong style={{ fontSize: '.85rem' }}>Cotisés ({pensionResult.detailedQuartersAnalysis?.validated.cotises.total})</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '.85rem' }}>
                        {pensionResult.detailedQuartersAnalysis?.validated.cotises.detail.map((d, i) => (
                          <li key={i}>{d.source} : <strong>{d.trimestres}</strong> trimestres</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {(pensionResult.detailedQuartersAnalysis?.validated.assimiles.total ?? 0) > 0 && (
                    <div className="mb">
                      <strong style={{ fontSize: '.85rem' }}>Assimilés ({pensionResult.detailedQuartersAnalysis?.validated.assimiles.total})</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '.85rem' }}>
                        {pensionResult.detailedQuartersAnalysis?.validated.assimiles.detail.map((d, i) => (
                          <li key={i}>
                            {d.source} : <strong>{d.trimestres}</strong> trimestres
                            {d.limite && <span style={{ color: '#64748b' }}> ({d.limite})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {(pensionResult.detailedQuartersAnalysis?.validated.majorations.total ?? 0) > 0 && (
                    <div className="mb">
                      <strong style={{ fontSize: '.85rem' }}>Majorations enfants ({pensionResult.detailedQuartersAnalysis?.validated.majorations.total})</strong>
                      <ul style={{ marginLeft: '1rem', fontSize: '.85rem' }}>
                        {pensionResult.detailedQuartersAnalysis?.validated.majorations.detail.map((d, i) => (
                          <li key={i}>
                            {d.source} : <strong>{d.trimestres}</strong> trimestres
                            {d.conditions && <span style={{ color: '#64748b' }}> ({d.conditions})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Section 2: Trimestres supplémentaires gratuits */}
                {(pensionResult.detailedQuartersAnalysis?.supplementairesGratuits.detail.length ?? 0) > 0 && (
                  <div className="mb">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0ea5e9', marginBottom: '.75rem' }}>
                      2. Trimestres supplémentaires gratuits possibles : {pensionResult.detailedQuartersAnalysis?.supplementairesGratuits.total}
                    </h3>
                    {pensionResult.detailedQuartersAnalysis?.supplementairesGratuits.detail.map((d, i) => (
                      <div key={i} className="ibox mb" style={{ fontSize: '.85rem' }}>
                        <strong>{d.source}</strong> : {d.trimestres > 0 ? `+${d.trimestres} trimestres` : d.conditions}
                        <br/>
                        <span style={{ color: '#64748b' }}>Démarche : {d.demarche}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Section 3: Trimestres rachetables */}
                {(pensionResult.detailedQuartersAnalysis?.rachetables.detail.length ?? 0) > 0 && (
                  <div className="mb">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f59e0b', marginBottom: '.75rem' }}>
                      3. Trimestres rachetables : {pensionResult.detailedQuartersAnalysis?.rachetables.total}
                    </h3>
                    {pensionResult.detailedQuartersAnalysis?.rachetables.detail.map((d, i) => (
                      <div key={i} className="wbox mb" style={{ fontSize: '.85rem' }}>
                        <strong>{d.source}</strong> : {d.trimestres} trimestres
                        {d.coutEstime && <><br/>Coût estimé : {d.coutEstime}</>}
                        <br/>
                        <span style={{ color: '#92400e' }}>Intérêt : {d.interet}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Section 4: Carrière longue */}
                {pensionResult.detailedQuartersAnalysis?.carriereLongue.eligible && (
                  <div className="mb">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#8b5cf6', marginBottom: '.75rem' }}>
                      4. Carrière longue : Éligible !
                    </h3>
                    <div className="tbox" style={{ fontSize: '.85rem' }}>
                      <strong>Départ anticipé possible à {pensionResult.detailedQuartersAnalysis?.carriereLongue.ageDepart} ans</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '.5rem' }}>
                        {pensionResult.detailedQuartersAnalysis?.carriereLongue.conditions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Synthèse */}
                <div className="narr">
                  <div className="narr-t">Synthèse personnalisée</div>
                  <div className="narr-x">
                    <p><strong>Total actuel :</strong> {pensionResult.detailedQuartersAnalysis?.synthese.totalActuel} trimestres</p>
                    <p><strong>Potentiel (avec rachats) :</strong> {pensionResult.detailedQuartersAnalysis?.synthese.totalPotentiel} trimestres</p>
                    {(pensionResult.detailedQuartersAnalysis?.synthese.manquantsTauxPlein ?? 0) > 0 ? (
                      <p><strong style={{ color: '#dc2626' }}>Manquants pour taux plein :</strong> {pensionResult.detailedQuartersAnalysis?.synthese.manquantsTauxPlein} trimestres</p>
                    ) : (
                      <p style={{ color: '#059669' }}>Taux plein atteint !</p>
                    )}
                    <hr style={{ margin: '.75rem 0', borderColor: '#e2e8f0' }} />
                    <strong>Conseils prioritaires :</strong>
                    <ul style={{ marginLeft: '1rem', marginTop: '.5rem' }}>
                      {pensionResult.detailedQuartersAnalysis?.synthese.conseilsPrioritaires.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Gap Analysis Card */}
            <div className="card card-p">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><FileText style={{ width: 18, height: 18 }} /> Étape 2 : Analyser le gap (écart)</h2>
              <div className="narr mb">
                <div className="narr-t">Quel revenu souhaitez-vous à la retraite ?</div>
                <div className="narr-x">
                  Comparez votre pension estimée avec le revenu mensuel que vous souhaitez maintenir. 
                  L'écart représente ce que vous devrez financer avec votre épargne personnelle.
                </div>
              </div>
              
              <div className="fgrp mb" style={{maxWidth:'300px'}}>
                <label className="flbl">Revenu mensuel souhaité à la retraite</label>
                <div className="iw">
                  <input 
                    type="number" 
                    className="finp" 
                    value={desiredMonthlyIncome}
                    onChange={e => setDesiredMonthlyIncome(parseInt(e.target.value) || 0)}
                    min="0" step="100"
                  />
                  <span className="sfx">€/mois</span>
                </div>
                <span className="fh">Votre niveau de vie cible à la retraite</span>
              </div>
              
              {gap && (
                <div className="gap">
                  <div className="gap-box pen">
                    <div className="gap-v">{eur(gap.pension)} €</div>
                    <div className="gap-l">Ma pension</div>
                  </div>
                  <div className="gap-op">+</div>
                  <div className={`gap-box gap ${gap.isPositive ? 'ok' : ''}`}>
                    <div className="gap-v">{gap.isPositive ? '0' : eur(gap.gap)} €</div>
                    <div className="gap-l">{gap.isPositive ? 'Aucun gap' : 'Gap à combler'}</div>
                  </div>
                  <div className="gap-op">=</div>
                  <div className="gap-box need">
                    <div className="gap-v">{eur(gap.desired)} €</div>
                    <div className="gap-l">Mon objectif</div>
                  </div>
                </div>
              )}
              
              {gap && !gap.isPositive && (
                <div className="wbox mt">
                  <strong>Gap annuel à combler :</strong> {eur(gap.annualGap)} €/an
                  <br/>
                  <small>Avec la règle des 4%, il vous faut un capital de <strong>{eur(gap.annualGap / 0.04)} €</strong> pour générer ce revenu.</small>
                </div>
              )}
              
              {gap && gap.isPositive && (
                <div className="tbox mt">
                  <strong>Bonne nouvelle !</strong> Votre pension couvre votre objectif. Vous pouvez tout de même épargner pour plus de confort.
                </div>
              )}
              
              <div className="btns">
                <button className="btn btn-o" onClick={() => setStep(1)}>← Modifier ma situation</button>
                <button className="btn" onClick={() => setStep(3)}>Planifier mon épargne →</button>
              </div>
            </div>
            
            {/* Pension Recommendations */}
            {pensionResult.recommendations?.length > 0 && (
              <div className="card">
                <h3 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 18, height: 18 }} /> Recommandations sur votre pension</h3>
                <div className="recs">
                  {pensionResult.recommendations.map((r, i) => (
                    <div key={i} className={`rec ${r.priorite === 'haute' ? 'h' : r.priorite === 'moyenne' ? 'm' : 'b'}`}>
                      <span><CircleDot style={{ width: 12, height: 12, display: 'inline', color: r.priorite === 'haute' ? '#ef4444' : r.priorite === 'moyenne' ? '#eab308' : '#22c55e' }} /></span>
                      <span>{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* ===== STEP 3: SAVINGS PROJECTION ===== */}
        {step === 3 && gap && (
          <div className="fi" ref={resultRef}>
            <div className="card card-p">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><FileText style={{ width: 18, height: 18 }} /> Étape 3 : Projeter mon épargne retraite</h2>
              <div className="narr mb">
                <div className="narr-t">Comment combler le gap avec mon épargne ?</div>
                <div className="narr-x">
                  En épargnant régulièrement avec un rendement approprié, vous pouvez constituer un capital 
                  qui générera un revenu complémentaire à votre pension. Voyons combien vous devez épargner.
                </div>
              </div>
              
              {/* Rappel du gap */}
              {!gap.isPositive && (
                <div className="ibox mb">
                  <strong>Rappel :</strong> Vous devez combler un gap de <strong>{eur(gap.gap)} €/mois</strong> 
                  ({eur(gap.annualGap)} €/an). Capital cible : <strong>{eur(gap.annualGap / 0.04)} €</strong>
                </div>
              )}
              
              <div className="fg">
                <div className="fgrp">
                  <label className="flbl">Épargne actuelle</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={savingsForm.currentSavings}
                      onChange={e => setSavingsForm({...savingsForm, currentSavings: parseInt(e.target.value) || 0})}
                      min="0" step="1000"
                    />
                    <span className="sfx">€</span>
                  </div>
                  <span className="fh">Montant déjà épargné pour la retraite</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Versement mensuel</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={savingsForm.monthlyContribution}
                      onChange={e => setSavingsForm({...savingsForm, monthlyContribution: parseInt(e.target.value) || 0})}
                      min="0" step="50"
                    />
                    <span className="sfx">€/mois</span>
                  </div>
                  <span className="fh">Effort d'épargne régulier</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Rendement annuel espéré</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={savingsForm.expectedReturn}
                      onChange={e => setSavingsForm({...savingsForm, expectedReturn: parseFloat(e.target.value) || 0})}
                      min="0" max="10" step="0.5"
                    />
                    <span className="sfx">%</span>
                  </div>
                  <span className="fh">2% prudent • 4% équilibré • 6% dynamique</span>
                </div>
                
                <div className="fgrp">
                  <label className="flbl">Espérance de vie</label>
                  <div className="iw">
                    <input 
                      type="number" 
                      className="finp" 
                      value={savingsForm.lifeExpectancy}
                      onChange={e => setSavingsForm({...savingsForm, lifeExpectancy: parseInt(e.target.value) || 0})}
                      min="70" max="100"
                    />
                    <span className="sfx">ans</span>
                  </div>
                  <span className="fh">Pour calculer la durée des retraits</span>
                </div>
              </div>
              
              <div className="btns">
                <button className="btn btn-o" onClick={() => setStep(2)}>← Modifier le gap</button>
                <button className="btn" onClick={projectSavings} disabled={loading}>
                  {loading ? 'Calcul...' : 'Projeter mon épargne'}
                </button>
              </div>
              {error && <div className="abox mt">{error}</div>}
            </div>
          </div>
        )}
        
        {/* ===== STEP 4: RESULTS & SCENARIOS ===== */}
        {step === 4 && projectionResult && (
          <div className="fi" ref={resultRef}>
            {/* Projection Results */}
            <div className="card card-s">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><BarChart3 style={{ width: 18, height: 18 }} /> Résultat de la projection</h2>
              
              <div className="narr mb">
                <div className="narr-x">
                  En épargnant <strong>{eur(savingsForm.monthlyContribution)} €/mois</strong> pendant{' '}
                  <strong>{pensionForm.retirementAge - pensionForm.currentAge} ans</strong> à{' '}
                  <strong>{savingsForm.expectedReturn}%</strong>, vous accumulerez{' '}
                  <strong className="v">{eur(projectionResult.savingsAtRetirement)} €</strong> à{' '}
                  <strong>{pensionForm.retirementAge} ans</strong>.
                </div>
              </div>
              
              <div className="kpis">
                <div className="kpi">
                  <div className="kpi-v">{eur(projectionResult.savingsAtRetirement)} €</div>
                  <div className="kpi-l">Capital à la retraite</div>
                </div>
                <div className="kpi suc">
                  <div className="kpi-v">+{eur(projectionResult.investmentGains)} €</div>
                  <div className="kpi-l">Gains (+{projectionResult.gainPercentage}%)</div>
                </div>
                <div className="kpi">
                  <div className="kpi-v">{eur(projectionResult.sustainableMonthlyIncome)} €</div>
                  <div className="kpi-l">Revenu mensuel (4%)</div>
                </div>
                <div className={`kpi ${projectionResult.isRetirementFeasible ? 'suc' : 'err'}`}>
                  <div className="kpi-v">{projectionResult.isRetirementFeasible ? <CheckCircle style={{ width: 24, height: 24, color: '#059669' }} /> : <AlertTriangle style={{ width: 24, height: 24, color: '#f59e0b' }} />}</div>
                  <div className="kpi-l">{projectionResult.isRetirementFeasible ? 'Objectif atteint' : 'Déficit'}</div>
                </div>
              </div>
              
              {/* Chart */}
              <div id="projection-chart" className="chart"></div>
              
              {/* Total Income at Retirement */}
              {pensionResult && (
                <div className="tbox mt">
                  <strong>Revenu total à la retraite :</strong>{' '}
                  {eur(pensionResult.monthlyPension + projectionResult.sustainableMonthlyIncome)} €/mois
                  <br/>
                  <small>
                    Pension ({eur(pensionResult.monthlyPension)} €) + Épargne ({eur(projectionResult.sustainableMonthlyIncome)} €)
                    {' '}= {desiredMonthlyIncome > 0 && (
                      <>{((pensionResult.monthlyPension + projectionResult.sustainableMonthlyIncome) / desiredMonthlyIncome * 100).toFixed(0)}% de votre objectif</>
                    )}
                  </small>
                </div>
              )}
              
              {!projectionResult.isRetirementFeasible && projectionResult.incomeShortfall > 0 && (
                <div className="abox mt">
                  <strong>Déficit mensuel :</strong> {eur(projectionResult.incomeShortfall / 12)} €/mois
                  <br/>
                  <small>Augmentez votre épargne mensuelle ou révisez votre objectif de revenu.</small>
                </div>
              )}
            </div>
            
            {/* Scenario Comparison */}
            <div className="card card-p">
              <h2 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><FileText style={{ width: 18, height: 18 }} /> Étape 4 : Comparer des scénarios</h2>
              <div className="narr mb">
                <div className="narr-t">Quel scénario choisir ?</div>
                <div className="narr-x">
                  Modifiez les paramètres de chaque scénario puis comparez-les pour voir l'impact sur votre capital et vos revenus.
                </div>
              </div>
              
              <div className="g3">
                {scenarios.map((s, i) => (
                  <div key={i} className={`scen ${scenariosResult?.bestScenario?.name === s.nom ? 'best' : ''}`}>
                    <div className="scen-h">
                      <span className="scen-t">{s.nom}</span>
                      {scenariosResult?.bestScenario?.name === s.nom && (
                        <span className="bdg bdg-s" style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}><Trophy style={{ width: 12, height: 12 }} /> Meilleur</span>
                      )}
                    </div>
                    <div className="fg" style={{gridTemplateColumns:'1fr 1fr'}}>
                      <div className="fgrp">
                        <label className="flbl">Âge départ</label>
                        <div className="iw">
                          <input 
                            type="number" 
                            className="finp" 
                            value={s.retirementAge}
                            onChange={e => {
                              const newScenarios = [...scenarios]
                              newScenarios[i].retirementAge = parseInt(e.target.value) || 62
                              setScenarios(newScenarios)
                            }}
                            min="62" max="70"
                          />
                          <span className="sfx">ans</span>
                        </div>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Mensuel</label>
                        <div className="iw">
                          <input 
                            type="number" 
                            className="finp" 
                            value={s.monthlyContribution}
                            onChange={e => {
                              const newScenarios = [...scenarios]
                              newScenarios[i].monthlyContribution = parseInt(e.target.value) || 0
                              setScenarios(newScenarios)
                            }}
                            min="0" step="50"
                          />
                          <span className="sfx">€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="btns">
                <button className="btn" onClick={compareScenarios} disabled={loading}>
                  {loading ? 'Comparaison...' : 'Comparer les scénarios'}
                </button>
              </div>
              
              {/* Scenarios Results Table */}
              {scenariosResult && (
                <div className="mt">
                  <table>
                    <thead>
                      <tr>
                        <th>Scénario</th>
                        <th>Départ</th>
                        <th>Capital</th>
                        <th>Revenu/mois</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenariosResult.scenarios?.map((s, i) => (
                        <tr key={i} style={{background: s.isBestScenario ? '#ecfdf5' : ''}}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.retirementAge} ans</td>
                          <td className="v">{eur(s.savingsAtRetirement)} €</td>
                          <td>{eur(s.sustainableMonthlyIncome)} €</td>
                          <td>
                            {s.isRetirementFeasible ? (
                              <span className="bdg bdg-s">Viable</span>
                            ) : (
                              <span className="bdg bdg-e">Déficit</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="ibox mt">
                    <strong>Résumé :</strong> {scenariosResult.summary}
                  </div>
                </div>
              )}
            </div>
            
            {/* Recommendations */}
            {projectionResult.recommendations?.length > 0 && (
              <div className="card">
                <h3 className="card-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 18, height: 18 }} /> Recommandations</h3>
                <div className="recs">
                  {projectionResult.recommendations.map((r, i) => (
                    <div key={i} className={`rec ${r.priorite === 'haute' ? 'h' : r.priorite === 'moyenne' ? 'm' : 'b'}`}>
                      <span><CircleDot style={{ width: 12, height: 12, display: 'inline', color: r.priorite === 'haute' ? '#ef4444' : r.priorite === 'moyenne' ? '#eab308' : '#22c55e' }} /></span>
                      <span>{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="btns">
              <button className="btn btn-o" onClick={() => setStep(3)}>← Modifier l'épargne</button>
              <button className="btn btn-o" onClick={() => setStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><RefreshCw style={{ width: 14, height: 14 }} /> Recommencer</button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
