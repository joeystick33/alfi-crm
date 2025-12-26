 
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import { 
  LMNP_DISPLAY as LMNP, 
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
type TypeBail = 'INDIVIDUEL' | 'SOLIDAIRE'
type TypeLocation = 'MEUBLE' | 'NU'
type RegimeFiscal = 'MICRO' | 'REEL'

export default function ColocationPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // Profil client
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [revenusSalaires, setRevenusSalaires] = useState(60000)
  const [autresRevenusNets, setAutresRevenusNets] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(0)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(0)
  const [valeurRP, setValeurRP] = useState(0)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Bien
  const [prixAchat, setPrixAchat] = useState(280000)
  const [fraisNotaire, setFraisNotaire] = useState(22400)
  const [travaux, setTravaux] = useState(30000)
  const [mobilier, setMobilier] = useState(12000)
  const [surface, setSurface] = useState(90)
  const [nbChambres, setNbChambres] = useState(4)
  
  // Configuration colocation
  const [typeBail, setTypeBail] = useState<TypeBail>('INDIVIDUEL')
  const [typeLocation, setTypeLocation] = useState<TypeLocation>('MEUBLE')
  const [loyerParChambre, setLoyerParChambre] = useState(450)
  const [chargesLocataire, setChargesLocataire] = useState(50)
  const [tauxRotation, setTauxRotation] = useState(30) // % de turnover annuel
  const [vacanceMoyenne, setVacanceMoyenne] = useState(4) // semaines par chambre en rotation
  
  // Charges
  const [taxeFonciere, setTaxeFonciere] = useState(1500)
  const [chargesCopro, setChargesCopro] = useState(2000)
  const [assurancePNO, setAssurancePNO] = useState(300)
  const [fraisGestion, setFraisGestion] = useState(10)
  const [provisionEntretien, setProvisionEntretien] = useState(1500)
  
  // Financement
  const [apport, setApport] = useState(70000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  
  // Fiscalité
  const [regimeFiscal, setRegimeFiscal] = useState<RegimeFiscal>('REEL')
  const [dureeDetention, setDureeDetention] = useState(15)
  const [revalorisationBien, setRevalorisationBien] = useState(2)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee: 0, parentIsole: false })
  const revenusTotaux = revenusSalaires + autresRevenusNets
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi
  
  // IFI avant investissement
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: patrimoineImmobilierExistant,
    dettesDeductibles: dettesImmobilieres,
    valeurRP: valeurRP
  })

  // Dates clés
  const [anneeAcq] = dateAcquisition.split('-').map(Number)
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeRevente = anneeAcq + dureeDetention

  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // Calculs préliminaires
  const investTotal = prixAchat + fraisNotaire + travaux + (typeLocation === 'MEUBLE' ? mobilier : 0)
  const montantEmprunte = Math.max(0, investTotal - apport)
  
  const loyerBrutMensuel = nbChambres * loyerParChambre
  const loyerBrutAnnuel = loyerBrutMensuel * 12
  const loyerParM2 = loyerBrutMensuel / surface
  
  // Vacance liée à la rotation
  const chambresEnRotation = nbChambres * tauxRotation / 100
  const semainesVacanceTotal = chambresEnRotation * vacanceMoyenne
  const tauxVacance = semainesVacanceTotal / 52 / nbChambres * 100
  
  const abattement = typeLocation === 'MEUBLE' ? 50 : 30
  const plafondMicro = typeLocation === 'MEUBLE' ? LMNP.MICRO_BIC.PLAFOND_RECETTES_CLASSIQUE : 15000
  
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensualite = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION COLOCATION
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/colocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Profil client
          situationFamiliale,
          enfantsACharge,
          enfantsGardeAlternee: 0,
          parentIsole: false,
          revenusSalaires,
          revenusFonciersExistants: 0,
          autresRevenus: autresRevenusNets,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          // Bien
          dateAcquisition,
          prixAcquisition: prixAchat,
          fraisNotaire,
          travaux,
          mobilier: typeLocation === 'MEUBLE' ? mobilier : 0,
          surface,
          nbChambres,
          // Type colocation
          typeLocation: typeLocation === 'NU' ? 'NUE' : typeLocation,
          typeBail,
          // Financement
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit: 0.30,
          // Revenus locatifs
          loyerParChambre,
          chargesParChambre: chargesLocataire,
          tauxOccupation: 100 - tauxRotation,
          turnoverAnnuel: tauxRotation,
          revalorisationLoyer: 1.5,
          // Charges
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion,
          chargesCommunes: provisionEntretien,
          // Régime fiscal
          regimeFiscal: typeLocation === 'MEUBLE' 
            ? (regimeFiscal === 'MICRO' ? 'MICRO_BIC' : 'REEL')
            : (regimeFiscal === 'MICRO' ? 'MICRO_FONCIER' : 'REEL_FONCIER'),
          // Projection
          dureeDetention,
          revalorisationBien,
          fraisRevente: 5,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: Record<string, number>, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        loyerBrut: p.loyerBrut || 0,
        loyerNet: p.loyerNet || 0,
        charges: p.charges || 0,
        interets: p.interets || 0,
        baseImp: p.baseImposable || 0,
        ir: p.ir || 0,
        ps: p.ps || 0,
        creditAn: p.echeanceCredit || 0,
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valBien: p.valeurBien || 0,
        capNet: p.capitalNet || 0,
      }))

      const rendBrut = (loyerBrutAnnuel / prixAchat) * 100

      setSynthese({
        investTotal: result.synthese.investTotal,
        nbChambres,
        loyerParChambre,
        loyerBrutMensuel,
        loyerBrutAnnuel,
        loyerParM2: Math.round(loyerParM2 * 10) / 10,
        tauxVacance: Math.round(tauxVacance * 10) / 10,
        rendBrut: result.synthese.rentaBrute ?? 0,
        rendNet: result.synthese.rentaNette ?? 0,
        tri: result.synthese.tri,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule ?? 0,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel ?? Math.round(safeNumber(result.synthese.cashFlowCumule) / dureeDetention / 12),
        cfCum: result.synthese.cashFlowCumule,
        valRev: result.plusValue?.valeurRevente ?? 0,
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinCredit,
        anneeRevente,
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
        `═══ COLOCATION ${typeLocation === 'MEUBLE' ? 'MEUBLÉE' : 'NUE'} - SYNTHÈSE ═══`,
        ``,
        `① CONFIGURATION : ${nbChambres} chambres × ${fmtEur(loyerParChambre)}/mois`,
        `② RENDEMENT BRUT : ${fmtPct(result.synthese.rentaBrute || rendBrut)}`,
        `③ TRI : ${fmtPct(result.synthese.tri)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Colocation:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, revenusSalaires,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAchat, fraisNotaire, travaux, mobilier, surface,
    nbChambres, typeBail, typeLocation, loyerParChambre, tauxRotation, vacanceMoyenne,
    taxeFonciere, chargesCopro, assurancePNO, fraisGestion, provisionEntretien,
    apport, tauxCredit, dureeCredit, regimeFiscal, dureeDetention, revalorisationBien,
    loyerBrutMensuel, loyerBrutAnnuel, loyerParM2, tauxVacance,
    anneeAcq, anneeFinCredit, anneeRevente,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const Pl = (window as any).Plotly; if (!Pl) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) Pl.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.loyerNet), type: 'bar', name: 'Loyers nets', marker: { color: '#10b981' } },
      { x: years, y: projections.map(p => p.cfApres), type: 'scatter', name: 'Cash-flow', line: { color: '#3b82f6', width: 2 } },
    ], { title: 'Revenus et cash-flow', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) Pl.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur', line: { color: '#8b5cf6' } },
      { x: years, y: projections.map(p => p.capRestant), name: 'Dette', line: { color: '#ef4444' }, fill: 'tozeroy' },
    ], { title: 'Patrimoine', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={handlePlotlyLoad} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">👥</span>
              <div><h1 className="text-2xl font-bold">Simulateur Colocation</h1><p className="text-gray-600">Multi-baux • Rendement optimisé • Risque réparti</p></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-cyan">{nbChambres} chambres</span>
              <span className="badge-green">{fmtEur(loyerBrutMensuel)}/mois</span>
              <span className="badge-blue">{typeLocation === 'MEUBLE' ? 'Meublé' : 'Nu'}</span>
            </div>
          </div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-cyan-600 rounded-full transition-all" style={{width:`${step/5*100}%`}}/></div></div>

              {step === 1 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">🏠 Bien</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Prix achat (€)</label><input type="number" value={prixAchat} onChange={e=>setPrixAchat(+e.target.value)}/></div><div className="form-group"><label>Surface (m²)</label><input type="number" value={surface} onChange={e=>setSurface(+e.target.value)}/></div><div className="form-group"><label>Nb chambres</label><input type="number" value={nbChambres} onChange={e=>setNbChambres(+e.target.value)} min={2} max={10}/></div><div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/></div><div className="form-group"><label>Travaux (€)</label><input type="number" value={travaux} onChange={e=>setTravaux(+e.target.value)}/></div><div className="form-group"><label>Mobilier (€)</label><input type="number" value={mobilier} onChange={e=>setMobilier(+e.target.value)} disabled={typeLocation==='NU'}/></div></div></div>}

              {step === 2 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">👥 Configuration colocation</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Type location</label><select value={typeLocation} onChange={e=>setTypeLocation(e.target.value as TypeLocation)}><option value="MEUBLE">Meublé (LMNP)</option><option value="NU">Nu (foncier)</option></select></div><div className="form-group"><label>Type bail</label><select value={typeBail} onChange={e=>setTypeBail(e.target.value as TypeBail)}><option value="INDIVIDUEL">Baux individuels</option><option value="SOLIDAIRE">Bail solidaire</option></select></div><div className="form-group"><label>Loyer/chambre (€)</label><input type="number" value={loyerParChambre} onChange={e=>setLoyerParChambre(+e.target.value)}/></div><div className="form-group"><label>Charges locataire (€)</label><input type="number" value={chargesLocataire} onChange={e=>setChargesLocataire(+e.target.value)}/></div><div className="form-group"><label>Rotation annuelle (%)</label><input type="number" value={tauxRotation} onChange={e=>setTauxRotation(+e.target.value)} min={0} max={100}/><span className="form-hint">% de chambres avec changement/an</span></div><div className="form-group"><label>Vacance par rotation (sem.)</label><input type="number" value={vacanceMoyenne} onChange={e=>setVacanceMoyenne(+e.target.value)} min={0} max={12}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Loyer mensuel total</span><div className="font-bold text-2xl text-green-600">{fmtEur(loyerBrutMensuel)}</div></div><div><span className="text-gray-500">Loyer/m²</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerParM2))}/m²</div></div><div><span className="text-gray-500">Taux vacance</span><div className="font-bold text-lg">{fmtPct(tauxVacance)}</div></div></div></div>}

              {step === 3 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">📋 Charges</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/></div><div className="form-group"><label>Copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div><div className="form-group"><label>PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div><div className="form-group"><label>Gestion (%)</label><input type="number" value={fraisGestion} onChange={e=>setFraisGestion(+e.target.value)} step={0.5}/></div><div className="form-group"><label>Provision entretien (€)</label><input type="number" value={provisionEntretien} onChange={e=>setProvisionEntretien(+e.target.value)}/><span className="form-hint">Usure accrue en colocation</span></div></div></div>}

              {step === 4 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">💳 Financement</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Apport (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/></div><div className="form-group"><label>Taux (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Investissement</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div><div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div><div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div></div></div>}

              {step === 5 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4">🏛️ Fiscalité et Projection</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Régime fiscal</label><select value={regimeFiscal} onChange={e=>setRegimeFiscal(e.target.value as RegimeFiscal)}><option value="MICRO">Micro ({abattement}%)</option><option value="REEL">Réel</option></select></div><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)}/></div><div className="form-group"><label>Revalo (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div><div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div><div><span className="text-gray-500">Revenus totaux</span><div className="font-bold text-lg">{fmtEur(revenusTotaux)}</div></div></div></div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 5 ? <button onClick={()=>setStep(step+1)} className="btn-primary-cyan">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-cyan">{loading ? '⏳' : '🧮 Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i) => <div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal de la colocation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">IR colocation total</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(synthese.totIR)}</div>
                    <div className="text-xs text-amber-400">{fmtEur(Math.round(synthese.totIR / dureeDetention))}/an moy.</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">PS total</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.totPS)}</div>
                    <div className="text-xs text-slate-400">17.2% des revenus</div>
                  </div>
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="text-cyan-600 text-xs mb-1">Type</div>
                    <div className="font-bold text-lg text-cyan-600">{typeLocation === 'MEUBLE' ? 'Meublé' : 'Nu'}</div>
                    <div className="text-xs text-cyan-400">{regimeFiscal === 'MICRO' ? `Micro ${abattement}%` : 'Réel'}</div>
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
                <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <h4 className="font-semibold text-cyan-800 mb-2">📊 Comprendre la fiscalité colocation</h4>
                  <div className="text-sm text-cyan-700 space-y-1">
                    <p>• <strong>{nbChambres} chambres × {fmtEur(loyerParChambre)}</strong> = {fmtEur(loyerBrutMensuel)}/mois = <strong className="text-cyan-600">{fmtEur(loyerBrutAnnuel)}/an</strong>.</p>
                    <p>• <strong>Type bail : {typeBail === 'INDIVIDUEL' ? 'Baux individuels' : 'Bail solidaire'}</strong> - {typeBail === 'INDIVIDUEL' ? 'Gestion simplifiée, risque locatif mutualisé.' : 'Solidarité entre colocataires.'}</p>
                    <p>• <strong>Vacance estimée</strong> : {fmtPct(tauxVacance)} liée à la rotation ({tauxRotation}% de turnover).</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-center">
                    <div className="text-xs text-cyan-600 mb-1">{nbChambres} ch. × {fmtEur(loyerParChambre)}</div>
                    <div className="text-xl font-bold text-cyan-600">{fmtEur(loyerBrutMensuel)}/m</div>
                    <div className="text-xs text-slate-400 mt-1">{fmtEur(loyerParM2)}/m²</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
                    <div className={`text-xl font-bold ${synthese.rendBrut >= 8 ? 'text-emerald-600' : 'text-slate-800'}`}>{fmtPct(synthese.rendBrut)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.rendBrut >= 8 ? 'Excellent' : synthese.rendBrut >= 6 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 8 ? 'Excellent' : synthese.tri > 5 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfMoyMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.cfMoyMois > 200 ? 'Autofinancé' : synthese.cfMoyMois >= 0 ? 'Équilibré' : 'Effort'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">IR+PS total</div>
                    <div className="text-xl font-bold text-slate-700">{fmtEur(synthese.totIR + synthese.totPS)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">+{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Net d'impôts</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>Rendement {fmtPct(synthese.rendBrut)}</strong> : {synthese.rendBrut >= 8 ? 'La colocation offre un excellent rendement, supérieur à la location classique.' : synthese.rendBrut >= 6 ? 'Bon rendement pour une colocation.' : 'Rendement correct mais optimisable.'}</p>
                    <p>• <strong>Colocation {nbChambres} chambres</strong> : Loyer/m² de {fmtEur(loyerParM2)} (vs ~15 €/m² en location classique). Potentiel de +{fmtPct((loyerParM2 - 15) / 15 * 100)} de rendement.</p>
                    <p>• <strong>Rotation {tauxRotation}%</strong> : {tauxRotation <= 20 ? 'Faible turnover, bon signe.' : tauxRotation <= 40 ? 'Rotation normale pour une colocation.' : 'Rotation élevée, anticipez la vacance.'}</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 1 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution des loyers et fiscalité</h3>
                <p className="text-sm text-slate-500 mb-4">Loyers perçus et imposition année par année.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse des revenus</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>La colocation génère <strong className="text-cyan-600">{fmtEur(loyerBrutAnnuel)}/an brut</strong> ({nbChambres} × {fmtEur(loyerParChambre)} × 12), soit {fmtPct(synthese.rendBrut)} de rendement brut.</p>
                    <p>Après charges et fiscalité ({regimeFiscal === 'MICRO' ? `micro ${abattement}%` : 'réel'}), le cash-flow net est de {synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}/mois.</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 2 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine</h3>
                <p className="text-sm text-slate-500 mb-4">Valeur du bien et capital net au fil du temps.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Investissement : <strong>{fmtEur(investTotal)}</strong> pour un bien de {surface} m² avec {nbChambres} chambres.</p>
                    <p>Avec +{fmtPct(revalorisationBien)}/an, la valeur atteindra {fmtEur(Math.round(prixAchat * Math.pow(1 + revalorisationBien / 100, dureeDetention)))} après {dureeDetention} ans.</p>
                  </div>
                </div>
              </div>

              {/* DÉTAIL CALCUL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Détail du calcul</h3>
                <details>
                  <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul colocation</summary>
                  <pre className="text-xs bg-slate-50 p-4 rounded-lg mt-2 whitespace-pre-wrap font-mono overflow-x-auto border border-slate-200">{explications.join('\n')}</pre>
                </details>
              </div>

              {/* TABLEAU DES PROJECTIONS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Projection sur {dureeDetention} ans</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="py-2 px-2 text-left font-semibold text-slate-600">Année</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-cyan-50">Loyers</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Charges</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">IR+PS</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Capital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 hover:bg-slate-50 ${p.cfApres >= 0 ? 'bg-emerald-50/20' : ''}`}>
                          <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-2 px-2 text-right text-cyan-600 bg-cyan-50/50">{fmtEur(p.loyerNet)}</td>
                          <td className="py-2 px-2 text-right text-slate-500">{fmtEur(p.charges)}</td>
                          <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{fmtEur(p.ir + p.ps)}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                          <td className="py-2 px-2 text-right text-blue-600 font-medium">{fmtEur(p.capNet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* AVIS PROFESSIONNEL AVEC SCORE GLOBAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-6 text-xl text-slate-800">🎯 Synthèse et avis professionnel</h3>
                
                {(() => {
                  const levier = safeNumber(synthese.capFinal) / apport
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 12) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 10) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 8) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 5) ptsTRI = 1
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 300) ptsCF = 2.5
                  else if (safeNumber(synthese.cfMoyMois) >= 150) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -150) ptsCF = 1
                  
                  let ptsRend = 0
                  if (safeNumber(synthese.rendBrut) >= 10) ptsRend = 2.5
                  else if (safeNumber(synthese.rendBrut) >= 8) ptsRend = 2
                  else if (safeNumber(synthese.rendBrut) >= 6) ptsRend = 1.5
                  else if (safeNumber(synthese.rendBrut) >= 5) ptsRend = 1
                  
                  let ptsLevier = 0
                  if (levier >= 8) ptsLevier = 1.5
                  else if (levier >= 5) ptsLevier = 1
                  else if (levier >= 3) ptsLevier = 0.5
                  
                  let ptsConfig = 0
                  if (nbChambres >= 5) ptsConfig = 1
                  else if (nbChambres >= 4) ptsConfig = 0.75
                  else if (nbChambres >= 3) ptsConfig = 0.5
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsRend + ptsLevier + ptsConfig
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
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsTRI >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsTRI / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsTRI}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTRI >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.tri)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Cash-flow</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsCF / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsCF}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtSignedEur(synthese.cfMoyMois)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Rendement</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsRend >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsRend}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsRend >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.rendBrut)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Config.</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsConfig / 1) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsConfig}/1 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{nbChambres} ch.</span>
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
                            <h5 className="font-bold text-slate-700 mb-3">📊 Méthode de calcul du score Colocation</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Cash-flow (2.5 pts), Rendement brut (2.5 pts), Levier (1.5 pts), Config. chambres (1 pt).</p>
                            <p className="text-slate-600">La colocation permet un rendement +30-50% supérieur à la location classique grâce à la mutualisation des espaces.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3">💼 Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {safeNumber(synthese.rendBrut) >= 8 && safeNumber(synthese.cfMoyMois) >= 0 ? (
                      <p><strong>✅ Excellente opération</strong> : Rendement brut de {fmtPct(synthese.rendBrut)} exceptionnel grâce à la mutualisation des espaces. La colocation maximise le rendement locatif.</p>
                    ) : safeNumber(synthese.rendBrut) >= 6 ? (
                      <p><strong>✅ Bonne opération</strong> : Rendement brut de {fmtPct(synthese.rendBrut)} supérieur à la location classique. Surveillez le turnover et la qualité des locataires.</p>
                    ) : (
                      <p><strong>⚠️ À optimiser</strong> : Rendement de {fmtPct(synthese.rendBrut)}. Vérifiez les loyers du marché ou ajoutez des chambres si possible.</p>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Colocation : rendement boosté (+30-50% vs classique) mais gestion plus active. Privilégiez les baux individuels pour limiter le risque.</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-cyan{background:#cffafe;color:#0e7490;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#06b6d4;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px;color:#0e7490}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
