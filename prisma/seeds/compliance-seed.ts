/**
 * Seed script pour les données de démonstration de conformité
 * 
 * Ce script génère des données de démo pour:
 * - Documents KYC avec différents statuts (valid, pending, expired, expiring)
 * - Réclamations avec différents statuts et SLA
 * - Contrôles ACPR avec différents types et états
 * - Alertes de conformité
 * - Événements de timeline conformité
 * 
 * @module prisma/seeds/compliance-seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Helper Constants
// ============================================

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();

/**
 * Crée une date relative à maintenant
 */
function getDate(daysOffset: number, hoursOffset: number = 0): Date {
  const date = new Date(NOW);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date;
}

/**
 * Génère une référence de réclamation unique
 */
function generateReclamationReference(index: number): string {
  const paddedSequence = (1000 + index).toString().padStart(4, '0');
  return `REC-${CURRENT_YEAR}-${paddedSequence}`;
}

// ============================================
// KYC Document Types
// ============================================

const KYC_DOCUMENT_TYPES = [
  'IDENTITE',
  'JUSTIFICATIF_DOMICILE',
  'RIB_BANCAIRE',
  'AVIS_IMPOSITION',
  'JUSTIFICATIF_PATRIMOINE',
  'ORIGINE_FONDS',
] as const;

// ============================================
// Compliance Alert Types
// ============================================

const ALERT_TYPES = [
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'KYC_INCOMPLETE',
  'CONTROL_OVERDUE',
  'RECLAMATION_SLA_BREACH',
  'MIFID_OUTDATED',
] as const;

const ALERT_SEVERITIES = ['LOW', 'WARNING', 'HIGH', 'CRITICAL'] as const;

// ============================================
// Control Types
// ============================================

const CONTROL_TYPES = [
  'VERIFICATION_IDENTITE',
  'SITUATION_FINANCIERE',
  'PROFIL_RISQUE',
  'ORIGINE_PATRIMOINE',
  'PERSONNE_EXPOSEE',
  'REVUE_PERIODIQUE',
] as const;

const CONTROL_PRIORITIES = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE'] as const;

// ============================================
// Reclamation Types
// ============================================

const RECLAMATION_TYPES = [
  'QUALITE_SERVICE',
  'TARIFICATION',
  'QUALITE_CONSEIL',
  'COMMUNICATION',
  'DOCUMENT',
  'AUTRE',
] as const;

const RECLAMATION_STATUSES = [
  'RECUE',
  'EN_COURS',
  'EN_ATTENTE_INFO',
  'RESOLUE',
  'CLOTUREE',
] as const;

const SLA_SEVERITIES = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'] as const;

const SLA_DEADLINES: Record<string, number> = {
  BASSE: 60,
  MOYENNE: 30,
  HAUTE: 15,
  CRITIQUE: 7,
};

// ============================================
// Timeline Event Types
// ============================================

const TIMELINE_EVENT_TYPES = [
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VALIDATED',
  'DOCUMENT_REJECTED',
  'REMINDER_SENT',
  'CONTROL_CREATED',
  'CONTROL_COMPLETED',
  'RECLAMATION_CREATED',
  'RECLAMATION_RESOLVED',
] as const;

// ============================================
// Main Seed Function
// ============================================

export async function seedComplianceData(cabinetId: string, userId: string) {
  console.log('🔒 Seeding compliance demo data...');

  // Get clients for this cabinet
  const clients = await prisma.client.findMany({
    where: { cabinetId },
    take: 10,
    orderBy: { createdAt: 'asc' },
  });

  if (clients.length === 0) {
    console.log('   ⚠️ No clients found for cabinet, skipping compliance seed');
    return;
  }

  console.log(`   📋 Found ${clients.length} clients for compliance data`);

  // Seed KYC Documents
  await seedKYCDocuments(cabinetId, clients, userId);

  // Seed Compliance Controls
  await seedComplianceControls(cabinetId, clients, userId);

  // Seed Reclamations
  await seedReclamations(cabinetId, clients, userId);

  // Seed Compliance Alerts
  await seedComplianceAlerts(cabinetId, clients);

  // Seed Timeline Events
  await seedTimelineEvents(cabinetId, clients, userId);

  console.log('✅ Compliance demo data seeded successfully');
}

// ============================================
// KYC Documents Seed
// ============================================

async function seedKYCDocuments(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  userId: string
) {
  console.log('   📄 Seeding KYC documents...');

  // Document configurations for different scenarios
  const documentScenarios = [
    // Client 0: All documents valid
    { clientIndex: 0, documents: [
      { type: 'IDENTITE', status: 'VALIDE', daysOffset: -30, expiresIn: 3650 },
      { type: 'JUSTIFICATIF_DOMICILE', status: 'VALIDE', daysOffset: -15, expiresIn: 90 },
      { type: 'RIB_BANCAIRE', status: 'VALIDE', daysOffset: -30, expiresIn: null },
      { type: 'AVIS_IMPOSITION', status: 'VALIDE', daysOffset: -60, expiresIn: 365 },
    ]},
    // Client 1: Some documents pending
    { clientIndex: 1, documents: [
      { type: 'IDENTITE', status: 'VALIDE', daysOffset: -90, expiresIn: 3650 },
      { type: 'JUSTIFICATIF_DOMICILE', status: 'EN_ATTENTE', daysOffset: -2, expiresIn: 90 },
      { type: 'RIB_BANCAIRE', status: 'EN_ATTENTE', daysOffset: -1, expiresIn: null },
      { type: 'AVIS_IMPOSITION', status: 'VALIDE', daysOffset: -45, expiresIn: 365 },
    ]},
    // Client 2: Document expired
    { clientIndex: 2, documents: [
      { type: 'IDENTITE', status: 'VALIDE', daysOffset: -180, expiresIn: 3650 },
      { type: 'JUSTIFICATIF_DOMICILE', status: 'EXPIRE', daysOffset: -120, expiresIn: -30 },
      { type: 'RIB_BANCAIRE', status: 'VALIDE', daysOffset: -60, expiresIn: null },
      { type: 'AVIS_IMPOSITION', status: 'VALIDE', daysOffset: -30, expiresIn: 365 },
    ]},
    // Client 3: Document expiring soon (within 30 days)
    { clientIndex: 3, documents: [
      { type: 'IDENTITE', status: 'VALIDE', daysOffset: -60, expiresIn: 3650 },
      { type: 'JUSTIFICATIF_DOMICILE', status: 'VALIDE', daysOffset: -70, expiresIn: 20 },
      { type: 'RIB_BANCAIRE', status: 'VALIDE', daysOffset: -30, expiresIn: null },
      { type: 'AVIS_IMPOSITION', status: 'VALIDE', daysOffset: -200, expiresIn: 165 },
    ]},
    // Client 4: Document rejected
    { clientIndex: 4, documents: [
      { type: 'IDENTITE', status: 'REJETE', daysOffset: -5, expiresIn: null, rejectionReason: 'Document illisible - veuillez fournir une copie plus nette' },
      { type: 'JUSTIFICATIF_DOMICILE', status: 'VALIDE', daysOffset: -30, expiresIn: 90 },
      { type: 'RIB_BANCAIRE', status: 'VALIDE', daysOffset: -30, expiresIn: null },
    ]},
  ];

  for (const scenario of documentScenarios) {
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    for (const doc of scenario.documents) {
      const uploadDate = getDate(doc.daysOffset);
      const expiresAt = doc.expiresIn !== null ? getDate(doc.expiresIn) : null;
      const isValidated = doc.status === 'VALIDE';
      const isRejected = doc.status === 'REJETE';

      await prisma.kYCDocument.create({
        data: {
          cabinetId,
          clientId: client.id,
          type: doc.type as 'IDENTITE' | 'JUSTIFICATIF_DOMICILE' | 'RIB_BANCAIRE' | 'AVIS_IMPOSITION' | 'JUSTIFICATIF_PATRIMOINE' | 'ORIGINE_FONDS' | 'AUTRE',
          status: doc.status as 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EXPIRE',
          fileName: `${doc.type.toLowerCase()}_${client.lastName.toLowerCase()}.pdf`,
          fileUrl: `/uploads/kyc/${client.id}/${doc.type.toLowerCase()}.pdf`,
          validatedAt: isValidated ? getDate(doc.daysOffset + 1) : null,
          validatedById: isValidated ? userId : null,
          rejectionReason: isRejected ? (doc as { rejectionReason?: string }).rejectionReason : null,
          expiresAt,
          notes: `[DEMO] Document KYC de démonstration pour ${client.firstName} ${client.lastName}`,
          createdAt: uploadDate,
          updatedAt: uploadDate,
        },
      });
    }
  }

  console.log('   ✓ KYC documents created');
}

// ============================================
// Compliance Controls Seed
// ============================================

async function seedComplianceControls(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  userId: string
) {
  console.log('   🔍 Seeding compliance controls...');

  const controlScenarios = [
    // Control 1: Completed with low risk
    { clientIndex: 0, type: 'VERIFICATION_IDENTITE', status: 'TERMINE', priority: 'HAUTE', dueOffset: -10, score: 15, isACPR: true },
    // Control 2: In progress
    { clientIndex: 1, type: 'SITUATION_FINANCIERE', status: 'EN_COURS', priority: 'MOYENNE', dueOffset: 15, score: null, isACPR: true },
    // Control 3: Overdue (using ACTION_REQUISE as closest to overdue)
    { clientIndex: 2, type: 'PROFIL_RISQUE', status: 'ACTION_REQUISE', priority: 'URGENTE', dueOffset: -5, score: null, isACPR: true },
    // Control 4: Pending with high risk result
    { clientIndex: 3, type: 'ORIGINE_PATRIMOINE', status: 'TERMINE', priority: 'HAUTE', dueOffset: -20, score: 72, isACPR: true },
    // Control 5: PPE Check completed
    { clientIndex: 4, type: 'PERSONNE_EXPOSEE', status: 'TERMINE', priority: 'HAUTE', dueOffset: -30, score: 25, isACPR: true },
    // Control 6: Periodic review pending
    { clientIndex: 0, type: 'REVUE_PERIODIQUE', status: 'EN_ATTENTE', priority: 'MOYENNE', dueOffset: 30, score: null, isACPR: false },
    // Control 7: Another overdue control
    { clientIndex: 1, type: 'ORIGINE_PATRIMOINE', status: 'ACTION_REQUISE', priority: 'HAUTE', dueOffset: -15, score: null, isACPR: true },
  ];

  for (let i = 0; i < controlScenarios.length; i++) {
    const scenario = controlScenarios[i];
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    const dueDate = getDate(scenario.dueOffset);
    const isCompleted = scenario.status === 'TERMINE';
    const riskLevel = scenario.score !== null 
      ? (scenario.score < 30 ? 'LOW' : scenario.score < 60 ? 'MEDIUM' : scenario.score < 85 ? 'HIGH' : 'CRITICAL')
      : null;

    await prisma.kYCCheck.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: scenario.type as 'VERIFICATION_IDENTITE' | 'VERIFICATION_ADRESSE' | 'SITUATION_FINANCIERE' | 'CONNAISSANCE_INVESTISSEMENT' | 'PROFIL_RISQUE' | 'ORIGINE_PATRIMOINE' | 'PERSONNE_EXPOSEE' | 'CRIBLAGE_SANCTIONS' | 'REVUE_PERIODIQUE' | 'AUTRE',
        status: scenario.status as 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'ECHOUE' | 'ACTION_REQUISE' | 'ESCALADE',
        priority: scenario.priority as 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE',
        description: `[DEMO] Contrôle ${scenario.type.toLowerCase().replace('_', ' ')} pour ${client.firstName} ${client.lastName}`,
        findings: isCompleted ? `Contrôle effectué. Niveau de risque: ${riskLevel}. Aucune anomalie majeure détectée.` : null,
        recommendations: isCompleted ? 'Maintenir la surveillance standard. Prochaine revue dans 12 mois.' : null,
        dueDate,
        completedAt: isCompleted ? getDate(scenario.dueOffset - 2) : null,
        completedById: isCompleted ? userId : null,
        isACPRMandatory: scenario.isACPR,
        score: scenario.score,
        riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null,
        assignedToId: userId,
        createdAt: getDate(scenario.dueOffset - 30),
        updatedAt: getDate(scenario.dueOffset - (isCompleted ? 2 : 0)),
      },
    });
  }

  console.log('   ✓ Compliance controls created');
}


// ============================================
// Reclamations Seed
// ============================================

async function seedReclamations(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  userId: string
) {
  console.log('   📝 Seeding reclamations...');

  const reclamationScenarios = [
    // Reclamation 1: Received, low severity, within SLA
    {
      clientIndex: 0,
      type: 'QUALITE_SERVICE',
      status: 'RECUE',
      severity: 'BASSE',
      subject: 'Délai de réponse trop long',
      description: 'Le client se plaint du délai de réponse à ses emails qui dépasse parfois 48h.',
      receivedDaysAgo: 5,
    },
    // Reclamation 2: In progress, medium severity
    {
      clientIndex: 1,
      type: 'TARIFICATION',
      status: 'EN_COURS',
      severity: 'MOYENNE',
      subject: 'Frais de gestion contestés',
      description: 'Le client conteste les frais de gestion appliqués sur son contrat d\'assurance-vie.',
      receivedDaysAgo: 15,
    },
    // Reclamation 3: Waiting for info, high severity
    {
      clientIndex: 2,
      type: 'QUALITE_CONSEIL',
      status: 'EN_ATTENTE_INFO',
      severity: 'HAUTE',
      subject: 'Conseil inadapté au profil de risque',
      description: 'Le client estime que les recommandations d\'investissement ne correspondent pas à son profil prudent.',
      receivedDaysAgo: 10,
    },
    // Reclamation 4: Resolved
    {
      clientIndex: 3,
      type: 'DOCUMENT',
      status: 'RESOLUE',
      severity: 'BASSE',
      subject: 'Document manquant',
      description: 'Le client n\'a pas reçu son relevé annuel de situation.',
      receivedDaysAgo: 45,
      responseText: 'Le relevé annuel a été renvoyé par courrier recommandé. Le client confirme bonne réception.',
    },
    // Reclamation 5: SLA Breach - Critical severity, overdue
    {
      clientIndex: 4,
      type: 'COMMUNICATION',
      status: 'EN_COURS',
      severity: 'CRITIQUE',
      subject: 'Absence de réponse à une demande urgente',
      description: 'Le client n\'a pas reçu de réponse à sa demande de rachat partiel urgent depuis 10 jours.',
      receivedDaysAgo: 10,
      slaBreach: true,
    },
    // Reclamation 6: Closed
    {
      clientIndex: 0,
      type: 'AUTRE',
      status: 'CLOTUREE',
      severity: 'MOYENNE',
      subject: 'Erreur dans les coordonnées',
      description: 'Erreur dans l\'adresse postale du client sur les documents officiels.',
      receivedDaysAgo: 60,
      responseText: 'L\'adresse a été corrigée dans notre système. Nouveaux documents envoyés.',
    },
  ];

  for (let i = 0; i < reclamationScenarios.length; i++) {
    const scenario = reclamationScenarios[i];
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    const receivedAt = getDate(-scenario.receivedDaysAgo);
    const slaDeadlineDays = SLA_DEADLINES[scenario.severity];
    const slaDeadline = new Date(receivedAt);
    slaDeadline.setDate(slaDeadline.getDate() + slaDeadlineDays);

    const isResolved = scenario.status === 'RESOLUE' || scenario.status === 'CLOTUREE';
    const slaBreach = (scenario as { slaBreach?: boolean }).slaBreach || (NOW > slaDeadline && !isResolved);

    await prisma.reclamation.create({
      data: {
        cabinetId,
        clientId: client.id,
        reference: generateReclamationReference(i + 1),
        subject: scenario.subject,
        description: `[DEMO] ${scenario.description}`,
        type: scenario.type as 'QUALITE_SERVICE' | 'TARIFICATION' | 'QUALITE_CONSEIL' | 'COMMUNICATION' | 'DOCUMENT' | 'AUTRE',
        status: scenario.status as 'RECUE' | 'EN_COURS' | 'EN_ATTENTE_INFO' | 'RESOLUE' | 'CLOTUREE',
        severity: scenario.severity as 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE',
        assignedToId: userId,
        responseText: (scenario as { responseText?: string }).responseText || null,
        internalNotes: `[DEMO] Réclamation de démonstration - ${scenario.type}`,
        resolutionDate: isResolved ? getDate(-scenario.receivedDaysAgo + 20) : null,
        receivedAt,
        deadline: slaDeadline,
        slaDeadline,
        slaBreach,
        slaBreachAt: slaBreach ? slaDeadline : null,
        createdAt: receivedAt,
        updatedAt: getDate(-1),
      },
    });
  }

  console.log('   ✓ Reclamations created');
}

// ============================================
// Compliance Alerts Seed
// ============================================

async function seedComplianceAlerts(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[]
) {
  console.log('   🚨 Seeding compliance alerts...');

  const alertScenarios = [
    // Alert 1: Document expiring soon
    {
      clientIndex: 3,
      type: 'DOCUMENT_EXPIRING',
      severity: 'WARNING',
      title: 'Justificatif de domicile expire bientôt',
      description: 'Le justificatif de domicile expire dans 20 jours.',
      actionRequired: 'Demander un nouveau justificatif de domicile au client.',
      acknowledged: false,
    },
    // Alert 2: Document expired
    {
      clientIndex: 2,
      type: 'DOCUMENT_EXPIRED',
      severity: 'CRITICAL',
      title: 'Justificatif de domicile expiré',
      description: 'Le justificatif de domicile a expiré il y a 30 jours.',
      actionRequired: 'Obtenir un nouveau justificatif de domicile immédiatement.',
      acknowledged: true,
    },
    // Alert 3: KYC incomplete
    {
      clientIndex: 1,
      type: 'KYC_INCOMPLETE',
      severity: 'HIGH',
      title: 'Dossier KYC incomplet',
      description: 'Documents en attente de validation: RIB, Justificatif de domicile.',
      actionRequired: 'Valider les documents en attente.',
      acknowledged: false,
    },
    // Alert 4: Control overdue
    {
      clientIndex: 2,
      type: 'CONTROL_OVERDUE',
      severity: 'HIGH',
      title: 'Contrôle ACPR en retard',
      description: 'Le contrôle "Profil de risque" est en retard de 5 jours.',
      actionRequired: 'Compléter le contrôle ACPR immédiatement.',
      acknowledged: false,
    },
    // Alert 5: SLA breach
    {
      clientIndex: 4,
      type: 'RECLAMATION_SLA_BREACH',
      severity: 'CRITICAL',
      title: 'Dépassement SLA réclamation',
      description: 'La réclamation REC-2025-1005 a dépassé le délai SLA de 7 jours.',
      actionRequired: 'Traiter la réclamation en priorité absolue.',
      acknowledged: true,
    },
    // Alert 6: MiFID outdated
    {
      clientIndex: 0,
      type: 'MIFID_OUTDATED',
      severity: 'WARNING',
      title: 'Questionnaire MiFID obsolète',
      description: 'Le questionnaire MiFID date de plus de 12 mois.',
      actionRequired: 'Planifier une mise à jour du questionnaire MiFID.',
      acknowledged: false,
    },
  ];

  for (const scenario of alertScenarios) {
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    await prisma.complianceAlert.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: scenario.type as 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED' | 'KYC_INCOMPLETE' | 'CONTROL_OVERDUE' | 'RECLAMATION_SLA_BREACH' | 'MIFID_OUTDATED' | 'OPERATION_BLOCKED' | 'AFFAIRE_INACTIVE',
        severity: scenario.severity as 'LOW' | 'WARNING' | 'HIGH' | 'CRITICAL',
        title: `[DEMO] ${scenario.title}`,
        description: scenario.description,
        actionRequired: scenario.actionRequired,
        actionUrl: `/dashboard/conformite/clients/${client.id}`,
        acknowledged: scenario.acknowledged,
        acknowledgedAt: scenario.acknowledged ? getDate(-2) : null,
        resolved: false,
        createdAt: getDate(-3),
      },
    });
  }

  console.log('   ✓ Compliance alerts created');
}

// ============================================
// Timeline Events Seed
// ============================================

async function seedTimelineEvents(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  userId: string
) {
  console.log('   📅 Seeding timeline events...');

  const timelineScenarios = [
    // Recent document uploads
    { clientIndex: 0, type: 'DOCUMENT_UPLOADED', title: 'Document téléversé', description: 'Pièce d\'identité téléversée', daysAgo: 30 },
    { clientIndex: 0, type: 'DOCUMENT_VALIDATED', title: 'Document validé', description: 'Pièce d\'identité validée', daysAgo: 29 },
    { clientIndex: 1, type: 'DOCUMENT_UPLOADED', title: 'Document téléversé', description: 'Justificatif de domicile téléversé', daysAgo: 2 },
    { clientIndex: 4, type: 'DOCUMENT_REJECTED', title: 'Document rejeté', description: 'Pièce d\'identité rejetée - Document illisible', daysAgo: 5 },
    
    // Control events
    { clientIndex: 0, type: 'CONTROL_CREATED', title: 'Contrôle créé', description: 'Contrôle de vérification d\'identité créé', daysAgo: 40 },
    { clientIndex: 0, type: 'CONTROL_COMPLETED', title: 'Contrôle terminé', description: 'Contrôle de vérification d\'identité terminé - Risque faible', daysAgo: 12 },
    { clientIndex: 3, type: 'CONTROL_COMPLETED', title: 'Contrôle terminé', description: 'Contrôle origine patrimoine terminé - Risque élevé', daysAgo: 22 },
    
    // Reclamation events
    { clientIndex: 0, type: 'RECLAMATION_CREATED', title: 'Réclamation créée', description: 'Nouvelle réclamation: Délai de réponse trop long', daysAgo: 5 },
    { clientIndex: 3, type: 'RECLAMATION_CREATED', title: 'Réclamation créée', description: 'Nouvelle réclamation: Document manquant', daysAgo: 45 },
    { clientIndex: 3, type: 'RECLAMATION_RESOLVED', title: 'Réclamation résolue', description: 'Réclamation résolue: Document renvoyé', daysAgo: 25 },
    
    // Reminder events
    { clientIndex: 2, type: 'REMINDER_SENT', title: 'Relance envoyée', description: 'Relance envoyée pour justificatif de domicile expiré', daysAgo: 15 },
    { clientIndex: 1, type: 'REMINDER_SENT', title: 'Relance envoyée', description: 'Relance envoyée pour documents en attente', daysAgo: 1 },
  ];

  for (const scenario of timelineScenarios) {
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    await prisma.complianceTimelineEvent.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: scenario.type as 'DOCUMENT_UPLOADED' | 'DOCUMENT_VALIDATED' | 'DOCUMENT_REJECTED' | 'DOCUMENT_EXPIRED' | 'REMINDER_SENT' | 'CONTROL_CREATED' | 'CONTROL_COMPLETED' | 'QUESTIONNAIRE_COMPLETED' | 'RECLAMATION_CREATED' | 'RECLAMATION_RESOLVED' | 'OPERATION_CREATED' | 'OPERATION_STATUS_CHANGED' | 'DOCUMENT_GENERATED' | 'DOCUMENT_SIGNED' | 'DOCUMENT_EXPORTED',
        title: `[DEMO] ${scenario.title}`,
        description: scenario.description,
        metadata: { demo: true, scenario: scenario.type },
        userId,
        createdAt: getDate(-scenario.daysAgo),
      },
    });
  }

  console.log('   ✓ Timeline events created');
}

// ============================================
// Cleanup Function
// ============================================

export async function cleanupComplianceData(cabinetId: string) {
  console.log('🧹 Cleaning up compliance demo data...');

  // Delete in order to respect foreign key constraints
  await prisma.complianceTimelineEvent.deleteMany({
    where: { 
      cabinetId,
      title: { startsWith: '[DEMO]' }
    },
  });

  await prisma.complianceAlert.deleteMany({
    where: { 
      cabinetId,
      title: { startsWith: '[DEMO]' }
    },
  });

  await prisma.reclamation.deleteMany({
    where: { 
      cabinetId,
      internalNotes: { contains: '[DEMO]' }
    },
  });

  await prisma.kYCCheck.deleteMany({
    where: { 
      cabinetId,
      description: { contains: '[DEMO]' }
    },
  });

  await prisma.kYCDocument.deleteMany({
    where: { 
      cabinetId,
      notes: { contains: '[DEMO]' }
    },
  });

  console.log('✅ Compliance demo data cleaned up');
}

// ============================================
// Standalone Execution
// ============================================

async function main() {
  try {
    // Get the first cabinet for demo
    const cabinet = await prisma.cabinet.findFirst({
      include: { users: { where: { role: 'ADVISOR' }, take: 1 } },
    });

    if (!cabinet) {
      console.error('❌ No cabinet found. Please run the main seed first.');
      process.exit(1);
    }

    const userId = cabinet.users[0]?.id;
    if (!userId) {
      console.error('❌ No advisor found in cabinet. Please run the main seed first.');
      process.exit(1);
    }

    await seedComplianceData(cabinet.id, userId);
  } catch (error) {
    console.error('❌ Compliance seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
