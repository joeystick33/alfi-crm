/**
 * Données de test pour les tests E2E
 */

export const TEST_USER = {
  email: 'test@aura.fr',
  password: 'password123',
}

export const TEST_CLIENT = {
  id: 'test-client-id',
  firstName: 'Test',
  lastName: 'Client',
  email: 'test.client@email.com',
}

export const NEW_CLIENT_DATA = {
  step1: {
    relationType: 'CLIENT',
    clientType: 'INDIVIDUAL',
  },
  step2: {
    civility: 'M',
    firstName: 'Jean',
    lastName: 'Test',
    birthDate: '1985-06-15',
    nationality: 'FR',
    taxResidence: 'FR',
  },
  step3: {
    email: 'jean.test@email.com',
    mobile: '0612345678',
    address: {
      street: '123 Rue Test',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
    },
  },
  step4: {
    maritalStatus: 'MARRIED',
    matrimonialRegime: 'COMMUNAUTE_LEGALE',
    numberOfChildren: 2,
    dependents: 2,
  },
  step5: {
    professionCategory: 'SALARIE',
    employmentType: 'CDI',
    profession: 'Ingénieur',
    employer: 'Tech Corp',
    annualIncome: 65000,
  },
  step6: {
    financialAssets: 100000,
    realEstateAssets: 300000,
    otherAssets: 20000,
    totalLiabilities: 150000,
  },
  step7: {
    riskProfile: 'EQUILIBRE',
    investmentHorizon: 'MOYEN_TERME',
    investmentObjective: 'CAPITAL_GROWTH',
    investmentKnowledge: 50,
    isPEP: false,
    originOfFunds: 'Revenus d\'activité',
  },
}

export const BUDGET_DATA = {
  revenus: [
    { category: 'SALAIRE', amount: 5000 },
    { category: 'REVENUS_LOCATIFS', amount: 800 },
  ],
  charges: [
    { category: 'LOYER', amount: 1200 },
    { category: 'ALIMENTATION', amount: 500 },
    { category: 'TRANSPORT', amount: 300 },
    { category: 'ASSURANCES', amount: 200 },
  ],
}

export const OBJECTIF_DATA = {
  name: 'Achat résidence principale',
  type: 'REAL_ESTATE_PURCHASE',
  priority: 'HIGH',
  targetAmount: 400000,
  currentAmount: 80000,
  targetDate: '2027-06-01',
}
