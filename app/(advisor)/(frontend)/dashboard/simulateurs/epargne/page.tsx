'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

// Types alignés avec le backend
interface EvolutionAnnuelle {
  annee: number
  capital: number
  versementsCumules: number
  interetsCumules: number
  interetsAnnee: number
}

interface EffetComposes {
  interetsSimples: number
  interetsComposes: number
  gainComposes: number
  pourcentageGainComposes: number
}

interface CapitalFinalResult {
  capitalFinal: number
  totalVerse: number
  interetsGeneres: number
  tauxRendementGlobal: number
  evolutionAnnuelle: EvolutionAnnuelle[]
  effetComposes: EffetComposes
  multiplicateur: number
  partInterets: number
  objectif?: number
  objectifAtteint?: boolean
  ecartObjectif?: number
}

interface VersementInitialResult {
  objectifAtteintSansVI: boolean
  versementInitialNecessaire?: number
  capitalProjeteSansVI?: number
  capitalObjectif?: number
  dureeAnnees?: number
  message: string
}

interface DureeNecessaireResult {
  objectifDejaAtteint: boolean
  dureeNecessaire?: number
  moisNecessaires?: number
  capitalObjectif?: number
  capitalFinalAtteint?: number
  message?: string
  error?: string
}

interface Recommandation {
  priorite: 'haute' | 'moyenne' | 'basse'
  type: string
  description: string
}

interface ProfilRisque {
  nom: string
  rendement: number
  description: string
  capitalFinal?: number
  interetsGeneres?: number
  objectifAtteint?: boolean | null
}

interface SimulationResponse {
  success: boolean
  data?: {
    typeCalcul: string
     
    parametres: any
     
    resultat: any
    recommandations: Recommandation[]
    comparaisonProfils?: ProfilRisque[]
  }
  error?: string
}

// CSS intégré
const styles = `
:root{--pri:#1e40af;--pri-dk:#1e3a8a;--sec:#64748b;--gold:#f59e0b;--grn:#10b981;--bg:#f8fafc;--card:#fff;--brd:#e2e8f0;--txt:#1e293b;--txt-lt:#64748b;--err:#ef4444;--shadow:0 4px 6px -1px rgb(0 0 0/.1)}
.pw{max-width:1000px;margin:0 auto;padding:1rem;font-family:Inter,-apple-system,sans-serif;font-size:13px;color:var(--txt);line-height:1.6}
.ph{text-align:center;margin-bottom:1.25rem}
.ph h1{font-size:1.5rem;font-weight:700;color:var(--pri);margin:.5rem 0 .25rem}
.ph p{font-size:12px;color:var(--txt-lt)}
.card{background:var(--card);border-radius:.5rem;padding:1rem;margin-bottom:.85rem;border:1px solid var(--brd);box-shadow:var(--shadow)}
.card-t{font-size:1rem;font-weight:700;margin-bottom:.6rem;display:flex;align-items:center;gap:.35rem}
.card-p{border:2px solid transparent;background:linear-gradient(var(--card),var(--card))padding-box,linear-gradient(135deg,#1e40af,#3b82f6,#10b981)border-box}
.sec{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--brd)}
.sec:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.sec-t{font-size:.9rem;font-weight:600;margin-bottom:.6rem;display:flex;align-items:center;gap:.35rem}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.7rem}
.fgrp{display:flex;flex-direction:column;gap:.2rem}
.flbl{font-weight:600;font-size:11px}.flbl .r{color:var(--err)}
.finp,.fsel{padding:.45rem .6rem;border:2px solid var(--brd);border-radius:.3rem;font-size:13px;transition:all .2s;width:100%}
.finp:focus,.fsel:focus{outline:none;border-color:var(--pri);box-shadow:0 0 0 2px rgba(30,64,175,.1)}
.iw{position:relative}.iw .sfx{position:absolute;right:.5rem;top:50%;transform:translateY(-50%);color:var(--txt-lt);font-size:11px;font-weight:600}
.fh{font-size:10px;color:var(--txt-lt)}
.btn{background:linear-gradient(135deg,var(--pri),var(--aura-dk));color:#fff;border:none;padding:.5rem 1rem;border-radius:.35rem;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:.35rem;transition:all .2s}
.btn:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
.btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.btn-o{background:transparent;color:var(--pri);border:2px solid var(--pri)}
.btn-o:hover{background:rgba(30,64,175,.05)}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{padding:.45rem .55rem;text-align:left;border-bottom:1px solid var(--brd)}
th{background:var(--bg);font-weight:600}
.v{font-weight:700;color:var(--pri)}.vw{color:var(--gold);font-weight:600}.ve{color:var(--err);font-weight:600}.vs{color:var(--grn);font-weight:600}
.bdg{display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .4rem;border-radius:.2rem;font-size:10px;font-weight:600}
.bdg-p{background:rgba(30,64,175,.1);color:var(--pri)}
.bdg-w{background:rgba(245,158,11,.15);color:#b45309}
.bdg-e{background:rgba(239,68,68,.15);color:#dc2626}
.bdg-s{background:rgba(16,185,129,.15);color:#059669}
.ibox{background:var(--bg);padding:.6rem .8rem;border-radius:.3rem;border-left:3px solid var(--pri);font-size:11px;margin:.4rem 0}
.wbox{background:#fef3c7;padding:.6rem .8rem;border-radius:.3rem;border-left:3px solid var(--gold);font-size:11px;margin:.4rem 0;color:#92400e}
.tbox{background:#ecfdf5;padding:.6rem .8rem;border-radius:.3rem;border-left:3px solid var(--grn);font-size:11px;margin:.4rem 0;color:#065f46}
.abox{background:#fef2f2;padding:.6rem .8rem;border-radius:.3rem;border-left:3px solid var(--err);font-size:11px;margin:.4rem 0;color:#991b1b}
.narr{background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:.4rem;padding:.8rem;margin:.5rem 0;border:1px solid #bae6fd}
.narr-t{font-weight:700;font-size:12px;color:#0c4a6e;margin-bottom:.35rem}
.narr-x{font-size:11px;color:#0369a1;line-height:1.65}.narr-x strong{color:#0c4a6e}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}
@media(max-width:700px){.g2,.g3,.g4{grid-template-columns:1fr}}
.gc{background:var(--bg);border-radius:.4rem;padding:.8rem;border:1px solid var(--brd)}
.gc-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.4rem}
.gc-t{font-weight:700;font-size:12px}.gc-a{font-size:1.3rem;font-weight:700;color:var(--pri)}
.gc-d{font-size:10px;color:var(--txt-lt)}.gc-d li{margin-bottom:.2rem}
.sbtn{display:flex;flex-wrap:wrap;gap:.3rem}
.sbtn button{padding:.3rem .5rem;border-radius:.25rem;border:1px solid var(--brd);background:#fff;font-size:10px;cursor:pointer;transition:all .15s}
.sbtn button:hover{border-color:var(--pri)}
.sbtn button.a{background:var(--pri);color:#fff;border-color:var(--pri)}
.chbox{min-height:220px}
.slw{margin:.5rem 0}
input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:linear-gradient(to right,var(--pri),var(--gold),var(--grn));cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--pri);cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.2)}
details{margin-bottom:.35rem}
summary{cursor:pointer;font-weight:600;font-size:11px;color:var(--pri);padding:.4rem .6rem;background:var(--bg);border-radius:.3rem}
details[open] summary{border-radius:.3rem .3rem 0 0}
.dc{padding:.55rem;background:#fff;border:1px solid var(--brd);border-top:none;border-radius:0 0 .3rem .3rem;font-size:11px}
.fi{animation:fi .3s ease both}@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.mu{color:var(--txt-lt);font-size:10px}.tc{text-align:center}.mt{margin-top:.5rem}.mb{margin-bottom:.5rem}
.kpi{text-align:center;padding:.8rem;background:var(--bg);border-radius:.4rem}
.kpi-v{font-size:1.5rem;font-weight:700;color:var(--pri)}.kpi-l{font-size:10px;color:var(--txt-lt)}
.prog{height:8px;background:var(--brd);border-radius:4px;overflow:hidden;margin:.3rem 0}
.prog-f{height:100%;border-radius:4px;transition:width .5s ease}
`

export default function EpargnePage() {
  const resultRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const pieRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CapitalFinalResult | null>(null)
  const [recommandations, setRecommandations] = useState<Recommandation[]>([])
  const [comparaisonProfils, setComparaisonProfils] = useState<ProfilRisque[]>([])
  const [step, setStep] = useState(1)
  const [calculType, setCalculType] = useState<'capital_final' | 'versement_initial' | 'duree_necessaire' | 'comparer_scenarios'>('capital_final')
  
  // Résultats des autres types de calcul
  const [viResult, setViResult] = useState<VersementInitialResult | null>(null)
  const [dureeResult, setDureeResult] = useState<DureeNecessaireResult | null>(null)
  const [scenariosResult, setScenariosResult] = useState<any>(null)
  
  const [form, setForm] = useState({
    capitalInitial: 10000,
    versementMensuel: 300,
    dureeAnnees: 15,
    rendementAnnuel: 4,
    objectif: 100000,
  })

  // Scénarios pour comparaison multi-scénarios
  const [scenariosInput, setScenariosInput] = useState([
    { nom: 'Scénario prudent', versementInitial: 10000, versementMensuel: 200, dureeAnnees: 15, tauxAnnuelNet: 2 },
    { nom: 'Scénario équilibré', versementInitial: 10000, versementMensuel: 300, dureeAnnees: 15, tauxAnnuelNet: 4 },
    { nom: 'Scénario dynamique', versementInitial: 10000, versementMensuel: 400, dureeAnnees: 15, tauxAnnuelNet: 6 },
  ])
  
  const updateScenario = (index: number, field: string, value: string | number) => {
    setScenariosInput(prev => prev.map((s, i) => i === index ? { ...s, [field]: typeof value === 'string' ? (field === 'nom' ? value : parseFloat(value) || 0) : value } : s))
  }

  // Scenarios interactifs
  const [scenarioRendement, setScenarioRendement] = useState(4)
  const [scenarioDuree, setScenarioDuree] = useState(15)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: parseFloat(value) || 0 }))
  }

  // Appel au backend
  const simulate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setViResult(null)
    setDureeResult(null)
    setScenariosResult(null)
    setRecommandations([])
    setComparaisonProfils([])
    
    try {
      const body: any = {
        calculationType: calculType,
        versementInitial: form.capitalInitial,
        versementMensuel: form.versementMensuel,
        dureeAnnees: form.dureeAnnees,
        tauxAnnuelNet: form.rendementAnnuel,
        objectif: form.objectif
      }
      
      // Pour comparer_scenarios, envoyer les scénarios
      if (calculType === 'comparer_scenarios') {
        body.scenarios = scenariosInput
      }
      
      const res = await fetch('/api/advisor/simulators/epargne', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data: SimulationResponse = await res.json()
      
      if (data.success && data.data) {
        if (calculType === 'capital_final') {
          setResult(data.data.resultat as CapitalFinalResult)
        } else if (calculType === 'versement_initial') {
          setViResult(data.data.resultat as VersementInitialResult)
        } else if (calculType === 'duree_necessaire') {
          setDureeResult(data.data.resultat as DureeNecessaireResult)
        } else if (calculType === 'comparer_scenarios') {
          setScenariosResult(data.data.resultat)
        }
        
        setRecommandations(data.data.recommandations || [])
        setComparaisonProfils(data.data.comparaisonProfils || [])
        setScenarioRendement(form.rendementAnnuel)
        setScenarioDuree(form.dureeAnnees)
        setStep(2)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      } else {
        setError(data.error || 'Erreur lors de la simulation')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }
  
  // Calcul rapide pour scénarios interactifs (local)
  const calculerProjectionLocale = useCallback((capital: number, versement: number, duree: number, taux: number) => {
    const tauxMensuel = taux / 100 / 12
    let cap = capital
    let totalVerse = capital
    let interetsTotal = 0
    
    for (let annee = 1; annee <= duree; annee++) {
      for (let mois = 1; mois <= 12; mois++) {
        const interets = cap * tauxMensuel
        cap += interets + versement
        totalVerse += versement
        interetsTotal += interets
      }
    }
    
    return {
      capitalFinal: Math.round(cap),
      totalVerse: Math.round(totalVerse),
      interetsGeneres: Math.round(interetsTotal),
    }
  }, [])

  const eur = (v: number) => Math.round(v).toLocaleString('fr-FR')
  const pct = (v: number) => `${v.toFixed(1)}%`

  // Scénario interactif
  const scenarioResult = useMemo(() => {
    if (!result) return null
    return calculerProjectionLocale(form.capitalInitial, form.versementMensuel, scenarioDuree, scenarioRendement)
  }, [result, form.capitalInitial, form.versementMensuel, scenarioDuree, scenarioRendement, calculerProjectionLocale])

  // Indicateurs clés
  const indicators = useMemo(() => {
    if (!result) return null
    const atteint = result.capitalFinal >= form.objectif
    const ecart = form.objectif - result.capitalFinal
    const partInterets = (result.interetsGeneres / result.capitalFinal) * 100
    const multiplicateur = result.capitalFinal / result.totalVerse
    
    // Calcul effet intérêts composés vs simple
    const interetsSimples = form.capitalInitial * (form.rendementAnnuel / 100) * form.dureeAnnees + 
      form.versementMensuel * 12 * form.dureeAnnees * (form.rendementAnnuel / 100) * (form.dureeAnnees / 2)
    const gainComposes = result.interetsGeneres - interetsSimples
    
    return { atteint, ecart, partInterets, multiplicateur, interetsSimples: Math.round(interetsSimples), gainComposes: Math.round(gainComposes) }
  }, [result, form])

  // Comparaison de scénarios prédéfinis
  const scenarios = useMemo(() => {
    if (!result) return null
    const base = result
    const prudent = calculerProjectionLocale(form.capitalInitial, form.versementMensuel, form.dureeAnnees, 2)
    const equilibre = calculerProjectionLocale(form.capitalInitial, form.versementMensuel, form.dureeAnnees, 4)
    const dynamique = calculerProjectionLocale(form.capitalInitial, form.versementMensuel, form.dureeAnnees, 6)
    const agressif = calculerProjectionLocale(form.capitalInitial, form.versementMensuel, form.dureeAnnees, 8)
    
    return [
      { nom: 'Prudent (2%)', ...prudent, rendement: 2 },
      { nom: 'Équilibré (4%)', ...equilibre, rendement: 4 },
      { nom: 'Dynamique (6%)', ...dynamique, rendement: 6 },
      { nom: 'Agressif (8%)', ...agressif, rendement: 8 },
    ]
  }, [result, form, calculerProjectionLocale])

  // Graphiques Plotly
  const renderCharts = useCallback(() => {
    if (!result || !chartRef.current) return
    const P = (window as any).Plotly
    if (!P) return
    
    // Graphique évolution capital
    const years = result.evolutionAnnuelle.map(p => `An ${p.annee}`)
    const capitals = result.evolutionAnnuelle.map(p => p.capital)
    const versements = result.evolutionAnnuelle.map(p => p.versementsCumules)
    const interets = result.evolutionAnnuelle.map(p => p.interetsCumules)
    
    P.react(chartRef.current, [
      { x: years, y: versements, type: 'scatter', mode: 'lines', name: 'Versements cumulés', line: { color: '#64748b', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(100,116,139,0.1)' },
      { x: years, y: capitals, type: 'scatter', mode: 'lines', name: 'Capital total', line: { color: '#1e40af', width: 3 }, fill: 'tonexty', fillcolor: 'rgba(30,64,175,0.15)' },
    ], {
      margin: { l: 50, r: 20, t: 30, b: 40 },
      height: 250,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: { gridcolor: '#e2e8f0', tickfont: { size: 10 } },
      yaxis: { gridcolor: '#e2e8f0', tickfont: { size: 10 }, tickformat: ',.0f' },
      legend: { orientation: 'h', y: 1.1, font: { size: 10 } },
      hovermode: 'x unified',
    }, { responsive: true, displayModeBar: false })

    // Graphique répartition (donut)
    if (pieRef.current) {
      P.react(pieRef.current, [{
        values: [result.totalVerse, result.interetsGeneres],
        labels: ['Versements', 'Intérêts'],
        type: 'pie',
        hole: 0.6,
        marker: { colors: ['#64748b', '#10b981'], line: { color: '#fff', width: 2 } },
        textinfo: 'percent',
        textfont: { size: 11 },
      }], {
        margin: { l: 10, r: 10, t: 20, b: 20 },
        height: 180,
        paper_bgcolor: 'transparent',
        showlegend: true,
        legend: { orientation: 'h', y: -0.1, font: { size: 10 } },
        annotations: [{ text: `<b>${eur(result.capitalFinal)} €</b>`, showarrow: false, font: { size: 14, color: '#0f172a' } }],
      }, { responsive: true, displayModeBar: false })
    }
  }, [result, eur])

  useEffect(() => {
    if (result) {
      const c = setInterval(() => {
        if ((window as any).Plotly) { clearInterval(c); renderCharts() }
      }, 100)
      return () => clearInterval(c)
    }
  }, [result, renderCharts])

  const html = (s: string) => ({ __html: s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') })

  return (
    <SimulatorGate simulator="EPARGNE" showTeaser>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" />
      
      <main className="pw">
        <div className="ph">
          <Link href="/dashboard/simulateurs" style={{ fontSize: '11px', color: '#64748b' }}>← Retour aux simulateurs</Link>
          <h1>📈 Simulateur Épargne Flexible</h1>
          <p>Projetez la croissance du capital et visualisez l'effet des intérêts composés</p>
        </div>

        {/* Sélection du type de calcul - PROMINENT */}
        <div className="card card-p">
          <h2 className="card-t">🎯 Choisissez votre type de simulation</h2>
          <div className="narr mb">
            <div className="narr-x">Sélectionnez le calcul adapté à votre besoin. Chaque type grisera automatiquement les champs non pertinents.</div>
          </div>
          <div className="g4">
            <div 
              className={`gc ${calculType === 'capital_final' ? 'gc-sel' : ''}`} 
              onClick={() => setCalculType('capital_final')}
              style={{ cursor: 'pointer', border: calculType === 'capital_final' ? '2px solid var(--pri)' : '1px solid var(--brd)', background: calculType === 'capital_final' ? 'rgba(30,64,175,0.05)' : 'var(--bg)' }}
            >
              <div className="gc-t" style={{ color: calculType === 'capital_final' ? 'var(--pri)' : 'var(--txt)' }}>📈 Capital final</div>
              <div className="mu">Quel capital dans X ans ?</div>
            </div>
            <div 
              className={`gc ${calculType === 'versement_initial' ? 'gc-sel' : ''}`}
              onClick={() => setCalculType('versement_initial')}
              style={{ cursor: 'pointer', border: calculType === 'versement_initial' ? '2px solid var(--pri)' : '1px solid var(--brd)', background: calculType === 'versement_initial' ? 'rgba(30,64,175,0.05)' : 'var(--bg)' }}
            >
              <div className="gc-t" style={{ color: calculType === 'versement_initial' ? 'var(--pri)' : 'var(--txt)' }}>💰 Versement initial</div>
              <div className="mu">Combien placer au départ ?</div>
            </div>
            <div 
              className={`gc ${calculType === 'duree_necessaire' ? 'gc-sel' : ''}`}
              onClick={() => setCalculType('duree_necessaire')}
              style={{ cursor: 'pointer', border: calculType === 'duree_necessaire' ? '2px solid var(--pri)' : '1px solid var(--brd)', background: calculType === 'duree_necessaire' ? 'rgba(30,64,175,0.05)' : 'var(--bg)' }}
            >
              <div className="gc-t" style={{ color: calculType === 'duree_necessaire' ? 'var(--pri)' : 'var(--txt)' }}>⏱️ Durée nécessaire</div>
              <div className="mu">Combien de temps faut-il ?</div>
            </div>
            <div 
              className={`gc ${calculType === 'comparer_scenarios' ? 'gc-sel' : ''}`}
              onClick={() => setCalculType('comparer_scenarios')}
              style={{ cursor: 'pointer', border: calculType === 'comparer_scenarios' ? '2px solid var(--pri)' : '1px solid var(--brd)', background: calculType === 'comparer_scenarios' ? 'rgba(30,64,175,0.05)' : 'var(--bg)' }}
            >
              <div className="gc-t" style={{ color: calculType === 'comparer_scenarios' ? 'var(--pri)' : 'var(--txt)' }}>⚖️ Comparer 3 scénarios</div>
              <div className="mu">Quel scénario est le meilleur ?</div>
            </div>
          </div>
          <div className={calculType === 'capital_final' ? 'tbox mt' : calculType === 'versement_initial' ? 'ibox mt' : calculType === 'duree_necessaire' ? 'wbox mt' : 'narr mt'}>
            {calculType === 'capital_final' && <><strong>📈 Capital final :</strong> Calcule le montant que vous atteindrez avec un capital initial, des versements mensuels, une durée et un rendement.</>}
            {calculType === 'versement_initial' && <><strong>💰 Versement initial :</strong> Calcule le montant à placer au départ pour atteindre votre objectif. <em>Le champ "Capital initial" sera ignoré (calculé).</em></>}
            {calculType === 'duree_necessaire' && <><strong>⏱️ Durée nécessaire :</strong> Calcule le temps nécessaire pour atteindre votre objectif. <em>Le champ "Durée" sera ignoré (calculé).</em></>}
            {calculType === 'comparer_scenarios' && <><strong>⚖️ Comparaison :</strong> Comparez 3 scénarios côte à côte pour identifier le plus performant.</>}
          </div>
        </div>

        {/* Formulaire */}
        <div className="card">
          <form onSubmit={simulate}>
            {calculType !== 'comparer_scenarios' ? (
              <div className="sec">
                <h3 className="sec-t">💰 Paramètres de l'épargne</h3>
                <div className="fg">
                  <div className="fgrp" style={{ opacity: calculType === 'versement_initial' ? 0.4 : 1 }}>
                    <label className="flbl">Capital initial {calculType !== 'versement_initial' && <span className="r">*</span>}{calculType === 'versement_initial' && <span className="bdg bdg-w" style={{ marginLeft: '.3rem' }}>Calculé</span>}</label>
                    <div className="iw"><input type="number" name="capitalInitial" className="finp" min="0" step="1000" value={form.capitalInitial} onChange={onChange} disabled={calculType === 'versement_initial'} style={{ background: calculType === 'versement_initial' ? '#f1f5f9' : '' }} /><span className="sfx">€</span></div>
                    <span className="fh">{calculType === 'versement_initial' ? 'Sera calculé automatiquement' : 'Somme placée au départ'}</span>
                  </div>
                  <div className="fgrp">
                    <label className="flbl">Versement mensuel <span className="r">*</span></label>
                    <div className="iw"><input type="number" name="versementMensuel" className="finp" min="0" step="50" value={form.versementMensuel} onChange={onChange} /><span className="sfx">€/mois</span></div>
                    <span className="fh">Effort d'épargne régulier</span>
                  </div>
                  <div className="fgrp" style={{ opacity: calculType === 'duree_necessaire' ? 0.4 : 1 }}>
                    <label className="flbl">Durée {calculType !== 'duree_necessaire' && <span className="r">*</span>}{calculType === 'duree_necessaire' && <span className="bdg bdg-w" style={{ marginLeft: '.3rem' }}>Calculé</span>}</label>
                    <div className="iw"><input type="number" name="dureeAnnees" className="finp" min="1" max="40" value={form.dureeAnnees} onChange={onChange} disabled={calculType === 'duree_necessaire'} style={{ background: calculType === 'duree_necessaire' ? '#f1f5f9' : '' }} /><span className="sfx">ans</span></div>
                    <span className="fh">{calculType === 'duree_necessaire' ? 'Sera calculé automatiquement' : 'Horizon de placement'}</span>
                  </div>
                  <div className="fgrp">
                    <label className="flbl">Rendement annuel estimé <span className="r">*</span></label>
                    <div className="iw"><input type="number" name="rendementAnnuel" className="finp" min="0" max="15" step="0.5" value={form.rendementAnnuel} onChange={onChange} /><span className="sfx">%</span></div>
                    <span className="fh">2% prudent • 4% équilibré • 6%+ dynamique</span>
                  </div>
                  <div className="fgrp" style={{ opacity: (calculType === 'versement_initial' || calculType === 'duree_necessaire') ? 1 : 0.7 }}>
                    <label className="flbl">Objectif à atteindre {(calculType === 'versement_initial' || calculType === 'duree_necessaire') && <span className="r">*</span>}</label>
                    <div className="iw"><input type="number" name="objectif" className="finp" min="0" step="10000" value={form.objectif} onChange={onChange} /><span className="sfx">€</span></div>
                    <span className="fh">{(calculType === 'versement_initial' || calculType === 'duree_necessaire') ? 'Montant cible à atteindre (requis)' : 'Optionnel : vérifier si l\'objectif est atteint'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sec">
                <h3 className="sec-t">⚖️ Configuration des 3 scénarios à comparer</h3>
                <div className="narr mb">
                  <div className="narr-x">Personnalisez chaque scénario pour comparer différentes stratégies d'épargne. Le backend identifiera automatiquement le meilleur.</div>
                </div>
                {scenariosInput.map((s, i) => (
                  <div key={i} className="gc mb" style={{ background: i === 0 ? '#fef3c7' : i === 1 ? '#e0f2fe' : '#ecfdf5' }}>
                    <div className="fgrp mb">
                      <label className="flbl">Nom du scénario {i + 1}</label>
                      <input type="text" className="finp" value={s.nom} onChange={e => updateScenario(i, 'nom', e.target.value)} />
                    </div>
                    <div className="g4">
                      <div className="fgrp">
                        <label className="flbl">Capital initial</label>
                        <div className="iw"><input type="number" className="finp" min="0" step="1000" value={s.versementInitial} onChange={e => updateScenario(i, 'versementInitial', e.target.value)} /><span className="sfx">€</span></div>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Mensuel</label>
                        <div className="iw"><input type="number" className="finp" min="0" step="50" value={s.versementMensuel} onChange={e => updateScenario(i, 'versementMensuel', e.target.value)} /><span className="sfx">€</span></div>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Durée</label>
                        <div className="iw"><input type="number" className="finp" min="1" max="40" value={s.dureeAnnees} onChange={e => updateScenario(i, 'dureeAnnees', e.target.value)} /><span className="sfx">ans</span></div>
                      </div>
                      <div className="fgrp">
                        <label className="flbl">Rendement</label>
                        <div className="iw"><input type="number" className="finp" min="0" max="15" step="0.5" value={s.tauxAnnuelNet} onChange={e => updateScenario(i, 'tauxAnnuelNet', e.target.value)} /><span className="sfx">%</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="tc">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? '⏳ Calcul en cours...' : 
                 calculType === 'capital_final' ? '📈 Calculer le capital final' :
                 calculType === 'versement_initial' ? '💰 Calculer le versement initial' :
                 calculType === 'duree_necessaire' ? '⏱️ Calculer la durée' :
                 '⚖️ Comparer les 3 scénarios'}
              </button>
            </div>
            {error && <div className="abox mt">❌ {error}</div>}
          </form>
        </div>

        {/* RÉSULTATS */}
        <div ref={resultRef}>
          {/* Résultat Versement Initial */}
          {viResult && (
            <div className="fi">
              <div className="card card-p">
                <h2 className="card-t">💰 Résultat : Versement Initial Nécessaire</h2>
                <div className={viResult.objectifAtteintSansVI ? 'tbox' : 'ibox'}>
                  <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{viResult.message}</p>
                </div>
                {!viResult.objectifAtteintSansVI && viResult.versementInitialNecessaire && (
                  <div className="g3 mt">
                    <div className="kpi">
                      <div className="kpi-v">{eur(viResult.versementInitialNecessaire)} €</div>
                      <div className="kpi-l">Versement initial requis</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-v">{eur(viResult.capitalObjectif || 0)} €</div>
                      <div className="kpi-l">Objectif visé</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-v">{viResult.dureeAnnees} ans</div>
                      <div className="kpi-l">Durée du placement</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Recommandations */}
              {recommandations.length > 0 && (
                <div className="card">
                  <h2 className="card-t">💡 Recommandations</h2>
                  {recommandations.map((r, i) => (
                    <div key={i} className={r.priorite === 'haute' ? 'abox' : r.priorite === 'moyenne' ? 'wbox' : 'ibox'}>
                      <strong>{r.priorite === 'haute' ? '🔴' : r.priorite === 'moyenne' ? '🟡' : '🟢'} {r.type.toUpperCase()}</strong> : {r.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Résultat Durée Nécessaire */}
          {dureeResult && (
            <div className="fi">
              <div className="card card-p">
                <h2 className="card-t">⏱️ Résultat : Durée Nécessaire</h2>
                {dureeResult.error ? (
                  <div className="abox">{dureeResult.error}</div>
                ) : dureeResult.message ? (
                  <div className={dureeResult.objectifDejaAtteint ? 'tbox' : 'ibox'}>
                    <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{dureeResult.message}</p>
                  </div>
                ) : null}
                {!dureeResult.objectifDejaAtteint && dureeResult.dureeNecessaire && (
                  <div className="g4 mt">
                    <div className="kpi">
                      <div className="kpi-v">{dureeResult.dureeNecessaire} ans</div>
                      <div className="kpi-l">Durée nécessaire</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-v">{dureeResult.moisNecessaires} mois</div>
                      <div className="kpi-l">En mois</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-v">{eur(dureeResult.capitalObjectif || 0)} €</div>
                      <div className="kpi-l">Objectif visé</div>
                    </div>
                    <div className="kpi">
                      <div className="kpi-v vs">{eur(dureeResult.capitalFinalAtteint || 0)} €</div>
                      <div className="kpi-l">Capital atteint</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Recommandations */}
              {recommandations.length > 0 && (
                <div className="card">
                  <h2 className="card-t">💡 Recommandations</h2>
                  {recommandations.map((r, i) => (
                    <div key={i} className={r.priorite === 'haute' ? 'abox' : r.priorite === 'moyenne' ? 'wbox' : 'ibox'}>
                      <strong>{r.priorite === 'haute' ? '🔴' : r.priorite === 'moyenne' ? '🟡' : '🟢'} {r.type.toUpperCase()}</strong> : {r.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Résultat Comparaison de Scénarios */}
          {scenariosResult && scenariosResult.scenarios && (
            <div className="fi">
              <div className="card card-p">
                <h2 className="card-t">⚖️ Résultat : Comparaison des 3 Scénarios</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>Comment lire ce tableau ?</strong> Chaque ligne représente un scénario avec ses paramètres et résultats. Le meilleur scénario est mis en évidence.</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Scénario</th>
                      <th>Capital final</th>
                      <th>Total versé</th>
                      <th>Intérêts</th>
                      <th>Rendement global</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenariosResult.scenarios.map((s: any, i: number) => (
                      <tr key={i} style={{ background: s.estMeilleur ? '#ecfdf5' : '' }}>
                        <td><strong>{s.nomScenario}</strong></td>
                        <td className="v">{eur(s.capitalFinal)} €</td>
                        <td>{eur(s.totalVerse)} €</td>
                        <td className="vs">{eur(s.interetsGeneres)} €</td>
                        <td>{s.tauxRendementGlobal}%</td>
                        <td>
                          {s.estMeilleur ? (
                            <span className="bdg bdg-s">🏆 Meilleur</span>
                          ) : (
                            <span className="bdg bdg-w">{eur(s.ecartAvecMeilleur)} €</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scenariosResult.meilleurScenario && (
                  <div className="tbox mt">
                    <strong>🏆 Conclusion :</strong> Le scénario <strong>"{scenariosResult.meilleurScenario}"</strong> est le plus performant avec le capital final le plus élevé.
                  </div>
                )}
              </div>

              {/* Narration pédagogique */}
              <div className="card">
                <h2 className="card-t">📝 Analyse comparative</h2>
                <div className="narr">
                  <div className="narr-x">
                    <strong>Ce qu'il faut retenir :</strong> La comparaison montre que le choix du rendement et du montant des versements impacte significativement le capital final. 
                    Un rendement plus élevé multiplie les gains sur le long terme grâce aux intérêts composés, mais implique généralement un risque plus important.
                  </div>
                </div>
                <div className="ibox mt">
                  <strong>💡 Conseil :</strong> Présentez ces 3 scénarios au client pour illustrer l'impact de chaque paramètre. Cela aide à choisir le profil de risque adapté à son horizon et sa tolérance.
                </div>
              </div>
            </div>
          )}

          {/* Résultat Capital Final */}
          {result && indicators && (
            <div className="fi">
              {/* Synthèse narrative */}
              <div className="card card-p">
                <h2 className="card-t">📋 Synthèse de la projection</h2>
                <div className="narr">
                  <div className="narr-x">
                    Avec un capital initial de **{eur(form.capitalInitial)} €**, des versements de **{eur(form.versementMensuel)} €/mois** pendant **{form.dureeAnnees} ans** à **{form.rendementAnnuel}%** de rendement annuel, le capital atteindrait **{eur(result.capitalFinal)} €**.
                  </div>
                  <div className="narr-x mt">
                    Sur cette somme, **{eur(result.totalVerse)} €** proviennent de vos versements et **{eur(result.interetsGeneres)} €** des intérêts générés ({pct(indicators.partInterets)} du total).
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="card">
                <h2 className="card-t">🎯 Indicateurs clés</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>Que signifient ces chiffres ?</strong> Ils résument la performance de l'épargne et permettent de comparer différentes stratégies.</div>
                </div>
                <div className="g4">
                  <div className="kpi">
                    <div className="kpi-v">{eur(result.capitalFinal)} €</div>
                    <div className="kpi-l">Capital final</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-v vs">{eur(result.interetsGeneres)} €</div>
                    <div className="kpi-l">Intérêts gagnés</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-v">{pct(indicators.partInterets)}</div>
                    <div className="kpi-l">Part des intérêts</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-v">×{indicators.multiplicateur.toFixed(2)}</div>
                    <div className="kpi-l">Multiplicateur</div>
                  </div>
                </div>
                <div className="ibox mt">
                  <strong>💡 Lecture :</strong> Le multiplicateur indique combien vaut le capital final par rapport aux versements. ×{indicators.multiplicateur.toFixed(2)} signifie que chaque euro versé "vaut" {indicators.multiplicateur.toFixed(2)} € à l'arrivée.
                </div>
              </div>

              {/* Objectif */}
              <div className="card" style={{ background: indicators.atteint ? '#ecfdf5' : '#fef3c7', borderColor: indicators.atteint ? '#10b981' : '#f59e0b' }}>
                <h2 className="card-t" style={{ color: indicators.atteint ? '#065f46' : '#92400e' }}>
                  {indicators.atteint ? '✅' : '⚠️'} Objectif : {eur(form.objectif)} €
                </h2>
                <div className="prog"><div className="prog-f" style={{ width: `${Math.min(100, (result.capitalFinal / form.objectif) * 100)}%`, background: indicators.atteint ? '#10b981' : '#f59e0b' }} /></div>
                <p style={{ fontSize: '12px', marginTop: '.5rem' }}>
                  {indicators.atteint 
                    ? `L'objectif est atteint avec une marge de **${eur(Math.abs(indicators.ecart))} €** (${pct((result.capitalFinal / form.objectif - 1) * 100)} au-dessus).`
                    : `Il manque **${eur(Math.abs(indicators.ecart))} €** pour atteindre l'objectif. Options : augmenter les versements, allonger la durée ou viser un meilleur rendement.`
                  }
                </p>
              </div>

              {/* Effet intérêts composés */}
              <div className="card">
                <h2 className="card-t">🧮 L'effet des intérêts composés</h2>
                <div className="narr mb">
                  <div className="narr-x">
                    <strong>Pourquoi c'est important ?</strong> Les intérêts composés font que vos intérêts génèrent eux-mêmes des intérêts. Plus la durée est longue, plus cet effet est puissant. C'est ce qu'Einstein appelait "la 8ème merveille du monde".
                  </div>
                </div>
                <div className="g2">
                  <div className="gc">
                    <div className="gc-t">📊 Intérêts simples (théoriques)</div>
                    <div className="gc-a">{eur(indicators.interetsSimples)} €</div>
                    <div className="mu">Sans réinvestissement des gains</div>
                  </div>
                  <div className="gc">
                    <div className="gc-t">📈 Intérêts composés (réels)</div>
                    <div className="gc-a vs">{eur(result.interetsGeneres)} €</div>
                    <div className="mu">Avec réinvestissement automatique</div>
                  </div>
                </div>
                <div className="tbox mt">
                  <strong>Gain supplémentaire grâce aux intérêts composés :</strong> +{eur(indicators.gainComposes)} € — soit {pct((indicators.gainComposes / indicators.interetsSimples) * 100)} de plus qu'avec des intérêts simples.
                </div>
              </div>

              {/* Graphique évolution */}
              <div className="card">
                <h2 className="card-t">📊 Évolution du capital sur {form.dureeAnnees} ans</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>Comment lire ce graphique ?</strong> La zone grise représente vos versements cumulés. La zone bleue au-dessus représente les intérêts. Plus l'écart grandit, plus les intérêts composés font leur effet.</div>
                </div>
                <div ref={chartRef} className="chbox" />
              </div>

              {/* Répartition */}
              <div className="card">
                <h2 className="card-t">🍩 Répartition du capital final</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>D'où vient l'argent ?</strong> Ce graphique montre la part de vos versements (effort d'épargne) vs la part générée par les intérêts (travail de l'argent).</div>
                </div>
                <div className="g2">
                  <div ref={pieRef} style={{ minHeight: '180px' }} />
                  <div>
                    <div className="ibox"><strong>Versements :</strong> {eur(result.totalVerse)} € ({pct(100 - indicators.partInterets)})</div>
                    <div className="tbox"><strong>Intérêts :</strong> {eur(result.interetsGeneres)} € ({pct(indicators.partInterets)})</div>
                    <div className="mu mt">Plus la part verte est grande, plus votre argent "travaille" pour vous.</div>
                  </div>
                </div>
              </div>

              {/* Simulateur interactif */}
              <div className="card">
                <h2 className="card-t">🎛️ Simulateur de scénarios — testez l'impact</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>À quoi sert cette section ?</strong> Jouez avec les curseurs pour voir comment le rendement et la durée impactent le capital final. C'est pédagogique pour montrer au client l'importance du temps et du choix de placement.</div>
                </div>
                <div className="g2">
                  <div>
                    <div className="fgrp mb">
                      <label className="flbl">📈 Rendement : {scenarioRendement}%</label>
                      <div className="slw"><input type="range" min={1} max={10} step={0.5} value={scenarioRendement} onChange={e => setScenarioRendement(Number(e.target.value))} /></div>
                      <span className="fh">De prudent (1-2%) à agressif (8-10%)</span>
                    </div>
                    <div className="fgrp">
                      <label className="flbl">⏱️ Durée : {scenarioDuree} ans</label>
                      <div className="slw"><input type="range" min={5} max={40} step={1} value={scenarioDuree} onChange={e => setScenarioDuree(Number(e.target.value))} /></div>
                      <span className="fh">L'horizon de placement</span>
                    </div>
                  </div>
                  <div className="gc" style={{ background: '#f0fdf4' }}>
                    <div className="gc-t">Capital final estimé</div>
                    <div className="gc-a vs">{eur(scenarioResult?.capitalFinal || 0)} €</div>
                    <div className="mu mt">
                      Versements : {eur(scenarioResult?.totalVerse || 0)} € • Intérêts : {eur(scenarioResult?.interetsGeneres || 0)} €
                    </div>
                    <div className="mt" style={{ fontSize: '11px' }}>
                      {scenarioResult && result && (
                        scenarioResult.capitalFinal > result.capitalFinal
                          ? <span className="vs">+{eur(scenarioResult.capitalFinal - result.capitalFinal)} € vs simulation initiale</span>
                          : scenarioResult.capitalFinal < result.capitalFinal
                          ? <span className="ve">{eur(scenarioResult.capitalFinal - result.capitalFinal)} € vs simulation initiale</span>
                          : <span>= simulation initiale</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparaison profils */}
              {scenarios && (
                <div className="card">
                  <h2 className="card-t">🎯 Comparaison des profils de risque</h2>
                  <div className="narr mb">
                    <div className="narr-x"><strong>Quel profil choisir ?</strong> Ce tableau compare les résultats selon le niveau de risque accepté. Un profil dynamique offre plus de rendement mais avec plus de volatilité. À présenter au client pour expliquer l'arbitrage risque/rendement.</div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Profil</th>
                        <th>Rendement</th>
                        <th>Capital final</th>
                        <th>Intérêts</th>
                        <th>vs Objectif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarios.map(s => (
                        <tr key={s.nom}>
                          <td><strong>{s.nom}</strong></td>
                          <td>{s.rendement}%</td>
                          <td className="v">{eur(s.capitalFinal)} €</td>
                          <td className="vs">{eur(s.interetsGeneres)} €</td>
                          <td>
                            {s.capitalFinal >= form.objectif 
                              ? <span className="bdg bdg-s">✅ Atteint</span>
                              : <span className="bdg bdg-w">-{eur(form.objectif - s.capitalFinal)} €</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="ibox mt">
                    <strong>💡 Conseil :</strong> Le choix du profil dépend de l'horizon (plus il est long, plus on peut prendre de risque) et de la tolérance du client aux fluctuations de marché.
                  </div>
                </div>
              )}

              {/* Tableau détaillé */}
              <div className="card">
                <h2 className="card-t">📋 Projection année par année</h2>
                <div className="narr mb">
                  <div className="narr-x"><strong>À quoi sert ce tableau ?</strong> Il montre l'évolution précise du capital. On voit comment les intérêts s'accélèrent au fil du temps (effet "boule de neige").</div>
                </div>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table>
                    <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9' }}>
                      <tr>
                        <th>Année</th>
                        <th>Capital</th>
                        <th>Versements cumulés</th>
                        <th>Intérêts cumulés</th>
                        <th>% intérêts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.evolutionAnnuelle.map((row) => (
                        <tr key={row.annee}>
                          <td>An {row.annee}</td>
                          <td className="v">{eur(row.capital)} €</td>
                          <td>{eur(row.versementsCumules)} €</td>
                          <td className="vs">{eur(row.interetsCumules)} €</td>
                          <td><span className="bdg bdg-s">{pct((row.interetsCumules / row.capital) * 100)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommandations du backend */}
              {recommandations.length > 0 && (
                <div className="card">
                  <h2 className="card-t">💡 Recommandations personnalisées</h2>
                  <div className="narr mb">
                    <div className="narr-x"><strong>Ces recommandations sont générées automatiquement</strong> par le backend en fonction des parametres et résultats de la simulation.</div>
                  </div>
                  {recommandations.map((r, i) => (
                    <div key={i} className={r.priorite === 'haute' ? 'abox' : r.priorite === 'moyenne' ? 'wbox' : 'tbox'}>
                      <strong>{r.priorite === 'haute' ? '🔴 Priorité haute' : r.priorite === 'moyenne' ? '🟡 Priorité moyenne' : '🟢 Info'}</strong> — {r.description}
                    </div>
                  ))}
                </div>
              )}

              {/* Comparaison profils du backend */}
              {comparaisonProfils.length > 0 && (
                <div className="card">
                  <h2 className="card-t">📊 Comparaison par profil de risque (backend)</h2>
                  <div className="narr mb">
                    <div className="narr-x"><strong>Données calculées par le backend</strong> : cette comparaison montre les résultats pour différents profils de risque avec les mêmes paramètres d'épargne.</div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Profil</th>
                        <th>Rendement</th>
                        <th>Description</th>
                        <th>Capital final</th>
                        <th>Intérêts</th>
                        <th>Objectif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparaisonProfils.map(p => (
                        <tr key={p.nom}>
                          <td><strong>{p.nom}</strong></td>
                          <td>{p.rendement}%</td>
                          <td className="mu">{p.description}</td>
                          <td className="v">{eur(p.capitalFinal || 0)} €</td>
                          <td className="vs">{eur(p.interetsGeneres || 0)} €</td>
                          <td>
                            {p.objectifAtteint === true ? <span className="bdg bdg-s">✅ Atteint</span> :
                             p.objectifAtteint === false ? <span className="bdg bdg-w">❌ Non atteint</span> :
                             <span className="mu">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Glossaire */}
              <div className="card">
                <h2 className="card-t">📚 Glossaire & concepts</h2>
                <details>
                  <summary>💰 Intérêts composés</summary>
                  <div className="dc">Les intérêts générés sont réinvestis et produisent eux-mêmes des intérêts. Formule : Capital × (1 + taux)^durée. Plus la durée est longue, plus l'effet est puissant.</div>
                </details>
                <details>
                  <summary>📈 Rendement annuel</summary>
                  <div className="dc">Performance moyenne attendue par an. Fonds euros ~2%, actions ~5-7% sur le long terme. Attention : le rendement n'est pas garanti pour les UC.</div>
                </details>
                <details>
                  <summary>⏱️ Horizon de placement</summary>
                  <div className="dc">Durée pendant laquelle l'argent reste investi. Plus l'horizon est long, plus on peut prendre de risque (lissage des cycles de marché).</div>
                </details>
                <details>
                  <summary>🎯 Profil de risque</summary>
                  <div className="dc">Prudent : 0-3%, Équilibré : 3-5%, Dynamique : 5-7%, Agressif : 7%+. Le choix dépend de l'horizon et de la tolérance aux pertes temporaires.</div>
                </details>
              </div>

              {/* Conclusion pédagogique */}
              <div className="card card-p">
                <h2 className="card-t">📝 En résumé pour ce client</h2>
                <div className="narr">
                  <div className="narr-x">
                    <strong>Ce qu'il faut retenir :</strong> Avec cette stratégie d'épargne, le client peut espérer **{eur(result.capitalFinal)} €** dans {form.dureeAnnees} ans.
                    {indicators.partInterets > 30 && ` Les intérêts représentent ${pct(indicators.partInterets)} du capital final — l'effet des intérêts composés est significatif.`}
                    {!indicators.atteint && ` L'objectif de ${eur(form.objectif)} € n'est pas atteint avec ces paramètres.`}
                  </div>
                </div>
                <div className="tbox mt">
                  <strong>💡 Points de discussion avec le client :</strong>
                  <ul style={{ marginTop: '.3rem', paddingLeft: '1rem' }}>
                    {!indicators.atteint && <li>Augmenter les versements de {eur(Math.ceil((form.objectif - result.capitalFinal) / (form.dureeAnnees * 12)))} €/mois permettrait d'atteindre l'objectif</li>}
                    {form.dureeAnnees < 15 && <li>Allonger la durée amplifierait considérablement l'effet des intérêts composés</li>}
                    {form.rendementAnnuel < 4 && <li>Un profil légèrement plus dynamique pourrait améliorer le résultat sans risque excessif sur cet horizon</li>}
                    <li>Les simulations interactives ci-dessus permettent de visualiser différentes options</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </SimulatorGate>
  )
}
