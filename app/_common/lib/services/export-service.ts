/**
 * Service d'export de données avec traduction automatique des en-têtes
 * Convertit les noms de champs anglais en français pour les exports CSV/Excel
 * Adapté pour Prisma/PostgreSQL
 */

import { prisma } from '@/app/_common/lib/prisma';

// Mapping des champs anglais → français
const FIELD_TRANSLATIONS: Record<string, string> = {
  // Champs communs
  id: 'ID',
  email: 'Email',
  firstName: 'Prénom',
  lastName: 'Nom',
  phone: 'Téléphone',
  mobile: 'Mobile',
  address: 'Adresse',
  city: 'Ville',
  postalCode: 'Code Postal',
  country: 'Pays',
  createdAt: 'Date de Création',
  updatedAt: 'Date de Modification',

  // Clients
  clientType: 'Type de Client',
  birthDate: 'Date de Naissance',
  birthPlace: 'Lieu de Naissance',
  nationality: 'Nationalité',
  maritalStatus: 'Situation Familiale',
  marriageRegime: 'Régime Matrimonial',
  numberOfChildren: "Nombre d'Enfants",
  profession: 'Profession',
  employerName: 'Employeur',
  professionalStatus: 'Statut Professionnel',
  annualIncome: 'Revenus Annuels',
  taxBracket: 'Tranche Fiscale',
  fiscalResidence: 'Résidence Fiscale',
  irTaxRate: "Taux d'IR",
  ifiSubject: "Soumis à l'IFI",
  ifiAmount: 'Montant IFI',
  riskProfile: 'Profil de Risque',
  investmentHorizon: "Horizon d'Investissement",
  investmentKnowledge: 'Connaissance Financière',
  investmentExperience: 'Expérience Investissement',
  kycStatus: 'Statut KYC',
  kycCompletedAt: 'Date KYC',
  kycNextReviewDate: 'Prochaine Révision KYC',
  status: 'Statut',
  portalAccess: 'Accès Portail',
  lastContactDate: 'Dernier Contact',
  managedByFirm: 'Géré par le Cabinet',
  managementStartDate: 'Début de Gestion',
  managementFees: 'Frais de Gestion',
  managementType: 'Type de Mandat',

  // Professionnels
  companyName: "Nom de l'Entreprise",
  siret: 'SIRET',
  legalForm: 'Forme Juridique',
  activitySector: "Secteur d'Activité",
  companyCreationDate: "Date de Création de l'Entreprise",
  numberOfEmployees: 'Nombre de Salariés',
  annualRevenue: 'Chiffre d\'Affaires Annuel',

  // Patrimoine
  totalAssets: 'Total Actifs',
  totalLiabilities: 'Total Passifs',
  netWealth: 'Patrimoine Net',
  managedAssets: 'Actifs Gérés',
  unmanagedAssets: 'Actifs Non Gérés',

  // Actifs
  name: 'Nom',
  type: 'Type',
  category: 'Catégorie',
  description: 'Description',
  currency: 'Devise',
  value: 'Valeur',
  currentValue: 'Valeur Actuelle',
  purchaseValue: "Valeur d'Achat",
  purchaseDate: "Date d'Achat",
  lastValuationDate: 'Dernière Valorisation',
  netYield: 'Rendement Net',
  performance: 'Performance',
  performance1Y: 'Performance 1 An',
  performance3Y: 'Performance 3 Ans',
  performanceYTD: 'Performance YTD',
  managed: 'Géré',
  surface: 'Surface',
  rentalStatus: 'Statut Locatif',
  energyRating: 'DPE',
  provider: 'Fournisseur',
  contractNumber: 'Numéro de Contrat',
  accountNumber: 'Numéro de Compte',
  ownershipPercentage: 'Pourcentage de Propriété',

  // Passifs
  originalAmount: 'Montant Initial',
  remainingAmount: 'Capital Restant',
  monthlyPayment: 'Mensualité',
  interestRate: "Taux d'Intérêt",
  insuranceRate: "Taux d'Assurance",
  rateType: 'Type de Taux',
  startDate: 'Date de Début',
  endDate: 'Date de Fin',
  nextPaymentDate: 'Prochaine Échéance',

  // Contrats
  contractType: 'Type de Contrat',
  subscriptionDate: 'Date de Souscription',
  renewalDate: 'Date de Renouvellement',
  premium: 'Prime',
  coverage: 'Couverture',

  // Documents
  fileName: 'Nom du Fichier',
  fileSize: 'Taille',
  mimeType: 'Type de Fichier',
  documentType: 'Type de Document',
  documentCategory: 'Catégorie',
  version: 'Version',
  uploadedBy: 'Téléchargé par',
  uploadedAt: 'Date de Téléchargement',
  expiresAt: "Date d'Expiration",
  signatureStatus: 'Statut de Signature',

  // Objectifs
  title: 'Titre',
  targetAmount: 'Montant Cible',
  currentAmount: 'Montant Actuel',
  targetDate: 'Date Cible',
  priority: 'Priorité',
  progress: 'Progression',
  recommendedMonthlyContribution: 'Versement Mensuel Recommandé',
  lastReviewDate: 'Dernière Révision',

  // Tâches
  assignedToId: 'Assigné à',
  assignedById: 'Assigné par',
  dueDate: "Date d'Échéance",
  completedAt: 'Date de Complétion',

  // Rendez-vous
  date: 'Date',
  duration: 'Durée',
  location: 'Lieu',
  notes: 'Notes',
  attendees: 'Participants',

  // Projets
  budget: 'Budget',
  deadline: 'Date Limite',
  completion: 'Avancement',

  // Simulations
  simulationType: 'Type de Simulation',
  simulationData: 'Données',
  results: 'Résultats',
  savedAt: 'Date de Sauvegarde',
  sharedWith: 'Partagé avec',

  // Relations
  clientId: 'ID Client',
  conseillerId: 'ID Conseiller',
  cabinetId: 'ID Cabinet',
};

/**
 * Traduit un nom de champ anglais en français
 */
function translateFieldName(fieldName: string): string {
  return FIELD_TRANSLATIONS[fieldName] || fieldName;
}

/**
 * Convertit un objet avec clés anglaises en objet avec clés françaises
 */
function translateObject(obj: Record<string, unknown>): Record<string, unknown> {
  const translated: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const frenchKey = translateFieldName(key);

    // Gérer les valeurs spéciales
    if (value === null || value === undefined) {
      translated[frenchKey] = '';
    } else if (value instanceof Date) {
      translated[frenchKey] = value.toLocaleDateString('fr-FR');
    } else if (typeof value === 'boolean') {
      translated[frenchKey] = value ? 'Oui' : 'Non';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Pour les objets JSON (wealth, address, etc.), extraire les valeurs principales
      if (key === 'wealth' && value) {
        const wealth = value as Record<string, unknown>;
        translated['Patrimoine Net'] = wealth.netWealth || '';
        translated['Total Actifs'] = wealth.totalAssets || '';
        translated['Total Passifs'] = wealth.totalLiabilities || '';
        translated['Actifs Gérés'] = wealth.managedAssets || '';
      } else if (key === 'address' && value) {
        const addr = value as Record<string, unknown>;
        translated['Adresse'] = addr.street || '';
        translated['Ville'] = addr.city || '';
        translated['Code Postal'] = addr.postalCode || '';
        translated['Pays'] = addr.country || '';
      } else {
        translated[frenchKey] = '[Objet]';
      }
    } else if (Array.isArray(value)) {
      translated[frenchKey] = value.join(', ');
    } else {
      translated[frenchKey] = value;
    }
  }

  return translated;
}

/**
 * Convertit un tableau d'objets en CSV avec en-têtes français
 */
export function toCSV(data: Record<string, unknown>[], options: { delimiter?: string } = {}): string {
  if (!data || data.length === 0) {
    return '';
  }

  const delimiter = options.delimiter || ';';

  // Traduire les objets
  const translatedData = data.map(translateObject);

  // Extraire les en-têtes (clés françaises)
  const headers = Object.keys(translatedData[0]);

  // Créer le CSV
  const csvRows: string[] = [];

  // Ajouter les en-têtes
  csvRows.push(headers.map((h) => `"${h}"`).join(delimiter));

  // Ajouter les données
  for (const row of translatedData) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(delimiter));
  }

  return csvRows.join('\n');
}

/**
 * Prépare les données pour l'export en sélectionnant les champs pertinents
 */
export function prepareForExport(data: Record<string, unknown>[], type: string): Record<string, unknown>[] {
  const fieldsByType: Record<string, string[]> = {
    clients: [
      'id',
      'clientType',
      'email',
      'firstName',
      'lastName',
      'phone',
      'mobile',
      'birthDate',
      'maritalStatus',
      'profession',
      'annualIncome',
      'companyName',
      'siret',
      'legalForm',
      'activitySector',
      'riskProfile',
      'kycStatus',
      'status',
      'createdAt',
    ],
    actifs: [
      'id',
      'name',
      'type',
      'category',
      'currentValue',
      'purchaseValue',
      'purchaseDate',
      'annualIncome',
      'performance',
      'managed',
      'ownershipPercentage',
      'createdAt',
    ],
    passifs: [
      'id',
      'name',
      'type',
      'originalAmount',
      'remainingAmount',
      'monthlyPayment',
      'interestRate',
      'startDate',
      'endDate',
      'status',
      'createdAt',
    ],
    contrats: [
      'id',
      'name',
      'contractType',
      'provider',
      'contractNumber',
      'subscriptionDate',
      'renewalDate',
      'currentValue',
      'premium',
      'status',
      'createdAt',
    ],
    documents: [
      'id',
      'name',
      'fileName',
      'documentType',
      'documentCategory',
      'fileSize',
      'version',
      'uploadedAt',
      'expiresAt',
      'signatureStatus',
    ],
    objectifs: [
      'id',
      'title',
      'type',
      'targetAmount',
      'currentAmount',
      'targetDate',
      'priority',
      'status',
      'progress',
      'createdAt',
    ],
    taches: [
      'id',
      'title',
      'type',
      'priority',
      'status',
      'dueDate',
      'completedAt',
      'createdAt',
    ],
    rendezvous: [
      'id',
      'title',
      'date',
      'duration',
      'location',
      'status',
      'createdAt',
    ],
    projets: [
      'id',
      'name',
      'type',
      'status',
      'budget',
      'deadline',
      'completion',
      'createdAt',
    ],
    opportunites: [
      'id',
      'title',
      'type',
      'status',
      'estimatedValue',
      'probability',
      'expectedCloseDate',
      'createdAt',
    ],
    simulations: [
      'id',
      'simulationType',
      'name',
      'description',
      'savedAt',
      'createdAt',
    ],
  };

  const fields = fieldsByType[type] || Object.keys(data[0] || {});

  return data.map((item) => {
    const filtered: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (item[field] !== undefined) {
        filtered[field] = item[field];
      }
    });
    return filtered;
  });
}

/**
 * Génère un nom de fichier pour l'export
 */
export function generateFilename(
  type: string,
  cabinetName: string = '',
  format: 'csv' | 'xlsx' | 'pdf' = 'csv'
): string {
  const date = new Date().toISOString().split('T')[0];
  const cabinet = cabinetName
    ? `_${cabinetName.replace(/[^a-z0-9]/gi, '_')}`
    : '';
  return `export_${type}${cabinet}_${date}.${format}`;
}

/**
 * Exporte les clients d'un cabinet
 */
export async function exportClients(cabinetId: string, filters?: Record<string, unknown>) {
  const clients = await prisma.client.findMany({
    where: {
      cabinetId,
      ...filters,
    },
    select: {
      id: true,
      clientType: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      mobile: true,
      birthDate: true,
      maritalStatus: true,
      profession: true,
      annualIncome: true,
      companyName: true,
      siret: true,
      legalForm: true,
      activitySector: true,
      riskProfile: true,
      kycStatus: true,
      status: true,
      wealth: true,
      createdAt: true,
      conseiller: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Aplatir les données du conseiller
  const flattenedClients = clients.map((client) => ({
    ...client,
    conseillerName: client.conseiller
      ? `${client.conseiller.firstName} ${client.conseiller.lastName}`
      : '',
  }));

  return prepareForExport(flattenedClients, 'clients');
}

/**
 * Exporte le patrimoine d'un client
 */
export async function exportPatrimoine(clientId: string) {
  const [actifs, passifs, contrats] = await Promise.all([
    prisma.actif.findMany({
      where: {
        clients: {
          some: {
            clientId,
          },
        },
      },
      include: {
        clients: {
          select: {
            clientId: true,
            ownershipPercentage: true,
          },
        },
      },
    }),
    prisma.passif.findMany({
      where: { clientId },
    }),
    prisma.contrat.findMany({
      where: { clientId },
    }),
  ]);

  // Aplatir les actifs avec le pourcentage de propriété
  const flattenedActifs = actifs.map((actif) => {
    const clientActif = actif.clients.find((ca) => ca.clientId === clientId);
    return {
      ...actif,
      ownershipPercentage: clientActif?.ownershipPercentage || 100,
    };
  });

  return {
    actifs: prepareForExport(flattenedActifs, 'actifs'),
    passifs: prepareForExport(passifs, 'passifs'),
    contrats: prepareForExport(contrats, 'contrats'),
  };
}

/**
 * Exporte les documents d'un client
 */
export async function exportDocuments(clientId: string) {
  const documents = await prisma.document.findMany({
    where: {
      clients: {
        some: {
          clientId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      fileSize: true,
      version: true,
      uploadedAt: true,
      signatureStatus: true,
      uploadedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Aplatir les données de l'uploader
  const flattenedDocuments = documents.map((doc) => ({
    ...doc,
    uploadedByName: doc.uploadedBy
      ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
      : '',
  }));

  return prepareForExport(flattenedDocuments, 'documents');
}

/**
 * Exporte les simulations d'un client
 */
export async function exportSimulations(clientId: string) {
  const simulations = await prisma.simulation.findMany({
    where: { clientId },
    select: {
      id: true,
      type: true,
      name: true,
      description: true,
      parameters: true,
      results: true,
      createdAt: true,
      createdById: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Aplatir les données du créateur
  const flattenedSimulations = simulations.map((sim) => ({
    ...sim,
    createdByName: sim.createdBy
      ? `${sim.createdBy.firstName} ${sim.createdBy.lastName}`
      : '',
  }));

  return prepareForExport(flattenedSimulations, 'simulations');
}

export { translateFieldName, translateObject, FIELD_TRANSLATIONS };
