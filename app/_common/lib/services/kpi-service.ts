/**
 * KPI Service - Indicateurs clés de performance
 * Métriques business pour le suivi d'activité conseiller/cabinet
 */

import { prisma } from '@/app/_common/lib/prisma'

export interface KPIMetrics {
  // Portefeuille clients
  totalClients: number
  activeClients: number
  prospects: number
  clientsConvertisThisPeriod: number
  tauxConversion: number

  // Patrimoine sous gestion
  totalAUM: number
  aumEvolution: number // en %
  collecteNette: number

  // Activité commerciale
  rdvsRealises: number
  rdvsPlanifies: number
  tauxPresence: number
  opportunitesOuvertes: number
  opportunitesConverties: number
  tauxSuccesOpportunites: number

  // Productivité
  tachesCompletees: number
  tachesEnRetard: number
  tempsReponseMoyen: number // en heures

  // Conformité
  kycComplets: number
  kycEnAttente: number
  tauxConformite: number

  // Satisfaction (si données disponibles)
  nps?: number
  satisfactionScore?: number
}

export interface KPIPeriodComparison {
  current: KPIMetrics
  previous: KPIMetrics
  variations: Record<keyof KPIMetrics, number>
}

export interface KPIGoal {
  name: string
  current: number
  target: number
  progress: number // en %
  status: 'ahead' | 'on_track' | 'behind' | 'critical'
}

export class KPIService {
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {}

  /**
   * Calcule tous les KPIs pour un conseiller sur une période
   */
  async getKPIs(startDate: Date, endDate: Date): Promise<KPIMetrics> {
    const advisorId = this.userId

    // ========== CLIENTS ==========
    const [totalClients, activeClients, prospects] = await Promise.all([
      prisma.client.count({
        where: { conseillerId: advisorId, cabinetId: this.cabinetId }
      }),
      prisma.client.count({
        where: { conseillerId: advisorId, cabinetId: this.cabinetId, status: 'ACTIF' }
      }),
      prisma.client.count({
        where: { conseillerId: advisorId, cabinetId: this.cabinetId, status: 'PROSPECT' }
      }),
    ])

    const clientsConvertis = await prisma.client.count({
      where: {
        conseillerId: advisorId,
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        updatedAt: { gte: startDate, lte: endDate }
      }
    })

    // ========== PATRIMOINE ==========
    const clientIds = (await prisma.client.findMany({
      where: { conseillerId: advisorId, cabinetId: this.cabinetId },
      select: { id: true }
    })).map(c => c.id)

    const actifsTotal = await prisma.actif.aggregate({
      where: { clients: { some: { id: { in: clientIds } } } },
      _sum: { value: true }
    })

    const contratsTotal = await prisma.contrat.aggregate({
      where: { clientId: { in: clientIds } },
      _sum: { value: true }
    })

    const totalAUM = Number(actifsTotal._sum.value || 0) + Number(contratsTotal._sum.value || 0)

    // ========== ACTIVITÉ ==========
    const [rdvsRealises, rdvsPlanifies] = await Promise.all([
      prisma.rendezVous.count({
        where: {
          conseillerId: advisorId,
          status: 'TERMINE',
          startDate: { gte: startDate, lte: endDate }
        }
      }),
      prisma.rendezVous.count({
        where: {
          conseillerId: advisorId,
          startDate: { gte: startDate, lte: endDate }
        }
      }),
    ])

    const [opportunitesOuvertes, opportunitesConverties] = await Promise.all([
      prisma.opportunite.count({
        where: {
          conseillerId: advisorId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.opportunite.count({
        where: {
          conseillerId: advisorId,
          status: 'CONVERTIE',
          updatedAt: { gte: startDate, lte: endDate }
        }
      }),
    ])

    // ========== TÂCHES ==========
    const [tachesCompletees, tachesEnRetard] = await Promise.all([
      prisma.tache.count({
        where: {
          assignedToId: advisorId,
          status: 'TERMINE',
          completedAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.tache.count({
        where: {
          assignedToId: advisorId,
          status: { in: ['A_FAIRE', 'EN_COURS'] },
          dueDate: { lt: new Date() }
        }
      }),
    ])

    // ========== KYC ==========
    const [kycComplets, kycEnAttente] = await Promise.all([
      prisma.client.count({
        where: {
          conseillerId: advisorId,
          cabinetId: this.cabinetId,
          kycStatus: 'COMPLET'
        }
      }),
      prisma.client.count({
        where: {
          conseillerId: advisorId,
          cabinetId: this.cabinetId,
          kycStatus: { in: ['EN_ATTENTE', 'EN_COURS'] }
        }
      }),
    ])

    // ========== CALCULS DÉRIVÉS ==========
    const tauxConversion = prospects > 0 
      ? Math.round((clientsConvertis / prospects) * 100) 
      : 0

    const tauxPresence = rdvsPlanifies > 0 
      ? Math.round((rdvsRealises / rdvsPlanifies) * 100) 
      : 0

    const tauxSuccesOpportunites = opportunitesOuvertes > 0 
      ? Math.round((opportunitesConverties / opportunitesOuvertes) * 100) 
      : 0

    const tauxConformite = totalClients > 0 
      ? Math.round((kycComplets / totalClients) * 100) 
      : 0

    return {
      totalClients,
      activeClients,
      prospects,
      clientsConvertisThisPeriod: clientsConvertis,
      tauxConversion,
      totalAUM,
      aumEvolution: 0, // Nécessite historique
      collecteNette: 0, // Nécessite historique
      rdvsRealises,
      rdvsPlanifies,
      tauxPresence,
      opportunitesOuvertes,
      opportunitesConverties,
      tauxSuccesOpportunites,
      tachesCompletees,
      tachesEnRetard,
      tempsReponseMoyen: 0, // À calculer depuis les tâches
      kycComplets,
      kycEnAttente,
      tauxConformite,
    }
  }

  /**
   * Compare les KPIs entre deux périodes
   */
  async compareKPIs(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<KPIPeriodComparison> {
    const [current, previous] = await Promise.all([
      this.getKPIs(currentStart, currentEnd),
      this.getKPIs(previousStart, previousEnd),
    ])

    const variations: Record<string, number> = {}
    
    for (const key of Object.keys(current) as (keyof KPIMetrics)[]) {
      const curr = current[key] || 0
      const prev = previous[key] || 0
      variations[key] = prev > 0 ? Math.round(((Number(curr) - Number(prev)) / Number(prev)) * 100) : 0
    }

    return {
      current,
      previous,
      variations: variations as Record<keyof KPIMetrics, number>,
    }
  }

  /**
   * Objectifs et suivi de progression
   */
  async getGoalsProgress(): Promise<KPIGoal[]> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const kpis = await this.getKPIs(startOfMonth, now)

    // Objectifs configurables (à stocker en base dans une vraie implémentation)
    const goals: KPIGoal[] = [
      {
        name: 'Nouveaux clients',
        current: kpis.clientsConvertisThisPeriod,
        target: 5,
        progress: Math.min(100, Math.round((kpis.clientsConvertisThisPeriod / 5) * 100)),
        status: kpis.clientsConvertisThisPeriod >= 5 ? 'ahead' 
          : kpis.clientsConvertisThisPeriod >= 3 ? 'on_track'
          : kpis.clientsConvertisThisPeriod >= 1 ? 'behind' : 'critical'
      },
      {
        name: 'RDVs réalisés',
        current: kpis.rdvsRealises,
        target: 20,
        progress: Math.min(100, Math.round((kpis.rdvsRealises / 20) * 100)),
        status: kpis.rdvsRealises >= 20 ? 'ahead'
          : kpis.rdvsRealises >= 15 ? 'on_track'
          : kpis.rdvsRealises >= 10 ? 'behind' : 'critical'
      },
      {
        name: 'Taux de conformité KYC',
        current: kpis.tauxConformite,
        target: 100,
        progress: kpis.tauxConformite,
        status: kpis.tauxConformite >= 95 ? 'ahead'
          : kpis.tauxConformite >= 80 ? 'on_track'
          : kpis.tauxConformite >= 60 ? 'behind' : 'critical'
      },
      {
        name: 'Tâches en retard',
        current: kpis.tachesEnRetard,
        target: 0,
        progress: kpis.tachesEnRetard === 0 ? 100 : Math.max(0, 100 - kpis.tachesEnRetard * 10),
        status: kpis.tachesEnRetard === 0 ? 'ahead'
          : kpis.tachesEnRetard <= 2 ? 'on_track'
          : kpis.tachesEnRetard <= 5 ? 'behind' : 'critical'
      },
    ]

    return goals
  }

  /**
   * Tableau de bord KPI synthétique
   */
  async getDashboardSummary(): Promise<{
    kpis: KPIMetrics
    goals: KPIGoal[]
    alerts: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[]
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const [kpis, goals] = await Promise.all([
      this.getKPIs(startOfMonth, now),
      this.getGoalsProgress(),
    ])

    const alerts: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }[] = []

    // Génération des alertes basées sur les KPIs
    if (kpis.tachesEnRetard > 5) {
      alerts.push({
        type: 'productivity',
        message: `${kpis.tachesEnRetard} tâches en retard nécessitent votre attention`,
        severity: 'critical'
      })
    } else if (kpis.tachesEnRetard > 0) {
      alerts.push({
        type: 'productivity',
        message: `${kpis.tachesEnRetard} tâche(s) en retard`,
        severity: 'warning'
      })
    }

    if (kpis.tauxConformite < 80) {
      alerts.push({
        type: 'compliance',
        message: `Taux de conformité KYC insuffisant (${kpis.tauxConformite}%)`,
        severity: kpis.tauxConformite < 60 ? 'critical' : 'warning'
      })
    }

    if (kpis.kycEnAttente > 10) {
      alerts.push({
        type: 'kyc',
        message: `${kpis.kycEnAttente} dossiers KYC en attente`,
        severity: 'warning'
      })
    }

    return { kpis, goals, alerts }
  }
}

export default KPIService
