// FILE: prisma/seeds/reference-data.seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===========================================
// DONNÉES DE RÉFÉRENCE
// ===========================================

const REFERENCE_DATA = {
  // -----------------------------------------
  // TYPES D'ACTIFS
  // -----------------------------------------
  ACTIF_TYPE: [
    // Immobilier
    { code: 'IMMOBILIER_RP', label: 'Résidence principale', category: 'IMMOBILIER', sortOrder: 1 },
    { code: 'IMMOBILIER_LOCATIF', label: 'Immobilier locatif', category: 'IMMOBILIER', sortOrder: 2 },
    { code: 'IMMOBILIER_SECONDAIRE', label: 'Résidence secondaire', category: 'IMMOBILIER', sortOrder: 3 },
    { code: 'IMMOBILIER_COMMERCIAL', label: 'Immobilier commercial', category: 'IMMOBILIER', sortOrder: 4 },
    { code: 'SCPI', label: 'SCPI', category: 'IMMOBILIER', sortOrder: 5 },
    { code: 'SCI', label: 'SCI', category: 'IMMOBILIER', sortOrder: 6 },
    { code: 'OPCI', label: 'OPCI', category: 'IMMOBILIER', sortOrder: 7 },
    
    // Financier
    { code: 'ASSURANCE_VIE', label: 'Assurance-vie', category: 'FINANCIER', sortOrder: 10 },
    { code: 'PEA', label: 'PEA', category: 'FINANCIER', sortOrder: 11 },
    { code: 'PEA_PME', label: 'PEA-PME', category: 'FINANCIER', sortOrder: 12 },
    { code: 'COMPTE_TITRES', label: 'Compte-titres', category: 'FINANCIER', sortOrder: 13 },
    { code: 'CONTRAT_CAPITALISATION', label: 'Contrat de capitalisation', category: 'FINANCIER', sortOrder: 14 },
    
    // Épargne retraite
    { code: 'PER', label: 'PER', category: 'EPARGNE_RETRAITE', sortOrder: 20 },
    { code: 'PERP', label: 'PERP', category: 'EPARGNE_RETRAITE', sortOrder: 21 },
    { code: 'MADELIN', label: 'Madelin', category: 'EPARGNE_RETRAITE', sortOrder: 22 },
    { code: 'ARTICLE_83', label: 'Article 83', category: 'EPARGNE_RETRAITE', sortOrder: 23 },
    
    // Épargne salariale
    { code: 'PEE', label: 'PEE', category: 'EPARGNE_SALARIALE', sortOrder: 30 },
    { code: 'PERCO', label: 'PERCO/PERECO', category: 'EPARGNE_SALARIALE', sortOrder: 31 },
    { code: 'INTERESSEMENT', label: 'Intéressement', category: 'EPARGNE_SALARIALE', sortOrder: 32 },
    { code: 'PARTICIPATION', label: 'Participation', category: 'EPARGNE_SALARIALE', sortOrder: 33 },
    
    // Épargne bancaire
    { code: 'LIVRET_A', label: 'Livret A', category: 'EPARGNE_BANCAIRE', sortOrder: 40 },
    { code: 'LDDS', label: 'LDDS', category: 'EPARGNE_BANCAIRE', sortOrder: 41 },
    { code: 'LEP', label: 'LEP', category: 'EPARGNE_BANCAIRE', sortOrder: 42 },
    { code: 'PEL', label: 'PEL', category: 'EPARGNE_BANCAIRE', sortOrder: 43 },
    { code: 'CEL', label: 'CEL', category: 'EPARGNE_BANCAIRE', sortOrder: 44 },
    { code: 'COMPTE_COURANT', label: 'Compte courant', category: 'EPARGNE_BANCAIRE', sortOrder: 45 },
    { code: 'COMPTE_A_TERME', label: 'Compte à terme', category: 'EPARGNE_BANCAIRE', sortOrder: 46 },
    
    // Divers
    { code: 'CRYPTO', label: 'Crypto-actifs', category: 'DIVERS', sortOrder: 50 },
    { code: 'OR', label: 'Or / Métaux précieux', category: 'DIVERS', sortOrder: 51 },
    { code: 'ART', label: 'Œuvres d\'art', category: 'DIVERS', sortOrder: 52 },
    { code: 'VEHICULE', label: 'Véhicule', category: 'DIVERS', sortOrder: 53 },
    { code: 'AUTRE', label: 'Autre', category: 'DIVERS', sortOrder: 99 },
  ],

  // -----------------------------------------
  // CATÉGORIES D'ACTIFS
  // -----------------------------------------
  ACTIF_CATEGORY: [
    { code: 'IMMOBILIER', label: 'Immobilier', sortOrder: 1 },
    { code: 'FINANCIER', label: 'Financier', sortOrder: 2 },
    { code: 'EPARGNE_RETRAITE', label: 'Épargne retraite', sortOrder: 3 },
    { code: 'EPARGNE_SALARIALE', label: 'Épargne salariale', sortOrder: 4 },
    { code: 'EPARGNE_BANCAIRE', label: 'Épargne bancaire', sortOrder: 5 },
    { code: 'PROFESSIONNEL', label: 'Professionnel', sortOrder: 6 },
    { code: 'DIVERS', label: 'Divers', sortOrder: 7 },
  ],

  // -----------------------------------------
  // TYPES DE PASSIFS
  // -----------------------------------------
  PASSIF_TYPE: [
    { code: 'CREDIT_IMMOBILIER', label: 'Crédit immobilier', category: 'IMMOBILIER', sortOrder: 1 },
    { code: 'PTZ', label: 'Prêt à taux zéro', category: 'IMMOBILIER', sortOrder: 2 },
    { code: 'PRET_RELAIS', label: 'Prêt relais', category: 'IMMOBILIER', sortOrder: 3 },
    { code: 'CREDIT_TRAVAUX', label: 'Crédit travaux', category: 'IMMOBILIER', sortOrder: 4 },
    { code: 'CREDIT_CONSO', label: 'Crédit consommation', category: 'CONSOMMATION', sortOrder: 10 },
    { code: 'CREDIT_AUTO', label: 'Crédit auto', category: 'CONSOMMATION', sortOrder: 11 },
    { code: 'CREDIT_RENOUVELABLE', label: 'Crédit renouvelable', category: 'CONSOMMATION', sortOrder: 12 },
    { code: 'PRET_ETUDIANT', label: 'Prêt étudiant', category: 'AUTRE', sortOrder: 20 },
    { code: 'PRET_PROFESSIONNEL', label: 'Prêt professionnel', category: 'PROFESSIONNEL', sortOrder: 30 },
    { code: 'LEASING', label: 'Leasing / LOA', category: 'AUTRE', sortOrder: 40 },
    { code: 'DETTE_FAMILIALE', label: 'Dette familiale', category: 'AUTRE', sortOrder: 50 },
    { code: 'AUTRE', label: 'Autre', category: 'AUTRE', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE DOCUMENTS
  // -----------------------------------------
  DOCUMENT_TYPE: [
    { code: 'IDENTITE', label: 'Pièce d\'identité', category: 'KYC', sortOrder: 1 },
    { code: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile', category: 'KYC', sortOrder: 2 },
    { code: 'AVIS_IMPOSITION', label: 'Avis d\'imposition', category: 'FISCAL', sortOrder: 10 },
    { code: 'BULLETIN_SALAIRE', label: 'Bulletin de salaire', category: 'REVENUS', sortOrder: 20 },
    { code: 'RELEVE_COMPTE', label: 'Relevé de compte', category: 'BANCAIRE', sortOrder: 30 },
    { code: 'RELEVE_PLACEMENT', label: 'Relevé de placement', category: 'PATRIMOINE', sortOrder: 31 },
    { code: 'TITRE_PROPRIETE', label: 'Titre de propriété', category: 'PATRIMOINE', sortOrder: 32 },
    { code: 'CONTRAT', label: 'Contrat', category: 'JURIDIQUE', sortOrder: 40 },
    { code: 'ATTESTATION', label: 'Attestation', category: 'JURIDIQUE', sortOrder: 41 },
    { code: 'RAPPORT', label: 'Rapport', category: 'CONSEIL', sortOrder: 50 },
    { code: 'PROPOSITION', label: 'Proposition', category: 'COMMERCIAL', sortOrder: 60 },
    { code: 'FACTURE', label: 'Facture', category: 'COMMERCIAL', sortOrder: 61 },
    { code: 'DEVIS', label: 'Devis', category: 'COMMERCIAL', sortOrder: 62 },
    { code: 'COMPTE_RENDU', label: 'Compte-rendu', category: 'CONSEIL', sortOrder: 70 },
    { code: 'AUTRE', label: 'Autre', category: 'AUTRE', sortOrder: 99 },
  ],

  // -----------------------------------------
  // CATÉGORIES DE REVENUS
  // -----------------------------------------
  REVENUE_CATEGORY: [
    // Travail
    { code: 'SALAIRE', label: 'Salaire', category: 'TRAVAIL', sortOrder: 1 },
    { code: 'PRIME', label: 'Prime / Bonus', category: 'TRAVAIL', sortOrder: 2 },
    { code: 'AVANTAGE_NATURE', label: 'Avantage en nature', category: 'TRAVAIL', sortOrder: 3 },
    
    // TNS
    { code: 'BIC', label: 'BIC', category: 'TNS', sortOrder: 10 },
    { code: 'BNC', label: 'BNC', category: 'TNS', sortOrder: 11 },
    { code: 'BA', label: 'Bénéfices agricoles', category: 'TNS', sortOrder: 12 },
    
    // Dirigeant
    { code: 'REMUNERATION_GERANT', label: 'Rémunération gérant', category: 'DIRIGEANT', sortOrder: 20 },
    { code: 'DIVIDENDES', label: 'Dividendes', category: 'DIRIGEANT', sortOrder: 21 },
    
    // Patrimoine
    { code: 'REVENUS_FONCIERS', label: 'Revenus fonciers', category: 'PATRIMOINE', sortOrder: 30 },
    { code: 'REVENUS_MOBILIERS', label: 'Revenus mobiliers', category: 'PATRIMOINE', sortOrder: 31 },
    { code: 'PLUS_VALUES', label: 'Plus-values', category: 'PATRIMOINE', sortOrder: 32 },
    
    // Retraite
    { code: 'PENSION_RETRAITE', label: 'Pension de retraite', category: 'RETRAITE', sortOrder: 40 },
    { code: 'PENSION_REVERSION', label: 'Pension de réversion', category: 'RETRAITE', sortOrder: 41 },
    
    // Social
    { code: 'ALLOCATIONS', label: 'Allocations', category: 'SOCIAL', sortOrder: 50 },
    { code: 'PENSION_ALIMENTAIRE', label: 'Pension alimentaire reçue', category: 'SOCIAL', sortOrder: 51 },
    
    { code: 'AUTRE', label: 'Autre revenu', category: 'AUTRE', sortOrder: 99 },
  ],

  // -----------------------------------------
  // CATÉGORIES DE CHARGES
  // -----------------------------------------
  EXPENSE_CATEGORY: [
    // Logement
    { code: 'LOYER', label: 'Loyer', category: 'LOGEMENT', sortOrder: 1 },
    { code: 'CHARGES_COPRO', label: 'Charges copropriété', category: 'LOGEMENT', sortOrder: 2 },
    { code: 'TAXE_FONCIERE', label: 'Taxe foncière', category: 'LOGEMENT', sortOrder: 3 },
    { code: 'ASSURANCE_HABITATION', label: 'Assurance habitation', category: 'LOGEMENT', sortOrder: 4 },
    { code: 'ENERGIE', label: 'Énergie (élec/gaz)', category: 'LOGEMENT', sortOrder: 5 },
    { code: 'EAU', label: 'Eau', category: 'LOGEMENT', sortOrder: 6 },
    { code: 'INTERNET_TEL', label: 'Internet / Téléphone', category: 'LOGEMENT', sortOrder: 7 },
    
    // Transport
    { code: 'CREDIT_AUTO', label: 'Crédit auto', category: 'TRANSPORT', sortOrder: 10 },
    { code: 'ASSURANCE_AUTO', label: 'Assurance auto', category: 'TRANSPORT', sortOrder: 11 },
    { code: 'CARBURANT', label: 'Carburant', category: 'TRANSPORT', sortOrder: 12 },
    { code: 'TRANSPORT_COMMUN', label: 'Transports en commun', category: 'TRANSPORT', sortOrder: 13 },
    
    // Santé
    { code: 'MUTUELLE', label: 'Mutuelle', category: 'SANTE', sortOrder: 20 },
    { code: 'FRAIS_MEDICAUX', label: 'Frais médicaux', category: 'SANTE', sortOrder: 21 },
    
    // Famille
    { code: 'GARDE_ENFANTS', label: 'Garde d\'enfants', category: 'FAMILLE', sortOrder: 30 },
    { code: 'SCOLARITE', label: 'Scolarité', category: 'FAMILLE', sortOrder: 31 },
    { code: 'PENSION_ALIMENTAIRE', label: 'Pension alimentaire versée', category: 'FAMILLE', sortOrder: 32 },
    
    // Épargne
    { code: 'EPARGNE_PROGRAMMEE', label: 'Épargne programmée', category: 'EPARGNE', sortOrder: 40 },
    { code: 'VERSEMENT_PER', label: 'Versement PER', category: 'EPARGNE', sortOrder: 41 },
    
    // Crédits
    { code: 'CREDIT_IMMOBILIER', label: 'Crédit immobilier', category: 'CREDITS', sortOrder: 50 },
    { code: 'CREDIT_CONSO', label: 'Crédit consommation', category: 'CREDITS', sortOrder: 51 },
    
    // Impôts
    { code: 'IMPOT_REVENU', label: 'Impôt sur le revenu', category: 'IMPOTS', sortOrder: 60 },
    { code: 'IFI', label: 'IFI', category: 'IMPOTS', sortOrder: 61 },
    
    // Vie courante
    { code: 'ALIMENTATION', label: 'Alimentation', category: 'VIE_COURANTE', sortOrder: 70 },
    { code: 'LOISIRS', label: 'Loisirs', category: 'VIE_COURANTE', sortOrder: 71 },
    
    { code: 'AUTRE', label: 'Autre charge', category: 'AUTRE', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE BIENS MOBILIERS
  // -----------------------------------------
  BIEN_MOBILIER_TYPE: [
    { code: 'VEHICULE', label: 'Véhicule', sortOrder: 1 },
    { code: 'BATEAU', label: 'Bateau', sortOrder: 2 },
    { code: 'BIJOUX_MONTRES', label: 'Bijoux / Montres', sortOrder: 3 },
    { code: 'OEUVRE_ART', label: 'Œuvre d\'art', sortOrder: 4 },
    { code: 'COLLECTION', label: 'Collection', sortOrder: 5 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES D'OBJECTIFS
  // -----------------------------------------
  OBJECTIF_TYPE: [
    { code: 'EPARGNE', label: 'Constitution d\'épargne', sortOrder: 1 },
    { code: 'RETRAITE', label: 'Préparation retraite', sortOrder: 2 },
    { code: 'IMMOBILIER', label: 'Projet immobilier', sortOrder: 3 },
    { code: 'TRANSMISSION', label: 'Transmission', sortOrder: 4 },
    { code: 'PROTECTION', label: 'Protection', sortOrder: 5 },
    { code: 'FISCALITE', label: 'Optimisation fiscale', sortOrder: 6 },
    { code: 'TRESORERIE', label: 'Trésorerie', sortOrder: 7 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE PROJETS
  // -----------------------------------------
  PROJET_TYPE: [
    { code: 'ACQUISITION_RP', label: 'Acquisition résidence principale', sortOrder: 1 },
    { code: 'ACQUISITION_LOCATIF', label: 'Investissement locatif', sortOrder: 2 },
    { code: 'TRAVAUX', label: 'Travaux', sortOrder: 3 },
    { code: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale', sortOrder: 4 },
    { code: 'PREPARATION_RETRAITE', label: 'Préparation retraite', sortOrder: 5 },
    { code: 'TRANSMISSION', label: 'Transmission', sortOrder: 6 },
    { code: 'CREATION_ENTREPRISE', label: 'Création d\'entreprise', sortOrder: 7 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES D'OPPORTUNITÉS
  // -----------------------------------------
  OPPORTUNITE_TYPE: [
    { code: 'NOUVEAU_CONTRAT', label: 'Nouveau contrat', sortOrder: 1 },
    { code: 'VERSEMENT', label: 'Versement', sortOrder: 2 },
    { code: 'ARBITRAGE', label: 'Arbitrage', sortOrder: 3 },
    { code: 'RACHAT', label: 'Rachat', sortOrder: 4 },
    { code: 'CREDIT', label: 'Crédit', sortOrder: 5 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE TÂCHES
  // -----------------------------------------
  TACHE_TYPE: [
    { code: 'APPEL', label: 'Appel téléphonique', sortOrder: 1 },
    { code: 'EMAIL', label: 'Email', sortOrder: 2 },
    { code: 'REUNION', label: 'Réunion', sortOrder: 3 },
    { code: 'DOCUMENT', label: 'Document à traiter', sortOrder: 4 },
    { code: 'SUIVI', label: 'Suivi', sortOrder: 5 },
    { code: 'RELANCE', label: 'Relance', sortOrder: 6 },
    { code: 'ADMINISTRATIF', label: 'Administratif', sortOrder: 7 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE RDV
  // -----------------------------------------
  RDV_TYPE: [
    { code: 'DECOUVERTE', label: 'Découverte', sortOrder: 1 },
    { code: 'SUIVI', label: 'Suivi', sortOrder: 2 },
    { code: 'BILAN', label: 'Bilan annuel', sortOrder: 3 },
    { code: 'SIGNATURE', label: 'Signature', sortOrder: 4 },
    { code: 'TELEPHONE', label: 'Appel téléphonique', sortOrder: 5 },
    { code: 'VISIO', label: 'Visioconférence', sortOrder: 6 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE SIMULATIONS
  // -----------------------------------------
  SIMULATION_TYPE: [
    { code: 'CAPACITE_EMPRUNT', label: 'Capacité d\'emprunt', sortOrder: 1 },
    { code: 'IMPOT_REVENU', label: 'Impôt sur le revenu', sortOrder: 2 },
    { code: 'IFI', label: 'IFI', sortOrder: 3 },
    { code: 'SUCCESSION', label: 'Succession', sortOrder: 4 },
    { code: 'DONATION', label: 'Donation', sortOrder: 5 },
    { code: 'RETRAITE', label: 'Retraite', sortOrder: 6 },
    { code: 'EPARGNE', label: 'Épargne', sortOrder: 7 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE DOSSIERS
  // -----------------------------------------
  DOSSIER_TYPE: [
    { code: 'SOUSCRIPTION', label: 'Souscription', sortOrder: 1 },
    { code: 'SINISTRE', label: 'Sinistre', sortOrder: 2 },
    { code: 'RACHAT', label: 'Rachat', sortOrder: 3 },
    { code: 'ARBITRAGE', label: 'Arbitrage', sortOrder: 4 },
    { code: 'SUCCESSION', label: 'Succession', sortOrder: 5 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES KYC DOCUMENTS
  // -----------------------------------------
  KYC_DOC_TYPE: [
    { code: 'IDENTITE', label: 'Pièce d\'identité', sortOrder: 1 },
    { code: 'DOMICILE', label: 'Justificatif de domicile', sortOrder: 2 },
    { code: 'REVENUS', label: 'Justificatif de revenus', sortOrder: 3 },
    { code: 'PATRIMOINE', label: 'Justificatif de patrimoine', sortOrder: 4 },
    { code: 'ORIGINE_FONDS', label: 'Origine des fonds', sortOrder: 5 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES KYC CHECKS
  // -----------------------------------------
  KYC_CHECK_TYPE: [
    { code: 'IDENTITE', label: 'Vérification identité', sortOrder: 1 },
    { code: 'SANCTIONS', label: 'Criblage sanctions', sortOrder: 2 },
    { code: 'PEP', label: 'Personne exposée politiquement', sortOrder: 3 },
    { code: 'ORIGINE_FONDS', label: 'Origine des fonds', sortOrder: 4 },
    { code: 'ADEQUATION', label: 'Test d\'adéquation', sortOrder: 5 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],

  // -----------------------------------------
  // TYPES DE RÉCLAMATIONS
  // -----------------------------------------
  RECLAMATION_TYPE: [
    { code: 'COMMERCIAL', label: 'Commercial', sortOrder: 1 },
    { code: 'TECHNIQUE', label: 'Technique', sortOrder: 2 },
    { code: 'ADMINISTRATIF', label: 'Administratif', sortOrder: 3 },
    { code: 'JURIDIQUE', label: 'Juridique', sortOrder: 4 },
    { code: 'AUTRE', label: 'Autre', sortOrder: 99 },
  ],
}

// ===========================================
// SEED FUNCTION
// ===========================================

export async function seedReferenceData() {
  console.log('🌱 Seeding reference data...')

  for (const [domain, items] of Object.entries(REFERENCE_DATA)) {
    console.log(`  📦 ${domain}: ${items.length} items`)

    for (const item of items) {
      await prisma.referenceData.upsert({
        where: {
          domain_code: {
            domain,
            code: item.code,
          },
        },
        update: {
          label: item.label,
          category: (item as { category?: string }).category,
          sortOrder: item.sortOrder,
        },
        create: {
          domain,
          code: item.code,
          label: item.label,
          category: (item as { category?: string }).category,
          sortOrder: item.sortOrder,
          isSystem: true,
        },
      })
    }
  }

  console.log('✅ Reference data seeded successfully')
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  try {
    await seedReferenceData()
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
