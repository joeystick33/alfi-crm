// ============================================================================
// Registre des traitements RGPD — Art. 30
//
// Obligations :
//   • Tout responsable de traitement doit tenir un registre des activités
//     de traitement effectuées sous sa responsabilité.
//   • Le registre doit contenir : finalité, base juridique, catégories de données,
//     destinataires, transferts hors UE, durées de conservation, mesures de sécurité.
//   • Le registre doit être tenu à disposition de la CNIL sur demande.
//
// Ce service gère un registre persistant par cabinet, pré-peuplé avec les
// traitements standard d'un CRM CGP, et modifiable par l'admin cabinet.
// ============================================================================

import { getPrismaClient } from '../prisma'
import { logger } from '../logger'
import type { DataProcessingLegalBasis } from '@prisma/client'

// ── TYPES ──────────────────────────────────────────────────────────────────

interface SeedTreatment {
  code: string
  purpose: string
  description: string
  legalBasis: DataProcessingLegalBasis
  legalBasisDetail: string
  dataCategories: string[]
  dataSensitive: boolean
  dataSubjects: string[]
  retentionDuration: string
  retentionBasis: string
  recipients: string[]
  subProcessors: string[]
  transfers: string[]
  transferSafeguards: string | null
  securityMeasures: string[]
  aipdRequired: boolean
}

export interface RegistryUpdateInput {
  purpose?: string
  description?: string
  legalBasis?: DataProcessingLegalBasis
  legalBasisDetail?: string
  dataCategories?: string[]
  dataSensitive?: boolean
  dataSubjects?: string[]
  retentionDuration?: string
  retentionBasis?: string
  recipients?: string[]
  subProcessors?: string[]
  transfers?: string[]
  transferSafeguards?: string | null
  securityMeasures?: string[]
  aipdRequired?: boolean
  aipdDate?: Date | null
  aipdReference?: string | null
  isActive?: boolean
}

// ── TRAITEMENTS STANDARD CGP ────────────────────────────────────────────

const DEFAULT_TREATMENTS: SeedTreatment[] = [
  {
    code: 'T-001',
    purpose: 'Gestion de la relation client (CRM)',
    description: 'Collecte et traitement des données d\'identité, de contact et de situation familiale/professionnelle pour la gestion de la relation commerciale avec les clients et prospects du cabinet.',
    legalBasis: 'EXECUTION_CONTRAT',
    legalBasisDetail: 'Art. 6.1.b RGPD — Exécution du contrat de conseil en gestion de patrimoine',
    dataCategories: ['Identité (nom, prénom, date de naissance)', 'Coordonnées (email, téléphone, adresse)', 'Situation familiale', 'Situation professionnelle'],
    dataSensitive: false,
    dataSubjects: ['Clients', 'Prospects'],
    retentionDuration: 'Durée de la relation + 5 ans',
    retentionBasis: 'Prescription civile (art. 2224 Code civil)',
    recipients: ['Conseillers du cabinet', 'Assistants du cabinet'],
    subProcessors: ['Supabase (hébergement BDD, UE)', 'Vercel (hébergement applicatif, UE)'],
    transfers: ['Aucun transfert hors UE'],
    transferSafeguards: null,
    securityMeasures: ['Chiffrement en transit (TLS 1.3)', 'Chiffrement au repos (AES-256)', 'Isolation multi-tenant (RLS PostgreSQL)', 'Authentification forte (Supabase Auth)', 'Contrôle d\'accès RBAC', 'Journalisation des accès (audit log)'],
    aipdRequired: false,
  },
  {
    code: 'T-002',
    purpose: 'Conseil en gestion de patrimoine (DDA/MiFID II)',
    description: 'Collecte et traitement des données patrimoniales, financières et du profil investisseur pour le devoir de conseil et le test d\'adéquation conformément aux obligations DDA/IDD et MiFID II.',
    legalBasis: 'OBLIGATION_LEGALE',
    legalBasisDetail: 'Art. 6.1.c RGPD — Obligations AMF/ACPR (DDA art. L. 522-5 CMF, MiFID II art. 25)',
    dataCategories: ['Patrimoine (immobilier, financier, professionnel)', 'Revenus et charges', 'Objectifs financiers', 'Profil investisseur (MiFID II)', 'Horizon d\'investissement', 'Tolérance au risque'],
    dataSensitive: false,
    dataSubjects: ['Clients'],
    retentionDuration: '5 ans après fin de la relation',
    retentionBasis: 'L. 561-12 Code monétaire et financier',
    recipients: ['Conseillers du cabinet', 'AMF/ACPR en cas de contrôle'],
    subProcessors: ['Supabase (hébergement BDD, UE)'],
    transfers: ['Aucun transfert hors UE'],
    transferSafeguards: null,
    securityMeasures: ['Chiffrement BDD', 'RLS multi-tenant', 'Contrôle d\'accès RBAC', 'Historisation des questionnaires MiFID II', 'Audit trail des modifications'],
    aipdRequired: false,
  },
  {
    code: 'T-003',
    purpose: 'Lutte contre le blanchiment et financement du terrorisme (LCB-FT)',
    description: 'Collecte et traitement des données d\'identité, documents KYC, origine des fonds et statut PPE pour les obligations de vigilance LCB-FT.',
    legalBasis: 'OBLIGATION_LEGALE',
    legalBasisDetail: 'Art. 6.1.c RGPD — L. 561-1 et suivants Code monétaire et financier',
    dataCategories: ['Identité (pièces justificatives)', 'Documents KYC', 'Origine des fonds', 'Statut PPE (Personne Politiquement Exposée)', 'Pays de résidence fiscale', 'Scoring risque LCB-FT'],
    dataSensitive: false,
    dataSubjects: ['Clients', 'Bénéficiaires effectifs', 'Membres de famille (PPE)'],
    retentionDuration: '5 ans après fin de la relation',
    retentionBasis: 'L. 561-12 Code monétaire et financier',
    recipients: ['Conseillers habilités du cabinet', 'TRACFIN (en cas de déclaration de soupçon)'],
    subProcessors: ['Supabase (hébergement BDD, UE)'],
    transfers: ['Aucun transfert hors UE'],
    transferSafeguards: null,
    securityMeasures: ['Chiffrement documents KYC', 'Accès restreint aux données KYC', 'Scoring automatisé avec drapeaux d\'alerte', 'Audit log exhaustif', 'Suppression sécurisée après expiration'],
    aipdRequired: false,
  },
  {
    code: 'T-004',
    purpose: 'Transcription d\'entretiens par reconnaissance vocale',
    description: 'Transcription en temps réel des entretiens client-conseiller par reconnaissance vocale (speech-to-text) avec diarisation multi-locuteurs. Aucun fichier audio n\'est conservé, seule la transcription texte est stockée.',
    legalBasis: 'CONSENTEMENT',
    legalBasisDetail: 'Art. 6.1.a RGPD — Consentement explicite recueilli avant chaque enregistrement',
    dataCategories: ['Voix (transcription texte uniquement)', 'Contenu conversationnel patrimonial', 'Identification locuteurs'],
    dataSensitive: true,
    dataSubjects: ['Clients', 'Prospects', 'Conseillers'],
    retentionDuration: 'Durée de la relation, supprimé sur demande d\'effacement',
    retentionBasis: 'Art. 17 RGPD — Droit à l\'effacement',
    recipients: ['Conseiller ayant mené l\'entretien'],
    subProcessors: ['Navigateur Web (Web Speech API, local)', 'Ollama (IA locale, pas de transfert)'],
    transfers: ['Aucun — traitement 100% local (Ollama) ou Mistral Cloud (serveurs UE, DPA signé)'],
    transferSafeguards: 'DPA Mistral AI conforme RGPD (serveurs UE)',
    securityMeasures: ['Consentement explicite préalable obligatoire', 'Pas de stockage audio', 'Chiffrement transcription en BDD', 'Suppression sur demande d\'effacement', 'Accès limité au conseiller de l\'entretien'],
    aipdRequired: true,
  },
  {
    code: 'T-005',
    purpose: 'Intelligence artificielle — Analyse et suggestions patrimoniales',
    description: 'Utilisation de modèles d\'IA (LLM) pour analyser les données patrimoniales agrégées et proposer des suggestions de conseil, des alertes fiscales et des optimisations.',
    legalBasis: 'INTERET_LEGITIME',
    legalBasisDetail: 'Art. 6.1.f RGPD — Intérêt légitime du responsable de traitement pour l\'amélioration de la qualité du conseil',
    dataCategories: ['Données patrimoniales agrégées (pas de données nominatives dans les prompts)', 'Profil investisseur', 'Situation fiscale synthétique'],
    dataSensitive: false,
    dataSubjects: ['Clients (données agrégées)'],
    retentionDuration: 'Cache temporaire (5 min), résultats liés au dossier client',
    retentionBasis: 'Minimisation des données (Art. 5.1.c RGPD)',
    recipients: ['Conseiller du client'],
    subProcessors: ['Ollama (IA locale, aucun transfert)', 'Mistral Cloud (UE, DPA signé)'],
    transfers: ['Aucun — traitement local (Ollama) ou UE (Mistral Cloud)'],
    transferSafeguards: 'DPA Mistral AI conforme RGPD (serveurs UE)',
    securityMeasures: ['Anonymisation/agrégation des données dans les prompts', 'Rate limiting par cabinet', 'Cache LRU avec TTL court', 'Pas de fine-tuning sur données client', 'Logs IA sans données personnelles'],
    aipdRequired: true,
  },
  {
    code: 'T-006',
    purpose: 'Campagnes marketing et communication commerciale',
    description: 'Envoi de communications marketing (email, SMS) aux clients et prospects ayant donné leur consentement granulaire par canal.',
    legalBasis: 'CONSENTEMENT',
    legalBasisDetail: 'Art. 6.1.a RGPD pour prospection, Intérêt légitime (Art. 6.1.f) pour clients existants (produits similaires)',
    dataCategories: ['Email', 'Prénom', 'Nom', 'Préférences de communication'],
    dataSensitive: false,
    dataSubjects: ['Clients', 'Prospects ayant donné leur consentement'],
    retentionDuration: 'Jusqu\'au retrait du consentement',
    retentionBasis: 'Art. 7.3 RGPD — Droit de retrait du consentement',
    recipients: ['Provider email (via intégration cabinet)'],
    subProcessors: ['Gmail/Outlook (selon intégration cabinet)'],
    transfers: ['Selon provider email du cabinet (DPA requis)'],
    transferSafeguards: 'DPA avec chaque provider email',
    securityMeasures: ['Consentement granulaire par canal', 'Désabonnement one-click', 'Preuve de consentement (IP, date, source)', 'Suppression liste sur retrait'],
    aipdRequired: false,
  },
  {
    code: 'T-007',
    purpose: 'Gestion des réclamations clients (ACPR)',
    description: 'Traitement des réclamations clients conformément à la recommandation ACPR 2022-R-01 avec suivi SLA, escalade médiateur et historisation.',
    legalBasis: 'OBLIGATION_LEGALE',
    legalBasisDetail: 'Art. 6.1.c RGPD — Recommandation ACPR 2022-R-01, Art. L. 616-1 Code de la consommation',
    dataCategories: ['Identité client réclamant', 'Objet de la réclamation', 'Correspondance', 'Décisions et réponses'],
    dataSensitive: false,
    dataSubjects: ['Clients réclamants'],
    retentionDuration: '5 ans après clôture de la réclamation',
    retentionBasis: 'Recommandation ACPR 2022-R-01',
    recipients: ['Conseillers du cabinet', 'Médiateur AMF/ACPR en cas d\'escalade'],
    subProcessors: ['Supabase (hébergement BDD, UE)'],
    transfers: ['Aucun transfert hors UE'],
    transferSafeguards: null,
    securityMeasures: ['Accès restreint', 'SLA de traitement automatisé', 'Escalade automatique', 'Audit trail complet'],
    aipdRequired: false,
  },
  {
    code: 'T-008',
    purpose: 'Facturation et gestion des commissions',
    description: 'Traitement des données nécessaires à la facturation des honoraires de conseil et au suivi des commissions sur produits financiers/assurance.',
    legalBasis: 'EXECUTION_CONTRAT',
    legalBasisDetail: 'Art. 6.1.b RGPD — Exécution du contrat de conseil, Art. L. 123-22 Code de commerce',
    dataCategories: ['Identité client', 'Montants facturés', 'Commissions', 'Références bancaires'],
    dataSensitive: false,
    dataSubjects: ['Clients'],
    retentionDuration: '10 ans (pièces comptables)',
    retentionBasis: 'Art. L. 123-22 Code de commerce',
    recipients: ['Cabinet comptable', 'Administration fiscale en cas de contrôle'],
    subProcessors: ['Supabase (hébergement BDD, UE)'],
    transfers: ['Aucun transfert hors UE'],
    transferSafeguards: null,
    securityMeasures: ['Chiffrement BDD', 'Accès restreint aux données de facturation', 'Audit log'],
    aipdRequired: false,
  },
  {
    code: 'T-009',
    purpose: 'Signature électronique de documents',
    description: 'Collecte de signature électronique sur les documents réglementaires (lettre de mission, déclaration d\'adéquation, bulletin de souscription) via prestataires qualifiés.',
    legalBasis: 'EXECUTION_CONTRAT',
    legalBasisDetail: 'Art. 6.1.b RGPD — Exécution du contrat, Règlement eIDAS (UE) 910/2014',
    dataCategories: ['Identité signataire', 'Signature électronique', 'Horodatage', 'Adresse IP'],
    dataSensitive: false,
    dataSubjects: ['Clients', 'Conseillers'],
    retentionDuration: 'Durée de validité du document + 5 ans',
    retentionBasis: 'Prescription civile + obligations AMF',
    recipients: ['Prestataire de signature (Yousign/DocuSign/Universign)'],
    subProcessors: ['Yousign (UE)', 'DocuSign (DPA + CCT)', 'Universign (UE)'],
    transfers: ['DocuSign : USA avec CCT (Clauses Contractuelles Types)'],
    transferSafeguards: 'CCT approuvées par la Commission européenne (DocuSign)',
    securityMeasures: ['Signature qualifiée eIDAS', 'Horodatage certifié', 'Scellé d\'intégrité', 'Conservation probante'],
    aipdRequired: false,
  },
  {
    code: 'T-010',
    purpose: 'Synchronisation calendrier et rendez-vous',
    description: 'Synchronisation bidirectionnelle des rendez-vous avec les calendriers Google/Outlook des conseillers, et page de booking client.',
    legalBasis: 'EXECUTION_CONTRAT',
    legalBasisDetail: 'Art. 6.1.b RGPD — Gestion de la relation client (prise de rendez-vous)',
    dataCategories: ['Nom du client', 'Date/heure du rendez-vous', 'Objet du rendez-vous', 'Email'],
    dataSensitive: false,
    dataSubjects: ['Clients', 'Prospects', 'Conseillers'],
    retentionDuration: '3 ans après le rendez-vous',
    retentionBasis: 'Prescription commerciale (art. L. 110-4 Code de commerce)',
    recipients: ['Google Calendar / Microsoft Outlook (selon intégration)'],
    subProcessors: ['Google (DPA)', 'Microsoft (DPA)'],
    transfers: ['Google/Microsoft : USA avec DPA + CCT'],
    transferSafeguards: 'DPA Google Workspace / Microsoft 365 avec CCT',
    securityMeasures: ['Tokens OAuth chiffrés (AES-256-GCM)', 'Refresh token rotation', 'Accès minimum requis (scopes calendrier uniquement)'],
    aipdRequired: false,
  },
]

// ── SERVICE ────────────────────────────────────────────────────────────────

export class DataProcessingRegistryService {

  /**
   * Initialise le registre d'un cabinet avec les traitements standard.
   * Idempotent — ne crée pas les traitements déjà existants.
   */
  static async seedRegistry(cabinetId: string, userId?: string) {
    const prisma = getPrismaClient(cabinetId)
    const now = new Date()
    const nextReview = new Date(now)
    nextReview.setFullYear(nextReview.getFullYear() + 1) // Revue annuelle

    let created = 0
    let skipped = 0

    for (const t of DEFAULT_TREATMENTS) {
      const existing = await prisma.dataProcessingRegistry.findUnique({
        where: { cabinetId_code: { cabinetId, code: t.code } },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.dataProcessingRegistry.create({
        data: {
          cabinetId,
          code: t.code,
          purpose: t.purpose,
          description: t.description,
          legalBasis: t.legalBasis,
          legalBasisDetail: t.legalBasisDetail,
          dataCategories: t.dataCategories,
          dataSensitive: t.dataSensitive,
          dataSubjects: t.dataSubjects,
          retentionDuration: t.retentionDuration,
          retentionBasis: t.retentionBasis,
          recipients: t.recipients,
          subProcessors: t.subProcessors,
          transfers: t.transfers,
          transferSafeguards: t.transferSafeguards,
          securityMeasures: t.securityMeasures,
          aipdRequired: t.aipdRequired,
          lastReviewDate: now,
          nextReviewDate: nextReview,
          createdBy: userId || null,
        },
      })
      created++
    }

    logger.info('RGPD: Registry seeded', {
      module: 'GDPR',
      action: 'REGISTRY_SEED',
      metadata: { cabinetId, created, skipped } as any,
    })

    return { created, skipped, total: DEFAULT_TREATMENTS.length }
  }

  /**
   * Récupère le registre complet d'un cabinet.
   */
  static async getRegistry(cabinetId: string) {
    const prisma = getPrismaClient(cabinetId)

    const treatments = await prisma.dataProcessingRegistry.findMany({
      where: { cabinetId },
      orderBy: { code: 'asc' },
    })

    // Si aucun traitement, on seed automatiquement
    if (treatments.length === 0) {
      await this.seedRegistry(cabinetId)
      return prisma.dataProcessingRegistry.findMany({
        where: { cabinetId },
        orderBy: { code: 'asc' },
      })
    }

    return treatments
  }

  /**
   * Récupère un traitement spécifique.
   */
  static async getTreatment(cabinetId: string, code: string) {
    const prisma = getPrismaClient(cabinetId)
    return prisma.dataProcessingRegistry.findUnique({
      where: { cabinetId_code: { cabinetId, code } },
    })
  }

  /**
   * Met à jour un traitement existant.
   */
  static async updateTreatment(cabinetId: string, code: string, data: RegistryUpdateInput) {
    const prisma = getPrismaClient(cabinetId)

    const existing = await prisma.dataProcessingRegistry.findUnique({
      where: { cabinetId_code: { cabinetId, code } },
    })
    if (!existing) {
      throw new Error(`Traitement ${code} non trouvé`)
    }

    return prisma.dataProcessingRegistry.update({
      where: { cabinetId_code: { cabinetId, code } },
      data: {
        ...data,
        dataCategories: data.dataCategories ?? undefined,
        dataSubjects: data.dataSubjects ?? undefined,
        recipients: data.recipients ?? undefined,
        subProcessors: data.subProcessors ?? undefined,
        transfers: data.transfers ?? undefined,
        securityMeasures: data.securityMeasures ?? undefined,
      },
    })
  }

  /**
   * Ajoute un traitement personnalisé au registre.
   */
  static async addTreatment(cabinetId: string, userId: string, data: SeedTreatment) {
    const prisma = getPrismaClient(cabinetId)
    const now = new Date()
    const nextReview = new Date(now)
    nextReview.setFullYear(nextReview.getFullYear() + 1)

    return prisma.dataProcessingRegistry.create({
      data: {
        cabinetId,
        code: data.code,
        purpose: data.purpose,
        description: data.description,
        legalBasis: data.legalBasis,
        legalBasisDetail: data.legalBasisDetail,
        dataCategories: data.dataCategories,
        dataSensitive: data.dataSensitive,
        dataSubjects: data.dataSubjects,
        retentionDuration: data.retentionDuration,
        retentionBasis: data.retentionBasis,
        recipients: data.recipients,
        subProcessors: data.subProcessors,
        transfers: data.transfers,
        transferSafeguards: data.transferSafeguards,
        securityMeasures: data.securityMeasures,
        aipdRequired: data.aipdRequired,
        lastReviewDate: now,
        nextReviewDate: nextReview,
        createdBy: userId,
      },
    })
  }

  /**
   * Marque un traitement comme revu (met à jour lastReviewDate et décale nextReviewDate d'1 an).
   */
  static async markReviewed(cabinetId: string, code: string) {
    const prisma = getPrismaClient(cabinetId)
    const now = new Date()
    const nextReview = new Date(now)
    nextReview.setFullYear(nextReview.getFullYear() + 1)

    return prisma.dataProcessingRegistry.update({
      where: { cabinetId_code: { cabinetId, code } },
      data: {
        lastReviewDate: now,
        nextReviewDate: nextReview,
      },
    })
  }

  /**
   * Génère un résumé du registre pour la CNIL / audit.
   */
  static async getRegistrySummary(cabinetId: string) {
    const treatments = await this.getRegistry(cabinetId)
    const now = new Date()

    const active = treatments.filter(t => t.isActive)
    const inactive = treatments.filter(t => !t.isActive)
    const withAIPD = treatments.filter(t => t.aipdRequired)
    const aipdDone = withAIPD.filter(t => t.aipdDate !== null)
    const aipdPending = withAIPD.filter(t => t.aipdDate === null)
    const overdue = treatments.filter(t => t.nextReviewDate && t.nextReviewDate < now)
    const sensitive = treatments.filter(t => t.dataSensitive)

    const legalBasisBreakdown: Record<string, number> = {}
    for (const t of active) {
      legalBasisBreakdown[t.legalBasis] = (legalBasisBreakdown[t.legalBasis] || 0) + 1
    }

    return {
      cabinetId,
      generatedAt: now,
      total: treatments.length,
      active: active.length,
      inactive: inactive.length,
      sensitiveTreatments: sensitive.length,
      aipd: {
        required: withAIPD.length,
        completed: aipdDone.length,
        pending: aipdPending.length,
        pendingCodes: aipdPending.map(t => t.code),
      },
      reviewStatus: {
        overdue: overdue.length,
        overdueCodes: overdue.map(t => t.code),
      },
      legalBasisBreakdown,
      treatments: active.map(t => ({
        code: t.code,
        purpose: t.purpose,
        legalBasis: t.legalBasis,
        dataSensitive: t.dataSensitive,
        retentionDuration: t.retentionDuration,
        lastReviewDate: t.lastReviewDate,
        nextReviewDate: t.nextReviewDate,
      })),
    }
  }
}
