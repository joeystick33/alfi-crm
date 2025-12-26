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
const _fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type TypeClassement = 'CLASSE' | 'INSCRIT'
type OuverturePublic = 'OUI' | 'NON' | 'PARTIEL'

export default function MonumentsHistoriquesPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ÉTAPE 1 : Profil client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(200000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(100000)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(2000000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(500000)
  const [valeurRP, setValeurRP] = useState(800000)

  // Date d'acquisition
  const [dateAcquisition, setDateAcquisition] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Bien
  const [prixAcquisition, setPrixAcquisition] = useState(500000)
  const [fraisNotaire, setFraisNotaire] = useState(40000)
  const [surface, setSurface] = useState(200)
  const [typeClassement, setTypeClassement] = useState<TypeClassement>('CLASSE')
  const [ouverturePublic, setOuverturePublic] = useState<OuverturePublic>('OUI')
  const [nbVisiteurs, setNbVisiteurs] = useState(1500) // visiteurs/an pour ouverture
  
  // Travaux (pas de plafond!)
  const [travauxAn1, setTravauxAn1] = useState(200000)
  const [travauxAn2, setTravauxAn2] = useState(150000)
  const [travauxAn3, setTravauxAn3] = useState(100000)
  const [travauxAn4, setTravauxAn4] = useState(50000)
  const [partTravauxSubventionnee, setPartTravauxSubventionnee] = useState(20) // % subventions DRAC
  
  // ÉTAPE 4 : Financement
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(200000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  
  // ÉTAPE 5 : Revenus locatifs
  const [loyerMensuel, setLoyerMensuel] = useState(2500)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [chargesLocatives, setChargesLocatives] = useState(0)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)
  const [recettesVisites, setRecettesVisites] = useState(15000) // recettes visites/an
  
  // ÉTAPE 6 : Charges MH (élevées)
  const [chargesEntretien, setChargesEntretien] = useState(25000) // entretien annuel élevé
  const [assurancePNO, setAssurancePNO] = useState(3000)
  const [taxeFonciere, setTaxeFonciere] = useState(0) // souvent exonéré
  const [chargesCopro, setChargesCopro] = useState(0)
  const [fraisGestion, setFraisGestion] = useState(0) // % du loyer
  
  // ÉTAPE 7 : Projection
  const [dureeDetention, setDureeDetention] = useState(20)
  const [revalorisationBien, setRevalorisationBien] = useState(3)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Calculé - Profil client
  const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenuGlobal = revenusSalaires + revenusFonciersExistants + autresRevenus
  const irAvant = calculIRDetaille(revenuGlobal, nombreParts)
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
  const [explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  const MH = DISPOSITIFS_FISCAUX.MONUMENTS_HISTORIQUES
  const travauxTotal = travauxAn1 + travauxAn2 + travauxAn3 + travauxAn4
  const travauxNets = travauxTotal * (100 - partTravauxSubventionnee) / 100
  const joursOuverture = ouverturePublic === 'OUI'
    ? Math.max(MH.MINIMUM_JOURS_OUVERTURE, Math.round(nbVisiteurs / 20))
    : ouverturePublic === 'PARTIEL'
      ? Math.max(10, Math.round(nbVisiteurs / 40))
      : 0
  
  // MH : Taux de déduction selon ouverture au public
  // CGI art. 156-II-1° ter :
  // - Ouvert au public (≥50j/an ou 40j été) : 100% travaux + 100% charges
  // - Loué sans ouverture : 100% travaux, charges foncières classiques
  // - Occupé sans ouverture : 100% travaux, 0% charges courantes
  const tauxDeductionTravaux = 100 // Travaux toujours 100% déductibles MH
  const tauxDeductionCharges = ouverturePublic === 'OUI' ? 100 : ouverturePublic === 'PARTIEL' ? 50 : 0
  const travauxDeductibles = travauxNets // 100% déductibles (sauf subventions)
  
  const investTotal = prixAcquisition + fraisNotaire + travauxTotal
  const montantEmprunte = Math.max(0, investTotal - apport)
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensualite = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION MONUMENTS HISTORIQUES
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/monuments-historiques', {
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
          prixAcquisition,
          fraisNotaire,
          travaux: travauxAn1 + travauxAn2 + travauxAn3 + travauxAn4,
          dureeTravaux: [travauxAn1, travauxAn2, travauxAn3, travauxAn4].filter(t => t > 0).length || 1,
          ouverturePublic: ouverturePublic === 'OUI' ? 'OUI' : ouverturePublic === 'PARTIEL' ? 'PARTIEL' : 'NON',
          joursOuverture,
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          loyerMensuel,
          chargesLocatives,
          vacanceSemaines,
          revalorisationLoyer,
          chargesEntretienMH: chargesEntretien,
          chargesCopro,
          assurancePNO,
          taxeFonciere,
          fraisGestion,
          dureeDetention,
          revalorisationBien,
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
        phase: idx < 4 ? 'Travaux' : 'Exploitation',
        revenus: p.revenus || 0,
        charges: p.charges || 0,
        deductionRG: p.deductionRG || 0,
        economieIR: p.economieIR || 0,
        cfAvant: p.cfAvantImpots || 0,
        cfApres: p.cfApresImpots || 0,
        capRestant: p.capitalRestant || 0,
        valBien: p.valeurBien || 0,
        capNet: p.capitalNet || 0,
      }))

      setSynthese({
        investTotal: result.synthese.investTotal,
        travauxTotal,
        travauxDeductibles: result.monumentsHistoriques?.travauxDeductibles ?? 0,
        tauxDeductionTravaux: result.monumentsHistoriques?.tauxDeductionTravaux ?? 100,
        tauxDeductionCharges: result.monumentsHistoriques?.tauxDeductionCharges ?? 50,
        totEconomie: result.monumentsHistoriques?.economieIRTotale ?? 0,
        totIR: result.synthese.irCumule,
        tri: result.synthese.tri,
        cfCum: result.synthese.cashFlowCumule,
        valRev: result.plusValue?.valeurRevente ?? 0,
        pvExoneree: dureeDetention >= 15,
        capFinal: result.synthese.capitalFinal,
        gainTotal: result.synthese.gainTotal,
        anneeAcquisition: anneeAcq,
        anneeFinTravaux,
        anneeFinCredit,
        anneeExonerationIR,
        anneeExonerationPS,
        exonereIFI: ouverturePublic === 'OUI',
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
        `═══ MONUMENTS HISTORIQUES - SYNTHÈSE ═══`,
        ``,
        `① ÉCONOMIE IR TOTALE : ${fmtEur(result.monumentsHistoriques?.economieIRTotale || 0)}`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation Monuments Historiques:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAcquisition, fraisNotaire,
    travauxAn1, travauxAn2, travauxAn3, travauxAn4, partTravauxSubventionnee,
    typeClassement, ouverturePublic, nbVisiteurs,
    apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, chargesLocatives, vacanceSemaines, revalorisationLoyer,
    recettesVisites, chargesEntretien, chargesCopro, assurancePNO, taxeFonciere, fraisGestion,
    dureeDetention, revalorisationBien, fraisRevente,
    travauxTotal, travauxDeductibles, tauxDeductionTravaux, tauxDeductionCharges,
    anneeAcq, anneeFinTravaux, anneeFinCredit, anneeExonerationIR, anneeExonerationPS,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const Pl = (window as any).Plotly; if (!Pl) return
    const years = projections.map(p => p.annee)
    if (chartRef1.current) Pl.newPlot(chartRef1.current, [
      { x: years, y: projections.map(p => p.cfApres), type: 'bar', name: 'Cash-flow', marker: { color: projections.map(p => p.phase === 'Travaux' ? '#f59e0b' : '#10b981') } },
      { x: years, y: projections.map(p => p.economieIR), type: 'scatter', name: 'Économie IR', mode: 'lines+markers', line: { color: '#7c3aed', width: 3 } },
    ], { title: 'Cash-flow et économie fiscale', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
    if (chartRef2.current) Pl.newPlot(chartRef2.current, [
      { x: years, y: projections.map(p => p.valBien), name: 'Valeur', line: { color: '#3b82f6' } },
      { x: years, y: projections.map(p => p.capRestant), name: 'Dette', line: { color: '#ef4444' }, fill: 'tozeroy' },
    ], { title: 'Patrimoine', height: 250, margin: { t: 40, b: 30, l: 50, r: 20 }, paper_bgcolor: 'transparent', legend: { orientation: 'h', y: -0.15 }, xaxis: { title: 'Année', tickangle: -45 } }, { displayModeBar: false })
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" onLoad={handlePlotlyLoad} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-blue-800 hover:text-blue-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏰</span>
              <div><h1 className="text-2xl font-bold">Simulateur Monuments Historiques</h1><p className="text-gray-600">Bien classé/inscrit • Déduction 100% • Sans plafond</p></div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-amber">{typeClassement === 'CLASSE' ? 'Classé MH' : 'Inscrit MH'}</span>
              <span className="badge-blue">Travaux 100%</span>
              <span className="badge-green">Travaux {fmtEur(travauxTotal)}</span>
            </div>
          </div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div><div className="text-xs text-slate-500 mt-1 text-right">Étape {step}/7</div></div>

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
                </div>
                <h3 className="font-semibold text-slate-700 mt-6 mb-3">Patrimoine (pour calcul IFI)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Patrimoine immo existant (€)</label><input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/></div>
                  <div className="form-group"><label>Dettes immobilières (€)</label><input type="number" value={dettesImmobilieres} onChange={e=>setDettesImmobilieres(+e.target.value)}/></div>
                  <div className="form-group"><label>Valeur résidence principale (€)</label><input type="number" value={valeurRP} onChange={e=>setValeurRP(+e.target.value)}/><span className="form-hint">Abattement 30% IFI</span></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{nombreParts}</div></div>
                  <div><span className="text-gray-500">Revenu imposable</span><div className="font-bold text-lg">{fmtEur(revenuGlobal)}</div></div>
                  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
                  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-amber-600' : 'text-emerald-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><p className="text-sm text-blue-700"><strong>Pourquoi ces informations ?</strong> Le dispositif MH déduit les travaux du revenu GLOBAL. Plus votre TMI est élevé, plus l'économie d'impôt est importante. Un TMI de 45% génère 45 000 € d'économie pour 100 000 € de travaux.</p></div>
              </div>}

              {/* ÉTAPE 2 : BIEN IMMOBILIER */}
              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🏰 Monument Historique</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Date d'acquisition</label><input type="month" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)}/></div>
                  <div className="form-group"><label>Prix d'acquisition (€)</label><input type="number" value={prixAcquisition} onChange={e=>setPrixAcquisition(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/></div>
                  <div className="form-group"><label>Surface (m²)</label><input type="number" value={surface} onChange={e=>setSurface(+e.target.value)}/></div>
                  <div className="form-group"><label>Type de classement</label><select value={typeClassement} onChange={e=>setTypeClassement(e.target.value as TypeClassement)}><option value="CLASSE">Classé Monument Historique</option><option value="INSCRIT">Inscrit à l'Inventaire</option></select></div>
                  <div className="form-group"><label>Ouverture au public</label><select value={ouverturePublic} onChange={e=>setOuverturePublic(e.target.value as OuverturePublic)}><option value="OUI">Oui (50+ jours/an)</option><option value="PARTIEL">Partielle</option><option value="NON">Non</option></select></div>
                  {ouverturePublic !== 'NON' && <div className="form-group"><label>Visiteurs/an estimés</label><input type="number" value={nbVisiteurs} onChange={e=>setNbVisiteurs(+e.target.value)}/></div>}
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-amber-800 mb-2">📜 CGI art. 156-II-1° ter</h4><ul className="text-sm text-amber-700 space-y-1"><li>• <strong>Classé MH :</strong> protection maximale, travaux supervisés DRAC</li><li>• <strong>Inscrit :</strong> protection partielle, déclaration préalable ABF</li><li>• <strong>Ouverture au public :</strong> 50 jours/an dont 25 non ouvrables, ou 40 jours avril-septembre → déduction 100% + exonération IFI</li></ul></div>
              </div>}

              {/* ÉTAPE 3 : TRAVAUX */}
              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🔧 Travaux de restauration (SANS PLAFOND)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Année 1 (€)</label><input type="number" value={travauxAn1} onChange={e=>setTravauxAn1(+e.target.value)}/></div>
                  <div className="form-group"><label>Année 2 (€)</label><input type="number" value={travauxAn2} onChange={e=>setTravauxAn2(+e.target.value)}/></div>
                  <div className="form-group"><label>Année 3 (€)</label><input type="number" value={travauxAn3} onChange={e=>setTravauxAn3(+e.target.value)}/></div>
                  <div className="form-group"><label>Année 4 (€)</label><input type="number" value={travauxAn4} onChange={e=>setTravauxAn4(+e.target.value)}/></div>
                  <div className="form-group col-span-2"><label>Part subventionnée DRAC (%)</label><input type="number" value={partTravauxSubventionnee} onChange={e=>setPartTravauxSubventionnee(+e.target.value)} min={0} max={80}/><span className="form-hint">Les travaux subventionnés ne sont pas déductibles</span></div>
                </div>
                <div className="info-box mt-4"><div className="grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-blue-800">Travaux bruts</span><div className="font-bold text-lg">{fmtEur(travauxTotal)}</div></div>
                  <div><span className="text-blue-800">- Subventions</span><div className="font-bold text-lg text-orange-600">-{fmtEur(Math.round(travauxTotal * partTravauxSubventionnee / 100))}</div></div>
                  <div><span className="text-blue-800">= Déductibles</span><div className="font-bold text-lg">{fmtEur(Math.round(travauxNets))}</div></div>
                  <div><span className="text-blue-800">Économie IR (TMI {tmi}%)</span><div className="font-bold text-2xl text-emerald-600">{fmtEur(Math.round(travauxDeductibles * tmi / 100))}</div></div>
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
                      <div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)}/></div>
                      <div className="form-group"><label>Assurance crédit (%)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.01}/></div>
                    </div>
                    <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-blue-800">Investissement total</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                      <div><span className="text-blue-800">Emprunté</span><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                      <div><span className="text-blue-800">Mensualité</span><div className="font-bold text-lg">{fmtEur(Math.round(mensualite))}</div></div>
                    </div>
                  </>
                )}
              </div>}

              {/* ÉTAPE 5 : REVENUS LOCATIFS */}
              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">💰 Revenus locatifs</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Loyer mensuel (€)</label><input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)}/><span className="form-hint">Si location partielle</span></div>
                  <div className="form-group"><label>Charges locatives (€ / mois)</label><input type="number" value={chargesLocatives} onChange={e=>setChargesLocatives(+e.target.value)} min={0}/><span className="form-hint">Refacturées au locataire</span></div>
                  <div className="form-group"><label>Vacance (semaines/an)</label><input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52}/></div>
                  <div className="form-group"><label>Revalorisation loyer (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1}/></div>
                  {ouverturePublic !== 'NON' && <div className="form-group"><label>Recettes visites (€/an)</label><input type="number" value={recettesVisites} onChange={e=>setRecettesVisites(+e.target.value)}/></div>}
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-blue-800">Loyer annuel brut</span><div className="font-bold text-lg">{fmtEur(loyerMensuel * 12)}</div></div>
                  <div><span className="text-blue-800">Taux vacance</span><div className="font-bold text-lg">{fmtPct(vacanceSemaines / 52 * 100)}</div></div>
                  <div><span className="text-blue-800">Loyer annuel net</span><div className="font-bold text-lg">{fmtEur(Math.round(loyerMensuel * 12 * (1 - vacanceSemaines / 52)))}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 6 : CHARGES MH */}
              {step === 6 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-1">📋 Charges MH (élevées)</h2>
                <p className="text-sm text-gray-500 mb-6">Les MH ont des charges d'entretien très supérieures aux biens classiques</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Entretien annuel (€)</label><input type="number" value={chargesEntretien} onChange={e=>setChargesEntretien(+e.target.value)}/><span className="form-hint">Très élevé pour MH</span></div>
                  <div className="form-group"><label>Charges copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div>
                  <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div>
                  <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/><span className="form-hint">Souvent exonérée pour MH</span></div>
                  <div className="form-group"><label>Frais gestion (%)</label><input type="number" value={fraisGestion} onChange={e=>setFraisGestion(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-blue-800">Charges totales/an</span><div className="font-bold text-lg">{fmtEur(chargesEntretien + assurancePNO + taxeFonciere)}</div></div>
                  <div><span className="text-blue-800">Ratio charges/loyers</span><div className="font-bold text-lg">{fmtPct((chargesEntretien + assurancePNO + taxeFonciere) / (loyerMensuel * 12) * 100)}</div></div>
                </div>
              </div>}

              {/* ÉTAPE 7 : PROJECTION */}
              {step === 7 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">🏛️ Projection</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="form-group"><label>Durée détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={15}/><span className="form-hint">Min 15 ans (exo PV)</span></div>
                  <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Frais revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-amber-800">TMI calculé</span><div className="font-bold text-lg">{tmi}%</div></div>
                  <div><span className="text-amber-800">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div>
                  <div><span className="text-amber-800">Revenu global</span><div className="font-bold text-lg">{fmtEur(revenuGlobal)}</div></div>
                  <div><span className="text-amber-800">Économie IR travaux</span><div className="font-bold text-lg text-emerald-600">{fmtEur(Math.round(travauxDeductibles * tmi / 100))}</div></div>
                </div>
                <div className="pedagogy-box mt-4"><h4 className="font-semibold text-amber-800 mb-2">✨ Avantages exceptionnels MH</h4><ul className="text-sm text-amber-700 space-y-1">
                  <li>• ✅ Déduction 100% travaux du revenu global <strong>sans plafond</strong></li>
                  <li>• ✅ <strong>Hors plafond des niches fiscales</strong> (10 000 €)</li>
                  <li>• ✅ Exonération IFI si ouvert au public</li>
                  <li>• ✅ Abattement transmission 75% (Pacte Dutreil MH)</li>
                  <li>• ✅ Exonération plus-value si conservation ≥15 ans</li>
                </ul></div>
              </div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary-amber">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary-amber">{loading ? '⏳' : '🧮 Analyser'}</button>}
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
                    <div className="text-slate-500 text-xs mb-1">IR actuel (hors MH)</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(irAvant.impotNet)}</div>
                    <div className="text-xs text-slate-400">Sur {fmtEur(revenuGlobal)}/an</div>
                    <div className="text-xs text-slate-400">TMI : {tmi}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-600 text-xs mb-1">Déduction revenu global</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(synthese.travauxDeductibles)}</div>
                    <div className="text-xs text-amber-400">100% travaux (hors subv.)</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs mb-1">Économie IR totale</div>
                    <div className="font-bold text-lg text-emerald-600">{fmtEur(synthese.totEconomie)}</div>
                    <div className="text-xs text-emerald-400">HORS plafond niches</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-xs mb-1">Exonération PV</div>
                    <div className="font-bold text-lg text-blue-600">{synthese.pvExoneree ? '✅ Oui' : '❌ Non'}</div>
                    <div className="text-xs text-blue-400">{dureeDetention >= 15 ? '≥15 ans : exonérée' : `${15 - dureeDetention} ans restants`}</div>
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
                      {synthese.exonereIFI ? <span className="text-emerald-600">Exonéré</span> : synthese.profilClient?.assujettiIFIApres ? fmtEur(synthese.profilClient.ifiApres) : 'Non assujetti'}
                    </div>
                    {synthese.exonereIFI && <div className="text-xs text-emerald-500">Ouvert au public</div>}
                    {!synthese.exonereIFI && synthese.profilClient?.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(synthese.profilClient.impactIFI)}/an</div>}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">📊 Comprendre la fiscalité Monuments Historiques</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>• <strong>Déduction du revenu global</strong> : Les travaux ({fmtEur(travauxDeductibles)}) sont déductibles à 100% du revenu global, réduisant directement la base imposable.</p>
                    <p>• <strong>Sans aucun plafond</strong> : Contrairement au Malraux (400k€) ou Pinel, les MH n'ont AUCUN plafond de travaux ni de niches fiscales.</p>
                    <p>• <strong>Économie réelle</strong> : Avec un TMI de {tmi}%, l'économie d'IR est de {fmtEur(synthese.totEconomie)} sur les travaux.</p>
                  </div>
                </div>
              </div>

              {/* INDICATEURS CLÉS */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <div className="text-xs text-amber-600 mb-1">Économie IR</div>
                    <div className="text-xl font-bold text-amber-600">{fmtEur(synthese.totEconomie)}</div>
                    <div className="text-xs text-slate-400 mt-1">TMI {tmi}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Travaux déductibles</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.travauxDeductibles)}</div>
                    <div className="text-xs text-slate-400 mt-1">- subventions</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 8 ? 'Excellent' : synthese.tri > 5 ? 'Très bon' : 'Bon'}</div>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${synthese.cfCum >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`text-xs mb-1 ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>CF cumulé</div>
                    <div className={`text-xl font-bold ${synthese.cfCum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{synthese.cfCum >= 0 ? '+' : ''}{fmtEur(synthese.cfCum)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Valeur finale</div>
                    <div className="text-xl font-bold text-slate-800">{fmtEur(synthese.valRev || 0)}</div>
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
                <h3 className="font-bold mb-4 text-slate-800">Cash-flow et économie d'IR</h3>
                <p className="text-sm text-slate-600 mb-4">Ce graphique montre l'évolution du cash-flow (barres) et de l'économie d'IR (ligne) pendant les phases travaux et exploitation.</p>
                <div ref={chartRef1}/>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">📊 Analyse du cash-flow</h4>
                  <p className="text-sm text-amber-700">Les premières années génèrent une forte économie d'IR grâce à la déduction des travaux. Ensuite, les revenus locatifs et/ou visites génèrent du cash-flow régulier.</p>
                </div>
              </div>

              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Évolution du patrimoine</h3>
                <p className="text-sm text-slate-600 mb-4">Ce graphique montre l'évolution de la valeur du monument et du capital net.</p>
                <div ref={chartRef2}/>
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-2">📊 Analyse patrimoniale</h4>
                  <p className="text-sm text-emerald-700">Un Monument Historique {typeClassement === 'CLASSE' ? 'classé' : 'inscrit'} {ouverturePublic === 'OUI' ? 'ouvert au public' : ''} bénéficie d'une valorisation exceptionnelle et d'avantages successoraux majeurs (abattement 75%).</p>
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
                        <th className="py-2 px-2 text-right">Revenus</th>
                        <th className="py-2 px-2 text-right">Déduction RG</th>
                        <th className="py-2 px-2 text-right">Économie IR</th>
                        <th className="py-2 px-2 text-right">Cash-flow</th>
                        <th className="py-2 px-2 text-right">Capital net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p=>(
                        <tr key={p.annee} className={`border-b hover:bg-slate-50 ${p.phase === 'Travaux' ? 'bg-amber-50' : ''}`}>
                          <td className="py-2 px-2 font-medium">{p.annee}</td>
                          <td className="py-2 px-2 text-center">{p.phase === 'Travaux' ? '🔧' : '🏰'}</td>
                          <td className="py-2 px-2 text-right text-emerald-600">{p.revenus > 0 ? fmtEur(p.revenus) : '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-600">{p.deductionRG > 0 ? fmtEur(p.deductionRG) : '-'}</td>
                          <td className="py-2 px-2 text-right text-amber-600 font-medium">{p.economieIR > 0 ? '+'+fmtEur(p.economieIR) : '-'}</td>
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
                  const effetFiscal = safeNumber(synthese.totEconomie) / travauxTotal * 100
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 10) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 8) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 5) ptsTRI = 1.5
                  else if (safeNumber(synthese.tri) >= 3) ptsTRI = 1
                  
                  let ptsEcoFiscale = 0
                  if (effetFiscal >= 50) ptsEcoFiscale = 2.5
                  else if (effetFiscal >= 40) ptsEcoFiscale = 2
                  else if (effetFiscal >= 30) ptsEcoFiscale = 1.5
                  else if (effetFiscal >= 20) ptsEcoFiscale = 1
                  
                  let ptsTMI = 0
                  if (tmi >= 45) ptsTMI = 2
                  else if (tmi >= 41) ptsTMI = 1.5
                  else if (tmi >= 30) ptsTMI = 0.5
                  
                  let ptsLevier = 0
                  if (levier >= 5) ptsLevier = 1.5
                  else if (levier >= 3) ptsLevier = 1
                  else if (levier >= 2) ptsLevier = 0.5
                  
                  let ptsPatrimoine = 0
                  if (typeClassement === 'CLASSE') ptsPatrimoine = 1.5
                  else ptsPatrimoine = 1
                  
                  const scoreTotal = ptsTRI + ptsEcoFiscale + ptsTMI + ptsLevier + ptsPatrimoine
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
                                <span className="w-20 text-slate-600">Éco. fiscale</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsEcoFiscale >= 2 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsEcoFiscale / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsEcoFiscale}/2.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">{fmtPct(effetFiscal)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">TMI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsTMI >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsTMI / 2) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsTMI}/2 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTMI >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{tmi}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-20 text-slate-600">Patrimoine</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsPatrimoine >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsPatrimoine / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsPatrimoine}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsPatrimoine >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{typeClassement === 'CLASSE' ? 'Classé' : 'Inscrit'}</span>
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
                            <h5 className="font-bold text-slate-700 mb-3">📊 Méthode de calcul du score MH</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (2.5 pts), Éco. fiscale (2.5 pts), TMI (2 pts), Levier (1.5 pts), Type patrimoine (1.5 pts).</p>
                            <p className="text-slate-600">Le MH est optimisé pour TMI 41-45%. Avantages : hors plafond niches, abattement succession 75%, exonération IFI possible.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3">💼 Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {tmi >= 41 && safeNumber(synthese.tri) > 5 ? (
                      <>
                        <p><strong>✅ Opération exceptionnelle</strong> : Avec un TMI de {tmi}% et une économie d'IR de {fmtEur(synthese.totEconomie)} (hors plafond niches), cette opération MH est optimale.</p>
                        <p>Le bien {typeClassement === 'CLASSE' ? 'classé Monument Historique' : 'inscrit à l\'Inventaire'} offre également un abattement successoral de 75%{ouverturePublic === 'OUI' ? ' et une exonération IFI grâce à l\'ouverture au public' : ''}.</p>
                      </>
                    ) : tmi >= 30 ? (
                      <>
                        <p><strong>⚖️ Opération à évaluer</strong> : L'économie d'IR de {fmtEur(synthese.totEconomie)} est significative mais le TMI de {tmi}% n'est pas optimal pour un MH.</p>
                        <p>Ce dispositif est particulièrement adapté aux TMI 41-45%. Effet fiscal : {fmtPct(safeNumber(synthese.totEconomie) / travauxTotal * 100)} du coût des travaux.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>⚠️ TMI insuffisant</strong> : Avec un TMI de {tmi}%, le Monuments Historiques n'est pas optimal.</p>
                        <p>Ce dispositif d'exception nécessite des revenus très élevés (TMI 41-45%). Considérez plutôt le déficit foncier ou le Malraux.</p>
                      </>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Le régime MH est le plus puissant de la fiscalité immobilière française. Travaux supervisés par l'ABF obligatoires.</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center"><button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-amber{background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:99px;font-size:12px}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#f59e0b;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px}.pedagogy-box{background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
