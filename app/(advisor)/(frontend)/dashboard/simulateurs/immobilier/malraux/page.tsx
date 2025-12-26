 
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
type TypeSecteur = 'SPR' | 'QAD'

export default function MalrauxPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [_showDetailedTable, _setShowDetailedTable] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ÉTAPE 1 : Profil client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(120000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(500000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(200000)
  const [valeurRP, setValeurRP] = useState(400000)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Bien
  const [prixAcquisition, setPrixAcquisition] = useState(150000)
  const [fraisNotaire, setFraisNotaire] = useState(12000)
  const [surface, setSurface] = useState(70)
  const [typeSecteur, setTypeSecteur] = useState<TypeSecteur>('SPR')
  
  // Travaux (plafond 400k€ sur 4 ans)
  const [travauxAn1, setTravauxAn1] = useState(100000)
  const [travauxAn2, setTravauxAn2] = useState(100000)
  const [travauxAn3, setTravauxAn3] = useState(80000)
  const [travauxAn4, setTravauxAn4] = useState(50000)
  
  // Financement
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(80000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  
  // Exploitation (après travaux)
  const [loyerMensuel, setLoyerMensuel] = useState(900)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [chargesLocatives, setChargesLocatives] = useState(0)
  const [taxeFonciere, setTaxeFonciere] = useState(1200)
  const [chargesCopro, setChargesCopro] = useState(1500)
  const [assurancePNO, setAssurancePNO] = useState(220)
  const [fraisGestion, setFraisGestion] = useState(8)
  
  // Projection
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(1.5)
  const [revalorisationBien, setRevalorisationBien] = useState(2.5)
  const [dureeDetention, setDureeDetention] = useState(15)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenusTotaux = revenusSalaires + revenusFonciersExistants + autresRevenus
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
  const anneeFinTravaux = anneeAcq + 4
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeExonerationIR = anneeAcq + 22
  const anneeExonerationPS = anneeAcq + 30

  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [_explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  const M = DISPOSITIFS_FISCAUX.MALRAUX
  const travauxTotal = travauxAn1 + travauxAn2 + travauxAn3 + travauxAn4
  const travauxPlafonne = Math.min(travauxTotal, M.PLAFOND_TRAVAUX)
  const tauxReduction = typeSecteur === 'SPR' ? M.TAUX_SPR : M.TAUX_QAD
  const reductionTotale = travauxPlafonne * tauxReduction / 100
  
  const investTotal = prixAcquisition + fraisNotaire + travauxTotal
  const montantEmprunte = Math.max(0, investTotal - apport)
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensualite = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION MALRAUX
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/malraux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          situationFamiliale,
          enfantsACharge,
          revenusSalaires,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          dateAcquisition,
          prixAcquisition,
          fraisNotaire,
          travaux: travauxAn1 + travauxAn2 + travauxAn3 + travauxAn4,
          dureeTravaux: [travauxAn1, travauxAn2, travauxAn3, travauxAn4].filter(t => t > 0).length || 1,
          typeSecteur,
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          loyerMensuel,
          chargesLocatives,
          vacanceSemaines,
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion,
          revalorisationLoyer,
          revalorisationBien,
          dureeDetention,
          fraisRevente,
          enfantsGardeAlternee,
          parentIsole,
          revenusFonciersExistants,
          autresRevenus,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: Record<string, number>, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        phase: idx < 4 ? 'Travaux' : 'Location',
        loyerNet: p.loyerNet || 0,
        charges: p.charges || 0,
        interets: p.interets || 0,
        reductionMalraux: p.reductionMalraux || 0,
        impotIR: p.ir || 0,
        ps: p.ps || 0,
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valBien: p.valeurBien || 0,
        capNet: p.capitalNet || 0,
      }))

      setSynthese({
        investTotal: result.synthese.investTotal,
        travauxTotal,
        travauxPlafonne: result.malraux?.travauxPlafonne ?? 0,
        tauxReduction: result.malraux?.tauxReduction ?? 0,
        reductionTotale: result.malraux?.reductionTotale ?? 0,
        totReduction: result.malraux?.reductionTotale ?? 0,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule ?? 0,
        tri: result.synthese.tri,
        cfCum: result.synthese.cashFlowCumule,
        valRev: result.plusValue?.valeurRevente ?? 0,
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinTravaux,
        anneeFinCredit,
        anneeExonerationIR,
        anneeExonerationPS,
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
        `═══ DISPOSITIF MALRAUX - SYNTHÈSE ═══`,
        ``,
        `① RÉDUCTION TOTALE : ${fmtEur(result.malraux?.reductionTotale || 0)}`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Malraux:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAcquisition, fraisNotaire,
    travauxAn1, travauxAn2, travauxAn3, travauxAn4, typeSecteur,
    apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, chargesLocatives, vacanceSemaines,
    taxeFonciere, chargesCopro, assurancePNO, fraisGestion,
    revalorisationLoyer, revalorisationBien, dureeDetention, fraisRevente,
    travauxTotal, travauxPlafonne, tauxReduction,
    anneeAcq, anneeFinTravaux, anneeFinCredit, anneeExonerationIR, anneeExonerationPS,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const Pl = (window as any).Plotly; if (!Pl) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) Pl.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.cfApres), type: 'bar', name: 'Cash-flow', marker: { color: projections.map(p => p.phase === 'Travaux' ? '#f59e0b' : '#10b981') } },
      { x: years, y: projections.map(p => p.reductionMalraux), type: 'scatter', name: 'Réduction', mode: 'lines+markers', line: { color: '#dc2626', width: 3 } },
    ], { title: 'Cash-flow et réduction Malraux', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) Pl.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur', line: { color: '#3b82f6' } },
      { x: years, y: projections.map(p => p.capRestant), name: 'Dette', line: { color: '#ef4444' }, fill: 'tozeroy' },
    ], { title: 'Patrimoine', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={handlePlotlyLoad} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏛️</span>
              <div><h1 className="text-2xl font-bold">Simulateur Loi Malraux</h1><p className="text-gray-600">Restauration patrimoine • Secteurs protégés • Réduction IR</p></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-red">{tauxReduction}% de réduction</span>
              <span className="badge-amber">Travaux {fmtEur(travauxTotal)}</span>
              <span className="badge-blue">{typeSecteur === 'SPR' ? 'SPR+PSMV' : 'QAD'}</span>
            </div>
          </div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-red-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1">👤 Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">La loi Malraux offre une réduction d'IR - vérifiez que vous avez assez d'impôt à réduire</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Situation familiale</label><select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}><option value="CELIBATAIRE">Célibataire</option><option value="MARIE_PACSE">Marié / Pacsé</option><option value="VEUF">Veuf</option></select></div>
                  <div className="form-group"><label>Enfants à charge</label><input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Enfants garde alternée</label><input type="number" value={enfantsGardeAlternee} onChange={e=>setEnfantsGardeAlternee(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Parent isolé</label><select value={parentIsole ? 'OUI' : 'NON'} onChange={e=>setParentIsole(e.target.value === 'OUI')}><option value="NON">Non</option><option value="OUI">Oui</option></select></div>
                  <div className="form-group"><label>Revenus salaires (€/an)</label><input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/></div>
                  <div className="form-group"><label>Revenus fonciers existants (€)</label><input type="number" value={revenusFonciersExistants} onChange={e=>setRevenusFonciersExistants(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres revenus (€)</label><input type="number" value={autresRevenus} onChange={e=>setAutresRevenus(+e.target.value)}/></div>
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
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-red-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-red-700"><strong>Avantage Malraux :</strong> Contrairement au Pinel ou Denormandie, la réduction Malraux est <strong>HORS plafond des niches fiscales</strong> (10 000 €). Vous pouvez donc cumuler avec d'autres dispositifs.</p></div>
              </div>}

              {/* ÉTAPE 2 : BIEN EN SECTEUR PROTÉGÉ */}
              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🏛️ Bien en secteur protégé</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)}/></div>
                  <div className="form-group"><label>Prix d'acquisition (€)</label><input type="number" value={prixAcquisition} onChange={e=>setPrixAcquisition(+e.target.value)}/></div>
                  <div className="form-group"><label>Surface (m²)</label><input type="number" value={surface} onChange={e=>setSurface(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/></div>
                  <div className="form-group col-span-2"><label>Type de secteur protégé</label><select value={typeSecteur} onChange={e=>setTypeSecteur(e.target.value as TypeSecteur)} className="text-lg"><option value="SPR">SPR avec PSMV (30% de réduction)</option><option value="QAD">Quartier Ancien Dégradé (22% de réduction)</option></select></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-red-800 mb-2">📜 Loi Malraux - CGI art. 199 tervicies</h4><ul className="text-sm text-red-700 space-y-1"><li>• <strong>SPR + PSMV :</strong> Site Patrimonial Remarquable avec Plan de Sauvegarde et de Mise en Valeur → <strong>30%</strong></li><li>• <strong>QAD :</strong> Quartier Ancien Dégradé ou convention NPNRU → <strong>22%</strong></li><li>• Travaux supervisés par l'Architecte des Bâtiments de France (ABF)</li></ul></div>
              </div>}

              {/* ÉTAPE 3 : TRAVAUX */}
              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🔧 Travaux de restauration (plafond {fmtEur(M.PLAFOND_TRAVAUX)} sur 4 ans)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Année 1 (€)</label><input type="number" value={travauxAn1} onChange={e=>setTravauxAn1(+e.target.value)}/><span className="form-hint text-red-600">Réd: {fmtEur(Math.round(Math.min(travauxAn1, M.PLAFOND_TRAVAUX) * tauxReduction / 100))}</span></div>
                  <div className="form-group"><label>Année 2 (€)</label><input type="number" value={travauxAn2} onChange={e=>setTravauxAn2(+e.target.value)}/></div>
                  <div className="form-group"><label>Année 3 (€)</label><input type="number" value={travauxAn3} onChange={e=>setTravauxAn3(+e.target.value)}/></div>
                  <div className="form-group"><label>Année 4 (€)</label><input type="number" value={travauxAn4} onChange={e=>setTravauxAn4(+e.target.value)}/></div>
                </div>
                <div className={`info-box mt-4 ${travauxTotal <= M.PLAFOND_TRAVAUX ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Travaux total</span><div className="font-bold text-lg">{fmtEur(travauxTotal)}</div></div>
                    <div><span className="text-gray-500">Base plafonnée</span><div className="font-bold text-lg">{fmtEur(travauxPlafonne)}</div></div>
                    <div><span className="text-gray-500">Réduction totale</span><div className="font-bold text-2xl text-red-600">{fmtEur(Math.round(reductionTotale))}</div></div>
                  </div>
                  {travauxTotal > M.PLAFOND_TRAVAUX && <p className="text-sm text-amber-700 mt-2">⚠️ Travaux au-delà du plafond de {fmtEur(M.PLAFOND_TRAVAUX)} : l'excédent de {fmtEur(travauxTotal - M.PLAFOND_TRAVAUX)} ne génère pas de réduction</p>}
                </div>
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
                      <div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div>
                      <div className="form-group"><label>Assurance crédit (%)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.05}/></div>
                    </div>
                    <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-gray-500">Investissement</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                      <div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                      <div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div>
                    </div>
                  </>
                )}
              </div>}

              {/* ÉTAPE 5 : REVENUS LOCATIFS */}
              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">💰 Revenus locatifs (après travaux)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Loyer mensuel (€)</label><input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)}/></div>
                  <div className="form-group"><label>Charges locatives (€ / mois)</label><input type="number" value={chargesLocatives} onChange={e=>setChargesLocatives(+e.target.value)} min={0}/><span className="form-hint">Récupérées auprès du locataire</span></div>
                  <div className="form-group"><label>Vacance (semaines/an)</label><input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52}/></div>
                  <div className="form-group"><label>Revalorisation loyer (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Loyer annuel brut</span><div className="font-bold text-lg">{fmtEur(loyerMensuel * 12)}</div></div>
                  <div><span className="text-gray-500">Taux vacance</span><div className="font-bold text-lg">{fmtPct(vacanceSemaines / 52 * 100)}</div></div>
                  <div><span className="text-gray-500">Loyer annuel net</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerMensuel * 12 * (1 - vacanceSemaines / 52)))}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-red-700"><strong>Location obligatoire :</strong> Le bien doit être loué nu pendant <strong>9 ans minimum</strong> après l'achèvement des travaux. Pas de plafond de loyer ni de ressources du locataire (contrairement au Pinel).</p></div>
              </div>}

              {/* ÉTAPE 6 : CHARGES */}
              {step === 6 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1">📋 Charges déductibles</h2>
                <p className="text-sm text-gray-500 mb-6">Charges estimées après travaux</p>
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
                <h2 className="text-lg font-bold mb-4">🏛️ Projection</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Durée détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={9}/><span className="form-hint">Min 9 ans obligatoire</span></div>
                  <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div>
                  <div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div>
                  <div><span className="text-gray-500">Réduction totale</span><div className="font-bold text-lg text-red-600">{fmtEur(Math.round(reductionTotale))}</div></div>
                  <div><span className="text-gray-500">Taux réduction</span><div className="font-bold text-lg text-red-600">{tauxReduction}%</div></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-red-800 mb-2">⚠️ Avantages et obligations Malraux</h4><ul className="text-sm text-red-700 space-y-1">
                  <li>• ✅ <strong>HORS plafond niches fiscales</strong> (10 000 €) - cumulable avec Pinel, PER, etc.</li>
                  <li>• ✅ Réduction = {tauxReduction}% des travaux plafonnés à {fmtEur(M.PLAFOND_TRAVAUX)}</li>
                  <li>• ⚠️ Location nue pendant <strong>9 ans minimum</strong> après travaux</li>
                  <li>• ⚠️ Travaux validés par l'Architecte des Bâtiments de France (ABF)</li>
                  <li>• ⚠️ Durée travaux : généralement 2 à 4 ans</li>
                </ul></div>
              </div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary-red">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-red">{loading ? '⏳' : '🧮 Analyser'}</button>}
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
                    <div className="text-slate-500 text-xs mb-1">IR actuel (hors Malraux)</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">Sur {fmtEur(revenusTotaux)}/an</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-600 text-xs mb-1">Réduction Malraux</div>
                    <div className="font-bold text-lg text-red-600">{fmtEur(synthese.reductionTotale)}</div>
                    <div className="text-xs text-red-400">Sur 4 ans max</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs mb-1">Économie IR/an (moy.)</div>
                    <div className="font-bold text-lg text-emerald-600">{fmtEur(Math.round(synthese.reductionTotale / 4))}</div>
                    <div className="text-xs text-emerald-400">{fmtPct(tauxReduction)} des travaux</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">IR après réduction (an 1)</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(Math.max(0, irAvant.impotNet - Math.round(synthese.reductionTotale / 4)))}</div>
                    <div className="text-xs text-amber-400">Hors plafond niches</div>
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
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">📊 Comprendre la fiscalité Malraux</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>• <strong>Hors plafond niches</strong> : La réduction Malraux n'est PAS soumise au plafond de 10 000 €/an, contrairement au Pinel/Denormandie.</p>
                    <p>• <strong>Réduction directe</strong> : {fmtPct(tauxReduction)} des travaux éligibles ({fmtEur(travauxPlafonne)}) = {fmtEur(synthese.reductionTotale)} de réduction d'IR.</p>
                    <p>• <strong>Optimal TMI élevé</strong> : Avec un TMI de {tmi}%, la réduction Malraux permet d'économiser directement sur l'IR sans limite.</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="text-xs text-red-600 mb-1">Réduction totale</div>
                    <div className="text-xl font-bold text-red-600">{fmtEur(synthese.reductionTotale)}</div>
                    <div className="text-xs text-slate-400 mt-1">{fmtPct(tauxReduction)} travaux</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Travaux</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.travauxTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur 4 ans</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 6 ? 'Excellent' : synthese.tri > 4 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfCum >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>CF cumulé</div>
                    <div className={`text-xl font-bold ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfCum >= 0 ? '+' : ''}{fmtEur(synthese.cfCum)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Valeur finale</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.valRev)}</div>
                    <div className="text-xs text-slate-400 mt-1">Estimation</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Patrimoine + CF</div>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUES */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Cash-flow et réduction Malraux</h3>
                <p className="text-sm text-slate-600 mb-4">Ce graphique montre l'évolution du cash-flow (barres) et de la réduction d'impôt Malraux (ligne rouge) pendant les phases travaux et exploitation.</p>
                <div ref={chartRef1}/>
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">📊 Analyse du cash-flow</h4>
                  <p className="text-sm text-red-700">Les premières années (phase travaux) génèrent la réduction Malraux ({fmtEur(synthese.reductionTotale)} sur 4 ans max). Ensuite, les loyers prennent le relais pour générer du cash-flow positif.</p>
                </div>
              </div>

              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Évolution du patrimoine</h3>
                <p className="text-sm text-slate-600 mb-4">Ce graphique montre l'évolution de la valeur du bien restauré et du capital net.</p>
                <div ref={chartRef2}/>
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-2">📊 Analyse patrimoniale</h4>
                  <p className="text-sm text-emerald-700">Le bien en secteur protégé ({typeSecteur === 'SPR' ? 'SPR avec PSMV' : 'QAD'}) bénéficie d'une valorisation potentielle supérieure grâce à la qualité de la restauration et l'emplacement exceptionnel.</p>
                </div>
              </div>

              {/* TABLEAU */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">📈 Projection sur {dureeDetention} ans</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="py-2 px-2 text-left">Année</th>
                        <th className="py-2 px-2 text-center">Phase</th>
                        <th className="py-2 px-2 text-right">Loyer net</th>
                        <th className="py-2 px-2 text-right">Réduction</th>
                        <th className="py-2 px-2 text-right">Cash-flow</th>
                        <th className="py-2 px-2 text-right">Capital net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p=>(
                        <tr key={p.annee} className={`border-b hover:bg-slate-50 ${p.phase === 'Travaux' ? 'bg-amber-50' : ''}`}>
                          <td className="py-2 px-2 font-medium">{p.annee}</td>
                          <td className="py-2 px-2 text-center">{p.phase === 'Travaux' ? '🔧' : '🏠'}</td>
                          <td className="py-2 px-2 text-right text-emerald-600">{p.loyerNet > 0 ? fmtEur(p.loyerNet) : '-'}</td>
                          <td className="py-2 px-2 text-right text-red-600 font-medium">{p.reductionMalraux > 0 ? '+'+fmtEur(p.reductionMalraux) : '-'}</td>
                          <td className={`py-2 px-2 text-right font-medium ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                          <td className="py-2 px-2 text-right">{fmtEur(p.capNet)}</td>
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
                  const levier = safeNumber(synthese.capFinal || synthese.valRev) / apport
                  const effetFiscal = safeNumber(synthese.reductionTotale) / travauxTotal * 100
                  const rendBrut = loyerMensuel * 12 / prixAcquisition * 100
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 8) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 6) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 4) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 2) ptsTRI = 1
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 100) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -200) ptsCF = 1
                  else if (safeNumber(synthese.cfMoyMois) >= -400) ptsCF = 0.5
                  
                  let ptsReduction = 0
                  if (effetFiscal >= 30) ptsReduction = 2.5
                  else if (effetFiscal >= 22) ptsReduction = 2
                  else if (effetFiscal >= 15) ptsReduction = 1.5
                  
                  let ptsLevier = 0
                  if (levier >= 6) ptsLevier = 1.5
                  else if (levier >= 4) ptsLevier = 1
                  else if (levier >= 2) ptsLevier = 0.5
                  
                  let ptsTMI = 0
                  if (tmi >= 45) ptsTMI = 1.5
                  else if (tmi >= 41) ptsTMI = 1
                  else if (tmi >= 30) ptsTMI = 0.5
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsReduction + ptsLevier + ptsTMI
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
                                <span className="w-16 text-right text-xs text-slate-500">{ptsTRI}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTRI >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.tri)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Cash-flow</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : ptsCF >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsCF / 2) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsCF}/2 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtSignedEur(synthese.cfMoyMois)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Réduction</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsReduction >= 2 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsReduction / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsReduction}/2.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{fmtPct(effetFiscal)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">TMI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsTMI >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsTMI / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsTMI}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTMI >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{tmi}%</span>
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
                            <h5 className="font-bold text-slate-700 mb-3">📊 Méthode de calcul du score Malraux</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Cash-flow (2 pts), Réduction ({typeSecteur === 'SPR' ? '30%' : '22%'}) (2.5 pts), Levier (1.5 pts), TMI (1.5 pts).</p>
                            <p className="text-slate-600">Le Malraux est optimisé pour les TMI élevés (41-45%). La réduction est hors plafond des niches fiscales.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3">💼 Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {safeNumber(synthese.tri) > 5 && tmi >= 30 ? (
                      <>
                        <p><strong>✅ Opération très intéressante</strong> : Avec un TMI de {tmi}% et une réduction Malraux de {fmtEur(synthese.reductionTotale)} (hors plafond niches), cette opération est optimale pour les contribuables fortement imposés.</p>
                        <p>Le patrimoine en secteur protégé ({typeSecteur === 'SPR' ? 'SPR avec PSMV' : 'QAD'}) offre un excellent potentiel de valorisation. Capital net final : {fmtEur(synthese.capFinal || synthese.valRev)}.</p>
                      </>
                    ) : tmi >= 30 ? (
                      <>
                        <p><strong>⚖️ Opération à évaluer</strong> : La réduction Malraux de {fmtEur(synthese.reductionTotale)} sur travaux de {fmtEur(travauxTotal)} est significative ({fmtPct(safeNumber(synthese.reductionTotale) / travauxTotal * 100)}).</p>
                        <p>Vérifiez la qualité de l'emplacement et le potentiel locatif après travaux. Les délais ABF (2-4 ans) sont à anticiper.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>⚠️ TMI insuffisant</strong> : Avec un TMI de {tmi}%, le Malraux n'est pas optimal. Ce dispositif est conçu pour les TMI 41-45%.</p>
                        <p>Considérez plutôt le Denormandie (même avantage, zones moins contraintes) ou le déficit foncier pour votre profil fiscal.</p>
                      </>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Le Malraux nécessite des travaux supervisés par l'ABF (Architecte des Bâtiments de France). Délais souvent longs (2-4 ans).</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-red{background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:99px;font-size:12px}.badge-amber{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#dc2626;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px}.pedagogy-box{background:#fee2e2;border:1px solid #fca5a5;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
