 
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  SEUIL_IFI_2025,
  BAREME_IFI_2025,
  REDUCTIONS_IFI_2025,
  PLAFONNEMENT_IFI_2025,
  calculerIFINet,
  calculerPlafondDettes,
} from './parameters-ifi-2025'

const fmtEur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'

export default function IFIPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PATRIMOINE IMMOBILIER BRUT
  // ═══════════════════════════════════════════════════════════════════════════
  const [residencePrincipale, setResidencePrincipale] = useState(800000)
  const [residencesSecondaires, setResidencesSecondaires] = useState(0)
  const [immeubleLocatif, setImmeubleLocatif] = useState(0)
  const [scpiOpci, setScpiOpci] = useState(0)
  const [sciParts, setSciParts] = useState(0)
  const [autresImmeubles, setAutresImmeubles] = useState(0)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : EXONÉRATIONS ET ABATTEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const [biensProfessionnels, setBiensProfessionnels] = useState(0)
  const [boisForets, setBoisForets] = useState(0)
  const [biensRurauxLoues, setBiensRurauxLoues] = useState(0)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : PASSIF DÉDUCTIBLE
  // ═══════════════════════════════════════════════════════════════════════════
  const [empruntsImmobiliers, setEmpruntsImmobiliers] = useState(0)
  const [dettesTravaux, setDettesTravaux] = useState(0)
  const [ifiEstime, setIfiEstime] = useState(0)
  const [autresDettes, setAutresDettes] = useState(0)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : RÉDUCTIONS ET PLAFONNEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  const [donsIFI, setDonsIFI] = useState(0)
  const [revenusFoyer, setRevenusFoyer] = useState(0)
  const [irFoyer, setIrFoyer] = useState(0)

  const [resultat, setResultat] = useState<any>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULS EN TEMPS RÉEL
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Patrimoine brut
  const patrimoineBrut = residencePrincipale + residencesSecondaires + immeubleLocatif + 
                         scpiOpci + sciParts + autresImmeubles
  
  // Abattement RP (30%)
  const abattementRP = residencePrincipale * 0.30
  
  // Exonérations
  const exonerationBoisForets = boisForets <= 101897 
    ? boisForets * 0.75 
    : 101897 * 0.75 + (boisForets - 101897) * 0.50
  const exonerationBiensRuraux = biensRurauxLoues <= 101897 
    ? biensRurauxLoues * 0.75 
    : 101897 * 0.75 + (biensRurauxLoues - 101897) * 0.50
  const totalExonerations = biensProfessionnels + exonerationBoisForets + exonerationBiensRuraux
  
  // Dettes
  const totalDettes = empruntsImmobiliers + dettesTravaux + ifiEstime + autresDettes
  const { dettesDeductibles, plafonnement: plafonnementDettes } = calculerPlafondDettes(patrimoineBrut, totalDettes)
  
  // Patrimoine net taxable
  const patrimoineNetTaxable = Math.max(0, patrimoineBrut - abattementRP - totalExonerations - dettesDeductibles)
  
  // Assujetti ?
  const assujetti = patrimoineNetTaxable >= SEUIL_IFI_2025.SEUIL_IMPOSITION

  // Calcul IFI
  const calculIFI = calculerIFINet(patrimoineNetTaxable, donsIFI)
  
  // Plafonnement
  const plafonnementIRIFI = PLAFONNEMENT_IFI_2025.calculerPlafonnement(irFoyer, calculIFI.ifiNet, revenusFoyer)

  // Lancer la simulation complète via l'API backend
  const lancerSimulation = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/advisor/simulators/ifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Patrimoine
          residencePrincipale,
          residencesSecondaires,
          immeublesLocatifs: immeubleLocatif,
          scpiOpci,
          sciParts,
          autresImmeubles,
          // Exonérations
          biensProfessionnels,
          boisForets,
          biensRurauxLoues,
          // Dettes
          empruntsImmobiliers,
          dettesTravaux,
          ifiEstime,
          autresDettes,
          // Réductions
          donsIFI,
          // Plafonnement
          revenusFoyer,
          irFoyer,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors du calcul')
      }

      const data = await response.json()
      setResultat(data.data || data)
      setShowResults(true)
    } catch (error) {
      console.error('Erreur simulation IFI:', error)
      alert('Erreur lors de la simulation. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/20">
      {/* Header sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/calculateurs" className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl">🏛️</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Simulateur IFI 2025</h1>
                  <p className="text-sm text-gray-500">Impôt sur la Fortune Immobilière - CGI art. 964-983</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">Seuil 1.3 M€</span>
              <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Barème 2025</span>
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
              <div className="sim-card">
                <div className="flex items-center justify-between">
                  {[
                    { n: 1, l: 'Patrimoine', i: '🏠' },
                    { n: 2, l: 'Exonérations', i: '✨' },
                    { n: 3, l: 'Dettes', i: '💳' },
                    { n: 4, l: 'Réductions', i: '🎁' },
                  ].map((s, idx) => (
                    <div key={s.n} className="flex items-center">
                      <button onClick={() => setStep(s.n)} className={`flex flex-col items-center transition-all ${step === s.n ? 'scale-105' : step > s.n ? 'opacity-70' : 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-2 transition-all ${step === s.n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : step > s.n ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{step > s.n ? '✓' : s.i}</div>
                        <span className={`text-xs font-medium ${step === s.n ? 'text-indigo-600' : 'text-gray-500'}`}>{s.l}</span>
                      </button>
                      {idx < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s.n ? 'bg-green-300' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenu étapes */}
              <div className="sim-card animate-fadeIn">
                {/* ÉTAPE 1 : PATRIMOINE */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <span className="text-3xl">🏠</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Patrimoine immobilier brut</h2>
                        <p className="text-sm text-gray-500">Valorisez vos biens au 1er janvier 2025</p>
                      </div>
                    </div>

                    {/* Info pédagogique */}
                    <div className="alert-info">
                      <h4 className="font-semibold text-blue-800 mb-2">💡 Quels biens déclarer ?</h4>
                      <p className="text-sm text-blue-700">L'IFI ne taxe que le <strong>patrimoine immobilier</strong> (contrairement à l'ancien ISF). Les actifs financiers, meubles, véhicules ne sont pas concernés.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Résidence principale */}
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-emerald-800 flex items-center gap-2">🏡 Résidence principale</h3>
                          <span className="badge-green text-xs">Abattement 30%</span>
                        </div>
                        <div className="form-group">
                          <label>Valeur vénale</label>
                          <input type="number" value={residencePrincipale} onChange={e => setResidencePrincipale(+e.target.value)} />
                          <span className="form-hint">Valeur après abattement : {fmtEur(residencePrincipale * 0.70)}</span>
                        </div>
                      </div>

                      {/* Autres biens */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-4">🏘️ Autres biens immobiliers</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Résidences secondaires</label>
                            <input type="number" value={residencesSecondaires} onChange={e => setResidencesSecondaires(+e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Immeubles locatifs</label>
                            <input type="number" value={immeubleLocatif} onChange={e => setImmeubleLocatif(+e.target.value)} />
                            <span className="form-hint">Valeur vénale, pas le rendement</span>
                          </div>
                          <div className="form-group">
                            <label>Parts SCPI / OPCI</label>
                            <input type="number" value={scpiOpci} onChange={e => setScpiOpci(+e.target.value)} />
                            <span className="form-hint">Part immobilière uniquement</span>
                          </div>
                          <div className="form-group">
                            <label>Parts de SCI</label>
                            <input type="number" value={sciParts} onChange={e => setSciParts(+e.target.value)} />
                            <span className="form-hint">Quote-part immobilière</span>
                          </div>
                          <div className="form-group col-span-2">
                            <label>Autres biens immobiliers</label>
                            <input type="number" value={autresImmeubles} onChange={e => setAutresImmeubles(+e.target.value)} />
                            <span className="form-hint">Terrains, parkings, caves...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 2 : EXONÉRATIONS */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <span className="text-3xl">✨</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Exonérations et abattements</h2>
                        <p className="text-sm text-gray-500">Biens totalement ou partiellement exonérés</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Biens professionnels */}
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-purple-800 flex items-center gap-2">💼 Biens professionnels</h3>
                          <span className="badge-green text-xs">Exonération 100%</span>
                        </div>
                        <div className="form-group">
                          <label>Valeur des biens professionnels</label>
                          <input type="number" value={biensProfessionnels} onChange={e => setBiensProfessionnels(+e.target.value)} />
                          <span className="form-hint">Locaux utilisés pour votre activité principale</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">Conditions : activité exercée personnellement, titre principal</p>
                      </div>

                      {/* Bois et forêts */}
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-green-800 flex items-center gap-2">🌲 Bois et forêts</h3>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">75% puis 50%</span>
                        </div>
                        <div className="form-group">
                          <label>Valeur des bois et forêts</label>
                          <input type="number" value={boisForets} onChange={e => setBoisForets(+e.target.value)} />
                          <span className="form-hint">Avec engagement de gestion durable</span>
                        </div>
                        {boisForets > 0 && (
                          <p className="text-sm text-green-600 mt-2">→ Exonération : {fmtEur(exonerationBoisForets)} (75% jusqu'à 101 897 €, 50% au-delà)</p>
                        )}
                      </div>

                      {/* Biens ruraux loués */}
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-amber-800 flex items-center gap-2">🌾 Biens ruraux loués</h3>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">75% puis 50%</span>
                        </div>
                        <div className="form-group">
                          <label>Valeur des biens ruraux</label>
                          <input type="number" value={biensRurauxLoues} onChange={e => setBiensRurauxLoues(+e.target.value)} />
                          <span className="form-hint">Bail rural à long terme (18 ans min)</span>
                        </div>
                        {biensRurauxLoues > 0 && (
                          <p className="text-sm text-amber-600 mt-2">→ Exonération : {fmtEur(exonerationBiensRuraux)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ÉTAPE 3 : DETTES */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <span className="text-3xl">💳</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Passif déductible</h2>
                        <p className="text-sm text-gray-500">Dettes afférentes aux biens taxables</p>
                      </div>
                    </div>

                    {/* Info pédagogique */}
                    <div className="alert-warning">
                      <h4 className="font-semibold text-amber-800 mb-2">⚠️ Plafonnement des dettes</h4>
                      <p className="text-sm text-amber-700">Si votre patrimoine brut dépasse <strong>5 M€</strong>, les dettes au-delà de 60% du patrimoine ne sont déductibles qu'à <strong>50%</strong>.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                        <h3 className="font-semibold text-red-800 mb-4">🏦 Emprunts et dettes</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Emprunts immobiliers (CRD)</label>
                            <input type="number" value={empruntsImmobiliers} onChange={e => setEmpruntsImmobiliers(+e.target.value)} />
                            <span className="form-hint">Capital restant dû au 01/01</span>
                          </div>
                          <div className="form-group">
                            <label>Dettes pour travaux</label>
                            <input type="number" value={dettesTravaux} onChange={e => setDettesTravaux(+e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>IFI estimé de l'année</label>
                            <input type="number" value={ifiEstime} onChange={e => setIfiEstime(+e.target.value)} />
                            <span className="form-hint">Déductible du patrimoine</span>
                          </div>
                          <div className="form-group">
                            <label>Autres dettes déductibles</label>
                            <input type="number" value={autresDettes} onChange={e => setAutresDettes(+e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Récap dettes */}
                      {totalDettes > 0 && (
                        <div className={`p-4 rounded-xl border-2 ${plafonnementDettes > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-bold ${plafonnementDettes > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                                {plafonnementDettes > 0 ? '⚠️ Plafonnement appliqué' : '✅ Dettes déductibles'}
                              </h4>
                              <p className={`text-sm ${plafonnementDettes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                Total dettes : {fmtEur(totalDettes)} → Déductibles : {fmtEur(dettesDeductibles)}
                              </p>
                            </div>
                            {plafonnementDettes > 0 && (
                              <div className="text-right">
                                <div className="text-lg font-bold text-amber-600">−{fmtEur(plafonnementDettes)}</div>
                                <div className="text-xs text-amber-500">non déductible</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ÉTAPE 4 : RÉDUCTIONS */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <span className="text-3xl">🎁</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Réductions et plafonnement</h2>
                        <p className="text-sm text-gray-500">Dons et plafonnement IR+IFI</p>
                      </div>
                    </div>

                    {/* Dons */}
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-pink-800 flex items-center gap-2">❤️ Dons IFI</h3>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Réduction 75%</span>
                      </div>
                      <div className="form-group">
                        <label>Dons aux organismes éligibles</label>
                        <input type="number" value={donsIFI} onChange={e => setDonsIFI(+e.target.value)} />
                        <span className="form-hint">Fondations RUP, établissements d'enseignement supérieur... (max réduction : {fmtEur(REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION)})</span>
                      </div>
                      {donsIFI > 0 && (
                        <div className="mt-3 p-3 bg-pink-100 rounded-lg">
                          <p className="text-sm text-pink-700">
                            → Réduction IFI : <strong>{fmtEur(Math.min(donsIFI * 0.75, REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION))}</strong>
                            {donsIFI * 0.75 > REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION && ' (plafonnée)'}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-pink-600 mt-2">💡 Plus avantageux que le don IR (75% vs 66%) si vous êtes assujetti à l'IFI</p>
                    </div>

                    {/* Plafonnement */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">📊 Plafonnement IR + IFI</h3>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Max 75% des revenus</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">Le total IR + IFI ne peut dépasser 75% de vos revenus. Renseignez vos revenus pour vérifier.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label>Revenus du foyer</label>
                          <input type="number" value={revenusFoyer} onChange={e => setRevenusFoyer(+e.target.value)} />
                          <span className="form-hint">Revenus nets imposables</span>
                        </div>
                        <div className="form-group">
                          <label>IR payé</label>
                          <input type="number" value={irFoyer} onChange={e => setIrFoyer(+e.target.value)} />
                        </div>
                      </div>
                      {revenusFoyer > 0 && (
                        <div className={`mt-4 p-3 rounded-lg ${plafonnementIRIFI.plafonnement > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          <p className={`text-sm ${plafonnementIRIFI.plafonnement > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {plafonnementIRIFI.message}
                          </p>
                          {plafonnementIRIFI.plafonnement > 0 && (
                            <p className="text-sm text-emerald-600 font-semibold mt-1">
                              → IFI réduit à : {fmtEur(plafonnementIRIFI.ifiDu)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
                  <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="btn-secondary disabled:opacity-40">← Précédent</button>
                  {step < 4 ? (
                    <button onClick={() => setStep(step + 1)} className="btn-primary">Suivant →</button>
                  ) : (
                    <button onClick={lancerSimulation} disabled={loading} className="btn-primary">
                      {loading ? '⏳ Calcul...' : '🧮 Calculer l\'IFI'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Panneau latéral - Aperçu */}
            <div className="space-y-6">
              <div className="sim-card sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">📊 Aperçu en temps réel</h3>
                
                {/* Patrimoine net taxable */}
                <div className={`p-4 rounded-xl mb-4 ${assujetti ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' : 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'}`}>
                  <div className="text-sm text-gray-600 mb-1">Patrimoine net taxable</div>
                  <div className={`text-3xl font-bold ${assujetti ? 'text-red-600' : 'text-emerald-600'}`}>{fmtEur(patrimoineNetTaxable)}</div>
                  <div className={`text-sm mt-2 font-medium ${assujetti ? 'text-red-500' : 'text-emerald-500'}`}>
                    {assujetti ? '⚠️ Assujetti à l\'IFI' : '✅ Non assujetti (< 1.3 M€)'}
                  </div>
                </div>

                {/* Détail */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Patrimoine brut</span><span className="font-medium">{fmtEur(patrimoineBrut)}</span></div>
                  <div className="flex justify-between text-emerald-600"><span>Abattement RP (30%)</span><span>−{fmtEur(abattementRP)}</span></div>
                  {totalExonerations > 0 && <div className="flex justify-between text-purple-600"><span>Exonérations</span><span>−{fmtEur(totalExonerations)}</span></div>}
                  {dettesDeductibles > 0 && <div className="flex justify-between text-red-600"><span>Dettes déductibles</span><span>−{fmtEur(dettesDeductibles)}</span></div>}
                  <div className="flex justify-between pt-2 border-t font-bold"><span>Net taxable</span><span>{fmtEur(patrimoineNetTaxable)}</span></div>
                </div>

                {/* IFI estimé */}
                {assujetti && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <div className="text-sm text-gray-600 mb-1">IFI estimé</div>
                    <div className="text-2xl font-bold text-indigo-600">{fmtEur(calculIFI.ifiNet)}</div>
                    {calculIFI.decote > 0 && <div className="text-xs text-indigo-500 mt-1">Décote : −{fmtEur(calculIFI.decote)}</div>}
                    {calculIFI.reductionDons > 0 && <div className="text-xs text-pink-500">Réduction dons : −{fmtEur(calculIFI.reductionDons)}</div>}
                  </div>
                )}

                {/* Barème */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3">Barème IFI 2025</h4>
                  <div className="space-y-1.5 text-xs">
                    {BAREME_IFI_2025.map((t, i) => (
                      <div key={i} className={`flex justify-between p-2 rounded-lg ${patrimoineNetTaxable > t.min && patrimoineNetTaxable <= t.max ? 'bg-indigo-100 border border-indigo-300' : 'bg-gray-50'}`}>
                        <span className="text-gray-600">{t.max === Infinity ? `> ${(t.min/1000000).toFixed(1)} M€` : `${(t.min/1000000).toFixed(1)} - ${(t.max/1000000).toFixed(1)} M€`}</span>
                        <span className={`font-bold ${t.taux === 0 ? 'text-gray-400' : 'text-indigo-600'}`}>{fmtPct(t.taux)}</span>
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
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-medium">Modifier la simulation</span>
            </button>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-6 text-white shadow-lg ${resultat.assujetti ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
                <div className="text-sm opacity-90">Statut IFI</div>
                <div className="text-2xl font-bold mt-1">{resultat.assujetti ? 'Assujetti' : 'Non assujetti'}</div>
                <div className="text-sm opacity-75 mt-2">Seuil : 1 300 000 €</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Patrimoine net taxable</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.patrimoine.netTaxable)}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">IFI brut</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.calcul.ifiBrut)}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">IFI net à payer</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.synthese?.ifiNet ?? resultat.plafonnement?.ifiDu ?? 0)}</div>
                {resultat.plafonnement?.applicable && <div className="text-xs opacity-75 mt-1">Après plafonnement</div>}
              </div>
            </div>

            {/* Détail calcul */}
            <div className="sim-card">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📝 Détail du calcul</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patrimoine */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Patrimoine</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Patrimoine brut</span><span className="font-medium">{fmtEur(resultat.patrimoine.brut)}</span></div>
                    <div className="flex justify-between text-emerald-600"><span>Abattement RP (30%)</span><span>−{fmtEur(resultat.patrimoine.abattementRP)}</span></div>
                    {(resultat.patrimoine.exonerations?.total || 0) > 0 && <div className="flex justify-between text-purple-600"><span>Exonérations</span><span>−{fmtEur(resultat.patrimoine.exonerations.total)}</span></div>}
                    <div className="flex justify-between text-red-600"><span>Dettes déductibles</span><span>−{fmtEur(resultat.patrimoine.dettes?.deductibles || 0)}</span></div>
                    {(resultat.patrimoine.dettes?.plafonnement || 0) > 0 && <div className="flex justify-between text-amber-600 text-xs"><span>Plafonnement dettes</span><span>+{fmtEur(resultat.patrimoine.dettes.plafonnement)}</span></div>}
                    <div className="flex justify-between pt-2 border-t font-bold text-indigo-700"><span>Patrimoine net taxable</span><span>{fmtEur(resultat.patrimoine.netTaxable)}</span></div>
                  </div>
                </div>

                {/* Calcul IFI */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Calcul de l'IFI</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>IFI brut (barème)</span><span className="font-medium">{fmtEur(resultat.calcul.ifiBrut)}</span></div>
                    {resultat.calcul.decote > 0 && <div className="flex justify-between text-emerald-600"><span>Décote</span><span>−{fmtEur(resultat.calcul.decote)}</span></div>}
                    {resultat.calcul.reductionDons > 0 && <div className="flex justify-between text-pink-600"><span>Réduction dons (75%)</span><span>−{fmtEur(resultat.calcul.reductionDons)}</span></div>}
                    <div className="flex justify-between pt-2 border-t font-bold"><span>IFI après réductions</span><span>{fmtEur(resultat.calcul.ifiApresReductions)}</span></div>
                    {resultat.plafonnement?.applicable && (
                      <>
                        <div className="flex justify-between text-emerald-600"><span>Plafonnement 75%</span><span>−{fmtEur(resultat.plafonnement.reduction)}</span></div>
                        <div className="flex justify-between pt-2 border-t font-bold text-indigo-700 text-lg"><span>IFI NET À PAYER</span><span>{fmtEur(resultat.synthese.ifiNet)}</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Détail par tranche */}
              {resultat.calcul.detailTranches.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Détail par tranche</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Tranche</th>
                          <th className="px-4 py-3 text-center font-semibold">Taux</th>
                          <th className="px-4 py-3 text-right font-semibold">Base</th>
                          <th className="px-4 py-3 text-right font-semibold">IFI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {resultat.calcul.detailTranches.map((t, i) => (
                          <tr key={i} className="hover:bg-indigo-50">
                            <td className="px-4 py-3">{t.tranche}</td>
                            <td className="px-4 py-3 text-center font-bold text-indigo-600">{fmtPct(t.taux)}</td>
                            <td className="px-4 py-3 text-right">{fmtEur(t.base)}</td>
                            <td className="px-4 py-3 text-right font-bold">{fmtEur(t.impot)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 font-bold">Total IFI brut</td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-700">{fmtEur(resultat.calcul.ifiBrut)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Alertes de l'API */}
            {resultat.alertes && resultat.alertes.length > 0 && (
              <div className="sim-card">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> Points clés
                </h4>
                <ul className="space-y-2">
                  {resultat.alertes.map((alerte: string, i: number) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {alerte}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conseils de l'API */}
            {resultat.conseils && resultat.conseils.length > 0 && (
              <div className="sim-card">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span> Pistes d'optimisation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {resultat.conseils.map((conseil: string, i: number) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-blue-700">{conseil}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentions légales */}
            <div className="alert-info">
              <p className="text-sm"><strong>📜 Mentions légales :</strong> Cette simulation est fournie à titre indicatif. L'IFI est déclaré avec la déclaration de revenus (formulaire 2042-IFI). Pour une analyse personnalisée, consultez un conseiller en gestion de patrimoine.</p>
            </div>

            <div className="flex justify-center">
              <button onClick={() => setShowResults(false)} className="btn-primary">🔄 Nouvelle simulation</button>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx global>{`
        .sim-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .btn-primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(79,70,229,.25)}
        .btn-secondary{background:#f1f5f9;color:#475569;padding:10px 20px;border-radius:8px;font-weight:600;border:1px solid #e2e8f0;cursor:pointer}
        .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}
        .form-group{display:flex;flex-direction:column;gap:4px}
        .form-group label{font-size:13px;font-weight:500;color:#374151}
        .form-group input{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}
        .form-group input:focus{border-color:#7c3aed;outline:none}
        .form-hint{font-size:11px;color:#9ca3af}
        .alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}
        .alert-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;color:#92400e}
        .animate-fadeIn{animation:fadeIn .3s ease-out}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}
      `}</style>
    </div>
  )
}
