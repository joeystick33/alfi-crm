'use client'
 

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import {
  Wrench, User, Home, Calendar, CreditCard, Wallet, FileText, Landmark,
  BarChart3, TrendingUp, Target, Briefcase, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { 
  LOCATION_NUE_DISPLAY as LOCATION_NUE, 
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

export default function DeficitFoncierPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [_showDetailedTable, _setShowDetailedTable] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PROFIL CLIENT COMPLET (OBLIGATOIRE)
  // ══════════════════════════════════════════════════════════════════════════
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(80000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  
  // Patrimoine existant (pour IFI)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(350000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(150000)
  const [valeurRP, setValeurRP] = useState(350000)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : BIEN À RÉNOVER
  // ══════════════════════════════════════════════════════════════════════════
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [prixAchat, setPrixAchat] = useState(150000)
  const [fraisNotaire, setFraisNotaire] = useState(12000)
  const [travauxTotal, setTravauxTotal] = useState(80000)
  const [travauxRenovEnergetique, setTravauxRenovEnergetique] = useState(30000)
  const [travauxAnnee1, setTravauxAnnee1] = useState(50000)
  const [travauxAnnee2, setTravauxAnnee2] = useState(30000)
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(50000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(15)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [loyerMensuel, setLoyerMensuel] = useState(800)
  const [chargesLocatives, setChargesLocatives] = useState(0)
  const [vacanceSemaines, setVacanceSemaines] = useState(4)
  const [taxeFonciere, setTaxeFonciere] = useState(1000)
  const [chargesCopro, setChargesCopro] = useState(1200)
  const [assurancePNO, setAssurancePNO] = useState(200)
  const [autresRevenusFonciers, setAutresRevenusFonciers] = useState(15000)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [dureeDetention, setDureeDetention] = useState(15)
  const [fraisRevente, setFraisRevente] = useState(5)
  const [fraisGestion, setFraisGestion] = useState(7)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenusFonciersTotal = revenusFonciersExistants + autresRevenusFonciers
  const revenusTotaux = revenusSalaires + revenusFonciersTotal + autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi
  
  // IFI avant investissement
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: patrimoineImmobilierExistant,
    dettesDeductibles: dettesImmobilieres,
    valeurRP: valeurRP
  })

  // Dates clés
  const [anneeAcq, moisAcq] = dateAcquisition.split('-').map(Number)
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

  // Calculs
  const investTotal = prixAchat + fraisNotaire + travauxTotal
  const montantEmprunte = Math.max(0, investTotal - apport)
  const loyerAnnuel = loyerMensuel * 12 * (1 - vacanceSemaines / 52)
  const chargesAnnuelles = taxeFonciere + chargesCopro + assurancePNO + chargesLocatives
  
  // Plafond déficit imputable sur RG
  const plafondDeficitRG = travauxRenovEnergetique > 0 ? LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE : LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG
  
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensHorsAss = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens
  const assMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualite = mensHorsAss + assMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION DÉFICIT FONCIER
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const dureeTravaux = travauxAnnee1 > 0 && travauxAnnee2 > 0 ? 2 : 1
      const payload = {
        situationFamiliale,
        enfantsACharge,
        enfantsGardeAlternee,
        parentIsole,
        revenusSalaires,
        revenusFonciersExistants: revenusFonciersTotal,
        autresRevenus,
        patrimoineImmobilierExistant,
        dettesImmobilieres,
        valeurRP,
        dateAcquisition,
        prixAcquisition: prixAchat,
        fraisNotaire,
        travaux: travauxTotal,
        travauxRenovEnergetique,
        dureeTravaux,
        apport,
        tauxCredit,
        dureeCredit,
        assuranceCredit,
        loyerMensuel,
        chargesLocatives,
        vacanceSemaines,
        revalorisationLoyer,
        taxeFonciere,
        chargesCopro,
        assurancePNO,
        fraisGestion,
        revalorisationBien,
        dureeDetention,
        fraisRevente,
      }

      const response = await fetch('/api/advisor/simulators/immobilier/deficit-foncier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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
        travauxAn: p.travauxAn || 0,
        resultatFoncierBrut: p.resultatFoncierBrut || 0,
        resultatFoncierGlobal: p.resultatFoncierGlobal || 0,
        deficitImputeRG: p.deficitImputeRG || 0,
        deficitReportable: p.deficitReportable || 0,
        baseImposableRF: p.baseImposableRF || 0,
        economieIR: p.economieIR || 0,
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
        apport,
        montantEmprunte: result.synthese.montantEmprunte,
        mensualite: result.synthese.mensualite,
        travauxTotal,
        plafondDeficit: result.deficitFoncier?.plafondImputation ?? plafondDeficitRG,
        totEcoIR: result.deficitFoncier?.economieIRCumulee || 0,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule || 0,
        deficitReportable: result.deficitFoncier?.deficitReportable || 0,
        tri: result.synthese.tri,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel || Math.round(result.synthese.cashFlowCumule / dureeDetention / 12),
        cfCum: result.synthese.cashFlowCumule,
        valRev: result.plusValue?.valeurRevente || 0,
        pvBrute: result.plusValue?.plusValueBrute || 0,
        pvCalc: result.plusValue || {},
        capFinal: result.synthese.capitalFinal || (result.synthese.gainTotal + apport),
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinCredit,
        anneeExonerationIR,
        anneeExonerationPS,
        anneeRevente: anneeAcq + dureeDetention - 1,
        profilClient: {
          nombreParts: result.profilClient.nombreParts,
          revenuTotalAvant: revenusTotaux,
          irAvant: result.profilClient.irAvant,
          tmiAvant: result.profilClient.tmi,
          ifiAvant: result.profilClient.ifiAvant,
          assujettiIFIAvant: result.profilClient.assujettiIFIAvant,
          ifiApres: result.profilClient.ifiApres,
          assujettiIFIApres: result.profilClient.assujettiIFIApres,
          impactIFI: result.profilClient.ifiApres - result.profilClient.ifiAvant,
        },
      })

      setAlertes(result.alertes || [])
      setExplications([
        `═══ DÉFICIT FONCIER - SYNTHÈSE ═══`,
        ``,
        `① ÉCONOMIE IR TOTALE : ${fmtEur(result.deficitFoncier?.economieIRCumulee || 0)}`,
        `② DÉFICIT REPORTABLE : ${fmtEur(result.deficitFoncier?.deficitReportable || 0)}`,
        `③ TRI : ${fmtPct(result.synthese.tri)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Déficit Foncier:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus, autresRevenusFonciers,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAchat, fraisNotaire, travauxTotal, travauxRenovEnergetique,
    travauxAnnee1, travauxAnnee2, apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, chargesLocatives, vacanceSemaines, taxeFonciere, chargesCopro,
    assurancePNO, fraisGestion, revalorisationLoyer, revalorisationBien,
    dureeDetention, fraisRevente, plafondDeficitRG,
    anneeAcq, anneeFinCredit, anneeExonerationIR, anneeExonerationPS,
  ])

  useEffect(() => {
    if (!showResults || !projections.length) return
    const P = (window as any).Plotly; if (!P) return
    // Graphique 1 : Impact fiscal (années réelles)
    if (chartRef1.current) P.newPlot(chartRef1.current, [
      { x: projections.map(p => String(p.annee)), y: projections.map(p => p.economieIR), type: 'bar', name: 'Économie IR', marker: { color: '#10b981' } },
      { x: projections.map(p => String(p.annee)), y: projections.map(p => -p.impotIR - p.ps), type: 'bar', name: 'IR+PS payés', marker: { color: '#ef4444' } },
    ], { title: 'Impact fiscal annuel', height: 280, margin: { t: 40, b: 40, l: 60, r: 20 }, paper_bgcolor: 'transparent', barmode: 'relative', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    // Graphique 2 : Déficit reportable (années réelles)
    if (chartRef2.current) P.newPlot(chartRef2.current, [
      { x: projections.map(p => String(p.annee)), y: projections.map(p => p.deficitReportable), name: 'Déficit reportable', type: 'scatter', fill: 'tozeroy', line: { color: '#f59e0b' } },
    ], { title: 'Stock de déficit reportable', height: 280, margin: { t: 40, b: 40, l: 60, r: 20 }, paper_bgcolor: 'transparent', xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6"><div className="flex items-center gap-4"><Wrench className="w-9 h-9 text-amber-700" /><div><h1 className="text-2xl font-bold">Simulateur Déficit Foncier</h1><p className="text-gray-600">Travaux déductibles • Imputation sur revenu global • Report 10 ans</p></div></div><div className="flex gap-2 mt-3"><span className="badge-amber">Max {fmtEur(plafondDeficitRG)}/an</span><span className="badge-green">TMI {tmi}%</span><span className="badge-blue">Report 10 ans</span></div></div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><User className="w-5 h-5" /> Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">Le déficit foncier s'impute sur le revenu global - plus votre TMI est élevé, plus l'économie est importante</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Situation familiale</label><select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}><option value="CELIBATAIRE">Célibataire</option><option value="MARIE_PACSE">Marié / Pacsé</option><option value="VEUF">Veuf</option></select></div>
                  <div className="form-group"><label>Enfants à charge</label><input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Enfants garde alternée</label><input type="number" value={enfantsGardeAlternee} onChange={e=>setEnfantsGardeAlternee(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Parent isolé</label><select value={parentIsole ? 'OUI' : 'NON'} onChange={e=>setParentIsole(e.target.value === 'OUI')}><option value="NON">Non</option><option value="OUI">Oui</option></select></div>
                  <div className="form-group"><label>Revenus salaires (€/an)</label><input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/></div>
                  <div className="form-group"><label>Revenus fonciers existants (€)</label><input type="number" value={revenusFonciersExistants} onChange={e=>setRevenusFonciersExistants(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres revenus (€)</label><input type="number" value={autresRevenus} onChange={e=>setAutresRevenus(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres biens locatifs (€/an)</label><input type="number" value={autresRevenusFonciers} onChange={e=>setAutresRevenusFonciers(+e.target.value)}/><span className="form-hint">Le déficit absorbe d'abord ces revenus</span></div>
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
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-amber-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-amber-700"><strong>Pourquoi le TMI est crucial ?</strong> Un déficit de 10 700 € génère une économie de {fmtEur(Math.round(10700 * tmi / 100))} avec votre TMI de {tmi}%. Avec TMI 45%, ce serait {fmtEur(Math.round(10700 * 0.45))}.</p></div>
              </div>}

              {/* ÉTAPE 2 : BIEN À RÉNOVER */}
              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Home className="w-5 h-5" /> Bien à rénover</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)}/></div>
                  <div className="form-group"><label>Prix d'acquisition (€)</label><input type="number" value={prixAchat} onChange={e=>setPrixAchat(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/></div>
                  <div className="form-group"><label>Travaux total (€)</label><input type="number" value={travauxTotal} onChange={e=>setTravauxTotal(+e.target.value)}/></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2"><Wrench className="w-4 h-4" /> Travaux déductibles (CGI art. 31)</h4><div className="grid grid-cols-2 gap-4 text-sm text-amber-700"><div><strong>Déductibles :</strong><ul className="mt-1 space-y-1"><li>• Réparations, entretien</li><li>• Amélioration (confort, habitabilité)</li><li>• Rénovation énergétique</li></ul></div><div><strong>Non déductibles :</strong><ul className="mt-1 space-y-1"><li>• Construction, reconstruction</li><li>• Agrandissement</li><li>• Travaux sur parties non louées</li></ul></div></div></div>
              </div>}

              {/* ÉTAPE 3 : TRAVAUX - RÉPARTITION */}
              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Répartition travaux</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Travaux année 1 (€)</label><input type="number" value={travauxAnnee1} onChange={e=>setTravauxAnnee1(+e.target.value)}/></div>
                  <div className="form-group"><label>Travaux année 2 (€)</label><input type="number" value={travauxAnnee2} onChange={e=>setTravauxAnnee2(+e.target.value)}/></div>
                  <div className="form-group"><label>Dont rénovation énergétique (€)</label><input type="number" value={travauxRenovEnergetique} onChange={e=>setTravauxRenovEnergetique(+e.target.value)}/><span className="form-hint">Plafond doublé jusqu'au 31/12/2025</span></div>
                </div>
                <div className={`info-box mt-4 ${travauxRenovEnergetique > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Plafond déficit sur RG :</strong><div className="text-2xl font-bold text-amber-600">{fmtEur(plafondDeficitRG)}/an</div></div>
                    <div><strong>Économie IR maximale :</strong><div className="text-2xl font-bold text-emerald-600">{fmtEur(Math.round(plafondDeficitRG * tmi / 100))}/an</div></div>
                  </div>
                  {travauxRenovEnergetique > 0 && <p className="text-sm text-green-700 mt-2">Plafond doublé à 21 400 € car travaux de rénovation énergétique (dispositif jusqu'au 31/12/2025)</p>}
                  {travauxRenovEnergetique === 0 && <p className="text-sm text-amber-700 mt-2">Ajoutez des travaux de rénovation énergétique pour doubler le plafond (21 400 € au lieu de 10 700 €)</p>}
                </div>
              </div>}

              {/* ÉTAPE 4 : FINANCEMENT */}
              {step === 4 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Financement</h2>
                
                {/* Option achat comptant */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sansFinancement}
                      onChange={(e) => {
                        setSansFinancement(e.target.checked)
                        if (e.target.checked) setApport(investTotal)
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 flex items-center gap-2"><Wallet className="w-4 h-4" /> Achat au comptant (sans financement)</span>
                      <p className="text-sm text-slate-500">Cochez cette case si le client ne passe pas par un crédit immobilier</p>
                    </div>
                  </label>
                </div>
                
                {sansFinancement ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <Wallet className="w-9 h-9 text-emerald-600 mb-3" />
                    <h3 className="font-bold text-emerald-800 text-lg mb-2">Achat au comptant</h3>
                    <p className="text-emerald-700">Investissement total : <strong className="text-xl">{fmtEur(investTotal)}</strong></p>
                    <p className="text-sm text-emerald-600 mt-2">Pas de crédit = pas d'intérêts. Le déficit foncier sera constitué uniquement des travaux et charges.</p>
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
                      <div><span className="text-gray-500">Investissement total</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                      <div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                      <div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div>
                    </div>
                    <div className="pedagogy-box mt-4"><p className="text-sm text-amber-700"><strong>Attention :</strong> Les intérêts d'emprunt ne peuvent s'imputer que sur les revenus fonciers (pas sur le RG). Seul le déficit hors intérêts s'impute sur le revenu global.</p></div>
                  </>
                )}
              </div>}

              {/* ÉTAPE 5 : REVENUS LOCATIFS */}
              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> Revenus locatifs</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Loyer mensuel (€)</label><input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)}/></div>
                  <div className="form-group"><label>Vacance (semaines/an)</label><input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52}/></div>
                  <div className="form-group"><label>Revalorisation loyer (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Charges locatives (€)</label><input type="number" value={chargesLocatives} onChange={e=>setChargesLocatives(+e.target.value)}/><span className="form-hint">Charges récupérées auprès du locataire</span></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Loyer annuel brut</span><div className="font-bold text-lg">{fmtEur(loyerMensuel * 12)}</div></div>
                  <div><span className="text-gray-500">Taux vacance</span><div className="font-bold text-lg">{fmtPct(vacanceSemaines / 52 * 100)}</div></div>
                  <div><span className="text-gray-500">Loyer annuel net</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerAnnuel))}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 6 : CHARGES */}
              {step === 6 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><FileText className="w-5 h-5" /> Charges déductibles</h2>
                <p className="text-sm text-gray-500 mb-6">Ces charges s'ajoutent aux travaux pour créer le déficit foncier</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/></div>
                  <div className="form-group"><label>Charges copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div>
                  <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais gestion (%)</label><input type="number" value={fraisGestion} onChange={e=>setFraisGestion(+e.target.value)} step={0.5}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Charges totales/an</span><div className="font-bold text-lg">{fmtEur(chargesAnnuelles)}</div></div>
                  <div><span className="text-gray-500">Ratio charges/loyers</span><div className="font-bold text-lg">{fmtPct(chargesAnnuelles / (loyerMensuel * 12 || 1) * 100)}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 7 : PROJECTION */}
              {step === 7 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Landmark className="w-5 h-5" /> Projection</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Durée détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={3}/><span className="form-hint">Min 3 ans obligatoire</span></div>
                  <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div>
                  <div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div>
                  <div><span className="text-gray-500">Plafond déficit RG</span><div className="font-bold text-lg text-amber-600">{fmtEur(plafondDeficitRG)}</div></div>
                  <div><span className="text-gray-500">Économie max/an</span><div className="font-bold text-lg text-emerald-600">{fmtEur(Math.round(plafondDeficitRG * tmi / 100))}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Obligations légales (CGI art. 156-I-3°)</h4><ul className="text-sm text-amber-700 space-y-1">
                  <li>• <strong>Engagement 3 ans :</strong> Le bien doit rester loué jusqu'au 31/12 de la 3e année suivant l'imputation</li>
                  <li>• <strong>Plafond :</strong> {fmtEur(plafondDeficitRG)}/an {travauxRenovEnergetique > 0 ? '(doublé car rénovation énergétique)' : '(10 700 € sans rénovation énergétique)'}</li>
                  <li>• <strong>Report :</strong> L'excédent est reportable 10 ans sur les revenus fonciers futurs</li>
                  <li>• <strong>Intérêts :</strong> Ne s'imputent QUE sur les revenus fonciers (pas sur le RG)</li>
                </ul></div>
              </div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary-amber">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-amber">{loading ? 'Calcul...' : 'Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL GLOBAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">Économie IR totale</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(synthese.totEcoIR)}</div>
                    <div className="text-xs text-amber-400">{fmtEur(Math.round(synthese.totEcoIR / Math.min(dureeDetention, 4)))}/an</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">Déficit reportable</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.deficitReportable)}</div>
                    <div className="text-xs text-slate-400">10 ans sur RF</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs mb-1">Plafond utilisé</div>
                    <div className="font-bold text-lg text-emerald-600">{fmtEur(synthese.plafondDeficit)}</div>
                    <div className="text-xs text-emerald-400">{synthese.plafondDeficit === LOCATION_NUE.DEFICIT_FONCIER.PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE ? 'Doublé' : 'Standard'}</div>
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
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre le déficit foncier</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>• <strong>Imputation sur RG</strong> : Le déficit foncier (hors intérêts) s'impute sur le revenu global dans la limite de {fmtEur(synthese.plafondDeficit)}/an, réduisant directement votre IR.</p>
                    <p>• <strong>Économie réelle</strong> : Avec un TMI de {tmi}%, {fmtEur(synthese.plafondDeficit)} de déficit = {fmtEur(Math.round(synthese.plafondDeficit * tmi / 100))} d'économie d'IR.</p>
                    <p>• <strong>Report</strong> : Le déficit excédentaire ({fmtEur(synthese.deficitReportable)}) est reportable 10 ans sur les revenus fonciers futurs.</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <div className="text-xs text-amber-600 mb-1">Économie IR</div>
                    <div className="text-xl font-bold text-amber-600">{fmtEur(synthese.totEcoIR)}</div>
                    <div className="text-xs text-slate-400 mt-1">TMI {tmi}%</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 8 ? 'Excellent' : synthese.tri > 5 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfMoyMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.cfMoyMois > 100 ? 'Autofinancé' : synthese.cfMoyMois >= 0 ? 'Équilibré' : 'Effort mensuel'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">IR payé</div>
                    <div className="text-xl font-bold text-slate-700">{fmtEur(synthese.totIR)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Valeur finale</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.valRev)}</div>
                    <div className="text-xs text-slate-400 mt-1">+{fmtPct(revalorisationBien)}/an</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Patrimoine + CF</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>Rendement brut {fmtPct(loyerMensuel * 12 / prixAchat * 100)}</strong> : {loyerMensuel * 12 / prixAchat * 100 > 5 ? 'Supérieur à la moyenne.' : 'Dans la moyenne du marché.'}</p>
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : Intègre l'économie fiscale, les loyers et la plus-value. {synthese.tri > 8 ? 'Excellente performance.' : synthese.tri > 5 ? 'Performance satisfaisante.' : 'À optimiser.'}</p>
                    <p>• <strong>Effet fiscal</strong> : L'économie d'IR de {fmtEur(synthese.totEcoIR)} représente {fmtPct(synthese.totEcoIR / travauxTotal * 100)} du montant des travaux.</p>
                  </div>
                </div>
              </div>

              {/* TIMELINE DES ÉVÉNEMENTS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5" /> Timeline des événements clés</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-200" />
                  <div className="space-y-4">
                    <div className="relative flex items-start pl-10">
                      <div className="absolute left-2.5 w-3 h-3 bg-amber-600 rounded-full border-2 border-white" />
                      <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <div className="font-semibold text-amber-800">{synthese.anneeAcquisition}</div>
                        <div className="text-sm text-amber-700">Acquisition + Travaux • Investissement {fmtEur(synthese.investTotal)}</div>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className="absolute left-2.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                      <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <div className="font-semibold text-amber-800">{synthese.anneeAcquisition + 3}</div>
                        <div className="text-sm text-amber-700">Fin engagement location (3 ans minimum après déficit)</div>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className="absolute left-2.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                        <div className="font-semibold text-emerald-800">{synthese.anneeFinCredit}</div>
                        <div className="text-sm text-emerald-700">Fin du crédit immobilier</div>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className="absolute left-2.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                      <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-800">{synthese.anneeExonerationIR}</div>
                        <div className="text-sm text-blue-700">Exonération PV IR (22 ans)</div>
                      </div>
                    </div>
                    {synthese.anneeRevente && <div className="relative flex items-start pl-10">
                      <div className="absolute left-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      <div className="flex-1 bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="font-semibold text-red-800">{synthese.anneeRevente}</div>
                        <div className="text-sm text-red-700">Revente simulée • Valeur {fmtEur(synthese.valRev)}</div>
                      </div>
                    </div>}
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 1 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow et économie d'IR</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique illustre votre trésorerie nette et l'économie d'IR générée par le déficit foncier.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {synthese.cfMoyMois >= 0 ? (
                      <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(synthese.cfMoyMois)}/mois</strong> après prise en compte de l'économie fiscale. Les premières années bénéficient fortement de l'imputation du déficit.</p>
                    ) : (
                      <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(synthese.cfMoyMois))}/mois</strong> en moyenne. Cet effort est compensé par l'économie d'IR de {fmtEur(synthese.totEcoIR)}.</p>
                    )}
                    <p>L'économie fiscale se concentre sur les {Math.min(4, Math.ceil(travauxTotal / plafondDeficitRG))} premières années (phase travaux), puis l'opération devient un investissement locatif classique.</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 2 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine net</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique montre l'évolution de votre capital net au fil des années.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Votre patrimoine net atteindra <strong className="text-blue-600">{fmtEur(synthese.capFinal || synthese.valRev)}</strong> après {dureeDetention} ans, contre un apport de {fmtEur(apport)}.</p>
                    <p>La croissance combine : remboursement du crédit, revalorisation du bien (+{fmtPct(revalorisationBien)}/an) et valorisation des travaux réalisés.</p>
                  </div>
                </div>
              </div>

              {/* DÉTAIL CALCUL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Détail du calcul fiscal</h3>
                <details>
                  <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul déficit foncier</summary>
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
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Loyer net</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">Travaux</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Résultat</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">Déf. sur RG</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-emerald-50">Éco. IR</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Capital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 ${p.economieIR > 0 ? 'bg-amber-50/30' : ''} hover:bg-slate-50`}>
                          <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-2 px-2 text-right text-slate-700">{fmtEur(p.loyerNet)}</td>
                          <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{p.travauxAn > 0 ? fmtEur(p.travauxAn) : '-'}</td>
                          <td className={`py-2 px-2 text-right ${p.resultatFoncierGlobal < 0 ? 'text-red-500' : 'text-slate-700'}`}>{fmtEur(p.resultatFoncierGlobal)}</td>
                          <td className="py-2 px-2 text-right text-amber-600 font-medium bg-amber-50/50">{p.deficitImputeRG > 0 ? fmtEur(p.deficitImputeRG) : '-'}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 font-semibold bg-emerald-50/50">{p.economieIR > 0 ? '+' + fmtEur(p.economieIR) : '-'}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                          <td className="py-2 px-2 text-right text-blue-600 font-medium">{fmtEur(p.capNet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-3 text-xs">
                  <div className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded text-center">
                    <span className="text-amber-600">Travaux totaux : </span>
                    <span className="font-bold text-amber-700">{fmtEur(travauxTotal)}</span>
                  </div>
                  <div className="flex-1 p-2 bg-emerald-50 border border-emerald-200 rounded text-center">
                    <span className="text-emerald-600">Éco. IR totale : </span>
                    <span className="font-bold text-emerald-700">{fmtEur(synthese.totEcoIR)}</span>
                  </div>
                  <div className="flex-1 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                    <span className="text-blue-600">Report restant : </span>
                    <span className="font-bold text-blue-700">{fmtEur(synthese.deficitReportable)}</span>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* AVIS PROFESSIONNEL AVEC SCORE GLOBAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-6 text-xl text-slate-800 flex items-center gap-2"><Target className="w-5 h-5" /> Synthèse et avis professionnel</h3>
                
                {(() => {
                  const levier = safeNumber(synthese.capFinal || synthese.valRev) / apport
                  const effetFiscal = safeNumber(synthese.totEcoIR) / travauxTotal * 100
                  const rendBrut = loyerMensuel * 12 / prixAchat * 100
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 10) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 8) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 6) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 4) ptsTRI = 1
                  else if (safeNumber(synthese.tri) >= 2) ptsTRI = 0.5
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 100) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -150) ptsCF = 1
                  else if (safeNumber(synthese.cfMoyMois) >= -300) ptsCF = 0.5
                  
                  let ptsEffetFiscal = 0
                  if (effetFiscal >= 45) ptsEffetFiscal = 2.5
                  else if (effetFiscal >= 35) ptsEffetFiscal = 2
                  else if (effetFiscal >= 25) ptsEffetFiscal = 1.5
                  else if (effetFiscal >= 15) ptsEffetFiscal = 1
                  else if (effetFiscal >= 10) ptsEffetFiscal = 0.5
                  
                  let ptsLevier = 0
                  if (levier >= 6) ptsLevier = 1.5
                  else if (levier >= 4) ptsLevier = 1
                  else if (levier >= 2) ptsLevier = 0.5
                  
                  let ptsRend = 0
                  if (rendBrut >= 7) ptsRend = 1.5
                  else if (rendBrut >= 5) ptsRend = 1
                  else if (rendBrut >= 4) ptsRend = 0.5
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsEffetFiscal + ptsLevier + ptsRend
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
                                <span className="w-20 text-slate-600">Effet fiscal</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsEffetFiscal >= 2 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsEffetFiscal / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsEffetFiscal}/2.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{fmtPct(effetFiscal)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Rendement</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsRend >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsRend}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(rendBrut)}</span>
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
                            <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Méthode de calcul du score Déficit Foncier</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Cash-flow (2 pts), Effet fiscal (2.5 pts), Levier (1.5 pts), Rendement (1.5 pts).</p>
                            <p className="text-slate-600">L'effet fiscal = économie IR / travaux. Plus votre TMI est élevé ({tmi}%), plus l'effet fiscal est important.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {tmi >= 41 && safeNumber(synthese.totEcoIR) > 10000 ? (
                      <>
                        <p><strong>Opération très favorable</strong> : Avec un TMI de {tmi}%, le déficit foncier est particulièrement efficace. Votre économie d'IR de {fmtEur(synthese.totEcoIR)} représente {fmtPct(safeNumber(synthese.totEcoIR) / travauxTotal * 100)} de l'investissement travaux.</p>
                        <p>Le TRI de {fmtPct(synthese.tri)} est {safeNumber(synthese.tri) > 8 ? 'excellent' : safeNumber(synthese.tri) > 5 ? 'très bon' : 'satisfaisant'}. Capital net final de {fmtEur(synthese.capFinal || synthese.valRev)}, soit ×{((safeNumber(synthese.capFinal) || safeNumber(synthese.valRev)) / apport).toFixed(1)} votre apport.</p>
                      </>
                    ) : tmi >= 30 ? (
                      <>
                        <p><strong>Opération correcte</strong> : Le déficit foncier avec un TMI de {tmi}% reste intéressant. L'économie d'IR de {fmtEur(synthese.totEcoIR)} réduit significativement le coût réel des travaux.</p>
                        <p>Pour optimiser, concentrez les travaux sur 2-3 ans pour maximiser l'effet fiscal. Le plafond de 10 700 €/an sur le revenu global est une limite à prendre en compte.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>TMI faible</strong> : Avec un TMI de {tmi}%, l'effet fiscal du déficit foncier est limité ({fmtPct(safeNumber(synthese.totEcoIR) / travauxTotal * 100)} du coût travaux).</p>
                        <p>L'opération reste un bon investissement locatif mais l'avantage fiscal est réduit. Envisagez d'autres stratégies ou attendez une augmentation de vos revenus.</p>
                      </>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Rappel : Engagement de location 3 ans minimum après imputation du déficit sur le revenu global (CGI art. 156-I-3°).</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={()=>setShowResults(false)} className="btn-primary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-amber{background:#fef3c7;color:#b45309;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#f59e0b;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px}.pedagogy-box{background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#b45309}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
