/**
 * Moteur d'Audit Patrimonial Complet — V3
 * 
 * Analyseur pur : reçoit les données pré-calculées des hooks/tabs
 * (useBudgetSummary, useFiscaliteSummary, usePatrimoineSummary, useClientCalculators)
 * et produit scoring, narratifs et recommandations croisées.
 * Aucun appel API — toute la donnée vient du wizard orchestrateur.
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import type { BudgetSummary } from '../../../hooks/useBudgetSummary'
import type { FiscaliteSummary } from '../../../hooks/useFiscaliteSummary'
import type { PatrimoineSummary } from '../../../hooks/usePatrimoineSummary'
import type {
  BudgetAnalysisResult,
  DebtCapacityResult,
  IncomeTaxResult,
  WealthTaxResult,
  TaxOptimizationResult,
  EmergencyFundResult,
  RetirementSimulationResult,
} from '../../../hooks/useClientCalculators'

// ============================================================================
// TYPES — BUDGET
// ============================================================================

export interface AuditBudget {
  revenusMensuels: number
  revenusAnnuels: number
  detailRevenus: { categorie: string; montant: number; poids: number }[]
  chargesMensuelles: number
  chargesAnnuelles: number
  detailCharges: { categorie: string; montant: number; poids: number }[]
  mensualitesCredits: number
  resteAVivre: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEffort: number
  tauxEpargne: number
  repartitionIdeale: { categorie: string; recommande: number; actuel: number; ecart: number }[]
  scoreSante: 'excellent' | 'bon' | 'attention' | 'critique'
  recommandations: string[]
  alertes: string[]
  narratif: string
}

// ============================================================================
// TYPES — EMPRUNT
// ============================================================================

export interface EnveloppeEmprunt {
  duree: number
  tauxInteret: number
  montantMax: number
  mensualite: number
  coutTotal: number
  interetsTotal: number
}

export interface AuditEmprunt {
  tauxEndettementActuel: number
  capaciteEndettementResiduelle: number
  mensualiteMaxSupportable: number
  enveloppes: EnveloppeEmprunt[]
  detailDettesExistantes: { nom: string; mensualite: number; capitalRestant: number; taux: number }[]
  affordability: 'excellent' | 'good' | 'limited' | 'insufficient'
  recommandations: string[]
  narratif: string
}

// ============================================================================
// TYPES — FISCALITÉ
// ============================================================================

export interface DetailTranche { taux: number; base: number; impot: number }

export interface AuditIR {
  revenuBrut: number
  deductions: number
  revenuImposable: number
  nombreParts: number
  quotientFamilial: number
  impotBrut: number
  plafonnementQF: number
  decote: number
  impotNet: number
  cehr: number
  impotTotal: number
  contributionsSociales: number
  tauxEffectif: number
  tauxMoyen: number
  tmi: number
  tranches: DetailTranche[]
  revenuNetApresImpot: number
  narratif: string
}

export interface AuditIFI {
  patrimoineImmobilierBrut: number
  abattementRP: number
  dettesDeductibles: number
  patrimoineImposable: number
  montantIFI: number
  assujetti: boolean
  tauxEffectif: number
  narratif: string
}

export interface StrategieFiscale {
  nom: string
  description: string
  economie: number
  priorite: 'high' | 'medium' | 'low'
  detailMiseEnOeuvre: string
}

export interface AuditFiscalite {
  ir: AuditIR | null
  ifi: AuditIFI
  optimisation: {
    impotActuel: number
    economiesPotentielles: number
    strategies: StrategieFiscale[]
    recommandations: string[]
  } | null
  impactRevenusFonciers: {
    revenusFonciersAnnuels: number
    regimeFiscal: string
    baseImposable: number
    irFoncier: number
    psFoncier: number
    totalFiscaliteFonciere: number
    tauxImpositionGlobal: number
    narratif: string
  } | null
  narratif: string
}

// ============================================================================
// TYPES — ÉPARGNE DE PRÉCAUTION
// ============================================================================

export interface AuditEpargnePrecaution {
  chargesMensuelles: number
  moisRecommandes: number
  montantCible: number
  epargneLiquideActuelle: number
  detailEpargneLiquide: { support: string; montant: number }[]
  gap: number
  moisCouverts: number
  priorite: 'critical' | 'high' | 'medium' | 'low'
  planConstitution: { moisEpargne: number; montantMensuel: number } | null
  narratif: string
}

// ============================================================================
// TYPES — IMMOBILIER
// ============================================================================

export interface ProjectionAnnuelleImmo {
  annee: number
  loyerAnnuel: number
  chargesAnnuelles: number
  interetsCredit: number
  resultatFoncier: number
  fiscalite: number
  cashFlowNet: number
  capitalRestantDu: number
  patrimoineNet: number
}

export interface AuditBienImmobilier {
  id: string
  nom: string
  type: string
  valeur: number
  poidsPatrimoine: number
  rendementLocatifBrut: number | null
  rendementLocatifNet: number | null
  loyerMensuel: number | null
  chargesAnnuelles: number | null
  cashFlowMensuel: number | null
  tri: number | null
  scenarioRevente: {
    horizons: {
      annees: number
      prixEstime: number
      plusValueBrute: number
      abattementIR: number
      abattementPS: number
      pvImposableIR: number
      pvImposablePS: number
      impotIR: number
      prelevementsSociaux: number
      totalFiscalite: number
      netVendeur: number
      gainNetTotal: number
    }[]
    exonerationIRDate: number | null
    exonerationPSDate: number | null
    narratif: string
  } | null
  fiscaliteLocative: {
    regimeFiscal: string
    revenuImposable: number
    irAnnuel: number
    psAnnuel: number
    totalAnnuel: number
    tauxImpositionGlobal: number
  } | null
  projectionCashFlow: ProjectionAnnuelleImmo[] | null
  analyse: string
}

export interface AuditImmobilier {
  totalImmobilier: number
  poidsPatrimoine: number
  biens: AuditBienImmobilier[]
  rendementMoyenBrut: number
  concentrationRisque: boolean
  cashFlowGlobalMensuel: number
  patrimoineImmobilierNet: number
  narratif: string
}

// ============================================================================
// TYPES — FINANCIER
// ============================================================================

export interface AuditActifFinancier {
  id: string
  nom: string
  type: string
  category: string
  valeur: number
  poidsPortefeuille: number
  poidsPatrimoine: number
  enveloppeFiscale: string
  risque: 'faible' | 'modere' | 'eleve'
  liquidite: 'immediate' | 'moyenne' | 'faible'
  avantagesFiscaux: string
  commentaire: string
}

export interface AuditFinancier {
  totalFinancier: number
  poidsPatrimoine: number
  allocationParType: { type: string; valeur: number; poids: number }[]
  allocationParRisque: { risque: string; valeur: number; poids: number }[]
  allocationParLiquidite: { liquidite: string; valeur: number; poids: number }[]
  scoreRisque: number
  scoreDiversification: number
  actifs: AuditActifFinancier[]
  recommandationAllocation: { categorie: string; actuel: number; cible: number; ecart: number }[]
  narratif: string
}

// ============================================================================
// TYPES — RETRAITE
// ============================================================================

export interface EstimationPension {
  pensionBaseMensuelle: number
  pensionComplementaireMensuelle: number
  pensionTotaleMensuelle: number
  tauxRemplacement: number
  trimestresValides: number
  trimestresRestants: number
  trimestresRequis: number
  trimestresManquants: number
  decoteSurcote: number
  decoteSurcoteLabel: string
  ageTauxPlein: number
  pointsComplementaires: number
  valeurPoint: number
}

export interface EvolutionPensionParAge {
  age: number
  trimestres: number
  trimestresManquants: number
  decoteSurcotePct: number
  decoteSurcoteLabel: string
  pensionMensuelle: number
  tauxRemplacement: number
  differenceVsChoisi: number
  estChoisi: boolean
  estOptimal: boolean
}

export interface AnalyseGapRetraite {
  revenuSouhaite: number
  pensionEstimee: number
  gapMensuel: number
  gapAnnuel: number
  capitalNecessaire4Pct: number
  narratif: string
}

export interface ScenarioRetraite {
  label: string
  rendement: number
  ageDepart: number
  capitalRetraite: number
  revenuDurable: number
  gapMensuel: number
  capitalEpuiseAge: number | null
  faisable: boolean
  projection: { age: number; capital: number; phase: string; retrait: number; interets: number }[]
}

export interface AuditRetraite {
  ageActuel: number
  revenuActuel: number
  estimationPension: EstimationPension
  evolutionParAge: EvolutionPensionParAge[]
  analyseGap: AnalyseGapRetraite
  epargneRetraiteActuelle: number
  detailEpargneRetraite: { support: string; montant: number }[]
  contributionMensuelleActuelle: number
  scenarios: ScenarioRetraite[]
  recommandations: { priorite: string; type: string; description: string }[]
  narratif: string
}

// ============================================================================
// TYPES — SUCCESSION
// ============================================================================

export interface DetailDMTGHeritier {
  lien: string
  partBrute: number
  abattement: number
  taxable: number
  tranches: DetailTranche[]
  droits: number
  tauxEffectif: number
}

export interface AuditSuccession {
  patrimoineNetTaxable: number
  situationFamiliale: string
  regimeMatrimonial: string
  nbEnfants: number
  droitsEstimes: number
  tauxEffectif: number
  abattementTotal: number
  detailParHeritier: DetailDMTGHeritier[]
  impactAssuranceVie: {
    totalAV: number
    versementsAvant70: number
    versementsApres70: number
    abattement990I: number
    taxable990I: number
    droits990I: number
    abattement757B: number
    taxable757B: number
    droits757B: number
    droitsTotalAV: number
    economieVsDMTG: number
    narratif: string
  } | null
  strategiesOptimisation: {
    strategie: string
    description: string
    detailMiseEnOeuvre: string
    economieEstimee: number
    priorite: 'haute' | 'moyenne' | 'basse'
  }[]
  narratif: string
}

// ============================================================================
// TYPES — SYNTHÈSE
// ============================================================================

export interface ScoreTheme {
  theme: string
  score: number
  verdict: string
  couleur: string
  commentaire: string
}

export interface AuditSynthese {
  scoreGlobal: number
  scores: ScoreTheme[]
  pointsForts: string[]
  pointsVigilance: string[]
  actionsPrioritaires: string[]
  narratifGlobal: string
}

// ============================================================================
// TYPES — AUTO-PRÉCONISATIONS
// ============================================================================

export interface AutoPreconisation {
  id: string
  titre: string
  description: string
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  categorie: 'budget' | 'fiscalite' | 'immobilier' | 'financier' | 'retraite' | 'succession' | 'protection' | 'epargne'
  produit?: string
  montantEstime?: number
  objectif: string
  avantages: string
  risques?: string
  horizonTemporel: 'court' | 'moyen' | 'long'
  impactFiscalAnnuel?: number
  scoreImpact: number // 0-100
}

export interface AuditPatrimonialComplet {
  dateAudit: string
  nomClient: string
  budget: AuditBudget
  emprunt: AuditEmprunt
  fiscalite: AuditFiscalite
  epargnePrecaution: AuditEpargnePrecaution
  immobilier: AuditImmobilier
  financier: AuditFinancier
  retraite: AuditRetraite | null
  succession: AuditSuccession
  synthese: AuditSynthese
  preconisationsAuto: AutoPreconisation[]
}

// ============================================================================
// HELPERS
// ============================================================================

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`
}

function ageFromBirthDate(bd: string | undefined): number {
  if (!bd) return 0
  const birth = new Date(bd)
  if (isNaN(birth.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

// ============================================================================
// TYPE D'ENTRÉE — Réutilise les données déjà calculées par les hooks/tabs
// ============================================================================


export interface AuditClientInfo {
  id: string
  firstName: string
  lastName: string
  birthDate?: string
  maritalStatus?: string
  matrimonialRegime?: string
  numberOfChildren?: number
  profession?: string
  annualIncome?: number
}

export interface AuditActif {
  id: string; type: string; category: string; name: string; value: number
  acquisitionValue?: number; acquisitionDate?: string | null
}

export interface AuditPassif {
  id: string; type: string; name: string; remainingAmount: number; monthlyPayment: number; interestRate: number
}

export interface AuditInputData {
  // Données client de base
  client: AuditClientInfo
  actifs: AuditActif[]
  passifs: AuditPassif[]

  // Données budget pré-calculées (de useBudgetSummary)
  budgetSummary: BudgetSummary

  // Données fiscales pré-calculées (de useFiscaliteSummary)
  fiscaliteSummary: FiscaliteSummary

  // Données patrimoine pré-calculées (de usePatrimoineSummary)
  patrimoineSummary: PatrimoineSummary

  // Résultats des calculateurs backend (de useClientCalculators)
  calculators: {
    budgetAnalysis: BudgetAnalysisResult | null
    debtCapacity: DebtCapacityResult | null
    incomeTax: IncomeTaxResult | null
    wealthTax: WealthTaxResult | null
    taxOptimization: TaxOptimizationResult | null
    emergencyFund: EmergencyFundResult | null
    retirementSimulation: RetirementSimulationResult | null
  }

  // Détail revenus/charges par catégorie (de useBudgetSummary ou TabBudgetComplet)
  detailRevenus: { categorie: string; montant: number; poids: number }[]
  detailCharges: { categorie: string; montant: number; poids: number }[]

  // Catégorisation fine des revenus mensuels (de useClientCalculators.clientData)
  salaires: number
  revenusLocatifs: number
  revenusInvestissement: number
  chargesLogement: number
  chargesTransport: number
  chargesAlimentation: number
}

// ============================================================================
// MOTEUR PRINCIPAL — Analyse pure, sans appels API
// ============================================================================

export function runAuditPatrimonialComplet(
  input: AuditInputData,
): AuditPatrimonialComplet {

  const { client, actifs, passifs, budgetSummary, fiscaliteSummary, patrimoineSummary, calculators, detailRevenus, detailCharges } = input

  // ---- 0. EXTRACTION DES DONNÉES PRÉ-CALCULÉES ----
  const revenusMensuels = budgetSummary.totalRevenus
  const chargesMensuelles = budgetSummary.totalCharges
  const mensualitesCredits = budgetSummary.totalDettes
  const revenusAnnuels = revenusMensuels * 12
  const capitalRestant = passifs.reduce((s, p) => s + (p.remainingAmount || 0), 0)
  const totalActifs = actifs.reduce((s, a) => s + a.value, 0)
  const patrimoineNet = totalActifs - capitalRestant
  const age = ageFromBirthDate(client.birthDate)
  const isAlreadyRetired = age >= 62 && ((client.profession || '').toLowerCase().includes('retrait') || (client.profession || '').toLowerCase().includes('retired') || age >= 67)
  const nbEnfants = client.numberOfChildren || 0

  // Patrimoine par catégorie (de patrimoineSummary)
  const RP_TYPES = ['REAL_ESTATE_MAIN', 'RESIDENCE_PRINCIPALE', 'IMMOBILIER_RP']
  const LOCATIF_TYPES = ['REAL_ESTATE_RENTAL', 'REAL_ESTATE_COMMERCIAL', 'IMMOBILIER_LOCATIF', 'IMMOBILIER_COMMERCIAL']
  const patrimoineImmobilier = patrimoineSummary.immobilier
  const patrimoineFinancier = patrimoineSummary.financier
  const patrimoinePro = patrimoineSummary.professionnel

  // Catégorisation revenus (de input)
  const salaires = input.salaires
  const revenusLocatifs = input.revenusLocatifs
  const revenusInvest = input.revenusInvestissement
  const chargesLogement = input.chargesLogement
  const chargesTransport = input.chargesTransport
  const chargesAlim = input.chargesAlimentation

  // Quotient familial et capacité d'épargne
  const qf = fiscaliteSummary.partsFiscales
  const capaciteEpargneBrute = Math.max(0, revenusMensuels - chargesMensuelles - mensualitesCredits)

  // Résultats calculateurs backend pré-chargés (typés)
  const budgetCalc = calculators.budgetAnalysis
  const debtCalc = calculators.debtCapacity
  const taxCalc = calculators.incomeTax
  const ifiCalc = calculators.wealthTax
  const optiCalc = calculators.taxOptimization
  const emergCalc = calculators.emergencyFund
  const retCalc = calculators.retirementSimulation

  // ---- 2. CONSTRUCTION AUDIT BUDGET ----
  const resteAVivre = revenusMensuels - chargesMensuelles - mensualitesCredits
  const tauxEffort = revenusMensuels > 0 ? ((chargesMensuelles + mensualitesCredits) / revenusMensuels) * 100 : 0
  const tauxEpargne = revenusMensuels > 0 ? (capaciteEpargneBrute / revenusMensuels) * 100 : 0
  const scoreBudget: AuditBudget['scoreSante'] = tauxEpargne > 20 ? 'excellent' : tauxEpargne > 10 ? 'bon' : tauxEpargne > 0 ? 'attention' : 'critique'

  const budgetRecos: string[] = []
  if (tauxEffort > 50) budgetRecos.push('Votre taux d\'effort dépasse 50% — situation tendue, réduire les charges est prioritaire.')
  if (tauxEpargne < 10) budgetRecos.push('Votre taux d\'épargne est inférieur à 10% — insuffisant pour construire un patrimoine.')
  if (resteAVivre < 1000) budgetRecos.push('Le reste à vivre est faible — attention aux imprévus.')
  if (capaciteEpargneBrute > 500) budgetRecos.push(`Vous disposez de ${fmt(capaciteEpargneBrute)}/mois de capacité d'épargne à orienter vers vos objectifs.`)

  const budgetAlertes: string[] = []
  if (resteAVivre < 0) budgetAlertes.push('⚠️ Budget déficitaire — les dépenses dépassent les revenus.')
  if (mensualitesCredits > revenusMensuels * 0.33) budgetAlertes.push('⚠️ Taux d\'endettement supérieur à 33% — risque de surendettement.')

  const budget: AuditBudget = {
    revenusMensuels, revenusAnnuels, detailRevenus,
    chargesMensuelles, chargesAnnuelles: chargesMensuelles * 12, detailCharges,
    mensualitesCredits, resteAVivre, capaciteEpargneMensuelle: capaciteEpargneBrute,
    capaciteEpargneAnnuelle: capaciteEpargneBrute * 12,
    tauxEffort, tauxEpargne,
    repartitionIdeale: [
      { categorie: 'Besoins essentiels (50%)', recommande: 50, actuel: revenusMensuels > 0 ? ((chargesLogement + chargesAlim) / revenusMensuels) * 100 : 0, ecart: 0 },
      { categorie: 'Envies (30%)', recommande: 30, actuel: revenusMensuels > 0 ? ((chargesMensuelles - chargesLogement - chargesAlim) / revenusMensuels) * 100 : 0, ecart: 0 },
      { categorie: 'Épargne (20%)', recommande: 20, actuel: tauxEpargne, ecart: tauxEpargne - 20 },
    ],
    scoreSante: scoreBudget,
    recommandations: budgetRecos, alertes: budgetAlertes,
    narratif: `${client.firstName} ${client.lastName} dispose de revenus mensuels de ${fmt(revenusMensuels)}, soit ${fmt(revenusAnnuels)} annuels. Après déduction des charges courantes (${fmt(chargesMensuelles)}/mois) et des mensualités de crédits (${fmt(mensualitesCredits)}/mois), le reste à vivre s'établit à ${fmt(resteAVivre)}/mois. Le taux d'effort global est de ${pct(tauxEffort)}, ce qui est ${tauxEffort > 50 ? 'préoccupant' : tauxEffort > 33 ? 'à surveiller' : 'maîtrisé'}. La capacité d'épargne mensuelle est de ${fmt(capaciteEpargneBrute)}, soit un taux d'épargne de ${pct(tauxEpargne)}.`,
  }

  // ---- 3. AUDIT EMPRUNT (utilise debtCalc de useClientCalculators) ----
  const tauxEndettement = revenusMensuels > 0 ? (mensualitesCredits / revenusMensuels) * 100 : 0
  const capaciteResiduelle = Math.max(0, revenusMensuels * 0.33 - mensualitesCredits)
  const mensualiteMaxHCSF = revenusMensuels * RULES.immobilier.hcsf.taux_endettement_max

  // Calculer les enveloppes d'emprunt par durée à partir de la capacité résiduelle
  const buildEnveloppeFromCapacite = (duree: number, taux: number): EnveloppeEmprunt => {
    const tauxMensuel = taux / 100 / 12
    const n = duree * 12
    const montantMax = capaciteResiduelle > 0 && tauxMensuel > 0
      ? Math.round(capaciteResiduelle * ((1 - Math.pow(1 + tauxMensuel, -n)) / tauxMensuel))
      : 0
    const coutTotal = capaciteResiduelle * n
    const interetsTotal = Math.max(0, coutTotal - montantMax)
    return { duree, tauxInteret: taux, montantMax, mensualite: Math.round(capaciteResiduelle), coutTotal: Math.round(coutTotal), interetsTotal: Math.round(interetsTotal) }
  }

  // Si on a le résultat du calculateur backend, utiliser le montant max pour 20 ans
  const enveloppe20 = debtCalc
    ? { duree: 20, tauxInteret: RULES.immobilier.taux_credit_moyen.duree_20, montantMax: Number(debtCalc.maxLoanAmount || 0), mensualite: Math.round(Number(debtCalc.maxMonthlyPayment || capaciteResiduelle)), coutTotal: 0, interetsTotal: 0 }
    : buildEnveloppeFromCapacite(20, RULES.immobilier.taux_credit_moyen.duree_20)

  const emprunt: AuditEmprunt = {
    tauxEndettementActuel: tauxEndettement,
    capaciteEndettementResiduelle: capaciteResiduelle,
    mensualiteMaxSupportable: mensualiteMaxHCSF,
    enveloppes: [
      buildEnveloppeFromCapacite(15, RULES.immobilier.taux_credit_moyen.duree_15),
      enveloppe20,
      buildEnveloppeFromCapacite(25, RULES.immobilier.taux_credit_moyen.duree_25),
    ],
    detailDettesExistantes: passifs.map(p => ({
      nom: p.name, mensualite: p.monthlyPayment, capitalRestant: p.remainingAmount, taux: p.interestRate,
    })),
    affordability: debtCalc?.status === 'safe' ? 'excellent' : debtCalc?.status === 'warning' ? 'limited' : debtCalc?.status === 'critical' ? 'insufficient' : (tauxEndettement < 15 ? 'excellent' : tauxEndettement < 25 ? 'good' : tauxEndettement < 33 ? 'limited' : 'insufficient'),
    recommandations: debtCalc?.recommendation ? [debtCalc.recommendation] : [],
    narratif: `Le taux d'endettement actuel est de ${pct(tauxEndettement)} pour une norme bancaire de 33%. ${capaciteResiduelle > 0 ? `Il reste une capacité résiduelle de ${fmt(capaciteResiduelle)}/mois, permettant de financer un nouveau projet jusqu'à ${fmt(enveloppe20.montantMax)} sur 20 ans.` : 'La capacité d\'emprunt est saturée — aucun nouveau financement ne serait accepté en l\'état.'} ${tauxEndettement > 33 ? 'Attention : le taux d\'endettement dépasse le seuil réglementaire HCSF de 35%.' : ''}`,
  }

  // ---- 4. AUDIT FISCALITÉ (utilise taxCalc, ifiCalc, optiCalc de useClientCalculators + fiscaliteSummary) ----

  // Construction IR détaillé (IncomeTaxResult + FiscaliteSummary)
  const irTranches: DetailTranche[] = (taxCalc?.brackets || []).map((b) => ({
    taux: b.rate * 100, base: Number(b.amount || 0), impot: Number(b.tax || 0)
  }))
  const irImpotNet = taxCalc?.totalTax ?? fiscaliteSummary.irEstime
  const irCehr = 0 // CEHR calculé séparément si nécessaire
  const irTmiVal = taxCalc?.marginalRate ?? (fiscaliteSummary.tmi / 100)
  const irTotal = irImpotNet + irCehr
  const irRevenuBrut = taxCalc?.grossIncome ?? fiscaliteSummary.revenusBruts
  const irDeductions = revenusAnnuels * 0.1 // Abattement 10% forfaitaire
  const irRevenuImposable = taxCalc?.taxableIncome ?? fiscaliteSummary.revenuNetImposable
  const irTauxEffectif = taxCalc?.effectiveRate ?? (fiscaliteSummary.tauxEffectif / 100)
  const irRevenuNet = taxCalc?.netIncome ?? (revenusAnnuels - irTotal)

  const buildIRNarratif = (): string => {
    if (!taxCalc) return 'Aucun revenu imposable déclaré.'
    const parts: string[] = []
    parts.push(`Votre foyer fiscal déclare un revenu brut global de ${fmt(irRevenuBrut)}.`)
    parts.push(`Après application de l'abattement de 10% pour frais professionnels (${fmt(irDeductions)}), le revenu net imposable s'établit à ${fmt(irRevenuImposable)}.`)
    parts.push(`Avec ${qf} part(s) de quotient familial, votre impôt sur le revenu est calculé à ${fmt(irTotal)}.`)
    parts.push(`Votre tranche marginale d'imposition (TMI) est de ${(irTmiVal * 100).toFixed(0)}%, ce qui signifie que chaque euro supplémentaire gagné est taxé à ce taux.`)
    parts.push(`Le taux moyen d'imposition effectif est de ${pct(irTauxEffectif * 100)}, soit ${fmt(irTotal)} d'impôt pour ${fmt(irRevenuBrut)} de revenus.`)
    parts.push(`Après impôt, votre revenu net disponible annuel est de ${fmt(irRevenuNet)}, soit ${fmt(irRevenuNet / 12)}/mois.`)
    return parts.join(' ')
  }

  // Construction IFI
  const ifiAssujetti = patrimoineImmobilier >= RULES.ifi.seuil_assujettissement || Boolean(ifiCalc?.isSubject)
  const rpValue = actifs.find(a => RP_TYPES.includes(a.type))?.value || 0
  const abattementRP = rpValue * RULES.ifi.abattement_rp
  const ifiMontant = ifiCalc?.taxAmount ?? (fiscaliteSummary.ifiEstime || 0)

  const buildIFINarratif = (): string => {
    if (!ifiAssujetti) return `Votre patrimoine immobilier net de ${fmt(patrimoineImmobilier)} reste en-dessous du seuil d'assujettissement IFI de 1 300 000 €. Vous n'êtes pas redevable de l'IFI.`
    return `Votre patrimoine immobilier brut est de ${fmt(patrimoineImmobilier)}. Après abattement de 30% sur la résidence principale (${fmt(abattementRP)}) et déduction des dettes déductibles, le patrimoine imposable à l'IFI est de ${fmt(ifiCalc?.taxableWealth ?? (patrimoineImmobilier - abattementRP))}. L'IFI estimé s'élève à ${fmt(ifiMontant)}.`
  }

  // Construction optimisation avec detailMiseEnOeuvre + filtrage faisabilité
  const buildStrategies = (): StrategieFiscale[] => {
    if (!optiCalc) return []
    const raw = optiCalc.recommendations || []
    return raw.filter(s => s.name).map(s => {
      const eco = Number(s.taxSaving || 0)
      const nom = s.name || ''
      const nomLower = nom.toLowerCase()
      let priorite = 'medium' as 'high' | 'medium' | 'low'
      let description = s.description || ''
      let detailMiseEnOeuvre = `Contactez votre conseiller pour mettre en place cette stratégie d'optimisation de ${fmt(eco)}.`

      // ── Filtrage faisabilité ──
      // PER inutile si TMI <= 11% (économie marginale) ou si déjà retraité > 70 ans
      if (nomLower.includes('per') && (irTmiVal <= 0.11 || isAlreadyRetired)) {
        if (isAlreadyRetired) {
          description += ` ⚠️ Vous êtes déjà à la retraite — un versement PER est peu pertinent car le capital sera imposé à la sortie et le bénéfice fiscal de la déduction est limité à TMI ${(irTmiVal * 100).toFixed(0)}%.`
          priorite = 'low'
        } else if (irTmiVal <= 0.11) {
          description += ` ⚠️ Avec une TMI à ${(irTmiVal * 100).toFixed(0)}%, l'avantage fiscal du PER est limité. Privilégiez l'assurance-vie pour sa souplesse.`
          priorite = 'low'
        }
      }

      // Dons irréalistes si budget déficitaire
      if (nomLower.includes('don') && capaciteEpargneBrute <= 0) {
        description += ' ⚠️ Votre budget étant actuellement déficitaire, cette stratégie n\'est pas réalisable en l\'état. À reconsidérer une fois le budget rééquilibré.'
        priorite = 'low'
      }

      // Emploi à domicile : plafonner au réaliste
      if (nomLower.includes('emploi') && nomLower.includes('domicile') && capaciteEpargneBrute < 200) {
        description += ' ⚠️ Budget insuffisant pour supporter cette dépense actuellement.'
        priorite = 'low'
      }

      return { nom, description, economie: eco, priorite, detailMiseEnOeuvre }
    }).sort((a, b) => {
      const prio = { high: 0, medium: 1, low: 2 }
      return (prio[a.priorite] || 1) - (prio[b.priorite] || 1)
    })
  }

  // Revenus fonciers
  const revenusFonciersAnnuels = revenusLocatifs * 12
  const buildImpactFoncier = (): AuditFiscalite['impactRevenusFonciers'] => {
    if (revenusFonciersAnnuels <= 0) return null
    const seuilMicroFoncier = RULES.immobilier.micro_foncier.seuil
    const abatMicroFoncier = RULES.immobilier.micro_foncier.abattement
    const psTotal = RULES.ps.total
    const regime = revenusFonciersAnnuels <= seuilMicroFoncier ? 'Micro-foncier' : 'Réel'
    const baseImposable = regime === 'Micro-foncier' ? revenusFonciersAnnuels * (1 - abatMicroFoncier) : revenusFonciersAnnuels * 0.6
    const tmi = irTmiVal || 0.11
    const irFoncier = baseImposable * tmi
    const psFoncier = baseImposable * psTotal
    const total = irFoncier + psFoncier
    return {
      revenusFonciersAnnuels,
      regimeFiscal: regime,
      baseImposable,
      irFoncier: Math.round(irFoncier),
      psFoncier: Math.round(psFoncier),
      totalFiscaliteFonciere: Math.round(total),
      tauxImpositionGlobal: (tmi + psTotal) * 100,
      narratif: `Vos revenus fonciers annuels de ${fmt(revenusFonciersAnnuels)} sont imposés au régime ${regime}. ${regime === 'Micro-foncier' ? `Après abattement forfaitaire de ${(abatMicroFoncier * 100).toFixed(0)}%` : 'Après déduction des charges réelles'}, la base imposable est de ${fmt(baseImposable)}. L'imposition globale (IR TMI ${(tmi * 100).toFixed(0)}% + PS ${(psTotal * 100).toFixed(1)}%) représente ${fmt(Math.round(total))}/an, soit un taux global de ${pct((tmi + psTotal) * 100)}.`,
    }
  }

  const fiscalite: AuditFiscalite = {
    ir: taxCalc ? {
      revenuBrut: irRevenuBrut,
      deductions: irDeductions,
      revenuImposable: irRevenuImposable,
      nombreParts: qf,
      quotientFamilial: Math.round(irRevenuImposable / qf),
      impotBrut: taxCalc.totalTax ?? irTotal,
      plafonnementQF: 0,
      decote: 0,
      impotNet: irImpotNet,
      cehr: irCehr,
      impotTotal: irTotal,
      contributionsSociales: 0,
      tauxEffectif: irTauxEffectif,
      tauxMoyen: irRevenuBrut > 0 ? irTotal / irRevenuBrut : 0,
      tmi: irTmiVal * 100,
      tranches: irTranches,
      revenuNetApresImpot: irRevenuNet,
      narratif: buildIRNarratif(),
    } : null,
    ifi: {
      patrimoineImmobilierBrut: patrimoineImmobilier,
      abattementRP,
      dettesDeductibles: capitalRestant,
      patrimoineImposable: Math.max(0, patrimoineImmobilier - abattementRP - capitalRestant),
      montantIFI: ifiMontant,
      assujetti: ifiAssujetti,
      tauxEffectif: patrimoineImmobilier > 0 ? ifiMontant / patrimoineImmobilier : 0,
      narratif: buildIFINarratif(),
    },
    optimisation: optiCalc ? {
      impotActuel: irTotal,
      economiesPotentielles: optiCalc.totalPotentialSavings ?? optiCalc.potentialSavings ?? 0,
      strategies: buildStrategies(),
      recommandations: optiCalc.recommendations?.map(r => r.description) || [],
    } : null,
    impactRevenusFonciers: buildImpactFoncier(),
    narratif: (() => {
      const parts: string[] = []
      if (taxCalc) {
        parts.push(`L'impôt sur le revenu estimé est de ${fmt(irTotal)}, avec une TMI à ${(irTmiVal * 100).toFixed(0)}% et un taux effectif de ${pct(irTauxEffectif * 100)}.`)
      }
      if (ifiAssujetti) {
        parts.push(`Le patrimoine immobilier de ${fmt(patrimoineImmobilier)} rend le foyer assujetti à l'IFI pour un montant estimé de ${fmt(ifiMontant)}.`)
      } else {
        parts.push(`Le patrimoine immobilier de ${fmt(patrimoineImmobilier)} reste en-dessous du seuil IFI de 1 300 000 €.`)
      }
      if (revenusFonciersAnnuels > 0) {
        parts.push(`Les revenus fonciers de ${fmt(revenusFonciersAnnuels)}/an génèrent une fiscalité additionnelle de ${fmt(Math.round(revenusFonciersAnnuels * (irTmiVal + RULES.ps.total)))}/an.`)
      }
      if (optiCalc) {
        const eco = optiCalc.totalPotentialSavings ?? optiCalc.potentialSavings ?? 0
        if (eco > 0) parts.push(`Des stratégies d'optimisation permettraient d'économiser jusqu'à ${fmt(eco)}/an.`)
      }
      return parts.join(' ')
    })(),
  }

  // ---- 5. ÉPARGNE DE PRÉCAUTION ----
  const epargneLiquide = actifs
    .filter(a => ['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'LIVRET_A', 'LDD', 'LEP'].includes(a.type))
    .reduce((s, a) => s + a.value, 0)
  const montantCibleEpargne = (chargesMensuelles + mensualitesCredits) * 6
  const gapEpargne = Math.max(0, montantCibleEpargne - epargneLiquide)

  const liquidAssets = actifs.filter(a => ['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'LIVRET_A', 'LDD', 'LEP'].includes(a.type))
  const detailEpargneLiquide = liquidAssets.map(a => ({ support: a.name || a.type.replace(/_/g, ' '), montant: a.value }))
  const moisCouverts = (chargesMensuelles + mensualitesCredits) > 0 ? epargneLiquide / (chargesMensuelles + mensualitesCredits) : 0
  const prioriteEpargne: AuditEpargnePrecaution['priorite'] = gapEpargne > montantCibleEpargne * 0.8 ? 'critical' : gapEpargne > montantCibleEpargne * 0.3 ? 'high' : gapEpargne > 0 ? 'medium' : 'low'
  const planConstitution = gapEpargne > 0 && capaciteEpargneBrute > 0
    ? { moisEpargne: Math.ceil(gapEpargne / (capaciteEpargneBrute * 0.5)), montantMensuel: Math.round(capaciteEpargneBrute * 0.5) }
    : null

  const epargnePrecaution: AuditEpargnePrecaution = {
    chargesMensuelles: chargesMensuelles + mensualitesCredits,
    moisRecommandes: 6,
    montantCible: montantCibleEpargne,
    epargneLiquideActuelle: epargneLiquide,
    detailEpargneLiquide,
    gap: gapEpargne,
    moisCouverts: Math.round(moisCouverts * 10) / 10,
    priorite: prioriteEpargne,
    planConstitution,
    narratif: (() => {
      const parts: string[] = []
      parts.push(`L'épargne de précaution recommandée est de ${fmt(montantCibleEpargne)}, correspondant à 6 mois de charges fixes (${fmt(chargesMensuelles + mensualitesCredits)}/mois).`)
      parts.push(`Votre épargne liquide actuelle s'élève à ${fmt(epargneLiquide)}, répartie sur ${liquidAssets.length} support(s), couvrant ${moisCouverts.toFixed(1)} mois de charges.`)
      if (gapEpargne > 0) {
        parts.push(`Il manque ${fmt(gapEpargne)} pour atteindre l'objectif. Cette constitution est une priorité ${prioriteEpargne === 'critical' ? 'absolue' : prioriteEpargne === 'high' ? 'élevée' : 'modérée'}.`)
        if (planConstitution) {
          parts.push(`En épargnant ${fmt(planConstitution.montantMensuel)}/mois (50% de votre capacité d'épargne), vous atteindrez cet objectif en environ ${planConstitution.moisEpargne} mois.`)
        }
      } else {
        parts.push('Votre réserve de sécurité est constituée. Vous pouvez orienter votre capacité d\'épargne vers des placements à plus long terme.')
      }
      return parts.join(' ')
    })(),
  }

  // ---- 6. ANALYSE IMMOBILIÈRE APPROFONDIE ----
  const biensImmo = actifs.filter(a => a.category === 'IMMOBILIER')
  const nbLocatifs = biensImmo.filter(b => LOCATIF_TYPES.includes(b.type)).length

  // Abattement IR plus-value immobilière : 6%/an au-delà de 5 ans, exonération à 22 ans
  const calcAbattIR = (d: number): number => d >= 22 ? 1 : d > 5 ? Math.min(1, (d - 5) * 0.06) : 0
  // Abattement PS : 1.65%/an de 6 à 21 ans, 1.6% la 22e, 9% au-delà de 22
  const calcAbattPS = (d: number): number => {
    if (d <= 5) return 0
    if (d <= 21) return (d - 5) * 0.0165
    if (d === 22) return 16 * 0.0165 + 0.016
    return Math.min(1, 16 * 0.0165 + 0.016 + (d - 22) * 0.09)
  }

  const auditBiens: AuditBienImmobilier[] = biensImmo.map(bien => {
    const poids = totalActifs > 0 ? (bien.value / totalActifs) * 100 : 0
    const isLocatif = LOCATIF_TYPES.includes(bien.type)
    const isRP = RP_TYPES.includes(bien.type)
    const loyerMensuel = isLocatif ? (revenusLocatifs > 0 ? revenusLocatifs / Math.max(nbLocatifs, 1) : bien.value * 0.04 / 12) : null
    const loyerAnnuel = loyerMensuel ? loyerMensuel * 12 : 0
    const chargesAnnuellesBien = isLocatif ? bien.value * 0.015 : null
    const rendementBrut = bien.value > 0 && loyerMensuel ? (loyerAnnuel / bien.value) * 100 : null
    const rendementNet = rendementBrut && chargesAnnuellesBien ? ((loyerAnnuel - chargesAnnuellesBien) / bien.value) * 100 : null

    // Cash-flow mensuel (loyer - charges - crédit prorata)
    const CREDIT_IMMO_TYPES = ['MORTGAGE', 'CREDIT_IMMOBILIER', 'CREDIT_IMMOBILIER_RP', 'CREDIT_IMMOBILIER_LOCATIF', 'PTZ', 'PRET_ACTION_LOGEMENT']
    const creditImmoMensuel = isLocatif && passifs.length > 0
      ? passifs.filter(p => CREDIT_IMMO_TYPES.includes(p.type)).reduce((s, p) => s + p.monthlyPayment, 0) / Math.max(nbLocatifs, 1) : 0
    const cashFlowMensuel = loyerMensuel && chargesAnnuellesBien ? loyerMensuel - chargesAnnuellesBien / 12 - creditImmoMensuel : null

    // TRI simplifié sur 20 ans
    const horizonTRI = 20
    const pvHypothese = 0.02
    const valeurFinale = bien.value * Math.pow(1 + pvHypothese, horizonTRI)
    const totalCashFlows = (cashFlowMensuel || 0) * 12 * horizonTRI
    const tri = bien.value > 0 ? (Math.pow((valeurFinale + totalCashFlows) / bien.value, 1 / horizonTRI) - 1) * 100 : null

    // Scénarios revente multi-horizons
    let scenarioRevente: AuditBienImmobilier['scenarioRevente'] = null
    if (bien.value > 0 && !isRP) {
      const horizons = [5, 10, 15, 20, 25, 30].map(annees => {
        const prixEstime = bien.value * Math.pow(1 + pvHypothese, annees)
        const pvBrute = prixEstime - bien.value
        const abattIR = calcAbattIR(annees)
        const abattPS = calcAbattPS(annees)
        const pvImposableIR = pvBrute * (1 - abattIR)
        const pvImposablePS = pvBrute * (1 - abattPS)
        const impotIR = pvImposableIR * RULES.immobilier.plus_value.taux_ir
        const ps = pvImposablePS * RULES.immobilier.plus_value.taux_ps
        const totalFiscalite = Math.round(impotIR + ps)
        const netVendeur = Math.round(prixEstime - totalFiscalite)
        const gainNetTotal = Math.round(netVendeur - bien.value + (cashFlowMensuel || 0) * 12 * annees)
        return { annees, prixEstime: Math.round(prixEstime), plusValueBrute: Math.round(pvBrute), abattementIR: abattIR * 100, abattementPS: abattPS * 100, pvImposableIR: Math.round(pvImposableIR), pvImposablePS: Math.round(pvImposablePS), impotIR: Math.round(impotIR), prelevementsSociaux: Math.round(ps), totalFiscalite, netVendeur, gainNetTotal }
      })
      scenarioRevente = {
        horizons,
        exonerationIRDate: new Date().getFullYear() + 22,
        exonerationPSDate: new Date().getFullYear() + 30,
        narratif: `Exonération IR de la plus-value après 22 ans de détention, exonération PS après 30 ans. En revendant à 20 ans, le net vendeur serait de ${fmt(horizons.find(h => h.annees === 20)?.netVendeur || 0)} pour un gain net total de ${fmt(horizons.find(h => h.annees === 20)?.gainNetTotal || 0)}.`,
      }
    } else if (isRP) {
      scenarioRevente = {
        horizons: [10, 15, 20].map(annees => {
          const prixEstime = Math.round(bien.value * Math.pow(1 + pvHypothese, annees))
          return { annees, prixEstime, plusValueBrute: prixEstime - bien.value, abattementIR: 100, abattementPS: 100, pvImposableIR: 0, pvImposablePS: 0, impotIR: 0, prelevementsSociaux: 0, totalFiscalite: 0, netVendeur: prixEstime, gainNetTotal: prixEstime - bien.value }
        }),
        exonerationIRDate: null,
        exonerationPSDate: null,
        narratif: 'Résidence principale : exonération totale de plus-value à la revente (art. 150 U II-1° du CGI).',
      }
    }

    // Fiscalité locative
    let fiscaliteLocative: AuditBienImmobilier['fiscaliteLocative'] = null
    if (isLocatif && loyerAnnuel > 0) {
      const regime = loyerAnnuel <= RULES.immobilier.micro_foncier.seuil ? 'Micro-foncier' : 'Réel'
      const revenuImposable = regime === 'Micro-foncier' ? loyerAnnuel * (1 - RULES.immobilier.micro_foncier.abattement) : Math.max(0, loyerAnnuel - (chargesAnnuellesBien || 0))
      const tmi = irTmiVal || 0.11
      const irAnnuel = Math.round(revenuImposable * tmi)
      const psAnnuel = Math.round(revenuImposable * RULES.ps.total)
      fiscaliteLocative = { regimeFiscal: regime, revenuImposable: Math.round(revenuImposable), irAnnuel, psAnnuel, totalAnnuel: irAnnuel + psAnnuel, tauxImpositionGlobal: (tmi + RULES.ps.total) * 100 }
    }

    // Projection cash-flow annuel (10 ans)
    let projectionCashFlow: ProjectionAnnuelleImmo[] | null = null
    if (isLocatif && loyerMensuel) {
      projectionCashFlow = Array.from({ length: 10 }, (_, i) => {
        const annee = new Date().getFullYear() + i
        const loyerAn = Math.round(loyerAnnuel * Math.pow(1.02, i))
        const chargesAn = Math.round((chargesAnnuellesBien || 0) * Math.pow(1.01, i))
        const interets = Math.round(creditImmoMensuel * 12 * Math.max(0, 1 - i * 0.05))
        const resultatFoncier = loyerAn - chargesAn - interets
        const fisca = Math.round(Math.max(0, resultatFoncier) * ((irTmiVal || 0.11) + RULES.ps.total))
        const cfNet = loyerAn - chargesAn - Math.round(creditImmoMensuel * 12) - fisca
        const crd = Math.round(Math.max(0, (creditImmoMensuel * 12 * (20 - i))))
        const patrimNet = Math.round(bien.value * Math.pow(1 + pvHypothese, i + 1)) - crd
        return { annee, loyerAnnuel: loyerAn, chargesAnnuelles: chargesAn, interetsCredit: interets, resultatFoncier, fiscalite: fisca, cashFlowNet: cfNet, capitalRestantDu: crd, patrimoineNet: patrimNet }
      })
    }

    let analyse = ''
    if (isRP) {
      analyse = `Résidence principale d'une valeur de ${fmt(bien.value)}, exonérée de plus-value à la revente. Cet actif représente ${pct(poids)} de votre patrimoine total. L'abattement de ${(RULES.ifi.abattement_rp * 100).toFixed(0)}% sur la valeur (${fmt(bien.value * RULES.ifi.abattement_rp)}) réduit l'assiette IFI.`
    } else if (isLocatif && rendementBrut) {
      analyse = `Bien locatif générant un loyer estimé de ${fmt(loyerMensuel || 0)}/mois. Le rendement brut est de ${pct(rendementBrut)}${rendementBrut < 3 ? ' (faible, à reconsidérer)' : rendementBrut < 5 ? ' (correct, dans la moyenne)' : ' (attractif)'}. Le rendement net après charges est de ${pct(rendementNet || 0)}. ${cashFlowMensuel && cashFlowMensuel < 0 ? `L'effort de trésorerie mensuel est de ${fmt(Math.abs(cashFlowMensuel))}.` : cashFlowMensuel ? `Le cash-flow net est positif : +${fmt(cashFlowMensuel)}/mois.` : ''} ${tri ? `Le TRI estimé sur 20 ans est de ${pct(tri)}.` : ''}`
    } else {
      analyse = `Bien de type ${bien.type.replace(/_/g, ' ')} d'une valeur de ${fmt(bien.value)}, représentant ${pct(poids)} du patrimoine global.`
    }

    return {
      id: bien.id, nom: bien.name, type: bien.type, valeur: bien.value,
      poidsPatrimoine: poids,
      rendementLocatifBrut: rendementBrut, rendementLocatifNet: rendementNet,
      loyerMensuel, chargesAnnuelles: chargesAnnuellesBien, cashFlowMensuel,
      tri, scenarioRevente, fiscaliteLocative, projectionCashFlow, analyse,
    }
  })

  const rendementMoyenImmo = auditBiens.filter(b => b.rendementLocatifBrut).length > 0
    ? auditBiens.filter(b => b.rendementLocatifBrut).reduce((s, b) => s + (b.rendementLocatifBrut || 0), 0) / auditBiens.filter(b => b.rendementLocatifBrut).length : 0
  const cashFlowGlobal = auditBiens.reduce((s, b) => s + (b.cashFlowMensuel || 0), 0)

  const immobilier: AuditImmobilier = {
    totalImmobilier: patrimoineImmobilier,
    poidsPatrimoine: totalActifs > 0 ? (patrimoineImmobilier / totalActifs) * 100 : 0,
    biens: auditBiens,
    rendementMoyenBrut: rendementMoyenImmo,
    concentrationRisque: totalActifs > 0 && (patrimoineImmobilier / totalActifs) > 0.7,
    cashFlowGlobalMensuel: cashFlowGlobal,
    patrimoineImmobilierNet: patrimoineImmobilier - capitalRestant,
    narratif: (() => {
      const parts: string[] = []
      parts.push(`Le patrimoine immobilier s'élève à ${fmt(patrimoineImmobilier)}, représentant ${pct(totalActifs > 0 ? (patrimoineImmobilier / totalActifs) * 100 : 0)} du patrimoine brut total.`)
      if (biensImmo.length === 0) {
        parts.push('Aucun bien immobilier détenu à ce jour.')
      } else {
        parts.push(`${biensImmo.length} bien(s) identifié(s) pour un patrimoine net immobilier (après déduction des crédits) de ${fmt(patrimoineImmobilier - capitalRestant)}.`)
        if (rendementMoyenImmo > 0) parts.push(`Le rendement locatif moyen brut de votre parc est de ${pct(rendementMoyenImmo)}.`)
        if (cashFlowGlobal < 0) parts.push(`L'effort de trésorerie global sur vos biens locatifs est de ${fmt(Math.abs(cashFlowGlobal))}/mois.`)
        else if (cashFlowGlobal > 0) parts.push(`Le cash-flow global net de vos biens locatifs est positif : +${fmt(cashFlowGlobal)}/mois.`)
      }
      if (totalActifs > 0 && patrimoineImmobilier / totalActifs > 0.7) {
        parts.push('Attention : la concentration immobilière dépasse 70% du patrimoine total, ce qui engendre un risque de liquidité et de concentration sectorielle. Envisagez une diversification vers des actifs financiers.')
      }
      return parts.join(' ')
    })(),
  }

  // ---- 7. ANALYSE FINANCIÈRE APPROFONDIE ----
  const actifsFinanciers = actifs.filter(a => a.category === 'FINANCIER' || a.category === 'EPARGNE')
  const allocationTypes: Record<string, number> = {}
  actifsFinanciers.forEach(a => { allocationTypes[a.type] = (allocationTypes[a.type] || 0) + a.value })
  const allocParType = Object.entries(allocationTypes).map(([type, val]) => ({
    type, valeur: val, poids: patrimoineFinancier > 0 ? (val / patrimoineFinancier) * 100 : 0,
  })).sort((a, b) => b.valeur - a.valeur)

  const classifyRisk = (type: string): 'faible' | 'modere' | 'eleve' => {
    if (['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'PEL', 'CEL', 'LIVRET_A', 'LDD', 'LEP'].includes(type)) return 'faible'
    if (['SECURITIES_ACCOUNT', 'PEA', 'PEA_PME', 'COMPANY_SHARES', 'SCPI', 'OPCI', 'FIP', 'FCPI'].includes(type)) return 'eleve'
    return 'modere'
  }
  const classifyLiquidity = (type: string): 'immediate' | 'moyenne' | 'faible' => {
    if (['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'PEA', 'SECURITIES_ACCOUNT', 'LIVRET_A'].includes(type)) return 'immediate'
    if (['LIFE_INSURANCE', 'PEL', 'CEL', 'SCPI'].includes(type)) return 'moyenne'
    return 'faible'
  }
  const enveloppeFiscale = (type: string): string => {
    if (['LIFE_INSURANCE'].includes(type)) return 'Assurance-vie (art. 990 I / 757 B)'
    if (['PER', 'PERP', 'MADELIN', 'PERCO', 'PERECO'].includes(type)) return 'Épargne retraite (déductible IR)'
    if (['PEA', 'PEA_PME'].includes(type)) return 'PEA (exo IR après 5 ans)'
    if (['PEE', 'INTERESSEMENT'].includes(type)) return 'Épargne salariale (exo sous conditions)'
    return 'Droit commun (PFU 30%)'
  }

  const actifsFin: AuditActifFinancier[] = actifsFinanciers.map(a => {
    const poidsPatr = totalActifs > 0 ? (a.value / totalActifs) * 100 : 0
    const poidsPortf = patrimoineFinancier > 0 ? (a.value / patrimoineFinancier) * 100 : 0
    const risque = classifyRisk(a.type)
    const liq = classifyLiquidity(a.type)
    const env = enveloppeFiscale(a.type)

    let commentaire = ''
    if (a.type === 'LIFE_INSURANCE' && a.value > 152500) commentaire = 'Au-delà de l\'abattement 990 I (152 500 €/bénéficiaire) — vérifier clause bénéficiaire et stratégie de versements.'
    else if (['PER', 'PERP', 'MADELIN'].includes(a.type)) commentaire = 'Épargne retraite déductible — optimise la TMI actuelle, fiscalisé à la sortie en rente/capital.'
    else if (a.type === 'PEA' && a.value > 0) commentaire = 'Exonération IR après 5 ans de détention — conserver la date d\'ouverture fiscale.'
    else if (risque === 'faible' && poidsPortf > 25) commentaire = 'Poids élevé en supports sécurisés — rendement limité, envisager diversification.'
    else if (risque === 'eleve' && poidsPortf > 30) commentaire = 'Exposition significative au risque de marché — vérifier l\'adéquation au profil.'
    else commentaire = `Position sur ${a.type.replace(/_/g, ' ')} — allocation cohérente.`

    return {
      id: a.id, nom: a.name, type: a.type, category: a.category,
      valeur: a.value, poidsPortefeuille: poidsPortf, poidsPatrimoine: poidsPatr,
      enveloppeFiscale: env, risque, liquidite: liq, avantagesFiscaux: env, commentaire,
    }
  })

  // Score risque (0-100, 100 = très risqué)
  const poidsFaible = actifsFin.filter(a => a.risque === 'faible').reduce((s, a) => s + a.valeur, 0)
  const poidsModere = actifsFin.filter(a => a.risque === 'modere').reduce((s, a) => s + a.valeur, 0)
  const poidsEleve = actifsFin.filter(a => a.risque === 'eleve').reduce((s, a) => s + a.valeur, 0)
  const scoreRisque = patrimoineFinancier > 0 ? Math.round((poidsEleve / patrimoineFinancier) * 100) : 0

  // Allocation par risque
  const allocParRisque = [
    { risque: 'Faible', valeur: poidsFaible, poids: patrimoineFinancier > 0 ? (poidsFaible / patrimoineFinancier) * 100 : 0 },
    { risque: 'Modéré', valeur: poidsModere, poids: patrimoineFinancier > 0 ? (poidsModere / patrimoineFinancier) * 100 : 0 },
    { risque: 'Élevé', valeur: poidsEleve, poids: patrimoineFinancier > 0 ? (poidsEleve / patrimoineFinancier) * 100 : 0 },
  ].filter(r => r.valeur > 0)

  // Allocation par liquidité
  const liqImmediate = actifsFin.filter(a => a.liquidite === 'immediate').reduce((s, a) => s + a.valeur, 0)
  const liqMoyenne = actifsFin.filter(a => a.liquidite === 'moyenne').reduce((s, a) => s + a.valeur, 0)
  const liqFaible = actifsFin.filter(a => a.liquidite === 'faible').reduce((s, a) => s + a.valeur, 0)
  const allocParLiquidite = [
    { liquidite: 'Immédiate', valeur: liqImmediate, poids: patrimoineFinancier > 0 ? (liqImmediate / patrimoineFinancier) * 100 : 0 },
    { liquidite: 'Moyenne', valeur: liqMoyenne, poids: patrimoineFinancier > 0 ? (liqMoyenne / patrimoineFinancier) * 100 : 0 },
    { liquidite: 'Faible', valeur: liqFaible, poids: patrimoineFinancier > 0 ? (liqFaible / patrimoineFinancier) * 100 : 0 },
  ].filter(r => r.valeur > 0)

  // Score diversification (0-100)
  const nbTypes = Object.keys(allocationTypes).length
  const maxConcentration = allocParType.length > 0 ? allocParType[0].poids : 100
  const scoreDiversif = Math.min(100, Math.round((nbTypes / 6) * 40 + ((100 - maxConcentration) / 100) * 60))

  // Recommandation allocation cible
  const poidsFaiblePct = patrimoineFinancier > 0 ? (poidsFaible / patrimoineFinancier) * 100 : 0
  const poidsElevePct = patrimoineFinancier > 0 ? (poidsEleve / patrimoineFinancier) * 100 : 0
  const poidsModerePct = patrimoineFinancier > 0 ? (poidsModere / patrimoineFinancier) * 100 : 0
  const cibleFaible = age > 55 ? 40 : age > 40 ? 30 : 20
  const cibleModere = age > 55 ? 40 : age > 40 ? 40 : 30
  const cibleEleve = age > 55 ? 20 : age > 40 ? 30 : 50
  const recommandationAllocation = [
    { categorie: 'Faible risque', actuel: Math.round(poidsFaiblePct), cible: cibleFaible, ecart: Math.round(poidsFaiblePct - cibleFaible) },
    { categorie: 'Risque modéré', actuel: Math.round(poidsModerePct), cible: cibleModere, ecart: Math.round(poidsModerePct - cibleModere) },
    { categorie: 'Risque élevé', actuel: Math.round(poidsElevePct), cible: cibleEleve, ecart: Math.round(poidsElevePct - cibleEleve) },
  ]

  const financier: AuditFinancier = {
    totalFinancier: patrimoineFinancier,
    poidsPatrimoine: totalActifs > 0 ? (patrimoineFinancier / totalActifs) * 100 : 0,
    allocationParType: allocParType,
    allocationParRisque: allocParRisque,
    allocationParLiquidite: allocParLiquidite,
    scoreRisque, scoreDiversification: scoreDiversif,
    actifs: actifsFin,
    recommandationAllocation,
    narratif: (() => {
      const parts: string[] = []
      parts.push(`Le patrimoine financier s'élève à ${fmt(patrimoineFinancier)}, soit ${pct(totalActifs > 0 ? (patrimoineFinancier / totalActifs) * 100 : 0)} du patrimoine total, réparti sur ${nbTypes} type(s) d'enveloppes et ${actifsFin.length} position(s).`)
      parts.push(`Le score de diversification est de ${scoreDiversif}/100.`)
      if (scoreRisque > 50) parts.push('L\'exposition au risque de marché est significative. Vérifiez que cette allocation est cohérente avec votre profil et votre horizon de placement.')
      else parts.push('Le profil de risque est maîtrisé.')
      if (maxConcentration > 60) parts.push(`Attention : ${pct(maxConcentration)} du patrimoine financier est concentré sur un seul type de support — la diversification est insuffisante.`)
      if (age > 0) parts.push(`En fonction de votre âge (${age} ans), l'allocation cible recommandée serait : ${cibleFaible}% faible risque, ${cibleModere}% modéré, ${cibleEleve}% dynamique.`)
      return parts.join(' ')
    })(),
  }

  // ---- 8. PROJECTION RETRAITE (3 SCÉNARIOS) + ESTIMATION PENSION ----
  let retraite: AuditRetraite | null = null
  if (age > 0) {
    const typesRetraite = ['PER', 'PERP', 'MADELIN', 'PERCO', 'PERECO']
    const epargneRetraiteActifs = actifs.filter(a => typesRetraite.includes(a.type) || a.category === 'EPARGNE_RETRAITE')
    const epargneRetraite = epargneRetraiteActifs.reduce((s, a) => s + a.value, 0)
    const detailEpargneRetraite = epargneRetraiteActifs.map(a => ({ support: a.name || a.type.replace(/_/g, ' '), montant: a.value }))

    // ── Estimation pension de retraite (CNAV + AGIRC-ARRCO) ──
    const ageDepartChoisi = isAlreadyRetired ? Math.min(age, 67) : 64
    const ageTP = 67
    const trimestresRequis = 172
    const trimestresParAn = 4
    const trimestresValides = Math.min(trimestresRequis, (Math.min(age, ageDepartChoisi) - 22) * trimestresParAn)
    const trimestresRestants = isAlreadyRetired ? 0 : Math.max(0, ageDepartChoisi - age) * trimestresParAn
    const trimestresTotaux = trimestresValides + trimestresRestants
    const trimestresManquants = Math.max(0, trimestresRequis - trimestresTotaux)

    const SAM = revenusAnnuels > 0 ? revenusAnnuels * 0.8 : 0
    const tauxPlein = 0.5
    const decotePctParTrimestre = 0.00625
    const decoteTrimestres = Math.max(0, trimestresRequis - trimestresTotaux)
    const surcoteTrimestres = Math.max(0, trimestresTotaux - trimestresRequis)
    const decoteSurcote = decoteTrimestres > 0 ? -(decoteTrimestres * decotePctParTrimestre) : surcoteTrimestres * 0.0125
    const tauxEffectifPension = Math.max(0.25, tauxPlein + decoteSurcote)
    const proratisation = Math.min(1, trimestresTotaux / trimestresRequis)
    const pensionBase = Math.round(SAM * tauxEffectifPension * proratisation / 12)

    const pointsAGIRC = Math.round((age - 22) * revenusAnnuels * 0.0787 / (revenusAnnuels > 0 ? 18.7669 : 1))
    const pointsFuturs = Math.round(Math.max(0, ageDepartChoisi - age) * revenusAnnuels * 0.0787 / (revenusAnnuels > 0 ? 18.7669 : 1))
    const totalPoints = pointsAGIRC + pointsFuturs
    const valeurPoint = 1.4386
    const pensionComplementaire = Math.round(totalPoints * valeurPoint / 12)
    const pensionTotale = pensionBase + pensionComplementaire
    const tauxRemplacement = revenusMensuels > 0 ? (pensionTotale / revenusMensuels) * 100 : 0

    const estimationPension: EstimationPension = {
      pensionBaseMensuelle: pensionBase,
      pensionComplementaireMensuelle: pensionComplementaire,
      pensionTotaleMensuelle: pensionTotale,
      tauxRemplacement,
      trimestresValides,
      trimestresRestants,
      trimestresRequis,
      trimestresManquants,
      decoteSurcote: decoteSurcote * 100,
      decoteSurcoteLabel: decoteTrimestres > 0 ? `Décote ${pct(Math.abs(decoteSurcote) * 100)}` : surcoteTrimestres > 0 ? `Surcote +${pct(decoteSurcote * 100)}` : 'Taux plein',
      ageTauxPlein: ageTP,
      pointsComplementaires: totalPoints,
      valeurPoint,
    }

    // ── Tableau évolution pension par âge de départ (62-70) ──
    // Pour un retraité, on ne montre que les âges <= age actuel (passé) + l'actuel
    const evolutionParAge: EvolutionPensionParAge[] = []
    const ageMinEvol = isAlreadyRetired ? Math.max(62, age - 2) : 62
    const ageMaxEvol = isAlreadyRetired ? age : 70
    for (let ageD = ageMinEvol; ageD <= ageMaxEvol; ageD++) {
      const trimFuturs = Math.max(0, ageD - age) * trimestresParAn
      const trimTot = trimestresValides + trimFuturs
      const trimManq = Math.max(0, trimestresRequis - trimTot)
      const decTrim = Math.max(0, trimestresRequis - trimTot)
      const surTrim = Math.max(0, trimTot - trimestresRequis)
      const decSur = decTrim > 0 ? -(decTrim * decotePctParTrimestre) : surTrim * 0.0125
      const tauxEff = Math.max(0.25, tauxPlein + decSur)
      const prorata = Math.min(1, trimTot / trimestresRequis)
      const pBase = Math.round(SAM * tauxEff * prorata / 12)
      const ptsFut = Math.round(Math.max(0, ageD - age) * revenusAnnuels * 0.0787 / (revenusAnnuels > 0 ? 18.7669 : 1))
      const pComp = Math.round((pointsAGIRC + ptsFut) * valeurPoint / 12)
      const pTotal = pBase + pComp
      const tauxRemp = revenusMensuels > 0 ? (pTotal / revenusMensuels) * 100 : 0
      const estOptimal = trimManq === 0 && surTrim >= 0

      evolutionParAge.push({
        age: ageD, trimestres: trimTot, trimestresManquants: trimManq,
        decoteSurcotePct: decSur * 100,
        decoteSurcoteLabel: decTrim > 0 ? `-${pct(Math.abs(decSur) * 100)}` : surTrim > 0 ? `+${pct(decSur * 100)}` : 'Taux plein',
        pensionMensuelle: pTotal, tauxRemplacement: tauxRemp,
        differenceVsChoisi: pTotal - pensionTotale,
        estChoisi: ageD === ageDepartChoisi,
        estOptimal: estOptimal && !evolutionParAge.some(e => e.estOptimal),
      })
    }

    // ── Analyse gap ──
    const revenuSouhaite = revenusMensuels * 0.7
    const gapMensuel = Math.max(0, revenuSouhaite - pensionTotale)
    const gapAnnuel = gapMensuel * 12
    const capitalNecessaire4Pct = gapAnnuel > 0 ? Math.round(gapAnnuel / 0.04) : 0

    const analyseGap: AnalyseGapRetraite = {
      revenuSouhaite,
      pensionEstimee: pensionTotale,
      gapMensuel,
      gapAnnuel,
      capitalNecessaire4Pct,
      narratif: gapMensuel > 0
        ? `Votre pension estimée de ${fmt(pensionTotale)}/mois ne couvre que ${pct(tauxRemplacement)} de vos revenus actuels. Pour maintenir un niveau de vie à ${fmt(revenuSouhaite)}/mois (70% des revenus), il manque ${fmt(gapMensuel)}/mois, soit ${fmt(gapAnnuel)}/an. Selon la règle des 4%, un capital de ${fmt(capitalNecessaire4Pct)} est nécessaire pour générer ce complément de manière pérenne.`
        : `Votre pension estimée de ${fmt(pensionTotale)}/mois couvre ${pct(tauxRemplacement)} de vos revenus actuels, suffisant pour maintenir votre niveau de vie cible de ${fmt(revenuSouhaite)}/mois.`,
    }

    // ── Scénarios projections (utilise retCalc de useClientCalculators) ──
    const buildScenarioFromCalc = (label: string, d: RetirementSimulationResult | null, rendement: number, ageDepart: number, adjustFactor: number): ScenarioRetraite => {
      if (d) {
        const capitalAjuste = d.savingsAtRetirement * adjustFactor
        const revenuDurable = (d.sustainableAnnualIncome || 0) * adjustFactor / 12
        return {
          label, rendement: rendement * 100, ageDepart,
          capitalRetraite: Math.round(capitalAjuste),
          revenuDurable: Math.round(revenuDurable),
          gapMensuel: Math.max(0, Math.round((d.incomeShortfall || 0) / adjustFactor / 12)),
          capitalEpuiseAge: null,
          faisable: d.isRetirementFeasible && adjustFactor >= 0.8,
          projection: (d.projection || []).map(p => ({
            age: p.age, capital: Math.round(p.savingsBalance * adjustFactor), phase: 'accumulation',
            retrait: Math.round(p.annualWithdrawal * adjustFactor), interets: 0,
          })),
        }
      }
      return { label, rendement: rendement * 100, ageDepart, capitalRetraite: 0, revenuDurable: 0, gapMensuel: Math.round(revenusMensuels * 0.7), capitalEpuiseAge: null, faisable: false, projection: [] }
    }

    const scenarios = [
      buildScenarioFromCalc('Pessimiste', retCalc, 0.02, 64, 0.6),
      buildScenarioFromCalc('Modéré', retCalc, 0.04, 64, 1.0),
      buildScenarioFromCalc('Optimiste', retCalc, 0.06, 62, 1.5),
    ]

    // L'API backend retourne recommendations comme Array<{priorite, type, description}> OU string[]
    const recommandationsRetraite: { priorite: string; type: string; description: string }[] = (retCalc?.recommendations || []).map((r: unknown) => {
      if (typeof r === 'string') return { priorite: 'medium', type: 'general', description: r }
      if (r && typeof r === 'object' && 'description' in r) {
        const obj = r as { priorite?: string; type?: string; description: string }
        return { priorite: obj.priorite || 'medium', type: obj.type || 'general', description: obj.description }
      }
      return { priorite: 'medium', type: 'general', description: String(r) }
    })
    if (recommandationsRetraite.length === 0) {
      if (trimestresManquants > 0) recommandationsRetraite.push({ priorite: 'high', type: 'trimestres', description: `À ${ageDepartChoisi} ans, il manquera ${trimestresManquants} trimestres (${Math.ceil(trimestresManquants / 4)} ans). Reporter le départ à ${ageTP} ans permettrait d'atteindre le taux plein et gagner environ ${fmt(Math.abs((evolutionParAge.find(e => e.age === ageTP)?.pensionMensuelle || 0) - pensionTotale))}/mois.` })
      if (gapMensuel > 0) recommandationsRetraite.push({ priorite: 'high', type: 'epargne', description: `Ouvrir ou alimenter un PER pour combler le gap de ${fmt(gapMensuel)}/mois. Les versements sont déductibles de votre revenu imposable (TMI ${(irTmiVal * 100).toFixed(0)}%).` })
      if (tauxRemplacement < 50) recommandationsRetraite.push({ priorite: 'medium', type: 'diversification', description: 'Taux de remplacement inférieur à 50% — envisagez une assurance-vie en complément du PER pour diversifier les sources de revenus à la retraite.' })
    }

    retraite = {
      ageActuel: age,
      revenuActuel: revenusMensuels,
      estimationPension,
      evolutionParAge,
      analyseGap,
      epargneRetraiteActuelle: epargneRetraite,
      detailEpargneRetraite,
      contributionMensuelleActuelle: isAlreadyRetired ? 0 : capaciteEpargneBrute * 0.2,
      scenarios,
      recommandations: recommandationsRetraite,
      narratif: (() => {
        const parts: string[] = []
        if (isAlreadyRetired) {
          parts.push(`Vous êtes actuellement à la retraite (${age} ans). Votre pension estimée s'élève à ${fmt(pensionTotale)}/mois (base CNAV : ${fmt(pensionBase)} + complémentaire AGIRC-ARRCO : ${fmt(pensionComplementaire)}).`)
          parts.push(`Le taux de remplacement par rapport à vos derniers revenus d'activité est de ${pct(tauxRemplacement)}.`)
          if (gapMensuel > 0) {
            parts.push(`Pour maintenir 70% de vos revenus de référence, un complément de ${fmt(gapMensuel)}/mois est nécessaire. Votre patrimoine financier de ${fmt(patrimoineFinancier)} peut servir de source de revenus complémentaires.`)
          } else {
            parts.push('Votre pension couvre vos besoins estimés à 70% de vos revenus de référence.')
          }
          if (epargneRetraite > 0) parts.push(`Votre épargne retraite dédiée totalise ${fmt(epargneRetraite)} et constitue un complément de revenus mobilisable.`)
          parts.push('L\'enjeu principal est désormais la préservation de votre capital, la génération de revenus complémentaires et l\'optimisation de la transmission.')
        } else {
          parts.push(`À ${age} ans, votre pension de retraite estimée à ${ageDepartChoisi} ans s'élève à ${fmt(pensionTotale)}/mois (base CNAV : ${fmt(pensionBase)} + complémentaire AGIRC-ARRCO : ${fmt(pensionComplementaire)}).`)
          parts.push(`Le taux de remplacement est de ${pct(tauxRemplacement)}.`)
          if (trimestresManquants > 0) {
            parts.push(`À ${ageDepartChoisi} ans, vous aurez ${trimestresTotaux} trimestres sur les ${trimestresRequis} requis, soit ${trimestresManquants} manquants (${Math.ceil(trimestresManquants / 4)} ans). Une décote de ${pct(Math.abs(decoteSurcote) * 100)} sera appliquée.`)
          } else {
            parts.push(`Vous atteindrez le taux plein avec ${trimestresTotaux} trimestres.`)
          }
          if (gapMensuel > 0) {
            parts.push(`Pour maintenir 70% de vos revenus actuels, un gap de ${fmt(gapMensuel)}/mois devra être comblé par votre épargne personnelle, nécessitant un capital de ${fmt(capitalNecessaire4Pct)} (règle des 4%).`)
          }
          parts.push(`Trois scénarios de projection ont été modélisés. ${scenarios[1].faisable ? `Le scénario modéré (rendement 4%) permet un revenu durable de ${fmt(scenarios[1].revenuDurable)}/mois.` : `Le scénario modéré révèle un déficit de ${fmt(scenarios[1].gapMensuel)}/mois.`}`)
          if (epargneRetraite > 0) parts.push(`L'épargne retraite dédiée totalise ${fmt(epargneRetraite)}.`)
          else parts.push('Aucune épargne retraite dédiée identifiée — un PER serait pertinent pour optimiser la TMI.')
        }
        return parts.join(' ')
      })(),
    }
  }

  // ---- 9. AUDIT SUCCESSION ----
  const isMarried = ['MARRIED', 'PACS'].includes(client.maritalStatus || '')
  const nbHer = Math.max(nbEnfants, 1)
  const abattParEnf = 100000
  const abattTotal = nbHer * abattParEnf
  const partParHer = patrimoineNet / nbHer
  const taxableParHer = Math.max(partParHer - abattParEnf, 0)

  // Calcul DMTG avec détail par tranche
  const tranchesDMTG = [
    { seuil: 8072, taux: 0.05 }, { seuil: 12109, taux: 0.10 },
    { seuil: 15932, taux: 0.15 }, { seuil: 552324, taux: 0.20 },
    { seuil: 902838, taux: 0.30 }, { seuil: 1805677, taux: 0.40 },
    { seuil: Infinity, taux: 0.45 },
  ]

  const calcDMTGDetail = (base: number): { total: number; tranches: DetailTranche[] } => {
    if (base <= 0) return { total: 0, tranches: [] }
    let impot = 0
    const detail: DetailTranche[] = []
    let restant = base, seuilPrec = 0
    for (const t of tranchesDMTG) {
      const tr = Math.min(restant, t.seuil - seuilPrec)
      if (tr <= 0) break
      const imp = tr * t.taux
      impot += imp
      detail.push({ taux: t.taux * 100, base: Math.round(tr), impot: Math.round(imp) })
      restant -= tr
      seuilPrec = t.seuil
    }
    return { total: Math.round(impot), tranches: detail }
  }

  const dmtgDetail = calcDMTGDetail(taxableParHer)
  const droitsParHer = dmtgDetail.total
  const droitsTotal = droitsParHer * nbHer
  const tauxEffSuccession = patrimoineNet > 0 ? (droitsTotal / patrimoineNet) * 100 : 0

  // Impact assurance-vie enrichi — répartition avant/après 70 ans selon l'âge
  const AV_TYPES = ['LIFE_INSURANCE', 'ASSURANCE_VIE']
  const totalAV = actifs.filter(a => AV_TYPES.includes(a.type)).reduce((s, a) => s + a.value, 0)
  let impactAV: AuditSuccession['impactAssuranceVie'] = null
  if (totalAV > 0) {
    // Si le client a >= 70 ans, la majorité des versements futurs seront post-70 ans (art. 757B)
    // On estime la répartition avant/après 70 ans selon l'âge du client
    const ratioAvant70 = age >= 70 ? 0.5 : age >= 60 ? 0.7 : 0.85
    const versAvant70 = totalAV * ratioAvant70
    const versApres70 = totalAV * (1 - ratioAvant70)
    const abatt990I = 152500 * nbHer
    const taxable990I = Math.max(0, versAvant70 - abatt990I)
    const droits990I = taxable990I > 0 ? Math.round(Math.min(taxable990I, 700000 * nbHer) * 0.20 + Math.max(0, taxable990I - 700000 * nbHer) * 0.3125) : 0
    const abatt757B = 30500
    const taxable757B = Math.max(0, versApres70 - abatt757B)
    const droits757B = Math.round(calcDMTGDetail(taxable757B / Math.max(nbHer, 1)).total * nbHer)
    const droitsTotalAV = droits990I + droits757B
    const droitsSiDMTG = calcDMTGDetail(Math.max(0, (totalAV / nbHer) - abattParEnf)).total * nbHer
    impactAV = {
      totalAV, versementsAvant70: Math.round(versAvant70), versementsApres70: Math.round(versApres70),
      abattement990I: abatt990I, taxable990I: Math.round(taxable990I), droits990I,
      abattement757B: abatt757B, taxable757B: Math.round(taxable757B), droits757B,
      droitsTotalAV, economieVsDMTG: Math.max(0, droitsSiDMTG - droitsTotalAV),
      narratif: `L'assurance-vie totalise ${fmt(totalAV)}. Les versements avant 70 ans (${fmt(Math.round(versAvant70))}) bénéficient de l'art. 990 I avec un abattement de ${fmt(152500)} par bénéficiaire. Les versements après 70 ans (${fmt(Math.round(versApres70))}) relèvent de l'art. 757 B (abattement global de ${fmt(30500)}). La fiscalité successorale via AV est de ${fmt(droitsTotalAV)}, contre ${fmt(droitsSiDMTG)} si ces sommes avaient été dans la succession classique — soit une économie de ${fmt(Math.max(0, droitsSiDMTG - droitsTotalAV))}.`,
    }
  }

  const strategiesSucc: AuditSuccession['strategiesOptimisation'] = []
  if (patrimoineNet > 100000) strategiesSucc.push({ strategie: 'Donation-partage', description: `Transmettre jusqu'à ${fmt(abattParEnf)} par enfant tous les 15 ans en franchise de droits`, detailMiseEnOeuvre: `Organiser une donation-partage devant notaire. Chaque enfant peut recevoir ${fmt(abattParEnf)} en franchise de droits. L'abattement se reconstitue tous les 15 ans. À anticiper dès que possible.`, economieEstimee: Math.min(droitsTotal, droitsParHer * 0.3 * nbHer), priorite: 'haute' })
  if (patrimoineImmobilier > 200000 && age > 0) {
    const usufruit = age < 51 ? 0.6 : age < 61 ? 0.5 : age < 71 ? 0.4 : age < 81 ? 0.3 : age < 91 ? 0.2 : 0.1
    strategiesSucc.push({ strategie: 'Démembrement de propriété', description: `Donner la nue-propriété (${pct((1 - usufruit) * 100)} de la valeur) tout en conservant l'usufruit — réduction de l'assiette taxable`, detailMiseEnOeuvre: `À votre âge (${age} ans), la valeur de l'usufruit est de ${pct(usufruit * 100)} (art. 669 CGI). Donner la nue-propriété permet de transmettre ${pct((1 - usufruit) * 100)} de la valeur en bénéficiant de l'abattement de ${fmt(abattParEnf)} par enfant. L'usufruit s'éteint naturellement au décès.${age >= 70 ? ' Attention : plus l\'âge avance, plus la nue-propriété est élevée, ce qui réduit l\'avantage fiscal du démembrement. Il est urgent d\'agir.' : ''}`, economieEstimee: Math.round(patrimoineImmobilier * usufruit * 0.2 * 0.2), priorite: 'haute' })
  }
  if (totalAV > 0) {
    const avDetail = age >= 70
      ? { description: `Vérifier les clauses bénéficiaires des ${fmt(totalAV)} d'AV. Les versements effectués avant vos 70 ans bénéficient de l'art. 990 I (${fmt(152500)}/bénéficiaire). Les nouveaux versements relèvent de l'art. 757 B (abattement global limité à ${fmt(30500)}).`, detailMiseEnOeuvre: `À ${age} ans, vous avez dépassé le seuil des 70 ans. Les versements déjà effectués avant 70 ans bénéficient du régime très favorable de l'art. 990 I (abattement ${fmt(152500)} par bénéficiaire, puis prélèvement de 20%/31,25%). Tout nouveau versement sera soumis à l'art. 757 B (abattement global de ${fmt(30500)} seulement, puis barème DMTG). Il est donc préférable de ne PAS verser de nouvelles sommes sur l'AV mais de privilégier d'autres véhicules de transmission. Vérifiez que la clause bénéficiaire est à jour et nominative.` }
      : { description: `Maximiser les versements avant 70 ans sur l'AV (art. 990 I : abattement ${fmt(152500)}/bénéficiaire)`, detailMiseEnOeuvre: `Priorisez les versements avant 70 ans pour bénéficier du régime 990 I. Après 70 ans, seul l'abattement global de ${fmt(30500)} s'applique (art. 757 B). Vérifiez que la clause bénéficiaire est à jour et personnalisée.` }
    strategiesSucc.push({ strategie: 'Optimisation assurance-vie', ...avDetail, economieEstimee: Math.min(totalAV * 0.2, droitsTotal * 0.3), priorite: age >= 70 ? 'haute' : 'moyenne' })
  }
  const isWidowed = client.maritalStatus === 'WIDOWED'
  if (isMarried && nbEnfants > 0) strategiesSucc.push({ strategie: 'Protection du conjoint survivant', description: 'Rédiger un testament ou une donation entre époux pour protéger le conjoint survivant', detailMiseEnOeuvre: 'Rédiger un testament ou une donation au dernier vivant pour permettre au conjoint de choisir entre usufruit universel ou quart en pleine propriété. Le conjoint survivant est exonéré de droits de succession (art. 796-0 bis CGI). Consulter un notaire pour adapter à votre situation.', economieEstimee: 0, priorite: 'haute' })
  if (isWidowed && nbEnfants > 0) strategiesSucc.push({ strategie: 'Testament et organisation de la succession', description: 'Rédiger un testament pour organiser la dévolution successorale entre vos enfants', detailMiseEnOeuvre: `En tant que veuf/veuve avec ${nbEnfants} enfant(s), l'intégralité de votre succession revient à vos enfants en parts égales (réserve héréditaire). Un testament permet d'organiser la répartition des biens spécifiques et d'éviter l'indivision. Envisagez un legs particulier ou une attribution préférentielle de la résidence principale.`, economieEstimee: 0, priorite: 'haute' })
  if (patrimoineNet > 1000000) strategiesSucc.push({ strategie: 'Pacte Dutreil', description: 'Si détention de parts d\'entreprise, exonération de 75% des droits de mutation', detailMiseEnOeuvre: 'Le pacte Dutreil permet une exonération de 75% de la valeur des parts transmises, sous conditions d\'engagement collectif de conservation (2 ans) puis individuel (4 ans). Applicable uniquement aux parts d\'entreprise.', economieEstimee: patrimoinePro > 0 ? patrimoinePro * 0.75 * 0.2 : 0, priorite: patrimoinePro > 0 ? 'haute' : 'basse' })

  const succession: AuditSuccession = {
    patrimoineNetTaxable: patrimoineNet,
    situationFamiliale: client.maritalStatus || 'SINGLE',
    regimeMatrimonial: client.matrimonialRegime || (isMarried ? 'COMMUNAUTE_REDUITE_AUX_ACQUETS' : 'N/A'),
    nbEnfants,
    droitsEstimes: droitsTotal,
    tauxEffectif: tauxEffSuccession,
    abattementTotal: abattTotal,
    detailParHeritier: Array.from({ length: nbHer }, (_, i) => ({
      lien: `Enfant ${i + 1}`,
      partBrute: partParHer,
      abattement: abattParEnf,
      taxable: taxableParHer,
      tranches: dmtgDetail.tranches,
      droits: droitsParHer,
      tauxEffectif: taxableParHer > 0 ? (droitsParHer / taxableParHer) * 100 : 0,
    })),
    impactAssuranceVie: impactAV,
    strategiesOptimisation: strategiesSucc,
    narratif: (() => {
      const parts: string[] = []
      parts.push(`Le patrimoine net taxable s'élève à ${fmt(patrimoineNet)}.`)
      if (isMarried) parts.push('Le conjoint survivant est exonéré de droits de succession (art. 796-0 bis du CGI).')
      parts.push(`Pour ${nbHer} héritier(s) en ligne directe, après application de l'abattement de ${fmt(abattParEnf)} par enfant (total : ${fmt(abattTotal)}), la base taxable par héritier est de ${fmt(taxableParHer)}.`)
      parts.push(`Les droits de mutation estimés s'élèvent à ${fmt(droitsTotal)}, soit un taux effectif global de ${pct(tauxEffSuccession)}.`)
      if (impactAV) parts.push(`L'assurance-vie (${fmt(totalAV)}) bénéficie d'un régime fiscal dérogatoire permettant une économie de ${fmt(impactAV.economieVsDMTG)} par rapport à une transmission classique.`)
      if (strategiesSucc.length > 0) parts.push(`${strategiesSucc.length} stratégie(s) d'optimisation identifiée(s), pour une économie potentielle cumulée de ${fmt(strategiesSucc.reduce((s, st) => s + st.economieEstimee, 0))}.`)
      return parts.join(' ')
    })(),
  }

  // ---- 10. SYNTHÈSE & SCORING GLOBAL ----
  const scoreBudgetNum = scoreBudget === 'excellent' ? 90 : scoreBudget === 'bon' ? 70 : scoreBudget === 'attention' ? 45 : 20
  const scoreEmpruntNum = tauxEndettement < 15 ? 90 : tauxEndettement < 25 ? 70 : tauxEndettement < 33 ? 50 : 20
  const scoreFiscaliteNum = fiscalite.optimisation && fiscalite.optimisation.economiesPotentielles > 0 ? Math.max(30, 80 - Math.min(50, (fiscalite.optimisation.economiesPotentielles / Math.max(revenusAnnuels, 1)) * 200)) : 70
  const scoreEpargneNum = gapEpargne === 0 ? 90 : gapEpargne < montantCibleEpargne * 0.3 ? 70 : gapEpargne < montantCibleEpargne * 0.6 ? 45 : 20
  const scoreImmoNum = immobilier.concentrationRisque ? 40 : patrimoineImmobilier > 0 ? 75 : 50
  const scoreFinNum = Math.min(90, scoreDiversif)
  const scoreRetraiteNum = retraite ? (retraite.scenarios[1].faisable ? 80 : retraite.scenarios[1].gapMensuel < 500 ? 55 : 30) : 50
  const scoreSuccNum = tauxEffSuccession < 5 ? 85 : tauxEffSuccession < 15 ? 60 : 35

  const buildCommentaire = (theme: string, score: number): string => {
    if (theme === 'Budget & Épargne') return score >= 70 ? `Taux d'épargne de ${pct(tauxEpargne)} et reste à vivre de ${fmt(resteAVivre)}/mois — situation saine.` : `Taux d'effort de ${pct(tauxEffort)} et capacité d'épargne de ${fmt(capaciteEpargneBrute)}/mois — des ajustements sont nécessaires.`
    if (theme === 'Capacité d\'emprunt') return score >= 70 ? `Taux d'endettement de ${pct(tauxEndettement)} — marge disponible pour de nouveaux projets.` : `Taux d'endettement de ${pct(tauxEndettement)} — capacité résiduelle limitée.`
    if (theme === 'Fiscalité') return score >= 70 ? 'Fiscalité maîtrisée, peu de marge d\'optimisation identifiée.' : `Des économies de ${fmt(fiscalite.optimisation?.economiesPotentielles || 0)} sont identifiées.`
    if (theme === 'Épargne de précaution') return score >= 70 ? `Réserve de ${fmt(epargneLiquide)} couvrant ${moisCouverts.toFixed(1)} mois de charges.` : `Déficit de ${fmt(gapEpargne)} sur l'objectif de 6 mois de charges.`
    if (theme === 'Immobilier') return immobilier.concentrationRisque ? `Concentration de ${pct(immobilier.poidsPatrimoine)} en immobilier — risque de liquidité.` : `Patrimoine immobilier de ${fmt(patrimoineImmobilier)} bien structuré.`
    if (theme === 'Financier') return score >= 70 ? `Diversification sur ${nbTypes} supports — allocation équilibrée.` : `Concentration excessive — diversification insuffisante.`
    if (theme === 'Retraite') return retraite ? (score >= 70 ? `Pension estimée de ${fmt(retraite.estimationPension.pensionTotaleMensuelle)}/mois — retraite sécurisée.` : `Gap de ${fmt(retraite.analyseGap.gapMensuel)}/mois à combler.`) : 'Données insuffisantes pour la projection.'
    if (theme === 'Transmission') return score >= 70 ? `Droits estimés à ${fmt(droitsTotal)} (${pct(tauxEffSuccession)}) — optimisé.` : `Droits de ${fmt(droitsTotal)} (${pct(tauxEffSuccession)}) — stratégies d'optimisation recommandées.`
    return ''
  }

  const scores: ScoreTheme[] = [
    { theme: 'Budget & Épargne', score: scoreBudgetNum, verdict: scoreBudget === 'excellent' ? 'Excellent' : scoreBudget === 'bon' ? 'Bon' : scoreBudget === 'attention' ? 'À surveiller' : 'Critique', couleur: scoreBudgetNum >= 70 ? '#10b981' : scoreBudgetNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Budget & Épargne', scoreBudgetNum) },
    { theme: 'Capacité d\'emprunt', score: scoreEmpruntNum, verdict: scoreEmpruntNum >= 70 ? 'Favorable' : scoreEmpruntNum >= 50 ? 'Limitée' : 'Saturée', couleur: scoreEmpruntNum >= 70 ? '#10b981' : scoreEmpruntNum >= 50 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Capacité d\'emprunt', scoreEmpruntNum) },
    { theme: 'Fiscalité', score: Math.round(scoreFiscaliteNum), verdict: scoreFiscaliteNum >= 70 ? 'Optimisée' : 'À optimiser', couleur: scoreFiscaliteNum >= 70 ? '#10b981' : '#f59e0b', commentaire: buildCommentaire('Fiscalité', Math.round(scoreFiscaliteNum)) },
    { theme: 'Épargne de précaution', score: scoreEpargneNum, verdict: scoreEpargneNum >= 70 ? 'Constituée' : scoreEpargneNum >= 45 ? 'Insuffisante' : 'Critique', couleur: scoreEpargneNum >= 70 ? '#10b981' : scoreEpargneNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Épargne de précaution', scoreEpargneNum) },
    { theme: 'Immobilier', score: scoreImmoNum, verdict: immobilier.concentrationRisque ? 'Concentration excessive' : 'Équilibré', couleur: scoreImmoNum >= 70 ? '#10b981' : scoreImmoNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Immobilier', scoreImmoNum) },
    { theme: 'Financier', score: scoreFinNum, verdict: scoreFinNum >= 70 ? 'Diversifié' : 'À diversifier', couleur: scoreFinNum >= 70 ? '#10b981' : scoreFinNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Financier', scoreFinNum) },
    { theme: 'Retraite', score: scoreRetraiteNum, verdict: scoreRetraiteNum >= 70 ? 'Sécurisée' : scoreRetraiteNum >= 45 ? 'À renforcer' : 'Déficitaire', couleur: scoreRetraiteNum >= 70 ? '#10b981' : scoreRetraiteNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Retraite', scoreRetraiteNum) },
    { theme: 'Transmission', score: scoreSuccNum, verdict: scoreSuccNum >= 70 ? 'Optimisée' : scoreSuccNum >= 45 ? 'À optimiser' : 'Coûteuse', couleur: scoreSuccNum >= 70 ? '#10b981' : scoreSuccNum >= 45 ? '#f59e0b' : '#ef4444', commentaire: buildCommentaire('Transmission', scoreSuccNum) },
  ]

  const scoreGlobal = Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length)

  const pointsForts: string[] = []
  const pointsVigilance: string[] = []
  const actionsPrioritaires: string[] = []

  if (scoreBudgetNum >= 70) pointsForts.push('Budget maîtrisé avec une capacité d\'épargne significative')
  else actionsPrioritaires.push('Rééquilibrer le budget pour dégager une capacité d\'épargne suffisante')

  if (scoreEmpruntNum >= 70) pointsForts.push('Capacité d\'emprunt disponible pour de nouveaux projets')
  else if (scoreEmpruntNum < 50) pointsVigilance.push('Taux d\'endettement élevé — attention avant tout nouveau crédit')

  if (scoreEpargneNum >= 70) pointsForts.push('Épargne de précaution constituée')
  else actionsPrioritaires.push('Constituer une épargne de précaution de 6 mois de charges')

  if (scoreDiversif >= 70) pointsForts.push('Patrimoine financier diversifié')
  else pointsVigilance.push('Diversification insuffisante du patrimoine financier')

  if (immobilier.concentrationRisque) pointsVigilance.push('Patrimoine trop concentré en immobilier (>70%)')

  if (scoreRetraiteNum >= 70) pointsForts.push('Projection retraite sécurisée')
  else actionsPrioritaires.push('Mettre en place un plan d\'épargne retraite (PER) pour combler le déficit')

  if (scoreSuccNum < 60) actionsPrioritaires.push('Engager une stratégie de transmission (donation-partage, démembrement)')

  if (fiscalite.optimisation && fiscalite.optimisation.economiesPotentielles > 1000) actionsPrioritaires.push(`Optimisation fiscale : jusqu'à ${fmt(fiscalite.optimisation.economiesPotentielles)} d'économies identifiées`)

  const synthese: AuditSynthese = {
    scoreGlobal,
    scores,
    pointsForts,
    pointsVigilance,
    actionsPrioritaires,
    narratifGlobal: `L'audit patrimonial de ${client.firstName} ${client.lastName} révèle un score global de ${scoreGlobal}/100. ${pointsForts.length > 0 ? 'Points forts : ' + pointsForts.slice(0, 3).join(', ') + '.' : ''} ${pointsVigilance.length > 0 ? 'Points de vigilance : ' + pointsVigilance.slice(0, 3).join(', ') + '.' : ''} ${actionsPrioritaires.length > 0 ? 'Actions prioritaires : ' + actionsPrioritaires.slice(0, 3).join(' ; ') + '.' : 'Aucune action urgente identifiée.'}`,
  }

  // ---- AUTO-PRÉCONISATIONS INTELLIGENTES ----
  const preconisationsAuto = generateAutoPreconisations({
    client, actifs, passifs, budget, emprunt, fiscalite, epargnePrecaution,
    immobilier, financier, retraite, succession, synthese,
    revenusMensuels, capaciteEpargneBrute, age, isAlreadyRetired, irTmiVal,
  })

  return {
    dateAudit: new Date().toISOString(),
    nomClient: `${client.firstName} ${client.lastName}`,
    budget,
    emprunt,
    fiscalite,
    epargnePrecaution,
    immobilier,
    financier,
    retraite,
    succession,
    synthese,
    preconisationsAuto,
  }
}

// ============================================================================
// MOTEUR AUTO-PRÉCONISATIONS — Génération intelligente de recommandations
// ============================================================================

interface PrecoContext {
  client: AuditClientInfo
  actifs: AuditActif[]
  passifs: AuditPassif[]
  budget: AuditBudget
  emprunt: AuditEmprunt
  fiscalite: AuditFiscalite
  epargnePrecaution: AuditEpargnePrecaution
  immobilier: AuditImmobilier
  financier: AuditFinancier
  retraite: AuditRetraite | null
  succession: AuditSuccession
  synthese: AuditSynthese
  revenusMensuels: number
  capaciteEpargneBrute: number
  age: number
  isAlreadyRetired: boolean
  irTmiVal: number
}

function generateAutoPreconisations(ctx: PrecoContext): AutoPreconisation[] {
  const precos: AutoPreconisation[] = []
  let idCounter = 0
  const nextId = () => `preco-auto-${++idCounter}`
  const { budget, emprunt, fiscalite, epargnePrecaution, immobilier, financier, retraite, succession, age, irTmiVal, capaciteEpargneBrute, revenusMensuels, isAlreadyRetired, client } = ctx

  // ── 1. ÉPARGNE DE PRÉCAUTION (toujours en premier si gap) ──
  if (epargnePrecaution.gap > 0) {
    const montantMensuel = epargnePrecaution.planConstitution?.montantMensuel || Math.round(capaciteEpargneBrute * 0.4)
    const moisNecessaires = montantMensuel > 0 ? Math.ceil(epargnePrecaution.gap / montantMensuel) : 24
    precos.push({
      id: nextId(),
      titre: 'Constituer une épargne de précaution',
      description: `Votre épargne de précaution est insuffisante : ${fmt(epargnePrecaution.epargneLiquideActuelle)} disponibles contre un objectif de ${fmt(epargnePrecaution.montantCible)} (6 mois de charges). Il manque ${fmt(epargnePrecaution.gap)}. Nous recommandons de mettre en place un virement automatique mensuel de ${fmt(montantMensuel)} vers un livret A ou LDDS pendant ${moisNecessaires} mois pour atteindre cet objectif.`,
      priorite: epargnePrecaution.priorite === 'critical' ? 'HAUTE' : epargnePrecaution.priorite === 'high' ? 'HAUTE' : 'MOYENNE',
      categorie: 'protection',
      produit: 'Livret A + LDDS (taux 3%, plafond 22 950 € + 12 000 €)',
      montantEstime: epargnePrecaution.gap,
      objectif: 'Sécuriser 6 mois de charges courantes en épargne liquide disponible immédiatement',
      avantages: 'Liquidité totale, capital garanti, rémunération nette d\'impôt à 3%, disponibilité immédiate en cas d\'imprévu',
      risques: 'Rendement inférieur à l\'inflation en période de hausse des prix',
      horizonTemporel: 'court',
      scoreImpact: epargnePrecaution.priorite === 'critical' ? 95 : 80,
    })
  }

  // ── 2. BUDGET — Rééquilibrage si taux d'effort > 40% ──
  if (budget.tauxEffort > 40) {
    precos.push({
      id: nextId(),
      titre: 'Rééquilibrer le budget mensuel',
      description: `Votre taux d'effort (charges + crédits / revenus) atteint ${budget.tauxEffort.toFixed(1)}%, ce qui est au-dessus du seuil de confort de 33%. ${budget.tauxEffort > 50 ? 'La situation est critique et nécessite des mesures immédiates : renégociation de crédits, réduction des charges discrétionnaires, ou augmentation des revenus.' : 'Un audit détaillé des postes de dépenses permettrait d\'identifier des économies et de dégager une capacité d\'épargne suffisante.'}`,
      priorite: budget.tauxEffort > 50 ? 'HAUTE' : 'MOYENNE',
      categorie: 'budget',
      objectif: 'Ramener le taux d\'effort sous 33% pour dégager une capacité d\'épargne mensuelle',
      avantages: 'Amélioration du reste à vivre, capacité à investir, réduction du stress financier',
      horizonTemporel: 'court',
      scoreImpact: budget.tauxEffort > 50 ? 90 : 70,
    })
  }

  // ── 3. EMPRUNT — Renégociation si taux élevé ──
  const dettesElevees = emprunt.detailDettesExistantes.filter(d => d.taux > 4)
  if (dettesElevees.length > 0) {
    const totalMensualitesConcernees = dettesElevees.reduce((s, d) => s + d.mensualite, 0)
    precos.push({
      id: nextId(),
      titre: 'Renégocier les crédits à taux élevé',
      description: `${dettesElevees.length} crédit(s) présentent un taux supérieur à 4% : ${dettesElevees.map(d => `${d.nom} à ${d.taux}%`).join(', ')}. La mensualité cumulée est de ${fmt(totalMensualitesConcernees)}/mois. Une renégociation ou un regroupement de crédits permettrait de réduire la charge mensuelle de 15 à 25%.`,
      priorite: 'MOYENNE',
      categorie: 'budget',
      objectif: 'Réduire le coût total du crédit et alléger les mensualités',
      avantages: `Économie potentielle de ${fmt(totalMensualitesConcernees * 0.2)}/mois, soit ${fmt(totalMensualitesConcernees * 0.2 * 12)}/an`,
      horizonTemporel: 'court',
      scoreImpact: 65,
    })
  }

  // ── 4. FISCALITÉ — PER si TMI ≥ 30% et pas retraité ──
  if (irTmiVal >= 0.30 && !isAlreadyRetired && age < 60) {
    const plafondPER = Math.round(revenusMensuels * 12 * 0.10)
    const economiePER = Math.round(plafondPER * irTmiVal)
    precos.push({
      id: nextId(),
      titre: 'Ouvrir ou alimenter un Plan d\'Épargne Retraite (PER)',
      description: `Avec une TMI à ${(irTmiVal * 100).toFixed(0)}%, chaque euro versé sur un PER génère ${(irTmiVal * 100).toFixed(0)} centimes d'économie d'impôt immédiate. Le plafond de déductibilité estimé est de ${fmt(plafondPER)}/an (10% des revenus nets). L'économie fiscale annuelle serait de ${fmt(economiePER)}. À la retraite, la TMI sera probablement de 11% ou 0%, rendant le gain fiscal net très significatif.`,
      priorite: 'HAUTE',
      categorie: 'fiscalite',
      produit: `PER individuel (versements libres, plafond ${fmt(plafondPER)}/an)`,
      montantEstime: plafondPER,
      objectif: 'Réduire l\'impôt sur le revenu tout en constituant une épargne retraite',
      avantages: `Économie d'impôt de ${fmt(economiePER)}/an, capitalisation long terme, sortie en capital ou rente à la retraite`,
      risques: 'Capital bloqué jusqu\'à la retraite (sauf cas de déblocage anticipé), fiscalisation à la sortie',
      horizonTemporel: 'long',
      impactFiscalAnnuel: economiePER,
      scoreImpact: 90,
    })
  }

  // ── 5. FISCALITÉ — Assurance-vie si patrimoine financier faible ou pas d'AV ──
  const avActuels = ctx.actifs.filter(a => a.type === 'LIFE_INSURANCE' || a.type === 'CAPITALIZATION_CONTRACT')
  const totalAV = avActuels.reduce((s, a) => s + a.value, 0)
  if (totalAV < revenusMensuels * 12 * 2 && capaciteEpargneBrute > 200) {
    const versementMensuel = Math.round(Math.min(capaciteEpargneBrute * 0.3, 500))
    precos.push({
      id: nextId(),
      titre: totalAV === 0 ? 'Ouvrir un contrat d\'assurance-vie' : 'Renforcer l\'assurance-vie',
      description: `${totalAV === 0 ? 'Vous ne disposez d\'aucun contrat d\'assurance-vie.' : `Votre encours total en assurance-vie est de ${fmt(totalAV)}, ce qui est modeste au regard de vos revenus.`} L'assurance-vie est l'enveloppe la plus polyvalente du patrimoine français : fiscalité avantageuse après 8 ans (abattement de 4 600 €/an sur les gains, ou 9 200 € en couple), transmission hors succession (art. 990 I : abattement de 152 500 €/bénéficiaire), et souplesse des rachats. Nous recommandons un versement programmé de ${fmt(versementMensuel)}/mois.`,
      priorite: totalAV === 0 ? 'HAUTE' : 'MOYENNE',
      categorie: 'financier',
      produit: 'Assurance-vie multisupport (fonds euro + UC diversifiées)',
      montantEstime: versementMensuel * 12,
      objectif: 'Constituer un capital disponible à fiscalité privilégiée et préparer la transmission',
      avantages: 'Fiscalité dégressive, rachat partiel possible, transmission avantageuse (152 500 €/bénéficiaire), diversification',
      risques: 'Risque en UC (pas de garantie en capital), frais de gestion annuels',
      horizonTemporel: 'moyen',
      scoreImpact: totalAV === 0 ? 85 : 70,
    })
  }

  // ── 6. IMMOBILIER — Diversification si concentration > 70% ──
  if (immobilier.concentrationRisque && financier.totalFinancier < immobilier.totalImmobilier * 0.3) {
    precos.push({
      id: nextId(),
      titre: 'Diversifier vers des actifs financiers',
      description: `Votre patrimoine est concentré à ${immobilier.poidsPatrimoine.toFixed(0)}% en immobilier. Cette sur-pondération expose votre patrimoine aux risques de liquidité et de cycle immobilier. Nous recommandons de rééquilibrer progressivement en orientant l'épargne future vers des placements financiers (assurance-vie, PEA) pour atteindre un ratio immobilier/financier de 60/40.`,
      priorite: 'MOYENNE',
      categorie: 'financier',
      objectif: 'Atteindre un ratio immobilier/financier de 60/40 pour améliorer la liquidité globale',
      avantages: 'Meilleure liquidité, diversification des risques, accès à des classes d\'actifs décorrélées',
      horizonTemporel: 'moyen',
      scoreImpact: 75,
    })
  }

  // ── 7. FINANCIER — PEA si pas encore ouvert ──
  const hasPEA = ctx.actifs.some(a => a.type === 'PEA' || a.type === 'PEA_PME')
  if (!hasPEA && age < 65 && capaciteEpargneBrute > 100) {
    precos.push({
      id: nextId(),
      titre: 'Ouvrir un Plan d\'Épargne en Actions (PEA)',
      description: `Vous ne possédez pas de PEA. C'est l'enveloppe la plus avantageuse pour investir en actions européennes : après 5 ans, les plus-values et dividendes sont exonérés d'impôt sur le revenu (seuls les prélèvements sociaux de 17,2% s'appliquent). Le plafond de versement est de 150 000 €. Même avec un versement modeste, prendre date est essentiel pour déclencher le compteur fiscal.`,
      priorite: 'MOYENNE',
      categorie: 'financier',
      produit: 'PEA bancaire (plafond 150 000 €) + ETF World/Europe pour diversification',
      montantEstime: Math.min(Math.round(capaciteEpargneBrute * 0.15) * 12, 5000),
      objectif: 'Prendre date fiscalement et investir à long terme en actions européennes',
      avantages: 'Exonération IR après 5 ans, plafond 150 000 €, retraits partiels possibles après 5 ans',
      risques: 'Risque de perte en capital sur les actions, liquidité réduite avant 5 ans',
      horizonTemporel: 'long',
      scoreImpact: 65,
    })
  }

  // ── 8. RETRAITE — Complémentaire si gap important ──
  if (retraite && retraite.analyseGap.gapMensuel > 200 && !isAlreadyRetired) {
    const capitalNecessaire = retraite.analyseGap.capitalNecessaire4Pct
    precos.push({
      id: nextId(),
      titre: 'Combler le déficit retraite par un plan d\'épargne dédié',
      description: `Votre projection retraite révèle un déficit de ${fmt(retraite.analyseGap.gapMensuel)}/mois entre votre revenu souhaité et la pension estimée. Pour maintenir votre niveau de vie, un capital de ${fmt(capitalNecessaire)} sera nécessaire (règle des 4%). ${irTmiVal >= 0.30 ? 'Le PER est particulièrement adapté à votre TMI.' : 'Une combinaison PER + assurance-vie offre le meilleur équilibre entre avantage fiscal et souplesse.'}`,
      priorite: retraite.analyseGap.gapMensuel > 500 ? 'HAUTE' : 'MOYENNE',
      categorie: 'retraite',
      produit: irTmiVal >= 0.30 ? 'PER individuel (déduction fiscale immédiate)' : 'PER + Assurance-vie (mix déduction + souplesse)',
      montantEstime: Math.round(capitalNecessaire / ((67 - age) * 12)),
      objectif: `Constituer ${fmt(capitalNecessaire)} de capital retraite d'ici ${67 - age} ans`,
      avantages: `Revenu complémentaire de ${fmt(retraite.analyseGap.gapMensuel)}/mois à la retraite`,
      horizonTemporel: 'long',
      scoreImpact: 85,
    })
  }

  // ── 9. SUCCESSION — Donation-partage si patrimoine imposable ──
  if (succession.droitsEstimes > 5000 && client.numberOfChildren && client.numberOfChildren > 0) {
    const abattementParEnfant = 100000
    const montantDonation = Math.min(abattementParEnfant * (client.numberOfChildren || 1), succession.patrimoineNetTaxable * 0.3)
    const economie = Math.round(montantDonation * succession.tauxEffectif / 100)
    precos.push({
      id: nextId(),
      titre: 'Initier une stratégie de donation-partage',
      description: `Les droits de succession estimés s'élèvent à ${fmt(succession.droitsEstimes)} (taux effectif ${succession.tauxEffectif.toFixed(1)}%). Chaque parent peut donner ${fmt(abattementParEnfant)} par enfant tous les 15 ans en franchise de droits. Pour ${client.numberOfChildren} enfant(s), l'abattement total est de ${fmt(abattementParEnfant * (client.numberOfChildren || 1) * (client.maritalStatus === 'MARRIED' || client.maritalStatus === 'PACS' ? 2 : 1))}. Une donation-partage permet de figer les valeurs et d'éviter les conflits ultérieurs.`,
      priorite: succession.droitsEstimes > 20000 ? 'HAUTE' : 'MOYENNE',
      categorie: 'succession',
      montantEstime: montantDonation,
      objectif: `Réduire les droits de succession de ${fmt(economie)} minimum`,
      avantages: `Abattement renouvelable tous les 15 ans, fige les valeurs, pacifie les relations familiales`,
      risques: 'Perte de contrôle sur les biens donnés (sauf donation avec réserve d\'usufruit)',
      horizonTemporel: 'moyen',
      impactFiscalAnnuel: Math.round(economie / 15),
      scoreImpact: 80,
    })
  }

  // ── 10. SUCCESSION — Démembrement AV si patrimoine AV significatif ──
  if (totalAV > 50000 && succession.droitsEstimes > 10000) {
    precos.push({
      id: nextId(),
      titre: 'Optimiser la clause bénéficiaire de l\'assurance-vie',
      description: `Votre encours d'assurance-vie de ${fmt(totalAV)} peut être optimisé pour la transmission. La clause bénéficiaire démembrée (usufruit au conjoint, nue-propriété aux enfants) permet au conjoint de conserver l'usage du capital tout en le transmettant aux enfants sans droits supplémentaires au second décès. Art. 990 I du CGI : abattement de 152 500 € par bénéficiaire pour les primes versées avant 70 ans.`,
      priorite: 'MOYENNE',
      categorie: 'succession',
      produit: 'Clause bénéficiaire démembrée (usufruit/nue-propriété)',
      objectif: 'Transmettre le capital AV avec une fiscalité optimale sur deux générations',
      avantages: 'Double abattement, protection du conjoint, pas de droits au second décès',
      horizonTemporel: 'moyen',
      scoreImpact: 70,
    })
  }

  // ── 11. FISCALITÉ — IFI si assujetti ──
  if (fiscalite.ifi.assujetti && fiscalite.ifi.montantIFI > 0) {
    precos.push({
      id: nextId(),
      titre: 'Réduire l\'exposition IFI',
      description: `Votre patrimoine immobilier imposable de ${fmt(fiscalite.ifi.patrimoineImposable)} génère un IFI estimé de ${fmt(fiscalite.ifi.montantIFI)}/an. Plusieurs leviers existent : donation de la nue-propriété (sort l'actif de l'assiette IFI), investissement en forêts ou vignobles (exonération 75%), dons aux organismes d'intérêt général (réduction de 75% plafonnée à 50 000 €), ou restructuration via une SCI à l'IS.`,
      priorite: fiscalite.ifi.montantIFI > 5000 ? 'HAUTE' : 'MOYENNE',
      categorie: 'fiscalite',
      objectif: `Réduire l'IFI annuel de ${fmt(fiscalite.ifi.montantIFI)}`,
      avantages: 'Économie annuelle récurrente, optimisation du patrimoine immobilier',
      horizonTemporel: 'moyen',
      impactFiscalAnnuel: fiscalite.ifi.montantIFI,
      scoreImpact: 75,
    })
  }

  // ── 12. PROTECTION — Prévoyance si revenus significatifs et famille ──
  if (revenusMensuels > 3000 && (client.numberOfChildren || 0) > 0 && !isAlreadyRetired) {
    precos.push({
      id: nextId(),
      titre: 'Auditer les garanties prévoyance',
      description: `Avec des revenus mensuels de ${fmt(revenusMensuels)} et ${client.numberOfChildren} enfant(s) à charge, la protection de votre famille en cas de décès, invalidité ou incapacité est essentielle. Nous recommandons un audit de vos garanties actuelles (régime obligatoire + contrats groupe) et si nécessaire, la mise en place d'une prévoyance complémentaire couvrant au minimum 3 ans de revenus en capital décès et 80% du revenu en maintien de salaire.`,
      priorite: 'MOYENNE',
      categorie: 'protection',
      produit: 'Contrat de prévoyance individuelle (décès, invalidité, incapacité)',
      montantEstime: Math.round(revenusMensuels * 0.02 * 12),
      objectif: 'Garantir le maintien du niveau de vie de la famille en cas d\'aléa de la vie',
      avantages: 'Sérénité familiale, capital garanti, cotisations déductibles (TNS)',
      horizonTemporel: 'court',
      scoreImpact: 60,
    })
  }

  // ── 13. IMMOBILIER — SCPI si pas d'investissement locatif et capacité ──
  if (immobilier.biens.filter(b => b.type.includes('RENTAL') || b.type.includes('LOCATIF')).length === 0 && capaciteEpargneBrute > 500 && age < 60) {
    precos.push({
      id: nextId(),
      titre: 'Investir en SCPI pour diversifier vers l\'immobilier locatif',
      description: `Vous ne possédez pas de bien locatif. Les SCPI (Sociétés Civiles de Placement Immobilier) offrent une exposition à l'immobilier professionnel diversifié sans les contraintes de gestion. Rendement moyen 2024 : 4,5% brut. Accessible dès 1 000 € en direct ou via assurance-vie (fiscalité plus favorable). L'achat en démembrement temporaire (nue-propriété) est particulièrement intéressant avec votre TMI de ${(irTmiVal * 100).toFixed(0)}%.`,
      priorite: 'BASSE',
      categorie: 'immobilier',
      produit: irTmiVal >= 0.30 ? 'SCPI en nue-propriété (15-20 ans) ou via AV' : 'SCPI en direct ou via assurance-vie',
      montantEstime: Math.round(capaciteEpargneBrute * 0.2 * 12),
      objectif: 'Diversifier les sources de revenus et préparer des revenus complémentaires',
      avantages: 'Diversification, mutualisation du risque, gestion déléguée, ticket d\'entrée faible',
      risques: 'Risque de perte en capital, liquidité réduite, frais d\'acquisition 8-12%',
      horizonTemporel: 'long',
      scoreImpact: 55,
    })
  }

  // Trier par scoreImpact décroissant, puis par priorité
  const prioOrder = { 'HAUTE': 0, 'MOYENNE': 1, 'BASSE': 2 }
  precos.sort((a, b) => {
    const pDiff = prioOrder[a.priorite] - prioOrder[b.priorite]
    if (pDiff !== 0) return pDiff
    return b.scoreImpact - a.scoreImpact
  })

  return precos
}
