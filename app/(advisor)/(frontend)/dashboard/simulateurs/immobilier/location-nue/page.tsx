'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import {
  Home, User, Calendar, CreditCard, Wallet, Lightbulb, BarChart3,
  FileText, BookOpen, Building2, TrendingUp, Target, CheckCircle,
  XCircle, ArrowRight, RefreshCw,
} from 'lucide-react'
import {
  LOCATION_NUE_DISPLAY as LOCATION_NUE,
  calculAbattementPVIR, 
  calculAbattementPVPS,
  calculIRDetaille, 
  calculNombreParts, 
  calculIFI,
  type RegimeFiscalNue, 
  type ClasseDPE,
} from '../_utils/display-helpers'

const fmtEur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
const fmtSignedEur = (n: number) => {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${Math.abs(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
}

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'

export default function LocationNuePage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  const [showDetailPV, setShowDetailPV] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PROFIL CLIENT COMPLET (comme LMNP)
  // ══════════════════════════════════════════════════════════════════════════════
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  
  // Revenus existants du foyer fiscal
  const [revenusSalaires, setRevenusSalaires] = useState(60000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  
  // Patrimoine existant (pour IFI)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(350000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(150000)
  const [valeurRP, setValeurRP] = useState(350000)

  // ÉTAPE 2 : BIEN IMMOBILIER
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [prixAchat, setPrixAchat] = useState(200000)
  const [fraisNotaire, setFraisNotaire] = useState(16000)
  const [fraisAgence, setFraisAgence] = useState(0)
  const [travaux, setTravaux] = useState(0)
  const [surface, setSurface] = useState(50)
  const [dpe, setDpe] = useState<ClasseDPE>('D')

  // ÉTAPE 2 : FINANCEMENT
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(40000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)

  // ÉTAPE 3 : REVENUS
  const [loyerMensuel, setLoyerMensuel] = useState(800)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)

  // ÉTAPE 4 : CHARGES (CGI art. 31 - Régime réel)
  // Charges déductibles courantes
  const [taxeFonciere, setTaxeFonciere] = useState(1200) // Hors TEOM
  const [chargesCopro, setChargesCopro] = useState(1200) // Non récupérables
  const [assurancePNO, setAssurancePNO] = useState(180)
  const [assuranceGLI, setAssuranceGLI] = useState(3) // % du loyer
  const [fraisGestion, setFraisGestion] = useState(0) // % du loyer (agence)
  const [provisionTravaux, setProvisionTravaux] = useState(500) // Entretien/réparation
  // Charges exceptionnelles année 1
  const [fraisProcedure, setFraisProcedure] = useState(0) // Contentieux, huissier...
  const [travauxAmelioration, setTravauxAmelioration] = useState(0) // Rénovation (hors agrandissement)

  // ÉTAPE 5 : FISCALITÉ
  const [regimeFiscal, setRegimeFiscal] = useState<RegimeFiscalNue>('REEL')
  const [deficitAnterieur, setDeficitAnterieur] = useState(0)

  // ══════════════════════════════════════════════════════════════════════════════
  // CALCULS AUTOMATIQUES PROFIL CLIENT
  // ══════════════════════════════════════════════════════════════════════════════
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenuTotalAvant = revenusSalaires + revenusFonciersExistants + autresRevenus
  const irAvant = calculIRDetaille(revenuTotalAvant, nombreParts)
  const tmi = irAvant.tmi
  
  // Calcul IFI avant investissement
  const ifiAvant = calculIFI({
    patrimoineImmobilierBrut: patrimoineImmobilierExistant,
    dettesDeductibles: dettesImmobilieres,
    valeurRP: valeurRP
  })

  // ÉTAPE 6 : PROJECTION
  const [dureeDetention, setDureeDetention] = useState(20)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Résultats
   
  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<Record<string, unknown> | null>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<{type: string; message: string}[]>([])
  const [conseils, setConseils] = useState<string[]>([])

  const chartCashflow = useRef<HTMLDivElement>(null)
  const chartPatrimoine = useRef<HTMLDivElement>(null)

  // Calculs
  const investissementTotal = prixAchat + fraisNotaire + fraisAgence + travaux
  const montantEmprunte = Math.max(0, investissementTotal - apport)
  const loyerAnnuelBrut = loyerMensuel * 12
  const tauxVacance = vacanceSemaines / 52
  const loyerAnnuelNet = loyerAnnuelBrut * (1 - tauxVacance)
  const gliAnnuel = loyerAnnuelNet * assuranceGLI / 100
  const gestionAnnuel = loyerAnnuelNet * fraisGestion / 100
  // Charges courantes annuelles (récurrentes)
  const chargesCourantes = taxeFonciere + chargesCopro + assurancePNO + gliAnnuel + gestionAnnuel + provisionTravaux
  // Charges exceptionnelles (année 1 uniquement)
  const chargesExceptionnellesAn1 = fraisProcedure + travauxAmelioration
  // Total pour affichage (hors exceptionnelles)
  const totalCharges = chargesCourantes
  const eligibleMicroFoncier = (loyerAnnuelNet + revenusFonciersExistants) <= LOCATION_NUE.MICRO_FONCIER.PLAFOND_RECETTES
  const rendementBrut = prixAchat > 0 ? (loyerAnnuelBrut / prixAchat) * 100 : 0

  const tauxMensuel = tauxCredit / 100 / 12
  const nbMensualites = dureeCredit * 12
  const mensualiteHorsAss = montantEmprunte > 0 && tauxMensuel > 0
    ? montantEmprunte * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
    : montantEmprunte / nbMensualites
  const assuranceMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualiteCredit = mensualiteHorsAss + assuranceMens
  const coutTotalCredit = mensualiteCredit * nbMensualites - montantEmprunte
  
  // Dates clés
  const [anneeAcq, moisAcq] = dateAcquisition.split('-').map(Number)
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeExonerationIR = anneeAcq + 22
  const anneeExonerationPS = anneeAcq + 30

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION LOCATION NUE
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/location-nue', {
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
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          dateAcquisition,
          prixAcquisition: prixAchat, // API attend prixAcquisition
          fraisNotaire,
          travaux,
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          loyerMensuel,
          chargesLocatives: 0,
          vacanceSemaines,
          revalorisationLoyer,
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion,
          travauxEntretien: provisionTravaux,
          regimeFiscal,
          dureeDetention,
          revalorisationBien,
          fraisRevente,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || data.message || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: Record<string, unknown>, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        loyerBrut: p.loyer || 0,
        loyerNet: p.loyer || 0,
        charges: p.chargesReelles || 0,
        interets: p.interets || 0,
        resultatFoncier: p.revenuFoncier || 0,
        deficitRG: p.deficitImputeRG || 0,
        deficitReport: p.deficitFoncier || 0,
        baseImposable: p.baseImposable || 0,
        impotIR: p.ir || 0,
        ps: p.ps || 0,
        csgDeductible: 0, // Non applicable en Location Nue
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capitalRest: p.capitalRestant || 0,
        valeurBien: p.valeurBien || 0,
        capitalConstitue: p.capitalNet || 0,
      }))

      setSynthese({
        investissementTotal: result.synthese.investTotal,
        apport: result.synthese.apport ?? apport,
        montantEmprunte: result.synthese.montantEmprunte,
        mensualiteCredit: result.synthese.mensualite,
        coutCredit: result.synthese.coutCredit ?? 0,
        loyerAnnuelBrut: result.synthese.loyerAnnuelBrut ?? loyerAnnuelBrut,
        loyerAnnuelNet: result.synthese.loyerAnnuelNet ?? 0,
        chargesAnnuelles: result.synthese.chargesAnnuelles ?? 0,
        rendementBrut: result.synthese.rentaBrute,
        rendementNet: result.synthese.rentaNette ?? 0,
        rendementNetNet: result.synthese.rentaNetteNette ?? 0,
        tri: result.synthese.tri,
        cfMoyenMois: result.synthese.cashFlowMoyenMensuel ?? Math.round(safeNumber(result.synthese.cashFlowCumule) / dureeDetention / 12),
        cfCumule: result.synthese.cashFlowCumule,
        totalIR: result.synthese.irCumule,
        totalPS: result.synthese.psCumule ?? 0,
        deficitReportRestant: result.synthese.deficitReportableRestant ?? 0,
        valeurRevente: result.plusValue?.valeurRevente ?? 0,
        pvBrute: result.plusValue?.plusValueBrute ?? 0,
        pvCalc: result.plusValue ?? {},
        capitalFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        totalCSGDeductible: 0, // Non applicable en Location Nue
        regimeFiscal,
        anneeAcquisition: anneeAcq,
        anneeFinCredit,
        anneeExonerationIR,
        anneeExonerationPS,
        anneeRevente: anneeAcq + dureeDetention - 1,
        profilClient: {
          nombreParts: result.profilClient?.nombreParts ?? 0,
          revenuTotalAvant: result.profilClient?.revenuTotalAvant ?? 0,
          irAvant: result.profilClient?.irAvant ?? 0,
          tmiAvant: result.profilClient?.tmi ?? 0,
          ifiAvant: result.profilClient?.ifiAvant ?? 0,
          assujettiIFIAvant: result.profilClient?.assujettiIFIAvant ?? false,
          ifiApres: result.profilClient?.ifiApres ?? 0,
          assujettiIFIApres: result.profilClient?.assujettiIFIApres ?? false,
          impactIFI: (result.profilClient?.ifiApres ?? 0) - (result.profilClient?.ifiAvant ?? 0),
        },
      })

      setAlertes(result.alertes || [])
      setConseils(result.conseils || [])
      setExplications([
        `═══ LOCATION NUE ${regimeFiscal} - SYNTHÈSE ═══`,
        ``,
        `① RENDEMENT BRUT : ${fmtPct(result.synthese.rentaBrute)}`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ CASH-FLOW CUMULÉ : ${fmtEur(result.synthese.cashFlowCumule)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Location Nue:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAchat, fraisNotaire, travaux, apport,
    tauxCredit, dureeCredit, assuranceCredit, loyerMensuel, vacanceSemaines,
    revalorisationLoyer, taxeFonciere, chargesCopro, assurancePNO,
    fraisGestion, provisionTravaux, regimeFiscal,
    dureeDetention, revalorisationBien, fraisRevente,
    loyerAnnuelBrut, loyerAnnuelNet, totalCharges,
    anneeAcq, anneeFinCredit, anneeExonerationIR, anneeExonerationPS,
  ])

  // Charts
  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as unknown as { Plotly: { newPlot: (el: HTMLElement, data: unknown[], layout: unknown, config: unknown) => void } }).Plotly
    if (!P) return
    const years = projections.map(p => p.annee)
    if (chartCashflow.current) {
      P.newPlot(chartCashflow.current, [{ 
        x: years, 
        y: projections.map(p => p.cfApres), 
        type: 'bar', 
        marker: { color: projections.map(p => p.cfApres >= 0 ? '#059669' : '#dc2626') } 
      }], { 
        title: 'Cash-flow après impôts (€)', 
        height: 280, 
        margin: { t: 40, b: 40, l: 60, r: 20 }, 
        paper_bgcolor: 'transparent',
        xaxis: { title: 'Année', tickangle: -45 }
      }, { displayModeBar: false })
    }
    if (chartPatrimoine.current) {
      P.newPlot(chartPatrimoine.current, [
        { x: years, y: projections.map(p => p.valeurBien), name: 'Valeur bien', line: { color: '#1e40af' } },
        { x: years, y: projections.map(p => p.capitalRest), name: 'Dette restante', line: { color: '#ef4444' }, fill: 'tozeroy', fillcolor: 'rgba(239,68,68,0.1)' },
        { x: years, y: projections.map(p => p.capitalConstitue), name: 'Capital net', line: { color: '#059669', width: 3 } },
      ], { 
        title: 'Évolution du patrimoine net (€)', 
        height: 280, 
        margin: { t: 40, b: 40, l: 60, r: 20 }, 
        paper_bgcolor: 'transparent',
        xaxis: { title: 'Année', tickangle: -45 },
        legend: { orientation: 'h', y: -0.2 }
      }, { displayModeBar: false })
    }
  }, [plotlyReady, showResults, projections])

  const nextStep = () => step < 7 && setStep(step + 1)
  const prevStep = () => step > 1 && setStep(step - 1)

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <Home className="w-9 h-9 text-blue-700" />
              <div>
                <h1 className="text-2xl font-bold">Simulateur Location Nue</h1>
                <p className="text-gray-600">Revenus fonciers • Micro-foncier ou Réel • Déficit foncier</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="badge-blue">CGI art. 28-31</span>
              <span className="badge-green">Déficit art. 156</span>
            </div>
          </div>

          {!showResults ? (
            <>
              <div className="sim-card mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Étape {step}/7</span>
                  <span className="text-sm text-gray-500">{Math.round(step / 7 * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${step / 7 * 100}%` }} /></div>
                <div className="grid grid-cols-7 gap-1 mt-3">
                  {['Profil', 'Bien', 'Crédit', 'Loyers', 'Charges', 'Fiscalité', 'Projection'].map((l, i) => (
                    <button key={i} onClick={() => setStep(i + 1)} className={`py-1 px-1 rounded text-xs font-medium ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="sim-card">
                {/* ÉTAPE 1 : PROFIL CLIENT */}
                {step === 1 && (
                  <div className="animate-fadeIn">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Profil client</h2>
                    <p className="text-gray-600 mb-4">Pour calculer l'impact fiscal réel, nous avons besoin de votre situation actuelle.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="form-group">
                        <label>Situation familiale</label>
                        <select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}>
                          <option value="CELIBATAIRE">Célibataire</option>
                          <option value="MARIE_PACSE">Marié / Pacsé</option>
                          <option value="VEUF">Veuf</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Enfants à charge</label>
                        <input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/>
                      </div>
                      <div className="form-group">
                        <label>Revenus salaires (€/an)</label>
                        <input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/>
                      </div>
                      <div className="form-group">
                        <label>Revenus fonciers existants (€)</label>
                        <input type="number" value={revenusFonciersExistants} onChange={e=>setRevenusFonciersExistants(+e.target.value)}/>
                        <span className="form-hint">Autres biens loués</span>
                      </div>
                      <div className="form-group">
                        <label>Patrimoine immo existant (€)</label>
                        <input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/>
                        <span className="form-hint">Pour calcul IFI</span>
                      </div>
                      <div className="form-group">
                        <label>Dettes immobilières (€)</label>
                        <input type="number" value={dettesImmobilieres} onChange={e=>setDettesImmobilieres(+e.target.value)}/>
                      </div>
                      <div className="form-group">
                        <label>Valeur résidence principale (€)</label>
                        <input type="number" value={valeurRP} onChange={e=>setValeurRP(+e.target.value)}/>
                        <span className="form-hint">Abattement 30% IFI</span>
                      </div>
                      <div className="form-group">
                        <label>Autres revenus nets (€)</label>
                        <input type="number" value={autresRevenus} onChange={e=>setAutresRevenus(+e.target.value)}/>
                      </div>
                    </div>
                    <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                      <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{nombreParts}</div></div>
                      <div><span className="text-gray-500">Revenu imposable</span><div className="font-bold text-lg">{fmtEur(revenuTotalAvant)}</div></div>
                      <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
                      <div><span className="text-gray-500">Patrimoine net IFI</span><div className={`font-bold text-lg ${(patrimoineImmobilierExistant - dettesImmobilieres) > RULES.ifi.seuil_assujettissement ? 'text-orange-600' : 'text-green-600'}`}>{fmtEur(patrimoineImmobilierExistant - dettesImmobilieres)}</div></div>
                    </div>
                    <div className="pedagogy-box mt-4">
                      <p className="text-sm text-blue-700"><strong>Pourquoi ces informations ?</strong> Elles permettent de calculer l'impact RÉEL sur votre IR (barème progressif) et votre IFI, pas juste une estimation avec un TMI fixe.</p>
                    </div>
                  </div>
                )}

                {step === 2 && <Step1 {...{ dateAcquisition, setDateAcquisition, prixAchat, setPrixAchat, fraisNotaire, setFraisNotaire, fraisAgence, setFraisAgence, travaux, setTravaux, surface, setSurface, dpe, setDpe, investissementTotal, rendementBrut, anneeExonerationIR }} />}
                {step === 3 && <Step2 {...{ apport, setApport, tauxCredit, setTauxCredit, dureeCredit, setDureeCredit, assuranceCredit, setAssuranceCredit, montantEmprunte, mensualiteCredit, investissementTotal }} />}
                {step === 4 && <Step3 {...{ loyerMensuel, setLoyerMensuel, vacanceSemaines, setVacanceSemaines, revalorisationLoyer, setRevalorisationLoyer, loyerAnnuelBrut, loyerAnnuelNet, tauxVacance, rendementBrut }} />}
                {step === 5 && <Step4 {...{ taxeFonciere, setTaxeFonciere, chargesCopro, setChargesCopro, assurancePNO, setAssurancePNO, assuranceGLI, setAssuranceGLI, fraisGestion, setFraisGestion, provisionTravaux, setProvisionTravaux, fraisProcedure, setFraisProcedure, travauxAmelioration, setTravauxAmelioration, totalCharges, chargesExceptionnellesAn1, loyerAnnuelNet }} />}
                {step === 6 && <Step5 {...{ regimeFiscal, setRegimeFiscal, tmi, irAvant, revenuTotalAvant, ifiAvant, deficitAnterieur, setDeficitAnterieur, eligibleMicroFoncier, loyerAnnuelNet, totalCharges }} />}
                {step === 7 && <Step6 {...{ dureeDetention, setDureeDetention, revalorisationBien, setRevalorisationBien, fraisRevente, setFraisRevente }} />}

                <div className="flex justify-between mt-8">
                  <button onClick={prevStep} disabled={step === 1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                  {step < 7 ? <button onClick={nextStep} className="btn-primary">Suivant →</button>
                    : <button onClick={lancerSimulation} disabled={loading} className="btn-primary">{loading ? 'Calcul...' : 'Lancer l\'analyse'}</button>}
                </div>
              </div>
            </>
          ) : (
            <Results {...{ synthese, projections, explications, alertes, conseils, dureeDetention, dureeCredit, chartCashflow, chartPatrimoine, showDetailedTable, setShowDetailedTable, showDetailPV, setShowDetailPV, showScoreDetail, setShowScoreDetail, onReset: () => setShowResults(false) }} />
          )}
        </main>
      </div>
      <style jsx global>{`
        .sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}
        .btn-primary{background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}
        .btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}
        .badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:500}
        .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:500}
        .form-group{display:flex;flex-direction:column;gap:4px}
        .form-group label{font-size:13px;font-weight:500;color:#374151}
        .form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px;transition:all .2s}
        .form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        .form-hint{font-size:11px;color:#9ca3af}
        .info-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px}
        .pedagogy-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}
        .alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}
        .alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}
        .alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}
        .animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}
      `}</style>
    </SimulatorGate>
  )
}

// Composants étapes
 
function Step1({ dateAcquisition, setDateAcquisition, prixAchat, setPrixAchat, fraisNotaire, setFraisNotaire, fraisAgence, setFraisAgence, travaux, setTravaux, surface, setSurface, dpe, setDpe, investissementTotal, rendementBrut, anneeExonerationIR }: any) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Home className="w-5 h-5" /> Caractéristiques du bien</h2>
      <p className="text-sm text-gray-500 mb-6">Décrivez le bien à acquérir</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="form-group"><label className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e => setDateAcquisition(e.target.value)} /><span className="form-hint">Pour calcul abattements PV</span></div>
        <div className="form-group"><label>Prix d'acquisition (€)</label><input type="number" value={prixAchat} onChange={e => setPrixAchat(+e.target.value)} /><span className="form-hint">Prix net vendeur</span></div>
        <div className="form-group"><label>Frais de notaire (€)</label><input type="number" value={fraisNotaire} onChange={e => setFraisNotaire(+e.target.value)} /><span className="form-hint">~8% ancien, ~3% neuf</span></div>
        <div className="form-group"><label>Frais d'agence (€)</label><input type="number" value={fraisAgence} onChange={e => setFraisAgence(+e.target.value)} /></div>
        <div className="form-group"><label>Travaux (€)</label><input type="number" value={travaux} onChange={e => setTravaux(+e.target.value)} /><span className="form-hint">Déductibles en réel</span></div>
        <div className="form-group"><label>Surface (m²)</label><input type="number" value={surface} onChange={e => setSurface(+e.target.value)} /></div>
        <div className="form-group"><label>Classe DPE</label><select value={dpe} onChange={e => setDpe(e.target.value)}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F (passoire)</option><option value="G">G (passoire)</option></select></div>
      </div>
      <div className="info-box mt-6 grid grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500">Investissement total</span><div className="font-bold text-lg">{fmtEur(investissementTotal)}</div></div>
        <div><span className="text-gray-500">Prix/m²</span><div className="font-bold text-lg">{surface > 0 ? fmtEur(Math.round(prixAchat / surface)) : '-'}</div></div>
        <div><span className="text-gray-500">Rendement brut estimé</span><div className={`font-bold text-lg ${rendementBrut >= 6 ? 'text-green-600' : 'text-orange-500'}`}>{fmtPct(rendementBrut)}</div></div>
        <div><span className="text-gray-500">Exonération PV IR</span><div className="font-bold text-lg text-blue-600">{anneeExonerationIR}</div></div>
      </div>
    </div>
  )
}

 
function Step2({ sansFinancement, setSansFinancement, apport, setApport, tauxCredit, setTauxCredit, dureeCredit, setDureeCredit, assuranceCredit, setAssuranceCredit, montantEmprunte, mensualiteCredit, investissementTotal }: any) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Financement</h2>
      <p className="text-sm text-gray-500 mb-6">Paramètres du crédit immobilier</p>
      
      {/* Option achat comptant */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sansFinancement}
            onChange={(e) => {
              setSansFinancement(e.target.checked)
              if (e.target.checked) setApport(investissementTotal)
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
          <p className="text-emerald-700">Investissement total : <strong className="text-xl">{fmtEur(investissementTotal)}</strong></p>
          <p className="text-sm text-emerald-600 mt-2">Pas de crédit, pas d'intérêts déductibles. Fiscalité simplifiée.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group"><label>Apport personnel (€)</label><input type="number" value={apport} onChange={e => setApport(+e.target.value)} /></div>
            <div className="form-group"><label>Taux nominal (%)</label><input type="number" value={tauxCredit} onChange={e => setTauxCredit(+e.target.value)} step={0.1} /></div>
            <div className="form-group"><label>Durée (années)</label><input type="number" value={dureeCredit} onChange={e => setDureeCredit(+e.target.value)} min={5} max={30} /></div>
            <div className="form-group"><label>Assurance (%/an)</label><input type="number" value={assuranceCredit} onChange={e => setAssuranceCredit(+e.target.value)} step={0.05} /></div>
          </div>
          <div className="info-box mt-6 grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Montant emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
            <div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualiteCredit))}</div></div>
            <div><span className="text-gray-500">LTV</span><div className="font-bold text-lg">{investissementTotal > 0 ? fmtPct(montantEmprunte / investissementTotal * 100) : '-'}</div></div>
          </div>
          <div className="pedagogy-box mt-4">
            <p className="text-sm text-blue-700 mb-2"><strong>Intérêts déductibles :</strong> En régime réel, les intérêts d'emprunt et l'assurance sont intégralement déductibles des revenus fonciers.</p>
            <p className="text-sm text-blue-700"><strong>CSG déductible N+1 :</strong> Sur les revenus fonciers au réel, 6,8% de la CSG payée est déductible du revenu imposable l'année suivante.</p>
          </div>
        </>
      )}
    </div>
  )
}

 
function Step3({ loyerMensuel, setLoyerMensuel, vacanceSemaines, setVacanceSemaines, revalorisationLoyer, setRevalorisationLoyer, loyerAnnuelBrut, loyerAnnuelNet, tauxVacance, rendementBrut }: any) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Wallet className="w-5 h-5" /> Revenus locatifs</h2>
      <p className="text-sm text-gray-500 mb-6">Estimation des loyers</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group"><label>Loyer mensuel HC (€)</label><input type="number" value={loyerMensuel} onChange={e => setLoyerMensuel(+e.target.value)} /></div>
        <div className="form-group"><label>Vacance (semaines/an)</label><input type="number" value={vacanceSemaines} onChange={e => setVacanceSemaines(+e.target.value)} min={0} max={52} /></div>
        <div className="form-group"><label>Revalorisation (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e => setRevalorisationLoyer(+e.target.value)} step={0.1} /></div>
      </div>
      <div className="info-box mt-6 grid grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500">Loyer annuel brut</span><div className="font-bold text-lg text-green-600">{fmtEur(loyerAnnuelBrut)}</div></div>
        <div><span className="text-gray-500">Taux vacance</span><div className="font-bold text-lg">{fmtPct(tauxVacance * 100)}</div></div>
        <div><span className="text-gray-500">Loyer net vacance</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerAnnuelNet))}</div></div>
        <div><span className="text-gray-500">Rendement brut</span><div className={`font-bold text-lg ${rendementBrut >= 6 ? 'text-green-600' : 'text-orange-500'}`}>{fmtPct(rendementBrut)}</div></div>
      </div>
    </div>
  )
}

 
function Step4({ taxeFonciere, setTaxeFonciere, chargesCopro, setChargesCopro, assurancePNO, setAssurancePNO, assuranceGLI, setAssuranceGLI, fraisGestion, setFraisGestion, provisionTravaux, setProvisionTravaux, fraisProcedure, setFraisProcedure, travauxAmelioration, setTravauxAmelioration, totalCharges, chargesExceptionnellesAn1, loyerAnnuelNet }: any) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><FileText className="w-5 h-5" /> Charges déductibles (CGI art. 31)</h2>
      <p className="text-sm text-gray-500 mb-6">Charges non récupérables déductibles en régime réel</p>
      
      {/* CHARGES COURANTES */}
      <h3 className="font-semibold text-slate-700 mb-3">Charges courantes (récurrentes)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e => setTaxeFonciere(+e.target.value)} /><span className="form-hint">Hors TEOM (récupérable)</span></div>
        <div className="form-group"><label>Charges copro non récup. (€)</label><input type="number" value={chargesCopro} onChange={e => setChargesCopro(+e.target.value)} /><span className="form-hint">Part propriétaire</span></div>
        <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e => setAssurancePNO(+e.target.value)} /></div>
        <div className="form-group"><label>GLI (% loyer)</label><input type="number" value={assuranceGLI} onChange={e => setAssuranceGLI(+e.target.value)} step={0.1} /><span className="form-hint">Garantie Loyers Impayés</span></div>
        <div className="form-group"><label>Gestion agence (% loyer)</label><input type="number" value={fraisGestion} onChange={e => setFraisGestion(+e.target.value)} step={0.5} /><span className="form-hint">0 si gestion directe</span></div>
        <div className="form-group"><label>Entretien/réparation (€)</label><input type="number" value={provisionTravaux} onChange={e => setProvisionTravaux(+e.target.value)} /><span className="form-hint">Provision annuelle</span></div>
      </div>
      
      {/* CHARGES EXCEPTIONNELLES ANNÉE 1 */}
      <h3 className="font-semibold text-slate-700 mb-3 mt-6">Charges exceptionnelles (année 1)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group"><label>Frais de procédure (€)</label><input type="number" value={fraisProcedure} onChange={e => setFraisProcedure(+e.target.value)} /><span className="form-hint">Huissier, contentieux...</span></div>
        <div className="form-group"><label>Travaux d'amélioration (€)</label><input type="number" value={travauxAmelioration} onChange={e => setTravauxAmelioration(+e.target.value)} /><span className="form-hint">Hors construction/agrandissement</span></div>
      </div>
      
      {/* RÉCAPITULATIF */}
      <div className="info-box mt-6 grid grid-cols-3 gap-4 text-sm">
        <div><span className="text-gray-500">Charges courantes/an</span><div className="font-bold text-lg text-orange-600">{fmtEur(Math.round(totalCharges))}</div></div>
        <div><span className="text-gray-500">Exceptionnelles An1</span><div className="font-bold text-lg text-amber-600">{fmtEur(Math.round(chargesExceptionnellesAn1))}</div></div>
        <div><span className="text-gray-500">Ratio charges/loyers</span><div className="font-bold text-lg">{loyerAnnuelNet > 0 ? fmtPct(totalCharges / loyerAnnuelNet * 100) : '-'}</div></div>
      </div>
      
      {/* PÉDAGOGIE */}
      <div className="pedagogy-box mt-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Charges déductibles vs non déductibles</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-emerald-700 mb-1">Déductibles (art. 31 CGI)</p>
            <ul className="text-blue-700 space-y-0.5 text-xs">
              <li>• Intérêts d'emprunt + assurance</li>
              <li>• Taxe foncière (hors TEOM)</li>
              <li>• Charges copro non récupérables</li>
              <li>• Assurance PNO, GLI</li>
              <li>• Frais de gestion</li>
              <li>• Travaux entretien/amélioration</li>
              <li>• Frais de procédure</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-red-600 mb-1">Non déductibles</p>
            <ul className="text-slate-600 space-y-0.5 text-xs">
              <li>• Travaux construction/agrandissement</li>
              <li>• Capital remboursé du crédit</li>
              <li>• Mobilier et équipements</li>
              <li>• TEOM (récupérable)</li>
              <li>• Charges récupérables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

 
function Step5({ regimeFiscal, setRegimeFiscal, tmi, irAvant, revenuTotalAvant, ifiAvant, deficitAnterieur, setDeficitAnterieur, eligibleMicroFoncier, loyerAnnuelNet, totalCharges }: any) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Building2 className="w-5 h-5" /> Fiscalité</h2>
      <p className="text-sm text-gray-500 mb-6">Régime fiscal et déficit antérieur</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label>Régime fiscal</label>
          <select value={regimeFiscal} onChange={e => setRegimeFiscal(e.target.value)}>
            <option value="MICRO_FONCIER" disabled={!eligibleMicroFoncier}>Micro-foncier (abatt. 30%){!eligibleMicroFoncier ? ' (non éligible)' : ''}</option>
            <option value="REEL">Régime réel</option>
          </select>
          {!eligibleMicroFoncier && <span className="form-hint text-orange-600">Revenus {">"} 15 000 € : réel obligatoire</span>}
        </div>
        <div className="form-group"><label>Déficit antérieur reportable (€)</label><input type="number" value={deficitAnterieur} onChange={e => setDeficitAnterieur(+e.target.value)} /><span className="form-hint">Des 10 dernières années</span></div>
      </div>
      <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
        <div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant?.impotNet || 0)}</div></div>
        <div><span className="text-gray-500">Revenus totaux</span><div className="font-bold text-lg">{fmtEur(revenuTotalAvant)}</div></div>
        <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant?.assujetti ? 'text-orange-600' : 'text-green-600'}`}>{ifiAvant?.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
      </div>
      <div className="pedagogy-box mt-6">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comparaison rapide (année 1)</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/50 p-3 rounded-lg">
            <div className="font-medium">Micro-foncier</div>
            <div>Base : {fmtEur(Math.round(loyerAnnuelNet * 0.7))}</div>
            <div>IR+PS : {fmtEur(Math.round(loyerAnnuelNet * 0.7 * (tmi + 17.2) / 100))}</div>
          </div>
          <div className="bg-white/50 p-3 rounded-lg">
            <div className="font-medium">Régime réel</div>
            <div>Charges déductibles : {fmtEur(Math.round(totalCharges))} + intérêts</div>
            <div className="text-green-600 font-medium">{totalCharges > loyerAnnuelNet * 0.3 ? 'Plus avantageux' : 'Équivalent ou moins'}</div>
            <div className="text-xs text-gray-500 mt-1">+ CSG déductible N+1 (6,8%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

 
function Step6({ dureeDetention, setDureeDetention, revalorisationBien, setRevalorisationBien, fraisRevente, setFraisRevente }: any) {
  const abattIR = calculAbattementPVIR(dureeDetention)
  const abattPS = calculAbattementPVPS(dureeDetention)
  return (
    <div className="animate-fadeIn">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Projection & Revente</h2>
      <p className="text-sm text-gray-500 mb-6">Horizon d'investissement et hypothèses</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group"><label>Durée de détention (années)</label><input type="number" value={dureeDetention} onChange={e => setDureeDetention(+e.target.value)} min={1} max={40} /></div>
        <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e => setRevalorisationBien(+e.target.value)} step={0.1} /></div>
        <div className="form-group"><label>Frais de revente (%)</label><input type="number" value={fraisRevente} onChange={e => setFraisRevente(+e.target.value)} step={0.5} /></div>
      </div>
      <div className="pedagogy-box mt-6">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Abattements plus-value à {dureeDetention} ans</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-600">Abattement IR :</span> <strong className={abattIR >= 100 ? 'text-green-600' : ''}>{fmtPct(abattIR)}</strong> {abattIR >= 100 && 'Exonéré'}</div>
          <div><span className="text-gray-600">Abattement PS :</span> <strong className={abattPS >= 100 ? 'text-green-600' : ''}>{fmtPct(abattPS)}</strong> {abattPS >= 100 && 'Exonéré'}</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">Exonération IR totale après 22 ans • Exonération PS totale après 30 ans</p>
      </div>
    </div>
  )
}

 
function Results({ synthese, projections, explications, alertes, conseils, dureeDetention, dureeCredit, chartCashflow, chartPatrimoine, showDetailedTable, setShowDetailedTable, showDetailPV, setShowDetailPV, showScoreDetail, setShowScoreDetail, onReset }: any) {
  if (!synthese) return null
  const s = synthese
  const pc = s.profilClient || {}

  return (
    <div className="space-y-6 animate-fadeIn">
      { }
      {alertes.map((a: any, i: number) => <div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
      {conseils.length > 0 && <div className="alert-info">{conseils.map((c: string, i: number) => <p key={i}>{c}</p>)}</div>}

      {/* IMPACT FISCAL GLOBAL */}
      <div className="sim-card">
        <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-xs mb-1">IR actuel (hors foncier)</div>
            <div className="font-bold text-lg text-slate-800">{fmtEur(pc.irAvant || 0)}</div>
            <div className="text-xs text-slate-400">Sur {fmtEur(pc.revenuTotalAvant || 0)}/an</div>
            <div className="text-xs text-slate-400">TMI : {pc.tmiAvant || 30}%</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-amber-600 text-xs mb-1">IR + PS fonciers</div>
            <div className="font-bold text-lg text-amber-600">{fmtEur(s.totalIR + s.totalPS)}</div>
            <div className="text-xs text-amber-400">sur {dureeDetention} ans ({fmtEur(Math.round((s.totalIR + s.totalPS) / dureeDetention))}/an)</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-xs mb-1">IFI avant</div>
            <div className={`font-bold text-lg ${pc.assujettiIFIAvant ? 'text-amber-600' : 'text-emerald-600'}`}>{pc.assujettiIFIAvant ? fmtEur(pc.ifiAvant) : 'Non assujetti'}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-slate-500 text-xs mb-1">IFI après</div>
            <div className={`font-bold text-lg ${pc.assujettiIFIApres ? 'text-amber-600' : 'text-emerald-600'}`}>{pc.assujettiIFIApres ? fmtEur(pc.ifiApres) : 'Non assujetti'}</div>
            {pc.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(pc.impactIFI)}/an</div>}
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre la fiscalité foncière</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>IR actuel</strong> : {pc.irAvant > 0 ? `Vous payez ${fmtEur(pc.irAvant)} d'IR sur vos revenus de ${fmtEur(pc.revenuTotalAvant)}.` : `Pas d'IR actuellement sur vos revenus déclarés.`}</p>
            <p>• <strong>Régime {s.regimeFiscal === 'MICRO_FONCIER' ? 'Micro-foncier' : 'Réel'}</strong> : {s.regimeFiscal === 'MICRO_FONCIER' ? 'Abattement forfaitaire de 30% sur les loyers.' : 'Déduction des charges réelles (intérêts, travaux, charges...).'}</p>
            <p>• <strong>Imposition</strong> : Revenus fonciers taxés au barème IR (TMI {pc.tmiAvant || 30}%) + PS 17.2% = {fmtPct((pc.tmiAvant || 30) + 17.2)} au total.</p>
            {s.totalCSGDeductible > 0 && <p>• <strong>CSG déductible N+1</strong> : {fmtEur(s.totalCSGDeductible)} total (6.8% de la CSG payée) à déduire du revenu global.</p>}
          </div>
        </div>
      </div>

      {/* INDICATEURS CLÉS */}
      <div className="sim-card">
        <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
            <div className={`text-xl font-bold ${s.rendementBrut >= 5 ? 'text-emerald-600' : 'text-slate-800'}`}>{fmtPct(s.rendementBrut)}</div>
            <div className="text-xs text-slate-400 mt-1">{s.rendementBrut >= 6 ? 'Excellent' : s.rendementBrut >= 5 ? 'Bon' : 'Moyen'}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-xs text-slate-500 mb-1">Rendement net</div>
            <div className={`text-xl font-bold ${s.rendementNet >= 4 ? 'text-emerald-600' : 'text-slate-800'}`}>{fmtPct(s.rendementNet)}</div>
            <div className="text-xs text-slate-400 mt-1">Après charges</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-xs text-blue-600 mb-1">TRI</div>
            <div className="text-xl font-bold text-blue-700">{fmtPct(s.tri)}</div>
            <div className="text-xs text-slate-400 mt-1">{s.tri > 8 ? 'Excellent' : s.tri > 5 ? 'Bon' : 'Correct'}</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${s.cfMoyenMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`text-xs mb-1 ${s.cfMoyenMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
            <div className={`text-xl font-bold ${s.cfMoyenMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{s.cfMoyenMois >= 0 ? '+' : ''}{fmtEur(s.cfMoyenMois)}</div>
            <div className="text-xs text-slate-400 mt-1">{s.cfMoyenMois > 100 ? 'Autofinancé' : s.cfMoyenMois >= 0 ? 'Équilibré' : 'Effort'}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-xs text-slate-500 mb-1">Capital final</div>
            <div className="text-xl font-bold text-slate-800">{fmtEur(s.capitalFinal)}</div>
            <div className="text-xs text-slate-400 mt-1">À {dureeDetention} ans</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${s.gainTotal >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`text-xs mb-1 ${s.gainTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Gain total</div>
            <div className={`text-xl font-bold ${s.gainTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtSignedEur(s.gainTotal)}</div>
            <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
          <div className="text-sm text-slate-600 space-y-2">
            <p>• <strong>Rendement brut {fmtPct(s.rendementBrut)}</strong> : {s.rendementBrut >= 5 ? 'Supérieur à la moyenne du marché (4-5%).' : 'Dans la moyenne du marché.'}</p>
            <p>• <strong>TRI {fmtPct(s.tri)}</strong> : Intègre loyers, charges, fiscalité et plus-value. {s.tri > 8 ? 'Excellente performance.' : s.tri > 5 ? 'Performance satisfaisante.' : 'À optimiser.'}</p>
            <p>• <strong>Cash-flow {s.cfMoyenMois >= 0 ? 'positif' : 'négatif'}</strong> : {s.cfMoyenMois >= 0 ? `Génère ${fmtEur(s.cfMoyenMois)}/mois net.` : `Effort de ${fmtEur(Math.abs(s.cfMoyenMois))}/mois, soit ${fmtEur(Math.abs(s.cfMoyenMois) * 12 * dureeDetention)} sur ${dureeDetention} ans.`}</p>
            <p>• <strong>Gain total</strong> : Capital final ({fmtEur(s.capitalFinal)}) − Effort trésorerie ({fmtEur(Math.abs(Math.round(s.cfMoyenMois * 12 * dureeDetention)))}) − Apport = <span className={s.gainTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmtSignedEur(s.gainTotal)}</span></p>
          </div>
        </div>
      </div>

      {/* TIMELINE DES ÉVÉNEMENTS */}
      <div className="sim-card">
        <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5" /> Timeline des événements clés</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200" />
          <div className="space-y-4">
            <div className="relative flex items-start pl-10">
              <div className="absolute left-2.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
              <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-800">{s.anneeAcquisition}</div>
                <div className="text-sm text-blue-700">Acquisition du bien • Investissement {fmtEur(s.investissementTotal)}</div>
              </div>
            </div>
            <div className="relative flex items-start pl-10">
              <div className="absolute left-2.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <div className="font-semibold text-emerald-800">{s.anneeFinCredit}</div>
                <div className="text-sm text-emerald-700">Fin du crédit immobilier • Plus de mensualités</div>
              </div>
            </div>
            <div className="relative flex items-start pl-10">
              <div className="absolute left-2.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
              <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="font-semibold text-amber-800">{s.anneeExonerationIR}</div>
                <div className="text-sm text-amber-700">Exonération PV IR (22 ans de détention)</div>
              </div>
            </div>
            <div className="relative flex items-start pl-10">
              <div className="absolute left-2.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
              <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{s.anneeExonerationPS}</div>
                <div className="text-sm text-slate-700">Exonération PV PS (30 ans de détention)</div>
              </div>
            </div>
            {s.anneeRevente && <div className="relative flex items-start pl-10">
              <div className="absolute left-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              <div className="flex-1 bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="font-semibold text-red-800">{s.anneeRevente}</div>
                <div className="text-sm text-red-700">Revente simulée • Valeur {fmtEur(s.valeurRevente)}</div>
              </div>
            </div>}
          </div>
        </div>
      </div>

      {/* GRAPHIQUE 1 */}
      <div className="sim-card">
        <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow annuel</h3>
        <p className="text-sm text-slate-500 mb-4">Trésorerie nette après toutes charges et impôts.</p>
        <div ref={chartCashflow} className="mb-4"/>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
          <div className="text-sm text-slate-600 space-y-2">
            {s.cfMoyenMois >= 0 ? (
              <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(s.cfMoyenMois)}/mois</strong>. Les loyers couvrent les charges, crédit et fiscalité.</p>
            ) : (
              <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(s.cfMoyenMois))}/mois</strong>. Cet effort diminuera après remboursement du crédit.</p>
            )}
          </div>
        </div>
      </div>

      {/* GRAPHIQUE 2 */}
      <div className="sim-card">
        <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine</h3>
        <p className="text-sm text-slate-500 mb-4">Valeur du bien - capital restant dû.</p>
        <div ref={chartPatrimoine} className="mb-4"/>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
          <div className="text-sm text-slate-600 space-y-2">
            <p>Patrimoine net de <strong className="text-blue-600">{fmtEur(s.capitalFinal)}</strong> après {dureeDetention} ans, contre un apport de {fmtEur(s.apport)}.</p>
          </div>
        </div>
      </div>

      {/* PLUS-VALUE */}
      <div className="sim-card">
        <h3 className="font-bold mb-4 text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Plus-value à la revente ({dureeDetention} ans)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">Valeur estimée</div><div className="font-bold text-slate-800">{fmtEur(s.valeurRevente)}</div></div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"><div className="text-emerald-600 text-xs">PV brute</div><div className="font-bold text-emerald-600">+{fmtEur(s.pvBrute)}</div></div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><div className="text-amber-600 text-xs">Impôt PV</div><div className="font-bold text-amber-600">{fmtEur(s.pvCalc?.impotTotal || 0)}</div></div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="text-blue-600 text-xs">Capital net</div><div className="font-bold text-blue-700">{fmtEur(s.pvCalc?.capitalFinal || s.capitalFinal)}</div></div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-slate-500 text-xs">Abatt. IR/PS</div><div className="font-bold text-blue-600">{calculAbattementPVIR(dureeDetention)}% / {calculAbattementPVPS(dureeDetention).toFixed(0)}%</div></div>
        </div>
        
        {/* Toggle détail PV */}
        <button
          onClick={() => setShowDetailPV(!showDetailPV)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-3"
        >
          {showDetailPV ? 'Masquer' : 'Analyser'} le détail du calcul (CGI art. 150 VB)
        </button>
        
        {showDetailPV && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
            {/* Prix d'acquisition majoré */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700">Prix d'acquisition majoré</div>
              <div className="flex justify-between"><span>Prix d'achat</span><span>{fmtEur(s.pvCalc?.prixAchat || s.investissementTotal)}</span></div>
              <div className="flex justify-between">
                <span>+ Frais acquisition {s.pvCalc?.utiliseForfaitAcquisition ? <span className="text-blue-600 text-xs">(forfait 7.5%)</span> : <span className="text-emerald-600 text-xs">(réel)</span>}</span>
                <span>+{fmtEur(s.pvCalc?.majorationAcquisition || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Travaux {s.pvCalc?.utiliseForfaitTravaux ? <span className="text-blue-600 text-xs">(forfait 15%)</span> : <span className="text-emerald-600 text-xs">(réel)</span>}</span>
                <span>+{fmtEur(s.pvCalc?.majorationTravaux || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>= Prix acquisition majoré</span><span>{fmtEur(s.pvCalc?.prixAcquisitionMajore || 0)}</span></div>
            </div>
            
            {/* Calcul impôt PV */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700">Calcul de l'impôt sur PV</div>
              <div className="flex justify-between"><span>PV brute</span><span className="text-emerald-600">+{fmtEur(s.pvBrute)}</span></div>
              <div className="flex justify-between"><span>Abattement IR ({dureeDetention} ans)</span><span>{s.pvCalc?.abattementIR || calculAbattementPVIR(dureeDetention)}%</span></div>
              <div className="flex justify-between"><span>Abattement PS ({dureeDetention} ans)</span><span>{s.pvCalc?.abattementPS?.toFixed(1) || calculAbattementPVPS(dureeDetention).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>→ IR (19%)</span><span className="text-red-600">{fmtEur(s.pvCalc?.impotIR || 0)}</span></div>
              <div className="flex justify-between"><span>→ PS (17.2%)</span><span className="text-red-600">{fmtEur(s.pvCalc?.impotPS || 0)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>= Impôt total PV</span><span className="text-red-600">{fmtEur(s.pvCalc?.impotTotal || 0)}</span></div>
            </div>
            
            {/* Capital net */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-2">
              <div className="font-semibold text-blue-800">Capital net après revente</div>
              <div className="flex justify-between"><span>Prix de vente</span><span>{fmtEur(s.valeurRevente)}</span></div>
              <div className="flex justify-between"><span>− Impôt PV</span><span>−{fmtEur(s.pvCalc?.impotTotal || 0)}</span></div>
              <div className="flex justify-between"><span>− Frais vente</span><span>−{fmtEur(Math.round(s.valeurRevente * 0.05))}</span></div>
              <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>= Capital net final</span><span className="text-blue-700">{fmtEur(s.pvCalc?.capitalFinal || s.capitalFinal)}</span></div>
            </div>
          </div>
        )}
        
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mt-3">
          <p className="text-xs">Exonération IR après 22 ans • Exonération PS après 30 ans • Forfait 15% travaux si détention {">"} 5 ans</p>
        </div>
      </div>

      {/* TABLEAU DES PROJECTIONS */}
      <div className="sim-card">
        <h3 className="font-bold mb-4 text-slate-800">Projection sur {dureeDetention} ans</h3>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="py-2 px-2 text-left font-semibold text-slate-600">Année</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Loyer</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Charges</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Intérêts</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Résultat</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">IR+PS</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow</th>
                <th className="py-2 px-2 text-right font-semibold text-slate-600">Capital</th>
              </tr>
            </thead>
            <tbody>
              { }
              {projections.map((p: any) => (
                <tr key={p.annee} className={`border-b border-slate-100 hover:bg-slate-50 ${p.cfApres >= 0 ? 'bg-emerald-50/20' : ''}`}>
                  <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{fmtEur(p.loyerNet)}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{fmtEur(p.charges)}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{fmtEur(p.interets)}</td>
                  <td className={`py-2 px-2 text-right ${p.resultatFoncier < 0 ? 'text-red-500' : 'text-slate-700'}`}>{fmtEur(p.resultatFoncier)}</td>
                  <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{fmtEur(p.impotIR + p.ps)}</td>
                  <td className={`py-2 px-2 text-right font-semibold ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                  <td className="py-2 px-2 text-right text-blue-600 font-medium">{fmtEur(p.capitalConstitue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYNTHÈSE ET AVIS PROFESSIONNEL */}
      <div className="sim-card">
        <h3 className="font-bold mb-6 text-xl text-slate-800 flex items-center gap-2"><Target className="w-5 h-5" /> Synthèse et avis professionnel</h3>
        
        {/* Score global - Système de notation équilibré (base 0) */}
        {(() => {
          const levier = s.capitalFinal / s.apport
          
          // === CALCUL DES POINTS PAR CRITÈRE ===
          // TRI (max 3 points)
          let ptsTRI = 0
          if (s.tri >= 10) ptsTRI = 3
          else if (s.tri >= 8) ptsTRI = 2.5
          else if (s.tri >= 6) ptsTRI = 2
          else if (s.tri >= 5) ptsTRI = 1.5
          else if (s.tri >= 4) ptsTRI = 1
          else if (s.tri >= 3) ptsTRI = 0.5
          
          // Cash-flow (max 2.5 points)
          let ptsCF = 0
          if (s.cfMoyenMois >= 200) ptsCF = 2.5
          else if (s.cfMoyenMois >= 100) ptsCF = 2
          else if (s.cfMoyenMois >= 0) ptsCF = 1.5
          else if (s.cfMoyenMois >= -150) ptsCF = 1
          else if (s.cfMoyenMois >= -300) ptsCF = 0.5
          
          // Fiscalité (max 1.5 points) - Location nue = revenus fonciers imposés
          let ptsFisc = 0
          const irAnnuelMoyen = (s.totalIR + s.totalPS) / dureeDetention
          if (irAnnuelMoyen <= 1000) ptsFisc = 1.5
          else if (irAnnuelMoyen <= 3000) ptsFisc = 1
          else if (irAnnuelMoyen <= 5000) ptsFisc = 0.5
          
          // Effet de levier (max 1.5 points)
          let ptsLevier = 0
          if (levier >= 8) ptsLevier = 1.5
          else if (levier >= 5) ptsLevier = 1
          else if (levier >= 3) ptsLevier = 0.5
          
          // Rendement brut (max 1.5 points)
          let ptsRend = 0
          if (s.rendementBrut >= 7) ptsRend = 1.5
          else if (s.rendementBrut >= 5) ptsRend = 1
          else if (s.rendementBrut >= 4) ptsRend = 0.5
          
          // Score total
          const scoreTotal = ptsTRI + ptsCF + ptsFisc + ptsLevier + ptsRend
          const score = Math.min(10, Math.max(0, Math.round(scoreTotal * 10) / 10))
          
          const getScoreColor = (sc: number) => sc >= 7 ? 'text-emerald-600' : sc >= 5 ? 'text-blue-600' : sc >= 3 ? 'text-amber-600' : 'text-red-600'
          const getScoreBg = (sc: number) => sc >= 7 ? 'bg-emerald-50 border-emerald-200' : sc >= 5 ? 'bg-blue-50 border-blue-200' : sc >= 3 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
          const getScoreLabel = (sc: number) => sc >= 8 ? 'Excellent investissement' : sc >= 7 ? 'Très bon investissement' : sc >= 6 ? 'Bon investissement' : sc >= 5 ? 'Investissement satisfaisant' : sc >= 4 ? 'Investissement correct' : sc >= 3 ? 'Investissement à optimiser' : 'Investissement à reconsidérer'
          
          return (
            <>
              {/* Score principal */}
              <div className={`rounded-xl p-6 mb-4 border-2 ${getScoreBg(score)}`}>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-5xl font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                    <div className="text-slate-500 text-sm font-medium">/10</div>
                  </div>
                  <div className="flex-1">
                    <div className={`text-xl font-bold mb-3 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
                    
                    {/* Barres de critères avec points */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-600">TRI</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ptsTRI >= 2 ? 'bg-emerald-500' : ptsTRI >= 1 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsTRI / 3) * 100}%`}}></div>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">{ptsTRI}/3 pts</span>
                        <span className={`w-14 text-right font-semibold ${ptsTRI >= 2 ? 'text-emerald-600' : ptsTRI >= 1 ? 'text-blue-600' : 'text-amber-600'}`}>{fmtPct(s.tri)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-600">Cash-flow</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : ptsCF >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsCF / 2.5) * 100}%`}}></div>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">{ptsCF}/2.5 pts</span>
                        <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : ptsCF >= 0.5 ? 'text-blue-600' : 'text-amber-600'}`}>{s.cfMoyenMois >= 0 ? '+' : ''}{fmtEur(s.cfMoyenMois)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-600">Fiscalité</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ptsFisc >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsFisc / 1.5) * 100}%`}}></div>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">{ptsFisc}/1.5 pts</span>
                        <span className={`w-14 text-right font-semibold ${ptsFisc >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>{fmtEur(Math.round(irAnnuelMoyen))}/an</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-600">Levier</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                        <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="w-20 text-slate-600">Rendement</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${ptsRend >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 1.5) * 100}%`}}></div>
                        </div>
                        <span className="w-20 text-right text-xs text-slate-500">{ptsRend}/1.5 pts</span>
                        <span className={`w-14 text-right font-semibold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(s.rendementBrut)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Toggle explication du scoring */}
              <div className="mb-6">
                <button
                  onClick={() => setShowScoreDetail(!showScoreDetail)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showScoreDetail ? '▼ Masquer' : '▶ Comprendre'} le calcul du score
                </button>
                
                {showScoreDetail && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
                    <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Méthode de calcul du score (base 0, max 10)</h5>
                    <p className="text-slate-600 mb-3">Le score est calculé en additionnant des points selon 5 critères clés d'un investissement locatif :</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="text-left p-2 border border-slate-200">Critère</th>
                            <th className="text-center p-2 border border-slate-200">Max</th>
                            <th className="text-left p-2 border border-slate-200">Barème</th>
                            <th className="text-center p-2 border border-slate-200">Votre valeur</th>
                            <th className="text-center p-2 border border-slate-200">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border border-slate-200 font-medium">TRI</td>
                            <td className="p-2 border border-slate-200 text-center">3 pts</td>
                            <td className="p-2 border border-slate-200 text-slate-500">≥10%→3 | ≥8%→2.5 | ≥6%→2 | ≥5%→1.5 | ≥4%→1 | ≥3%→0.5</td>
                            <td className="p-2 border border-slate-200 text-center font-semibold">{fmtPct(s.tri)}</td>
                            <td className={`p-2 border border-slate-200 text-center font-bold ${ptsTRI >= 2 ? 'text-emerald-600' : ptsTRI >= 1 ? 'text-blue-600' : 'text-amber-600'}`}>{ptsTRI}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-medium">Cash-flow</td>
                            <td className="p-2 border border-slate-200 text-center">2.5 pts</td>
                            <td className="p-2 border border-slate-200 text-slate-500">≥200€→2.5 | ≥100€→2 | ≥0€→1.5 | ≥-150€→1 | ≥-300€→0.5</td>
                            <td className="p-2 border border-slate-200 text-center font-semibold">{fmtEur(s.cfMoyenMois)}/mois</td>
                            <td className={`p-2 border border-slate-200 text-center font-bold ${ptsCF >= 1.5 ? 'text-emerald-600' : ptsCF >= 0.5 ? 'text-blue-600' : 'text-amber-600'}`}>{ptsCF}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-medium">Fiscalité IR+PS</td>
                            <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                            <td className="p-2 border border-slate-200 text-slate-500">≤1k€/an→1.5 | ≤3k€→1 | ≤5k€→0.5</td>
                            <td className="p-2 border border-slate-200 text-center font-semibold">{fmtEur(Math.round(irAnnuelMoyen))}/an</td>
                            <td className={`p-2 border border-slate-200 text-center font-bold ${ptsFisc >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>{ptsFisc}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-medium">Effet de levier</td>
                            <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                            <td className="p-2 border border-slate-200 text-slate-500">≥8×→1.5 | ≥5×→1 | ≥3×→0.5</td>
                            <td className="p-2 border border-slate-200 text-center font-semibold">×{levier.toFixed(1)}</td>
                            <td className={`p-2 border border-slate-200 text-center font-bold text-blue-600`}>{ptsLevier}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border border-slate-200 font-medium">Rendement brut</td>
                            <td className="p-2 border border-slate-200 text-center">1.5 pts</td>
                            <td className="p-2 border border-slate-200 text-slate-500">≥7%→1.5 | ≥5%→1 | ≥4%→0.5</td>
                            <td className="p-2 border border-slate-200 text-center font-semibold">{fmtPct(s.rendementBrut)}</td>
                            <td className={`p-2 border border-slate-200 text-center font-bold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{ptsRend}</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold">
                            <td className="p-2 border border-slate-200" colSpan={3}>TOTAL</td>
                            <td className="p-2 border border-slate-200 text-center"></td>
                            <td className={`p-2 border border-slate-200 text-center text-lg ${getScoreColor(score)}`}>{score.toFixed(1)}/10</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
                      <div className="bg-red-100 text-red-700 rounded p-2">0-3 : À reconsidérer</div>
                      <div className="bg-amber-100 text-amber-700 rounded p-2">3-5 : À optimiser</div>
                      <div className="bg-blue-100 text-blue-700 rounded p-2">5-7 : Satisfaisant</div>
                      <div className="bg-emerald-100 text-emerald-700 rounded p-2">7-10 : Bon/Excellent</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )
        })()}
        
        {/* Points forts et vigilance */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">✓</span>
              Points forts
            </h4>
            <ul className="space-y-2 text-sm">
              {s.rendementBrut > 4 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Rendement brut : <strong className="text-emerald-600">{fmtPct(s.rendementBrut)}</strong></span></li>}
              {(s.capitalFinal / s.apport) > 2 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Effet de levier : <strong className="text-emerald-600">×{(s.capitalFinal / s.apport).toFixed(1)}</strong> sur l'apport</span></li>}
              {s.cfMoyenMois >= 0 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Opération <strong className="text-emerald-600">autofinancée</strong></span></li>}
              {s.tri > 4 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">TRI de <strong className="text-emerald-600">{fmtPct(s.tri)}</strong> sur {dureeDetention} ans</span></li>}
              {dureeDetention >= 22 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700"><strong className="text-emerald-600">Exonération d'IR</strong> sur la plus-value</span></li>}
              {s.capitalFinal > 100000 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Capital final de <strong className="text-emerald-600">{fmtEur(s.capitalFinal)}</strong></span></li>}
              {s.deficitReportRestant > 0 && <li className="flex items-start gap-2"><span className="text-emerald-500">•</span><span className="text-slate-700">Déficit foncier reportable : <strong className="text-emerald-600">{fmtEur(s.deficitReportRestant)}</strong></span></li>}
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
              Points d'attention
            </h4>
            <ul className="space-y-2 text-sm">
              {s.cfMoyenMois < 0 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Effort d'épargne de <strong className="text-amber-600">{fmtEur(Math.abs(s.cfMoyenMois))}/mois</strong></span></li>}
              {(s.totalIR + s.totalPS) / dureeDetention > 2000 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Fiscalité élevée : <strong className="text-amber-600">{fmtEur(Math.round((s.totalIR + s.totalPS) / dureeDetention))}/an</strong> (IR+PS)</span></li>}
              {s.rendementBrut < 4 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Rendement brut modéré ({fmtPct(s.rendementBrut)})</span></li>}
              <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Pas d'amortissement (contrairement au LMNP)</span></li>
              {pc.impactIFI > 0 && <li className="flex items-start gap-2"><span className="text-amber-500">•</span><span className="text-slate-700">Impact IFI : {fmtEur(pc.impactIFI)}/an</span></li>}
            </ul>
          </div>
        </div>
        
        {/* Recommandation finale */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Recommandation personnalisée
          </h4>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3">
            {s.tri >= 6 && s.cfMoyenMois >= 0 ? (
              <>
                <p>Cette opération présente un <strong className="text-emerald-600">excellent profil rendement/risque</strong>. Avec un TRI de <strong>{fmtPct(s.tri)}</strong> et un cash-flow positif, elle s'autofinance tout en constituant un patrimoine de <strong>{fmtEur(s.capitalFinal)}</strong>.</p>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <strong className="text-blue-700 flex items-center gap-1"><ArrowRight className="w-4 h-4" /> Stratégie recommandée :</strong> Conserver le bien au minimum <strong>{Math.max(22, dureeCredit)} ans</strong> pour bénéficier de l'exonération d'IR sur la plus-value.
                </div>
              </>
            ) : s.tri >= 4 ? (
              <>
                <p>Cette opération présente un <strong className="text-blue-600">bon potentiel patrimonial</strong> avec un TRI de <strong>{fmtPct(s.tri)}</strong>. {s.cfMoyenMois < 0 ? <>L'effort mensuel de <strong>{fmtEur(Math.abs(s.cfMoyenMois))}</strong> est à prévoir mais reste gérable.</> : <>Le cash-flow est équilibré.</>}</p>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <strong className="text-blue-700 flex items-center gap-1"><ArrowRight className="w-4 h-4" /> Stratégie recommandée :</strong> Privilégier une détention longue (22+ ans) pour optimiser la fiscalité. Étudiez aussi la possibilité de passer en LMNP pour bénéficier des amortissements.
                </div>
              </>
            ) : (
              <>
                <p>Cette opération peut être <strong className="text-amber-600">optimisée</strong>. Avec un TRI de <strong>{fmtPct(s.tri)}</strong>, des ajustements permettraient d'améliorer la rentabilité.</p>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <strong className="text-blue-700 flex items-center gap-1"><ArrowRight className="w-4 h-4" /> Pistes d'amélioration :</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• Renégocier le prix d'achat (-5 à -10%)</li>
                    <li>• Passer en location meublée (LMNP) pour les amortissements</li>
                    <li>• Vérifier le potentiel locatif du bien</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
          <strong>Location nue vs LMNP :</strong> La location nue offre une stabilité locative (baux 3 ans) mais une fiscalité moins favorable (pas d'amortissement). Pour optimiser, envisagez le passage en meublé si compatible avec le marché local.
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onReset} className="btn-primary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Nouvelle simulation</button>
      </div>
    </div>
  )
}
