'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { 
  Calculator, ChevronRight, ChevronLeft, Trash2,
  TrendingUp, Landmark, Users, CreditCard, Home, Shield, Loader2,
  CheckCircle2, BarChart3, ArrowRight, Heart, PiggyBank,
  Building2, Scale, Percent, ChevronDown, ChevronUp,
  Briefcase, FileText, Wallet, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import Link from 'next/link'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SimulateurPanelProps {
  dossier: {
    id: string
    categorie: string
    type: string
    clientDataSnapshot: Record<string, unknown> | null
    simulations: Array<{
      id: string
      simulateurType: string
      nom: string
      parametres: Record<string, unknown>
      resultats: Record<string, unknown>
      selectionne: boolean
    }>
  }
  onSimulationSaved: () => void
  onNext: () => void
  onPrev: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// AXES D'ÉTUDE PATRIMONIALE — structure complète d'un bilan professionnel
// ═══════════════════════════════════════════════════════════════════════════

interface SimulateurDef {
  type: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  isCalculateur?: boolean
}

interface AxeEtude {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  bgColor: string
  iconColor: string
  simulateurs: SimulateurDef[]
}

const AXES_ETUDE: AxeEtude[] = [
  // ─── 1. SITUATION PERSONNELLE & FAMILIALE ───
  {
    id: 'famille',
    label: 'Situation personnelle & familiale',
    description: 'Régime matrimonial, conséquences décès/divorce, protection du conjoint et des enfants',
    icon: Users,
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    simulateurs: [
      { type: 'SUCCESSION', label: 'Succession — Dévolution légale', description: 'Droits du conjoint et des héritiers en cas de décès, avec/sans testament', icon: Users, path: '/dashboard/simulateurs/succession' },
      { type: 'SUCCESSION_COMPARATIF', label: 'Succession — Comparatif scénarios', description: 'Comparer : donation au dernier vivant, testament, clause bénéficiaire AV', icon: Scale, path: '/dashboard/simulateurs/succession-comparison' },
      { type: 'DONATION', label: 'Donation entre époux / enfants', description: 'Abattements, droits, stratégie de donation du vivant', icon: Gift, path: '/dashboard/simulateurs/donation-optimizer' },
      { type: 'CALC_SUCCESSION', label: 'Calculateur droits de succession', description: 'Calcul rapide des droits par héritier avec barème en vigueur', icon: Calculator, path: '/dashboard/calculateurs/succession', isCalculateur: true },
      { type: 'CALC_DONATION', label: 'Calculateur donation', description: 'Abattements renouvelables, barème, rappel fiscal 15 ans', icon: Calculator, path: '/dashboard/calculateurs/donation', isCalculateur: true },
    ],
  },

  // ─── 2. FISCALITÉ ───
  {
    id: 'fiscalite',
    label: 'Fiscalité',
    description: 'IR, IFI, plus-values, stratégie d\'optimisation fiscale, enveloppes',
    icon: Landmark,
    gradient: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    simulateurs: [
      { type: 'FISCAL_IR', label: 'Impôt sur le revenu', description: 'Calcul IR détaillé : barème progressif, quotient familial, décote, réductions', icon: Landmark, path: '/dashboard/simulateurs/impot-revenu' },
      { type: 'CALC_IR', label: 'Calculateur IR rapide', description: 'Estimation rapide de l\'IR avec TMI et taux moyen', icon: Calculator, path: '/dashboard/calculateurs/impot-revenu', isCalculateur: true },
      { type: 'CALC_IFI', label: 'Calculateur IFI', description: 'Impôt sur la fortune immobilière : assiette, abattement 30% RP, barème', icon: Landmark, path: '/dashboard/calculateurs/ifi', isCalculateur: true },
      { type: 'CALC_PLUS_VALUES', label: 'Calculateur plus-values', description: 'PV immobilières, mobilières, abattements pour durée de détention', icon: TrendingUp, path: '/dashboard/calculateurs/plus-values', isCalculateur: true },
      { type: 'FISCAL_STRATEGIE', label: 'Stratégie fiscale comparée', description: 'Comparer PER, Pinel, FCPI, FIP, Girardin, SOFICA, dons...', icon: TrendingUp, path: '/dashboard/simulateurs/tax-strategy-comparison' },
      { type: 'TAX_PROJECTOR', label: 'Projecteur fiscal pluriannuel', description: 'Projection IR sur 5-10 ans avec évolution revenus et charges', icon: BarChart3, path: '/dashboard/simulateurs/tax-projector' },
      { type: 'ENVELOPPE_FISCALE', label: 'Enveloppe fiscale TNS', description: 'Optimisation de l\'enveloppe de rémunération TNS (dividendes, salaire, Madelin)', icon: Percent, path: '/dashboard/simulateurs/enveloppe-fiscale' },
    ],
  },

  // ─── 3. PATRIMOINE IMMOBILIER ───
  {
    id: 'immobilier',
    label: 'Patrimoine immobilier',
    description: 'Rentabilité de chaque bien, cashflow, fiscalité locative, nouveaux investissements',
    icon: Home,
    gradient: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    simulateurs: [
      { type: 'IMMO_RENDEMENT', label: 'Rendement locatif global', description: 'Rentabilité brute, nette et nette-nette avec charges réelles', icon: Home, path: '/dashboard/simulateurs/immobilier' },
      { type: 'IMMO_LMNP', label: 'LMNP — Loueur meublé non-professionnel', description: 'Amortissement, BIC, déficit, cashflow net après impôt', icon: Home, path: '/dashboard/simulateurs/immobilier/lmnp' },
      { type: 'IMMO_LMP', label: 'LMP — Loueur meublé professionnel', description: 'Régime LMP : conditions, imputation déficits, plus-values', icon: Building2, path: '/dashboard/simulateurs/immobilier/lmp' },
      { type: 'IMMO_PINEL', label: 'Pinel / Pinel+', description: 'Réduction IR, plafonds loyers et ressources, engagement', icon: Home, path: '/dashboard/simulateurs/immobilier/pinel' },
      { type: 'IMMO_DEFICIT_FONCIER', label: 'Déficit foncier', description: 'Travaux déductibles, imputation sur revenu global (10 700 €)', icon: Home, path: '/dashboard/simulateurs/immobilier/deficit-foncier' },
      { type: 'IMMO_MALRAUX', label: 'Malraux', description: 'Réduction IR 22-30% sur travaux en secteur sauvegardé', icon: Building2, path: '/dashboard/simulateurs/immobilier/malraux' },
      { type: 'IMMO_MONUMENTS', label: 'Monuments historiques', description: 'Déduction intégrale des travaux, sans plafond niches', icon: Building2, path: '/dashboard/simulateurs/immobilier/monuments-historiques' },
      { type: 'IMMO_NUE_PROPRIETE', label: 'Nue-propriété', description: 'Démembrement : décote, reconstitution, fiscalité', icon: Home, path: '/dashboard/simulateurs/immobilier/nue-propriete' },
      { type: 'IMMO_SCPI', label: 'SCPI', description: 'Pierre papier : rendement, fiscalité, diversification', icon: Building2, path: '/dashboard/simulateurs/immobilier/scpi' },
      { type: 'IMMO_LOCATION_NUE', label: 'Location nue (revenus fonciers)', description: 'Micro-foncier vs réel, charges déductibles', icon: Home, path: '/dashboard/simulateurs/immobilier/location-nue' },
      { type: 'IMMO_DENORMANDIE', label: 'Denormandie', description: 'Réduction IR dans l\'ancien avec travaux, zones éligibles', icon: Home, path: '/dashboard/simulateurs/immobilier/denormandie' },
      { type: 'IMMO_COLOCATION', label: 'Colocation', description: 'Rentabilité par chambre, bail individuel vs solidaire', icon: Users, path: '/dashboard/simulateurs/immobilier/colocation' },
      { type: 'IMMO_SAISONNIER', label: 'Location saisonnière', description: 'Airbnb, rendement, fiscalité, réglementation', icon: Home, path: '/dashboard/simulateurs/immobilier/saisonnier' },
    ],
  },

  // ─── 4. PATRIMOINE FINANCIER ───
  {
    id: 'financier',
    label: 'Patrimoine financier',
    description: 'Assurance-vie, épargne, PEA, CTO, projection des placements existants',
    icon: TrendingUp,
    gradient: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    simulateurs: [
      { type: 'ASSURANCE_VIE', label: 'Assurance-vie', description: 'Projection capital, rachat partiel/total, fiscalité, succession (152 500 €)', icon: Shield, path: '/dashboard/simulateurs/assurance-vie' },
      { type: 'EPARGNE', label: 'Projection épargne', description: 'Capitalisation long terme, intérêts composés, objectif patrimoine', icon: TrendingUp, path: '/dashboard/simulateurs/epargne' },
      { type: 'COMPARATIF_ENVELOPPES', label: 'Comparatif PEA / AV / CTO', description: 'Fiscalité comparée des enveloppes d\'investissement', icon: BarChart3, path: '/dashboard/simulateurs/investment-vehicle-comparison' },
      { type: 'CALC_BUDGET', label: 'Analyse budgétaire', description: 'Revenus vs charges, taux d\'épargne, capacité d\'investissement', icon: Wallet, path: '/dashboard/calculateurs/budget', isCalculateur: true },
    ],
  },

  // ─── 5. RETRAITE ───
  {
    id: 'retraite',
    label: 'Retraite',
    description: 'Estimation pension, gap de revenus, PER salariés/TNS, stratégie d\'épargne retraite',
    icon: Briefcase,
    gradient: 'from-teal-500 to-emerald-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    simulateurs: [
      { type: 'RETRAITE_COMPLET', label: 'Retraite — Simulation complète', description: 'Estimation pension régime de base + complémentaire, gap, projection épargne', icon: Briefcase, path: '/dashboard/simulateurs/retraite' },
      { type: 'PENSION', label: 'Estimation pension', description: 'Calcul pension obligatoire par régime (CNAV, AGIRC-ARRCO, RSI...)', icon: Calculator, path: '/dashboard/simulateurs/pension' },
      { type: 'RETRAITE_COMPARATIF', label: 'Comparatif scénarios retraite', description: 'Départ anticipé, surcote, rachat trimestres, cumul emploi-retraite', icon: Scale, path: '/dashboard/simulateurs/retirement-comparison' },
      { type: 'PER_SALARIES', label: 'PER Salariés', description: 'Versements déductibles, économie IR, projection capital à la retraite', icon: PiggyBank, path: '/dashboard/simulateurs/per-salaries' },
      { type: 'PER_TNS', label: 'PER TNS (Madelin)', description: 'Plafonds Madelin, déduction BIC/BNC, capital ou rente viagère', icon: PiggyBank, path: '/dashboard/simulateurs/per-tns' },
    ],
  },

  // ─── 6. TRANSMISSION / SUCCESSION ───
  {
    id: 'transmission',
    label: 'Transmission & Succession',
    description: 'Droits de succession, donation, assurance-vie successorale, stratégies d\'optimisation',
    icon: Gift,
    gradient: 'from-pink-500 to-fuchsia-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    simulateurs: [
      { type: 'SUCCESSION_COMPLET', label: 'Succession complète', description: 'Dévolution légale, DDV, fiscalité, assurance-vie, démembrement', icon: Users, path: '/dashboard/simulateurs/succession' },
      { type: 'SUCCESSION_COMPARE', label: 'Comparatif stratégies successorales', description: 'Avec/sans donation, AV, démembrement, SCI, Dutreil', icon: Scale, path: '/dashboard/simulateurs/succession-comparison' },
      { type: 'DONATION_OPTIMIZER', label: 'Optimiseur de donation', description: 'Calendrier optimal de donations, abattements renouvelables tous les 15 ans', icon: Gift, path: '/dashboard/simulateurs/donation-optimizer' },
      { type: 'CALC_SUCCESSION_RAPIDE', label: 'Calculateur succession rapide', description: 'Estimation rapide des droits par héritier', icon: Calculator, path: '/dashboard/calculateurs/succession', isCalculateur: true },
      { type: 'CALC_DONATION_RAPIDE', label: 'Calculateur donation rapide', description: 'Droits de donation avec barème et abattements', icon: Calculator, path: '/dashboard/calculateurs/donation', isCalculateur: true },
    ],
  },

  // ─── 7. CRÉDIT & ENDETTEMENT ───
  {
    id: 'credit',
    label: 'Crédit & Endettement',
    description: 'Capacité d\'emprunt, restructuration, mensualités, amortissement, PTZ',
    icon: CreditCard,
    gradient: 'from-sky-500 to-blue-500',
    bgColor: 'bg-sky-50',
    iconColor: 'text-sky-600',
    simulateurs: [
      { type: 'CAPACITE_EMPRUNT', label: 'Capacité d\'emprunt', description: 'Budget empruntable selon revenus, charges, taux d\'endettement 35%', icon: CreditCard, path: '/dashboard/simulateurs/capacite-emprunt' },
      { type: 'MENSUALITE', label: 'Mensualité & Amortissement', description: 'Tableau d\'amortissement complet, coût total crédit, assurance', icon: Calculator, path: '/dashboard/simulateurs/mensualite' },
      { type: 'PTZ', label: 'PTZ 2025', description: 'Éligibilité, montant, zones, conditions de ressources', icon: Home, path: '/dashboard/simulateurs/ptz' },
      { type: 'CALC_CAPACITE', label: 'Calculateur capacité rapide', description: 'Estimation rapide de la capacité d\'emprunt', icon: Calculator, path: '/dashboard/calculateurs/capacite-emprunt', isCalculateur: true },
    ],
  },

  // ─── 8. PRÉVOYANCE & PROTECTION ───
  {
    id: 'prevoyance',
    label: 'Prévoyance & Protection',
    description: 'Couverture décès, invalidité, incapacité, gaps de protection, TNS',
    icon: Heart,
    gradient: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    simulateurs: [
      { type: 'PREVOYANCE_TNS', label: 'Prévoyance TNS', description: 'Analyse gaps décès, invalidité, incapacité — régime obligatoire vs besoins', icon: Heart, path: '/dashboard/simulateurs/prevoyance-tns' },
    ],
  },
]

const fmt = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

export function SimulateurPanel({ dossier, onSimulationSaved, onNext, onPrev }: SimulateurPanelProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [expandedAxes, setExpandedAxes] = useState<string[]>(['famille', 'fiscalite', 'immobilier', 'financier', 'retraite', 'transmission'])
  const nbSelectionnees = dossier.simulations.filter(s => s.selectionne).length

  const toggleAxe = (axeId: string) => {
    setExpandedAxes(prev =>
      prev.includes(axeId) ? prev.filter(a => a !== axeId) : [...prev, axeId]
    )
  }

  const getSimsDoneForAxe = (axe: AxeEtude) => {
    const axeTypes = axe.simulateurs.map(s => s.type)
    return dossier.simulations.filter(s => axeTypes.includes(s.simulateurType)).length
  }

  const handleToggleSelection = async (simulationId: string, currentValue: boolean) => {
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}/simulations/${simulationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionne: !currentValue })
      })
      onSimulationSaved()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleDeleteSimulation = async (simulationId: string) => {
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}/simulations/${simulationId}`, {
        method: 'DELETE'
      })
      toast({ title: 'Simulation supprimée', variant: 'success' })
      onSimulationSaved()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapeActuelle: 'PRECONISATION' })
      })
      onNext()
    } finally {
      setIsLoading(false)
    }
  }

  const getMainValue = (resultats: Record<string, unknown>): number | null => {
    const r = resultats as any
    const v = r.montant ?? r.impotTotal ?? r.droitsEstimes ?? r.capitalRetraite ?? r.patrimoineNet ?? r.capaciteEmprunt ?? r.capitalFinal ?? r.pensionTotaleMensuelle ?? r.rendementNet ?? r.cashflowNet ?? r.totalDroits ?? r.economieIR ?? r.ifi
    return typeof v === 'number' ? v : null
  }

  const totalAxes = AXES_ETUDE.length
  const axesAvecSim = AXES_ETUDE.filter(a => getSimsDoneForAxe(a) > 0).length

  return (
    <div className="space-y-6">
      {/* Header global */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Étude patrimoniale complète</h3>
                <p className="text-sm text-muted-foreground">
                  {totalAxes} axes d&apos;analyse — {dossier.simulations.length} simulation(s) réalisée(s) sur {axesAvecSim} axe(s)
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-3">
                <div className="text-xl font-bold text-primary">{dossier.simulations.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Simulations</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-3">
                <div className="text-xl font-bold text-primary">{nbSelectionnees}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sélectionnées</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ AXES D'ÉTUDE ═══ */}
      <div className="space-y-3">
        {AXES_ETUDE.map(axe => {
          const AxeIcon = axe.icon
          const isExpanded = expandedAxes.includes(axe.id)
          const simsDone = getSimsDoneForAxe(axe)

          return (
            <div key={axe.id} className="rounded-xl border bg-card overflow-hidden">
              {/* Axe header (collapsible) */}
              <button
                onClick={() => toggleAxe(axe.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', axe.bgColor)}>
                  <AxeIcon className={cn('w-4.5 h-4.5', axe.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{axe.label}</span>
                    {simsDone > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        {simsDone}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 ml-auto mr-2">
                      {axe.simulateurs.length} outil(s)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{axe.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Simulateurs de cet axe */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {axe.simulateurs.map(sim => {
                      const Icon = sim.icon
                      const alreadyDone = dossier.simulations.some(s => s.simulateurType === sim.type)

                      return (
                        <Link
                          key={sim.type}
                          href={`${sim.path}?dossierId=${dossier.id}&returnUrl=/dashboard/dossiers/${dossier.id}`}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg transition-all group',
                            alreadyDone
                              ? 'bg-emerald-50/70 border border-emerald-200 hover:border-emerald-300'
                              : 'bg-muted/20 hover:bg-muted/50 border border-transparent hover:border-muted-foreground/15'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', axe.bgColor)}>
                            <Icon className={cn('w-4 h-4', axe.iconColor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs leading-tight">{sim.label}</span>
                              {alreadyDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                              {sim.isCalculateur && (
                                <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                                  CALC
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{sim.description}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ═══ SIMULATIONS EFFECTUÉES ═══ */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  Simulations réalisées
                  {dossier.simulations.length > 0 && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      ({nbSelectionnees}/{dossier.simulations.length} incluses dans le rapport)
                    </span>
                  )}
                </h3>
              </div>
            </div>
          </div>

          {dossier.simulations.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-7 h-7 text-muted-foreground/25" />
              </div>
              <p className="font-medium text-sm text-muted-foreground">Aucune simulation enregistrée</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Lancez des simulateurs depuis les axes ci-dessus — les résultats seront automatiquement enregistrés
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dossier.simulations.map(sim => {
                const mainVal = sim.resultats ? getMainValue(sim.resultats as Record<string, unknown>) : null

                return (
                  <div
                    key={sim.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all',
                      sim.selectionne
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-transparent bg-muted/15 hover:bg-muted/30'
                    )}
                  >
                    <button
                      onClick={() => handleToggleSelection(sim.id, sim.selectionne)}
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                        sim.selectionne
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30 hover:border-primary/50'
                      )}
                    >
                      {sim.selectionne && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{sim.nom}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {sim.simulateurType.replace(/_/g, ' ')}
                      </div>
                      {sim.resultats && typeof sim.resultats === 'object' && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {Object.entries(sim.resultats as Record<string, unknown>)
                            .filter(([k, v]) => typeof v === 'number' && !['montant', 'ordre'].includes(k))
                            .slice(0, 4)
                            .map(([key, val]) => (
                              <span key={key} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</span>
                                {typeof val === 'number' && Math.abs(val as number) >= 100
                                  ? fmt(val as number)
                                  : String(val)}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {mainVal !== null && (
                      <div className={cn('text-base font-bold shrink-0', sim.selectionne ? 'text-primary' : 'text-foreground/60')}>
                        {fmt(mainVal)}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/30 hover:text-destructive shrink-0"
                      onClick={() => handleDeleteSimulation(sim.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Button>
        <Button onClick={handleContinue} disabled={isLoading} size="lg" className="gap-2 px-6">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Continuer vers les préconisations
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
