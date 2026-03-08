'use client'
 

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import {
  Calendar, User, Home, CreditCard, TrendingUp, Landmark, Sparkles,
  BarChart3, Target, Briefcase, RefreshCw,
} from 'lucide-react'
import { 
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
const _fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

// Barème démembrement CGI art. 669
const BAREME_669 = [
  { ageMax: 20, usufruit: 90 }, { ageMax: 30, usufruit: 80 }, { ageMax: 40, usufruit: 70 },
  { ageMax: 50, usufruit: 60 }, { ageMax: 60, usufruit: 50 }, { ageMax: 70, usufruit: 40 },
  { ageMax: 80, usufruit: 30 }, { ageMax: 90, usufruit: 20 }, { ageMax: Infinity, usufruit: 10 },
]
const getUsufruit = (age: number) => BAREME_669.find(b => age <= b.ageMax)?.usufruit || 10

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type TypeUsufruitier = 'BAILLEUR_SOCIAL' | 'PARTICULIER' | 'SOCIETE'

export default function NuePropPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ÉTAPE 1 : Profil client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(80000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(800000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(200000)
  const [valeurRP, setValeurRP] = useState(400000)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [valeurPP, setValeurPP] = useState(300000)
  const [fraisNotaire, setFraisNotaire] = useState(7)
  const [dureeDemembrement, setDureeDemembrement] = useState(15)
  const [typeUsufruitier, setTypeUsufruitier] = useState<TypeUsufruitier>('BAILLEUR_SOCIAL')
  const [decoteNP, setDecoteNP] = useState(0)
  const [apport, setApport] = useState(60000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [loyerEstimeApres, setLoyerEstimeApres] = useState(1200)
  const [dureePostDemembrement, setDureePostDemembrement] = useState(10)
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
  const anneeFinDemembrement = anneeAcq + dureeDemembrement
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeRevente = anneeAcq + dureeDemembrement + dureePostDemembrement

  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // Calculs préliminaires
  const decoteCalculee = decoteNP > 0 ? decoteNP : Math.round((dureeDemembrement / 20) * 40 + (typeUsufruitier === 'BAILLEUR_SOCIAL' ? 5 : 0))
  const prixNP = valeurPP * (100 - decoteCalculee) / 100
  const fraisNotaireEur = prixNP * fraisNotaire / 100
  const investTotal = prixNP + fraisNotaireEur
  const montantEmprunte = Math.max(0, investTotal - apport)

  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensHorsAss = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens
  const assMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualite = mensHorsAss + assMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION NUE-PROPRIÉTÉ
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/nue-propriete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Profil client
          situationFamiliale,
          enfantsACharge,
          enfantsGardeAlternee,
          parentIsole,
          revenusSalaires,
          revenusFonciersExistants,
          autresRevenus,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          // Bien
          dateAcquisition,
          valeurPP,
          fraisNotaire,
          dureeDemembrement,
          typeUsufruitier,
          decoteNP: decoteNP > 0 ? decoteNP : undefined,
          // Financement
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          // Après démembrement
          loyerEstimeApres,
          optionRevente: false,
          dureePostDemembrement,
          // Charges après démembrement
          taxeFonciereEstimee: 0,
          chargesCoProEstimees: 0,
          assurancePNOEstimee: 0,
          fraisGestion: 0,
          // Projection
          revalorisationBien,
          revalorisationLoyer: 1.5,
          fraisRevente: 5,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: any, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        enDemembrement: p.enDemembrement !== false,
        valBien: p.valeurBien || 0,
        valNP: p.valeurNP || 0,
        loyerNet: p.loyerNet || 0,
        ir: p.ir || 0,
        ps: p.ps || 0,
        creditAn: p.echeanceCredit || 0,
        cfNet: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        capNet: p.capitalNet || 0,
      }))

      setSynthese({
        valeurPP,
        prixNP: result.nuePropriete?.prixNP ?? prixNP,
        decoteCalculee: result.nuePropriete?.decote ?? decoteCalculee,
        investTotal: result.synthese.investTotal,
        apport: result.synthese.apport ?? apport,
        montantEmprunte: result.synthese.montantEmprunte,
        mensualite: result.synthese.mensualite,
        dureeDemembrement,
        pvLatente: result.nuePropriete?.plusValueLatente ?? 0,
        economieIFI: result.nuePropriete?.economieIFI ?? 0,
        tri: result.synthese.tri,
        cfCum: result.synthese.cashFlowCumule,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule ?? 0,
        valRev: result.plusValue?.valeurRevente ?? 0,
        pvBrute: result.plusValue?.plusValueBrute ?? 0,
        pvCalc: result.plusValue ?? {},
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
      })

      setAlertes(result.alertes || [])
      setExplications([
        `═══ NUE-PROPRIÉTÉ - SYNTHÈSE ═══`,
        ``,
        `① DÉCOTE : ${fmtPct(decoteCalculee)} (${fmtEur(Math.round(valeurPP - prixNP))})`,
        `② ÉCONOMIE IFI : ${fmtEur(result.nuePropriete?.economieIFI || 0)}`,
        `③ TRI : ${fmtPct(result.synthese.tri)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Nue-Propriété:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    valeurPP, fraisNotaire, dureeDemembrement, typeUsufruitier, decoteNP,
    apport, tauxCredit, dureeCredit, assuranceCredit, revalorisationBien,
    loyerEstimeApres, dureePostDemembrement, dateAcquisition,
    decoteCalculee, prixNP,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as any).Plotly; if (!P) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) P.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.cfNet), type: 'bar', name: 'Cash-flow', marker: { color: projections.map(p => p.enDemembrement ? '#f97316' : '#10b981') } },
      { x: years, y: projections.map(p => p.creditAn * -1), type: 'scatter', name: 'Crédit annuel', line: { color: '#94a3b8', width: 1, dash: 'dot' } },
    ], { title: 'Cash-flow par phase', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.2 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) P.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur bien', line: { color: '#1d4ed8' } },
      { x: years, y: projections.map(p => p.capNet), name: 'Capital net', line: { color: '#10b981', width: 3 } },
    ], { title: 'Patrimoine', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.2 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6"><div className="flex items-center gap-4"><Calendar className="w-9 h-9 text-teal-700" /><div><h1 className="text-2xl font-bold">Simulateur Nue-Propriété</h1><p className="text-gray-600">Démembrement temporaire • ULS • Hors IFI</p></div></div><div className="flex gap-2 mt-3"><span className="badge-teal">-{decoteCalculee}% décote</span><span className="badge-green">Hors IFI</span><span className="badge-blue">0 IR pendant {dureeDemembrement} ans</span></div></div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-teal-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><User className="w-5 h-5" /> Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">La nue-propriété est particulièrement avantageuse pour les contribuables IFI</p>
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
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-teal-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                {ifiAvant.assujetti && <div className="pedagogy-box mt-4"><p className="text-sm text-teal-700"><strong>Avantage IFI :</strong> La nue-propriété est <strong>exclue de l'assiette IFI</strong> (CGI art. 965). Avec un IFI actuel de {fmtEur(ifiAvant.impotNet)}, cet investissement peut significativement réduire votre imposition.</p></div>}
              </div>}

              {/* ÉTAPE 2 : BIEN EN DÉMEMBREMENT */}
              {step === 2 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Home className="w-5 h-5" /> Bien en démembrement</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Valeur pleine propriété (€)</label><input type="number" value={valeurPP} onChange={e=>setValeurPP(+e.target.value)}/></div><div className="form-group"><label>Durée démembrement (ans)</label><input type="number" value={dureeDemembrement} onChange={e=>setDureeDemembrement(+e.target.value)} min={5} max={20}/></div><div className="form-group"><label>Type usufruitier</label><select value={typeUsufruitier} onChange={e=>setTypeUsufruitier(e.target.value as TypeUsufruitier)}><option value="BAILLEUR_SOCIAL">Bailleur social (ULS)</option><option value="PARTICULIER">Particulier</option><option value="SOCIETE">Société</option></select></div><div className="form-group"><label>Décote NP (%)</label><input type="number" value={decoteCalculee} onChange={e=>setDecoteNP(+e.target.value)}/><span className="form-hint">~{Math.round(dureeDemembrement*2)}% pour {dureeDemembrement} ans</span></div><div className="form-group"><label>Frais notaire (%)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)} step={0.5}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Prix NP</span><div className="font-bold text-lg text-teal-600">{fmtEur(prixNP)}</div></div><div><span className="text-gray-500">Valeur PP</span><div className="font-bold text-lg">{fmtEur(valeurPP)}</div></div><div><span className="text-gray-500">PV latente</span><div className="font-bold text-lg text-green-600">+{fmtEur(valeurPP - prixNP)}</div></div></div></div>}

              {step === 3 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Financement</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="form-group"><label>Apport (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/></div><div className="form-group"><label>Taux (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div><div className="form-group"><label>Assurance (%)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.05}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Investissement</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div><div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div><div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div></div><div className="pedagogy-box mt-4"><p className="text-sm text-teal-700">Pendant le démembrement, pas de revenus mais crédit à rembourser. Privilégiez un crédit plus court ou un apport important.</p></div></div>}

              {step === 4 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Après démembrement</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Loyer estimé après (€/mois)</label><input type="number" value={loyerEstimeApres} onChange={e=>setLoyerEstimeApres(+e.target.value)}/></div><div className="form-group"><label>Revalo bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Durée post-démembrement (ans)</label><input type="number" value={dureePostDemembrement} onChange={e=>setDureePostDemembrement(+e.target.value)}/></div></div></div>}

              {step === 5 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Landmark className="w-5 h-5" /> Récapitulatif fiscal</h2><div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm"><div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div><div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div><div><span className="text-gray-500">IFI actuel</span><div className="font-bold text-lg text-orange-600">{fmtEur(ifiAvant.impotNet)}</div></div><div><span className="text-gray-500">Patrimoine immo.</span><div className="font-bold text-lg">{fmtEur(patrimoineImmobilierExistant)}</div></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-teal-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Avantages nue-propriété</h4><ul className="text-sm text-teal-700 space-y-1"><li><strong>Hors IFI</strong> : NP exclue de l'assiette IFI (économie potentielle {fmtEur(Math.round(prixNP * 0.007))} sur {dureeDemembrement} ans)</li><li><strong>Pas d'IR</strong> sur les loyers (perçus par l'usufruitier)</li><li><strong>Décote à l'achat</strong> de {decoteCalculee}%</li><li><strong>Récupération PP</strong> sans fiscalité</li><li><strong>Bien entretenu</strong> par l'usufruitier</li></ul></div></div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 5 ? <button onClick={()=>setStep(step+1)} className="btn-primary-teal">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-teal">{loading ? 'Calcul...' : 'Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL & IFI */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Avantages fiscaux de la nue-propriété</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="text-teal-600 text-xs mb-1">Décote à l'achat</div>
                    <div className="font-bold text-lg text-teal-600">{fmtPct(decoteCalculee)}</div>
                    <div className="text-xs text-teal-400">Soit {fmtEur(valeurPP - prixNP)} économisé</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs mb-1">Hors IFI</div>
                    <div className="font-bold text-lg text-emerald-600">{dureeDemembrement} ans</div>
                    <div className="text-xs text-emerald-400">Économie : {fmtEur(synthese.economieIFI)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">Pas d'IR pendant</div>
                    <div className="font-bold text-lg text-slate-800">{dureeDemembrement} ans</div>
                    <div className="text-xs text-slate-400">Revenus = 0</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-xs mb-1">Récupération PP</div>
                    <div className="font-bold text-lg text-blue-600">Sans fiscalité</div>
                    <div className="text-xs text-blue-400">Gratuite à terme</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <h4 className="font-semibold text-teal-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre la nue-propriété</h4>
                  <div className="text-sm text-teal-700 space-y-1">
                    <p>• <strong>Décote {fmtPct(decoteCalculee)}</strong> : Vous achetez {fmtEur(prixNP)} un bien valant {fmtEur(valeurPP)} en PP.</p>
                    <p>• <strong>IFI</strong> : La NP est hors assiette IFI (art. 965 CGI). {ifiAvant.assujetti ? `Vous économisez environ ${fmtEur(Math.round(prixNP * 0.007 * dureeDemembrement))} d'IFI sur ${dureeDemembrement} ans.` : 'Vous n\'êtes pas assujetti actuellement.'}</p>
                    <p>• <strong>Reconstitution PP</strong> : À terme ({dureeDemembrement} ans), vous récupérez la pleine propriété automatiquement, sans fiscalité.</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
                    <div className="text-xs text-teal-600 mb-1">Décote</div>
                    <div className="text-xl font-bold text-teal-600">{fmtPct(synthese.decoteCalculee)}</div>
                    <div className="text-xs text-slate-400 mt-1">{dureeDemembrement} ans</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">PV latente</div>
                    <div className="text-xl font-bold text-emerald-600">+{fmtEur(synthese.pvLatente)}</div>
                    <div className="text-xs text-slate-400 mt-1">Dès jour 1</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 6 ? 'Excellent' : synthese.tri > 4 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
                    <div className="text-xs text-teal-600 mb-1">Éco. IFI</div>
                    <div className="text-xl font-bold text-teal-600">{fmtEur(synthese.economieIFI)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDemembrement} ans</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfCum >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>CF cumulé</div>
                    <div className={`text-xl font-bold ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfCum >= 0 ? '+' : ''}{fmtEur(synthese.cfCum)}</div>
                    <div className="text-xs text-slate-400 mt-1">NP + PP</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">+{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Patrimoine net</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : {synthese.tri > 6 ? 'Excellente performance pour une acquisition en NP.' : synthese.tri > 4 ? 'Performance satisfaisante.' : 'Performance à évaluer.'}</p>
                    <p>• <strong>Stratégie patrimoniale</strong> : Pas de revenus pendant {dureeDemembrement} ans mais constitution d'un patrimoine à coût réduit.</p>
                    <p>• <strong>Effort de trésorerie</strong> : {montantEmprunte > 0 ? `Crédit de ${fmtEur(Math.round(mensualite))}/mois sans revenus locatifs pour compenser.` : 'Pas de crédit, effort limité à l\'apport initial.'}</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 1 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow (NP puis PP)</h3>
                <p className="text-sm text-slate-500 mb-4">Trésorerie pendant le démembrement puis après récupération de la pleine propriété.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p><strong className="text-amber-600">Phase NP ({dureeDemembrement} ans)</strong> : Pas de revenus mais crédit à rembourser = effort mensuel de {fmtEur(Math.round(mensualite))}.</p>
                    <p><strong className="text-emerald-600">Phase PP ({dureePostDemembrement} ans)</strong> : Revenus locatifs de {fmtEur(loyerEstimeApres)}/mois estimés, compensant l'effort initial.</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 2 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine</h3>
                <p className="text-sm text-slate-500 mb-4">Valeur du bien et capitalisation progressive.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Vous achetez {fmtEur(prixNP)} un bien valant {fmtEur(valeurPP)} = <strong className="text-emerald-600">+{fmtEur(synthese.pvLatente)} de PV latente immédiate</strong>.</p>
                    <p>Avec +{fmtPct(revalorisationBien)}/an, le bien vaudra {fmtEur(Math.round(valeurPP * Math.pow(1 + revalorisationBien / 100, dureeDemembrement + dureePostDemembrement)))} après {dureeDemembrement + dureePostDemembrement} ans.</p>
                  </div>
                </div>
              </div>

              {/* DÉTAIL CALCUL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Détail du calcul</h3>
                <details>
                  <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul nue-propriété</summary>
                  <pre className="text-xs bg-slate-50 p-4 rounded-lg mt-2 whitespace-pre-wrap font-mono overflow-x-auto border border-slate-200">{explications.join('\n')}</pre>
                </details>
              </div>

              {/* TABLEAU DES PROJECTIONS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Projection sur {dureeDemembrement + dureePostDemembrement} ans</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="py-2 px-2 text-left font-semibold text-slate-600">Année</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Valeur</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-emerald-50">Loyer</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">IR+PS</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-2 text-center font-semibold text-slate-600">Phase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 hover:bg-slate-50 ${p.enDemembrement ? 'bg-amber-50/30' : 'bg-emerald-50/20'}`}>
                          <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-2 px-2 text-right text-blue-600 font-medium">{fmtEur(p.valNP)}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 bg-emerald-50/50">{p.loyerNet > 0 ? '+' + fmtEur(p.loyerNet) : '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{p.ir + p.ps > 0 ? fmtEur(p.ir + p.ps) : '-'}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${p.cfNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfNet >= 0 ? '+' : ''}{fmtEur(p.cfNet)}</td>
                          <td className="py-2 px-2 text-center">{p.enDemembrement ? <span className="text-amber-600">NP</span> : <span className="text-emerald-600">PP</span>}</td>
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
                <h3 className="font-bold mb-6 text-xl text-slate-800 flex items-center gap-2"><Target className="w-5 h-5" /> Synthèse et avis professionnel</h3>
                
                {(() => {
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 8) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 6) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 4) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 2) ptsTRI = 1
                  
                  let ptsDecote = 0
                  if (decoteCalculee >= 50) ptsDecote = 2.5
                  else if (decoteCalculee >= 40) ptsDecote = 2
                  else if (decoteCalculee >= 30) ptsDecote = 1.5
                  else if (decoteCalculee >= 20) ptsDecote = 1
                  
                  let ptsIFI = 0
                  if (safeNumber(synthese.economieIFI) >= 30000) ptsIFI = 2
                  else if (safeNumber(synthese.economieIFI) >= 15000) ptsIFI = 1.5
                  else if (safeNumber(synthese.economieIFI) >= 5000) ptsIFI = 1
                  else if (safeNumber(synthese.economieIFI) > 0) ptsIFI = 0.5
                  
                  let ptsPV = 0
                  if (safeNumber(synthese.pvLatente) / prixNP >= 0.5) ptsPV = 2
                  else if (safeNumber(synthese.pvLatente) / prixNP >= 0.3) ptsPV = 1.5
                  else if (safeNumber(synthese.pvLatente) / prixNP >= 0.2) ptsPV = 1
                  
                  let ptsDuree = 0
                  if (dureeDemembrement >= 15) ptsDuree = 1
                  else if (dureeDemembrement >= 12) ptsDuree = 0.75
                  else if (dureeDemembrement >= 10) ptsDuree = 0.5
                  
                  const scoreTotal = ptsTRI + ptsDecote + ptsIFI + ptsPV + ptsDuree
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
                                <span className="w-20 text-slate-600">Décote</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsDecote >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsDecote / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsDecote}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsDecote >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(decoteCalculee)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Éco. IFI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsIFI >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsIFI / 2) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsIFI}/2 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsIFI >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtEur(synthese.economieIFI)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">PV latente</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsPV / 2) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsPV}/2 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{fmtEur(synthese.pvLatente)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Durée</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsDuree / 1) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsDuree}/1 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{dureeDemembrement} ans</span>
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
                            <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Méthode de calcul du score Nue-Propriété</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Décote (2.5 pts), Économie IFI (2 pts), PV latente (2 pts), Durée démembrement (1 pt).</p>
                            <p className="text-slate-600">La NP est idéale pour patrimoine IFI ou préparation retraite. Pas de revenus mais capitalisation optimale.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {ifiAvant.assujetti || patrimoineImmobilierExistant > 800000 ? (
                      <p><strong>Stratégie IFI pertinente</strong> : Avec un patrimoine immobilier de {fmtEur(patrimoineImmobilierExistant)}, l'acquisition en NP permet d'éviter {fmtEur(synthese.economieIFI)} d'IFI tout en constituant un patrimoine à coût réduit.</p>
                    ) : safeNumber(synthese.tri) > 5 ? (
                      <p><strong>Excellente opération patrimoniale</strong> : TRI de {fmtPct(synthese.tri)} et décote de {fmtPct(decoteCalculee)} pour une stratégie long terme efficace.</p>
                    ) : (
                      <p><strong>Stratégie de capitalisation</strong> : La NP est idéale pour constituer un patrimoine sans revenus immédiats. Pensez à l'impact sur votre trésorerie pendant le démembrement.</p>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Nue-propriété : idéale pour les investisseurs patrimoniaux souhaitant optimiser l'IFI ou préparer leur retraite.</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={()=>setShowResults(false)} className="btn-primary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-teal{background:#ccfbf1;color:#0f766e;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#14b8a6;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px}.pedagogy-box{background:#ccfbf1;border:1px solid #5eead4;border-radius:12px;padding:16px}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:16px;color:#0f766e}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
