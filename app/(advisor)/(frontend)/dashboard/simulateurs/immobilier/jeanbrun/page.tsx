'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../_hooks/usePlotlyReady'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  calculIRDetaille,
  calculNombreParts,
  calculIFI,
} from '../_utils/display-helpers'

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
const fmtSignedEur = (n: number | null | undefined) => (safeNumber(n) >= 0 ? '+' : '') + fmtEur(n)

type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
type TypeLogement = 'NEUF' | 'ANCIEN'
type CategorieLoyer = 'INTERMEDIAIRE' | 'SOCIAL' | 'TRES_SOCIAL'
type ClasseDPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

// Constantes d'affichage Jeanbrun (PLF 2026)
const JEANBRUN_DISPLAY = {
  NEUF: {
    INTERMEDIAIRE: { taux: 3.5, plafond: 8000 },
    SOCIAL: { taux: 4.5, plafond: 10000 },
    TRES_SOCIAL: { taux: 5.5, plafond: 12000 },
  },
  ANCIEN: {
    INTERMEDIAIRE: { taux: 3.0, plafond: 7000 },
    SOCIAL: { taux: 3.5, plafond: 8500 },
    TRES_SOCIAL: { taux: 4.0, plafond: 10000 },
  },
  DECOTE_LOYER: {
    INTERMEDIAIRE: 15,
    SOCIAL: 30,
    TRES_SOCIAL: 45,
  },
  ENGAGEMENT_LOCATION: 9,
}

const CATEGORIE_LABELS: Record<CategorieLoyer, string> = {
  INTERMEDIAIRE: 'Intermédiaire (-15% du marché)',
  SOCIAL: 'Social (-30% du marché)',
  TRES_SOCIAL: 'Très social (-45% du marché)',
}

export default function JeanbrunPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()

  // ÉTAPE 1 : Profil client
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [revenusSalaires, setRevenusSalaires] = useState(70000)
  const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
  const [autresRevenus, setAutresRevenus] = useState(0)
  const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(0)
  const [dettesImmobilieres, setDettesImmobilieres] = useState(0)
  const [valeurRP, setValeurRP] = useState(0)

  // ÉTAPE 2 : Bien immobilier
  const [typeLogement, setTypeLogement] = useState<TypeLogement>('NEUF')
  const [prixAcquisition, setPrixAcquisition] = useState(250000)
  const [surface, setSurface] = useState(50)
  const [fraisNotaire, setFraisNotaire] = useState(6250)
  const [montantTravaux, setMontantTravaux] = useState(0)
  const [dpeAvant, setDpeAvant] = useState<ClasseDPE>('D')
  const [dpeApres, setDpeApres] = useState<'A' | 'B'>('B')
  const [categorieLoyer, setCategorieLoyer] = useState<CategorieLoyer>('INTERMEDIAIRE')

  // ÉTAPE 3 : Revenus locatifs & charges
  const [loyerMarcheM2, setLoyerMarcheM2] = useState(15)
  const [chargesLocatives, setChargesLocatives] = useState(0)
  const [vacanceSemaines, setVacanceSemaines] = useState(2)
  const [taxeFonciere, setTaxeFonciere] = useState(1500)
  const [chargesCopro, setChargesCopro] = useState(1200)
  const [assurancePNO, setAssurancePNO] = useState(300)
  const [fraisGestion, setFraisGestion] = useState(7)
  const [comptabilite, setComptabilite] = useState(0)

  // ÉTAPE 4 : Financement
  const [apport, setApport] = useState(50000)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [dureeCredit, setDureeCredit] = useState(20)
  const [assuranceCredit, setAssuranceCredit] = useState(0.30)

  // ÉTAPE 5 : Projection
  const [dureeDetention, setDureeDetention] = useState(15)
  const [revalorisationBien, setRevalorisationBien] = useState(2)
  const [revalorisationLoyer, setRevalorisationLoyer] = useState(1.5)

  // Résultat API
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs pour Plotly
  const chartCashFlowRef = useRef<HTMLDivElement>(null)
  const chartAmortRef = useRef<HTMLDivElement>(null)
  const chartCompRef = useRef<HTMLDivElement>(null)

  // Calculs d'aperçu temps réel
  const nbParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })
  const revenusTotaux = revenusSalaires + revenusFonciersExistants + autresRevenus
  const irEstime = calculIRDetaille(revenusTotaux, nbParts)
  const ifiEstime = calculIFI({ patrimoineImmobilierBrut: patrimoineImmobilierExistant + prixAcquisition, dettesDeductibles: dettesImmobilieres, valeurRP })

  const decotePct = JEANBRUN_DISPLAY.DECOTE_LOYER[categorieLoyer]
  const loyerPlafondM2 = loyerMarcheM2 * (1 - decotePct / 100)
  const loyerMensuelEstime = Math.round(loyerPlafondM2 * surface)
  const loyerMarcheEstime = Math.round(loyerMarcheM2 * surface)

  const paramsAmort = typeLogement === 'NEUF' ? JEANBRUN_DISPLAY.NEUF[categorieLoyer] : JEANBRUN_DISPLAY.ANCIEN[categorieLoyer]
  const coutTotal = prixAcquisition + (typeLogement === 'ANCIEN' ? montantTravaux : 0)
  const baseAmortissable = coutTotal * 0.80
  const amortBrut = baseAmortissable * paramsAmort.taux / 100
  const amortEffectif = Math.min(amortBrut, paramsAmort.plafond)

  const seuilTravaux = prixAcquisition * 0.30
  const travauxValides = typeLogement === 'NEUF' || montantTravaux >= seuilTravaux

  // Lancer la simulation
  const handleSimulate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/advisor/simulators/immobilier/jeanbrun', {
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
          typeLogement,
          prixAcquisition,
          surface,
          fraisNotaire,
          montantTravaux,
          dpeAvant: typeLogement === 'ANCIEN' ? dpeAvant : undefined,
          dpeApres: typeLogement === 'ANCIEN' ? dpeApres : undefined,
          categorieLoyer,
          loyerMarcheM2,
          chargesLocatives,
          vacanceSemaines,
          taxeFonciere,
          chargesCopro,
          assurancePNO,
          fraisGestion,
          comptabilite,
          apport,
          tauxCredit,
          dureeCredit,
          assuranceCredit,
          dureeDetention,
          revalorisationBien,
          revalorisationLoyer,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur serveur')

      const simulation = data.data?.simulation || data.simulation || data.data || data
      if (!simulation || !simulation.synthese || !Array.isArray(simulation.projection)) {
        throw new Error('Réponse simulation invalide. Veuillez réessayer.')
      }

      setResult(simulation)
      setShowResults(true)
      setShowDetailedTable(true)
      setStep(6)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la simulation')
    } finally {
      setLoading(false)
    }
  }, [
    situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole,
    revenusSalaires, revenusFonciersExistants, autresRevenus,
    patrimoineImmobilierExistant, dettesImmobilieres, valeurRP,
    typeLogement, prixAcquisition, surface, fraisNotaire, montantTravaux,
    dpeAvant, dpeApres, categorieLoyer,
    loyerMarcheM2, chargesLocatives, vacanceSemaines,
    taxeFonciere, chargesCopro, assurancePNO, fraisGestion, comptabilite,
    apport, tauxCredit, dureeCredit, assuranceCredit,
    dureeDetention, revalorisationBien, revalorisationLoyer,
  ])

  // Dessiner les graphiques
  useEffect(() => {
    if (!plotlyReady || !result || !showResults) return
    const Plotly = (window as any).Plotly
    if (!Plotly) return

    try {
      const proj = result.projection || []
      const annees = proj.map((p: any) => `A${p.annee}`)
      if (!proj.length) return

      // Graphique Cash-Flow
      if (chartCashFlowRef.current) {
        Plotly.newPlot(chartCashFlowRef.current, [
          {
            x: annees,
            y: proj.map((p: any) => p.cashFlowAvantImpot),
            name: 'Cash-flow avant impôt',
            type: 'bar',
            marker: { color: '#60a5fa' },
          },
          {
            x: annees,
            y: proj.map((p: any) => p.cashFlowApresImpot),
            name: 'Cash-flow après impôt',
            type: 'bar',
            marker: { color: '#34d399' },
          },
        ], {
          title: 'Cash-flow annuel',
          barmode: 'group',
          height: 350,
          margin: { t: 40, b: 40, l: 60, r: 20 },
          font: { size: 11 },
          legend: { orientation: 'h', y: -0.2 },
        }, { responsive: true })
      }

      // Graphique Amortissement vs Revenu Foncier
      if (chartAmortRef.current) {
        Plotly.newPlot(chartAmortRef.current, [
          {
            x: annees,
            y: proj.map((p: any) => p.loyerEffectif),
            name: 'Loyer effectif',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#60a5fa', width: 2 },
          },
          {
            x: annees,
            y: proj.map((p: any) => p.amortissement),
            name: 'Amortissement Jeanbrun',
            type: 'bar',
            marker: { color: '#a78bfa', opacity: 0.7 },
          },
          {
            x: annees,
            y: proj.map((p: any) => p.revenuFoncierNet),
            name: 'Revenu foncier net',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#f97316', width: 2 },
          },
        ], {
          title: 'Amortissement Jeanbrun & revenus fonciers',
          height: 350,
          margin: { t: 40, b: 40, l: 60, r: 20 },
          font: { size: 11 },
          legend: { orientation: 'h', y: -0.2 },
        }, { responsive: true })
      }

      // Graphique Comparaison avec/sans Jeanbrun
      if (chartCompRef.current && result.comparaison) {
        const comp = result.comparaison
        Plotly.newPlot(chartCompRef.current, [
          {
            x: ['Sans Jeanbrun', 'Avec Jeanbrun'],
            y: [comp.sansJeanbrun.impotAnnee1, Math.max(0, (proj[0]?.revenuFoncierNet || 0) > 0 ? (proj[0]?.revenuFoncierNet || 0) * (irEstime.tmi / 100 + 0.172) : 0)],
            name: 'Impôt année 1',
            type: 'bar',
            marker: { color: ['#ef4444', '#22c55e'] },
          },
        ], {
          title: 'Impact fiscal année 1 — Avec vs Sans Jeanbrun',
          height: 300,
          margin: { t: 40, b: 40, l: 60, r: 20 },
          font: { size: 11 },
        }, { responsive: true })
      }
    } catch {
      setError('Les résultats sont calculés mais un problème bloque l’affichage des graphiques.')
    }
  }, [plotlyReady, result, showResults, irEstime.tmi])

  // Input helper
  const InputField = ({ label, value, onChange, suffix, min, max, step: inputStep, hint }: {
    label: string; value: number; onChange: (v: number) => void;
    suffix?: string; min?: number; max?: number; step?: number; hint?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={inputStep || 1}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )

  const SelectField = ({ label, value, onChange, options, hint }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; hint?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )

  const StepNav = ({ canNext = true }: { canNext?: boolean }) => (
    <div className="flex justify-between mt-6">
      {step > 1 ? (
        <button onClick={() => setStep(step - 1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Précédent
        </button>
      ) : <div />}
      {step < 5 ? (
        <button
          onClick={() => canNext && setStep(step + 1)}
          disabled={!canNext}
          className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      ) : (
        <button
          onClick={handleSimulate}
          disabled={loading || !travauxValides}
          className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Simulation en cours...
            </>
          ) : 'Lancer la simulation'}
        </button>
      )}
    </div>
  )

  // Indicateur d'étapes
  const steps = [
    { n: 1, label: 'Profil fiscal' },
    { n: 2, label: 'Bien immobilier' },
    { n: 3, label: 'Revenus & charges' },
    { n: 4, label: 'Financement' },
    { n: 5, label: 'Projection' },
    { n: 6, label: 'Résultats' },
  ]

  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/simulateurs" className="text-sm text-emerald-600 hover:underline mb-2 inline-block">
            &larr; Retour aux simulateurs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Dispositif Jeanbrun — PLF 2026</h1>
          <p className="text-sm text-gray-600 mt-1">
            Nouveau statut du bailleur privé : amortissement fiscal sur revenus fonciers (location nue).
            Remplace le dispositif Pinel (expiré fin 2024).
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {steps.map((s) => (
            <button
              key={s.n}
              onClick={() => s.n <= 5 || showResults ? setStep(s.n) : undefined}
              disabled={s.n === 6 && !showResults}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                step === s.n
                  ? 'bg-emerald-600 text-white'
                  : s.n < step || (s.n === 6 && showResults)
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s.n ? 'bg-white text-emerald-600' : s.n < step ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-white'
              }`}>
                {s.n < step ? '✓' : s.n}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Bandeau d'info Jeanbrun */}
        {step <= 5 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 text-sm">
            <div className="font-medium text-emerald-800 mb-1">Dispositif Jeanbrun — Points clés</div>
            <ul className="text-emerald-700 space-y-0.5 text-xs">
              <li>- Amortissement de <strong>{paramsAmort.taux}%</strong> ({typeLogement === 'NEUF' ? 'neuf' : 'ancien'}, {categorieLoyer.toLowerCase()}) plafonné à <strong>{fmtEur(paramsAmort.plafond)}/an</strong></li>
              <li>- Loyer plafonné à <strong>-{decotePct}%</strong> du marché = <strong>{fmtEur(loyerMensuelEstime)}/mois</strong> (marché : {fmtEur(loyerMarcheEstime)}/mois)</li>
              <li>- Engagement de location : <strong>{JEANBRUN_DISPLAY.ENGAGEMENT_LOCATION} ans minimum</strong></li>
              <li>- PS sur revenus fonciers : <strong>17,2%</strong> (inchangé LFSS 2026)</li>
              {typeLogement === 'ANCIEN' && <li>- Travaux requis : <strong>≥ 30%</strong> du prix ({fmtEur(seuilTravaux)} min.) + DPE cible A ou B</li>}
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 1 : Profil fiscal
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Profil fiscal du client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SelectField
                label="Situation familiale"
                value={situationFamiliale}
                onChange={v => setSituationFamiliale(v as SituationFamiliale)}
                options={[
                  { value: 'CELIBATAIRE', label: 'Célibataire' },
                  { value: 'MARIE_PACSE', label: 'Marié(e) / Pacsé(e)' },
                  { value: 'VEUF', label: 'Veuf(ve)' },
                ]}
              />
              <InputField label="Enfants à charge" value={enfantsACharge} onChange={setEnfantsACharge} min={0} max={10} />
              <InputField label="Enfants en garde alternée" value={enfantsGardeAlternee} onChange={setEnfantsGardeAlternee} min={0} max={10} />
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={parentIsole} onChange={e => setParentIsole(e.target.checked)} className="rounded text-emerald-600" />
                <span className="text-sm text-gray-700">Parent isolé</span>
              </div>
              <InputField label="Salaires annuels" value={revenusSalaires} onChange={setRevenusSalaires} suffix="€" min={0} />
              <InputField label="Revenus fonciers existants" value={revenusFonciersExistants} onChange={setRevenusFonciersExistants} suffix="€" min={0} />
              <InputField label="Autres revenus" value={autresRevenus} onChange={setAutresRevenus} suffix="€" min={0} />
              <InputField label="Patrimoine immobilier brut" value={patrimoineImmobilierExistant} onChange={setPatrimoineImmobilierExistant} suffix="€" min={0} />
              <InputField label="Dettes immobilières" value={dettesImmobilieres} onChange={setDettesImmobilieres} suffix="€" min={0} />
              <InputField label="Valeur résidence principale" value={valeurRP} onChange={setValeurRP} suffix="€" min={0} />
            </div>

            {/* Aperçu fiscal */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Parts fiscales</span>
                <div className="text-lg font-semibold">{nbParts}</div>
              </div>
              <div>
                <span className="text-gray-500">TMI estimé</span>
                <div className="text-lg font-semibold">{irEstime.tmi}%</div>
              </div>
              <div>
                <span className="text-gray-500">IR estimé</span>
                <div className="text-lg font-semibold">{fmtEur(irEstime.impotNet)}</div>
              </div>
              <div>
                <span className="text-gray-500">IFI</span>
                <div className="text-lg font-semibold">{ifiEstime.assujetti ? fmtEur(ifiEstime.impotNet) : 'Non assujetti'}</div>
              </div>
            </div>

            <StepNav />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 2 : Bien immobilier
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bien immobilier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SelectField
                label="Type de logement"
                value={typeLogement}
                onChange={v => setTypeLogement(v as TypeLogement)}
                options={[
                  { value: 'NEUF', label: 'Neuf (RE2020)' },
                  { value: 'ANCIEN', label: 'Ancien (avec travaux ≥ 30%)' },
                ]}
              />
              <InputField label="Prix d'acquisition" value={prixAcquisition} onChange={setPrixAcquisition} suffix="€" min={10000} hint="Hors frais de notaire" />
              <InputField label="Surface habitable" value={surface} onChange={setSurface} suffix="m²" min={9} max={500} />
              <InputField label="Frais de notaire" value={fraisNotaire} onChange={setFraisNotaire} suffix="€" min={0} hint={`~${fmtPct(fraisNotaire / prixAcquisition * 100)} du prix`} />
              <SelectField
                label="Catégorie de loyer"
                value={categorieLoyer}
                onChange={v => setCategorieLoyer(v as CategorieLoyer)}
                options={[
                  { value: 'INTERMEDIAIRE', label: CATEGORIE_LABELS.INTERMEDIAIRE },
                  { value: 'SOCIAL', label: CATEGORIE_LABELS.SOCIAL },
                  { value: 'TRES_SOCIAL', label: CATEGORIE_LABELS.TRES_SOCIAL },
                ]}
                hint={`Amortissement : ${paramsAmort.taux}% plafonné ${fmtEur(paramsAmort.plafond)}/an`}
              />
            </div>

            {/* Section Ancien : travaux + DPE */}
            {typeLogement === 'ANCIEN' && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Travaux et performance énergétique (ancien)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InputField
                    label="Montant des travaux"
                    value={montantTravaux}
                    onChange={setMontantTravaux}
                    suffix="€"
                    min={0}
                    hint={`Minimum requis : ${fmtEur(seuilTravaux)} (30% du prix)`}
                  />
                  <SelectField
                    label="DPE avant travaux"
                    value={dpeAvant}
                    onChange={v => setDpeAvant(v as ClasseDPE)}
                    options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as ClasseDPE[]).map(v => ({ value: v, label: `Classe ${v}` }))}
                  />
                  <SelectField
                    label="DPE après travaux (cible)"
                    value={dpeApres}
                    onChange={v => setDpeApres(v as 'A' | 'B')}
                    options={[
                      { value: 'A', label: 'Classe A' },
                      { value: 'B', label: 'Classe B' },
                    ]}
                    hint="Le dispositif Jeanbrun exige un DPE A ou B"
                  />
                </div>
                {!travauxValides && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    Les travaux ({fmtEur(montantTravaux)}) doivent représenter au moins 30% du prix d&apos;acquisition ({fmtEur(seuilTravaux)} minimum).
                  </div>
                )}
              </div>
            )}

            {/* Aperçu amortissement */}
            <div className="mt-6 bg-emerald-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-emerald-700">Base amortissable</span>
                <div className="text-lg font-semibold text-emerald-900">{fmtEur(baseAmortissable)}</div>
              </div>
              <div>
                <span className="text-emerald-700">Amortissement brut</span>
                <div className="text-lg font-semibold text-emerald-900">{fmtEur(amortBrut)}/an</div>
              </div>
              <div>
                <span className="text-emerald-700">Amortissement effectif</span>
                <div className="text-lg font-semibold text-emerald-900">{fmtEur(amortEffectif)}/an</div>
                {amortBrut > paramsAmort.plafond && <span className="text-xs text-amber-600">Plafonné</span>}
              </div>
              <div>
                <span className="text-emerald-700">Total sur 9 ans</span>
                <div className="text-lg font-semibold text-emerald-900">{fmtEur(amortEffectif * 9)}</div>
              </div>
            </div>

            <StepNav canNext={travauxValides} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 3 : Revenus locatifs & charges
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenus locatifs & charges</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Loyer marché au m²/mois"
                value={loyerMarcheM2}
                onChange={setLoyerMarcheM2}
                suffix="€/m²"
                min={5}
                max={50}
                step={0.5}
                hint={`Loyer marché mensuel : ${fmtEur(loyerMarcheEstime)}`}
              />
              <div className="bg-emerald-50 rounded-lg p-3 col-span-1 md:col-span-2 text-sm">
                <div className="text-emerald-700 font-medium">Loyer plafonné Jeanbrun</div>
                <div className="text-2xl font-bold text-emerald-800 mt-1">{fmtEur(loyerMensuelEstime)}/mois</div>
                <div className="text-xs text-emerald-600 mt-1">
                  {fmtEur(loyerPlafondM2)}/m²/mois (-{decotePct}% du marché) × {surface} m²
                </div>
              </div>
              <InputField label="Charges locatives mensuelles" value={chargesLocatives} onChange={setChargesLocatives} suffix="€/mois" min={0} />
              <InputField label="Vacance locative" value={vacanceSemaines} onChange={setVacanceSemaines} suffix="sem./an" min={0} max={52} />
            </div>

            <h3 className="text-sm font-medium text-gray-700 mt-6 mb-3">Charges propriétaire</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField label="Taxe foncière" value={taxeFonciere} onChange={setTaxeFonciere} suffix="€/an" min={0} />
              <InputField label="Charges copropriété" value={chargesCopro} onChange={setChargesCopro} suffix="€/an" min={0} />
              <InputField label="Assurance PNO" value={assurancePNO} onChange={setAssurancePNO} suffix="€/an" min={0} />
              <InputField label="Frais de gestion" value={fraisGestion} onChange={setFraisGestion} suffix="%" min={0} max={20} step={0.5} hint="% des loyers perçus" />
              <InputField label="Comptabilité" value={comptabilite} onChange={setComptabilite} suffix="€/an" min={0} />
            </div>

            <StepNav />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 4 : Financement
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Financement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Apport personnel"
                value={apport}
                onChange={setApport}
                suffix="€"
                min={0}
                hint={`Emprunt estimé : ${fmtEur(Math.max(0, coutTotal + fraisNotaire - apport))}`}
              />
              <InputField label="Taux crédit" value={tauxCredit} onChange={setTauxCredit} suffix="%" min={0} max={15} step={0.1} />
              <InputField label="Durée crédit" value={dureeCredit} onChange={setDureeCredit} suffix="ans" min={1} max={30} />
              <InputField label="Assurance crédit" value={assuranceCredit} onChange={setAssuranceCredit} suffix="%" min={0} max={2} step={0.05} />
            </div>

            {/* Aperçu financement */}
            {(() => {
              const montant = Math.max(0, coutTotal + fraisNotaire - apport)
              const tauxM = tauxCredit / 100 / 12
              const nbMois = dureeCredit * 12
              const mensualite = montant > 0 && tauxM > 0 ? montant * tauxM / (1 - Math.pow(1 + tauxM, -nbMois)) : montant / nbMois
              const assurance = montant * (assuranceCredit / 100) / 12
              return (
                <div className="mt-6 bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Montant emprunté</span>
                    <div className="text-lg font-semibold">{fmtEur(montant)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Mensualité crédit</span>
                    <div className="text-lg font-semibold">{fmtEur(mensualite)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Assurance/mois</span>
                    <div className="text-lg font-semibold">{fmtEur(assurance)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total mensuel</span>
                    <div className="text-lg font-semibold">{fmtEur(mensualite + assurance)}</div>
                  </div>
                </div>
              )
            })()}

            <StepNav />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 5 : Projection
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Hypothèses de projection</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Durée de détention"
                value={dureeDetention}
                onChange={setDureeDetention}
                suffix="ans"
                min={9}
                max={50}
                hint="Minimum 9 ans (engagement Jeanbrun)"
              />
              <InputField
                label="Revalorisation du bien"
                value={revalorisationBien}
                onChange={setRevalorisationBien}
                suffix="%/an"
                min={-10}
                max={20}
                step={0.5}
                hint={`Valeur revente estimée : ${fmtEur(prixAcquisition * Math.pow(1 + revalorisationBien / 100, dureeDetention))}`}
              />
              <InputField
                label="Revalorisation des loyers"
                value={revalorisationLoyer}
                onChange={setRevalorisationLoyer}
                suffix="%/an"
                min={-10}
                max={20}
                step={0.5}
              />
            </div>
            <StepNav />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
           ÉTAPE 6 : Résultats
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 6 && showResults && result && (
          <div className="space-y-6">
            {/* Alertes */}
            {result.alertes && result.alertes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Points d&apos;attention</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  {result.alertes.map((a: string, i: number) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {/* KPIs principaux */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Synthèse de l&apos;investissement Jeanbrun</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Investissement total', value: fmtEur(result.synthese?.investissementTotal), color: 'text-gray-900' },
                  { label: 'Emprunt', value: fmtEur(result.synthese?.montantEmprunt), color: 'text-gray-900' },
                  { label: 'Loyer mensuel plafonné', value: fmtEur(result.synthese?.loyerMensuelPlafonne), color: 'text-blue-700' },
                  { label: 'Mensualité crédit', value: fmtEur(result.synthese?.mensualiteCredit), color: 'text-gray-900' },
                  { label: 'Amortissement/an', value: fmtEur(result.synthese?.amortissementAnnuel), color: 'text-emerald-700' },
                  { label: `Amort. total (${JEANBRUN_DISPLAY.ENGAGEMENT_LOCATION} ans)`, value: fmtEur(result.synthese?.totalAmortissement9Ans), color: 'text-emerald-700' },
                  { label: 'Économie IR totale', value: fmtEur(result.synthese?.economieIRTotale), color: 'text-emerald-700' },
                  { label: 'Effort d\'épargne/mois', value: fmtEur(result.synthese?.effortEpargneMensuel), color: 'text-orange-600' },
                  { label: 'Rendement brut', value: fmtPct(result.synthese?.rendementBrutAnnuel), color: 'text-blue-700' },
                  { label: 'Rendement net', value: fmtPct(result.synthese?.rendementNetAnnuel), color: 'text-blue-700' },
                  { label: 'Valeur revente estimée', value: fmtEur(result.synthese?.valeurRevente), color: 'text-gray-900' },
                  { label: 'Cash-flow net cumulé', value: fmtSignedEur(result.synthese?.totalCashFlowNet), color: safeNumber(result.synthese?.totalCashFlowNet) >= 0 ? 'text-emerald-700' : 'text-red-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 block">{item.label}</span>
                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Détail amortissement Jeanbrun */}
            {result.amortissement && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Détail amortissement Jeanbrun</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Type</span><div className="font-medium">{result.amortissement.typeLogement === 'NEUF' ? 'Neuf (RE2020)' : 'Ancien (rénovation)'}</div></div>
                  <div><span className="text-gray-500">Catégorie</span><div className="font-medium">{CATEGORIE_LABELS[result.amortissement.categorieLoyer as CategorieLoyer] || result.amortissement.categorieLoyer}</div></div>
                  <div><span className="text-gray-500">Taux</span><div className="font-medium">{result.amortissement.tauxAmortissement}%</div></div>
                  <div><span className="text-gray-500">Plafond annuel</span><div className="font-medium">{fmtEur(result.amortissement.plafondAnnuel)}</div></div>
                  <div><span className="text-gray-500">Base amortissable</span><div className="font-medium">{fmtEur(result.amortissement.baseAmortissable)}</div></div>
                  <div><span className="text-gray-500">Amort. brut</span><div className="font-medium">{fmtEur(result.amortissement.amortissementBrut)}</div></div>
                  <div><span className="text-gray-500">Amort. effectif</span><div className="font-semibold text-emerald-700">{fmtEur(result.amortissement.amortissementEffectif)}/an</div></div>
                  <div><span className="text-gray-500">Part terrain exclue</span><div className="font-medium">{result.amortissement.partTerrain}%</div></div>
                </div>
              </div>
            )}

            {/* Comparaison avec/sans Jeanbrun */}
            {result.comparaison && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact fiscal année 1 — Avec vs sans Jeanbrun</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-800 mb-2">Sans Jeanbrun</div>
                    <div className="text-xs text-red-600">Revenu foncier net : {fmtEur(result.comparaison.sansJeanbrun.revenuFoncierAnnee1)}</div>
                    <div className="text-xl font-bold text-red-700 mt-1">Impôt : {fmtEur(result.comparaison.sansJeanbrun.impotAnnee1)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-emerald-800 mb-2">Avec Jeanbrun</div>
                    <div className="text-xs text-emerald-600">Revenu foncier net : {fmtEur(result.comparaison.avecJeanbrun.revenuFoncierAnnee1)}</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">Économie : {fmtEur(result.comparaison.avecJeanbrun.economieAnnee1)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-800 mb-2">Gain fiscal année 1</div>
                    <div className="text-xl font-bold text-blue-700 mt-2">{fmtSignedEur(result.comparaison.gainFiscalAnnee1)}</div>
                  </div>
                </div>
                <div ref={chartCompRef} className="mt-4" style={{ minHeight: 300 }} />
              </div>
            )}

            {/* Graphiques */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash-flow annuel</h3>
              {!plotlyReady && (
                <p className="text-sm text-amber-700 mb-3">Chargement du moteur graphique en cours...</p>
              )}
              <div ref={chartCashFlowRef} style={{ minHeight: 350 }} />
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Amortissement Jeanbrun & revenus fonciers</h3>
              {!plotlyReady && (
                <p className="text-sm text-amber-700 mb-3">Chargement du moteur graphique en cours...</p>
              )}
              <div ref={chartAmortRef} style={{ minHeight: 350 }} />
            </div>

            {/* Tableau détaillé */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Projection détaillée</h3>
                <button
                  onClick={() => setShowDetailedTable(!showDetailedTable)}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  {showDetailedTable ? 'Masquer le tableau' : 'Afficher le tableau'}
                </button>
              </div>

              {showDetailedTable && Array.isArray(result.projection) && result.projection.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-2 py-2 font-medium text-gray-600">Année</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Loyer effectif</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Charges</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Intérêts</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Amort.</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Rev. foncier net</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">Éco. IR</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">CF avant impôt</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">CF après impôt</th>
                        <th className="px-2 py-2 font-medium text-gray-600 text-right">CRD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.projection.map((p: any) => (
                        <tr key={p.annee} className="border-t hover:bg-gray-50">
                          <td className="px-2 py-1.5 font-medium">{p.annee}</td>
                          <td className="px-2 py-1.5 text-right">{fmtEur(p.loyerEffectif)}</td>
                          <td className="px-2 py-1.5 text-right text-red-600">{fmtEur(p.charges)}</td>
                          <td className="px-2 py-1.5 text-right text-red-600">{fmtEur(p.interetsEmprunt)}</td>
                          <td className="px-2 py-1.5 text-right text-purple-600">{fmtEur(p.amortissement)}</td>
                          <td className={`px-2 py-1.5 text-right font-medium ${p.revenuFoncierNet < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {fmtEur(p.revenuFoncierNet)}
                          </td>
                          <td className="px-2 py-1.5 text-right text-emerald-600">{fmtEur(p.economieIR)}</td>
                          <td className={`px-2 py-1.5 text-right ${p.cashFlowAvantImpot < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                            {fmtEur(p.cashFlowAvantImpot)}
                          </td>
                          <td className={`px-2 py-1.5 text-right font-medium ${p.cashFlowApresImpot < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {fmtEur(p.cashFlowApresImpot)}
                          </td>
                          <td className="px-2 py-1.5 text-right text-gray-500">{fmtEur(p.capitalRestantDu)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {showDetailedTable && (!Array.isArray(result.projection) || result.projection.length === 0) && (
                <p className="text-sm text-gray-600">Aucune projection disponible pour les paramètres saisis.</p>
              )}
            </div>

            {/* Éligibilité */}
            {result.eligibilite && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Conditions d&apos;éligibilité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={result.eligibilite.respecteTravauxAncien ? 'text-emerald-600' : 'text-red-500'}>
                      {result.eligibilite.respecteTravauxAncien ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <span>Type de bien : {result.eligibilite.typeBien}</span>
                  </div>
                  {typeLogement === 'ANCIEN' && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={result.eligibilite.respecteTravauxAncien ? 'text-emerald-600' : 'text-red-500'}>
                          {result.eligibilite.respecteTravauxAncien ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                        <span>Travaux ≥ 30% du prix ({fmtEur(result.eligibilite.montantTravaux)} / {fmtEur(result.eligibilite.seuilTravauxMin)} min.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={['A', 'B'].includes(result.eligibilite.dpeApres) ? 'text-emerald-600' : 'text-red-500'}>
                          {['A', 'B'].includes(result.eligibilite.dpeApres) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                        <span>DPE cible : {result.eligibilite.dpeApres} (requis : A ou B)</span>
                      </div>
                    </>
                  )}
                  {typeLogement === 'NEUF' && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600"><CheckCircle className="w-4 h-4" /></span>
                      <span>Conforme RE2020</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profil fiscal */}
            {result.profilFiscal && (
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profil fiscal</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Parts fiscales</span>
                    <div className="font-semibold">{result.profilFiscal.nombreParts}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">TMI</span>
                    <div className="font-semibold">{result.profilFiscal.tmi}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">IR avant investissement</span>
                    <div className="font-semibold">{fmtEur(result.profilFiscal.irAvant)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setShowResults(false) }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Nouvelle simulation
              </button>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50"
              >
                Modifier les paramètres
              </button>
            </div>
          </div>
        )}

        {/* Mentions légales */}
        <div className="mt-8 text-xs text-gray-400 border-t pt-4">
          <p>Simulation indicative basée sur le PLF 2026 (dispositif Jeanbrun). Les calculs ne constituent pas un conseil fiscal.</p>
          <p>PS sur revenus fonciers : 17,2% (LFSS 2026 — revenus fonciers exclus de la hausse CSG). PV immobilière : exonération IR 22 ans, PS 30 ans.</p>
        </div>
      </div>
    </SimulatorGate>
  )
}
