 
'use client'

import { useState } from 'react'
import Link from 'next/link'



const fmtEur = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'

type TypePV = 'mobiliere' | 'immobiliere' | 'or' | 'bijoux_art' | 'crypto'

const TYPES_PV = [
  { value: 'mobiliere' as TypePV, label: 'Actions / Titres', icon: '📈', desc: 'PFU 30% ou barème IR' },
  { value: 'immobiliere' as TypePV, label: 'Immobilier', icon: '🏠', desc: 'IR 19% + PS 17.2%' },
  { value: 'or' as TypePV, label: 'Or / Métaux précieux', icon: '🥇', desc: 'TMP 11.5% ou PV réelles' },
  { value: 'bijoux_art' as TypePV, label: 'Bijoux / Objets d\'art', icon: '💎', desc: 'TFOA 6.5% ou PV réelles' },
  { value: 'crypto' as TypePV, label: 'Cryptomonnaies', icon: '₿', desc: 'PFU 30% (franchise 305€)' },
]

export default function PlusValuesPage() {
  const [typePV, setTypePV] = useState<TypePV>('mobiliere')
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [resultat, setResultat] = useState<any>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTATS COMMUNS
  // ═══════════════════════════════════════════════════════════════════════════
  const [pvBrute, setPvBrute] = useState(50000)
  const [dureeDetention, setDureeDetention] = useState(5)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTATS PV MOBILIÈRES
  // ═══════════════════════════════════════════════════════════════════════════
  const [titresAvant2018, setTitresAvant2018] = useState(false)
  const [typesTitres, setTypesTitres] = useState<'droit_commun' | 'pme'>('droit_commun')
  const [revenuImposable, setRevenuImposable] = useState(50000)
  const [nombreParts, setNombreParts] = useState(1)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTATS PV IMMOBILIÈRES
  // ═══════════════════════════════════════════════════════════════════════════
  const [prixCession, setPrixCession] = useState(300000)
  const [prixAcquisition, setPrixAcquisition] = useState(200000)
  const [fraisAcquisitionReels, setFraisAcquisitionReels] = useState(0)
  const [fraisAcquisitionForfait, setFraisAcquisitionForfait] = useState(true)
  const [travauxReels, setTravauxReels] = useState(0)
  const [travauxForfait, setTravauxForfait] = useState(true)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTATS OBJETS PRÉCIEUX
  // ═══════════════════════════════════════════════════════════════════════════
  const [prixAcquisitionObjet, setPrixAcquisitionObjet] = useState(0)

  // Calcul PV immobilière en temps réel
  const pvImmoCalculee = prixCession - prixAcquisition

  // Lancer la simulation
  const lancerSimulation = async () => {
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        type: typePV,
        pvBrute: typePV === 'immobiliere' ? pvImmoCalculee : pvBrute,
        dureeDetention,
      }

      if (typePV === 'mobiliere') {
        body.titresAvant2018 = titresAvant2018
        body.typesTitres = typesTitres
        body.revenuImposable = revenuImposable
        body.nombreParts = nombreParts
      }

      if (typePV === 'immobiliere') {
        body.prixCession = prixCession
        body.prixAcquisition = prixAcquisition
        body.fraisAcquisitionReels = fraisAcquisitionReels
        body.fraisAcquisitionForfait = fraisAcquisitionForfait
        body.travauxReels = travauxReels
        body.travauxForfait = travauxForfait
      }

      if (typePV === 'or' || typePV === 'bijoux_art') {
        body.prixAcquisitionObjet = prixAcquisitionObjet
      }

      const response = await fetch('/api/advisor/simulators/plus-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      setResultat(data.data || data)
      setShowResults(true)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la simulation')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/calculateurs" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl">📈</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Simulateur Plus-Values 2025</h1>
                  <p className="text-sm text-gray-500">Mobilières, immobilières, objets précieux, crypto</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">PFU 30%</span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">CGI 2025</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="space-y-6">
            {/* Sélection du type de PV */}
            <div className="sim-card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Type de plus-value</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {TYPES_PV.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setTypePV(t.value); setShowResults(false); setResultat(null); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${typePV === t.value ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'}`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div className="mt-2 font-semibold text-sm text-gray-900">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Formulaire selon le type */}
            <div className="sim-card animate-fadeIn">
              {/* ═══════════════════════════════════════════════════════════════════════════
                  PV MOBILIÈRES
                  ═══════════════════════════════════════════════════════════════════════════ */}
              {typePV === 'mobiliere' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="text-3xl">📈</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Plus-values sur titres</h2>
                      <p className="text-sm text-gray-500">Actions, parts sociales, valeurs mobilières</p>
                    </div>
                  </div>

                  {/* Info PFU vs Barème */}
                  <div className="alert-info">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 PFU vs Barème progressif</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>PFU (Flat Tax) - Par défaut</strong>
                        <p className="mt-1">30% (12.8% IR + 17.2% PS). Pas d'abattement.</p>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>Option Barème progressif</strong>
                        <p className="mt-1">Avec abattement si titres acquis avant 2018. PS toujours sur brut.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label>Plus-value brute</label>
                      <input type="number" value={pvBrute} onChange={e => setPvBrute(+e.target.value)} />
                      <span className="form-hint">Prix de cession - Prix d'acquisition</span>
                    </div>
                    <div className="form-group">
                      <label>Durée de détention (années)</label>
                      <input type="number" value={dureeDetention} onChange={e => setDureeDetention(+e.target.value)} min={0} />
                    </div>
                  </div>

                  {/* Option barème */}
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={titresAvant2018} onChange={e => setTitresAvant2018(e.target.checked)} className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                      <div>
                        <span className="font-semibold text-amber-800">Titres acquis avant le 1er janvier 2018</span>
                        <p className="text-xs text-amber-600">Ouvre droit aux abattements pour durée de détention en option barème</p>
                      </div>
                    </label>

                    {titresAvant2018 && (
                      <div className="mt-4 space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Type de titres</label>
                            <select value={typesTitres} onChange={e => setTypesTitres(e.target.value as any)} className="w-full px-4 py-3 border border-gray-300 rounded-xl">
                              <option value="droit_commun">Droit commun (50%/65%)</option>
                              <option value="pme">PME &lt;10 ans (50%/65%/85%)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Nombre de parts fiscales</label>
                            <input type="number" value={nombreParts} onChange={e => setNombreParts(+e.target.value)} min={1} step={0.5} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Revenu imposable du foyer (hors PV)</label>
                          <input type="number" value={revenuImposable} onChange={e => setRevenuImposable(+e.target.value)} />
                          <span className="form-hint">Pour calculer l'IR au barème progressif</span>
                        </div>
                        
                        {/* Grille abattements */}
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                          <div className="text-xs font-semibold text-amber-800 mb-2">Abattements applicables :</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {(typesTitres === 'pme' ? [
                              { d: '0-1 an', t: '0%' }, { d: '1-4 ans', t: '50%' }, { d: '4-8 ans', t: '65%' }, { d: '> 8 ans', t: '85%' }
                            ] : [
                              { d: '0-2 ans', t: '0%' }, { d: '2-8 ans', t: '50%' }, { d: '> 8 ans', t: '65%' }
                            ]).map((a, i) => (
                              <div key={i} className="bg-amber-50 rounded p-2 text-center">
                                <div className="font-semibold text-amber-700">{a.t}</div>
                                <div className="text-amber-600">{a.d}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════════
                  PV IMMOBILIÈRES
                  ═══════════════════════════════════════════════════════════════════════════ */}
              {typePV === 'immobiliere' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="text-3xl">🏠</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Plus-values immobilières</h2>
                      <p className="text-sm text-gray-500">CGI art. 150 U à 150 VH - Hors résidence principale</p>
                    </div>
                  </div>

                  {/* Info abattements */}
                  <div className="alert-info">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Abattements pour durée de détention</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>IR (19%)</strong> : Exonération après <strong>22 ans</strong>
                        <p className="text-xs mt-1">6% par an années 6→21, 4% année 22</p>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>PS (17.2%)</strong> : Exonération après <strong>30 ans</strong>
                        <p className="text-xs mt-1">1.65% années 6→21, 1.6% année 22, 9% années 23→30</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-group">
                      <label>Prix de cession</label>
                      <input type="number" value={prixCession} onChange={e => setPrixCession(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Prix d'acquisition</label>
                      <input type="number" value={prixAcquisition} onChange={e => setPrixAcquisition(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Durée de détention (années)</label>
                      <input type="number" value={dureeDetention} onChange={e => setDureeDetention(+e.target.value)} min={0} />
                    </div>
                  </div>

                  {/* Frais déductibles */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-purple-800 mb-4">Frais déductibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-2">
                          <input type="checkbox" checked={fraisAcquisitionForfait} onChange={e => setFraisAcquisitionForfait(e.target.checked)} className="rounded" />
                          Frais d'acquisition forfait 7.5%
                        </label>
                        {!fraisAcquisitionForfait && (
                          <div className="form-group">
                            <input type="number" value={fraisAcquisitionReels} onChange={e => setFraisAcquisitionReels(+e.target.value)} placeholder="Frais réels" />
                          </div>
                        )}
                        <span className="text-xs text-purple-600">Notaire, agence, droits d'enregistrement</span>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-2">
                          <input type="checkbox" checked={travauxForfait} onChange={e => setTravauxForfait(e.target.checked)} className="rounded" disabled={dureeDetention <= 5} />
                          Travaux forfait 15% {dureeDetention <= 5 && '(détention > 5 ans)'}
                        </label>
                        {!travauxForfait && (
                          <div className="form-group">
                            <input type="number" value={travauxReels} onChange={e => setTravauxReels(+e.target.value)} placeholder="Travaux réels" />
                          </div>
                        )}
                        <span className="text-xs text-purple-600">Construction, reconstruction, amélioration</span>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu PV */}
                  <div className={`p-4 rounded-xl border-2 ${pvImmoCalculee > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Plus-value brute</span>
                      <span className={`text-2xl font-bold ${pvImmoCalculee > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtEur(pvImmoCalculee)}</span>
                    </div>
                    {pvImmoCalculee <= 0 && <p className="text-sm text-red-600 mt-1">Pas de plus-value imposable (moins-value)</p>}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════════
                  OR / MÉTAUX PRÉCIEUX
                  ═══════════════════════════════════════════════════════════════════════════ */}
              {typePV === 'or' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="text-3xl">🥇</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Or et métaux précieux</h2>
                      <p className="text-sm text-gray-500">CGI art. 150 VI - Lingots, pièces, platine, argent</p>
                    </div>
                  </div>

                  <div className="alert-info">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Deux régimes au choix</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>Taxe forfaitaire (TMP)</strong>
                        <p className="mt-1"><strong>11.5%</strong> du prix de cession (11% + 0.5% CRDS)</p>
                        <p className="text-xs mt-1">Pas besoin de justifier l'acquisition</p>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>Régime PV réelles</strong>
                        <p className="mt-1"><strong>36.2%</strong> (19% IR + 17.2% PS) sur la PV</p>
                        <p className="text-xs mt-1">Abattement 5%/an après 2 ans. Exonération après 22 ans.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-group">
                      <label>Plus-value réalisée</label>
                      <input type="number" value={pvBrute} onChange={e => setPvBrute(+e.target.value)} />
                      <span className="form-hint">Prix cession - Prix acquisition</span>
                    </div>
                    <div className="form-group">
                      <label>Prix d'acquisition (si connu)</label>
                      <input type="number" value={prixAcquisitionObjet} onChange={e => setPrixAcquisitionObjet(+e.target.value)} />
                      <span className="form-hint">Pour comparer avec régime PV réelles</span>
                    </div>
                    <div className="form-group">
                      <label>Durée de détention (années)</label>
                      <input type="number" value={dureeDetention} onChange={e => setDureeDetention(+e.target.value)} min={0} />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════════
                  BIJOUX / OBJETS D'ART
                  ═══════════════════════════════════════════════════════════════════════════ */}
              {typePV === 'bijoux_art' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="text-3xl">💎</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Bijoux et objets d'art</h2>
                      <p className="text-sm text-gray-500">CGI art. 150 VJ - Tableaux, sculptures, antiquités</p>
                    </div>
                  </div>

                  <div className="alert-info">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Deux régimes au choix</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>Taxe forfaitaire (TFOA)</strong>
                        <p className="mt-1"><strong>6.5%</strong> du prix de cession (6% + 0.5% CRDS)</p>
                      </div>
                      <div className="bg-white border border-blue-100 rounded-lg p-3">
                        <strong>Régime PV réelles</strong>
                        <p className="mt-1"><strong>36.2%</strong> avec abattement 5%/an après 2 ans</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm text-amber-800">
                    <strong>Objets concernés :</strong> Bijoux, tableaux, peintures, sculptures, antiquités (+100 ans), timbres, véhicules de collection, meubles anciens
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-group">
                      <label>Plus-value réalisée</label>
                      <input type="number" value={pvBrute} onChange={e => setPvBrute(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Prix d'acquisition (si connu)</label>
                      <input type="number" value={prixAcquisitionObjet} onChange={e => setPrixAcquisitionObjet(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Durée de détention (années)</label>
                      <input type="number" value={dureeDetention} onChange={e => setDureeDetention(+e.target.value)} min={0} />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════════
                  CRYPTOMONNAIES
                  ═══════════════════════════════════════════════════════════════════════════ */}
              {typePV === 'crypto' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <span className="text-3xl">₿</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Cryptomonnaies</h2>
                      <p className="text-sm text-gray-500">CGI art. 150 VH bis - Bitcoin, Ethereum, etc.</p>
                    </div>
                  </div>

                  <div className="alert-info">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Régime fiscal des cryptoactifs</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>PFU 30%</strong> (12.8% IR + 17.2% PS) sur les plus-values</li>
                      <li>• <strong>Franchise annuelle de 305 €</strong> (non imposable en dessous)</li>
                      <li>• Les échanges crypto → crypto ne sont <strong>pas imposables</strong></li>
                      <li>• Seules les conversions crypto → € (ou achats de biens) sont imposées</li>
                    </ul>
                  </div>

                  <div className="form-group max-w-md">
                    <label>Plus-value globale annuelle</label>
                    <input type="number" value={pvBrute} onChange={e => setPvBrute(+e.target.value)} />
                    <span className="form-hint">Somme des PV sur cessions contre monnaie fiat</span>
                  </div>

                  {pvBrute <= 305 && pvBrute > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <span className="text-emerald-700 font-semibold">✅ Plus-value inférieure à la franchise de 305 € : pas d'impôt !</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bouton calculer */}
              <div className="flex justify-center pt-6 mt-6 border-t border-gray-100">
                <button onClick={lancerSimulation} disabled={loading} className="btn-primary">
                  {loading ? '⏳ Calcul...' : '🧮 Calculer l\'imposition'}
                </button>
              </div>
            </div>
          </div>
        ) : resultat && (
          /* ══════════════════════════════════════════════════════════════════════════════
             RÉSULTATS
             ══════════════════════════════════════════════════════════════════════════════ */
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="font-medium">Modifier la simulation</span>
            </button>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Plus-value brute</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.pvBrute || resultat.cession?.pvBrute || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Impôt total</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.synthese?.impotDu || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Net après impôt</div>
                <div className="text-2xl font-bold mt-1">{fmtEur(resultat.synthese?.netApresImpot || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="text-sm opacity-90">Taux effectif</div>
                <div className="text-2xl font-bold mt-1">{fmtPct(resultat.synthese?.tauxEffectif || 0)}</div>
              </div>
            </div>

            {/* Détail selon le type */}
            <div className="sim-card">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📝 Détail du calcul</h3>

              {/* PV Mobilières - Comparaison PFU vs Barème */}
              {resultat.type === 'mobiliere' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PFU */}
                    <div className={`p-5 rounded-xl border-2 ${resultat.comparaison.meilleurChoix === 'PFU' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">PFU (Flat Tax)</h4>
                        {resultat.comparaison.meilleurChoix === 'PFU' && <span className="badge-green text-xs">✓ Meilleur choix</span>}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>IR (12.8%)</span><span>{fmtEur(resultat.pfu.ir)}</span></div>
                        <div className="flex justify-between"><span>PS (17.2%)</span><span>{fmtEur(resultat.pfu.ps)}</span></div>
                        <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Total</span><span>{fmtEur(resultat.pfu.total)}</span></div>
                      </div>
                    </div>

                    {/* Barème */}
                    {resultat.bareme ? (
                      <div className={`p-5 rounded-xl border-2 ${resultat.comparaison.meilleurChoix === 'BAREME' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900">Option Barème</h4>
                          {resultat.comparaison.meilleurChoix === 'BAREME' && <span className="badge-green text-xs">✓ Meilleur choix</span>}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-purple-600"><span>Abattement {resultat.bareme.abattement}%</span><span>−{fmtEur(resultat.pvBrute * resultat.bareme.abattement / 100)}</span></div>
                          <div className="flex justify-between"><span>PV nette imposable</span><span>{fmtEur(resultat.bareme.pvNette)}</span></div>
                          <div className="flex justify-between"><span>IR (TMI {resultat.bareme.tmi}%)</span><span>{fmtEur(resultat.bareme.irPV)}</span></div>
                          <div className="flex justify-between"><span>PS (sur brut)</span><span>{fmtEur(resultat.bareme.ps)}</span></div>
                          <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Total</span><span>{fmtEur(resultat.bareme.total)}</span></div>
                        </div>
                        {resultat.bareme.csgDeductible > 0 && (
                          <p className="text-xs text-blue-600 mt-2">💡 CSG déductible N+1 : {fmtEur(resultat.bareme.csgDeductible)}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl border-2 border-gray-200 bg-gray-50">
                        <h4 className="font-bold text-gray-900 mb-4">Option Barème</h4>
                        <p className="text-sm text-gray-500">Non applicable (titres acquis après 2018, pas d'abattement)</p>
                      </div>
                    )}
                  </div>

                  {/* Économie */}
                  {resultat.comparaison.economie > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <span className="text-emerald-700 font-semibold">
                        💰 En choisissant le {resultat.comparaison.meilleurChoix === 'PFU' ? 'PFU' : 'barème progressif'}, vous économisez {fmtEur(resultat.comparaison.economie)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* PV Immobilières */}
              {resultat.type === 'immobiliere' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 text-sm">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Calcul de la plus-value</h4>
                      <div className="flex justify-between"><span>Prix de cession</span><span>{fmtEur(resultat.cession.prixCession)}</span></div>
                      <div className="flex justify-between"><span>Prix d'acquisition</span><span>−{fmtEur(resultat.acquisition.prixAcquisition)}</span></div>
                      <div className="flex justify-between text-purple-600"><span>Frais d'acquisition</span><span>−{fmtEur(resultat.acquisition.fraisAcquisition)}</span></div>
                      <div className="flex justify-between text-purple-600"><span>Travaux</span><span>−{fmtEur(resultat.acquisition.travaux)}</span></div>
                      <div className="flex justify-between pt-2 border-t font-bold"><span>PV nette</span><span>{fmtEur(resultat.cession.pvNette)}</span></div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Abattements ({resultat.abattements.dureeDetention} ans)</h4>
                      <div className="flex justify-between"><span>Abattement IR ({resultat.abattements.ir.taux}%)</span><span className="text-emerald-600">{resultat.exonerations.exonereIR ? 'Exonéré' : fmtEur(resultat.abattements.ir.pvImposable)}</span></div>
                      <div className="flex justify-between"><span>Abattement PS ({fmtPct(resultat.abattements.ps.taux)})</span><span className="text-emerald-600">{resultat.exonerations.exonerePS ? 'Exonéré' : fmtEur(resultat.abattements.ps.pvImposable)}</span></div>
                      <div className="flex justify-between pt-2 border-t"><span>IR (19%)</span><span className="text-amber-600">{fmtEur(resultat.impots.ir)}</span></div>
                      <div className="flex justify-between"><span>PS (17.2%)</span><span className="text-amber-600">{fmtEur(resultat.impots.ps)}</span></div>
                      {resultat.impots.surtaxe > 0 && <div className="flex justify-between text-red-600"><span>Surtaxe immobilière</span><span>{fmtEur(resultat.impots.surtaxe)}</span></div>}
                      <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Impôt total</span><span className="text-amber-600">{fmtEur(resultat.impots.total)}</span></div>
                    </div>
                  </div>

                  {/* Timeline exonérations */}
                  {!resultat.exonerations.exonerePS && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">📅 Prochaines exonérations</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                        {!resultat.exonerations.exonereIR && (
                          <div>Exonération IR : dans <strong>{resultat.exonerations.anneesRestantesIR} ans</strong> (22 ans de détention)</div>
                        )}
                        <div>Exonération totale : dans <strong>{resultat.exonerations.anneesRestantesPS} ans</strong> (30 ans de détention)</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Objets précieux */}
              {(resultat.type === 'or' || resultat.type === 'bijoux_art') && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-5 rounded-xl border-2 ${resultat.comparaison.meilleurRegime === 'FORFAITAIRE' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900">Taxe forfaitaire</h4>
                        {resultat.comparaison.meilleurRegime === 'FORFAITAIRE' && <span className="badge-green text-xs">✓ Meilleur</span>}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Base (prix cession)</span><span>{fmtEur(resultat.forfaitaire.base)}</span></div>
                        <div className="flex justify-between"><span>Taux</span><span>{resultat.forfaitaire.taux}%</span></div>
                        <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Taxe</span><span>{fmtEur(resultat.forfaitaire.montant)}</span></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{resultat.forfaitaire.info}</p>
                    </div>

                    {resultat.pvReelles ? (
                      <div className={`p-5 rounded-xl border-2 ${resultat.comparaison.meilleurRegime === 'PV_REELLES' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900">Régime PV réelles</h4>
                          {resultat.comparaison.meilleurRegime === 'PV_REELLES' && <span className="badge-green text-xs">✓ Meilleur</span>}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>PV brute</span><span>{fmtEur(resultat.pvReelles.pvBrute)}</span></div>
                          <div className="flex justify-between text-purple-600"><span>Abattement ({resultat.pvReelles.abattement}%)</span><span>−{fmtEur(resultat.pvReelles.pvBrute * resultat.pvReelles.abattement / 100)}</span></div>
                          <div className="flex justify-between"><span>IR (19%)</span><span>{fmtEur(resultat.pvReelles.ir)}</span></div>
                          <div className="flex justify-between"><span>PS (17.2%)</span><span>{fmtEur(resultat.pvReelles.ps)}</span></div>
                          <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Total</span><span>{fmtEur(resultat.pvReelles.total)}</span></div>
                        </div>
                        {resultat.pvReelles.exonere && <p className="text-xs text-emerald-600 mt-2">✅ Exonéré après 22 ans de détention</p>}
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl border-2 border-gray-200 bg-gray-50">
                        <h4 className="font-bold text-gray-900 mb-4">Régime PV réelles</h4>
                        <p className="text-sm text-gray-500">Non disponible (prix d'acquisition non renseigné)</p>
                      </div>
                    )}
                  </div>

                  {resultat.comparaison.economie > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <span className="text-emerald-700 font-semibold">
                        💰 En choisissant le régime {resultat.comparaison.meilleurRegime === 'FORFAITAIRE' ? 'forfaitaire' : 'PV réelles'}, vous économisez {fmtEur(resultat.comparaison.economie)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Crypto */}
              {resultat.type === 'crypto' && (
                <div className="space-y-4">
                  <div className="max-w-md space-y-3 text-sm">
                    <div className="flex justify-between"><span>Plus-value globale</span><span>{fmtEur(resultat.pvBrute)}</span></div>
                    <div className="flex justify-between text-emerald-600"><span>Franchise annuelle</span><span>−{fmtEur(resultat.calcul.franchise)}</span></div>
                    <div className="flex justify-between"><span>PV imposable</span><span>{fmtEur(resultat.calcul.pvImposable)}</span></div>
                    <div className="flex justify-between"><span>IR (12.8%)</span><span className="text-amber-600">{fmtEur(resultat.calcul.ir)}</span></div>
                    <div className="flex justify-between"><span>PS (17.2%)</span><span className="text-amber-600">{fmtEur(resultat.calcul.ps)}</span></div>
                    <div className="flex justify-between pt-2 border-t font-bold text-lg"><span>Impôt total (PFU 30%)</span><span className="text-amber-600">{fmtEur(resultat.calcul.total)}</span></div>
                  </div>

                  {resultat.alertes && resultat.alertes.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <ul className="space-y-1 text-sm text-blue-700">
                        {resultat.alertes.map((a: string, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mentions légales */}
            <div className="alert-info">
              <p className="text-sm"><strong>📜 Mentions légales :</strong> Cette simulation est fournie à titre indicatif. Les règles fiscales peuvent varier selon votre situation personnelle. Consultez un conseiller en gestion de patrimoine pour une analyse personnalisée.</p>
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
        .btn-primary{background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;border:none;cursor:pointer;transition:all .2s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(5,150,105,.25)}
        .badge-green{background:#dcfce7;color:#166534;padding:4px 10px;border-radius:99px;font-size:12px}
        .form-group{display:flex;flex-direction:column;gap:4px}
        .form-group label{font-size:13px;font-weight:500;color:#374151}
        .form-group input,.form-group select{border:2px solid #e2e8f0;border-radius:8px;padding:10px 12px;font-size:14px}
        .form-group input:focus,.form-group select:focus{border-color:#10b981;outline:none}
        .form-hint{font-size:11px;color:#9ca3af}
        .alert-info{background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;color:#1e40af}
        .animate-fadeIn{animation:fadeIn .3s ease-out}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1}}
      `}</style>
    </div>
  )
}
