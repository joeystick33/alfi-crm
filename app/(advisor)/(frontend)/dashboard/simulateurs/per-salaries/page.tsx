'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePlotlyReady } from '../immobilier/_hooks/usePlotlyReady'
import { ExportSimulationActions } from '@/app/(advisor)/(frontend)/components/simulateurs/ExportSimulationActions'
import {
  Lightbulb, Calendar, Wallet, BarChart3, AlertTriangle, CheckCircle,
  Target, Info, Gem, Briefcase, FileText,
} from 'lucide-react'
import { 
  BAREME_IR_2025, 
  PLAFONDS_EPARGNE_RETRAITE, 
  PRELEVEMENTS_SOCIAUX,
  PER_SALARIES
} from '../parameters'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// =============================================================================
// PARAMÈTRES LOCAUX DÉRIVÉS (pour compatibilité)
// =============================================================================
const PARAMS = {
  PASS: PLAFONDS_EPARGNE_RETRAITE.PASS,
  PASS_N_MOINS_1: RULES.retraite.pass_n_moins_1,
  PLAFOND_MIN_PER: PLAFONDS_EPARGNE_RETRAITE.PLANCHER,
  PLAFOND_MAX_PER: PLAFONDS_EPARGNE_RETRAITE.PLAFOND_MAX,
  TAUX_CHARGES: PER_SALARIES.TAUX_CHARGES_SALARIALES,
  TAUX_FRAIS_PRO: 0.10,
  BAREME_IR: BAREME_IR_2025.map(t => ({ ...t, label: `${t.taux * 100}%` })),
  RENDEMENT_AV: { prudent: 0.025, equilibre: 0.04, dynamique: 0.06 },
  RENDEMENT_PER: { prudent: 0.025, equilibre: 0.045, dynamique: 0.065 },
  PFU: RULES.ps.pfu_total,
  PS_RENTE: PRELEVEMENTS_SOCIAUX.TOTAL,
}

// =============================================================================
// STYLES
// =============================================================================
const styles = `
  :root { --pri: #1e40af; --pril: #3b82f6; --suc: #059669; --warn: #d97706; --err: #dc2626; --bg: #ffffff; --bgm: #f8fafc; --brd: #e2e8f0; --txt: #1e293b; --txtm: #64748b; }
  .pw { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
  .ph { margin-bottom: 2rem; }
  .ph h1 { font-size: 1.75rem; font-weight: 700; color: var(--txt); margin: .5rem 0; }
  .ph p { color: var(--txtm); font-size: .95rem; }
  .steps { display: flex; gap: .5rem; margin-bottom: 2rem; background: var(--bgm); padding: 1rem; border-radius: 1rem; overflow-x: auto; }
  .step { flex: 1; min-width: 100px; padding: .75rem .5rem; border-radius: .75rem; cursor: pointer; transition: all .25s; border: 2px solid transparent; text-align: center; }
  .step:hover { background: #fff; transform: translateY(-2px); }
  .step.active { background: #fff; border-color: var(--pri); box-shadow: 0 4px 12px rgba(30,64,175,.15); }
  .step.done { background: #eff6ff; border-color: var(--pri); }
  .step.locked { opacity: .5; cursor: not-allowed; }
  .step-n { font-size: 1.3rem; font-weight: 700; }
  .step.active .step-n { color: var(--pri); }
  .step.done .step-n { color: var(--suc); }
  .step-t { font-size: .75rem; font-weight: 600; margin-top: .25rem; }
  .step-d { font-size: .65rem; color: var(--txtm); }
  .card { background: var(--bg); border: 1px solid var(--brd); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; animation: slideUp .4s ease-out; }
  .card-p { border-left: 4px solid var(--pri); }
  .card-s { border-left: 4px solid var(--suc); }
  .card-w { border-left: 4px solid var(--warn); }
  .card-t { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .narr { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 1.25rem; border-radius: .75rem; border: 1px solid #bae6fd; margin-bottom: 1rem; }
  .narr-t { font-weight: 600; color: #0369a1; margin-bottom: .5rem; }
  .narr-x { color: #0c4a6e; font-size: .9rem; line-height: 1.6; }
  .fg { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
  .fgrp { display: flex; flex-direction: column; gap: .25rem; }
  .flbl { font-size: .8rem; font-weight: 500; color: var(--txt); }
  .finp { padding: .6rem .75rem; border: 1px solid var(--brd); border-radius: .5rem; font-size: .95rem; transition: all .2s; }
  .finp:focus { outline: none; border-color: var(--pri); box-shadow: 0 0 0 3px rgba(30,64,175,.1); }
  .fh { font-size: .7rem; color: var(--txtm); }
  .iw { position: relative; }
  .iw .finp { width: 100%; padding-right: 3rem; }
  .sfx { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); font-size: .8rem; color: var(--txtm); }
  .fsel { padding: .6rem .75rem; border: 1px solid var(--brd); border-radius: .5rem; font-size: .95rem; background: #fff; width: 100%; }
  .btn { background: linear-gradient(135deg, var(--pri) 0%, #2563eb 100%); color: #fff; padding: .75rem 2rem; border-radius: .5rem; font-weight: 600; cursor: pointer; border: none; transition: all .25s; box-shadow: 0 2px 8px rgba(30,64,175,.25); }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(30,64,175,.35); }
  .btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-o { background: transparent; border: 2px solid var(--pri); color: var(--pri); box-shadow: none; }
  .btn-s { background: linear-gradient(135deg, var(--suc) 0%, #10b981 100%); }
  .btns { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .kpi { background: var(--bgm); padding: 1rem; border-radius: .75rem; text-align: center; transition: all .25s; }
  .kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
  .kpi-v { font-size: 1.3rem; font-weight: 700; color: var(--pri); }
  .kpi-l { font-size: .7rem; color: var(--txtm); margin-top: .25rem; }
  .kpi.suc .kpi-v { color: var(--suc); }
  .gauge { margin: 1.5rem 0; }
  .gauge-bar { height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
  .gauge-fill { height: 100%; background: linear-gradient(90deg, var(--pri) 0%, #3b82f6 100%); border-radius: 5px; transition: width .6s ease-out; }
  .gauge-labels { display: flex; justify-content: space-between; margin-top: .5rem; font-size: .7rem; color: var(--txtm); }
  .chart-box { background: #fafbfc; border: 1px solid var(--brd); border-radius: 1rem; padding: 1rem; margin: 1rem 0; }
  .chart { height: 300px; }
  .tbox { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; padding: 1rem; border-radius: .75rem; font-size: .9rem; color: #065f46; margin: 1rem 0; }
  .wbox { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; padding: 1rem; border-radius: .75rem; font-size: .9rem; color: #92400e; margin: 1rem 0; }
  .ibox { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 1rem; border-radius: .75rem; font-size: .9rem; color: #1e40af; margin: 1rem 0; }
  .compare { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: .5rem; align-items: center; margin: 1.5rem 0; }
  .compare-box { text-align: center; padding: 1rem; background: var(--bgm); border: 1px solid var(--brd); border-radius: .75rem; }
  .compare-v { font-size: 1.4rem; font-weight: 700; }
  .compare-l { font-size: .75rem; color: var(--txtm); }
  .compare-op { font-size: 1.3rem; color: var(--txtm); }
  .compare-box.pri .compare-v { color: var(--pri); }
  .compare-box.suc .compare-v { color: var(--suc); }
  .synth { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 1rem 0; }
  .synth-card { background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%); border: 1px solid #bae6fd; border-radius: 1rem; padding: 1.25rem; }
  .synth-card h4 { font-size: .9rem; font-weight: 600; color: var(--pri); margin-bottom: .75rem; }
  .synth-card .synth-v { font-size: 1.6rem; font-weight: 700; color: var(--txt); }
  .synth-card .synth-l { font-size: .8rem; color: var(--txtm); margin-top: .5rem; }
  .synth-card.green { background: linear-gradient(135deg, #ecfdf5 0%, #fff 100%); border-color: #a7f3d0; }
  .synth-card.green h4 { color: var(--suc); }
  .synth-card.gold { background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); border-color: #fde68a; }
  .synth-card.gold h4 { color: var(--warn); }
  .recs { display: flex; flex-direction: column; gap: .5rem; margin-top: 1rem; }
  .rec { padding: .75rem 1rem; border-radius: .5rem; font-size: .85rem; display: flex; gap: .5rem; }
  .rec.m { background: #fffbeb; border-left: 3px solid var(--warn); }
  .rec.b { background: #ecfdf5; border-left: 3px solid var(--suc); }
  .rec.i { background: #eff6ff; border-left: 3px solid var(--pri); }
  .sortie-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; }
  .sortie-opt { background: #fff; border: 2px solid var(--brd); border-radius: .75rem; padding: 1rem; cursor: pointer; transition: all .2s; text-align: center; }
  .sortie-opt:hover { border-color: var(--pri); }
  .sortie-opt.active { border-color: var(--pri); background: #eff6ff; }
  .sortie-opt h5 { font-size: .9rem; font-weight: 600; margin-bottom: .25rem; }
  .sortie-opt p { font-size: .75rem; color: var(--txtm); }
  .mode-opts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .mode-opt { background: #fff; border: 2px solid var(--brd); border-radius: .75rem; padding: 1.25rem; cursor: pointer; transition: all .2s; }
  .mode-opt:hover { border-color: var(--pri); transform: translateY(-2px); }
  .mode-opt.active { border-color: var(--pri); background: linear-gradient(135deg, #eff6ff 0%, #fff 100%); box-shadow: 0 4px 12px rgba(30,64,175,.1); }
  .mode-opt h5 { font-size: 1rem; font-weight: 600; margin-bottom: .5rem; display: flex; align-items: center; gap: .5rem; }
  .mode-opt p { font-size: .85rem; color: var(--txtm); line-height: 1.5; }
  .tbl { width: 100%; border-collapse: collapse; font-size: .85rem; margin: 1rem 0; }
  .tbl th, .tbl td { padding: .6rem; text-align: left; border-bottom: 1px solid var(--brd); }
  .tbl th { background: var(--bgm); font-weight: 600; }
  .tbl .num { text-align: right; }
  .tbl .pri { color: var(--pri); font-weight: 600; }
  .tbl .suc { color: var(--suc); font-weight: 600; }
  .tbl .err { color: var(--err); }
  @media (max-width: 768px) { .steps { flex-direction: column; } .compare { grid-template-columns: 1fr; } .compare-op { display: none; } .sortie-opts { grid-template-columns: 1fr; } }
`

// =============================================================================
// FONCTIONS DE CALCUL
// =============================================================================
const toNetPro = (type: string, m: number) => type === 'brut' ? m * (1 - PARAMS.TAUX_CHARGES) * (1 - PARAMS.TAUX_FRAIS_PRO) : m * (1 - PARAMS.TAUX_FRAIS_PRO)
const getTMI = (r: number) => { for (const t of PARAMS.BAREME_IR) { if (r <= t.max) return t } return PARAMS.BAREME_IR[4] }
const getPlafond = (r: number, rep: number) => Math.max(PARAMS.PLAFOND_MIN_PER, Math.min(r * 0.1, PARAMS.PLAFOND_MAX_PER)) + rep
const calcImpact = (v: number, p: number, tmi: number) => ({ eco: Math.min(v, p) * tmi, net: v - Math.min(v, p) * tmi, util: p > 0 ? Math.min(100, v / p * 100) : 0, depasse: v > p })

const projPER = (cap: number, mens: number, dur: number, rend: number, tmi: number) => {
  let c = cap, tv = cap, te = 0; const proj: { a: number; c: number; v: number }[] = []
  for (let i = 0; i <= dur; i++) {
    if (i > 0) { const va = mens * 12; tv += va; te += va * tmi; c += va; c *= 1 + rend }
    proj.push({ a: i, c: Math.round(c), v: Math.round(tv) })
  }
  return { cap: Math.round(c), vers: Math.round(tv), pv: Math.round(c - tv), eco: Math.round(te), proj }
}

const projAV = (eco: number, dur: number, rend: number) => {
  let c = 0, tv = 0; const proj: { a: number; c: number; v: number }[] = []
  for (let i = 0; i <= dur; i++) {
    if (i > 0) { c += eco; tv += eco; c *= 1 + rend }
    proj.push({ a: i, c: Math.round(c), v: Math.round(tv) })
  }
  return { cap: Math.round(c), vers: Math.round(tv), pv: Math.round(c - tv), proj }
}

const calcSortie = (cap: number, pv: number, vers: number, type: string, tmiR: number, age: number) => {
  const partImp = age >= 70 ? 0.30 : age >= 60 ? 0.40 : 0.50
  if (type === 'capital') {
    const impV = vers * tmiR, impPV = pv * PARAMS.PFU, tot = impV + impPV
    return { type: 'capital', brut: cap, impV, impPV, tot, net: cap - tot }
  }
  if (type === 'rente') {
    const rB = cap * 0.04, rImp = rB * partImp, imp = rImp * tmiR + rB * PARAMS.PS_RENTE, rN = rB - imp
    return { type: 'rente', rBrut: rB, rNet: rN, rNetM: rN / 12, part: partImp * 100 }
  }
  // mixte
  const impV = vers / 2 * tmiR, impPV = pv / 2 * PARAMS.PFU, totC = impV + impPV, netC = cap / 2 - totC
  const rB = cap / 2 * 0.04, rImp = rB * partImp, impR = rImp * tmiR + rB * PARAMS.PS_RENTE, rN = rB - impR
  return { type: 'mixte', brut: cap / 2, netC, rNetM: rN / 12 }
}

const eur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)

// =============================================================================
// COMPOSANT
// =============================================================================
export default function SimulateurPERSalariePage() {
  usePlotlyReady()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ type: 'brut', rev: 55000, modeVers: 'periodique' as 'ponctuel' | 'periodique', versPonctuel: 5000, versMensuel: 400, versInitial: 0, usePl: false, plRep: 0 })
  const [proj, setProj] = useState({ age: 40, ageR: 64, cap: 0, profil: 'equilibre' })
  const [av, setAv] = useState({ use: true, profil: 'equilibre' })
  const [sortie, setSortie] = useState({ type: 'capital', tmiR: 0.11 })
  const [res1, setRes1] = useState<{ np: number; tmi: number; tmiL: string; pl: number; eco: number; modeVers: string; versAnnuel: number } | null>(null)
  const [res2, setRes2] = useState<{ cap: number; vers: number; pv: number; eco: number; proj: { a: number; c: number; v: number }[] } | null>(null)
  const [res3, setRes3] = useState<{ cap: number; vers: number; pv: number; proj: { a: number; c: number; v: number }[] } | null>(null)
  const [res4, setRes4] = useState<Record<string, unknown> | null>(null)

  const c1 = useMemo(() => {
    const np = toNetPro(form.type, form.rev)
    const tmi = getTMI(np)
    const pl = getPlafond(np, form.usePl ? form.plRep : 0)
    // Versement annuel selon le mode (pour l'année N)
    const versAnnuel = form.modeVers === 'ponctuel' 
      ? form.versPonctuel 
      : form.versMensuel * 12 + form.versInitial
    const imp = calcImpact(versAnnuel, pl, tmi.taux)
    return { np, tmi, pl, imp, versAnnuel, modeVers: form.modeVers, versInitial: form.versInitial }
  }, [form])

  const c2 = useMemo(() => {
    if (!res1) return null
    const dur = proj.ageR - proj.age
    if (dur <= 0) return null
    const rend = PARAMS.RENDEMENT_PER[proj.profil as keyof typeof PARAMS.RENDEMENT_PER]
    // Si ponctuel: capital initial = versement ponctuel + existant, mensuel = 0
    // Si périodique: capital initial = existant + versement initial, mensuel = versement mensuel
    const capInit = res1.modeVers === 'ponctuel' 
      ? form.versPonctuel + proj.cap 
      : proj.cap + form.versInitial
    const mens = res1.modeVers === 'ponctuel' ? 0 : form.versMensuel
    return projPER(capInit, mens, dur, rend, res1.tmi)
  }, [proj, res1, form.versPonctuel, form.versMensuel, form.versInitial])

  const c3 = useMemo(() => {
    if (!res1 || !res2 || !av.use) return null
    const dur = proj.ageR - proj.age
    const rend = PARAMS.RENDEMENT_AV[av.profil as keyof typeof PARAMS.RENDEMENT_AV]
    return projAV(res1.eco, dur, rend)
  }, [av, res1, res2, proj])

  const c4 = useMemo(() => {
    if (!res2) return null
    return calcSortie(res2.cap, res2.pv, res2.vers, sortie.type, sortie.tmiR, proj.ageR)
  }, [sortie, res2, proj.ageR])

  const v1 = () => { setRes1({ np: c1.np, tmi: c1.tmi.taux, tmiL: c1.tmi.label, pl: c1.pl, eco: c1.imp.eco, modeVers: c1.modeVers, versAnnuel: c1.versAnnuel }); setStep(2) }
  const v2 = () => { if (c2) { setRes2(c2); setStep(3) } }
  const v3 = () => { setRes3(c3); setStep(4) }
  const v4 = () => { if (c4) { setRes4(c4); setStep(5) } }

  const drawChart = (id: string, data: { a: number; c: number; v: number }[], col: string) => {
     
    if (typeof window !== 'undefined' && (window as any).Plotly && data?.length) {
      const x = data.map(d => d.a), y1 = data.map(d => d.c), y2 = data.map(d => d.v)
       
      ;(window as any).Plotly.newPlot(id, [
        { x, y: y1, name: 'Capital', type: 'scatter', fill: 'tozeroy', fillcolor: col + '15', line: { color: col, width: 3, shape: 'spline' } },
        { x, y: y2, name: 'Versements', type: 'scatter', line: { color: '#94a3b8', width: 2, dash: 'dot' } }
      ], {
        margin: { t: 10, r: 20, b: 40, l: 60 }, xaxis: { title: 'Années', gridcolor: '#f1f5f9' }, yaxis: { title: '€', tickformat: ',.0f', gridcolor: '#f1f5f9' },
        legend: { orientation: 'h', y: -0.15 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', hovermode: 'x unified'
      }, { responsive: true, displayModeBar: false })
    }
  }

  useEffect(() => { if (step === 2 && c2?.proj) setTimeout(() => drawChart('ch1', c2.proj, '#1e40af'), 100) }, [step, c2])
  useEffect(() => { if (step === 3 && c3?.proj) setTimeout(() => drawChart('ch2', c3.proj, '#059669'), 100) }, [step, c3])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <main className="pw">
        <div className="ph">
          <Link href="/dashboard/simulateurs" style={{ fontSize: '11px', color: '#64748b', textDecoration: 'none' }}>← Retour</Link>
          <h1>Simulateur PER Salarié</h1>
          <p>Économie d'impôt, projection de capital, remploi en AV et fiscalité à la sortie</p>
        </div>

        <div className="steps">
          {[{ n: 1, t: 'Impact Fiscal', d: 'Économie', r: res1 }, { n: 2, t: 'Projection', d: 'Capital', r: res2, l: !res1 }, { n: 3, t: 'Remploi AV', d: 'Bonus', r: res3, l: !res2 }, { n: 4, t: 'Sortie PER', d: 'Fiscalité', r: res4, l: !res2 }, { n: 5, t: 'Synthèse', d: 'Bilan', l: !res4 }].map(s => (
            <div key={s.n} className={`step ${step === s.n ? 'active' : ''} ${s.r ? 'done' : ''} ${s.l ? 'locked' : ''}`} onClick={() => !s.l && setStep(s.n)}>
              <div className="step-n">{s.r ? '✓' : s.n}</div>
              <div className="step-t">{s.t}</div>
              <div className="step-d">{s.d}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="card card-p">
            <h2 className="card-t">Étape 1 : Économie d'impôt immédiate</h2>
            <div className="narr"><div className="narr-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 16, height: 16 }} /> Comment ça marche ?</div><div className="narr-x">Chaque euro versé réduit votre revenu imposable. À 30% de TMI, 1 000€ versés = 300€ d'économie.</div></div>
            
            {/* Choix du mode de versement */}
            <h3 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '.75rem' }}>Type de versement</h3>
            <div className="mode-opts">
              <div className={`mode-opt ${form.modeVers === 'periodique' ? 'active' : ''}`} onClick={() => setForm({ ...form, modeVers: 'periodique' })}>
                <h5><Calendar style={{ width: 16, height: 16 }} /> Versements périodiques</h5>
                <p>Versements mensuels réguliers pour constituer un capital progressivement</p>
              </div>
              <div className={`mode-opt ${form.modeVers === 'ponctuel' ? 'active' : ''}`} onClick={() => setForm({ ...form, modeVers: 'ponctuel' })}>
                <h5><Wallet style={{ width: 16, height: 16 }} /> Versement ponctuel</h5>
                <p>Un versement unique cette année (prime, bonus, héritage...)</p>
              </div>
            </div>
            
            <div className="fg">
              <div className="fgrp"><label className="flbl">Type de revenu</label><select className="fsel" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="brut">Brut</option><option value="net">Net</option></select></div>
              <div className="fgrp"><label className="flbl">Revenu annuel</label><div className="iw"><input type="number" className="finp" value={form.rev} onChange={e => setForm({ ...form, rev: +e.target.value })} /><span className="sfx">€</span></div></div>
              
              {form.modeVers === 'periodique' ? (<>
                <div className="fgrp">
                  <label className="flbl">Versement mensuel</label>
                  <div className="iw"><input type="number" className="finp" value={form.versMensuel} onChange={e => setForm({ ...form, versMensuel: +e.target.value })} /><span className="sfx">€/mois</span></div>
                  <span className="fh">Soit {eur(form.versMensuel * 12)}/an</span>
                </div>
                <div className="fgrp">
                  <label className="flbl">Versement initial (optionnel)</label>
                  <div className="iw"><input type="number" className="finp" value={form.versInitial} onChange={e => setForm({ ...form, versInitial: +e.target.value })} /><span className="sfx">€</span></div>
                  <span className="fh">Apport unique au démarrage</span>
                </div>
              </>) : (
                <div className="fgrp">
                  <label className="flbl">Versement ponctuel</label>
                  <div className="iw"><input type="number" className="finp" value={form.versPonctuel} onChange={e => setForm({ ...form, versPonctuel: +e.target.value })} /><span className="sfx">€</span></div>
                  <span className="fh">Versement unique cette année</span>
                </div>
              )}
              
              <div className="fgrp"><label className="flbl"><input type="checkbox" checked={form.usePl} onChange={e => setForm({ ...form, usePl: e.target.checked })} /> Plafonds non utilisés</label>{form.usePl && <div className="iw"><input type="number" className="finp" value={form.plRep} onChange={e => setForm({ ...form, plRep: +e.target.value })} /><span className="sfx">€</span></div>}</div>
            </div>
            
            {form.rev > 0 && c1.versAnnuel > 0 && (<>
              <div className="kpis">
                <div className="kpi"><div className="kpi-v">{eur(c1.np)}</div><div className="kpi-l">Net fiscal</div></div>
                <div className="kpi"><div className="kpi-v">{c1.tmi.label}</div><div className="kpi-l">TMI</div></div>
                <div className="kpi"><div className="kpi-v">{eur(c1.pl)}</div><div className="kpi-l">Plafond</div></div>
                <div className="kpi suc"><div className="kpi-v">{eur(c1.imp.eco)}</div><div className="kpi-l">Économie</div></div>
              </div>
              <div className="gauge"><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.25rem' }}><span>Utilisation plafond</span><span style={{ color: c1.imp.depasse ? '#d97706' : '#1e40af', fontWeight: 600 }}>{Math.round(c1.imp.util)}%</span></div><div className="gauge-bar"><div className="gauge-fill" style={{ width: `${Math.min(100, c1.imp.util)}%` }} /></div><div className="gauge-labels"><span>0€</span><span>{eur(c1.pl)}</span></div></div>
              <div className="compare"><div className="compare-box pri"><div className="compare-v">{eur(c1.versAnnuel)}</div><div className="compare-l">Versement {form.modeVers === 'periodique' ? 'annuel' : 'ponctuel'}</div></div><div className="compare-op">−</div><div className="compare-box suc"><div className="compare-v">{eur(c1.imp.eco)}</div><div className="compare-l">Économie</div></div><div className="compare-op">=</div><div className="compare-box"><div className="compare-v">{eur(c1.imp.net)}</div><div className="compare-l">Coût réel</div></div></div>
              {c1.imp.depasse && <div className="wbox" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} /> {eur(c1.versAnnuel - c1.pl)} dépassent le plafond.</div>}
              <div className="tbox" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> Économie de <strong>{eur(c1.imp.eco)}</strong> soit <strong>{(c1.imp.eco / c1.versAnnuel * 100).toFixed(0)}%</strong> du versement.</div>
            </>)}
            <div className="btns"><button className="btn" onClick={v1} disabled={!form.rev || c1.versAnnuel <= 0}>Continuer →</button></div>
          </div>
        )}

        {step === 2 && res1 && (
          <div className="card card-p">
            <h2 className="card-t">Étape 2 : Projection du capital PER</h2>
            <div className="narr"><div className="narr-t" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 16, height: 16 }} /> Les intérêts composés</div><div className="narr-x">Vos gains génèrent des gains. Sur 20 ans, l'effet peut doubler votre mise !</div></div>
            {res1.modeVers === 'ponctuel' && (
              <div className="ibox" style={{ marginBottom: '1rem' }}>
                <Wallet style={{ width: 16, height: 16, flexShrink: 0, display: 'inline' }} /> <strong>Mode ponctuel</strong> : Votre versement de {eur(form.versPonctuel)} sera investi et capitalisera jusqu'à la retraite.
              </div>
            )}
            {res1.modeVers === 'periodique' && (
              <div className="ibox" style={{ marginBottom: '1rem' }}>
                <Calendar style={{ width: 16, height: 16, flexShrink: 0, display: 'inline' }} /> <strong>Mode périodique</strong> : Vos versements de {eur(form.versMensuel)}/mois{form.versInitial > 0 ? ` + ${eur(form.versInitial)} initial` : ''} s'accumuleront jusqu'à la retraite.
              </div>
            )}
            <div className="fg">
              <div className="fgrp"><label className="flbl">Âge actuel</label><div className="iw"><input type="number" className="finp" value={proj.age} onChange={e => setProj({ ...proj, age: +e.target.value })} /><span className="sfx">ans</span></div></div>
              <div className="fgrp"><label className="flbl">Âge retraite</label><div className="iw"><input type="number" className="finp" value={proj.ageR} onChange={e => setProj({ ...proj, ageR: +e.target.value })} /><span className="sfx">ans</span></div></div>
              <div className="fgrp"><label className="flbl">Capital PER existant</label><div className="iw"><input type="number" className="finp" value={proj.cap} onChange={e => setProj({ ...proj, cap: +e.target.value })} /><span className="sfx">€</span></div><span className="fh">Épargne PER déjà constituée</span></div>
              <div className="fgrp"><label className="flbl">Profil</label><select className="fsel" value={proj.profil} onChange={e => setProj({ ...proj, profil: e.target.value })}><option value="prudent">Prudent (2.5%)</option><option value="equilibre">Équilibré (4.5%)</option><option value="dynamique">Dynamique (6.5%)</option></select></div>
            </div>
            {c2 && (<>
              <div className="kpis"><div className="kpi"><div className="kpi-v">{proj.ageR - proj.age} ans</div><div className="kpi-l">Durée</div></div><div className="kpi"><div className="kpi-v">{eur(c2.cap)}</div><div className="kpi-l">Capital final</div></div><div className="kpi suc"><div className="kpi-v">{eur(c2.pv)}</div><div className="kpi-l">Plus-values</div></div><div className="kpi"><div className="kpi-v">{eur(c2.eco)}</div><div className="kpi-l">Éco. impôt total</div></div></div>
              <div className="chart-box"><div id="ch1" className="chart" /></div>
              <div className="tbox">
                {res1.modeVers === 'periodique' 
                  ? <><CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> <strong>{eur(form.versMensuel)}/mois</strong>{form.versInitial > 0 ? <> + <strong>{eur(form.versInitial)}</strong> initial</> : ''} pendant <strong>{proj.ageR - proj.age} ans</strong> = <strong>{eur(c2.cap)}</strong> dont <strong>{eur(c2.pv)}</strong> de gains.</>
                  : <><CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> Votre versement de <strong>{eur(form.versPonctuel)}</strong> capitalisé pendant <strong>{proj.ageR - proj.age} ans</strong> = <strong>{eur(c2.cap)}</strong> dont <strong>{eur(c2.pv)}</strong> de plus-values.</>}
              </div>
            </>)}
            <div className="btns"><button className="btn btn-o" onClick={() => setStep(1)}>← Retour</button><button className="btn" onClick={v2} disabled={!c2}>Continuer →</button></div>
          </div>
        )}

        {step === 3 && res2 && (
          <div className="card card-s">
            <h2 className="card-t">Étape 3 : Remployer l'économie en Assurance-Vie</h2>
            <div className="narr" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderColor: '#a7f3d0' }}><div className="narr-t" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 16, height: 16 }} /> Double effet PER</div><div className="narr-x" style={{ color: '#065f46' }}>Votre économie de <strong>{eur(res1.eco)}/an</strong> peut constituer un second capital en AV avec fiscalité avantageuse après 8 ans.</div></div>
            <div className="fg">
              <div className="fgrp"><label className="flbl"><input type="checkbox" checked={av.use} onChange={e => setAv({ ...av, use: e.target.checked })} /> Remployer en AV</label><span className="fh">{eur(res1.eco)}/an</span></div>
              {av.use && <div className="fgrp"><label className="flbl">Profil AV</label><select className="fsel" value={av.profil} onChange={e => setAv({ ...av, profil: e.target.value })}><option value="prudent">Prudent (2.5%)</option><option value="equilibre">Équilibré (4%)</option><option value="dynamique">Dynamique (6%)</option></select></div>}
            </div>
            {av.use && c3 && (<>
              <div className="kpis"><div className="kpi"><div className="kpi-v">{eur(res1.eco)}</div><div className="kpi-l">Versement/an</div></div><div className="kpi suc"><div className="kpi-v">{eur(c3.cap)}</div><div className="kpi-l">Capital AV</div></div><div className="kpi suc"><div className="kpi-v">{eur(c3.pv)}</div><div className="kpi-l">Plus-values AV</div></div></div>
              <div className="chart-box"><div id="ch2" className="chart" /></div>
              <div className="tbox" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Target style={{ width: 16, height: 16, flexShrink: 0 }} /> <strong>{eur(c3.cap)}</strong> supplémentaires sans effort d'épargne !</div>
            </>)}
            {!av.use && <div className="ibox" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Info style={{ width: 16, height: 16, flexShrink: 0 }} /> Vous manquez l'opportunité de faire fructifier {eur(res1.eco)}/an.</div>}
            <div className="btns"><button className="btn btn-o" onClick={() => setStep(2)}>← Retour</button><button className="btn btn-s" onClick={v3}>Continuer →</button></div>
          </div>
        )}

        {step === 4 && res2 && (
          <div className="card card-w">
            <h2 className="card-t">Étape 4 : Fiscalité à la sortie</h2>
            <div className="narr" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fde68a' }}><div className="narr-t" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 16, height: 16 }} /> Options de sortie</div><div className="narr-x" style={{ color: '#92400e' }}>Capital (IR + PFU 30% sur gains), Rente (partiellement imposée), ou Mix des deux.</div></div>
            <div className="fg"><div className="fgrp"><label className="flbl">TMI retraite estimé</label><select className="fsel" value={sortie.tmiR} onChange={e => setSortie({ ...sortie, tmiR: +e.target.value })}><option value={0}>0%</option><option value={0.11}>11%</option><option value={0.30}>30%</option></select></div></div>
            <div className="sortie-opts">
              {[{ t: 'capital', l: 'Capital', d: '100% en une fois' }, { t: 'rente', l: 'Rente', d: 'Revenus à vie' }, { t: 'mixte', l: 'Mixte', d: '50% + 50%' }].map(o => (
                <div key={o.t} className={`sortie-opt ${sortie.type === o.t ? 'active' : ''}`} onClick={() => setSortie({ ...sortie, type: o.t })}><h5>{o.l}</h5><p>{o.d}</p></div>
              ))}
            </div>
            {c4 && (<>
              <table className="tbl"><tbody>
                {c4.type === 'capital' && <><tr><td>Capital brut</td><td className="num pri">{eur(c4.brut)}</td></tr><tr><td>Impôt versements (IR)</td><td className="num err">- {eur(c4.impV)}</td></tr><tr><td>Impôt plus-values (PFU)</td><td className="num err">- {eur(c4.impPV)}</td></tr><tr><td><strong>Net perçu</strong></td><td className="num suc"><strong>{eur(c4.net)}</strong></td></tr></>}
                {c4.type === 'rente' && <><tr><td>Rente brute annuelle</td><td className="num pri">{eur(c4.rBrut)}</td></tr><tr><td>Part imposable</td><td className="num">{c4.part}%</td></tr><tr><td><strong>Rente nette/mois</strong></td><td className="num suc"><strong>{eur(c4.rNetM)}</strong></td></tr></>}
                {c4.type === 'mixte' && <><tr><td>Capital net perçu</td><td className="num suc">{eur(c4.netC)}</td></tr><tr><td>+ Rente nette/mois</td><td className="num suc">{eur(c4.rNetM)}</td></tr></>}
              </tbody></table>
              <div className="tbox" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {c4.type === 'capital' ? `Vous récupérez ${eur(c4.net)} net.` : c4.type === 'rente' ? `Rente de ${eur(c4.rNetM)}/mois à vie.` : `${eur(c4.netC)} + ${eur(c4.rNetM)}/mois.`}</div>
            </>)}
            <div className="btns"><button className="btn btn-o" onClick={() => setStep(3)}>← Retour</button><button className="btn" onClick={v4} disabled={!c4}>Voir synthèse →</button></div>
          </div>
        )}

        {step === 5 && res4 && (
          <div className="card" style={{ borderLeft: '4px solid #1e40af' }}>
            <h2 className="card-t">Synthèse de votre stratégie PER</h2>
            <div className="synth">
              <div className="synth-card"><h4 style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><BarChart3 style={{ width: 14, height: 14 }} /> Capital PER</h4><div className="synth-v">{eur(res2.cap)}</div><div className="synth-l">Dont {eur(res2.pv)} de plus-values<br/>Économies totales : {eur(res2.eco)}</div></div>
              {res3 && <div className="synth-card green"><h4 style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Gem style={{ width: 14, height: 14 }} /> Assurance-Vie</h4><div className="synth-v">{eur(res3.cap)}</div><div className="synth-l">Capital bonus via remploi<br/>Fiscalité avantageuse après 8 ans</div></div>}
              <div className="synth-card gold"><h4 style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Wallet style={{ width: 14, height: 14 }} /> Total Patrimoine Retraite</h4><div className="synth-v">{eur(res2.cap + (res3?.cap || 0))}</div><div className="synth-l">PER + AV combinés</div></div>
            </div>
            <h3 style={{ fontSize: '.95rem', fontWeight: 600, margin: '1.5rem 0 .75rem' }}>Recommandations</h3>
            <div className="recs">
              {c1.imp.util < 80 && <div className="rec m" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> Vous n'utilisez que {Math.round(c1.imp.util)}% de votre plafond. Potentiel d'économie supplémentaire !</div>}
              {res3 && <div className="rec b" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} /> Excellent ! Le remploi AV vous apporte {eur(res3.cap)} supplémentaires.</div>}
              {!res3 && av.use === false && <div className="rec m" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Lightbulb style={{ width: 14, height: 14, flexShrink: 0 }} /> Activez le remploi pour constituer {eur(res1.eco * (proj.ageR - proj.age))} de plus.</div>}
              <div className="rec i" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><Calendar style={{ width: 14, height: 14, flexShrink: 0 }} /> Vérifiez vos plafonds non utilisés sur votre avis d'imposition chaque année.</div>
            </div>
            <div className="btns"><button className="btn btn-o" onClick={() => setStep(1)}>← Modifier</button></div>
            <div style={{ marginTop: '1.5rem' }}>
              <ExportSimulationActions
                simulateurTitre="PER Salarié"
                simulationType="PER_SALARIE"
                parametres={[
                  { label: 'Revenu annuel', valeur: form.rev, unite: '€' },
                  { label: 'Type', valeur: form.type === 'brut' ? 'Brut' : 'Net' },
                  { label: 'Mode versement', valeur: form.modeVers === 'periodique' ? 'Périodique' : 'Ponctuel' },
                  { label: 'Versement annuel', valeur: c1.versAnnuel, unite: '€' },
                  { label: 'Âge actuel', valeur: proj.age, unite: 'ans' },
                  { label: 'Âge retraite', valeur: proj.ageR, unite: 'ans' },
                  { label: 'Profil', valeur: proj.profil },
                ]}
                resultats={[
                  { label: 'Net fiscal', valeur: Math.round(c1.np), unite: '€' },
                  { label: 'Plafond PER', valeur: Math.round(c1.pl), unite: '€' },
                  { label: 'TMI', valeur: c1.tmi.label },
                  { label: 'Économie impôt/an', valeur: Math.round(c1.imp.eco), unite: '€', important: true },
                  ...(res2 ? [{ label: 'Capital PER final', valeur: res2.cap, unite: '€', important: true }] : []),
                  ...(res2 ? [{ label: 'Plus-values PER', valeur: res2.pv, unite: '€' }] : []),
                  ...(res3 ? [{ label: 'Capital AV bonus', valeur: res3.cap, unite: '€' }] : []),
                  { label: 'Total patrimoine retraite', valeur: (res2?.cap || 0) + (res3?.cap || 0), unite: '€', important: true },
                ]}
                notes={`Simulation PER Salarié — Revenu ${eur(form.rev)} ${form.type}, TMI ${c1.tmi.label}, ${proj.ageR - proj.age} ans`}
              />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
