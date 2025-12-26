import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedComplianceData, cleanupComplianceData } from './seeds/compliance-seed';
import { seedOperationsData, cleanupOperationsData } from './seeds/operations-seed';
import { seedTemplatesData, cleanupTemplatesData } from './seeds/templates-seed';

const prisma = new PrismaClient();

// ============================================
// Command Line Arguments
// ============================================

interface SeedOptions {
  skipMain: boolean;
  compliance: boolean;
  operations: boolean;
  templates: boolean;
  all: boolean;
  cleanup: boolean;
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  return {
    skipMain: args.includes('--skip-main'),
    compliance: args.includes('--compliance'),
    operations: args.includes('--operations'),
    templates: args.includes('--templates'),
    all: args.includes('--all') || args.length === 0,
    cleanup: args.includes('--cleanup'),
  };
}

// Helper constants
const NOW = new Date(); // Should be Dec 2025
const CURRENT_YEAR = NOW.getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;
const PREV_YEAR = CURRENT_YEAR - 1;

// Helper to create dates relative to now
function getDate(yearOffset: number, month: number, day: number, hour: number = 0): Date {
  const year = CURRENT_YEAR + yearOffset;
  return new Date(year, month, day, hour);
}

// Helper types
interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  profession?: string;
  annualIncome?: number;
  maritalStatus?: string;
  numberOfChildren?: number;
  taxBracket?: string;
  ifiSubject?: boolean;
  ifiAmount?: number;
}

// Helper function to create all associated data for a client
async function createClientAssociatedData(
  cabinetId: string,
  conseillerId: string,
  client: ClientData,
  index: number
) {
  const isParticulier = client.clientType === 'PARTICULIER';
  const baseIncome = client.annualIncome || 50000;

  // ============ ACTIFS ============
  const actifs = [];

  // Actif 1: Résidence principale ou Local professionnel
  const actif1 = await prisma.actif.create({
    data: {
      cabinetId,
      type: isParticulier ? 'RESIDENCE_PRINCIPALE' : 'IMMOBILIER_PRO',
      category: 'IMMOBILIER',
      name: isParticulier ? `Résidence principale - ${client.lastName}` : `Local professionnel - ${client.lastName}`,
      description: isParticulier ? 'Résidence principale du client' : 'Local commercial ou bureaux',
      value: 250000 + (index * 50000),
      acquisitionDate: getDate(-10 + (index % 5), index % 12, 1),
      acquisitionValue: 200000 + (index * 40000),
      details: {
        surface: 80 + (index * 10),
        rooms: 3 + (index % 3),
      },
      managedByFirm: false,
      isActive: true
    }
  });
  actifs.push(actif1);

  await prisma.clientActif.create({
    data: {
      clientId: client.id,
      actifId: actif1.id,
      ownershipPercentage: 100,
      ownershipType: 'Pleine propriété'
    }
  });

  // Actif 2: Assurance Vie
  const actif2 = await prisma.actif.create({
    data: {
      cabinetId,
      type: 'ASSURANCE_VIE',
      category: 'FINANCIER',
      name: `Assurance Vie ${['Axa', 'Generali', 'Allianz', 'Swiss Life', 'CNP'][index % 5]} - ${client.lastName}`,
      description: 'Contrat multisupport',
      value: 50000 + (index * 15000),
      acquisitionDate: getDate(-5 + (index % 4), (index * 2) % 12, 15),
      acquisitionValue: 40000 + (index * 10000),
      details: {
        provider: ['Axa', 'Generali', 'Allianz', 'Swiss Life', 'CNP'][index % 5],
        contractNumber: `AV${100000 + index}`,
        fonds: ['Fonds euros 60%', 'UC actions 30%', 'UC obligations 10%']
      },
      annualIncome: 1500 + (index * 200),
      managedByFirm: true,
      managementFees: 1.5,
      isActive: true
    }
  });
  actifs.push(actif2);

  await prisma.clientActif.create({
    data: {
      clientId: client.id,
      actifId: actif2.id,
      ownershipPercentage: 100
    }
  });

  // Actif 3: PEA ou PER
  const actif3 = await prisma.actif.create({
    data: {
      cabinetId,
      type: index % 2 === 0 ? 'PEA' : 'PER',
      category: 'FINANCIER',
      name: `${index % 2 === 0 ? 'PEA' : 'PER'} ${['Boursorama', 'Fortuneo', 'BforBank', 'ING', 'Hello Bank'][index % 5]} - ${client.lastName}`,
      description: index % 2 === 0 ? 'Plan Épargne Actions' : 'Plan Épargne Retraite',
      value: 25000 + (index * 8000),
      acquisitionDate: getDate(-3 + (index % 3), (index * 3) % 12, 10),
      acquisitionValue: 20000 + (index * 5000),
      details: {
        provider: ['Boursorama', 'Fortuneo', 'BforBank', 'ING', 'Hello Bank'][index % 5],
        accountNumber: `${index % 2 === 0 ? 'PEA' : 'PER'}${200000 + index}`
      },
      annualIncome: 800 + (index * 100),
      managedByFirm: index % 2 === 0,
      isActive: true
    }
  });
  actifs.push(actif3);

  await prisma.clientActif.create({
    data: {
      clientId: client.id,
      actifId: actif3.id,
      ownershipPercentage: 100
    }
  });

  // ============ PASSIFS ============
  // Passif 1: Crédit immobilier
  await prisma.passif.create({
    data: {
      cabinetId,
      clientId: client.id,
      type: 'CREDIT_IMMOBILIER',
      name: 'Prêt immobilier résidence',
      description: `${['Crédit Agricole', 'BNP', 'Société Générale', 'LCL', 'CIC'][index % 5]} - ${20 + (index % 5)} ans`,
      initialAmount: 180000 + (index * 30000),
      remainingAmount: 100000 + (index * 20000),
      interestRate: 1.5 + (index % 10) * 0.1,
      monthlyPayment: 900 + (index * 100),
      startDate: getDate(-8 + (index % 5), index % 12, 1),
      endDate: getDate(12 + (index % 5), index % 12, 1),
      linkedActifId: actif1.id,
      insurance: {
        provider: ['CNP', 'Cardif', 'Suravenir', 'BPCE Vie', 'ACM'][index % 5],
        monthlyPremium: 30 + (index * 5)
      },
      isActive: true
    }
  });

  // Passif 2: Crédit conso ou pro selon le type
  if (index % 3 !== 0) {
    await prisma.passif.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: isParticulier ? 'CREDIT_CONSOMMATION' : 'PRET_PROFESSIONNEL',
        name: isParticulier ? 'Crédit auto' : 'Crédit équipement professionnel',
        description: 'Financement véhicule ou équipement',
        initialAmount: 25000 + (index * 5000),
        remainingAmount: 15000 + (index * 3000),
        interestRate: 3.0 + (index % 5) * 0.2,
        monthlyPayment: 400 + (index * 30),
        startDate: getDate(-2, (index * 2) % 12, 1),
        endDate: getDate(3, (index * 2) % 12, 1),
        isActive: true
      }
    });
  }

  // ============ CONTRATS ============
  // Contrat 1: Assurance vie (lié à l'actif)
  await prisma.contrat.create({
    data: {
      cabinetId,
      clientId: client.id,
      type: 'ASSURANCE_VIE',
      name: `Assurance Vie ${['Axa', 'Generali', 'Allianz', 'Swiss Life', 'CNP'][index % 5]}`,
      provider: ['Axa', 'Generali', 'Allianz', 'Swiss Life', 'CNP'][index % 5],
      contractNumber: `AV${100000 + index}`,
      startDate: getDate(-5 + (index % 4), (index * 2) % 12, 15),
      premium: 300 + (index * 50),
      value: 50000 + (index * 15000),
      beneficiaries: {
        primary: ['Conjoint 100%'],
        secondary: ['Enfants à parts égales']
      },
      nextRenewalDate: getDate(1, (index * 2) % 12, 15),
      status: 'ACTIF'
    }
  });

  // Contrat 2: Mutuelle ou assurance pro
  await prisma.contrat.create({
    data: {
      cabinetId,
      clientId: client.id,
      type: isParticulier ? 'MUTUELLE' : 'ASSURANCE_PRO',
      name: isParticulier ? 'Mutuelle Santé' : 'RC Professionnelle',
      provider: ['Harmonie', 'MGEN', 'Malakoff', 'AG2R', 'April'][index % 5],
      contractNumber: `${isParticulier ? 'MUT' : 'RCP'}${300000 + index}`,
      startDate: getDate(-3 + (index % 3), 0, 1),
      premium: isParticulier ? 120 + (index * 20) : 350 + (index * 50),
      coverage: isParticulier ? 30000 : 500000,
      nextRenewalDate: getDate(1, 0, 1),
      status: 'ACTIF'
    }
  });

  // Contrat 3: Prévoyance
  await prisma.contrat.create({
    data: {
      cabinetId,
      clientId: client.id,
      type: 'PREVOYANCE',
      name: 'Prévoyance décès/invalidité',
      provider: ['Swiss Life', 'Generali', 'AXA', 'Allianz', 'Groupama'][index % 5],
      contractNumber: `PREV${400000 + index}`,
      startDate: getDate(-4 + (index % 4), 6, 1),
      premium: 80 + (index * 15),
      coverage: 200000 + (index * 50000),
      nextRenewalDate: getDate(1, 6, 1),
      status: 'ACTIF'
    }
  });

  // ============ DOCUMENTS ============
  const documentTypes: Array<{ type: 'CARTE_IDENTITE' | 'JUSTIFICATIF_DOMICILE' | 'AVIS_IMPOSITION' | 'RELEVE_BANCAIRE' | 'AUTRE'; category: 'IDENTITE' | 'FISCAL' | 'PATRIMOINE' | 'AUTRE'; name: string }> = [
    { type: 'CARTE_IDENTITE', category: 'IDENTITE', name: `CNI ${client.firstName} ${client.lastName}` },
    { type: 'JUSTIFICATIF_DOMICILE', category: 'IDENTITE', name: 'Justificatif domicile' },
    { type: 'AVIS_IMPOSITION', category: 'FISCAL', name: `Avis imposition ${CURRENT_YEAR - 1}` },
    { type: 'RELEVE_BANCAIRE', category: 'PATRIMOINE', name: 'Relevé bancaire récent' },
    { type: 'AUTRE', category: 'AUTRE', name: `Bulletin salaire ${new Date().toLocaleString('fr-FR', { month: 'long' })}` }
  ];

  for (let i = 0; i < documentTypes.length; i++) {
    const doc = await prisma.document.create({
      data: {
        cabinetId,
        name: documentTypes[i].name,
        description: `Document ${documentTypes[i].type.toLowerCase().replace('_', ' ')}`,
        fileUrl: `/uploads/documents/${client.lastName.toLowerCase()}-${documentTypes[i].type.toLowerCase()}.pdf`,
        fileSize: 150000 + (i * 30000),
        mimeType: 'application/pdf',
        type: documentTypes[i].type,
        category: documentTypes[i].category,
        uploadedById: conseillerId,
        uploadedAt: getDate(0, index % 12, 1 + i)
      }
    });

    await prisma.clientDocument.create({
      data: {
        clientId: client.id,
        documentId: doc.id
      }
    });
  }

  // ============ OBJECTIFS ============
  const objectifTypes: Array<{ type: 'RETRAITE' | 'PROTECTION_CAPITAL' | 'ACHAT_IMMOBILIER'; name: string; target: number; priority: 'HAUTE' | 'MOYENNE' }> = [
    { type: 'RETRAITE', name: 'Préparation retraite', target: 400000, priority: 'HAUTE' },
    { type: 'PROTECTION_CAPITAL', name: 'Épargne de précaution', target: 30000, priority: 'HAUTE' },
    { type: 'ACHAT_IMMOBILIER', name: 'Projet immobilier', target: 100000, priority: 'MOYENNE' }
  ];

  for (let i = 0; i < (index % 3) + 1; i++) {
    const obj = objectifTypes[i];
    const targetAmount = obj.target + (index * 10000);
    const currentAmount = Math.floor(targetAmount * (0.2 + (index % 5) * 0.1));

    await prisma.objectif.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: obj.type,
        name: obj.name,
        description: `${obj.name} pour ${client.firstName} ${client.lastName}`,
        targetAmount,
        currentAmount,
        progress: Math.floor((currentAmount / targetAmount) * 100),
        targetDate: getDate(3 + i, 11, 31),
        priority: obj.priority as 'HAUTE' | 'MOYENNE' | 'BASSE',
        monthlyContribution: Math.floor(targetAmount / 120),
        status: 'ACTIF'
      }
    });
  }

  // ============ PROJETS avec TACHES ============
  const projetTypes: Array<{ type: 'OPTIMISATION_FISCALE' | 'RESTRUCTURATION_PATRIMOINE'; name: string }> = [
    { type: 'OPTIMISATION_FISCALE', name: `Optimisation fiscale ${CURRENT_YEAR}` },
    { type: 'RESTRUCTURATION_PATRIMOINE', name: 'Restructuration patrimoine' }
  ];

  const projet = await prisma.projet.create({
    data: {
      cabinetId,
      clientId: client.id,
      name: projetTypes[index % 2].name,
      description: `Projet ${projetTypes[index % 2].type.toLowerCase().replace('_', ' ')} pour ${client.firstName} ${client.lastName}`,
      type: projetTypes[index % 2].type,
      estimatedBudget: baseIncome * 0.5,
      actualBudget: baseIncome * 0.3,
      startDate: getDate(0, index % 12, 1),
      targetDate: getDate(1, (index + 6) % 12, 30),
      progress: 30 + (index * 5) % 50,
      status: 'EN_COURS'
    }
  });

  // Tâches liées au projet
  const tacheStatuses = ['TERMINE', 'EN_COURS', 'A_FAIRE'];
  for (let i = 0; i < 3; i++) {
    await prisma.tache.create({
      data: {
        cabinetId,
        assignedToId: conseillerId,
        clientId: client.id,
        projetId: projet.id,
        createdById: conseillerId,
        title: [`Analyse initiale`, `Proposition stratégie`, `Mise en œuvre`][i],
        description: `Étape ${i + 1} du projet`,
        type: (['REVUE_DOCUMENTS', 'REUNION', 'ADMINISTRATIF'] as const)[i],
        priority: ['HAUTE', 'HAUTE', 'MOYENNE'][i] as 'HAUTE' | 'MOYENNE' | 'BASSE' | 'URGENTE',
        status: tacheStatuses[i] as 'TERMINE' | 'EN_COURS' | 'A_FAIRE',
        dueDate: getDate(0, (index + i) % 12, 15 + i * 5),
        completedAt: i === 0 ? getDate(0, (index + i) % 12, 14 + i * 5) : undefined
      }
    });
  }

  // ============ RENDEZ-VOUS ============
  const rdvTypes: Array<'BILAN_ANNUEL' | 'SUIVI' | 'PREMIER_RDV' | 'SIGNATURE'> = ['BILAN_ANNUEL', 'SUIVI', 'PREMIER_RDV', 'SIGNATURE'];
  // Create appointments around NOW (some before, some after)
  await prisma.rendezVous.create({
    data: {
      cabinetId,
      conseillerId,
      clientId: client.id,
      title: `${['Bilan annuel', 'Point de suivi', 'Découverte', 'Signature documents'][index % 4]} - ${client.lastName}`,
      description: `Rendez-vous avec ${client.firstName} ${client.lastName}`,
      type: rdvTypes[index % 4],
      startDate: getDate(0, 11, 10 + index, 9 + index), // Dec 2025
      endDate: getDate(0, 11, 10 + index, 10 + index),
      location: index % 2 === 0 ? 'Bureau' : 'Visioconférence',
      isVirtual: index % 2 !== 0,
      meetingUrl: index % 2 !== 0 ? `https://meet.google.com/rdv-${index}` : undefined,
      status: (['PLANIFIE', 'CONFIRME'] as const)[index % 2]
    }
  });

  // ============ OPPORTUNITÉS ============
  const oppoTypes: Array<{ type: 'EPARGNE_RETRAITE' | 'INVESTISSEMENT_IMMOBILIER' | 'OPTIMISATION_FISCALE' | 'TRANSMISSION_PATRIMOINE' | 'AUDIT_ASSURANCES'; name: string }> = [
    { type: 'EPARGNE_RETRAITE', name: 'Augmentation PER' },
    { type: 'INVESTISSEMENT_IMMOBILIER', name: 'Investissement SCPI' },
    { type: 'OPTIMISATION_FISCALE', name: 'Défiscalisation' },
    { type: 'TRANSMISSION_PATRIMOINE', name: 'Donation enfants' },
    { type: 'AUDIT_ASSURANCES', name: 'Révision assurances' }
  ];

  const oppo = oppoTypes[index % 5];
  const oppoStatuses: Array<'DETECTEE' | 'QUALIFIEE' | 'CONTACTEE' | 'PRESENTEE' | 'ACCEPTEE'> = ['DETECTEE', 'QUALIFIEE', 'CONTACTEE', 'PRESENTEE', 'ACCEPTEE'];

  await prisma.opportunite.create({
    data: {
      cabinetId,
      conseillerId,
      clientId: client.id,
      type: oppo.type,
      name: oppo.name,
      description: `${oppo.name} pour ${client.firstName} ${client.lastName}`,
      estimatedValue: 30000 + (index * 15000),
      score: 60 + (index * 5) % 35,
      confidence: 0.6 + (index * 0.05) % 0.35,
      priority: ['BASSE', 'MOYENNE', 'HAUTE'][index % 3] as 'BASSE' | 'MOYENNE' | 'HAUTE',
      status: oppoStatuses[index % 5],
      detectedAt: getDate(0, 9, 1 + index),
      qualifiedAt: index % 5 >= 1 ? getDate(0, 9, 5 + index) : undefined,
      contactedAt: index % 5 >= 2 ? getDate(0, 9, 10 + index) : undefined,
      presentedAt: index % 5 >= 3 ? getDate(0, 10, 1 + index) : undefined,
      acceptedAt: index % 5 >= 4 ? getDate(0, 10, 15 + index) : undefined,
      actionDeadline: getDate(1, (index + 2) % 12, 28)
    }
  });

  // ============ KYC DOCUMENTS ============
  const kycTypes: Array<'IDENTITE' | 'JUSTIFICATIF_DOMICILE' | 'AVIS_IMPOSITION' | 'RIB_BANCAIRE'> = ['IDENTITE', 'JUSTIFICATIF_DOMICILE', 'AVIS_IMPOSITION', 'RIB_BANCAIRE'];
  for (const kycType of kycTypes) {
    await prisma.kYCDocument.create({
      data: {
        cabinet: { connect: { id: cabinetId } },
        client: { connect: { id: client.id } },
        type: kycType,
        status: index % 3 === 2 ? 'EN_ATTENTE' : 'VALIDE',
        validatedAt: index % 3 !== 2 ? getDate(0, index % 12, 1) : undefined,
        validatedBy: index % 3 !== 2 ? { connect: { id: conseillerId } } : undefined,
        expiresAt: kycType === 'IDENTITE' ? getDate(10, index % 12, 1) :
          kycType === 'JUSTIFICATIF_DOMICILE' ? getDate(1, (index + 6) % 12, 1) :
            undefined
      }
    });
  }

  // ============ TIMELINE EVENTS ============
  const events: Array<{ type: 'CLIENT_CREATED' | 'KYC_UPDATED' | 'ASSET_ADDED' | 'CONTRACT_SIGNED'; title: string; description: string }> = [
    { type: 'CLIENT_CREATED', title: 'Client créé', description: 'Nouveau client ajouté au portefeuille' },
    { type: 'KYC_UPDATED', title: 'KYC mis à jour', description: 'Dossier KYC complété' },
    { type: 'ASSET_ADDED', title: 'Actif ajouté', description: 'Nouvel actif ajouté au patrimoine' },
    { type: 'CONTRACT_SIGNED', title: 'Contrat signé', description: 'Signature nouveau contrat' }
  ];

  for (let i = 0; i < events.length; i++) {
    await prisma.timelineEvent.create({
      data: {
        cabinetId,
        clientId: client.id,
        type: events[i].type,
        title: events[i].title,
        description: events[i].description,
        createdAt: getDate(0, index % 12, 1 + i * 5),
        createdBy: conseillerId
      }
    });
  }

  // ============ SIMULATIONS ============
  const simTypes: Array<{ type: 'RETRAITE' | 'CREDIT_IMMOBILIER' | 'OPTIMISATION_FISCALE'; name: string }> = [
    { type: 'RETRAITE', name: 'Simulation retraite' },
    { type: 'CREDIT_IMMOBILIER', name: 'Simulation prêt immobilier' },
    { type: 'OPTIMISATION_FISCALE', name: 'Simulation défiscalisation' }
  ];

  const simType = simTypes[index % 3];
  await prisma.simulation.create({
    data: {
      cabinetId,
      clientId: client.id,
      createdById: conseillerId,
      type: simType.type,
      name: `${simType.name} - ${client.lastName}`,
      description: `${simType.name} pour ${client.firstName} ${client.lastName}`,
      parameters: {
        income: baseIncome,
        age: 30 + (index * 3),
        horizon: 15 + (index % 10)
      },
      results: {
        projectedAmount: baseIncome * (5 + index),
        monthlyPayment: Math.floor(baseIncome / 12),
        feasibility: 'Réalisable'
      },
      feasibilityScore: 70 + (index * 3) % 25,
      status: index % 2 === 0 ? 'TERMINE' : 'BROUILLON',
      sharedWithClient: index % 2 === 0,
      sharedAt: index % 2 === 0 ? getDate(0, 10, 15) : undefined
    }
  });

  // ============ REVENUS ============
  const revenueCategories: Array<'SALAIRE' | 'PRIME' | 'REVENUS_FONCIERS' | 'DIVIDENDES'> = ['SALAIRE', 'PRIME', 'REVENUS_FONCIERS', 'DIVIDENDES'];
  for (let i = 0; i < 2 + (index % 2); i++) {
    const montantMensuel = i === 0 ? baseIncome / 12 : baseIncome / 24;
    const freq = i === 0 ? 'MENSUEL' : 'ANNUEL';
    const montantAnnuel = freq === 'MENSUEL' ? montantMensuel * 12 : montantMensuel;
    await prisma.revenue.create({
      data: {
        cabinetId,
        clientId: client.id,
        categorie: revenueCategories[i],
        libelle: `${revenueCategories[i].charAt(0) + revenueCategories[i].slice(1).toLowerCase().replace('_', ' ')}`,
        montant: montantMensuel,
        frequence: freq,
        montantAnnuel,
        dateDebut: getDate(0, 0, 1),
        isActive: true
      }
    });
  }

  // ============ DEPENSES ============
  const expenseCategories: Array<'LOYER' | 'ELECTRICITE_GAZ' | 'MUTUELLE' | 'ASSURANCE_HABITATION' | 'ALIMENTATION'> = ['LOYER', 'ELECTRICITE_GAZ', 'MUTUELLE', 'ASSURANCE_HABITATION', 'ALIMENTATION'];
  for (let i = 0; i < 4; i++) {
    const montant = [1200, 150, 120, 80, 600][i] + (index * 10);
    await prisma.expense.create({
      data: {
        cabinetId,
        clientId: client.id,
        categorie: expenseCategories[i],
        libelle: `${expenseCategories[i].charAt(0) + expenseCategories[i].slice(1).toLowerCase().replace('_', ' ')}`,
        montant,
        frequence: 'MENSUEL',
        montantAnnuel: montant * 12,
        dateDebut: getDate(0, 0, 1),
        isActive: true
      }
    });
  }

  // ============ FISCALITE ============
  const taxShares = (client.maritalStatus as string) === 'MARIE' ? 2 : 1 + (Number(client.numberOfChildren) || 0) * 0.5;
  const taxableIncome = baseIncome * 0.9; // 10% standard deduction
  const estimatedTax = taxableIncome * (parseFloat(client.taxBracket || '30') / 100);

  await prisma.clientTaxation.create({
    data: {
      clientId: client.id,
      anneeFiscale: CURRENT_YEAR,
      incomeTax: {
        fiscalReferenceIncome: taxableIncome,
        taxShares,
        quotientFamilial: taxableIncome / taxShares,
        taxBracket: parseFloat(client.taxBracket || '30'),
        annualAmount: estimatedTax,
        grossTax: estimatedTax,
        netTax: estimatedTax,
        monthlyPayment: estimatedTax / 12,
        taxCredits: 0,
        taxReductions: 0
      },
      ifi: client.ifiSubject ? {
        taxableRealEstateAssets: 2000000,
        deductibleLiabilities: 500000,
        netTaxableIFI: 1500000,
        ifiAmount: Number(client.ifiAmount) || 0,
        bracket: '0.7%',
        threshold: 1300000
      } : undefined
    }
  });

  // ============ OPTIMISATIONS FISCALES ============
  if (baseIncome > 60000) {
    await prisma.taxOptimization.create({
      data: {
        clientId: client.id,
        priority: 'HAUTE',
        category: 'RETIREMENT',
        title: 'Ouverture PER',
        description: 'Réduction impôt via déductibilité versements PER',
        potentialSavings: 3000,
        recommendation: 'Verser 10k sur un PER pour réduire le revenu imposable.',
        status: 'DETECTEE'
      }
    });
  }

  console.log(`   ✓ Données créées pour ${client.firstName} ${client.lastName}`);
}

async function main() {
  const options = parseArgs();

  // Handle cleanup mode
  if (options.cleanup) {
    console.log('🧹 Cleaning up demo data...');
    console.log('═══════════════════════════════════════\n');
    
    const cabinets = await prisma.cabinet.findMany({ select: { id: true, name: true } });
    
    for (const cabinet of cabinets) {
      console.log(`📦 Cleaning cabinet: ${cabinet.name}`);
      
      if (options.compliance || options.all) {
        await cleanupComplianceData(cabinet.id);
      }
      if (options.operations || options.all) {
        await cleanupOperationsData(cabinet.id);
      }
      if (options.templates || options.all) {
        await cleanupTemplatesData(cabinet.id);
      }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ Demo data cleanup completed!');
    console.log('═══════════════════════════════════════');
    return;
  }

  console.log('🌱 Starting COMPLETE database seed...');
  console.log(`📅 Base year: ${CURRENT_YEAR}`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Options:');
  console.log(`  --skip-main: ${options.skipMain}`);
  console.log(`  --compliance: ${options.compliance}`);
  console.log(`  --operations: ${options.operations}`);
  console.log(`  --templates: ${options.templates}`);
  console.log(`  --all: ${options.all}`);
  console.log('═══════════════════════════════════════\n');

  // Skip main seed if requested (useful for adding demo data to existing database)
  if (options.skipMain) {
    console.log('⏭️  Skipping main seed (--skip-main flag)\n');
  } else {
    console.log('🧹 Cleaning up database...');
    await prisma.cabinet.deleteMany();
    await prisma.superAdmin.deleteMany();
    console.log('✅ Database cleaned\n');

  // ============ SUPERADMIN ============
  console.log('👑 Creating SuperAdmin...');
  const superAdminPassword = await bcrypt.hash('Password123!', 10);
  await prisma.superAdmin.create({
    data: {
      email: 'superadmin@aura.fr',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'OWNER',
      isActive: true
    }
  });
  console.log('✅ SuperAdmin created\n');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // ============ CABINET 1: Aura Test ============
  console.log('📦 Creating Cabinet Aura Test...');
  const cabinet1 = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Aura Test',
      slug: 'cabinet-aura-test',
      email: 'contact@aura-test.fr',
      phone: '+33 1 23 45 67 89',
      address: {
        street: '123 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'France'
      },
      plan: 'BUSINESS',
      status: 'ACTIVE',
      subscriptionStart: getDate(0, 0, 1),
      subscriptionEnd: getDate(1, 11, 31),
      quotas: { maxUsers: 10, maxClients: 500, maxStorage: 10737418240 },
      usage: { users: 2, clients: 10, storage: 0 },
      features: { advancedReporting: true, apiAccess: true, customBranding: true }
    }
  });

  const admin1 = await prisma.user.create({
    data: {
      cabinetId: cabinet1.id,
      email: 'admin@aura.fr',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Administrateur',
      phone: '+33 6 12 34 56 78',
      role: 'ADMIN',
      permissions: { canManageUsers: true, canManageSettings: true, canViewAuditLogs: true, canExportData: true },
      isActive: true
    }
  });

  const conseiller1 = await prisma.user.create({
    data: {
      cabinetId: cabinet1.id,
      email: 'conseiller@aura.fr',
      password: hashedPassword,
      firstName: 'Marc',
      lastName: 'Conseiller',
      phone: '+33 6 23 45 67 89',
      role: 'ADVISOR',
      permissions: { canManageClients: true, canViewReports: true },
      isActive: true
    }
  });

  console.log('✅ Cabinet Aura Test created\n');

  // Clients Cabinet 1
  console.log('👤 Creating 10 clients for Cabinet Aura Test...');
  const clientsData1 = [
    { firstName: 'Jean', lastName: 'Dupont', type: 'PARTICULIER', email: 'jean.dupont@email.fr', birthDate: new Date('1975-05-15'), birthPlace: 'Paris', maritalStatus: 'MARIE', marriageRegime: 'Communauté réduite aux acquêts', numberOfChildren: 2, profession: 'Directeur Commercial', employerName: 'TechCorp France', professionalStatus: 'Cadre', annualIncome: 85000, taxBracket: '41%', riskProfile: 'EQUILIBRE' },
    { firstName: 'Marie', lastName: 'Martin', type: 'PARTICULIER', email: 'marie.martin@email.fr', birthDate: new Date('1982-08-22'), birthPlace: 'Marseille', maritalStatus: 'CELIBATAIRE', numberOfChildren: 0, profession: 'Médecin', employerName: 'Hôpital Saint-Louis', professionalStatus: 'Libéral', annualIncome: 120000, taxBracket: '45%', ifiSubject: true, ifiAmount: 8500, riskProfile: 'DYNAMIQUE' },
    { firstName: 'Pierre', lastName: 'Durand', type: 'PARTICULIER', email: 'pierre.durand@email.fr', birthDate: new Date('1968-03-10'), birthPlace: 'Bordeaux', maritalStatus: 'DIVORCE', numberOfChildren: 1, profession: 'Entrepreneur', professionalStatus: 'Indépendant', annualIncome: 95000, taxBracket: '41%', riskProfile: 'OFFENSIF' },
    { firstName: 'François', lastName: 'Leblanc', type: 'PROFESSIONNEL', email: 'f.leblanc@leblanc-sarl.fr', birthDate: new Date('1970-11-25'), birthPlace: 'Lille', companyName: 'Leblanc Consulting SARL', siret: '80795315300015', legalForm: 'SARL', activitySector: 'Conseil en gestion', numberOfEmployees: 8, annualRevenue: 850000, profession: 'Gérant', annualIncome: 150000, taxBracket: '45%', ifiSubject: true, ifiAmount: 12000, riskProfile: 'PRUDENT' },
    { firstName: 'Isabelle', lastName: 'Rousseau', type: 'PROFESSIONNEL', email: 'i.rousseau@rousseau-tech.fr', birthDate: new Date('1978-07-18'), birthPlace: 'Nice', companyName: 'Rousseau Technologies SAS', siret: '79219798000019', legalForm: 'SAS', activitySector: 'Développement logiciel', numberOfEmployees: 25, annualRevenue: 2500000, profession: 'Présidente', annualIncome: 180000, taxBracket: '45%', ifiSubject: true, ifiAmount: 18500, riskProfile: 'DYNAMIQUE' },
    { firstName: 'Michel', lastName: 'Bernard', type: 'PARTICULIER', email: 'michel.bernard@email.fr', birthDate: new Date('1955-02-14'), birthPlace: 'Lyon', maritalStatus: 'VEUF', numberOfChildren: 3, profession: 'Retraité (Ancien Ingénieur)', annualIncome: 45000, taxBracket: '30%', riskProfile: 'PRUDENT' },
    { firstName: 'Sophie', lastName: 'Leroy', type: 'PARTICULIER', email: 'sophie.leroy@email.fr', birthDate: new Date('1995-06-30'), maritalStatus: 'CELIBATAIRE', profession: 'Consultante Marketing', annualIncome: 52000, taxBracket: '30%', riskProfile: 'DYNAMIQUE' },
    { firstName: 'Thomas', lastName: 'Petit', type: 'PARTICULIER', email: 'thomas.petit@email.fr', birthDate: new Date('1980-09-12'), maritalStatus: 'MARIE', numberOfChildren: 2, profession: 'Architecte', annualIncome: 75000, taxBracket: '30%', riskProfile: 'EQUILIBRE' },
    { firstName: 'Philippe', lastName: 'Moreau', type: 'PROFESSIONNEL', email: 'dr.moreau@clinique.fr', birthDate: new Date('1972-11-05'), profession: 'Chirurgien Dentiste', professionalStatus: 'Libéral', companyName: 'Cabinet Dentaire Moreau', siret: '93352902600017', annualIncome: 250000, taxBracket: '45%', ifiSubject: true, riskProfile: 'DYNAMIQUE' },
    { firstName: 'Alexandre', lastName: 'Dumas', type: 'PARTICULIER', email: 'alex.dumas@invest.fr', birthDate: new Date('1985-04-01'), profession: 'Trader', annualIncome: 150000, taxBracket: '45%', riskProfile: 'OFFENSIF' }
  ];

  for (let i = 0; i < clientsData1.length; i++) {
    const c = clientsData1[i];
    const client = await prisma.client.create({
      data: {
        cabinetId: cabinet1.id,
        conseillerId: conseiller1.id,
        clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: `+33 6 ${String(10 + i).padStart(2, '0')} ${String(20 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')} ${String(40 + i).padStart(2, '0')}`,
        mobile: `+33 6 ${String(10 + i).padStart(2, '0')} ${String(20 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')} ${String(40 + i).padStart(2, '0')}`,
        birthDate: c.birthDate,
        birthPlace: c.birthPlace || 'France',
        nationality: 'Française',
        address: { street: `${10 + i * 5} Rue de la Paix`, city: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Annecy', 'Lille', 'Nantes', 'Strasbourg', 'Toulouse'][i], postalCode: `${75000 + i * 1000}`, country: 'France' },
        maritalStatus: c.maritalStatus as any || 'CELIBATAIRE',
        marriageRegime: c.marriageRegime,
        numberOfChildren: c.numberOfChildren || 0,
        profession: c.profession,
        employerName: c.employerName,
        professionalStatus: c.professionalStatus,
        annualIncome: c.annualIncome,
        taxBracket: c.taxBracket,
        fiscalResidence: 'France',
        irTaxRate: parseInt(c.taxBracket || '30'),
        ifiSubject: c.ifiSubject || false,
        ifiAmount: c.ifiAmount,
        companyName: c.companyName,
        siret: c.siret,
        legalForm: c.legalForm,
        activitySector: c.activitySector,
        numberOfEmployees: c.numberOfEmployees,
        annualRevenue: c.annualRevenue,
        riskProfile: c.riskProfile as any || 'EQUILIBRE',
        investmentHorizon: ['COURT', 'MOYEN', 'LONG'][i % 3] as any,
        investmentGoals: ['Retraite', 'Transmission', 'Croissance'][i % 3] ? [['Retraite', 'Transmission', 'Croissance'][i % 3]] : [],
        investmentKnowledge: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'][i % 4],
        managedByFirm: i % 3 !== 2,
        managementStartDate: i % 3 !== 2 ? getDate(-5 + (i % 4), i % 12, 1) : undefined,
        managementFees: i % 3 !== 2 ? 1.5 + (i % 3) * 0.3 : undefined,
        kycStatus: i % 3 === 2 ? 'EN_COURS' : 'COMPLET',
        kycCompletedAt: i % 3 !== 2 ? getDate(0, i % 12, 15) : undefined,
        kycNextReviewDate: getDate(1, (i + 6) % 12, 15),
        status: 'ACTIF',
        portalAccess: i <= 2 ? true : i % 4 !== 3,
        portalPassword: i <= 2 ? hashedPassword : undefined,
        lastContactDate: getDate(0, 10, 1 + i)
      }
    });

    await createClientAssociatedData(cabinet1.id, conseiller1.id, {
      id: client.id,
      firstName: c.firstName,
      lastName: c.lastName,
      clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
      profession: c.profession,
      annualIncome: c.annualIncome,
      maritalStatus: c.maritalStatus,
      numberOfChildren: c.numberOfChildren,
      taxBracket: c.taxBracket,
      ifiSubject: c.ifiSubject,
      ifiAmount: c.ifiAmount
    }, i);
  }

  console.log('✅ 10 clients with complete data created for Cabinet Aura Test\n');

  // ============ CABINET 2: Wealth Partners ============
  console.log('📦 Creating Cabinet Wealth Partners...');
  const cabinet2 = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Wealth Partners',
      slug: 'wealth-partners',
      email: 'contact@wealth-partners.com',
      phone: '+33 1 98 76 54 32',
      address: { street: '50 Avenue Montaigne', city: 'Paris', postalCode: '75008', country: 'France' },
      plan: 'PREMIUM',
      status: 'ACTIVE',
      subscriptionStart: getDate(0, 0, 1),
      subscriptionEnd: getDate(2, 11, 31),
      quotas: { maxUsers: 20, maxClients: 1000, maxStorage: 21474836480 },
      usage: { users: 1, clients: 4, storage: 0 },
      features: { advancedReporting: true, apiAccess: true, customBranding: true }
    }
  });

  const conseiller2 = await prisma.user.create({
    data: {
      cabinetId: cabinet2.id,
      email: 'advisor@wealth-partners.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Wealth',
      phone: '+33 6 98 76 54 32',
      role: 'ADVISOR',
      permissions: { canManageClients: true, canViewReports: true },
      isActive: true
    }
  });

  console.log('✅ Cabinet Wealth Partners created\n');

  // Clients Cabinet 2
  console.log('👤 Creating 4 clients for Cabinet Wealth Partners...');
  const clientsData2 = [
    { firstName: 'Robert', lastName: 'Kiyosaki', type: 'PARTICULIER', email: 'r.kiyosaki@email.com', birthDate: new Date('1965-04-08'), profession: 'Investisseur', annualIncome: 500000, taxBracket: '45%', riskProfile: 'OFFENSIF' },
    { firstName: 'Elon', lastName: 'Musk', type: 'PROFESSIONNEL', email: 'elon@tesla.com', birthDate: new Date('1971-06-28'), profession: 'CEO', companyName: 'SpaceX', siret: '44306184100047', annualIncome: 1000000, taxBracket: '45%', riskProfile: 'OFFENSIF' },
    { firstName: 'Warren', lastName: 'Buffett', type: 'PARTICULIER', email: 'warren@berkshire.com', birthDate: new Date('1930-08-30'), profession: 'Investisseur', annualIncome: 800000, taxBracket: '45%', riskProfile: 'EQUILIBRE' },
    { firstName: 'Christine', lastName: 'Lagarde', type: 'PARTICULIER', email: 'c.lagarde@email.fr', birthDate: new Date('1956-01-01'), profession: 'Économiste', annualIncome: 350000, taxBracket: '45%', riskProfile: 'PRUDENT' }
  ];

  for (let i = 0; i < clientsData2.length; i++) {
    const c = clientsData2[i];
    const client = await prisma.client.create({
      data: {
        cabinetId: cabinet2.id,
        conseillerId: conseiller2.id,
        clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: `+33 6 ${String(50 + i).padStart(2, '0')} ${String(60 + i).padStart(2, '0')} ${String(70 + i).padStart(2, '0')} ${String(80 + i).padStart(2, '0')}`,
        birthDate: c.birthDate,
        nationality: 'Française',
        address: { street: `${100 + i * 10} Avenue Foch`, city: 'Paris', postalCode: '75016', country: 'France' },
        profession: c.profession,
        annualIncome: c.annualIncome,
        taxBracket: c.taxBracket,
        companyName: c.companyName,
        siret: c.siret,
        riskProfile: c.riskProfile as any,
        status: 'ACTIF',
        portalAccess: true
      }
    });

    await createClientAssociatedData(cabinet2.id, conseiller2.id, {
      id: client.id,
      firstName: c.firstName,
      lastName: c.lastName,
      clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
      profession: c.profession,
      annualIncome: c.annualIncome
    }, 10 + i);
  }

  console.log('✅ 4 clients with complete data created for Cabinet Wealth Partners\n');

  // ============ CABINET 3: Patrimoine Sud ============
  console.log('📦 Creating Cabinet Patrimoine Sud...');
  const cabinet3 = await prisma.cabinet.create({
    data: {
      name: 'Cabinet Patrimoine Sud',
      slug: 'patrimoine-sud',
      email: 'contact@patrimoine-sud.fr',
      phone: '+33 4 91 23 45 67',
      address: { street: '25 Quai du Port', city: 'Marseille', postalCode: '13002', country: 'France' },
      plan: 'STARTER',
      status: 'ACTIVE',
      subscriptionStart: getDate(0, 0, 1),
      subscriptionEnd: getDate(1, 11, 31),
      quotas: { maxUsers: 3, maxClients: 100, maxStorage: 5368709120 },
      usage: { users: 1, clients: 3, storage: 0 },
      features: { advancedReporting: false, apiAccess: false, customBranding: false }
    }
  });

  const conseiller3 = await prisma.user.create({
    data: {
      cabinetId: cabinet3.id,
      email: 'conseil@patrimoine-sud.fr',
      password: hashedPassword,
      firstName: 'Julien',
      lastName: 'Sud',
      phone: '+33 6 11 22 33 44',
      role: 'ADVISOR',
      permissions: { canManageClients: true, canViewReports: true },
      isActive: true
    }
  });

  console.log('✅ Cabinet Patrimoine Sud created\n');

  // Clients Cabinet 3
  console.log('👤 Creating 3 clients for Cabinet Patrimoine Sud...');
  const clientsData3 = [
    { firstName: 'Marius', lastName: 'Pagnol', type: 'PARTICULIER', email: 'marius@marseille.fr', birthDate: new Date('1970-03-15'), profession: 'Restaurateur', annualIncome: 65000, taxBracket: '30%', riskProfile: 'PRUDENT' },
    { firstName: 'Fanny', lastName: 'César', type: 'PARTICULIER', email: 'fanny@provence.fr', birthDate: new Date('1975-07-20'), profession: 'Commerçante', annualIncome: 55000, taxBracket: '30%', riskProfile: 'EQUILIBRE' },
    { firstName: 'César', lastName: 'Panisse', type: 'PROFESSIONNEL', email: 'cesar@bar-marine.fr', birthDate: new Date('1960-12-01'), profession: 'Gérant', companyName: 'Bar de la Marine SARL', siret: '35248953800017', annualIncome: 80000, taxBracket: '30%', riskProfile: 'PRUDENT' }
  ];

  for (let i = 0; i < clientsData3.length; i++) {
    const c = clientsData3[i];
    const client = await prisma.client.create({
      data: {
        cabinetId: cabinet3.id,
        conseillerId: conseiller3.id,
        clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: `+33 6 ${String(20 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')} ${String(40 + i).padStart(2, '0')} ${String(50 + i).padStart(2, '0')}`,
        birthDate: c.birthDate,
        nationality: 'Française',
        address: { street: `${5 + i * 3} Rue de la Canebière`, city: 'Marseille', postalCode: '13001', country: 'France' },
        profession: c.profession,
        annualIncome: c.annualIncome,
        taxBracket: c.taxBracket,
        companyName: c.companyName,
        siret: c.siret,
        riskProfile: c.riskProfile as any,
        status: 'ACTIF',
        portalAccess: true
      }
    });

    await createClientAssociatedData(cabinet3.id, conseiller3.id, {
      id: client.id,
      firstName: c.firstName,
      lastName: c.lastName,
      clientType: c.type as 'PARTICULIER' | 'PROFESSIONNEL',
      profession: c.profession,
      annualIncome: c.annualIncome
    }, 14 + i);
  }

  console.log('✅ 3 clients with complete data created for Cabinet Patrimoine Sud\n');

  // ============ TACHES GLOBALES ============
  console.log('📋 Creating global tasks...');
  const globalTasks = [
    { title: 'Préparer revue annuelle clients', type: 'ADMINISTRATIF', priority: 'MOYENNE', status: 'A_FAIRE' },
    { title: 'Appeler prospect Bertrand', type: 'APPEL', priority: 'HAUTE', status: 'A_FAIRE' },
    { title: 'Mettre à jour KYC expirés', type: 'MISE_A_JOUR_KYC', priority: 'URGENTE', status: 'EN_COURS' },
    { title: 'Newsletter décembre', type: 'EMAIL', priority: 'BASSE', status: 'TERMINE' },
    { title: 'Formation réglementation', type: 'AUTRE', priority: 'MOYENNE', status: 'A_FAIRE' }
  ];

  for (let i = 0; i < globalTasks.length; i++) {
    const t = globalTasks[i];
    await prisma.tache.create({
      data: {
        cabinetId: cabinet1.id,
        assignedToId: conseiller1.id,
        createdById: i % 2 === 0 ? admin1.id : conseiller1.id,
        title: t.title,
        type: t.type as 'APPEL' | 'EMAIL' | 'REUNION' | 'REVUE_DOCUMENTS' | 'MISE_A_JOUR_KYC' | 'RENOUVELLEMENT_CONTRAT' | 'SUIVI' | 'ADMINISTRATIF' | 'AUTRE',
        priority: t.priority as any,
        status: t.status as any,
        dueDate: getDate(0, 11, 15 + i),
        completedAt: t.status === 'TERMINE' ? getDate(0, 11, 14 + i) : undefined
      }
    });
  }
  console.log('✅ Global tasks created\n');
  } // End of if (!options.skipMain)

  // ============ DEMO DATA SEEDING ============
  // Seed demo data for compliance, operations, and templates
  const shouldSeedDemo = options.compliance || options.operations || options.templates || options.all;
  
  if (shouldSeedDemo) {
    console.log('\n═══════════════════════════════════════');
    console.log('🎭 Seeding demo data...');
    console.log('═══════════════════════════════════════\n');

    // Get all cabinets for demo data seeding
    const cabinets = await prisma.cabinet.findMany({
      include: { 
        users: { 
          where: { role: 'ADVISOR' }, 
          take: 1 
        } 
      }
    });

    for (const cabinet of cabinets) {
      const userId = cabinet.users[0]?.id;
      if (!userId) {
        console.log(`   ⚠️ No advisor found for cabinet ${cabinet.name}, skipping demo data`);
        continue;
      }

      console.log(`\n📦 Seeding demo data for: ${cabinet.name}`);
      console.log('───────────────────────────────────────');

      if (options.compliance || options.all) {
        await seedComplianceData(cabinet.id, userId);
      }

      if (options.operations || options.all) {
        await seedOperationsData(cabinet.id, userId);
      }

      if (options.templates || options.all) {
        await seedTemplatesData(cabinet.id, userId);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Demo data seeding completed!');
    console.log('═══════════════════════════════════════\n');
  }

  // ============ SUMMARY ============
  console.log('═══════════════════════════════════════');
  console.log('🎉 Database seed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log('');
  if (!options.skipMain) {
    console.log('📦 Cabinets: 3');
    console.log('   - Cabinet Aura Test (BUSINESS) - 10 clients');
    console.log('   - Cabinet Wealth Partners (PREMIUM) - 4 clients');
    console.log('   - Cabinet Patrimoine Sud (STARTER) - 3 clients');
    console.log('');
    console.log('👤 Total Clients: 17');
    console.log('   Chaque client a:');
    console.log('   ✓ 3 actifs (immobilier + assurance vie + PEA/PER)');
    console.log('   ✓ 1-2 passifs (crédit immobilier + crédit conso)');
    console.log('   ✓ 3 contrats (AV + mutuelle/RC Pro + prévoyance)');
    console.log('   ✓ 5 documents (CNI, domicile, impôts, bancaire, salaire)');
    console.log('   ✓ 1-3 objectifs (retraite, épargne, immobilier)');
    console.log('   ✓ 1 projet avec 3 tâches');
    console.log('   ✓ 1 rendez-vous');
    console.log('   ✓ 1 opportunité');
    console.log('   ✓ 4 documents KYC');
    console.log('   ✓ 4 événements timeline');
    console.log('   ✓ 1 simulation');
    console.log('   ✓ 2-3 revenus');
    console.log('   ✓ 4 dépenses');
    console.log('');
  }
  if (shouldSeedDemo) {
    console.log('🎭 Demo Data (marked with [DEMO] prefix):');
    if (options.compliance || options.all) {
      console.log('   ✓ KYC Documents (valid, pending, expired, expiring)');
      console.log('   ✓ Compliance Controls (ACPR mandatory)');
      console.log('   ✓ Réclamations with SLA tracking');
      console.log('   ✓ Compliance Alerts');
      console.log('   ✓ Timeline Events');
    }
    if (options.operations || options.all) {
      console.log('   ✓ Providers (AXA, Generali, Swiss Life, etc.)');
      console.log('   ✓ Products (Assurance Vie, PER, SCPI, etc.)');
      console.log('   ✓ Affaires Nouvelles at different stages');
      console.log('   ✓ Opérations de Gestion');
    }
    if (options.templates || options.all) {
      console.log('   ✓ Document Templates (DER, Recueil, Lettre Mission, etc.)');
      console.log('   ✓ Templates by association (CNCGP, ANACOFI, CNCEF, Generic)');
    }
    console.log('');
  }
  console.log('✨ Credentials:');
  console.log('   SuperAdmin: superadmin@aura.fr / Password123!');
  console.log('   Aura Admin: admin@aura.fr / Password123!');
  console.log('   Aura Conseiller: conseiller@aura.fr / Password123!');
  console.log('   Wealth Partners: advisor@wealth-partners.com / Password123!');
  console.log('   Patrimoine Sud: conseil@patrimoine-sud.fr / Password123!');
  console.log('');
  console.log('👤 Client Portal:');
  console.log('   Client 1: jean.dupont@email.fr / Password123!');
  console.log('   Client 2: marie.martin@email.fr / Password123!');
  console.log('   Client 3: pierre.durand@email.fr / Password123!');
  console.log('');
  console.log('📖 Usage:');
  console.log('   npx prisma db seed                    # Full seed (main + all demo data)');
  console.log('   npx prisma db seed -- --skip-main     # Only demo data (existing DB)');
  console.log('   npx prisma db seed -- --compliance    # Main + compliance demo only');
  console.log('   npx prisma db seed -- --operations    # Main + operations demo only');
  console.log('   npx prisma db seed -- --templates     # Main + templates demo only');
  console.log('   npx prisma db seed -- --cleanup       # Remove all demo data');
  console.log('   npx prisma db seed -- --cleanup --compliance  # Remove compliance demo only');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
