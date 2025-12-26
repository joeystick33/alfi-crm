/**
 * Objectives Data Service
 * 
 * Aggregates objectives, projects, and timeline data for the Client360 TabObjectifs.
 * Provides combined data retrieval and utility functions for objectives management.
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'
import type { Objective, Project, TimelineEvent, Milestone, Risk } from '@/app/_common/types/client360'

export interface ObjectivesDataServiceResult {
  objectives: Objective[]
  projects: Project[]
  timeline: TimelineEvent[]
  stats: {
    totalObjectives: number
    activeObjectives: number
    completedObjectives: number
    atRiskObjectives: number
    totalProjects: number
    activeProjects: number
    completedProjects: number
    globalProgress: number
    totalTargetAmount: number
    totalCurrentAmount: number
  }
}

/**
 * Objectives Data Service
 * 
 * Provides aggregated data for the objectives tab including:
 * - Objectives with progress tracking
 * - Projects with milestones and risks
 * - Timeline events related to objectives and projects
 * - Statistics and KPIs
 */
export class ObjectivesDataService {
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
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0
    }
    if (
      typeof value === 'object' &&
      value !== null &&
      'toNumber' in value &&
      typeof (value as { toNumber?: unknown }).toNumber === 'function'
    ) {
      return (value as { toNumber: () => number }).toNumber()
    }
    return Number(value) || 0
  }

  private toStringValue(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value
    if (value === null || value === undefined) return fallback
    return String(value)
  }

  private toOptionalString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined
    const asStr = this.toStringValue(value, '').trim()
    return asStr ? asStr : undefined
  }

  private toIsoString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined
    if (value instanceof Date) return value.toISOString()
    if (
      typeof value === 'object' &&
      value !== null &&
      'toISOString' in value &&
      typeof (value as { toISOString?: unknown }).toISOString === 'function'
    ) {
      return (value as { toISOString: () => string }).toISOString()
    }
    if (typeof value === 'string') return value
    return this.toStringValue(value)
  }

  private toProjectPriority(value: unknown): Objective['priority'] {
    const normalized = this.toStringValue(value, 'MOYENNE').toUpperCase()
    if (normalized === 'HAUTE' || normalized === 'MOYENNE' || normalized === 'BASSE') {
      return normalized as Objective['priority']
    }
    return 'MOYENNE'
  }

  private toRiskLevel(value: unknown): Risk['severity'] {
    const normalized = this.toStringValue(value, 'MOYENNE').toUpperCase()
    if (normalized === 'HAUTE' || normalized === 'MOYENNE' || normalized === 'BASSE') {
      return normalized as Risk['severity']
    }
    return 'MOYENNE'
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.toLowerCase() === 'true'
    return false
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
   * Maps objective status from database to design spec status
   */
  private mapObjectiveStatus(status: string): Objective['status'] {
    const statusMap: Record<string, Objective['status']> = {
      'ACTIF': 'ACTIF',
      'ATTEINT': 'ATTEINT',
      'TERMINE': 'ATTEINT',
      'ANNULE': 'ABANDONED',
      'ABANDONED': 'ABANDONED',
      'EN_PAUSE': 'ACTIF',
      'NOT_STARTED': 'ACTIF',
      'EN_COURS': 'ACTIF',
      'ON_TRACK': 'ACTIF',
      'AT_RISK': 'ACTIF',
    }
    return statusMap[status] || 'ACTIF'
  }

  /**
   * Formats an objective from database to API response format
   */
  private formatObjective(obj: Record<string, unknown>): Objective {
    return {
      id: this.toStringValue(obj.id),
      type: this.mapObjectiveType(this.toStringValue(obj.type)),
      title: this.toStringValue(obj.name),
      description: this.toStringValue(obj.description, ''),
      targetAmount: this.toNumber(obj.targetAmount),
      targetDate: this.toIsoString(obj.targetDate),
      priority: this.toProjectPriority(obj.priority),
      status: this.mapObjectiveStatus(this.toStringValue(obj.status)),
    }
  }

  /**
   * Formats a project from database to API response format
   */
  private formatProject(proj: Record<string, unknown>): Project {
    // Parse milestones from JSON if stored
    let milestones: Milestone[] = []
    if (proj.milestones) {
      try {
        const parsed = typeof proj.milestones === 'string' 
          ? JSON.parse(proj.milestones) 
          : proj.milestones
        if (Array.isArray(parsed)) {
          milestones = parsed.map((m: Record<string, unknown>) => ({
            id: this.toStringValue(m.id ?? Math.random()),
            title: this.toStringValue(m.title ?? m.name, ''),
            date: this.toIsoString(m.date ?? m.targetDate) || '',
            isAchieved: this.toBoolean(m.isAchieved ?? m.completed),
          }))
        }
      } catch {
        milestones = []
      }
    }

    // Parse risks from JSON if stored
    let risks: Risk[] = []
    if (proj.risks) {
      try {
        const parsed = typeof proj.risks === 'string' 
          ? JSON.parse(proj.risks) 
          : proj.risks
        if (Array.isArray(parsed)) {
          risks = parsed.map((r: Record<string, unknown>) => ({
            id: this.toStringValue(r.id ?? Math.random()),
            description: this.toStringValue(r.description, ''),
            severity: this.toRiskLevel(r.severity),
            mitigation: this.toOptionalString(r.mitigation),
          }))
        }
      } catch {
        risks = []
      }
    }

    // Parse simulations from JSON if stored
    let simulations: string[] = []
    if (proj.simulations) {
      try {
        const parsed = typeof proj.simulations === 'string' 
          ? JSON.parse(proj.simulations) 
          : proj.simulations
        if (Array.isArray(parsed)) {
          simulations = parsed
            .map((s: unknown) => {
              if (typeof s === 'string') return s
              if (s && typeof s === 'object' && 'id' in (s as Record<string, unknown>)) {
                return this.toStringValue((s as Record<string, unknown>).id)
              }
              return ''
            })
            .filter((s: string) => Boolean(s))
        }
      } catch {
        simulations = []
      }
    }

    return {
      id: this.toStringValue(proj.id),
      name: this.toStringValue(proj.name),
      objectiveId: this.toOptionalString(proj.objectiveId),
      budget: this.toNumber(proj.estimatedBudget),
      deadline: this.toIsoString(proj.targetDate) || '',
      priority: this.toProjectPriority(proj.priority),
      progress: Math.max(0, Math.min(100, Number(proj.progress) || 0)),
      milestones,
      risks,
      simulations,
    }
  }

  /**
   * Formats a timeline event from database to API response format
   */
  private formatTimelineEvent(event: Record<string, unknown>): TimelineEvent {
    return {
      id: this.toStringValue(event.id),
      date: this.toIsoString(event.eventDate) || this.toIsoString(event.createdAt) || '',
      title: this.toStringValue(event.title),
      type: this.toStringValue(event.type),
      description: this.toOptionalString(event.description),
    }
  }

  /**
   * Retrieves all objectives data for a client
   */
  async getObjectivesData(clientId: string): Promise<ObjectivesDataServiceResult> {
    // Fetch objectives
    const objectifsRaw = await this.prisma.objectif.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
      },
      orderBy: [
        { priority: 'asc' },
        { targetDate: 'asc' },
      ],
    })

    // Fetch projects
    const projetsRaw = await this.prisma.projet.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
      },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Fetch timeline events related to objectives and projects
    const timelineRaw = await this.prisma.timelineEvent.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        OR: [
          { relatedEntityType: 'Objectif' },
          { relatedEntityType: 'Projet' },
          { type: 'GOAL_ACHIEVED' },
        ],
      },
      orderBy: {
        eventDate: 'desc',
      },
      take: 50,
    })

    // Format data
    const objectives = objectifsRaw.map(o => this.formatObjective(o))
    const projects = projetsRaw.map(p => this.formatProject(p))
    const timeline = timelineRaw.map(e => this.formatTimelineEvent(e))

    // Calculate statistics
    const activeObjectives = objectives.filter(o => o.status === 'ACTIF')
    const completedObjectives = objectives.filter(o => o.status === 'ATTEINT')
    
    // Calculate at-risk objectives (deadline within 30 days or passed)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const atRiskObjectives = objectives.filter(o => {
      if (o.status !== 'ACTIF' || !o.targetDate) return false
      const targetDate = new Date(o.targetDate)
      return targetDate <= thirtyDaysFromNow
    })

    const activeProjects = projects.filter(p => 
      !['TERMINE', 'ANNULE'].includes(projetsRaw.find(pr => pr.id === p.id)?.status || '')
    )
    const completedProjects = projects.filter(p => 
      projetsRaw.find(pr => pr.id === p.id)?.status === 'TERMINE'
    )

    // Calculate global progress
    const totalTargetAmount = objectives.reduce((sum, o) => sum + (o.targetAmount || 0), 0)
    const totalCurrentAmount = objectifsRaw.reduce((sum, o) => sum + this.toNumber(o.currentAmount), 0)
    const globalProgress = totalTargetAmount > 0 
      ? Math.round((totalCurrentAmount / totalTargetAmount) * 100) 
      : 0

    return {
      objectives,
      projects,
      timeline,
      stats: {
        totalObjectives: objectives.length,
        activeObjectives: activeObjectives.length,
        completedObjectives: completedObjectives.length,
        atRiskObjectives: atRiskObjectives.length,
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        globalProgress,
        totalTargetAmount,
        totalCurrentAmount,
      },
    }
  }
}

/**
 * Validates that project progress is within bounds (0-100)
 * and milestones achieved count is <= total milestones
 * 
 * Property 13: Project progress bounds
 */
export function validateProjectProgressBounds(project: Project): boolean {
  // Progress must be between 0 and 100
  if (project.progress < 0 || project.progress > 100) {
    return false
  }

  // Milestones achieved count must be <= total milestones
  const achievedCount = project.milestones.filter(m => m.isAchieved).length
  const totalCount = project.milestones.length
  
  if (achievedCount > totalCount) {
    return false
  }

  return true
}

/**
 * Validates that temporal data is properly ordered
 * 
 * Property 3: Temporal data ordering
 * - Timeline events should be sorted by date descending (most recent first)
 */
export function validateTemporalDataOrdering(timeline: TimelineEvent[]): boolean {
  if (timeline.length <= 1) {
    return true
  }

  for (let i = 0; i < timeline.length - 1; i++) {
    const currentDate = new Date(timeline[i].date).getTime()
    const nextDate = new Date(timeline[i + 1].date).getTime()
    
    // Timeline should be in descending order (most recent first)
    if (currentDate < nextDate) {
      return false
    }
  }

  return true
}
