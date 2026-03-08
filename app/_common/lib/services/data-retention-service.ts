// ============================================================================
// Data Retention Policy Service — Politiques de conservation des données
//
// Obligations légales CGP France 2025 :
//   • LCB-FT (L. 561-12 CMF) : 5 ans après fin de relation d'affaires
//   • RGPD (Art. 5-1-e) : Durée nécessaire aux finalités du traitement
//   • Fiscal (LPF Art. L. 169) : 6 ans (prescription fiscale)
//   • Commercial (Code civil Art. 2224) : 5 ans (prescription droit commun)
//   • ACPR Réclamation : 5 ans après clôture
//   • Comptable (Code commerce L. 123-22) : 10 ans
// ============================================================================

import { prisma } from '../prisma'
import { logger } from '../logger'

// ── POLITIQUES PAR DÉFAUT (conformes à la réglementation française CGP) ──

const DEFAULT_POLICIES = [
  {
    type: 'LCB_FT' as const,
    entityType: 'Client',
    description: 'Conservation des données client (KYC, vigilance) — 5 ans après fin de relation',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 561-12 Code Monétaire et Financier',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'LCB_FT' as const,
    entityType: 'KYCDocument',
    description: 'Documents KYC (pièces d\'identité, justificatifs) — 5 ans après fin de relation',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 561-12 CMF + Art. R. 561-12 CMF',
    autoAnonymize: false,
    autoDelete: true,
  },
  {
    type: 'LCB_FT' as const,
    entityType: 'LCBFTRiskAssessment',
    description: 'Évaluations risque blanchiment — 5 ans après fin de relation',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 561-12 CMF',
    autoAnonymize: false,
    autoDelete: false,
  },
  {
    type: 'FISCAL' as const,
    entityType: 'Revenue',
    description: 'Revenus et données fiscales client — 6 ans (prescription fiscale)',
    retentionYears: 6,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 169 Livre des Procédures Fiscales',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'FISCAL' as const,
    entityType: 'Expense',
    description: 'Charges et données fiscales client — 6 ans (prescription fiscale)',
    retentionYears: 6,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 169 LPF',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'FISCAL' as const,
    entityType: 'Simulation',
    description: 'Simulations fiscales et patrimoniales — 6 ans',
    retentionYears: 6,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 169 LPF',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'COMMERCIAL' as const,
    entityType: 'Contrat',
    description: 'Contrats d\'assurance et placements — 5 ans après résiliation',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Art. 2224 Code civil (prescription de droit commun)',
    autoAnonymize: false,
    autoDelete: false,
  },
  {
    type: 'ACPR_RECLAMATION' as const,
    entityType: 'Reclamation',
    description: 'Réclamations clients — 5 ans après clôture',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Recommandation ACPR 2022-R-02 + Art. L. 612-1 CMF',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'DOCUMENT_COMPTABLE' as const,
    entityType: 'Invoice',
    description: 'Factures et documents comptables — 10 ans',
    retentionYears: 10,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 123-22 Code de commerce',
    autoAnonymize: false,
    autoDelete: false,
  },
  {
    type: 'RGPD_GENERAL' as const,
    entityType: 'Consentement',
    description: 'Preuves de consentement RGPD — 3 ans après révocation',
    retentionYears: 3,
    retentionMonths: 0,
    baseJuridique: 'Art. 7 RGPD + Délibération CNIL 2019-160',
    autoAnonymize: false,
    autoDelete: true,
  },
  {
    type: 'RGPD_GENERAL' as const,
    entityType: 'Entretien',
    description: 'Enregistrements et transcriptions d\'entretiens — 3 ans',
    retentionYears: 3,
    retentionMonths: 0,
    baseJuridique: 'Art. 5-1-e RGPD (minimisation de la durée)',
    autoAnonymize: true,
    autoDelete: false,
  },
  {
    type: 'RGPD_GENERAL' as const,
    entityType: 'AuditLog',
    description: 'Journaux d\'audit — 3 ans',
    retentionYears: 3,
    retentionMonths: 0,
    baseJuridique: 'Art. 5-1-e RGPD',
    autoAnonymize: false,
    autoDelete: true,
  },
  {
    type: 'COMMERCIAL' as const,
    entityType: 'MiFIDQuestionnaire',
    description: 'Questionnaires MiFID II — 5 ans après fin de relation (traçabilité conseil)',
    retentionYears: 5,
    retentionMonths: 0,
    baseJuridique: 'Art. L. 533-15 CMF + Art. 314-48 RGAMF',
    autoAnonymize: false,
    autoDelete: false,
  },
]

export class DataRetentionService {

  /**
   * Initialise les politiques par défaut pour un cabinet.
   * Appelé lors de la création du cabinet ou manuellement.
   */
  static async initializeDefaultPolicies(cabinetId: string) {
    let created = 0

    for (const policy of DEFAULT_POLICIES) {
      const existing = await prisma.dataRetentionPolicy.findUnique({
        where: { cabinetId_type_entityType: { cabinetId, type: policy.type, entityType: policy.entityType } },
      })

      if (!existing) {
        await prisma.dataRetentionPolicy.create({
          data: {
            cabinetId,
            ...policy,
          },
        })
        created++
      }
    }

    logger.info('Data retention policies initialized', {
      module: 'DataRetention',
      action: 'INIT',
      metadata: { cabinetId, created, total: DEFAULT_POLICIES.length } as any,
    })

    return { created, total: DEFAULT_POLICIES.length }
  }

  /**
   * Récupère toutes les politiques d'un cabinet.
   */
  static async getPolicies(cabinetId: string) {
    return prisma.dataRetentionPolicy.findMany({
      where: { cabinetId, isActive: true },
      orderBy: [{ type: 'asc' }, { entityType: 'asc' }],
    })
  }

  /**
   * Identifie les données ayant dépassé leur durée de rétention.
   * Retourne un rapport sans effectuer de suppression.
   */
  static async auditRetention(cabinetId: string): Promise<{
    policies: Array<{
      entityType: string
      retentionYears: number
      baseJuridique: string
      expiredCount: number
      oldestExpired: Date | null
      action: string
    }>
    totalExpired: number
  }> {
    const policies = await this.getPolicies(cabinetId)
    const results: Array<{
      entityType: string
      retentionYears: number
      baseJuridique: string
      expiredCount: number
      oldestExpired: Date | null
      action: string
    }> = []

    let totalExpired = 0

    for (const policy of policies) {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears)
      cutoffDate.setMonth(cutoffDate.getMonth() - policy.retentionMonths)

      let expiredCount = 0
      let oldestExpired: Date | null = null

      // Vérifier chaque type d'entité (sans modifier)
      try {
        switch (policy.entityType) {
          case 'Client': {
            const archived = await prisma.client.findMany({
              where: { cabinetId, status: 'ARCHIVE', updatedAt: { lt: cutoffDate } },
              select: { updatedAt: true },
              orderBy: { updatedAt: 'asc' },
              take: 1,
            })
            expiredCount = await prisma.client.count({
              where: { cabinetId, status: 'ARCHIVE', updatedAt: { lt: cutoffDate } },
            })
            oldestExpired = archived[0]?.updatedAt || null
            break
          }
          case 'AuditLog': {
            expiredCount = await prisma.auditLog.count({
              where: { cabinetId, createdAt: { lt: cutoffDate } },
            })
            break
          }
          case 'Entretien': {
            expiredCount = await prisma.entretien.count({
              where: { cabinetId, dateEntretien: { lt: cutoffDate } },
            })
            break
          }
          case 'Reclamation': {
            expiredCount = await prisma.reclamation.count({
              where: { cabinetId, status: 'CLOTUREE', updatedAt: { lt: cutoffDate } },
            })
            break
          }
          default:
            // Pour les types non encore implémentés, on passe
            break
        }
      } catch {
        // Ignorer les erreurs de modèles non existants
      }

      totalExpired += expiredCount

      results.push({
        entityType: policy.entityType,
        retentionYears: policy.retentionYears,
        baseJuridique: policy.baseJuridique,
        expiredCount,
        oldestExpired,
        action: policy.autoDelete ? 'SUPPRESSION' : policy.autoAnonymize ? 'ANONYMISATION' : 'AUCUNE',
      })
    }

    return { policies: results, totalExpired }
  }

  /**
   * Retourne un résumé lisible des obligations de conservation.
   * Utile pour le registre RGPD et les contrôles ACPR/AMF.
   */
  static getObligationsSummary(): Array<{ categorie: string; duree: string; baseJuridique: string; entites: string[] }> {
    return [
      {
        categorie: 'LCB-FT / KYC',
        duree: '5 ans après fin de relation',
        baseJuridique: 'Art. L. 561-12 CMF',
        entites: ['Client (données KYC)', 'KYCDocument', 'KYCCheck', 'LCBFTRiskAssessment'],
      },
      {
        categorie: 'Fiscal',
        duree: '6 ans (prescription fiscale)',
        baseJuridique: 'Art. L. 169 LPF',
        entites: ['Revenue', 'Expense', 'Simulation', 'Actif (données fiscales)'],
      },
      {
        categorie: 'Conseil / MiFID II',
        duree: '5 ans après fin de relation',
        baseJuridique: 'Art. L. 533-15 CMF',
        entites: ['MiFIDQuestionnaire', 'AffaireNouvelle', 'RegulatoryGeneratedDocument'],
      },
      {
        categorie: 'Comptable',
        duree: '10 ans',
        baseJuridique: 'Art. L. 123-22 Code de commerce',
        entites: ['Invoice', 'Payment', 'Commission'],
      },
      {
        categorie: 'Réclamation ACPR',
        duree: '5 ans après clôture',
        baseJuridique: 'Recommandation ACPR 2022-R-02',
        entites: ['Reclamation', 'SLAEvent'],
      },
      {
        categorie: 'RGPD / Général',
        duree: '3 ans après fin de traitement',
        baseJuridique: 'Art. 5-1-e RGPD',
        entites: ['Consentement', 'Entretien (transcriptions)', 'AuditLog', 'MarketingConsent'],
      },
    ]
  }
}
