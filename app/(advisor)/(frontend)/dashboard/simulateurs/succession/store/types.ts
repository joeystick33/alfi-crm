// Types et enums alignés sur le backend Java

export type StatutMatrimonial = 'MARIE' | 'PACSE' | 'CELIBATAIRE' | 'CONCUBIN';

export type OptionDonationDernierVivant =
  | 'TOTALITE_EN_USUFRUIT'
  | 'PP_QUOTITE_DISPONIBLE'
  | 'QUART_PP'
  | 'QUART_PP_ET_TROIS_QUARTS_USUFRUIT';

export type PatrimoineAssetType =
  | 'RESIDENCE_PRINCIPALE'
  | 'TITRES_SOCIETE'
  | 'BIENS_RURAUX_GFA'
  | 'BOIS_FORETS'
  | 'MONUMENT_HISTORIQUE'
  | 'OEUVRE_ART'
  | 'BIENS_AGRICOLES'
  | 'AUTRE';

export type LienHeir =
  | 'ENFANT'
  | 'PETIT_ENFANT'
  | 'ARRIERE_PETIT_ENFANT'
  | 'CONJOINT'
  | 'PARTENAIRE_PACS'
  | 'CONCUBIN'
  | 'PERE'
  | 'MERE'
  | 'FRERE'
  | 'SOEUR'
  | 'NEVEU'
  | 'NIECE'
  | 'TIERS';

export interface HeirFiscalConditionsDTO {
  handicap?: boolean;
  fratrieCelibVeufDivorceSep?: boolean;
  fratrieCohabitationContinue5Ans?: boolean;
  ageAuDeces?: number;
  fratrieInvalide?: boolean;
}

// Interface générique pour toute personne avec ID unique
export interface PersonneAvecId {
  id: string; // ID unique pour tous les calculs
  nom?: string;
  prenom: string;
  age?: number | null;
  lien?: LienHeir;
  fiscalConditions?: HeirFiscalConditionsDTO;
}

// Identité du défunt (de cujus)
export interface IdentiteDC {
  id?: string; // ID unique du défunt
  nom: string;
  prenom: string;
  sexe?: 'M' | 'F'; // Sexe pour calcul double décès
  age: number | null;
  revenusMensuels?: number | null; // Revenus mensuels nets pour calcul épargne précaution
}

// Conjoint / Partenaire (hérite de PersonneAvecId)
export interface ConjointPartenaire extends Omit<PersonneAvecId, 'lien'> {
  present: boolean;
  sexe?: 'M' | 'F'; // Sexe du conjoint pour double décès
  type: 'CONJOINT' | 'PARTENAIRE_PACS' | 'CONCUBIN' | null;
  regimeMatrimonial?: 'COMMUNAUTE_LEGALE' | 'SEPARATION_BIENS' | 'COMMUNAUTE_UNIVERSELLE' | 'PARTICIPATION_ACQUETS' | null; // Mariés uniquement
  regimePACS?: 'SEPARATION' | 'INDIVISION' | null; // PACS uniquement (Art. 515-5 CC)
  clauseAttributionIntegrale?: boolean; // seulement si COMMUNAUTE_UNIVERSELLE
  presenceDDV?: boolean; // seulement si marié
}

// Enfants et représentation
export interface EnfantRepresentation {
  prenom: string;
  age: number | null;
  lien: 'PETIT_FILS' | 'PETITE_FILLE';
}

export interface Enfant extends PersonneAvecId {
  dateNaissance?: string | null;
  communAvecConjoint?: boolean; // s'il y a partenaire/conjoint
  handicape?: boolean; // art. 779 II CGI — abattement supplémentaire de 159 325 €
  predecede?: boolean;
  representants?: EnfantRepresentation[];
}

// Parents et fratrie (défunt et éventuellement partenaire)
export interface ParentInfo extends Omit<PersonneAvecId, 'lien'> {
  vivant: boolean;
}

export interface FrereSoeurRepresentation extends PersonneAvecId {
  // Représentants = neveux/nièces
}

export interface FrereSoeurInfo extends PersonneAvecId {
  vivant: boolean;
  representants?: FrereSoeurRepresentation[]; // neveux/nièces
}

export interface HeritierNotarialDTO {
  nom: string;
  estConjoint: boolean;
  lien: LienHeir;
  fiscalConditions?: HeirFiscalConditionsDTO | null;
  souche?: string | null;
  representant?: boolean;
}

export interface LiberaliteNotarialDTO {
  type: string; // TypeLiberalite côté backend
  valeur: number;
  horsPart: boolean;
  beneficiaireNom: string;
  projet?: string | null;
  annee?: number | null; // deprecated
  dateActe?: string | null; // ISO yyyy-MM-dd
  valeurPartage?: number | null;
}

export interface ResidencePrincipaleDTO {
  valeur: number;
  occupationEligibleAuDeces: boolean;
}

export interface ResidencePrincipaleBeneficiaireDTO {
  nom: string;
  pourcentage: number; // 0..100
}

export interface PatrimoineConditionsDTO {
  // Placeholders pour cases spécifiques (Dutreil, GFA, etc.)
  dutreil?: boolean;
  dutreilPacte?: boolean;
  dutreilEngagement?: boolean;
  bailRuralLongTerme?: boolean;
  boisForetsPlanSimpleGestion?: boolean;
  monumentHistoriqueClasse?: boolean;
  // Audit détaillé (catégories & sous-types)
  categorie?:
    | 'FINANCE_LIQUIDITES'
    | 'FINANCE_EPARGNE'
    | 'FINANCE_LOGEMENT'
    | 'FINANCE_AUTRES'
    | 'IMMOBILIER'
    | 'MEUBLES_DIVERS'
    | 'PROFESSIONNEL'
    | 'AUTRE';
  sousType?: string; // ex: COMPTE_COURANT, LIVRET_A, CTO, PEA, PER, RESIDENCE_SECONDAIRE, LOCATIF, TERRAIN, VEHICULE, OEUVRE_ART, PARTS_SOCIALES, etc.
  // Immobiliers
  adresse?: string;
  surfaceHabitable?: number;
  anneeAcquisition?: number;
  etatBien?: 'EXCELLENT' | 'BON' | 'A_RENOVER' | null;
  presenceLocataire?: boolean;
  revenusLocatifsAnnuels?: number;
  chargesAnnuelles?: number;
  plusValueLatente?: number;
  // Crédit
  creditEnCours?: boolean;
  montantInitialPret?: number;
  montantRestantDu?: number;
  tauxInteret?: number; // %
  dureeRestanteMois?: number;
  mensualite?: number;
  organismePreteur?: string;
  // Professionnel
  denomination?: string; // fonds/part sociale
  pourcentageDetention?: number;
  // Divers génériques
  metadonnees?: Record<string, any>;
}

export type ProprietaireActif = 'MONSIEUR' | 'MADAME' | 'COMMUN' | 'INDIVISION';

export interface PatrimoineActifDTO {
  type: PatrimoineAssetType;
  valeur: number;
  conditions?: PatrimoineConditionsDTO | null;
  proprietaire?: ProprietaireActif; // Pour couples : distinction propres/communs/indivision
  quotiteProprietaire?: number; // Pour indivision personnalisée (défaut 50 si COMMUN ou INDIVISION)
}

// Assurance‑vie (frontend)
export interface ContratAV {
  montantVersementsAvant70?: number;
  montantVersementsApres70?: number;
  valeurContratActuelle?: number; // capital décès (valeur actuelle du contrat)
  clauseBeneficiaire?: 'STANDARD' | 'PERSONNALISE' | 'DEMEMBRE';
  souscripteur?: 'MONSIEUR' | 'MADAME'; // who subscribed the contract (maps to CLIENT/CONJOINT)
  beneficiaires?: { nom: string; lien?: string; part?: number; role?: 'USUFRUITIER' | 'NU_PROPRIETAIRE' }[];
  dateVersement?: string | null; // ISO
}

// Donations et legs (frontend)
export interface DonationFront {
  type: string;
  valeur: number;
  horsPart: boolean;
  beneficiaireNom: string;
  dateActe?: string | null;
  valeurPartage?: number | null;
  proprietaire?: 'CLIENT' | 'CONJOINT' | null; // who made the donation (for couple inversion)
}

export interface LegParticulierFront {
  beneficiaireNom: string;
  valeur: number;
  lien?: string; // relationship: enfant, conjoint, parent, frere_soeur, tiers
  proprietaire?: 'CLIENT' | 'CONJOINT' | null; // who wrote the leg (for couple inversion)
}

export interface NotarialRequestDTO {
  patrimoine: number;
  statut: StatutMatrimonial | null;
  conjointUsufruit: boolean;
  ageConjoint: number | null;
  donationDernierVivantOption: OptionDonationDernierVivant | null;
  heritiers: HeritierNotarialDTO[];
  liberalites: LiberaliteNotarialDTO[];
  dateDeces: string | null;
  residencePrincipale: ResidencePrincipaleDTO | null;
  residencePrincipaleRepartition: ResidencePrincipaleBeneficiaireDTO[] | null;
  actifsPatrimoniaux: PatrimoineActifDTO[];
}

export interface FiscalResultDTO {
  totalDroitsNets?: number;
  totalDroitsBruts?: number;
  totalBaseAvantAbattementsGeneraux?: number;
  totalBaseApresAbattements?: number;
  abattementResidencePrincipaleApplique?: boolean;
  abattementResidencePrincipaleTotal?: number;
}

export interface NotarialResultDTO {
  masseDeCalcul?: number;
  totalRapportables?: number;
  reserveGlobale?: number;
  quotiteDisponibleInitiale?: number;
  quotiteDisponibleRestante?: number;
  quotiteDisponibleConsommee?: number;
  actifNetApresLegs?: number;
  reliquatAbIntestat?: boolean;
  reductionEffectuee?: boolean;
  excedentReduit?: number;
  messages?: string[];
  notes?: string[]; // Alertes juridiques (enfants non communs, etc.)
  csv?: string;
  fiscal?: FiscalResultDTO;
}

export interface AvResultats {
  montantVersementsAvant70?: number;
  montantVersementsApres70?: number;
  droitsAV990I?: { droitsTotaux?: number };
  droitsAV757B?: { droitsTotaux?: number };
  nombreBeneficiaires?: number;
}
