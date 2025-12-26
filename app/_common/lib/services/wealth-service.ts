/**
 * Wealth Service - Services métier pour le patrimoine enrichi
 * Gestion des liens actifs/passifs, calculs IFI, management tracking
 */


// ============================================================================
// Types
// ============================================================================

export interface AssetForLink {
  id: string
  name: string
  type: string
  value: number
  linkedPassifId?: string | null
}

export interface LiabilityForLink {
  id: string
  name: string
  type: string
  remainingAmount: number
  linkedActifId?: string | null
  insuranceRate?: number | null
}

export interface AssetLiabilityLink {
  actifId: string
  passifId: string
  actifName: string
  passifName: string
  actifValue: number
  passifAmount: number
  netValue: number
  leverageRatio: number
  insuranceRate?: number
}

export interface ManagementTracking {
  isManaged: boolean
  managedByFirm: boolean
  managementAdvisor?: string
  managementSince?: Date
}

export interface FiscalDataIFI {
  fiscalPropertyType?: 'RESIDENCE_PRINCIPALE' | 'RESIDENCE_SECONDAIRE' | 'LOCATIF' | 'NON_IMMOBILIER'
  fiscalRpAbatement: boolean // Abattement 30% résidence principale
  fiscalManualDiscount?: number // Décote manuelle (indivision, usufruit, etc.)
  fiscalIfiValue?: number // Valeur IFI calculée après abattements
}

export interface WealthMetrics {
  // Patrimoine global
  patrimoineTotal: number
  patrimoineNet: number
  patrimoineGere: number
  
  // Actifs par catégorie
  actifsBruts: number
  actifsImmobiliers: number
  actifsFinanciers: number
  actifsAutres: number
  
  // Passifs
  passifsTotal: number
  
  // Ratios
  ratioEndettement: number
  ratioLiquidite: number
  ratioPatrimoineGere: number
  
  // IFI
  baseIFI: number
  ifiEstime: number
  seuilIFI: number
  distanceSeuilIFI: number
  assujettiIFI: boolean
  
  // Liens
  nombreLiens: number
  actifsSansLien: number
  passifsSansLien: number
}

export interface WealthAlert {
  severity: 'CRITIQUE' | 'WARNING' | 'INFO'
  category: string
  message: string
  recommendation: string
}

// ============================================================================
// Constantes
// ============================================================================

const SEUIL_IFI_2024 = 1_300_000
const ABATTEMENT_RP_IFI = 0.30 // 30% abattement résidence principale

const ASSET_TYPES_IMMOBILIER = [
  'RESIDENCE_PRINCIPALE',
  'RESIDENCE_SECONDAIRE',
  'IMMOBILIER_LOCATIF',
  'SCPI',
  'OPCI',
  'IMMOBILIER_PROFESSIONNEL',
]

const ASSET_TYPES_FINANCIER = [
  'COMPTE_COURANT',
  'LIVRET_A',
  'LDDS',
  'LEP',
  'PEL',
  'CEL',
  'COMPTE_TITRES',
  'PEA',
  'PEA_PME',
  'ASSURANCE_VIE',
  'CONTRAT_CAPITALISATION',
  'PER',
  'PEE',
  'PERCO',
  'ARTICLE_83',
  'MADELIN',
]

const LIABILITY_TYPES_IMMOBILIER = [
  'CREDIT_IMMOBILIER',
  'PRET_RELAIS',
]

// ============================================================================
// Calculs IFI
// ============================================================================

/**
 * Calcule la valeur IFI d'un actif immobilier
 * Prend en compte l'abattement 30% résidence principale et les décotes manuelles
 */
export function calculateAssetIFIValue(
  value: number,
  fiscalData?: FiscalDataIFI
): number {
  if (!fiscalData) return value
  
  let ifiValue = value
  
  // Abattement 30% résidence principale
  if (fiscalData.fiscalPropertyType === 'RESIDENCE_PRINCIPALE' && fiscalData.fiscalRpAbatement) {
    ifiValue = ifiValue * (1 - ABATTEMENT_RP_IFI)
  }
  
  // Décote manuelle (indivision, usufruit, nue-propriété, etc.)
  if (fiscalData.fiscalManualDiscount && fiscalData.fiscalManualDiscount > 0) {
    ifiValue = ifiValue * (1 - fiscalData.fiscalManualDiscount / 100)
  }
  
  return Math.round(ifiValue)
}

/**
 * Calcule l'assiette IFI totale et l'impôt estimé
 */
export function calculateIFIFromAssets(
  assets: Array<{
    type: string
    value: number
    fiscalData?: FiscalDataIFI
  }>,
  liabilities: Array<{
    type: string
    remainingAmount: number
    linkedActifId?: string | null
  }>
): {
  baseIFI: number
  dettesDeductibles: number
  netTaxable: number
  ifiEstime: number
  assujetti: boolean
  distanceSeuil: number
} {
  // Calcul de la base IFI (actifs immobiliers uniquement)
  const baseIFI = assets
    .filter(a => ASSET_TYPES_IMMOBILIER.includes(a.type))
    .reduce((sum, a) => {
      const ifiValue = a.fiscalData?.fiscalIfiValue ?? calculateAssetIFIValue(a.value, a.fiscalData)
      return sum + ifiValue
    }, 0)
  
  // Dettes déductibles (crédits immobiliers uniquement)
  const dettesDeductibles = liabilities
    .filter(l => LIABILITY_TYPES_IMMOBILIER.includes(l.type))
    .reduce((sum, l) => sum + l.remainingAmount, 0)
  
  // Net taxable
  const netTaxable = Math.max(0, baseIFI - dettesDeductibles)
  
  // IFI estimé (barème 2024)
  const ifiEstime = calculateIFIAmount(netTaxable)
  
  // Assujetti si > seuil
  const assujetti = netTaxable > SEUIL_IFI_2024
  
  // Distance au seuil
  const distanceSeuil = SEUIL_IFI_2024 - netTaxable
  
  return {
    baseIFI,
    dettesDeductibles,
    netTaxable,
    ifiEstime,
    assujetti,
    distanceSeuil,
  }
}

/**
 * Calcule le montant IFI selon le barème 2024
 */
function calculateIFIAmount(netTaxable: number): number {
  if (netTaxable <= SEUIL_IFI_2024) return 0
  
  // Barème IFI 2024 (sur la fraction dépassant 800 000 €)
  const brackets = [
    { limit: 800_000, rate: 0 },
    { limit: 1_300_000, rate: 0.005 }, // 0.5% entre 800k et 1.3M
    { limit: 2_570_000, rate: 0.007 }, // 0.7% entre 1.3M et 2.57M
    { limit: 5_000_000, rate: 0.01 },  // 1% entre 2.57M et 5M
    { limit: 10_000_000, rate: 0.0125 }, // 1.25% entre 5M et 10M
    { limit: Infinity, rate: 0.015 }, // 1.5% au-delà de 10M
  ]
  
  let ifi = 0
  let previousLimit = 0
  
  for (const bracket of brackets) {
    if (netTaxable > previousLimit) {
      const taxableInBracket = Math.min(netTaxable, bracket.limit) - previousLimit
      ifi += taxableInBracket * bracket.rate
      previousLimit = bracket.limit
    } else {
      break
    }
  }
  
  // Décote entre 1.3M et 1.4M
  if (netTaxable > 1_300_000 && netTaxable <= 1_400_000) {
    const reduction = 17_500 - (1.25 / 100) * netTaxable
    ifi = Math.max(0, ifi - reduction)
  }
  
  return Math.round(ifi)
}

// ============================================================================
// Gestion des liens Actifs ↔ Passifs
// ============================================================================

/**
 * Construit les liens entre actifs et passifs
 */
export function buildAssetLiabilityLinks(
  assets: AssetForLink[],
  liabilities: LiabilityForLink[]
): AssetLiabilityLink[] {
  const links: AssetLiabilityLink[] = []
  
  for (const asset of assets) {
    if (asset.linkedPassifId) {
      const liability = liabilities.find(l => l.id === asset.linkedPassifId)
      if (liability) {
        const netValue = asset.value - liability.remainingAmount
        const leverageRatio = asset.value > 0 ? liability.remainingAmount / asset.value : 0
        
        links.push({
          actifId: asset.id,
          passifId: liability.id,
          actifName: asset.name,
          passifName: liability.name,
          actifValue: asset.value,
          passifAmount: liability.remainingAmount,
          netValue,
          leverageRatio,
          insuranceRate: liability.insuranceRate ?? undefined,
        })
      }
    }
  }
  
  // Vérifier aussi les liens depuis les passifs
  for (const liability of liabilities) {
    if (liability.linkedActifId) {
      const existingLink = links.find(l => l.passifId === liability.id)
      if (!existingLink) {
        const asset = assets.find(a => a.id === liability.linkedActifId)
        if (asset) {
          const netValue = asset.value - liability.remainingAmount
          const leverageRatio = asset.value > 0 ? liability.remainingAmount / asset.value : 0
          
          links.push({
            actifId: asset.id,
            passifId: liability.id,
            actifName: asset.name,
            passifName: liability.name,
            actifValue: asset.value,
            passifAmount: liability.remainingAmount,
            netValue,
            leverageRatio,
            insuranceRate: liability.insuranceRate ?? undefined,
          })
        }
      }
    }
  }
  
  return links
}

/**
 * Valide qu'un lien est cohérent (types compatibles)
 */
export function validateAssetLiabilityLink(
  assetType: string,
  liabilityType: string
): { valid: boolean; message?: string } {
  // Crédits immobiliers uniquement avec actifs immobiliers
  if (LIABILITY_TYPES_IMMOBILIER.includes(liabilityType)) {
    if (!ASSET_TYPES_IMMOBILIER.includes(assetType)) {
      return {
        valid: false,
        message: 'Un crédit immobilier ne peut être lié qu\'à un actif immobilier',
      }
    }
  }
  
  return { valid: true }
}

/**
 * Génère un préfill de passif depuis un actif
 */
export function prefillLiabilityFromAsset(
  asset: {
    name: string
    type: string
    value: number
    acquisitionDate?: Date
  },
  ltvRatio: number = 0.8 // 80% par défaut
): {
  name: string
  type: string
  initialAmount: number
  suggestedLinkedActifId: string
} {
  // Déterminer le type de passif approprié
  let liabilityType = 'CREDIT_CONSOMMATION'
  if (ASSET_TYPES_IMMOBILIER.includes(asset.type)) {
    liabilityType = 'CREDIT_IMMOBILIER'
  }
  
  // Nom suggéré
  const name = `Crédit - ${asset.name}`
  
  // Montant initial basé sur le LTV
  const initialAmount = Math.round(asset.value * ltvRatio)
  
  return {
    name,
    type: liabilityType,
    initialAmount,
    suggestedLinkedActifId: '',
  }
}

// ============================================================================
// Métriques patrimoine
// ============================================================================

/**
 * Calcule toutes les métriques patrimoine enrichies
 */
export function calculateWealthMetrics(
  assets: Array<{
    id: string
    type: string
    value: number
    managedByFirm?: boolean
    fiscalData?: FiscalDataIFI
    linkedPassifId?: string | null
  }>,
  liabilities: Array<{
    id: string
    type: string
    remainingAmount: number
    linkedActifId?: string | null
  }>
): WealthMetrics {
  // Actifs par catégorie
  const actifsBruts = assets.reduce((sum, a) => sum + a.value, 0)
  
  const actifsImmobiliers = assets
    .filter(a => ASSET_TYPES_IMMOBILIER.includes(a.type))
    .reduce((sum, a) => sum + a.value, 0)
  
  const actifsFinanciers = assets
    .filter(a => ASSET_TYPES_FINANCIER.includes(a.type))
    .reduce((sum, a) => sum + a.value, 0)
  
  const actifsAutres = actifsBruts - actifsImmobiliers - actifsFinanciers
  
  // Passifs
  const passifsTotal = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0)
  
  // Patrimoine
  const patrimoineTotal = actifsBruts
  const patrimoineNet = actifsBruts - passifsTotal
  const patrimoineGere = assets
    .filter(a => a.managedByFirm)
    .reduce((sum, a) => sum + a.value, 0)
  
  // Ratios
  const ratioEndettement = actifsBruts > 0 ? (passifsTotal / actifsBruts) * 100 : 0
  
  // Liquidité : actifs liquides / total
  const actifsLiquides = assets
    .filter(a => ['COMPTE_COURANT', 'LIVRET_A', 'LDDS', 'LEP'].includes(a.type))
    .reduce((sum, a) => sum + a.value, 0)
  const ratioLiquidite = actifsBruts > 0 ? (actifsLiquides / actifsBruts) * 100 : 0
  
  // Ratio patrimoine géré
  const ratioPatrimoineGere = actifsBruts > 0 ? (patrimoineGere / actifsBruts) * 100 : 0
  
  // IFI
  const ifiCalc = calculateIFIFromAssets(assets, liabilities)
  
  // Liens
  const links = buildAssetLiabilityLinks(
    assets.map(a => ({
      id: a.id,
      name: '',
      type: a.type,
      value: a.value,
      linkedPassifId: a.linkedPassifId,
    })),
    liabilities.map(l => ({
      id: l.id,
      name: '',
      type: l.type,
      remainingAmount: l.remainingAmount,
      linkedActifId: l.linkedActifId,
    }))
  )
  
  const actifsSansLien = assets.filter(a => 
    !a.linkedPassifId && !liabilities.some(l => l.linkedActifId === a.id)
  ).length
  
  const passifsSansLien = liabilities.filter(l =>
    !l.linkedActifId && !assets.some(a => a.linkedPassifId === l.id)
  ).length
  
  return {
    patrimoineTotal,
    patrimoineNet,
    patrimoineGere,
    actifsBruts,
    actifsImmobiliers,
    actifsFinanciers,
    actifsAutres,
    passifsTotal,
    ratioEndettement: Math.round(ratioEndettement * 10) / 10,
    ratioLiquidite: Math.round(ratioLiquidite * 10) / 10,
    ratioPatrimoineGere: Math.round(ratioPatrimoineGere * 10) / 10,
    baseIFI: ifiCalc.baseIFI,
    ifiEstime: ifiCalc.ifiEstime,
    seuilIFI: SEUIL_IFI_2024,
    distanceSeuilIFI: ifiCalc.distanceSeuil,
    assujettiIFI: ifiCalc.assujetti,
    nombreLiens: links.length,
    actifsSansLien,
    passifsSansLien,
  }
}

// ============================================================================
// Alertes patrimoine
// ============================================================================

/**
 * Détecte les alertes patrimoine
 */
export function detectWealthAlerts(
  metrics: WealthMetrics,
  assets: Array<{ type: string; value: number; managedByFirm?: boolean }>,
  liabilities: Array<{ type: string; remainingAmount: number }>
): WealthAlert[] {
  const alerts: WealthAlert[] = []
  
  // 1. Alerte IFI proche seuil
  if (!metrics.assujettiIFI && metrics.distanceSeuilIFI < 200_000 && metrics.distanceSeuilIFI > 0) {
    alerts.push({
      severity: 'WARNING',
      category: 'IFI',
      message: `Patrimoine proche du seuil IFI (${Math.round(metrics.distanceSeuilIFI / 1000)}k€ de marge)`,
      recommendation: 'Envisagez des stratégies de défiscalisation immobilière ou de restructuration patrimoniale',
    })
  }
  
  // 2. Alerte assujetti IFI
  if (metrics.assujettiIFI) {
    alerts.push({
      severity: 'INFO',
      category: 'IFI',
      message: `Client assujetti à l'IFI - estimation : ${metrics.ifiEstime.toLocaleString('fr-FR')} €`,
      recommendation: 'Vérifiez les abattements applicables et les stratégies d\'optimisation IFI',
    })
  }
  
  // 3. Ratio d'endettement élevé
  if (metrics.ratioEndettement > 50) {
    alerts.push({
      severity: metrics.ratioEndettement > 70 ? 'CRITIQUE' : 'WARNING',
      category: 'Endettement',
      message: `Ratio d'endettement élevé : ${metrics.ratioEndettement}%`,
      recommendation: 'Analysez la capacité de remboursement et envisagez une restructuration des dettes',
    })
  }
  
  // 4. Liquidité faible
  if (metrics.ratioLiquidite < 5) {
    alerts.push({
      severity: 'WARNING',
      category: 'Liquidité',
      message: `Liquidité très faible : ${metrics.ratioLiquidite}% du patrimoine`,
      recommendation: 'Constituez une épargne de précaution (3 à 6 mois de charges)',
    })
  }
  
  // 5. Patrimoine non géré important
  if (metrics.patrimoineTotal > 100_000 && metrics.ratioPatrimoineGere < 30) {
    alerts.push({
      severity: 'INFO',
      category: 'Gestion',
      message: `Seulement ${metrics.ratioPatrimoineGere}% du patrimoine est géré`,
      recommendation: 'Proposez vos services de gestion pour optimiser le patrimoine',
    })
  }
  
  // 6. Passifs non liés
  if (metrics.passifsSansLien > 0) {
    alerts.push({
      severity: 'INFO',
      category: 'Liens',
      message: `${metrics.passifsSansLien} crédit(s) sans actif associé`,
      recommendation: 'Liez les crédits à leurs actifs correspondants pour un suivi optimal',
    })
  }
  
  // 7. Concentration immobilière
  const ratioImmo = metrics.patrimoineTotal > 0 
    ? (metrics.actifsImmobiliers / metrics.patrimoineTotal) * 100 
    : 0
  if (ratioImmo > 80) {
    alerts.push({
      severity: 'WARNING',
      category: 'Diversification',
      message: `Forte concentration immobilière : ${Math.round(ratioImmo)}%`,
      recommendation: 'Diversifiez vers des actifs financiers pour réduire le risque',
    })
  }
  
  return alerts
}

// ============================================================================
// Export des constantes
// ============================================================================

export {
  SEUIL_IFI_2024,
  ABATTEMENT_RP_IFI,
  ASSET_TYPES_IMMOBILIER,
  ASSET_TYPES_FINANCIER,
  LIABILITY_TYPES_IMMOBILIER,
}
