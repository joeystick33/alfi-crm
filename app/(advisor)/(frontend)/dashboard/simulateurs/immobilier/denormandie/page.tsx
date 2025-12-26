'use client'
 

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import { 
  DISPOSITIFS_FISCAUX_DISPLAY as DISPOSITIFS_FISCAUX, 
  calculIRDetaille, 
  calculNombreParts, 
  calculIFI 
} from '../_utils/display-helpers'

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
const fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type ZoneDenormandie = 'A_BIS' | 'A' | 'B1' | 'B2'
type DureeEngagement = 6 | 9 | 12
type TypeTravaux = 'RENOVATION_GLOBALE' | 'AMELIORATION_PERFORMANCE' | 'CREATION_SURFACE' | 'MODERNISATION'

// Communes éligibles Denormandie (exemples)
const COMMUNES_ELIGIBLES = [
  'Action Coeur de Ville', 'ORT (Opération de Revitalisation du Territoire)',
  'Communes avec besoin de réhabilitation de l\'habitat'
]

// Types de travaux éligibles Denormandie
const TRAVAUX_ELIGIBLES = {
  RENOVATION_GLOBALE: { label: 'Rénovation globale (gain 20-30% conso)', eligible: true },
  AMELIORATION_PERFORMANCE: { label: 'Amélioration performance énergétique', eligible: true },
  CREATION_SURFACE: { label: 'Création surface habitable (combles...)', eligible: true },
  MODERNISATION: { label: 'Modernisation, assainissement, aménagement', eligible: true },
}

export default function DenormandiePage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  const [showDetailPV, setShowDetailPV] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ÉTAPE 1 : Profil client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(60000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  const [autresReductionsImpot, setAutresReductionsImpot] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(0)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(0)
  const [valeurRP, setValeurRP] = useState(0)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Bien
  const [prixAcquisition, setPrixAcquisition] = useState(120000)
  const [fraisNotaire, setFraisNotaire] = useState(9600)
  const [surface, setSurface] = useState(60)
  const [zone, setZone] = useState<ZoneDenormandie>('B1')
  const [communeEligible, setCommuneEligible] = useState(true)
  
  // Travaux (minimum 25% du coût total)
  const [travauxTotal, setTravauxTotal] = useState(50000)
  const [travauxRenovEnergetique, setTravauxRenovEnergetique] = useState(30000)
  const [travauxCreationSurface, setTravauxCreationSurface] = useState(10000)
  const [travauxModernisation, setTravauxModernisation] = useState(10000)
  const [typeTravaux, setTypeTravaux] = useState<TypeTravaux>('RENOVATION_GLOBALE')
  
  // Engagement
  const [dureeEngagement, setDureeEngagement] = useState<DureeEngagement>(9)
  
  // Financement
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(40000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  
  // Exploitation
  const [loyerMensuel, setLoyerMensuel] = useState(550)
  const [chargesLocataire, setChargesLocataire] = useState(50)
  const [vacanceSemaines, setVacanceSemaines] = useState(3)
  const [taxeFonciere, setTaxeFonciere] = useState(800)
  const [chargesCopro, setChargesCopro] = useState(1000)
  const [assurancePNO, setAssurancePNO] = useState(180)
  const [fraisGestion, setFraisGestion] = useState(7)
  
  // Projection
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(1)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenusTotaux = revenusSalaires + revenusFonciersExistants + autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi
  const ifiAvant = calculIFI({ patrimoineImmobilierBrut: patrimoineImmobilierExistant, dettesDeductibles: dettesImmobilieres, valeurRP })

  // Dates clés
  const [anneeAcq] = dateAcquisition.split('-').map(Number)
  const anneeFinEngagement = anneeAcq + dureeEngagement
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeExonerationIR = anneeAcq + 22
  const anneeExonerationPS = anneeAcq + 30

  // Résultats
  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // Calculs préliminaires
  const P = DISPOSITIFS_FISCAUX.PINEL // Mêmes taux que Pinel
  const D = DISPOSITIFS_FISCAUX.DENORMANDIE
  
  const coutTotal = prixAcquisition + travauxTotal
  const partTravaux = coutTotal > 0 ? (travauxTotal / coutTotal) * 100 : 0
  const travauxEligibles = partTravaux >= DISPOSITIFS_FISCAUX.DENORMANDIE.PART_TRAVAUX_MIN
  const prixPlafonne = Math.min(coutTotal, DISPOSITIFS_FISCAUX.DENORMANDIE.PLAFOND_INVESTISSEMENT, surface * DISPOSITIFS_FISCAUX.DENORMANDIE.PLAFOND_PAR_M2)
  const tauxReduction = DISPOSITIFS_FISCAUX.DENORMANDIE.TAUX_REDUCTION[dureeEngagement as keyof typeof DISPOSITIFS_FISCAUX.DENORMANDIE.TAUX_REDUCTION]
  const reductionTotale = travauxEligibles ? prixPlafonne * tauxReduction / 100 : 0
  const reductionAnnuelle = reductionTotale / dureeEngagement
  
  // Plafonds loyer selon zone
  const plafondLoyerM2 = P.PLAFONDS_LOYER_M2[zone as keyof typeof P.PLAFONDS_LOYER_M2] || P.PLAFONDS_LOYER_M2.B1
  const coefficientSurface = 0.7 + 19 / surface
  const loyerMaxMensuel = Math.round(surface * plafondLoyerM2 * Math.min(coefficientSurface, 1.2))
  
  const investTotal = prixAcquisition + fraisNotaire + travauxTotal
  const montantEmprunte = Math.max(0, investTotal - apport)
  
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensHorsAss = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens
  const assMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualite = mensHorsAss + assMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION DENORMANDIE
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/denormandie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          situationFamiliale,
          enfantsACharge,
          enfantsGardeAlternee,
          parentIsole,
          revenusSalaires,
          revenusFonciersExistants,
          autresRevenus,
          autresReductionsImpot,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          dateAcquisition,
          prixAcquisition,
          fraisNotaire,
          travaux: travauxTotal,
          surface,
          zone,
          dureeEngagement: dureeEngagement.toString(),
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          loyerMensuel,
          chargesLocatives: chargesLocataire,
          vacanceSemaines,
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion,
          revalorisationLoyer,
          revalorisationBien,
          dureeDetention: dureeEngagement + 3,
          fraisRevente,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: any, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        loyerNet: p.loyerNet || 0,
        charges: p.charges || 0,
        interets: p.interets || 0,
        resultatFoncier: p.resultatFoncier || 0,
        impotIR: p.ir || 0,
        ps: p.ps || 0,
        reductionDenormandie: p.reductionDenormandie || 0,
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valBien: p.valeurBien || 0,
        capNet: p.capitalNet || 0,
        enEngagement: p.enEngagement !== false,
      }))

      setSynthese({
        investTotal: result.synthese.investTotal,
        prixAcquisition,
        travauxTotal,
        partTravaux: result.denormandie?.partTravaux ?? 0,
        prixPlafonne: result.denormandie?.prixPlafonne ?? 0,
        tauxReduction: result.denormandie?.tauxReduction ?? 0,
        reductionTotale: result.denormandie?.reductionTotale ?? 0,
        reductionAnnuelle: result.denormandie?.reductionAnnuelle ?? 0,
        dureeEngagement,
        totReduction: result.denormandie?.reductionTotale ?? 0,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule ?? 0,
        rendBrut: result.synthese.rentaBrute,
        tri: result.synthese.tri,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel ?? Math.round(safeNumber(result.synthese.cashFlowCumule) / (dureeEngagement + 3) / 12),
        cfCum: result.synthese.cashFlowCumule,
        valRev: result.plusValue?.valeurRevente ?? 0,
        pvBrute: result.plusValue?.plusValueBrute ?? 0,
        pvCalc: result.plusValue ?? {},
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinEngagement,
        anneeFinCredit,
        profilClient: {
          ifiAvant: result.profilClient?.ifiAvant ?? 0,
          assujettiIFIAvant: result.profilClient?.assujettiIFIAvant ?? false,
          ifiApres: result.profilClient?.ifiApres ?? 0,
          assujettiIFIApres: result.profilClient?.assujettiIFIApres ?? false,
          impactIFI: (result.profilClient?.ifiApres ?? 0) - (result.profilClient?.ifiAvant ?? 0),
        },
      })

      setAlertes(result.alertes || [])
      setExplications([
        `═══ DISPOSITIF DENORMANDIE - SYNTHÈSE ═══`,
        ``,
        `① PART TRAVAUX : ${fmtPct(result.denormandie?.partTravaux || partTravaux)}`,
        `② RÉDUCTION TOTALE : ${fmtEur(result.denormandie?.reductionTotale || 0)}`,
        `③ TRI : ${fmtPct(result.synthese.tri)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Denormandie:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus, autresReductionsImpot,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAcquisition, fraisNotaire, travauxTotal,
    surface, zone, dureeEngagement, apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, chargesLocataire, vacanceSemaines, taxeFonciere, chargesCopro, assurancePNO, fraisGestion,
    revalorisationLoyer, revalorisationBien, fraisRevente,
    anneeAcq, anneeFinEngagement, anneeFinCredit,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const Pl = (window as any).Plotly; if (!Pl) return
    const years = projections.map(p => p.annee)
    const engIdx = projections.findIndex(p => !p.enEngagement) - 1
    const engagementEndYear = engIdx >= 0 ? years[engIdx] : null
    // Graphique 1 : Cash-flow (années réelles)
    if (chartRef1.current) Pl.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.cfApres), type: 'bar', name: 'Cash-flow', marker: { color: projections.map(p => p.enEngagement ? '#10b981' : '#9ca3af') } },
      { x: years, y: projections.map(p => p.reductionDenormandie), type: 'scatter', name: 'Réduction', mode: 'lines+markers', line: { color: '#3b82f6', width: 3 } },
    ], {
      title: 'Cash-flow et réduction Denormandie',
      height: 280,
      margin: { t: 40, b: 40, l: 60, r: 20 },
      paper_bgcolor: 'transparent',
      legend: { orientation: 'h', y: -0.15 },
      xaxis: { title: 'Année', tickangle: -45 },
      shapes: engagementEndYear !== null ? [{
        type: 'line',
        x0: engagementEndYear + 0.5,
        x1: engagementEndYear + 0.5,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: 'red', dash: 'dot' },
      }] : [],
    }, { displayModeBar: false })
    // Graphique 2 : Patrimoine (années réelles)
    if (chartRef2.current) Pl.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur', line: { color: '#3b82f6' } },
      { x: years, y: projections.map(p => p.capRestant), name: 'Dette', line: { color: '#ef4444' }, fill: 'tozeroy' },
      { x: years, y: projections.map(p => p.capNet), name: 'Capital net', line: { color: '#10b981', width: 3 } },
    ], { title: 'Patrimoine', height: 280, margin: { t: 40, b: 40, l: 60, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={handlePlotlyLoad} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🔨</span>
              <div>
                <h1 className="text-2xl font-bold">Simulateur Denormandie</h1>
                <p className="text-gray-600">Ancien avec travaux • Centre-ville • Réduction IR</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`badge ${travauxEligibles ? 'badge-green' : 'badge-red'}`}>Travaux {fmtPct(partTravaux)} {travauxEligibles ? '✓' : '✗'}</span>
              <span className="badge-blue">{tauxReduction}% sur {dureeEngagement} ans</span>
              <span className="badge-blue">Zone {zone}</span>
            </div>
          </div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1">👤 Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">Ces informations permettent de calculer l'impact RÉEL sur votre IR et IFI</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Situation familiale</label><select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}><option value="CELIBATAIRE">Célibataire</option><option value="MARIE_PACSE">Marié / Pacsé</option><option value="VEUF">Veuf</option></select></div>
                  <div className="form-group"><label>Enfants à charge</label><input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Enfants garde alternée</label><input type="number" value={enfantsGardeAlternee} onChange={e=>setEnfantsGardeAlternee(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Parent isolé</label><select value={parentIsole ? 'OUI' : 'NON'} onChange={e=>setParentIsole(e.target.value === 'OUI')}><option value="NON">Non</option><option value="OUI">Oui</option></select></div>
                  <div className="form-group"><label>Revenus salaires (€/an)</label><input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/></div>
                  <div className="form-group"><label>Revenus fonciers existants (€)</label><input type="number" value={revenusFonciersExistants} onChange={e=>setRevenusFonciersExistants(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres revenus (€)</label><input type="number" value={autresRevenus} onChange={e=>setAutresRevenus(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres réductions d'impôt (€)</label><input type="number" value={autresReductionsImpot} onChange={e=>setAutresReductionsImpot(+e.target.value)} min={0}/><span className="form-hint">Pour plafond niches (10 k€)</span></div>
                </div>
                <h3 className="font-semibold text-slate-700 mt-6 mb-3">Patrimoine (pour calcul IFI)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Patrimoine immo existant (€)</label><input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/></div>
                  <div className="form-group"><label>Dettes immobilières (€)</label><input type="number" value={dettesImmobilieres} onChange={e=>setDettesImmobilieres(+e.target.value)}/></div>
                  <div className="form-group"><label>Valeur résidence principale (€)</label><input type="number" value={valeurRP} onChange={e=>setValeurRP(+e.target.value)}/><span className="form-hint">Abattement 30% IFI</span></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{nombreParts}</div></div>
                  <div><span className="text-gray-500">Revenu imposable</span><div className="font-bold text-lg">{fmtEur(revenusTotaux)}</div></div>
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-blue-700"><strong>Pourquoi ces informations ?</strong> Le Denormandie offre une réduction d'IR. Si votre IR est inférieur à la réduction Denormandie, vous ne pourrez pas utiliser tout l'avantage fiscal (non reportable).</p></div>
              </div>}

              {/* ÉTAPE 2 : BIEN ANCIEN */}
              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🏠 Bien ancien</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)}/></div>
                  <div className="form-group"><label>Prix d'acquisition (€)</label><input type="number" value={prixAcquisition} onChange={e=>setPrixAcquisition(+e.target.value)}/></div>
                  <div className="form-group"><label>Surface (m²)</label><input type="number" value={surface} onChange={e=>setSurface(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/><span className="form-hint">~8% dans l'ancien</span></div>
                  <div className="form-group"><label>Zone (mêmes plafonds que Pinel)</label><select value={zone} onChange={e=>setZone(e.target.value as ZoneDenormandie)}>
                    <option value="A_BIS">A bis</option>
                    <option value="A">A</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select><span className="form-hint">Zones B2 possibles via agrément préfectoral.</span></div>
                  <div className="form-group flex items-center gap-2 pt-6"><input type="checkbox" checked={communeEligible} onChange={e=>setCommuneEligible(e.target.checked)} className="w-5 h-5"/><label>Commune Action Cœur de Ville / ORT</label></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2">🏛️ Communes éligibles Denormandie</h4><ul className="text-sm text-blue-700 space-y-1">{COMMUNES_ELIGIBLES.map((c,i) => <li key={i}>• {c}</li>)}</ul></div>
              </div>}

              {/* ÉTAPE 3 : TRAVAUX */}
              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🔧 Travaux (min. 25% du coût total)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Travaux total (€)</label><input type="number" value={travauxTotal} onChange={e=>setTravauxTotal(+e.target.value)}/></div>
                  <div className="form-group"><label>Dont rénovation énergétique (€)</label><input type="number" value={travauxRenovEnergetique} onChange={e=>setTravauxRenovEnergetique(+e.target.value)}/></div>
                  <div className="form-group"><label>Dont création surface (€)</label><input type="number" value={travauxCreationSurface} onChange={e=>setTravauxCreationSurface(+e.target.value)}/></div>
                  <div className="form-group"><label>Dont modernisation (€)</label><input type="number" value={travauxModernisation} onChange={e=>setTravauxModernisation(+e.target.value)}/></div>
                  <div className="form-group"><label>Type principal</label><select value={typeTravaux} onChange={e=>setTypeTravaux(e.target.value as TypeTravaux)}>{Object.entries(TRAVAUX_ELIGIBLES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                </div>
                <div className={`info-box mt-4 ${travauxEligibles ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Coût total</span><div className="font-bold text-lg">{fmtEur(coutTotal)}</div></div>
                  <div><span className="text-gray-500">Part travaux</span><div className={`font-bold text-lg ${travauxEligibles ? 'text-green-600' : 'text-red-600'}`}>{fmtPct(partTravaux)}</div></div>
                  <div><span className="text-gray-500">Minimum requis</span><div className="font-bold text-lg">25%</div></div>
                </div></div>
              </div>}

              {/* ÉTAPE 4 : FINANCEMENT */}
              {step === 4 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">💳 Financement</h2>
                
                {/* Option achat comptant */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={sansFinancement} onChange={(e) => { setSansFinancement(e.target.checked); if (e.target.checked) setApport(investTotal) }} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    <div>
                      <span className="font-semibold text-slate-800">💵 Achat au comptant (sans financement)</span>
                      <p className="text-sm text-slate-500">Cochez cette case si le client ne passe pas par un crédit immobilier</p>
                    </div>
                  </label>
                </div>
                
                {sansFinancement ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <h3 className="font-bold text-emerald-800 text-lg mb-2">Achat au comptant</h3>
                    <p className="text-emerald-700">Investissement total : <strong className="text-xl">{fmtEur(investTotal)}</strong></p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="form-group"><label>Apport (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/></div>
                      <div className="form-group"><label>Taux crédit (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div>
                      <div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)} min={5} max={25}/></div>
                      <div className="form-group"><label>Assurance crédit (%)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.05}/></div>
                    </div>
                    <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-gray-500">Investissement total</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                      <div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                      <div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div>
                    </div>
                  </>
                )}
              </div>}

              {/* ÉTAPE 5 : REVENUS LOCATIFS */}
              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">💰 Revenus locatifs</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Loyer mensuel (€)</label><input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)}/><span className={`form-hint ${loyerMensuel > loyerMaxMensuel ? 'text-red-500' : 'text-green-600'}`}>Max zone {zone}: {fmtEur(loyerMaxMensuel)}</span></div>
                  <div className="form-group"><label>Vacance (semaines/an)</label><input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52}/></div>
                  <div className="form-group"><label>Revalorisation loyer (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Loyer annuel brut</span><div className="font-bold text-lg">{fmtEur(loyerMensuel * 12)}</div></div>
                  <div><span className="text-gray-500">Taux vacance</span><div className="font-bold text-lg">{fmtPct(vacanceSemaines / 52 * 100)}</div></div>
                  <div><span className="text-gray-500">Loyer annuel net</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerMensuel * 12 * (1 - vacanceSemaines / 52)))}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 6 : CHARGES */}
              {step === 6 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1">📋 Charges déductibles</h2>
                <p className="text-sm text-gray-500 mb-6">Charges non récupérables déductibles des revenus fonciers</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/></div>
                  <div className="form-group"><label>Charges copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div>
                  <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais gestion (%)</label><input type="number" value={fraisGestion} onChange={e=>setFraisGestion(+e.target.value)} step={0.5}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Charges totales/an</span><div className="font-bold text-lg">{fmtEur(taxeFonciere + chargesCopro + assurancePNO)}</div></div>
                  <div><span className="text-gray-500">Ratio charges/loyers</span><div className="font-bold text-lg">{fmtPct((taxeFonciere + chargesCopro + assurancePNO) / (loyerMensuel * 12) * 100)}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 7 : PROJECTION */}
              {step === 7 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🏛️ Engagement et Projection</h2>
                <h3 className="font-semibold text-slate-700 mb-3">Durée d'engagement</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {([6, 9, 12] as DureeEngagement[]).map(d => {
                    const tauxCarte = D.TAUX_REDUCTION[d as keyof typeof D.TAUX_REDUCTION]
                    const reducCarte = Math.round(prixPlafonne * tauxCarte / 100)
                    return (
                      <button
                        key={d}
                        onClick={() => setDureeEngagement(d)}
                        className={`p-4 rounded-xl border-2 transition-all ${dureeEngagement === d ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <div className="text-2xl font-bold text-blue-600">{d} ans</div>
                        <div className="text-sm text-gray-500">Réduction {tauxCarte}%</div>
                        <div className="text-lg font-semibold text-green-600 mt-2">{fmtEur(reducCarte)}</div>
                      </button>
                    )
                  })}
                </div>
                <h3 className="font-semibold text-slate-700 mb-3">Projection</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div>
                  <div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div>
                  <div><span className="text-gray-500">Réduction totale</span><div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(reductionTotale))}</div></div>
                  <div><span className="text-gray-500">Réduction/an</span><div className="font-bold text-lg text-emerald-600">{fmtEur(Math.round(reductionAnnuelle))}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2">⚠️ Obligations Denormandie</h4><ul className="text-sm text-blue-700 space-y-1">
                  <li>• Location nue à usage de résidence principale</li>
                  <li>• Respect des plafonds de loyer ({fmtEur(loyerMaxMensuel)}/mois max) et ressources locataires</li>
                  <li>• Location dans les 12 mois suivant l'achèvement des travaux</li>
                  <li>• Conservation du bien pendant toute la durée d'engagement ({dureeEngagement} ans)</li>
                  <li>• Plafond niches fiscales : 10 000 €/an</li>
                </ul></div>
              </div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading || !travauxEligibles || !communeEligible} className="btn-primary disabled:opacity-50">{loading ? '⏳' : '🧮 Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i) => <div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel (hors Denormandie)</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">Sur {fmtEur(revenusTotaux)}/an</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-xs mb-1">Réduction Denormandie/an</div>
                    <div className="font-bold text-lg text-blue-600">{fmtEur(synthese.reductionAnnuelle)}</div>
                    <div className="text-xs text-blue-400">Pendant {dureeEngagement} ans</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs mb-1">Économie IR totale</div>
                    <div className="font-bold text-lg text-emerald-600">{fmtEur(synthese.reductionTotale)}</div>
                    <div className="text-xs text-emerald-400">{fmtPct(synthese.tauxReduction)} du prix plafonné</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">IR + PS sur loyers</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(Math.round((synthese.totIR + synthese.totPS) / (dureeEngagement + 3)))}/an</div>
                    <div className="text-xs text-amber-400">Total : {fmtEur(synthese.totIR + synthese.totPS)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI avant</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.assujettiIFIAvant ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {synthese.profilClient?.assujettiIFIAvant ? fmtEur(synthese.profilClient.ifiAvant) : 'Non assujetti'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI après</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.assujettiIFIApres ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {synthese.profilClient?.assujettiIFIApres ? fmtEur(synthese.profilClient.ifiApres) : 'Non assujetti'}
                    </div>
                    {synthese.profilClient?.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(synthese.profilClient.impactIFI)}/an</div>}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Comprendre la fiscalité Denormandie</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Réduction d'impôt</strong> : Le Denormandie offre une réduction directe d'IR de {fmtEur(synthese.reductionAnnuelle)}/an, soit {fmtPct(synthese.tauxReduction)} du prix plafonné à {fmtEur(synthese.prixPlafonne)}.</p>
                    <p>• <strong>Avantage vs Pinel</strong> : Permet l'ancien avec travaux (min 25%), zones B2/C éligibles, prix d'achat souvent inférieur, potentiel de plus-value travaux.</p>
                    <p>• <strong>Bilan net</strong> : {synthese.reductionAnnuelle > Math.round((synthese.totIR + synthese.totPS) / (dureeEngagement + 3)) ? `La réduction Denormandie (${fmtEur(synthese.reductionAnnuelle)}) couvre largement l'imposition des loyers.` : `Attention : l'imposition des loyers est supérieure à la réduction Denormandie.`}</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
                    <div className="text-xl font-bold text-slate-800">{fmtPct(synthese.rendBrut)}</div>
                    <div className="text-xs text-slate-400 mt-1">{safeNumber(synthese.rendBrut) > 5 ? 'Bon' : safeNumber(synthese.rendBrut) > 4 ? 'Correct' : 'Faible'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{safeNumber(synthese.tri) > 6 ? 'Très bon' : safeNumber(synthese.tri) > 4 ? 'Satisfaisant' : 'À surveiller'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${safeNumber(synthese.cfMoyMois) >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${safeNumber(synthese.cfMoyMois) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${safeNumber(synthese.cfMoyMois) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtSignedEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{safeNumber(synthese.cfMoyMois) >= 0 ? 'Autofinancé' : 'Effort mensuel'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">Réduction totale</div>
                    <div className="text-xl font-bold text-blue-700">{fmtEur(synthese.reductionTotale)}</div>
                    <div className="text-xs text-slate-400 mt-1">{fmtEur(synthese.reductionAnnuelle)}/an</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Capital final</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.capFinal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Après revente</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeEngagement + 3} ans</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">📈 Analyse de l'opération Denormandie</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>• <strong>Rendement brut {fmtPct(synthese.rendBrut)}</strong> : {safeNumber(synthese.rendBrut) > 5 ? 'Performance correcte pour un investissement dans l\'ancien rénové.' : 'Rendement limité par les plafonds de loyer Denormandie.'}</p>
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : Intègre tous les flux (loyers, charges, impôts, réduction, plus-value travaux). {safeNumber(synthese.tri) > 5 ? 'Performance satisfaisante.' : 'Performance modeste.'}</p>
                    <p>• <strong>Cash-flow {safeNumber(synthese.cfMoyMois) >= 0 ? 'positif' : 'négatif'}</strong> : {safeNumber(synthese.cfMoyMois) >= 0 ? `L'opération génère ${fmtEur(synthese.cfMoyMois)}/mois grâce à la réduction d'impôt.` : `Effort de ${fmtEur(Math.abs(safeNumber(synthese.cfMoyMois)))}/mois malgré la réduction.`}</p>
                    <p>• <strong>Part travaux {fmtPct(synthese.partTravaux)}</strong> : {safeNumber(synthese.partTravaux) >= 25 ? 'Éligible au dispositif' : 'Non éligible'} (min. 25% requis). Les travaux valorisent le bien à la revente.</p>
                  </div>
                </div>
              </div>
              
              {/* TIMELINE DES ÉVÉNEMENTS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Jalons clés de l'investissement</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-4 pl-10">
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{dateAcquisition.split('-').reverse().join('/')}</div><div className="text-sm text-slate-600">Acquisition + Travaux • Investissement {fmtEur(synthese.investTotal)}</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div><div className="bg-blue-50 border border-blue-200 p-3 rounded-lg"><div className="font-semibold text-blue-800">{anneeFinEngagement}</div><div className="text-sm text-blue-600">Fin engagement Denormandie • {dureeEngagement} ans • Réduction totale : {fmtEur(synthese.reductionTotale)}</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeFinCredit}</div><div className="text-sm text-slate-600">Fin du crédit • {dureeCredit} ans • Cash-flow libéré</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-300 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeExonerationIR}</div><div className="text-sm text-slate-600">Exonération IR sur plus-value • 22 ans de détention</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-200 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeExonerationPS}</div><div className="text-sm text-slate-600">Exonération totale PV (IR+PS) • 30 ans de détention</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div><div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg"><div className="font-semibold text-emerald-800">{anneeAcq + dureeEngagement + 3}</div><div className="text-sm text-emerald-600">Revente simulée • Capital net {fmtEur(synthese.capFinal)}</div></div></div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* GRAPHIQUE 1 : CASH-FLOW ANNUEL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow après impôts</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique illustre votre trésorerie nette année par année, intégrant la réduction Denormandie et l'imposition des loyers.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {safeNumber(synthese.cfMoyMois) >= 0 ? (
                      <>
                        <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(synthese.cfMoyMois)}/mois</strong>. Les loyers + la réduction Denormandie couvrent les charges (crédit, fiscalité, gestion).</p>
                        <p>La réduction de {fmtEur(synthese.reductionAnnuelle)}/an compense l'imposition des revenus fonciers ({fmtEur(Math.round(safeNumber(synthese.totIR + synthese.totPS) / (dureeEngagement + 3)))}/an en moyenne).</p>
                      </>
                    ) : (
                      <>
                        <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(safeNumber(synthese.cfMoyMois)))}/mois</strong>. Malgré la réduction Denormandie, cet effort compense l'écart entre loyers plafonnés et charges.</p>
                        <p>Cet effort est {Math.abs(safeNumber(synthese.cfMoyMois)) < 200 ? "modéré et acceptable pour un investissement patrimonial" : "significatif, vérifiez votre capacité d'épargne"}. Il diminuera après fin du crédit ({anneeFinCredit}).</p>
                      </>
                    )}
                    <p className="text-slate-500 text-xs mt-2"><em>La ligne rouge verticale marque la fin de l'engagement ({dureeEngagement} ans). Scénario optimal : revendre après {Math.max(dureeCredit, 22)} ans.</em></p>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* GRAPHIQUE 2 : ÉVOLUTION DU CAPITAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine net</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique montre l'évolution de votre capital net (valeur du bien - capital restant dû) au fil des années.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Votre patrimoine net atteindra <strong className="text-blue-600">{fmtEur(synthese.capFinal)}</strong> en {anneeAcq + dureeEngagement + 3} ({dureeEngagement + 3} ans), contre un apport de {fmtEur(apport)}. Multiplication par <strong>{(safeNumber(synthese.capFinal) / apport).toFixed(1)}x</strong>.</p>
                    <p>Les travaux ({fmtEur(travauxTotal)}) valorisent le bien : l'ancien rénové offre un meilleur potentiel de plus-value que le neuf standardisé.</p>
                    <p className="text-slate-500 text-xs mt-2"><em>Point d'inflexion : à partir de {anneeFinCredit}, le crédit étant soldé, votre patrimoine net = valeur totale du bien.</em></p>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* PLUS-VALUE À LA REVENTE */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Simulation de revente en {anneeAcq + dureeEngagement + 3} ({dureeEngagement + 3} ans de détention)</h3>
                <p className="text-sm text-slate-500 mb-4">Calcul de la plus-value immobilière selon le régime des particuliers (CGI art. 150 VB). Les travaux sont intégrés au prix d'acquisition.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">Valeur estimée</div><div className="font-bold text-slate-800">{fmtEur(synthese.valRev)}</div></div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">Prix acquisition</div><div className="font-bold text-slate-800">{fmtEur(synthese.investTotal)}</div></div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"><div className="text-emerald-600 text-xs">PV brute</div><div className="font-bold text-emerald-600">+{fmtEur(synthese.pvBrute)}</div></div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><div className="text-red-500 text-xs">Impôt PV total</div><div className="font-bold text-red-600">{fmtEur(synthese.pvCalc?.impotTotal)}</div></div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="text-blue-600 text-xs">Capital net final</div><div className="font-bold text-blue-700">{fmtEur(synthese.capFinal)}</div></div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><div className="text-slate-500 text-xs">Prix cession</div><div className="font-semibold">{fmtEur(synthese.valRev)}</div></div>
                    <div><div className="text-slate-500 text-xs">Prix acquis. majoré</div><div className="font-semibold">{fmtEur(safeNumber(synthese.pvCalc?.prixAcquisitionMajore) || safeNumber(synthese.investTotal) * 1.075)}</div></div>
                    <div><div className="text-slate-500 text-xs">PV brute</div><div className="font-semibold text-emerald-600">+{fmtEur(synthese.pvBrute)}</div></div>
                    <div><div className="text-slate-500 text-xs">Abattements IR/PS</div><div className="font-semibold text-blue-600">{synthese.pvCalc?.abattementIR || 0}% / {synthese.pvCalc?.abattementPS || 0}%</div></div>
                  </div>
                  
                  <button onClick={() => setShowDetailPV(!showDetailPV)} className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    {showDetailPV ? '▼ Masquer le détail du calcul' : '▶ Afficher le détail du calcul (CGI art. 150 VB)'}
                  </button>
                  
                  {showDetailPV && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                        <div className="font-semibold text-slate-700 mb-2">Prix d'acquisition majoré</div>
                        <div className="flex justify-between"><span>Prix d'achat</span><span>{fmtEur(prixAcquisition)}</span></div>
                        <div className="flex justify-between"><span>+ Travaux (réels)</span><span>+{fmtEur(travauxTotal)}</span></div>
                        <div className="flex justify-between"><span>+ Frais acquisition <span className="text-blue-600 text-xs">(forfait 7.5%)</span></span><span>+{fmtEur(Math.round(prixAcquisition * 0.075))}</span></div>
                        <div className="flex justify-between font-semibold border-t pt-2"><span>= Prix acquisition majoré</span><span>{fmtEur(prixAcquisition + travauxTotal + Math.round(prixAcquisition * 0.075))}</span></div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                        <div className="font-semibold text-slate-700 mb-2">Calcul de l'impôt sur PV</div>
                        <div className="flex justify-between"><span>PV brute</span><span className="text-emerald-600">+{fmtEur(synthese.pvBrute)}</span></div>
                        <div className="flex justify-between"><span>Abattement IR ({dureeEngagement + 3} ans)</span><span>{synthese.pvCalc?.abattementIR || 0}%</span></div>
                        <div className="flex justify-between"><span>Abattement PS ({dureeEngagement + 3} ans)</span><span>{synthese.pvCalc?.abattementPS || 0}%</span></div>
                        <div className="flex justify-between"><span>→ IR (19%)</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotIR)}</span></div>
                        <div className="flex justify-between"><span>→ PS (17.2%)</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotPS)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-2"><span>= Impôt total PV</span><span className="text-red-600">{fmtEur(synthese.pvCalc?.impotTotal)}</span></div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm space-y-2">
                        <div className="font-semibold text-blue-800 mb-2">Capital net après revente</div>
                        <div className="flex justify-between"><span>Prix de vente</span><span>{fmtEur(synthese.valRev)}</span></div>
                        <div className="flex justify-between"><span>− Impôt PV</span><span>−{fmtEur(synthese.pvCalc?.impotTotal)}</span></div>
                        <div className="flex justify-between"><span>− Frais vente ({fraisRevente}%)</span><span>−{fmtEur(Math.round(safeNumber(synthese.valRev) * fraisRevente / 100))}</span></div>
                        <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>= Capital net final</span><span className="text-blue-700">{fmtEur(synthese.capFinal)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                  <h4 className="font-bold text-blue-800 mb-2">📚 Avantage Denormandie sur la plus-value</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Travaux intégrés</strong> : Les {fmtEur(travauxTotal)} de travaux sont ajoutés au prix d'acquisition, réduisant la plus-value imposable.</p>
                    <p>• <strong>Abattements</strong> : Après {dureeEngagement + 3} ans, abattement IR de {synthese.pvCalc?.abattementIR || 0}% et PS de {synthese.pvCalc?.abattementPS || 0}%.</p>
                    <p className="text-blue-600 mt-2">→ Contrairement au LMNP, pas de réintégration d'amortissements à la revente (régime des particuliers).</p>
                  </div>
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* TABLEAU DES PROJECTIONS */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Projection sur {dureeEngagement + 3} ans ({anneeAcq} → {anneeAcq + dureeEngagement + 2})</h3>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showDetailedTable} onChange={(e) => setShowDetailedTable(e.target.checked)} className="rounded" />
                    <span className="text-slate-600">Afficher le détail</span>
                  </label>
                </div>
                
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-blue-600 font-medium">ℹ️ Comprendre les revenus fonciers Denormandie</summary>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-xs text-blue-700">
                    <p><strong>Résultat foncier</strong> = Loyers - Charges déductibles (intérêts, assurance, gestion, taxe foncière).</p>
                    <p><strong>Réduction Denormandie</strong> = Crédit d'impôt annuel ({fmtEur(synthese.reductionAnnuelle)}/an pendant {dureeEngagement} ans).</p>
                    <p><strong>Cash-flow</strong> = Loyers - Mensualités crédit - Charges - IR/PS + Réduction Denormandie.</p>
                  </div>
                </details>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="py-2 px-1 text-left font-semibold text-slate-600">Année</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Loyer net</th>
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Charges</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Intérêts</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-amber-50">Rés. foncier</th>}
                        <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-blue-50">Réd. Denorm.</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">IR+PS</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Capital net</th>
                        {showDetailedTable && <th className="py-2 px-1 text-center font-semibold text-slate-600">Engagement</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 ${!p.enEngagement ? 'bg-slate-100/50' : ''} ${safeNumber(p.cfApres) >= 0 ? 'bg-emerald-50/30' : ''} hover:bg-slate-50`}>
                          <td className="py-1.5 px-1 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-1.5 px-1 text-right text-slate-700">{fmtEur(p.loyerNet)}</td>
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.charges)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.interets)}</td>}
                          {showDetailedTable && <td className={`py-1.5 px-1 text-right bg-amber-50/50 ${safeNumber(p.resultatFoncier) >= 0 ? 'text-slate-700' : 'text-red-500'}`}>{fmtEur(p.resultatFoncier)}</td>}
                          <td className="py-1.5 px-1 text-right text-blue-600 font-medium bg-blue-50/50">{safeNumber(p.reductionDenormandie) > 0 ? '+' + fmtEur(p.reductionDenormandie) : '—'}</td>
                          <td className="py-1.5 px-1 text-right text-amber-600">{fmtEur(safeNumber(p.impotIR) + safeNumber(p.ps))}</td>
                          <td className={`py-1.5 px-1 text-right font-semibold ${safeNumber(p.cfApres) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtSignedEur(p.cfApres)}</td>
                          <td className="py-1.5 px-1 text-right text-blue-600 font-medium">{fmtEur(p.capNet)}</td>
                          {showDetailedTable && <td className="py-1.5 px-1 text-center">{p.enEngagement ? '✅' : '❌'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {projections.length > 0 && (
                  <div className="mt-3 flex gap-3 text-xs">
                    <div className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                      <span className="text-blue-600">Réduction/an : </span>
                      <span className="font-bold text-blue-700">{fmtEur(synthese.reductionAnnuelle)}</span>
                    </div>
                    <div className="flex-1 p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                      <span className="text-emerald-600">Réduction totale : </span>
                      <span className="font-bold text-emerald-700">{fmtEur(synthese.reductionTotale)}</span>
                    </div>
                    <div className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded text-center">
                      <span className="text-amber-600">IR+PS total : </span>
                      <span className="font-bold text-amber-700">{fmtEur(safeNumber(synthese.totIR) + safeNumber(synthese.totPS))}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* AVIS PROFESSIONNEL AVEC SCORE GLOBAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-6 text-xl text-slate-800">🎯 Synthèse et avis professionnel</h3>
                
                {(() => {
                  const levier = safeNumber(synthese.capFinal) / apport
                  const effetReduction = safeNumber(synthese.reductionTotale) / safeNumber(synthese.investTotal) * 100
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 8) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 6) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 5) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 4) ptsTRI = 1
                  else if (safeNumber(synthese.tri) >= 3) ptsTRI = 0.5
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 100) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -150) ptsCF = 1
                  else if (safeNumber(synthese.cfMoyMois) >= -300) ptsCF = 0.5
                  
                  let ptsReduction = 0
                  if (effetReduction >= 18) ptsReduction = 2
                  else if (effetReduction >= 14) ptsReduction = 1.5
                  else if (effetReduction >= 10) ptsReduction = 1
                  else if (effetReduction >= 6) ptsReduction = 0.5
                  
                  let ptsLevier = 0
                  if (levier >= 6) ptsLevier = 1.5
                  else if (levier >= 4) ptsLevier = 1
                  else if (levier >= 2) ptsLevier = 0.5
                  
                  let ptsRend = 0
                  if (safeNumber(synthese.rendBrut) >= 6) ptsRend = 1.5
                  else if (safeNumber(synthese.rendBrut) >= 5) ptsRend = 1
                  else if (safeNumber(synthese.rendBrut) >= 4) ptsRend = 0.5
                  
                  let penalites = 0
                  if (safeNumber(synthese.cfMoyMois) < -500) penalites = -1
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsReduction + ptsLevier + ptsRend + penalites
                  const score = Math.min(10, Math.max(0, Math.round(scoreTotal * 10) / 10))
                  
                  const getScoreColor = (s: number) => s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-blue-600' : s >= 3 ? 'text-amber-600' : 'text-red-600'
                  const getScoreBg = (s: number) => s >= 7 ? 'bg-emerald-50 border-emerald-200' : s >= 5 ? 'bg-blue-50 border-blue-200' : s >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                  const getScoreLabel = (s: number) => s >= 8 ? 'Excellent investissement' : s >= 7 ? 'Très bon investissement' : s >= 6 ? 'Bon investissement' : s >= 5 ? 'Investissement satisfaisant' : s >= 4 ? 'Investissement correct' : s >= 3 ? 'Investissement à optimiser' : 'Investissement à reconsidérer'
                  
                  return (
                    <>
                      <div className={`rounded-xl p-6 mb-4 border-2 ${getScoreBg(score)}`}>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`text-5xl font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                            <div className="text-slate-500 text-sm font-medium">/10</div>
                          </div>
                          <div className="flex-1">
                            <div className={`text-xl font-bold mb-3 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">TRI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsTRI >= 1.5 ? 'bg-emerald-500' : ptsTRI >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsTRI / 2.5) * 100}%`}}></div></div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsTRI}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTRI >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.tri)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Cash-flow</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : ptsCF >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsCF / 2) * 100}%`}}></div></div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsCF}/2 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtSignedEur(synthese.cfMoyMois)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Réd. IR</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsReduction >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsReduction / 2) * 100}%`}}></div></div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsReduction}/2 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{fmtEur(synthese.reductionTotale)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Rendement</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsRend >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 1.5) * 100}%`}}></div></div>
                                <span className="w-20 text-right text-xs text-slate-500">{ptsRend}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.rendBrut)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <button onClick={() => setShowScoreDetail(!showScoreDetail)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          {showScoreDetail ? '▼ Masquer' : '▶ Comprendre'} le calcul du score
                        </button>
                        
                        {showScoreDetail && (
                          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                            <h5 className="font-bold text-slate-700 mb-3">📊 Méthode de calcul du score Denormandie</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Cash-flow (2 pts), Réduction IR (2 pts), Levier (1.5 pts), Rendement (1.5 pts).</p>
                            <p className="text-slate-600">Avantage Denormandie : rendement potentiellement supérieur au Pinel grâce aux prix d'achat plus bas dans l'ancien et à la plus-value travaux.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3">💼 Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {safeNumber(synthese.tri) > 5 && safeNumber(synthese.cfMoyMois) >= -200 ? (
                      <>
                        <p><strong>✅ Opération intéressante</strong> : Avec un TRI de {fmtPct(synthese.tri)} et une réduction d'impôt de {fmtEur(synthese.reductionTotale)}, le Denormandie dans l'ancien rénové offre un meilleur potentiel que le Pinel neuf.</p>
                        <p>Les travaux ({fmtPct(partTravaux)} du coût) valorisent le bien, améliorent sa performance énergétique et réduisent la plus-value imposable à la revente.</p>
                      </>
                    ) : safeNumber(synthese.cfMoyMois) >= -500 ? (
                      <>
                        <p><strong>⚖️ Opération à évaluer</strong> : Le TRI de {fmtPct(synthese.tri)} est correct. La réduction de {fmtEur(synthese.reductionAnnuelle)}/an convient à un TMI {tmi}%.</p>
                        <p>Vérifiez que l'effort de {fmtEur(Math.abs(safeNumber(synthese.cfMoyMois)))}/mois est supportable sur {dureeEngagement} ans et que la commune a un réel potentiel de revitalisation.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>⚠️ Opération à reconsidérer</strong> : L'effort de {fmtEur(Math.abs(safeNumber(synthese.cfMoyMois)))}/mois est élevé malgré la réduction.</p>
                        <p>Vérifiez le potentiel locatif et la qualité de l'emplacement. Le Denormandie est plus risqué en zone peu dynamique.</p>
                      </>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>✅ Le dispositif Denormandie est valable jusqu'au 31/12/2027 (CGI art. 199 novovicies).</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4"><button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(30,64,175,.25)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge{padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af}.badge-green{background:#dcfce7;color:#166534}.badge-red{background:#fee2e2;color:#991b1b}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}.pedagogy-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
