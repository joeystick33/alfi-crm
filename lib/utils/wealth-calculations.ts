/**
 * Wealth Calculations Utilities
 * Advanced calculations for wealth management
 */

export interface Asset {
  id: string
  name: string
  type: string
  value: number
  purchaseValue?: number
  purchaseDate?: string
  isManaged?: boolean
  linkedLiabilityId?: string | null
}

export interface Liability {
  id: string
  name: string
  type: string
  remainingAmount: number
  linkedAssetId?: string | null
}

export interface LiquidityMetrics {
  liquidAssets: number
  totalAssets: number
  liquidityRatio: number
  liquidityStatus: 'good' | 'medium' | 'low'
}

export interface AssetWithLeverage extends Asset {
  hasLeverage: boolean
  leverageAmount: number
  netValue: number
  leverageRatio: number
}

/**
 * Calculate liquidity ratio
 * Liquid assets = cash, savings accounts, securities
 */
export function calculateLiquidityRatio(assets: Asset[]): LiquidityMetrics {
  const liquidTypes = ['BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'SECURITIES', 'PEA', 'LIFE_INSURANCE']
  
  const liquidAssets = assets
    .filter(asset => liquidTypes.includes(asset.type))
    .reduce((sum: any, asset: any) => sum + (asset.value || 0), 0)
  
  const totalAssets = assets.reduce((sum: any, asset: any) => sum + (asset.value || 0), 0)
  
  const liquidityRatio = totalAssets > 0 ? Math.round((liquidAssets / totalAssets) * 100) : 0
  
  let liquidityStatus: 'good' | 'medium' | 'low' = 'good'
  if (liquidityRatio < 20) liquidityStatus = 'low'
  else if (liquidityRatio < 40) liquidityStatus = 'medium'
  
  return {
    liquidAssets,
    totalAssets,
    liquidityRatio,
    liquidityStatus
  }
}

/**
 * Calculate leverage effect for assets
 * Identifies which assets are financed by debt
 */
export function calculateLeverageEffect(
  assets: Asset[],
  liabilities: Liability[]
): AssetWithLeverage[] {
  return assets.map(asset => {
    // Find linked liability
    const linkedLiability = liabilities.find(
      liability => liability.linkedAssetId === asset.id
    )
    
    const hasLeverage = !!linkedLiability
    const leverageAmount = linkedLiability?.remainingAmount || 0
    const netValue = (asset.value || 0) - leverageAmount
    const leverageRatio = asset.value > 0 
      ? Math.round((leverageAmount / asset.value) * 100) 
      : 0
    
    return {
      ...asset,
      hasLeverage,
      leverageAmount,
      netValue,
      leverageRatio
    }
  })
}

/**
 * Sort assets by different criteria
 */
export function sortAssets(
  assets: Asset[],
  sortBy: 'value' | 'type' | 'date' | 'netValue',
  liabilities: Liability[] = []
): Asset[] {
  const assetsWithLeverage = calculateLeverageEffect(assets, liabilities)
  
  const sorted = [...assetsWithLeverage].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'value':
        return (b.value || 0) - (a.value || 0)
      
      case 'type':
        return a.type.localeCompare(b.type)
      
      case 'date':
        if (!a.purchaseDate) return 1
        if (!b.purchaseDate) return -1
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      
      case 'netValue':
        return b.netValue - a.netValue
      
      default:
        return 0
    }
  })
  
  return sorted
}

/**
 * Calculate debt ratio status
 */
export function getDebtRatioStatus(debtRatio: number): {
  status: 'good' | 'medium' | 'high'
  label: string
  color: string
} {
  if (debtRatio <= 33) {
    return { status: 'good', label: 'Sain', color: 'text-green-600' }
  } else if (debtRatio <= 40) {
    return { status: 'medium', label: 'Moyen', color: 'text-orange-600' }
  } else {
    return { status: 'high', label: 'Élevé', color: 'text-red-600' }
  }
}

/**
 * Get asset type label with emoji
 */
export function getAssetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'REAL_ESTATE': '🏠 Immobilier',
    'LIFE_INSURANCE': '🛡️ Assurance-vie',
    'SECURITIES': '📈 Titres',
    'BANK_ACCOUNT': '💰 Compte bancaire',
    'SAVINGS_ACCOUNT': '💰 Livret',
    'PEA': '📊 PEA',
    'PER': '🎯 PER',
    'SCPI': '🏢 SCPI',
    'BUSINESS': '👔 Entreprise',
    'CRYPTO': '🪙 Crypto',
    'PRECIOUS_METALS': '🥇 Métaux précieux',
    'OTHER': '📌 Autre'
  }
  return labels[type] || type
}

/**
 * Get liability type label with emoji
 */
export function getLiabilityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'MORTGAGE': '🏡 Prêt immobilier',
    'CONSUMER_CREDIT': '💳 Crédit conso',
    'BUSINESS_LOAN': '🏢 Crédit pro',
    'STUDENT_LOAN': '🎓 Prêt étudiant',
    'OTHER': '📌 Autre'
  }
  return labels[type] || type
}
