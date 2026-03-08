/**
 * Agent Memory Service — Mémoire persistante pour l'agent IA
 * 
 * Gère la persistance des :
 *   • Instructions utilisateur ("rappelle-moi toujours les échéances KYC")
 *   • Préférences ("préférer PER pour clients > 50 ans")
 *   • Faits appris ("client Dupont a un projet immobilier à 500K€")
 *   • Résumés de conversations passées
 *   • Contexte client spécifique
 * 
 * Les mémoires sont récupérées par pertinence au moment de chaque requête
 * et injectées dans le system prompt de l'agent.
 */

import { getPrismaClient } from '../../prisma'
import type { AgentMemoryType } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export interface AgentMemoryEntry {
  id: string
  type: AgentMemoryType
  title: string
  content: string
  tags: string[]
  priority: number
  clientId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateMemoryInput {
  type: AgentMemoryType
  title: string
  content: string
  tags?: string[]
  priority?: number
  clientId?: string
  metadata?: Record<string, unknown>
  sourceQuery?: string
  expiresAt?: Date
}

export interface MemorySearchOptions {
  types?: AgentMemoryType[]
  clientId?: string
  tags?: string[]
  limit?: number
  activeOnly?: boolean
}

// ============================================================================
// SERVICE
// ============================================================================

export class AgentMemoryService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
  ) {
    this.prisma = getPrismaClient(cabinetId, false)
  }

  // ── CRUD ──

  /**
   * Crée une nouvelle mémoire
   */
  async create(input: CreateMemoryInput): Promise<AgentMemoryEntry> {
    const memory = await this.prisma.agentMemory.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
        priority: input.priority ?? 0,
        clientId: input.clientId,
        metadata: input.metadata as Record<string, unknown> | undefined,
        sourceQuery: input.sourceQuery,
        expiresAt: input.expiresAt,
      },
    })

    return this.toEntry(memory)
  }

  /**
   * Met à jour une mémoire existante
   */
  async update(id: string, updates: Partial<CreateMemoryInput>): Promise<AgentMemoryEntry> {
    const memory = await this.prisma.agentMemory.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content: updates.content }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.metadata && { metadata: updates.metadata as Record<string, unknown> }),
      },
    })

    return this.toEntry(memory)
  }

  /**
   * Désactive une mémoire (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    await this.prisma.agentMemory.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Supprime une mémoire définitivement
   */
  async delete(id: string): Promise<void> {
    await this.prisma.agentMemory.delete({
      where: { id },
    })
  }

  // ── RÉCUPÉRATION ──

  /**
   * Récupère toutes les instructions actives de l'utilisateur
   * Ces instructions sont toujours injectées dans le prompt
   */
  async getActiveInstructions(): Promise<AgentMemoryEntry[]> {
    const memories = await this.prisma.agentMemory.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isActive: true,
        type: { in: ['INSTRUCTION', 'PREFERENCE'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return memories.map(m => this.toEntry(m))
  }

  /**
   * Récupère les mémoires pertinentes pour un contexte donné
   * Utilise une recherche par tags + type + clientId
   */
  async getRelevantMemories(options: MemorySearchOptions = {}): Promise<AgentMemoryEntry[]> {
    const {
      types,
      clientId,
      tags,
      limit = 10,
      activeOnly = true,
    } = options

    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      userId: this.userId,
    }

    if (activeOnly) {
      where.isActive = true
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ]
    }
    if (types?.length) where.type = { in: types }
    if (clientId) where.clientId = clientId
    if (tags?.length) where.tags = { hasSome: tags }

    const memories = await this.prisma.agentMemory.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    })

    return memories.map(m => this.toEntry(m))
  }

  /**
   * Récupère les mémoires liées à un client spécifique
   */
  async getClientMemories(clientId: string): Promise<AgentMemoryEntry[]> {
    return this.getRelevantMemories({
      clientId,
      types: ['FACT', 'CLIENT_CONTEXT', 'INSTRUCTION'],
      limit: 15,
    })
  }

  /**
   * Recherche textuelle dans les mémoires (titre + contenu)
   * Utilise une recherche par mots-clés avec scoring de pertinence
   * Les résultats sont triés par nombre de mots matchés (pertinence) puis par priorité
   */
  async search(query: string, limit = 10): Promise<AgentMemoryEntry[]> {
    const normalizedQuery = query.toLowerCase().trim()
    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2)

    if (words.length === 0) return []

    // Recherche par mots-clés dans le titre et le contenu
    const memories = await this.prisma.agentMemory.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isActive: true,
        OR: words.flatMap(word => [
          { title: { contains: word, mode: 'insensitive' as const } },
          { content: { contains: word, mode: 'insensitive' as const } },
          { tags: { has: word } },
        ]),
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: limit * 2, // Récupérer plus pour scorer et re-trier
    })

    // Scoring de pertinence : nombre de mots matchés dans titre (×3) + contenu (×1) + tags (×2)
    const scored = memories.map(m => {
      const entry = this.toEntry(m)
      const titleLower = entry.title.toLowerCase()
      const contentLower = entry.content.toLowerCase()
      const tagsLower = entry.tags.map(t => t.toLowerCase())

      let score = entry.priority * 2 // Bonus priorité
      for (const word of words) {
        if (titleLower.includes(word)) score += 3
        if (contentLower.includes(word)) score += 1
        if (tagsLower.some(t => t.includes(word))) score += 2
      }
      return { entry, score }
    })

    // Trier par pertinence décroissante et limiter
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit).map(s => s.entry)
  }

  /**
   * Compte les mémoires par type
   */
  async getStats(): Promise<Record<string, number>> {
    const results = await this.prisma.agentMemory.groupBy({
      by: ['type'],
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isActive: true,
      },
      _count: true,
    })

    const stats: Record<string, number> = {}
    for (const r of results) {
      stats[r.type] = r._count
    }
    return stats
  }

  /**
   * Vérifie si une instruction similaire existe déjà (anti-doublon)
   */
  async findSimilarInstruction(content: string): Promise<AgentMemoryEntry | null> {
    const normalizedContent = content.toLowerCase().trim()
    const words = normalizedContent.split(/\s+/).filter(w => w.length > 3).slice(0, 5)

    if (words.length === 0) return null

    const candidates = await this.prisma.agentMemory.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        isActive: true,
        type: { in: ['INSTRUCTION', 'PREFERENCE'] },
        OR: words.map(word => ({
          content: { contains: word, mode: 'insensitive' as const },
        })),
      },
      take: 5,
    })

    // Score de similarité simple (mots en commun)
    for (const candidate of candidates) {
      const candidateWords = new Set(candidate.content.toLowerCase().split(/\s+/))
      const matchCount = words.filter(w => candidateWords.has(w)).length
      if (matchCount >= words.length * 0.6) {
        return this.toEntry(candidate)
      }
    }

    return null
  }

  // ── CONVERSATION SUMMARIES ──

  /**
   * Sauvegarde ou met à jour le résumé d'une conversation
   */
  async saveConversationSummary(
    summary: string,
    topics: string[],
    keyFacts: Record<string, unknown>,
    turnCount: number,
    clientId?: string,
  ): Promise<string> {
    // Chercher une conversation active récente (< 30 min)
    const recentConversation = await this.prisma.agentConversation.findFirst({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        clientId: clientId ?? null,
        lastActiveAt: { gt: new Date(Date.now() - 30 * 60 * 1000) },
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    if (recentConversation) {
      // Mettre à jour la conversation existante
      const updated = await this.prisma.agentConversation.update({
        where: { id: recentConversation.id },
        data: {
          summary,
          topics: [...new Set([...recentConversation.topics, ...topics])],
          keyFacts,
          turnCount,
          lastActiveAt: new Date(),
        },
      })
      return updated.id
    }

    // Créer une nouvelle conversation
    const created = await this.prisma.agentConversation.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        clientId,
        summary,
        topics,
        keyFacts,
        turnCount,
      },
    })

    return created.id
  }

  /**
   * Récupère les résumés des conversations récentes
   */
  async getRecentConversations(limit = 5, clientId?: string): Promise<Array<{
    id: string
    summary: string
    topics: string[]
    turnCount: number
    lastActiveAt: Date
  }>> {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      userId: this.userId,
    }
    if (clientId) where.clientId = clientId

    const conversations = await this.prisma.agentConversation.findMany({
      where,
      orderBy: { lastActiveAt: 'desc' },
      take: limit,
      select: {
        id: true,
        summary: true,
        topics: true,
        turnCount: true,
        lastActiveAt: true,
      },
    })

    return conversations
  }

  // ── FORMAT POUR INJECTION PROMPT ──

  /**
   * Formate les mémoires pour injection dans le system prompt de l'agent
   */
  formatForPrompt(memories: AgentMemoryEntry[]): string {
    if (memories.length === 0) return ''

    const sections: string[] = []

    const instructions = memories.filter(m => m.type === 'INSTRUCTION' || m.type === 'PREFERENCE')
    const facts = memories.filter(m => m.type === 'FACT' || m.type === 'CLIENT_CONTEXT')
    const conversations = memories.filter(m => m.type === 'CONVERSATION')

    if (instructions.length > 0) {
      sections.push('═══ INSTRUCTIONS UTILISATEUR ═══')
      for (const inst of instructions) {
        const priority = inst.priority >= 2 ? '⚠️ CRITIQUE' : inst.priority >= 1 ? '📌 IMPORTANT' : ''
        sections.push(`${priority ? priority + ' — ' : ''}${inst.content}`)
      }
    }

    if (facts.length > 0) {
      sections.push('\n═══ FAITS MÉMORISÉS ═══')
      for (const fact of facts) {
        sections.push(`• ${fact.title}: ${fact.content}`)
      }
    }

    if (conversations.length > 0) {
      sections.push('\n═══ CONTEXTE CONVERSATIONS PRÉCÉDENTES ═══')
      for (const conv of conversations) {
        sections.push(`• ${conv.content}`)
      }
    }

    return sections.join('\n')
  }

  // ── LIMITES ET NETTOYAGE ──

  private static readonly MAX_MEMORIES_PER_USER = 100
  private static readonly MAX_CONVERSATIONS_AGE_DAYS = 90

  /**
   * Applique les limites de mémoire : supprime les plus anciennes si le seuil est dépassé
   */
  async enforceMemoryLimits(): Promise<number> {
    const count = await this.prisma.agentMemory.count({
      where: { cabinetId: this.cabinetId, userId: this.userId, isActive: true },
    })

    if (count <= AgentMemoryService.MAX_MEMORIES_PER_USER) return 0

    const excess = count - AgentMemoryService.MAX_MEMORIES_PER_USER
    // Supprimer les mémoires les plus anciennes à faible priorité
    const toDelete = await this.prisma.agentMemory.findMany({
      where: { cabinetId: this.cabinetId, userId: this.userId, isActive: true },
      orderBy: [{ priority: 'asc' }, { updatedAt: 'asc' }],
      take: excess,
      select: { id: true },
    })

    if (toDelete.length > 0) {
      await this.prisma.agentMemory.deleteMany({
        where: { id: { in: toDelete.map(m => m.id) } },
      })
    }

    return toDelete.length
  }

  /**
   * Supprime les conversations anciennes (> 90 jours)
   */
  async cleanupOldConversations(): Promise<number> {
    const cutoff = new Date(Date.now() - AgentMemoryService.MAX_CONVERSATIONS_AGE_DAYS * 24 * 60 * 60 * 1000)

    const result = await this.prisma.agentConversation.deleteMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        lastActiveAt: { lt: cutoff },
      },
    })

    return result.count
  }

  // ── UTILITAIRE ──

  private toEntry(raw: Record<string, unknown>): AgentMemoryEntry {
    return {
      id: raw.id as string,
      type: raw.type as AgentMemoryType,
      title: raw.title as string,
      content: raw.content as string,
      tags: (raw.tags as string[]) ?? [],
      priority: (raw.priority as number) ?? 0,
      clientId: raw.clientId as string | null,
      metadata: raw.metadata as Record<string, unknown> | null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    }
  }
}
