import { EntretienStatus, EntretienType, TraitementType } from '@prisma/client'
import { prisma } from '@/app/_common/lib/prisma'

// ============================================================================
// Service Entretiens — CRUD + logique métier enrichie
// ============================================================================

// ── Types ──

export interface EntretienFilters {
  clientId?: string
  conseillerId?: string
  status?: EntretienStatus
  type?: EntretienType
  search?: string
  dateFrom?: Date
  dateTo?: Date
  tags?: string[]
  hasActions?: boolean
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateEntretienInput {
  titre: string
  type?: EntretienType
  clientId?: string
  prospectNom?: string
  prospectPrenom?: string
  prospectEmail?: string
  prospectTel?: string
  consentementRecueilli?: boolean
  consentementDate?: Date
  consentementTexte?: string
  dateEntretien?: Date
  tags?: string[]
  notesConseiller?: string
}

export interface UpdateEntretienInput {
  titre?: string
  type?: EntretienType
  status?: EntretienStatus
  clientId?: string
  duree?: number
  transcription?: unknown
  transcriptionBrute?: string
  traitementType?: TraitementType
  traitementResultat?: unknown
  traitementDate?: Date
  traitementPrompt?: string
  donneesExtraites?: unknown
  syncAvecClient?: boolean
  syncDate?: Date
  champsModifies?: unknown
  pdfGenere?: boolean
  pdfGenereDate?: Date
  notesConseiller?: string
  consentementRecueilli?: boolean
  consentementDate?: Date
  consentementTexte?: string
  tags?: string[]
}

// ── Includes réutilisables ──

const INCLUDE_LIST = {
  client: {
    select: {
      id: true, firstName: true, lastName: true, email: true,
      phone: true, status: true,
    },
  },
  conseiller: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const

const INCLUDE_DETAIL = {
  client: {
    select: {
      id: true, firstName: true, lastName: true, email: true,
      phone: true, mobile: true, birthDate: true,
      maritalStatus: true, marriageRegime: true, numberOfChildren: true,
      profession: true, professionCategory: true, annualIncome: true,
      riskProfile: true, investmentHorizon: true,
      totalActifs: true, totalPassifs: true, patrimoineNet: true,
      totalRevenus: true, totalCharges: true, capaciteEpargne: true,
      tauxEndettement: true, status: true, kycStatus: true,
      ifiSubject: true, ifiAmount: true, irTaxRate: true,
      wealth: true,
    },
  },
  conseiller: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
} as const

// ── Service ──

export class EntretienService {
  private cabinetId: string
  private userId: string
  private isSuperAdmin: boolean

  constructor(cabinetId: string, userId: string, isSuperAdmin = false) {
    this.cabinetId = cabinetId
    this.userId = userId
    this.isSuperAdmin = isSuperAdmin
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────────────────────────────────────

  async listEntretiens(filters: EntretienFilters = {}) {
    const where: Record<string, unknown> = { cabinetId: this.cabinetId }

    if (filters.clientId) where.clientId = filters.clientId
    if (filters.conseillerId) where.conseillerId = filters.conseillerId
    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type

    if (filters.search) {
      where.OR = [
        { titre: { contains: filters.search, mode: 'insensitive' } },
        { prospectNom: { contains: filters.search, mode: 'insensitive' } },
        { prospectPrenom: { contains: filters.search, mode: 'insensitive' } },
        { transcriptionBrute: { contains: filters.search, mode: 'insensitive' } },
        { notesConseiller: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (filters.dateFrom) dateFilter.gte = filters.dateFrom
      if (filters.dateTo) dateFilter.lte = filters.dateTo
      where.dateEntretien = dateFilter
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    const orderBy: Record<string, string> = {}
    orderBy[filters.sortBy || 'dateEntretien'] = filters.sortOrder || 'desc'

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const [entretiens, total] = await Promise.all([
      prisma.entretien.findMany({
        where: where as any,
        orderBy,
        take: limit,
        skip: offset,
        include: INCLUDE_LIST as any,
      }),
      prisma.entretien.count({ where: where as any }),
    ])

    return { data: entretiens, total, limit, offset }
  }

  async getEntretien(id: string) {
    const entretien = await prisma.entretien.findFirst({
      where: { id, cabinetId: this.cabinetId },
      include: INCLUDE_DETAIL as any,
    })
    if (!entretien) throw new Error('Entretien non trouvé')
    return entretien
  }

  async createEntretien(input: CreateEntretienInput) {
    return prisma.entretien.create({
      data: {
        cabinetId: this.cabinetId,
        conseillerId: this.userId,
        titre: input.titre,
        type: input.type || 'DECOUVERTE',
        status: 'EN_COURS',
        clientId: input.clientId || null,
        prospectNom: input.prospectNom,
        prospectPrenom: input.prospectPrenom,
        prospectEmail: input.prospectEmail,
        prospectTel: input.prospectTel,
        consentementRecueilli: input.consentementRecueilli || false,
        consentementDate: input.consentementDate,
        consentementTexte: input.consentementTexte,
        dateEntretien: input.dateEntretien || new Date(),
        tags: input.tags || [],
        notesConseiller: input.notesConseiller,
      },
      include: INCLUDE_LIST as any,
    })
  }

  async updateEntretien(id: string, input: UpdateEntretienInput) {
    const existing = await prisma.entretien.findFirst({
      where: { id, cabinetId: this.cabinetId },
    })
    if (!existing) throw new Error('Entretien non trouvé')

    return prisma.entretien.update({
      where: { id },
      data: input as any,
      include: INCLUDE_LIST as any,
    })
  }

  async deleteEntretien(id: string) {
    const existing = await prisma.entretien.findFirst({
      where: { id, cabinetId: this.cabinetId },
    })
    if (!existing) throw new Error('Entretien non trouvé')
    return prisma.entretien.delete({ where: { id } })
  }

  // ────────────────────────────────────────────────────────────────────────────
  // BRIEF CLIENT — Contexte complet avant un entretien
  // ────────────────────────────────────────────────────────────────────────────

  async getClientBrief(clientId: string) {
    const [client, lastEntretiens, allEntretiens] = await Promise.all([
      prisma.client.findFirst({
        where: { id: clientId, cabinetId: this.cabinetId },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phone: true, mobile: true, birthDate: true,
          maritalStatus: true, marriageRegime: true, numberOfChildren: true,
          profession: true, professionCategory: true, annualIncome: true,
          riskProfile: true, investmentHorizon: true,
          totalActifs: true, totalPassifs: true, patrimoineNet: true,
          totalRevenus: true, totalCharges: true, capaciteEpargne: true,
          tauxEndettement: true, status: true, kycStatus: true,
          ifiSubject: true, ifiAmount: true, irTaxRate: true,
          wealth: true, lastContactDate: true, createdAt: true,
          investmentGoals: true,
        },
      }),
      prisma.entretien.findMany({
        where: { clientId, cabinetId: this.cabinetId },
        orderBy: { dateEntretien: 'desc' },
        take: 5,
        select: {
          id: true, titre: true, type: true, status: true,
          dateEntretien: true, duree: true, traitementType: true,
          traitementResultat: true, tags: true, notesConseiller: true,
        },
      }),
      prisma.entretien.findMany({
        where: { clientId, cabinetId: this.cabinetId, traitementResultat: { not: null as any } },
        orderBy: { dateEntretien: 'desc' },
        select: { traitementType: true, traitementResultat: true, dateEntretien: true },
      }),
    ])

    if (!client) throw new Error('Client non trouvé')

    // Extraire les actions en attente des derniers entretiens
    const actionsEnAttente: any[] = []
    for (const e of lastEntretiens) {
      if (!e.traitementResultat) continue
      const result = e.traitementResultat as any
      if (result.actionsASuivre) {
        for (const action of result.actionsASuivre) {
          actionsEnAttente.push({
            ...action,
            entretienId: e.id,
            entretienTitre: e.titre,
            dateEntretien: e.dateEntretien,
          })
        }
      }
    }

    // Dernière situation patrimoniale connue (depuis le dernier bilan)
    const dernierBilan = allEntretiens.find(e => e.traitementType === 'BILAN_PATRIMONIAL')
    const situationPatrimoniale = dernierBilan?.traitementResultat || null

    // Points de vigilance
    const alertes: string[] = []
    if (client.kycStatus !== 'COMPLET') alertes.push(`KYC non validé (${client.kycStatus})`)
    if (client.ifiSubject && !client.ifiAmount) alertes.push('IFI déclaré mais montant inconnu')
    if (!client.riskProfile) alertes.push('Profil de risque non renseigné (MiFID II)')
    if (!client.investmentHorizon) alertes.push('Horizon d\'investissement non renseigné')
    const lastContact = client.lastContactDate || lastEntretiens[0]?.dateEntretien
    if (lastContact) {
      const daysSince = Math.floor((Date.now() - new Date(lastContact).getTime()) / 86400000)
      if (daysSince > 180) alertes.push(`Dernier contact il y a ${daysSince} jours`)
    }

    return {
      client,
      dernierEntretien: lastEntretiens[0] || null,
      historiqueEntretiens: lastEntretiens,
      actionsEnAttente,
      situationPatrimoniale,
      alertes,
      stats: {
        totalEntretiens: lastEntretiens.length,
        dernierContact: lastContact,
      },
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ACTIONS EN ATTENTE — Suivi transversal
  // ────────────────────────────────────────────────────────────────────────────

  async getActionsEnAttente(filters: { conseillerId?: string; clientId?: string } = {}) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      traitementResultat: { not: null as any },
    }
    if (filters.conseillerId) where.conseillerId = filters.conseillerId
    if (filters.clientId) where.clientId = filters.clientId

    const entretiens = await prisma.entretien.findMany({
      where: where as any,
      orderBy: { dateEntretien: 'desc' },
      select: {
        id: true, titre: true, dateEntretien: true,
        traitementType: true, traitementResultat: true,
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const actions: any[] = []
    for (const e of entretiens) {
      const result = e.traitementResultat as any
      if (!result?.actionsASuivre) continue
      for (const action of result.actionsASuivre) {
        actions.push({
          action: action.action,
          responsable: action.responsable,
          echeance: action.echeance || null,
          entretienId: e.id,
          entretienTitre: e.titre,
          dateEntretien: e.dateEntretien,
          clientId: e.client?.id,
          clientNom: e.client ? `${e.client.firstName} ${e.client.lastName}` : null,
        })
      }
    }

    return { actions, total: actions.length }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RECHERCHE CROSS-ENTRETIENS
  // ────────────────────────────────────────────────────────────────────────────

  async searchTranscriptions(query: string, options: { clientId?: string; limit?: number } = {}) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      transcriptionBrute: { contains: query, mode: 'insensitive' },
    }
    if (options.clientId) where.clientId = options.clientId

    const entretiens = await prisma.entretien.findMany({
      where: where as any,
      orderBy: { dateEntretien: 'desc' },
      take: options.limit || 20,
      select: {
        id: true, titre: true, dateEntretien: true, type: true,
        transcription: true, transcriptionBrute: true,
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Extraire les segments contenant le terme recherché
    const results = entretiens.map(e => {
      const segments = Array.isArray(e.transcription) ? e.transcription as any[] : []
      const matchingSegments = segments.filter((s: any) =>
        s.text?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3) // Max 3 extraits par entretien

      return {
        entretienId: e.id,
        titre: e.titre,
        dateEntretien: e.dateEntretien,
        type: e.type,
        clientNom: e.client ? `${e.client.firstName} ${e.client.lastName}` : null,
        extraits: matchingSegments.map((s: any) => ({
          speaker: s.speaker,
          text: s.text,
          timestamp: s.timestamp,
        })),
      }
    })

    return { results, total: results.length, query }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TIMELINE CLIENT — Historique complet des entretiens d'un client
  // ────────────────────────────────────────────────────────────────────────────

  async getClientTimeline(clientId: string) {
    const entretiens = await prisma.entretien.findMany({
      where: { clientId, cabinetId: this.cabinetId },
      orderBy: { dateEntretien: 'desc' },
      select: {
        id: true, titre: true, type: true, status: true,
        dateEntretien: true, duree: true,
        traitementType: true, traitementResultat: true,
        tags: true, notesConseiller: true,
        transcription: true,
        conseiller: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return entretiens.map(e => {
      const segments = Array.isArray(e.transcription) ? e.transcription as any[] : []
      const wordCount = segments.reduce((sum: number, s: any) => sum + (s.text?.split(/\s+/).length || 0), 0)
      const conseillerSegs = segments.filter((s: any) => s.speaker === 'conseiller')
      const clientSegs = segments.filter((s: any) => s.speaker === 'client')

      // Extraire score de complétude si bilan
      let scoreCompletude = null
      if (e.traitementType === 'BILAN_PATRIMONIAL') {
        scoreCompletude = (e.traitementResultat as any)?.scoreCompletude ?? null
      }

      // Extraire nombre d'actions
      let nbActions = 0
      const result = e.traitementResultat as any
      if (result?.actionsASuivre) nbActions = result.actionsASuivre.length

      return {
        id: e.id,
        titre: e.titre,
        type: e.type,
        status: e.status,
        dateEntretien: e.dateEntretien,
        duree: e.duree,
        traitementType: e.traitementType,
        tags: e.tags,
        notesConseiller: e.notesConseiller,
        conseiller: e.conseiller,
        analytics: {
          totalSegments: segments.length,
          wordCount,
          conseillerSegments: conseillerSegs.length,
          clientSegments: clientSegs.length,
          ratioParole: segments.length > 0 ? Math.round((clientSegs.length / segments.length) * 100) : 0,
          scoreCompletude,
          nbActions,
        },
      }
    })
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STATS ENRICHIES
  // ────────────────────────────────────────────────────────────────────────────

  async getStats(filters: { conseillerId?: string } = {}) {
    const where: Record<string, unknown> = { cabinetId: this.cabinetId }
    if (filters.conseillerId) where.conseillerId = filters.conseillerId

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400000)
    const monthAgo = new Date(now.getTime() - 30 * 86400000)
    const prevMonthStart = new Date(now.getTime() - 60 * 86400000)

    const [total, byStatus, byType, avgDuree, thisWeek, thisMonth, prevMonth, recentWithActions] = await Promise.all([
      prisma.entretien.count({ where: where as any }),
      prisma.entretien.groupBy({
        by: ['status'],
        where: where as any,
        _count: { id: true },
      }),
      prisma.entretien.groupBy({
        by: ['type'],
        where: where as any,
        _count: { id: true },
      }),
      prisma.entretien.aggregate({
        where: { ...where as any, duree: { not: null } },
        _avg: { duree: true },
      }),
      prisma.entretien.count({
        where: { ...where as any, dateEntretien: { gte: weekAgo } },
      }),
      prisma.entretien.count({
        where: { ...where as any, dateEntretien: { gte: monthAgo } },
      }),
      prisma.entretien.count({
        where: { ...where as any, dateEntretien: { gte: prevMonthStart, lt: monthAgo } },
      }),
      prisma.entretien.findMany({
        where: { ...where as any, traitementResultat: { not: null as any } },
        orderBy: { dateEntretien: 'desc' },
        take: 50,
        select: { traitementResultat: true },
      }),
    ])

    // Compter les actions en attente
    let totalActions = 0
    for (const e of recentWithActions) {
      const r = e.traitementResultat as any
      if (r?.actionsASuivre) totalActions += r.actionsASuivre.length
    }

    // Tendance mensuelle
    const tendance = prevMonth > 0
      ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100)
      : thisMonth > 0 ? 100 : 0

    return {
      total,
      thisWeek,
      thisMonth,
      tendance,
      avgDureeMinutes: avgDuree._avg.duree ? Math.round(avgDuree._avg.duree / 60) : 0,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      byType: Object.fromEntries(byType.map(t => [t.type, t._count.id])),
      actionsEnAttente: totalActions,
      tauxTraitement: total > 0
        ? Math.round((((byStatus.find(s => s.status === 'TRAITE')?._count.id || 0) + (byStatus.find(s => s.status === 'FINALISE')?._count.id || 0)) / total) * 100)
        : 0,
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CONTEXTE IA — Injecter le contexte client dans le prompt
  // ────────────────────────────────────────────────────────────────────────────

  async buildClientContextForAI(clientId: string | null): Promise<string> {
    if (!clientId) return ''

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      select: {
        firstName: true, lastName: true, birthDate: true,
        maritalStatus: true, marriageRegime: true, numberOfChildren: true,
        profession: true, annualIncome: true,
        riskProfile: true, investmentHorizon: true,
        totalActifs: true, totalPassifs: true, patrimoineNet: true,
        ifiSubject: true, irTaxRate: true,
        investmentGoals: true,
      },
    })

    if (!client) return ''

    const lines: string[] = ['--- CONTEXTE CLIENT EXISTANT ---']
    lines.push(`Nom : ${client.firstName} ${client.lastName}`)
    if (client.birthDate) lines.push(`Naissance : ${new Date(client.birthDate).toLocaleDateString('fr-FR')}`)
    if (client.maritalStatus) lines.push(`Situation : ${client.maritalStatus}`)
    if (client.marriageRegime) lines.push(`Régime matrimonial : ${client.marriageRegime}`)
    if (client.numberOfChildren) lines.push(`Enfants : ${client.numberOfChildren}`)
    if (client.profession) lines.push(`Profession : ${client.profession}`)
    if (client.annualIncome) lines.push(`Revenu annuel : ${Number(client.annualIncome).toLocaleString('fr-FR')} €`)
    if (client.patrimoineNet) lines.push(`Patrimoine net : ${Number(client.patrimoineNet).toLocaleString('fr-FR')} €`)
    if (client.totalActifs) lines.push(`Total actifs : ${Number(client.totalActifs).toLocaleString('fr-FR')} €`)
    if (client.totalPassifs) lines.push(`Total passifs : ${Number(client.totalPassifs).toLocaleString('fr-FR')} €`)
    if (client.riskProfile) lines.push(`Profil de risque : ${client.riskProfile}`)
    if (client.investmentHorizon) lines.push(`Horizon : ${client.investmentHorizon}`)
    if (client.ifiSubject) lines.push('Assujetti IFI')
    if (client.irTaxRate) lines.push(`TMI estimé : ${client.irTaxRate}%`)
    lines.push('--- FIN CONTEXTE ---')

    return lines.join('\n')
  }
}
