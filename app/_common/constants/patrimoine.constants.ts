/**
 * Constantes Patrimoine Professionnel
 * Catégories détaillées pour CGP, Notaires, Courtiers
 */

import {
  Home, Building2, Warehouse, Map, ParkingCircle, Hotel, Factory, Castle,
  PiggyBank, Wallet, CreditCard, TrendingUp, Coins, Bitcoin, LineChart,
  Briefcase, GraduationCap, Car, Heart, Gift, Target, Shield, Calculator,
  Receipt, ShoppingCart, Fuel, Bus, Wifi, Zap, Droplets,
  Baby, Users, Stethoscope, Dumbbell, Tv, Wrench, Percent, HandCoins, Building, CircleDollarSign, Scale, Lock, Clock, AlertTriangle, Info
} from 'lucide-react'

// =============================================================================
// IMMOBILIER
// =============================================================================

export const TYPES_BIENS_IMMOBILIERS = [
  // Résidentiel
  { value: 'RESIDENCE_PRINCIPALE', label: 'Résidence principale', icon: Home, category: 'RESIDENTIEL', color: 'blue' },
  { value: 'RESIDENCE_SECONDAIRE', label: 'Résidence secondaire', icon: Hotel, category: 'RESIDENTIEL', color: 'cyan' },
  
  // Locatif
  { value: 'LOCATIF_NU', label: 'Locatif nu (revenus fonciers)', icon: Building2, category: 'LOCATIF', color: 'green' },
  { value: 'LOCATIF_MEUBLE', label: 'Locatif meublé', icon: Building2, category: 'LOCATIF', color: 'green' },
  { value: 'LMNP', label: 'LMNP (Loueur Meublé Non Pro)', icon: Building2, category: 'LOCATIF', color: 'emerald' },
  { value: 'LMP', label: 'LMP (Loueur Meublé Pro)', icon: Building2, category: 'LOCATIF', color: 'emerald' },
  { value: 'LOCATION_SAISONNIERE', label: 'Location saisonnière', icon: Hotel, category: 'LOCATIF', color: 'amber' },
  
  // Pierre-papier
  { value: 'SCPI', label: 'SCPI', icon: LineChart, category: 'PIERRE_PAPIER', color: 'purple' },
  { value: 'OPCI', label: 'OPCI', icon: LineChart, category: 'PIERRE_PAPIER', color: 'purple' },
  { value: 'SCI', label: 'Parts de SCI', icon: Building, category: 'PIERRE_PAPIER', color: 'violet' },
  { value: 'CROWDFUNDING_IMMO', label: 'Crowdfunding immobilier', icon: Users, category: 'PIERRE_PAPIER', color: 'pink' },
  
  // Spécifique
  { value: 'VIAGER', label: 'Viager (occupé/libre)', icon: Clock, category: 'SPECIFIQUE', color: 'slate' },
  { value: 'NUE_PROPRIETE', label: 'Nue-propriété', icon: Lock, category: 'SPECIFIQUE', color: 'slate' },
  { value: 'USUFRUIT', label: 'Usufruit', icon: Clock, category: 'SPECIFIQUE', color: 'slate' },
  
  // Commercial / Pro
  { value: 'LOCAL_COMMERCIAL', label: 'Local commercial', icon: Warehouse, category: 'PROFESSIONNEL', color: 'orange' },
  { value: 'LOCAL_PROFESSIONNEL', label: 'Local professionnel', icon: Briefcase, category: 'PROFESSIONNEL', color: 'orange' },
  { value: 'IMMEUBLE_RAPPORT', label: 'Immeuble de rapport', icon: Building2, category: 'PROFESSIONNEL', color: 'red' },
  { value: 'ENTREPOT', label: 'Entrepôt / Logistique', icon: Warehouse, category: 'PROFESSIONNEL', color: 'gray' },
  
  // Autres
  { value: 'PARKING_GARAGE', label: 'Parking / Garage / Box', icon: ParkingCircle, category: 'AUTRE', color: 'gray' },
  { value: 'TERRAIN', label: 'Terrain (constructible ou non)', icon: Map, category: 'AUTRE', color: 'amber' },
  { value: 'FORET_AGRICOLE', label: 'Forêt / Terrain agricole', icon: Map, category: 'AUTRE', color: 'green' },
  
  // Défiscalisation
  { value: 'PINEL', label: 'Pinel / Pinel+', icon: Calculator, category: 'DEFISCALISATION', color: 'indigo' },
  { value: 'DENORMANDIE', label: 'Denormandie', icon: Calculator, category: 'DEFISCALISATION', color: 'indigo' },
  { value: 'MALRAUX', label: 'Malraux', icon: Castle, category: 'DEFISCALISATION', color: 'rose' },
  { value: 'MONUMENT_HISTORIQUE', label: 'Monument Historique', icon: Castle, category: 'DEFISCALISATION', color: 'rose' },
  { value: 'DEFICIT_FONCIER', label: 'Déficit foncier', icon: Calculator, category: 'DEFISCALISATION', color: 'indigo' },
] as const

export const SOUS_TYPES_IMMOBILIER = {
  APPARTEMENT: [
    { value: 'STUDIO', label: 'Studio' },
    { value: 'T1', label: 'T1 / F1' },
    { value: 'T2', label: 'T2 / F2' },
    { value: 'T3', label: 'T3 / F3' },
    { value: 'T4', label: 'T4 / F4' },
    { value: 'T5_PLUS', label: 'T5 et plus' },
    { value: 'DUPLEX', label: 'Duplex' },
    { value: 'TRIPLEX', label: 'Triplex' },
    { value: 'LOFT', label: 'Loft' },
    { value: 'PENTHOUSE', label: 'Penthouse' },
  ],
  MAISON: [
    { value: 'MAISON_INDIVIDUELLE', label: 'Maison individuelle' },
    { value: 'MAISON_MITOYENNE', label: 'Maison mitoyenne' },
    { value: 'MAISON_VILLE', label: 'Maison de ville' },
    { value: 'VILLA', label: 'Villa' },
    { value: 'MAISON_CAMPAGNE', label: 'Maison de campagne' },
    { value: 'FERMETTE', label: 'Fermette' },
    { value: 'MANOIR', label: 'Manoir / Château' },
    { value: 'PROPRIETE', label: 'Propriété' },
  ],
  TERRAIN: [
    { value: 'CONSTRUCTIBLE', label: 'Terrain constructible' },
    { value: 'NON_CONSTRUCTIBLE', label: 'Terrain non constructible' },
    { value: 'AGRICOLE', label: 'Terrain agricole' },
    { value: 'FORESTIER', label: 'Terrain forestier' },
    { value: 'VITICOLE', label: 'Terrain viticole' },
    { value: 'LOISIR', label: 'Terrain de loisir' },
  ],
} as const

export const MODES_DETENTION = [
  { value: 'PLEINE_PROPRIETE', label: 'Pleine propriété', description: 'Propriétaire de l\'usufruit et de la nue-propriété' },
  { value: 'NUE_PROPRIETE', label: 'Nue-propriété', description: 'Propriété sans l\'usufruit' },
  { value: 'USUFRUIT', label: 'Usufruit', description: 'Droit d\'usage et de jouissance' },
  { value: 'USUFRUIT_TEMPORAIRE', label: 'Usufruit temporaire', description: 'Usufruit pour une durée déterminée' },
  { value: 'INDIVISION', label: 'Indivision', description: 'Propriété partagée avec quotités' },
  { value: 'COMMUNAUTE', label: 'Communauté', description: 'Bien commun du couple' },
  { value: 'SCI_IR', label: 'SCI à l\'IR', description: 'Via une SCI transparente fiscalement' },
  { value: 'SCI_IS', label: 'SCI à l\'IS', description: 'Via une SCI à l\'impôt sur les sociétés' },
  { value: 'SARL_FAMILLE', label: 'SARL de famille', description: 'Via une SARL familiale à l\'IR' },
  { value: 'DEMEMBREMENT_CROISE', label: 'Démembrement croisé', description: 'Usufruits croisés entre époux' },
] as const

export const REGIMES_FISCAUX_IMMOBILIER = [
  { value: 'MICRO_FONCIER', label: 'Micro-foncier', seuil: 15000, abattement: 30, description: 'Abattement forfaitaire de 30%' },
  { value: 'REEL_FONCIER', label: 'Réel foncier', seuil: null, abattement: null, description: 'Déduction des charges réelles' },
  { value: 'MICRO_BIC', label: 'Micro-BIC meublé', seuil: 77700, abattement: 50, description: 'Abattement de 50% (ou 71% tourisme)' },
  { value: 'REEL_BIC', label: 'Réel BIC', seuil: null, abattement: null, description: 'Déduction charges + amortissements' },
  { value: 'IS', label: 'Impôt sur les sociétés', seuil: null, abattement: null, description: 'Taxation à l\'IS via SCI/SARL' },
] as const

export const DISPOSITIFS_FISCAUX = [
  { 
    value: 'PINEL', 
    label: 'Pinel', 
    reduction: [12, 18, 21],
    durees: [6, 9, 12],
    plafondInvestissement: 300000,
    plafondM2: 5500,
    actif: true,
    finProgramme: '2024-12-31'
  },
  { 
    value: 'PINEL_PLUS', 
    label: 'Pinel+', 
    reduction: [12, 18, 21],
    durees: [6, 9, 12],
    plafondInvestissement: 300000,
    plafondM2: 5500,
    actif: true,
    finProgramme: '2024-12-31'
  },
  { 
    value: 'DENORMANDIE', 
    label: 'Denormandie', 
    reduction: [12, 18, 21],
    durees: [6, 9, 12],
    plafondInvestissement: 300000,
    actif: true,
  },
  { 
    value: 'MALRAUX', 
    label: 'Malraux', 
    reduction: [22, 30],
    plafondTravaux: 400000,
    actif: true,
  },
  { 
    value: 'MONUMENTS_HISTORIQUES', 
    label: 'Monuments Historiques', 
    deductionSansPlafond: true,
    actif: true,
  },
  { 
    value: 'DEFICIT_FONCIER', 
    label: 'Déficit foncier', 
    plafondImputation: 10700,
    reportDeficit: 10,
    actif: true,
  },
] as const

// =============================================================================
// ACTIFS FINANCIERS
// =============================================================================

export const TYPES_ACTIFS_FINANCIERS = [
  // Épargne réglementée
  { value: 'LIVRET_A', label: 'Livret A', plafond: 22950, taux: 3.0, category: 'EPARGNE_REGLEMENTEE', icon: PiggyBank, color: 'blue', fiscalite: 'EXONERE' },
  { value: 'LDDS', label: 'LDDS', plafond: 12000, taux: 3.0, category: 'EPARGNE_REGLEMENTEE', icon: PiggyBank, color: 'blue', fiscalite: 'EXONERE' },
  { value: 'LEP', label: 'LEP', plafond: 10000, taux: 5.0, category: 'EPARGNE_REGLEMENTEE', icon: PiggyBank, color: 'emerald', fiscalite: 'EXONERE', conditions: 'Sous conditions de revenus' },
  { value: 'LIVRET_JEUNE', label: 'Livret Jeune', plafond: 1600, taux: 3.0, category: 'EPARGNE_REGLEMENTEE', icon: PiggyBank, color: 'cyan', fiscalite: 'EXONERE', conditions: '12-25 ans' },
  { value: 'CEL', label: 'CEL', plafond: 15300, taux: 2.0, category: 'EPARGNE_LOGEMENT', icon: Home, color: 'amber', fiscalite: 'PFU' },
  { value: 'PEL', label: 'PEL', plafond: 61200, taux: 2.0, category: 'EPARGNE_LOGEMENT', icon: Home, color: 'amber', fiscalite: 'PFU_APRES_12_ANS' },
  
  // Assurance-vie
  { value: 'ASSURANCE_VIE_FONDS_EUROS', label: 'Assurance-vie Fonds Euros', plafond: null, category: 'ASSURANCE_VIE', icon: Shield, color: 'purple', fiscalite: 'SPECIFIQUE_AV' },
  { value: 'ASSURANCE_VIE_UC', label: 'Assurance-vie UC', plafond: null, category: 'ASSURANCE_VIE', icon: TrendingUp, color: 'purple', fiscalite: 'SPECIFIQUE_AV' },
  { value: 'ASSURANCE_VIE_EURO_CROISSANCE', label: 'Euro-croissance', plafond: null, category: 'ASSURANCE_VIE', icon: TrendingUp, color: 'violet', fiscalite: 'SPECIFIQUE_AV' },
  { value: 'CONTRAT_CAPITALISATION', label: 'Contrat de capitalisation', plafond: null, category: 'ASSURANCE_VIE', icon: Shield, color: 'violet', fiscalite: 'SPECIFIQUE_AV' },
  { value: 'CONTRAT_LUXEMBOURGEOIS', label: 'Contrat luxembourgeois', plafond: null, category: 'ASSURANCE_VIE', icon: Shield, color: 'indigo', fiscalite: 'SPECIFIQUE_AV', conditions: 'Triangle de sécurité' },
  
  // Épargne retraite
  { value: 'PER_INDIVIDUEL', label: 'PER Individuel', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'rose', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE' },
  { value: 'PER_ENTREPRISE', label: 'PER Entreprise (PERECO)', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'rose', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE' },
  { value: 'PER_OBLIGATOIRE', label: 'PER Obligatoire (PERO)', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'rose', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE' },
  { value: 'PERP', label: 'PERP (fermé)', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'pink', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE', actif: false },
  { value: 'MADELIN', label: 'Madelin (fermé)', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'pink', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE', actif: false, conditions: 'TNS uniquement' },
  { value: 'PREFON', label: 'PRÉFON', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'pink', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE', conditions: 'Fonctionnaires' },
  { value: 'ARTICLE_83', label: 'Article 83', plafond: null, category: 'EPARGNE_RETRAITE', icon: Target, color: 'pink', fiscalite: 'DEDUCTIBLE_PUIS_IMPOSE' },
  
  // Actions / Bourse
  { value: 'PEA', label: 'PEA', plafond: 150000, category: 'VALEURS_MOBILIERES', icon: LineChart, color: 'green', fiscalite: 'EXONERE_APRES_5_ANS' },
  { value: 'PEA_PME', label: 'PEA-PME', plafond: 225000, category: 'VALEURS_MOBILIERES', icon: LineChart, color: 'green', fiscalite: 'EXONERE_APRES_5_ANS' },
  { value: 'PEA_JEUNE', label: 'PEA Jeune', plafond: 20000, category: 'VALEURS_MOBILIERES', icon: LineChart, color: 'cyan', fiscalite: 'EXONERE_APRES_5_ANS', conditions: '18-25 ans rattaché' },
  { value: 'COMPTE_TITRES', label: 'Compte-titres ordinaire', plafond: null, category: 'VALEURS_MOBILIERES', icon: TrendingUp, color: 'emerald', fiscalite: 'PFU' },
  
  // Private Equity / Alternatif
  { value: 'FIP', label: 'FIP', plafond: null, category: 'PRIVATE_EQUITY', icon: Briefcase, color: 'orange', fiscalite: 'REDUCTION_IR', reduction: 18 },
  { value: 'FCPI', label: 'FCPI', plafond: null, category: 'PRIVATE_EQUITY', icon: Briefcase, color: 'orange', fiscalite: 'REDUCTION_IR', reduction: 18 },
  { value: 'FCPR', label: 'FCPR', plafond: null, category: 'PRIVATE_EQUITY', icon: Briefcase, color: 'red', fiscalite: 'SPECIFIQUE' },
  { value: 'SOFICA', label: 'SOFICA', plafond: 18000, category: 'PRIVATE_EQUITY', icon: Tv, color: 'pink', fiscalite: 'REDUCTION_IR', reduction: 30 },
  { value: 'GIRARDIN', label: 'Girardin Industriel', plafond: null, category: 'DEFISCALISATION', icon: Factory, color: 'amber', fiscalite: 'REDUCTION_IR' },
  
  // Autres
  { value: 'COMPTE_COURANT', label: 'Compte courant', plafond: null, category: 'LIQUIDITES', icon: Wallet, color: 'slate', fiscalite: 'NON_APPLICABLE' },
  { value: 'COMPTE_TERME', label: 'Compte à terme', plafond: null, category: 'LIQUIDITES', icon: Clock, color: 'slate', fiscalite: 'PFU' },
  { value: 'CRYPTO_ACTIFS', label: 'Crypto-actifs', plafond: null, category: 'ALTERNATIF', icon: Bitcoin, color: 'orange', fiscalite: 'FLAT_TAX_30' },
  { value: 'OR_PHYSIQUE', label: 'Or physique', plafond: null, category: 'ALTERNATIF', icon: Coins, color: 'yellow', fiscalite: 'SPECIFIQUE_OR' },
  { value: 'PARTS_SOCIALES', label: 'Parts sociales / Actions non cotées', plafond: null, category: 'ENTREPRISE', icon: Building, color: 'gray', fiscalite: 'PFU_OU_BAREME' },
  { value: 'CROWDFUNDING', label: 'Crowdfunding / Financement participatif', plafond: null, category: 'ALTERNATIF', icon: Users, color: 'pink', fiscalite: 'PFU' },
] as const

// =============================================================================
// REVENUS
// =============================================================================

export const CATEGORIES_REVENUS = [
  // Salaires et assimilés
  { 
    value: 'SALAIRES_TRAITEMENTS', 
    label: 'Salaires et traitements', 
    icon: Briefcase, 
    category: 'ACTIVITE',
    color: 'blue',
    fiscalite: 'BAREME_IR',
    abattement: 10,
    plafondAbattement: 14171,
    plancher: 495,
  },
  { value: 'SALAIRES_PRIMES', label: 'Primes et bonus', icon: Gift, category: 'ACTIVITE', color: 'blue', fiscalite: 'BAREME_IR' },
  { value: 'SALAIRES_AVANTAGES_NATURE', label: 'Avantages en nature', icon: Car, category: 'ACTIVITE', color: 'blue', fiscalite: 'BAREME_IR' },
  { value: 'SALAIRES_HEURES_SUP', label: 'Heures supplémentaires', icon: Clock, category: 'ACTIVITE', color: 'cyan', fiscalite: 'EXONERE_PARTIEL', plafondExoneration: 7500 },
  { value: 'INDEMNITES_CHOMAGE', label: 'Allocations chômage', icon: AlertTriangle, category: 'ACTIVITE', color: 'amber', fiscalite: 'BAREME_IR' },
  { value: 'INDEMNITES_MALADIE', label: 'Indemnités journalières maladie', icon: Stethoscope, category: 'ACTIVITE', color: 'amber', fiscalite: 'BAREME_IR_OU_EXONERE' },
  
  // TNS / Libéral
  { value: 'BIC_PROFESSIONNEL', label: 'BIC Professionnel', icon: Warehouse, category: 'TNS', color: 'green', fiscalite: 'BAREME_IR' },
  { value: 'BIC_NON_PROFESSIONNEL', label: 'BIC Non Professionnel (LMNP...)', icon: Building2, category: 'TNS', color: 'emerald', fiscalite: 'BAREME_IR' },
  { value: 'BNC_PROFESSIONNEL', label: 'BNC Professionnel', icon: Briefcase, category: 'TNS', color: 'violet', fiscalite: 'BAREME_IR' },
  { value: 'BNC_NON_PROFESSIONNEL', label: 'BNC Non Professionnel', icon: Briefcase, category: 'TNS', color: 'purple', fiscalite: 'BAREME_IR' },
  { value: 'BA_AGRICOLE', label: 'Bénéfices Agricoles', icon: Map, category: 'TNS', color: 'lime', fiscalite: 'BAREME_IR' },
  
  // Dirigeant
  { value: 'REMUNERATION_DIRIGEANT', label: 'Rémunération de gérance (Art. 62)', icon: Building, category: 'DIRIGEANT', color: 'indigo', fiscalite: 'BAREME_IR' },
  { value: 'DIVIDENDES_DIRIGEANT', label: 'Dividendes perçus', icon: CircleDollarSign, category: 'DIRIGEANT', color: 'indigo', fiscalite: 'PFU_OU_BAREME', abattement40: true },
  { value: 'JETONS_PRESENCE', label: 'Jetons de présence', icon: Users, category: 'DIRIGEANT', color: 'slate', fiscalite: 'BAREME_IR' },
  
  // Revenus du patrimoine
  { 
    value: 'REVENUS_FONCIERS', 
    label: 'Revenus fonciers', 
    icon: Home, 
    category: 'PATRIMOINE',
    color: 'amber',
    fiscalite: 'BAREME_IR',
    regimes: ['MICRO_FONCIER', 'REEL'],
  },
  { value: 'REVENUS_MEUBLE_PRO', label: 'Revenus meublés professionnels (LMP)', icon: Hotel, category: 'PATRIMOINE', color: 'orange', fiscalite: 'BAREME_IR' },
  { value: 'REVENUS_MEUBLE_NON_PRO', label: 'Revenus meublés non pro (LMNP)', icon: Hotel, category: 'PATRIMOINE', color: 'amber', fiscalite: 'BAREME_IR' },
  { value: 'DIVIDENDES', label: 'Dividendes', icon: TrendingUp, category: 'PATRIMOINE', color: 'green', fiscalite: 'PFU_OU_BAREME', pfu: 30, abattement40: true },
  { value: 'INTERETS', label: 'Intérêts', icon: Percent, category: 'PATRIMOINE', color: 'blue', fiscalite: 'PFU', pfu: 30 },
  { value: 'PLUS_VALUES_MOBILIERES', label: 'Plus-values mobilières', icon: TrendingUp, category: 'PATRIMOINE', color: 'emerald', fiscalite: 'PFU_OU_BAREME', pfu: 30 },
  { value: 'PLUS_VALUES_IMMOBILIERES', label: 'Plus-values immobilières', icon: Home, category: 'PATRIMOINE', color: 'rose', fiscalite: 'FORFAITAIRE_19' },
  { value: 'PLUS_VALUES_CRYPTO', label: 'Plus-values crypto-actifs', icon: Bitcoin, category: 'PATRIMOINE', color: 'orange', fiscalite: 'FLAT_TAX_30' },
  { value: 'RENTES_VIAGERES_ONEREUX', label: 'Rentes viagères à titre onéreux', icon: Clock, category: 'PATRIMOINE', color: 'slate', fiscalite: 'BAREME_IR_PARTIEL' },
  
  // Pensions
  { value: 'PENSION_RETRAITE_BASE', label: 'Pension retraite de base', icon: Heart, category: 'PENSION', color: 'pink', fiscalite: 'BAREME_IR', abattement: 10 },
  { value: 'PENSION_RETRAITE_COMPLEMENTAIRE', label: 'Pension retraite complémentaire', icon: Heart, category: 'PENSION', color: 'pink', fiscalite: 'BAREME_IR', abattement: 10 },
  { value: 'PENSION_RETRAITE_SUPPLEMENTAIRE', label: 'Pension retraite supplémentaire', icon: Heart, category: 'PENSION', color: 'rose', fiscalite: 'BAREME_IR', abattement: 10 },
  { value: 'PENSION_INVALIDITE', label: 'Pension d\'invalidité', icon: Stethoscope, category: 'PENSION', color: 'amber', fiscalite: 'BAREME_IR_OU_EXONERE' },
  { value: 'PENSION_ALIMENTAIRE_RECUE', label: 'Pension alimentaire reçue', icon: HandCoins, category: 'PENSION', color: 'gray', fiscalite: 'BAREME_IR' },
  { value: 'PRESTATION_COMPENSATOIRE', label: 'Prestation compensatoire', icon: Scale, category: 'PENSION', color: 'gray', fiscalite: 'BAREME_IR_OU_EXONERE' },
  
  // Autres
  { value: 'ALLOCATIONS_FAMILIALES', label: 'Allocations familiales', icon: Baby, category: 'AUTRE', color: 'cyan', fiscalite: 'EXONERE' },
  { value: 'RSA', label: 'RSA', icon: HandCoins, category: 'AUTRE', color: 'slate', fiscalite: 'EXONERE' },
  { value: 'PRIME_ACTIVITE', label: 'Prime d\'activité', icon: HandCoins, category: 'AUTRE', color: 'slate', fiscalite: 'EXONERE' },
  { value: 'APL', label: 'APL / AL', icon: Home, category: 'AUTRE', color: 'slate', fiscalite: 'EXONERE' },
  { value: 'AUTRES_REVENUS', label: 'Autres revenus', icon: Receipt, category: 'AUTRE', color: 'gray', fiscalite: 'A_DETERMINER' },
] as const

// =============================================================================
// CHARGES
// =============================================================================

// Valeurs alignées sur les enums Prisma ExpenseCategory (migration 2024-12-10)
export const CATEGORIES_CHARGES = [
  // Logement
  { value: 'LOYER', label: 'Loyer', icon: Home, category: 'LOGEMENT', color: 'blue', deductible: false, essentiel: true },
  { value: 'CHARGES_COPROPRIETE', label: 'Charges de copropriété', icon: Building2, category: 'LOGEMENT', color: 'blue', deductible: false, essentiel: true },
  { value: 'TAXE_FONCIERE', label: 'Taxe foncière', icon: Receipt, category: 'LOGEMENT', color: 'amber', deductible: false, essentiel: true },
  { value: 'TAXE_HABITATION', label: 'Taxe d\'habitation (RS)', icon: Receipt, category: 'LOGEMENT', color: 'amber', deductible: false, essentiel: false },
  { value: 'ASSURANCE_HABITATION', label: 'Assurance habitation', icon: Shield, category: 'LOGEMENT', color: 'emerald', deductible: false, essentiel: true },
  { value: 'ELECTRICITE_GAZ', label: 'Électricité / Gaz', icon: Zap, category: 'LOGEMENT', color: 'yellow', deductible: false, essentiel: true },
  { value: 'EAU', label: 'Eau', icon: Droplets, category: 'LOGEMENT', color: 'cyan', deductible: false, essentiel: true },
  { value: 'INTERNET_TELEPHONE', label: 'Internet / Téléphone', icon: Wifi, category: 'LOGEMENT', color: 'purple', deductible: false, essentiel: false },
  { value: 'TRAVAUX_ENTRETIEN', label: 'Travaux / Entretien', icon: Wrench, category: 'LOGEMENT', color: 'gray', deductible: false, essentiel: false },
  { value: 'FRAIS_GESTION_LOCATIVE', label: 'Frais gestion locative', icon: Building2, category: 'LOGEMENT', color: 'slate', deductible: true, essentiel: false },
  
  // Transport
  { value: 'CREDIT_AUTO', label: 'Crédit auto / LOA', icon: Car, category: 'TRANSPORT', color: 'slate', deductible: false, essentiel: false },
  { value: 'ASSURANCE_AUTO', label: 'Assurance auto', icon: Shield, category: 'TRANSPORT', color: 'green', deductible: false, essentiel: true },
  { value: 'CARBURANT', label: 'Carburant', icon: Fuel, category: 'TRANSPORT', color: 'amber', deductible: false, essentiel: false },
  { value: 'ENTRETIEN_VEHICULE', label: 'Entretien véhicule', icon: Wrench, category: 'TRANSPORT', color: 'gray', deductible: false, essentiel: false },
  { value: 'PARKING', label: 'Parking / Stationnement', icon: ParkingCircle, category: 'TRANSPORT', color: 'slate', deductible: false, essentiel: false },
  { value: 'TRANSPORT_COMMUN', label: 'Transports en commun', icon: Bus, category: 'TRANSPORT', color: 'blue', deductible: false, essentiel: false },
  { value: 'PEAGES', label: 'Péages', icon: Receipt, category: 'TRANSPORT', color: 'slate', deductible: false, essentiel: false },
  
  // Santé
  { value: 'MUTUELLE', label: 'Mutuelle santé', icon: Stethoscope, category: 'SANTE', color: 'pink', deductible: 'PARTIEL', essentiel: true },
  { value: 'FRAIS_MEDICAUX', label: 'Frais médicaux non remboursés', icon: Stethoscope, category: 'SANTE', color: 'red', deductible: false, essentiel: true },
  { value: 'OPTIQUE_DENTAIRE', label: 'Optique / Dentaire', icon: Info, category: 'SANTE', color: 'cyan', deductible: false, essentiel: false },
  
  // Assurances
  { value: 'ASSURANCE_VIE_PRIMES', label: 'Primes assurance-vie', icon: Shield, category: 'ASSURANCE', color: 'emerald', deductible: false, essentiel: false },
  { value: 'PREVOYANCE', label: 'Prévoyance', icon: Shield, category: 'ASSURANCE', color: 'purple', deductible: 'TNS', essentiel: false },
  { value: 'ASSURANCE_EMPRUNTEUR', label: 'Assurance emprunteur', icon: Shield, category: 'ASSURANCE', color: 'blue', deductible: false, essentiel: true },
  { value: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', icon: Scale, category: 'ASSURANCE', color: 'indigo', deductible: false, essentiel: false },
  { value: 'GAV', label: 'GAV (Garantie Accidents Vie)', icon: Heart, category: 'ASSURANCE', color: 'rose', deductible: false, essentiel: false },
  
  // Enfants / Famille
  { value: 'GARDE_ENFANTS', label: 'Garde d\'enfants', icon: Baby, category: 'FAMILLE', color: 'pink', deductible: 'CREDIT_IMPOT_50', essentiel: true, plafondCredit: 2300 },
  { value: 'SCOLARITE', label: 'Frais de scolarité', icon: GraduationCap, category: 'FAMILLE', color: 'blue', deductible: 'REDUCTION_IR', essentiel: true },
  { value: 'ACTIVITES_ENFANTS', label: 'Activités extra-scolaires', icon: Dumbbell, category: 'FAMILLE', color: 'cyan', deductible: false, essentiel: false },
  { value: 'PENSION_ALIMENTAIRE_VERSEE', label: 'Pension alimentaire versée', icon: HandCoins, category: 'FAMILLE', color: 'gray', deductible: 'DEDUCTIBLE_IR', essentiel: true },
  { value: 'ETUDES_SUPERIEURES', label: 'Études supérieures', icon: GraduationCap, category: 'FAMILLE', color: 'indigo', deductible: false, essentiel: false },
  
  // Épargne et investissement
  { value: 'VERSEMENT_PER', label: 'Versement PER', icon: PiggyBank, category: 'EPARGNE', color: 'emerald', deductible: 'DEDUCTIBLE_IR', essentiel: false },
  { value: 'VERSEMENT_PERP', label: 'Versement PERP', icon: PiggyBank, category: 'EPARGNE', color: 'emerald', deductible: 'DEDUCTIBLE_IR', essentiel: false },
  { value: 'VERSEMENT_EPARGNE', label: 'Épargne régulière', icon: PiggyBank, category: 'EPARGNE', color: 'green', deductible: false, essentiel: false },
  { value: 'INVESTISSEMENT_FIP_FCPI', label: 'FIP / FCPI', icon: TrendingUp, category: 'EPARGNE', color: 'violet', deductible: 'REDUCTION_IR', essentiel: false },
  { value: 'INVESTISSEMENT_SOFICA', label: 'SOFICA', icon: TrendingUp, category: 'EPARGNE', color: 'violet', deductible: 'REDUCTION_IR', essentiel: false },
  
  // Crédits et emprunts
  { value: 'CREDIT_IMMOBILIER_RP', label: 'Crédit immobilier RP', icon: Home, category: 'CREDIT', color: 'blue', deductible: false, essentiel: true },
  { value: 'CREDIT_IMMOBILIER_LOCATIF', label: 'Crédit immobilier locatif', icon: Building2, category: 'CREDIT', color: 'blue', deductible: 'DEDUCTIBLE_RF', essentiel: true },
  { value: 'CREDIT_CONSOMMATION', label: 'Crédit consommation', icon: CreditCard, category: 'CREDIT', color: 'red', deductible: false, essentiel: true },
  { value: 'CREDIT_REVOLVING', label: 'Crédit renouvelable', icon: CreditCard, category: 'CREDIT', color: 'red', deductible: false, essentiel: true },
  
  // Charges professionnelles
  { value: 'COTISATIONS_SOCIALES', label: 'Cotisations sociales TNS', icon: Users, category: 'PROFESSIONNEL', color: 'slate', deductible: true, essentiel: true },
  { value: 'CFE', label: 'CFE', icon: Receipt, category: 'PROFESSIONNEL', color: 'amber', deductible: true, essentiel: true },
  { value: 'FRAIS_COMPTABILITE', label: 'Frais comptabilité', icon: Calculator, category: 'PROFESSIONNEL', color: 'gray', deductible: true, essentiel: false },
  { value: 'COTISATION_SYNDICALE', label: 'Cotisation syndicale', icon: Users, category: 'PROFESSIONNEL', color: 'blue', deductible: 'CREDIT_IMPOT_66', essentiel: false },
  { value: 'FORMATION_PROFESSIONNELLE', label: 'Formation professionnelle', icon: GraduationCap, category: 'PROFESSIONNEL', color: 'indigo', deductible: true, essentiel: false },
  
  // Impôts et taxes
  { value: 'IMPOT_REVENU', label: 'Impôt sur le revenu', icon: Receipt, category: 'IMPOTS', color: 'slate', deductible: false, essentiel: true },
  { value: 'IFI', label: 'IFI', icon: Receipt, category: 'IMPOTS', color: 'slate', deductible: false, essentiel: true },
  { value: 'PRELEVEMENTS_SOCIAUX', label: 'Prélèvements sociaux', icon: Receipt, category: 'IMPOTS', color: 'gray', deductible: false, essentiel: true },
  
  // Divers
  { value: 'DONS', label: 'Dons', icon: Heart, category: 'DIVERS', color: 'pink', deductible: 'REDUCTION_66', essentiel: false },
  { value: 'EMPLOI_DOMICILE', label: 'Emploi à domicile', icon: Users, category: 'DIVERS', color: 'emerald', deductible: 'CREDIT_IMPOT_50', essentiel: false, plafond: 12000 },
  { value: 'ABONNEMENTS_LOISIRS', label: 'Abonnements / Loisirs', icon: Tv, category: 'DIVERS', color: 'indigo', deductible: false, essentiel: false },
  { value: 'ALIMENTATION', label: 'Alimentation', icon: ShoppingCart, category: 'DIVERS', color: 'green', deductible: false, essentiel: true },
  { value: 'AUTRE_CHARGE', label: 'Autre charge', icon: Receipt, category: 'DIVERS', color: 'gray', deductible: false, essentiel: false },
] as const

// =============================================================================
// CREDITS
// =============================================================================

export const TYPES_CREDITS = [
  // Immobilier
  { value: 'CREDIT_IMMOBILIER_RP', label: 'Crédit immobilier - Résidence principale', category: 'IMMOBILIER', icon: Home, color: 'blue' },
  { value: 'CREDIT_IMMOBILIER_RS', label: 'Crédit immobilier - Résidence secondaire', category: 'IMMOBILIER', icon: Hotel, color: 'cyan' },
  { value: 'CREDIT_IMMOBILIER_LOCATIF', label: 'Crédit immobilier - Investissement locatif', category: 'IMMOBILIER', icon: Building2, color: 'green', interetsDeductibles: true },
  { value: 'CREDIT_IMMOBILIER_SCI', label: 'Crédit immobilier - SCI', category: 'IMMOBILIER', icon: Building, color: 'purple', interetsDeductibles: true },
  { value: 'PRET_RELAIS', label: 'Prêt relais', category: 'IMMOBILIER', icon: Clock, color: 'amber' },
  { value: 'PRET_IN_FINE', label: 'Prêt in fine', category: 'IMMOBILIER', icon: Target, color: 'indigo' },
  { value: 'PTZ', label: 'Prêt à taux zéro (PTZ)', category: 'IMMOBILIER', icon: Gift, color: 'emerald' },
  { value: 'PAS', label: 'Prêt d\'accession sociale (PAS)', category: 'IMMOBILIER', icon: HandCoins, color: 'teal' },
  { value: 'PRET_EMPLOYEUR', label: 'Prêt employeur (1%)', category: 'IMMOBILIER', icon: Briefcase, color: 'violet' },
  
  // Consommation
  { value: 'CREDIT_CONSOMMATION', label: 'Crédit consommation', category: 'CONSOMMATION', icon: ShoppingCart, color: 'orange' },
  { value: 'CREDIT_AUTO', label: 'Crédit auto', category: 'CONSOMMATION', icon: Car, color: 'slate' },
  { value: 'CREDIT_TRAVAUX', label: 'Crédit travaux', category: 'CONSOMMATION', icon: Wrench, color: 'amber' },
  { value: 'CREDIT_RENOUVELABLE', label: 'Crédit renouvelable', category: 'CONSOMMATION', icon: CreditCard, color: 'red' },
  { value: 'PRET_PERSONNEL', label: 'Prêt personnel', category: 'CONSOMMATION', icon: Wallet, color: 'gray' },
  { value: 'PRET_ETUDIANT', label: 'Prêt étudiant', category: 'CONSOMMATION', icon: GraduationCap, color: 'blue' },
  
  // Location
  { value: 'LOA', label: 'LOA (Location avec Option d\'Achat)', category: 'LOCATION', icon: Car, color: 'cyan' },
  { value: 'LLD', label: 'LLD (Location Longue Durée)', category: 'LOCATION', icon: Car, color: 'slate' },
  { value: 'LEASING', label: 'Leasing professionnel', category: 'LOCATION', icon: Briefcase, color: 'purple' },
  
  // Professionnel
  { value: 'PRET_PROFESSIONNEL', label: 'Prêt professionnel', category: 'PROFESSIONNEL', icon: Briefcase, color: 'indigo' },
  { value: 'CREDIT_BAIL', label: 'Crédit-bail', category: 'PROFESSIONNEL', icon: Building, color: 'violet' },
  
  // Autres
  { value: 'AVANCE_ASSURANCE_VIE', label: 'Avance sur assurance-vie', category: 'AUTRE', icon: Shield, color: 'purple' },
  { value: 'PRET_FAMILIAL', label: 'Prêt familial', category: 'AUTRE', icon: Users, color: 'pink' },
  { value: 'DECOUVERT_AUTORISE', label: 'Découvert bancaire autorisé', category: 'AUTRE', icon: AlertTriangle, color: 'red' },
] as const

// =============================================================================
// BAREMES FISCAUX 2024
// =============================================================================

export const BAREME_IR_2024 = [
  { min: 0, max: 11294, taux: 0 },
  { min: 11294, max: 28797, taux: 11 },
  { min: 28797, max: 82341, taux: 30 },
  { min: 82341, max: 177106, taux: 41 },
  { min: 177106, max: Infinity, taux: 45 },
] as const

export const BAREME_IFI_2024 = [
  { min: 0, max: 800000, taux: 0 },
  { min: 800000, max: 1300000, taux: 0.5 },
  { min: 1300000, max: 2570000, taux: 0.7 },
  { min: 2570000, max: 5000000, taux: 1.0 },
  { min: 5000000, max: 10000000, taux: 1.25 },
  { min: 10000000, max: Infinity, taux: 1.5 },
] as const

export const PLAFONDS_DEDUCTIONS_2024 = {
  plafondGlobalNiches: 10000,
  plafondInvestissementOutreMer: 18000,
  plafondSOFICA: 18000,
  plafondDonsPM: 20, // % du RNI
  plafondDonsParticuliers: 1000, // € pour 75%
  plafondEmploiDomicile: 12000,
  plafondFraisGarde: 2300,
  plafondPER: (rnai: number) => Math.max(4399, Math.min(rnai * 0.1, 35194)),
  plafondCSGDeductible: 6.8, // % des revenus du patrimoine
} as const

export const ABATTEMENTS_DEMEMBREMENT = [
  { ageUsufruitier: 21, usufruit: 90, nuePropriete: 10 },
  { ageUsufruitier: 31, usufruit: 80, nuePropriete: 20 },
  { ageUsufruitier: 41, usufruit: 70, nuePropriete: 30 },
  { ageUsufruitier: 51, usufruit: 60, nuePropriete: 40 },
  { ageUsufruitier: 61, usufruit: 50, nuePropriete: 50 },
  { ageUsufruitier: 71, usufruit: 40, nuePropriete: 60 },
  { ageUsufruitier: 81, usufruit: 30, nuePropriete: 70 },
  { ageUsufruitier: 91, usufruit: 20, nuePropriete: 80 },
  { ageUsufruitier: Infinity, usufruit: 10, nuePropriete: 90 },
] as const

export const ABATTEMENTS_SUCCESSION = {
  conjoint: Infinity, // Exonéré
  partenairePacs: Infinity, // Exonéré
  enfant: 100000,
  petitEnfant: 1594,
  arriereePetitEnfant: 1594,
  parent: 100000,
  frereSoeur: 15932, // + exonération possible
  neveuNiece: 7967,
  autreParent: 1594,
  tiers: 1594,
  handicape: 159325, // Abattement supplémentaire
} as const
