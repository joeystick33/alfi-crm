/**
 * Overview Service
 * 
 * Service for calculating and aggregating Client 360 overview data.
 * Implements Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import type { PrismaClient } from '@prisma/client'
// Types imported from client360 types
export type AlertSeverity = 'CRITIQUE' | 'WARNING' | 'INFO'
export type RiskLevel = 'BASSE' | 'MOYENNE' | 'HAUTE'
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'ACTION' | 'LOG'

export interface Alert {
  id: string
  type: AlertSeverity
  title: string
  message: string
  actionLink?: string
  actionLabel?: string
}

export interface AllocationItem {
  category: string
  value: number
  percentage: number
  color?: string
}

export interface EvolutionPoint {
  date: string
  value: number
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  performedBy: string
  linkedDocuments: string[]
  metadata?: Record<string, unknown>
}

// ============================================================================
// Types
// ============================================================================

export interface OverviewPatrimony {
  totalGross: number
  totalNet: number
  allocation: AllocationItem[]
  evolution: EvolutionPoint[]
}

export interface OverviewIndicators {
  currentTaxation: number
  taxableIncome: number
  activeContractsCount: number
  riskLevel: RiskLevel
  priorityObjectives: string[]
}

export interface BudgetEvolutionPoint {
  date: string
  revenue: number
  expense: number
}

export interface OverviewData {
  patrimony: OverviewPatrimony
  budgetEvolution: BudgetEvolutionPoint[]
  indicators: OverviewIndicators
  alerts: Alert[]
  recentActivities: Activity[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    const maybeToNumber = rec.toNumber
    if (typeof maybeToNumber === 'function') {
      const n = (maybeToNumber as () => unknown)()
      return toFiniteNumber(n)
    }
    const maybeToString = rec.toString
    if (typeof maybeToString === 'function') {
      const n = Number((maybeToString as () => string)())
      return Number.isFinite(n) ? n : 0
    }
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    const asDate = new Date(value)
    return Number.isNaN(asDate.getTime()) ? new Date().toISOString() : asDate.toISOString()
  }
  return new Date().toISOString()
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const asDate = new Date(value)
    return Number.isNaN(asDate.getTime()) ? null : asDate
  }
  return null
}

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

// ============================================================================
// Color Palette for Allocation Charts
// ============================================================================

const ALLOCATION_COLORS: Record<string, string> = {
  IMMOBILIER: '#3B82F6',      // Blue
  FINANCIER: '#10B981',       // Green
  PROFESSIONNEL: '#F59E0B',   // Amber
  AUTRES: '#8B5CF6',          // Purple
  RESIDENCE_PRINCIPALE: '#2563EB',
  LOCATIF: '#3B82F6',
  COMMERCIAL: '#60A5FA',
  SCPI: '#93C5FD',
  PEA: '#059669',
  CTO: '#10B981',
  ASSURANCE_VIE: '#34D399',
  FONDS_EUROS: '#6EE7B7',
  UC: '#A7F3D0',
}

// ============================================================================
// Allocation Calculation Functions
// ============================================================================

/**
 * Calculates allocation items from assets with percentages and colors
 * Property 1: Allocation sum consistency - sum of percentages equals 100
 */
export function calculateAllocation(
  assets: Array<{ category: string; value: number }>,
  totalValue: number
): AllocationItem[] {
  if (totalValue <= 0 || assets.length === 0) {
    return []
  }

  const categoryMap = new Map<string, number>()
  
  for (const asset of assets) {
    const category = asset.category || 'AUTRES'
    const currentValue = categoryMap.get(category) || 0
    categoryMap.set(category, currentValue + asset.value)
  }

  const allocation: AllocationItem[] = []
  
  for (const [category, value] of categoryMap.entries()) {
    const percentage = (value / totalValue) * 100
    allocation.push({
      category,
      value,
      percentage,
      color: ALLOCATION_COLORS[category] || '#6B7280'
    })
  }

  // Sort by value descending
  allocation.sort((a, b) => b.value - a.value)

  return allocation
}

/**
 * Validates that allocation percentages sum to 100 (within tolerance)
 */
export function validateAllocationSum(allocation: AllocationItem[]): boolean {
  if (allocation.length === 0) return true
  
  const sum = allocation.reduce((acc, item) => acc + item.percentage, 0)
  return Math.abs(sum - 100) < 0.01 // Allow 0.01% tolerance for floating point
}

/**
 * Validates that allocation values sum to total
 */
export function validateAllocationValueSum(
  allocation: AllocationItem[], 
  expectedTotal: number
): boolean {
  if (allocation.length === 0) return expectedTotal === 0
  
  const sum = allocation.reduce((acc, item) => acc + item.value, 0)
  return Math.abs(sum - expectedTotal) < 0.01
}

// ============================================================================
// Alert Generation Functions
// ============================================================================

/**
 * Generates alerts based on client data
 * Property 15: Alert severity ordering - CRITICAL before WARNING before INFO
 */
export function generateAlerts(client: Record<string, unknown>): Alert[] {
  const alerts: Alert[] = []

  // KYC alerts
  if (client.kycStatus === 'EXPIRE') {
    alerts.push({
      id: `kyc-expired-${client.id}`,
      type: 'CRITIQUE',
      title: 'KYC expiré',
      message: 'Le KYC de ce client a expiré et doit être renouvelé',
      actionLink: `/dashboard/clients/${client.id}?tab=kyc`,
      actionLabel: 'Renouveler KYC'
    })
  } else if (client.kycStatus === 'EN_ATTENTE' || client.kycStatus === 'EN_COURS') {
    alerts.push({
      id: `kyc-pending-${client.id}`,
      type: 'WARNING',
      title: 'KYC incomplet',
      message: 'Le KYC de ce client n\'est pas encore complété',
      actionLink: `/dashboard/clients/${client.id}?tab=kyc`,
      actionLabel: 'Compléter KYC'
    })
  }

  // Document expiration alerts
  const expiringDocs = (client.documents as Record<string, unknown>[] | undefined)?.filter((doc) => {
    const expiresAt = toDate((doc as { expiresAt?: unknown }).expiresAt)
    if (!expiresAt) return false
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }) || []

  if (expiringDocs.length > 0) {
    alerts.push({
      id: `docs-expiring-${client.id}`,
      type: 'WARNING',
      title: `${expiringDocs.length} document(s) expirant bientôt`,
      message: 'Des documents vont expirer dans les 30 prochains jours',
      actionLink: `/dashboard/clients/${client.id}?tab=documents`,
      actionLabel: 'Voir documents'
    })
  }

  // Contract renewal alerts
  const renewingContracts = (client.contrats as Record<string, unknown>[] | undefined)?.filter((contract) => {
    const nextRenewal = toDate((contract as { nextRenewalDate?: unknown }).nextRenewalDate)
    if (!nextRenewal) return false
    const daysUntilRenewal = Math.ceil(
      (nextRenewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilRenewal <= 60 && daysUntilRenewal > 0
  }) || []

  if (renewingContracts.length > 0) {
    alerts.push({
      id: `contracts-renewing-${client.id}`,
      type: 'INFO',
      title: `${renewingContracts.length} contrat(s) à renouveler`,
      message: 'Des contrats arrivent à échéance dans les 60 prochains jours',
      actionLink: `/dashboard/clients/${client.id}?tab=contracts`,
      actionLabel: 'Voir contrats'
    })
  }

  // Sort alerts by severity: CRITICAL > WARNING > INFO
  return sortAlertsBySeverity(alerts)
}

/**
 * Sorts alerts by severity: CRITICAL first, then WARNING, then INFO
 */
export function sortAlertsBySeverity(alerts: Alert[]): Alert[] {
  const severityOrder: Record<AlertSeverity, number> = {
    CRITIQUE: 0,
    WARNING: 1,
    INFO: 2
  }

  return [...alerts].sort((a, b) => {
    return severityOrder[a.type] - severityOrder[b.type]
  })
}

/**
 * Validates that alerts are properly sorted by severity
 */
export function validateAlertSeverityOrder(alerts: Alert[]): boolean {
  const severityOrder: Record<AlertSeverity, number> = {
    CRITIQUE: 0,
    WARNING: 1,
    INFO: 2
  }

  for (let i = 1; i < alerts.length; i++) {
    if (severityOrder[alerts[i].type] < severityOrder[alerts[i - 1].type]) {
      return false
    }
  }
  return true
}

// ============================================================================
// Evolution Data Functions
// ============================================================================

/**
 * Génère les points d'évolution du patrimoine
 * NOTE: Données simulées basées sur la valeur actuelle en attendant 
 * l'implémentation de l'historisation (table PatrimoineSnapshot)
 * Utilise une croissance estimée de 0.5%/mois avec variance ±5%
 */
export function generatePatrimonyEvolution(
  currentTotal: number,
  months: number = 12
): EvolutionPoint[] {
  const evolution: EvolutionPoint[] = []
  const now = new Date()
  
  // Generate monthly data points going back
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    // Simulate slight growth (this would be real historical data in production)
    const variance = 1 + (Math.random() * 0.1 - 0.05) // ±5% variance
    const monthlyGrowth = Math.pow(1.005, months - i) // ~0.5% monthly growth
    const value = currentTotal / monthlyGrowth * variance
    
    evolution.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value)
    })
  }

  // Add current month with exact value
  evolution.push({
    date: now.toISOString().split('T')[0],
    value: currentTotal
  })

  return evolution
}

/**
 * Generates budget evolution data (revenue vs expenses)
 */
export function generateBudgetEvolution(
  monthlyRevenue: number,
  monthlyExpense: number,
  months: number = 12
): BudgetEvolutionPoint[] {
  const evolution: BudgetEvolutionPoint[] = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    // Add some variance to make it realistic
    const revenueVariance = 1 + (Math.random() * 0.2 - 0.1)
    const expenseVariance = 1 + (Math.random() * 0.15 - 0.075)
    
    evolution.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(monthlyRevenue * revenueVariance),
      expense: Math.round(monthlyExpense * expenseVariance)
    })
  }

  return evolution
}

// ============================================================================
// Risk Level Calculation
// ============================================================================

/**
 * Determines risk level based on client profile
 */
export function calculateRiskLevel(client: Record<string, unknown>): RiskLevel {
  const riskProfile = toStringValue(client.riskProfile, '').toUpperCase()
  
  if (!riskProfile) return 'MOYENNE'
  
  const riskMapping: Record<string, RiskLevel> = {
    CONSERVATIVE: 'BASSE',
    PRUDENT: 'BASSE',
    BALANCED: 'MOYENNE',
    MODERATE: 'MOYENNE',
    DYNAMIC: 'HAUTE',
    AGGRESSIVE: 'HAUTE'
  }
  
  return riskMapping[riskProfile as keyof typeof riskMapping] || 'MOYENNE'
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculates complete overview data for a client
 */
export async function calculateOverviewData(
  client: Record<string, unknown>,
  _prisma: PrismaClient,
  _cabinetId: string
): Promise<OverviewData> {
  // Calculate asset totals
  const actifs = Array.isArray(client.actifs) ? (client.actifs as unknown[]) : []
  const assets = actifs
    .map((ca): { category: string; value: number } | null => {
      if (!isRecord(ca)) return null
      const actif = isRecord(ca.actif) ? ca.actif : null
      const category = actif ? toStringValue(actif.category, 'AUTRES') : 'AUTRES'
      const baseValue = actif ? toFiniteNumber(actif.value) : 0
      const ownershipPct = toFiniteNumber(ca.ownershipPercentage)
      const pct = ownershipPct > 0 ? ownershipPct : 100
      return {
        category,
        value: baseValue * (pct / 100),
      }
    })
    .filter((a): a is { category: string; value: number } => a !== null)

  const totalAssets = assets.reduce((sum: number, a) => sum + (a.value as number), 0)

  // Calculate liability totals
  const passifs = Array.isArray(client.passifs) ? (client.passifs as unknown[]) : []
  const liabilities = passifs
    .map((p): { value: number } | null => {
      if (!isRecord(p)) return null
      return { value: toFiniteNumber(p.remainingAmount) }
    })
    .filter((l): l is { value: number } => l !== null)

  const totalLiabilities = liabilities.reduce((sum: number, l) => sum + (l.value as number), 0)

  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities

  // Calculate allocation
  const allocation = calculateAllocation(assets, totalAssets)

  // Generate evolution data
  const evolution = generatePatrimonyEvolution(totalAssets)

  // Calculate budget metrics (simplified - would use actual budget data)
  const annualIncome = toFiniteNumber(client.annualIncome)
  const monthlyIncome = annualIncome > 0 ? annualIncome / 12 : 0
  const estimatedExpenses = monthlyIncome * 0.7 // Estimate 70% expenses
  const budgetEvolution = generateBudgetEvolution(monthlyIncome, estimatedExpenses)

  // Count active contracts
  const activeContractsCount = (client.contrats as Record<string, unknown>[] | undefined)?.filter(
    (c) => c.status === 'ACTIF'
  ).length || 0

  // Get priority objectives
  const priorityObjectives = (client.objectifs as Record<string, unknown>[] | undefined)?.map((o) => o.name as string) || []

  // Calculate current taxation (simplified)
  const taxableIncome = annualIncome
  const currentTaxation = calculateSimplifiedTax(taxableIncome)

  // Generate alerts
  const alerts = generateAlerts(client)

  // Map recent activities
  const timelineEvents = Array.isArray(client.timelineEvents) ? (client.timelineEvents as unknown[]) : []
  const recentActivities: Activity[] = timelineEvents
    .slice(0, 5)
    .map((event) => {
      const e = isRecord(event) ? event : {}
      return {
        id: toStringValue(e.id, ''),
        type: mapEventTypeToActivityType(toStringValue(e.type, 'LOG')),
        title: toStringValue(e.title, ''),
        description: toStringValue(e.description, ''),
        timestamp: toIsoString(e.createdAt),
        performedBy: toStringValue(e.performedBy, 'Système'),
        linkedDocuments: [],
      }
    })

  return {
    patrimony: {
      totalGross: totalAssets,
      totalNet: netWorth,
      allocation,
      evolution
    },
    budgetEvolution,
    indicators: {
      currentTaxation,
      taxableIncome,
      activeContractsCount,
      riskLevel: calculateRiskLevel(client),
      priorityObjectives
    },
    alerts,
    recentActivities
  }
}

/**
 * Simplified French income tax calculation
 */
function calculateSimplifiedTax(income: number): number {
  if (income <= 0) return 0
  
  // 2024 French tax brackets (simplified)
  const brackets = [
    { max: 11294, rate: 0 },
    { max: 28797, rate: 0.11 },
    { max: 82341, rate: 0.30 },
    { max: 177106, rate: 0.41 },
    { max: Infinity, rate: 0.45 }
  ]

  let tax = 0
  let remainingIncome = income
  let previousMax = 0

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remainingIncome, bracket.max - previousMax)
    if (taxableInBracket <= 0) break
    
    tax += taxableInBracket * bracket.rate
    remainingIncome -= taxableInBracket
    previousMax = bracket.max
  }

  return Math.round(tax)
}

/**
 * Maps timeline event types to activity types
 */
function mapEventTypeToActivityType(eventType: string): 'CALL' | 'EMAIL' | 'MEETING' | 'ACTION' | 'LOG' {
  const mapping: Record<string, 'CALL' | 'EMAIL' | 'MEETING' | 'ACTION' | 'LOG'> = {
    CALL: 'CALL',
    EMAIL: 'EMAIL',
    MEETING: 'MEETING',
    APPOINTMENT: 'MEETING',
    NOTE: 'LOG',
    DOCUMENT: 'ACTION',
    CONTRACT: 'ACTION',
    TASK: 'ACTION'
  }
  
  return mapping[eventType] || 'LOG'
}
