 
'use client'

/**
 * TabBudgetComplet - Module Budget professionnel complet
 * 
 * Fonctionnalités:
 * - CRUD complet revenus avec modal édition
 * - CRUD complet dépenses avec modal édition
 * - CRUD complet dettes/emprunts
 * - Graphiques par catégorie
 * - Projections d'épargne
 * - Alertes taux d'endettement
 */

import { useState, useEffect, useMemo, useCallback, useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { mapExpenseCategoryToDisplayGroup, mapRevenueCategoryToDisplayGroup } from '@/app/_common/lib/labels'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  TrendingUp, TrendingDown, Plus, RefreshCw, FileDown, Edit, Trash2, 
  BarChart3, Calendar, AlertCircle, Target, CreditCard, MoreHorizontal,
  Home, Car, Utensils, Heart, Plane, GraduationCap, ShieldCheck, Receipt, Loader2,
  Briefcase, Building2, Landmark, Banknote, Gift, PiggyBank, Save, Info, HelpCircle, Wallet
} from 'lucide-react'
import InfoTooltip from '@/app/_common/components/ui/Tooltip'
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import { PatrimoineFormModal, type PatrimoineFormType } from '../modals'
// Types et fonctions locaux (originaux quarantinés avec calculateurs)
type ResultatEndettement = { 
  tauxActuel: number; tauxAvecLoyer: number; resteAVivre: number; capaciteEmprunt: number
  mensualiteMaxAvecLoyer: number; mensualiteMaxHorsLoyer: number; resteAVivreMinimum: number; resteAVivreActuel: number
  statut: 'ok' | 'attention' | 'critique'
}
const NORMES_HCSF_2025 = { 
  tauxEndettementMax: 35, dureePretMax: 25, 
  resteAVivreMinSeul: 1200, resteAVivreMinCouple: 1500, resteAVivreParEnfant: 300 
}
const getTauxMoyenParDuree = (duree: number): number => duree <= 15 ? 3.5 : duree <= 20 ? 3.7 : 3.9
const calculerEndettement = (params: {
  revenusMensuels: number; mensualitesCreditsEnCours: number; loyerActuel?: number
  situationFamiliale?: string; nbEnfants?: number
}): ResultatEndettement => {
  const { revenusMensuels, mensualitesCreditsEnCours, loyerActuel = 0 } = params
  const tauxActuel = revenusMensuels > 0 ? Math.round((mensualitesCreditsEnCours / revenusMensuels) * 100 * 100) / 100 : 0
  const tauxAvecLoyer = revenusMensuels > 0 ? Math.round(((mensualitesCreditsEnCours + loyerActuel) / revenusMensuels) * 100 * 100) / 100 : 0
  const mensualiteMax = revenusMensuels * (NORMES_HCSF_2025.tauxEndettementMax / 100)
  const resteAVivreActuel = revenusMensuels - mensualitesCreditsEnCours - loyerActuel
  const statut: 'ok' | 'attention' | 'critique' = tauxActuel > 35 ? 'critique' : tauxActuel > 30 ? 'attention' : 'ok'
  return { 
    tauxActuel, tauxAvecLoyer, resteAVivre: resteAVivreActuel,
    capaciteEmprunt: Math.max(0, mensualiteMax - mensualitesCreditsEnCours),
    mensualiteMaxAvecLoyer: Math.max(0, mensualiteMax - loyerActuel),
    mensualiteMaxHorsLoyer: mensualiteMax,
    resteAVivreMinimum: 1200, resteAVivreActuel, statut
  }
}
const calculerCapaciteEmprunt = (params: { mensualiteMax: number; dureeAnnees: number; tauxAnnuel: number }): number => {
  const { mensualiteMax, dureeAnnees, tauxAnnuel } = params
  const taux = tauxAnnuel / 100 / 12
  const n = dureeAnnees * 12
  return mensualiteMax > 0 ? Math.round(mensualiteMax * ((1 - Math.pow(1 + taux, -n)) / taux)) : 0
}

// =============================================================================
// Types
// =============================================================================

interface TabBudgetCompletProps {
  clientId: string
  client: ClientDetail
}

// Types alignés sur Prisma (fréquences françaises)
type FrequencePrisma = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL' | 'PONCTUEL'

interface RevenueItem {
  id: string
  name: string
  category: string
  amount: number
  frequency: FrequencePrisma
  isRecurring: boolean
  notes?: string
}

interface ExpenseItem {
  id: string
  name: string
  category: string
  amount: number
  frequency: FrequencePrisma
  isFixed: boolean
  isEssential: boolean
  notes?: string
}

interface DebtItem {
  id: string
  name: string
  type: string
  lender: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  startDate: string
  endDate: string
  notes?: string
}

// =============================================================================
// Constants
// =============================================================================

const REVENUE_CATEGORIES = [
  { value: 'SALAIRE', label: 'Salaires & Traitements', icon: Briefcase, color: '#10B981' },
  { value: 'LOCATIF', label: 'Revenus locatifs', icon: Building2, color: '#3B82F6' },
  { value: 'DIVIDENDES', label: 'Dividendes', icon: Landmark, color: '#8B5CF6' },
  { value: 'INTERETS', label: 'Intérêts', icon: Banknote, color: '#F59E0B' },
  { value: 'PENSION', label: 'Pensions & Retraites', icon: Heart, color: '#EC4899' },
  { value: 'ALLOCATIONS', label: 'Allocations', icon: Gift, color: '#14B8A6' },
  { value: 'PROFESSIONNEL', label: 'Revenus professionnels', icon: Briefcase, color: '#6366F1' },
  { value: 'AUTRES', label: 'Autres revenus', icon: MoreHorizontal, color: '#64748B' },
]

const EXPENSE_CATEGORIES = [
  { value: 'LOGEMENT', label: 'Logement', icon: Home, color: '#3B82F6' },
  { value: 'ALIMENTATION', label: 'Alimentation', icon: Utensils, color: '#10B981' },
  { value: 'TRANSPORT', label: 'Transport', icon: Car, color: '#F59E0B' },
  { value: 'SANTE', label: 'Santé', icon: Heart, color: '#EF4444' },
  { value: 'ASSURANCES', label: 'Assurances', icon: ShieldCheck, color: '#8B5CF6' },
  { value: 'LOISIRS', label: 'Loisirs & Vacances', icon: Plane, color: '#EC4899' },
  { value: 'ETUDES', label: 'Éducation', icon: GraduationCap, color: '#14B8A6' },
  { value: 'IMPOTS', label: 'Impôts & Taxes', icon: Receipt, color: '#64748B' },
  { value: 'EPARGNE', label: 'Épargne programmée', icon: PiggyBank, color: '#6366F1' },
  { value: 'AUTRES', label: 'Autres dépenses', icon: MoreHorizontal, color: '#94A3B8' },
]

const DEBT_TYPES = [
  { value: 'IMMOBILIER', label: 'Crédit immobilier', icon: Home },
  { value: 'CONSOMMATION', label: 'Crédit consommation', icon: CreditCard },
  { value: 'AUTO', label: 'Crédit auto', icon: Car },
  { value: 'ETUDES', label: 'Prêt étudiant', icon: GraduationCap },
  { value: 'PROFESSIONNEL', label: 'Prêt professionnel', icon: Briefcase },
  { value: 'AUTRE', label: 'Autre dette', icon: MoreHorizontal },
]

// Fréquences alignées sur Prisma (valeurs françaises)
const FREQUENCY_OPTIONS = [
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'TRIMESTRIEL', label: 'Trimestriel' },
  { value: 'SEMESTRIEL', label: 'Semestriel' },
  { value: 'ANNUEL', label: 'Annuel' },
  { value: 'PONCTUEL', label: 'Ponctuel' },
]

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#64748B', '#94A3B8']

// =============================================================================
// Helper Functions
// =============================================================================

// Convertir en montant mensuel (fréquences Prisma françaises)
const toMonthly = (amount: number | string, frequency: string) => {
  const num = Number(amount) || 0
  switch (frequency) {
    case 'ANNUEL': return num / 12
    case 'SEMESTRIEL': return num / 6
    case 'TRIMESTRIEL': return num / 3
    case 'PONCTUEL': return num / 12 // Ponctuel = annualisé
    case 'MENSUEL':
    default: return num
  }
}

// Convertir en montant annuel (fréquences Prisma françaises)
const toAnnual = (amount: number | string, frequency: string) => {
  const num = Number(amount) || 0
  switch (frequency) {
    case 'MENSUEL': return num * 12
    case 'TRIMESTRIEL': return num * 4
    case 'SEMESTRIEL': return num * 2
    case 'ANNUEL':
    case 'PONCTUEL':
    default: return num
  }
}

// Normaliser la fréquence vers les valeurs Prisma
const normalizeFrequency = (freq: string): FrequencePrisma => {
  const validFrequencies: FrequencePrisma[] = ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL', 'PONCTUEL']
  if (validFrequencies.includes(freq as FrequencePrisma)) {
    return freq as FrequencePrisma
  }
  // Fallback pour anciennes valeurs anglaises (compatibilité)
  const mapping: Record<string, FrequencePrisma> = {
    'MONTHLY': 'MENSUEL',
    'QUARTERLY': 'TRIMESTRIEL',
    'SEMI_ANNUAL': 'SEMESTRIEL',
    'ANNUAL': 'ANNUEL',
    'ONE_TIME': 'PONCTUEL',
  }
  return mapping[freq] || 'MENSUEL'
}

// Mapper type crédit Prisma vers frontend simplifié
const mapCreditTypeToFrontend = (type: string): string => {
  const mapping: Record<string, string> = {
    'PRET_IMMOBILIER_RP': 'IMMOBILIER',
    'PRET_IMMOBILIER_LOCATIF': 'IMMOBILIER',
    'PRET_IMMOBILIER_SECONDAIRE': 'IMMOBILIER',
    'PRET_RELAIS': 'IMMOBILIER',
    'PRET_IN_FINE': 'IMMOBILIER',
    'PRET_PERSONNEL': 'CONSOMMATION',
    'CREDIT_RENOUVELABLE': 'CONSOMMATION',
    'CREDIT_AUTO': 'AUTO',
    'CREDIT_MOTO': 'AUTO',
    'LOA': 'AUTO',
    'LLD': 'AUTO',
    'PRET_ETUDIANT': 'ETUDES',
    'PRET_PROFESSIONNEL': 'PROFESSIONNEL',
  }
  return mapping[type] || type
}

// Formater une date en yyyy-MM-dd pour les inputs date
const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return ''
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

// Utilise les fonctions de mapping centralisées depuis labels.ts
// mapRevenueCategoryToDisplayGroup et mapExpenseCategoryToDisplayGroup

const getCategoryConfig = (category: string, type: 'revenue' | 'expense') => {
  // Regrouper la catégorie détaillée en groupe d'affichage via les fonctions centralisées
  const group = type === 'revenue' 
    ? mapRevenueCategoryToDisplayGroup(category)
    : mapExpenseCategoryToDisplayGroup(category)
  const list = type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES
  return list.find(c => c.value === group) || list[list.length - 1]
}

const normalizeItems = <T extends { id?: string },>(value: unknown): T[] => {
  let items: T[] = []
  if (Array.isArray(value)) items = value as T[]
  else if (value && typeof value === 'object') items = Object.values(value as Record<string, T>)
  // Garantir que chaque item a un id
  return items.map((item, i) => ({ ...item, id: item.id || `temp-${Date.now()}-${i}` }))
}

const toStringSafe = (value: unknown, fallback: string = ''): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return fallback
}

const toNumberSafe = (value: unknown): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const toBooleanSafe = (value: unknown, fallback: boolean = false): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === '1' || v === 'yes' || v === 'oui') return true
    if (v === 'false' || v === '0' || v === 'no' || v === 'non') return false
  }
  return fallback
}

const ChartPlaceholder = ({ label = 'Chargement du graphique...' }: { label?: string }) => (
  <div className="h-full min-h-[12rem] flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-muted/40 text-sm text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mb-2 text-primary" />
    <span>{label}</span>
  </div>
)

// =============================================================================
// Main Component
// =============================================================================

export function TabBudgetComplet({ clientId, client }: TabBudgetCompletProps) {
  const { toast } = useToast()
  
  // UI State
  const [activeTab, setActiveTab] = useState('synthese')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal States
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false)
  const [showEditRevenueModal, setShowEditRevenueModal] = useState(false)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [showAddDebtModal, setShowAddDebtModal] = useState(false)
  const [showEditDebtModal, setShowEditDebtModal] = useState(false)
  
  // Selected Items for Edit
  const [selectedRevenue, setSelectedRevenue] = useState<RevenueItem | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null)
  
  // Formulaires détaillés (PatrimoineFormModal)
  const [detailedFormType, setDetailedFormType] = useState<PatrimoineFormType | null>(null)
  const [detailedFormData, setDetailedFormData] = useState<any>(null)
  
  // Data States
  const [revenues, setRevenues] = useState<RevenueItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [chartsReady, setChartsReady] = useState(false)

  // =============================================================================
  // Data Loading
  // =============================================================================

  // Extraction des données depuis le client (fallback)
  const extractFromClient = useCallback(() => {
    const annualIncome = Number(client.annualIncome) || 0
    if (annualIncome > 0) {
      setRevenues([{
        id: `fallback-annual-${Date.now()}`,
        name: 'Revenu annuel déclaré',
        category: 'SALAIRE',
        amount: Math.round(annualIncome / 12),
        frequency: 'MENSUEL',
        isRecurring: true,
      }])
    }
    const passifs = client.passifs || []
    if (passifs.length > 0) {
      setDebts(passifs.map((p: Record<string, unknown>, i: number) => {
        const rawStart = (typeof p.startDate === 'string' || p.startDate instanceof Date) ? p.startDate : null
        const rawEnd = (typeof p.endDate === 'string' || p.endDate instanceof Date) ? p.endDate : null
        return {
          id: toStringSafe(p.id, `passif-${i}`),
          name: toStringSafe(p.name, 'Emprunt'),
          type: toStringSafe(p.type, 'AUTRE'),
          lender: toStringSafe(p.lender, ''),
          initialAmount: toNumberSafe(p.initialAmount),
          remainingAmount: toNumberSafe(p.remainingAmount),
          interestRate: toNumberSafe(p.interestRate),
          monthlyPayment: toNumberSafe(p.monthlyPayment),
          startDate: formatDateForInput(rawStart),
          endDate: formatDateForInput(rawEnd),
        }
      }))
    }
  }, [client])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [revenuesRes, expensesRes, creditsRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/revenues`).catch(() => null),
        fetch(`/api/advisor/clients/${clientId}/expenses`).catch(() => null),
        fetch(`/api/advisor/clients/${clientId}/credits`).catch(() => null),
      ])
      
      let hasData = false
      
      // Mapper revenus API → frontend
      if (revenuesRes?.ok) {
        const data = await revenuesRes.json()
        const rawItems = normalizeItems<Record<string, unknown>>(data.data || data || [])
        const items: RevenueItem[] = rawItems.map((r) => ({
          id: toStringSafe(r.id),
          name: toStringSafe(r.libelle) || toStringSafe(r.name) || '',
          category: toStringSafe(r.category) || toStringSafe(r.categorie) || 'AUTRES',
          amount: toNumberSafe(r.montant ?? r.amount),
          frequency: normalizeFrequency(toStringSafe(r.frequency) || toStringSafe(r.frequence) || 'MENSUEL'),
          isRecurring: toBooleanSafe((r.isRecurrent ?? r.estRecurrent), true),
          notes: toStringSafe(r.notes, ''),
        }))
        if (items.length > 0) { setRevenues(items); hasData = true }
      }
      
      // Mapper expenses API → frontend
      if (expensesRes?.ok) {
        const data = await expensesRes.json()
        const rawItems = normalizeItems<Record<string, unknown>>(data.data || data || [])
        const items: ExpenseItem[] = rawItems.map((e) => ({
          id: toStringSafe(e.id),
          name: toStringSafe(e.libelle) || toStringSafe(e.name) || '',
          category: toStringSafe(e.category) || toStringSafe(e.categorie) || 'AUTRES',
          amount: toNumberSafe(e.montant ?? e.amount),
          frequency: normalizeFrequency(toStringSafe(e.frequency) || toStringSafe(e.frequence) || 'MENSUEL'),
          isFixed: toBooleanSafe((e.isFixe ?? e.estFixe), false),
          isEssential: toBooleanSafe((e.isEssentiel ?? e.estEssentiel), false),
          notes: toStringSafe(e.notes, ''),
        }))
        if (items.length > 0) { setExpenses(items); hasData = true }
      }
      
      // Mapper credits API → frontend
      if (creditsRes?.ok) {
        const data = await creditsRes.json()
        const rawItems = normalizeItems<Record<string, unknown>>(data.data || data || [])
        const items: DebtItem[] = rawItems.map((c) => ({
          id: toStringSafe(c.id),
          name: toStringSafe(c.libelle) || toStringSafe(c.name) || '',
          type: mapCreditTypeToFrontend(toStringSafe(c.type, 'AUTRE')),
          lender: toStringSafe(c.organisme) || toStringSafe(c.lender) || '',
          initialAmount: toNumberSafe(c.montantInitial ?? c.initialAmount),
          remainingAmount: toNumberSafe(c.capitalRestantDu ?? c.remainingAmount),
          interestRate: toNumberSafe(c.tauxNominal ?? c.interestRate),
          monthlyPayment: toNumberSafe(c.mensualiteTotale ?? c.mensualiteHorsAssurance ?? c.monthlyPayment),
          startDate: formatDateForInput((typeof c.dateDebut === 'string' || c.dateDebut instanceof Date) ? c.dateDebut : null),
          endDate: formatDateForInput((typeof c.dateFin === 'string' || c.dateFin instanceof Date) ? c.dateFin : null),
          notes: toStringSafe(c.notes, ''),
        }))
        if (items.length > 0) { setDebts(items); hasData = true }
      }
      
      if (!hasData) extractFromClient()
    } catch (error) {
      console.error('Erreur chargement budget:', error)
      extractFromClient()
    } finally {
      setLoading(false)
    }
  }, [clientId, extractFromClient])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartsReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // =============================================================================
  // Calculations
  // =============================================================================

  const totalRevenus = useMemo(() => 
    revenues.reduce((s, r) => s + toMonthly(r.amount, r.frequency), 0), [revenues])

  const totalCharges = useMemo(() => 
    expenses.reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0), [expenses])

  const totalDettes = useMemo(() => 
    debts.reduce((s, d) => s + (Number(d.monthlyPayment) || 0), 0), [debts])

  const totalRemboursement = useMemo(() => 
    debts.reduce((s, d) => s + (Number(d.remainingAmount) || 0), 0), [debts])

  const chargesFixesTotal = useMemo(() => 
    expenses.filter(e => e.isFixed).reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0) + totalDettes,
    [expenses, totalDettes])

  // Loyer actuel (charges de catégorie LOGEMENT ou LOYER)
  const loyerActuel = useMemo(() => 
    expenses
      .filter(e => mapExpenseCategoryToDisplayGroup(e.category) === 'LOGEMENT')
      .reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0),
    [expenses])
  
  // Déterminer si le client est locataire (a un loyer dans ses charges)
  const estLocataire = loyerActuel > 0

  const solde = totalRevenus - totalCharges - totalDettes
  const tauxEpargne = totalRevenus > 0 ? (solde / totalRevenus) * 100 : 0
  
  // =============================================================================
  // CALCUL ENDETTEMENT - Via API centralisée (Normes HCSF 2025)
  // =============================================================================
  
  // Déterminer la situation familiale depuis le client
  const situationFamiliale = useMemo((): 'seul' | 'couple' => {
    const status = client.maritalStatus?.toUpperCase() || ''
    return ['MARRIED', 'MARIE', 'PACS', 'COHABITATION', 'CONCUBINAGE'].includes(status) ? 'couple' : 'seul'
  }, [client.maritalStatus])
  
  const nbEnfants = client.numberOfChildren || 0
  
  // Calcul d'endettement via la fonction centralisée (normes HCSF 2025)
  const endettement: ResultatEndettement = useMemo(() => 
    calculerEndettement({
      revenusMensuels: totalRevenus,
      mensualitesCreditsEnCours: totalDettes,
      loyerActuel: loyerActuel,
      situationFamiliale,
      nbEnfants
    }),
    [totalRevenus, totalDettes, loyerActuel, situationFamiliale, nbEnfants]
  )
  
  // Extraction des valeurs pour compatibilité avec le reste du code
  const tauxEndettementActuel = endettement.tauxActuel
  const tauxEndettementAvecLoyer = endettement.tauxAvecLoyer
  const tauxEndettementHorsLoyer = endettement.tauxActuel // Hors loyer = taux actuel (crédits seuls)
  const mensualiteMaxAvecLoyer = endettement.mensualiteMaxAvecLoyer
  const mensualiteMaxHorsLoyer = endettement.mensualiteMaxHorsLoyer
  const resteAVivreMinimum = endettement.resteAVivreMinimum
  const resteAVivreActuel = endettement.resteAVivreActuel
  
  // Capacité d'emprunt sur 25 ans au taux moyen du marché
  const tauxMoyen25ans = getTauxMoyenParDuree(25)
  const capaciteEmpruntAvecLoyer = useMemo(() => 
    calculerCapaciteEmprunt({ mensualiteMax: mensualiteMaxAvecLoyer, dureeAnnees: 25, tauxAnnuel: tauxMoyen25ans }),
    [mensualiteMaxAvecLoyer, tauxMoyen25ans]
  )
  const capaciteEmpruntHorsLoyer = useMemo(() => 
    calculerCapaciteEmprunt({ mensualiteMax: mensualiteMaxHorsLoyer, dureeAnnees: 25, tauxAnnuel: tauxMoyen25ans }),
    [mensualiteMaxHorsLoyer, tauxMoyen25ans]
  )
  
  const endettementStatus = endettement.statut === 'critique' ? 'danger' : endettement.statut === 'attention' ? 'warning' : 'success'

  // =============================================================================
  // Chart Data
  // =============================================================================

  // Répartition des revenus par catégorie
  const revenuesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {}
    revenues.forEach(r => {
      const cat = r.category || 'AUTRES'
      grouped[cat] = (grouped[cat] || 0) + toMonthly(r.amount, r.frequency)
    })
    return Object.entries(grouped).map(([cat, amount]) => ({
      name: getCategoryConfig(cat, 'revenue').label,
      value: Math.round(amount),
      color: getCategoryConfig(cat, 'revenue').color,
    })).sort((a, b) => b.value - a.value)
  }, [revenues])

  // Répartition des charges par catégorie
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {}
    expenses.forEach(e => {
      const cat = e.category || 'AUTRES'
      grouped[cat] = (grouped[cat] || 0) + toMonthly(e.amount, e.frequency)
    })
    // Ajouter les crédits
    if (totalDettes > 0) grouped['CREDITS'] = totalDettes
    return Object.entries(grouped).map(([cat, amount]) => ({
      name: cat === 'CREDITS' ? 'Remboursements crédits' : getCategoryConfig(cat, 'expense').label,
      value: Math.round(amount),
      color: cat === 'CREDITS' ? '#EF4444' : getCategoryConfig(cat, 'expense').color,
    })).sort((a, b) => b.value - a.value)
  }, [expenses, totalDettes])

  // Données comparatives revenus vs charges
  const balanceData = useMemo(() => [
    { name: 'Revenus', montant: Math.round(totalRevenus), fill: '#10B981' },
    { name: 'Charges fixes', montant: Math.round(chargesFixesTotal - totalDettes), fill: '#3B82F6' },
    { name: 'Charges variables', montant: Math.round(totalCharges - (chargesFixesTotal - totalDettes)), fill: '#F59E0B' },
    { name: 'Crédits', montant: Math.round(totalDettes), fill: '#EF4444' },
    { name: 'Solde', montant: Math.round(Math.max(0, solde)), fill: '#8B5CF6' },
  ], [totalRevenus, totalCharges, chargesFixesTotal, totalDettes, solde])

  // Projection d'épargne
  const projectionData = useMemo(() => {
    const data = []
    let cumul = 0
    for (let i = 0; i <= 12; i++) {
      data.push({ mois: i === 0 ? 'Actuel' : `M${i}`, epargne: Math.round(cumul), objectif: Math.round((totalCharges + totalDettes) * 6) })
      cumul += solde
    }
    return data
  }, [solde, totalCharges, totalDettes])

  // =============================================================================
  // CRUD Operations
  // =============================================================================

  const handleSaveRevenue = async (data: Omit<RevenueItem, 'id'>, isEdit = false) => {
    setSaving(true)
    // Mapper les données vers le format API (français)
    const apiData = {
      libelle: data.name,
      montant: data.amount,
      categorie: data.category,
      frequence: data.frequency,
      estRecurrent: data.isRecurring,
      notes: data.notes,
    }
    
    try {
      const url = isEdit && selectedRevenue 
        ? `/api/advisor/clients/${clientId}/revenues/${selectedRevenue.id}`
        : `/api/advisor/clients/${clientId}/revenues`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur serveur')
      }
      const result = await res.json()
      const newId = result.data?.id || result.id || Date.now().toString()
      
      if (isEdit && selectedRevenue) {
        setRevenues(prev => prev.map(r => r.id === selectedRevenue.id ? { ...data, id: selectedRevenue.id } : r))
      } else {
        setRevenues(prev => [...prev, { ...data, id: newId }])
      }
      toast({ title: isEdit ? 'Revenu modifié' : 'Revenu ajouté' })
    } catch (error) { 
      console.error('Erreur sauvegarde revenu:', error)
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de sauvegarder', variant: 'destructive' })
    }
    
    setSaving(false)
    setShowAddRevenueModal(false)
    setShowEditRevenueModal(false)
    setSelectedRevenue(null)
  }

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Supprimer ce revenu ?')) return
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/revenues/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur serveur')
      setRevenues(prev => prev.filter(r => r.id !== id))
      toast({ title: 'Revenu supprimé' })
    } catch (error) {
      console.error('Erreur suppression revenu:', error)
      toast({ title: 'Erreur', description: 'Impossible de supprimer le revenu', variant: 'destructive' })
    }
  }

  const handleSaveExpense = async (data: Omit<ExpenseItem, 'id'>, isEdit = false) => {
    setSaving(true)
    // Mapper les données vers le format API (français)
    const apiData = {
      libelle: data.name,
      montant: data.amount,
      categorie: data.category,
      frequence: data.frequency,
      estFixe: data.isFixed,
      estEssentiel: data.isEssential,
      notes: data.notes,
    }
    
    try {
      const url = isEdit && selectedExpense 
        ? `/api/advisor/clients/${clientId}/expenses/${selectedExpense.id}`
        : `/api/advisor/clients/${clientId}/expenses`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur serveur')
      }
      const result = await res.json()
      const newId = result.data?.id || result.id || Date.now().toString()
      
      if (isEdit && selectedExpense) {
        setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? { ...data, id: selectedExpense.id } : e))
      } else {
        setExpenses(prev => [...prev, { ...data, id: newId }])
      }
      toast({ title: isEdit ? 'Charge modifiée' : 'Charge ajoutée' })
    } catch (error) {
      console.error('Erreur sauvegarde charge:', error)
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de sauvegarder', variant: 'destructive' })
    }
    
    setSaving(false)
    setShowAddExpenseModal(false)
    setShowEditExpenseModal(false)
    setSelectedExpense(null)
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Supprimer cette charge ?')) return
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur serveur')
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast({ title: 'Charge supprimée' })
    } catch (error) {
      console.error('Erreur suppression charge:', error)
      toast({ title: 'Erreur', description: 'Impossible de supprimer la charge', variant: 'destructive' })
    }
  }

  const handleSaveDebt = async (data: Omit<DebtItem, 'id'>, isEdit = false) => {
    setSaving(true)
    // Mapper les données vers le format API (français)
    // Générer des dates par défaut si non fournies
    const today = new Date()
    const defaultEndDate = new Date(today.getFullYear() + 10, today.getMonth(), today.getDate())
    
    const apiData = {
      libelle: data.name,
      type: data.type, // Le type est déjà au bon format (IMMOBILIER, CONSOMMATION, etc.)
      montantInitial: data.initialAmount || 0,
      capitalRestantDu: data.remainingAmount || data.initialAmount || 0,
      tauxNominal: data.interestRate || 0,
      mensualiteHorsAssurance: data.monthlyPayment || 0,
      mensualiteTotale: data.monthlyPayment || 0,
      dateDebut: data.startDate || today.toISOString().split('T')[0],
      dateFin: data.endDate || defaultEndDate.toISOString().split('T')[0],
      organisme: data.lender || '',
      notes: data.notes || '',
    }
    
    try {
      // Si c'est un edit, vérifier si l'ID est un vrai ID de base (format CUID) ou un ID local
      // Les IDs locaux commencent par 'passif-' ou 'annual-' ou sont des timestamps
      const isRealDbId = selectedDebt?.id && 
        !selectedDebt.id.startsWith('passif-') && 
        !selectedDebt.id.startsWith('annual-') &&
        selectedDebt.id.length > 20 // Les CUIDs font ~25 caractères
      
      // Si c'est un edit mais avec un ID local, on fait un POST (création)
      const shouldCreate = !isEdit || !isRealDbId
      
      const url = shouldCreate
        ? `/api/advisor/clients/${clientId}/credits`
        : `/api/advisor/clients/${clientId}/credits/${selectedDebt!.id}`
      
      const res = await fetch(url, {
        method: shouldCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur serveur')
      }
      const result = await res.json()
      const newId = result.data?.id || result.id || Date.now().toString()
      
      if (isEdit && selectedDebt) {
        // Mettre à jour avec le nouvel ID si on a créé au lieu de modifier
        setDebts(prev => prev.map(d => d.id === selectedDebt.id ? { ...data, id: shouldCreate ? newId : selectedDebt.id } : d))
      } else {
        setDebts(prev => [...prev, { ...data, id: newId }])
      }
      toast({ title: isEdit ? 'Crédit modifié' : 'Crédit ajouté' })
    } catch (error) {
      console.error('Erreur sauvegarde crédit:', error)
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de sauvegarder', variant: 'destructive' })
    }
    
    setSaving(false)
    setShowAddDebtModal(false)
    setShowEditDebtModal(false)
    setSelectedDebt(null)
  }

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Supprimer ce crédit ?')) return
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/credits/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur serveur')
      setDebts(prev => prev.filter(d => d.id !== id))
      toast({ title: 'Dette supprimée' })
    } catch (error) {
      console.error('Erreur suppression dette:', error)
      toast({ title: 'Erreur', description: 'Impossible de supprimer la dette', variant: 'destructive' })
    }
  }

  const openEditRevenue = (rev: RevenueItem) => { setSelectedRevenue(rev); setShowEditRevenueModal(true) }
  const openEditExpense = (exp: ExpenseItem) => { setSelectedExpense(exp); setShowEditExpenseModal(true) }
  const openEditDebt = (debt: DebtItem) => { setSelectedDebt(debt); setShowEditDebtModal(true) }

  const handleExport = async () => {
    toast({ 
      title: 'Export en cours', 
      description: 'Génération du rapport budget PDF...' 
    })
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/reports/budget?format=pdf`)
      if (!response.ok) throw new Error('Erreur')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-budget-${clientId}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({ title: 'Rapport budget généré', variant: 'success' })
    } catch {
      toast({ title: 'Erreur génération PDF', variant: 'destructive' })
    }
  }

  const renderCharts = chartsReady

  // =============================================================================
  // Loading State
  // =============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-lg text-muted-foreground">Chargement du budget...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Budget mensuel</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleExport}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
        </div>
      </div>

      {/* Dashboard unifié - Balance + Indicateurs */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Balance visuelle */}
          <div className="flex items-center gap-2 text-center">
            <div className="flex-1 p-3 bg-emerald-50 rounded-lg">
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalRevenus)}</p>
              <p className="text-xs text-emerald-600">Revenus</p>
            </div>
            <span className="text-gray-300 text-lg">−</span>
            <div className="flex-1 p-3 bg-amber-50 rounded-lg">
              <p className="text-xl font-bold text-amber-700">{formatCurrency(totalCharges)}</p>
              <p className="text-xs text-amber-600">Charges</p>
            </div>
            <span className="text-gray-300 text-lg">−</span>
            <div className="flex-1 p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-700">{formatCurrency(totalDettes)}</p>
              <p className="text-xs text-red-600">Crédits</p>
            </div>
            <span className="text-gray-300 text-lg">=</span>
            <div className={`flex-1 p-3 rounded-lg ${solde >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-xl font-bold ${solde >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(solde)}</p>
              <p className={`text-xs ${solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Solde</p>
            </div>
          </div>

          {/* Indicateurs en ligne */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Taux d'endettement</span>
                <span className={`font-medium ${(tauxEndettementAvecLoyer || 0) <= 33 ? 'text-emerald-600' : (tauxEndettementAvecLoyer || 0) <= 35 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatPercentage(isNaN(tauxEndettementAvecLoyer) ? 0 : tauxEndettementAvecLoyer)}
                </span>
              </div>
              <Progress value={Math.min(Math.max((isNaN(tauxEndettementAvecLoyer) ? 0 : tauxEndettementAvecLoyer) / 35 * 100, 0), 100)} className={`h-2 ${(tauxEndettementAvecLoyer || 0) <= 33 ? '[&>div]:bg-emerald-500' : (tauxEndettementAvecLoyer || 0) <= 35 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} />
              <p className="text-xs text-gray-400 mt-1">
                HCSF max : 35% {estLocataire && `(incl. loyer ${formatCurrency(loyerActuel)})`}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Taux d'épargne</span>
                <span className={`font-medium ${(tauxEpargne || 0) >= 20 ? 'text-emerald-600' : (tauxEpargne || 0) >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatPercentage(isNaN(tauxEpargne) ? 0 : tauxEpargne)}
                </span>
              </div>
              <Progress value={Math.min(Math.max((isNaN(tauxEpargne) ? 0 : tauxEpargne), 0) / 20 * 100, 100)} className={`h-2 ${(tauxEpargne || 0) >= 20 ? '[&>div]:bg-emerald-500' : (tauxEpargne || 0) >= 10 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} />
              <p className="text-xs text-gray-400 mt-1">Objectif : 20%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerte si nécessaire */}
      {(tauxEndettementAvecLoyer > 35 || solde < 0) && (
        <Alert className={tauxEndettementAvecLoyer > 35 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}>
          <AlertCircle className={`h-4 w-4 ${tauxEndettementAvecLoyer > 35 ? 'text-red-600' : 'text-amber-600'}`} />
          <AlertDescription className={tauxEndettementAvecLoyer > 35 ? 'text-red-700' : 'text-amber-700'}>
            {tauxEndettementAvecLoyer > 35 
              ? `Endettement critique (${formatPercentage(tauxEndettementAvecLoyer)} > 35% HCSF)${estLocataire ? ' - loyer inclus' : ''}` 
              : `Budget déficitaire : ${formatCurrency(Math.abs(solde))}/mois`}
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets CGP */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="synthese">
        <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
          <TabsTrigger value="synthese" className="data-[state=active]:bg-white">
            <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />Synthèse
          </TabsTrigger>
          <TabsTrigger value="revenus" className="data-[state=active]:bg-white">
            <TrendingUp className="h-4 w-4 mr-2 text-emerald-600" />Revenus ({revenues.length})
          </TabsTrigger>
          <TabsTrigger value="depenses" className="data-[state=active]:bg-white">
            <TrendingDown className="h-4 w-4 mr-2 text-amber-600" />Charges ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="dettes" className="data-[state=active]:bg-white">
            <CreditCard className="h-4 w-4 mr-2 text-red-600" />Crédits ({debts.length})
          </TabsTrigger>
          <TabsTrigger value="projections" className="data-[state=active]:bg-white">
            <Target className="h-4 w-4 mr-2 text-violet-600" />Analyse
          </TabsTrigger>
        </TabsList>

        {/* Synthèse Tab - Vue d'ensemble CGP */}
        <TabsContent value="synthese" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des revenus */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Répartition des revenus
                </CardTitle>
                <CardDescription>{formatCurrency(totalRevenus)}/mois • {revenues.length} source{revenues.length > 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                {revenuesByCategory.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-40" style={{ minWidth: 160, minHeight: 160 }}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={revenuesByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" paddingAngle={2}>
                            {revenuesByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {revenuesByCategory.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun revenu</p>
                      <Button size="sm" variant="link" onClick={() => { setActiveTab('revenus'); setShowAddRevenueModal(true) }}>
                        Ajouter un revenu
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Répartition des charges */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                  Répartition des charges
                </CardTitle>
                <CardDescription>{formatCurrency(totalCharges + totalDettes)}/mois • {expenses.length + debts.length} poste{expenses.length + debts.length > 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-40" style={{ minWidth: 160, minHeight: 160 }}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" paddingAngle={2}>
                            {expensesByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {expensesByCategory.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune charge</p>
                      <Button size="sm" variant="link" onClick={() => { setActiveTab('depenses'); setShowAddExpenseModal(true) }}>
                        Ajouter une charge
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Balance comparative */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Balance mensuelle</CardTitle>
              <CardDescription>Comparaison revenus vs charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48" style={{ minWidth: 300, minHeight: 192 }}>
                <ResponsiveContainer width="100%" height={192}>
                  <BarChart data={balanceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="montant" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Indicateurs CGP avec tooltips explicatifs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-emerald-600 font-medium">Capacité d'épargne</p>
                  <InfoTooltip content="Montant disponible chaque mois après avoir payé toutes vos charges et crédits. C'est ce que vous pouvez épargner ou investir." className="">
                    <HelpCircle className="h-3 w-3 text-emerald-400 cursor-help" />
                  </InfoTooltip>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(Math.max(0, solde))}</p>
                <p className="text-xs text-emerald-500">/mois disponible</p>
              </CardContent>
            </Card>
            
            <Card className={`border-blue-200 ${resteAVivreActuel < resteAVivreMinimum ? 'bg-amber-50 border-amber-200' : 'bg-blue-50'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <p className={`text-xs font-medium ${resteAVivreActuel < resteAVivreMinimum ? 'text-amber-600' : 'text-blue-600'}`}>Reste à vivre</p>
                  <InfoTooltip content={`Montant restant après crédits et loyer. Min. recommandé HCSF : ${formatCurrency(resteAVivreMinimum)} (${situationFamiliale}${nbEnfants > 0 ? ` + ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}` : ''})`} className="">
                    <HelpCircle className={`h-3 w-3 cursor-help ${resteAVivreActuel < resteAVivreMinimum ? 'text-amber-400' : 'text-blue-400'}`} />
                  </InfoTooltip>
                </div>
                <p className={`text-2xl font-bold ${resteAVivreActuel < resteAVivreMinimum ? 'text-amber-700' : 'text-blue-700'}`}>{formatCurrency(Math.max(0, resteAVivreActuel))}</p>
                <p className={`text-xs ${resteAVivreActuel < resteAVivreMinimum ? 'text-amber-500' : 'text-blue-500'}`}>
                  {resteAVivreActuel < resteAVivreMinimum ? `⚠️ min. ${formatCurrency(resteAVivreMinimum)}` : 'après crédits et loyer'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-violet-200 bg-violet-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-violet-600 font-medium">Épargne de précaution</p>
                  <InfoTooltip content="Montant recommandé à conserver en épargne disponible (Livret A, LDD) pour faire face aux imprévus. Objectif : 3 à 6 mois de charges." className="">
                    <HelpCircle className="h-3 w-3 text-violet-400 cursor-help" />
                  </InfoTooltip>
                </div>
                <p className="text-2xl font-bold text-violet-700">{formatCurrency((totalCharges + totalDettes) * 6)}</p>
                <p className="text-xs text-violet-500">objectif 6 mois de charges</p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-amber-600 font-medium">Capacité d'emprunt</p>
                  <InfoTooltip content={`Mensualité max selon HCSF (35%). Capital empruntable sur 25 ans à ${tauxMoyen25ans}% : ${formatCurrency(Math.round(capaciteEmpruntAvecLoyer))}`} className="">
                    <HelpCircle className="h-3 w-3 text-amber-400 cursor-help" />
                  </InfoTooltip>
                </div>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(mensualiteMaxAvecLoyer)}</p>
                <p className="text-xs text-amber-500">mensualité max (HCSF 35%)</p>
              </CardContent>
            </Card>
          </div>

          {/* Analyse endettement détaillée pour projets */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base">Analyse capacité d'emprunt</CardTitle>
                <InfoTooltip content="Deux calculs selon votre projet : avec loyer (investissement locatif) ou hors loyer (achat résidence principale où le loyer disparaît)." className="">
                  <HelpCircle className="h-4 w-4 text-indigo-400 cursor-help" />
                </InfoTooltip>
              </div>
              <CardDescription>Deux scénarios selon votre projet immobilier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scénario 1: Investissement (avec loyer) */}
                <div className="p-4 rounded-lg bg-white border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-indigo-800">Investissement locatif</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Vous restez locataire</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Endettement actuel</span>
                      <span className={`text-lg font-bold ${tauxEndettementAvecLoyer > 35 ? 'text-red-600' : tauxEndettementAvecLoyer > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatPercentage(tauxEndettementAvecLoyer)}
                      </span>
                    </div>
                    <Progress value={Math.min(tauxEndettementAvecLoyer / 35 * 100, 100)} className={`h-2 ${tauxEndettementAvecLoyer > 35 ? '[&>div]:bg-red-500' : tauxEndettementAvecLoyer > 30 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Mensualité dispo</p>
                        <p className="text-lg font-bold text-indigo-700">{formatCurrency(mensualiteMaxAvecLoyer)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Capital (25 ans)</p>
                        <p className="text-lg font-bold text-indigo-700">{formatCurrency(Math.round(capaciteEmpruntAvecLoyer))}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scénario 2: Achat RP (hors loyer) */}
                <div className="p-4 rounded-lg bg-white border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Achat résidence principale</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Loyer libéré : +{formatCurrency(loyerActuel)}/mois</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Endettement actuel</span>
                      <span className={`text-lg font-bold ${tauxEndettementHorsLoyer > 35 ? 'text-red-600' : tauxEndettementHorsLoyer > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatPercentage(tauxEndettementHorsLoyer)}
                      </span>
                    </div>
                    <Progress value={Math.min(tauxEndettementHorsLoyer / 35 * 100, 100)} className={`h-2 ${tauxEndettementHorsLoyer > 35 ? '[&>div]:bg-red-500' : tauxEndettementHorsLoyer > 30 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Mensualité dispo</p>
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(mensualiteMaxHorsLoyer)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Capital (25 ans)</p>
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(Math.round(capaciteEmpruntHorsLoyer))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note explicative */}
              <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <strong>Normes HCSF 2025 :</strong> Taux d'endettement max <strong>35%</strong> (assurance incluse), durée max 25 ans.
                    </p>
                    <p>
                      <strong>Reste à vivre min. :</strong> {formatCurrency(NORMES_HCSF_2025.resteAVivreMinSeul)} (seul), {formatCurrency(NORMES_HCSF_2025.resteAVivreMinCouple)} (couple), +{formatCurrency(NORMES_HCSF_2025.resteAVivreParEnfant)}/enfant
                    </p>
                    <p>
                      <strong>Taux moyen décembre 2025 :</strong> {tauxMoyen25ans}% sur 25 ans (source: CAFPI)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenus Tab */}
        <TabsContent value="revenus" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {revenues.length > 0 ? `${revenues.length} revenu${revenues.length > 1 ? 's' : ''} • Total: ${formatCurrency(totalRevenus)}/mois` : 'Aucun revenu enregistré'}
            </p>
            <Button onClick={() => setShowAddRevenueModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />Ajouter un revenu
            </Button>
          </div>
          
          {revenues.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {revenues.map((rev) => {
                    const catConfig = getCategoryConfig(rev.category, 'revenue')
                    const CatIcon = catConfig.icon
                    return (
                      <div key={rev.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: catConfig.color + '20' }}>
                            <CatIcon className="h-5 w-5" style={{ color: catConfig.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{rev.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{catConfig.label}</Badge>
                              {rev.isRecurring && <Badge className="bg-green-100 text-green-700">Récurrent</Badge>}
                              <Badge variant="secondary">{FREQUENCY_OPTIONS.find(f => f.value === rev.frequency)?.label}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-green-600">{formatCurrency(rev.amount)}</span>
                          <Button size="sm" variant="ghost" onClick={() => openEditRevenue(rev)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteRevenue(rev.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground mb-4">Aucun revenu enregistré</p>
                <Button onClick={() => setShowAddRevenueModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Ajouter un revenu
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dépenses Tab */}
        <TabsContent value="depenses" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {expenses.length > 0 ? `${expenses.length} charge${expenses.length > 1 ? 's' : ''} • Total: ${formatCurrency(totalCharges)}/mois` : 'Aucune charge enregistrée'}
            </p>
            <Button onClick={() => setShowAddExpenseModal(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" />Ajouter une charge
            </Button>
          </div>
          
          {expenses.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {expenses.map((exp) => {
                    const catConfig = getCategoryConfig(exp.category, 'expense')
                    const CatIcon = catConfig.icon
                    return (
                      <div key={exp.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: catConfig.color + '20' }}>
                            <CatIcon className="h-5 w-5" style={{ color: catConfig.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{exp.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{catConfig.label}</Badge>
                              {exp.isFixed && <Badge className="bg-blue-100 text-blue-700">Fixe</Badge>}
                              {exp.isEssential && <Badge className="bg-amber-100 text-amber-700">Essentiel</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-amber-600">{formatCurrency(exp.amount)}</span>
                          <Button size="sm" variant="ghost" onClick={() => openEditExpense(exp)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteExpense(exp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground mb-4">Aucune dépense enregistrée</p>
                <Button onClick={() => setShowAddExpenseModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Ajouter une dépense
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dettes Tab */}
        <TabsContent value="dettes" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {debts.length > 0 
                ? `${debts.length} crédit${debts.length > 1 ? 's' : ''} • Mensualités: ${formatCurrency(totalDettes)}/mois • Capital restant: ${formatCurrency(totalRemboursement)}` 
                : 'Aucun crédit enregistré'}
            </p>
            <Button onClick={() => setShowAddDebtModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />Ajouter un crédit
            </Button>
          </div>
          
          {debts.length > 0 ? (
            <div className="space-y-4">
              {debts.map((debt) => {
                const typeConfig = DEBT_TYPES.find(t => t.value === debt.type) || DEBT_TYPES[5]
                const DebtIcon = typeConfig.icon
                const initial = Number(debt.initialAmount) || 0
                const remaining = Number(debt.remainingAmount) || 0
                const monthly = Number(debt.monthlyPayment) || 0
                const progress = initial > 0 ? ((initial - remaining) / initial) * 100 : 0
                return (
                  <Card key={debt.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-red-100">
                            <DebtIcon className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{debt.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{typeConfig.label}</Badge>
                              {debt.lender && <span>• {debt.lender}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{formatCurrency(monthly)}</p>
                          <p className="text-sm text-muted-foreground">/mois</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Remboursé</span>
                          <span>{formatPercentage(progress)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(initial - remaining)} remboursé</span>
                          <span>{formatCurrency(remaining)} restant</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                        <div><span className="text-muted-foreground">Initial</span><p className="font-medium">{formatCurrency(Number(debt.initialAmount) || 0)}</p></div>
                        <div><span className="text-muted-foreground">Taux</span><p className="font-medium">{formatPercentage(Number(debt.interestRate) || 0)}</p></div>
                        <div><span className="text-muted-foreground">Début</span><p className="font-medium">{debt.startDate ? formatDate(debt.startDate) : '-'}</p></div>
                        <div><span className="text-muted-foreground">Fin</span><p className="font-medium">{debt.endDate ? formatDate(debt.endDate) : '-'}</p></div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => openEditDebt(debt)}>
                          <Edit className="h-4 w-4 mr-1" />Modifier
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDebt(debt.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground mb-4">Aucune dette enregistrée</p>
                <Button onClick={() => setShowAddDebtModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />Ajouter une dette
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analyse & Recommandations Tab */}
        <TabsContent value="projections" className="mt-4 space-y-6">
          {/* Épargne de précaution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-600" />
                Épargne de précaution
              </CardTitle>
              <CardDescription>
                Recommandation : 3 à 6 mois de charges fixes pour faire face aux imprévus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const epargnePrecautionMin = chargesFixesTotal * 3
                const epargnePrecautionMax = chargesFixesTotal * 6
                const moisPourMin = solde > 0 ? Math.ceil(epargnePrecautionMin / solde) : Infinity
                const moisPourMax = solde > 0 ? Math.ceil(epargnePrecautionMax / solde) : Infinity
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-700 font-medium">Minimum recommandé (3 mois)</p>
                        <p className="text-2xl font-bold text-emerald-800">{formatCurrency(epargnePrecautionMin)}</p>
                        {solde > 0 && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Atteignable en {moisPourMin} mois d'épargne
                          </p>
                        )}
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">Idéal (6 mois)</p>
                        <p className="text-2xl font-bold text-blue-800">{formatCurrency(epargnePrecautionMax)}</p>
                        {solde > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Atteignable en {moisPourMax} mois d'épargne
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {solde <= 0 && (
                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          Le solde mensuel est négatif ou nul. Il faut d'abord rééquilibrer le budget avant de constituer une épargne de précaution.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>

          {/* Capacité d'investissement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Capacité d'investissement
              </CardTitle>
              <CardDescription>
                Montants disponibles pour investir après constitution de l'épargne de précaution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {solde > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Capacité mensuelle</p>
                      <p className="text-2xl font-bold text-slate-800">{formatCurrency(solde)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Capacité annuelle</p>
                      <p className="text-2xl font-bold text-slate-800">{formatCurrency(solde * 12)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Taux d'épargne</p>
                      <p className="text-2xl font-bold text-slate-800">{tauxEpargne.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Recommandations d'allocation */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-3">Allocation suggérée du solde mensuel</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">Épargne de précaution (livrets)</span>
                        <span className="font-medium text-blue-900">{formatCurrency(solde * 0.3)} (30%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">Épargne projet (AV, PEA)</span>
                        <span className="font-medium text-blue-900">{formatCurrency(solde * 0.4)} (40%)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">Épargne retraite (PER)</span>
                        <span className="font-medium text-blue-900">{formatCurrency(solde * 0.3)} (30%)</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-3">
                      * Allocation indicative à adapter selon le profil de risque et les objectifs du client
                    </p>
                  </div>
                </div>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Pas de capacité d'investissement disponible. Le budget est déficitaire de {formatCurrency(Math.abs(solde))}/mois.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Synthèse des indicateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Synthèse budgétaire
              </CardTitle>
              <CardDescription>
                Vue d'ensemble de la santé financière du client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Taux d'endettement */}
              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Taux d'endettement</span>
                  </div>
                  <Badge className={tauxEndettementAvecLoyer <= 33 ? 'bg-emerald-100 text-emerald-800' : tauxEndettementAvecLoyer <= 35 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>
                    {tauxEndettementAvecLoyer.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={Math.min(tauxEndettementAvecLoyer / 35 * 100, 100)} className={`h-2 mb-2 ${tauxEndettementAvecLoyer <= 33 ? '[&>div]:bg-emerald-500' : tauxEndettementAvecLoyer <= 35 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} />
                <p className="text-xs text-gray-600">
                  {tauxEndettementAvecLoyer <= 35 
                    ? `Le client respecte la norme HCSF (max 35%). ${tauxEndettementAvecLoyer <= 25 ? 'Il dispose d\'une bonne marge pour un nouveau crédit.' : 'La marge pour un nouveau crédit est limitée.'}`
                    : `Le taux dépasse la norme HCSF de 35%. Un nouveau crédit bancaire sera difficile à obtenir.`
                  }
                  {estLocataire && ` (loyer de ${formatCurrency(loyerActuel)} inclus)`}
                </p>
              </div>

              {/* Taux d'épargne */}
              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Taux d'épargne</span>
                  </div>
                  <Badge className={tauxEpargne >= 20 ? 'bg-emerald-100 text-emerald-800' : tauxEpargne >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}>
                    {tauxEpargne.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={Math.min(Math.max(tauxEpargne, 0) / 30 * 100, 100)} className={`h-2 mb-2 ${tauxEpargne >= 20 ? '[&>div]:bg-emerald-500' : tauxEpargne >= 10 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} />
                <p className="text-xs text-gray-600">
                  {tauxEpargne >= 20 
                    ? `Excellent taux d'épargne. Le client peut épargner ${formatCurrency(solde)} par mois.`
                    : tauxEpargne >= 10 
                      ? `Taux d'épargne correct. L'objectif recommandé est de 15 à 20% des revenus.`
                      : tauxEpargne > 0
                        ? `Taux d'épargne faible. Il est conseillé de réduire certaines charges pour atteindre 15-20%.`
                        : `Pas de capacité d'épargne. Le budget est déficitaire.`
                  }
                </p>
              </div>

              {/* Reste à vivre */}
              <div className="p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Reste à vivre</span>
                  </div>
                  <Badge className={resteAVivreActuel >= resteAVivreMinimum ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                    {formatCurrency(resteAVivreActuel)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Montant disponible chaque mois après paiement des charges fixes et crédits.
                  {resteAVivreActuel >= resteAVivreMinimum 
                    ? ` Supérieur au minimum recommandé de ${formatCurrency(resteAVivreMinimum)} pour ${situationFamiliale === 'couple' ? 'un couple' : 'une personne seule'}${nbEnfants > 0 ? ` avec ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}` : ''}.`
                    : ` Inférieur au minimum recommandé de ${formatCurrency(resteAVivreMinimum)}.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RevenueFormModal 
        open={showAddRevenueModal} 
        onClose={() => setShowAddRevenueModal(false)} 
        onSave={(data) => handleSaveRevenue(data, false)} 
        saving={saving}
      />
      <RevenueFormModal 
        open={showEditRevenueModal} 
        onClose={() => { setShowEditRevenueModal(false); setSelectedRevenue(null) }} 
        onSave={(data) => handleSaveRevenue(data, true)} 
        initialData={selectedRevenue}
        saving={saving}
      />
      <ExpenseFormModal 
        open={showAddExpenseModal} 
        onClose={() => setShowAddExpenseModal(false)} 
        onSave={(data) => handleSaveExpense(data, false)} 
        saving={saving}
      />
      <ExpenseFormModal 
        open={showEditExpenseModal} 
        onClose={() => { setShowEditExpenseModal(false); setSelectedExpense(null) }} 
        onSave={(data) => handleSaveExpense(data, true)} 
        initialData={selectedExpense}
        saving={saving}
      />
      <DebtFormModal 
        open={showAddDebtModal} 
        onClose={() => setShowAddDebtModal(false)} 
        onSave={(data) => handleSaveDebt(data, false)} 
        saving={saving}
      />
      <DebtFormModal 
        open={showEditDebtModal} 
        onClose={() => { setShowEditDebtModal(false); setSelectedDebt(null) }} 
        onSave={(data) => handleSaveDebt(data, true)} 
        initialData={selectedDebt}
        saving={saving}
      />

      {/* Formulaire détaillé (PatrimoineFormModal) */}
      {detailedFormType && (
        <PatrimoineFormModal
          isOpen={true}
          onClose={() => {
            setDetailedFormType(null)
            setDetailedFormData(null)
          }}
          formType={detailedFormType}
          clientId={clientId}
          initialData={detailedFormData}
          onSuccess={() => {
            loadData()
            setDetailedFormType(null)
            setDetailedFormData(null)
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// Form Modals - UI/UX Améliorée style CGP Professionnel
// =============================================================================

// Composant de section avec style
function FormSection({ title, icon: Icon, children, color = 'slate' }: { 
  title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; color?: string 
}) {
  const colorClasses: Record<string, string> = {
    slate: 'from-slate-50 to-slate-100/50 border-slate-200/60',
    emerald: 'from-emerald-50 to-emerald-100/30 border-emerald-200/60',
    amber: 'from-amber-50 to-amber-100/30 border-amber-200/60',
    red: 'from-red-50 to-red-100/30 border-red-200/60',
  }
  const iconColors: Record<string, string> = {
    slate: 'text-slate-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border space-y-4`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColors[color]}`} />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      {children}
    </div>
  )
}

// Sélecteur de catégorie visuel
function CategorySelector({ categories, selected, onSelect, color }: {
  categories: typeof REVENUE_CATEGORIES
  selected: string
  onSelect: (value: string) => void
  color: 'emerald' | 'amber' | 'red'
}) {
  const colorClasses = {
    emerald: { active: 'ring-2 ring-emerald-500 bg-emerald-50', hover: 'hover:bg-emerald-50' },
    amber: { active: 'ring-2 ring-amber-500 bg-amber-50', hover: 'hover:bg-amber-50' },
    red: { active: 'ring-2 ring-red-500 bg-red-50', hover: 'hover:bg-red-50' },
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map(cat => {
        const Icon = cat.icon
        const isSelected = selected === cat.value
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            className={`p-3 rounded-lg border text-center transition-all ${
              isSelected 
                ? colorClasses[color].active 
                : `border-gray-200 bg-white ${colorClasses[color].hover}`
            }`}
          >
            <div className="p-2 rounded-lg mx-auto w-fit mb-1" style={{ backgroundColor: cat.color + '20' }}>
              <Icon className="h-4 w-4" style={{ color: cat.color }} />
            </div>
            <p className="text-xs font-medium truncate">{cat.label}</p>
          </button>
        )
      })}
    </div>
  )
}

interface RevenueFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<RevenueItem, 'id'>) => void
  initialData?: RevenueItem | null
  saving?: boolean
}

function RevenueFormModal({ open, onClose, onSave, initialData, saving }: RevenueFormModalProps) {
  const descriptionId = useId()
  const [step, setStep] = useState<'category' | 'details'>('category')
  const [data, setData] = useState({
    name: '',
    category: 'SALAIRE',
    amount: '',
    frequency: 'MONTHLY' as RevenueItem['frequency'],
    isRecurring: true,
    notes: '',
  })

  useEffect(() => {
    if (initialData) {
      setData({
        name: initialData.name,
        category: initialData.category,
        amount: String(initialData.amount),
        frequency: initialData.frequency,
        isRecurring: initialData.isRecurring,
        notes: initialData.notes || '',
      })
      setStep('details')
    } else {
      setData({ name: '', category: 'SALAIRE', amount: '', frequency: 'MENSUEL', isRecurring: true, notes: '' })
      setStep('category')
    }
  }, [initialData, open])

  const handleSubmit = () => {
    onSave({
      name: data.name,
      category: data.category,
      amount: Number(data.amount),
      frequency: data.frequency,
      isRecurring: data.isRecurring,
      notes: data.notes,
    })
  }

  const selectedCat = REVENUE_CATEGORIES.find(c => c.value === data.category)
  const CatIcon = selectedCat?.icon || Briefcase

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby={descriptionId}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>{initialData ? 'Modifier le revenu' : 'Nouveau revenu'}</DialogTitle>
              <DialogDescription id={descriptionId}>
                {step === 'category' ? 'Sélectionnez le type de revenu' : 'Renseignez les détails'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'category' ? (
          <div className="py-4">
            <CategorySelector 
              categories={REVENUE_CATEGORIES} 
              selected={data.category} 
              onSelect={(v) => { setData({...data, category: v}); setStep('details') }}
              color="emerald"
            />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Badge catégorie sélectionnée */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: selectedCat?.color + '20' }}>
                  <CatIcon className="h-4 w-4" style={{ color: selectedCat?.color }} />
                </div>
                <span className="font-medium text-emerald-800">{selectedCat?.label}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStep('category')}>
                Changer
              </Button>
            </div>

            <FormSection title="Informations" icon={Briefcase} color="emerald">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Libellé *</Label>
                  <Input 
                    value={data.name} 
                    onChange={(e) => setData({...data, name: e.target.value})} 
                    placeholder="Ex: Salaire mensuel" 
                    className="border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Montant (€) *</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="number" 
                      value={data.amount} 
                      onChange={(e) => setData({...data, amount: e.target.value})} 
                      placeholder="0" 
                      className="pl-10 border-gray-200 focus:border-emerald-400 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Fréquence</Label>
                  <Select value={data.frequency} onValueChange={(v: RevenueItem['frequency']) => setData({...data, frequency: v})}>
                    <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {f.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={data.isRecurring} 
                      onChange={(e) => setData({...data, isRecurring: e.target.checked})} 
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Revenu récurrent</span>
                  </label>
                </div>
              </div>
            </FormSection>

            {/* Aperçu montant annuel */}
            {data.amount && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                <span className="text-sm text-gray-600">Montant annualisé</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(toAnnual(Number(data.amount), data.frequency))}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'details' && !initialData && (
            <Button variant="ghost" onClick={() => setStep('category')} className="mr-auto">
              ← Retour
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          {step === 'details' && (
            <Button 
              onClick={handleSubmit} 
              disabled={!data.name || !data.amount || saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {initialData ? 'Enregistrer' : 'Ajouter le revenu'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<ExpenseItem, 'id'>) => void
  initialData?: ExpenseItem | null
  saving?: boolean
}

function ExpenseFormModal({ open, onClose, onSave, initialData, saving }: ExpenseFormModalProps) {
  const descriptionId = useId()
  const [step, setStep] = useState<'category' | 'details'>('category')
  const [data, setData] = useState({
    name: '',
    category: 'AUTRES',
    amount: '',
    frequency: 'MONTHLY' as ExpenseItem['frequency'],
    isFixed: false,
    isEssential: false,
    notes: '',
  })

  useEffect(() => {
    if (initialData) {
      setData({
        name: initialData.name,
        category: initialData.category,
        amount: String(initialData.amount),
        frequency: initialData.frequency,
        isFixed: initialData.isFixed,
        isEssential: initialData.isEssential,
        notes: initialData.notes || '',
      })
      setStep('details')
    } else {
      setData({ name: '', category: 'AUTRE_CHARGE', amount: '', frequency: 'MENSUEL', isFixed: false, isEssential: false, notes: '' })
      setStep('category')
    }
  }, [initialData, open])

  const handleSubmit = () => {
    onSave({
      name: data.name,
      category: data.category,
      amount: Number(data.amount),
      frequency: data.frequency,
      isFixed: data.isFixed,
      isEssential: data.isEssential,
      notes: data.notes,
    })
  }

  const selectedCat = EXPENSE_CATEGORIES.find(c => c.value === data.category)
  const CatIcon = selectedCat?.icon || Receipt

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby={descriptionId}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>{initialData ? 'Modifier la charge' : 'Nouvelle charge'}</DialogTitle>
              <DialogDescription id={descriptionId}>
                {step === 'category' ? 'Sélectionnez le type de charge' : 'Renseignez les détails'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'category' ? (
          <div className="py-4">
            <CategorySelector 
              categories={EXPENSE_CATEGORIES} 
              selected={data.category} 
              onSelect={(v) => { setData({...data, category: v}); setStep('details') }}
              color="amber"
            />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Badge catégorie sélectionnée */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: selectedCat?.color + '20' }}>
                  <CatIcon className="h-4 w-4" style={{ color: selectedCat?.color }} />
                </div>
                <span className="font-medium text-amber-800">{selectedCat?.label}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStep('category')}>
                Changer
              </Button>
            </div>

            <FormSection title="Informations" icon={Receipt} color="amber">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Libellé *</Label>
                  <Input 
                    value={data.name} 
                    onChange={(e) => setData({...data, name: e.target.value})} 
                    placeholder="Ex: Loyer appartement" 
                    className="border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Montant (€) *</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="number" 
                      value={data.amount} 
                      onChange={(e) => setData({...data, amount: e.target.value})} 
                      placeholder="0" 
                      className="pl-10 border-gray-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">Fréquence</Label>
                <Select value={data.frequency} onValueChange={(v: ExpenseItem['frequency']) => setData({...data, frequency: v})}>
                  <SelectTrigger className="border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {f.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection title="Classification" icon={Target} color="slate">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-blue-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={data.isFixed} 
                    onChange={(e) => setData({...data, isFixed: e.target.checked})} 
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Charge fixe</span>
                    <p className="text-xs text-gray-500">Montant constant chaque mois</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-amber-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={data.isEssential} 
                    onChange={(e) => setData({...data, isEssential: e.target.checked})} 
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Essentielle</span>
                    <p className="text-xs text-gray-500">Dépense incompressible</p>
                  </div>
                </label>
              </div>
            </FormSection>

            {/* Aperçu montant annuel */}
            {data.amount && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                <span className="text-sm text-gray-600">Montant annualisé</span>
                <span className="font-bold text-amber-600">
                  {formatCurrency(toAnnual(Number(data.amount), data.frequency))}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'details' && !initialData && (
            <Button variant="ghost" onClick={() => setStep('category')} className="mr-auto">
              ← Retour
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          {step === 'details' && (
            <Button 
              onClick={handleSubmit} 
              disabled={!data.name || !data.amount || saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {initialData ? 'Enregistrer' : 'Ajouter la charge'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DebtFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<DebtItem, 'id'>) => void
  initialData?: DebtItem | null
  saving?: boolean
}

function DebtFormModal({ open, onClose, onSave, initialData, saving }: DebtFormModalProps) {
  const descriptionId = useId()
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [data, setData] = useState({
    name: '',
    type: 'IMMOBILIER',
    lender: '',
    initialAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: '',
    endDate: '',
    notes: '',
  })

  useEffect(() => {
    if (initialData) {
      setData({
        name: initialData.name,
        type: initialData.type,
        lender: initialData.lender,
        initialAmount: String(initialData.initialAmount),
        remainingAmount: String(initialData.remainingAmount),
        interestRate: String(initialData.interestRate),
        monthlyPayment: String(initialData.monthlyPayment),
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        notes: initialData.notes || '',
      })
      setStep('details')
    } else {
      setData({ name: '', type: 'IMMOBILIER', lender: '', initialAmount: '', remainingAmount: '', interestRate: '', monthlyPayment: '', startDate: '', endDate: '', notes: '' })
      setStep('type')
    }
  }, [initialData, open])

  const handleSubmit = () => {
    onSave({
      name: data.name,
      type: data.type,
      lender: data.lender,
      initialAmount: Number(data.initialAmount),
      remainingAmount: Number(data.remainingAmount),
      interestRate: Number(data.interestRate),
      monthlyPayment: Number(data.monthlyPayment),
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
    })
  }

  const selectedType = DEBT_TYPES.find(t => t.value === data.type)
  const TypeIcon = selectedType?.icon || CreditCard
  const progress = data.initialAmount && data.remainingAmount 
    ? ((Number(data.initialAmount) - Number(data.remainingAmount)) / Number(data.initialAmount)) * 100 
    : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby={descriptionId}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>{initialData ? 'Modifier le crédit' : 'Nouveau crédit'}</DialogTitle>
              <DialogDescription id={descriptionId}>
                {step === 'type' ? 'Sélectionnez le type de crédit' : 'Renseignez les détails'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'type' ? (
          <div className="py-4">
            <div className="grid grid-cols-3 gap-3">
              {DEBT_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = data.type === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => { setData({...data, type: type.value}); setStep('details') }}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      isSelected 
                        ? 'ring-2 ring-red-500 bg-red-50' 
                        : 'border-gray-200 bg-white hover:bg-red-50'
                    }`}
                  >
                    <div className="p-2 rounded-lg mx-auto w-fit mb-2 bg-red-100">
                      <Icon className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-sm font-medium">{type.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Badge type sélectionné */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <TypeIcon className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-red-800">{selectedType?.label}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStep('type')}>
                Changer
              </Button>
            </div>

            <FormSection title="Informations générales" icon={CreditCard} color="red">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Libellé *</Label>
                  <Input 
                    value={data.name} 
                    onChange={(e) => setData({...data, name: e.target.value})} 
                    placeholder="Ex: Prêt résidence principale" 
                    className="border-gray-200 focus:border-red-400 focus:ring-red-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Organisme prêteur</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      value={data.lender} 
                      onChange={(e) => setData({...data, lender: e.target.value})} 
                      placeholder="Ex: Crédit Agricole" 
                      className="pl-10 border-gray-200 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Montants" icon={Banknote} color="slate">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Montant emprunté (€) *</Label>
                  <Input 
                    type="number" 
                    value={data.initialAmount} 
                    onChange={(e) => setData({...data, initialAmount: e.target.value})} 
                    placeholder="200000"
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Capital restant dû (€) *</Label>
                  <Input 
                    type="number" 
                    value={data.remainingAmount} 
                    onChange={(e) => setData({...data, remainingAmount: e.target.value})} 
                    placeholder="150000"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Taux d'intérêt (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={data.interestRate} 
                    onChange={(e) => setData({...data, interestRate: e.target.value})} 
                    placeholder="2.5"
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Mensualité (€) *</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="number" 
                      value={data.monthlyPayment} 
                      onChange={(e) => setData({...data, monthlyPayment: e.target.value})} 
                      placeholder="1200"
                      className="pl-10 border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Échéances" icon={Calendar} color="slate">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Date de début</Label>
                  <Input 
                    type="date" 
                    value={data.startDate} 
                    onChange={(e) => setData({...data, startDate: e.target.value})} 
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">Date de fin</Label>
                  <Input 
                    type="date" 
                    value={data.endDate} 
                    onChange={(e) => setData({...data, endDate: e.target.value})} 
                    className="border-gray-200"
                  />
                </div>
              </div>
            </FormSection>

            {/* Aperçu du remboursement */}
            {data.initialAmount && data.remainingAmount && (
              <div className="p-4 rounded-lg bg-gray-50 border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progression du remboursement</span>
                  <span className="font-bold text-red-600">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2 [&>div]:bg-red-500" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatCurrency(Number(data.initialAmount) - Number(data.remainingAmount))} remboursé</span>
                  <span>{formatCurrency(Number(data.remainingAmount))} restant</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'details' && !initialData && (
            <Button variant="ghost" onClick={() => setStep('type')} className="mr-auto">
              ← Retour
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          {step === 'details' && (
            <Button 
              onClick={handleSubmit} 
              disabled={!data.name || !data.monthlyPayment || saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {initialData ? 'Enregistrer' : 'Ajouter le crédit'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TabBudgetComplet
