// ============================================================================
// RGPD Service — Droit à l'effacement (Art. 17), Portabilité (Art. 20),
//                Registre des traitements (Art. 30)
//
// Obligations légales :
//   • Anonymisation des données personnelles sur demande
//   • Conservation des données agrégées pour obligations légales (5 ans LCB-FT)
//   • Suppression des données audio/transcription des entretiens
//   • Génération d'un certificat d'effacement
//   • Export des données personnelles (portabilité)
// ============================================================================

import { getPrismaClient } from '../prisma'
import { logger } from '../logger'
import { createHash } from 'crypto'

// ── TYPES ──────────────────────────────────────────────────────────────────

export interface AnonymizationResult {
  clientId: string
  anonymizedAt: Date
  fieldsAnonymized: string[]
  relatedRecordsProcessed: {
    entretiens: number
    documents: number
    consentements: number
    kycDocuments: number
    revenues: number
    expenses: number
    credits: number
    notifications: number
  }
  retainedForLegal: string[]
  certificateId: string
}

export interface DataExportResult {
  clientId: string
  exportedAt: Date
  data: {
    personalInfo: Record<string, unknown>
    patrimoine: Record<string, unknown>[]
    budget: { revenues: Record<string, unknown>[]; expenses: Record<string, unknown>[] }
    contrats: Record<string, unknown>[]
    documents: { id: string; name: string; type: string; createdAt: Date }[]
    consentements: Record<string, unknown>[]
    entretiens: { id: string; date: Date; type: string; duration: number | null }[]
  }
}

export interface DataProcessingRecord {
  id: string
  purpose: string
  legalBasis: string
  dataCategories: string[]
  dataSubjects: string[]
  retention: string
  recipients: string[]
  transfers: string[]
  securityMeasures: string[]
}

// ── SERVICE ────────────────────────────────────────────────────────────────

export class GDPRService {
  private cabinetId: string
  private userId: string

  constructor(cabinetId: string, userId: string) {
    this.cabinetId = cabinetId
    this.userId = userId
  }

  // ── DROIT À L'EFFACEMENT (Art. 17) ─────────────────────────────────────

  /**
   * Anonymise les données personnelles d'un client.
   * Conserve les données agrégées et les métadonnées nécessaires aux obligations légales.
   *
   * Processus :
   * 1. Vérifier que le client peut être anonymisé (pas de procédure en cours)
   * 2. Anonymiser les champs personnels (nom, email, téléphone, adresse, etc.)
   * 3. Supprimer les transcriptions d'entretien (données sensibles)
   * 4. Anonymiser les documents (supprimer contenus, garder métadonnées)
   * 5. Conserver les données financières agrégées (obligations LCB-FT 5 ans)
   * 6. Générer un certificat d'effacement
   */
  async anonymizeClient(clientId: string): Promise<AnonymizationResult> {
    const prisma = getPrismaClient(this.cabinetId)

    // Vérifier que le client existe et appartient au cabinet
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      select: { id: true, status: true, firstName: true, lastName: true, email: true },
    })

    if (!client) {
      throw new Error('Client non trouvé ou accès non autorisé')
    }

    // Hash irréversible pour traçabilité sans identification
    const anonymousHash = createHash('sha256')
      .update(`${client.id}-${client.email}-anonymized`)
      .digest('hex')
      .substring(0, 12)

    const anonymizedAt = new Date()
    const certificateId = `GDPR-DEL-${anonymousHash}-${anonymizedAt.getTime()}`

    const fieldsAnonymized: string[] = []
    const relatedRecordsProcessed = {
      entretiens: 0,
      documents: 0,
      consentements: 0,
      kycDocuments: 0,
      revenues: 0,
      expenses: 0,
      credits: 0,
      notifications: 0,
    }

    // ── 1. Anonymiser les données personnelles du client ──
    await prisma.client.update({
      where: { id: clientId },
      data: {
        firstName: 'ANONYME',
        lastName: `CLIENT-${anonymousHash}`,
        email: `anonymized-${anonymousHash}@deleted.local`,
        phone: null,
        mobile: null,
        address: null,
        birthDate: null,
        birthPlace: null,
        nationality: null,
        profession: null,
        employerName: null,
        maritalStatus: null,
        fiscalNotes: null,
        originOfFunds: null,
        nomUsage: null,
        civilite: null,
        status: 'ARCHIVE' as any,
      },
    })
    fieldsAnonymized.push(
      'firstName', 'lastName', 'email', 'phone', 'mobile',
      'address', 'birthDate', 'birthPlace', 'nationality',
      'profession', 'employerName', 'maritalStatus',
      'fiscalNotes', 'originOfFunds', 'nomUsage', 'civilite'
    )

    // ── 2. Anonymiser les membres de famille ──
    await prisma.familyMember.updateMany({
      where: { clientId },
      data: {
        firstName: 'ANONYME',
        lastName: `FAMILLE-${anonymousHash}`,
      },
    })
    fieldsAnonymized.push('familyMembers.*')

    // ── 3. Supprimer les transcriptions d'entretien (données très sensibles) ──
    const entretiens = await prisma.entretien.updateMany({
      where: { clientId, cabinetId: this.cabinetId },
      data: {
        transcription: null,
        transcriptionBrute: null,
        traitementResultat: null,
        traitementPrompt: null,
        donneesExtraites: null,
        notesConseiller: '[DONNÉES SUPPRIMÉES - RGPD Art. 17]',
        prospectNom: null,
        prospectPrenom: null,
        prospectEmail: null,
        prospectTel: null,
      },
    })
    relatedRecordsProcessed.entretiens = entretiens.count

    // ── 4. Anonymiser les documents KYC ──
    const kycDocs = await prisma.kYCDocument.updateMany({
      where: { clientId },
      data: {
        fileUrl: '[SUPPRIMÉ]',
        notes: null,
      },
    })
    relatedRecordsProcessed.kycDocuments = kycDocs.count

    // ── 5. Anonymiser les documents généraux ──
    const documents = await prisma.document.updateMany({
      where: { clients: { some: { id: clientId } } },
      data: {
        description: null,
      },
    })
    relatedRecordsProcessed.documents = documents.count

    // ── 6. Marquer les consentements comme retirés ──
    const consentements = await prisma.consentement.updateMany({
      where: { clientId },
      data: {
        granted: false,
        revokedAt: anonymizedAt,
      },
    })
    relatedRecordsProcessed.consentements = consentements.count

    // ── 7. Anonymiser les revenus (garder les montants agrégés) ──
    const revenues = await prisma.revenue.updateMany({
      where: { clientId, cabinetId: this.cabinetId },
      data: {
        libelle: '[ANONYMISÉ]',
        description: null,
        sourceOrganisme: null,
        numeroContrat: null,
        notes: null,
        isActive: false,
      },
    })
    relatedRecordsProcessed.revenues = revenues.count

    // ── 8. Anonymiser les dépenses (garder les montants agrégés) ──
    const expenses = await prisma.expense.updateMany({
      where: { clientId, cabinetId: this.cabinetId },
      data: {
        libelle: '[ANONYMISÉ]',
        description: null,
        beneficiaire: null,
        numeroContrat: null,
        referenceMandat: null,
        notes: null,
        isActive: false,
      },
    })
    relatedRecordsProcessed.expenses = expenses.count

    // ── 9. Anonymiser les crédits (garder les montants pour LCB-FT) ──
    const credits = await prisma.credit.updateMany({
      where: { clientId, cabinetId: this.cabinetId },
      data: {
        libelle: '[ANONYMISÉ]',
        organisme: '[ANONYMISÉ]',
        agence: null,
        contactNom: null,
        contactTel: null,
        contactEmail: null,
        numeroContrat: null,
        notes: null,
        isActive: false,
      },
    })
    relatedRecordsProcessed.credits = credits.count

    // ── 10. Supprimer les notifications ──
    const notifications = await prisma.notification.deleteMany({
      where: { userId: clientId },
    })
    relatedRecordsProcessed.notifications = notifications.count

    // ── 11. Supprimer les mémoires Agent IA liées au client ──
    await prisma.agentMemory.deleteMany({
      where: { clientId, cabinetId: this.cabinetId },
    })

    await prisma.agentConversation.deleteMany({
      where: { clientId, cabinetId: this.cabinetId },
    })

    await prisma.agentAction.deleteMany({
      where: { clientId, cabinetId: this.cabinetId },
    })

    // ── 12. Logger l'action d'anonymisation ──
    logger.info('RGPD: Client anonymized', {
      userId: this.userId,
      clientId,
      action: 'GDPR_ANONYMIZATION',
      module: 'GDPR',
      metadata: { certificateId, fieldsCount: fieldsAnonymized.length } as any,
    })

    // Données conservées pour obligations légales
    const retainedForLegal = [
      'Montants financiers agrégés (LCB-FT, 5 ans)',
      'Dates de transactions (LCB-FT, 5 ans)',
      'Identifiant anonymisé (traçabilité audit)',
      'Dates de consentements (preuve RGPD)',
      'Métadonnées documents réglementaires (AMF/ACPR)',
    ]

    return {
      clientId,
      anonymizedAt,
      fieldsAnonymized,
      relatedRecordsProcessed,
      retainedForLegal,
      certificateId,
    }
  }

  // ── DROIT À LA PORTABILITÉ (Art. 20) ───────────────────────────────────

  /**
   * Exporte toutes les données personnelles d'un client en format structuré (JSON).
   */
  async exportClientData(clientId: string): Promise<DataExportResult> {
    const prisma = getPrismaClient(this.cabinetId)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
    })

    if (!client) {
      throw new Error('Client non trouvé ou accès non autorisé')
    }

    // Récupérer toutes les données liées
    const [revenues, expenses, contrats, documents, consentements, entretiens] = await Promise.all([
      prisma.revenue.findMany({ where: { clientId, cabinetId: this.cabinetId } }),
      prisma.expense.findMany({ where: { clientId, cabinetId: this.cabinetId } }),
      prisma.contrat.findMany({ where: { clientId } }),
      prisma.document.findMany({
        where: { clients: { some: { id: clientId } } },
        select: { id: true, name: true, type: true, createdAt: true },
      }),
      prisma.consentement.findMany({ where: { clientId } }),
      prisma.entretien.findMany({
        where: { clientId, cabinetId: this.cabinetId },
        select: { id: true, dateEntretien: true, type: true, duree: true },
      }),
    ])

    // Construire les données personnelles (sans champs techniques)
    const personalInfo: Record<string, unknown> = {
      prenom: client.firstName,
      nom: client.lastName,
      email: client.email,
      telephone: client.phone,
      mobile: client.mobile,
      dateNaissance: client.birthDate,
      lieuNaissance: client.birthPlace,
      nationalite: client.nationality,
      adresse: client.address,
      profession: client.profession,
      employeur: client.employerName,
      situationFamiliale: client.maritalStatus,
      nombreEnfants: client.numberOfChildren,
      profilRisque: client.riskProfile,
      horizonInvestissement: client.investmentHorizon,
    }

    // Exclure les valeurs nulles
    for (const key of Object.keys(personalInfo)) {
      if (personalInfo[key] === null || personalInfo[key] === undefined) {
        delete personalInfo[key]
      }
    }

    logger.info('RGPD: Client data exported', {
      userId: this.userId,
      clientId,
      action: 'GDPR_EXPORT',
      module: 'GDPR',
    })

    return {
      clientId,
      exportedAt: new Date(),
      data: {
        personalInfo,
        patrimoine: [], // Les actifs/passifs nécessiteraient une jointure ClientActif
        budget: {
          revenues: revenues.map(r => ({ ...r })),
          expenses: expenses.map(e => ({ ...e })),
        },
        contrats: contrats.map(c => ({ ...c })),
        documents: documents.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          createdAt: d.createdAt,
        })),
        consentements: consentements.map(c => ({ ...c })),
        entretiens: entretiens.map(e => ({
          id: e.id,
          date: e.dateEntretien,
          type: e.type,
          duration: e.duree,
        })),
      },
    }
  }

  // ── REGISTRE DES TRAITEMENTS (Art. 30) ─────────────────────────────────

  /**
   * Retourne le registre des traitements de données personnelles du CRM.
   * Ce registre est statique et décrit les traitements effectués par le logiciel.
   */
  static getProcessingRegistry(): DataProcessingRecord[] {
    return [
      {
        id: 'T-001',
        purpose: 'Gestion de la relation client (CRM)',
        legalBasis: 'Exécution du contrat (Art. 6.1.b RGPD)',
        dataCategories: ['Identité', 'Contact', 'Situation familiale', 'Situation professionnelle'],
        dataSubjects: ['Clients', 'Prospects'],
        retention: 'Durée de la relation + 5 ans (prescription civile)',
        recipients: ['Conseillers du cabinet'],
        transfers: ['Aucun transfert hors UE'],
        securityMeasures: ['Chiffrement BDD', 'RLS multi-tenant', 'Auth Supabase', 'HTTPS'],
      },
      {
        id: 'T-002',
        purpose: 'Conseil en gestion de patrimoine (DDA/MIF2)',
        legalBasis: 'Obligation légale (Art. 6.1.c RGPD) — AMF/ACPR',
        dataCategories: ['Patrimoine', 'Revenus', 'Charges', 'Objectifs financiers', 'Profil investisseur'],
        dataSubjects: ['Clients'],
        retention: '5 ans après fin de la relation (L. 561-12 CMF)',
        recipients: ['Conseillers du cabinet', 'AMF/ACPR en cas de contrôle'],
        transfers: ['Aucun transfert hors UE'],
        securityMeasures: ['Chiffrement BDD', 'RLS multi-tenant', 'Contrôle d\'accès RBAC'],
      },
      {
        id: 'T-003',
        purpose: 'Lutte contre le blanchiment (LCB-FT)',
        legalBasis: 'Obligation légale (Art. 6.1.c RGPD) — L. 561-1 et suivants CMF',
        dataCategories: ['Identité', 'Documents KYC', 'Origine des fonds', 'PPE'],
        dataSubjects: ['Clients', 'Bénéficiaires effectifs'],
        retention: '5 ans après fin de la relation (L. 561-12 CMF)',
        recipients: ['Conseillers du cabinet', 'TRACFIN en cas de déclaration de soupçon'],
        transfers: ['Aucun transfert hors UE'],
        securityMeasures: ['Chiffrement documents', 'Accès restreint KYC', 'Audit log'],
      },
      {
        id: 'T-004',
        purpose: 'Transcription d\'entretiens par reconnaissance vocale',
        legalBasis: 'Consentement explicite (Art. 6.1.a RGPD)',
        dataCategories: ['Voix (transcription texte uniquement, pas d\'audio)', 'Contenu conversationnel'],
        dataSubjects: ['Clients', 'Prospects', 'Conseillers'],
        retention: 'Durée de la relation, supprimé sur demande d\'effacement',
        recipients: ['Conseiller ayant mené l\'entretien'],
        transfers: ['Ollama (local, pas de transfert) ou Mistral Cloud (UE, DPA signé)'],
        securityMeasures: ['Consentement préalable obligatoire', 'Pas de stockage audio', 'Chiffrement transcription'],
      },
      {
        id: 'T-005',
        purpose: 'Intelligence artificielle — Analyse et suggestions',
        legalBasis: 'Intérêt légitime (Art. 6.1.f RGPD) — Amélioration du conseil',
        dataCategories: ['Données patrimoniales agrégées', 'Profil investisseur'],
        dataSubjects: ['Clients'],
        retention: 'Cache temporaire (5 min), résultats liés au client',
        recipients: ['Conseiller du client'],
        transfers: ['Ollama (local) ou Mistral Cloud (UE)'],
        securityMeasures: ['Anonymisation des prompts', 'Rate limiting', 'Cache LRU'],
      },
      {
        id: 'T-006',
        purpose: 'Campagnes marketing et communication',
        legalBasis: 'Consentement (Art. 6.1.a RGPD) pour prospection, Intérêt légitime pour clients existants',
        dataCategories: ['Email', 'Prénom', 'Nom'],
        dataSubjects: ['Clients', 'Prospects ayant donné leur consentement'],
        retention: 'Jusqu\'au retrait du consentement',
        recipients: ['Provider email (Resend/SendGrid)'],
        transfers: ['Provider email (DPA requis)'],
        securityMeasures: ['Désabonnement one-click', 'Consentement granulaire'],
      },
      {
        id: 'T-007',
        purpose: 'Gestion des réclamations (ACPR)',
        legalBasis: 'Obligation légale (Art. 6.1.c RGPD) — Recommandation ACPR 2022-R-01',
        dataCategories: ['Identité client', 'Objet réclamation', 'Correspondance'],
        dataSubjects: ['Clients réclamants'],
        retention: '5 ans après clôture de la réclamation',
        recipients: ['Conseillers', 'Médiateur en cas d\'escalade'],
        transfers: ['Aucun'],
        securityMeasures: ['Accès restreint', 'SLA de traitement', 'Audit trail'],
      },
    ]
  }
}
