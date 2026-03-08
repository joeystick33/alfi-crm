'use client'
 

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import {
  Palmtree, User, Home, Calendar, CreditCard, Landmark,
  BarChart3, TrendingUp, FileText, Target, Briefcase, AlertTriangle, RefreshCw,
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
const fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type TypeMeuble = 'TOURISME_CLASSE' | 'TOURISME_NON_CLASSE' | 'CHAMBRE_HOTES'
type RegimeFiscal = 'MICRO_BIC' | 'REEL'

export default function SaisonnierPage() {
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
  const [revenusSalaires, setRevenusSalaires] = useState(60000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(0)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(0)
  const [valeurRP, setValeurRP] = useState(0)

  // Date d'acquisition
  const [dateAcquisition, _setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [prixAchat, setPrixAchat] = useState(200000)
  const [fraisNotaire, setFraisNotaire] = useState(16000)
  const [travaux, setTravaux] = useState(20000)
  const [mobilier, setMobilier] = useState(15000)
  const [typeMeuble, setTypeMeuble] = useState<TypeMeuble>('TOURISME_NON_CLASSE')
  const [estResidencePrincipale, setEstResidencePrincipale] = useState(false)
  const [tarifNuitee, setTarifNuitee] = useState(120)
  const [tauxOccupation, setTauxOccupation] = useState(60)
  const [nbNuitsMax, setNbNuitsMax] = useState(365)
  const [fraisPlateforme, setFraisPlateforme] = useState(3)
  const [fraisMenage, setFraisMenage] = useState(40)
  const [chargesAnnuelles, setChargesAnnuelles] = useState(3500)
  const [apport, setApport] = useState(50000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [regimeFiscal, setRegimeFiscal] = useState<RegimeFiscal>('MICRO_BIC')
  const [dureeDetention, setDureeDetention] = useState(15)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenusTotaux = revenusSalaires + revenusFonciersExistants + autresRevenus
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const tmi = irAvant.tmi
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  
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

  // Calculs
  const investTotal = prixAchat + fraisNotaire + travaux + mobilier
  const montantEmprunte = Math.max(0, investTotal - apport)
  const nuitsOccupees = Math.round(nbNuitsMax * tauxOccupation / 100)
  const recettesBrutes = nuitsOccupees * tarifNuitee
  const commissions = recettesBrutes * fraisPlateforme / 100
  const menage = nuitsOccupees * fraisMenage / 10 // ~1 ménage pour 2-3 séjours
  const recettesNettes = recettesBrutes - commissions - menage

  // Abattement selon type (LF 2024 pour revenus 2025)
  // Tourisme classé : 50%, Tourisme non classé : 30%, Chambre d'hôtes : 71%
  const abattement = typeMeuble === 'CHAMBRE_HOTES' ? 71 : typeMeuble === 'TOURISME_CLASSE' ? 50 : 30
  const plafondMicroBIC = typeMeuble === 'CHAMBRE_HOTES' ? 188700 : typeMeuble === 'TOURISME_CLASSE' ? 77700 : 15000

  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensualite = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : 0

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION SAISONNIÈRE
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/saisonnier', {
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
          prixAchat,
          fraisNotaire,
          travaux,
          mobilier,
          typeMeuble,
          estResidencePrincipale,
          // Exploitation
          tarifNuitee,
          tauxOccupation,
          nbNuitsMax,
          fraisPlateforme,
          fraisMenage,
          chargesAnnuelles,
          // Financement
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit: 0.30,
          // Charges
          taxeFonciere: 0,
          chargesCopro: 0,
          assurancePNO: 0,
          fraisGestion: 0,
          // Régime fiscal
          regimeFiscal,
          // Projection
          dureeDetention,
          revalorisationBien,
          revalorisationTarif: 2,
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
        recettes: p.recettes || 0,
        charges: p.charges || 0,
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

      setSynthese({
        investTotal: result.synthese.investTotal,
        recettesBrutes: result.synthese.recettesBrutes ?? Math.round(recettesBrutes),
        recettesNettes: result.synthese.recettesNettes ?? Math.round(recettesNettes),
        nuitsOccupees: result.synthese.nuitsOccupees ?? nuitsOccupees,
        tarifNuitee,
        abattement: result.synthese.abattement ?? abattement,
        regimeFiscal,
        rendBrut: result.synthese.rentaBrute,
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
        `═══ LOCATION SAISONNIÈRE - SYNTHÈSE ═══`,
        ``,
        `① RECETTES : ${fmtEur(Math.round(recettesBrutes))} brut / ${fmtEur(Math.round(recettesNettes))} net`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Saisonnière:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, revenusSalaires,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAchat, fraisNotaire, travaux, mobilier,
    typeMeuble, estResidencePrincipale, tarifNuitee, tauxOccupation, nbNuitsMax,
    fraisPlateforme, fraisMenage, chargesAnnuelles, apport, tauxCredit, dureeCredit,
    regimeFiscal, dureeDetention, revalorisationBien,
    recettesBrutes, recettesNettes, nuitsOccupees, abattement,
    anneeAcq, anneeFinCredit, anneeRevente,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as any).Plotly; if (!P) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) P.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.recettes), type: 'bar', name: 'Recettes brutes', marker: { color: '#fb923c' } },
      { x: years, y: projections.map(p => p.imposition), type: 'scatter', name: 'Imposition totale', line: { color: '#ef4444', width: 2 } },
    ], { title: 'Recettes vs fiscalité', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) P.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur bien', line: { color: '#1d4ed8' } },
      { x: years, y: projections.map(p => p.capNet), name: 'Capital net', line: { color: '#10b981', width: 3 } },
    ], { title: 'Patrimoine', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6"><div className="flex items-center gap-4"><Palmtree className="w-9 h-9 text-orange-600" /><div><h1 className="text-2xl font-bold">Simulateur Location Saisonnière</h1><p className="text-gray-600">Airbnb • Meublé tourisme • Courte durée</p></div></div><div className="flex gap-2 mt-3"><span className="badge-orange">{nuitsOccupees} nuits/an</span><span className="badge-green">{fmtEur(tarifNuitee)}/nuit</span><span className="badge-blue">Abattement {abattement}%</span></div></div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-orange-500 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><User className="w-5 h-5" /> Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">Les revenus de location saisonnière sont imposés en BIC (bénéfices industriels et commerciaux)</p>
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
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-orange-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-orange-700"><strong>Attention :</strong> Si vos recettes dépassent <strong>23 000 €/an</strong> et représentent plus de 50% de vos revenus, vous serez requalifié en <strong>LMP</strong> avec cotisations sociales SSI obligatoires.</p></div>
              </div>}

              {/* ÉTAPE 2 : BIEN */}
              {step === 2 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Home className="w-5 h-5" /> Bien</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="form-group"><label>Prix (€)</label><input type="number" value={prixAchat} onChange={e=>setPrixAchat(+e.target.value)}/></div><div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/></div><div className="form-group"><label>Travaux (€)</label><input type="number" value={travaux} onChange={e=>setTravaux(+e.target.value)}/></div><div className="form-group"><label>Mobilier (€)</label><input type="number" value={mobilier} onChange={e=>setMobilier(+e.target.value)}/></div><div className="form-group"><label>Type</label><select value={typeMeuble} onChange={e=>setTypeMeuble(e.target.value as TypeMeuble)}><option value="TOURISME_NON_CLASSE">Meublé non classé</option><option value="TOURISME_CLASSE">Meublé tourisme classé</option><option value="CHAMBRE_HOTES">Chambre d'hôtes</option></select></div><div className="form-group flex items-center gap-2 pt-6"><input type="checkbox" checked={estResidencePrincipale} onChange={e=>setEstResidencePrincipale(e.target.checked)} className="w-4 h-4"/><label>Résidence principale</label></div></div></div>}

              {step === 3 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Exploitation</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="form-group"><label>Tarif/nuit (€)</label><input type="number" value={tarifNuitee} onChange={e=>setTarifNuitee(+e.target.value)}/></div><div className="form-group"><label>Taux occupation (%)</label><input type="number" value={tauxOccupation} onChange={e=>setTauxOccupation(+e.target.value)} min={0} max={100}/></div><div className="form-group"><label>Nuits max/an</label><input type="number" value={nbNuitsMax} onChange={e=>setNbNuitsMax(+e.target.value)} max={estResidencePrincipale?120:365}/>{estResidencePrincipale && <span className="form-hint text-orange-600">Max 120 (RP)</span>}</div><div className="form-group"><label>Commission plateforme (%)</label><input type="number" value={fraisPlateforme} onChange={e=>setFraisPlateforme(+e.target.value)} step={0.5}/></div><div className="form-group"><label>Frais ménage/séjour (€)</label><input type="number" value={fraisMenage} onChange={e=>setFraisMenage(+e.target.value)}/></div><div className="form-group"><label>Charges annuelles (€)</label><input type="number" value={chargesAnnuelles} onChange={e=>setChargesAnnuelles(+e.target.value)}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Nuits occupées</span><div className="font-bold text-lg">{nuitsOccupees}</div></div><div><span className="text-gray-500">Recettes brutes</span><div className="font-bold text-lg text-green-600">{fmtEur(recettesBrutes)}</div></div><div><span className="text-gray-500">Net charges</span><div className="font-bold text-lg">{fmtEur(Math.round(recettesNettes))}</div></div></div></div>}

              {step === 4 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Financement</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Apport (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/></div><div className="form-group"><label>Taux (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div></div><div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div><div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div></div></div>}

              {step === 5 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Landmark className="w-5 h-5" /> Fiscalité</h2><div className="grid grid-cols-2 gap-4"><div className="form-group"><label>Régime</label><select value={regimeFiscal} onChange={e=>setRegimeFiscal(e.target.value as RegimeFiscal)}><option value="MICRO_BIC">Micro-BIC ({abattement}%)</option><option value="REEL">Réel (amortissements)</option></select></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div><div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div><div><span className="text-gray-500">Revenus totaux</span><div className="font-bold text-lg">{fmtEur(revenusTotaux)}</div></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Fiscalité saisonnière</h4><ul className="text-sm text-orange-700 space-y-1"><li>• <strong>Micro-BIC :</strong> abattement {abattement}% (plafond {fmtEur(plafondMicroBIC)})</li><li>• <strong>Réel :</strong> charges + amortissements déductibles</li><li>• <strong>&gt; 23 000 € :</strong> cotisations SSI obligatoires</li></ul></div></div>}

              {step === 6 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Projection</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Durée détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)}/></div><div className="form-group"><label>Revalo bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.1}/></div></div></div>}

              {step === 7 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Récapitulatif</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Investissement</span><div className="font-bold">{fmtEur(investTotal)}</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Recettes/an</span><div className="font-bold text-green-600">{fmtEur(recettesBrutes)}</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Régime</span><div className="font-bold">{regimeFiscal === 'MICRO_BIC' ? 'Micro-BIC' : 'Réel'}</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">TMI</span><div className="font-bold">{tmi}%</div></div></div></div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary-orange">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-orange">{loading ? 'Calcul...' : 'Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal de la location saisonnière</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">IR saisonnier total</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(synthese.totIR)}</div>
                    <div className="text-xs text-amber-400">{fmtEur(Math.round(synthese.totIR / dureeDetention))}/an moy.</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">PS total</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.totPS)}</div>
                    <div className="text-xs text-slate-400">17.2% des revenus</div>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-orange-600 text-xs mb-1">Régime fiscal</div>
                    <div className="font-bold text-lg text-orange-600">{regimeFiscal === 'MICRO_BIC' ? 'Micro-BIC' : 'Réel'}</div>
                    <div className="text-xs text-orange-400">{regimeFiscal === 'MICRO_BIC' ? `Abatt. ${abattement}%` : 'Amortissement'}</div>
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
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre la fiscalité saisonnière</h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p>• <strong>Micro-BIC</strong> : Abattement {abattement}%, plafond {fmtEur(plafondMicroBIC)}. Idéal si peu de charges.</p>
                    <p>• <strong>Réel</strong> : Amortissement + charges déductibles. Optimal si travaux importants.</p>
                    {recettesBrutes > 23000 && <p>• <strong>Cotisations SSI</strong> : Recettes {">"} 23 000 € = cotisations sociales obligatoires (~45%).</p>}
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                    <div className="text-xs text-orange-600 mb-1">Recettes brutes</div>
                    <div className="text-xl font-bold text-orange-600">{fmtEur(synthese.recettesBrutes)}</div>
                    <div className="text-xs text-slate-400 mt-1">{nuitsOccupees} nuits</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
                    <div className={`text-xl font-bold ${synthese.rendBrut >= 8 ? 'text-emerald-600' : 'text-slate-800'}`}>{fmtPct(synthese.rendBrut)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.rendBrut >= 10 ? 'Excellent' : synthese.rendBrut >= 8 ? 'Très bon' : 'Correct'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 10 ? 'Excellent' : synthese.tri > 7 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfMoyMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.cfMoyMois > 300 ? 'Autofinancé' : synthese.cfMoyMois >= 0 ? 'Équilibré' : 'Effort'}</div>
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
                    <p>• <strong>Rendement {fmtPct(synthese.rendBrut)}</strong> : {synthese.rendBrut >= 10 ? 'Performance exceptionnelle, la location saisonnière est très rentable.' : synthese.rendBrut >= 8 ? 'Bon rendement, supérieur à la location classique.' : 'Rendement correct mais optimisable.'}</p>
                    <p>• <strong>Occupation {tauxOccupation}%</strong> : {tauxOccupation >= 60 ? 'Excellent taux d\'occupation.' : tauxOccupation >= 40 ? 'Taux d\'occupation correct.' : 'Taux faible, travaillez votre visibilité.'}</p>
                    <p>• <strong>Tarif {fmtEur(tarifNuitee)}/nuit</strong> : {nuitsOccupees} nuits/an × {fmtEur(tarifNuitee)} = {fmtEur(recettesBrutes)} brut.</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 1 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution des recettes et fiscalité</h3>
                <p className="text-sm text-slate-500 mb-4">Recettes brutes et imposition année par année.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse des revenus</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>La location saisonnière génère <strong className="text-orange-600">{fmtEur(recettesBrutes)}/an de recettes brutes</strong>, soit un rendement brut de {fmtPct(synthese.rendBrut)}.</p>
                    <p>Après impôts ({regimeFiscal === 'MICRO_BIC' ? `abatt. ${abattement}%` : 'réel'}), le cash-flow net est de {synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}/mois.</p>
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
                    <p>Investissement : <strong>{fmtEur(investTotal)}</strong> (bien + travaux + mobilier).</p>
                    <p>Avec +{fmtPct(revalorisationBien)}/an, la valeur atteindra {fmtEur(Math.round(prixAchat * Math.pow(1 + revalorisationBien / 100, dureeDetention)))} après {dureeDetention} ans.</p>
                  </div>
                </div>
              </div>

              {/* DÉTAIL CALCUL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Détail du calcul</h3>
                <details>
                  <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul saisonnier</summary>
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
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-orange-50">Recettes</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">IR+PS</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Crédit</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Capital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 hover:bg-slate-50 ${p.cfApres >= 0 ? 'bg-emerald-50/20' : ''}`}>
                          <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-2 px-2 text-right text-orange-600 bg-orange-50/50">{fmtEur(p.recettes)}</td>
                          <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{fmtEur(p.ir + p.ps)}</td>
                          <td className="py-2 px-2 text-right text-slate-500">{p.creditAn > 0 ? fmtEur(p.creditAn) : '-'}</td>
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
                <h3 className="font-bold mb-6 text-xl text-slate-800 flex items-center gap-2"><Target className="w-5 h-5" /> Synthèse et avis professionnel</h3>
                
                {(() => {
                  const levier = safeNumber(synthese.capFinal) / apport
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 15) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 12) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 8) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 5) ptsTRI = 1
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 400) ptsCF = 2.5
                  else if (safeNumber(synthese.cfMoyMois) >= 200) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -150) ptsCF = 1
                  
                  let ptsRend = 0
                  if (safeNumber(synthese.rendBrut) >= 12) ptsRend = 2.5
                  else if (safeNumber(synthese.rendBrut) >= 10) ptsRend = 2
                  else if (safeNumber(synthese.rendBrut) >= 8) ptsRend = 1.5
                  else if (safeNumber(synthese.rendBrut) >= 6) ptsRend = 1
                  
                  let ptsOccup = 0
                  if (tauxOccupation >= 60) ptsOccup = 1.5
                  else if (tauxOccupation >= 45) ptsOccup = 1
                  else if (tauxOccupation >= 30) ptsOccup = 0.5
                  
                  let ptsLevier = 0
                  if (levier >= 8) ptsLevier = 1
                  else if (levier >= 5) ptsLevier = 0.75
                  else if (levier >= 3) ptsLevier = 0.5
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsRend + ptsOccup + ptsLevier
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
                                <span className="w-20 text-slate-600">Occupation</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsOccup / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsOccup}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{tauxOccupation}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
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
                            <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Méthode de calcul du score Location Saisonnière</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Cash-flow (2.5 pts), Rendement brut (2.5 pts), Taux d'occupation (1.5 pt), Levier (1 pt).</p>
                            <p className="text-slate-600">La location saisonnière offre des rendements élevés mais nécessite une gestion active. {recettesBrutes > 23000 ? 'Attention : cotisations SSI au-delà de 23 000 €.' : ''}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {safeNumber(synthese.rendBrut) >= 10 && safeNumber(synthese.cfMoyMois) >= 0 ? (
                      <p><strong>Excellente opération</strong> : Rendement brut de {fmtPct(synthese.rendBrut)} exceptionnel. La location saisonnière est très rentable sur ce bien.</p>
                    ) : safeNumber(synthese.rendBrut) >= 7 ? (
                      <p><strong>Bonne opération</strong> : Rendement brut de {fmtPct(synthese.rendBrut)} supérieur à la location classique. Surveillez le taux d'occupation.</p>
                    ) : (
                      <p><strong>À optimiser</strong> : Rendement de {fmtPct(synthese.rendBrut)}. Augmentez le tarif ou le taux d'occupation pour améliorer la rentabilité.</p>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Location saisonnière : rentabilité élevée mais gestion active nécessaire. {recettesBrutes > 23000 ? 'Attention : SSI obligatoires au-delà de 23 000 €.' : ''}</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={()=>setShowResults(false)} className="btn-primary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-orange{background:#ffedd5;color:#c2410c;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#f97316;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px}.pedagogy-box{background:#ffedd5;border:1px solid #fdba74;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;color:#c2410c}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
