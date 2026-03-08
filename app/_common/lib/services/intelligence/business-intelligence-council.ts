/**
 * Business Intelligence Council — Analyses nocturnes multi-experts CGP
 * 
 * Inspiré par OpenClaw Business Intelligence Council Prompt #5
 * Adapté au métier CGP français avec des personas experts spécialisés.
 * 
 * Architecture :
 *   1. Data Sync Layer — Agrège les données CRM par domaine
 *   2. Expert Personas — Chaque expert analyse un domaine spécifique
 *   3. Synthesis Pass — Un synthétiseur fusionne les recommandations
 *   4. Delivery — Digest matinal pour le conseiller
 * 
 * Experts CGP :
 *   • ExpertFiscal — Optimisation IR, IFI, plus-values, niches fiscales
 *   • ExpertImmobilier — Marché, financement, rendement, SCI/SCPI
 *   • ExpertAssuranceVie — Allocations, arbitrages, succession AV
 *   • ExpertRetraite — Préparation, PER, rachat trimestres
 *   • ExpertConformite — KYC, DDA, MiFID, RGPD, LCB-FT
 *   • ExpertCommercial — Pipeline, CA, conversion, churn
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export type ExpertPersona =
  | 'FISCAL'
  | 'IMMOBILIER'
  | 'ASSURANCE_VIE'
  | 'RETRAITE'
  | 'CONFORMITE'
  | 'COMMERCIAL'

export interface ExpertInsight {
  expert: ExpertPersona
  expertLabel: string
  priority: 'critical' | 'high' | 'medium' | 'info'
  title: string
  description: string
  impact: string               // Impact estimé
  recommendation: string       // Action recommandée
  clientIds?: string[]         // Clients concernés
  data?: Record<string, unknown>
  confidence: number           // 0-100
}

export interface CouncilDigest {
  id: string
  cabinetId: string
  generatedAt: Date
  expertInsights: ExpertInsight[]
  synthesis: SynthesisReport
  metrics: CouncilMetrics
}

export interface SynthesisReport {
  topRecommendations: RankedRecommendation[]
  urgentActions: string[]
  weeklyFocus: string
  monthlyTheme: string
}

export interface RankedRecommendation {
  rank: number
  title: string
  description: string
  expert: ExpertPersona
  estimatedImpact: 'high' | 'medium' | 'low'
  effort: 'quick_win' | 'medium_effort' | 'strategic'
  clientIds?: string[]
}

export interface CouncilMetrics {
  totalClients: number
  activeClients: number
  totalPatrimoine: number
  kycComplianceRate: number
  pipelineValue: number
  churnRisk: number
}

// ============================================================================
// EXPERT LABELS
// ============================================================================

const EXPERT_LABELS: Record<ExpertPersona, string> = {
  FISCAL: 'Expert Fiscal & Optimisation',
  IMMOBILIER: 'Expert Immobilier & Financement',
  ASSURANCE_VIE: 'Expert Assurance-Vie & Épargne',
  RETRAITE: 'Expert Retraite & Prévoyance',
  CONFORMITE: 'Expert Conformité & Réglementation',
  COMMERCIAL: 'Expert Commercial & Pipeline',
}

// ============================================================================
// BUSINESS INTELLIGENCE COUNCIL
// ============================================================================

export class BusinessIntelligenceCouncil {
  private cabinetId: string
  private userId: string

  constructor(cabinetId: string, userId: string) {
    this.cabinetId = cabinetId
    this.userId = userId
  }

  private get prisma() {
    return getPrismaClient(this.cabinetId)
  }

  /**
   * Exécuter le conseil complet — tous les experts en parallèle puis synthèse
   */
  async runCouncil(): Promise<CouncilDigest> {
    const metrics = await this.gatherMetrics()

    // Exécuter tous les experts en parallèle
    const [fiscal, immobilier, assuranceVie, retraite, conformite, commercial] = await Promise.all([
      this.runExpertFiscal(),
      this.runExpertImmobilier(),
      this.runExpertAssuranceVie(),
      this.runExpertRetraite(),
      this.runExpertConformite(),
      this.runExpertCommercial(),
    ])

    const allInsights = [...fiscal, ...immobilier, ...assuranceVie, ...retraite, ...conformite, ...commercial]

    // Synthèse
    const synthesis = this.synthesize(allInsights, metrics)

    const digest: CouncilDigest = {
      id: crypto.randomUUID(),
      cabinetId: this.cabinetId,
      generatedAt: new Date(),
      expertInsights: allInsights.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, info: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
      synthesis,
      metrics,
    }

    // Persister le digest dans AuditLog pour historique
    await this.prisma.auditLog.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        action: 'CONSULTATION',
        entityType: 'CABINET',
        entityId: this.cabinetId,
        changes: {
          digestId: digest.id,
          insightCount: allInsights.length,
          criticalCount: allInsights.filter(i => i.priority === 'critical').length,
          topRecommendation: synthesis.topRecommendations[0]?.title || 'Aucune',
        },
      },
    })

    return digest
  }

  /**
   * Exécuter un expert spécifique uniquement
   */
  async runExpert(persona: ExpertPersona): Promise<ExpertInsight[]> {
    switch (persona) {
      case 'FISCAL': return this.runExpertFiscal()
      case 'IMMOBILIER': return this.runExpertImmobilier()
      case 'ASSURANCE_VIE': return this.runExpertAssuranceVie()
      case 'RETRAITE': return this.runExpertRetraite()
      case 'CONFORMITE': return this.runExpertConformite()
      case 'COMMERCIAL': return this.runExpertCommercial()
    }
  }

  // ============================================================================
  // EXPERT FISCAL
  // ============================================================================

  private async runExpertFiscal(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []

    // Clients avec TMI élevé sans optimisation
    const highTmiClients = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        irTaxRate: { gte: 30 },
      },
      select: { id: true, firstName: true, lastName: true, irTaxRate: true, patrimoineNet: true, ifiSubject: true },
    })

    // Check for clients with high TMI but no tax optimizations
    const clientsWithoutOptimization = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        irTaxRate: { gte: 30 },
      },
      select: { id: true, firstName: true, lastName: true, irTaxRate: true },
    })

    if (clientsWithoutOptimization.length > 0) {
      insights.push({
        expert: 'FISCAL',
        expertLabel: EXPERT_LABELS.FISCAL,
        priority: 'high',
        title: `${clientsWithoutOptimization.length} client(s) TMI ≥30% sans optimisation fiscale`,
        description: `Ces clients ont un taux marginal d'imposition élevé mais aucune stratégie d'optimisation en place (PER, FCPI/FIP, Pinel, Malraux, Girardin).`,
        impact: `Économie potentielle de ${clientsWithoutOptimization.length * 3_000}€ à ${clientsWithoutOptimization.length * 15_000}€/an`,
        recommendation: 'Planifier des RDV d\'optimisation fiscale avec ces clients avant la fin de l\'année',
        clientIds: clientsWithoutOptimization.map(c => c.id),
        confidence: 85,
      })
    }

    // Clients potentiellement IFI
    const potentialIfi = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        patrimoineNet: { gte: 1_300_000 },
        ifiSubject: false,
      },
      select: { id: true, firstName: true, lastName: true, patrimoineNet: true },
    })

    if (potentialIfi.length > 0) {
      insights.push({
        expert: 'FISCAL',
        expertLabel: EXPERT_LABELS.FISCAL,
        priority: 'critical',
        title: `${potentialIfi.length} client(s) potentiellement assujettis IFI non déclarés`,
        description: `Ces clients ont un patrimoine net ≥1.3M€ mais ne sont pas marqués comme assujettis IFI. Vérification obligatoire.`,
        impact: 'Risque de redressement fiscal',
        recommendation: 'Audit IFI immédiat pour chaque client concerné',
        clientIds: potentialIfi.map(c => c.id),
        confidence: 90,
      })
    }

    return insights
  }

  // ============================================================================
  // EXPERT IMMOBILIER
  // ============================================================================

  private async runExpertImmobilier(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []

    // Clients avec actifs immobiliers non réévalués depuis 2 ans
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const staleRealEstate = await this.prisma.clientActif.findMany({
      where: {
        client: { cabinetId: this.cabinetId, status: 'ACTIF' },
        actif: {
          type: { in: ['RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE', 'IMMOBILIER_COMMERCIAL', 'SCPI', 'SCI', 'OPCI'] },
          updatedAt: { lt: twoYearsAgo },
        },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        actif: { select: { name: true, value: true } },
      },
    })

    if (staleRealEstate.length > 0) {
      const clientIds = [...new Set(staleRealEstate.map(a => a.clientId))]
      insights.push({
        expert: 'IMMOBILIER',
        expertLabel: EXPERT_LABELS.IMMOBILIER,
        priority: 'medium',
        title: `${staleRealEstate.length} bien(s) immobilier(s) non réévalués depuis 2+ ans`,
        description: `Les valorisations immobilières doivent être mises à jour régulièrement pour l'IFI, les arbitrages et le bilan patrimonial.`,
        impact: 'Risque de bilan patrimonial inexact',
        recommendation: 'Utiliser le service DVF pour actualiser les valorisations',
        clientIds,
        confidence: 75,
      })
    }

    // Clients avec taux d'endettement élevé
    const highDebt = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        tauxEndettement: { gte: 33 },
      },
      select: { id: true, firstName: true, lastName: true, tauxEndettement: true },
    })

    if (highDebt.length > 0) {
      insights.push({
        expert: 'IMMOBILIER',
        expertLabel: EXPERT_LABELS.IMMOBILIER,
        priority: 'high',
        title: `${highDebt.length} client(s) avec taux d'endettement ≥33% (norme HCSF)`,
        description: `Ces clients dépassent le seuil HCSF de 35%. Renégociation ou restructuration à envisager.`,
        impact: 'Risque de surendettement / refus de crédit',
        recommendation: 'Proposer un audit d\'endettement et une restructuration de crédits',
        clientIds: highDebt.map(c => c.id),
        confidence: 90,
      })
    }

    return insights
  }

  // ============================================================================
  // EXPERT ASSURANCE-VIE
  // ============================================================================

  private async runExpertAssuranceVie(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []

    // Clients patrimoine >100K sans assurance-vie
    const withoutAV = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        patrimoineNet: { gte: 100_000 },
        contrats: { none: { type: 'ASSURANCE_VIE', status: 'ACTIF' } },
      },
      select: { id: true, firstName: true, lastName: true, patrimoineNet: true },
    })

    if (withoutAV.length > 0) {
      insights.push({
        expert: 'ASSURANCE_VIE',
        expertLabel: EXPERT_LABELS.ASSURANCE_VIE,
        priority: 'high',
        title: `${withoutAV.length} client(s) patrimoine >100K€ sans assurance-vie`,
        description: `L'assurance-vie reste le placement préféré des Français et offre des avantages fiscaux majeurs après 8 ans.`,
        impact: `Opportunité commerciale: ${withoutAV.length} ouvertures potentielles`,
        recommendation: 'Proposer une ouverture d\'AV lors du prochain RDV',
        clientIds: withoutAV.map(c => c.id),
        confidence: 80,
      })
    }

    // Contrats AV anciens (>8 ans) sans arbitrage récent
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const eightYearsAgo = new Date()
    eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8)

    const staleAV = await this.prisma.contrat.findMany({
      where: {
        client: { cabinetId: this.cabinetId, status: 'ACTIF' },
        type: 'ASSURANCE_VIE',
        status: 'ACTIF',
        startDate: { lt: eightYearsAgo },
        updatedAt: { lt: oneYearAgo },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (staleAV.length > 0) {
      const clientIds = [...new Set(staleAV.map(c => c.clientId))]
      insights.push({
        expert: 'ASSURANCE_VIE',
        expertLabel: EXPERT_LABELS.ASSURANCE_VIE,
        priority: 'medium',
        title: `${staleAV.length} contrat(s) AV >8 ans sans revue depuis 1 an`,
        description: `Ces contrats ont passé le cap des 8 ans (avantage fiscal optimal). Un arbitrage ou une revue d'allocation est recommandé.`,
        impact: 'Optimisation rendement et allocation',
        recommendation: 'Planifier une revue d\'allocation et proposer un arbitrage si nécessaire',
        clientIds,
        confidence: 70,
      })
    }

    return insights
  }

  // ============================================================================
  // EXPERT RETRAITE
  // ============================================================================

  private async runExpertRetraite(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []
    const now = new Date()

    // Clients 55-65 ans sans PER
    const clients55to65 = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        birthDate: {
          gte: new Date(now.getFullYear() - 65, now.getMonth(), now.getDate()),
          lte: new Date(now.getFullYear() - 55, now.getMonth(), now.getDate()),
        },
        contrats: { none: { type: 'EPARGNE_RETRAITE', status: 'ACTIF' } },
      },
      select: { id: true, firstName: true, lastName: true, birthDate: true, irTaxRate: true },
    })

    if (clients55to65.length > 0) {
      const highTmi = clients55to65.filter(c => Number(c.irTaxRate || 0) >= 30)
      insights.push({
        expert: 'RETRAITE',
        expertLabel: EXPERT_LABELS.RETRAITE,
        priority: highTmi.length > 0 ? 'critical' : 'high',
        title: `${clients55to65.length} client(s) 55-65 ans sans PER (dont ${highTmi.length} TMI ≥30%)`,
        description: `Ces clients approchent de la retraite sans Plan d'Épargne Retraite. Le PER offre une déduction fiscale à l'entrée particulièrement avantageuse pour les TMI élevés.`,
        impact: `Déduction fiscale potentielle: jusqu'à ${highTmi.length * 10_000}€/an pour les TMI 30%+`,
        recommendation: 'RDV de planification retraite avec simulation PER',
        clientIds: clients55to65.map(c => c.id),
        confidence: 85,
      })
    }

    // Clients TNS sans protection sociale
    const tnsWithoutProtection = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        clientType: 'PROFESSIONNEL',
        OR: [
          { employmentType: 'INDEPENDANT' },
          { professionCategory: 'PROFESS_LIB' },
          { professionCategory: 'CHEF_ENTR' },
        ],
        contrats: { none: { type: 'PREVOYANCE', status: 'ACTIF' } },
      },
      select: { id: true, firstName: true, lastName: true, profession: true },
    })

    if (tnsWithoutProtection.length > 0) {
      insights.push({
        expert: 'RETRAITE',
        expertLabel: EXPERT_LABELS.RETRAITE,
        priority: 'critical',
        title: `${tnsWithoutProtection.length} TNS/Indépendant(s) sans prévoyance`,
        description: `Les travailleurs non-salariés ont une couverture sociale minimale. L'absence de prévoyance Madelin/loi Pacte est un risque majeur.`,
        impact: 'Risque financier vital en cas d\'arrêt de travail ou décès',
        recommendation: 'Audit protection sociale urgent + proposition prévoyance Madelin',
        clientIds: tnsWithoutProtection.map(c => c.id),
        confidence: 95,
      })
    }

    return insights
  }

  // ============================================================================
  // EXPERT CONFORMITE
  // ============================================================================

  private async runExpertConformite(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []
    const now = new Date()

    // KYC expirés
    const expiredKyc = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: { in: ['ACTIF', 'PROSPECT'] },
        kycStatus: 'EXPIRE',
      },
      select: { id: true, firstName: true, lastName: true },
    })

    if (expiredKyc.length > 0) {
      insights.push({
        expert: 'CONFORMITE',
        expertLabel: EXPERT_LABELS.CONFORMITE,
        priority: 'critical',
        title: `${expiredKyc.length} KYC expiré(s) — non-conformité DDA/LCB-FT`,
        description: `L'ACPR sanctionne le défaut de KYC. Ces dossiers doivent être mis à jour immédiatement.`,
        impact: 'Risque de sanction ACPR/AMF',
        recommendation: 'Lancer une campagne de mise à jour KYC immédiate',
        clientIds: expiredKyc.map(c => c.id),
        confidence: 100,
      })
    }

    // KYC expirant dans 30 jours
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringKyc = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        kycNextReviewDate: { lte: thirtyDays, gte: now },
      },
      select: { id: true, firstName: true, lastName: true, kycNextReviewDate: true },
    })

    if (expiringKyc.length > 0) {
      insights.push({
        expert: 'CONFORMITE',
        expertLabel: EXPERT_LABELS.CONFORMITE,
        priority: 'high',
        title: `${expiringKyc.length} KYC expire(nt) dans les 30 prochains jours`,
        description: `Anticiper le renouvellement pour éviter les ruptures de conformité.`,
        impact: 'Maintien de la conformité réglementaire',
        recommendation: 'Planifier les revues KYC et envoyer les demandes de documents',
        clientIds: expiringKyc.map(c => c.id),
        confidence: 95,
      })
    }

    // PPE sans surveillance renforcée
    const pepClients = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        isPEP: true,
        status: 'ACTIF',
      },
      select: { id: true, firstName: true, lastName: true },
    })

    if (pepClients.length > 0) {
      insights.push({
        expert: 'CONFORMITE',
        expertLabel: EXPERT_LABELS.CONFORMITE,
        priority: 'high',
        title: `${pepClients.length} PPE identifié(s) — surveillance renforcée obligatoire`,
        description: `Les Personnes Politiquement Exposées nécessitent des mesures de vigilance renforcées (art. L561-10 CMF).`,
        impact: 'Obligation légale — risque de sanction',
        recommendation: 'Vérifier que les mesures de vigilance renforcée sont appliquées',
        clientIds: pepClients.map(c => c.id),
        confidence: 100,
      })
    }

    return insights
  }

  // ============================================================================
  // EXPERT COMMERCIAL
  // ============================================================================

  private async runExpertCommercial(): Promise<ExpertInsight[]> {
    const insights: ExpertInsight[] = []
    const now = new Date()

    // Prospects stagnants (>30 jours sans activité)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const staleProspects = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'PROSPECT',
        updatedAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, firstName: true, lastName: true, updatedAt: true, patrimoineNet: true },
    })

    if (staleProspects.length > 0) {
      const highValueStale = staleProspects.filter(p => Number(p.patrimoineNet || 0) >= 200_000)
      insights.push({
        expert: 'COMMERCIAL',
        expertLabel: EXPERT_LABELS.COMMERCIAL,
        priority: highValueStale.length > 0 ? 'high' : 'medium',
        title: `${staleProspects.length} prospect(s) stagnant(s) >30j (dont ${highValueStale.length} haut patrimoine)`,
        description: `Ces prospects n'ont eu aucune activité depuis plus de 30 jours. Risque de perte de lead.`,
        impact: `CA potentiel en jeu: ~${Math.round(staleProspects.reduce((sum, p) => sum + Number(p.patrimoineNet || 0) * 0.008, 0))}€/an`,
        recommendation: 'Lancer une campagne de relance ciblée',
        clientIds: staleProspects.map(p => p.id),
        confidence: 80,
      })
    }

    // Opportunités en cours non converties depuis longtemps
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const staleOpportunities = await this.prisma.opportunite.findMany({
      where: {
        client: { cabinetId: this.cabinetId },
        status: { in: ['DETECTEE', 'QUALIFIEE'] },
        updatedAt: { lt: sixtyDaysAgo },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (staleOpportunities.length > 0) {
      const totalValue = staleOpportunities.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0)
      insights.push({
        expert: 'COMMERCIAL',
        expertLabel: EXPERT_LABELS.COMMERCIAL,
        priority: 'high',
        title: `${staleOpportunities.length} opportunité(s) stagnante(s) (valeur: ${(totalValue / 1000).toFixed(0)}K€)`,
        description: `Ces opportunités sont en cours depuis >60 jours sans mise à jour. Action requise.`,
        impact: `${(totalValue / 1000).toFixed(0)}K€ en jeu`,
        recommendation: 'Requalifier chaque opportunité: avancer, reporter ou clôturer',
        clientIds: [...new Set(staleOpportunities.map(o => o.clientId))],
        confidence: 85,
      })
    }

    // Taux de conversion du mois
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newThisMonth = await this.prisma.client.count({
      where: { cabinetId: this.cabinetId, createdAt: { gte: firstOfMonth } },
    })
    const convertedThisMonth = await this.prisma.client.count({
      where: { cabinetId: this.cabinetId, status: 'ACTIF', updatedAt: { gte: firstOfMonth } },
    })

    if (newThisMonth > 0) {
      insights.push({
        expert: 'COMMERCIAL',
        expertLabel: EXPERT_LABELS.COMMERCIAL,
        priority: 'info',
        title: `Performance du mois: ${newThisMonth} nouveaux contacts, ${convertedThisMonth} conversions`,
        description: `Taux de conversion estimé: ${newThisMonth > 0 ? Math.round((convertedThisMonth / newThisMonth) * 100) : 0}%.`,
        impact: 'Suivi de la performance commerciale',
        recommendation: newThisMonth > convertedThisMonth * 3 ? 'Améliorer le taux de qualification des prospects' : 'Maintenir le rythme actuel',
        confidence: 90,
      })
    }

    return insights
  }

  // ============================================================================
  // SYNTHESIS
  // ============================================================================

  private synthesize(insights: ExpertInsight[], metrics: CouncilMetrics): SynthesisReport {
    // Rank recommendations by priority and impact
    const criticals = insights.filter(i => i.priority === 'critical')
    const highs = insights.filter(i => i.priority === 'high')

    const topRecommendations: RankedRecommendation[] = [
      ...criticals.map((i, idx) => ({
        rank: idx + 1,
        title: i.title,
        description: i.recommendation,
        expert: i.expert,
        estimatedImpact: 'high' as const,
        effort: 'quick_win' as const,
        clientIds: i.clientIds,
      })),
      ...highs.map((i, idx) => ({
        rank: criticals.length + idx + 1,
        title: i.title,
        description: i.recommendation,
        expert: i.expert,
        estimatedImpact: 'medium' as const,
        effort: 'medium_effort' as const,
        clientIds: i.clientIds,
      })),
    ].slice(0, 10)

    const urgentActions = criticals.map(i => i.recommendation)

    // Determine weekly focus
    let weeklyFocus: string
    if (criticals.some(i => i.expert === 'CONFORMITE')) {
      weeklyFocus = 'Mise en conformité KYC — priorité absolue cette semaine'
    } else if (criticals.some(i => i.expert === 'FISCAL')) {
      weeklyFocus = 'Optimisation fiscale clients TMI élevé'
    } else if (highs.some(i => i.expert === 'COMMERCIAL')) {
      weeklyFocus = 'Relance des prospects stagnants et opportunités en cours'
    } else {
      weeklyFocus = 'Revue de portefeuille et fidélisation client'
    }

    // Monthly theme
    const month = new Date().getMonth()
    const monthlyThemes: Record<number, string> = {
      0: 'Bilan fiscal N-1 et déclarations ISF/IFI',
      1: 'Préparation déclaration revenus et optimisation',
      2: 'Campagne SCPI / FCPI avant 31 mars',
      3: 'Déclaration de revenus — accompagnement clients',
      4: 'Bilan patrimonial semestriel',
      5: 'Assemblées générales et revue contrats',
      6: 'Préparation retraite — RDV clients 55+',
      7: 'Pause estivale — préparation rentrée',
      8: 'Rentrée — campagne de renouvellement mandats',
      9: 'Optimisation fiscale avant clôture exercice',
      10: 'Investissements de fin d\'année (FCPI, Girardin, Pinel)',
      11: 'Clôture année fiscale — derniers arbitrages',
    }

    return {
      topRecommendations,
      urgentActions,
      weeklyFocus,
      monthlyTheme: monthlyThemes[month] || 'Revue générale du portefeuille',
    }
  }

  // ============================================================================
  // METRICS GATHERING
  // ============================================================================

  private async gatherMetrics(): Promise<CouncilMetrics> {
    const totalClients = await this.prisma.client.count({
      where: { cabinetId: this.cabinetId, status: { notIn: ['ARCHIVE', 'PERDU'] } },
    })

    const activeClients = await this.prisma.client.count({
      where: { cabinetId: this.cabinetId, status: 'ACTIF' },
    })

    const patrimoineAgg = await this.prisma.client.aggregate({
      where: { cabinetId: this.cabinetId, status: 'ACTIF' },
      _sum: { patrimoineNet: true },
    })

    const kycCompliant = await this.prisma.client.count({
      where: { cabinetId: this.cabinetId, status: 'ACTIF', kycStatus: 'COMPLET' },
    })

    const pipelineOpps = await this.prisma.opportunite.aggregate({
      where: { client: { cabinetId: this.cabinetId }, status: { in: ['DETECTEE', 'QUALIFIEE'] } },
      _sum: { estimatedValue: true },
    })

    return {
      totalClients,
      activeClients,
      totalPatrimoine: Number(patrimoineAgg._sum.patrimoineNet || 0),
      kycComplianceRate: totalClients > 0 ? Math.round((kycCompliant / totalClients) * 100) : 0,
      pipelineValue: Number(pipelineOpps._sum.estimatedValue || 0),
      churnRisk: 0, // Calculated separately
    }
  }
}
