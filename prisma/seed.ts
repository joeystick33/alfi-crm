import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if cabinet already exists (idempotency)
  const existingCabinet = await prisma.cabinet.findFirst({
    where: { slug: 'cabinet-alfi-test' }
  });

  if (existingCabinet) {
    console.log('✅ Cabinet already exists, skipping seed');
    return;
  }

  // 1. Create Cabinet
  console.log('📦 Creating cabinet...');
  const cabinet = await prisma.cabinet.create({
    data: {
      name: 'Cabinet ALFI Test',
      slug: 'cabinet-alfi-test',
      email: 'contact@alfi-test.fr',
      phone: '+33 1 23 45 67 89',
      address: {
        street: '123 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'France'
      },
      plan: 'BUSINESS',
      status: 'ACTIVE',
      subscriptionStart: new Date('2024-01-01'),
      subscriptionEnd: new Date('2025-12-31'),
      quotas: {
        maxUsers: 10,
        maxClients: 500,
        maxStorage: 10737418240 // 10GB
      },
      usage: {
        users: 2,
        clients: 5,
        storage: 0
      },
      features: {
        advancedReporting: true,
        apiAccess: true,
        customBranding: true
      }
    }
  });

  console.log(`✅ Cabinet created: ${cabinet.name}`);

  // 2. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      cabinetId: cabinet.id,
      email: 'admin@alfi.fr',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Administrateur',
      phone: '+33 6 12 34 56 78',
      role: 'ADMIN',
      permissions: {
        canManageUsers: true,
        canManageSettings: true,
        canViewAuditLogs: true,
        canExportData: true
      },
      isActive: true
    }
  });

  const conseiller = await prisma.user.create({
    data: {
      cabinetId: cabinet.id,
      email: 'conseiller@alfi.fr',
      password: hashedPassword,
      firstName: 'Marc',
      lastName: 'Conseiller',
      phone: '+33 6 23 45 67 89',
      role: 'ADVISOR',
      permissions: {
        canManageClients: true,
        canViewReports: true
      },
      isActive: true
    }
  });

  console.log(`✅ Users created: ${admin.email}, ${conseiller.email}`);

  // 3. Create Clients
  console.log('👤 Creating clients...');

  // Client 1: Particulier - Jean Dupont
  const clientDupont = await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientType: 'PARTICULIER',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      phone: '+33 6 34 56 78 90',
      mobile: '+33 6 34 56 78 90',
      birthDate: new Date('1975-05-15'),
      birthPlace: 'Paris',
      nationality: 'Française',
      address: {
        street: '45 Rue de la République',
        city: 'Lyon',
        postalCode: '69002',
        country: 'France'
      },
      maritalStatus: 'MARRIED',
      marriageRegime: 'Communauté réduite aux acquêts',
      numberOfChildren: 2,
      profession: 'Directeur Commercial',
      employerName: 'TechCorp France',
      professionalStatus: 'Cadre',
      annualIncome: 85000,
      taxBracket: '41%',
      fiscalResidence: 'France',
      irTaxRate: 41,
      ifiSubject: false,
      riskProfile: 'EQUILIBRE',
      investmentHorizon: 'LONG',
      investmentGoals: ['Retraite', 'Transmission'],
      investmentKnowledge: 'Intermédiaire',
      investmentExperience: '5-10 ans',
      managedByFirm: true,
      managementStartDate: new Date('2023-01-15'),
      managementFees: 1.5,
      managementType: 'Gestion conseillée',
      kycStatus: 'COMPLETED',
      kycCompletedAt: new Date('2023-02-01'),
      kycNextReviewDate: new Date('2025-02-01'),
      status: 'ACTIVE',
      portalAccess: true,
      lastContactDate: new Date('2024-11-01')
    }
  });

  // Client 2: Particulier - Marie Martin
  const clientMartin = await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientType: 'PARTICULIER',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@email.fr',
      phone: '+33 6 45 67 89 01',
      mobile: '+33 6 45 67 89 01',
      birthDate: new Date('1982-08-22'),
      birthPlace: 'Marseille',
      nationality: 'Française',
      address: {
        street: '78 Boulevard Haussmann',
        city: 'Paris',
        postalCode: '75008',
        country: 'France'
      },
      maritalStatus: 'SINGLE',
      numberOfChildren: 0,
      profession: 'Médecin',
      employerName: 'Hôpital Saint-Louis',
      professionalStatus: 'Libéral',
      annualIncome: 120000,
      taxBracket: '45%',
      fiscalResidence: 'France',
      irTaxRate: 45,
      ifiSubject: true,
      ifiAmount: 8500,
      riskProfile: 'DYNAMIQUE',
      investmentHorizon: 'MEDIUM',
      investmentGoals: ['Croissance du capital', 'Optimisation fiscale'],
      investmentKnowledge: 'Avancé',
      investmentExperience: '10+ ans',
      managedByFirm: true,
      managementStartDate: new Date('2022-06-01'),
      managementFees: 1.8,
      managementType: 'Gestion pilotée',
      kycStatus: 'COMPLETED',
      kycCompletedAt: new Date('2022-07-15'),
      kycNextReviewDate: new Date('2024-07-15'),
      status: 'ACTIVE',
      portalAccess: true,
      lastContactDate: new Date('2024-10-20')
    }
  });

  // Client 3: Particulier - Pierre Durand
  const clientDurand = await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientType: 'PARTICULIER',
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@email.fr',
      phone: '+33 6 56 78 90 12',
      mobile: '+33 6 56 78 90 12',
      birthDate: new Date('1968-03-10'),
      birthPlace: 'Bordeaux',
      nationality: 'Française',
      address: {
        street: '12 Cours de l\'Intendance',
        city: 'Bordeaux',
        postalCode: '33000',
        country: 'France'
      },
      maritalStatus: 'DIVORCED',
      numberOfChildren: 1,
      profession: 'Entrepreneur',
      employerName: 'Auto-entrepreneur',
      professionalStatus: 'Indépendant',
      annualIncome: 95000,
      taxBracket: '41%',
      fiscalResidence: 'France',
      irTaxRate: 41,
      ifiSubject: false,
      riskProfile: 'OFFENSIF',
      investmentHorizon: 'LONG',
      investmentGoals: ['Croissance agressive', 'Diversification'],
      investmentKnowledge: 'Expert',
      investmentExperience: '15+ ans',
      managedByFirm: false,
      kycStatus: 'IN_PROGRESS',
      status: 'ACTIVE',
      portalAccess: false,
      lastContactDate: new Date('2024-11-10')
    }
  });

  // Client 4: Professionnel - Entreprise Leblanc SARL
  const clientLeblanc = await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientType: 'PROFESSIONNEL',
      firstName: 'François',
      lastName: 'Leblanc',
      email: 'f.leblanc@leblanc-sarl.fr',
      phone: '+33 4 78 90 12 34',
      mobile: '+33 6 67 89 01 23',
      birthDate: new Date('1970-11-25'),
      birthPlace: 'Lille',
      nationality: 'Française',
      address: {
        street: '89 Rue Nationale',
        city: 'Lille',
        postalCode: '59000',
        country: 'France'
      },
      companyName: 'Leblanc Consulting SARL',
      siret: '12345678901234',
      legalForm: 'SARL',
      activitySector: 'Conseil en gestion',
      companyCreationDate: new Date('2010-03-15'),
      numberOfEmployees: 8,
      annualRevenue: 850000,
      profession: 'Gérant',
      annualIncome: 150000,
      taxBracket: '45%',
      fiscalResidence: 'France',
      irTaxRate: 45,
      ifiSubject: true,
      ifiAmount: 12000,
      riskProfile: 'PRUDENT',
      investmentHorizon: 'MEDIUM',
      investmentGoals: ['Sécurité', 'Revenus réguliers'],
      investmentKnowledge: 'Intermédiaire',
      investmentExperience: '5-10 ans',
      managedByFirm: true,
      managementStartDate: new Date('2020-09-01'),
      managementFees: 2.0,
      managementType: 'Gestion conseillée',
      kycStatus: 'COMPLETED',
      kycCompletedAt: new Date('2020-10-15'),
      kycNextReviewDate: new Date('2024-10-15'),
      status: 'ACTIVE',
      portalAccess: true,
      lastContactDate: new Date('2024-11-05')
    }
  });

  // Client 5: Professionnel - Entreprise Rousseau SAS
  const clientRousseau = await prisma.client.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientType: 'PROFESSIONNEL',
      firstName: 'Isabelle',
      lastName: 'Rousseau',
      email: 'i.rousseau@rousseau-tech.fr',
      phone: '+33 4 91 23 45 67',
      mobile: '+33 6 78 90 12 34',
      birthDate: new Date('1978-07-18'),
      birthPlace: 'Nice',
      nationality: 'Française',
      address: {
        street: '56 Promenade des Anglais',
        city: 'Nice',
        postalCode: '06000',
        country: 'France'
      },
      companyName: 'Rousseau Technologies SAS',
      siret: '98765432109876',
      legalForm: 'SAS',
      activitySector: 'Développement logiciel',
      companyCreationDate: new Date('2015-06-01'),
      numberOfEmployees: 25,
      annualRevenue: 2500000,
      profession: 'Présidente',
      annualIncome: 180000,
      taxBracket: '45%',
      fiscalResidence: 'France',
      irTaxRate: 45,
      ifiSubject: true,
      ifiAmount: 18500,
      riskProfile: 'DYNAMIQUE',
      investmentHorizon: 'LONG',
      investmentGoals: ['Croissance', 'Innovation'],
      investmentKnowledge: 'Avancé',
      investmentExperience: '10+ ans',
      managedByFirm: true,
      managementStartDate: new Date('2021-01-10'),
      managementFees: 1.5,
      managementType: 'Gestion pilotée',
      kycStatus: 'COMPLETED',
      kycCompletedAt: new Date('2021-02-20'),
      kycNextReviewDate: new Date('2025-02-20'),
      status: 'ACTIVE',
      portalAccess: true,
      lastContactDate: new Date('2024-11-12')
    }
  });

  console.log(`✅ Clients created: 5 clients (3 particuliers, 2 professionnels)`);

  // 4. Create Actifs for each client
  console.log('💰 Creating actifs...');

  // Actifs for Jean Dupont
  const actifDupontMaison = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'REAL_ESTATE_MAIN',
      category: 'IMMOBILIER',
      name: 'Résidence principale - Lyon',
      description: 'Appartement 120m² centre-ville Lyon',
      value: 450000,
      acquisitionDate: new Date('2010-06-15'),
      acquisitionValue: 280000,
      details: {
        surface: 120,
        rooms: 4,
        floor: 3,
        elevator: true
      },
      managedByFirm: false,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientDupont.id,
      actifId: actifDupontMaison.id,
      ownershipPercentage: 100,
      ownershipType: 'Pleine propriété'
    }
  });

  const actifDupontAV = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'LIFE_INSURANCE',
      category: 'FINANCIER',
      name: 'Assurance Vie Axa',
      description: 'Contrat multisupport',
      value: 185000,
      acquisitionDate: new Date('2015-03-01'),
      acquisitionValue: 100000,
      details: {
        provider: 'Axa',
        contractNumber: 'AV123456',
        fonds: ['Fonds euros 60%', 'UC actions 30%', 'UC obligations 10%']
      },
      annualIncome: 3500,
      managedByFirm: true,
      managementFees: 1.5,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientDupont.id,
      actifId: actifDupontAV.id,
      ownershipPercentage: 100
    }
  });

  const actifDupontPEA = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'PEA',
      category: 'FINANCIER',
      name: 'PEA Boursorama',
      description: 'Plan Épargne Actions',
      value: 75000,
      acquisitionDate: new Date('2018-01-15'),
      acquisitionValue: 50000,
      details: {
        provider: 'Boursorama',
        accountNumber: 'PEA789012'
      },
      annualIncome: 2800,
      managedByFirm: false,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientDupont.id,
      actifId: actifDupontPEA.id,
      ownershipPercentage: 100
    }
  });

  // Actifs for Marie Martin
  const actifMartinAppart = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'REAL_ESTATE_MAIN',
      category: 'IMMOBILIER',
      name: 'Appartement Paris 8ème',
      description: 'Appartement 95m² Haussmannien',
      value: 850000,
      acquisitionDate: new Date('2019-09-20'),
      acquisitionValue: 720000,
      details: {
        surface: 95,
        rooms: 3,
        floor: 4,
        elevator: true,
        balcony: true
      },
      managedByFirm: false,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientMartin.id,
      actifId: actifMartinAppart.id,
      ownershipPercentage: 100
    }
  });

  const actifMartinSCPI = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'SCPI',
      category: 'IMMOBILIER',
      name: 'SCPI Corum Origin',
      description: 'Parts de SCPI diversifiée',
      value: 120000,
      acquisitionDate: new Date('2020-05-10'),
      acquisitionValue: 100000,
      details: {
        provider: 'Corum',
        numberOfShares: 500,
        pricePerShare: 240
      },
      annualIncome: 5400,
      managedByFirm: true,
      managementFees: 1.2,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientMartin.id,
      actifId: actifMartinSCPI.id,
      ownershipPercentage: 100
    }
  });

  const actifMartinPER = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'PER',
      category: 'FINANCIER',
      name: 'PER Generali',
      description: 'Plan Épargne Retraite',
      value: 95000,
      acquisitionDate: new Date('2021-01-01'),
      acquisitionValue: 60000,
      details: {
        provider: 'Generali',
        contractNumber: 'PER456789'
      },
      managedByFirm: true,
      managementFees: 1.8,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientMartin.id,
      actifId: actifMartinPER.id,
      ownershipPercentage: 100
    }
  });

  // Actifs for Pierre Durand
  const actifDurandMaison = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'REAL_ESTATE_MAIN',
      category: 'IMMOBILIER',
      name: 'Maison Bordeaux',
      description: 'Maison 180m² avec jardin',
      value: 620000,
      acquisitionDate: new Date('2012-04-10'),
      acquisitionValue: 450000,
      details: {
        surface: 180,
        rooms: 6,
        land: 500,
        garage: true
      },
      managedByFirm: false,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientDurand.id,
      actifId: actifDurandMaison.id,
      ownershipPercentage: 100
    }
  });

  const actifDurandCrypto = await prisma.actif.create({
    data: {
      cabinetId: cabinet.id,
      type: 'CRYPTO',
      category: 'FINANCIER',
      name: 'Portefeuille Crypto',
      description: 'Bitcoin et Ethereum',
      value: 45000,
      acquisitionDate: new Date('2020-11-01'),
      acquisitionValue: 15000,
      details: {
        assets: ['Bitcoin 0.8 BTC', 'Ethereum 12 ETH']
      },
      managedByFirm: false,
      isActive: true
    }
  });

  await prisma.clientActif.create({
    data: {
      clientId: clientDurand.id,
      actifId: actifDurandCrypto.id,
      ownershipPercentage: 100
    }
  });

  console.log(`✅ Actifs created for all clients`);

  // 5. Create Passifs
  console.log('💳 Creating passifs...');

  await prisma.passif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      type: 'MORTGAGE',
      name: 'Prêt immobilier résidence principale',
      description: 'Crédit Agricole - 20 ans',
      initialAmount: 200000,
      remainingAmount: 125000,
      interestRate: 1.8,
      monthlyPayment: 1150,
      startDate: new Date('2015-06-01'),
      endDate: new Date('2035-06-01'),
      linkedActifId: actifDupontMaison.id,
      insurance: {
        provider: 'CNP Assurances',
        monthlyPremium: 45
      },
      isActive: true
    }
  });

  await prisma.passif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientMartin.id,
      type: 'MORTGAGE',
      name: 'Prêt immobilier Paris',
      description: 'BNP Paribas - 25 ans',
      initialAmount: 600000,
      remainingAmount: 480000,
      interestRate: 1.5,
      monthlyPayment: 2800,
      startDate: new Date('2019-09-01'),
      endDate: new Date('2044-09-01'),
      linkedActifId: actifMartinAppart.id,
      insurance: {
        provider: 'Cardif',
        monthlyPremium: 85
      },
      isActive: true
    }
  });

  await prisma.passif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDurand.id,
      type: 'CONSUMER_LOAN',
      name: 'Crédit auto',
      description: 'Financement véhicule',
      initialAmount: 35000,
      remainingAmount: 12000,
      interestRate: 3.2,
      monthlyPayment: 650,
      startDate: new Date('2022-03-01'),
      endDate: new Date('2027-03-01'),
      isActive: true
    }
  });

  console.log(`✅ Passifs created`);

  // 6. Create Contrats
  console.log('📄 Creating contrats...');

  await prisma.contrat.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      type: 'LIFE_INSURANCE',
      name: 'Assurance Vie Axa',
      provider: 'Axa',
      contractNumber: 'AV123456',
      startDate: new Date('2015-03-01'),
      premium: 500,
      value: 185000,
      beneficiaries: {
        primary: ['Épouse 100%'],
        secondary: ['Enfants à parts égales']
      },
      nextRenewalDate: new Date('2025-03-01'),
      status: 'ACTIVE'
    }
  });

  await prisma.contrat.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientMartin.id,
      type: 'HEALTH_INSURANCE',
      name: 'Mutuelle Santé',
      provider: 'Harmonie Mutuelle',
      contractNumber: 'MUT789012',
      startDate: new Date('2022-01-01'),
      premium: 180,
      coverage: 50000,
      nextRenewalDate: new Date('2025-01-01'),
      status: 'ACTIVE'
    }
  });

  await prisma.contrat.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientLeblanc.id,
      type: 'PROFESSIONAL_INSURANCE',
      name: 'RC Professionnelle',
      provider: 'Allianz',
      contractNumber: 'RCP345678',
      startDate: new Date('2020-09-01'),
      premium: 450,
      coverage: 1000000,
      nextRenewalDate: new Date('2025-09-01'),
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Contrats created`);

  // 7. Create Documents
  console.log('📁 Creating documents...');

  const docDupontID = await prisma.document.create({
    data: {
      cabinetId: cabinet.id,
      name: 'Carte identité Jean Dupont',
      description: 'CNI recto-verso',
      fileUrl: '/uploads/documents/dupont-cni.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      type: 'ID_CARD',
      category: 'IDENTITE',
      uploadedById: conseiller.id,
      uploadedAt: new Date('2023-01-15')
    }
  });

  await prisma.clientDocument.create({
    data: {
      clientId: clientDupont.id,
      documentId: docDupontID.id
    }
  });

  const docDupontTax = await prisma.document.create({
    data: {
      cabinetId: cabinet.id,
      name: 'Avis imposition 2023',
      description: 'Avis d\'imposition sur les revenus 2023',
      fileUrl: '/uploads/documents/dupont-tax-2023.pdf',
      fileSize: 180000,
      mimeType: 'application/pdf',
      type: 'TAX_NOTICE',
      category: 'FISCAL',
      uploadedById: conseiller.id,
      uploadedAt: new Date('2023-09-10')
    }
  });

  await prisma.clientDocument.create({
    data: {
      clientId: clientDupont.id,
      documentId: docDupontTax.id
    }
  });

  const docDupontBank = await prisma.document.create({
    data: {
      cabinetId: cabinet.id,
      name: 'Relevé bancaire Crédit Agricole',
      description: 'Relevé compte courant octobre 2024',
      fileUrl: '/uploads/documents/dupont-bank-oct2024.pdf',
      fileSize: 95000,
      mimeType: 'application/pdf',
      type: 'BANK_STATEMENT',
      category: 'PATRIMOINE',
      uploadedById: conseiller.id,
      uploadedAt: new Date('2024-11-01')
    }
  });

  await prisma.clientDocument.create({
    data: {
      clientId: clientDupont.id,
      documentId: docDupontBank.id
    }
  });

  const docMartinID = await prisma.document.create({
    data: {
      cabinetId: cabinet.id,
      name: 'Passeport Marie Martin',
      description: 'Passeport valide jusqu\'en 2028',
      fileUrl: '/uploads/documents/martin-passport.pdf',
      fileSize: 320000,
      mimeType: 'application/pdf',
      type: 'PASSPORT',
      category: 'IDENTITE',
      uploadedById: conseiller.id,
      uploadedAt: new Date('2022-06-15')
    }
  });

  await prisma.clientDocument.create({
    data: {
      clientId: clientMartin.id,
      documentId: docMartinID.id
    }
  });

  const docMartinAddress = await prisma.document.create({
    data: {
      cabinetId: cabinet.id,
      name: 'Justificatif domicile',
      description: 'Facture EDF',
      fileUrl: '/uploads/documents/martin-address.pdf',
      fileSize: 125000,
      mimeType: 'application/pdf',
      type: 'PROOF_OF_ADDRESS',
      category: 'IDENTITE',
      uploadedById: conseiller.id,
      uploadedAt: new Date('2024-10-05')
    }
  });

  await prisma.clientDocument.create({
    data: {
      clientId: clientMartin.id,
      documentId: docMartinAddress.id
    }
  });

  console.log(`✅ Documents created`);

  // 8. Create Objectifs
  console.log('🎯 Creating objectifs...');

  await prisma.objectif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      type: 'RETIREMENT',
      name: 'Préparation retraite',
      description: 'Constituer un capital retraite de 500k€',
      targetAmount: 500000,
      currentAmount: 260000,
      progress: 52,
      targetDate: new Date('2035-12-31'),
      priority: 'HIGH',
      monthlyContribution: 1200,
      recommendations: {
        suggestions: [
          'Augmenter versements PER',
          'Diversifier avec SCPI'
        ]
      },
      status: 'ACTIVE'
    }
  });

  await prisma.objectif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      type: 'EDUCATION',
      name: 'Études supérieures enfants',
      description: 'Financer les études des 2 enfants',
      targetAmount: 100000,
      currentAmount: 35000,
      progress: 35,
      targetDate: new Date('2030-09-01'),
      priority: 'MEDIUM',
      monthlyContribution: 500,
      status: 'ACTIVE'
    }
  });

  await prisma.objectif.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientMartin.id,
      type: 'REAL_ESTATE_PURCHASE',
      name: 'Achat résidence secondaire',
      description: 'Maison en bord de mer',
      targetAmount: 400000,
      currentAmount: 150000,
      progress: 37,
      targetDate: new Date('2027-06-30'),
      priority: 'MEDIUM',
      monthlyContribution: 2000,
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Objectifs created`);

  // 9. Create Projets with Taches
  console.log('📋 Creating projets and taches...');

  const projetDupont = await prisma.projet.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      name: 'Optimisation fiscale 2024',
      description: 'Réduction IR via investissements défiscalisants',
      type: 'TAX_OPTIMIZATION',
      estimatedBudget: 50000,
      actualBudget: 35000,
      startDate: new Date('2024-01-15'),
      targetDate: new Date('2024-12-31'),
      progress: 70,
      status: 'IN_PROGRESS'
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      clientId: clientDupont.id,
      projetId: projetDupont.id,
      createdById: conseiller.id,
      title: 'Analyser opportunités Pinel',
      description: 'Étudier les programmes immobiliers éligibles Pinel',
      type: 'DOCUMENT_REVIEW',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date('2024-03-01'),
      completedAt: new Date('2024-02-28')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      clientId: clientDupont.id,
      projetId: projetDupont.id,
      createdById: conseiller.id,
      title: 'Présenter simulation Pinel',
      description: 'RDV client pour présenter les simulations',
      type: 'MEETING',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date('2024-04-15'),
      completedAt: new Date('2024-04-12')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      clientId: clientDupont.id,
      projetId: projetDupont.id,
      createdById: conseiller.id,
      title: 'Finaliser souscription',
      description: 'Signature documents et versement',
      type: 'ADMINISTRATIVE',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-12-15')
    }
  });

  const projetMartin = await prisma.projet.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientMartin.id,
      name: 'Restructuration patrimoine',
      description: 'Optimiser allocation actifs',
      type: 'WEALTH_RESTRUCTURING',
      estimatedBudget: 1000000,
      startDate: new Date('2024-09-01'),
      targetDate: new Date('2025-03-31'),
      progress: 30,
      status: 'IN_PROGRESS'
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      clientId: clientMartin.id,
      projetId: projetMartin.id,
      createdById: conseiller.id,
      title: 'Audit patrimoine complet',
      description: 'Analyse détaillée de tous les actifs',
      type: 'DOCUMENT_REVIEW',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueDate: new Date('2024-09-30'),
      completedAt: new Date('2024-09-28')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      clientId: clientMartin.id,
      projetId: projetMartin.id,
      createdById: conseiller.id,
      title: 'Proposer nouvelle allocation',
      description: 'Présenter stratégie de réallocation',
      type: 'MEETING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-11-30')
    }
  });

  console.log(`✅ Projets and related taches created`);

  // 10. Create global Taches
  console.log('✅ Creating global taches...');

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: admin.id,
      title: 'Préparer revue annuelle clients',
      description: 'Planifier les RDV de revue annuelle Q1 2025',
      type: 'ADMINISTRATIVE',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: new Date('2024-12-20')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Appeler prospect Bertrand',
      description: 'Relance suite à demande de contact',
      type: 'CALL',
      priority: 'HIGH',
      status: 'TODO',
      dueDate: new Date('2024-11-18')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Mettre à jour KYC clients',
      description: 'Vérifier et mettre à jour les KYC expirés',
      type: 'KYC_UPDATE',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-11-20')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Envoyer newsletter novembre',
      description: 'Newsletter mensuelle aux clients',
      type: 'EMAIL',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: new Date('2024-11-05'),
      completedAt: new Date('2024-11-04')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Renouvellement contrat Axa',
      description: 'Préparer documents renouvellement',
      type: 'CONTRACT_RENEWAL',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: new Date('2024-12-01')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: admin.id,
      title: 'Formation nouvelle réglementation',
      description: 'Participer à la formation MIF II',
      type: 'OTHER',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: new Date('2024-12-10')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Analyser opportunités marché',
      description: 'Étude des opportunités Q4 2024',
      type: 'DOCUMENT_REVIEW',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: new Date('2024-10-31'),
      completedAt: new Date('2024-10-30')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Suivi portefeuille Durand',
      description: 'Point trimestriel sur performance',
      type: 'FOLLOW_UP',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: new Date('2024-11-25')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Préparer rapport annuel',
      description: 'Rapport activité 2024',
      type: 'ADMINISTRATIVE',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-12-31')
    }
  });

  await prisma.tache.create({
    data: {
      cabinetId: cabinet.id,
      assignedToId: conseiller.id,
      createdById: conseiller.id,
      title: 'Organiser événement clients',
      description: 'Soirée networking janvier 2025',
      type: 'OTHER',
      priority: 'LOW',
      status: 'TODO',
      dueDate: new Date('2024-12-15')
    }
  });

  console.log(`✅ Global taches created (10 total)`);

  // 11. Create RendezVous
  console.log('📅 Creating rendez-vous...');

  await prisma.rendezVous.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientDupont.id,
      title: 'Revue annuelle patrimoine',
      description: 'Bilan annuel et perspectives 2025',
      type: 'ANNUAL_REVIEW',
      startDate: new Date('2024-12-05T10:00:00'),
      endDate: new Date('2024-12-05T11:30:00'),
      location: 'Bureau Lyon',
      isVirtual: false,
      status: 'SCHEDULED'
    }
  });

  await prisma.rendezVous.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientMartin.id,
      title: 'Point stratégie investissement',
      description: 'Discussion allocation actifs',
      type: 'FOLLOW_UP',
      startDate: new Date('2024-11-22T14:00:00'),
      endDate: new Date('2024-11-22T15:00:00'),
      location: 'Visioconférence',
      isVirtual: true,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'CONFIRMED'
    }
  });

  await prisma.rendezVous.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientDurand.id,
      title: 'Signature documents',
      description: 'Signature contrat assurance vie',
      type: 'SIGNING',
      startDate: new Date('2024-11-28T16:00:00'),
      endDate: new Date('2024-11-28T16:30:00'),
      location: 'Bureau Bordeaux',
      isVirtual: false,
      status: 'SCHEDULED'
    }
  });

  await prisma.rendezVous.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientLeblanc.id,
      title: 'Appel téléphonique suivi',
      description: 'Point rapide sur dossier en cours',
      type: 'PHONE_CALL',
      startDate: new Date('2024-11-20T11:00:00'),
      endDate: new Date('2024-11-20T11:30:00'),
      isVirtual: true,
      status: 'SCHEDULED'
    }
  });

  await prisma.rendezVous.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientRousseau.id,
      title: 'Premier rendez-vous découverte',
      description: 'Présentation services et analyse besoins',
      type: 'FIRST_MEETING',
      startDate: new Date('2024-12-10T09:30:00'),
      endDate: new Date('2024-12-10T11:00:00'),
      location: 'Bureau Nice',
      isVirtual: false,
      status: 'SCHEDULED'
    }
  });

  console.log(`✅ RendezVous created (5 appointments)`);

  // 12. Create Opportunites
  console.log('💡 Creating opportunites...');

  await prisma.opportunite.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientDupont.id,
      type: 'RETIREMENT_SAVINGS',
      name: 'Augmentation PER',
      description: 'Client intéressé par augmentation versements PER',
      estimatedValue: 50000,
      score: 85,
      confidence: 0.85,
      priority: 'HIGH',
      status: 'QUALIFIED',
      detectedAt: new Date('2024-10-15'),
      qualifiedAt: new Date('2024-10-20'),
      actionDeadline: new Date('2024-12-31'),
      actions: {
        nextSteps: ['Préparer simulation', 'Planifier RDV']
      }
    }
  });

  await prisma.opportunite.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientMartin.id,
      type: 'REAL_ESTATE_INVESTMENT',
      name: 'Investissement SCPI',
      description: 'Diversification via SCPI rendement',
      estimatedValue: 100000,
      score: 75,
      confidence: 0.75,
      priority: 'MEDIUM',
      status: 'PRESENTED',
      detectedAt: new Date('2024-09-01'),
      qualifiedAt: new Date('2024-09-10'),
      contactedAt: new Date('2024-09-15'),
      presentedAt: new Date('2024-10-05'),
      actionDeadline: new Date('2024-11-30'),
      actions: {
        nextSteps: ['Attendre décision client']
      }
    }
  });

  await prisma.opportunite.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientDurand.id,
      type: 'TAX_OPTIMIZATION',
      name: 'Défiscalisation Pinel',
      description: 'Réduction IR via investissement Pinel',
      estimatedValue: 80000,
      score: 70,
      confidence: 0.70,
      priority: 'MEDIUM',
      status: 'CONTACTED',
      detectedAt: new Date('2024-10-01'),
      qualifiedAt: new Date('2024-10-08'),
      contactedAt: new Date('2024-10-15'),
      actionDeadline: new Date('2024-12-15')
    }
  });

  await prisma.opportunite.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientLeblanc.id,
      type: 'WEALTH_TRANSMISSION',
      name: 'Donation enfants',
      description: 'Optimisation transmission patrimoine',
      estimatedValue: 150000,
      score: 90,
      confidence: 0.90,
      priority: 'HIGH',
      status: 'ACCEPTED',
      detectedAt: new Date('2024-08-01'),
      qualifiedAt: new Date('2024-08-10'),
      contactedAt: new Date('2024-08-15'),
      presentedAt: new Date('2024-09-01'),
      acceptedAt: new Date('2024-09-20'),
      actionDeadline: new Date('2024-12-01')
    }
  });

  await prisma.opportunite.create({
    data: {
      cabinetId: cabinet.id,
      conseillerId: conseiller.id,
      clientId: clientRousseau.id,
      type: 'INSURANCE_REVIEW',
      name: 'Révision couvertures assurance',
      description: 'Audit et optimisation contrats assurance',
      estimatedValue: 30000,
      score: 60,
      confidence: 0.60,
      priority: 'LOW',
      status: 'DETECTED',
      detectedAt: new Date('2024-11-01'),
      actionDeadline: new Date('2025-01-31')
    }
  });

  console.log(`✅ Opportunites created (5 opportunities)`);

  // 13. Create KYC Documents for 2 clients
  console.log('📋 Creating KYC documents...');

  // KYC for Jean Dupont (completed)
  await prisma.kYCDocument.create({
    data: {
      clientId: clientDupont.id,
      type: 'IDENTITY',
      status: 'VALIDATED',
      validatedAt: new Date('2023-02-01'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2033-05-15')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientDupont.id,
      type: 'PROOF_OF_ADDRESS',
      status: 'VALIDATED',
      validatedAt: new Date('2023-02-01'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2025-02-01')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientDupont.id,
      type: 'TAX_NOTICE',
      status: 'VALIDATED',
      validatedAt: new Date('2023-09-10'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2025-09-10')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientDupont.id,
      type: 'BANK_RIB',
      status: 'VALIDATED',
      validatedAt: new Date('2023-02-01'),
      validatedBy: conseiller.id
    }
  });

  // KYC for Marie Martin (completed)
  await prisma.kYCDocument.create({
    data: {
      clientId: clientMartin.id,
      type: 'IDENTITY',
      status: 'VALIDATED',
      validatedAt: new Date('2022-07-15'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2028-08-22')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientMartin.id,
      type: 'PROOF_OF_ADDRESS',
      status: 'VALIDATED',
      validatedAt: new Date('2024-10-05'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2025-10-05')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientMartin.id,
      type: 'TAX_NOTICE',
      status: 'VALIDATED',
      validatedAt: new Date('2022-09-01'),
      validatedBy: conseiller.id,
      expiresAt: new Date('2024-09-01')
    }
  });

  await prisma.kYCDocument.create({
    data: {
      clientId: clientMartin.id,
      type: 'WEALTH_JUSTIFICATION',
      status: 'VALIDATED',
      validatedAt: new Date('2022-07-20'),
      validatedBy: conseiller.id
    }
  });

  console.log(`✅ KYC documents created for 2 clients`);

  // 14. Create Timeline Events
  console.log('📅 Creating timeline events...');

  await prisma.timelineEvent.create({
    data: {
      clientId: clientDupont.id,
      type: 'CLIENT_CREATED',
      title: 'Client créé',
      description: 'Nouveau client ajouté au portefeuille',
      createdAt: new Date('2023-01-15'),
      createdBy: conseiller.id
    }
  });

  await prisma.timelineEvent.create({
    data: {
      clientId: clientDupont.id,
      type: 'KYC_UPDATED',
      title: 'KYC complété',
      description: 'Dossier KYC validé et complet',
      createdAt: new Date('2023-02-01'),
      createdBy: conseiller.id
    }
  });

  await prisma.timelineEvent.create({
    data: {
      clientId: clientDupont.id,
      type: 'CONTRACT_SIGNED',
      title: 'Contrat assurance vie signé',
      description: 'Signature contrat Axa',
      createdAt: new Date('2023-03-15'),
      createdBy: conseiller.id
    }
  });

  await prisma.timelineEvent.create({
    data: {
      clientId: clientMartin.id,
      type: 'CLIENT_CREATED',
      title: 'Client créé',
      description: 'Nouveau client ajouté au portefeuille',
      createdAt: new Date('2022-06-01'),
      createdBy: conseiller.id
    }
  });

  await prisma.timelineEvent.create({
    data: {
      clientId: clientMartin.id,
      type: 'MEETING_HELD',
      title: 'Revue annuelle 2023',
      description: 'Bilan patrimoine et perspectives',
      createdAt: new Date('2023-12-15'),
      createdBy: conseiller.id
    }
  });

  console.log(`✅ Timeline events created`);

  // 15. Create Simulations
  console.log('🧮 Creating simulations...');

  await prisma.simulation.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDupont.id,
      createdById: conseiller.id,
      type: 'RETIREMENT',
      name: 'Simulation retraite 2035',
      description: 'Projection revenus retraite',
      parameters: {
        currentAge: 49,
        retirementAge: 65,
        currentSavings: 260000,
        monthlyContribution: 1200,
        expectedReturn: 4.5
      },
      results: {
        projectedCapital: 520000,
        monthlyIncome: 2800,
        replacementRate: 65
      },
      recommendations: {
        suggestions: [
          'Augmenter versements mensuels de 300€',
          'Diversifier avec SCPI pour revenus complémentaires'
        ]
      },
      feasibilityScore: 85,
      status: 'COMPLETED',
      sharedWithClient: true,
      sharedAt: new Date('2024-10-15')
    }
  });

  await prisma.simulation.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientMartin.id,
      createdById: conseiller.id,
      type: 'REAL_ESTATE_LOAN',
      name: 'Simulation prêt résidence secondaire',
      description: 'Capacité emprunt maison bord de mer',
      parameters: {
        purchasePrice: 400000,
        downPayment: 150000,
        loanAmount: 250000,
        interestRate: 3.5,
        duration: 20
      },
      results: {
        monthlyPayment: 1450,
        totalInterest: 98000,
        totalCost: 348000,
        debtRatio: 28
      },
      feasibilityScore: 90,
      status: 'COMPLETED',
      sharedWithClient: true,
      sharedAt: new Date('2024-09-20')
    }
  });

  await prisma.simulation.create({
    data: {
      cabinetId: cabinet.id,
      clientId: clientDurand.id,
      createdById: conseiller.id,
      type: 'TAX_OPTIMIZATION',
      name: 'Simulation Pinel Bordeaux',
      description: 'Réduction IR via Pinel',
      parameters: {
        investmentAmount: 250000,
        duration: 12,
        location: 'Bordeaux',
        expectedRent: 1200
      },
      results: {
        taxReduction: 42000,
        netYield: 3.2,
        totalReturn: 4.8
      },
      feasibilityScore: 75,
      status: 'DRAFT'
    }
  });

  console.log(`✅ Simulations created`);

  // Summary
  console.log('\n🎉 Database seed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log('📦 Cabinet: Cabinet ALFI Test');
  console.log('👥 Users: 2 (1 admin, 1 conseiller)');
  console.log('👤 Clients: 5 (3 particuliers, 2 professionnels)');
  console.log('💰 Actifs: Multiple per client');
  console.log('💳 Passifs: 3 loans');
  console.log('📄 Contrats: 3 contracts');
  console.log('📁 Documents: Multiple per client');
  console.log('🎯 Objectifs: 3 objectives');
  console.log('📋 Projets: 2 projects with tasks');
  console.log('✅ Tâches: 10 global tasks');
  console.log('📅 RendezVous: 5 appointments');
  console.log('💡 Opportunités: 5 opportunities');
  console.log('📋 KYC Documents: Complete for 2 clients');
  console.log('🧮 Simulations: 3 simulations');
  console.log('═══════════════════════════════════════');
  console.log('\n✨ You can now login with:');
  console.log('   Admin: admin@alfi.fr / Password123!');
  console.log('   Conseiller: conseiller@alfi.fr / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
