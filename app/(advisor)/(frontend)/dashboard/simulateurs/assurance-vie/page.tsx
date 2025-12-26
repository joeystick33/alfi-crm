
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

const fmtEur = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €'
const fmtPct = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'

async function fetchAPI(endpoint: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/advisor/simulators/assurance-vie/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Erreur ${res.status}`)
  return res.json()
}

export default function AssuranceViePage() {
  const [tab, setTab] = useState<'frais' | 'rachat' | 'deces'>('frais')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(!!mq.matches)
    const h = () => setReduceMotion(!!mq.matches)
    mq.addEventListener?.('change', h)
    return () => mq.removeEventListener?.('change', h)
  }, [])

  useEffect(() => {
    const h = (e: CustomEvent<{ tab: string }>) => { if (['frais', 'rachat', 'deces'].includes(e.detail?.tab)) setTab(e.detail.tab as 'frais' | 'rachat' | 'deces') }
    window.addEventListener('switch-tab', h as EventListener)
    return () => window.removeEventListener('switch-tab', h as EventListener)
  }, [])

  return (
    <SimulatorGate simulator="ASSURANCE_VIE" showTeaser>
      <Script src="https://cdn.plot.ly/plotly-2.27.0.min.js" strategy="afterInteractive" />
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Link href="/dashboard/simulateurs" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">← Retour aux simulateurs</Link>
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['frais', 'rachat', 'deces'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${tab === t ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  {t === 'frais' ? '📉 Impact des frais' : t === 'rachat' ? '💰 Simulation rachat' : '⚖️ Transmission décès'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button className="text-sm text-gray-600 underline" onClick={() => setReduceMotion(v => !v)}>Animations: <span className="font-semibold">{reduceMotion ? 'Réduites' : 'Activées'}</span></button>
            </div>
          </div>
          <div className="animate-fadeIn">{tab === 'frais' ? <TabFrais r={reduceMotion} /> : tab === 'rachat' ? <TabRachat r={reduceMotion} /> : <TabDeces />}</div>
        </main>
      </div>
      <style jsx global>{`
        .animate-fadeIn{animation:fadeIn .5s ease-in-out}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .allocation-card{background:linear-gradient(135deg,#fff,#f8fafc);border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.05);transition:all .3s ease}
        .allocation-card:hover{box-shadow:0 8px 30px rgba(0,0,0,.1);transform:translateY(-2px)}
        .result-card{background:linear-gradient(135deg,#fff,#f8fafc);border:2px solid #e5e7eb;border-radius:20px;padding:32px;box-shadow:0 6px 25px rgba(0,0,0,.08)}
        .btn-primary{background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;color:#fff;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;cursor:pointer;transition:all .3s ease;box-shadow:0 4px 15px rgba(59,130,246,.3)}
        .btn-primary:hover{background:linear-gradient(135deg,#2563eb,#1e40af);box-shadow:0 6px 20px rgba(59,130,246,.4);transform:translateY(-2px)}
        .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .btn-secondary{background:linear-gradient(135deg,#e5e7eb,#d1d5db);border:1px solid #cbd5e1;color:#475569;padding:12px 24px;border-radius:10px;font-weight:600;cursor:pointer;transition:all .3s ease}
        .btn-secondary:hover{background:linear-gradient(135deg,#d1d5db,#9ca3af);transform:translateY(-1px)}
        .input-field{border:2px solid #e2e8f0;border-radius:10px;padding:12px 16px;background:linear-gradient(135deg,#fff,#f8fafc);transition:all .3s ease;width:100%;font-size:14px}
        .input-field:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1);outline:none;background:#fff}
        .smooth-slider{-webkit-appearance:none;width:100%;height:8px;border-radius:4px;background:linear-gradient(90deg,#e2e8f0,#cbd5e1);cursor:pointer}
        .smooth-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;transition:all .15s ease}
        .smooth-slider::-webkit-slider-thumb:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(59,130,246,.4)}
      `}</style>
    </SimulatorGate>
  )
}

// TAB FRAIS
function TabFrais({ r }: { r: boolean }) {
  const [p, setP] = useState({ duree: 15, versement_initial: 10000, versement_mensuel: 300, pct_uc: 30, pct_gsm: 0, rendement_euros: 2.2, rendement_uc: 5, rendement_gsm: 7, frais_gestion_assureur: 0.6, frais_gestion_uc: 0.8, frais_gestion_gsm: 1.9, frais_sur_versement: 2, frais_arbitrage: 0.5, nb_arbitrages_par_an: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<any>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const feesRef = useRef<HTMLDivElement>(null)
  const pctEuros = useMemo(() => Math.max(0, 100 - p.pct_uc - p.pct_gsm), [p.pct_uc, p.pct_gsm])
  const h = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setP(x => ({ ...x, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
  const submit = async () => { setError(''); setLoading(true); setRes(null); try { const d = await fetchAPI('frais', p as Record<string, unknown>); setRes(d.data) } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) } }
  useEffect(() => { if (!res?.chart_data || !chartRef.current) return; const P = (window as { Plotly?: { newPlot: (...args: unknown[]) => void } }).Plotly; if (!P) return; const chartData = res.chart_data as Record<string, unknown>[]; const m = chartData.map((d) => d.mois), sf = chartData.map((d) => d['Sans Frais']), af = chartData.map((d) => d['Avec Frais']); P.newPlot(chartRef.current, [{ x: m, y: af, type: 'scatter', mode: 'lines', name: 'Avec frais', line: { color: '#ef4444', width: 3 } }, { x: m, y: sf, type: 'scatter', mode: 'lines', name: 'Sans frais', line: { color: '#10b981', width: 3 }, fill: 'tonexty', fillcolor: 'rgba(245,158,11,0.18)' }], { title: 'Évolution du capital', xaxis: { title: 'Mois' }, yaxis: { title: 'Capital (€)', tickformat: ',.0f' }, margin: { t: 50, r: 20, b: 50, l: 70 }, paper_bgcolor: 'transparent' }, { displayModeBar: false, responsive: true }) }, [res])
  useEffect(() => { if (!res?.frais_data || !feesRef.current) return; const P = (window as { Plotly?: { newPlot: (...args: unknown[]) => void } }).Plotly; if (!P) return; const fraisData = res.frais_data as Record<string, unknown>[]; P.newPlot(feesRef.current, [{ labels: fraisData.map((d) => d.name), values: fraisData.map((d) => d.value), type: 'pie', hole: 0.58, marker: { colors: ['#60a5fa', '#34d399', '#fbbf24'] } }], { title: 'Répartition des frais', height: 320, margin: { t: 50, r: 20, b: 20, l: 20 }, annotations: [{ x: 0.5, y: 0.5, showarrow: false, text: `Total<br>${fmtEur(res.total_frais as number)}`, font: { size: 14 } }], paper_bgcolor: 'transparent' }, { displayModeBar: false, responsive: true }) }, [res])
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">💰 Impact des frais sur votre assurance vie</h2>
      <p className="text-gray-600 mb-8 text-lg">Analysez l'impact réel des frais sur votre épargne et optimisez votre allocation d'actifs.</p>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📊 Paramètres du contrat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Durée: <span className="font-bold text-blue-600">{p.duree}</span> ans</label><input type="range" className="smooth-slider w-full" min={5} max={99} value={p.duree} onChange={h('duree')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Versement initial (€)</label><input type="number" className="input-field" value={p.versement_initial} min={0} step={100} onChange={h('versement_initial')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Versement mensuel (€)</label><input type="number" className="input-field" value={p.versement_mensuel} min={0} step={10} onChange={h('versement_mensuel')} /></div>
        </div>
      </div>
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">🎯 Répartition d'actifs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">UC: <span className="font-bold text-green-600">{p.pct_uc}</span>%</label><input type="range" className="smooth-slider w-full" min={0} max={100} value={p.pct_uc} onChange={h('pct_uc')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">GSM: <span className="font-bold text-purple-600">{p.pct_gsm}</span>%</label><input type="range" className="smooth-slider w-full" min={0} max={100} value={p.pct_gsm} onChange={h('pct_gsm')} /></div>
          <div className="bg-blue-50 p-4 rounded-lg"><label className="block text-sm font-medium text-gray-700 mb-2">Fonds Euros</label><div className="text-2xl font-bold text-blue-600">{pctEuros}%</div></div>
        </div>
      </div>
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📈 Rendements & 💸 Frais</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Rdt Euros (%)</label><input type="number" className="input-field" value={p.rendement_euros} step={0.1} onChange={h('rendement_euros')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Rdt UC (%)</label><input type="number" className="input-field" value={p.rendement_uc} step={0.1} onChange={h('rendement_uc')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Frais assureur</label><input type="number" className="input-field" value={p.frais_gestion_assureur} step={0.1} onChange={h('frais_gestion_assureur')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Frais UC</label><input type="number" className="input-field" value={p.frais_gestion_uc} step={0.1} onChange={h('frais_gestion_uc')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Frais versement</label><input type="number" className="input-field" value={p.frais_sur_versement} step={0.1} onChange={h('frais_sur_versement')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Frais arbitrage</label><input type="number" className="input-field" value={p.frais_arbitrage} step={0.1} onChange={h('frais_arbitrage')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Arbitrages/an</label><input type="number" className="input-field" value={p.nb_arbitrages_par_an} step={1} onChange={h('nb_arbitrages_par_an')} /></div>
        </div>
      </div>
      <div className="text-center mb-6"><button className="btn-primary" onClick={submit} disabled={loading}>{loading ? '⏳ Calcul...' : "🚀 Calculer l'impact"}</button></div>
      {res && (
        <div className="result-card">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">📊 Résultats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200"><h4 className="font-semibold text-green-800 mb-2">Capital sans frais</h4><div className="text-2xl font-bold text-green-600">{fmtEur(res.capital_sans_frais)}</div></div>
            <div className="bg-red-50 p-6 rounded-lg border border-red-200"><h4 className="font-semibold text-red-800 mb-2">Capital avec frais</h4><div className="text-2xl font-bold text-red-600">{fmtEur(res.capital_avec_frais)}</div></div>
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200"><h4 className="font-semibold text-orange-800 mb-2">Coût des frais</h4><div className="text-2xl font-bold text-orange-600">{fmtEur(res.difference)}</div><div className="text-sm text-orange-600 mt-1">Impact: {fmtPct(res.impact_sur_rendement)}</div></div>
          </div>
          <div className="mb-6"><h4 className="text-xl font-semibold mb-4 text-gray-800">📈 Évolution</h4><div ref={chartRef} style={{ height: 400 }} /></div>
          <div className="mb-6"><h4 className="text-xl font-semibold mb-4 text-gray-800">🧩 Répartition</h4><div ref={feesRef} style={{ height: 320 }} /></div>
          <div className="mb-8 bg-white p-6 rounded-lg border"><h4 className="text-xl font-semibold mb-4 text-gray-800">🧠 Analyse</h4><p className="text-gray-700">Sans frais: {fmtEur(res.capital_sans_frais)} vs avec frais: {fmtEur(res.capital_avec_frais)}. Coût cumulé: {fmtEur(res.difference)}.</p><ul className="list-disc pl-6 mt-2 text-gray-700"><li>Négociez les frais sur versements (0% possible)</li><li>Privilégiez les UC à faible coût (ETF)</li><li>Limitez la GSM si frais &gt; 1.5%/an</li></ul></div>
          <div className="text-center"><button onClick={() => window.print()} className="btn-secondary">🖨️ Imprimer</button></div>
        </div>
      )}
    </div>
  )
}

// TAB RACHAT
function TabRachat({ r }: { r: boolean }) {
  const [mode, setMode] = useState('automatique')
  const [p, setP] = useState({ valeur_contrat: 50000, versements: 40000, montant_rachat: 15000, anciennete: 'plus8', versements_avant_2017: true, revenu_net_imposable: 45000, statut: 'celibataire', enfants: 0, tmi: 30, primes_post_2017_sous_150: 0, primes_post_2017_sur_150: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<any>(null)
  const [showGlossary, setShowGlossary] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const h = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP(x => ({ ...x, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
  const submit = async () => { setError(''); setLoading(true); setRes(null); try { const d = await fetchAPI('rachat', { ...p, mode_tmi: mode } as Record<string, unknown>); setRes(d.data) } catch (e) { setError(e instanceof Error ? e.message : 'Erreur') } finally { setLoading(false) } }
  useEffect(() => { if (!res || !chartRef.current) return; const P = (window as { Plotly?: { newPlot: (...args: unknown[]) => void } }).Plotly; if (!P) return; P.newPlot(chartRef.current, [{ x: ['Net PFU', 'Net IR'], y: [res.net_pfu, res.net_ir], type: 'bar', marker: { color: ['#10b981', '#3b82f6'] } }], { title: 'Montants nets perçus', height: 280, margin: { t: 40, r: 20, b: 40, l: 60 }, yaxis: { tickformat: ',.0f' }, paper_bgcolor: 'transparent' }, { displayModeBar: false, responsive: true }) }, [res])
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">💰 Simulation fiscale de rachat</h2>
      <p className="text-gray-600 mb-8 text-lg">Optimisez la fiscalité de votre rachat en comparant le PFU/PFL et le barème IR.</p>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📋 Caractéristiques du contrat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur du contrat (€)</label><input type="number" className="input-field" value={p.valeur_contrat} min={0} step={100} onChange={h('valeur_contrat')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Total versements (€)</label><input type="number" className="input-field" value={p.versements} min={0} step={100} onChange={h('versements')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Montant rachat (€)</label><input type="number" className="input-field" value={p.montant_rachat} min={0} step={100} onChange={h('montant_rachat')} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Ancienneté</label><select className="input-field" value={p.anciennete} onChange={h('anciennete')}><option value="moins4">Moins de 4 ans</option><option value="4a8">Entre 4 et 8 ans</option><option value="plus8">Plus de 8 ans</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Versements avant 27/09/2017</label><select className="input-field" value={p.versements_avant_2017 ? 'true' : 'false'} onChange={(e) => setP(x => ({ ...x, versements_avant_2017: e.target.value === 'true' }))}><option value="true">Oui</option><option value="false">Non</option></select></div>
        </div>
        {p.anciennete === 'plus8' && !p.versements_avant_2017 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Primes post-2017 ≤ 150k€</label><input type="number" className="input-field" value={p.primes_post_2017_sous_150} min={0} onChange={h('primes_post_2017_sous_150')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Primes post-2017 &gt; 150k€</label><input type="number" className="input-field" value={p.primes_post_2017_sur_150} min={0} onChange={h('primes_post_2017_sur_150')} /></div>
          </div>
        )}
      </div>
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">🧾 Situation fiscale</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Mode TMI</label><select className="input-field" value={mode} onChange={(e) => setMode(e.target.value)}><option value="automatique">Automatique</option><option value="manuel">Manuel</option></select></div>
          {mode === 'manuel' && <div><label className="block text-sm font-medium text-gray-700 mb-2">TMI (%)</label><input type="number" className="input-field" value={p.tmi} min={0} max={45} onChange={h('tmi')} /></div>}
        </div>
        {mode === 'automatique' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Revenu imposable (€)</label><input type="number" className="input-field" value={p.revenu_net_imposable} min={0} onChange={h('revenu_net_imposable')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Statut</label><select className="input-field" value={p.statut} onChange={h('statut')}><option value="celibataire">Célibataire</option><option value="couple">Couple</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Enfants</label><input type="number" className="input-field" value={p.enfants} min={0} onChange={h('enfants')} /></div>
          </div>
        )}
      </div>
      <div className="text-center mb-6"><button className="btn-primary" onClick={submit} disabled={loading}>{loading ? '⏳ Calcul...' : "🧮 Calculer l'optimisation"}</button></div>
      {res && (
        <div className="result-card">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">📊 Résultats</h3>
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6"><div className="text-blue-800 font-semibold mb-2">💡 Recommandation</div><div className="text-blue-700">{res.message}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200"><h4 className="font-semibold text-green-800 mb-2">Prélèvements sociaux</h4><div className="text-2xl font-bold text-green-600">{fmtEur(res.pso)}</div><div className="text-sm text-green-600 mt-1">17,2% sur plus-values</div></div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200"><h4 className="font-semibold text-blue-800 mb-2">Abattement (&gt;8 ans)</h4><div className="text-sm text-blue-700">Droit: {fmtEur(res.abattement_max)} • Utilisé: {fmtEur(res.abattement)}</div><div className="w-full h-3 bg-blue-100 rounded-full mt-2"><div className="h-3 bg-blue-600 rounded-full" style={{ width: `${res.abattement_max > 0 ? Math.min(100, (res.abattement / res.abattement_max) * 100) : 0}%` }} /></div></div>
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200"><h4 className="font-semibold text-orange-800 mb-2">Gains imposables</h4><div className="text-2xl font-bold text-orange-600">{fmtEur(res.base_taxable)}</div><div className="text-sm text-orange-600 mt-1">TMI: {fmtPct(res.tmi_calculee)}</div></div>
          </div>
          <div className="mb-8 bg-white p-6 rounded-lg border">
            <h4 className="text-xl font-semibold mb-4 text-gray-800">📈 Comparaison PFU vs IR</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div><div className="font-semibold mb-2">Option PFU/PFL</div><div>Gains: {fmtEur(res.part_interets)}</div><div>Impôt PFU: {fmtEur(res.impot_pfu)}</div><div className="font-bold mt-1 text-green-600">Net: {fmtEur(res.net_pfu)}</div></div>
              <div><div className="font-semibold mb-2">Option Barème IR</div><div>Base IR: {fmtEur(res.base_taxable)}</div><div>Impôt IR: {fmtEur(res.impot_ir)}</div><div className="font-bold mt-1 text-blue-600">Net: {fmtEur(res.net_ir)}</div></div>
            </div>
            <div className="mt-6" ref={chartRef} style={{ height: 280 }} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm"><div className="text-green-700">Économie PFU: {fmtEur(res.economie_pfu)}</div><div className="text-blue-700">Économie IR: {fmtEur(res.economie_ir)}</div></div>
          </div>
          {res.alertes?.length > 0 && <div className="mb-6"><h4 className="text-xl font-semibold mb-4 text-orange-600">⚠️ Alertes</h4><ul className="list-disc pl-6">{res.alertes.map((a: string, i: number) => <li key={i} className="text-orange-700">{a}</li>)}</ul></div>}
          {res.conseils?.length > 0 && <div className="mb-8"><h4 className="text-xl font-semibold mb-4 text-green-600">💡 Conseils</h4><ul className="list-disc pl-6">{res.conseils.map((c: string, i: number) => <li key={i} className="text-green-700">{c}</li>)}</ul></div>}
          <div className="mb-8"><button className="text-sm text-gray-700 underline" onClick={() => setShowGlossary(v => !v)}>{showGlossary ? 'Masquer' : 'Glossaire (PFU, IR, TMI)'}</button>{showGlossary && <ul className="mt-2 text-sm text-gray-700 list-disc pl-6"><li><b>PFU</b>: impôt forfaitaire (taux fixe)</li><li><b>IR</b>: barème progressif</li><li><b>TMI</b>: tranche marginale</li><li><b>PS</b>: 17,2% sur gains</li></ul>}</div>
          <div className="text-center"><button onClick={() => window.print()} className="btn-secondary">🖨️ Imprimer</button></div>
        </div>
      )}
    </div>
  )
}

// TAB DECES
const lienOptions = [{ value: 'conjoint', label: 'Conjoint' }, { value: 'enfant', label: 'Enfant' }, { value: 'petit-enfant', label: 'Petit-enfant' }, { value: 'frere-soeur', label: 'Frère/Sœur' }, { value: 'neveu-niece', label: 'Neveu/Nièce' }, { value: 'autre', label: 'Autre' }]

function TabDeces() {
  const [p, setP] = useState({ valeur_contrat: 100000, primes_avant_70: 80000, primes_apres_70: 0, primes_avant_1998: 0, contrat_avant_1991: false, clause_type: 'standard', usufruitier_nom: 'Usufruitier', usufruitier_age: 70 })
  const [nbEnfants, setNbEnfants] = useState(2)
  const [benefs, setBenefs] = useState([{ id: Date.now(), nom: 'Bénéficiaire 1', lien_parente: 'enfant', quotite: 100 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<any>(null)
  const h = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP(x => ({ ...x, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
  const addB = () => setBenefs(l => [...l, { id: Date.now(), nom: `Bénéficiaire ${l.length + 1}`, lien_parente: 'enfant', quotite: 0 }])
  const remB = (id: number) => setBenefs(l => l.filter(b => b.id !== id))
  const updB = (id: number, k: string, v: string | number) => setBenefs(l => l.map(b => b.id === id ? { ...b, [k]: v } : b))
  const submit = async () => {
    setError(''); setRes(null)
    if (p.valeur_contrat <= 0) { setError('Valeur > 0 requise'); return }
    if (p.clause_type === 'personnalisee' && Math.abs(benefs.reduce((s, b) => s + Number(b.quotite), 0) - 100) > 0.01) { setError('Quotités doivent = 100%'); return }
    let payload: Record<string, unknown>[] = []
    if (p.clause_type === 'standard') payload = [{ nom: 'Conjoint', lien_parente: 'conjoint', quotite: 100, type_clause: 'standard' }]
    else if (p.clause_type === 'demembree') payload = Array.from({ length: nbEnfants }).map((_, i) => ({ nom: `Enfant ${i + 1}`, lien_parente: 'enfant', quotite: 100 / nbEnfants, type_clause: 'demembree', usufruitier: { nom: p.usufruitier_nom, age: p.usufruitier_age } }))
    else payload = benefs.map(b => ({ nom: b.nom, lien_parente: b.lien_parente, quotite: b.quotite, type_clause: 'standard' }))
    try { setLoading(true); const d = await fetchAPI('deces', { valeur_contrat: p.valeur_contrat, primes_avant_70: p.primes_avant_70, primes_apres_70: p.primes_apres_70, patrimoine_net_taxable: 0, contrat_avant_1991: p.contrat_avant_1991, primes_avant_1998: p.primes_avant_1998, clause_type: p.clause_type === 'personnalisee' ? 'standard' : p.clause_type, beneficiaires: payload }); setRes(d.data) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-8">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">👨‍👩‍👧‍👦 Simulation des droits de succession</h2>
      <p className="text-gray-600 mb-8 text-lg">Analysez l'impact fiscal de la transmission selon les régimes 990I et 757B.</p>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      <div className="allocation-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📋 Caractéristiques du contrat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur contrat (€)</label><input type="number" className="input-field" value={p.valeur_contrat} min={0} step={1000} onChange={h('valeur_contrat')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Primes avant 70 ans (€)</label><input type="number" className="input-field" value={p.primes_avant_70} min={0} step={1000} onChange={h('primes_avant_70')} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Primes après 70 ans (€)</label><input type="number" className="input-field" value={p.primes_apres_70} min={0} step={1000} onChange={h('primes_apres_70')} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Contrat avant 20/11/1991</label><select className="input-field" value={p.contrat_avant_1991 ? 'true' : 'false'} onChange={(e) => setP(x => ({ ...x, contrat_avant_1991: e.target.value === 'true' }))}><option value="false">Non</option><option value="true">Oui</option></select></div>
          {p.contrat_avant_1991 && <div><label className="block text-sm font-medium text-gray-700 mb-2">Primes avant 13/10/1998 (€)</label><input type="number" className="input-field" value={p.primes_avant_1998} min={0} step={1000} onChange={h('primes_avant_1998')} /><div className="text-xs text-green-600 mt-1">Exonérées de droits</div></div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Type de clause</label><select className="input-field" value={p.clause_type} onChange={h('clause_type')}><option value="standard">Standard (conjoint)</option><option value="demembree">Démembrée</option><option value="personnalisee">Personnalisée</option></select></div>
        </div>
        {p.clause_type === 'demembree' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom usufruitier</label><input type="text" className="input-field" value={p.usufruitier_nom} onChange={h('usufruitier_nom')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Âge usufruitier</label><input type="number" className="input-field" value={p.usufruitier_age} min={0} max={120} onChange={h('usufruitier_age')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Nb nus-propriétaires</label><input type="number" className="input-field" value={nbEnfants} min={1} onChange={(e) => setNbEnfants(Number(e.target.value) || 1)} /></div>
          </div>
        )}
      </div>
      {p.clause_type === 'personnalisee' && (
        <div className="allocation-card mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">👥 Bénéficiaires</h3>
          {benefs.map((b) => (
            <div key={b.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom</label><input type="text" className="input-field" value={b.nom} onChange={(e) => updB(b.id, 'nom', e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Lien</label><select className="input-field" value={b.lien_parente} onChange={(e) => updB(b.id, 'lien_parente', e.target.value)}>{lienOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Quotité (%)</label><input type="number" className="input-field" value={b.quotite} min={0} max={100} onChange={(e) => updB(b.id, 'quotite', Number(e.target.value))} /></div>
                <div className="flex items-end"><button className="btn-secondary w-full" onClick={() => remB(b.id)}>🗑️</button></div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between"><button className="btn-secondary" onClick={addB}>➕ Ajouter</button><span className="text-sm text-gray-600">Total: {benefs.reduce((s, b) => s + Number(b.quotite), 0)}%</span></div>
        </div>
      )}
      <div className="text-center mb-6"><button className="btn-primary" onClick={submit} disabled={loading}>{loading ? '⏳ Calcul...' : '⚖️ Calculer les droits'}</button></div>
      {res && (
        <div className="result-card">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">⚖️ Résultats</h3>
          {res.messages?.length > 0 && <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6 text-blue-800">{res.messages.map((m: string, i: number) => <p key={i}>{m}</p>)}</div>}
          {res.alertes?.length > 0 && <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg mb-6"><h4 className="font-semibold text-orange-800 mb-2">⚠️ Points d'attention</h4>{res.alertes.map((a: string, i: number) => <p key={i} className="text-orange-700">{a}</p>)}</div>}
          {res.primes_exonerees > 0 && <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6"><h4 className="font-semibold text-green-800 mb-2">✅ Primes exonérées</h4><p className="text-green-700">{fmtEur(res.primes_exonerees)} de primes versées avant le 13/10/1998 sont totalement exonérées (contrat avant 1991).</p></div>}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-4 text-gray-800">👥 Par bénéficiaire</h4>
            {res.resultats?.map((b: any, i: number) => (
              <div key={i} className="bg-gray-50 p-6 rounded-lg border mb-4">
                <div className="flex justify-between items-center mb-4"><h5 className="text-lg font-semibold">{b.nom}</h5><span className="text-sm text-gray-600">{b.lien_parente} | {b.quotite}%</span></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div><div className="text-sm text-gray-600">Capital brut</div><div className="text-lg font-bold text-green-600">{fmtEur(b.montant_brut)}</div></div>
                  <div><div className="text-sm text-gray-600">Reçu</div><div className="text-lg font-bold text-purple-600">{fmtEur(b.montant_recu)}</div></div>
                  <div><div className="text-sm text-gray-600">Impôt</div><div className="text-lg font-bold text-red-600">{fmtEur(b.impot_total)}</div></div>
                  <div><div className="text-sm text-gray-600">Net</div><div className="text-lg font-bold text-blue-600">{fmtEur(b.montant_net)}</div></div>
                  <div><div className="text-sm text-gray-600">Taux</div><div className="text-lg font-bold text-orange-600">{fmtPct(b.taux_imposition)}</div></div>
                </div>
                {b.is_exonere_tepa && <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-400 text-green-800"><b>✅ Exonération TEPA</b> - Conjoint totalement exonéré</div>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200"><h4 className="font-semibold text-red-800 mb-2">Total droits</h4><div className="text-2xl font-bold text-red-600">{fmtEur(res.total_impot)}</div></div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200"><h4 className="font-semibold text-green-800 mb-2">Total net</h4><div className="text-2xl font-bold text-green-600">{fmtEur(res.total_net)}</div></div>
          </div>
          <div className="mb-8 bg-white p-6 rounded-lg border">
            <h4 className="text-xl font-semibold mb-4 text-gray-800">📚 Régimes fiscaux</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg"><b>Art. 990 I</b> (primes avant 70 ans)<br />• Abattement: 152 500 €/bénéficiaire<br />• Taux: 20% puis 31.25% au-delà de 700k€</div>
              <div className="bg-yellow-50 p-4 rounded-lg"><b>Art. 757 B</b> (primes après 70 ans)<br />• Abattement global: 30 500 €<br />• Droits de succession classiques sur primes</div>
            </div>
          </div>
          <div className="text-center"><button onClick={() => window.print()} className="btn-secondary">🖨️ Imprimer</button></div>
        </div>
      )}
    </div>
  )
}
