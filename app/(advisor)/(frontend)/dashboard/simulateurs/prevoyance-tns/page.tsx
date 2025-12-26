'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { getTMI, getNombreParts } from '../parameters-2025'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════
interface Profession { value: string; text: string; caisses: string[] }
interface Secteur { secteur: string; professions: Profession[] }
interface ClasseCotisation { classe: string; ij: number | string; invalidite: number | null; deces: number; descIj: string; descInv: string; descDeces: string; isProportionnel?: boolean; exempleIJ?: string }
interface BaseGuarantees { montantIJ_base: number; montantInvaliditeMensuel_base: number; montantDecesCapital_base: number; tauxCouverture_base: number; nomClasse: string | null; descIj: string; descInv: string; descDeces: string }
interface IdealCoverage { chargesTotalesMensuelles: number; revenuMensuelNetCible: number; ijConseille: number; invaliditeConseille: number; capitalConseille: number }
interface CpamGuarantees { montantIJ_CPAM: number; periode: string; carence: number; dureeMax: number; description: string }
interface CnbfGuarantees { ijLPA: number; ijCNBF: number; periodeLPA: string; periodeCNBF: string; description: string }
interface SimulationResult { 
  formData: { profession: string; codeCaisse: string; classeValue: string; revenuAn: number; age: number; situation: string; nbEnfants: number; chargePerso: number; chargePro: number }
  baseGuarantees: BaseGuarantees; idealCoverage: IdealCoverage; caisseInfo: { code: string; description: string; garanties: unknown }
  cpamGuarantees?: CpamGuarantees | null; hasCPAM?: boolean; cnbfGuarantees?: CnbfGuarantees | null; isCNBF?: boolean
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════
const fmtEur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => Math.min(100, Math.max(0, Math.round(n))) + '%'
const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v)))

function extractFranchise(desc: string): { jours: number | null; conditions: string | null } {
  if (!desc) return { jours: null, conditions: null }
  const m = desc.match(/[Ff]ranchise\s*(?:de\s*)?(\d+)/i) || desc.match(/[Cc]arence\s*(?:de\s*)?(\d+)/i)
  if (!m) return { jours: null, conditions: null }
  let cond: string | null = null
  if (desc.toLowerCase().includes('0j si accident')) cond = '0j si accident/hospi >48h'
  return { jours: parseInt(m[1]), conditions: cond }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT JAUGE SVG
// ══════════════════════════════════════════════════════════════════════════════
function GaugeSVG({ value, label, sublabel, color, size = 120 }: { value: number; label: string; sublabel?: string; color: string; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct(value) / 100) * circumference
  const colors: Record<string, string> = { red: '#ef4444', orange: '#f59e0b', green: '#10b981', purple: '#7c3aed', blue: '#3b82f6' }
  const c = colors[color] || '#3b82f6'
  
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{pct(value)}%</span>
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</span>
        {sublabel && <span className="text-xs text-gray-400 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT STEPPER
// ══════════════════════════════════════════════════════════════════════════════
function Stepper({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center max-w-lg mx-auto mb-8">
      {steps.map((step, i) => (
        <div key={i} className={`flex items-center ${i === steps.length - 1 ? '' : 'flex-1'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all duration-300
            ${i < current ? 'bg-indigo-600 text-white' : i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 'bg-gray-200 text-gray-500'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
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
  // DONNÉES GARANTIES EXTRAITES
  // ============================================================================
  const gd = useMemo(() => { 
    if (!result) return null
    const bg = result.baseGuarantees
    const fi = extractFranchise(bg.descIj)
    const isCNBF = result.isCNBF || false
    const hasCPAM = result.hasCPAM || false
    const effectiveFranchise = isCNBF ? 0 : fi.jours
    let ijJourPrincipal = bg.montantIJ_base
    if (isCNBF && result.cnbfGuarantees) ijJourPrincipal = result.cnbfGuarantees.ijLPA
    else if (hasCPAM && result.cpamGuarantees) ijJourPrincipal = result.cpamGuarantees.montantIJ_CPAM
    return { 
      ij: { m: ijJourPrincipal, mm: Math.round(ijJourPrincipal * 30), fr: effectiveFranchise, fc: fi.conditions, desc: bg.descIj }, 
      inv: { mm: bg.montantInvaliditeMensuel_base, ma: bg.montantInvaliditeMensuel_base * 12, desc: bg.descInv }, 
      dec: { c: bg.montantDecesCapital_base, desc: bg.descDeces, dbl: bg.descDeces?.toLowerCase().includes('doublé') },
      isCNBF, hasCPAM, cnbf: result.cnbfGuarantees, cpam: result.cpamGuarantees, baseIJ: bg.montantIJ_base
    } 
  }, [result])

  // ============================================================================
  // GAPS & FISCALITÉ
  // ============================================================================
  const gaps = useMemo(() => { 
    if (!result || !gd) return null
    const revenuMensuel = Math.round(result.formData.revenuAn / 12)
    const chargesTotal = result.formData.chargePerso + result.formData.chargePro
    // OBJECTIF = 100% du revenu mensuel réel
    const ijObjectif = revenuMensuel
    const invObjectif = revenuMensuel
    const capObjectif = revenuMensuel * 24 // 24 mois
    const ijActuel = gd.ij.mm
    return { 
      bm: revenuMensuel, charges: chargesTotal,
      ij: { b: ijActuel, c: ijObjectif, e: Math.max(0, ijObjectif - ijActuel), t: ijObjectif > 0 ? (ijActuel / ijObjectif) * 100 : 0 }, 
      inv: { b: gd.inv.mm, c: invObjectif, e: Math.max(0, invObjectif - gd.inv.mm), t: invObjectif > 0 ? (gd.inv.mm / invObjectif) * 100 : 0 }, 
      cap: { b: gd.dec.c, c: capObjectif, e: Math.max(0, capObjectif - gd.dec.c), t: capObjectif > 0 ? (gd.dec.c / capObjectif) * 100 : 0 }
    } 
  }, [result, gd])

  const fiscalImpact = useMemo(() => {
    if (!result) return null
    const revenu = parseFloat(form.revenuAn) || 0
    const nbParts = getNombreParts(form.situation as any, parseInt(form.nbEnfants) || 0)
    const tmi = getTMI(revenu / nbParts)
    
    // Estimation cotisation prévoyance (environ 4% du revenu pour couverture complète)
    const estimCotisation = Math.round(revenu * 0.04)
    const economieImpot = Math.round(estimCotisation * tmi)
    
    return { tmi: Math.round(tmi * 100), estimCotisation, economieImpot }
  }, [result, form])

  // ============================================================================
  // NARRATIFS PÉDAGOGIQUES PERSONNALISÉS
  // ============================================================================
  const narr = useMemo(() => {
    if (!result || !gd || !gaps) return null
    const fd = result.formData
    const rm = gaps.bm
    const ct = gaps.charges
    const isCNBF = gd.isCNBF
    const hasCPAM = gd.hasCPAM
    const sitLabel = fd.situation === 'celibataire' ? 'célibataire' : fd.situation === 'couple' ? 'en couple' : fd.situation === 'enfants' ? 'en couple avec ' + fd.nbEnfants + ' enfant(s)' : 'parent célibataire avec ' + fd.nbEnfants + ' enfant(s)'
    
    // Situation personnalisée
    const intro = `Vous êtes **${fd.profession}**, ${sitLabel}, avec un revenu mensuel de **${fmtEur(rm)} €**. Vos charges mensuelles totales s'élèvent à **${fmtEur(ct)} €** (${fmtEur(fd.chargePerso)} € perso + ${fmtEur(fd.chargePro)} € pro).`
    
    // Analyse IJ selon régime
    let ijAnalyse = ''
    if (isCNBF && gd.cnbf) {
      ijAnalyse = `**Régime Avocats (CNBF)** : Vous bénéficiez d'une protection privilégiée. Dès le **1er jour** d'arrêt, votre assurance LPA/AON verse **${fmtEur(gd.cnbf.ijLPA)} €/jour** (${fmtEur(gd.cnbf.ijLPA * 30)} €/mois). Aucune carence ! À partir du **91ème jour**, la CNBF prend le relais avec **${fmtEur(gd.cnbf.ijCNBF)} €/jour**. C'est l'un des meilleurs régimes TNS.`
    } else if (hasCPAM && gd.cpam) {
      ijAnalyse = `**Régime CPAM** : Après **3 jours de carence** (non indemnisés), la CPAM verse **${fmtEur(gd.cpam.montantIJ_CPAM)} €/jour** du J4 au J90. Au-delà du 90ème jour, votre caisse ${fd.codeCaisse} prend le relais. Attention : ces 3 premiers jours représentent **${fmtEur(rm / 10)} €** de perte sèche.`
    } else {
      const franchiseJours = gd.ij.fr || 90
      const moisFranchise = Math.ceil(franchiseJours / 30)
      const perteFranchise = rm * moisFranchise
      ijAnalyse = `**Régime ${fd.codeCaisse}** : Vous avez une **franchise de ${franchiseJours} jours** (${moisFranchise} mois). Pendant cette période, vous ne percevez **aucune indemnité**. Perte potentielle : **${fmtEur(perteFranchise)} €**. C'est le "trou" de trésorerie à anticiper absolument.`
    }
    
    // Analyse couverture
    const tauxIJ = pct(gaps.ij.t)
    const tauxInv = pct(gaps.inv.t)
    const tauxCap = pct(gaps.cap.t)
    let couvertureAnalyse = ''
    if (tauxIJ < 50) {
      couvertureAnalyse = `⚠️ **Alerte couverture IJ** : Vos indemnités ne couvrent que **${tauxIJ}%** de votre revenu. En cas d'arrêt, vous perdez **${fmtEur(gaps.ij.e)} €/mois** de pouvoir d'achat. ${gaps.ij.b < ct ? `Pire : vos IJ (${fmtEur(gaps.ij.b)} €) ne couvrent même pas vos charges (${fmtEur(ct)} €). Déficit mensuel de **${fmtEur(ct - gaps.ij.b)} €**.` : ''}`
    } else if (tauxIJ < 80) {
      couvertureAnalyse = `⚡ **Couverture IJ partielle** : Avec ${tauxIJ}% de couverture, vous maintenez un niveau de vie correct mais perdez tout de même **${fmtEur(gaps.ij.e)} €/mois**. Une prévoyance complémentaire pourrait combler cet écart.`
    } else {
      couvertureAnalyse = `✅ **Bonne couverture IJ** : Avec ${tauxIJ}% de couverture, votre niveau de vie est préservé en cas d'arrêt maladie.`
    }
    
    // Recommandations prioritaires
    const recommandations: Array<{urgence: 'critical' | 'high' | 'medium'; titre: string; desc: string}> = []
    if (!isCNBF && gd.ij.fr !== null && gd.ij.fr >= 60) {
      recommandations.push({ urgence: 'critical', titre: 'Couvrir la période de franchise', desc: `${gd.ij.fr} jours sans indemnité = ${fmtEur(rm * Math.ceil(gd.ij.fr/30))} € de perte. Souscrivez une prévoyance avec franchise courte (7-15 jours) ou constituez une épargne de précaution équivalente.` })
    }
    if (gaps.ij.b < ct) {
      recommandations.push({ urgence: 'critical', titre: 'IJ insuffisantes pour vos charges', desc: `Vos indemnités (${fmtEur(gaps.ij.b)} €/mois) sont inférieures à vos charges (${fmtEur(ct)} €). Déficit mensuel de ${fmtEur(ct - gaps.ij.b)} €. Augmentez votre couverture IJ en priorité.` })
    }
    if (tauxInv < 50) {
      recommandations.push({ urgence: 'high', titre: 'Rente invalidité très insuffisante', desc: `Seulement ${fmtEur(gaps.inv.b)} €/mois en cas d'invalidité (${tauxInv}% de couverture). Vous ne pourriez pas maintenir votre niveau de vie. Souscrivez une garantie invalidité complémentaire.` })
    }
    if (tauxCap < 50 && (fd.situation === 'couple' || fd.situation === 'enfants' || fd.nbEnfants > 0)) {
      recommandations.push({ urgence: 'high', titre: 'Capital décès à renforcer', desc: `${fmtEur(gaps.cap.b)} € = ${Math.round(gaps.cap.b / rm)} mois de revenus. Avec une famille à charge, visez au minimum 24 mois (${fmtEur(rm * 24)} €) pour assurer la transition financière.` })
    }
    if (recommandations.length === 0) {
      recommandations.push({ urgence: 'medium', titre: 'Optimiser votre protection', desc: 'Votre couverture de base est correcte. Consultez un conseiller pour identifier les axes d\'optimisation (fiscalité, options, etc.).' })
    }
    
    return { intro, ijAnalyse, couvertureAnalyse, recommandations, sitLabel }
  }, [result, gd, gaps])

  // ============================================================================
  // SIMULATEUR IMPACT FINANCIER - PAR MOIS (slider en JOURS)
  // ============================================================================
  const impactMensuel = useMemo(() => {
    if (!result || !gd || !gaps) return null
    const revenuMensuel = gaps.bm
    const revenuJour = revenuMensuel / 30
    const chargesTotal = gaps.charges
    const isCNBF = gd.isCNBF
    const hasCPAM = gd.hasCPAM
    const ijLPA = gd.cnbf?.ijLPA || 0
    const ijCNBF = gd.cnbf?.ijCNBF || 0
    const ijCPAM = gd.cpam?.montantIJ_CPAM || 0
    const ijCaisse = gd.baseIJ || 0
    
    const moisEnCours = Math.ceil(jourArret / 30)
    const jourDebutMois = (moisEnCours - 1) * 30 + 1
    const jourFinMois = moisEnCours * 30
    const joursArretDansMois = Math.min(jourArret, jourFinMois) - jourDebutMois + 1
    const joursTravailDansMois = 30 - joursArretDansMois
    
    let ijTotalMois = 0
    let detailCalc: Array<{phase: string; jours: number; ijJour: number; total: number; icon: string; color: string}> = []
    let joursCarence = 0, joursLPA = 0, joursCPAM = 0, joursCaisse = 0
    
    for (let j = jourDebutMois; j <= Math.min(jourArret, jourFinMois); j++) {
      if (isCNBF) {
        if (j <= 90) { ijTotalMois += ijLPA; joursLPA++ }
        else { ijTotalMois += ijCNBF; joursCaisse++ }
      } else if (hasCPAM) {
        if (j <= 3) joursCarence++
        else if (j <= 90) { ijTotalMois += ijCPAM; joursCPAM++ }
        else { ijTotalMois += ijCaisse; joursCaisse++ }
      } else {
        if (j <= 90) joursCarence++
        else { ijTotalMois += ijCaisse; joursCaisse++ }
      }
    }
    
    if (isCNBF) {
      if (joursLPA > 0) detailCalc.push({ phase: 'LPA/AON', jours: joursLPA, ijJour: ijLPA, total: joursLPA * ijLPA, icon: '⚖️', color: 'purple' })
      if (joursCaisse > 0) detailCalc.push({ phase: 'CNBF', jours: joursCaisse, ijJour: ijCNBF, total: joursCaisse * ijCNBF, icon: '🏛️', color: 'green' })
    } else if (hasCPAM) {
      if (joursCarence > 0) detailCalc.push({ phase: 'Carence CPAM', jours: joursCarence, ijJour: 0, total: 0, icon: '⏳', color: 'red' })
      if (joursCPAM > 0) detailCalc.push({ phase: 'CPAM', jours: joursCPAM, ijJour: ijCPAM, total: joursCPAM * ijCPAM, icon: '��', color: 'blue' })
      if (joursCaisse > 0) detailCalc.push({ phase: form.codeCaisse, jours: joursCaisse, ijJour: ijCaisse, total: joursCaisse * ijCaisse, icon: '🏛️', color: 'green' })
    } else {
      if (joursCarence > 0) detailCalc.push({ phase: 'Franchise', jours: joursCarence, ijJour: 0, total: 0, icon: '⏳', color: 'red' })
      if (joursCaisse > 0) detailCalc.push({ phase: form.codeCaisse, jours: joursCaisse, ijJour: ijCaisse, total: joursCaisse * ijCaisse, icon: '🏛️', color: 'green' })
    }
    
    const revenusTravail = joursTravailDansMois * revenuJour
    const totalPercuMois = ijTotalMois + revenusTravail
    const resteNormal = revenuMensuel - chargesTotal
    const resteArret = totalPercuMois - chargesTotal
    const perteMois = revenuMensuel - totalPercuMois
    const tauxCouverture = revenuMensuel > 0 ? Math.round((totalPercuMois / revenuMensuel) * 100) : 0
    
    let regimeActif = '', regimeDesc = '', regimeColor = 'blue'
    if (isCNBF) {
      if (jourArret <= 90) { regimeActif = 'LPA/AON'; regimeDesc = 'Couverture LPA dès le 1er jour, sans carence. Vous êtes protégé immédiatement.'; regimeColor = 'purple' }
      else { regimeActif = 'CNBF'; regimeDesc = 'La CNBF prend le relais après J90 avec une indemnité potentiellement différente.'; regimeColor = 'green' }
    } else if (hasCPAM) {
      if (jourArret <= 3) { regimeActif = 'Carence'; regimeDesc = 'Les 3 premiers jours sont non indemnisés (carence CPAM).'; regimeColor = 'red' }
      else if (jourArret <= 90) { regimeActif = 'CPAM'; regimeDesc = `La CPAM verse ${fmtEur(ijCPAM)} €/jour du J4 au J90.`; regimeColor = 'blue' }
      else { regimeActif = form.codeCaisse; regimeDesc = `Votre caisse ${form.codeCaisse} prend le relais après J90.`; regimeColor = 'green' }
    } else {
      if (jourArret <= 90) { regimeActif = 'Franchise'; regimeDesc = `Aucune indemnité pendant les 90 premiers jours. C'est le "trou" de trésorerie.`; regimeColor = 'red' }
      else { regimeActif = form.codeCaisse; regimeDesc = `Votre caisse ${form.codeCaisse} verse ${fmtEur(ijCaisse)} €/jour après la franchise.`; regimeColor = 'green' }
    }
    
    return { moisEnCours, jourDebutMois, jourFinMois, joursArretDansMois, joursTravailDansMois, ijTotalMois: Math.round(ijTotalMois), revenusTravail: Math.round(revenusTravail), totalPercuMois: Math.round(totalPercuMois), revenuMensuel, chargesTotal, resteNormal: Math.round(resteNormal), resteArret: Math.round(resteArret), perteMois: Math.round(perteMois), tauxCouverture, regimeActif, regimeDesc, regimeColor, detailCalc, isCNBF, hasCPAM }
  }, [result, gd, gaps, jourArret, form.codeCaisse])

  // Score global pondéré
  const scoreGlobal = useMemo(() => {
    if (!gaps) return 0
    return Math.round(gaps.ij.t * 0.4 + gaps.inv.t * 0.4 + gaps.cap.t * 0.2)
  }, [gaps])

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
            ← Retour aux simulateurs
          </Link>
          
          {/* HEADER */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🛡️</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulateur Prévoyance TNS</h1>
                <p className="text-gray-600">Analysez votre protection sociale et optimisez votre fiscalité Madelin</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">TNS 2025</span>
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
                      <h2 className="text-lg font-bold flex items-center gap-2">👤 Votre profil professionnel</h2>
                      
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
                        <button type="button" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={nextStep} disabled={!form.profession || !form.codeCaisse}>Suivant →</button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : FINANCES */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2">💰 Vos revenus</h2>
                      
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
                        <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" onClick={prevStep}>← Précédent</button>
                        <button type="button" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={nextStep} disabled={!form.revenuAn || !form.age}>Suivant →</button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : SITUATION & CHARGES */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2">🏠 Situation & Charges</h2>
                      
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
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <strong>💡 Optionnel :</strong> Charges mensuelles. Si vide, estimation standard (35% Perso / 15% Pro).
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
                        <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" onClick={prevStep}>← Précédent</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={loading}>
                          {loading ? '⏳ Calcul en cours...' : '� Lancer l\'analyse'}
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
        {step === 4 && result && gd && gaps && narr && fiscalImpact && (
          <div ref={resultRef} className="space-y-6 animate-fadeIn">
            
            {/* Bouton retour */}
            <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              ← Modifier les paramètres
            </button>
            
            {/* TABS DE NAVIGATION */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[
                { key: 'synthese', icon: '📊', label: 'Synthèse' },
                { key: 'ij', icon: '🏥', label: 'Arrêt maladie' },
                { key: 'invalidite', icon: '♿', label: 'Invalidité' },
                { key: 'deces', icon: '❤️', label: 'Décès' },
              ].map(tab => (
                <button key={tab.key} type="button" 
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${activeTab === tab.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}>
                  <span className="text-lg">{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* ================ ONGLET SYNTHÈSE ================ */}
            {activeTab === 'synthese' && (
              <div className="space-y-6">
                {/* KPIs principaux */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="text-gray-500 text-sm">Score Global</div>
                    <div className={`text-3xl font-bold ${scoreGlobal < 50 ? 'text-red-600' : scoreGlobal < 75 ? 'text-orange-500' : 'text-green-600'}`}>{scoreGlobal}%</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setActiveTab('ij')}>
                    <div className="text-gray-500 text-sm">IJ Maladie</div>
                    <div className={`text-2xl font-bold ${gaps.ij.t < 60 ? 'text-red-600' : 'text-green-600'}`}>{fmtEur(gaps.ij.b)}</div>
                    <div className="text-xs text-gray-400">{fmtPct(gaps.ij.t)} couvert</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setActiveTab('invalidite')}>
                    <div className="text-gray-500 text-sm">Invalidité</div>
                    <div className={`text-2xl font-bold ${gaps.inv.t < 60 ? 'text-red-600' : 'text-green-600'}`}>{fmtEur(gaps.inv.b)}</div>
                    <div className="text-xs text-gray-400">{fmtPct(gaps.inv.t)} couvert</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setActiveTab('deces')}>
                    <div className="text-gray-500 text-sm">Capital Décès</div>
                    <div className={`text-2xl font-bold ${gaps.cap.t < 60 ? 'text-red-600' : 'text-green-600'}`}>{fmtEur(gaps.cap.b)}</div>
                    <div className="text-xs text-gray-400">{fmtPct(gaps.cap.t)} couvert</div>
                  </div>
                </div>

                {/* Résumé Narratif */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">📝 Votre audit en bref</h2>
                  <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{__html: narr.intro.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-700">$1</strong>')}} />
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full cursor-help" title="Tranche Marginale d'Imposition">TMI : {fiscalImpact.tmi}%</span>
                    {gd.isCNBF && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full cursor-help" title="Régime spécifique des avocats">CNBF</span>}
                    {!gd.isCNBF && <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full cursor-help" title="Période sans indemnité">Franchise : {gd.ij.fr}j</span>}
                  </div>
                </div>

                {/* Score + Jauges */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🎯 Score de protection</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="flex justify-center">
                      <GaugeSVG value={scoreGlobal} label="Score Global" color={scoreGlobal < 50 ? 'red' : scoreGlobal < 75 ? 'orange' : 'green'} size={140} />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-3 gap-4">
                      <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('ij')}>
                        <GaugeSVG value={gaps.ij.t} label="IJ Maladie" sublabel={fmtEur(gaps.ij.b) + '/mois'} color={gaps.ij.t < 60 ? 'red' : gaps.ij.t < 90 ? 'orange' : 'green'} size={100} />
                      </div>
                      <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('invalidite')}>
                        <GaugeSVG value={gaps.inv.t} label="Invalidité" sublabel={fmtEur(gaps.inv.b) + '/mois'} color={gaps.inv.t < 60 ? 'red' : gaps.inv.t < 90 ? 'orange' : 'green'} size={100} />
                      </div>
                      <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setActiveTab('deces')}>
                        <GaugeSVG value={gaps.cap.t} label="Décès" sublabel={fmtEur(gaps.cap.b)} color={gaps.cap.t < 60 ? 'red' : gaps.cap.t < 90 ? 'orange' : 'green'} size={100} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Prioritaires + Fiscalité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Actions Prioritaires */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">🚨 Actions Prioritaires</h2>
                    <div className="space-y-3">
                      {narr.recommandations.slice(0, 3).map((r, i) => (
                        <div key={i} className={`flex gap-3 p-3 rounded-lg border-l-4 ${
                          r.urgence === 'critical' ? 'bg-red-50 border-red-500' : 
                          r.urgence === 'high' ? 'bg-orange-50 border-orange-500' : 
                          'bg-blue-50 border-blue-500'
                        }`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                            r.urgence === 'critical' ? 'bg-red-500' : r.urgence === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>{i + 1}</div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{r.titre}</div>
                            <div className="text-gray-600 text-xs mt-1">{r.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunité Fiscale Madelin */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-6">
                    <h2 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2">💶 Opportunité Fiscale Madelin</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      En souscrivant une prévoyance Madelin, vous déduisez les cotisations de votre revenu imposable.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                        <div className="text-xs text-gray-500 cursor-help" title="Estimation ~4% de votre revenu">Cotisation estimée ℹ️</div>
                        <div className="text-xl font-bold text-gray-900">{fmtEur(fiscalImpact.estimCotisation)}</div>
                        <div className="text-xs text-gray-400">/an</div>
                      </div>
                      <div className="bg-indigo-600 rounded-lg p-4 text-center text-white">
                        <div className="text-xs opacity-80 cursor-help" title={`TMI de ${fiscalImpact.tmi}%`}>Économie d'impôt ℹ️</div>
                        <div className="text-xl font-bold">{fmtEur(fiscalImpact.economieImpot)}</div>
                        <div className="text-xs opacity-80">/an</div>
                      </div>
                    </div>
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-4 text-sm text-green-800">
                      <strong>✅ Coût réel : {fmtEur(fiscalImpact.estimCotisation - fiscalImpact.economieImpot)}/an</strong>
                      <span className="text-green-600 ml-2">({fmtEur((fiscalImpact.estimCotisation - fiscalImpact.economieImpot)/12)}/mois)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================ ONGLET ARRÊT MALADIE ================ */}
            {activeTab === 'ij' && impactMensuel && (
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📅 Votre couverture dans le temps</h2>
                  <div className="flex items-center justify-center gap-4 py-6 relative">
                    <div className="absolute top-1/2 left-16 right-16 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                    {gd.isCNBF ? (
                      <>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 bg-white transition-all ${jourArret <= 90 ? 'border-purple-500 ring-4 ring-purple-200 scale-110' : 'border-gray-300'}`}>⚖️</div>
                          <div className="font-semibold text-gray-800 mt-2">LPA (0j)</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J1-J90</div>
                        </div>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 bg-white transition-all ${jourArret > 90 ? 'border-green-500 ring-4 ring-green-200 scale-110' : 'border-gray-300'}`}>🏛️</div>
                          <div className="font-semibold text-gray-800 mt-2">CNBF</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J91+</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 bg-white transition-all ${jourArret <= (gd.ij.fr||0) ? 'border-red-500 ring-4 ring-red-200 scale-110 bg-red-50' : 'border-gray-300'}`}>⏳</div>
                          <div className="font-semibold text-gray-800 mt-2">Franchise</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J1-J{gd.ij.fr||90}</div>
                        </div>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 bg-white transition-all ${jourArret > (gd.ij.fr||0) ? 'border-green-500 ring-4 ring-green-200 scale-110' : 'border-gray-300'}`}>🏛️</div>
                          <div className="font-semibold text-gray-800 mt-2">{form.codeCaisse}</div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">J{(gd.ij.fr||90)+1}+</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>Situation actuelle :</strong> {impactMensuel.regimeDesc}
                  </div>
                </div>

                {/* Simulateur Slider */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📉 Impact financier d'un arrêt</h2>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <strong className="text-gray-800">Durée de l'arrêt : {jourArret} jours</strong>
                      <span className="text-indigo-600 font-semibold">Mois {impactMensuel.moisEnCours}</span>
                    </div>
                    <input type="range" min={1} max={365} value={jourArret} onChange={e => setJourArret(Number(e.target.value))} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="font-semibold text-green-800 mb-3">✅ Mois Normal</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Revenus</span><span className="font-semibold text-indigo-600">{fmtEur(gaps.bm)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Charges</span><span>-{fmtEur(gaps.charges)}</span></div>
                        <div className="flex justify-between pt-2 border-t border-green-300"><span className="font-semibold">Reste</span><span className="font-bold text-green-600">{fmtEur(gaps.bm - gaps.charges)}</span></div>
                      </div>
                    </div>
                    <div className={`${impactMensuel.resteArret < 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4`}>
                      <div className={`font-semibold mb-3 ${impactMensuel.resteArret < 0 ? 'text-red-800' : 'text-orange-800'}`}>⚠️ Mois avec arrêt</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Perçu</span><span>{fmtEur(impactMensuel.totalPercuMois)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Charges</span><span>-{fmtEur(impactMensuel.chargesTotal)}</span></div>
                        <div className={`flex justify-between pt-2 border-t ${impactMensuel.resteArret < 0 ? 'border-red-300' : 'border-orange-300'}`}>
                          <span className="font-semibold">Reste</span>
                          <span className={`font-bold ${impactMensuel.resteArret < 0 ? 'text-red-600' : 'text-orange-600'}`}>{fmtEur(impactMensuel.resteArret)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {impactMensuel.perteMois > 0 && (
                    <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 mt-4 text-center">
                      <div className="text-sm text-red-700">Perte de revenus ce mois-ci</div>
                      <div className="text-2xl font-bold text-red-600">-{fmtEur(impactMensuel.perteMois)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================ ONGLET INVALIDITÉ ================ */}
            {activeTab === 'invalidite' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">♿ Rente Invalidité</h2>
                    <div className="flex justify-center mb-6">
                      <GaugeSVG value={gaps.inv.t} label="Couverture" sublabel={`${fmtEur(gaps.inv.b)} / ${fmtEur(gaps.inv.c)}`} color={gaps.inv.t < 60 ? 'red' : 'green'} size={160} />
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                      En cas d'invalidité totale, vous percevrez <strong className="text-indigo-700">{fmtEur(gaps.inv.b)}/mois</strong> jusqu'à la retraite.
                      {gaps.inv.e > 0 ? <span className="text-red-600"> Il vous manquera {fmtEur(gaps.inv.e)}/mois pour maintenir votre niveau de vie.</span> : <span className="text-green-600"> Votre couverture est excellente.</span>}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📉 Conséquences long terme</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      L'invalidité est le risque financier le plus lourd car il peut durer des décennies.
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-left font-semibold text-gray-600">Durée</th>
                            <th className="p-3 text-right font-semibold text-gray-600">Perte cumulée</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t"><td className="p-3">1 an</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(gaps.inv.e * 12)}</td></tr>
                          <tr className="border-t"><td className="p-3">5 ans</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(gaps.inv.e * 60)}</td></tr>
                          <tr className="border-t"><td className="p-3">10 ans</td><td className="p-3 text-right text-red-600 font-semibold">-{fmtEur(gaps.inv.e * 120)}</td></tr>
                          <tr className="border-t bg-red-50"><td className="p-3 font-semibold">Jusqu'à retraite ({65-(parseInt(form.age)||0)} ans)</td><td className="p-3 text-right text-red-700 font-bold">-{fmtEur(gaps.inv.e * 12 * (65-(parseInt(form.age)||0)))}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================ ONGLET DÉCÈS ================ */}
            {activeTab === 'deces' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">❤️ Capital Décès</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <div className="text-gray-700 leading-relaxed">
                        Pour protéger votre famille (conjoint, enfants), le capital recommandé est de <strong className="text-indigo-700">{fmtEur(gaps.cap.c)}</strong> (24 mois de revenus).
                        <br/><br/>
                        Capital actuel : <strong className="text-indigo-700">{fmtEur(gaps.cap.b)}</strong>
                      </div>
                      {gaps.cap.e > 0 && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mt-4 text-sm text-red-800">
                          ⚠️ Manque à assurer : <strong>{fmtEur(gaps.cap.e)}</strong>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <GaugeSVG value={gaps.cap.t} label="Couverture" color={gaps.cap.t < 60 ? 'red' : 'green'} size={150} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📋 Fiscalité & Succession</h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-800">
                    <strong>✅ Exonération Totale</strong><br/>
                    Le capital décès prévoyance est hors succession et exonéré de droits pour le conjoint et les enfants (loi TEPA).
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
                    <strong>⚡ Option Rente Éducation</strong><br/>
                    Pensez à transformer une partie du capital en rente éducation pour financer les études de vos enfants sur la durée.
                  </div>
                </div>
              </div>
            )}

            {/* ================ GLOSSAIRE & FAQ ================ */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">📚 Glossaire & Questions fréquentes</h2>
              
              <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                <summary className="p-4 cursor-pointer font-semibold text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                  💊 Qu'est-ce que les Indemnités Journalières (IJ) ?
                  <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                  Les IJ sont des <strong>sommes versées chaque jour d'arrêt de travail</strong> pour compenser votre perte de revenus. 
                  Le montant dépend de votre caisse et de votre classe de cotisation.<br/><br/>
                  <strong>Points clés :</strong><br/>
                  • La <strong>franchise</strong> (ou carence) est la période initiale non indemnisée<br/>
                  • Les IJ sont généralement plafonnées (50% du PASS pour la CPAM)<br/>
                  • La durée de versement est limitée (3 ans maximum généralement)<br/>
                  • Elles sont soumises à l'impôt sur le revenu
                </div>
              </details>
              
              <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                <summary className="p-4 cursor-pointer font-semibold text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                  ⏳ Franchise vs Carence : quelle différence ?
                  <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                  Les deux termes désignent la même chose : la <strong>période au début de l'arrêt pendant laquelle vous ne percevez aucune indemnité</strong>.<br/><br/>
                  <strong>Exemples :</strong><br/>
                  • CPAM : 3 jours de carence<br/>
                  • CNBF (Avocats) : 0 jour !<br/>
                  • Autres caisses : généralement 90 jours<br/><br/>
                  <strong>Impact :</strong> 90 jours = <strong className="text-red-600">perte de {fmtEur(gaps.bm * 3)}</strong>
                </div>
              </details>
              
              <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                <summary className="p-4 cursor-pointer font-semibold text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                  📈 Pourquoi viser 100% de couverture ?
                  <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                  L'objectif <strong>100% du revenu mensuel</strong> signifie maintenir votre niveau de vie en cas d'arrêt.<br/><br/>
                  <strong>Votre cas :</strong><br/>
                  • Revenu : <strong className="text-indigo-600">{fmtEur(gaps.bm)}/mois</strong><br/>
                  • IJ actuelles : <strong>{fmtEur(gaps.ij.b)}/mois</strong> ({pct(gaps.ij.t)}%)<br/>
                  • Perte : <strong className="text-red-600">{pct(100 - gaps.ij.t)}%</strong><br/><br/>
                  Vos charges ne diminuent pas pendant un arrêt. Une prévoyance complémentaire comble l'écart.
                </div>
              </details>
              
              <details className="bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
                <summary className="p-4 cursor-pointer font-semibold text-gray-800 list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
                  💡 Comment améliorer ma protection ?
                  <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                  <strong>1. Prévoyance complémentaire</strong> — Franchise courte (7-15 jours)<br/>
                  <strong>2. Épargne de précaution</strong> — 3-6 mois de charges ({fmtEur(gaps.charges * 3)} à {fmtEur(gaps.charges * 6)})<br/>
                  <strong>3. Assurance emprunteur</strong> — Couvrir ITT et invalidité<br/>
                  <strong>4. Optimisation fiscale</strong> — Cotisations Madelin déductibles du BNC
                </div>
              </details>
            </div>

            {/* ================ PROCHAINES ÉTAPES ================ */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-6 mt-6">
              <h2 className="text-lg font-bold text-indigo-700 mb-4 flex items-center gap-2">🚀 Prochaines étapes recommandées</h2>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><span>📋</span><span><strong>Conservez cette analyse</strong> — Exportez ou imprimez ce rapport</span></li>
                <li className="flex items-start gap-2"><span>📞</span><span><strong>Contactez votre caisse</strong> — Vérifiez vos droits exacts</span></li>
                {!gd.isCNBF && gd.ij.fr !== null && gd.ij.fr >= 60 && (
                  <li className="flex items-start gap-2"><span>🛡️</span><span><strong>Étudiez une prévoyance complémentaire</strong> — Franchise courte (7-15j)</span></li>
                )}
                {gaps.ij.t < 80 && (
                  <li className="flex items-start gap-2"><span>💰</span><span><strong>Renforcez vos IJ</strong> — Visez 100% avec un contrat Madelin</span></li>
                )}
                <li className="flex items-start gap-2"><span>💳</span><span><strong>Vérifiez votre assurance emprunteur</strong> — ITT et invalidité couverts ?</span></li>
                <li className="flex items-start gap-2"><span>👨‍👩‍👧</span><span><strong>Mettez à jour vos bénéficiaires</strong> — Clause décès à jour</span></li>
              </ol>
            </div>

          </div>
        )}
        </main>
      </div>
    </SimulatorGate>
  )
}

