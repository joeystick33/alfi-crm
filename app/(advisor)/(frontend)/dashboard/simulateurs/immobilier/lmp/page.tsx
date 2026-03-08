'use client'
 

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import {
  Briefcase, AlertTriangle, BookOpen, User, Lightbulb, Calendar,
  CreditCard, Wallet, BarChart3, FileText, CheckCircle, XCircle,
  Building2, TrendingUp, Target, RefreshCw, Scale, Calculator,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE UNIQUEMENT (calculs côté serveur)
// ══════════════════════════════════════════════════════════════════════════════
const LMP_DISPLAY = {
  CONDITIONS: { SEUIL_RECETTES: 23000 },
  AVANTAGES: { SEUIL_EXONERATION_TOTALE: 90000, SEUIL_EXONERATION_PARTIELLE: 126000 }
}

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
const fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type ClasseDPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

// Fonctions d'affichage simplifiées (pas de calculs fiscaux sensibles)
function getDisplayNombreParts(params: { 
  situationFamiliale: string
  enfantsACharge: number
  enfantsGardeAlternee?: number
  parentIsole?: boolean 
}): number {
  let parts = params.situationFamiliale === 'CELIBATAIRE' ? 1 : 2
  // Enfants à charge exclusive
  parts += params.enfantsACharge * (params.enfantsACharge <= 2 ? 0.5 : 1)
  // Enfants en garde alternée (0.25 part par enfant)
  parts += (params.enfantsGardeAlternee || 0) * 0.25
  // Parent isolé : demi-part supplémentaire
  if (params.parentIsole && params.situationFamiliale === 'CELIBATAIRE' && params.enfantsACharge > 0) {
    parts += 0.5
  }
  return parts
}

function getDisplayAmortissement(prixAchat: number, travaux: number, mobilier: number, partTerrain: number) {
  const valeurAmortissable = (prixAchat + travaux) * (100 - partTerrain) / 100
  return { amortissementAnnuelTotal: Math.round(valeurAmortissable / 25 + mobilier / 7), valeurTerrain: Math.round(prixAchat * partTerrain / 100) }
}

// Composants amortissables (même structure que LMNP)
const COMPOSANTS_AMORTISSEMENT = {
  IMMEUBLE: [
    { nom: 'Gros œuvre', part: 40, duree: 50 },
    { nom: 'Façade/étanchéité', part: 15, duree: 30 },
    { nom: 'IGT (électricité/plomberie)', part: 15, duree: 25 },
    { nom: 'Agencements intérieurs', part: 20, duree: 15 },
    { nom: 'Équipements techniques', part: 10, duree: 20 },
  ],
  MOBILIER: [
    { nom: 'Électroménager', part: 30, duree: 5 },
    { nom: 'Mobilier courant', part: 50, duree: 7 },
    { nom: 'Literie/textiles', part: 20, duree: 10 },
  ]
}

export default function LMPPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  const [showDetailPV, setShowDetailPV] = useState(false)
  const [showDetailSSI, setShowDetailSSI] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PROFIL CLIENT
  // ══════════════════════════════════════════════════════════════════════════
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [revenusSalaires, setRevenusSalaires] = useState(80000)
  const [autresRevenusPro, setAutresRevenusPro] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(500000)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(200000)
  const [valeurRP, setValeurRP] = useState(400000)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : LE BIEN
  // ══════════════════════════════════════════════════════════════════════════
  const [dateAcquisition, setDateAcquisition] = useState(new Date().toISOString().slice(0, 10))
  const [prixAchat, setPrixAchat] = useState(300000)
  const [fraisNotaire, setFraisNotaire] = useState(24000)
  const [travaux, setTravaux] = useState(20000)
  const [mobilier, setMobilier] = useState(15000)
  const [partTerrain, setPartTerrain] = useState(15)
  const [dpe, setDpe] = useState<ClasseDPE>('C')

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : FINANCEMENT
  // ══════════════════════════════════════════════════════════════════════════
  const [sansFinancement, setSansFinancement] = useState(false) // Achat comptant
  const [apport, setApport] = useState(60000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)
  const [typeGarantie, setTypeGarantie] = useState<'HYPOTHEQUE' | 'CAUTION'>('CAUTION')

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : REVENUS LOCATIFS
  // ══════════════════════════════════════════════════════════════════════════
  const [loyerMensuel, setLoyerMensuel] = useState(2200)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 : CHARGES
  // ══════════════════════════════════════════════════════════════════════════
  const [fraisGestionPct, setFraisGestionPct] = useState(0)
  const [taxeFonciere, setTaxeFonciere] = useState(2000)
  const [chargesCopro, setChargesCopro] = useState(2400)
  const [assurancePNO, setAssurancePNO] = useState(300)
  const [travauxEntretien, setTravauxEntretien] = useState(500)
  const [cfe, setCfe] = useState(500)
  const [comptabilite, setComptabilite] = useState(1200)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 6 : PROJECTION
  // ══════════════════════════════════════════════════════════════════════════
  const [deficitAnterieur, setDeficitAnterieur] = useState(0)
  const [amortDiffereAnt, setAmortDiffereAnt] = useState(0)
  const [dureeDetention, setDureeDetention] = useState(15)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [fraisRevente, setFraisRevente] = useState(5)

  // Résultats
  const [projections, setProjections] = useState<any[]>([])
  const [synthese, setSynthese] = useState<any>(null)
  const [_explications, setExplications] = useState<string[]>([])
  const [alertes, setAlertes] = useState<any[]>([])
  const [conseils, setConseils] = useState<string[]>([])

  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)
  const [explicationPV, setExplicationPV] = useState<string[]>([])

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULS DÉRIVÉS
  // ══════════════════════════════════════════════════════════════════════════
  const anneeAcq = new Date(dateAcquisition).getFullYear()
  const investTotal = prixAchat + fraisNotaire + travaux + mobilier
  const montantEmprunte = Math.max(0, investTotal - apport)
  const loyerAnnuel = loyerMensuel * 12 * (1 - vacanceSemaines / 52)
  
  // Charges annuelles
  const fraisGestionAnnuel = Math.round(loyerMensuel * 12 * fraisGestionPct / 100)
  const chargesAnnuelles = fraisGestionAnnuel + taxeFonciere + chargesCopro + assurancePNO + travauxEntretien + cfe + comptabilite
  
  const amortCalc = getDisplayAmortissement(prixAchat, travaux, mobilier, partTerrain)
  
  // Vérification conditions LMP (2 conditions CUMULATIVES)
  const revenusTotauxPro = revenusSalaires + autresRevenusPro
  const isLMP = loyerAnnuel > LMP_DISPLAY.CONDITIONS.SEUIL_RECETTES && loyerAnnuel > revenusTotauxPro
  
  // Crédit
  const tauxMens = tauxCredit / 100 / 12
  const nbMens = dureeCredit * 12
  const mensHorsAss = montantEmprunte > 0 && tauxMens > 0 ? montantEmprunte * (tauxMens * Math.pow(1 + tauxMens, nbMens)) / (Math.pow(1 + tauxMens, nbMens) - 1) : montantEmprunte / nbMens
  const assMens = montantEmprunte * assuranceCredit / 100 / 12
  const mensualite = mensHorsAss + assMens
  const coutTotalCredit = mensualite * nbMens
  const interetsTotaux = coutTotalCredit - montantEmprunte
  const fraisGarantie = typeGarantie === 'HYPOTHEQUE' ? Math.round(montantEmprunte * 0.02) : Math.round(montantEmprunte * 0.012)
  
  // Dates clés
  const anneeFinCredit = anneeAcq + dureeCredit
  const anneeExonerationPV = anneeAcq + 5 // Exonération PV LMP après 5 ans si CA < 90k

  // Amortissement par composants
  const valeurAmortissableImmo = (prixAchat + travaux) * (100 - partTerrain) / 100
  const amortissementComposants: { composant: string; base: number; duree: number; dotationAnnuelle: number }[] = []
  let totalAmortAnnuelImmo = 0
  for (const comp of COMPOSANTS_AMORTISSEMENT.IMMEUBLE) {
    const base = valeurAmortissableImmo * comp.part / 100
    const dotation = base / comp.duree
    totalAmortAnnuelImmo += dotation
    amortissementComposants.push({ composant: comp.nom, base: Math.round(base), duree: comp.duree, dotationAnnuelle: Math.round(dotation) })
  }
  let totalAmortAnnuelMob = 0
  for (const comp of COMPOSANTS_AMORTISSEMENT.MOBILIER) {
    const base = mobilier * comp.part / 100
    const dotation = base / comp.duree
    totalAmortAnnuelMob += dotation
    amortissementComposants.push({ composant: `Mobilier - ${comp.nom}`, base: Math.round(base), duree: comp.duree, dotationAnnuelle: Math.round(dotation) })
  }
  const totalAmortAnnuel = totalAmortAnnuelImmo + totalAmortAnnuelMob

  // ══════════════════════════════════════════════════════════════════════════
  // SIMULATION
  // ══════════════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND POUR LA SIMULATION LMP
  // Tous les calculs sensibles sont effectués côté serveur
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/lmp', {
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
          autresRevenus: 0,
          autresRevenusProfessionnels: autresRevenusPro,
          patrimoineImmobilierExistant,
          dettesImmobilieres,
          valeurRP,
          // Bien
          dateAcquisition: dateAcquisition.length === 7 ? dateAcquisition : dateAcquisition.slice(0, 7),
          prixAcquisition: prixAchat,
          fraisNotaire,
          travaux,
          mobilier,
          partTerrain,
          // Financement
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          // Loyer
          loyerMensuel,
          chargesLocatives: 0,
          vacanceSemaines,
          revalorisationLoyer,
          // Charges
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion: fraisGestionPct,
          fraisComptable: comptabilite,
          // Projection
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
        numAnnee: idx + 1,
        loyerNet: p.loyerNet || p.loyer || 0,
        charges: p.charges || 0,
        interets: p.interets || 0,
        assEmp: p.assurance || 0,
        resAvantAmort: p.resultatComptable || 0,
        amortDispo: p.amortissement || 0,
        amortUtil: p.amortUtilise || 0,
        amortDiffere: 0,
        resultatBIC: p.resultatFiscal || 0,
        benefice: p.resultatFiscal || 0,
        cotisationsSSI: p.cotisationsSSI || 0,
        deficitRG: 0,
        economieIR: 0,
        impotIR: p.ir,
        cfAvant: p.cfAvantImpots,
        cfApres: p.cfApresImpots,
        capRestant: p.capitalRestant,
        valBien: p.valeurBien,
        capNet: p.capitalNet,
      }))

      const revenuTotalAvant = revenusSalaires + autresRevenusPro
      
      setSynthese({
        investTotal: result.synthese.investTotal,
        apport,
        montantEmprunte: result.synthese.montantEmprunte,
        mensualite: result.synthese.mensualite,
        amortAnnuel: result.amortissements?.total || 0,
        totAmort: result.synthese.amortCumule || 0,
        amortDiffRest: result.synthese.amortDiffereRestant || 0,
        rendBrut: result.synthese.rentaBrute,
        tri: result.synthese.tri,
        cfMoyMois: result.synthese.cashFlowMoyenMensuel || Math.round(result.synthese.cashFlowCumule / dureeDetention / 12),
        cfCum: result.synthese.cashFlowCumule,
        totIR: result.synthese.irCumule,
        totSSI: result.synthese.ssiCumule || 0,
        valRev: (result.synthese.plusValueProfessionnelle || 0) + result.synthese.investTotal,
        pvBrute: result.synthese.plusValueProfessionnelle || 0,
        impotPV: result.synthese.impotPV || 0,
        exonerationPV: result.synthese.exonerationPV || false,
        capFinal: result.synthese.capitalFinal || (result.synthese.gainTotal + apport),
        gainTotal: result.synthese.gainTotal,
        isLMP: result.statutLMP?.estLMP || false,
        profilClient: {
          nombreParts: result.profilClient.nombreParts,
          revenuTotalAvant,
          irAvant: result.profilClient.irAvant,
          tmiAvant: result.profilClient.tmi,
          ifiAvant: result.profilClient.ifiAvant,
          ifiApres: result.profilClient.ifiApres,
          assujettiIFIAvant: result.profilClient.assujettiIFIAvant,
          assujettiIFIApres: result.profilClient.assujettiIFIApres,
        },
      })

      setAlertes(result.alertes || [])
      setConseils([
        `Statut ${result.statutLMP?.estLMP ? 'LMP' : 'LMNP'} confirmé.`,
        `LMP : la plus-value est professionnelle avec réintégration des amortissements.`,
      ])
      setExplications([
        `═══ CALCUL LMP - SYNTHÈSE ═══`,
        `① REVENUS BIC : ${fmtEur(result.synthese.loyerAnnuel || 0)}`,
        `② TRI : ${fmtPct(result.synthese.tri)}`,
        `③ COTISATIONS SSI CUMULÉES : ${fmtEur(result.synthese.cotisationsSSICumulees || 0)}`,
        `④ GAIN TOTAL : ${fmtEur(result.synthese.gainTotal)}`,
      ])
      setExplicationPV([
        `Plus-value brute : ${fmtEur(result.plusValue?.plusValueBrute || 0)}`,
        `Impôt PV : ${fmtEur(result.plusValue?.impotTotal || 0)}`,
      ])
      setProjections(projTransformed)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur simulation LMP:', error)
      setAlertes([{ type: 'error', message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` }])
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, revenusSalaires, autresRevenusPro,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    dateAcquisition, prixAchat, fraisNotaire, travaux, mobilier, partTerrain, dpe,
    apport, tauxCredit, dureeCredit, assuranceCredit,
    loyerMensuel, vacanceSemaines, revalorisationLoyer,
    fraisGestionPct, taxeFonciere, chargesCopro, assurancePNO, cfe, comptabilite,
    deficitAnterieur, amortDiffereAnt, dureeDetention, revalorisationBien, fraisRevente,
  ])

  useEffect(() => {
    if (!plotlyReady || !showResults || !projections.length) return
    const P = (window as any).Plotly
    if (!P) return
    const years = projections.map(p => p.annee)

    // Graphique 1 : Cash-flow (années réelles)
    if (chartRef1.current) {
      P.newPlot(chartRef1.current, [{
        x: years,
        y: projections.map(p => p.cfApres),
        type: 'bar',
        marker: { color: projections.map(p => p.cfApres >= 0 ? '#059669' : '#dc2626') },
        name: 'Cash-flow',
      }], {
        title: 'Cash-flow après impôts et SSI (€)',
        height: 280,
        margin: { t: 40, b: 40, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
        xaxis: { title: 'Année', tickangle: -45 },
      }, { displayModeBar: false })
    }

    // Graphique 2 : IR vs SSI (années réelles)
    if (chartRef2.current) {
      P.newPlot(chartRef2.current, [
        { x: years, y: projections.map(p => p.impotIR), name: 'IR', type: 'bar', marker: { color: '#f59e0b' } },
        { x: years, y: projections.map(p => p.cotisationsSSI), name: 'SSI', type: 'bar', marker: { color: '#ec4899' } },
      ], {
        title: 'IR vs Cotisations SSI (€)',
        height: 280,
        margin: { t: 40, b: 40, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
        barmode: 'group',
        legend: { orientation: 'h', y: -0.2 },
        xaxis: { title: 'Année', tickangle: -45 },
      }, { displayModeBar: false })
    }
  }, [plotlyReady, showResults, projections])

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs/immobilier" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs immobilier</Link>
          <div className="sim-card mb-6">
              <div className="flex items-center gap-4">
                <Briefcase className="w-9 h-9 text-blue-700" />
                <div>
                  <h1 className="text-2xl font-bold">Simulateur LMP</h1>
                  <p className="text-gray-600">Loueur Meublé Professionnel • Régime des indépendants</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="badge-blue">BIC Professionnel</span>
                <span className="badge-pink">SSI 35-45%</span>
                <span className="badge-green">Exo PV 5 ans</span>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Qu'est-ce que le LMP ?</h3>
                <p className="text-sm text-blue-700">Le statut de <strong>Loueur Meublé Professionnel</strong> s'applique automatiquement si vos recettes locatives meublées dépassent 23 000 €/an ET représentent plus de 50% de vos revenus professionnels. Ce statut vous fait basculer dans le régime des travailleurs indépendants avec des cotisations SSI (35-45% progressif, min. 1 208 €/an), mais offre des avantages fiscaux significatifs : déficit imputable sur le revenu global sans limite et exonération de plus-value après 5 ans d'activité.</p>
              </div>
            </div>

          {!showResults ? (
            <div className="sim-card">
              <div className="mb-6"><div className="flex justify-between text-sm mb-2"><span>Étape {step}/7</span><span>{Math.round(step/7*100)}%</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 rounded-full transition-all" style={{width:`${step/7*100}%`}}/></div></div>

              {/* ÉTAPE 1 : PROFIL CLIENT COMPLET */}
              {step === 1 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Profil client</h2>
                <p className="text-gray-600 mb-4">Pour calculer l'impact fiscal réel (IR, IFI, cotisations SSI), nous avons besoin de votre situation actuelle.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group"><label>Situation familiale</label><select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}><option value="CELIBATAIRE">Célibataire</option><option value="MARIE_PACSE">Marié / Pacsé</option><option value="VEUF">Veuf</option></select></div>
                  <div className="form-group"><label>Enfants à charge</label><input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/></div>
                  <div className="form-group"><label>Revenus salaires (€/an)</label><input type="number" value={revenusSalaires} onChange={e=>setRevenusSalaires(+e.target.value)}/></div>
                  <div className="form-group"><label>Autres revenus pro (€/an)</label><input type="number" value={autresRevenusPro} onChange={e=>setAutresRevenusPro(+e.target.value)}/><span className="form-hint">BIC, BNC existants...</span></div>
                  <div className="form-group"><label>Patrimoine immo existant (€)</label><input type="number" value={patrimoineImmobilierExistant} onChange={e=>setPatrimoineImmobilierExistant(+e.target.value)}/><span className="form-hint">Pour calcul IFI</span></div>
                  <div className="form-group"><label>Dettes immobilières (€)</label><input type="number" value={dettesImmobilieres} onChange={e=>setDettesImmobilieres(+e.target.value)}/></div>
                  <div className="form-group"><label>Valeur résidence principale (€)</label><input type="number" value={valeurRP} onChange={e=>setValeurRP(+e.target.value)}/><span className="form-hint">Abattement 30% IFI</span></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{getDisplayNombreParts({situationFamiliale, enfantsACharge, enfantsGardeAlternee: 0, parentIsole: false})}</div></div>
                  <div><span className="text-gray-500">Revenus d'activité</span><div className="font-bold text-lg">{fmtEur(revenusTotauxPro)}</div></div>
                  <div><span className="text-gray-500">Patrimoine net IFI</span><div className={`font-bold text-lg ${(patrimoineImmobilierExistant - dettesImmobilieres) > 1300000 ? 'text-orange-600' : 'text-green-600'}`}>{fmtEur(patrimoineImmobilierExistant - dettesImmobilieres)}</div></div>
                </div>
                <div className="pedagogy-box mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Pourquoi ces informations sont cruciales ?</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>• <strong>Revenus d'activité</strong> : En LMP, vos recettes locatives doivent DÉPASSER vos autres revenus d'activité (salaires, BIC, BNC). C'est une condition cumulative avec le seuil de 23 000 €.</p>
                    <p>• <strong>Impact IR</strong> : Le bénéfice BIC après déduction des cotisations SSI sera imposé à votre TMI. Les cotisations SSI sont partiellement déductibles.</p>
                    <p>• <strong>IFI</strong> : En LMP, le bien immobilier peut être considéré comme un bien professionnel et exonéré d'IFI sous certaines conditions (activité principale).</p>
                  </div>
                </div>
              </div>}

              {/* ÉTAPE 2 : BIEN DÉTAILLÉ */}
              {step === 2 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Bien meublé professionnel</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group col-span-2 md:col-span-1"><label className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date d'acquisition</label><input type="date" value={dateAcquisition} onChange={e=>setDateAcquisition(e.target.value)} className="w-full"/><span className="form-hint">Pour calcul PV</span></div>
                  <div className="form-group"><label>Prix d'achat (€)</label><input type="number" value={prixAchat} onChange={e=>setPrixAchat(+e.target.value)}/></div>
                  <div className="form-group"><label>Frais notaire (€)</label><input type="number" value={fraisNotaire} onChange={e=>setFraisNotaire(+e.target.value)}/><span className="form-hint">~8% ancien</span></div>
                  <div className="form-group"><label>Travaux (€)</label><input type="number" value={travaux} onChange={e=>setTravaux(+e.target.value)}/></div>
                  <div className="form-group"><label>Mobilier (€)</label><input type="number" value={mobilier} onChange={e=>setMobilier(+e.target.value)}/><span className="form-hint">Amort. 5-10 ans</span></div>
                  <div className="form-group"><label>Part terrain (%)</label><input type="number" value={partTerrain} onChange={e=>setPartTerrain(+e.target.value)} min={5} max={40}/><span className="form-hint">Non amortissable</span></div>
                  <div className="form-group"><label>DPE</label><select value={dpe} onChange={e=>setDpe(e.target.value as ClasseDPE)}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F (passoire)</option><option value="G">G (passoire)</option></select></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Investissement total</span><div className="font-bold text-lg">{fmtEur(investTotal)}</div></div>
                  <div><span className="text-gray-500">Amortissement/an</span><div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(totalAmortAnnuel))}</div></div>
                  <div><span className="text-gray-500">Terrain (non amort.)</span><div className="font-bold">{fmtEur(Math.round(prixAchat * partTerrain / 100))}</div></div>
                  <div><span className="text-gray-500">Exonération PV LMP</span><div className="font-bold text-emerald-600">{anneeExonerationPV}</div></div>
                </div>
                <div className="pedagogy-box mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> L'amortissement en LMP : un levier fiscal majeur</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>• <strong>Principe</strong> : L'amortissement permet de déduire comptablement la perte de valeur théorique du bien. C'est une charge non décaissée qui réduit votre bénéfice imposable.</p>
                    <p>• <strong>Base amortissable</strong> : Prix d'achat + travaux, HORS terrain (le terrain ne perd pas de valeur). Ici, {fmtPct(partTerrain)} du prix est non amortissable.</p>
                    <p>• <strong>Attention</strong> : En cas de revente sans exonération, les amortissements pratiqués seront réintégrés dans la plus-value court terme (imposée au TMI).</p>
                  </div>
                </div>
              </div>}

              {/* ÉTAPE 3 : FINANCEMENT DÉTAILLÉ */}
              {step === 3 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Financement</h2>
                
                {/* Option achat comptant */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sansFinancement}
                      onChange={(e) => {
                        setSansFinancement(e.target.checked)
                        if (e.target.checked) {
                          setApport(investTotal) // Si comptant, apport = 100%
                        }
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
                    <p className="text-sm text-emerald-600 mt-2">Pas de crédit, pas d'intérêts, pas de mensualités. Cash-flow simplifié.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="form-group"><label>Apport personnel (€)</label><input type="number" value={apport} onChange={e=>setApport(+e.target.value)}/><span className="form-hint">{fmtPct(apport/investTotal*100)} du bien</span></div>
                      <div className="form-group"><label>Taux nominal (%)</label><input type="number" value={tauxCredit} onChange={e=>setTauxCredit(+e.target.value)} step={0.1}/></div>
                      <div className="form-group"><label>Durée (ans)</label><input type="number" value={dureeCredit} onChange={e=>setDureeCredit(+e.target.value)} min={5} max={30}/></div>
                      <div className="form-group"><label>Assurance (%/an CI)</label><input type="number" value={assuranceCredit} onChange={e=>setAssuranceCredit(+e.target.value)} step={0.05}/></div>
                      <div className="form-group"><label>Type de garantie</label><select value={typeGarantie} onChange={e=>setTypeGarantie(e.target.value as any)}><option value="CAUTION">Caution (~1.2%)</option><option value="HYPOTHEQUE">Hypothèque (~2%)</option></select></div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> SYNTHÈSE DU CRÉDIT</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Montant emprunté</div><div className="font-bold text-lg">{fmtEur(montantEmprunte)}</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Mensualité totale</div><div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(mensualite))}</div><div className="text-xs text-gray-400">{fmtEur(Math.round(mensHorsAss))} + {fmtEur(Math.round(assMens))} ass.</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Coût total crédit</div><div className="font-bold text-lg text-amber-600">{fmtEur(Math.round(coutTotalCredit))}</div></div>
                        <div className="bg-white p-3 rounded-lg"><div className="text-gray-500 text-xs">Fin du crédit</div><div className="font-bold text-lg">{anneeFinCredit}</div></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">Intérêts totaux</div><div className="font-semibold text-amber-600">{fmtEur(Math.round(interetsTotaux))}</div></div>
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">Frais garantie</div><div className="font-semibold">{fmtEur(fraisGarantie)}</div></div>
                        <div className="text-center p-2 bg-white rounded"><div className="text-gray-500 text-xs">LTV</div><div className="font-semibold">{fmtPct(montantEmprunte/investTotal*100)}</div></div>
                      </div>
                    </div>
                    <div className="pedagogy-box mt-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> L'effet de levier en LMP</h4>
                      <div className="text-sm text-blue-700 space-y-2">
                        <p>• <strong>LTV {fmtPct(montantEmprunte/investTotal*100)}</strong> : {montantEmprunte/investTotal > 0.9 ? 'Levier maximal. Les intérêts d\'emprunt sont déductibles du bénéfice BIC, ce qui optimise la fiscalité.' : montantEmprunte/investTotal > 0.7 ? 'Bon équilibre entre effet de levier et sécurité.' : 'Apport confortable, moins d\'intérêts déductibles mais risque maîtrisé.'}</p>
                        <p>• <strong>Intérêts déductibles</strong> : En LMP, les intérêts d'emprunt ({fmtEur(Math.round(interetsTotaux))} sur {dureeCredit} ans) sont intégralement déductibles du résultat BIC, réduisant d'autant les cotisations SSI et l'IR.</p>
                        <p>• <strong>Effort mensuel</strong> : {mensualite > loyerMensuel ? `Mensualité (${fmtEur(Math.round(mensualite))}) > loyer (${fmtEur(loyerMensuel)}) = effort de ${fmtEur(Math.round(mensualite - loyerMensuel))}/mois avant impôts.` : `Loyer (${fmtEur(loyerMensuel)}) > mensualité (${fmtEur(Math.round(mensualite))}) = autofinancement potentiel.`}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>}

              {/* ÉTAPE 4 : REVENUS LOCATIFS */}
              {step === 4 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> Revenus locatifs</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group"><label>Loyer mensuel (€)</label><input type="number" value={loyerMensuel} onChange={e=>setLoyerMensuel(+e.target.value)}/></div>
                  <div className="form-group"><label>Vacance locative (sem./an)</label><input type="number" value={vacanceSemaines} onChange={e=>setVacanceSemaines(+e.target.value)} min={0} max={52}/></div>
                  <div className="form-group"><label>Revalorisation loyer (%/an)</label><input type="number" value={revalorisationLoyer} onChange={e=>setRevalorisationLoyer(+e.target.value)} step={0.1}/></div>
                </div>
                <div className="info-box mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500">Recettes annuelles</span><div className="font-bold text-lg text-green-600">{fmtEur(Math.round(loyerAnnuel))}</div></div>
                  <div><span className="text-gray-500">Rendement brut</span><div className="font-bold text-lg">{fmtPct(loyerMensuel*12/prixAchat*100)}</div></div>
                  <div><span className="text-gray-500">Statut prévu</span><div className={`font-bold text-lg ${isLMP ? 'text-orange-600' : 'text-blue-600'}`}>{isLMP ? 'LMP' : 'LMNP'}</div></div>
                </div>
                <div className="pedagogy-box mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Vérification conditions LMP (art. 155-IV CGI)</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    <p className="mb-3">Le statut LMP s'applique <strong>automatiquement</strong> si les deux conditions suivantes sont réunies :</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg ${loyerAnnuel > 23000 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {loyerAnnuel > 23000 ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                          <strong>Condition 1 : Seuil de recettes</strong>
                        </div>
                        <p>Recettes locatives meublées {">"} 23 000 €/an</p>
                        <p className="font-semibold mt-1">Vos recettes : {fmtEur(Math.round(loyerAnnuel))}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${loyerAnnuel > revenusTotauxPro ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {loyerAnnuel > revenusTotauxPro ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                          <strong>Condition 2 : Revenus d'activité</strong>
                        </div>
                        <p>Recettes {">"} autres revenus d'activité du foyer</p>
                        <p className="font-semibold mt-1">Vos revenus : {fmtEur(revenusTotauxPro)}</p>
                      </div>
                    </div>
                    <div className={`mt-3 p-3 rounded-lg ${isLMP ? 'bg-blue-100 border border-blue-300' : 'bg-indigo-100 border border-indigo-300'}`}>
                      <strong className={isLMP ? 'text-blue-800' : 'text-indigo-800'}>→ Statut applicable : {isLMP ? 'LMP - Affilié SSI avec cotisations 35-45% du bénéfice net (min. 1 208 €/an)' : 'LMNP - Pas de cotisations sociales sur les revenus locatifs'}</strong>
                    </div>
                  </div>
                </div>
              </div>}

              {/* ÉTAPE 5 : CHARGES DÉTAILLÉES */}
              {step === 5 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Charges détaillées</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-3">CHARGES COURANTES ANNUELLES</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="form-group"><label>Frais gestion (%)</label><input type="number" value={fraisGestionPct} onChange={e=>setFraisGestionPct(+e.target.value)} step={0.5} min={0} max={15}/><span className="form-hint">Si gestion déléguée</span></div>
                    <div className="form-group"><label>Taxe foncière (€)</label><input type="number" value={taxeFonciere} onChange={e=>setTaxeFonciere(+e.target.value)}/></div>
                    <div className="form-group"><label>Charges copro (€)</label><input type="number" value={chargesCopro} onChange={e=>setChargesCopro(+e.target.value)}/></div>
                    <div className="form-group"><label>Assurance PNO (€)</label><input type="number" value={assurancePNO} onChange={e=>setAssurancePNO(+e.target.value)}/></div>
                    <div className="form-group"><label>Travaux entretien (€)</label><input type="number" value={travauxEntretien} onChange={e=>setTravauxEntretien(+e.target.value)}/></div>
                    <div className="form-group"><label>CFE (€)</label><input type="number" value={cfe} onChange={e=>setCfe(+e.target.value)}/></div>
                    <div className="form-group"><label>Comptabilité (€)</label><input type="number" value={comptabilite} onChange={e=>setComptabilite(+e.target.value)}/><span className="form-hint">Obligatoire LMP</span></div>
                  </div>
                  <div className="mt-3 p-2 bg-green-100 rounded-lg flex justify-between items-center">
                    <span className="text-green-700">Total charges courantes/an</span>
                    <span className="font-bold text-green-800 text-lg">{fmtEur(Math.round(chargesAnnuelles))}</span>
                  </div>
                </div>
              </div>}

              {/* ÉTAPE 6 : FISCALITÉ ET REPORTS */}
              {step === 6 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Reports et déficits</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group"><label>Déficit BIC antérieur (€)</label><input type="number" value={deficitAnterieur} onChange={e=>setDeficitAnterieur(+e.target.value)}/><span className="form-hint">Report 10 ans</span></div>
                  <div className="form-group"><label>Amort. différé antérieur (€)</label><input type="number" value={amortDiffereAnt} onChange={e=>setAmortDiffereAnt(+e.target.value)}/><span className="form-hint">Sans limite</span></div>
                </div>
                <div className="pedagogy-box mt-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Comprendre le mécanisme fiscal du LMP</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    <p><strong>Le déficit BIC en LMP</strong> : Contrairement au LMNP où le déficit reste cantonné aux BIC, le LMP permet d'imputer le déficit sur le <strong>revenu global sans limitation</strong>. C'est un avantage considérable les premières années (charges + amortissement élevés).</p>
                    <p><strong>L'amortissement différé</strong> : Si vos charges (hors amortissement) excèdent vos loyers, l'amortissement est "mis en réserve" indéfiniment. Il pourra être utilisé les années suivantes pour annuler le bénéfice imposable.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Avantages du LMP</h4>
                    <ul className="text-sm text-emerald-700 space-y-2">
                      <li>• <strong>Déficit sur RG</strong> : Imputation sans limite de montant ni de durée sur vos autres revenus</li>
                      <li>• <strong>Exonération PV totale</strong> : Si activité {">"} 5 ans ET CA {"<"} 90 000 € (art. 151 septies CGI)</li>
                      <li>• <strong>Droits sociaux</strong> : Cotisations SSI = trimestres retraite + couverture maladie</li>
                      <li>• <strong>IFI potentiellement exonéré</strong> : Si activité principale (rare)</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2"><XCircle className="w-4 h-4" /> Inconvénients du LMP</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li>• <strong>Cotisations SSI 35-45%</strong> : Taux progressif sur le bénéfice net (maladie, retraite, allocations, CSG/CRDS)</li>
                      <li>• <strong>Plus-value professionnelle</strong> : Réintégration des amortissements en CT si pas d'exonération</li>
                      <li>• <strong>Régime réel obligatoire</strong> : Comptabilité + liasse fiscale annuelle</li>
                      <li>• <strong>CFE</strong> : Cotisation foncière des entreprises due</li>
                    </ul>
                  </div>
                </div>
              </div>}

              {/* ÉTAPE 7 : PROJECTION */}
              {step === 7 && <div className="animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Projection & Revente</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group"><label>Durée de détention (ans)</label><input type="number" value={dureeDetention} onChange={e=>setDureeDetention(+e.target.value)} min={1} max={40}/></div>
                  <div className="form-group"><label>Revalorisation bien (%/an)</label><input type="number" value={revalorisationBien} onChange={e=>setRevalorisationBien(+e.target.value)} step={0.1}/></div>
                  <div className="form-group"><label>Frais de revente (%)</label><input type="number" value={fraisRevente} onChange={e=>setFraisRevente(+e.target.value)} step={0.5}/></div>
                </div>
                <div className="pedagogy-box mt-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> La plus-value en LMP : un régime professionnel avantageux</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    <p>En LMP, la plus-value relève du <strong>régime des plus-values professionnelles</strong> (et non des plus-values immobilières des particuliers). C'est un point crucial car les règles d'exonération sont très différentes.</p>
                    
                    <div className="bg-white/70 rounded-lg p-4 mt-3">
                      <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Conditions d'exonération (art. 151 septies CGI)</h5>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <div><strong>Exonération TOTALE</strong> : Activité exercée depuis {">"} 5 ans ET chiffre d'affaires {"<"} 90 000 € sur les 2 dernières années</div>
                        </div>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div><strong>Exonération PARTIELLE</strong> : CA entre 90 000 € et 126 000 € (prorata linéaire)</div>
                        </div>
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <div><strong>PAS d'exonération</strong> : CA {">"} 126 000 € → PV professionnelle avec réintégration des amortissements en court terme (imposée au TMI)</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className={`p-3 rounded-lg ${dureeDetention >= 5 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <div className="text-xs text-gray-500">Durée d'activité prévue</div>
                        <div className={`font-bold text-lg ${dureeDetention >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>{dureeDetention} ans {dureeDetention >= 5 ? '> 5 ans' : '< 5 ans'}</div>
                        <div className="text-xs">Exonération possible à partir de {anneeExonerationPV}</div>
                      </div>
                      <div className={`p-3 rounded-lg ${loyerAnnuel < 90000 ? 'bg-emerald-50 border border-emerald-200' : loyerAnnuel < 126000 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="text-xs text-gray-500">Chiffre d'affaires annuel</div>
                        <div className={`font-bold text-lg ${loyerAnnuel < 90000 ? 'text-emerald-600' : loyerAnnuel < 126000 ? 'text-amber-600' : 'text-red-600'}`}>{fmtEur(Math.round(loyerAnnuel))}</div>
                        <div className="text-xs">{loyerAnnuel < 90000 ? 'Exonération totale possible' : loyerAnnuel < 126000 ? 'Exonération partielle' : 'Pas d\'exonération'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>}

              <div className="flex justify-between mt-8">
                <button onClick={()=>setStep(Math.max(1,step-1))} disabled={step===1} className="btn-secondary disabled:opacity-50">← Précédent</button>
                {step < 7 ? <button onClick={()=>setStep(step+1)} className="btn-primary">Suivant →</button> : <button onClick={lancerSimulation} disabled={loading} className="btn-primary">{loading?'Calcul...':'Analyser'}</button>}
              </div>
            </div>
          ) : synthese && (
            <div className="space-y-6 animate-fadeIn">
              {alertes.map((a,i)=><div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
              {conseils.length>0 && <div className="alert-info">{conseils.map((c,i)=><p key={i}>{c}</p>)}</div>}
              
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* IMPACT FISCAL GLOBAL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR actuel (hors LMP)</div>
                    <div className="font-bold text-lg text-slate-800">{fmtEur(synthese.profilClient?.irAvant || 0)}</div>
                    <div className="text-xs text-slate-400">Sur {fmtEur(synthese.profilClient?.revenusTotaux || 0)}/an</div>
                    <div className="text-xs text-slate-400">TMI : {synthese.profilClient?.tmiAvant || 0}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IR supplémentaire LMP</div>
                    <div className="font-bold text-lg text-amber-600">{fmtEur(Math.round(synthese.totIR / dureeDetention))}/an</div>
                    <div className="text-xs text-slate-400">Total : {fmtEur(synthese.totIR)} sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <div className="text-pink-600 text-xs mb-1">Cotisations SSI LMP</div>
                    <div className="font-bold text-lg text-pink-600">{fmtEur(Math.round(synthese.totSSI / dureeDetention))}/an</div>
                    <div className="text-xs text-pink-400">Total : {fmtEur(synthese.totSSI)} sur {dureeDetention} ans</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs mb-1">IFI après investissement</div>
                    <div className={`font-bold text-lg ${synthese.profilClient?.ifiApres > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{synthese.profilClient?.assujettiIFIApres ? fmtEur(synthese.profilClient.ifiApres) : 'Non assujetti'}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Comprendre votre fiscalité LMP</h4>
                    {synthese.statutLMP?.cotisationsSSI?.apiDisponible && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ API URSSAF</span>
                    )}
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>IR actuel</strong> : {synthese.profilClient?.irAvant > 0 ? `Vous payez déjà ${fmtEur(synthese.profilClient.irAvant)} d'IR sur vos revenus existants de ${fmtEur(synthese.profilClient.revenusTotaux)}.` : `Vous n'avez pas d'IR à payer car vos revenus déclarés (${fmtEur(synthese.profilClient?.revenusTotaux || 0)}) sont sous le seuil d'imposition.`}</p>
                    <p>• <strong>IR LMP</strong> : {synthese.totIR > 0 ? `L'activité LMP génère ${fmtEur(Math.round(synthese.totIR / dureeDetention))}/an d'IR supplémentaire (sur le bénéfice après déduction SSI).` : `L'amortissement comptable neutralise l'IR sur le bénéfice LMP (résultat BIC = 0).`}</p>
                    <p>• <strong>Cotisations SSI</strong> : {synthese.statutLMP?.cotisationsSSI?.apiDisponible 
                      ? `Taux effectif ${synthese.statutLMP.cotisationsSSI.tauxEffectif} (source: API URSSAF officielle).`
                      : 'Taux progressif 35-45% (calcul local, min. 1 208 €/an).'
                    } Les SSI s'appliquent sur le bénéfice BIC net.</p>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* INDICATEURS CLÉS DE PERFORMANCE */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
                    <div className="text-xl font-bold text-slate-800">{fmtPct(loyerMensuel*12/prixAchat*100)}</div>
                    <div className="text-xs text-slate-400 mt-1">{loyerMensuel*12/prixAchat*100 > 6 ? 'Excellent' : loyerMensuel*12/prixAchat*100 > 4 ? 'Correct' : 'Faible'}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">TRI</div>
                    <div className="text-xl font-bold text-blue-700">{fmtPct(synthese.tri)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.tri > 8 ? 'Très bon' : synthese.tri > 5 ? 'Satisfaisant' : 'À surveiller'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Cash-flow/mois</div>
                    <div className={`text-xl font-bold ${synthese.cfMoyMois >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{synthese.cfMoyMois >= 0 ? '+' : ''}{fmtEur(synthese.cfMoyMois)}</div>
                    <div className="text-xs text-slate-400 mt-1">{synthese.cfMoyMois > 100 ? 'Autofinancé' : synthese.cfMoyMois >= 0 ? 'Équilibré' : 'Effort mensuel'}</div>
                  </div>
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
                    <div className="text-xs text-pink-600 mb-1">SSI total</div>
                    <div className="text-xl font-bold text-pink-600">{fmtEur(synthese.totSSI)}</div>
                    <div className="text-xs text-slate-400 mt-1">{fmtEur(Math.round(synthese.totSSI / dureeDetention))}/an</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 mb-1">Amort. utilisé</div>
                    <div className="text-xl font-bold text-slate-700">{fmtEur(synthese.totAmort)}</div>
                    <div className="text-xs text-slate-400 mt-1">Défiscalisation</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-xs text-blue-600 mb-1">Gain total</div>
                    <div className="text-xl font-bold text-blue-700">{fmtEur(synthese.gainTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sur {dureeDetention} ans</div>
                  </div>
                </div>
                
                {/* ANALYSE PÉDAGOGIQUE */}
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération LMP</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>• <strong>TRI {fmtPct(synthese.tri)}</strong> : {synthese.tri > 8 ? 'Excellente performance malgré les cotisations SSI.' : synthese.tri > 5 ? 'Rentabilité correcte, les SSI impactent le rendement.' : 'Rentabilité limitée par les cotisations SSI élevées.'}</p>
                    <p>• <strong>Cotisations SSI {fmtEur(synthese.totSSI)}</strong> : Taux progressif 35-45% du bénéfice net. Ces cotisations ouvrent des droits retraite mais réduisent le cash-flow.</p>
                    <p>• <strong>Cash-flow {synthese.cfMoyMois >= 0 ? 'positif' : 'négatif'}</strong> : {synthese.cfMoyMois >= 0 ? `L'opération dégage ${fmtEur(synthese.cfMoyMois)}/mois après impôts et SSI.` : `Effort de ${fmtEur(Math.abs(synthese.cfMoyMois))}/mois après impôts et SSI.`}</p>
                    <p>• <strong>Avantage LMP</strong> : Possibilité d'exonération totale de la plus-value après 5 ans d'activité si CA {"<"} 90 000 €.</p>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* TIMELINE DES ÉVÉNEMENTS */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-4 text-slate-800">Jalons clés de l'investissement LMP</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                  <div className="space-y-4 pl-10">
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-orange-600 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{dateAcquisition}</div><div className="text-sm text-slate-600">Acquisition du bien • Investissement {fmtEur(investTotal)}</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div><div className="bg-slate-50 border border-slate-200 p-3 rounded-lg"><div className="font-semibold text-slate-800">{anneeFinCredit}</div><div className="text-sm text-slate-600">Fin du crédit • {dureeCredit} ans • Cash-flow libéré</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div><div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg"><div className="font-semibold text-emerald-800">{anneeExonerationPV}</div><div className="text-sm text-emerald-600">Éligibilité exonération PV LMP • 5 ans d'activité + CA {"<"} 90k€</div></div></div>
                    <div className="relative"><div className="absolute -left-6 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div><div className="bg-blue-50 border border-blue-200 p-3 rounded-lg"><div className="font-semibold text-blue-800">{anneeAcq + dureeDetention}</div><div className="text-sm text-blue-600">Revente simulée • Capital net {fmtEur(synthese.capFinal)}</div></div></div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* GRAPHIQUE 1 : CASH-FLOW ANNUEL */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow après impôts et SSI</h3>
                <p className="text-sm text-slate-500 mb-4">Ce graphique illustre votre trésorerie nette année par année, après déduction de toutes les charges, impôts et cotisations SSI.</p>
                <div ref={chartRef1} className="mb-4"/>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow LMP</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {synthese.cfMoyMois >= 0 ? (
                      <>
                        <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(synthese.cfMoyMois)}/mois</strong> après SSI. C'est remarquable pour un LMP car les cotisations sociales (35-45%) sont généralement le principal frein.</p>
                        <p>Ce surplus peut être réinvesti ou constituer un complément de revenus. {synthese.cfMoyMois > 200 ? "L'autofinancement est excellent malgré les SSI." : "L'équilibre est satisfaisant compte tenu des cotisations."}</p>
                      </>
                    ) : (
                      <>
                        <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(synthese.cfMoyMois))}/mois</strong> après impôts et SSI. Les cotisations SSI (35-45% du bénéfice net) pèsent sur le cash-flow.</p>
                        <p>Cet effort est {Math.abs(synthese.cfMoyMois) < 200 ? "modéré pour un LMP" : "significatif, vérifiez votre capacité d'épargne"}. Le cash-flow s'améliorera après le remboursement du crédit ({anneeFinCredit}).</p>
                      </>
                    )}
                    <p className="text-slate-500 text-xs mt-2"><em>Scénario optimal : revente après {anneeExonerationPV} (5 ans d'activité) pour bénéficier de l'exonération de plus-value si CA {"<"} 90 000 €.</em></p>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* DÉTAIL COTISATIONS SSI */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">Détail des cotisations SSI (année 1)</h3>
                  {synthese.statutLMP?.cotisationsSSI?.apiDisponible && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">✓ Calcul API URSSAF</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Les cotisations SSI s'appliquent sur le <strong>bénéfice BIC net</strong> (après amortissement). 
                  Taux progressif de 35% à 45% selon le niveau de revenus.
                </p>
                
                {/* Résumé rapide */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs">Base SSI (bénéfice net)</div>
                    <div className="font-bold text-slate-800">{fmtEur(synthese.ssiDetail?.beneficeNet || 0)}</div>
                  </div>
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <div className="text-pink-600 text-xs">Cotisations totales</div>
                    <div className="font-bold text-pink-700">{fmtEur(synthese.ssiDetail?.cotisationsTotal || Math.round(synthese.totSSI / dureeDetention))}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-xs">Taux effectif</div>
                    <div className="font-bold text-blue-700">{synthese.ssiDetail?.tauxEffectif || synthese.statutLMP?.cotisationsSSI?.tauxEffectif || '~40'}%</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs">Trimestres validés</div>
                    <div className="font-bold text-emerald-700">{synthese.ssiDetail?.droitsSociaux?.trimestresRetraite || 4}/an</div>
                  </div>
                </div>
                
                {/* Bouton toggle détail */}
                <button
                  onClick={() => setShowDetailSSI(!showDetailSSI)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
                  type="button"
                >
                  {showDetailSSI ? '▼ Masquer le détail' : '▶ Afficher le détail par composante'}
                </button>
                
                {/* Détail par composante */}
                {showDetailSSI && (
                  synthese.ssiDetail ? (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm">
                      <div className="font-semibold text-slate-700 mb-2">Cotisations obligatoires (hors CSG/CRDS)</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between"><span>Maladie-maternité</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.maladie || 0)}</span></div>
                        <div className="flex justify-between"><span>Retraite de base</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.retraiteBase || 0)}</span></div>
                        <div className="flex justify-between"><span>Retraite complémentaire</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.retraiteComplementaire || 0)}</span></div>
                        <div className="flex justify-between"><span>Invalidité-décès</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.invaliditeDeces || 0)}</span></div>
                        <div className="flex justify-between"><span>Allocations familiales</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.allocationsFamiliales || 0)}</span></div>
                        <div className="flex justify-between"><span>CFP (formation)</span><span className="font-medium">{fmtEur(synthese.ssiDetail.details?.cfp || 0)}</span></div>
                        <div className="flex justify-between font-semibold border-t pt-1.5"><span>Sous-total</span><span>{fmtEur(synthese.ssiDetail.cotisationsHorsCSG || 0)}</span></div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm">
                      <div className="font-semibold text-amber-800 mb-2">CSG/CRDS (9.7%)</div>
                      <div className="flex justify-between"><span>Base = Bénéfice + Cotisations</span><span className="font-medium">{fmtEur((synthese.ssiDetail.beneficeNet || 0) + (synthese.ssiDetail.cotisationsHorsCSG || 0))}</span></div>
                      <div className="flex justify-between font-semibold border-t border-amber-200 pt-1.5 mt-1.5"><span>CSG/CRDS dues</span><span>{fmtEur(synthese.ssiDetail.csgCrds || 0)}</span></div>
                    </div>
                    
                    <div className="bg-pink-50 rounded-lg p-3 border border-pink-200 text-sm">
                      <div className="flex justify-between font-bold text-pink-800">
                        <span>TOTAL COTISATIONS SSI</span>
                        <span>{fmtEur(synthese.ssiDetail.cotisationsTotal || 0)}</span>
                      </div>
                      {synthese.ssiDetail.minimumApplied && (
                        <div className="text-xs text-pink-600 mt-1">Cotisations minimales appliquées (1 208 €/an)</div>
                      )}
                    </div>
                    
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm">
                      <div className="font-semibold text-emerald-800 mb-2">Droits sociaux acquis</div>
                      <div className="flex justify-between"><span>Trimestres retraite</span><span className="font-medium">{synthese.ssiDetail.droitsSociaux?.trimestresRetraite || 0} trimestres/an</span></div>
                      <div className="flex justify-between"><span>Couverture maladie</span><span className="text-emerald-600">✓ Oui</span></div>
                      <div className="flex justify-between"><span>Invalidité-décès</span><span className="text-emerald-600">✓ Oui</span></div>
                    </div>
                  </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                      <p><strong>Détail non disponible</strong></p>
                      <p className="mt-1">Relancez la simulation pour obtenir le détail des composantes SSI.</p>
                    </div>
                  )
                )}
                
                {/* Graphique IR vs SSI */}
                <div className="mt-6">
                  <h4 className="font-semibold text-slate-700 mb-2">Comparaison IR vs SSI sur {dureeDetention} ans</h4>
                  <div ref={chartRef2} className="mb-4"/>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-600 space-y-2">
                      <p>Sur {dureeDetention} ans, vous paierez <strong className="text-amber-600">{fmtEur(synthese.totIR)}</strong> d'IR et <strong className="text-pink-600">{fmtEur(synthese.totSSI)}</strong> de cotisations SSI.</p>
                      <p>Les cotisations SSI représentent <strong>{synthese.totSSI > synthese.totIR ? `${((synthese.totSSI / (synthese.totIR + synthese.totSSI)) * 100).toFixed(0)}% du total des prélèvements` : `moins que l'IR`}</strong>.</p>
                      <p><strong>Contrepartie :</strong> Ces cotisations ouvrent des droits à la retraite ({(synthese.ssiDetail?.droitsSociaux?.trimestresRetraite || 4) * dureeDetention} trimestres sur {dureeDetention} ans), contrairement au LMNP qui ne génère aucun droit social.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* PLUS-VALUE LMP - DÉTAIL COMPLET */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <h3 className="font-bold mb-2 text-slate-800">Simulation de revente en {anneeAcq + dureeDetention - 1} ({dureeDetention} ans de détention)</h3>
                <p className="text-sm text-slate-500 mb-4">En LMP, la plus-value suit le <strong>régime professionnel</strong> (art. 151 septies CGI) avec possibilité d'exonération totale.</p>
                
                {/* Indicateurs clés */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-xs">Prix de cession</div>
                    <div className="font-bold text-slate-800">{fmtEur(synthese.pvDetail?.prixCession || synthese.valRev)}</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
                    <div className="text-amber-600 text-xs font-medium">Valeur nette comptable</div>
                    <div className="font-bold text-amber-700">{fmtEur(synthese.pvDetail?.valeurNetteComptable || 0)}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-emerald-600 text-xs">PV professionnelle</div>
                    <div className="font-bold text-emerald-600">+{fmtEur(synthese.pvDetail?.pvBrute || synthese.pvBrute)}</div>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-500 text-xs">Impôt PV</div>
                    <div className="font-bold text-red-600">{fmtEur(synthese.pvDetail?.impotPV || synthese.impotPV)}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-blue-600 text-xs">Capital net final</div>
                    <div className="font-bold text-blue-700">{fmtEur(synthese.pvDetail?.capitalNetFinal || synthese.capFinal)}</div>
                  </div>
                </div>
                
                {/* Statut exonération */}
                <div className={`${synthese.pvDetail?.exoneration?.tauxExoneration === 100 ? 'bg-emerald-50 border-emerald-200' : synthese.pvDetail?.exoneration?.tauxExoneration > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-4`}>
                  <h4 className={`font-semibold ${synthese.pvDetail?.exoneration?.tauxExoneration === 100 ? 'text-emerald-800' : synthese.pvDetail?.exoneration?.tauxExoneration > 0 ? 'text-amber-800' : 'text-red-800'} mb-2`}>
                    {synthese.pvDetail?.exoneration?.tauxExoneration === 100 ? 'Exonération totale applicable' : synthese.pvDetail?.exoneration?.tauxExoneration > 0 ? `Exonération partielle (${synthese.pvDetail.exoneration.tauxExoneration}%)` : 'Pas d\'exonération'}
                  </h4>
                  <p className={`text-sm ${synthese.pvDetail?.exoneration?.tauxExoneration === 100 ? 'text-emerald-700' : synthese.pvDetail?.exoneration?.tauxExoneration > 0 ? 'text-amber-700' : 'text-red-700'}`}>
                    {synthese.pvDetail?.exoneration?.type || 'Exonération non applicable'}
                  </p>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">Conditions art. 151 septies :</span> {synthese.pvDetail?.exoneration?.conditionDuree} • {synthese.pvDetail?.exoneration?.conditionRecettes}
                  </div>
                </div>
                
                {/* Bouton toggle détail */}
                <button
                  onClick={() => setShowDetailPV(!showDetailPV)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
                >
                  {showDetailPV ? '▼ Masquer le détail du calcul' : '▶ Afficher le détail du calcul (art. 151 septies CGI)'}
                </button>
                
                {/* Détail du calcul */}
                {showDetailPV && (
                  <div className="space-y-3">
                    {/* Calcul valeur nette comptable */}
                    <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm space-y-2">
                      <div className="font-semibold text-slate-700 mb-2">Valeur nette comptable (VNC)</div>
                      <div className="flex justify-between"><span>Prix d'acquisition</span><span>{fmtEur(synthese.pvDetail?.prixAcquisition || prixAchat)}</span></div>
                      <div className="flex justify-between text-amber-700"><span>− Amortissements cumulés</span><span>−{fmtEur(synthese.pvDetail?.amortissementsCumules || 0)}</span></div>
                      <div className="flex justify-between font-semibold border-t pt-2"><span>= Valeur nette comptable</span><span>{fmtEur(synthese.pvDetail?.valeurNetteComptable || 0)}</span></div>
                    </div>
                    
                    {/* Calcul plus-value professionnelle */}
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm space-y-2">
                      <div className="font-semibold text-emerald-800 mb-2">Plus-value professionnelle</div>
                      <div className="flex justify-between"><span>Prix de cession</span><span>{fmtEur(synthese.pvDetail?.prixCession || synthese.valRev)}</span></div>
                      <div className="flex justify-between"><span>− Valeur nette comptable</span><span>−{fmtEur(synthese.pvDetail?.valeurNetteComptable || 0)}</span></div>
                      <div className="flex justify-between font-semibold border-t border-emerald-200 pt-2"><span>= Plus-value brute</span><span className="text-emerald-700">+{fmtEur(synthese.pvDetail?.pvBrute || synthese.pvBrute)}</span></div>
                    </div>
                    
                    {/* Exonération */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm space-y-2">
                      <div className="font-semibold text-blue-800 mb-2">Exonération art. 151 septies CGI</div>
                      <div className="flex justify-between">
                        <span>Durée d'activité</span>
                        <span className={dureeDetention >= 5 ? 'text-emerald-600' : 'text-red-600'}>{dureeDetention} ans {dureeDetention >= 5 ? '✓' : '✗ (min. 5 ans)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recettes moyennes</span>
                        <span className={loyerAnnuel < 90000 ? 'text-emerald-600' : loyerAnnuel < 126000 ? 'text-amber-600' : 'text-red-600'}>{fmtEur(Math.round(loyerAnnuel))} {loyerAnnuel < 90000 ? '✓ < 90k' : loyerAnnuel < 126000 ? '~ 90k-126k' : '✗ ≥ 126k'}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                        <span>Taux d'exonération</span>
                        <span className="text-blue-700">{synthese.pvDetail?.exoneration?.tauxExoneration || 0}%</span>
                      </div>
                    </div>
                    
                    {/* Impôt sur PV */}
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-sm space-y-2">
                      <div className="font-semibold text-red-800 mb-2">Impôt sur plus-value</div>
                      <div className="flex justify-between"><span>PV imposable après exonération</span><span>{fmtEur(Math.round((synthese.pvDetail?.pvBrute || synthese.pvBrute) * (1 - (synthese.pvDetail?.exoneration?.tauxExoneration || 0) / 100)))}</span></div>
                      <div className="flex justify-between"><span>Taux imposition (IR + PS)</span><span>~30%</span></div>
                      <div className="flex justify-between font-bold border-t border-red-200 pt-2"><span>= Impôt dû</span><span className="text-red-600">{fmtEur(synthese.pvDetail?.impotPV || synthese.impotPV)}</span></div>
                    </div>
                    
                    {/* Capital net */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm space-y-2">
                      <div className="font-semibold text-blue-800 mb-2">Capital net après revente</div>
                      <div className="flex justify-between"><span>Prix de vente</span><span>{fmtEur(synthese.pvDetail?.prixCession || synthese.valRev)}</span></div>
                      <div className="flex justify-between"><span>− Impôt PV</span><span>−{fmtEur(synthese.pvDetail?.impotPV || synthese.impotPV)}</span></div>
                      <div className="flex justify-between"><span>− Frais de vente</span><span>−{fmtEur(synthese.pvDetail?.fraisRevente || Math.round(synthese.valRev * fraisRevente / 100))}</span></div>
                      <div className="flex justify-between"><span>− Capital restant dû</span><span>−{fmtEur(synthese.pvDetail?.capitalRestantDu || 0)}</span></div>
                      <div className="flex justify-between font-bold border-t border-blue-200 pt-2"><span>= Capital net final</span><span className="text-blue-700">{fmtEur(synthese.pvDetail?.capitalNetFinal || synthese.capFinal)}</span></div>
                    </div>
                  </div>
                )}
                
                {/* Comparaison avec LMNP */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Avantage LMP vs LMNP</h4>
                  <p className="text-sm text-slate-600">
                    En LMNP, la plus-value suit le régime des particuliers avec abattements progressifs (22 ans pour IR, 30 ans pour PS). 
                    <strong> En LMP avec exonération art. 151 septies, vous bénéficiez d'une exonération totale dès 5 ans</strong> si vos recettes restent inférieures à 90 000 €.
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              {/* TABLEAU DES PROJECTIONS */}
              {/* ═══════════════════════════════════════════════════════════════════════════ */}
              <div className="sim-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Projection sur {dureeDetention} ans ({anneeAcq} → {anneeAcq + dureeDetention - 1})</h3>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={showDetailedTable} onChange={(e) => setShowDetailedTable(e.target.checked)} className="rounded" />
                    <span className="text-slate-600">Afficher le détail</span>
                  </label>
                </div>
                
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-blue-600 font-medium">ℹ️ Comprendre la fiscalité LMP</summary>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-xs text-blue-700 space-y-1">
                    <p><strong>Résultat BIC</strong> = Loyers - Charges - Intérêts - Amortissement (ne peut pas être négatif grâce à l'amortissement)</p>
                    <p><strong>Cotisations SSI</strong> = 35-45% (progressif) du résultat BIC net positif, min. 1 208 €/an. Comprend : maladie, retraite, invalidité, allocations familiales, CFP, CSG/CRDS.</p>
                    <p><strong>IR</strong> = Résultat BIC imposé au barème progressif (après déduction des cotisations SSI)</p>
                    <p><strong>Droits acquis</strong> = 4 trimestres retraite/an + couverture maladie + invalidité-décès</p>
                  </div>
                </details>
                
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="py-2 px-1 text-left font-semibold text-slate-600">Année</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Loyer</th>
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Charges</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Intérêts</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-slate-50">Assur.</th>}
                        {showDetailedTable && <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-blue-50">Amort.</th>}
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Résultat</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-pink-50">SSI</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600 bg-amber-50">IR</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Cash-flow</th>
                        <th className="py-2 px-1 text-right font-semibold text-slate-600">Capital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map(p => (
                        <tr key={p.annee} className={`border-b border-slate-100 ${p.cfApres >= 0 ? 'bg-emerald-50/30' : ''} hover:bg-slate-50`}>
                          <td className="py-1.5 px-1 font-medium text-slate-800">{p.annee}</td>
                          <td className="py-1.5 px-1 text-right text-slate-700">{fmtEur(p.loyerNet)}</td>
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.charges)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.interets)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-slate-500 bg-slate-50/50">{fmtEur(p.assEmp)}</td>}
                          {showDetailedTable && <td className="py-1.5 px-1 text-right text-blue-600 bg-blue-50/50">{fmtEur(p.amortUtil)}</td>}
                          <td className="py-1.5 px-1 text-right text-slate-700">{fmtEur(p.resultatBIC)}</td>
                          <td className="py-1.5 px-1 text-right text-pink-600 bg-pink-50/50">{fmtEur(p.cotisationsSSI)}</td>
                          <td className="py-1.5 px-1 text-right text-amber-600 bg-amber-50/50">{fmtEur(p.impotIR)}</td>
                          <td className={`py-1.5 px-1 text-right font-semibold ${p.cfApres >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{p.cfApres >= 0 ? '+' : ''}{fmtEur(p.cfApres)}</td>
                          <td className="py-1.5 px-1 text-right text-blue-600 font-medium">{fmtEur(p.capNet)}</td>
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
                  const loyerAnnuelCalc = loyerMensuel * 12 * (1 - vacanceSemaines / 52)
                  const rendBrutCalc = loyerAnnuelCalc / prixAchat * 100
                  
                  let ptsTRI = 0
                  if (safeNumber(synthese.tri) >= 10) ptsTRI = 3
                  else if (safeNumber(synthese.tri) >= 8) ptsTRI = 2.5
                  else if (safeNumber(synthese.tri) >= 6) ptsTRI = 2
                  else if (safeNumber(synthese.tri) >= 4) ptsTRI = 1
                  else if (safeNumber(synthese.tri) >= 2) ptsTRI = 0.5
                  
                  let ptsCF = 0
                  if (safeNumber(synthese.cfMoyMois) >= 200) ptsCF = 2.5
                  else if (safeNumber(synthese.cfMoyMois) >= 100) ptsCF = 2
                  else if (safeNumber(synthese.cfMoyMois) >= 0) ptsCF = 1.5
                  else if (safeNumber(synthese.cfMoyMois) >= -150) ptsCF = 1
                  else if (safeNumber(synthese.cfMoyMois) >= -300) ptsCF = 0.5
                  
                  let ptsExoneration = 0
                  if (dureeDetention >= 5 && loyerAnnuelCalc < 90000) ptsExoneration = 2
                  else if (dureeDetention >= 5 && loyerAnnuelCalc < 126000) ptsExoneration = 1
                  
                  let ptsLevier = 0
                  if (levier >= 8) ptsLevier = 1.5
                  else if (levier >= 5) ptsLevier = 1
                  else if (levier >= 3) ptsLevier = 0.5
                  
                  let ptsRend = 0
                  if (rendBrutCalc >= 8) ptsRend = 1.5
                  else if (rendBrutCalc >= 6) ptsRend = 1
                  else if (rendBrutCalc >= 4) ptsRend = 0.5
                  
                  let penalites = 0
                  if (safeNumber(synthese.totSSI) > safeNumber(synthese.gainTotal) * 0.5) penalites = -0.5
                  
                  const scoreTotal = ptsTRI + ptsCF + ptsExoneration + ptsLevier + ptsRend + penalites
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
                                <span className="w-24 text-slate-600">TRI</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsTRI >= 2 ? 'bg-emerald-500' : ptsTRI >= 1 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsTRI / 3) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsTRI}/3 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsTRI >= 2 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(synthese.tri)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-24 text-slate-600">Cash-flow</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsCF >= 1.5 ? 'bg-emerald-500' : ptsCF >= 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{width: `${(ptsCF / 2.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsCF}/2.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsCF >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtSignedEur(synthese.cfMoyMois)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-24 text-slate-600">Exonér. PV</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsExoneration >= 1.5 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsExoneration / 2) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsExoneration}/2 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsExoneration >= 1.5 ? 'text-emerald-600' : 'text-blue-600'}`}>{ptsExoneration >= 2 ? 'Oui' : ptsExoneration >= 1 ? 'Partiel' : 'Non'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-24 text-slate-600">Levier</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{width: `${(ptsLevier / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsLevier}/1.5 pts</span>
                                <span className="w-14 text-right font-semibold text-blue-600">×{levier.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="w-24 text-slate-600">Rendement</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ptsRend >= 1 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{width: `${(ptsRend / 1.5) * 100}%`}}></div></div>
                                <span className="w-16 text-right text-xs text-slate-500">{ptsRend}/1.5 pts</span>
                                <span className={`w-14 text-right font-semibold ${ptsRend >= 1 ? 'text-emerald-600' : 'text-blue-600'}`}>{fmtPct(rendBrutCalc)}</span>
                              </div>
                              {penalites < 0 && (
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="w-24 text-red-600">Pénalité SSI</span>
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{width: '100%'}}></div></div>
                                  <span className="w-16 text-right text-xs text-red-500">{penalites} pts</span>
                                  <span className="w-14 text-right font-semibold text-red-600">SSI élevé</span>
                                </div>
                              )}
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
                            <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Méthode de calcul du score LMP</h5>
                            <p className="text-slate-600 mb-3">Score calculé sur 5 critères : TRI (3 pts), Cash-flow (2.5 pts), Exonération PV (2 pts), Levier (1.5 pts), Rendement (1.5 pts).</p>
                            <p className="text-slate-600">Le LMP permet l'exonération de plus-value après 5 ans si CA {"<"} 90k€, mais les cotisations SSI (~45%) impactent fortement le rendement.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
                
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Avis professionnel</h4>
                  <div className="text-sm text-blue-700 space-y-3">
                    {safeNumber(synthese.tri) > 6 && safeNumber(synthese.cfMoyMois) >= 0 ? (
                      <>
                        <p><strong>Opération intéressante</strong> : Malgré les cotisations SSI élevées (~45%), le TRI de {fmtPct(synthese.tri)} et le cash-flow positif de {fmtEur(synthese.cfMoyMois)}/mois rendent cette opération attractive.</p>
                        <p>L'avantage majeur du LMP : exonération de plus-value après 5 ans d'activité (si CA {"<"} 90k€). Capital net final de {fmtEur(synthese.capFinal)}, soit ×{(safeNumber(synthese.capFinal) / apport).toFixed(1)} votre apport.</p>
                      </>
                    ) : safeNumber(synthese.tri) > 4 ? (
                      <>
                        <p><strong>Opération à évaluer</strong> : Le TRI de {fmtPct(synthese.tri)} est correct mais les cotisations SSI ({fmtEur(synthese.totSSI)} sur {dureeDetention} ans) impactent la rentabilité.</p>
                        <p><strong>Alternative LMNP</strong> : En LMNP, pas de SSI mais PV taxée au régime des particuliers avec réintégration des amortissements (LF 2024). Comparez les deux scénarios.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Opération à reconsidérer</strong> : Le TRI de {fmtPct(synthese.tri)} est faible compte tenu des contraintes LMP (SSI ~45%, régime réel obligatoire, CFE...).</p>
                        <p><strong>Conseil</strong> : Si possible, réduisez les recettes sous 23k€ ou augmentez vos autres revenus d'activité pour basculer en LMNP et éviter les SSI.</p>
                      </>
                    )}
                    <p className="text-blue-500 text-xs mt-2"><em>Cette analyse est indicative. Consultez un expert-comptable spécialisé pour une étude personnalisée.</em></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4"><button onClick={()=>setShowResults(false)} className="btn-primary">Nouvelle simulation</button></div>
            </div>
          )}
        </main>
      </div>
      <style jsx global>{`.sim-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.05)}.btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:transform .2s}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(30,64,175,.25)}.btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}.badge-blue{background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}.badge-pink{background:#fce7f3;color:#db2777;padding:4px 10px;border-radius:99px;font-size:12px}.badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}.form-group{display:flex;flex-direction:column;gap:4px}.form-group label{font-size:13px;font-weight:500;color:#374151}.form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}.form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none}.form-hint{font-size:11px;color:#9ca3af}.info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}.pedagogy-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:16px}.alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}.alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}.alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}.animate-fadeIn{animation:fadeIn .3s ease-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}`}</style>
    </SimulatorGate>
  )
}
