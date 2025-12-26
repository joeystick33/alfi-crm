/**
 * Activities Data Service
 * 
 * Aggregates activities data with filtering for the Client360 TabActivites.
 * Provides combined data retrieval including timeline events and financial/fiscal logs.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'
import type {
  Activity,
  ActivityType,
  ActivityFilter,
} from '@/app/_common/types/client360'

// Interface pour les événements timeline de Prisma
interface TimelineEventRecord {
  id: string
  type: string
  title: string | null
  description: string | null
  createdAt: Date
  createdBy: string | null
  relatedEntityType: string | null
  relatedEntityId: string | null
  clientId: string
  cabinetId: string
}

export interface ActivitiesDataServiceResult {
  activities: Activity[]
  filters: ActivityFilter
  stats: {
    totalActivities: number
    byType: Record<string, number>
    recentCount: number
    financialLogsCount: number
    fiscalLogsCount: number
  }
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ActivitiesFilterParams {
  types?: ActivityType[]
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}

/**
 * Maps TimelineEventType from database to ActivityType
 */
export function mapTimelineEventToActivityType(type: string): ActivityType {
  const typeMap: Record<string, ActivityType> = {
    'CLIENT_CREATED': 'ACTION',
    'MEETING_HELD': 'MEETING',
    'DOCUMENT_SIGNED': 'ACTION',
    'ASSET_ADDED': 'LOG',
    'GOAL_ACHIEVED': 'ACTION',
    'CONTRACT_SIGNED': 'ACTION',
    'KYC_UPDATED': 'LOG',
    'SIMULATION_SHARED': 'ACTION',
    'EMAIL_SENT': 'EMAIL',
    'OPPORTUNITY_CONVERTED': 'ACTION',
    'AUTRE': 'ACTION',
  }
  return typeMap[type] || 'ACTION'
}

/**
 * Determines if an activity is a financial log
 */
export function isFinancialLog(type: string, relatedEntityType?: string | null): boolean {
  const financialTypes = ['ASSET_ADDED', 'CONTRACT_SIGNED']
  const financialEntities = ['Actif', 'Contrat', 'Passif']
  
  return financialTypes.includes(type) || 
    (relatedEntityType ? financialEntities.includes(relatedEntityType) : false)
}

/**
 * Determines if an activity is a fiscal log
 */
export function isFiscalLog(type: string, title?: string, description?: string): boolean {
  const fiscalKeywords = ['fiscal', 'impôt', 'ifi', 'ir', 'tax', 'déclaration', 'optimisation']
  const searchText = `${title || ''} ${description || ''}`.toLowerCase()
  
  return fiscalKeywords.some(keyword => searchText.includes(keyword))
}

/**
 * Sorts activities by timestamp in descending order (most recent first)
 * 
 * Property 3: Temporal data ordering
 * **Validates: Requirements 1.2, 1.3, 6.5, 13.4**
 */
export function sortActivitiesByTimestamp(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return dateB - dateA // Descending order for activities
  })
}

/**
 * Filters activities based on provided filter parameters
 */
export function filterActivities(
  activities: Activity[],
  filters: ActivitiesFilterParams
): Activity[] {
  let filtered = [...activities]

  // Filter by types
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter(a => filters.types!.includes(a.type))
  }

  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate).getTime()
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= startDate)
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate).getTime()
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() <= endDate)
  }

  // Filter by search term
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim()
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower) ||
      a.performedBy.toLowerCase().includes(searchLower)
    )
  }

  return filtered
}

/**
 * Activities Data Service
 * 
 * Provides aggregated data for the activities tab including:
 * - Timeline events mapped to activities
 * - Financial and fiscal logs
 * - Filtering and pagination
 * - Statistics
 */
export class ActivitiesDataService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Formats a timeline event to Activity format
   */
  private formatActivity(event: TimelineEventRecord, creatorName?: string): Activity {
    return {
      id: event.id,
      type: mapTimelineEventToActivityType(event.type),
      title: event.title || '',
      description: event.description || '',
      timestamp: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date().toISOString(),
      performedBy: creatorName || 'Système',
      linkedDocuments: event.relatedEntityType === 'Document' && event.relatedEntityId 
        ? [event.relatedEntityId] 
        : [],
      metadata: {
        originalType: event.type,
        relatedEntityType: event.relatedEntityType,
        relatedEntityId: event.relatedEntityId,
        isFinancialLog: isFinancialLog(event.type, event.relatedEntityType),
        isFiscalLog: isFiscalLog(event.type, event.title, event.description),
      },
    }
  }

  /**
   * Retrieves all activities data for a client with filtering
   */
  async getActivitiesData(
    clientId: string,
    filters?: ActivitiesFilterParams
  ): Promise<ActivitiesDataServiceResult> {
    // Build where clause for database query
    const where: { clientId: string; cabinetId: string; createdAt?: { gte?: Date; lte?: Date } } = {
      clientId,
      cabinetId: this.cabinetId,
    }

    // Apply date filters at database level for efficiency
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }

    // Fetch timeline events
    const eventsRaw = await this.prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Get unique creator IDs
    const creatorIds = Array.from(
      new Set(eventsRaw.map((e: { createdBy?: string | null }) => e.createdBy).filter((id: string | null | undefined): id is string => Boolean(id)))
    )

    // Fetch creator names
    const creators = creatorIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : []

    const creatorsMap = new Map<string, string>(
      creators.map((u: { id: string; firstName: string; lastName: string }) => [u.id, `${u.firstName} ${u.lastName}`])
    )

    // Format activities
    let activities = eventsRaw.map((event) => 
      this.formatActivity(event as TimelineEventRecord, event.createdBy ? creatorsMap.get(event.createdBy) : undefined)
    )

    // Apply type filter (needs to be done after mapping)
    if (filters?.types && filters.types.length > 0) {
      activities = activities.filter((a: Activity) => filters.types!.includes(a.type))
    }

    // Apply search filter
    if (filters?.search && filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim()
      activities = activities.filter((a: Activity) =>
        a.title.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower) ||
        a.performedBy.toLowerCase().includes(searchLower)
      )
    }

    // Sort activities (should already be sorted from DB, but ensure consistency)
    activities = sortActivitiesByTimestamp(activities)

    // Calculate statistics before pagination
    const totalActivities = activities.length
    const byType: Record<string, number> = {}
    let financialLogsCount = 0
    let fiscalLogsCount = 0

    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1
      if (activity.metadata?.isFinancialLog) financialLogsCount++
      if (activity.metadata?.isFiscalLog) fiscalLogsCount++
    }

    // Calculate recent count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCount = activities.filter(
      (a: Activity) => new Date(a.timestamp) >= thirtyDaysAgo
    ).length

    // Apply pagination
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    const paginatedActivities = activities.slice(offset, offset + limit)

    // Build current filter state
    const currentFilters: ActivityFilter = {
      types: filters?.types || [],
      dateRange: {
        start: filters?.startDate || '',
        end: filters?.endDate || '',
      },
      search: filters?.search || '',
    }

    return {
      activities: paginatedActivities,
      filters: currentFilters,
      stats: {
        totalActivities,
        byType,
        recentCount,
        financialLogsCount,
        fiscalLogsCount,
      },
      pagination: {
        total: totalActivities,
        limit,
        offset,
        hasMore: offset + limit < totalActivities,
      },
    }
  }

  /**
   * Creates a new activity (timeline event)
   */
  async createActivity(
    clientId: string,
    data: {
      type: ActivityType
      title: string
      description?: string
      linkedDocuments?: string[]
    }
  ): Promise<Activity> {
    // Map ActivityType back to TimelineEventType
    const typeMap: Record<ActivityType, string> = {
      'CALL': 'AUTRE',
      'EMAIL': 'EMAIL_SENT',
      'MEETING': 'MEETING_HELD',
      'ACTION': 'AUTRE',
      'LOG': 'AUTRE',
    }

    const event = await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId,
        type: typeMap[data.type] || 'AUTRE',
        title: data.title,
        description: data.description,
        relatedEntityType: data.linkedDocuments?.length ? 'Document' : undefined,
        relatedEntityId: data.linkedDocuments?.[0],
        createdBy: this.userId,
      },
    })

    // Get creator name
    const creator = await this.prisma.user.findUnique({
      where: { id: this.userId },
      select: { firstName: true, lastName: true },
    })

    return this.formatActivity(
      event,
      creator ? `${creator.firstName} ${creator.lastName}` : undefined
    )
  }

  /**
   * Gets financial logs for a client
   */
  async getFinancialLogs(clientId: string, limit: number = 20): Promise<Activity[]> {
    const events = await this.prisma.timelineEvent.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        OR: [
          { type: 'ASSET_ADDED' },
          { type: 'CONTRACT_SIGNED' },
          { relatedEntityType: { in: ['Actif', 'Contrat', 'Passif'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return events.map((e) => this.formatActivity(e as TimelineEventRecord))
  }

  /**
   * Gets fiscal logs for a client
   */
  async getFiscalLogs(clientId: string, limit: number = 20): Promise<Activity[]> {
    const events = await this.prisma.timelineEvent.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        OR: [
          { title: { contains: 'fiscal', mode: 'insensitive' } },
          { title: { contains: 'impôt', mode: 'insensitive' } },
          { title: { contains: 'IFI', mode: 'insensitive' } },
          { description: { contains: 'fiscal', mode: 'insensitive' } },
          { description: { contains: 'optimisation', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return events.map((e) => this.formatActivity(e as TimelineEventRecord))
  }
}
