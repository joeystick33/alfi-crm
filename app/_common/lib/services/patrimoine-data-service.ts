/**
 * Patrimoine Data Service
 * Aggregates patrimoine data for Client 360 TabPatrimoine
 * 
 * Requirements: 3.1, 4.1
 */

import { getPrismaClient } from '../prisma'
import type {
  PatrimoineData,
  PatrimoineSummary,
  PatrimoineAllocations,
  Asset,
  Liability,
  AllocationItem,
  PerformancePoint,
  AssetCategory,
  LiabilityCategory
} from '../../types/client360'

// Valid asset categories
export const VALID_ASSET_CATEGORIES: AssetCategory[] = ['IMMOBILIER', 'FINANCIER', 'EPARGNE_SALARIALE', 'EPARGNE_RETRAITE', 'PROFESSIONNEL', 'MOBILIER', 'AUTRES']

// Valid liability categories
export const VALID_LIABILITY_CATEGORIES: LiabilityCategory[] = ['CREDIT_IMMO', 'CREDIT_CONSO', 'DETTE_PRO']

// Category colors for charts
const CATEGORY_COLORS: Record<string, string> = {
  IMMOBILIER: '#3B82F6',
  FINANCIER: '#10B981',
  EPARGNE_SALARIALE: '#6366F1',
  EPARGNE_RETRAITE: '#F97316',
  PROFESSIONNEL: '#F59E0B',
  MOBILIER: '#FBBF24',
  AUTRES: '#8B5CF6',
  AUTRE: '#8B5CF6',
  // Liability colors
  CREDIT_IMMO: '#EF4444',
  CREDIT_CONSO: '#F97316',
  DETTE_PRO: '#DC2626',
  // Real estate sub-categories
  RESIDENCE_PRINCIPALE: '#2563EB',
  LOCATIF: '#3B82F6',
  COMMERCIAL: '#60A5FA',
  SCPI: '#93C5FD',
  // Financial sub-categories
  PEA: '#059669',
  CTO: '#10B981',
  ASSURANCE_VIE: '#34D399',
  FONDS_EUROS: '#6EE7B7',
  UC: '#A7F3D0',
  // Épargne salariale sub-categories
  PEE: '#4F46E5',
  PERCO: '#6366F1',
  PARTICIPATION: '#818CF8',
  INTERESSEMENT: '#A5B4FC',
  // Épargne retraite sub-categories
  PER: '#EA580C',
  PERP: '#F97316',
  MADELIN: '#FB923C',
}

/**
 * Converts Prisma Decimal to number
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  return Number(value) || 0
}

/**
 * Maps Prisma asset category to Client360 category
 */
function mapAssetCategory(category: string): AssetCategory {
  const mapping: Record<string, AssetCategory> = {
    IMMOBILIER: 'IMMOBILIER',
    FINANCIER: 'FINANCIER',
    EPARGNE_SALARIALE: 'EPARGNE_SALARIALE',
    EPARGNE_RETRAITE: 'EPARGNE_RETRAITE',
    PROFESSIONNEL: 'PROFESSIONNEL',
    MOBILIER: 'MOBILIER',
    AUTRE: 'AUTRES',
    AUTRES: 'AUTRES'
  }
  return mapping[category] || 'AUTRES'
}

/**
 * Maps Prisma liability type to Client360 category
 */
function mapLiabilityCategory(type: string): LiabilityCategory {
  const mapping: Record<string, LiabilityCategory> = {
    MORTGAGE: 'CREDIT_IMMO',
    CREDIT_IMMO: 'CREDIT_IMMO',
    CONSUMER_LOAN: 'CREDIT_CONSO',
    CREDIT_CONSO: 'CREDIT_CONSO',
    PROFESSIONAL_DEBT: 'DETTE_PRO',
    DETTE_PRO: 'DETTE_PRO',
    OTHER: 'CREDIT_CONSO'
  }
  return mapping[type] || 'CREDIT_CONSO'
}

/**
 * Calculates allocation items from values
 */
export function calculateAllocations(
  items: Array<{ category: string; value: number }>,
  colorMap: Record<string, string> = CATEGORY_COLORS
): AllocationItem[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) return []
  
  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category
    acc[cat] = (acc[cat] || 0) + item.value
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(grouped)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      category,
      value,
      percentage: (value / total) * 100,
      color: colorMap[category] || '#6B7280'
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Calculates net worth from assets and liabilities
 */
export function calculateNetWorth(totalAssets: number, totalLiabilities: number): number {
  return totalAssets - totalLiabilities
}

/**
 * Calculates debt ratio
 */
export function calculateDebtRatio(totalAssets: number, totalLiabilities: number): number {
  if (totalAssets <= 0) return 0
  return (totalLiabilities / totalAssets) * 100
}

/**
 * Validates that isManaged field is present and boolean
 */
export function validateManagedStatus(entity: { isManaged?: unknown }): boolean {
  return typeof entity.isManaged === 'boolean'
}

/**
 * Validates entity category
 */
export function isValidAssetCategory(category: string): boolean {
  return VALID_ASSET_CATEGORIES.includes(category as AssetCategory)
}

export function isValidLiabilityCategory(category: string): boolean {
  return VALID_LIABILITY_CATEGORIES.includes(category as LiabilityCategory)
}

/**
 * Transforms Prisma asset to Client360 Asset type
 */
 
function transformAsset(clientActif: any): Asset {
  const actif = clientActif.actif
  const ownershipPercentage = toNumber(clientActif.ownershipPercentage) / 100
  const value = toNumber(actif.value) * ownershipPercentage
  const acquisitionValue = toNumber(actif.acquisitionValue) * ownershipPercentage
  
  return {
    id: actif.id,
    name: actif.name,
    category: mapAssetCategory(actif.category),
    subCategory: actif.type || 'AUTRE',
    value,
    acquisitionDate: actif.acquisitionDate?.toISOString() || '',
    acquisitionValue,
    isManaged: actif.managedByFirm ?? false,
    details: actif.details || {}
  }
}

/**
 * Transforms Prisma passif to Client360 Liability type
 */
 
function transformLiability(passif: any): Liability {
  return {
    id: passif.id,
    name: passif.name,
    category: mapLiabilityCategory(passif.type),
    remainingAmount: toNumber(passif.remainingAmount),
    interestRate: toNumber(passif.interestRate),
    monthlyPayment: toNumber(passif.monthlyPayment),
    endDate: passif.endDate?.toISOString() || '',
    isManaged: passif.managedByFirm ?? false
  }
}

/**
 * Génère des données de performance simulées en attendant l'historisation réelle
 * NOTE: À remplacer par des données réelles via PatrimoineHistory quand disponible
 * Les données actuelles sont des estimations basées sur des rendements moyens de marché
 */
function generatePerformanceData(months: number = 12): PerformancePoint[] {
  const data: PerformancePoint[] = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    
    // Generate realistic-looking returns
    const baseReturn = 5 + Math.random() * 3 // 5-8% base
    const volatility = (Math.random() - 0.5) * 4 // +/- 2%
    
    data.push({
      date: date.toISOString().slice(0, 7), // YYYY-MM format
      return: Math.round((baseReturn + volatility) * 100) / 100,
      benchmark: Math.round((baseReturn - 0.5 + (Math.random() - 0.5) * 2) * 100) / 100
    })
  }
  
  return data
}

/**
 * Calculates patrimoine data for a client
 */
export async function calculatePatrimoineData(
  clientId: string,
   
  prisma: any,
  cabinetId: string
): Promise<PatrimoineData> {
  // Fetch client with assets and liabilities
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    include: {
      actifs: {
        where: { actif: { isActive: true } },
        include: { actif: true }
      },
      passifs: {
        where: { isActive: true }
      }
    }
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Transform assets
  const assets: Asset[] = (client.actifs || []).map(transformAsset)
  
  // Transform liabilities
  const liabilities: Liability[] = (client.passifs || []).map(transformLiability)

  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0)
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities)
  const debtRatio = calculateDebtRatio(totalAssets, totalLiabilities)

  // Calculate summary
  const summary: PatrimoineSummary = {
    totalAssets,
    totalLiabilities,
    netWorth,
    debtRatio
  }

  // Calculate allocations by category
  const byCategory = calculateAllocations(
    assets.map(a => ({ category: a.category, value: a.value }))
  )

  // Calculate real estate detail allocation
  const realEstateAssets = assets.filter(a => a.category === 'IMMOBILIER')
  const realEstateDetail = calculateAllocations(
    realEstateAssets.map(a => ({ category: a.subCategory, value: a.value }))
  )

  // Calculate financial detail allocation
  const financialAssets = assets.filter(a => a.category === 'FINANCIER')
  const financialDetail = calculateAllocations(
    financialAssets.map(a => ({ category: a.subCategory, value: a.value }))
  )

  const allocations: PatrimoineAllocations = {
    byCategory,
    realEstateDetail,
    financialDetail
  }

  // Générer données de performance (simulées en attendant historisation)
  const performance = generatePerformanceData(12)

  return {
    summary,
    assets,
    liabilities,
    allocations,
    performance
  }
}

export class PatrimoineDataService {
  private prisma: any

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Get complete patrimoine data for a client
   */
  async getPatrimoineData(clientId: string): Promise<PatrimoineData> {
    return calculatePatrimoineData(clientId, this.prisma, this.cabinetId)
  }

  /**
   * Get assets for a client
   */
  async getAssets(clientId: string): Promise<Asset[]> {
    const data = await this.getPatrimoineData(clientId)
    return data.assets
  }

  /**
   * Get liabilities for a client
   */
  async getLiabilities(clientId: string): Promise<Liability[]> {
    const data = await this.getPatrimoineData(clientId)
    return data.liabilities
  }

  /**
   * Get summary metrics
   */
  async getSummary(clientId: string): Promise<PatrimoineSummary> {
    const data = await this.getPatrimoineData(clientId)
    return data.summary
  }
}
