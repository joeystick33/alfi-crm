'use client'
 

import { useState, useCallback } from 'react'
import Link from 'next/link'

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE - Barème IR 2025 (CGI art. 197)
// ══════════════════════════════════════════════════════════════════════════════
const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 11 },
  { min: 29315, max: 83823, taux: 30 },
  { min: 83823, max: 180294, taux: 41 },
  { min: 180294, max: Infinity, taux: 45 },
]

type Situation = 'CELIBATAIRE' | 'MARIE_PACSE' | 'DIVORCE' | 'VEUF'
const fmtEur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'

export default function ImpotRevenuPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDetailCalcul, setShowDetailCalcul] = useState(false)

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
  const [pvImmobilieres, setPvImmobilieres] = useState(0)
  const [optionPFU, setOptionPFU] = useState(true)

  // ÉTAPE 4 : CHARGES DÉDUCTIBLES
  const [pensionEnfant, setPensionEnfant] = useState(0)
  const [pensionExConjoint, setPensionExConjoint] = useState(0)
  const [pensionAscendant, setPensionAscendant] = useState(0)
  const [versementsPER, setVersementsPER] = useState(0)
  const [versementsPER2, setVersementsPER2] = useState(0)
  const [csgDeductible, setCsgDeductible] = useState(0)

  // ÉTAPE 5 : RÉDUCTIONS ET CRÉDITS D'IMPÔT
  // Dons
  const [donsInteret, setDonsInteret] = useState(0)
  const [donsAide, setDonsAide] = useState(0)
  // Services à domicile (crédit d'impôt)
  const [emploiDomicile, setEmploiDomicile] = useState(0)
  const [fraisGarde, setFraisGarde] = useState(0)
  const [nbEnfantsGarde, setNbEnfantsGarde] = useState(0)
  // Investissements locatifs
  const [reductionPinel, setReductionPinel] = useState(0)
  const [reductionDenormandie, setReductionDenormandie] = useState(0)
  // Investissements entreprises
  const [investPME, setInvestPME] = useState(0)
  const [investFIP, setInvestFIP] = useState(0)
  const [investFCPI, setInvestFCPI] = useState(0)
  const [investSOFICA, setInvestSOFICA] = useState(0)
  // Frais de scolarité
  const [nbEnfantsCollege, setNbEnfantsCollege] = useState(0)
  const [nbEnfantsLycee, setNbEnfantsLycee] = useState(0)
  const [nbEnfantsSuperieur, setNbEnfantsSuperieur] = useState(0)
  // Cotisations syndicales
  const [cotisationsSyndicales, setCotisationsSyndicales] = useState(0)
  
  // Constantes des plafonds (à mettre à jour chaque année)
  const PLAFOND_NICHES = 10000    // Plafond général
  const PLAFOND_NICHES_MAJORE = 18000  // Avec SOFICA/Outre-mer

  const [resultat, setResultat] = useState<any>(null)

  const isCouple = situation === 'MARIE_PACSE'

  // Calcul nombre de parts (pour aperçu)
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

  // Appel API backend
  const lancerSimulation = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/advisor/simulators/ir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          situationFamiliale: situation,
          enfantsCharge,
          enfantsGardeAlternee,
          parentIsole,
          invalidite,
          invaliditeConjoint,
          ancienCombattant,
          salaires1,
          fraisReels1,
          optionFraisReels1: optionFrais1,
          salaires2,
          fraisReels2,
          optionFraisReels2: optionFrais2,
          pensions,
          revenusTNS,
          fonciersBruts,
          chargesFoncieres,
          regimeFoncier,
          dividendes,
          interets,
          pvMobilieres,
          pvImmobilieres,
          optionPFU,
          pensionEnfant,
          pensionExConjoint,
          pensionAscendant,
          versementsPER,
          versementsPER2,
          csgDeductible,
          donsInteret,
          donsAide,
          emploiDomicile,
          fraisGarde,
          nbEnfantsGarde,
          reductionPinel,
          reductionDenormandie,
          investPME,
          investFIP,
          investFCPI,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur lors du calcul')

      setResultat(data.data)
      setShowResults(true)
    } catch (error: any) {
      console.error('Erreur simulation IR:', error)
      alert('Erreur lors du calcul : ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [situation, enfantsCharge, enfantsGardeAlternee, parentIsole, invalidite, invaliditeConjoint, ancienCombattant, salaires1, fraisReels1, optionFrais1, salaires2, fraisReels2, optionFrais2, pensions, revenusTNS, fonciersBruts, chargesFoncieres, regimeFoncier, dividendes, interets, pvMobilieres, pvImmobilieres, optionPFU, pensionEnfant, pensionExConjoint, pensionAscendant, versementsPER, versementsPER2, csgDeductible, donsInteret, donsAide, emploiDomicile, fraisGarde, nbEnfantsGarde, reductionPinel, reductionDenormandie, investPME, investFIP, investFCPI])

  const InputField = ({ label, value, onChange, suffix = '€', hint = '', className = '' }: any) => (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</span>
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/calculateurs" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">📊</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Simulateur Impôt sur le Revenu 2025</h1>
                  <p className="text-sm text-gray-500">Calcul conforme au barème CGI art. 197</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Barème 2025</span>
              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">CGI art. 197</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Steps */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  {[{ n: 1, l: 'Situation', i: '👨‍👩‍👧‍👦' }, { n: 2, l: 'Revenus', i: '💰' }, { n: 3, l: 'Patrimoine', i: '🏠' }, { n: 4, l: 'Charges', i: '📋' }, { n: 5, l: 'Réductions', i: '🎁' }].map((s, idx) => (
                    <div key={s.n} className="flex items-center">
                      <button onClick={() => setStep(s.n)} className={`flex flex-col items-center transition-all ${step === s.n ? 'scale-105' : step > s.n ? 'opacity-70' : 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-2 transition-all ${step === s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : step > s.n ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{step > s.n ? '✓' : s.i}</div>
                        <span className={`text-xs font-medium ${step === s.n ? 'text-blue-600' : 'text-gray-500'}`}>{s.l}</span>
                      </button>
                      {idx < 4 && <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenu étapes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* ÉTAPE 1 : SITUATION */}
                {step === 1 && (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><span className="text-3xl">👨‍👩‍👧‍👦</span><div><h2 className="text-xl font-bold text-gray-900">Situation familiale</h2><p className="text-sm text-gray-500">Votre situation au 1er janvier 2025</p></div></div>
                    
                    {/* Situation */}
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: 'CELIBATAIRE', l: 'Célibataire', i: '👤', d: '1 part' }, { v: 'MARIE_PACSE', l: 'Marié(e) / Pacsé(e)', i: '💑', d: '2 parts' }, { v: 'DIVORCE', l: 'Divorcé(e) / Séparé(e)', i: '💔', d: '1 part' }, { v: 'VEUF', l: 'Veuf / Veuve', i: '🖤', d: '1 ou 2 parts' }].map(o => (
                        <button key={o.v} onClick={() => setSituation(o.v as Situation)} className={`p-4 rounded-xl border-2 text-left transition-all ${situation === o.v ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                          <span className="text-2xl">{o.i}</span>
                          <div className="mt-2 font-semibold text-gray-900">{o.l}</div>
                          <div className="text-xs text-gray-500">{o.d}</div>
                        </button>
                      ))}
                    </div>

                    {/* Enfants */}
                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Enfants à charge</label>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEnfantsCharge(Math.max(0, enfantsCharge - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors">−</button>
                          <span className="w-16 text-center text-3xl font-bold text-gray-900">{enfantsCharge}</span>
                          <button onClick={() => setEnfantsCharge(enfantsCharge + 1)} className="w-12 h-12 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-600 transition-colors">+</button>
                        </div>
                        <p className="text-xs text-gray-500">Mineurs ou majeurs rattachés</p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">En garde alternée</label>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEnfantsGardeAlternee(Math.max(0, enfantsGardeAlternee - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors">−</button>
                          <span className="w-16 text-center text-3xl font-bold text-gray-900">{enfantsGardeAlternee}</span>
                          <button onClick={() => setEnfantsGardeAlternee(enfantsGardeAlternee + 1)} className="w-12 h-12 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-600 transition-colors">+</button>
                        </div>
                        <p className="text-xs text-gray-500">0.25 part par enfant</p>
                      </div>
                    </div>

                    {/* Cases spéciales */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Cases spéciales (demi-parts supplémentaires)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { v: parentIsole, s: setParentIsole, l: 'Parent isolé (case T)', d: '+0.5 part', show: true },
                          { v: invalidite, s: setInvalidite, l: 'Invalidité ≥80% (case P)', d: '+0.5 part', show: true },
                          { v: invaliditeConjoint, s: setInvaliditeConjoint, l: 'Conjoint invalide (case F)', d: '+0.5 part', show: isCouple },
                          { v: ancienCombattant, s: setAncienCombattant, l: 'Ancien combattant >74 ans (W)', d: '+0.5 part', show: true },
                        ].filter(c => c.show).map((c, i) => (
                          <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${c.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox" checked={c.v} onChange={(e) => c.s(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <div><div className="font-medium text-gray-900">{c.l}</div><div className="text-xs text-gray-500">{c.d}</div></div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 2 : REVENUS */}
                {step === 2 && (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><span className="text-3xl">💰</span><div><h2 className="text-xl font-bold text-gray-900">Revenus d'activité</h2><p className="text-sm text-gray-500">Salaires, pensions, revenus professionnels</p></div></div>
                    
                    {/* Déclarant 1 */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2">👤 Déclarant 1</h3><span className="text-xs px-2.5 py-1 bg-blue-200 text-blue-800 rounded-full font-semibold">Case 1AJ</span></div>
                      <InputField label="Salaires nets imposables" value={salaires1} onChange={setSalaires1} />
                      <label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" checked={optionFrais1} onChange={(e) => setOptionFrais1(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-700">Opter pour les frais réels (sinon abattement 10%)</span></label>
                      {optionFrais1 && <div className="mt-3"><InputField label="Frais réels justifiés" value={fraisReels1} onChange={setFraisReels1} hint="Trajets, repas, etc." /></div>}
                    </div>

                    {/* Déclarant 2 */}
                    {isCouple && (
                      <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2">👤 Déclarant 2</h3><span className="text-xs px-2.5 py-1 bg-purple-200 text-purple-800 rounded-full font-semibold">Case 1BJ</span></div>
                        <InputField label="Salaires nets imposables" value={salaires2} onChange={setSalaires2} />
                        <label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" checked={optionFrais2} onChange={(e) => setOptionFrais2(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-purple-600" /><span className="text-sm text-gray-700">Opter pour les frais réels</span></label>
                        {optionFrais2 && <div className="mt-3"><InputField label="Frais réels justifiés" value={fraisReels2} onChange={setFraisReels2} /></div>}
                      </div>
                    )}

                    {/* Autres revenus */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Pensions de retraite" value={pensions} onChange={setPensions} hint="Abattement 10% automatique" />
                      <InputField label="Revenus TNS (BIC/BNC/BA)" value={revenusTNS} onChange={setRevenusTNS} hint="Bénéfice net" />
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 : PATRIMOINE */}
                {step === 3 && (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><span className="text-3xl">🏠</span><div><h2 className="text-xl font-bold text-gray-900">Revenus du patrimoine</h2><p className="text-sm text-gray-500">Fonciers, capitaux mobiliers, plus-values</p></div></div>
                    
                    {/* Revenus fonciers */}
                    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2">🏘️ Revenus fonciers</h3>
                        <select value={regimeFoncier} onChange={(e) => setRegimeFoncier(e.target.value as any)} className="px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white font-medium">
                          <option value="MICRO">Micro-foncier (abatt. 30%)</option>
                          <option value="REEL">Régime réel</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Loyers bruts encaissés" value={fonciersBruts} onChange={setFonciersBruts} />
                        {regimeFoncier === 'REEL' && <InputField label="Charges déductibles" value={chargesFoncieres} onChange={setChargesFoncieres} hint="Intérêts, travaux, etc." />}
                      </div>
                      {regimeFoncier === 'MICRO' && fonciersBruts > 15000 && <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg text-sm text-red-700 font-medium">⚠️ Le micro-foncier est limité à 15 000 € de recettes. Passez au régime réel.</div>}
                    </div>

                    {/* Revenus des capitaux */}
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-emerald-900 flex items-center gap-2">💹 Revenus des capitaux mobiliers</h3>
                        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-300 rounded-lg">
                          <input type="checkbox" checked={optionPFU} onChange={(e) => setOptionPFU(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-sm font-medium">PFU 30%</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label="Dividendes" value={dividendes} onChange={setDividendes} />
                        <InputField label="Intérêts" value={interets} onChange={setInterets} />
                        <InputField label="PV mobilières" value={pvMobilieres} onChange={setPvMobilieres} />
                      </div>
                    </div>

                    {/* Plus-values immobilières */}
                    <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                      <h3 className="font-bold text-violet-900 flex items-center gap-2 mb-4">📈 Plus-values immobilières</h3>
                      <InputField label="Plus-value nette après abattements" value={pvImmobilieres} onChange={setPvImmobilieres} hint="IR 19% + PS 17.2%" />
                    </div>
                  </div>
                )}

                {/* ÉTAPE 4 : CHARGES */}
                {step === 4 && (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100"><span className="text-3xl">📋</span><div><h2 className="text-xl font-bold text-gray-900">Charges déductibles</h2><p className="text-sm text-gray-500">Pensions alimentaires, épargne retraite</p></div></div>
                    
                    {/* Pensions alimentaires */}
                    <div className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                      <h3 className="font-bold text-rose-900 flex items-center gap-2 mb-4">👶 Pensions alimentaires versées</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField label="Enfants majeurs non rattachés" value={pensionEnfant} onChange={setPensionEnfant} hint="Max 6 674 € / enfant" />
                        <InputField label="Ex-conjoint" value={pensionExConjoint} onChange={setPensionExConjoint} hint="Décision de justice" />
                        <InputField label="Ascendants" value={pensionAscendant} onChange={setPensionAscendant} hint="Parents dans le besoin" />
                      </div>
                    </div>

                    {/* Épargne retraite */}
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">🏦 Épargne retraite (PER)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Versements PER - Déclarant 1" value={versementsPER} onChange={setVersementsPER} hint="Plafond : 10% revenus (max 35 194€)" />
                        {isCouple && <InputField label="Versements PER - Déclarant 2" value={versementsPER2} onChange={setVersementsPER2} />}
                      </div>
                    </div>

                    {/* CSG déductible */}
                    <InputField label="CSG déductible" value={csgDeductible} onChange={setCsgDeductible} hint="Sur revenus du patrimoine N-1 (6.8%)" className="max-w-md" />
                  </div>
                )}

                {/* ÉTAPE 5 : RÉDUCTIONS ET CRÉDITS D'IMPÔT */}
                {step === 5 && (
                  <div className="p-6 space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <span className="text-3xl">🎁</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Réductions et crédits d'impôt</h2>
                        <p className="text-sm text-gray-500">Plafond global des niches fiscales : <strong className="text-blue-600">{PLAFOND_NICHES.toLocaleString('fr-FR')} €</strong> (ou {PLAFOND_NICHES_MAJORE.toLocaleString('fr-FR')} € avec SOFICA)</p>
                      </div>
                    </div>

                    {/* Info pédagogique */}
                    <div className="alert-info">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 Réduction vs Crédit d'impôt</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                        <div className="bg-white border border-blue-100 rounded-lg p-3">
                          <strong>Réduction d'impôt</strong>
                          <p className="mt-1">Diminue votre impôt. Si vous n'êtes pas imposable, vous ne bénéficiez pas de l'avantage.</p>
                        </div>
                        <div className="bg-white border border-blue-100 rounded-lg p-3">
                          <strong>Crédit d'impôt ✨</strong>
                          <p className="mt-1">Vous est remboursé même si vous n'êtes pas imposable !</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {/* CRÉDITS D'IMPÔT (remboursables) */}
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-emerald-900 flex items-center gap-2">✨ Crédits d'impôt (remboursables)</h3>
                        <span className="badge-green text-xs">Remboursés si non imposable</span>
                      </div>
                      
                      {/* Emploi à domicile */}
                      <div className="bg-white border border-emerald-100 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-emerald-800">🏠 Emploi à domicile</h4>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Crédit 50%</span>
                        </div>
                        <InputField label="Dépenses emploi domicile" value={emploiDomicile} onChange={setEmploiDomicile} hint="Ménage, jardinage, garde, soutien scolaire..." />
                        <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded p-2">
                          <strong>Plafonds :</strong> 12 000 € (+1 500 €/enfant, max 15 000 €) • Jardinage : 5 000 € • Bricolage : 500 €
                        </div>
                        {emploiDomicile > 0 && (
                          <div className="mt-2 text-sm font-medium text-emerald-600">
                            → Crédit estimé : {fmtEur(Math.min(emploiDomicile, 12000 + nbEnfantsGarde * 1500) * 0.5)}
                          </div>
                        )}
                      </div>

                      {/* Frais de garde */}
                      <div className="bg-white border border-emerald-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-emerald-800">👶 Frais de garde (enfants −6 ans)</h4>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Crédit 50%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField label="Frais de garde payés" value={fraisGarde} onChange={setFraisGarde} hint="Crèche, assistante maternelle, garderie" />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'enfants gardés</label>
                            <input type="number" value={nbEnfantsGarde} onChange={(e) => setNbEnfantsGarde(Number(e.target.value) || 0)} min={0} max={10} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 rounded p-2">
                          <strong>Plafond :</strong> 3 500 € de dépenses par enfant → crédit max 1 750 €/enfant
                        </div>
                        {fraisGarde > 0 && nbEnfantsGarde > 0 && (
                          <div className="mt-2 text-sm font-medium text-emerald-600">
                            → Crédit estimé : {fmtEur(Math.min(fraisGarde, nbEnfantsGarde * 3500) * 0.5)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {/* DONS */}
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    <div className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                      <h3 className="font-bold text-pink-900 flex items-center gap-2 mb-4">❤️ Dons et mécénat</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-pink-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-pink-800">Organismes d'intérêt général</h4>
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Réduction 66%</span>
                          </div>
                          <InputField label="Montant des dons" value={donsInteret} onChange={setDonsInteret} />
                          <p className="text-xs text-pink-600 mt-2">Associations, fondations, partis politiques... (max 20% du revenu imposable)</p>
                          {donsInteret > 0 && <div className="mt-2 text-sm font-medium text-pink-600">→ Réduction : {fmtEur(donsInteret * 0.66)}</div>}
                        </div>
                        <div className="bg-white border border-pink-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-pink-800">Aide aux personnes en difficulté</h4>
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Réduction 75%</span>
                          </div>
                          <InputField label="Montant des dons" value={donsAide} onChange={setDonsAide} />
                          <p className="text-xs text-pink-600 mt-2">Restos du Cœur, Secours Populaire, Croix-Rouge... (max 1 000 €)</p>
                          {donsAide > 0 && <div className="mt-2 text-sm font-medium text-pink-600">→ Réduction : {fmtEur(Math.min(donsAide, 1000) * 0.75 + Math.max(0, donsAide - 1000) * 0.66)}</div>}
                        </div>
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {/* INVESTISSEMENTS */}
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4">📈 Investissements défiscalisants</h3>
                      
                      {/* Immobilier */}
                      <div className="bg-white border border-blue-100 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-800 mb-3">🏠 Investissement locatif</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <InputField label="Réduction Pinel / Denormandie" value={reductionPinel} onChange={setReductionPinel} hint="Montant de la réduction annuelle" />
                            <p className="text-xs text-blue-600 mt-1">Report des années précédentes ou nouveau dispositif</p>
                          </div>
                          <div>
                            <InputField label="Réduction Denormandie ancien" value={reductionDenormandie} onChange={setReductionDenormandie} hint="Investissement centres-villes dégradés" />
                          </div>
                        </div>
                      </div>

                      {/* Entreprises */}
                      <div className="bg-white border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-800">💼 Investissement entreprises</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Réduction 18%</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <InputField label="PME (IR-PME)" value={investPME} onChange={setInvestPME} hint={`Max ${isCouple ? '100 000' : '50 000'} €`} />
                          <InputField label="FIP" value={investFIP} onChange={setInvestFIP} hint={`Max ${isCouple ? '24 000' : '12 000'} €`} />
                          <InputField label="FCPI" value={investFCPI} onChange={setInvestFCPI} hint={`Max ${isCouple ? '24 000' : '12 000'} €`} />
                          <div>
                            <InputField label="SOFICA" value={investSOFICA} onChange={setInvestSOFICA} hint="30-48%, max 18 000 €" />
                            <p className="text-xs text-amber-600 mt-1">⚠️ Plafond majoré 18 000 €</p>
                          </div>
                        </div>
                        {(investPME + investFIP + investFCPI + investSOFICA) > 0 && (
                          <div className="mt-3 text-sm font-medium text-blue-600">
                            → Réduction PME/FIP/FCPI : {fmtEur((investPME + investFIP + investFCPI) * 0.18)} | SOFICA : {fmtEur(investSOFICA * 0.30)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {/* AUTRES RÉDUCTIONS (hors plafond) */}
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">📚 Autres réductions</h3>
                        <span className="badge-green text-xs">Hors plafond des niches</span>
                      </div>
                      
                      {/* Frais de scolarité */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-slate-700 mb-3">🎓 Frais de scolarité (réduction forfaitaire)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Collège (61 €/enfant)</label>
                            <input type="number" value={nbEnfantsCollege} onChange={(e) => setNbEnfantsCollege(Number(e.target.value) || 0)} min={0} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500" placeholder="Nb enfants" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lycée (153 €/enfant)</label>
                            <input type="number" value={nbEnfantsLycee} onChange={(e) => setNbEnfantsLycee(Number(e.target.value) || 0)} min={0} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500" placeholder="Nb enfants" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supérieur (183 €/enfant)</label>
                            <input type="number" value={nbEnfantsSuperieur} onChange={(e) => setNbEnfantsSuperieur(Number(e.target.value) || 0)} min={0} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500" placeholder="Nb enfants" />
                          </div>
                        </div>
                        {(nbEnfantsCollege + nbEnfantsLycee + nbEnfantsSuperieur) > 0 && (
                          <div className="mt-3 text-sm font-medium text-slate-600">
                            → Réduction scolarité : {fmtEur(nbEnfantsCollege * 61 + nbEnfantsLycee * 153 + nbEnfantsSuperieur * 183)}
                          </div>
                        )}
                      </div>

                      {/* Cotisations syndicales */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-700">🤝 Cotisations syndicales</h4>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Crédit 66%</span>
                        </div>
                        <InputField label="Cotisations versées" value={cotisationsSyndicales} onChange={setCotisationsSyndicales} hint="Max 1% du salaire" />
                        {cotisationsSyndicales > 0 && <div className="mt-2 text-sm font-medium text-slate-600">→ Crédit : {fmtEur(cotisationsSyndicales * 0.66)}</div>}
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {/* RÉCAPITULATIF PLAFOND NICHES */}
                    {/* ═══════════════════════════════════════════════════════════════════════════ */}
                    {(() => {
                      const totalNiches = Math.min(emploiDomicile, 12000) * 0.5 + Math.min(fraisGarde, nbEnfantsGarde * 3500) * 0.5 + reductionPinel + reductionDenormandie + (investPME + investFIP + investFCPI) * 0.18 + investSOFICA * 0.30
                      const plafondApplicable = investSOFICA > 0 ? PLAFOND_NICHES_MAJORE : PLAFOND_NICHES
                      const depasse = totalNiches > plafondApplicable
                      return (
                        <div className={`p-4 rounded-xl border-2 ${depasse ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-bold ${depasse ? 'text-red-800' : 'text-emerald-800'}`}>
                                {depasse ? '⚠️ Plafond des niches fiscales dépassé !' : '✅ Plafond des niches fiscales'}
                              </h4>
                              <p className={`text-sm ${depasse ? 'text-red-600' : 'text-emerald-600'}`}>
                                Total estimé : {fmtEur(totalNiches)} / {fmtEur(plafondApplicable)}
                                {investSOFICA > 0 && ' (plafond majoré SOFICA)'}
                              </p>
                            </div>
                            <div className={`text-2xl font-bold ${depasse ? 'text-red-600' : 'text-emerald-600'}`}>
                              {Math.round(totalNiches / plafondApplicable * 100)}%
                            </div>
                          </div>
                          {depasse && (
                            <p className="text-xs text-red-600 mt-2">
                              L'excédent de {fmtEur(totalNiches - plafondApplicable)} ne sera pas pris en compte (sauf report possible sur certains dispositifs).
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between p-6 bg-gray-50 border-t border-gray-100">
                  <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-6 py-3 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-white hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Précédent</button>
                  {step < 5 ? (
                    <button onClick={() => setStep(step + 1)} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">Suivant →</button>
                  ) : (
                    <button onClick={lancerSimulation} disabled={loading} className="px-10 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center gap-2">
                      {loading ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Calcul...</> : <>🧮 Calculer mon impôt</>}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Panneau latéral - Aperçu */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">📊 Aperçu rapide</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="text-sm text-gray-600">Nombre de parts fiscales</div>
                    <div className="text-3xl font-bold text-blue-600">{nombreParts}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600">Revenus bruts saisis</div>
                    <div className="text-xl font-bold text-gray-900">{fmtEur(salaires1 + (isCouple ? salaires2 : 0) + pensions + revenusTNS + fonciersBruts)}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-600">Charges déductibles</div>
                    <div className="text-xl font-bold text-green-600">− {fmtEur(pensionEnfant + pensionExConjoint + pensionAscendant + versementsPER + (isCouple ? versementsPER2 : 0))}</div>
                  </div>
                </div>

                {/* Barème */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Barème IR 2025</h4>
                  <div className="space-y-1.5 text-sm">
                    {BAREME_IR_2025.map((t, i) => (
                      <div key={i} className="flex justify-between p-2 rounded-lg bg-gray-50">
                        <span className="text-gray-600">{t.max === Infinity ? `> ${t.min.toLocaleString('fr-FR')}` : `${t.min.toLocaleString('fr-FR')} - ${t.max.toLocaleString('fr-FR')}`} €</span>
                        <span className="font-bold text-blue-600">{t.taux}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : resultat && (
          /* ══════════════════════════════════════════════════════════════════════════════
             RÉSULTATS DÉTAILLÉS
             ══════════════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Bouton retour */}
            <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-medium">Modifier la simulation</span>
            </button>

            {/* KPIs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Impôt total à payer</div>
                <div className="text-3xl font-bold mt-1">{fmtEur(resultat.synthese.impotTotal)}</div>
                <div className="text-sm opacity-75 mt-2">IR + CEHR + PFU/PS</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">IR Net</div>
                <div className="text-3xl font-bold mt-1">{fmtEur(resultat.synthese.irNet)}</div>
                <div className="text-sm opacity-75 mt-2">Après réductions</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">TMI</div>
                <div className="text-3xl font-bold mt-1">{resultat.synthese.tmi}%</div>
                <div className="text-sm opacity-75 mt-2">Tranche marginale</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Taux moyen</div>
                <div className="text-3xl font-bold mt-1">{fmtPct(resultat.synthese.tauxMoyen)}</div>
                <div className="text-sm opacity-75 mt-2">IR / Revenu net</div>
              </div>
            </div>

            {/* Détail du calcul */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">📝 Détail du calcul</h3>
                <button onClick={() => setShowDetailCalcul(!showDetailCalcul)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">{showDetailCalcul ? 'Masquer le détail' : 'Voir le détail complet'}</button>
              </div>

              <div className="p-6">
                {/* Résumé principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Colonne gauche - Revenus */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Revenus</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Salaires nets (D1)</span><span className="font-medium">{fmtEur(resultat.revenus.salaires1.net)}</span></div>
                      {resultat.revenus.salaires2 && <div className="flex justify-between"><span>Salaires nets (D2)</span><span className="font-medium">{fmtEur(resultat.revenus.salaires2.net)}</span></div>}
                      {resultat.revenus.pensions.brut > 0 && <div className="flex justify-between"><span>Pensions nettes</span><span className="font-medium">{fmtEur(resultat.revenus.pensions.net)}</span></div>}
                      {resultat.revenus.tns > 0 && <div className="flex justify-between"><span>Revenus TNS</span><span className="font-medium">{fmtEur(resultat.revenus.tns)}</span></div>}
                      {resultat.revenus.fonciers.brut > 0 && <div className="flex justify-between"><span>Revenus fonciers nets</span><span className="font-medium">{fmtEur(resultat.revenus.fonciers.net)}</span></div>}
                      <div className="flex justify-between pt-2 border-t font-bold"><span>Revenu brut global</span><span>{fmtEur(resultat.calcul.revenuBrutGlobal)}</span></div>
                      <div className="flex justify-between text-green-600"><span>Charges déductibles</span><span>− {fmtEur(resultat.calcul.totalCharges)}</span></div>
                      <div className="flex justify-between pt-2 border-t font-bold text-blue-700"><span>Revenu net imposable</span><span>{fmtEur(resultat.calcul.revenuNetImposable)}</span></div>
                    </div>
                  </div>

                  {/* Colonne droite - Impôt */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Calcul de l'impôt</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>IR brut (barème)</span><span className="font-medium">{fmtEur(resultat.calcul.irBrut)}</span></div>
                      {resultat.calcul.plafonnementQF > 0 && <div className="flex justify-between text-orange-600"><span>Plafonnement QF</span><span>+ {fmtEur(resultat.calcul.plafonnementQF)}</span></div>}
                      {resultat.calcul.decote > 0 && <div className="flex justify-between text-green-600"><span>Décote</span><span>− {fmtEur(resultat.calcul.decote)}</span></div>}
                      {resultat.calcul.totalReductions > 0 && <div className="flex justify-between text-green-600"><span>Réductions d'impôt</span><span>− {fmtEur(resultat.calcul.totalReductions)}</span></div>}
                      <div className="flex justify-between pt-2 border-t font-bold"><span>IR net</span><span>{fmtEur(resultat.synthese.irNet)}</span></div>
                      {resultat.synthese.cehr > 0 && <div className="flex justify-between text-red-600"><span>CEHR (hauts revenus)</span><span>+ {fmtEur(resultat.synthese.cehr)}</span></div>}
                      {resultat.synthese.prelevementsPatrimoine > 0 && <div className="flex justify-between text-red-500"><span>PFU / PS patrimoine</span><span>+ {fmtEur(resultat.synthese.prelevementsPatrimoine)}</span></div>}
                      <div className="flex justify-between pt-2 border-t font-bold text-red-700 text-lg"><span>IMPÔT TOTAL</span><span>{fmtEur(resultat.synthese.impotTotal)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Détail complet */}
                {showDetailCalcul && (
                  <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                    {/* Détail par tranches */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Détail par tranche d'imposition</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Tranche</th>
                              <th className="px-4 py-3 text-center font-semibold">Taux</th>
                              <th className="px-4 py-3 text-right font-semibold">Base imposable</th>
                              <th className="px-4 py-3 text-right font-semibold">Impôt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {resultat.calcul.detailTranches.map((t: any, i: number) => (
                              <tr key={i} className={t.impot > 0 ? 'bg-blue-50' : ''}>
                                <td className="px-4 py-3">{fmtEur(t.min)} - {t.max ? fmtEur(t.max) : '∞'}</td>
                                <td className="px-4 py-3 text-center font-bold text-blue-600">{t.taux}%</td>
                                <td className="px-4 py-3 text-right">{fmtEur(t.baseImposable)}</td>
                                <td className="px-4 py-3 text-right font-bold">{fmtEur(t.impot)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-100">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 font-bold">Total IR brut (× {nombreParts} parts)</td>
                              <td className="px-4 py-3 text-right font-bold text-blue-700">{fmtEur(resultat.calcul.irBrut)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Économies réalisées */}
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-4">💰 Économies réalisées</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg"><div className="text-2xl font-bold text-green-600">{fmtEur(resultat.economies.quotientFamilial)}</div><div className="text-xs text-gray-600">Quotient familial</div></div>
                        <div className="text-center p-3 bg-white rounded-lg"><div className="text-2xl font-bold text-green-600">{fmtEur(resultat.economies.decote)}</div><div className="text-xs text-gray-600">Décote</div></div>
                        <div className="text-center p-3 bg-white rounded-lg"><div className="text-2xl font-bold text-green-600">{fmtEur(resultat.economies.reductions)}</div><div className="text-xs text-gray-600">Réductions d'impôt</div></div>
                        <div className="text-center p-3 bg-white rounded-lg"><div className="text-2xl font-bold text-green-600">{fmtEur(resultat.economies.total)}</div><div className="text-xs text-gray-600">Total économisé</div></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alertes et conseils */}
            {(resultat.alertes.length > 0 || resultat.conseils.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resultat.alertes.length > 0 && (
                  <div className="alert-warning">
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
                      Points d'attention
                    </h4>
                    <ul className="space-y-2">{resultat.alertes.map((a: string, i: number) => <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><span className="text-amber-500">•</span>{a}</li>)}</ul>
                  </div>
                )}
                {resultat.conseils.length > 0 && (
                  <div className="pedagogy-box">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      Conseils d'optimisation
                    </h4>
                    <ul className="space-y-2">{resultat.conseils.map((c: string, i: number) => <li key={i} className="text-sm text-blue-700 flex items-start gap-2"><span className="text-blue-500">•</span>{c}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommandation personnalisée */}
            <div className="sim-card">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span> Recommandation personnalisée
              </h4>
              <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                {resultat.synthese.tmi >= 41 ? (
                  <>
                    <p>Avec une TMI de <strong className="text-red-600">{resultat.synthese.tmi}%</strong>, vous êtes dans une tranche élevée. Des stratégies d'optimisation peuvent être envisagées.</p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <strong className="text-blue-700">👉 Pistes d'optimisation :</strong>
                      <ul className="mt-2 space-y-1 ml-4 text-slate-600">
                        <li>• Versements PER pour déduire jusqu'à {fmtEur(Math.round((salaires1 + salaires2) * 0.1))} (économie IR ~{resultat.synthese.tmi}%)</li>
                        <li>• Investissements défiscalisants (Pinel, PME, dons...)</li>
                        <li>• Optimisation du régime foncier (réel vs micro)</li>
                      </ul>
                    </div>
                  </>
                ) : resultat.synthese.tmi >= 30 ? (
                  <>
                    <p>Avec une TMI de <strong className="text-amber-600">{resultat.synthese.tmi}%</strong>, vous avez des opportunités d'optimisation intéressantes.</p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <strong className="text-blue-700">👉 Recommandations :</strong>
                      <ul className="mt-2 space-y-1 ml-4 text-slate-600">
                        <li>• PER : chaque euro versé vous fait économiser {resultat.synthese.tmi} centimes d'IR</li>
                        <li>• PFU vs Barème : comparez selon vos revenus du capital</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Avec une TMI de <strong className="text-emerald-600">{resultat.synthese.tmi}%</strong>, votre fiscalité est déjà optimisée. {resultat.synthese.irNet === 0 ? 'Vous n\'êtes pas imposable.' : ''}</p>
                    {resultat.synthese.decote > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <span className="text-emerald-700">✅ Vous bénéficiez de la décote ({fmtEur(resultat.economies.decote)})</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mentions légales */}
            <div className="alert-info">
              <p className="text-sm"><strong>📜 Mentions légales :</strong> Cette simulation est fournie à titre indicatif et ne constitue pas un avis fiscal. Les calculs sont basés sur le barème IR 2025 (CGI art. 197, revenus 2024). Pour une analyse personnalisée, consultez un conseiller en gestion de patrimoine.</p>
            </div>

            {/* Bouton nouvelle simulation */}
            <div className="flex justify-center gap-4 mt-6">
              <button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button>
            </div>
          </div>
        )}
      </div>
      
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      {/* STYLES CSS GLOBAUX - Même design que les simulateurs immobiliers */}
      {/* ══════════════════════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        :root { --pri: #1e40af; --pril: #3b82f6; --suc: #059669; --warn: #d97706; --err: #dc2626; }
        .sim-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .btn-primary{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(30,64,175,.25)}
        .btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}
        .badge-blue{background:#eff6ff;color:#1e40af;padding:4px 10px;border-radius:99px;font-size:12px}
        .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}
        .form-group{display:flex;flex-direction:column;gap:4px}
        .form-group label{font-size:13px;font-weight:500;color:#374151}
        .form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}
        .form-group input:focus,.form-group select:focus{border-color:#3b82f6;outline:none}
        .form-hint{font-size:11px;color:#9ca3af}
        .info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px}
        .pedagogy-box{background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:16px}
        .alert-error{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#991b1b}
        .alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}
        .alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}
        .animate-fadeIn{animation:fadeIn .3s ease-out}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}
      `}</style>
    </div>
  )
}
