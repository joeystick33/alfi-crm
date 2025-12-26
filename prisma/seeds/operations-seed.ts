/**
 * Seed script pour les données de démonstration des opérations
 * 
 * Ce script génère des données de démo pour:
 * - Providers (fournisseurs/assureurs)
 * - Products (produits financiers)
 * - Affaires Nouvelles à différents stades
 * - Opérations de Gestion
 * - Historique des statuts
 * 
 * @module prisma/seeds/operations-seed
 */

import { PrismaClient, Prisma } from '@prisma/client';

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
 * Génère une référence d'affaire nouvelle unique
 */
function generateAffaireReference(index: number): string {
  const paddedSequence = (1000 + index).toString().padStart(4, '0');
  return `AN-${CURRENT_YEAR}-${paddedSequence}`;
}

/**
 * Génère une référence d'opération de gestion unique
 */
function generateOperationReference(index: number): string {
  const paddedSequence = (1000 + index).toString().padStart(4, '0');
  return `OG-${CURRENT_YEAR}-${paddedSequence}`;
}

// ============================================
// Provider Data
// ============================================

const PROVIDERS_DATA = [
  {
    name: 'AXA France',
    type: 'ASSUREUR',
    siren: '310499959',
    address: '313 Terrasses de l\'Arche, 92727 Nanterre Cedex',
    commercialContact: { name: 'Marie Dupont', email: 'marie.dupont@axa.fr', phone: '+33 1 47 74 10 00' },
    backOfficeContact: { name: 'Jean Martin', email: 'backoffice@axa.fr', phone: '+33 1 47 74 10 01' },
    extranetUrl: 'https://espacepro.axa.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: true,
  },
  {
    name: 'Generali France',
    type: 'ASSUREUR',
    siren: '552062663',
    address: '2 rue Pillet-Will, 75009 Paris',
    commercialContact: { name: 'Sophie Bernard', email: 'sophie.bernard@generali.fr', phone: '+33 1 58 38 70 00' },
    backOfficeContact: { name: 'Pierre Leroy', email: 'backoffice@generali.fr', phone: '+33 1 58 38 70 01' },
    extranetUrl: 'https://pro.generali.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: true,
  },
  {
    name: 'Swiss Life France',
    type: 'ASSUREUR',
    siren: '341785632',
    address: '7 rue Belgrand, 92300 Levallois-Perret',
    commercialContact: { name: 'François Petit', email: 'francois.petit@swisslife.fr', phone: '+33 1 46 17 20 00' },
    backOfficeContact: { name: 'Claire Moreau', email: 'backoffice@swisslife.fr', phone: '+33 1 46 17 20 01' },
    extranetUrl: 'https://partenaires.swisslife.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: false,
  },
  {
    name: 'Amundi Asset Management',
    type: 'SOCIETE_GESTION',
    siren: '437574452',
    address: '91-93 boulevard Pasteur, 75015 Paris',
    commercialContact: { name: 'Thomas Durand', email: 'thomas.durand@amundi.com', phone: '+33 1 76 33 30 00' },
    backOfficeContact: null,
    extranetUrl: 'https://pro.amundi.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: false,
  },
  {
    name: 'Primonial REIM',
    type: 'SOCIETE_GESTION',
    siren: '531231124',
    address: '36 rue de Naples, 75008 Paris',
    commercialContact: { name: 'Isabelle Roux', email: 'isabelle.roux@primonial.fr', phone: '+33 1 44 21 70 00' },
    backOfficeContact: { name: 'Marc Simon', email: 'backoffice@primonial.fr', phone: '+33 1 44 21 70 01' },
    extranetUrl: 'https://partenaires.primonial.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: true,
  },
  {
    name: 'Nortia',
    type: 'PLATEFORME',
    siren: '378153057',
    address: '215 avenue Le Nôtre, 59650 Villeneuve d\'Ascq',
    commercialContact: { name: 'Laurent Blanc', email: 'laurent.blanc@nortia.fr', phone: '+33 3 20 67 67 67' },
    backOfficeContact: { name: 'Anne Dubois', email: 'backoffice@nortia.fr', phone: '+33 3 20 67 67 68' },
    extranetUrl: 'https://www.nortia.fr',
    conventionStatus: 'ACTIVE',
    isFavorite: false,
  },
];

// ============================================
// Product Data
// ============================================

const PRODUCTS_DATA = [
  // AXA Products
  {
    providerIndex: 0,
    name: 'AXA Coralis Selection',
    code: 'AXA-CS-001',
    type: 'ASSURANCE_VIE',
    characteristics: {
      entryFees: { min: 0, max: 4.5, default: 2 },
      managementFees: { min: 0.6, max: 1.2, default: 0.85 },
      exitFees: 0,
      options: ['Gestion libre', 'Gestion pilotée', 'Garantie plancher'],
    },
    minimumInvestment: 1000,
  },
  {
    providerIndex: 0,
    name: 'AXA PER Confort',
    code: 'AXA-PER-001',
    type: 'PER_INDIVIDUEL',
    characteristics: {
      entryFees: { min: 0, max: 3, default: 1.5 },
      managementFees: { min: 0.5, max: 1, default: 0.75 },
      exitFees: 0,
      options: ['Sortie capital', 'Sortie rente', 'Sortie mixte'],
    },
    minimumInvestment: 500,
  },
  // Generali Products
  {
    providerIndex: 1,
    name: 'Generali Epargne',
    code: 'GEN-EP-001',
    type: 'ASSURANCE_VIE',
    characteristics: {
      entryFees: { min: 0, max: 4, default: 2 },
      managementFees: { min: 0.6, max: 1, default: 0.8 },
      exitFees: 0,
      options: ['Gestion libre', 'Gestion sous mandat'],
    },
    minimumInvestment: 1500,
  },
  {
    providerIndex: 1,
    name: 'Generali Capitalisation',
    code: 'GEN-CAP-001',
    type: 'CAPITALISATION',
    characteristics: {
      entryFees: { min: 0, max: 3.5, default: 1.5 },
      managementFees: { min: 0.5, max: 0.9, default: 0.7 },
      exitFees: 0,
      options: ['Gestion libre'],
    },
    minimumInvestment: 5000,
  },
  // Swiss Life Products
  {
    providerIndex: 2,
    name: 'SwissLife Stratégic Premium',
    code: 'SL-SP-001',
    type: 'ASSURANCE_VIE',
    characteristics: {
      entryFees: { min: 0, max: 5, default: 2.5 },
      managementFees: { min: 0.7, max: 1.2, default: 0.9 },
      exitFees: 0,
      options: ['Gestion libre', 'Gestion pilotée', 'Private Equity'],
    },
    minimumInvestment: 10000,
  },
  // Primonial SCPI
  {
    providerIndex: 4,
    name: 'Primovie',
    code: 'PRIM-PV-001',
    type: 'SCPI',
    characteristics: {
      entryFees: { min: 8, max: 12, default: 10 },
      managementFees: { min: 0.8, max: 1.2, default: 1 },
      exitFees: 0,
      options: ['Pleine propriété', 'Nue-propriété', 'Usufruit'],
    },
    minimumInvestment: 5000,
  },
  {
    providerIndex: 4,
    name: 'Primopierre',
    code: 'PRIM-PP-001',
    type: 'SCPI',
    characteristics: {
      entryFees: { min: 8, max: 12, default: 10 },
      managementFees: { min: 0.9, max: 1.3, default: 1.1 },
      exitFees: 0,
      options: ['Pleine propriété', 'Nue-propriété'],
    },
    minimumInvestment: 3000,
  },
];

// ============================================
// Main Seed Function
// ============================================

export async function seedOperationsData(cabinetId: string, userId: string) {
  console.log('📊 Seeding operations demo data...');

  // Get clients for this cabinet
  const clients = await prisma.client.findMany({
    where: { cabinetId },
    take: 10,
    orderBy: { createdAt: 'asc' },
  });

  if (clients.length === 0) {
    console.log('   ⚠️ No clients found for cabinet, skipping operations seed');
    return;
  }

  console.log(`   📋 Found ${clients.length} clients for operations data`);

  // Seed Providers
  const providers = await seedProviders(cabinetId);

  // Seed Products
  const products = await seedProducts(providers);

  // Seed Affaires Nouvelles
  const affaires = await seedAffairesNouvelles(cabinetId, clients, providers, products, userId);

  // Seed Operations de Gestion
  await seedOperationsGestion(cabinetId, clients, affaires, userId);

  console.log('✅ Operations demo data seeded successfully');
}

// ============================================
// Providers Seed
// ============================================

async function seedProviders(cabinetId: string) {
  console.log('   🏢 Seeding providers...');

  const providers: { id: string; name: string }[] = [];

  for (const providerData of PROVIDERS_DATA) {
    const provider = await prisma.operationProvider.create({
      data: {
        cabinetId,
        name: `[DEMO] ${providerData.name}`,
        type: providerData.type as 'ASSUREUR' | 'SOCIETE_GESTION' | 'BANQUE' | 'PLATEFORME',
        siren: providerData.siren,
        address: providerData.address,
        commercialContact: providerData.commercialContact,
        backOfficeContact: providerData.backOfficeContact,
        extranetUrl: providerData.extranetUrl,
        conventionStatus: providerData.conventionStatus as 'ACTIVE' | 'INACTIVE' | 'PENDING',
        isFavorite: providerData.isFavorite,
        notes: '[DEMO] Fournisseur de démonstration',
      },
    });
    providers.push({ id: provider.id, name: providerData.name });
  }

  console.log(`   ✓ ${providers.length} providers created`);
  return providers;
}

// ============================================
// Products Seed
// ============================================

async function seedProducts(providers: { id: string; name: string }[]) {
  console.log('   📦 Seeding products...');

  const products: { id: string; providerId: string; type: string }[] = [];

  for (const productData of PRODUCTS_DATA) {
    if (productData.providerIndex >= providers.length) continue;
    const provider = providers[productData.providerIndex];

    const product = await prisma.operationProduct.create({
      data: {
        providerId: provider.id,
        name: `[DEMO] ${productData.name}`,
        code: productData.code,
        type: productData.type as 'ASSURANCE_VIE' | 'PER_INDIVIDUEL' | 'PER_ENTREPRISE' | 'SCPI' | 'OPCI' | 'COMPTE_TITRES' | 'PEA' | 'PEA_PME' | 'CAPITALISATION' | 'FCPR' | 'FCPI' | 'FIP' | 'IMMOBILIER_DIRECT' | 'CREDIT_IMMOBILIER',
        characteristics: productData.characteristics,
        minimumInvestment: productData.minimumInvestment,
        documentTemplates: [],
        isActive: true,
      },
    });
    products.push({ id: product.id, providerId: provider.id, type: productData.type });
  }

  console.log(`   ✓ ${products.length} products created`);
  return products;
}


// ============================================
// Affaires Nouvelles Seed
// ============================================

async function seedAffairesNouvelles(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  providers: { id: string; name: string }[],
  products: { id: string; providerId: string; type: string }[],
  userId: string
) {
  console.log('   💼 Seeding affaires nouvelles...');

  const affaireScenarios = [
    // Affaire 1: Prospect stage
    {
      clientIndex: 0,
      productType: 'ASSURANCE_VIE',
      status: 'PROSPECT',
      source: 'CLIENT_EXISTANT',
      estimatedAmount: 50000,
      daysAgo: 5,
    },
    // Affaire 2: Qualification stage
    {
      clientIndex: 1,
      productType: 'PER_INDIVIDUEL',
      status: 'QUALIFICATION',
      source: 'PROSPECTION',
      estimatedAmount: 30000,
      daysAgo: 10,
    },
    // Affaire 3: Constitution stage (documents being gathered)
    {
      clientIndex: 2,
      productType: 'ASSURANCE_VIE',
      status: 'CONSTITUTION',
      source: 'REFERRAL',
      estimatedAmount: 100000,
      daysAgo: 20,
    },
    // Affaire 4: Signature stage
    {
      clientIndex: 3,
      productType: 'SCPI',
      status: 'SIGNATURE',
      source: 'CLIENT_EXISTANT',
      estimatedAmount: 25000,
      daysAgo: 15,
    },
    // Affaire 5: Sent to provider
    {
      clientIndex: 4,
      productType: 'CAPITALISATION',
      status: 'ENVOYE',
      source: 'PARTENAIRE',
      estimatedAmount: 75000,
      daysAgo: 8,
    },
    // Affaire 6: In processing
    {
      clientIndex: 0,
      productType: 'PER_INDIVIDUEL',
      status: 'EN_TRAITEMENT',
      source: 'CLIENT_EXISTANT',
      estimatedAmount: 20000,
      daysAgo: 25,
    },
    // Affaire 7: Validated (completed)
    {
      clientIndex: 1,
      productType: 'ASSURANCE_VIE',
      status: 'VALIDE',
      source: 'PROSPECTION',
      estimatedAmount: 80000,
      actualAmount: 85000,
      daysAgo: 45,
    },
    // Affaire 8: Rejected
    {
      clientIndex: 2,
      productType: 'SCPI',
      status: 'REJETE',
      source: 'SITE_WEB',
      estimatedAmount: 15000,
      daysAgo: 30,
      rejectionReason: 'Dossier incomplet - justificatif d\'origine des fonds manquant',
    },
    // Affaire 9: Cancelled
    {
      clientIndex: 3,
      productType: 'ASSURANCE_VIE',
      status: 'ANNULE',
      source: 'REFERRAL',
      estimatedAmount: 40000,
      daysAgo: 35,
      cancellationReason: 'Client a changé d\'avis - projet immobilier prioritaire',
    },
    // Affaire 10: En cours (inactive for 15 days)
    {
      clientIndex: 4,
      productType: 'ASSURANCE_VIE',
      status: 'CONSTITUTION',
      source: 'CLIENT_EXISTANT',
      estimatedAmount: 60000,
      daysAgo: 25,
      lastActivityDaysAgo: 15,
    },
  ];

  const affaires: { id: string; clientId: string; status: string }[] = [];

  for (let i = 0; i < affaireScenarios.length; i++) {
    const scenario = affaireScenarios[i];
    if (scenario.clientIndex >= clients.length) continue;
    const client = clients[scenario.clientIndex];

    // Find a matching product and provider
    const matchingProduct = products.find(p => p.type === scenario.productType);
    const providerId = matchingProduct?.providerId || providers[0].id;
    const productId = matchingProduct?.id || null;

    const createdAt = getDate(-scenario.daysAgo);
    const lastActivityAt = (scenario as { lastActivityDaysAgo?: number }).lastActivityDaysAgo 
      ? getDate(-(scenario as { lastActivityDaysAgo: number }).lastActivityDaysAgo)
      : getDate(-Math.min(scenario.daysAgo, 3));

    const affaire = await prisma.affaireNouvelle.create({
      data: {
        cabinetId,
        reference: generateAffaireReference(i + 1),
        clientId: client.id,
        productType: scenario.productType as 'ASSURANCE_VIE' | 'PER_INDIVIDUEL' | 'PER_ENTREPRISE' | 'SCPI' | 'OPCI' | 'COMPTE_TITRES' | 'PEA' | 'PEA_PME' | 'CAPITALISATION' | 'FCPR' | 'FCPI' | 'FIP' | 'IMMOBILIER_DIRECT' | 'CREDIT_IMMOBILIER',
        providerId,
        productId,
        status: scenario.status as 'PROSPECT' | 'QUALIFICATION' | 'CONSTITUTION' | 'SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'VALIDE' | 'REJETE' | 'ANNULE',
        source: scenario.source as 'PROSPECTION' | 'REFERRAL' | 'CLIENT_EXISTANT' | 'PARTENAIRE' | 'SITE_WEB' | 'AUTRE',
        estimatedAmount: scenario.estimatedAmount,
        actualAmount: (scenario as { actualAmount?: number }).actualAmount || null,
        targetDate: getDate(30),
        productDetails: getProductDetails(scenario.productType),
        entryFees: 2,
        managementFees: 0.85,
        expectedCommission: scenario.estimatedAmount * 0.02,
        lastActivityAt,
        rejectionReason: (scenario as { rejectionReason?: string }).rejectionReason || null,
        cancellationReason: (scenario as { cancellationReason?: string }).cancellationReason || null,
        createdById: userId,
        createdAt,
        updatedAt: lastActivityAt,
      },
    });

    affaires.push({ id: affaire.id, clientId: client.id, status: scenario.status });

    // Create status history
    await createAffaireStatusHistory(affaire.id, scenario.status, userId, createdAt);
  }

  console.log(`   ✓ ${affaires.length} affaires nouvelles created`);
  return affaires;
}

/**
 * Generate product-specific details based on product type
 */
function getProductDetails(productType: string): Prisma.InputJsonValue {
  switch (productType) {
    case 'ASSURANCE_VIE':
      return {
        type: 'ASSURANCE_VIE',
        allocation: [
          { fundId: 'fund-1', fundName: 'Fonds Euros', percentage: 60 },
          { fundId: 'fund-2', fundName: 'UC Actions Europe', percentage: 30 },
          { fundId: 'fund-3', fundName: 'UC Obligations', percentage: 10 },
        ],
        beneficiaryClause: 'Mon conjoint, à défaut mes enfants nés ou à naître, vivants ou représentés, par parts égales entre eux',
        paymentMode: 'UNIQUE',
      };
    case 'PER_INDIVIDUEL':
      return {
        type: 'PER_INDIVIDUEL',
        compartment: 'INDIVIDUEL',
        beneficiaryClause: 'Mon conjoint, à défaut mes héritiers',
        exitOptions: ['CAPITAL', 'RENTE'],
      };
    case 'SCPI':
      return {
        type: 'SCPI',
        numberOfShares: 50,
        paymentSchedule: [
          { date: new Date().toISOString(), amount: 25000, status: 'PENDING' },
        ],
        dismemberment: null,
      };
    case 'CAPITALISATION':
      return {
        type: 'CAPITALISATION',
        allocation: [
          { fundId: 'fund-1', fundName: 'Fonds Euros', percentage: 70 },
          { fundId: 'fund-2', fundName: 'UC Diversifié', percentage: 30 },
        ],
        beneficiaryClause: 'N/A - Contrat de capitalisation',
        paymentMode: 'UNIQUE',
      };
    default:
      return { type: 'OTHER', data: {} };
  }
}

/**
 * Create status history for an affaire
 */
async function createAffaireStatusHistory(
  affaireId: string,
  currentStatus: string,
  userId: string,
  createdAt: Date
) {
  const statusOrder = ['PROSPECT', 'QUALIFICATION', 'CONSTITUTION', 'SIGNATURE', 'ENVOYE', 'EN_TRAITEMENT', 'VALIDE'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex <= 0) return;

  // Create history entries for each status transition
  for (let i = 0; i < currentIndex; i++) {
    const fromStatus = i === 0 ? null : statusOrder[i - 1];
    const toStatus = statusOrder[i];
    const historyDate = new Date(createdAt);
    historyDate.setDate(historyDate.getDate() + i * 3);

    await prisma.affaireStatusHistory.create({
      data: {
        affaireId,
        fromStatus: fromStatus as 'PROSPECT' | 'QUALIFICATION' | 'CONSTITUTION' | 'SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'VALIDE' | 'REJETE' | 'ANNULE' | null,
        toStatus: toStatus as 'PROSPECT' | 'QUALIFICATION' | 'CONSTITUTION' | 'SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'VALIDE' | 'REJETE' | 'ANNULE',
        note: `[DEMO] Passage au statut ${toStatus}`,
        userId,
        createdAt: historyDate,
      },
    });
  }
}

// ============================================
// Operations de Gestion Seed
// ============================================

async function seedOperationsGestion(
  cabinetId: string,
  clients: { id: string; firstName: string; lastName: string }[],
  affaires: { id: string; clientId: string; status: string }[],
  userId: string
) {
  console.log('   🔄 Seeding operations de gestion...');

  // Only create operations for validated affaires
  const validatedAffaires = affaires.filter(a => a.status === 'VALIDE');
  
  if (validatedAffaires.length === 0) {
    console.log('   ⚠️ No validated affaires found, creating operations for first affaire');
    // Use first affaire as fallback
    if (affaires.length > 0) {
      validatedAffaires.push(affaires[0]);
    }
  }

  const operationScenarios = [
    // Operation 1: Versement complémentaire - Draft
    {
      affaireIndex: 0,
      type: 'VERSEMENT_COMPLEMENTAIRE',
      status: 'BROUILLON',
      amount: 10000,
      daysAgo: 3,
    },
    // Operation 2: Arbitrage - Awaiting signature
    {
      affaireIndex: 0,
      type: 'ARBITRAGE',
      status: 'EN_ATTENTE_SIGNATURE',
      amount: null,
      daysAgo: 7,
    },
    // Operation 3: Rachat partiel - Sent
    {
      affaireIndex: 0,
      type: 'RACHAT_PARTIEL',
      status: 'ENVOYE',
      amount: 5000,
      daysAgo: 10,
    },
    // Operation 4: Modification bénéficiaire - Executed
    {
      affaireIndex: 0,
      type: 'MODIFICATION_BENEFICIAIRE',
      status: 'EXECUTE',
      amount: null,
      daysAgo: 30,
    },
    // Operation 5: Versement - In processing
    {
      affaireIndex: 0,
      type: 'VERSEMENT_COMPLEMENTAIRE',
      status: 'EN_TRAITEMENT',
      amount: 15000,
      daysAgo: 5,
    },
  ];

  let operationsCreated = 0;

  for (let i = 0; i < operationScenarios.length; i++) {
    const scenario = operationScenarios[i];
    const affaireIndex = Math.min(scenario.affaireIndex, validatedAffaires.length - 1);
    if (affaireIndex < 0) continue;
    
    const affaire = validatedAffaires[affaireIndex];
    const client = clients.find(c => c.id === affaire.clientId);
    if (!client) continue;

    const createdAt = getDate(-scenario.daysAgo);
    const isExecuted = scenario.status === 'EXECUTE';

    const operation = await prisma.operationGestion.create({
      data: {
        cabinetId,
        reference: generateOperationReference(i + 1),
        clientId: client.id,
        contractId: `CONTRACT-${affaire.id.slice(-8)}`,
        affaireOrigineId: affaire.id,
        type: scenario.type as 'VERSEMENT_COMPLEMENTAIRE' | 'ARBITRAGE' | 'RACHAT_PARTIEL' | 'RACHAT_TOTAL' | 'AVANCE' | 'MODIFICATION_BENEFICIAIRE' | 'CHANGEMENT_OPTION_GESTION' | 'TRANSFERT',
        status: scenario.status as 'BROUILLON' | 'EN_ATTENTE_SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'EXECUTE' | 'REJETE',
        amount: scenario.amount,
        effectiveDate: isExecuted ? getDate(-scenario.daysAgo + 5) : null,
        operationDetails: getOperationDetails(scenario.type, scenario.amount),
        executedAt: isExecuted ? getDate(-scenario.daysAgo + 5) : null,
        createdById: userId,
        createdAt,
        updatedAt: getDate(-1),
      },
    });

    // Create status history
    await createOperationStatusHistory(operation.id, scenario.status, userId, createdAt);
    operationsCreated++;
  }

  console.log(`   ✓ ${operationsCreated} operations de gestion created`);
}

/**
 * Generate operation-specific details based on operation type
 */
function getOperationDetails(operationType: string, amount: number | null): Prisma.InputJsonValue {
  switch (operationType) {
    case 'VERSEMENT_COMPLEMENTAIRE':
      return {
        type: 'VERSEMENT_COMPLEMENTAIRE',
        allocation: [
          { fundId: 'fund-1', fundName: 'Fonds Euros', percentage: 60 },
          { fundId: 'fund-2', fundName: 'UC Actions', percentage: 40 },
        ],
        allocationMode: 'IDENTIQUE',
      };
    case 'ARBITRAGE':
      return {
        type: 'ARBITRAGE',
        sourceAllocations: [
          { fundId: 'fund-1', fundName: 'Fonds Euros', percentage: 100 },
        ],
        targetAllocations: [
          { fundId: 'fund-2', fundName: 'UC Actions Europe', percentage: 50 },
          { fundId: 'fund-3', fundName: 'UC Obligations', percentage: 50 },
        ],
        arbitrageType: 'PONCTUEL',
      };
    case 'RACHAT_PARTIEL':
    case 'RACHAT_TOTAL':
      return {
        type: operationType,
        destinationRib: 'FR76 1234 5678 9012 3456 7890 123',
        taxSimulation: {
          contractAge: 8,
          totalGains: (amount || 5000) * 0.2,
          taxableAmount: (amount || 5000) * 0.2,
          estimatedTax: (amount || 5000) * 0.2 * 0.128,
          taxRate: 12.8,
          socialCharges: (amount || 5000) * 0.2 * 0.172,
        },
      };
    case 'MODIFICATION_BENEFICIAIRE':
      return {
        type: 'MODIFICATION_BENEFICIAIRE',
        newClause: 'Mon conjoint, à défaut mes enfants nés ou à naître, vivants ou représentés, par parts égales entre eux, à défaut mes héritiers',
        previousClause: 'Mon conjoint, à défaut mes héritiers',
      };
    default:
      return { type: 'OTHER', data: {} };
  }
}

/**
 * Create status history for an operation
 */
async function createOperationStatusHistory(
  operationId: string,
  currentStatus: string,
  userId: string,
  createdAt: Date
) {
  const statusOrder = ['BROUILLON', 'EN_ATTENTE_SIGNATURE', 'ENVOYE', 'EN_TRAITEMENT', 'EXECUTE'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentIndex <= 0) return;

  // Create history entries for each status transition
  for (let i = 0; i < currentIndex; i++) {
    const fromStatus = i === 0 ? null : statusOrder[i - 1];
    const toStatus = statusOrder[i];
    const historyDate = new Date(createdAt);
    historyDate.setDate(historyDate.getDate() + i * 2);

    await prisma.operationStatusHistory.create({
      data: {
        operationId,
        fromStatus: fromStatus as 'BROUILLON' | 'EN_ATTENTE_SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'EXECUTE' | 'REJETE' | null,
        toStatus: toStatus as 'BROUILLON' | 'EN_ATTENTE_SIGNATURE' | 'ENVOYE' | 'EN_TRAITEMENT' | 'EXECUTE' | 'REJETE',
        note: `[DEMO] Passage au statut ${toStatus}`,
        userId,
        createdAt: historyDate,
      },
    });
  }
}

// ============================================
// Cleanup Function
// ============================================

export async function cleanupOperationsData(cabinetId: string) {
  console.log('🧹 Cleaning up operations demo data...');

  // Delete in order to respect foreign key constraints
  await prisma.operationStatusHistory.deleteMany({
    where: { 
      operation: { cabinetId },
      note: { contains: '[DEMO]' }
    },
  });

  await prisma.operationGestion.deleteMany({
    where: { cabinetId },
  });

  await prisma.affaireStatusHistory.deleteMany({
    where: { 
      affaire: { cabinetId },
      note: { contains: '[DEMO]' }
    },
  });

  await prisma.affaireNouvelle.deleteMany({
    where: { cabinetId },
  });

  await prisma.operationProduct.deleteMany({
    where: { 
      provider: { cabinetId },
      name: { startsWith: '[DEMO]' }
    },
  });

  await prisma.operationProvider.deleteMany({
    where: { 
      cabinetId,
      name: { startsWith: '[DEMO]' }
    },
  });

  console.log('✅ Operations demo data cleaned up');
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

    await seedOperationsData(cabinet.id, userId);
  } catch (error) {
    console.error('❌ Operations seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
