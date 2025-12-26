 
'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

// Barème IR 2025 (CGI art. 197)
const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 11 },
  { min: 29315, max: 83823, taux: 30 },
  { min: 83823, max: 180294, taux: 41 },
  { min: 180294, max: Infinity, taux: 45 },
]

const DECOTE_2025 = {
  SEUL: { seuil: 1929, plafond: 873, taux: 0.4525 },
  COUPLE: { seuil: 3191, plafond: 1444, taux: 0.4525 },
}

const PLAFOND_QF_2025 = { GENERAL: 1759, PARENT_ISOLE: 4149 }
const ABATTEMENT_10 = { MIN: 495, MAX: 14171 }

type Situation = 'CELIBATAIRE' | 'MARIE_PACSE' | 'DIVORCE' | 'VEUF'
const fmtEur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %'

export default function SimulateurIRPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // ÉTAPE 1 : SITUATION FAMILIALE
  const [situation, setSituation] = useState<Situation>('MARIE_PACSE')
  const [enfantsCharge, setEnfantsCharge] = useState(2)
  const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
  const [parentIsole, setParentIsole] = useState(false)
  const [invalidite, setInvalidite] = useState(false)
  const [invaliditeConjoint, setInvaliditeConjoint] = useState(false)
  const [ancienCombattant, setAncienCombattant] = useState(false)

  // ÉTAPE 2 : REVENUS D'ACTIVITÉ
  const [salaires1, setSalaires1] = useState(45000)
  const [fraisReels1, setFraisReels1] = useState(0)
  const [optionFrais1, setOptionFrais1] = useState(false)
  const [salaires2, setSalaires2] = useState(35000)
  const [fraisReels2, setFraisReels2] = useState(0)
  const [optionFrais2, setOptionFrais2] = useState(false)
  const [pensions, setPensions] = useState(0)
  const [revenusTNS, setRevenusTNS] = useState(0)

  // ÉTAPE 3 : REVENUS DU PATRIMOINE
  const [fonciersBruts, setFonciersBruts] = useState(0)
  const [chargesFoncieres, setChargesFoncieres] = useState(0)
  const [regimeFoncier, setRegimeFoncier] = useState<'MICRO' | 'REEL'>('MICRO')
  const [dividendes, setDividendes] = useState(0)
  const [interets, setInterets] = useState(0)
  const [pvMobilieres, setPvMobilieres] = useState(0)
  const [optionPFU, setOptionPFU] = useState(true)

  // ÉTAPE 4 : CHARGES DÉDUCTIBLES
  const [pensionEnfant, setPensionEnfant] = useState(0)
  const [pensionExConjoint, setPensionExConjoint] = useState(0)
  const [versementsPER, setVersementsPER] = useState(0)
  const [versementsPER2, setVersementsPER2] = useState(0)
  const [csgDeductible, setCsgDeductible] = useState(0)

  // ÉTAPE 5 : RÉDUCTIONS D'IMPÔT
  const [donsInteret, setDonsInteret] = useState(0)
  const [donsAide, setDonsAide] = useState(0)
  const [emploiDomicile, setEmploiDomicile] = useState(0)
  const [fraisGarde, setFraisGarde] = useState(0)
  const [nbEnfantsGarde, setNbEnfantsGarde] = useState(0)
  const [reductionPinel, setReductionPinel] = useState(0)
  const [investPME, setInvestPME] = useState(0)

  const [resultat, setResultat] = useState<any>(null)

  const isCouple = situation === 'MARIE_PACSE'

  // Calcul nombre de parts
  const nombreParts = (() => {
    let parts = situation === 'CELIBATAIRE' || situation === 'DIVORCE' ? 1 : 2
    if (situation === 'VEUF' && enfantsCharge > 0) parts = 2
    if (enfantsCharge >= 1) parts += 0.5
    if (enfantsCharge >= 2) parts += 0.5
    if (enfantsCharge >= 3) parts += (enfantsCharge - 2)
    if (enfantsGardeAlternee >= 1) parts += 0.25
    if (enfantsGardeAlternee >= 2) parts += 0.25
    if (enfantsGardeAlternee >= 3) parts += (enfantsGardeAlternee - 2) * 0.5
    if (parentIsole && (enfantsCharge > 0 || enfantsGardeAlternee > 0)) parts += 0.5
    if (invalidite) parts += 0.5
    if (invaliditeConjoint) parts += 0.5
    if (ancienCombattant) parts += 0.5
    return parts
  })()

  // Calcul aperçu temps réel
  const apercu = (() => {
    // Salaires après abattement 10%
    let net1 = salaires1
    if (!optionFrais1) {
      const abatt = Math.min(Math.max(salaires1 * 0.1, ABATTEMENT_10.MIN), ABATTEMENT_10.MAX)
      net1 = salaires1 - abatt
    } else {
      net1 = salaires1 - fraisReels1
    }
    let net2 = 0
    if (isCouple) {
      net2 = salaires2
      if (!optionFrais2) {
        const abatt = Math.min(Math.max(salaires2 * 0.1, ABATTEMENT_10.MIN), ABATTEMENT_10.MAX)
        net2 = salaires2 - abatt
      } else {
        net2 = salaires2 - fraisReels2
      }
    }
    const pensionsNet = pensions * 0.9
    const fonciersNet = regimeFoncier === 'MICRO' ? fonciersBruts * 0.7 : Math.max(0, fonciersBruts - chargesFoncieres)

    const revenuBrut = Math.max(0, net1 + net2 + pensionsNet + revenusTNS + fonciersNet)
    const charges = pensionEnfant + pensionExConjoint + versementsPER + (isCouple ? versementsPER2 : 0) + csgDeductible
    const revenuNet = Math.max(0, revenuBrut - charges)
    const quotient = revenuNet / nombreParts

    // IR par tranches
    let irPart = 0, tmi = 0
    for (const t of BAREME_IR_2025) {
      if (quotient > t.min) {
        const base = Math.min(quotient, t.max) - t.min
        irPart += base * (t.taux / 100)
        if (t.taux > tmi) tmi = t.taux
      }
    }
    const irBrut = irPart * nombreParts

    // Plafonnement QF
    const partsBase = isCouple ? 2 : 1
    const demiPartsSupp = Math.max(0, (nombreParts - partsBase) * 2)
    const quotientBase = revenuNet / partsBase
    let irSansQF = 0
    for (const t of BAREME_IR_2025) {
      if (quotientBase > t.min) {
        const base = Math.min(quotientBase, t.max) - t.min
        irSansQF += base * (t.taux / 100)
      }
    }
    irSansQF *= partsBase
    const avantageQF = irSansQF - irBrut
    let plafond = demiPartsSupp * PLAFOND_QF_2025.GENERAL
    if (parentIsole && demiPartsSupp > 0) plafond = PLAFOND_QF_2025.PARENT_ISOLE + Math.max(0, demiPartsSupp - 1) * PLAFOND_QF_2025.GENERAL
    const plafonnement = Math.max(0, avantageQF - plafond)
    const irApresPlaf = irBrut + plafonnement

    // Décote
    let decote = 0
    const dp = isCouple ? DECOTE_2025.COUPLE : DECOTE_2025.SEUL
    if (irApresPlaf > 0 && irApresPlaf < dp.seuil) decote = Math.max(0, dp.plafond - irApresPlaf * dp.taux)
    const irApresDecote = Math.max(0, irApresPlaf - decote)

    // Réductions
    const redDons = Math.min(donsAide, 1000) * 0.75 + donsInteret * 0.66
    const redEmploi = Math.min(emploiDomicile * 0.5, 12000 + enfantsCharge * 1500)
    const redGarde = Math.min(fraisGarde, nbEnfantsGarde * 3500) * 0.5
    const redInvest = reductionPinel + investPME * 0.18
    const totalRed = redDons + redEmploi + redGarde + redInvest
    const irNet = Math.max(0, irApresDecote - totalRed)

    // PFU
    const pfuMontant = optionPFU ? (dividendes + interets + pvMobilieres) * 0.30 : 0

    return { revenuBrut, charges, revenuNet, quotient, nombreParts, irBrut: Math.round(irBrut), plafonnement: Math.round(plafonnement), decote: Math.round(decote), totalRed: Math.round(totalRed), irNet: Math.round(irNet), pfuMontant: Math.round(pfuMontant), impotTotal: Math.round(irNet + pfuMontant), tmi, tauxMoyen: revenuNet > 0 ? (irNet / revenuNet) * 100 : 0 }
  })()

  // Appel API
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/advisor/calculators/tax/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome: apercu.revenuBrut,
          deductions: apercu.charges,
          familyQuotient: nombreParts,
          year: 2025,
          options: { isCouple, applyDecote: true, applyCEHR: true }
        }),
      })
      const data = await response.json()
      setResultat({ ...apercu, apiResult: data.data })
      setShowResults(true)
    } catch (e) {
      setResultat(apercu)
      setShowResults(true)
    } finally {
      setLoading(false)
    }
  }, [apercu, nombreParts, isCouple])

  const InputField = ({ label, value, onChange, suffix = '€', hint = '', color = 'blue' }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${color}-500 focus:border-${color}-500 text-lg font-medium`} />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</span>
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )

  return (
    <SimulatorGate simulator="IMPOT_REVENU">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/simulateurs" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Simulateur Impôt sur le Revenu 2025</h1>
                  <p className="text-sm text-gray-500">Calcul conforme au barème CGI art. 197</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Barème 2025</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Steps */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  {[{ n: 1, l: 'Situation', i: '👨‍👩‍👧‍👦' }, { n: 2, l: 'Revenus', i: '💰' }, { n: 3, l: 'Patrimoine', i: '🏠' }, { n: 4, l: 'Charges', i: '📋' }, { n: 5, l: 'Réductions', i: '🎁' }].map((s, idx) => (
                    <div key={s.n} className="flex items-center">
                      <button onClick={() => setStep(s.n)} className={`flex flex-col items-center ${step === s.n ? 'scale-105' : step > s.n ? 'opacity-70' : 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-2 ${step === s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : step > s.n ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{step > s.n ? '✓' : s.i}</div>
                        <span className={`text-xs font-medium ${step === s.n ? 'text-blue-600' : 'text-gray-500'}`}>{s.l}</span>
                      </button>
                      {idx < 4 && <div className={`w-12 h-0.5 mx-2 ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenu étapes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* ÉTAPE 1 */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b"><span className="text-3xl">👨‍👩‍👧‍👦</span><div><h2 className="text-xl font-bold text-gray-900">Situation familiale</h2><p className="text-sm text-gray-500">Au 1er janvier 2025</p></div></div>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: 'CELIBATAIRE', l: 'Célibataire', i: '👤' }, { v: 'MARIE_PACSE', l: 'Marié(e)/Pacsé(e)', i: '💑' }, { v: 'DIVORCE', l: 'Divorcé(e)', i: '💔' }, { v: 'VEUF', l: 'Veuf/Veuve', i: '🖤' }].map(o => (
                        <button key={o.v} onClick={() => setSituation(o.v as Situation)} className={`p-4 rounded-xl border-2 text-left ${situation === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-2xl">{o.i}</span><div className="mt-2 font-medium text-gray-900">{o.l}</div>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div><label className="block text-sm font-semibold text-gray-700 mb-2">Enfants à charge</label><div className="flex items-center gap-3"><button onClick={() => setEnfantsCharge(Math.max(0, enfantsCharge - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">−</button><span className="w-12 text-center text-2xl font-bold text-gray-900">{enfantsCharge}</span><button onClick={() => setEnfantsCharge(enfantsCharge + 1)} className="w-10 h-10 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-600">+</button></div></div>
                      <div><label className="block text-sm font-semibold text-gray-700 mb-2">Garde alternée</label><div className="flex items-center gap-3"><button onClick={() => setEnfantsGardeAlternee(Math.max(0, enfantsGardeAlternee - 1))} className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">−</button><span className="w-12 text-center text-2xl font-bold text-gray-900">{enfantsGardeAlternee}</span><button onClick={() => setEnfantsGardeAlternee(enfantsGardeAlternee + 1)} className="w-10 h-10 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-600">+</button></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                      {[{ v: parentIsole, s: setParentIsole, l: 'Parent isolé (T)', d: '+0.5 part' }, { v: invalidite, s: setInvalidite, l: 'Invalidité ≥80% (P)', d: '+0.5 part' }, ...(isCouple ? [{ v: invaliditeConjoint, s: setInvaliditeConjoint, l: 'Conjoint invalide (F)', d: '+0.5 part' }] : []), { v: ancienCombattant, s: setAncienCombattant, l: 'Ancien combattant (W)', d: '+0.5 part' }].map((c, i) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${c.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <input type="checkbox" checked={c.v} onChange={(e) => c.s(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                          <div><div className="font-medium text-gray-900 text-sm">{c.l}</div><div className="text-xs text-gray-500">{c.d}</div></div>
                        </label>
                      ))}
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"><div className="flex items-center justify-between"><div><div className="text-sm text-gray-600">Nombre de parts</div><div className="text-3xl font-bold text-blue-600">{nombreParts}</div></div><div className="text-5xl">🧮</div></div></div>
                  </div>
                )}

                {/* ÉTAPE 2 */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b"><span className="text-3xl">💰</span><div><h2 className="text-xl font-bold text-gray-900">Revenus d'activité</h2><p className="text-sm text-gray-500">Salaires, pensions, BIC/BNC</p></div></div>
                    <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                      <div className="flex items-center justify-between"><h3 className="font-semibold">Déclarant 1</h3><span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Case 1AJ</span></div>
                      <InputField label="Salaires nets imposables" value={salaires1} onChange={setSalaires1} />
                      <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={optionFrais1} onChange={(e) => setOptionFrais1(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600" /><span className="text-sm">Opter pour frais réels</span></label>
                      {optionFrais1 && <InputField label="Frais réels" value={fraisReels1} onChange={setFraisReels1} />}
                    </div>
                    {isCouple && (
                      <div className="p-4 bg-purple-50 rounded-xl space-y-4">
                        <div className="flex items-center justify-between"><h3 className="font-semibold">Déclarant 2</h3><span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Case 1BJ</span></div>
                        <InputField label="Salaires nets imposables" value={salaires2} onChange={setSalaires2} color="purple" />
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={optionFrais2} onChange={(e) => setOptionFrais2(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-purple-600" /><span className="text-sm">Opter pour frais réels</span></label>
                        {optionFrais2 && <InputField label="Frais réels" value={fraisReels2} onChange={setFraisReels2} color="purple" />}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Pensions retraite" value={pensions} onChange={setPensions} hint="Abatt. 10% auto" />
                      <InputField label="Revenus TNS (BIC/BNC)" value={revenusTNS} onChange={setRevenusTNS} hint="Bénéfice net" />
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b"><span className="text-3xl">🏠</span><div><h2 className="text-xl font-bold text-gray-900">Revenus du patrimoine</h2><p className="text-sm text-gray-500">Fonciers, capitaux, plus-values</p></div></div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-4">
                      <div className="flex items-center justify-between"><h3 className="font-semibold text-amber-900">🏘️ Revenus fonciers</h3><select value={regimeFoncier} onChange={(e) => setRegimeFoncier(e.target.value as any)} className="px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white"><option value="MICRO">Micro-foncier (−30%)</option><option value="REEL">Régime réel</option></select></div>
                      <div className="grid grid-cols-2 gap-4"><InputField label="Loyers bruts" value={fonciersBruts} onChange={setFonciersBruts} color="amber" />{regimeFoncier === 'REEL' && <InputField label="Charges déductibles" value={chargesFoncieres} onChange={setChargesFoncieres} color="amber" />}</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
                      <div className="flex items-center justify-between"><h3 className="font-semibold text-emerald-900">💹 Capitaux mobiliers</h3><label className="flex items-center gap-2"><input type="checkbox" checked={optionPFU} onChange={(e) => setOptionPFU(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600" /><span className="text-sm">PFU 30%</span></label></div>
                      <div className="grid grid-cols-3 gap-4"><InputField label="Dividendes" value={dividendes} onChange={setDividendes} color="emerald" /><InputField label="Intérêts" value={interets} onChange={setInterets} color="emerald" /><InputField label="PV mobilières" value={pvMobilieres} onChange={setPvMobilieres} color="emerald" /></div>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 4 */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b"><span className="text-3xl">📋</span><div><h2 className="text-xl font-bold text-gray-900">Charges déductibles</h2><p className="text-sm text-gray-500">Pensions alimentaires, PER</p></div></div>
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-4">
                      <h3 className="font-semibold text-rose-900">👶 Pensions alimentaires</h3>
                      <div className="grid grid-cols-2 gap-4"><InputField label="Enfants majeurs" value={pensionEnfant} onChange={setPensionEnfant} hint="Max 6 674€/enfant" color="rose" /><InputField label="Ex-conjoint" value={pensionExConjoint} onChange={setPensionExConjoint} color="rose" /></div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                      <h3 className="font-semibold text-indigo-900">🏦 Épargne retraite (PER)</h3>
                      <div className="grid grid-cols-2 gap-4"><InputField label="Versements PER - Déclarant 1" value={versementsPER} onChange={setVersementsPER} color="indigo" />{isCouple && <InputField label="Versements PER - Déclarant 2" value={versementsPER2} onChange={setVersementsPER2} color="indigo" />}</div>
                    </div>
                    <InputField label="CSG déductible" value={csgDeductible} onChange={setCsgDeductible} hint="Revenus du patrimoine N-1" />
                  </div>
                )}

                {/* ÉTAPE 5 */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b"><span className="text-3xl">🎁</span><div><h2 className="text-xl font-bold text-gray-900">Réductions d'impôt</h2><p className="text-sm text-gray-500">Dons, emploi domicile, investissements</p></div></div>
                    <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 space-y-4">
                      <h3 className="font-semibold text-pink-900">❤️ Dons</h3>
                      <div className="grid grid-cols-2 gap-4"><InputField label="Organismes intérêt général" value={donsInteret} onChange={setDonsInteret} hint="Réduction 66%" color="pink" /><InputField label="Aide aux personnes" value={donsAide} onChange={setDonsAide} hint="Réduction 75% (max 1000€)" color="pink" /></div>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100 space-y-4">
                      <h3 className="font-semibold text-cyan-900">🏠 Services à domicile</h3>
                      <InputField label="Dépenses emploi domicile" value={emploiDomicile} onChange={setEmploiDomicile} hint="Crédit 50% (max 12000€)" color="cyan" />
                      <div className="grid grid-cols-2 gap-4"><InputField label="Frais de garde (−6 ans)" value={fraisGarde} onChange={setFraisGarde} hint="Crédit 50% (max 3500€/enfant)" color="cyan" /><div><label className="block text-sm font-medium text-gray-700 mb-1">Nb enfants gardés</label><input type="number" value={nbEnfantsGarde} onChange={(e) => setNbEnfantsGarde(Number(e.target.value) || 0)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" /></div></div>
                    </div>
                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 space-y-4">
                      <h3 className="font-semibold text-violet-900">📈 Investissements</h3>
                      <div className="grid grid-cols-2 gap-4"><InputField label="Réduction Pinel/Denormandie" value={reductionPinel} onChange={setReductionPinel} color="violet" /><InputField label="Investissement PME" value={investPME} onChange={setInvestPME} hint="Réduction 18%" color="violet" /></div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 mt-6 border-t">
                  <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">← Précédent</button>
                  {step < 5 ? (
                    <button onClick={() => setStep(step + 1)} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">Suivant →</button>
                  ) : (
                    <button onClick={lancerSimulation} disabled={loading} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg disabled:opacity-50">{loading ? 'Calcul...' : '🧮 Calculer mon impôt'}</button>
                  )}
                </div>
              </div>
            </div>

            {/* Panneau latéral - Résumé temps réel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><span className="text-xl">📊</span> Aperçu en temps réel</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xs text-gray-500">Revenu brut global</div><div className="text-lg font-bold text-gray-900">{fmtEur(apercu.revenuBrut)}</div></div>
                  <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xs text-gray-500">Charges déductibles</div><div className="text-lg font-bold text-green-600">− {fmtEur(apercu.charges)}</div></div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="text-xs text-blue-600">Revenu net imposable</div><div className="text-xl font-bold text-blue-700">{fmtEur(apercu.revenuNet)}</div></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xs text-gray-500">Parts</div><div className="text-lg font-bold text-gray-900">{nombreParts}</div></div>
                    <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xs text-gray-500">TMI</div><div className="text-lg font-bold text-gray-900">{apercu.tmi}%</div></div>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">IR brut</span><span className="font-medium">{fmtEur(apercu.irBrut)}</span></div>
                    {apercu.plafonnement > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Plafonnement QF</span><span className="font-medium text-orange-600">+ {fmtEur(apercu.plafonnement)}</span></div>}
                    {apercu.decote > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Décote</span><span className="font-medium text-green-600">− {fmtEur(apercu.decote)}</span></div>}
                    {apercu.totalRed > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Réductions</span><span className="font-medium text-green-600">− {fmtEur(apercu.totalRed)}</span></div>}
                    <div className="flex justify-between text-sm"><span className="text-gray-600">IR net</span><span className="font-bold text-red-600">{fmtEur(apercu.irNet)}</span></div>
                    {apercu.pfuMontant > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">PFU (flat tax)</span><span className="font-medium text-red-500">{fmtEur(apercu.pfuMontant)}</span></div>}
                  </div>
                  <div className="p-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl text-white">
                    <div className="text-sm opacity-90">Impôt total estimé</div>
                    <div className="text-3xl font-bold">{fmtEur(apercu.impotTotal)}</div>
                    <div className="text-sm opacity-90 mt-1">Taux moyen : {fmtPct(apercu.tauxMoyen)}</div>
                  </div>
                </div>
              </div>

              {/* Barème IR */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">📊 Barème IR 2025</h3>
                <div className="space-y-2 text-sm">
                  {BAREME_IR_2025.map((t, i) => (
                    <div key={i} className={`flex justify-between p-2 rounded-lg ${apercu.quotient > t.min && (t.max === Infinity || apercu.quotient <= t.max) ? 'bg-blue-100 font-medium' : 'bg-gray-50'}`}>
                      <span>{t.max === Infinity ? `> ${t.min.toLocaleString('fr-FR')}` : `${t.min.toLocaleString('fr-FR')} - ${t.max.toLocaleString('fr-FR')}`} €</span>
                      <span className="font-bold text-blue-600">{t.taux}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimulatorGate>
  )
}
