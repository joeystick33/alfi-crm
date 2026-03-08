'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { usePlotlyReady } from '../immobilier/_hooks/usePlotlyReady'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import {
  Home, User, Wallet, FileText, CreditCard, BarChart3,
  Lightbulb, AlertTriangle, CheckCircle, XCircle, BookOpen, Rocket,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
interface TableauAmortissementRow {
  annee: number;
  capitalRembourse: number;
  interets: number;
  assurance: number;
  capitalRestant: number;
}

interface CapaciteResultats {
  capacite?: {
    capaciteMaxTheorique?: number;
  };
  analyseProjet?: {
    mensualiteProjet?: number;
    tauxEndettementProjet?: number;
    resteAVivre?: number;
    alertes?: string[];
    recommandations?: string[];
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE — Source : RULES.immobilier.hcsf
// ══════════════════════════════════════════════════════════════════════════════
const HCSF = {
  TAUX_ENDETTEMENT_MAX: RULES.immobilier.hcsf.taux_endettement_max * 100,
  DUREE_MAX: RULES.immobilier.hcsf.duree_max_ans,
  RESTE_A_VIVRE_SEUL: 700,
  RESTE_A_VIVRE_COUPLE: 1000,
  PAR_ENFANT: 150,
}

const PONDERATION_REVENUS: Record<string, { label: string; coef: number; hint: string }> = {
  salaire_cdi: { label: 'Salaire CDI', coef: 1.00, hint: 'Pris à 100%' },
  salaire_cdd: { label: 'Salaire CDD', coef: 0.70, hint: 'Moyenne sur 2 ans, 70%' },
  benefices_tns: { label: 'Bénéfices TNS', coef: 0.85, hint: 'Moyenne 3 ans, 85%' },
  revenus_locatifs: { label: 'Revenus locatifs', coef: 0.70, hint: '70% des loyers bruts' },
  pension: { label: 'Pension/Retraite', coef: 1.00, hint: 'Revenus garantis, 100%' },
  dividendes: { label: 'Dividendes', coef: 0.50, hint: 'Variables, 50%' },
  autre: { label: 'Autres revenus', coef: 0.50, hint: 'Au cas par cas, 50%' },
}

const TYPES_CHARGES = [
  { id: 'loyer', label: 'Loyer actuel' },
  { id: 'credit_immo', label: 'Crédit immobilier' },
  { id: 'credit_conso', label: 'Crédit consommation' },
  { id: 'credit_auto', label: 'Crédit auto/LOA' },
  { id: 'pension_alim', label: 'Pension alimentaire' },
  { id: 'autre', label: 'Autre charge' },
]

const safeNumber = (value: number | null | undefined) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return 0
}

const fmtEur = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number | null | undefined) => safeNumber(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + '%'

// Types
type SituationFamiliale = 'seul' | 'couple'
type TypeAchat = 'ancien' | 'neuf'

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS D'AFFICHAGE (aperçu uniquement)
// ══════════════════════════════════════════════════════════════════════════════
function getDisplayMensualite(capital: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  if (tauxMensuel <= 0) return capital / nbMensualites
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
}

function getDisplayCapaciteEmprunt(mensualiteMax: number, tauxAnnuel: number, dureeAnnees: number): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  if (tauxMensuel <= 0 || mensualiteMax <= 0) return mensualiteMax * nbMensualites
  return mensualiteMax * (Math.pow(1 + tauxMensuel, nbMensualites) - 1) / (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites))
}

function getResteAVivreMinimum(situation: SituationFamiliale, nbEnfants: number): number {
  const base = situation === 'couple' ? HCSF.RESTE_A_VIVRE_COUPLE : HCSF.RESTE_A_VIVRE_SEUL
  return base + nbEnfants * HCSF.PAR_ENFANT
}

export default function CapaciteEmpruntPage() {
  const { plotlyReady, handlePlotlyLoad } = usePlotlyReady()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const chartRef1 = useRef<HTMLDivElement>(null)
  const chartRef2 = useRef<HTMLDivElement>(null)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : PROFIL EMPRUNTEUR
  // ══════════════════════════════════════════════════════════════════════════
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('couple')
  const [nbEnfants, setNbEnfants] = useState(2)
  const [ageEmprunteur, setAgeEmprunteur] = useState(35)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : REVENUS
  // ══════════════════════════════════════════════════════════════════════════
  const [revenus, setRevenus] = useState([
    { id: '1', type: 'salaire_cdi', montant: 3500 },
    { id: '2', type: 'salaire_cdi', montant: 2800 },
  ])

  const addRevenu = () => setRevenus([...revenus, { id: Date.now().toString(), type: 'salaire_cdi', montant: 0 }])
  const removeRevenu = (id: string) => setRevenus(revenus.filter(r => r.id !== id))
  const updateRevenu = (id: string, field: string, value: string | number) => {
    setRevenus(revenus.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  // Calcul revenus pondérés (aperçu)
  const totalRevenusBruts = revenus.reduce((sum, r) => sum + r.montant, 0)
  const totalRevenusPonderes = revenus.reduce((sum, r) => {
    const coef = PONDERATION_REVENUS[r.type]?.coef || 0.5
    return sum + r.montant * coef
  }, 0)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : CHARGES
  // ══════════════════════════════════════════════════════════════════════════
  const [charges, setCharges] = useState([
    { id: '1', type: 'loyer', montant: 1200 },
  ])
  const [supprimerLoyer, setSupprimerLoyer] = useState(true)

  const addCharge = () => setCharges([...charges, { id: Date.now().toString(), type: 'autre', montant: 0 }])
  const removeCharge = (id: string) => setCharges(charges.filter(c => c.id !== id))
  const updateCharge = (id: string, field: string, value: string | number) => {
    setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  // Calcul charges (hors loyer si supprimé)
  const chargesAPrendre = supprimerLoyer ? charges.filter(c => c.type !== 'loyer') : charges
  const totalCharges = chargesAPrendre.reduce((sum, c) => sum + c.montant, 0)

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : PROJET IMMOBILIER
  // ══════════════════════════════════════════════════════════════════════════
  const [prixBien, setPrixBien] = useState(350000)
  const [typeAchat, setTypeAchat] = useState<TypeAchat>('ancien')
  const [fraisAgence, setFraisAgence] = useState(17500)
  const [travaux, setTravaux] = useState(0)
  const [apportPersonnel, setApportPersonnel] = useState(70000)

  // Calculs automatiques
  const fraisNotaire = Math.round(prixBien * (typeAchat === 'ancien' ? 0.08 : 0.03))
  const budgetTotal = prixBien + fraisNotaire + fraisAgence + travaux
  const montantAFinancer = Math.max(0, budgetTotal - apportPersonnel)
  const tauxApport = budgetTotal > 0 ? (apportPersonnel / budgetTotal * 100) : 0

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5 : PARAMÈTRES CRÉDIT
  // ══════════════════════════════════════════════════════════════════════════
  const [dureeCredit, setDureeCredit] = useState(20)
  const [tauxCredit, setTauxCredit] = useState(3.5)
  const [tauxAssurance, setTauxAssurance] = useState(0.36)

  // Calculs crédit (aperçu)
  const mensualiteHorsAss = getDisplayMensualite(montantAFinancer, tauxCredit, dureeCredit)
  const assuranceMensuelle = montantAFinancer * tauxAssurance / 100 / 12
  const mensualiteTotale = mensualiteHorsAss + assuranceMensuelle
  const coutTotalCredit = (mensualiteTotale * dureeCredit * 12) - montantAFinancer

  // Calculs capacité HCSF
  const mensualiteMaxHCSF = (totalRevenusPonderes * HCSF.TAUX_ENDETTEMENT_MAX / 100) - totalCharges
  const capaciteMaxTheorique = getDisplayCapaciteEmprunt(Math.max(0, mensualiteMaxHCSF), tauxCredit, dureeCredit)
  const tauxEndettementProjet = totalRevenusPonderes > 0 ? ((totalCharges + mensualiteTotale) / totalRevenusPonderes * 100) : 100
  const resteAVivre = totalRevenusPonderes - totalCharges - mensualiteTotale
  const resteAVivreMinimum = getResteAVivreMinimum(situationFamiliale, nbEnfants)
  const projetFaisable = tauxEndettementProjet <= 35 && resteAVivre >= resteAVivreMinimum

  // ══════════════════════════════════════════════════════════════════════════
  // RÉSULTATS API
  // ══════════════════════════════════════════════════════════════════════════
  const [resultats, setResultats] = useState<CapaciteResultats | null>(null)
  const [tableauAmortissement, setTableauAmortissement] = useState<TableauAmortissementRow[]>([])
  const [alertes, setAlertes] = useState<string[]>([])
  const [recommandations, setRecommandations] = useState<string[]>([])

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL API BACKEND
  // ══════════════════════════════════════════════════════════════════════════
  const lancerSimulation = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/advisor/simulators/capacite-emprunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          revenus: revenus.map(r => ({ type: r.type, montant: r.montant })),
          charges: charges.map(c => ({ type: c.type, montant: c.montant })),
          situationFamiliale,
          nbEnfants,
          ageEmprunteur,
          projet: {
            prixBien,
            typeAchat,
            fraisAgence,
            travaux,
            apportPersonnel,
          },
          dureeEmpruntSouhaitee: dureeCredit,
          tauxSouhaite: tauxCredit,
          supprimerLoyerActuel: supprimerLoyer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la simulation')
      }

      setResultats(data.data)
      setTableauAmortissement(data.data.tableauAmortissement || [])
      setAlertes(data.data.analyseProjet?.alertes || [])
      setRecommandations(data.data.analyseProjet?.recommandations || [])
      setShowResults(true)

    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'))
    } finally {
      setLoading(false)
    }
  }, [revenus, charges, situationFamiliale, nbEnfants, ageEmprunteur, prixBien, typeAchat, fraisAgence, travaux, apportPersonnel, dureeCredit, tauxCredit, supprimerLoyer])

  // ══════════════════════════════════════════════════════════════════════════
  // GRAPHIQUES PLOTLY
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!plotlyReady || !showResults || !tableauAmortissement.length) return
    const P = (window as { Plotly?: { newPlot: (...args: unknown[]) => void } }).Plotly
    if (!P) return

    if (chartRef1.current) {
      P.newPlot(chartRef1.current, [
        {
          x: tableauAmortissement.map(t => `Année ${t.annee}`),
          y: tableauAmortissement.map(t => t.capitalRembourse),
          type: 'bar',
          name: 'Capital remboursé',
          marker: { color: '#2563eb' },
        },
        {
          x: tableauAmortissement.map(t => `Année ${t.annee}`),
          y: tableauAmortissement.map(t => t.interets),
          type: 'bar',
          name: 'Intérêts',
          marker: { color: '#f97316' },
        },
      ], {
        title: 'Répartition capital / intérêts',
        barmode: 'stack',
        height: 300,
        margin: { t: 40, b: 60, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
        legend: { orientation: 'h', y: -0.2 },
      }, { displayModeBar: false })
    }

    if (chartRef2.current) {
      P.newPlot(chartRef2.current, [
        {
          x: tableauAmortissement.map(t => `Année ${t.annee}`),
          y: tableauAmortissement.map(t => t.capitalRestant),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Capital restant dû',
          line: { color: '#dc2626', width: 3 },
          fill: 'tozeroy',
          fillcolor: 'rgba(220, 38, 38, 0.1)',
        },
      ], {
        title: 'Évolution du capital restant dû',
        height: 300,
        margin: { t: 40, b: 60, l: 60, r: 20 },
        paper_bgcolor: 'transparent',
      }, { displayModeBar: false })
    }
  }, [plotlyReady, showResults, tableauAmortissement])

  const totalSteps = 5

  return (
    <SimulatorGate simulator="CAPACITE_EMPRUNT" showTeaser>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          <Link href="/dashboard/simulateurs" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center">← Simulateurs</Link>

          {/* HEADER */}
          <div className="sim-card mb-6">
            <div className="flex items-center gap-4">
              <Home className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Simulateur Capacité d'Emprunt</h1>
                <p className="text-gray-600">Calcul selon les normes HCSF 2025 • Taux d'endettement max 35%</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="badge-blue">HCSF 2025</span>
              <span className="badge-green">Multi-revenus</span>
              <span className="badge-purple">Projet immobilier</span>
            </div>
          </div>

          {!showResults ? (
            <div className="sim-card">
              {/* BARRE DE PROGRESSION */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Étape {step}/{totalSteps}</span>
                  <span>{Math.round(step / totalSteps * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${step / totalSteps * 100}%` }} />
                </div>
              </div>

              {/* ÉTAPE 1 : PROFIL */}
              {step === 1 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" /> Profil emprunteur</h2>
                  <p className="text-gray-600 mb-4">Ces informations permettent de calculer le reste à vivre minimum requis par les banques.</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label>Situation familiale</label>
                      <select value={situationFamiliale} onChange={e => setSituationFamiliale(e.target.value as SituationFamiliale)}>
                        <option value="seul">Seul(e)</option>
                        <option value="couple">En couple</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nombre d'enfants à charge</label>
                      <input type="number" value={nbEnfants} onChange={e => setNbEnfants(+e.target.value)} min={0} max={10} />
                    </div>
                    <div className="form-group">
                      <label>Âge de l'emprunteur principal</label>
                      <input type="number" value={ageEmprunteur} onChange={e => setAgeEmprunteur(+e.target.value)} min={18} max={85} />
                      <span className="form-hint">Pour le taux d'assurance</span>
                    </div>
                  </div>

                  <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reste à vivre minimum</span>
                      <div className="font-bold text-lg">{fmtEur(resteAVivreMinimum)}/mois</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Taux endettement max</span>
                      <div className="font-bold text-lg">{HCSF.TAUX_ENDETTEMENT_MAX}%</div>
                    </div>
                  </div>

                  <div className="pedagogy-box mt-4">
                    <p className="text-sm text-blue-700">
                      <strong className="flex items-center gap-1"><BookOpen className="w-4 h-4 inline" /> Normes HCSF :</strong> Depuis janvier 2022, le taux d'endettement ne peut pas dépasser 35% des revenus nets.
                      Les banques vérifient également que le reste à vivre est suffisant pour couvrir les dépenses courantes.
                    </p>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : REVENUS */}
              {step === 2 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-green-600" /> Vos revenus mensuels</h2>
                  <p className="text-gray-600 mb-4">Les banques appliquent des coefficients de pondération selon le type de revenu.</p>

                  <div className="space-y-3">
                    {revenus.map((revenu, idx) => (
                      <div key={revenu.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="form-group mb-0">
                            <label>Type de revenu</label>
                            <select value={revenu.type} onChange={e => updateRevenu(revenu.id, 'type', e.target.value)}>
                              {Object.entries(PONDERATION_REVENUS).map(([id, r]) => (
                                <option key={id} value={id}>{r.label} ({Math.round(r.coef * 100)}%)</option>
                              ))}
                            </select>
                            <span className="form-hint">{PONDERATION_REVENUS[revenu.type]?.hint}</span>
                          </div>
                          <div className="form-group mb-0">
                            <label>Montant mensuel net (€)</label>
                            <input type="number" value={revenu.montant} onChange={e => updateRevenu(revenu.id, 'montant', +e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-right">
                              <span className="text-gray-500 text-sm">Pondéré :</span>
                              <span className="font-bold text-green-700 ml-2">{fmtEur(revenu.montant * (PONDERATION_REVENUS[revenu.type]?.coef || 0.5))}</span>
                            </div>
                            {revenus.length > 1 && (
                              <button onClick={() => removeRevenu(revenu.id)} className="btn-remove">✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addRevenu} className="btn-add w-full">+ Ajouter un revenu</button>
                  </div>

                  <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total revenus bruts</span>
                      <div className="font-bold text-lg">{fmtEur(totalRevenusBruts)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total revenus pondérés</span>
                      <div className="font-bold text-lg text-green-600">{fmtEur(totalRevenusPonderes)}</div>
                    </div>
                  </div>

                  <div className="pedagogy-box mt-4">
                    <p className="text-sm text-blue-700">
                      <strong className="flex items-center gap-1"><Lightbulb className="w-4 h-4 inline" /> Pondération bancaire :</strong> Les revenus CDI sont pris à 100%, les CDD à 70% (moyenne sur 2 ans),
                      les revenus locatifs à 70% des loyers bruts. Ces coefficients permettent de sécuriser le prêteur.
                    </p>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : CHARGES */}
              {step === 3 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-red-600" /> Vos charges mensuelles</h2>
                  <p className="text-gray-600 mb-4">Crédits en cours et charges récurrentes prises en compte dans le calcul d'endettement.</p>

                  {/* Option supprimer loyer */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supprimerLoyer}
                        onChange={e => setSupprimerLoyer(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 flex items-center gap-1"><Home className="w-4 h-4" /> Supprimer le loyer actuel du calcul</span>
                        <p className="text-sm text-slate-500">Si vous achetez votre résidence principale, le loyer disparaîtra</p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    {charges.map((charge) => (
                      <div key={charge.id} className={`border rounded-lg p-4 ${charge.type === 'loyer' && supprimerLoyer ? 'bg-gray-100 opacity-50' : 'bg-red-50 border-red-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="form-group mb-0">
                            <label>Type de charge</label>
                            <select value={charge.type} onChange={e => updateCharge(charge.id, 'type', e.target.value)}>
                              {TYPES_CHARGES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group mb-0">
                            <label>Montant mensuel (€)</label>
                            <input type="number" value={charge.montant} onChange={e => updateCharge(charge.id, 'montant', +e.target.value)} />
                          </div>
                          <div className="flex items-center justify-end">
                            {charge.type === 'loyer' && supprimerLoyer && (
                              <span className="text-gray-500 text-sm mr-2">Non comptabilisé</span>
                            )}
                            {charges.length > 1 && (
                              <button onClick={() => removeCharge(charge.id)} className="btn-remove">✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addCharge} className="btn-add w-full">+ Ajouter une charge</button>
                  </div>

                  <div className="info-box mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total charges retenues</span>
                      <div className="font-bold text-lg text-red-600">{fmtEur(totalCharges)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Mensualité max HCSF</span>
                      <div className="font-bold text-lg text-blue-600">{fmtEur(Math.max(0, mensualiteMaxHCSF))}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 : PROJET IMMOBILIER */}
              {step === 4 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Home className="w-5 h-5 text-blue-600" /> Votre projet immobilier</h2>
                  <p className="text-gray-600 mb-4">Décrivez le bien que vous souhaitez acquérir.</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label>Prix du bien (€)</label>
                      <input type="number" value={prixBien} onChange={e => setPrixBien(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Type d'achat</label>
                      <select value={typeAchat} onChange={e => setTypeAchat(e.target.value as TypeAchat)}>
                        <option value="ancien">Ancien (~8% frais)</option>
                        <option value="neuf">Neuf (~3% frais)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Frais de notaire (€)</label>
                      <input type="number" value={fraisNotaire} readOnly className="bg-gray-100" />
                      <span className="form-hint">Calculé automatiquement</span>
                    </div>
                    <div className="form-group">
                      <label>Frais d'agence (€)</label>
                      <input type="number" value={fraisAgence} onChange={e => setFraisAgence(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Travaux (€)</label>
                      <input type="number" value={travaux} onChange={e => setTravaux(+e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Apport personnel (€)</label>
                      <input type="number" value={apportPersonnel} onChange={e => setApportPersonnel(+e.target.value)} />
                      <span className="form-hint">{fmtPct(tauxApport)} du budget</span>
                    </div>
                  </div>

                  <div className="info-box mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Budget total</span>
                      <div className="font-bold text-lg">{fmtEur(budgetTotal)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Apport</span>
                      <div className="font-bold text-lg text-green-600">{fmtEur(apportPersonnel)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">À financer</span>
                      <div className="font-bold text-lg text-blue-600">{fmtEur(montantAFinancer)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Capacité max</span>
                      <div className={`font-bold text-lg ${montantAFinancer > capaciteMaxTheorique ? 'text-red-600' : 'text-green-600'}`}>
                        {fmtEur(capaciteMaxTheorique)}
                      </div>
                    </div>
                  </div>

                  {montantAFinancer > capaciteMaxTheorique && (
                    <div className="alert-warning mt-4">
                      <p className="text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" /> Le montant à financer ({fmtEur(montantAFinancer)}) dépasse votre capacité d'emprunt maximale ({fmtEur(capaciteMaxTheorique)}).
                        Augmentez votre apport ou réduisez le prix du bien.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 5 : CRÉDIT */}
              {step === 5 && (
                <div className="animate-fadeIn">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Paramètres du crédit</h2>
                  <p className="text-gray-600 mb-4">Ajustez les conditions de votre prêt immobilier.</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="form-group">
                      <label>Durée (années)</label>
                      <select value={dureeCredit} onChange={e => setDureeCredit(+e.target.value)}>
                        {[10, 15, 20, 25].map(d => (
                          <option key={d} value={d}>{d} ans</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Taux nominal (%)</label>
                      <input type="number" value={tauxCredit} onChange={e => setTauxCredit(+e.target.value)} step={0.1} />
                    </div>
                    <div className="form-group">
                      <label>Taux assurance (%/an)</label>
                      <input type="number" value={tauxAssurance} onChange={e => setTauxAssurance(+e.target.value)} step={0.05} />
                      <span className="form-hint">Sur capital initial</span>
                    </div>
                  </div>

                  {/* Synthèse crédit */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> SYNTHÈSE DU CRÉDIT</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-gray-500 text-xs">Montant emprunté</div>
                        <div className="font-bold text-lg">{fmtEur(montantAFinancer)}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-gray-500 text-xs">Mensualité totale</div>
                        <div className="font-bold text-lg text-blue-600">{fmtEur(Math.round(mensualiteTotale))}</div>
                        <div className="text-xs text-gray-400">{fmtEur(Math.round(mensualiteHorsAss))} + {fmtEur(Math.round(assuranceMensuelle))} ass.</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-gray-500 text-xs">Coût total crédit</div>
                        <div className="font-bold text-lg text-orange-600">{fmtEur(Math.round(coutTotalCredit))}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-gray-500 text-xs">Taux endettement</div>
                        <div className={`font-bold text-lg ${tauxEndettementProjet > 35 ? 'text-red-600' : 'text-green-600'}`}>
                          {fmtPct(tauxEndettementProjet)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Faisabilité */}
                  <div className={`mt-4 p-4 rounded-lg border-2 ${projetFaisable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex items-center gap-3">
                      {projetFaisable ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
                      <div>
                        <h4 className={`font-bold ${projetFaisable ? 'text-green-700' : 'text-red-700'}`}>
                          {projetFaisable ? 'Projet finançable' : 'Projet non finançable en l\'état'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Taux endettement: {fmtPct(tauxEndettementProjet)} (max 35%) •
                          Reste à vivre: {fmtEur(Math.round(resteAVivre))} (min {fmtEur(resteAVivreMinimum)})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION */}
              <div className="flex justify-between mt-6 pt-4 border-t">
                <button
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="btn-secondary"
                >
                  ← Précédent
                </button>

                {step < totalSteps ? (
                  <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                    Suivant →
                  </button>
                ) : (
                  <button onClick={lancerSimulation} disabled={loading} className="btn-primary">
                    {loading ? 'Calcul en cours...' : 'Lancer la simulation'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* RÉSULTATS */
            <div className="space-y-6">
              <button onClick={() => setShowResults(false)} className="btn-secondary mb-4">← Modifier les paramètres</button>

              {/* KPIs principaux */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sim-card text-center">
                  <div className="text-gray-500 text-sm">Capacité maximale</div>
                  <div className="text-2xl font-bold text-blue-600">{fmtEur(resultats?.capacite?.capaciteMaxTheorique || capaciteMaxTheorique)}</div>
                </div>
                <div className="sim-card text-center">
                  <div className="text-gray-500 text-sm">Mensualité projet</div>
                  <div className="text-2xl font-bold">{fmtEur(resultats?.analyseProjet?.mensualiteProjet || Math.round(mensualiteTotale))}</div>
                </div>
                <div className="sim-card text-center">
                  <div className="text-gray-500 text-sm">Taux endettement</div>
                  <div className={`text-2xl font-bold ${(resultats?.analyseProjet?.tauxEndettementProjet || tauxEndettementProjet) > 35 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmtPct(resultats?.analyseProjet?.tauxEndettementProjet || tauxEndettementProjet)}
                  </div>
                </div>
                <div className="sim-card text-center">
                  <div className="text-gray-500 text-sm">Reste à vivre</div>
                  <div className={`text-2xl font-bold ${(resultats?.analyseProjet?.resteAVivre || resteAVivre) < resteAVivreMinimum ? 'text-red-600' : 'text-green-600'}`}>
                    {fmtEur(resultats?.analyseProjet?.resteAVivre || Math.round(resteAVivre))}
                  </div>
                </div>
              </div>

              {/* Alertes et recommandations */}
              {alertes.length > 0 && (
                <div className="sim-card bg-red-50 border-red-200">
                  <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Alertes</h3>
                  <ul className="space-y-1">
                    {alertes.map((a, i) => <li key={i} className="text-sm text-red-600">• {a}</li>)}
                  </ul>
                </div>
              )}

              {recommandations.length > 0 && (
                <div className="sim-card bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5" /> Recommandations</h3>
                  <ul className="space-y-1">
                    {recommandations.map((r, i) => <li key={i} className="text-sm text-blue-600">• {r}</li>)}
                  </ul>
                </div>
              )}

              {/* Graphiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="sim-card">
                  <div ref={chartRef1} />
                </div>
                <div className="sim-card">
                  <div ref={chartRef2} />
                </div>
              </div>

              {/* Tableau d'amortissement */}
              {tableauAmortissement.length > 0 && (
                <div className="sim-card">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Tableau d'amortissement</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Année</th>
                          <th className="p-2 text-right">Capital</th>
                          <th className="p-2 text-right">Intérêts</th>
                          <th className="p-2 text-right">Assurance</th>
                          <th className="p-2 text-right">Capital restant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableauAmortissement.map((row) => (
                          <tr key={row.annee} className="border-t">
                            <td className="p-2">{row.annee}</td>
                            <td className="p-2 text-right text-blue-600">{fmtEur(row.capitalRembourse)}</td>
                            <td className="p-2 text-right text-orange-600">{fmtEur(row.interets)}</td>
                            <td className="p-2 text-right">{fmtEur(row.assurance)}</td>
                            <td className="p-2 text-right font-medium">{fmtEur(row.capitalRestant)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </SimulatorGate>
  )
}
