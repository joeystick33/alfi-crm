 
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import {
  Building2, User, Calendar, CreditCard, Landmark, FileText,
  BarChart3, Briefcase, AlertTriangle, RefreshCw, BookOpen, Sparkles,
} from 'lucide-react'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE (calculs côté serveur)
// ══════════════════════════════════════════════════════════════════════════════
const SCPI_DISPLAY = {
  FRAIS_SOUSCRIPTION_MOYEN: 10,
  DELAI_JOUISSANCE: {
    MOYEN: 3,
    titre: 'Délai de jouissance',
    explication: 'Entre la souscription et le premier dividende, un délai moyen de 3 mois est appliqué par les sociétés de gestion de SCPI.',
  },
}

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
const _fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type TypeAcquisition = 'PLEINE_PROPRIETE' | 'NUE_PROPRIETE' | 'CREDIT'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS D'AFFICHAGE SIMPLIFIÉES (vrais calculs côté serveur)
// ══════════════════════════════════════════════════════════════════════════════

const BAREME_IFI_DISPLAY = { SEUIL_IMPOSITION: RULES.ifi.seuil_assujettissement }
const PRELEVEMENTS_SOCIAUX_DISPLAY = { TAUX_GLOBAL: RULES.ps.total * 100 }
const PEDAGOGIE_DISPLAY = { SCPI: { DESCRIPTION: 'Pierre papier - revenus fonciers' } }

function calculNombreParts(params: { situationFamiliale: string; enfantsACharge: number; enfantsGardeAlternee: number; parentIsole: boolean }): number {
  let parts = params.situationFamiliale === 'CELIBATAIRE' ? 1 : 2
  parts += params.enfantsACharge * (params.enfantsACharge <= 2 ? 0.5 : 1)
  parts += params.enfantsGardeAlternee * 0.25
  if (params.parentIsole && params.enfantsACharge > 0) parts += 0.5
  return parts
}

function calculIRDetaille(revenu: number, nbParts: number): { impotNet: number; tmi: number } {
  // Estimation simplifiée du TMI (vrais calculs côté serveur)
  const quotient = revenu / nbParts
  let tmi = 0
  if (quotient > 180294) tmi = 45
  else if (quotient > 83823) tmi = 41
  else if (quotient > 29315) tmi = 30
  else if (quotient > 11497) tmi = 11
  return { impotNet: Math.round(revenu * tmi / 100 * 0.5), tmi }
}

function calculIFI(params: { patrimoineImmobilierBrut: number; dettesDeductibles: number; valeurRP: number }): { impotNet: number; assujetti: boolean } {
  const netRP = params.valeurRP * 0.7
  const base = params.patrimoineImmobilierBrut - params.dettesDeductibles - (params.valeurRP - netRP)
  const assujetti = base >= BAREME_IFI_DISPLAY.SEUIL_IMPOSITION
  return { impotNet: assujetti ? Math.round(base * 0.007) : 0, assujetti }
}

function calculFiscaliteSCPI(params: { revenusPercus: number; partFrance: number; partEtranger: number; tmi: number; interetsEmprunt: number }) {
  const revenusFrance = params.revenusPercus * params.partFrance / 100 - params.interetsEmprunt
  const revenusEtranger = params.revenusPercus * params.partEtranger / 100
  return {
    irFrance: Math.round(Math.max(0, revenusFrance) * params.tmi / 100),
    psFrance: Math.round(Math.max(0, revenusFrance) * PRELEVEMENTS_SOCIAUX_DISPLAY.TAUX_GLOBAL / 100),
    creditImpotEtranger: Math.round(revenusEtranger * params.tmi / 100),
  }
}

export default function SCPIPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // ÉTAPE 1 : Profil client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(60000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)

  const [montantInvesti, setMontantInvesti] = useState(100000)
  const [typeAcquisition, setTypeAcquisition] = useState<TypeAcquisition>('PLEINE_PROPRIETE')
  const [fraisSouscription, setFraisSouscription] = useState(10)
  const [tauxDistribution, setTauxDistribution] = useState(4.5)
  const [partRevenusFrancais, setPartRevenusFrancais] = useState(60)
  const [revalorisationParts, setRevalorisationParts] = useState(1)
  const [dureeDemembrement, setDureeDemembrement] = useState(10)
  const [decoteNuePropriete, setDecoteNuePropriete] = useState(35)
  const [montantCredit, setMontantCredit] = useState(80000)
  const [tauxCredit, setTauxCredit] = useState(4)
  const [dureeCredit, setDureeCredit] = useState(15)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [dureeDetention, setDureeDetention] = useState(15)
  const [revalorisationPrix, setRevalorisationPrix] = useState(1)
  const [delaiJouissance, setDelaiJouissance] = useState(SCPI_DISPLAY.DELAI_JOUISSANCE.MOYEN) // mois
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(0) // pour IFI
  const [dettesImmobilieres, setDettesImmobilieres] = useState(0)
  const [valeurRP, setValeurRP] = useState(0)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

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

  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  const fraisEntree = montantInvesti * fraisSouscription / 100
  const capitalNet = montantInvesti - fraisEntree
  const prixNP = typeAcquisition === 'NUE_PROPRIETE' ? montantInvesti * (100 - decoteNuePropriete) / 100 : montantInvesti
  const apport = typeAcquisition === 'CREDIT' ? montantInvesti - montantCredit : montantInvesti

  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensualite = montantCredit > 0 && tauxMens > 0 ? montantCredit * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : 0

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION SCPI
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/scpi', {
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
          // Investissement
          montantInvesti,
          typeAcquisition,
          fraisSouscription,
          tauxDistribution,
          partRevenusEtrangers: 100 - partRevenusFrancais,
          delaiJouissance,
          // Si démembrement
          dureeDemembrement: typeAcquisition === 'NUE_PROPRIETE' ? dureeDemembrement : undefined,
          decoteNuePropriete: typeAcquisition === 'NUE_PROPRIETE' ? decoteNuePropriete : undefined,
          // Si crédit
          apport: typeAcquisition === 'CREDIT' ? montantInvesti - montantCredit : undefined,
          tauxCredit: typeAcquisition === 'CREDIT' ? tauxCredit : undefined,
          dureeCredit: typeAcquisition === 'CREDIT' ? dureeCredit : undefined,
          assuranceCredit: typeAcquisition === 'CREDIT' ? assuranceCredit : undefined,
          // Projection
          dureeDetention,
          revalorisationParts: revalorisationPrix,
          revalorisationDistribution: 0,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la simulation')
      
      const result = data.data
      
      // Transformer les projections
      const projTransformed = result.projections.map((p: Record<string, number>, idx: number) => ({
        annee: p.annee,
        anIndex: idx + 1,
        valeur: p.valeurParts || 0,
        distribPercue: p.distribution || 0,
        ir: p.ir || 0,
        ps: p.ps || 0,
        creditImpotEtr: p.creditImpotEtranger || 0,
        creditAn: p.echeanceCredit || 0,
        cfNet: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valTot: p.valeurParts || 0,
        enDemembrement: p.enDemembrement || false,
      }))

      setSynthese({
        montantInvesti: result.synthese.investTotal,
        capitalNet: result.synthese.capitalNet ?? 0,
        fraisEntree: result.synthese.fraisEntree ?? 0,
        typeAcquisition,
        prixNP: typeAcquisition === 'NUE_PROPRIETE' ? result.synthese.prixNP : null,
        decoteNuePropriete,
        tauxDistribution,
        rendNet: result.synthese.rendementNet ?? 0,
        tri: result.synthese.tri,
        totDistrib: result.synthese.distributionsCumulees ?? 0,
        totIR: result.synthese.irCumule,
        totPS: result.synthese.psCumule ?? 0,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel ?? Math.round(safeNumber(result.synthese.cashFlowCumule) / dureeDetention / 12),
        cfCum: result.synthese.cashFlowCumule,
        valFinale: result.synthese.valeurFinale ?? 0,
        pvBrute: result.plusValue?.plusValueBrute ?? 0,
        impotPV: result.plusValue?.impotTotal ?? 0,
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinDemembrement,
        anneeFinCredit,
        horsIFI: typeAcquisition === 'NUE_PROPRIETE',
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
        `═══ SCPI ${typeAcquisition.replace(/_/g, ' ')} - SYNTHÈSE ═══`,
        ``,
        `① ACQUISITION : ${fmtEur(montantInvesti)}`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ CASH-FLOW CUMULÉ : ${fmtEur(result.synthese.cashFlowCumule)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation SCPI:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    montantInvesti, typeAcquisition, fraisSouscription, tauxDistribution,
    partRevenusFrancais, revalorisationParts, dureeDemembrement, decoteNuePropriete,
    montantCredit, tauxCredit, dureeCredit, assuranceCredit, dureeDetention,
    delaiJouissance, dateAcquisition, apport, anneeAcq, anneeFinDemembrement, anneeFinCredit,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as any).Plotly; if (!P) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) P.newPlot(chartRef1.current, [
      {
        x: years,
        y: projections.map(p => p.revenusPercus),
        type: 'bar',
        name: 'Revenus perçus',
        marker: { color: '#10b981' },
      },
      {
        x: years,
        y: projections.map(p => p.impositionTotale),
        type: 'scatter',
        name: 'Imposition totale',
        line: { color: '#ef4444', width: 2 },
      },
    ], { title: 'Revenus vs fiscalité', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) P.newPlot(chartRef2.current, [{ x: years, y: projections.map(p => p.valTot), name: 'Valeur', line: { color: '#8b5cf6', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(139,92,246,0.1)' }], { title: 'Valeur parts', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6"><div className="flex items-center gap-4"><Building2 className="w-9 h-9 text-blue-700" /><div><h1 className="text-2xl font-bold">Simulateur SCPI</h1><p className="text-gray-600">Pierre-papier • Pleine propriété, Nue-propriété ou Crédit</p></div></div><div className="flex gap-2 mt-3"><span className="badge-blue">Revenus fonciers</span><span className="badge-green">~{tauxDistribution}%</span><span className="badge-blue">Mutualisation</span></div></div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE selon standard) */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><User className="w-5 h-5" /> Votre profil fiscal</h2>
                <p className="text-sm text-gray-500 mb-6">Les revenus SCPI sont taxés à l'IR (revenus fonciers) + PS 17.2%</p>
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
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-blue-700"><strong>Fiscalité SCPI :</strong> Les revenus sont taxés à TMI ({tmi}%) + PS 17.2% sur la part française. Les revenus étrangers bénéficient d'un crédit d'impôt.</p></div>
              </div>}

              {/* ÉTAPE 2 : INVESTISSEMENT SCPI */}
              {step === 2 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Investissement SCPI</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Montant (€)</label><input type="number" value={montantInvesti} onChange={e=>setMontantInvesti(+e.target.value)}/></div><div className="form-group"><label>Type d'acquisition</label><select value={typeAcquisition} onChange={e=>setTypeAcquisition(e.target.value as TypeAcquisition)}><option value="PLEINE_PROPRIETE">Pleine propriété</option><option value="NUE_PROPRIETE">Nue-propriété (hors IFI)</option><option value="CREDIT">À crédit (effet levier)</option></select></div><div className="form-group"><label>Frais souscription (%)</label><input type="number" value={fraisSouscription} onChange={e=>setFraisSouscription(+e.target.value)} step={0.5}/><span className="text-xs text-gray-500">Moy. marché : ~10%</span></div><div className="form-group"><label>Taux distribution (%)</label><input type="number" value={tauxDistribution} onChange={e=>setTauxDistribution(+e.target.value)} step={0.1}/><span className="text-xs text-gray-500">TDVM brut</span></div><div className="form-group"><label>Part revenus France (%)</label><input type="number" value={partRevenusFrancais} onChange={e=>setPartRevenusFrancais(+e.target.value)}/><span className="text-xs text-gray-500">IR+PS sur cette part</span></div><div className="form-group"><label>Délai jouissance (mois)</label><input type="number" value={delaiJouissance} onChange={e=>setDelaiJouissance(+e.target.value)} min={0} max={12}/><span className="text-xs text-gray-500">Moy. : 6 mois</span></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Délai de jouissance</h4><p className="text-sm text-blue-700">Le délai de jouissance est la période pendant laquelle vous ne percevez pas de revenus. Il est généralement de 6 mois.</p></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Capital net investi</span><div className="font-bold text-lg">{fmtEur(capitalNet)}</div></div><div><span className="text-gray-500">Frais entrée</span><div className="font-bold text-lg text-amber-600">{fmtPct(fraisSouscription)} soit {fmtEur(fraisEntree)}</div></div><div><span className="text-gray-500">Revenus estimés</span><div className="font-bold text-lg text-green-600">{fmtEur(Math.round(capitalNet * tauxDistribution / 100))}/an</div></div></div></div>}
              {step === 3 && typeAcquisition === 'NUE_PROPRIETE' && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Démembrement</h2><div className="grid grid-cols-2 gap-4"><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeDemembrement} onChange={e=>setDureeDemembrement(+e.target.value)} min={5} max={20}/></div><div className="form-group"><label>Décote NP (%)</label><input type="number" value={decoteNuePropriete} onChange={e=>setDecoteNuePropriete(+e.target.value)}/></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Avantages</h4><ul className="text-sm text-blue-700 space-y-1"><li>Prix réduit (-{decoteNuePropriete}%)</li><li>Pas d'IR pendant {dureeDemembrement} ans</li><li>Hors IFI</li><li>Récupération PP sans fiscalité</li></ul></div><div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm"><div><span className="text-gray-500">Prix NP</span><div className="font-bold text-lg">{fmtEur(prixNP)}</div></div><div><span className="text-gray-500">Valeur PP à terme</span><div className="font-bold text-lg text-green-600">{fmtEur(capitalNet)}</div></div></div></div>}

              {step === 3 && typeAcquisition === 'CREDIT' && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Crédit</h2><div className="grid grid-cols-3 gap-4"><div className="form-group"><label>Montant (€)</label><input type="number" value={montantCredit} onChange={e=>setMontantCredit(+e.target.value)}/></div><div className="form-group"><label>Taux (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div><div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Apport</span><div className="font-bold text-lg">{fmtEur(apport)}</div></div><div><span className="text-gray-500">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div><div><span className="text-gray-500">Effet levier</span><div className={`font-bold text-lg ${tauxDistribution > tauxCredit ? 'text-green-600' : 'text-red-500'}`}>{tauxDistribution > tauxCredit ? '+ Positif' : '- Négatif'}</div></div></div></div>}

              {step === 3 && typeAcquisition === 'PLEINE_PROPRIETE' && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Projection</h2><p className="text-gray-600 mb-4">Pleine propriété classique. Passez à l'étape suivante.</p></div>}

              {step === 4 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Landmark className="w-5 h-5" /> Fiscalité & IFI</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Durée détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={5} max={30}/></div><div className="form-group"><label>Patrimoine immo. existant (€)</label><input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/><span className="text-xs text-gray-500">Pour calcul IFI</span></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div><div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div><div><span className="text-gray-500">Revenus totaux</span><div className="font-bold text-lg">{fmtEur(revenusTotaux)}</div></div></div><div className="pedagogy-box mt-4"><h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Fiscalité SCPI (références CGI)</h4><div className="text-sm text-blue-700 space-y-2"><div>• <strong>Revenus français</strong> : IR (TMI) + PS 17.2% (art. 14, 28)</div><div>• <strong>Revenus étrangers</strong> : Crédit d'impôt (conventions fiscales)</div><div>• <strong>Plus-value</strong> : Régime PV immobilières (art. 150 U)</div><div>• <strong>IFI</strong> : Parts SCPI taxables sauf NP (art. 965)</div></div></div><div className="info-box mt-4"><div className="flex justify-between items-center"><span>Patrimoine immobilier après investissement :</span><span className={`font-bold ${(patrimoineImmobilierExistant + (typeAcquisition === 'NUE_PROPRIETE' ? 0 : capitalNet)) >= BAREME_IFI_DISPLAY.SEUIL_IMPOSITION ? 'text-orange-600' : 'text-green-600'}`}>{fmtEur(patrimoineImmobilierExistant + (typeAcquisition === 'NUE_PROPRIETE' ? 0 : capitalNet))}</span></div>{typeAcquisition === 'NUE_PROPRIETE' && <div className="text-sm text-green-600 mt-2">Nue-propriété : hors assiette IFI</div>}</div></div>}

              {step === 5 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Projection</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="form-group"><label>Revalorisation parts (%/an)</label><input type="number" value={revalorisationParts} onChange={e=>setRevalorisationParts(+e.target.value)} step={0.1}/></div></div><div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm"><div><span className="text-gray-500">Valeur initiale</span><div className="font-bold text-lg">{fmtEur(capitalNet)}</div></div><div><span className="text-gray-500">Valeur à {dureeDetention} ans</span><div className="font-bold text-lg text-green-600">{fmtEur(Math.round(capitalNet * Math.pow(1 + revalorisationParts / 100, dureeDetention)))}</div></div><div><span className="text-gray-500">Distributions cumulées</span><div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(capitalNet * tauxDistribution / 100 * dureeDetention))}</div></div></div></div>}

              {step === 6 && <div className="animate-fadeIn"><h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Récapitulatif</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Investissement</span><div className="font-bold">{fmtEur(montantInvesti)}</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Type</span><div className="font-bold">{typeAcquisition.replace(/_/g, ' ')}</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">TMI</span><div className="font-bold">{tmi}%</div></div><div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Durée</span><div className="font-bold">{dureeDetention} ans</div></div></div></div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 6 ? <button onClick={()=>setStep(step+1)} className="btn-primary">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary">{loading ? 'Calcul...' : 'Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              
              {/* IMPACT FISCAL GLOBAL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">IR SCPI total</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(synthese.totIR)}</div>
                    <div className="text-xs text-amber-400">{fmtEur(Math.round(synthese.totIR / dureeDetention))}/an moy.</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">PS total</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.totPS)}</div>
                    <div className="text-xs text-slate-400">17.2% revenus FR</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI avant</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.assujettiIFIAvant ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {synthese.profilClient?.assujettiIFIAvant ? fmtEur(synthese.profilClient.ifiAvant) : 'Non assujetti'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI après</div>
                    <div className={`font-bold text-lg ${synthese.horsIFI ? 'text-emerald-600' : synthese.profilClient?.assujettiIFIApres ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {synthese.horsIFI ? 'Hors IFI' : synthese.profilClient?.assujettiIFIApres ? fmtEur(synthese.profilClient.ifiApres) : 'Non assujetti'}
                    </div>
                    {synthese.horsIFI && <div className="text-xs text-emerald-500">NP {dureeDemembrement} ans</div>}
                    {!synthese.horsIFI && synthese.profilClient?.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(synthese.profilClient.impactIFI)}/an</div>}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre la fiscalité SCPI</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Revenus français ({partRevenusFrancais}%)</strong> : Taxés IR (TMI {tmi}%) + PS 17.2%.</p>
                    <p>• <strong>Revenus étrangers ({100-partRevenusFrancais}%)</strong> : Crédit d'impôt ou exonération selon conventions.</p>
                    {typeAcquisition === 'NUE_PROPRIETE' && <p>• <strong>Nue-propriété</strong> : Pas de revenus ni d'IFI pendant {dureeDemembrement} ans, puis récupération PP sans fiscalité.</p>}
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 6 ? 'Excellent' : synthese.tri > 4 ? 'Bon' : 'Correct'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement net</div>
                    <div className="text-xl font-bold text-slate-800">{fmtPct(synthese.rendNet)}</div>
                    <div className="text-xs text-slate-400 mt-1">Après fiscalité</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfMoyMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{typeAcquisition === 'NUE_PROPRIETE' ? 'Après PP' : 'Net'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Distributions</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.totDistrib)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Valeur finale</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.valFinale || montantInvesti)}</div>
                    <div className="text-xs text-slate-400 mt-1">+{fmtPct(revalorisationParts)}/an</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                    <div className="text-xs text-emerald-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-emerald-600">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Net d'impôts</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : {synthese.tri > 6 ? 'Performance supérieure à la moyenne des SCPI (5-6%).' : synthese.tri > 4 ? 'Performance dans la moyenne.' : 'Performance modeste.'}</p>
                    <p>• <strong>Type : {typeAcquisition.replace(/_/g, ' ')}</strong> : {typeAcquisition === 'NUE_PROPRIETE' ? 'Stratégie patrimoniale sans revenus immédiats mais avec décote et exo IFI.' : typeAcquisition === 'CREDIT' ? 'Effet de levier avec intérêts déductibles.' : 'Acquisition classique avec revenus réguliers.'}</p>
                    <p>• <strong>Frais d'entrée {fmtPct(fraisSouscription)}</strong> : {fraisSouscription > 10 ? 'Élevés, privilégiez SCPI à frais réduits ou sans frais.' : fraisSouscription > 8 ? 'Dans la moyenne du marché.' : 'Compétitifs.'}</p>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 1 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution des distributions et fiscalité</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique montre les revenus perçus et l'imposition associée année par année.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse des revenus</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {typeAcquisition === 'NUE_PROPRIETE' ? (
                      <p>En <strong className="text-blue-600">nue-propriété</strong>, pas de revenus pendant {dureeDemembrement} ans. Puis récupération de la pleine propriété avec {fmtPct(tauxDistribution)} de rendement estimé.</p>
                    ) : (
                      <p>Les SCPI génèrent des <strong className="text-emerald-600">distributions régulières de {fmtPct(tauxDistribution)}</strong> brut, soit environ {fmtEur(Math.round(montantInvesti * tauxDistribution / 100 * (100 - tmi - 17.2 * partRevenusFrancais / 100) / 100))}/an net après fiscalité.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* GRAPHIQUE 2 */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du capital</h3>
                <p className="text-sm text-slate-500 mb-4">Valeur des parts SCPI au fil du temps.</p>
                <div ref={chartRef2} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Capital investi : <strong>{fmtEur(montantInvesti)}</strong> dont {fmtEur(fraisEntree)} de frais d'entrée ({fmtPct(fraisSouscription)}).</p>
                    <p>Avec une revalorisation de {fmtPct(revalorisationParts)}/an, la valeur des parts atteindra environ <strong className="text-blue-600">{fmtEur(Math.round(montantInvesti * Math.pow(1 + revalorisationParts / 100, dureeDetention)))}</strong> dans {dureeDetention} ans.</p>
                  </div>
                </div>
              </div>

              {/* DÉTAIL CALCUL */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Détail du calcul</h3>
                <details>
                  <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul SCPI</summary>
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
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Valeur parts</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-emerald-50">Distribution</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600 bg-amber-50">IR+PS</th>
                        <th className="py-2 px-2 text-right font-semibold text-slate-600">Cash-flow net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 hover:bg-slate-50 ${p.enDemembrement ? 'bg-slate-100/50' : ''}`}>
                          <td className="py-2 px-2 font-medium text-slate-800">{p.annee} {p.enDemembrement && <span className="text-xs text-slate-400">NP</span>}</td>
                          <td className="py-2 px-2 text-right text-blue-600 font-medium">{fmtEur(p.valTot)}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 bg-emerald-50/50">{p.distribPercue > 0 ? '+' + fmtEur(p.distribPercue) : '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-600 bg-amber-50/50">{p.ir + p.ps > 0 ? fmtEur(p.ir + p.ps) : '-'}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${p.cfNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfNet >= 0 ? '+' : ''}{fmtEur(p.cfNet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AVIS PROFESSIONNEL */}
              <div className="sim-card bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <h3 className="font-bold mb-4 text-lg flex items-center gap-2"><Briefcase className="w-5 h-5" /> Avis professionnel sur l'investissement SCPI</h3>
                <div className="text-sm space-y-3 text-slate-200">
                  {typeAcquisition === 'NUE_PROPRIETE' ? (
                    <p><strong className="text-blue-400">Stratégie patrimoniale</strong> : L'acquisition en nue-propriété est idéale pour constituer un patrimoine sans fiscalité immédiate ni IFI. La décote de {decoteNuePropriete}% compense l'absence de revenus.</p>
                  ) : synthese.tri > 5 ? (
                    <p><strong className="text-emerald-400">Investissement performant</strong> : TRI de {fmtPct(synthese.tri)} satisfaisant pour une SCPI. Les revenus réguliers constituent un complément de revenus appréciable.</p>
                  ) : (
                    <p><strong className="text-amber-400">Performance modeste</strong> : TRI de {fmtPct(synthese.tri)} en dessous de la moyenne. Vérifiez les frais et comparez avec d'autres SCPI.</p>
                  )}
                  <p className="text-slate-400 text-xs mt-4"><em>SCPI : placement immobilier mutualisé, idéal pour diversification. Liquidité variable selon les SCPI.</em></p>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={()=>setShowResults(false)} className="btn-primary flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(30,64,175,.25)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none}.info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}.pedagogy-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:16px}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
