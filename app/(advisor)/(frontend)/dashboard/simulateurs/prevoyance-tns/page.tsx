'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { getTMI, getNombreParts } from '../parameters'
import { ExportSimulationActions } from '@/app/(advisor)/(frontend)/components/simulateurs/ExportSimulationActions'
import {
  Shield, ArrowLeft, ChevronRight, ChevronLeft, User, DollarSign,
  Home, Heart, AlertTriangle, CheckCircle, Info, TrendingDown, TrendingUp,
  Clock, Activity, FileText, Target, Zap, HelpCircle, Calendar,
  BarChart3, Users, Loader2, ArrowRight, Landmark,
  Stethoscope, Scale, Wallet, ShieldAlert, ShieldCheck,
  CircleDollarSign, HeartPulse, GraduationCap, Building2, Briefcase,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES — Backend sections structure
// ══════════════════════════════════════════════════════════════════════════════
interface Profession { value: string; text: string; caisses: string[] }
interface Secteur { secteur: string; professions: Profession[] }
interface ClasseCotisation { classe: string; ij: number | string; invalidite: number | null; deces: number; descIj: string; descInv: string; descDeces: string; isProportionnel?: boolean; exempleIJ?: string }

interface Alerte { type: 'danger' | 'warning' | 'info' | 'success'; titre: string; message: string; icon: string }

interface SectionIJ {
  ijJour: number; ijMensuel: number; ijJourPhase2: number; ijMensuelPhase2: number
  regime: string; phase1: { debut: number; fin: number; source: string; ijJour: number; carence: number }
  phase2: { debut: number; fin: number | null; source: string; ijJour: number } | null
  franchise: number; dureeMax: string; tauxCouverture: number; ecart: number; objectif: number
  alertes: Alerte[]; explication: string; conseils: string[]
  simulation: Array<{ mois: number; joursArret: number; joursTravailles: number; ijTotal: number; revenuTravail: number; totalMois: number; source: string; perte: number; tauxMaintien: number }>
}

interface SectionInvalidite {
  renteMensuelle: number; renteAnnuelle: number; tauxCouverture: number; ecart: number; objectif: number
  invaliditePartielle: boolean; invaliditeTotale: boolean; conditionsObtention: string
  alertes: Alerte[]; explication: string; conseils: string[]
  details: { categoriesExistantes: Array<{ nom: string; taux: string; montant: number }>; delaiCarence: string; duree: string }
}

interface SectionDeces {
  capitalBase: number; capitalDoubleAccident: boolean; tauxCouverture: number; ecart: number; objectif: number
  moisDeRevenus: number; beneficiaires: string
  alertes: Alerte[]; explication: string; conseils: string[]
  detailObjectif: { remplacementRevenu: number; liquidationPro: number; educationEnfants: number; conjoint: number; total: number }
}

interface Synthese {
  scoreGlobal: number; niveau: string; couleur: string; resume: string
  priorites: Array<{ rang: number; domaine: string; urgence: string; action: string; impact: string }>
  perteMaximale: { mensuelle: number; annuelle: number; description: string }
  recommandationPrincipale: string; pointsForts: string[]; pointsFaibles: string[]
}

interface SimulationResult {
  formData: { profession: string; codeCaisse: string; classeValue: string; revenuAn: number; age: number; situation: string; nbEnfants: number; chargePerso: number; chargePro: number }
  sections: { ij: SectionIJ; invalidite: SectionInvalidite; deces: SectionDeces }
  synthese: Synthese
  params2025: { annee: number; pass: number }
  hasCPAM: boolean; isCNBF: boolean
  baseGuarantees: any; idealCoverage: any; caisseInfo: { code: string; description: string; garanties: unknown }
  madelin?: { plafondDeductible: number; revenuBase: number }
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════
const fmtEur = (n: number) => n == null || isNaN(n) ? '0 €' : Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => Math.min(100, Math.max(0, Math.round(n))) + ' %'
const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v)))
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function scoreColor(score: number): string {
  if (score < 25) return '#dc2626'
  if (score < 50) return '#ea580c'
  if (score < 70) return '#ca8a04'
  if (score < 90) return '#16a34a'
  return '#059669'
}

function scoreBg(score: number): string {
  if (score < 25) return 'bg-red-50 border-red-200'
  if (score < 50) return 'bg-orange-50 border-orange-200'
  if (score < 70) return 'bg-amber-50 border-amber-200'
  if (score < 90) return 'bg-green-50 border-green-200'
  return 'bg-emerald-50 border-emerald-200'
}

function urgenceStyle(urgence: string) {
  if (urgence === 'haute') return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
  if (urgence === 'moyenne') return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
  return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT JAUGE SVG (amélioré)
// ══════════════════════════════════════════════════════════════════════════════
function GaugeSVG({ value, label, sublabel, color, size = 120 }: { value: number; label: string; sublabel?: string; color?: string; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const v = pct(value)
  const strokeDashoffset = circumference - (v / 100) * circumference
  const c = color || scoreColor(v)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: c }}>{v}%</span>
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{label}</span>
        {sublabel && <span className="text-[10px] text-gray-400 mt-0.5 text-center leading-tight max-w-[80%]">{sublabel}</span>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT STEPPER (Lucide icons)
// ══════════════════════════════════════════════════════════════════════════════
const STEP_ICONS = [Briefcase, DollarSign, Home]
function Stepper({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center max-w-lg mx-auto mb-8">
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[i] || Info
        return (
          <div key={i} className={`flex items-center ${i === steps.length - 1 ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300
                ${i < current ? 'bg-indigo-600 text-white' : i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {i < current ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-[11px] font-medium ${i <= current ? 'text-indigo-600' : 'text-gray-400'}`}>{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-3 mt-[-18px] transition-all duration-300 ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT ALERTE
// ══════════════════════════════════════════════════════════════════════════════
function AlerteCard({ alerte }: { alerte: Alerte }) {
  const styles: Record<string, { bg: string; border: string; icon: typeof AlertTriangle }> = {
    danger: { bg: 'bg-red-50', border: 'border-red-300', icon: AlertTriangle },
    warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: AlertTriangle },
    info: { bg: 'bg-blue-50', border: 'border-blue-300', icon: Info },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-300', icon: CheckCircle },
  }
  const s = styles[alerte.type] || styles.info
  const IconComp = s.icon
  return (
    <div className={`${s.bg} border ${s.border} rounded-lg p-3 flex gap-3 items-start`}>
      <IconComp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alerte.type === 'danger' ? 'text-red-500' : alerte.type === 'warning' ? 'text-amber-500' : alerte.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`} />
      <div>
        <div className="font-semibold text-sm text-gray-900">{alerte.titre}</div>
        <div className="text-xs text-gray-600 mt-0.5">{alerte.message}</div>
      </div>
    </div>
  )
}

// ============================================================================
// BOUTON RAPPORT INTELLIGENT
// ============================================================================
function BtnRapportIntelligent({ result }: { result: SimulationResult }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/advisor/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'RAPPORT_PREVOYANCE_TNS',
          id: `prev-tns-${Date.now()}`,
          prevoyanceTnsData: {
            formData: result.formData,
            sections: result.sections,
            synthese: result.synthese,
            params2025: result.params2025,
            hasCPAM: result.hasCPAM,
            isCNBF: result.isCNBF,
            madelin: result.madelin,
            client: { nom: 'Client', prenom: '' },
          },
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Erreur ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bilan_protection_sociale_${result.formData.codeCaisse.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du rapport')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {loading ? 'Génération...' : 'Bilan Intelligent PDF'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function PrevoyanceTNSPage() {
  // États
  const resultRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0) // 0: Intro, 1: Pro, 2: Finance, 3: Famille, 4: Résultats
  const [loading, setLoading] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  
  // Données
  const [professions, setProfessions] = useState<Secteur[]>([])
  const [caissesOptions, setCaissesOptions] = useState<string[]>([])
  const [classesOptions, setClassesOptions] = useState<ClasseCotisation[] | null>(null)
  
  // Formulaire
  const [form, setForm] = useState({ 
    profession: '', 
    codeCaisse: '', 
    classeValue: '', 
    revenuAn: '', 
    age: '', 
    situation: 'celibataire', 
    nbEnfants: '0', 
    chargePerso: '', 
    chargePro: '' 
  })
  
  const [error, setError] = useState('')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [activeTab, setActiveTab] = useState<'synthese' | 'ij' | 'invalidite' | 'deces'>('synthese')
  const [jourArret, setJourArret] = useState(30)

  // Chargement config initiale
  useEffect(() => { 
    fetch('/api/advisor/simulators/prevoyance-tns')
      .then(r => {
        if (!r.ok) throw new Error('Erreur chargement configuration')
        return r.json()
      })
      .then(d => { 
        if (d.success) setProfessions(d.data.professions)
        else throw new Error(d.error || 'Erreur configuration')
      })
      .catch(err => {
        console.error("Erreur chargement config:", err)
        setError("Impossible de charger les données du simulateur. Veuillez rafraîchir la page.")
      })
      .finally(() => setLoadingConfig(false)) 
  }, [])

  // Logique Caisse
  useEffect(() => { 
    if (!form.profession) { setCaissesOptions([]); setClassesOptions(null); return }
    for (const s of professions) { 
      const p = s.professions.find(x => x.value === form.profession)
      if (p) { setCaissesOptions(p.caisses); break } 
    }
    setForm(f => ({ ...f, codeCaisse: '', classeValue: '' }))
    setClassesOptions(null) 
  }, [form.profession, professions])

  // Logique Classes
  useEffect(() => { 
    if (!form.codeCaisse) { setClassesOptions(null); return }
    setClassesOptions(null) // Reset avant chargement
    
    fetch('/api/advisor/simulators/prevoyance-tns?action=classes&caisse=' + form.codeCaisse)
      .then(r => {
        if (!r.ok) throw new Error('Erreur chargement classes')
        return r.json()
      })
      .then(d => { 
        if (d.success && d.classes?.length) setClassesOptions(d.classes)
        else setClassesOptions(null) 
      })
      .catch(err => console.error("Erreur chargement classes:", err))
  }, [form.codeCaisse])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Navigation Wizard
  const nextStep = () => {
    if (step === 1 && (!form.profession || !form.codeCaisse)) return
    if (step === 2 && (!form.revenuAn || !form.age)) return
    setStep(s => s + 1)
  }
  const prevStep = () => setStep(s => s - 1)
  
  // Soumission finale
  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    
    // Valeurs par défaut intelligentes si vide
    const rAn = parseFloat(form.revenuAn) || 0
    const cPerso = form.chargePerso ? parseFloat(form.chargePerso) : Math.round(rAn / 12 * 0.35) // Est. 35%
    const cPro = form.chargePro ? parseFloat(form.chargePro) : Math.round(rAn / 12 * 0.15) // Est. 15%

    try {
      const res = await fetch('/api/advisor/simulators/prevoyance-tns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, chargePerso: cPerso, chargePro: cPro })
      })
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        setResult(data)
        setStep(4)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setError(data.error || 'Une erreur est survenue lors de la simulation.')
      }
    } catch (err) {
      console.error(err)
      setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // DONNÉES EXTRAITES DU BACKEND (sections pré-calculées)
  // ============================================================================
  const sec = result?.sections ?? null
  const syn = result?.synthese ?? null

  const revenuMensuel = useMemo(() => result ? Math.round(result.formData.revenuAn / 12) : 0, [result])
  const chargesTotal = useMemo(() => result ? result.formData.chargePerso + result.formData.chargePro : 0, [result])

  const fiscalImpact = useMemo(() => {
    if (!result) return null
    const revenu = result.formData.revenuAn
    const nbParts = getNombreParts(result.formData.situation as any, result.formData.nbEnfants)
    const tmi = getTMI(revenu / nbParts)
    // Utiliser le plafond Madelin calculé par le backend si disponible, sinon estimation 4%
    const plafondMadelin = result.madelin?.plafondDeductible ?? Math.round(revenu * 0.04)
    const estimCotisation = Math.min(Math.round(revenu * 0.04), plafondMadelin)
    const economieImpot = Math.round(estimCotisation * tmi)
    return { tmi: Math.round(tmi * 100), estimCotisation, economieImpot, plafondMadelin }
  }, [result])

  // PDF export params/results for ExportSimulationActions — données exhaustives
  const pdfParams = useMemo(() => {
    if (!result) return []
    const fd = result.formData
    const situationLabels: Record<string, string> = {
      celibataire: 'Célibataire',
      couple: 'En couple sans enfant',
      enfants: 'En couple avec enfants',
      monoparental: 'Parent célibataire'
    }
    return [
      { label: 'Profession', valeur: fd.profession },
      { label: 'Caisse de retraite', valeur: fd.codeCaisse },
      { label: 'Revenu annuel net', valeur: fd.revenuAn, unite: '€' },
      { label: 'Revenu mensuel net', valeur: Math.round(fd.revenuAn / 12), unite: '€' },
      { label: 'Âge', valeur: fd.age, unite: 'ans' },
      { label: 'Situation familiale', valeur: situationLabels[fd.situation] || fd.situation },
      { label: 'Enfants à charge', valeur: fd.nbEnfants },
      { label: 'Charges personnelles / mois', valeur: fd.chargePerso, unite: '€' },
      { label: 'Charges professionnelles / mois', valeur: fd.chargePro, unite: '€' },
      { label: 'Charges totales / mois', valeur: fd.chargePerso + fd.chargePro, unite: '€' },
    ]
  }, [result])

  const pdfResults = useMemo(() => {
    if (!sec || !syn || !fiscalImpact || !result) return []
    const annRetraite = Math.max(1, 65 - (result.formData.age || 0))
    const ecartInv = Math.max(0, revenuMensuel - sec.invalidite.renteMensuelle)
    const perteIJ3ans = sec.ij.simulation.reduce((acc: number, s: { perte: number }) => acc + s.perte, 0)
    const results: Array<{ label: string; valeur: string | number; unite?: string; important?: boolean }> = [
      // — SYNTHÈSE GLOBALE —
      { label: '═══ BILAN DE PROTECTION SOCIALE ═══', valeur: '', important: true },
      { label: 'Score global de protection', valeur: `${syn.scoreGlobal}% — ${syn.niveau}`, important: true },
      { label: 'Résumé', valeur: syn.resume, important: true },
      { label: 'Recommandation principale', valeur: syn.recommandationPrincipale, important: true },
      { label: '', valeur: '' },

      // — ARRÊT MALADIE —
      { label: '═══ ARRÊT MALADIE — INDEMNITÉS JOURNALIÈRES ═══', valeur: '', important: true },
      { label: 'Régime applicable', valeur: sec.ij.regime },
      { label: 'IJ journalière (phase 1)', valeur: sec.ij.ijJour, unite: '€/jour' },
      { label: 'IJ mensuelle (phase 1)', valeur: sec.ij.ijMensuel, unite: '€/mois' },
      ...(sec.ij.phase2 ? [
        { label: `IJ journalière (phase 2, à partir de J${sec.ij.phase2.debut})`, valeur: sec.ij.ijJourPhase2, unite: '€/jour' },
        { label: `IJ mensuelle (phase 2, ${sec.ij.phase2.source})`, valeur: sec.ij.ijMensuelPhase2, unite: '€/mois' },
      ] : []),
      { label: 'Franchise / Carence', valeur: `${sec.ij.franchise} jours` },
      { label: 'Perte pendant la franchise', valeur: Math.round(revenuMensuel / 30 * sec.ij.franchise), unite: '€' },
      { label: 'Durée maximale d\'indemnisation', valeur: sec.ij.dureeMax },
      { label: 'Taux de couverture', valeur: `${sec.ij.tauxCouverture}%` },
      { label: 'Objectif (100% du revenu)', valeur: sec.ij.objectif, unite: '€/mois' },
      { label: 'Écart mensuel à combler', valeur: sec.ij.ecart, unite: '€/mois', important: sec.ij.ecart > 0 },
      { label: 'Perte cumulée sur 3 ans d\'arrêt', valeur: Math.round(perteIJ3ans), unite: '€', important: true },
      { label: 'Explication', valeur: sec.ij.explication },
      { label: '', valeur: '' },

      // — INVALIDITÉ —
      { label: '═══ INVALIDITÉ — RENTE ═══', valeur: '', important: true },
      { label: 'Rente mensuelle', valeur: sec.invalidite.renteMensuelle, unite: '€/mois' },
      { label: 'Rente annuelle', valeur: sec.invalidite.renteAnnuelle, unite: '€/an' },
      { label: 'Taux de couverture', valeur: `${sec.invalidite.tauxCouverture}%` },
      { label: 'Écart mensuel', valeur: sec.invalidite.ecart, unite: '€/mois', important: sec.invalidite.ecart > 0 },
      { label: 'Conditions d\'obtention', valeur: sec.invalidite.conditionsObtention || '-' },
      { label: `Perte cumulée jusqu'à la retraite (${annRetraite} ans)`, valeur: Math.round(ecartInv * 12 * annRetraite), unite: '€', important: true },
      { label: 'Explication', valeur: sec.invalidite.explication },
      { label: '', valeur: '' },

      // — DÉCÈS —
      { label: '═══ DÉCÈS — CAPITAL ═══', valeur: '', important: true },
      { label: 'Capital de base (caisse)', valeur: sec.deces.capitalBase, unite: '€' },
      { label: 'Équivalent en mois de revenus', valeur: `${sec.deces.moisDeRevenus} mois` },
      { label: 'Taux de couverture', valeur: `${sec.deces.tauxCouverture}%` },
      { label: 'Capital recommandé', valeur: sec.deces.objectif, unite: '€', important: true },
      ...(sec.deces.detailObjectif ? [
        { label: '  → Remplacement de revenus (24 mois)', valeur: sec.deces.detailObjectif.remplacementRevenu, unite: '€' },
        { label: '  → Liquidation professionnelle', valeur: sec.deces.detailObjectif.liquidationPro, unite: '€' },
        { label: '  → Éducation des enfants', valeur: sec.deces.detailObjectif.educationEnfants, unite: '€' },
        { label: '  → Protection du conjoint', valeur: sec.deces.detailObjectif.conjoint, unite: '€' },
      ] : []),
      { label: 'Écart à combler', valeur: sec.deces.ecart, unite: '€', important: sec.deces.ecart > 0 },
      { label: 'Exonération fiscale', valeur: 'Oui — hors succession, exonéré de droits (loi TEPA)' },
      { label: 'Explication', valeur: sec.deces.explication },
      { label: '', valeur: '' },

      // — PERTE MAXIMALE —
      { label: '═══ EXPOSITION MAXIMALE ═══', valeur: '', important: true },
      { label: 'Perte mensuelle maximale', valeur: syn.perteMaximale.mensuelle, unite: '€/mois', important: true },
      { label: 'Perte annuelle maximale', valeur: syn.perteMaximale.annuelle, unite: '€/an', important: true },
      { label: 'Description', valeur: syn.perteMaximale.description },
      { label: '', valeur: '' },

      // — FISCALITÉ MADELIN —
      { label: '═══ OPTIMISATION FISCALE MADELIN ═══', valeur: '', important: true },
      { label: 'TMI (Taux Marginal d\'Imposition)', valeur: `${fiscalImpact.tmi}%` },
      { label: 'Plafond déductible Madelin', valeur: fiscalImpact.plafondMadelin, unite: '€/an' },
      { label: 'Cotisation estimée (4% du BNC)', valeur: fiscalImpact.estimCotisation, unite: '€/an' },
      { label: 'Économie d\'impôt sur le revenu', valeur: fiscalImpact.economieImpot, unite: '€/an', important: true },
      { label: 'Coût réel net après déduction fiscale', valeur: fiscalImpact.estimCotisation - fiscalImpact.economieImpot, unite: '€/an', important: true },
      { label: 'Explication', valeur: `En souscrivant une prévoyance Madelin, vous déduisez les cotisations de votre BNC. À votre TMI de ${fiscalImpact.tmi}%, chaque euro cotisé ne vous coûte réellement que ${Math.round((1 - fiscalImpact.tmi / 100) * 100)} centimes.` },
      { label: '', valeur: '' },

      // — PRIORITÉS D'ACTION —
      { label: '═══ PRIORITÉS D\'ACTION ═══', valeur: '', important: true },
    ]
    syn.priorites.forEach((p: { rang: number; domaine: string; urgence: string; action: string; impact: string }) => {
      results.push({ label: `Priorité ${p.rang} (${p.urgence}) — ${p.domaine}`, valeur: `${p.action}. Impact : ${p.impact}`, important: p.urgence === 'haute' })
    })

    // Points forts et faibles
    if (syn.pointsFaibles.length > 0) {
      results.push({ label: '', valeur: '' })
      results.push({ label: '═══ POINTS DE VIGILANCE ═══', valeur: '', important: true })
      syn.pointsFaibles.forEach((pf: string, i: number) => {
        results.push({ label: `⚠ ${i + 1}.`, valeur: pf })
      })
    }
    if (syn.pointsForts.length > 0) {
      results.push({ label: '', valeur: '' })
      results.push({ label: '═══ POINTS FORTS ═══', valeur: '', important: true })
      syn.pointsForts.forEach((pf: string, i: number) => {
        results.push({ label: `✓ ${i + 1}.`, valeur: pf })
      })
    }

    return results
  }, [sec, syn, fiscalImpact, result, revenuMensuel])

  // Échéancier pour le PDF — projection 36 mois avec cumuls annuels
  const pdfEcheancier = useMemo(() => {
    if (!sec) return undefined
    const simulation = sec.ij.simulation as Array<{ mois: number; ijTotal: number; perte: number; tauxMaintien: number; source: string }>
    const rows: Array<Record<string, string | number>> = []
    let perteCumulee = 0
    let ijCumulees = 0

    simulation.forEach((sim) => {
      perteCumulee += sim.perte
      ijCumulees += sim.ijTotal
      rows.push({
        'Mois': sim.mois,
        'IJ perçues': `${sim.ijTotal.toLocaleString('fr-FR')} €`,
        'Perte mensuelle': `-${sim.perte.toLocaleString('fr-FR')} €`,
        'Perte cumulée': `-${Math.round(perteCumulee).toLocaleString('fr-FR')} €`,
        'Taux maintien': `${sim.tauxMaintien}%`,
        'Source': sim.source,
      })
      // Ajouter un sous-total annuel
      if (sim.mois % 12 === 0) {
        const annee = sim.mois / 12
        const ijAnnee = simulation.filter(s => s.mois > (annee - 1) * 12 && s.mois <= annee * 12).reduce((a, s) => a + s.ijTotal, 0)
        const perteAnnee = simulation.filter(s => s.mois > (annee - 1) * 12 && s.mois <= annee * 12).reduce((a, s) => a + s.perte, 0)
        rows.push({
          'Mois': `── TOTAL ANNÉE ${annee} ──` as any,
          'IJ perçues': `${Math.round(ijAnnee).toLocaleString('fr-FR')} €`,
          'Perte mensuelle': '',
          'Perte cumulée': `-${Math.round(perteCumulee).toLocaleString('fr-FR')} €`,
          'Taux maintien': '',
          'Source': `Perte année : -${Math.round(perteAnnee).toLocaleString('fr-FR')} €`,
        })
      }
    })

    return rows
  }, [sec])

  // Avertissements PDF enrichis — inclut alertes + conseils de toutes les sections
  const pdfAvertissements = useMemo(() => {
    if (!syn || !sec) return undefined
    const warnings: string[] = []
    // Alertes critiques d'abord
    const allAlertes = [...sec.ij.alertes, ...sec.invalidite.alertes, ...sec.deces.alertes]
    allAlertes.filter((a: Alerte) => a.type === 'danger').forEach((a: Alerte) => {
      warnings.push(`🔴 ${a.titre} : ${a.message}`)
    })
    allAlertes.filter((a: Alerte) => a.type === 'warning').forEach((a: Alerte) => {
      warnings.push(`🟠 ${a.titre} : ${a.message}`)
    })
    // Points faibles
    syn.pointsFaibles.forEach((pf: string) => warnings.push(`⚠ ${pf}`))
    // Conseils de chaque section
    if (sec.ij.conseils?.length > 0) {
      warnings.push('', '── Recommandations IJ ──')
      sec.ij.conseils.forEach((c: string) => warnings.push(`→ ${c}`))
    }
    if (sec.invalidite.conseils?.length > 0) {
      warnings.push('', '── Recommandations Invalidité ──')
      sec.invalidite.conseils.forEach((c: string) => warnings.push(`→ ${c}`))
    }
    if (sec.deces.conseils?.length > 0) {
      warnings.push('', '── Recommandations Décès ──')
      sec.deces.conseils.forEach((c: string) => warnings.push(`→ ${c}`))
    }
    return warnings.length > 0 ? warnings : undefined
  }, [syn, sec])

  // Simulation jour par jour du slider — calcul dynamique pour chaque valeur du curseur
  const sliderData = useMemo(() => {
    if (!sec || !result) return null
    const ij = sec.ij

    // Calculer les IJ cumulées jour par jour jusqu'à jourArret
    let ijCumulees = 0
    let joursFranchise = 0
    let joursIndemnises = 0
    let sourceActuelle = ''

    for (let d = 1; d <= jourArret; d++) {
      if (result.isCNBF) {
        if (d <= 90) {
          ijCumulees += ij.phase1.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase1.source
        } else if (ij.phase2) {
          ijCumulees += ij.phase2.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase2.source
        }
      } else if (result.hasCPAM) {
        if (d <= ij.phase1.carence) {
          joursFranchise++
        } else if (d <= 90) {
          ijCumulees += ij.phase1.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase1.source
        } else if (ij.phase2) {
          ijCumulees += ij.phase2.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase2.source
        }
      } else if (ij.regime === 'SSI' || ij.regime === 'MSA') {
        if (d <= ij.phase1.carence) {
          joursFranchise++
        } else {
          ijCumulees += ij.phase1.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase1.source
        }
      } else {
        // Franchise longue (90 jours typiquement)
        if (d <= ij.franchise) {
          joursFranchise++
        } else {
          ijCumulees += ij.phase1.ijJour
          joursIndemnises++
          sourceActuelle = ij.phase1.source
        }
      }
    }

    ijCumulees = Math.round(ijCumulees)
    const moisFraction = jourArret / 30
    const ijMensuelise = moisFraction > 0 ? Math.round(ijCumulees / moisFraction) : 0
    const revenuPerdu = Math.round(revenuMensuel * moisFraction)
    const perteTotale = revenuPerdu - ijCumulees
    const resteNormal = revenuMensuel - chargesTotal
    const resteArret = ijMensuelise - chargesTotal
    const tauxMaintien = revenuMensuel > 0 ? Math.round((ijMensuelise / revenuMensuel) * 100) : 0
    const epargnePrecautionNecessaire = Math.round(joursFranchise * (revenuMensuel / 30))

    return {
      ijCumulees,
      ijMensuelise,
      ijTotal: ijMensuelise, // Compatibilité avec l'ancienne prop
      joursFranchise,
      joursIndemnises,
      sourceActuelle: sourceActuelle || 'Aucune (franchise)',
      revenuMensuel,
      chargesTotal,
      resteNormal,
      resteArret,
      perteTotale,
      revenuPerdu,
      tauxMaintien,
      epargnePrecautionNecessaire,
      mois: Math.ceil(jourArret / 30),
    }
  }, [sec, result, jourArret, revenuMensuel, chargesTotal])

  if (loadingConfig) return (
    <SimulatorGate simulator="PREVOYANCE" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    </SimulatorGate>
  )

  return (
    <SimulatorGate simulator="PREVOYANCE" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <main className="container mx-auto px-4 py-6 max-w-5xl">
          <Link href="/dashboard/simulateurs" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Retour aux simulateurs
          </Link>
          
          {/* HEADER */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <Shield className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulateur Prévoyance TNS</h1>
                <p className="text-gray-600">Analysez votre protection sociale et optimisez votre fiscalité Madelin</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">TNS 2026</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Madelin</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Multi-Caisses</span>
            </div>
          </div>

          {/* ============ WIZARD FORMULAIRE ============ */}
          {step < 4 && (
            <div className="animate-fadeIn">
              <Stepper current={step} steps={['Profession', 'Finances', 'Situation']} />
              
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto">
                <form onSubmit={onSubmit}>
                  {/* ÉTAPE 1 : PROFIL PRO */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-indigo-600" /> Votre profil professionnel</h2>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profession <span className="text-red-500">*</span>
                        </label>
                        <select name="profession" value={form.profession} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                          <option value="">Sélectionnez votre profession...</option>
                          {professions.map(s => <optgroup key={s.secteur} label={s.secteur}>{s.professions.map(p => <option key={p.value} value={p.value}>{p.text}</option>)}</optgroup>)}
                        </select>
                      </div>
                      
                      {caissesOptions.length > 0 && (
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Caisse de retraite <span className="text-red-500">*</span>
                          </label>
                          <select name="codeCaisse" value={form.codeCaisse} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                            <option value="">Sélectionnez votre caisse...</option>
                            {caissesOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Votre caisse détermine vos garanties de base</p>
                        </div>
                      )}
                      
                      {classesOptions && classesOptions.length > 0 && (
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Classe de cotisation</label>
                          <select name="classeValue" value={form.classeValue} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Automatique (selon revenu)</option>
                            {classesOptions.map((c, i) => <option key={i} value={i}>Classe {c.classe} - {c.isProportionnel ? 'IJ proportionnelle' : `IJ: ${c.ij}€/j`}</option>)}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-4 border-t">
                        <button type="button" className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg cursor-not-allowed" disabled>Précédent</button>
                        <button type="button" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1" onClick={nextStep} disabled={!form.profession || !form.codeCaisse}>Suivant <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : FINANCES */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-indigo-600" /> Vos revenus</h2>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1" title="Le revenu net imposable de votre activité (BNC ou Rémunération de gérance) avant impôt">
                          Revenu annuel net (BNC/Rémunération) <span className="text-gray-400 cursor-help">ℹ️</span> <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input type="number" name="revenuAn" value={form.revenuAn} onChange={onChange} className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ex: 72000" required min="0" autoFocus />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€/an</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Base de calcul pour vos indemnités et la fiscalité</p>
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Âge <span className="text-red-500">*</span>
                        </label>
                        <input type="number" name="age" value={form.age} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ex: 42" required min="18" max="70" />
                      </div>
                      
                      <div className="flex justify-between pt-4 border-t">
                        <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Précédent</button>
                        <button type="button" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1" onClick={nextStep} disabled={!form.revenuAn || !form.age}>Suivant <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : SITUATION & CHARGES */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2"><Home className="w-5 h-5 text-indigo-600" /> Situation & Charges</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Situation familiale</label>
                          <select name="situation" value={form.situation} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="celibataire">Célibataire</option>
                            <option value="couple">En couple sans enfant</option>
                            <option value="enfants">En couple avec enfants</option>
                            <option value="monoparental">Parent célibataire</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Enfants à charge</label>
                          <input type="number" name="nbEnfants" value={form.nbEnfants} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" min="0" max="10" />
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span><strong>Optionnel :</strong> Charges mensuelles. Si vide, estimation standard (35% Perso / 15% Pro).</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Charges Perso / mois</label>
                          <div className="relative">
                            <input type="number" name="chargePerso" value={form.chargePerso} onChange={onChange} className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Estim. auto" min="0" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Charges Pro / mois</label>
                          <div className="relative">
                            <input type="number" name="chargePro" value={form.chargePro} onChange={onChange} className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Estim. auto" min="0" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1" onClick={prevStep}><ChevronLeft className="w-4 h-4" /> Précédent</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1" disabled={loading}>
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Calcul en cours...</> : <><BarChart3 className="w-4 h-4" /> Lancer l&apos;analyse</>}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mt-4 max-w-2xl mx-auto">
                  {error}
                </div>
              )}
            </div>
          )}

        {/* ============ RÉSULTATS ============ */}
        {step === 4 && result && sec && syn && fiscalImpact && (
          <div ref={resultRef} className="space-y-6 animate-fadeIn">
            
            {/* Bouton retour + Export PDF */}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Modifier les paramètres
              </button>
              <div className="flex items-center gap-2">
                <ExportSimulationActions
                  simulateurTitre="Prévoyance TNS"
                  simulationType="PREVOYANCE_TNS"
                  parametres={pdfParams}
                  resultats={pdfResults}
                  echeancier={pdfEcheancier}
                  avertissements={pdfAvertissements}
                  notes={[
                    `BILAN PRÉVOYANCE TNS — ${result.formData.codeCaisse}`,
                    `Score de protection : ${syn.scoreGlobal}% (${syn.niveau})`,
                    '',
                    syn.resume,
                    '',
                    `RECOMMANDATION PRINCIPALE : ${syn.recommandationPrincipale}`,
                    '',
                    `En cas d'arrêt de travail : IJ de ${fmtEur(sec.ij.ijMensuel)}/mois (${pct(sec.ij.tauxCouverture)}% du revenu) après ${sec.ij.franchise} jours de franchise. Régime : ${sec.ij.regime}. Durée max : ${sec.ij.dureeMax}.`,
                    `En cas d'invalidité : rente de ${fmtEur(sec.invalidite.renteMensuelle)}/mois (${pct(sec.invalidite.tauxCouverture)}% du revenu).`,
                    `En cas de décès : capital de ${fmtEur(sec.deces.capitalBase)} (${pct(sec.deces.tauxCouverture)}% de l'objectif de ${fmtEur(sec.deces.objectif)}).`,
                    '',
                    `Perte maximale : ${fmtEur(syn.perteMaximale.mensuelle)}/mois soit ${fmtEur(syn.perteMaximale.annuelle)}/an.`,
                    `Opportunité Madelin : économie d'impôt de ${fmtEur(fiscalImpact.economieImpot)}/an (TMI ${fiscalImpact.tmi}%).`,
                    '',
                    'Ce document est un bilan indicatif basé sur les paramètres déclarés. Il ne constitue pas un conseil personnalisé. Consultez votre conseiller pour une analyse complète.',
                  ].join('\n')}
                />
                <BtnRapportIntelligent result={result} />
              </div>
            </div>
            
            {/* TABS DE NAVIGATION */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([
                { key: 'synthese', Icon: BarChart3, label: 'Synthèse' },
                { key: 'ij', Icon: Stethoscope, label: 'Arrêt maladie' },
                { key: 'invalidite', Icon: HeartPulse, label: 'Invalidité' },
                { key: 'deces', Icon: Heart, label: 'Décès' },
              ] as const).map(tab => (
                <button key={tab.key} type="button" 
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${activeTab === tab.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}>
                  <tab.Icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* ================ ONGLET SYNTHÈSE ================ */}
            {activeTab === 'synthese' && (
              <div className="space-y-6">
                {/* Score global + Jauges unifiées */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="flex flex-col items-center">
                      <GaugeSVG value={syn.scoreGlobal} label="Score Global" size={150} />
                      <span className={`mt-2 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${syn.niveau === 'critique' ? 'bg-red-100 text-red-700' : syn.niveau === 'insuffisant' ? 'bg-orange-100 text-orange-700' : syn.niveau === 'moyen' ? 'bg-amber-100 text-amber-700' : syn.niveau === 'bon' ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'}`}>{syn.niveau}</span>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-3 gap-4">
                      <div className="cursor-pointer hover:scale-105 transition-transform rounded-xl p-3 hover:bg-indigo-50" onClick={() => setActiveTab('ij')}
                        title={`IJ Maladie : ${fmtEur(sec.ij.ijMensuel)}/mois soit ${pct(sec.ij.tauxCouverture)}% de votre revenu\nIJ journalière : ${fmtEur(sec.ij.ijJour)}/jour\nFranchise : ${sec.ij.franchise} jours\nRégime : ${sec.ij.regime}\nDurée max : ${sec.ij.dureeMax}\nÉcart : -${fmtEur(sec.ij.ecart)}/mois`}>
                        <GaugeSVG value={sec.ij.tauxCouverture} label="IJ Maladie" sublabel={fmtEur(sec.ij.ijMensuel) + '/mois'} size={100} />
                        <div className="text-center mt-1 text-[10px] text-gray-400">Cliquer pour détails</div>
                      </div>
                      <div className="cursor-pointer hover:scale-105 transition-transform rounded-xl p-3 hover:bg-purple-50" onClick={() => setActiveTab('invalidite')}
                        title={`Invalidité : ${fmtEur(sec.invalidite.renteMensuelle)}/mois soit ${pct(sec.invalidite.tauxCouverture)}% de votre revenu\nRente annuelle : ${fmtEur(sec.invalidite.renteAnnuelle)}/an\nÉcart : -${fmtEur(sec.invalidite.ecart)}/mois\nDurée : jusqu'à la retraite (${Math.max(1, 65 - (result.formData.age || 0))} ans)`}>
                        <GaugeSVG value={sec.invalidite.tauxCouverture} label="Invalidité" sublabel={fmtEur(sec.invalidite.renteMensuelle) + '/mois'} size={100} />
                        <div className="text-center mt-1 text-[10px] text-gray-400">Cliquer pour détails</div>
                      </div>
                      <div className="cursor-pointer hover:scale-105 transition-transform rounded-xl p-3 hover:bg-red-50" onClick={() => setActiveTab('deces')}
                        title={`Capital décès : ${fmtEur(sec.deces.capitalBase)} soit ${pct(sec.deces.tauxCouverture)}% de l'objectif\nObjectif recommandé : ${fmtEur(sec.deces.objectif)}\nÉquivalent : ${sec.deces.moisDeRevenus} mois de revenus\nÉcart : -${fmtEur(sec.deces.ecart)}\nBénéficiaires : ${sec.deces.beneficiaires}`}>
                        <GaugeSVG value={sec.deces.tauxCouverture} label="Décès" sublabel={fmtEur(sec.deces.capitalBase)} size={100} />
                        <div className="text-center mt-1 text-[10px] text-gray-400">Cliquer pour détails</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Résumé Narratif + Alerte perte */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Votre audit en bref</h2>
                  <p className="text-gray-700 leading-relaxed">{syn.resume}</p>
                  {syn.perteMaximale && syn.perteMaximale.mensuelle > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Perte maximale estimée :</strong> {fmtEur(syn.perteMaximale.mensuelle)}/mois soit {fmtEur(syn.perteMaximale.annuelle)}/an
                        <div className="text-xs text-red-600 mt-1">{syn.perteMaximale.description}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">TMI : {fiscalImpact.tmi}%</span>
                    {result.isCNBF && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">CNBF</span>}
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{result.formData.codeCaisse}</span>
                    {sec.ij.franchise > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Franchise : {sec.ij.franchise}j</span>}
                  </div>
                </div>

                {/* Tableau comparatif : Situation actuelle vs Idéale */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-600" /> Couverture actuelle vs Objectif recommandé</h2>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left font-semibold text-gray-600">Garantie</th>
                          <th className="p-3 text-right font-semibold text-gray-600">Actuel</th>
                          <th className="p-3 text-right font-semibold text-indigo-600">Objectif</th>
                          <th className="p-3 text-right font-semibold text-gray-600">Écart</th>
                          <th className="p-3 text-center font-semibold text-gray-600">Taux</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab('ij')} title={`IJ journalière : ${fmtEur(sec.ij.ijJour)}/jour × 30 = ${fmtEur(sec.ij.ijMensuel)}/mois\nRégime : ${sec.ij.regime} | Franchise : ${sec.ij.franchise}j | Durée max : ${sec.ij.dureeMax}\nObjectif = 100% du revenu mensuel net`}>
                          <td className="p-3 font-medium flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-500" /> IJ Maladie / mois</td>
                          <td className="p-3 text-right font-semibold">{fmtEur(sec.ij.ijMensuel)}</td>
                          <td className="p-3 text-right text-indigo-600">{fmtEur(sec.ij.objectif)}</td>
                          <td className={`p-3 text-right font-semibold ${sec.ij.ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>{sec.ij.ecart > 0 ? '-' : ''}{fmtEur(sec.ij.ecart)}</td>
                          <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sec.ij.tauxCouverture >= 80 ? 'bg-green-100 text-green-700' : sec.ij.tauxCouverture >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct(sec.ij.tauxCouverture)}%</span></td>
                        </tr>
                        <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab('invalidite')} title={`Rente mensuelle : ${fmtEur(sec.invalidite.renteMensuelle)}/mois = ${fmtEur(sec.invalidite.renteAnnuelle)}/an\nDurée potentielle : jusqu'à la retraite (${Math.max(1, 65 - (result.formData.age || 0))} ans)\nPerte cumulée potentielle : ${fmtEur(sec.invalidite.ecart * 12 * Math.max(1, 65 - (result.formData.age || 0)))}`}>
                          <td className="p-3 font-medium flex items-center gap-2"><HeartPulse className="w-4 h-4 text-purple-500" /> Invalidité / mois</td>
                          <td className="p-3 text-right font-semibold">{fmtEur(sec.invalidite.renteMensuelle)}</td>
                          <td className="p-3 text-right text-indigo-600">{fmtEur(sec.invalidite.objectif)}</td>
                          <td className={`p-3 text-right font-semibold ${sec.invalidite.ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>{sec.invalidite.ecart > 0 ? '-' : ''}{fmtEur(sec.invalidite.ecart)}</td>
                          <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sec.invalidite.tauxCouverture >= 80 ? 'bg-green-100 text-green-700' : sec.invalidite.tauxCouverture >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct(sec.invalidite.tauxCouverture)}%</span></td>
                        </tr>
                        <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab('deces')} title={`Capital de base : ${fmtEur(sec.deces.capitalBase)} = ${sec.deces.moisDeRevenus} mois de revenus\nObjectif = remplacement revenu 24 mois + liquidation pro + éducation enfants + conjoint\nExonéré de droits de succession (loi TEPA)`}>
                          <td className="p-3 font-medium flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Capital décès</td>
                          <td className="p-3 text-right font-semibold">{fmtEur(sec.deces.capitalBase)}</td>
                          <td className="p-3 text-right text-indigo-600">{fmtEur(sec.deces.objectif)}</td>
                          <td className={`p-3 text-right font-semibold ${sec.deces.ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>{sec.deces.ecart > 0 ? '-' : ''}{fmtEur(sec.deces.ecart)}</td>
                          <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sec.deces.tauxCouverture >= 80 ? 'bg-green-100 text-green-700' : sec.deces.tauxCouverture >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct(sec.deces.tauxCouverture)}%</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Priorités ordonnées */}
                {syn.priorites && syn.priorites.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500" /> Priorités d&apos;action</h2>
                    <div className="space-y-3">
                      {syn.priorites.map((p: { rang: number; domaine: string; urgence: string; action: string; impact: string }) => {
                        const us = urgenceStyle(p.urgence)
                        return (
                          <div key={p.rang} className={`flex gap-4 p-4 rounded-xl border-l-4 ${us.bg} ${us.border}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${p.urgence === 'haute' ? 'bg-red-500' : p.urgence === 'moyenne' ? 'bg-amber-500' : 'bg-blue-500'}`}>{p.rang}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{p.domaine}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${us.badge}`}>{p.urgence}</span>
                              </div>
                              <div className={`text-sm ${us.text}`}>{p.action}</div>
                              <div className="text-xs text-gray-500 mt-1">{p.impact}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Points forts en-dessous */}
                    {syn.pointsForts.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Points forts de votre couverture</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {syn.pointsForts.map((pf: string, i: number) => (
                            <div key={i} className="flex gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2">
                              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{pf}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Opportunité Fiscale Madelin */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-6">
                  <h2 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2"><CircleDollarSign className="w-5 h-5" /> Opportunité Fiscale Madelin</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    En souscrivant une prévoyance Madelin, vous déduisez les cotisations de votre revenu imposable (BNC).
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-xs text-gray-500 cursor-help" title={`Plafond Madelin prévoyance = 3,75% du BNC + 7% du PASS (${fmtEur(result.params2025?.pass || 46368)})\nCe montant est le maximum déductible de votre revenu imposable.\nCalcul : 3,75% × ${fmtEur(result.formData.revenuAn)} + 7% × PASS`}>Plafond déductible</div>
                      <div className="text-xl font-bold text-gray-900">{fmtEur(fiscalImpact.plafondMadelin)}</div>
                      <div className="text-xs text-gray-400">/an</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-xs text-gray-500 cursor-help" title={`Estimation basée sur ~4% de votre BNC de ${fmtEur(result.formData.revenuAn)}/an\nCe montant couvre généralement IJ + invalidité + décès.\nSoit ${fmtEur(Math.round(fiscalImpact.estimCotisation / 12))}/mois de cotisation.`}>Cotisation estimée</div>
                      <div className="text-xl font-bold text-gray-900">{fmtEur(fiscalImpact.estimCotisation)}</div>
                      <div className="text-xs text-gray-400">/an</div>
                    </div>
                    <div className="bg-indigo-600 rounded-lg p-4 text-center text-white">
                      <div className="text-xs opacity-80 cursor-help" title={`Économie = cotisation × TMI\n${fmtEur(fiscalImpact.estimCotisation)} × ${fiscalImpact.tmi}% = ${fmtEur(fiscalImpact.economieImpot)}\nChaque euro cotisé ne vous coûte que ${Math.round((1 - fiscalImpact.tmi / 100) * 100)} centimes.\nCoût réel : ${fmtEur(fiscalImpact.estimCotisation - fiscalImpact.economieImpot)}/an`}>Économie d&apos;impôt</div>
                      <div className="text-xl font-bold">{fmtEur(fiscalImpact.economieImpot)}</div>
                      <div className="text-xs opacity-80">/an (TMI {fiscalImpact.tmi}%)</div>
                    </div>
                  </div>
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-4 text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <strong>Coût réel après déduction fiscale : {fmtEur(fiscalImpact.estimCotisation - fiscalImpact.economieImpot)}/an</strong>
                      <span className="text-green-600 ml-2">({fmtEur((fiscalImpact.estimCotisation - fiscalImpact.economieImpot)/12)}/mois)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================ ONGLET ARRÊT MALADIE ================ */}
            {activeTab === 'ij' && (
              <div className="space-y-6">
                {/* Alertes IJ */}
                {sec.ij.alertes.length > 0 && (
                  <div className="space-y-2">
                    {sec.ij.alertes.map((a: Alerte, i: number) => <AlerteCard key={i} alerte={a} />)}
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> Votre couverture dans le temps</h2>
                  <div className="flex items-center justify-center gap-4 py-6 relative">
                    <div className="absolute top-1/2 left-16 right-16 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                    {result.isCNBF ? (
                      <>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 bg-white transition-all ${jourArret <= 90 ? 'border-purple-500 ring-4 ring-purple-200 scale-110' : 'border-gray-300'}`}>
                            <Scale className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="font-semibold text-gray-800 mt-2">LPA (0j)</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J1-J90</div>
                        </div>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 bg-white transition-all ${jourArret > 90 ? 'border-green-500 ring-4 ring-green-200 scale-110' : 'border-gray-300'}`}>
                            <Landmark className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="font-semibold text-gray-800 mt-2">CNBF</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J91+</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 bg-white transition-all ${jourArret <= sec.ij.franchise ? 'border-red-500 ring-4 ring-red-200 scale-110 bg-red-50' : 'border-gray-300'}`}>
                            <Clock className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="font-semibold text-gray-800 mt-2">Franchise</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J1-J{sec.ij.franchise || 90}</div>
                        </div>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 bg-white transition-all ${jourArret > sec.ij.franchise ? 'border-green-500 ring-4 ring-green-200 scale-110' : 'border-gray-300'}`}>
                            <Landmark className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="font-semibold text-gray-800 mt-2">{result.formData.codeCaisse}</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J{(sec.ij.franchise || 90) + 1}+</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-1" />
                    <strong>IJ journalière :</strong> {fmtEur(sec.ij.ijJour)}/jour — <strong>IJ mensuelle :</strong> {fmtEur(sec.ij.ijMensuel)}/mois — <strong>Couverture :</strong> {pct(sec.ij.tauxCouverture)}%
                  </div>
                </div>

                {/* Simulateur Slider — Impact financier jour par jour */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-500" /> Simulez un arrêt de travail</h2>
                  
                  {/* Slider avec indicateurs */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-gray-800">Durée de l&apos;arrêt : <span className="text-indigo-700">{jourArret} jour{jourArret > 1 ? 's' : ''}{jourArret >= 30 ? ` (${jourArret >= 365 ? `${Math.floor(jourArret / 365)} an${Math.floor(jourArret / 365) > 1 ? 's' : ''}${jourArret % 365 >= 30 ? ` ${Math.floor((jourArret % 365) / 30)} mois` : ''}` : `${Math.floor(jourArret / 30)} mois`})` : ''}</span></strong>
                      <div className="flex items-center gap-3">
                        {sliderData && sliderData.joursFranchise > 0 && jourArret <= sec.ij.franchise && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">Franchise — aucune IJ</span>
                        )}
                        {sliderData && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{sliderData.sourceActuelle}</span>
                        )}
                      </div>
                    </div>
                    <input type="range" min={1} max={1095} value={jourArret} onChange={e => setJourArret(Number(e.target.value))} 
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>1 jour</span>
                      <span>3 mois</span>
                      <span>6 mois</span>
                      <span>1 an</span>
                      <span>2 ans</span>
                      <span>3 ans</span>
                    </div>
                  </div>

                  {sliderData ? (
                    <>
                      {/* Taux de maintien — barre de progression */}
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Taux de maintien de revenu</span>
                          <span className={`text-lg font-bold ${sliderData.tauxMaintien < 30 ? 'text-red-600' : sliderData.tauxMaintien < 60 ? 'text-orange-600' : sliderData.tauxMaintien < 80 ? 'text-amber-600' : 'text-green-600'}`}>{sliderData.tauxMaintien}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${sliderData.tauxMaintien < 30 ? 'bg-red-500' : sliderData.tauxMaintien < 60 ? 'bg-orange-500' : sliderData.tauxMaintien < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, sliderData.tauxMaintien)}%` }} />
                        </div>
                      </div>

                      {/* Comparaison Mois normal vs Mois arrêt */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="font-semibold text-green-800 mb-3 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Mois normal</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Revenus nets</span><span className="font-semibold text-green-700">{fmtEur(revenuMensuel)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Charges totales</span><span className="text-gray-600">-{fmtEur(chargesTotal)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-green-300"><span className="font-semibold">Reste à vivre</span><span className="font-bold text-green-600">{fmtEur(sliderData.resteNormal)}</span></div>
                          </div>
                        </div>
                        <div className={`${sliderData.resteArret < 0 ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4`}>
                          <div className={`font-semibold mb-3 flex items-center gap-1 ${sliderData.resteArret < 0 ? 'text-red-800' : 'text-orange-800'}`}><AlertTriangle className="w-4 h-4" /> Pendant l&apos;arrêt (eq. mensuel)</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">IJ mensualisées</span><span className={sliderData.ijMensuelise > 0 ? 'font-semibold text-indigo-600' : 'font-semibold text-red-600'}>{fmtEur(sliderData.ijMensuelise)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Charges totales</span><span className="text-gray-600">-{fmtEur(chargesTotal)}</span></div>
                            <div className={`flex justify-between pt-2 border-t ${sliderData.resteArret < 0 ? 'border-red-300' : 'border-orange-300'}`}>
                              <span className="font-semibold">Reste à vivre</span>
                              <span className={`font-bold ${sliderData.resteArret < 0 ? 'text-red-600' : 'text-orange-600'}`}>{fmtEur(sliderData.resteArret)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bilan cumulé de l'arrêt */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center cursor-help"
                          title={`Franchise de ${sec.ij.franchise} jours (caisse ${result.formData.codeCaisse})\nPendant cette période : 0 € d'IJ\nPerte sèche : ${fmtEur(Math.round(revenuMensuel / 30 * sliderData.joursFranchise))}`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Jours sans IJ</div>
                          <div className={`text-xl font-bold ${sliderData.joursFranchise > 0 ? 'text-red-600' : 'text-green-600'}`}>{sliderData.joursFranchise}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center cursor-help"
                          title={`Jours effectivement indemnisés sur ${jourArret} jours d'arrêt\nSource : ${sliderData.sourceActuelle}\nIJ/jour : ${fmtEur(sec.ij.ijJour)}`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Jours indemnisés</div>
                          <div className="text-xl font-bold text-indigo-600">{sliderData.joursIndemnises}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center cursor-help"
                          title={`Total des IJ perçues sur ${jourArret} jours\n= ${sliderData.joursIndemnises} jours × IJ/jour\nSoit ${fmtEur(Math.round(sliderData.ijCumulees / Math.max(1, jourArret) * 30))}/mois en moyenne`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">IJ cumulées</div>
                          <div className="text-xl font-bold text-indigo-700">{fmtEur(sliderData.ijCumulees)}</div>
                        </div>
                        <div className={`${sliderData.perteTotale > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-3 text-center cursor-help`}
                          title={`Perte = revenus normaux - IJ perçues\n${fmtEur(Math.round(revenuMensuel / 30 * jourArret))} (revenus sur ${jourArret}j) - ${fmtEur(sliderData.ijCumulees)} (IJ)\n= ${fmtEur(Math.abs(sliderData.perteTotale))} de manque à gagner`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Perte cumulée</div>
                          <div className={`text-xl font-bold ${sliderData.perteTotale > 0 ? 'text-red-600' : 'text-green-600'}`}>{sliderData.perteTotale > 0 ? '-' : ''}{fmtEur(Math.abs(sliderData.perteTotale))}</div>
                        </div>
                      </div>

                      {/* Alerte épargne de précaution si franchise */}
                      {sliderData.epargnePrecautionNecessaire > 0 && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
                          <Wallet className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-amber-800 text-sm">Épargne de précaution recommandée</div>
                            <p className="text-sm text-amber-700 mt-1">
                              Pour couvrir les <strong>{sliderData.joursFranchise} jours de franchise</strong> sans IJ, vous devez disposer d&apos;au minimum <strong className="text-amber-900">{fmtEur(sliderData.epargnePrecautionNecessaire)}</strong> d&apos;épargne disponible.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">Données de simulation non disponibles.</div>
                  )}
                </div>

                {/* Projection sur 3 ans — tableau interactif avec cumuls */}
                {sec.ij.simulation.length > 0 && (() => {
                  const simulation = sec.ij.simulation as Array<{ mois: number; ijTotal: number; tauxMaintien: number; source: string; perte: number }>
                  // Calcul des cumuls par année
                  const annees = [
                    { label: 'Année 1 (mois 1-12)', mois: simulation.filter(s => s.mois <= 12) },
                    { label: 'Année 2 (mois 13-24)', mois: simulation.filter(s => s.mois > 12 && s.mois <= 24) },
                    { label: 'Année 3 (mois 25-36)', mois: simulation.filter(s => s.mois > 24 && s.mois <= 36) },
                  ]
                  let perteCumuleeGlobale = 0
                  let ijCumuleesGlobale = 0
                  simulation.forEach(s => { perteCumuleeGlobale += s.perte; ijCumuleesGlobale += s.ijTotal })

                  return (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Projection d&apos;arrêt sur 3 ans</h2>
                    <p className="text-sm text-gray-500 mb-4">Cliquez sur un mois pour positionner le curseur. Les montants sont calculés jour par jour selon les règles de votre caisse ({result.formData.codeCaisse}).</p>

                    {/* Résumé 3 ans */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {annees.map((a, ai) => {
                        const totalIJ = a.mois.reduce((acc, s) => acc + s.ijTotal, 0)
                        const totalPerte = a.mois.reduce((acc, s) => acc + s.perte, 0)
                        const tauxMoyen = a.mois.length > 0 ? Math.round(a.mois.reduce((acc, s) => acc + s.tauxMaintien, 0) / a.mois.length) : 0
                        return (
                          <div key={ai} className={`rounded-xl border p-4 ${ai === 0 ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Année {ai + 1}</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-600">IJ perçues</span><span className="font-semibold text-indigo-700">{fmtEur(totalIJ)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-600">Perte cumulée</span><span className="font-bold text-red-600">-{fmtEur(totalPerte)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-600">Maintien moyen</span>
                                <span className={`font-bold ${tauxMoyen < 30 ? 'text-red-600' : tauxMoyen < 60 ? 'text-orange-600' : 'text-green-600'}`}>{tauxMoyen}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bilan global 3 ans */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                          <div className="font-bold text-red-800">Impact total sur 3 ans d&apos;arrêt complet</div>
                          <div className="text-sm text-red-700">
                            Vous auriez perçu {fmtEur(ijCumuleesGlobale)} d&apos;IJ au lieu de {fmtEur(revenuMensuel * 36)} de revenus normaux.
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-red-600">-{fmtEur(perteCumuleeGlobale)}</div>
                        <div className="text-xs text-red-500">perte cumulée nette</div>
                      </div>
                    </div>

                    {/* Tableau détaillé avec barres — groupé par année */}
                    {annees.map((a, ai) => {
                      if (a.mois.length === 0) return null
                      let perteCumulee = 0
                      // Cumul des années précédentes
                      for (let k = 0; k < ai; k++) annees[k].mois.forEach(s => perteCumulee += s.perte)
                      
                      return (
                        <div key={ai} className="mb-4">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ai === 0 ? 'bg-indigo-500' : ai === 1 ? 'bg-purple-500' : 'bg-gray-400'}`} />
                            {a.label}
                          </div>
                          <div className="space-y-1">
                            {a.mois.map((sim, idx) => {
                              perteCumulee += sim.perte
                              const barWidth = Math.max(2, sim.tauxMaintien)
                              const barColor = sim.tauxMaintien === 0 ? 'bg-red-600' : sim.tauxMaintien < 30 ? 'bg-red-500' : sim.tauxMaintien < 50 ? 'bg-orange-500' : sim.tauxMaintien < 80 ? 'bg-amber-400' : 'bg-green-500'
                              const isActive = Math.ceil(jourArret / 30) === sim.mois
                              // Détection changement de phase
                              const prevSim = idx > 0 ? a.mois[idx - 1] : (ai > 0 ? annees[ai-1].mois[annees[ai-1].mois.length - 1] : null)
                              const phaseChanged = prevSim && prevSim.source !== sim.source
                              return (
                                <div key={sim.mois}>
                                  {phaseChanged && (
                                    <div className="flex items-center gap-2 py-1 px-2 my-1 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-700 font-semibold">
                                      <ArrowRight className="w-3 h-3" /> Changement de régime : {prevSim?.source} → {sim.source}
                                    </div>
                                  )}
                                  <div 
                                    className={`flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer ${isActive ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'hover:bg-gray-50'}`}
                                    onClick={() => setJourArret(sim.mois * 30)}
                                    title={`Cliquer pour simuler ${sim.mois * 30} jours d'arrêt\nSource : ${sim.source}\nIJ ce mois : ${sim.ijTotal} €\nPerte ce mois : ${sim.perte} €\nPerte cumulée : ${Math.round(perteCumulee)} €`}
                                  >
                                    <div className="w-10 text-[10px] font-semibold text-gray-400 text-right">M{sim.mois}</div>
                                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                                      <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${barWidth}%` }} />
                                      {sim.tauxMaintien > 0 && <span className="absolute inset-0 flex items-center pl-2 text-[9px] font-bold text-gray-700">{sim.tauxMaintien}%</span>}
                                      {sim.tauxMaintien === 0 && <span className="absolute inset-0 flex items-center pl-2 text-[9px] font-bold text-red-700">0% — franchise</span>}
                                    </div>
                                    <div className="w-20 text-right text-[10px] font-semibold text-gray-600">{fmtEur(sim.ijTotal)}</div>
                                    <div className="w-20 text-right text-[10px] font-medium text-red-500">-{fmtEur(sim.perte)}</div>
                                    <div className="w-24 text-right text-[10px] font-bold text-red-700" title="Perte cumulée depuis le début">Σ -{fmtEur(Math.round(perteCumulee))}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <div className="flex gap-4 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> ≥80%</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> 50-80%</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full" /> 30-50%</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> &lt;30%</span>
                      </div>
                      <div className="text-[10px] text-gray-400">Cliquez sur un mois pour simuler cette durée</div>
                    </div>
                  </div>
                  )
                })()}

                {/* Ce que signifient vos chiffres — pédagogie IJ */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /> Comprendre votre couverture arrêt de travail</h2>
                  
                  {/* Narrative pédagogique */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
                    <p className="text-sm text-blue-900 leading-relaxed mb-3">{sec.ij.explication}</p>
                    <div className="text-sm text-blue-800 leading-relaxed space-y-2">
                      <p>
                        <strong>Concrètement, pour vous :</strong> Votre revenu mensuel net est de <strong className="text-indigo-700">{fmtEur(revenuMensuel)}</strong>. 
                        En cas d&apos;arrêt de travail, {sec.ij.franchise > 0 
                          ? `vous ne percevrez aucune indemnité pendant les ${sec.ij.franchise} premiers jours (franchise de votre caisse ${result.formData.codeCaisse}). C'est une perte sèche de ${fmtEur(Math.round(revenuMensuel / 30 * sec.ij.franchise))}.`
                          : `vous êtes indemnisé(e) dès le 1er jour, ce qui est un avantage significatif de votre régime.`
                        }
                      </p>
                      <p>
                        Après la franchise, vos IJ s&apos;élèvent à <strong>{fmtEur(sec.ij.ijJour)}/jour</strong> soit <strong>{fmtEur(sec.ij.ijMensuel)}/mois</strong> — ce qui représente seulement <strong className={sec.ij.tauxCouverture < 50 ? 'text-red-700' : 'text-amber-700'}>{pct(sec.ij.tauxCouverture)}% de votre revenu</strong>.
                        {sec.ij.ecart > 0 && ` Il vous manque donc ${fmtEur(sec.ij.ecart)}/mois pour maintenir votre niveau de vie actuel.`}
                      </p>
                      {sec.ij.phase2 && (
                        <p>
                          <strong>Attention au changement de régime :</strong> À partir du jour {sec.ij.phase2.debut}, c&apos;est {sec.ij.phase2.source} qui prend le relais avec {fmtEur(sec.ij.phase2.ijJour)}/jour ({fmtEur(Math.round(sec.ij.phase2.ijJour * 30))}/mois).
                          {sec.ij.phase2.ijJour < sec.ij.ijJour && ` C'est une baisse de ${fmtEur(Math.round((sec.ij.ijJour - sec.ij.phase2.ijJour) * 30))}/mois par rapport à la phase 1.`}
                          {sec.ij.phase2.ijJour > sec.ij.ijJour && ` C'est une hausse de ${fmtEur(Math.round((sec.ij.phase2.ijJour - sec.ij.ijJour) * 30))}/mois par rapport à la phase 1.`}
                        </p>
                      )}
                      <p>
                        <strong>Durée maximale d&apos;indemnisation :</strong> {sec.ij.dureeMax}. Au-delà, c&apos;est le régime d&apos;invalidité qui prend éventuellement le relais (voir onglet Invalidité).
                      </p>
                    </div>
                  </div>

                  {/* Impact sur le niveau de vie */}
                  {sec.ij.ecart > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-5">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Manque à gagner pour maintenir votre niveau de vie</h3>
                      <div className="text-sm text-red-800 leading-relaxed space-y-2">
                        <p>
                          Pour conserver votre train de vie actuel, il vous faut <strong>{fmtEur(revenuMensuel)}/mois</strong>. 
                          Vos charges incompressibles s&apos;élèvent à <strong>{fmtEur(chargesTotal)}/mois</strong> (loyer, crédits, assurances, charges pro…). 
                          Ces charges <strong>ne diminuent pas</strong> pendant un arrêt de travail.
                        </p>
                        <p>
                          Avec seulement <strong>{fmtEur(sec.ij.ijMensuel)}/mois</strong> d&apos;IJ, il vous manque <strong className="text-red-900">{fmtEur(sec.ij.ecart)}/mois</strong> pour couvrir vos besoins. 
                          {sec.ij.ijMensuel < chargesTotal 
                            ? ` Pire encore : vos IJ (${fmtEur(sec.ij.ijMensuel)}) ne couvrent même pas vos charges (${fmtEur(chargesTotal)}). Vous seriez en déficit de ${fmtEur(chargesTotal - sec.ij.ijMensuel)}/mois dès le premier mois indemnisé.`
                            : ` Vos IJ couvrent vos charges mais ne laissent que ${fmtEur(sec.ij.ijMensuel - chargesTotal)}/mois de reste à vivre contre ${fmtEur(revenuMensuel - chargesTotal)} en temps normal.`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommandations */}
                  {sec.ij.conseils?.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Recommandations pour améliorer votre couverture</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sec.ij.conseils.map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg p-3">
                            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ spécifique IJ — accordéon */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-gray-400" /> Questions fréquentes — Arrêt de travail</h3>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Qu&apos;est-ce que la franchise (ou carence) de {sec.ij.franchise} jours ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        C&apos;est la période au début de votre arrêt pendant laquelle <strong>aucune indemnité n&apos;est versée</strong>. Pour votre caisse ({result.formData.codeCaisse}), cette franchise est de <strong>{sec.ij.franchise} jours</strong>, soit <strong>{fmtEur(Math.round(revenuMensuel / 30 * sec.ij.franchise))}</strong> de perte sèche.
                        {sec.ij.franchise >= 90 && ` C'est l'un des principaux risques pour un TNS : 3 mois sans aucun revenu. Une prévoyance complémentaire avec franchise courte (7 à 15 jours) permet de réduire considérablement ce risque.`}
                        {sec.ij.franchise <= 3 && sec.ij.franchise > 0 && ` C'est une franchise courte, ce qui est plutôt favorable par rapport aux autres caisses (souvent 90 jours).`}
                        {sec.ij.franchise === 0 && ` Vous n'avez pas de franchise, ce qui est un avantage majeur de votre régime.`}
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Comment sont calculées mes IJ de {fmtEur(sec.ij.ijJour)}/jour ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        Le montant de vos IJ dépend de votre régime ({sec.ij.regime}) et de votre classe de cotisation.
                        {sec.ij.regime === 'CPAM' && ` La CPAM verse 50% du gain journalier de base, plafonné à 1,8 fois le SMIC. Le montant max est d'environ ${fmtEur(Math.round(result.params2025.pass / 365 * 0.5))}/jour.`}
                        {sec.ij.regime === 'SSI' && ` Le SSI verse 1/730e du RAAM (Revenu Annuel d'Activité Moyen), plafonné au PASS (${fmtEur(result.params2025.pass)}/an).`}
                        {sec.ij.regime === 'LPA' && ` Le LPA/AON de votre barreau verse une IJ forfaitaire pendant les 90 premiers jours, puis la CNBF prend le relais.`}
                        <br/><br/>
                        <strong>Votre IJ mensuelle de {fmtEur(sec.ij.ijMensuel)}</strong> représente {pct(sec.ij.tauxCouverture)}% de votre revenu de {fmtEur(revenuMensuel)}/mois.
                        {sec.ij.tauxCouverture < 50 && ` C'est insuffisant pour maintenir votre niveau de vie.`}
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Quelle épargne de précaution dois-je constituer ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        <strong>Minimum recommandé :</strong> {fmtEur(chargesTotal * 3)} à {fmtEur(chargesTotal * 6)} (3 à 6 mois de charges).
                        {sec.ij.franchise >= 90 && (
                          <><br/><br/><strong>Pour votre franchise de {sec.ij.franchise} jours :</strong> Vous devez impérativement disposer de {fmtEur(Math.round(revenuMensuel / 30 * sec.ij.franchise))} d&apos;épargne liquide et disponible pour couvrir cette période sans aucun revenu. Placez cette somme sur un livret A ou LDDS (disponible immédiatement).</>
                        )}
                      </div>
                    </details>
                    {sec.ij.phase2 && (
                      <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                        <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                          <span>Pourquoi mes IJ changent après le jour {sec.ij.phase2.debut} ?</span>
                          <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                        </summary>
                        <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                          Votre couverture fonctionne en 2 temps :<br/>
                          <strong>Phase 1 (J{sec.ij.phase1.debut}-J{sec.ij.phase1.fin}) :</strong> {sec.ij.phase1.source} verse {fmtEur(sec.ij.phase1.ijJour)}/jour ({fmtEur(Math.round(sec.ij.phase1.ijJour * 30))}/mois).<br/>
                          <strong>Phase 2 (à partir de J{sec.ij.phase2.debut}) :</strong> {sec.ij.phase2.source} prend le relais à {fmtEur(sec.ij.phase2.ijJour)}/jour ({fmtEur(Math.round(sec.ij.phase2.ijJour * 30))}/mois).
                          {sec.ij.phase2.ijJour !== sec.ij.ijJour && <><br/><br/>Ce changement de régime entraîne une {sec.ij.phase2.ijJour < sec.ij.ijJour ? 'baisse' : 'hausse'} de {fmtEur(Math.abs(Math.round((sec.ij.phase2.ijJour - sec.ij.ijJour) * 30)))}/mois.</>}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================ ONGLET INVALIDITÉ ================ */}
            {activeTab === 'invalidite' && (() => {
              const ecartInv = Math.max(0, revenuMensuel - sec.invalidite.renteMensuelle)
              const annRetraite = Math.max(1, 65 - (result.formData.age || 0))
              return (
              <div className="space-y-6">
                {/* Alertes invalidité */}
                {sec.invalidite.alertes.length > 0 && (
                  <div className="space-y-2">
                    {sec.invalidite.alertes.map((a: Alerte, i: number) => <AlerteCard key={i} alerte={a} />)}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gauge + explication */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-purple-600" /> Rente Invalidité</h2>
                    <div className="flex justify-center mb-4">
                      <GaugeSVG value={sec.invalidite.tauxCouverture} label="Couverture" sublabel={`${fmtEur(sec.invalidite.renteMensuelle)} / ${fmtEur(revenuMensuel)}`} size={150} />
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed mb-4">
                      {sec.invalidite.explication || `En cas d'invalidité totale, vous percevrez ${fmtEur(sec.invalidite.renteMensuelle)}/mois.`}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3 text-center cursor-help"
                        title={`Rente mensuelle = ${fmtEur(sec.invalidite.renteAnnuelle)}/an ÷ 12\nSoit ${pct(sec.invalidite.tauxCouverture)}% de votre revenu de ${fmtEur(revenuMensuel)}/mois\nÉcart : -${fmtEur(ecartInv)}/mois`}>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rente mensuelle</div>
                        <div className="text-lg font-bold text-indigo-700">{fmtEur(sec.invalidite.renteMensuelle)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center cursor-help"
                        title={`Rente annuelle versée par ${result.formData.codeCaisse}\nDurée potentielle : jusqu'à la retraite (${annRetraite} ans)\nPerte cumulée si invalidité totale : ${fmtEur(ecartInv * 12 * annRetraite)}`}>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rente annuelle</div>
                        <div className="text-lg font-bold text-indigo-700">{fmtEur(sec.invalidite.renteAnnuelle)}</div>
                      </div>
                    </div>

                    {/* Catégories existantes */}
                    {sec.invalidite.details?.categoriesExistantes?.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Catégories de votre caisse</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 text-left font-semibold text-gray-600">Catégorie</th>
                                <th className="p-2 text-center font-semibold text-gray-600">Taux</th>
                                <th className="p-2 text-right font-semibold text-gray-600">Montant</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sec.invalidite.details.categoriesExistantes.map((cat: { nom: string; taux: string; montant: number }, i: number) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2 font-medium">{cat.nom}</td>
                                  <td className="p-2 text-center">{cat.taux}</td>
                                  <td className="p-2 text-right font-semibold">{fmtEur(cat.montant)}/an</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Conditions d'obtention */}
                    {sec.invalidite.conditionsObtention && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div><strong>Conditions :</strong> {sec.invalidite.conditionsObtention}</div>
                      </div>
                    )}
                  </div>

                  {/* Conséquences long terme */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-500" /> Conséquences long terme</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      L&apos;invalidité est le risque financier le plus lourd : il peut durer des décennies et vos charges restent les mêmes.
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left font-semibold text-gray-600">Durée</th>
                            <th className="p-3 text-right font-semibold text-gray-600">Rente perçue</th>
                            <th className="p-3 text-right font-semibold text-gray-600">Perte cumulée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t"><td className="p-3">1 an</td><td className="p-3 text-right text-indigo-600">{fmtEur(sec.invalidite.renteAnnuelle)}</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(ecartInv * 12)}</td></tr>
                          <tr className="border-t"><td className="p-3">5 ans</td><td className="p-3 text-right text-indigo-600">{fmtEur(sec.invalidite.renteAnnuelle * 5)}</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(ecartInv * 60)}</td></tr>
                          <tr className="border-t"><td className="p-3">10 ans</td><td className="p-3 text-right text-indigo-600">{fmtEur(sec.invalidite.renteAnnuelle * 10)}</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(ecartInv * 120)}</td></tr>
                          <tr className="border-t bg-red-50"><td className="p-3 font-semibold">Jusqu&apos;à la retraite ({annRetraite} ans)</td><td className="p-3 text-right text-indigo-600 font-semibold">{fmtEur(sec.invalidite.renteAnnuelle * annRetraite)}</td><td className="p-3 text-right text-red-700 font-bold">-{fmtEur(ecartInv * 12 * annRetraite)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {ecartInv > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-sm text-red-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Déficit mensuel : {fmtEur(ecartInv)}/mois</strong>
                          <div className="text-xs mt-1">Il vous manquera cette somme chaque mois pour couvrir vos charges de {fmtEur(chargesTotal)}/mois.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comprendre votre couverture invalidité — pédagogie */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /> Comprendre votre couverture invalidité</h2>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-5">
                    <div className="text-sm text-purple-900 leading-relaxed space-y-2">
                      <p>
                        <strong>L&apos;invalidité est le risque financier le plus lourd pour un TNS.</strong> Contrairement à un arrêt maladie limité dans le temps, 
                        l&apos;invalidité peut durer des décennies — de la date de reconnaissance jusqu&apos;à l&apos;âge de la retraite ({65 - (result.formData.age || 0)} ans dans votre cas).
                      </p>
                      <p>
                        Votre caisse {result.formData.codeCaisse} vous verserait une rente de <strong className="text-indigo-700">{fmtEur(sec.invalidite.renteMensuelle)}/mois</strong> ({fmtEur(sec.invalidite.renteAnnuelle)}/an), 
                        soit seulement <strong className={sec.invalidite.tauxCouverture < 50 ? 'text-red-700' : 'text-amber-700'}>{pct(sec.invalidite.tauxCouverture)}% de votre revenu actuel</strong>.
                      </p>
                      {ecartInv > 0 && (
                        <p>
                          <strong className="text-red-700">Il vous manquerait {fmtEur(ecartInv)}/mois</strong> pour maintenir votre niveau de vie. 
                          Sur {annRetraite} ans (jusqu&apos;à la retraite), cela représente une perte cumulée de <strong className="text-red-700">{fmtEur(ecartInv * 12 * annRetraite)}</strong>.
                          {ecartInv > chargesTotal && ` Vos charges fixes de ${fmtEur(chargesTotal)}/mois ne seraient même pas couvertes.`}
                        </p>
                      )}
                      <p>
                        <strong>Conditions :</strong> {sec.invalidite.conditionsObtention || `Incapacité permanente d'exercer votre profession.`}
                        {sec.invalidite.details?.delaiCarence && ` Délai de carence : ${sec.invalidite.details.delaiCarence}.`}
                        {sec.invalidite.details?.duree && ` Durée : ${sec.invalidite.details.duree}.`}
                      </p>
                    </div>
                  </div>

                  {/* Recommandations */}
                  {sec.invalidite.conseils?.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Recommandations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sec.invalidite.conseils.map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg p-3">
                            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ spécifique invalidité */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-gray-400" /> Questions fréquentes — Invalidité</h3>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Quelle est la différence entre invalidité partielle et totale ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        <strong>Invalidité partielle :</strong> Vous pouvez encore exercer une activité réduite. La rente est généralement de 30% du RAAM (Revenu Annuel d&apos;Activité Moyen).<br/>
                        <strong>Invalidité totale :</strong> Vous ne pouvez plus du tout exercer votre profession. La rente est de 50% du RAAM ou un montant forfaitaire selon votre caisse.<br/><br/>
                        <strong>Important :</strong> La définition de l&apos;invalidité varie selon les caisses. Certaines couvrent l&apos;incapacité d&apos;exercer &quot;sa&quot; profession (plus protecteur), d&apos;autres l&apos;incapacité d&apos;exercer &quot;une&quot; profession (moins protecteur).
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Pourquoi l&apos;invalidité est-elle plus risquée que l&apos;arrêt maladie ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        L&apos;arrêt maladie est temporaire (max 3 ans). L&apos;invalidité peut durer <strong>jusqu&apos;à la retraite</strong> — dans votre cas, potentiellement <strong>{annRetraite} ans</strong>.<br/><br/>
                        Avec un déficit de {fmtEur(ecartInv)}/mois, cela représente une perte cumulée de <strong className="text-red-600">{fmtEur(ecartInv * 12 * annRetraite)}</strong> sur la durée. 
                        C&apos;est pourquoi une prévoyance complémentaire invalidité est souvent prioritaire sur la couverture IJ.
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Comment ma rente de {fmtEur(sec.invalidite.renteMensuelle)}/mois est-elle calculée ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        {sec.invalidite.explication || `Le montant dépend de votre caisse (${result.formData.codeCaisse}), de votre classe de cotisation et de vos revenus antérieurs.`}<br/><br/>
                        <strong>Votre situation :</strong> Rente de {fmtEur(sec.invalidite.renteMensuelle)}/mois = {fmtEur(sec.invalidite.renteAnnuelle)}/an, soit {pct(sec.invalidite.tauxCouverture)}% de votre revenu de {fmtEur(revenuMensuel)}/mois.
                        {ecartInv > 0 && <><br/><strong>Écart à combler :</strong> {fmtEur(ecartInv)}/mois via une prévoyance complémentaire Madelin.</>}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
              )
            })()}

            {/* ================ ONGLET DÉCÈS ================ */}
            {activeTab === 'deces' && (() => {
              const ecartCap = sec.deces.ecart
              const detailObj = sec.deces.detailObjectif
              return (
              <div className="space-y-6">
                {/* Alertes décès */}
                {sec.deces.alertes.length > 0 && (
                  <div className="space-y-2">
                    {sec.deces.alertes.map((a: Alerte, i: number) => <AlerteCard key={i} alerte={a} />)}
                  </div>
                )}

                {/* Capital actuel vs recommandé */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Capital Décès</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <div className="text-gray-700 text-sm leading-relaxed mb-4">
                        {sec.deces.explication || `Le capital décès de votre caisse est de ${fmtEur(sec.deces.capitalBase)}.`}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center border border-gray-200 cursor-help"
                          title={`Capital versé par ${result.formData.codeCaisse} en cas de décès\n= ${sec.deces.moisDeRevenus} mois × ${fmtEur(revenuMensuel)}/mois\nBénéficiaires : ${sec.deces.beneficiaires}\nExonéré de droits de succession (loi TEPA)`}>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Capital actuel</div>
                          <div className="text-xl font-bold text-indigo-700">{fmtEur(sec.deces.capitalBase)}</div>
                          <div className="text-xs text-gray-400">{sec.deces.moisDeRevenus} mois de revenus</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center border border-indigo-200 cursor-help"
                          title={`Capital recommandé pour votre situation :\n${sec.deces.detailObjectif ? `• Remplacement revenus : ${fmtEur(sec.deces.detailObjectif.remplacementRevenu)}\n• Liquidation pro : ${fmtEur(sec.deces.detailObjectif.liquidationPro)}\n• Éducation enfants : ${fmtEur(sec.deces.detailObjectif.educationEnfants)}\n• Conjoint : ${fmtEur(sec.deces.detailObjectif.conjoint)}` : 'Détail non disponible'}\nÉcart à combler : ${fmtEur(ecartCap)}`}>
                          <div className="text-[10px] text-indigo-500 uppercase tracking-wider">Capital recommandé</div>
                          <div className="text-xl font-bold text-indigo-700">{fmtEur(sec.deces.objectif)}</div>
                        </div>
                      </div>
                      {ecartCap > 0 && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-3 text-sm text-red-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Écart à combler : <strong>{fmtEur(ecartCap)}</strong>
                        </div>
                      )}
                      {sec.deces.capitalDoubleAccident && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2 text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Doublement du capital en cas d&apos;accident
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <GaugeSVG value={sec.deces.tauxCouverture} label="Couverture" sublabel={sec.deces.beneficiaires} size={150} />
                    </div>
                  </div>
                </div>

                {/* Détail de l'objectif de capital */}
                {detailObj && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-600" /> Décomposition du capital recommandé</h2>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left font-semibold text-gray-600">Poste</th>
                            <th className="p-3 text-right font-semibold text-gray-600">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailObj.remplacementRevenu > 0 && (
                            <tr className="border-t"><td className="p-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-500" /> Remplacement de revenus (24 mois)</td><td className="p-3 text-right font-semibold">{fmtEur(detailObj.remplacementRevenu)}</td></tr>
                          )}
                          {detailObj.liquidationPro > 0 && (
                            <tr className="border-t"><td className="p-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" /> Liquidation professionnelle</td><td className="p-3 text-right font-semibold">{fmtEur(detailObj.liquidationPro)}</td></tr>
                          )}
                          {detailObj.educationEnfants > 0 && (
                            <tr className="border-t"><td className="p-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /> Éducation des enfants</td><td className="p-3 text-right font-semibold">{fmtEur(detailObj.educationEnfants)}</td></tr>
                          )}
                          {detailObj.conjoint > 0 && (
                            <tr className="border-t"><td className="p-3 flex items-center gap-2"><Users className="w-4 h-4 text-red-500" /> Protection du conjoint</td><td className="p-3 text-right font-semibold">{fmtEur(detailObj.conjoint)}</td></tr>
                          )}
                          <tr className="border-t bg-indigo-50">
                            <td className="p-3 font-bold">Total recommandé</td>
                            <td className="p-3 text-right font-bold text-indigo-700">{fmtEur(detailObj.total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Fiscalité & Succession */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-600" /> Fiscalité & Succession</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div><strong>Exonération Totale</strong><br/>Le capital décès prévoyance est hors succession et exonéré de droits pour le conjoint et les enfants (loi TEPA).</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800 flex items-start gap-2">
                      <GraduationCap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div><strong>Option Rente Éducation</strong><br/>Pensez à transformer une partie du capital en rente éducation pour financer les études de vos enfants sur la durée.</div>
                    </div>
                  </div>
                </div>

                {/* Comprendre votre couverture décès — pédagogie */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-blue-600" /> Comprendre votre couverture décès</h2>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-5">
                    <div className="text-sm text-red-900 leading-relaxed space-y-2">
                      <p>
                        <strong>Le capital décès protège votre famille en cas de disparition.</strong> Il doit permettre à vos proches de maintenir leur niveau de vie 
                        pendant une période de transition, de rembourser les dettes professionnelles et de financer l&apos;éducation de vos enfants.
                      </p>
                      <p>
                        Votre caisse {result.formData.codeCaisse} verse un capital de <strong className="text-indigo-700">{fmtEur(sec.deces.capitalBase)}</strong>, 
                        ce qui représente <strong>{sec.deces.moisDeRevenus} mois de revenus</strong>.
                        {ecartCap > 0 
                          ? ` C'est insuffisant : le capital recommandé pour votre situation est de ${fmtEur(sec.deces.objectif)}, soit un écart de ${fmtEur(ecartCap)} à combler.`
                          : ` C'est un niveau de protection satisfaisant par rapport à l'objectif de ${fmtEur(sec.deces.objectif)}.`
                        }
                      </p>
                      {result.formData.nbEnfants > 0 && (
                        <p>
                          <strong>Avec {result.formData.nbEnfants} enfant{result.formData.nbEnfants > 1 ? 's' : ''} à charge :</strong> Le capital doit couvrir les études (estimées à 50 000 € par enfant), 
                          soit {fmtEur(result.formData.nbEnfants * 50000)} uniquement pour ce poste. C&apos;est souvent le poste le plus important et le plus sous-estimé.
                        </p>
                      )}
                      {result.formData.situation !== 'celibataire' && (
                        <p>
                          <strong>Protection du conjoint :</strong> En cas de décès, votre conjoint perd votre revenu de {fmtEur(revenuMensuel)}/mois. 
                          Le capital doit lui permettre de se retourner (12 à 24 mois de revenus de transition).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recommandations */}
                  {sec.deces.conseils?.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Recommandations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sec.deces.conseils.map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg p-3">
                            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ spécifique décès */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-gray-400" /> Questions fréquentes — Capital décès</h3>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Pourquoi le capital recommandé est-il de {fmtEur(sec.deces.objectif)} ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        Le capital recommandé est calculé en fonction de votre situation familiale et professionnelle :<br/>
                        {detailObj && (<>
                          {detailObj.remplacementRevenu > 0 && <><strong>• Remplacement de revenus :</strong> {fmtEur(detailObj.remplacementRevenu)} (24 mois × {fmtEur(revenuMensuel)})<br/></>}
                          {detailObj.liquidationPro > 0 && <><strong>• Liquidation professionnelle :</strong> {fmtEur(detailObj.liquidationPro)} (12 mois de charges pro)<br/></>}
                          {detailObj.educationEnfants > 0 && <><strong>• Éducation des enfants :</strong> {fmtEur(detailObj.educationEnfants)} ({result.formData.nbEnfants} × 50 000 €)<br/></>}
                          {detailObj.conjoint > 0 && <><strong>• Protection du conjoint :</strong> {fmtEur(detailObj.conjoint)} (12 mois de revenus)<br/></>}
                          <strong>Total :</strong> {fmtEur(detailObj.total)}
                        </>)}
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Le capital décès est-il imposable ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        <strong>Non, le capital décès prévoyance est exonéré de droits de succession</strong> pour le conjoint et les enfants (loi TEPA 2007). 
                        C&apos;est un avantage fiscal majeur par rapport à d&apos;autres formes de transmission. Le capital est versé directement au(x) bénéficiaire(s) désigné(s), 
                        hors succession, sans aucune taxation. Veillez à maintenir la clause bénéficiaire à jour.
                      </div>
                    </details>
                    <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                      <summary className="p-3 cursor-pointer font-medium text-sm text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                        <span>Qu&apos;est-ce que la rente éducation ?</span>
                        <span className="text-gray-400 group-open:rotate-90 transition-transform text-lg">›</span>
                      </summary>
                      <div className="p-3 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                        La rente éducation est une garantie complémentaire qui verse une rente mensuelle à chaque enfant jusqu&apos;à la fin de ses études (généralement 25-28 ans). 
                        Elle est plus avantageuse qu&apos;un capital unique car elle assure un revenu régulier et évite la dilapidation du capital. 
                        {result.formData.nbEnfants > 0 && ` Avec ${result.formData.nbEnfants} enfant${result.formData.nbEnfants > 1 ? 's' : ''}, c'est une garantie particulièrement pertinente dans votre cas.`}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
              )
            })()}

            {/* ================ PROCHAINES ÉTAPES ================ */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-6 mt-6">
              <h2 className="text-lg font-bold text-indigo-700 mb-4 flex items-center gap-2"><ArrowRight className="w-5 h-5" /> Prochaines étapes recommandées</h2>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Conservez cette analyse</strong> — Exportez ou imprimez ce rapport</span></li>
                <li className="flex items-start gap-2"><Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Contactez votre caisse</strong> — Vérifiez vos droits exacts</span></li>
                {!result.isCNBF && sec.ij.franchise >= 60 && (
                  <li className="flex items-start gap-2"><Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Étudiez une prévoyance complémentaire</strong> — Franchise courte (7-15j)</span></li>
                )}
                {sec.ij.tauxCouverture < 80 && (
                  <li className="flex items-start gap-2"><Wallet className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Renforcez vos IJ</strong> — Visez 100% avec un contrat Madelin</span></li>
                )}
                <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Vérifiez votre assurance emprunteur</strong> — ITT et invalidité couverts ?</span></li>
                <li className="flex items-start gap-2"><Users className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" /><span><strong>Mettez à jour vos bénéficiaires</strong> — Clause décès à jour</span></li>
              </ol>
            </div>

          </div>
        )}
        </main>
      </div>
    </SimulatorGate>
  )
}

