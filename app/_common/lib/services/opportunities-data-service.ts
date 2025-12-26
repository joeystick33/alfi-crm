 
/**
 * Opportunities Data Service
 * 
 * Aggregates opportunities data with objective matching for the Client360 TabOpportunites.
 * Provides combined data retrieval and utility functions for opportunities management.
 * 
 * **Feature: client360-evolution**
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'
import type {
  Opportunity,
  ObjectiveMatch,
  OpportunityAnalysis,
  OpportunityCategory,
  OpportunityStatus,
  Complexity,
  Objective,
} from '@/app/_common/types/client360'

export interface OpportunitiesDataServiceResult {
  opportunities: Opportunity[]
  matchedObjectives: ObjectiveMatch[]
  stats: {
    totalOpportunities: number
    newOpportunities: number
    reviewedOpportunities: number
    acceptedOpportunities: number
    rejectedOpportunities: number
    totalPotentialImpact: number
    averageRelevanceScore: number
    byCategory: {
      fiscal: number
      investment: number
      reorganization: number
    }
  }
}

/**
 * Maps opportunity type from database to design spec category
 */
export function mapOpportunityCategory(type: string): OpportunityCategory {
  const categoryMap: Record<string, OpportunityCategory> = {
    // Fiscal opportunities
    'OPTIMISATION_FISCALE': 'FISCAL',
    'PER_OPPORTUNITY': 'FISCAL',
    'PREPARATION_RETRAITE': 'FISCAL',
    // Investment opportunities
    'DIVERSIFICATION_NEEDED': 'INVESTMENT',
    'INVESTISSEMENT_IMMOBILIER': 'INVESTMENT',
    'LIFE_INSURANCE_UNDERUSED': 'INVESTMENT',
    // Reorganization opportunities
    'PLANIFICATION_SUCCESSION': 'REORGANIZATION',
    'DEBT_CONSOLIDATION': 'REORGANIZATION',
    'TRANSMISSION': 'REORGANIZATION',
    // Default mappings for other types
    'ASSURANCE_VIE': 'INVESTMENT',
    'EPARGNE_RETRAITE': 'FISCAL',
    'INVESTISSEMENT_FINANCIER': 'INVESTMENT',
    'RESTRUCTURATION_CREDIT': 'REORGANIZATION',
    'AUDIT_ASSURANCES': 'REORGANIZATION',
    'AUTRE': 'INVESTMENT',
  }
  return Object.prototype.hasOwnProperty.call(categoryMap, type) ? categoryMap[type] : 'INVESTMENT'
}

/**
 * Maps opportunity status from database to design spec status
 */
export function mapOpportunityStatus(status: string): OpportunityStatus {
  const statusMap: Record<string, OpportunityStatus> = {
    'NEW': 'NEW',
    'DETECTEE': 'DETECTEE',
    'QUALIFIEE': 'DETECTEE',
    'CONTACTEE': 'DETECTEE',
    'PRESENTEE': 'DETECTEE',
    'ACCEPTEE': 'ACCEPTEE',
    'CONVERTIE': 'ACCEPTEE',
    'REJETEE': 'REJETEE',
    'PERDUE': 'REJETEE',
  }
  return Object.prototype.hasOwnProperty.call(statusMap, status) ? statusMap[status] : 'NEW'
}

/**
 * Determines complexity based on opportunity type and potential impact
 */
export function determineComplexity(type: string, potentialImpact: number): Complexity {
  // High complexity for succession and reorganization
  if (['PLANIFICATION_SUCCESSION', 'TRANSMISSION', 'DEBT_CONSOLIDATION'].includes(type)) {
    return 'HAUTE'
  }
  // Medium complexity for tax optimization and real estate
  if (['OPTIMISATION_FISCALE', 'INVESTISSEMENT_IMMOBILIER', 'PER_OPPORTUNITY'].includes(type)) {
    return 'MOYENNE'
  }
  // Low complexity for simple investments
  return 'BASSE'
}

/**
 * Generates analysis for an opportunity based on its type
 */
export function generateOpportunityAnalysis(
  type: string,
  description: string,
  recommendation: string
): OpportunityAnalysis {
  const analysisTemplates: Record<string, Partial<OpportunityAnalysis>> = {
    'OPTIMISATION_FISCALE': {
      pros: ['Réduction immédiate de l\'impôt', 'Optimisation du patrimoine', 'Avantages fiscaux durables'],
      cons: ['Engagement sur plusieurs années', 'Complexité administrative'],
      requirements: ['Revenus imposables suffisants', 'Capacité d\'épargne'],
      timeline: '1-3 mois pour mise en place',
    },
    'PER_OPPORTUNITY': {
      pros: ['Déduction fiscale immédiate', 'Préparation retraite', 'Sortie en capital possible'],
      cons: ['Blocage jusqu\'à la retraite', 'Fiscalité à la sortie'],
      requirements: ['Revenus imposables', 'Horizon long terme'],
      timeline: '2-4 semaines pour ouverture',
    },
    'DIVERSIFICATION_NEEDED': {
      pros: ['Réduction du risque', 'Meilleur rendement ajusté', 'Protection du patrimoine'],
      cons: ['Frais de restructuration', 'Temps de mise en place'],
      requirements: ['Patrimoine existant', 'Acceptation du changement'],
      timeline: '2-6 mois pour diversification complète',
    },
    'PLANIFICATION_SUCCESSION': {
      pros: ['Transmission optimisée', 'Réduction des droits', 'Protection des héritiers'],
      cons: ['Complexité juridique', 'Coûts notariaux'],
      requirements: ['Patrimoine significatif', 'Héritiers identifiés'],
      timeline: '3-12 mois selon complexité',
    },
    'INVESTISSEMENT_IMMOBILIER': {
      pros: ['Revenus locatifs', 'Plus-value potentielle', 'Effet de levier'],
      cons: ['Gestion locative', 'Risque de vacance'],
      requirements: ['Apport initial', 'Capacité d\'emprunt'],
      timeline: '3-6 mois pour acquisition',
    },
    'LIFE_INSURANCE_UNDERUSED': {
      pros: ['Fiscalité avantageuse', 'Transmission facilitée', 'Liquidité'],
      cons: ['Frais de gestion', 'Rendement variable'],
      requirements: ['Capacité d\'épargne', 'Horizon moyen terme'],
      timeline: '1-2 semaines pour ouverture',
    },
    'DEBT_CONSOLIDATION': {
      pros: ['Mensualités réduites', 'Gestion simplifiée', 'Taux optimisé'],
      cons: ['Durée allongée possible', 'Frais de dossier'],
      requirements: ['Dettes existantes', 'Capacité de remboursement'],
      timeline: '1-3 mois pour restructuration',
    },
    'PREPARATION_RETRAITE': {
      pros: ['Revenus complémentaires', 'Sécurité financière', 'Avantages fiscaux'],
      cons: ['Blocage des fonds', 'Rendement incertain'],
      requirements: ['Horizon retraite défini', 'Capacité d\'épargne'],
      timeline: '1-2 mois pour mise en place',
    },
  }

  const template = analysisTemplates[type] || {
    pros: ['Opportunité identifiée', 'Potentiel d\'amélioration'],
    cons: ['À évaluer en détail'],
    requirements: ['Analyse approfondie nécessaire'],
    timeline: 'À définir',
  }

  return {
    pros: template.pros || [],
    cons: template.cons || [],
    requirements: template.requirements || [],
    timeline: template.timeline || 'À définir',
    complexity: determineComplexity(type, 0),
  }
}



/**
 * Matches opportunities with client objectives based on type compatibility
 */
export function matchOpportunitiesWithObjectives(
  opportunities: Opportunity[],
  objectives: Objective[]
): ObjectiveMatch[] {
  const matches: ObjectiveMatch[] = []

  // Define which opportunity categories match which objective types
  const categoryToObjectiveTypes: Record<OpportunityCategory, string[]> = {
    'FISCAL': ['RETRAITE', 'AUTRE'],
    'INVESTMENT': ['REAL_ESTATE', 'ETUDES', 'AUTRE'],
    'REORGANIZATION': ['TRANSMISSION', 'RETRAITE', 'AUTRE'],
  }

  for (const objective of objectives) {
    const matchingOpportunities: string[] = []
    let totalScore = 0

    for (const opportunity of opportunities) {
      const compatibleTypes = categoryToObjectiveTypes[opportunity.category] || []
      
      if (compatibleTypes.includes(objective.type)) {
        matchingOpportunities.push(opportunity.id)
        totalScore += opportunity.relevanceScore
      }
    }

    if (matchingOpportunities.length > 0) {
      matches.push({
        objectiveId: objective.id,
        objectiveTitle: objective.title,
        opportunityIds: matchingOpportunities,
        matchScore: Math.round(totalScore / matchingOpportunities.length),
      })
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Validates that all matched objective IDs exist in the objectives list
 * 
 * Property 14: Opportunity objective matching
 * **Validates: Requirements 12.3**
 */
export function validateOpportunityObjectiveMatching(
  opportunities: Opportunity[],
  objectives: Objective[]
): boolean {
  const objectiveIds = new Set(objectives.map(o => o.id))

  for (const opportunity of opportunities) {
    for (const matchedId of opportunity.matchedObjectives) {
      if (!objectiveIds.has(matchedId)) {
        return false
      }
    }
  }

  return true
}

/**
 * Opportunities Data Service
 * 
 * Provides aggregated data for the opportunities tab including:
 * - Opportunities with analysis
 * - Objective matching
 * - Statistics and KPIs
 */
export class OpportunitiesDataService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Converts Decimal or numeric values to JavaScript number
   */
  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0
    }
    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }
    return Number(value) || 0
  }

  /**
   * Formats an opportunity from database to API response format
   */
  private formatOpportunity(opp: any, objectives: Objective[]): Opportunity {
    const category = mapOpportunityCategory(opp.type)
    const status = mapOpportunityStatus(opp.status)
    const potentialImpact = this.toNumber(opp.potentialGain || opp.estimatedValue || 0)
    
    // Parse matched objectives from JSON if stored
    let matchedObjectiveIds: string[] = []
    if (opp.matchedObjectives) {
      try {
        const parsed = typeof opp.matchedObjectives === 'string'
          ? JSON.parse(opp.matchedObjectives)
          : opp.matchedObjectives
        if (Array.isArray(parsed)) {
          matchedObjectiveIds = parsed
        }
      } catch {
        matchedObjectiveIds = []
      }
    }

    // If no matched objectives stored, compute them based on category
    if (matchedObjectiveIds.length === 0) {
      const categoryToObjectiveTypes: Record<OpportunityCategory, string[]> = {
        'FISCAL': ['RETRAITE', 'AUTRE'],
        'INVESTMENT': ['REAL_ESTATE', 'ETUDES', 'AUTRE'],
        'REORGANIZATION': ['TRANSMISSION', 'RETRAITE', 'AUTRE'],
      }
      const compatibleTypes = categoryToObjectiveTypes[category] || []
      matchedObjectiveIds = objectives
        .filter(obj => compatibleTypes.includes(obj.type))
        .map(obj => obj.id)
    }

    // Generate analysis
    const analysis = generateOpportunityAnalysis(
      opp.type,
      opp.description || '',
      opp.recommendation || ''
    )

    return {
      id: opp.id,
      category,
      title: opp.title || opp.name || 'Opportunité',
      description: opp.description || '',
      potentialImpact,
      relevanceScore: opp.score || 50,
      matchedObjectives: matchedObjectiveIds,
      analysis,
      status,
    }
  }

  /**
   * Maps objective type from database to design spec type
   */
  private mapObjectiveType(type: string): Objective['type'] {
    const typeMap: Record<string, Objective['type']> = {
      'RETRAITE': 'RETRAITE',
      'ACHAT_IMMOBILIER': 'REAL_ESTATE',
      'ETUDES': 'ETUDES',
      'TRANSMISSION': 'TRANSMISSION',
      'OPTIMISATION_FISCALE': 'AUTRE',
      'REVENUS_COMPLEMENTAIRES': 'AUTRE',
      'PROTECTION_CAPITAL': 'AUTRE',
      'TRAVEL': 'AUTRE',
      'AUTRE': 'AUTRE',
    }
    return typeMap[type] || 'AUTRE'
  }

  /**
   * Formats an objective from database to API response format
   */
  private formatObjective(obj: any): Objective {
    return {
      id: obj.id,
      type: this.mapObjectiveType(obj.type),
      title: obj.name || obj.title || '',
      description: obj.description || '',
      targetAmount: this.toNumber(obj.targetAmount),
      targetDate: obj.targetDate?.toISOString?.() || obj.targetDate,
      priority: obj.priority || 'MOYENNE',
      status: obj.status === 'ATTEINT' || obj.status === 'TERMINE' ? 'ATTEINT' :
              obj.status === 'ABANDONED' || obj.status === 'ANNULE' ? 'ABANDONED' : 'ACTIF',
    }
  }

  /**
   * Retrieves all opportunities data for a client with objective matching
   */
  async getOpportunitiesData(clientId: string): Promise<OpportunitiesDataServiceResult> {
    // Fetch opportunities
    const opportunitesRaw = await this.prisma.opportunite.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Fetch objectives for matching
    const objectifsRaw = await this.prisma.objectif.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        status: { not: 'ANNULE' },
      },
    })

    // Format objectives first
    const objectives = objectifsRaw.map(o => this.formatObjective(o))

    // Format opportunities with objective matching
    const opportunities = opportunitesRaw.map(o => this.formatOpportunity(o, objectives))

    // Compute objective matches
    const matchedObjectives = matchOpportunitiesWithObjectives(opportunities, objectives)

    // Calculate statistics
    const newOpportunities = opportunities.filter(o => o.status === 'NEW')
    const reviewedOpportunities = opportunities.filter(o => o.status === 'DETECTEE')
    const acceptedOpportunities = opportunities.filter(o => o.status === 'ACCEPTEE')
    const rejectedOpportunities = opportunities.filter(o => o.status === 'REJETEE')

    const totalPotentialImpact = opportunities.reduce((sum, o) => sum + o.potentialImpact, 0)
    const averageRelevanceScore = opportunities.length > 0
      ? Math.round(opportunities.reduce((sum, o) => sum + o.relevanceScore, 0) / opportunities.length)
      : 0

    const byCategory = {
      fiscal: opportunities.filter(o => o.category === 'FISCAL').length,
      investment: opportunities.filter(o => o.category === 'INVESTMENT').length,
      reorganization: opportunities.filter(o => o.category === 'REORGANIZATION').length,
    }

    return {
      opportunities,
      matchedObjectives,
      stats: {
        totalOpportunities: opportunities.length,
        newOpportunities: newOpportunities.length,
        reviewedOpportunities: reviewedOpportunities.length,
        acceptedOpportunities: acceptedOpportunities.length,
        rejectedOpportunities: rejectedOpportunities.length,
        totalPotentialImpact,
        averageRelevanceScore,
        byCategory,
      },
    }
  }
}
